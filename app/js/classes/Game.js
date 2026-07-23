/**
 * Game
 * Orquestador principal. Posee managers y el viewport 1080×1920.
 * sketch.js solo delega aquí.
 */
class Game {
  constructor() {
    this.assets = new AssetManager();
    this.audio = new AudioManager(this.assets);
    this.tweens = new TweenManager();
    this.stateManager = new StateManager(this);

    /** @type {Mixer|null} Se crea en setup() tras cargar assets. */
    this.mixer = null;

    /** Overlay de debug (tecla D). */
    this.debug = false;

    /** Escala y offsets para mapear pantalla real ↔ coordenadas de diseño. */
    this.viewScale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this._lastMillis = 0;
    this._ready = false;
  }

  /** Carga de assets. Llamar desde preload(). */
  preload() {
    this.assets.loadAll();
  }

  /** Inicialización tras preload. Llamar desde setup(). */
  setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('game-root');
    pixelDensity(1);

    this.assets.finalize();
    this._computeViewport();

    this.mixer = new Mixer(this);

    this.stateManager.register(STATES.INTRO, new IntroState(this));
    this.stateManager.register(STATES.PLAY, new PlayState(this));
    this.stateManager.register(STATES.INFO, new InfoState(this));

    this._lastMillis = millis();
    this._ready = true;
    this.stateManager.start(STATES.INTRO);

    console.info(
      '[Game] Listo.',
      APP_FULL_TITLE,
      '| Diseño',
      DESIGN_WIDTH,
      'x',
      DESIGN_HEIGHT
    );
    if (this.assets.usedPlaceholders) {
      console.info(
        '[Game] Algunos assets faltan: se usan placeholders. Revisá /assets.'
      );
    }
  }

  draw() {
    if (!this._ready) {
      return;
    }

    const now = millis();
    let dt = (now - this._lastMillis) / 1000;
    this._lastMillis = now;
    dt = Math.min(dt, 0.05);

    this.tweens.update(dt);
    this.stateManager.update(dt);

    // Fondo letterbox
    const [lr, lg, lb] = COLORS.LETTERBOX;
    background(lr, lg, lb);

    push();
    translate(this.offsetX, this.offsetY);
    scale(this.viewScale);

    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    drawingContext.clip();

    this.stateManager.draw();

    drawingContext.restore();
    pop();
  }

  windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    this._computeViewport();
  }

  toggleFullscreen() {
    const goingFull = !fullscreen();
    fullscreen(goingFull);
    setTimeout(() => {
      if (this._ready) {
        this.windowResized();
      }
    }, 50);
  }

  restart() {
    this.pointerCancel();
    this.tweens.killAll();
    this.audio.stopAllSfx();
    if (this.mixer) {
      this.mixer.stopAll();
    }
    this.audio.stopBgm();
    this.stateManager.forceStart(STATES.INTRO);
    console.info('[Game] Reinicio completo → INTRO');
  }

  /**
   * Atajos de desarrollo / operador.
   * D → debug | F / ESC → fullscreen | Q → reinicio | 1–3 → estados
   * @param {string} k
   * @param {number} code
   */
  handleKey(k, code) {
    if (!this._ready) {
      return;
    }

    if (k === 'd' || k === 'D') {
      this.debug = !this.debug;
      console.info('[Game] debug =', this.debug);
      return;
    }

    if (k === 'f' || k === 'F') {
      this.toggleFullscreen();
      return;
    }
    if (code === ESCAPE) {
      this.toggleFullscreen();
      return;
    }
    if (k === 'q' || k === 'Q') {
      this.restart();
      return;
    }

    const jumps = {
      '1': STATES.INTRO,
      '2': STATES.PLAY,
      '3': STATES.INFO,
    };
    if (jumps[k]) {
      this.pointerCancel();
      this.tweens.killAll();
      if (this.mixer) {
        this.mixer.stopAll();
      }
      this.stateManager.forceStart(jumps[k]);
      console.info('[Game] Salto a estado:', jumps[k]);
    }
  }

  handleWheel(_delta) {
    // Reservado (scroll de overlays futuros).
  }

  /**
   * Fondo compartido provisional (gradiente) en espacio de diseño.
   */
  drawBackground() {
    noStroke();
    for (let y = 0; y < DESIGN_HEIGHT; y += 8) {
      const t = y / DESIGN_HEIGHT;
      const r = lerp(COLORS.BG[0], COLORS.BG_ALT[0], t);
      const g = lerp(COLORS.BG[1], COLORS.BG_ALT[1], t);
      const b = lerp(COLORS.BG[2], COLORS.BG_ALT[2], t);
      fill(r, g, b);
      rect(0, y, DESIGN_WIDTH, 8);
    }
  }

  // ---------------------------------------------------------------------------
  // Input: touch y mouse → mismas coords de diseño
  // ---------------------------------------------------------------------------

  pointerPressed() {
    this.audio.unlock();
    const pos = this._pointerToDesign({ clamp: false });
    if (!pos) {
      return;
    }
    this.stateManager.pointerPressed(pos.x, pos.y);
  }

  pointerReleased() {
    const pos = this._pointerToDesign({ clamp: true });
    this.stateManager.pointerReleased(pos.x, pos.y);
    return false;
  }

  pointerDragged() {
    const pos = this._pointerToDesign({ clamp: true });
    this.stateManager.pointerDragged(pos.x, pos.y);
  }

  pointerCancel() {
    if (typeof this.stateManager.pointerCancel === 'function') {
      this.stateManager.pointerCancel();
    }
  }

  _computeViewport() {
    const scaleX = width / DESIGN_WIDTH;
    const scaleY = height / DESIGN_HEIGHT;
    this.viewScale = Math.min(scaleX, scaleY);
    this.offsetX = (width - DESIGN_WIDTH * this.viewScale) / 2;
    this.offsetY = (height - DESIGN_HEIGHT * this.viewScale) / 2;
  }

  /**
   * @param {{ clamp?: boolean }} [options]
   * @returns {{ x: number, y: number }|null}
   */
  _pointerToDesign(options = {}) {
    const clamp = options.clamp === true;
    const x = (mouseX - this.offsetX) / this.viewScale;
    const y = (mouseY - this.offsetY) / this.viewScale;

    if (clamp) {
      return {
        x: constrain(x, 0, DESIGN_WIDTH),
        y: constrain(y, 0, DESIGN_HEIGHT),
      };
    }

    if (x < 0 || y < 0 || x > DESIGN_WIDTH || y > DESIGN_HEIGHT) {
      return null;
    }
    return { x, y };
  }
}
