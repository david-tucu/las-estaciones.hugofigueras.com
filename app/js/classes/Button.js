/**
 * Button
 * Botón táctil reutilizable (COMENZAR, VOLVER, etc.).
 * Soporta imagen opcional o dibujo geométrico de respaldo.
 */
class Button {
  /**
   * @param {object} config
   * @param {Game} config.game
   * @param {number} config.x
   * @param {number} config.y
   * @param {number} [config.w]
   * @param {number} [config.h]
   * @param {string} config.label
   * @param {string} [config.imageKey]
   * @param {function} [config.onPress]
   */
  constructor(config) {
    this.game = config.game;
    this.x = config.x;
    this.y = config.y;
    this.w = config.w || 420;
    this.h = config.h || 120;
    this.label = config.label || '';
    this.imageKey = config.imageKey || null;
    this.onPress = config.onPress || null;
    this.labelColor = config.labelColor || COLORS.BUTTON_LABEL;
    this.labelSize = config.labelSize || null;
    this.labelOffsetY =
      config.labelOffsetY !== undefined ? config.labelOffsetY : 0;
    this.fillColor = config.fillColor || COLORS.BUTTON_FILL;

    this.ctaPulse = !!config.ctaPulse;
    this.ctaAmplitude =
      config.ctaAmplitude !== undefined ? config.ctaAmplitude : 0.05;
    this.ctaPeriod =
      config.ctaPeriod !== undefined ? config.ctaPeriod : 1.15;

    this.scale = 1;
    this.alpha = 1;
    this.rotation = 0;
    this.visible = true;
    this.enabled = true;

    this._pressed = false;
  }

  /**
   * @returns {number}
   */
  _ctaScale() {
    if (
      !this.ctaPulse ||
      !this.enabled ||
      this._pressed ||
      this.alpha < 0.9
    ) {
      return 1;
    }
    const t = (typeof millis === 'function' ? millis() : 0) / 1000;
    return 1 + Math.sin((t * Math.PI * 2) / this.ctaPeriod) * this.ctaAmplitude;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  contains(px, py) {
    const s = this.scale * this._ctaScale();
    const halfW = (this.w * s) / 2;
    const halfH = (this.h * s) / 2;
    return (
      px >= this.x - halfW &&
      px <= this.x + halfW &&
      py >= this.y - halfH &&
      py <= this.y + halfH
    );
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerPressed(px, py) {
    if (!this.visible || !this.enabled) {
      return false;
    }
    if (!this.contains(px, py)) {
      return false;
    }
    this._pressed = true;
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(this, { scale: 0.94 }, 0.08, {
      easing: Easing.easeOutQuad,
    });
    return true;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerReleased(px, py) {
    if (!this._pressed) {
      return false;
    }
    this._pressed = false;
    this.game.tweens.killTweensOf(this);
    this.game.tweens.animate(this, { scale: 1 }, 0.15, {
      easing: Easing.easeOutBack,
    });

    if (this.visible && this.enabled && this.contains(px, py) && this.onPress) {
      this.onPress(this);
      return true;
    }
    return false;
  }

  draw() {
    if (!this.visible || this.alpha <= 0.01) {
      return;
    }

    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    scale(this.scale * this._ctaScale());
    drawingContext.globalAlpha = this.alpha;
    noTint();
    blendMode(BLEND);

    const img = this.imageKey ? this.game.assets.getImage(this.imageKey) : null;
    const ready = img && img.width > 1;
    const [lr, lg, lb] = this.labelColor;

    imageMode(CENTER);
    if (ready) {
      image(img, 0, 0, this.w, this.h);
    } else {
      rectMode(CENTER);
      noStroke();
      const [fr, fg, fb] = this.fillColor;
      fill(fr, fg, fb);
      rect(0, 0, this.w, this.h, 28);
    }

    if (this.label) {
      fill(lr, lg, lb);
      textAlign(CENTER, CENTER);
      const font = this.game.assets.getFont('main');
      if (font) {
        textFont(font);
      }
      const size = this.labelSize || Math.min(48, this.h * 0.38);
      textSize(size);
      text(this.label, 0, this.labelOffsetY);
    }

    drawingContext.globalAlpha = 1;
    pop();
  }
}
