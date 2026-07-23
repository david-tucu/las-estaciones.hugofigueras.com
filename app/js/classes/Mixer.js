/**
 * Mixer
 * Reproduce y sincroniza los stems del TRACK_CATALOG.
 * Pausar usa pause() real (conserva posición); stop resetea.
 * Soporta scrub de timeline (fade + seek + resume).
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
    this.progreso = 0;

    /** 'stopped' | 'playing' | 'paused' */
    this.playback = 'stopped';

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
   * Arranca o reanuda todas las pistas.
   */
  playAll() {
    this.game.audio.unlock();
    if (!this.isReady) {
      console.warn('[Mixer] Pistas aún cargando…');
      return;
    }

    if (this.playback === 'paused') {
      this._resumeAll();
      return;
    }

    if (this.playback === 'playing') {
      return;
    }

    this._startFresh();
  }

  /**
   * Pausa conservando posición (pause real de p5.sound).
   */
  pauseAll() {
    if (this.playback !== 'playing') {
      return;
    }
    // Congelar progreso visual antes de pausar (evita glitch al reanudar)
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
   * Detiene y vuelve a 0.
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
    this.progreso = 0;
    this.playback = 'stopped';
    console.info('[Mixer] Detenido');
  }

  togglePlayPause() {
    if (this.playback === 'playing') {
      this.pauseAll();
    } else {
      this.masterFade = 1;
      this._fadeProxy.v = 1;
      this.playAll();
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
   * Suaviza volúmenes hacia los faders y aplica masterFade.
   * @param {Fader[]} faders
   */
  updateFades(faders) {
    if (!faders || !faders.length) {
      this._applyAllVolumes();
      return;
    }
    for (const id of Object.keys(this.tracks)) {
      const fader = faders.find((f) => f.trackId === id);
      if (!fader) {
        continue;
      }
      // Durante fade de scrub no pelear el master; sí seguir el fader
      this.volsActuales[id] = lerp(
        this.volsActuales[id],
        fader.value,
        VOLUME_LERP
      );
    }
    this._applyAllVolumes();
  }

  /**
   * Progreso 0–1 según pista timebase (Sur).
   * Tras seek/resume no lee currentTime hasta que el audio se sincroniza
   * (evita un frame con la Tierra en la posición anterior / en 0).
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
   * Usar durante el drag de scrub; el seek real va al soltar.
   * @param {number} progress 0–1
   */
  setProgressOnly(progress) {
    this._lockProgress(constrain(progress, 0, 0.999));
    if (this.playback === 'stopped') {
      this.playback = 'paused';
    }
  }

  /**
   * Salta todas las pistas a un progreso normalizado (una sola vez, p. ej. al soltar scrub).
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
          // Dejar cue en this.progreso; stop para resume limpio con loop(cue)
          sound.stop();
        }
      } catch (err) {
        console.warn(`[Mixer] seek falló en ${id}:`, err);
      }
    }
    if (this.playback === 'playing') {
      // jump mantiene playing
    } else {
      this.playback = 'paused';
    }
  }

  /**
   * Pausa de inmediato y hace fade a silencio (inicio de scrub).
   * Pausar primero evita que el audio siga avanzando mientras se scubea.
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
   * Reanuda desde this.progreso con fade in.
   * @param {number} duration
   * @param {Fader[]} [faders]
   */
  fadeInAndResume(duration, faders) {
    this.game.tweens.killTweensOf(this._fadeProxy);
    this.masterFade = 0;
    this._fadeProxy.v = 0;

    // Asegurar vols base desde faders antes de oír
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
      `playback: ${this.playback}  t=${nf(this.progreso, 1, 3)}  fade=${nf(this.masterFade, 1, 2)}`,
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

  _startFresh() {
    this.masterFade = 1;
    this._fadeProxy.v = 1;
    this._lockProgress(0);
    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      try {
        if (sound.isPlaying() || sound.isPaused()) {
          sound.stop();
        }
        sound.loop(0, 1, 0, 0);
        this.volsActuales[id] = 0;
      } catch (err) {
        console.warn(`[Mixer] play falló en ${id}:`, err);
      }
    }
    this.playback = 'playing';
    console.info('[Mixer] Reproduciendo (fresh, sync en 0)');
  }

  _resumeAll() {
    const cue = this.progreso;
    this._lockProgress(cue);

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
        // Pausa normal: reanudar sin stop/loop (evita currentTime=0 un frame)
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
   * Fija el progreso visual y bloquea lecturas de currentTime un momento.
   * @param {number} progress
   */
  _lockProgress(progress) {
    this.progreso = constrain(progress, 0, 0.999);
    this._progressLocked = true;
    this._progressLockFrames = 10;
  }

  /**
   * Lee progreso desde la pista timebase, o null si no está disponible.
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

  /**
   * Sincroniza this.progreso desde audio (si está disponible).
   */
  _syncProgressFromAudio() {
    const audioT = this._readAudioProgress();
    if (audioT !== null) {
      this.progreso = audioT;
    }
  }
}
