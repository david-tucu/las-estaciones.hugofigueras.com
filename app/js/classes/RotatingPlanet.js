/**
 * RotatingPlanet
 * Planeta 2D: océanos y atmósfera dibujados (procedural) + textura de
 * continentes que scrollea dentro de un clip circular.
 * Sin earth_back / earth_front (PNG); solo earth_continents.
 */
class RotatingPlanet {
  /**
   * @param {Game} game
   * @param {object} config
   * @param {string} config.continentsKey
   * @param {number} [config.diameter] Diámetro en coords de diseño
   * @param {number} [config.x] Centro X local (default 0)
   * @param {number} [config.y] Centro Y local (default 0)
   */
  constructor(game, config) {
    this.game = game;
    this.continentsKey = config.continentsKey;
    this.diameter = config.diameter || 100;
    this.x = config.x !== undefined ? config.x : 0;
    this.y = config.y !== undefined ? config.y : 0;

    /** Ángulo de rotación propia (radianes). */
    this.spin = 0;
  }

  /**
   * @param {number} diameter
   */
  setDiameter(diameter) {
    this.diameter = diameter;
  }

  /**
   * @param {number} spin Ángulo en radianes (2π = una vuelta de textura)
   */
  setSpin(spin) {
    this.spin = spin;
  }

  /**
   * Dibuja el planeta centrado en (x, y) locales al transform actual,
   * o en this.x/this.y si no se pasan argumentos.
   * @param {number} [x]
   * @param {number} [y]
   */
  draw(x, y) {
    const cx = x !== undefined ? x : this.x;
    const cy = y !== undefined ? y : this.y;
    const d = this.diameter;
    const r = d / 2;

    const continents = this.game.assets.getImage(this.continentsKey);

    push();
    translate(cx, cy);

    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(0, 0, r, 0, Math.PI * 2);
    drawingContext.closePath();
    drawingContext.clip();

    // 1) Océanos (procedural)
    this._drawOcean(d);

    // 2) Continentes (scroll)
    this._drawContinentsScrolling(continents, d, r);

    // 3) Atmósfera / sombra (procedural)
    this._drawAtmosphere(d, r);

    drawingContext.restore();
    pop();
  }

  /**
   * @param {number} d
   */
  _drawOcean(d) {
    noStroke();
    fill(30, 110, 200);
    circle(0, 0, d);
    fill(20, 80, 170, 90);
    ellipse(-d * 0.15, -d * 0.1, d * 0.55, d * 0.4);
  }

  /**
   * Viñeta + sombra lateral suave.
   * @param {number} d
   * @param {number} r
   */
  _drawAtmosphere(d, r) {
    noStroke();
    // Brillo suave (lado “iluminado”)
    fill(255, 255, 255, 28);
    ellipse(-r * 0.28, -r * 0.28, d * 0.55, d * 0.5);
    // Sombra del terminador
    fill(0, 0, 40, 55);
    arc(0, 0, d, d, -HALF_PI * 0.15, PI + HALF_PI * 0.15, PIE);
  }

  /**
   * Desplaza la textura de continentes dentro del clip.
   * Una vuelta de spin (2π) = un ancho completo de textura.
   * @param {p5.Image|p5.Graphics|null} img
   * @param {number} d Diámetro
   * @param {number} r Radio
   */
  _drawContinentsScrolling(img, d, r) {
    if (!img || img.width <= 1) {
      return;
    }

    const texH = d;
    const texW = img.width * (texH / img.height);
    const u = ((this.spin / TWO_PI) % 1 + 1) % 1;
    const offset = -u * texW;

    imageMode(CORNER);
    let x0 = offset;
    while (x0 > -r) {
      x0 -= texW;
    }
    for (let x = x0; x < r; x += texW) {
      image(img, x, -texH / 2, texW, texH);
    }
  }
}
