/**
 * InfoState
 * Ayuda + créditos unificados (contenido provisional).
 */
class InfoState extends BaseState {
  constructor(game) {
    super(game);
    this.backButton = null;
    this._exiting = false;
    this.ui = { alpha: 0 };
  }

  enter() {
    this._exiting = false;
    this.game.tweens.killAll();
    this.ui.alpha = 0;

    this.backButton = new Button({
      game: this.game,
      x: DESIGN_WIDTH / 2,
      y: 1760,
      w: 420,
      h: 110,
      label: 'VOLVER',
      labelSize: 40,
      fillColor: [50, 60, 90],
      labelColor: COLORS.TEXT,
      onPress: () => this._goBack(),
    });
    this.backButton.alpha = 0;
    this.backButton.enabled = false;

    this.game.tweens.animate(this.ui, { alpha: 1 }, 0.4);
    this.game.tweens.animate(this.backButton, { alpha: 1 }, 0.35, {
      delay: 0.1,
      onComplete: () => {
        this.backButton.enabled = true;
      },
    });

    console.info('[InfoState] enter');
  }

  update(_dt) {}

  draw() {
    this.game.drawBackground();

    push();
    drawingContext.globalAlpha = this.ui.alpha;

    fill(...COLORS.ACCENT);
    textAlign(CENTER, CENTER);
    this.game.assets.useFont(FONTS.OUPS);
    textSize(56);
    text('INFO', DESIGN_WIDTH / 2, 180);

    fill(...COLORS.TEXT);
    textAlign(LEFT, TOP);
    textSize(30);
    const helpLines = [
      'Cómo jugar',
      '',
      '• La Tierra gira alrededor del Sol',
      '  al ritmo de la música.',
      '',
      '• Pepe (Norte) y Melisa (Sur)',
      '  acompañan la rotación del planeta.',
      '',
      '• Mezclá los instrumentos con',
      '  los faders de volumen.',
      '',
      '• Reproducí, pausá o detené',
      '  con los controles centrales.',
    ];
    let y = 260;
    for (const line of helpLines) {
      if (line === 'Cómo jugar') {
        fill(...COLORS.ACCENT);
        this.game.assets.useFont(FONTS.COCOGOOSE);
        textSize(34);
      } else {
        fill(...COLORS.TEXT);
        this.game.assets.useFont(FONTS.ROTUNDA);
        textSize(28);
      }
      text(line, 120, y);
      y += line === '' ? 18 : 40;
    }

    y += 36;
    fill(...COLORS.ACCENT);
    this.game.assets.useFont(FONTS.COCOGOOSE);
    textSize(34);
    text('Créditos', 120, y);
    y += 56;
    fill(...COLORS.TEXT);
    this.game.assets.useFont(FONTS.COCOGOOSE);
    textSize(30);
    text(APP_TITLE, 120, y);
    y += 42;
    fill(...COLORS.TEXT_DIM);
    this.game.assets.useFont(FONTS.ROTUNDA);
    textSize(26);
    text(APP_SUBTITLE + ' — ' + APP_AUTHOR, 120, y);
    y += 40;
    text('Música, astronomía y exploración sonora', 120, y);

    drawingContext.globalAlpha = 1;
    pop();

    if (this.backButton) {
      this.backButton.draw();
    }
  }

  exit() {
    this.game.tweens.killTweensOf(this.ui);
    if (this.backButton) {
      this.game.tweens.killTweensOf(this.backButton);
    }
    this.backButton = null;
    console.info('[InfoState] exit');
  }

  pointerPressed(x, y) {
    if (this._exiting) {
      return;
    }
    if (this.backButton) {
      this.backButton.pointerPressed(x, y);
    }
  }

  pointerReleased(x, y) {
    if (this._exiting) {
      return;
    }
    if (this.backButton) {
      this.backButton.pointerReleased(x, y);
    }
  }

  _goBack() {
    if (this._exiting) {
      return;
    }
    this._exiting = true;
    this.game.audio.play(AUDIO_KEYS.CLIC);
    this.backButton.enabled = false;
    this.game.tweens.animate(this.ui, { alpha: 0 }, 0.2);
    this.game.tweens.animate(this.backButton, { alpha: 0 }, 0.2, {
      onComplete: () => this.game.stateManager.changeTo(STATES.INTRO),
    });
  }
}
