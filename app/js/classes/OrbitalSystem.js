/**
 * OrbitalSystem
 * Sol + Tierra en órbita elíptica sincronizada al progreso musical (0–1).
 * La Tierra además gira sobre su eje (EARTH_SPINS_PER_ORBIT vueltas por órbita)
 * vía RotatingPlanet (capas + scroll de continentes).
 * Pepe (Norte) y Melisa (Sur) acompañan esa rotación siempre de frente (billboard)
 * y pasan por detrás del disco de la Tierra según la profundidad 2D.
 *
 * Capa de información (toggle): meses, estaciones, SOL, NORTE/SUR.
 * Marzo = progreso 0.
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
    this.tamSol = 340;
    this.tamTierra = 200; 
    this.orbitW = DESIGN_WIDTH * 0.82;
    this.orbitH = this.h * 0.68;
    /** Progreso musical cacheado (para oclusión Sol/Tierra). */
    this.progreso = 0;
    /** Alto de dibujo de los personajes (billboard). */
    this.charH = 82;

    /** Capa de etiquetas pedagógicas (meses / estaciones / polos / sol). */
    this.showInfo = false;

    /** Drag vertical → vista lateral (orbitH). */
    this._draggingView = false;
    this._dragStartY = 0;
    this._dragStartOrbitH = this.orbitH;

    this._orbitHMin = this.h * 0.05;
    this._orbitHMax = this.h * 0.68;

    /** Campo de estrellas (coords locales al centro orbital). */
    this._stars = this._buildStarfield();

    /** Tierra por capas (back / continents scroll / front). */
    this.planet = new RotatingPlanet(game, {
      continentsKey: 'earth_continents',
      diameter: this.tamTierra,
    });
  }

  /**
   * Estrellas fijas: más densas hacia arriba; depth para paralaje.
   * El rango vertical incluye margen de paralaje (arriba/abajo) para no
   * dejar huecos al trasladar el campo.
   * @returns {{x:number,yBase:number,size:number,alpha:number,depth:number}[]}
   */
  _buildStarfield() {
    const stars = [];
    let seed = 7919;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const halfH = this.h / 2;
    this._starShiftBase = this.h * 0.42;
    const maxShift = this._starShiftBase * 1.4;
    const yTop = -halfH - maxShift;
    const yBot = halfH + maxShift;
    const spanY = yBot - yTop;
    const count = 240;

    for (let i = 0; i < count; i += 1) {
      // uy∈[0,1] sesgado al 0 → más densidad arriba (incluye zona offscreen)
      const uy = Math.pow(rnd(), 1.55);
      const x = (rnd() - 0.5) * DESIGN_WIDTH * 0.96;
      const yBase = yTop + uy * spanY;
      stars.push({
        x,
        yBase,
        size: 1.1 + rnd() * 2.4,
        alpha: 70 + rnd() * 150,
        depth: 0.3 + rnd() * 1.0,
      });
    }
    return stars;
  }

  /**
   * Hitbox del bloque orbital (para tilt de vista).
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  contains(px, py) {
    return (
      px >= 0 &&
      px <= DESIGN_WIDTH &&
      py >= this.y &&
      py <= this.y + this.h
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
    this._draggingView = true;
    this._dragStartY = py;
    this._dragStartOrbitH = this.orbitH;
    return true;
  }

  /**
   * Arrastre vertical: achica/agranda orbitH (vista lateral ↔ frontal).
   * @param {number} _px
   * @param {number} py
   * @returns {boolean}
   */
  pointerDragged(_px, py) {
    if (!this._draggingView) {
      return false;
    }
    const minH = this._orbitHMin;
    const maxH = this._orbitHMax;
    const span = maxH - minH;
    // Dedo abajo → más lateral (orbitH menor)
    const dy = py - this._dragStartY;
    this.orbitH = constrain(
      this._dragStartOrbitH - dy * (span / (this.h * 0.55)),
      minH,
      maxH
    );
    return true;
  }

  pointerReleased() {
    this._draggingView = false;
  }

  pointerCancel() {
    this._draggingView = false;
  }

  /**
   * Ángulo orbital para un progreso 0–1 (marzo = 0).
   * @param {number} progreso
   * @returns {number}
   */
  _orbitAngle(progreso) {
    return -progreso * TWO_PI + HALF_PI + PI * 0.125;
  }

  /**
   * @param {number} progreso 0–1
   */
  update(progreso) {
    this.progreso = constrain(progreso, 0, 1);
    this.angulo = this._orbitAngle(this.progreso);
    // Vueltas de eje por órbita (no escala 365)
    this.spin = this.progreso * EARTH_SPINS_PER_ORBIT * TWO_PI;
    // Textura: misma fase que el giro + offset inicial (meridiano de frente en t=0)
    this.planet.setSpin(-(this.spin + EARTH_SPIN_OFFSET));
    this.planet.setDiameter(this.tamTierra);
  }

  draw() {
    push();
    translate(DESIGN_WIDTH / 2, this.y + this.h / 2);

    this._drawStars();

    // Órbita siempre sutil; se refuerza con la capa de información
    this._drawOrbitLine(this.showInfo);
    if (this.showInfo) {
      this._drawInfoLabels();
    }

    const x = (this.orbitW / 2) * Math.cos(this.angulo);
    const y = (this.orbitH / 2) * Math.sin(this.angulo);

    // Detrás del Sol entre 0.25 y 0.75 del progreso orbital
    const earthBehindSun = this.progreso >= 0.25 && this.progreso <= 0.75;
    if (earthBehindSun) {
      this._drawEarthWithCharacters(x, y);
      this._drawSun();
    } else {
      this._drawSun();
      this._drawEarthWithCharacters(x, y);
    }

    pop();
  }

  /**
   * Estrellas: al achicar orbitH se trasladan hacia abajo (paralaje inverso),
   * sin comprimir el alto del campo.
   */
  _drawStars() {
    const span = Math.max(1, this._orbitHMax - this._orbitHMin);
    // 0 = orbitH máximo (vista frontal); 1 = mínimo (vista lateral)
    const edge = constrain((this._orbitHMax - this.orbitH) / span, 0, 1);
    const shiftBase = this._starShiftBase || this.h * 0.42;
    const halfH = this.h / 2;
    // Margen de dibujo (estrellas que entran desde fuera del bloque)
    const yMin = -halfH - 4;
    const yMax = halfH + 4;

    noStroke();
    for (let i = 0; i < this._stars.length; i += 1) {
      const s = this._stars[i];
      // Paralaje inverso: al achicar orbitH, las estrellas bajan
      const y = s.yBase + edge * shiftBase * (0.55 + s.depth * 0.85);
      if (y < yMin || y > yMax) {
        continue;
      }
      fill(255, 255, 255, s.alpha);
      circle(s.x, y, s.size);
    }
  }

  /**
   * @param {boolean} reinforced Capa info activa
   */
  _drawOrbitLine(reinforced) {
    noFill();
    strokeCap(ROUND);
    if (reinforced) {
      stroke(255, 255, 255, 95);
      strokeWeight(4);
      drawingContext.setLineDash([16, 12]);
    } else {
      stroke(255, 255, 255, 26);
      strokeWeight(2);
      drawingContext.setLineDash([8, 16]);
    }
    ellipse(0, 0, this.orbitW, this.orbitH);
    drawingContext.setLineDash([]);
  }

  _drawSun() {
    const img = this.game.assets.getImage('sol');
    if (img && img.width > 1) {
      imageMode(CENTER);
      image(img, 0, 0, this.tamSol, this.tamSol);
    } else {
      noStroke();
      fill(255, 210, 40, 70);
      circle(0, 0, this.tamSol * 1.55);
      fill(255, 200, 0);
      circle(0, 0, this.tamSol);
    }

    if (this.showInfo) {
      fill(...COLORS.TEXT);
      textAlign(CENTER, CENTER);
      this.game.assets.useFont(FONTS.OUPS);
      textSize(28);
      text('SOL', 0, 0);
    }
  }

  /**
   * Meses sobre la órbita + estaciones en el perímetro
   * (Norte bien arriba / Sur bien abajo en pantalla).
   * Equinoccios/solsticios: mar=0, jun=0.25, sep=0.5, dic=0.75.
   */
  _drawInfoLabels() {
    const months = [
      'MARZO',
      'ABRIL',
      'MAYO',
      'JUNIO',
      'JULIO',
      'AGOSTO',
      'SEPTIEMBRE',
      'OCTUBRE',
      'NOVIEMBRE',
      'DICIEMBRE',
      'ENERO',
      'FEBRERO',
    ];
    const seasons = [
      { p: 0, norte: 'PRIMAVERA', sur: 'OTOÑO' },
      { p: 0.25, norte: 'VERANO', sur: 'INVIERNO' },
      { p: 0.5, norte: 'OTOÑO', sur: 'PRIMAVERA' },
      { p: 0.75, norte: 'INVIERNO', sur: 'VERANO' },
    ];

    const rx = this.orbitW / 2;
    const ry = this.orbitH / 2;
    // Separación vertical fuerte respecto al perímetro (pantalla)
    const seasonLift = 48;

    noStroke();
    textAlign(CENTER, CENTER);

    // Meses un poco fuera de la elipse
    this.game.assets.useFont(FONTS.COCOGOOSE);
    fill(...COLORS.TEXT);
    textSize(20);
    for (let i = 0; i < 12; i += 1) {
      const a = this._orbitAngle(i / 12);
      const mx = rx * 1.14 * Math.cos(a);
      const my = ry * 1.14 * Math.sin(a);
      text(months[i], mx, my);
    }

    // Estaciones (destaque) sobre el perímetro: Norte arriba, Sur abajo
    this.game.assets.useFont(FONTS.OUPS);
    textSize(26);
    for (const s of seasons) {
      const a = this._orbitAngle(s.p);
      const sx = rx * Math.cos(a);
      const sy = ry * Math.sin(a);
      fill(...COLORS.ACCENT);
      text(s.norte, sx, sy - seasonLift);
      fill(140, 190, 255);
      text(s.sur, sx, sy + seasonLift);
    }
  }

  /**
   * Tierra + eje + personajes.
   * El planeta (silueta + texturas) se dibuja con la inclinación del eje;
   * los personajes siguen billboard (siempre de frente).
   * @param {number} x
   * @param {number} y
   */
  _drawEarthWithCharacters(x, y) {
    const tilt = -radians(EARTH_AXIS_TILT_DEG);
    const amp = this.tamTierra * 0.38;
    const spinPepe = this.spin + PEPE_LONGITUDE_OFFSET;
    const spinMelisa = this.spin + MELISA_LONGITUDE_OFFSET;
    // Latitud más baja: alejados de los polos (antes 0.52 ≈ borde)
    const latNorte = -this.tamTierra * 0.28;
    const latSur = this.tamTierra * 0.28;

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

    // Marco del eje inclinado: personajes detrás + planeta + eje + delante
    push();
    rotate(tilt);

    if (pepe.behind) {
      this._drawCharacter('p_pepe', pepe.x, pepe.y, tilt);
    }
    if (melisa.behind) {
      this._drawCharacter('p_melisa', melisa.x, melisa.y, tilt);
    }

    // Planeta inclinado (clip + capas respetan el tilt)
    this.planet.draw(0, 0);

    // Eje: dos stubs discontinuos fuera de la circunferencia (N / S)
    this._drawAxisStubs(tilt);

    if (!pepe.behind) {
      this._drawCharacter('p_pepe', pepe.x, pepe.y, tilt);
    }
    if (!melisa.behind) {
      this._drawCharacter('p_melisa', melisa.x, melisa.y, tilt);
    }

    pop();

    pop(); // earth pos
  }

  /**
   * Eje terrestre como dos segmentos fuera del disco:
   *   ---- · ---- · ----   (planeta)   ---- · ---- · ----
   * No atraviesa la silueta. Con showInfo: etiquetas NORTE / SUR.
   * @param {number} tilt
   */
  _drawAxisStubs(tilt) {
    const r = this.tamTierra / 2;
    const clearance = 5;
    const stubLen = this.tamTierra * 0.45;
    const yN0 = -r - clearance;
    const yN1 = yN0 - stubLen;
    const yS0 = r + clearance;
    const yS1 = yS0 + stubLen;

    stroke(255, 210);
    strokeWeight(4);
    strokeCap(ROUND);
    // dash · dash · dash
    drawingContext.setLineDash([11, 5, 2.5, 5]);
    line(0, yN0, 0, yN1);
    line(0, yS0, 0, yS1);
    drawingContext.setLineDash([]);

    if (this.showInfo) {
      const labelGap = 18;
      this._drawAxisPoleLabel('NORTE', 0, yN1 - labelGap, tilt);
      this._drawAxisPoleLabel('SUR', 0, yS1 + labelGap, tilt);
    }
  }

  /**
   * Etiqueta de polo, siempre legible (billboard).
   * @param {string} label
   * @param {number} lx
   * @param {number} ly
   * @param {number} tilt
   */
  _drawAxisPoleLabel(label, lx, ly, tilt) {
    push();
    translate(lx, ly);
    rotate(-tilt);
    noStroke();
    fill(...COLORS.TEXT);
    textAlign(CENTER, CENTER);
    this.game.assets.useFont(FONTS.OUPS);
    textSize(20);
    text(label, 0, 0);
    pop();
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
