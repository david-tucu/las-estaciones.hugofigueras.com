/**
 * Mixer
 * Reproduce y sincroniza los stems del TRACK_CATALOG.
 *
 * Fases:
 *   intro — arranca en INTRO_START (0.75), mutea norte/sur hasta el fin (→1→0)
 *   loop  — comportamiento normal; cue de norte en LOOP_NORTE_CUE (0.5)
 *
 * Pausar usa pause() real; stop cuea el inicio de la intro.
 * Scrub deja la fase en loop.
 */
class Mixer {
  /**
   * @param {Game} game
   */
  constructor(game) {
    this.game = game;

    /** @type {Record<string, p5.SoundFile>} */
    this.tracks = {};

    /** Volúmenes suavizados actuales por id (antes del masterFade). */
    this.volsActuales = {};

    /** Progreso normalizado cacheado (sigue disponible en pausa / scrub). */
    this.progreso = INTRO_START;

    /** 'stopped' | 'playing' | 'paused' */
    this.playback = 'stopped';

    /** 'intro' | 'loop' */
    this.phase = 'intro';

    /**
     * Tras Play: true hasta que el usuario mueve el fader.
     * Los cues automáticos no apagan el flag (pueden aplicarse en cadena).
     */
    this.nortePendiente = false;
    this.surPendiente = false;

    /** One-shots de cues de voz en la reproducción actual. */
    this._norteMidDone = false;
    this._norteLoopEndDone = false;

    /**
     * Multiplicador global 0–1 (fade scrub / UI).
     * Volumen real = volsActuales[id] * masterFade
     */
    this.masterFade = 1;

    /** Proxy animable por TweenManager. */
    this._fadeProxy = { v: 1 };

    /** true mientras el usuario scubea una partitura. */
    this.scrubbing = false;

    /**
     * Tras seek/resume, currentTime() puede devolver 0 un frame.
     * Mientras está locked, getProgress() usa this.progreso cacheado.
     */
    this._progressLocked = false;
    this._progressLockFrames = 0;

    /** Progreso del frame anterior (detectar wrap intro→loop). */
    this._prevProgreso = INTRO_START;

    /** @type {Fader[]|null} Ref a faders de Play (para bajar knobs en intro). */
    this._faders = null;

    this._bindTracks();
  }

  /**
   * Toma los SoundFile ya cargados por AssetManager.
   */
  _bindTracks() {
    if (typeof TRACK_CATALOG === 'undefined') {
      console.warn('[Mixer] TRACK_CATALOG no disponible');
      return;
    }
    let ok = 0;
    for (const item of TRACK_CATALOG) {
      const sound = this.game.assets.getTrackSound(item.id);
      if (!sound) {
        console.warn(`[Mixer] Pista sin audio: ${item.id}`);
        continue;
      }
      this.tracks[item.id] = sound;
      this.volsActuales[item.id] = 0;
      try {
        sound.playMode('restart');
      } catch (_err) {
        // ignore
      }
      ok += 1;
    }
    console.info(`[Mixer] Pistas listas: ${ok}/${TRACK_CATALOG.length}`);
  }

  /**
   * @returns {boolean}
   */
  get isReady() {
    const ids = Object.keys(this.tracks);
    if (!ids.length) {
      return false;
    }
    return ids.every((id) => {
      const s = this.tracks[id];
      return s && typeof s.isLoaded === 'function' && s.isLoaded();
    });
  }

  /**
   * @returns {boolean}
   */
  get isPlaying() {
    return this.playback === 'playing';
  }

  /**
   * @returns {boolean}
   */
  get isPaused() {
    return this.playback === 'paused';
  }

