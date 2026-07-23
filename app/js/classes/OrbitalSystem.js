/**
 * OrbitalSystem
 * Sol + Tierra en órbita elíptica sincronizada al progreso musical (0–1).
 * La Tierra además gira sobre su eje (EARTH_SPINS_PER_ORBIT vueltas por órbita).
 * Pepe (Norte) y Melisa (Sur) acompañan esa rotación siempre de frente (billboard)
 * y pasan por detrás del disco de la Tierra según la profundidad 2D.
 */
class OrbitalSystem {
  /**
   * @param {Game} game
   * @param {number} y Top del bloque
   * @param {number} h Alto del bloque
   */
  constructor(game, y, h) {
    this.game = game;
    this.y = y;
    this.h = h;
    this.angulo = 0;
    /** Ángulo de rotación propia (eje). */
    this.spin = 0;
    // +20% respecto a la escala previa (sol 120, tierra 88, chars 64)
    this.tamSol = 144;
    this.tamTierra = 106;
    this.orbitW = DESIGN_WIDTH * 0.88;
    this.orbitH = this.h * 0.78;
    /** Alto de dibujo de los personajes (billboard). */
    this.charH = 77;
  }

  /**
   * @param {number} progreso 0–1
   */
  update(progreso) {
    // Corrección del prototipo: marzo no cae exacto en 270°
    this.angulo = -progreso * TWO_PI + HALF_PI + PI * 0.125;
    // Vueltas de eje por órbita (no escala 365)
    this.spin = progreso * EARTH_SPINS_PER_ORBIT * TWO_PI;
  }

  draw() {
    push();
    translate(DESIGN_WIDTH / 2, this.y + this.h / 2);

    noFill();
    stroke(255, 255, 255, 45);
    strokeWeight(2);
    ellipse(0, 0, this.orbitW, this.orbitH);

    const x = (this.orbitW / 2) * Math.cos(this.angulo);
    const y = (this.orbitH / 2) * Math.sin(this.angulo);

    // Mitad superior de la elipse (y < 0) = detrás del Sol → dibujar Tierra primero
    const earthBehindSun = y < 0;
    if (earthBehindSun) {
      this._drawEarthWithCharacters(x, y);
      this._drawSun();
    } else {
      this._drawSun();
      this._drawEarthWithCharacters(x, y);
    }

    pop();
  }

  _drawSun() {
    noStroke();
    fill(255, 210, 40, 70);
    circle(0, 0, this.tamSol * 1.55);
    fill(255, 200, 0);
    circle(0, 0, this.tamSol);
  }

  /**
   * Tierra + eje + personajes (orden: detrás → planeta → frente).
   * @param {number} x
   * @param {number} y
   */
  _drawEarthWithCharacters(x, y) {
    const tilt = -radians(EARTH_AXIS_TILT_DEG);
    const amp = this.tamTierra * 0.38;
    const spinPepe = this.spin + PEPE_LONGITUDE_OFFSET;
    const spinMelisa = this.spin;
    const latNorte = -this.tamTierra * 0.52;
    const latSur = this.tamTierra * 0.52;

    const pepe = {
      x: amp * Math.sin(spinPepe),
      y: latNorte,
      behind: Math.cos(spinPepe) < 0,
    };
    const melisa = {
      x: amp * Math.sin(spinMelisa),
      y: latSur,
      behind: Math.cos(spinMelisa) < 0,
    };

    push();
    translate(x, y);

    push();
    rotate(tilt);

    if (pepe.behind) {
      this._drawCharacter('p_pepe', pepe.x, pepe.y, tilt);
    }
    if (melisa.behind) {
      this._drawCharacter('p_melisa', melisa.x, melisa.y, tilt);
    }

    noStroke();
    fill(40, 150, 230);
    circle(0, 0, this.tamTierra);
    stroke(255, 160);
    strokeWeight(2);
    const axisLen = this.tamTierra * 0.75;
    line(0, -axisLen, 0, axisLen);

    if (!pepe.behind) {
      this._drawCharacter('p_pepe', pepe.x, pepe.y, tilt);
    }
    if (!melisa.behind) {
      this._drawCharacter('p_melisa', melisa.x, melisa.y, tilt);
    }

    pop(); // tilt
    pop(); // earth pos
  }

  /**
   * Personaje siempre de frente (billboard).
   * Oclusión solo por orden de dibujo (sin bajar opacidad).
   * @param {string} imageKey
   * @param {number} lx
   * @param {number} ly
   * @param {number} tilt
   */
  _drawCharacter(imageKey, lx, ly, tilt) {
    const img = this.game.assets.getImage(imageKey);
    if (!img || img.width <= 1) {
      return;
    }

    const h = this.charH;
    const w = h * (img.width / img.height);

    push();
    translate(lx, ly);
    rotate(-tilt);
    imageMode(CENTER);
    image(img, 0, 0, w, h);
    pop();
  }
}
