/**
 * IntroState
 * Pantalla de inicio: marca + COMENZAR + acceso a Info.
 */
class IntroState extends BaseState {
  constructor(game) {
    super(game);
    this.startButton = null;
    this.infoButton = null;
    this._exiting = false;
    this.ui = { alpha: 0 };
  }

  enter() {
    this._exiting = false;
    this.game.tweens.killAll();
    this.ui.alpha = 0;

    this.startButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH / 2,
      y: 1280,
      w: 520,
      h: 140,
      label: 'COMENZAR',
      labelSize: 52,
      ctaPulse: true,
      onPress: () => this._goTo(STATES.PLAY),
    });
    this.startButton.alpha = 0;
    this.startButton.enabled = false;

    this.infoButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH / 2,
      y: 1480,
      w: 360,
      h: 100,
      label: 'INFO',
      labelSize: 34,
      fillColor: [50, 60, 90],
      labelColor: COLORS.TEXT,
      onPress: () => this._goTo(STATES.INFO),
    });
    this.infoButton.alpha = 0;
    this.infoButton.enabled = false;

    this.game.tweens.animate(this.ui, { alpha: 1 }, 0.45, {
      easing: Easing.easeOutQuad,
    });
    this.game.tweens.animate(this.startButton, { alpha: 1 }, 0.4, {
      delay: 0.15,
      onComplete: () => {
        this.startButton.enabled = true;
      },
    });
    this.game.tweens.animate(this.infoButton, { alpha: 1 }, 0.35, {
      delay: 0.25,
      onComplete: () => {
        this.infoButton.enabled = true;
      },
    });

    console.info('[IntroState] enter');
  }

  update(_dt) {}

  draw() {
    this.game.drawBackground();

    push();
    drawingContext.globalAlpha = this.ui.alpha;

    noStroke();
    fill(255, 204, 0, 220);
    circle(DESIGN_WIDTH / 2, 520, 220);
    fill(255, 230, 120, 90);
    circle(DESIGN_WIDTH / 2, 520, 320);

    push();
    translate(DESIGN_WIDTH / 2, 520);
    rotate(-0.6);
    noFill();
    stroke(255, 255, 255, 40);
    strokeWeight(2);
    ellipse(0, 0, 520, 280);
    noStroke();
    fill(80, 160, 220);
    circle(220, 0, 56);
    pop();

    fill(...COLORS.TEXT);
    textAlign(CENTER, CENTER);
    textSize(72);
    text(APP_TITLE, DESIGN_WIDTH / 2, 820);

    fill(...COLORS.ACCENT);
    textSize(36);
    text(APP_SUBTITLE, DESIGN_WIDTH / 2, 900);

    fill(...COLORS.TEXT_DIM);
    textSize(28);
    text(APP_AUTHOR, DESIGN_WIDTH / 2, 970);

    drawingContext.globalAlpha = 1;
    pop();

    if (this.startButton) {
      this.startButton.draw();
    }
    if (this.infoButton) {
      this.infoButton.draw();
    }
  }

  exit() {
    this.game.tweens.killTweensOf(this.ui);
    if (this.startButton) {
      this.game.tweens.killTweensOf(this.startButton);
    }
    if (this.infoButton) {
      this.game.tweens.killTweensOf(this.infoButton);
    }
    this.startButton = null;
    this.infoButton = null;
    console.info('[IntroState] exit');
  }

  pointerPressed(x, y) {
    if (this._exiting) {
      return;
    }
    if (this.startButton && this.startButton.pointerPressed(x, y)) {
      return;
    }
    if (this.infoButton && this.infoButton.pointerPressed(x, y)) {
      return;
    }
  }

  pointerReleased(x, y) {
    if (this._exiting) {
      return;
    }
    if (this.startButton && this.startButton.pointerReleased(x, y)) {
      return;
    }
    if (this.infoButton && this.infoButton.pointerReleased(x, y)) {
      return;
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

    const buttons = [this.startButton, this.infoButton];
    for (const btn of buttons) {
      if (btn) {
        btn.enabled = false;
      }
    }

    let pending = buttons.filter(Boolean).length;
    const done = () => {
      pending -= 1;
      if (pending <= 0) {
        this.game.stateManager.changeTo(nextId);
      }
    };

    for (const btn of buttons) {
      if (!btn) {
        continue;
      }
      this.game.tweens.animate(btn, { alpha: 0, y: btn.y + 30 }, 0.25, {
        onComplete: done,
      });
    }
    this.game.tweens.animate(this.ui, { alpha: 0 }, 0.25);
  }
}
