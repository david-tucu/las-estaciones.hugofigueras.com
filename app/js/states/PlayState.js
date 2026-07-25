/**
 * PlayState
 * Experiencia principal: órbita sync + lyrics + mezclador + faders táctiles.
 */
class PlayState extends BaseState {
  constructor(game) {
    super(game);

    this.orbit = null;
    this.marqueeNorte = null;
    this.marqueeSur = null;
    /** @type {Fader[]} */
    this.faders = [];
    this.transport = null;

    this.backButton = null;
    this.infoButton = null;
    this.layersButton = null;
    /** Capa de info orbital (meses / estaciones / polos). */
    this._infoOverlay = false;

    this._exiting = false;
    this._activeFader = null;
    /** @type {{ marquee: MarqueeLyrics, lastX: number, wasPlaying: boolean }|null} */
    this._scrub = null;
    this.ui = { alpha: 0 };
  }

  enter() {
    this._exiting = false;
    this._activeFader = null;
    this._scrub = null;
    this.game.tweens.killAll();
    this.ui.alpha = 0;

    this.orbit = new OrbitalSystem(this.game, LAYOUT.ORBIT_Y, LAYOUT.ORBIT_H);

    const mapNorte = getLyricMapById('norte');
    const mapSur = getLyricMapById('sur');

    this.marqueeNorte = new MarqueeLyrics(this.game, {
      imageKey: mapNorte ? mapNorte.imageKeyScore : 'parte_norte',
      map: mapNorte ? mapNorte.map : [],
      y: LAYOUT.LYRIC_NORTE_Y,
      h: LAYOUT.LYRIC_H,
      scaleFactor: LAYOUT.LYRIC_SCALE_FACTOR,
      cueSide: 'above',
    });
    this.marqueeSur = new MarqueeLyrics(this.game, {
      imageKey: mapSur ? mapSur.imageKeyScore : 'parte_sur',
      map: mapSur ? mapSur.map : [],
      y: LAYOUT.LYRIC_SUR_Y,
      h: LAYOUT.LYRIC_H,
      scaleFactor: LAYOUT.LYRIC_SCALE_FACTOR,
      cueSide: 'below',
    });

    this._buildFaders();
    if (this.game.mixer) {
      this.game.mixer._faders = this.faders;
    }
    this.transport = new TransportBar(
      this.game,
      this.game.mixer,
      LAYOUT.TRANSPORT_Y
    );

    this.backButton = new Button({
      game: this.game,
      x: 130,
      y: LAYOUT.NAV_Y,
      w: 200,
      h: 80,
      label: 'SALIR',
      labelSize: 28,
      fillColor: [50, 60, 90],
      labelColor: COLORS.TEXT,
      onPress: () => this._goTo(STATES.INTRO),
    });
    this.backButton.alpha = 0;
    this.backButton.enabled = false;

    this.infoButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH - 130,
      y: LAYOUT.NAV_Y,
      w: 200,
      h: 80,
      label: '?',
      labelSize: 40,
      fillColor: [50, 60, 90],
      labelColor: COLORS.TEXT,
      onPress: () => this._goTo(STATES.INFO),
    });
    this.infoButton.alpha = 0;
    this.infoButton.enabled = false;

    this._infoOverlay = false;
    this.layersButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH - 70,
      y: LAYOUT.ORBIT_Y + 48,
      w: 72,
      h: 72,
      label: 'i',
      labelSize: 36,
      fillColor: [50, 60, 90],
      labelColor: COLORS.TEXT,
      onPress: () => this._toggleInfoOverlay(),
    });
    this.layersButton.alpha = 0;
    this.layersButton.enabled = false;

    this.game.tweens.animate(this.ui, { alpha: 1 }, 0.35);
    this.game.tweens.animate(this.backButton, { alpha: 1 }, 0.3, {
      delay: 0.1,
      onComplete: () => {
        this.backButton.enabled = true;
      },
    });
    this.game.tweens.animate(this.infoButton, { alpha: 1 }, 0.3, {
      delay: 0.1,
      onComplete: () => {
        this.infoButton.enabled = true;
      },
    });
    this.game.tweens.animate(this.layersButton, { alpha: 1 }, 0.3, {
      delay: 0.15,
      onComplete: () => {
        this.layersButton.enabled = true;
      },
    });

    console.info(
      `[PlayState] enter — ${this.faders.length} faders, mixer ready=${this.game.mixer.isReady}`
    );
  }

  _toggleInfoOverlay() {
    this._infoOverlay = !this._infoOverlay;
    if (this.orbit) {
      this.orbit.showInfo = this._infoOverlay;
    }
    if (this.layersButton) {
      this.layersButton.fillColor = this._infoOverlay
        ? [...COLORS.ACCENT]
        : [50, 60, 90];
      this.layersButton.labelColor = this._infoOverlay
        ? [...COLORS.BUTTON_LABEL]
        : [...COLORS.TEXT];
    }
    this.game.audio.play(AUDIO_KEYS.CLIC);
  }

  /**
   * @param {number} dt
   */
  update(_dt) {
    if (!this.game.mixer) {
      return;
    }
    const progreso = this.game.mixer.getProgress();
    this.game.mixer.updateFades(this.faders);
    if (this.orbit) {
      this.orbit.update(progreso);
    }
    if (this.marqueeNorte) {
      this.marqueeNorte.debug = this.game.debug;
      this.marqueeNorte.update(progreso);
    }
    if (this.marqueeSur) {
      this.marqueeSur.debug = this.game.debug;
      this.marqueeSur.update(progreso);
    }
  }

  draw() {
    this.game.drawBackground();

    push();
    drawingContext.globalAlpha = this.ui.alpha;

    noStroke();
    fill(30, 36, 55, 180);
    rect(0, 0, DESIGN_WIDTH, LAYOUT.NAV_BAR_H);

    fill(...COLORS.TEXT_DIM);
    textAlign(CENTER, CENTER);
    this.game.assets.useFont(FONTS.COCOGOOSE);
    textSize(22);
    text(APP_TITLE, DESIGN_WIDTH / 2, LAYOUT.NAV_Y);

    if (this.orbit) {
      this.orbit.draw();
    }
    if (this.transport) {
      this.transport.draw();
    }
    if (this.marqueeNorte) {
      this.marqueeNorte.draw();
    }
    if (this.marqueeSur) {
      this.marqueeSur.draw();
    }
    for (const fader of this.faders) {
      fader.draw();
    }

    if (this.game.debug && this.game.mixer) {
      this.game.mixer.drawDebug();
    }

    drawingContext.globalAlpha = 1;
    pop();

    if (this.backButton) {
      this.backButton.draw();
    }
    if (this.infoButton) {
      this.infoButton.draw();
    }
    if (this.layersButton) {
      this.layersButton.draw();
    }
  }

  exit() {
    if (this.game.mixer) {
      this.game.mixer.stopAll();
    }
    this.game.tweens.killTweensOf(this.ui);
    for (const btn of [this.backButton, this.infoButton, this.layersButton]) {
      if (btn) {
        this.game.tweens.killTweensOf(btn);
      }
    }
    this.orbit = null;
    this.marqueeNorte = null;
    this.marqueeSur = null;
    this.faders = [];
    this.transport = null;
    this.backButton = null;
    this.infoButton = null;
    this.layersButton = null;
    this._infoOverlay = false;
    this._activeFader = null;
    this._scrub = null;
    console.info('[PlayState] exit');
  }

  pointerPressed(x, y) {
    if (this._exiting) {
      return;
    }
    if (this.backButton && this.backButton.pointerPressed(x, y)) {
      return;
    }
    if (this.infoButton && this.infoButton.pointerPressed(x, y)) {
      return;
    }
    if (this.layersButton && this.layersButton.pointerPressed(x, y)) {
      return;
    }
    if (this.orbit && this.orbit.pointerPressed(x, y)) {
      return;
    }
    if (this.transport && this.transport.pointerPressed(x, y)) {
      return;
    }
    for (const fader of this.faders) {
      if (fader.pointerPressed(x, y)) {
        this._activeFader = fader;
        return;
      }
    }
    if (this._beginScrub(x, y)) {
      return;
    }
  }

  pointerDragged(x, y) {
    if (this._exiting) {
      return;
    }
    if (this.orbit && this.orbit._draggingView) {
      this.orbit.pointerDragged(x, y);
      return;
    }
    if (this._activeFader) {
      this._activeFader.pointerDragged(x, y);
      return;
    }
    if (this._scrub) {
      this._dragScrub(x);
    }
  }

  pointerReleased(x, y) {
    if (this._exiting) {
      return;
    }
    if (this.orbit && this.orbit._draggingView) {
      this.orbit.pointerReleased();
    }
    if (this._activeFader) {
      this._activeFader.pointerReleased(x, y);
      this._activeFader = null;
    }
    if (this._scrub) {
      this._endScrub();
      return;
    }
    if (this.backButton && this.backButton.pointerReleased(x, y)) {
      return;
    }
    if (this.infoButton && this.infoButton.pointerReleased(x, y)) {
      return;
    }
    if (this.layersButton && this.layersButton.pointerReleased(x, y)) {
      return;
    }
  }

  pointerCancel() {
    if (this.orbit) {
      this.orbit.pointerCancel();
    }
    if (this._activeFader) {
      this._activeFader.pointerCancel();
      this._activeFader = null;
    }
    if (this._scrub) {
      this._endScrub();
    }
  }

  /**
   * Inicia scrub sobre Norte o Sur.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  _beginScrub(x, y) {
    const marquee = this._hitMarquee(x, y);
    if (!marquee || !this.game.mixer) {
      return false;
    }

    const mixer = this.game.mixer;
    const wasPlaying = mixer.isPlaying;
    mixer.scrubbing = true;

    // Referencias absolutas: evita acumulación / pelea con marquee.update()
    this._scrub = {
      marquee,
      startX: x,
      startNativeX: marquee.currentX,
      wasPlaying,
    };

    if (wasPlaying) {
      mixer.fadeOutAndPause(SCRUB_FADE_SEC);
    } else {
      mixer.masterFade = 0;
      mixer._fadeProxy.v = 0;
      mixer._applyAllVolumes();
    }

    console.info('[PlayState] scrub start, wasPlaying=', wasPlaying);
    return true;
  }

  /**
   * @param {number} x
   */
  _dragScrub(x) {
    if (!this._scrub || !this.game.mixer) {
      return;
    }
    const { marquee, startX, startNativeX } = this._scrub;

    // Desplazamiento total desde el press (sin deltas frame-a-frame)
    // Dedo a la derecha → tira hacia adelante en pantalla → tiempo hacia atrás
    const nativeX = startNativeX - (x - startX) / marquee.escala;
    const t = marquee.progressFromNativeX(nativeX);

    // Solo progreso lógico durante el drag (sin stop/jump de audio → sin lag)
    this.game.mixer.setProgressOnly(t);
    // update() aplica órbita + marquees desde getProgress()
  }

  _endScrub() {
    if (!this._scrub || !this.game.mixer) {
      this._scrub = null;
      return;
    }
    const { wasPlaying } = this._scrub;
    this._scrub = null;
    const mixer = this.game.mixer;
    mixer.scrubbing = false;

    // Un solo seek de audio al soltar
    mixer.seekToProgress(mixer.progreso);
    // Scrub siempre deja el estado en loop (no intro)
    mixer.markLoopAfterScrub();

    if (wasPlaying) {
      mixer.fadeInAndResume(SCRUB_FADE_SEC, this.faders);
      console.info('[PlayState] scrub end → resume fade-in @', nf(mixer.progreso, 1, 3));
    } else {
      mixer.masterFade = 0;
      mixer._fadeProxy.v = 0;
      mixer._applyAllVolumes();
      console.info('[PlayState] scrub end → paused @', nf(mixer.progreso, 1, 3));
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {MarqueeLyrics|null}
   */
  _hitMarquee(x, y) {
    if (this.marqueeNorte && this.marqueeNorte.contains(x, y)) {
      return this.marqueeNorte;
    }
    if (this.marqueeSur && this.marqueeSur.contains(x, y)) {
      return this.marqueeSur;
    }
    return null;
  }

  _buildFaders() {
    this.faders = [];
    const order =
      typeof FADER_ORDER !== 'undefined' && FADER_ORDER.length
        ? FADER_ORDER
        : TRACK_CATALOG.map((t) => t.id);
    const n = order.length;
    if (!n) {
      return;
    }
    const slotW = DESIGN_WIDTH / n;
    for (let i = 0; i < n; i += 1) {
      const track = getTrackById(order[i]);
      if (!track) {
        continue;
      }
      this.faders.push(
        new Fader({
          game: this.game,
          x: slotW * i + slotW / 2,
          top: LAYOUT.FADER_TOP,
          bottom: LAYOUT.FADER_BOTTOM,
          slotW,
          label: track.label,
          iconKey: track.iconKey || null,
          trackId: track.id,
          value: FADER_DEFAULT_VOLUME,
        })
      );
    }
  }

  /**
   * @param {string} nextId
   */
  _goTo(nextId) {
    if (this._exiting) {
      return;
    }
    this._exiting = true;
    this.game.audio.play(AUDIO_KEYS.CLIC);

    for (const btn of [this.backButton, this.infoButton]) {
      if (btn) {
        btn.enabled = false;
      }
    }

    if (this.game.mixer) {
      this.game.mixer.stopAll();
    }
    this._scrub = null;

    this.game.tweens.animate(this.ui, { alpha: 0 }, 0.2);
    this.game.tweens.animate(this.backButton, { alpha: 0 }, 0.2, {
      onComplete: () => this.game.stateManager.changeTo(nextId),
    });
  }
}
