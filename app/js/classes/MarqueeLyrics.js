/**
 * MarqueeLyrics
 * Tira de partitura/letra que scrollea según mapeo t→x del catálogo.
 *
 * El mapeo `x` vive en píxeles NATIVOS de la tira (LYRIC_STRIP_WIDTH × HEIGHT).
 * Escala UI uniforme:
 *   escala = (h / LYRIC_STRIP_HEIGHT) * scaleFactor
 * scaleFactor llega desde LAYOUT.LYRIC_SCALE_FACTOR (constants.js).
 */
class MarqueeLyrics {
  /**
   * @param {Game} game
   * @param {object} config
   * @param {string} config.imageKey
   * @param {{t:number,x:number}[]} config.map
   * @param {number} config.y
   * @param {number} config.h Alto de dibujo deseado (p. ej. LAYOUT.LYRIC_H)
   * @param {number} [config.scaleFactor] Extra desde LAYOUT.LYRIC_SCALE_FACTOR
   */
  constructor(game, config) {
    this.game = game;
    this.imageKey = config.imageKey;
    this.mapeo = config.map || [];
    this.y = config.y;
    this.h = config.h;

    this.stripW =
      typeof LYRIC_STRIP_WIDTH !== 'undefined' ? LYRIC_STRIP_WIDTH : 3200;
    this.stripH =
      typeof LYRIC_STRIP_HEIGHT !== 'undefined' ? LYRIC_STRIP_HEIGHT : 80;

    const scaleFactor =
      config.scaleFactor !== undefined && config.scaleFactor !== null
        ? config.scaleFactor
        : 1;

    /** Escala uniforme respecto al PNG nativo (mantiene proporción). */
    this.escala = (this.h / this.stripH) * scaleFactor;

    this.currentX = 0;
    this.indiceActual = 0;
    this.debug = false;
  }

  /**
   * @param {number} progreso 0–1
   */
  update(progreso) {
    if (!this.mapeo || this.mapeo.length < 2) {
      return;
    }
    progreso = constrain(progreso, 0, 0.999);

    let p1 = null;
    let p2 = null;
    for (let i = 0; i < this.mapeo.length - 1; i += 1) {
      if (progreso >= this.mapeo[i].t && progreso < this.mapeo[i + 1].t) {
        p1 = this.mapeo[i];
        p2 = this.mapeo[i + 1];
        this.indiceActual = i;
        break;
      }
    }
    if (!p1) {
      p1 = this.mapeo[this.mapeo.length - 2];
      p2 = this.mapeo[this.mapeo.length - 1];
    }

    const amt = (progreso - p1.t) / (p2.t - p1.t);
    // currentX en espacio nativo de la tira; se multiplica por escala al dibujar
    this.currentX = lerp(p1.x, p2.x, amt) - 3;
  }

  draw() {
    const img = this.game.assets.getImage(this.imageKey);
    if (!img || img.width <= 1) {
      return;
    }

    const s = this.escala;
    const playheadX = DESIGN_WIDTH * LAYOUT.PLAYHEAD_X_FACTOR;
    const drawW = this.stripW * s;
    const drawH = this.stripH * s; // === this.h
    const offsetX = playheadX - this.currentX * s;

    push();
    imageMode(CORNER);
    image(img, offsetX, this.y, drawW, drawH);

    // Tile infinito (mismo tamaño escalado)
    if (offsetX + drawW < DESIGN_WIDTH) {
      image(img, offsetX + drawW, this.y, drawW, drawH);
    }
    if (offsetX > 0) {
      image(img, offsetX - drawW, this.y, drawW, drawH);
    }

    // Playhead
    stroke(...COLORS.ACCENT);
    strokeWeight(2);
    line(playheadX, this.y - 12, playheadX, this.y + drawH + 12);

    if (this.debug) {
      push();
      translate(offsetX, this.y);
      for (let i = 0; i < this.mapeo.length; i += 1) {
        const mx = this.mapeo[i].x * s;
        stroke(0, 255, 0, 120);
        line(mx, 0, mx, drawH);
        noStroke();
        fill(0, 255, 0);
        textSize(12);
        textAlign(CENTER, TOP);
        text(nf(this.mapeo[i].t, 1, 3), mx, 4);
      }
      pop();
    }

    // Armadura + fundido (misma escala que la tira)
    const armadura = this.game.assets.getImage('armadura');
    const fundido = this.game.assets.getImage('fundido');
    if (armadura && armadura.width > 1) {
      const aw = armadura.width * s;
      const ah = armadura.height * s;
      image(armadura, 0, this.y, aw, ah);
      if (fundido && fundido.width > 1) {
        image(fundido, aw, this.y, fundido.width * s, fundido.height * s);
      }
    }

    pop();
  }
}
