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

    this._exiting = false;
    this._activeFader = null;
    this.ui = { alpha: 0 };
  }

  enter() {
    this._exiting = false;
    this._activeFader = null;
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
    });
    this.marqueeSur = new MarqueeLyrics(this.game, {
      imageKey: mapSur ? mapSur.imageKeyScore : 'parte_sur',
      map: mapSur ? mapSur.map : [],
      y: LAYOUT.LYRIC_SUR_Y,
      h: LAYOUT.LYRIC_H,
      scaleFactor: LAYOUT.LYRIC_SCALE_FACTOR,
    });

    this._buildFaders();
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
      label: 'INICIO',
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
      label: 'INFO',
      labelSize: 28,
      fillColor: [50, 60, 90],
      labelColor: COLORS.TEXT,
      onPress: () => this._goTo(STATES.INFO),
    });
    this.infoButton.alpha = 0;
    this.infoButton.enabled = false;

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

    console.info(
      `[PlayState] enter — ${this.faders.length} faders, mixer ready=${this.game.mixer.isReady}`
    );
  }

  /**
   * @param {number} dt
   */
  update(_dt) {
    if (!this.game.mixer) {
      return;
    }
    this.game.mixer.updateFades(this.faders);
    const progreso = this.game.mixer.getProgress();
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
  }

  exit() {
    if (this.game.mixer) {
      this.game.mixer.stopAll();
    }
    this.game.tweens.killTweensOf(this.ui);
    for (const btn of [this.backButton, this.infoButton]) {
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
    this._activeFader = null;
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
    if (this.transport && this.transport.pointerPressed(x, y)) {
      return;
    }
    for (const fader of this.faders) {
      if (fader.pointerPressed(x, y)) {
        this._activeFader = fader;
        return;
      }
    }
  }

  pointerDragged(x, y) {
    if (this._exiting) {
      return;
    }
    if (this._activeFader) {
      this._activeFader.pointerDragged(x, y);
    }
  }

  pointerReleased(x, y) {
    if (this._exiting) {
      return;
    }
    if (this._activeFader) {
      this._activeFader.pointerReleased(x, y);
      this._activeFader = null;
    }
    if (this.backButton && this.backButton.pointerReleased(x, y)) {
      return;
    }
    if (this.infoButton && this.infoButton.pointerReleased(x, y)) {
      return;
    }
  }

  pointerCancel() {
    if (this._activeFader) {
      this._activeFader.pointerCancel();
      this._activeFader = null;
    }
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

    this.game.tweens.animate(this.ui, { alpha: 0 }, 0.2);
    this.game.tweens.animate(this.backButton, { alpha: 0 }, 0.2, {
      onComplete: () => this.game.stateManager.changeTo(nextId),
    });
  }
}
