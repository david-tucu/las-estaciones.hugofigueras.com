/**
 * TransportBar
 * Controles PLAY / PAUSA / STOP con iconos (△ ‖ ■).
 */
class TransportBar {
  /**
   * @param {Game} game
   * @param {Mixer} mixer
   * @param {number} y
   */
  constructor(game, mixer, y) {
    this.game = game;
    this.mixer = mixer;
    this.y = y;
    this.btnW = 160;
    this.btnH = 72;
    this.gap = 28;

    const total = this.btnW * 3 + this.gap * 2;
    const left = DESIGN_WIDTH / 2 - total / 2;
    this.playX = left + this.btnW / 2;
    this.pauseX = left + this.btnW + this.gap + this.btnW / 2;
    this.stopX = left + (this.btnW + this.gap) * 2 + this.btnW / 2;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerPressed(px, py) {
    if (this._hit(this.playX, px, py)) {
      this.mixer.playPressed();
      this.game.audio.play(AUDIO_KEYS.CLIC);
      return true;
    }
    if (this._hit(this.pauseX, px, py)) {
      this.mixer.pausePressed();
      this.game.audio.play(AUDIO_KEYS.CLIC);
      return true;
    }
    if (this._hit(this.stopX, px, py)) {
      this.mixer.stopAll();
      this.game.audio.play(AUDIO_KEYS.CLIC);
      return true;
    }
    return false;
  }

  /**
   * @param {number} cx
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  _hit(cx, px, py) {
    return (
      px >= cx - this.btnW / 2 &&
      px <= cx + this.btnW / 2 &&
      py >= this.y - this.btnH / 2 &&
      py <= this.y + this.btnH / 2
    );
  }

  draw() {
    const playing = this.mixer.isPlaying;
    const paused = this.mixer.isPaused;

    this._drawBtn(
      this.playX,
      'play',
      playing ? [46, 204, 113] : [70, 80, 110]
    );
    this._drawBtn(
      this.pauseX,
      'pause',
      paused ? [255, 180, 60] : [70, 80, 110]
    );
    this._drawBtn(this.stopX, 'stop', [70, 80, 110]);
  }

  /**
   * @param {number} x
   * @param {'play'|'pause'|'stop'} icon
   * @param {number[]} fillRgb
   */
  _drawBtn(x, icon, fillRgb) {
    push();
    rectMode(CENTER);
    noStroke();
    fill(...fillRgb);
    rect(x, this.y, this.btnW, this.btnH, 16);

    fill(...COLORS.TEXT);
    noStroke();
    if (icon === 'play') {
      this._iconPlay(x, this.y);
    } else if (icon === 'pause') {
      this._iconPause(x, this.y);
    } else {
      this._iconStop(x, this.y);
    }
    pop();
  }

  /** Triángulo play (apunta a la derecha). */
  _iconPlay(cx, cy) {
    const s = 18;
    triangle(cx - s * 0.55, cy - s, cx - s * 0.55, cy + s, cx + s * 0.85, cy);
  }

  /** Doble barra vertical. */
  _iconPause(cx, cy) {
    const w = 8;
    const h = 32;
    const gap = 8;
    rectMode(CENTER);
    rect(cx - gap, cy, w, h, 2);
    rect(cx + gap, cy, w, h, 2);
  }

  /** Cuadrado stop. */
  _iconStop(cx, cy) {
    rectMode(CENTER);
    rect(cx, cy, 28, 28, 3);
  }
}