  /**
   * PLAY: desde stopped → intro en INTRO_START (pendientes true).
   * Si estaba pausado → solo reanuda. Si ya reproduce → no-op.
   */
  playPressed() {
    this.game.audio.unlock();
    if (!this.isReady) {
      console.warn('[Mixer] Pistas aún cargando…');
      return;
    }

    if (this.playback === 'paused') {
      this.masterFade = 1;
      this._fadeProxy.v = 1;
      this._resumeAll();
      return;
    }

    if (this.playback === 'playing') {
      return;
    }

    this.nortePendiente = true;
    this.surPendiente = true;
    this._norteMidDone = false;
    this._norteLoopEndDone = false;
    this.phase = 'intro';
    // Voces en silencio visual + audio hasta sus cues
    this._setVoiceFaders(0);
    this._startAtProgress(INTRO_START);
    console.info('[Mixer] Play → intro @', INTRO_START);
  }

  /**
   * PAUSA: si reproduce → pausa; si pausado → reanuda en el mismo punto.
   */
  pausePressed() {
    if (this.playback === 'playing') {
      this.pauseAll();
      return;
    }
    if (this.playback === 'paused') {
      this.masterFade = 1;
      this._fadeProxy.v = 1;
      this._resumeAll();
    }
  }

  /**
   * Usuario movió un fader: cancela el auto-default pendiente.
   * @param {string} trackId
   */
  onFaderUserChange(trackId) {
    if (trackId === 'norte') {
      this.nortePendiente = false;
    } else if (trackId === 'sur') {
      this.surPendiente = false;
    }
    // Si el usuario toma el control, cancelar fade automático
    if (this._faders) {
      const fader = this._faders.find((f) => f.trackId === trackId);
      if (fader) {
        this.game.tweens.killTweensOf(fader);
      }
    }
  }

  /**
   * Tras scrub: forzar fase loop (no intro).
   */
  markLoopAfterScrub() {
    this.phase = 'loop';
    this._prevProgreso = this.progreso;
  }

