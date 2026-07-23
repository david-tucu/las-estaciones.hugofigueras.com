/**
 * TransportBar
 * Controles PLAY / PAUSA / STOP del mezclador (hitboxes grandes).
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
    this.btnW = 200;
    this.btnH = 72;
    this.gap = 40;

    this.playX = DESIGN_WIDTH / 2 - (this.btnW + this.gap) / 2;
    this.stopX = DESIGN_WIDTH / 2 + (this.btnW + this.gap) / 2;
  }

  /**
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  pointerPressed(px, py) {
    if (this._hit(this.playX, px, py)) {
      this.mixer.togglePlayPause();
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
    this._drawBtn(
      this.playX,
      playing ? 'PAUSA' : 'PLAY',
      playing ? [46, 204, 113] : [70, 80, 110]
    );
    this._drawBtn(this.stopX, 'STOP', [70, 80, 110]);
  }

  /**
   * @param {number} x
   * @param {string} label
   * @param {number[]} fillRgb
   */
  _drawBtn(x, label, fillRgb) {
    push();
    rectMode(CENTER);
    noStroke();
    fill(...fillRgb);
    rect(x, this.y, this.btnW, this.btnH, 16);
    fill(...COLORS.TEXT);
    textAlign(CENTER, CENTER);
    textSize(28);
    text(label, x, this.y);
    pop();
  }
}
