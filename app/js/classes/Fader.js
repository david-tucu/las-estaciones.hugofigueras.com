/**
 * Fader
 * Control vertical de volumen (0–1) en coordenadas de diseño.
 * Knob = icono (cara / i_…); leyenda de texto debajo.
 */
class Fader {
  /**
   * @param {object} config
   * @param {Game} config.game
   * @param {number} config.x Centro X
   * @param {number} config.top
   * @param {number} config.bottom
   * @param {number} config.slotW Ancho de hitbox
   * @param {string} config.label
   * @param {string} [config.iconKey]
   * @param {string} config.trackId
   * @param {number} [config.value]
   */
  constructor(config) {
    this.game = config.game;
    this.x = config.x;
    this.top = config.top;
    this.bottom = config.bottom;
    this.slotW = config.slotW;
    this.label = config.label;
    this.iconKey = config.iconKey || null;
    this.trackId = config.trackId;
    this.value =
      config.value !== undefined ? config.value : FADER_DEFAULT_VOLUME;
    this.scale =
      typeof LAYOUT !== 'undefined' && LAYOUT.FADER_SCALE
        ? LAYOUT.FADER_SCALE
        : 1;

    this._dragging = false;
  }

  /**
   * Tamaño del knob-icono (100% más grande que el icono previo de 56).
   * @returns {number}
   */
  _iconSize() {
    const base = 112 * this.scale;
    return this._dragging ? base * 1.08 : base;
  }

  /**
   * Zona útil del slider (margen para knob grande + leyenda).
   * @returns {{ y0: number, y1: number, h: number }}
   */
  _trackBounds() {
    const iconR = this._iconSize() / 2;
    const padTop = iconR + 8 * this.scale;
    const padBottom = 64 * this.scale;
    const y0 = this.top + padTop;
    const y1 = this.bottom - padBottom;
    return { y0, y1, h: Math.max(40, y1 - y0) };
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  contains(px, py) {
    const half = this.slotW * 0.45;
    return (
      px >= this.x - half &&
      px <= this.x + half &&
      py >= this.top &&
      py <= this.bottom
    );
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerPressed(px, py) {
    if (!this.contains(px, py)) {
      return false;
    }
    this._dragging = true;
    this._applyY(py);
    return true;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerDragged(px, py) {
    if (!this._dragging) {
      return false;
    }
    this._applyY(py);
    return true;
  }

  /**
   * @param {number} _px
   * @param {number} _py
   * @returns {boolean}
   */
  pointerReleased(_px, _py) {
    if (!this._dragging) {
      return false;
    }
    this._dragging = false;
    return true;
  }

  pointerCancel() {
    this._dragging = false;
  }

  /**
   * @param {number} py
   */
  _applyY(py) {
    const { y0, y1 } = this._trackBounds();
    this.value = constrain(map(py, y1, y0, 0, 1), 0, 1);
    if (this.game.mixer && typeof this.game.mixer.onFaderUserChange === 'function') {
      this.game.mixer.onFaderUserChange(this.trackId);
    }
  }

  draw() {
    const { y0, y1 } = this._trackBounds();
    const knobY = map(this.value, 0, 1, y1, y0);
    const s = this.scale;

    push();
    stroke(120);
    strokeWeight(3 * s);
    line(this.x, y0, this.x, y1);

    noStroke();
    fill(...COLORS.ACCENT, 80);
    rectMode(CORNER);
    rect(this.x - 4 * s, knobY, 8 * s, y1 - knobY, 4 * s);

    this._drawKnob(knobY, s);
    this._drawLabel(s);
    pop();
  }

  /**
   * Icono como elemento arrastrable (knob).
   * @param {number} knobY
   * @param {number} s
   */
  _drawKnob(knobY, s) {
    const size = this._iconSize();
    const img =
      this.iconKey && this.game.assets
        ? this.game.assets.getImage(this.iconKey)
        : null;

    if (img && img.width > 1) {

      //dibuja un circulo blanco de base:
      noStroke();
      fill(255);
      circle(this.x, knobY, size / 2);

      //dibuja el icono sobre el circulo blanco:
      imageMode(CENTER);
      
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.arc(this.x, knobY, size / 2, 0, Math.PI * 2);
      drawingContext.closePath();
      drawingContext.clip();
      image(img, this.x, knobY, size, size);
      drawingContext.restore();

      noFill();
      stroke(...COLORS.ACCENT);
      strokeWeight((this._dragging ? 3.5 : 2.5) * s);
      //circle(this.x, knobY, size);
      return;
    }

    // Fallback: círculo accent si no hay icono
    const r = (this._dragging ? 28 : 22) * s;
    noStroke();
    fill(...COLORS.ACCENT);
    circle(this.x, knobY, r * 2);
  }

  /**
   * Leyenda debajo del fader.
   * @param {number} s
   */
  _drawLabel(s) {
    noStroke();
    fill(...COLORS.TEXT_DIM);
    textAlign(CENTER, TOP);
    this.game.assets.useFont(FONTS.COCOGOOSE);
    textSize(32 * Math.max(0.85, s));
    const lines = String(this.label).split('\n');
    let ty = this.bottom - 20 * s;
    for (const line of lines) {
      text(line, this.x, ty);
      ty += 32 * s;
    }
  }
}
