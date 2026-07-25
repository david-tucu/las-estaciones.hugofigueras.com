/**
 * IntroState
 * Portada: fondo_intro + marca + CTA "A JUGAR!" + Info.
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
      y: 1480,
      w: 640,
      h: 160,
      label: 'A JUGAR!',
      labelSize: 80,
      labelOffsetY: -10,
      ctaPulse: true,
      onPress: () => this._goTo(STATES.PLAY),
    });
    this.startButton.alpha = 0;
    this.startButton.enabled = false;

    this.infoButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH / 2,
      y: 1700,
      w: 320,
      h: 96,
      label: 'INFO',
      labelSize: 44,
      labelOffsetY: -6,
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
    push();
    drawingContext.globalAlpha = this.ui.alpha;

    this._drawCoverBackground();
    this._drawAuthorBadge();
    this._drawTitles();

    drawingContext.globalAlpha = 1;
    pop();

    if (this.startButton) {
      this.startButton.draw();
    }
    if (this.infoButton) {
      this.infoButton.draw();
    }
  }

  _drawCoverBackground() {
    const img = this.game.assets.getImage('fondo_intro');
    if (img && img.width > 1) {
      imageMode(CORNER);
      // Blur sutil + luego se oscurece con overlay
      drawingContext.save();
      drawingContext.filter = 'blur(6px)';
      image(img, -8, -8, DESIGN_WIDTH + 16, DESIGN_HEIGHT + 16);
      drawingContext.filter = 'none';
      drawingContext.restore();

      noStroke();
      fill(8, 10, 18, 110);
      rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      return;
    }
    // Fallback si falta el PNG
    this.game.drawBackground();
  }

  /**
   * "Hugo Figueras" en rectángulo rojo pegado al borde superior,
   * centrado, con esquinas inferiores redondeadas.
   */
  _drawAuthorBadge() {
    const label = APP_AUTHOR;
    const badgeH = 78;
    const padX = 48;
    this.game.assets.useFont(FONTS.ROTUNDA);
    textSize(28);
    const badgeW = Math.max(360, textWidth(label) + padX * 2);
    const x = (DESIGN_WIDTH - badgeW) / 2;
    const r = 28;

    noStroke();
    fill(200, 30, 40);
    rectMode(CORNER);
    // tl, tr, br, bl — solo inferiores redondeadas
    rect(x, 0, badgeW, badgeH, 0, 0, r, r);

    fill(255);
    textAlign(CENTER, CENTER);
    text(label, DESIGN_WIDTH / 2, badgeH / 2 + 2);
  }

  _drawTitles() {
    textAlign(CENTER, CENTER);

    // Título grande (marca hero)
    this.game.assets.useFont(FONTS.COCOGOOSE);
    fill(...COLORS.TEXT);
    textSize(96);
    text(APP_TITLE, DESIGN_WIDTH / 2, 820);

    // Subtítulo destaque
    this.game.assets.useFont(FONTS.OUPS);
    fill(...COLORS.ACCENT);
    textSize(42);
    text('MULTIJUEGO', DESIGN_WIDTH / 2, 930);
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