  /**
   * Pausa conservando posición (pause real de p5.sound).
   */
  pauseAll() {
    if (this.playback !== 'playing') {
      return;
    }
    this._syncProgressFromAudio();
    this._lockProgress(this.progreso);

    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      try {
        if (sound.isPlaying()) {
          sound.pause();
        }
      } catch (err) {
        console.warn(`[Mixer] pause falló en ${id}:`, err);
      }
    }
    this.playback = 'paused';
    console.info('[Mixer] Pausado @', nf(this.progreso, 1, 3));
  }

  /**
   * Detiene y cuea el inicio de la intro (INTRO_START).
   */
  stopAll() {
    this.game.tweens.killTweensOf(this._fadeProxy);
    this.scrubbing = false;
    this.masterFade = 1;
    this._fadeProxy.v = 1;
    this._progressLocked = false;
    this._progressLockFrames = 0;

    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      try {
        if (sound.isPlaying() || sound.isPaused()) {
          sound.stop();
        }
      } catch (err) {
        console.warn(`[Mixer] stop falló en ${id}:`, err);
      }
      this.volsActuales[id] = 0;
    }
    this.progreso = INTRO_START;
    this._prevProgreso = INTRO_START;
    this.phase = 'intro';
    this.playback = 'stopped';
    console.info('[Mixer] Stop → intro cue @', INTRO_START);
  }

  /** @deprecated Usar playPressed / pausePressed */
  togglePlayPause() {
    if (this.playback === 'playing') {
      this.pausePressed();
    } else {
      this.playPressed();
    }
  }

  /**
   * @param {string} id
   * @param {number} value 0–1
   */
  setVolumeImmediate(id, value) {
    const sound = this.tracks[id];
    if (!sound) {
      return;
    }
    const v = constrain(value, 0, 1);
    this.volsActuales[id] = v;
    this._applyVolume(id);
  }

  /**
   * Suaviza volúmenes hacia los faders y transiciones de fase
   * (intro→loop, cue norte). En intro, norte/sur van a 0 vía faders.
   * @param {Fader[]} faders
   */
  updateFades(faders) {
    if (faders && faders.length) {
      this._faders = faders;
    }
    if (!faders || !faders.length) {
      this._applyAllVolumes();
      return;
    }

    for (const id of Object.keys(this.tracks)) {
      const fader = faders.find((f) => f.trackId === id);
      if (!fader) {
        continue;
      }
      this.volsActuales[id] = lerp(
        this.volsActuales[id],
        fader.value,
        VOLUME_LERP
      );
    }
    this._applyAllVolumes();
    this._updatePhaseLogic(faders);
  }

  /**
   * Progreso 0–1 según pista timebase (Sur).
   * @returns {number}
   */
  getProgress() {
    if (this.scrubbing) {
      return this.progreso;
    }

    const audioT = this._readAudioProgress();

    if (this._progressLocked) {
      this._progressLockFrames -= 1;
      const glitch =
        audioT !== null && audioT < 0.05 && this.progreso > 0.08;
      const synced =
        audioT !== null && !glitch && Math.abs(audioT - this.progreso) < 0.045;

      if (synced || this._progressLockFrames <= 0) {
        this._progressLocked = false;
        if (audioT !== null && !glitch) {
          this.progreso = constrain(audioT, 0, 1);
        }
      }
      return this.progreso;
    }

    if (audioT !== null) {
      this.progreso = constrain(audioT, 0, 1);
    }
    return this.progreso;
  }

  /**
   * Solo actualiza el progreso lógico (sin tocar audio).
   * @param {number} progress 0–1
   */
  setProgressOnly(progress) {
    this._lockProgress(constrain(progress, 0, 0.999));
    if (this.playback === 'stopped') {
      this.playback = 'paused';
    }
  }

  /**
   * Salta todas las pistas a un progreso normalizado.
   * @param {number} progress 0–1
   */
  seekToProgress(progress) {
    this._lockProgress(constrain(progress, 0, 0.999));
    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      let dur = 0;
      try {
        dur = sound.duration();
      } catch (_err) {
        continue;
      }
      if (!(dur > 0)) {
        continue;
      }
      const time = constrain(this.progreso * dur, 0, Math.max(0, dur - 0.05));
      try {
        if (sound.isPlaying()) {
          sound.jump(time);
        } else if (sound.isPaused()) {
          sound.stop();
        }
      } catch (err) {
        console.warn(`[Mixer] seek falló en ${id}:`, err);
      }
    }
    if (this.playback !== 'playing') {
      this.playback = 'paused';
    }
  }

  /**
   * @param {number} duration
   * @param {function} [onComplete]
   */
  fadeOutAndPause(duration, onComplete) {
    if (this.playback === 'playing') {
      this.pauseAll();
    }
    this.game.tweens.killTweensOf(this._fadeProxy);
    this._fadeProxy.v = this.masterFade;
    this.game.tweens.animate(this._fadeProxy, { v: 0 }, duration, {
      easing: Easing.easeInOutQuad,
      onUpdate: () => {
        this.masterFade = this._fadeProxy.v;
        this._applyAllVolumes();
      },
      onComplete: () => {
        this.masterFade = 0;
        this._fadeProxy.v = 0;
        this._applyAllVolumes();
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  /**
   * @param {number} duration
   * @param {Fader[]} [faders]
   */
  fadeInAndResume(duration, faders) {
    this.game.tweens.killTweensOf(this._fadeProxy);
    this.masterFade = 0;
    this._fadeProxy.v = 0;

    if (faders) {
      for (const id of Object.keys(this.tracks)) {
        const fader = faders.find((f) => f.trackId === id);
        if (fader) {
          this.volsActuales[id] = fader.value;
        }
      }
    }
    this._applyAllVolumes();
    this._resumeAll();

    this.game.tweens.animate(this._fadeProxy, { v: 1 }, duration, {
      easing: Easing.easeInOutQuad,
      onUpdate: () => {
        this.masterFade = this._fadeProxy.v;
        this._applyAllVolumes();
      },
      onComplete: () => {
        this.masterFade = 1;
        this._fadeProxy.v = 1;
        this._applyAllVolumes();
      },
    });
  }

  /**
   * Barras de progreso por pista (debug).
   */
  drawDebug() {
    const ids = Object.keys(this.tracks);
    if (!ids.length) {
      return;
    }
    push();
    translate(16, LAYOUT.ORBIT_Y);
    fill(0, 255, 120);
    textAlign(LEFT, TOP);
    textSize(18);
    text(
      `pb:${this.playback} ph:${this.phase} t=${nf(this.progreso, 1, 3)} Npend=${this.nortePendiente} Spend=${this.surPendiente}`,
      0,
      0
    );
    translate(0, 28);
    ids.forEach((id, i) => {
      const sound = this.tracks[id];
      let p = 0;
      try {
        if (sound.duration() > 0 && (sound.isPlaying() || sound.isPaused())) {
          p = sound.currentTime() / sound.duration();
        } else {
          p = this.progreso;
        }
      } catch (_err) {
        // ignore
      }
      const y = i * 22;
      noStroke();
      fill(40, 180);
      rect(0, y, DESIGN_WIDTH - 32, 18);
      fill(0, 255, 100);
      rect(p * (DESIGN_WIDTH - 32), y, 10, 18);
      fill(255);
      textSize(14);
      textAlign(LEFT, CENTER);
      text(id, 6, y + 9);
    });
    pop();
  }

  // ---------------------------------------------------------------------------

  /**
   * Detecta wrap intro→loop, cue medio de voces y fin del primer loop.
   * Solo mueve faders si el pendiente correspondiente sigue true.
   * @param {Fader[]} faders
   */
  _updatePhaseLogic(faders) {
    if (this.scrubbing || this.playback === 'stopped') {
      this._prevProgreso = this.progreso;
      return;
    }

    const p = this.progreso;
    const prev = this._prevProgreso;
    const wrapped = prev > 0.85 && p < 0.2;

    // Intro termina al pasar el final (wrap 1→0)
    if (this.phase === 'intro' && this.playback === 'playing' && wrapped) {
      this._enterLoopFromIntro(faders);
      this._prevProgreso = p;
      return;
    }

    // Cue medio en loop (@ LOOP_NORTE_CUE)
    if (
      this.phase === 'loop' &&
      !this._norteMidDone &&
      p >= LOOP_NORTE_CUE
    ) {
      this._norteMidDone = true;
      if (this.nortePendiente) {
        this._fadeFaderTo(faders, 'norte', faderNorteMidLevel());
        console.info('[Mixer] Norte → mid @', LOOP_NORTE_CUE);
      }
      if (this.surPendiente) {
        this._fadeFaderTo(faders, 'sur', faderSurMidLevel());
        console.info('[Mixer] Sur → mid @', LOOP_NORTE_CUE);
      }
    }

    // Fin del primer loop: Norte baja/ajusta a (1+D)/2
    if (
      this.phase === 'loop' &&
      this.playback === 'playing' &&
      !this._norteLoopEndDone &&
      wrapped
    ) {
      this._norteLoopEndDone = true;
      if (this.nortePendiente) {
        this._fadeFaderTo(faders, 'norte', faderNorteLoopEndLevel());
        console.info('[Mixer] Norte → loop-end level');
      }
    }

    this._prevProgreso = p;
  }

  /**
   * @param {Fader[]} faders
   */
  _enterLoopFromIntro(faders) {
    this.phase = 'loop';
    if (this.surPendiente) {
      this._fadeFaderTo(faders, 'sur', faderSurIntroLevel());
      console.info('[Mixer] Intro→loop: Sur → intro level');
    } else {
      console.info('[Mixer] Intro→loop');
    }
  }

  /**
   * Fade suave del fader a un target (0–1). No toca el flag pendiente.
   * @param {Fader[]} faders
   * @param {string} trackId
   * @param {number} target
   */
  _fadeFaderTo(faders, trackId, target) {
    if (!faders) {
      return;
    }
    const fader = faders.find((f) => f.trackId === trackId);
    if (!fader) {
      return;
    }
    const v = constrain(target, 0, 1);
    this.game.tweens.killTweensOf(fader);
    this.game.tweens.animate(fader, { value: v }, FADER_AUTO_FADE_SEC, {
      easing: Easing.easeInOutQuad,
    });
  }

  /**
   * Baja (o setea) faders de voces norte/sur + volsActuales.
   * @param {number} value 0–1
   */
  _setVoiceFaders(value) {
    const v = constrain(value, 0, 1);
    const faders = this._faders;
    for (const id of ['norte', 'sur']) {
      this.volsActuales[id] = v;
      if (faders) {
        const fader = faders.find((f) => f.trackId === id);
        if (fader) {
          this.game.tweens.killTweensOf(fader);
          fader.value = v;
        }
      }
      this._applyVolume(id);
    }
  }

  _applyVolume(id) {
    const sound = this.tracks[id];
    if (!sound) {
      return;
    }
    try {
      sound.setVolume(this.volsActuales[id] * this.masterFade);
    } catch (_err) {
      // ignore
    }
  }

  _applyAllVolumes() {
    for (const id of Object.keys(this.tracks)) {
      this._applyVolume(id);
    }
  }

  /**
   * Arranca (o reinicia) todas las pistas en un progreso dado, en loop.
   * @param {number} progress 0–1
   */
  _startAtProgress(progress) {
    this.masterFade = 1;
    this._fadeProxy.v = 1;
    this._lockProgress(progress);
    this._prevProgreso = progress;

    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      let dur = 0;
      try {
        dur = sound.duration();
      } catch (_err) {
        dur = 0;
      }
      const startAt =
        dur > 0 ? constrain(progress * dur, 0, Math.max(0, dur - 0.05)) : 0;
      try {
        if (sound.isPlaying() || sound.isPaused()) {
          sound.stop();
        }
        sound.loop(0, 1, 0, startAt);
        this.volsActuales[id] = 0;
      } catch (err) {
        console.warn(`[Mixer] play falló en ${id}:`, err);
      }
    }
    this.playback = 'playing';
  }

  _resumeAll() {
    const cue = this.progreso;
    this._lockProgress(cue);
    this._prevProgreso = cue;

    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      let dur = 0;
      try {
        dur = sound.duration();
      } catch (_err) {
        continue;
      }
      const startAt =
        dur > 0 ? constrain(cue * dur, 0, Math.max(0, dur - 0.05)) : 0;
      const amp = this.volsActuales[id] * this.masterFade;
      try {
        if (typeof sound.setLoop === 'function') {
          sound.setLoop(true);
        }
        if (sound.isPaused()) {
          sound.play();
        } else {
          if (sound.isPlaying()) {
            sound.stop();
          }
          sound.loop(0, 1, amp, startAt);
        }
      } catch (err) {
        console.warn(`[Mixer] resume falló en ${id}:`, err);
      }
    }
    this.playback = 'playing';
    console.info('[Mixer] Reanudado @', nf(cue, 1, 3));
  }

  /**
   * @param {number} progress
   */
  _lockProgress(progress) {
    this.progreso = constrain(progress, 0, 0.999);
    this._progressLocked = true;
    this._progressLockFrames = 10;
  }

  /**
   * @returns {number|null}
   */
  _readAudioProgress() {
    const timebase =
      typeof getTimebaseTrack === 'function' ? getTimebaseTrack() : null;
    const id = timebase ? timebase.id : 'sur';
    const sound = this.tracks[id];
    if (!sound) {
      return null;
    }
    try {
      const dur = sound.duration();
      if (dur > 0 && (sound.isPlaying() || sound.isPaused())) {
        return constrain(sound.currentTime() / dur, 0, 1);
      }
    } catch (_err) {
      // ignore
    }
    return null;
  }

  _syncProgressFromAudio() {
    const audioT = this._readAudioProgress();
    if (audioT !== null) {
      this.progreso = audioT;
    }
  }
}
