/**
 * Mixer
 * Reproduce y sincroniza los stems del TRACK_CATALOG.
 * Pausar usa pause() real (conserva posición); stop resetea.
 */
class Mixer {
  /**
   * @param {Game} game
   */
  constructor(game) {
    this.game = game;

    /** @type {Record<string, p5.SoundFile>} */
    this.tracks = {};

    /** Volúmenes suavizados actuales por id. */
    this.volsActuales = {};

    /** Progreso normalizado cacheado (sigue disponible en pausa). */
    this.progreso = 0;

    /** 'stopped' | 'playing' | 'paused' */
    this.playback = 'stopped';

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
    try {
      sound.setVolume(v);
    } catch (_err) {
      // ignore
    }
  }

  /**
   * Suaviza volúmenes hacia los faders.
   * @param {Fader[]} faders
   */
  updateFades(faders) {
    if (!faders || !faders.length) {
      return;
    }
    for (const id of Object.keys(this.tracks)) {
      const fader = faders.find((f) => f.trackId === id);
      if (!fader) {
        continue;
      }
      const target = fader.value;
      this.volsActuales[id] = lerp(
        this.volsActuales[id],
        target,
        VOLUME_LERP
      );
      try {
        this.tracks[id].setVolume(this.volsActuales[id]);
      } catch (_err) {
        // ignore
      }
    }
  }

  /**
   * Progreso 0–1 según pista timebase (Sur).
   * @returns {number}
   */
  getProgress() {
    const timebase =
      typeof getTimebaseTrack === 'function' ? getTimebaseTrack() : null;
    const id = timebase ? timebase.id : 'sur';
    const sound = this.tracks[id];
    if (!sound) {
      return this.progreso;
    }
    try {
      const dur = sound.duration();
      if (dur > 0 && (sound.isPlaying() || sound.isPaused())) {
        this.progreso = constrain(sound.currentTime() / dur, 0, 1);
      }
    } catch (_err) {
      // ignore
    }
    return this.progreso;
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
    text(`playback: ${this.playback}  t=${nf(this.progreso, 1, 3)}`, 0, 0);
    translate(0, 28);
    ids.forEach((id, i) => {
      const sound = this.tracks[id];
      let p = 0;
      try {
        if (sound.duration() > 0 && (sound.isPlaying() || sound.isPaused())) {
          p = sound.currentTime() / sound.duration();
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

  _startFresh() {
    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      try {
        if (sound.isPlaying() || sound.isPaused()) {
          sound.stop();
        }
        // Todas las pistas en punta (Norte alineado con Sur).
        // amp 0: el fade lo sube según faders
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
    for (const id of Object.keys(this.tracks)) {
      const sound = this.tracks[id];
      try {
        if (typeof sound.setLoop === 'function') {
          sound.setLoop(true);
        }
        if (sound.isPaused()) {
          sound.play();
        } else if (!sound.isPlaying()) {
          sound.loop();
        }
      } catch (err) {
        console.warn(`[Mixer] resume falló en ${id}:`, err);
      }
    }
    this.playback = 'playing';
    console.info('[Mixer] Reanudado');
  }
}
