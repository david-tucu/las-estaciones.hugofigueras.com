/**
 * AssetManager
 * Carga y centraliza todas las rutas de assets.
 * Ninguna otra clase debe hardcodear rutas de imágenes/audio/fuentes.
 */
class AssetManager {
  constructor() {
    /** @type {Map<string, any>} */
    this.images = new Map();

    /** @type {Map<string, p5.SoundFile>} */
    this.sounds = new Map();

    /** @type {Map<string, p5.Font>} */
    this.fonts = new Map();

    /**
     * Manifiesto único de assets de UI / overlays.
     * Pistas musicales: TRACK_CATALOG. Tiras de partitura: LYRIC_MAP_CATALOG.
     */
    this.manifest = {
      images: {
        // Partitura / letra (strips)
        parte_norte: 'assets/images/parte-norte.png',
        parte_sur: 'assets/images/parte-sur.png',
        armadura: 'assets/images/armadura.png',
        fundido: 'assets/images/fundido.png',
        // Personajes en la Tierra (Norte / Sur)
        p_pepe: 'assets/images/p_pepe.png',
        p_melisa: 'assets/images/p_melisa.png',
        // Futuro toggle letra:
        // letra_norte: 'assets/images/letra-norte.png',
        // letra_sur: 'assets/images/letra-sur.png',
      },
      sounds: {
        // Opcional en Fase A (si falta, play() no hace nada)
        // [AUDIO_KEYS.CLIC]: 'assets/audio/ui/clic.mp3',
      },
      fonts: {
        // main: 'assets/fonts/….ttf',
      },
    };

    /** Indica si se usaron placeholders por assets faltantes. */
    this.usedPlaceholders = false;

    /** Claves de imagen cuya carga falló (placeholders en finalize). */
    this._failedImageKeys = new Set();
  }

  /**
   * Debe llamarse desde preload().
   */
  loadAll() {
    this._loadImages();
    this._loadTrackCatalogSounds();
    this._loadSounds();
    this._loadFonts();
  }

  /**
   * Sustituye solo las imágenes que fallaron al cargar.
   */
  finalize() {
    for (const key of this._failedImageKeys) {
      console.warn(`[AssetManager] Placeholder para: ${key}`);
      this.images.set(key, this._createImagePlaceholder(key));
      this.usedPlaceholders = true;
    }
    this._failedImageKeys.clear();
  }

  /**
   * @param {string} key
   * @returns {p5.Image|p5.Graphics|null}
   */
  getImage(key) {
    return this.images.get(key) || null;
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  hasImage(key) {
    const img = this.images.get(key);
    return Boolean(img && img.width && img.width > 1);
  }

  /**
   * @param {string} key
   * @returns {p5.SoundFile|null}
   */
  getSound(key) {
    return this.sounds.get(key) || null;
  }

  /**
   * @param {string} key
   * @returns {p5.Font|null}
   */
  getFont(key) {
    return this.fonts.get(key) || null;
  }

  /**
   * Clave interna de audio para una pista del catálogo.
   * @param {string} trackId
   * @returns {string}
   */
  trackSoundKey(trackId) {
    return `track:${trackId}`;
  }

  /**
   * @param {string} trackId
   * @returns {p5.SoundFile|null}
   */
  getTrackSound(trackId) {
    return this.getSound(this.trackSoundKey(trackId));
  }

  // ---------------------------------------------------------------------------
  // Privados
  // ---------------------------------------------------------------------------

  _loadImages() {
    const entries = Object.entries(this.manifest.images);
    for (const [key, path] of entries) {
      this._loadImageEntry(key, path);
    }
  }

  /**
   * Carga cada stem declarado en TRACK_CATALOG.
   */
  _loadTrackCatalogSounds() {
    if (typeof TRACK_CATALOG === 'undefined' || !TRACK_CATALOG.length) {
      console.warn('[AssetManager] TRACK_CATALOG vacío o no cargado.');
      return;
    }
    const dir =
      typeof AUDIO_ASSETS_DIR !== 'undefined' ? AUDIO_ASSETS_DIR : 'assets/audio/';
    for (const track of TRACK_CATALOG) {
      if (!track || !track.id || !track.file) {
        continue;
      }
      const key = this.trackSoundKey(track.id);
      this._loadSoundEntry(key, `${dir}${track.file}`);
    }
    console.info(
      `[AssetManager] Pistas del catálogo: ${TRACK_CATALOG.length}`
    );
  }

  /**
   * @param {string} key
   * @param {string} path
   */
  _loadImageEntry(key, path) {
    try {
      const img = loadImage(
        path,
        () => {},
        () => {
          console.warn(
            `[AssetManager] Imagen no encontrada: ${path}. Se usará placeholder.`
          );
          this._failedImageKeys.add(key);
          this.usedPlaceholders = true;
        }
      );
      this.images.set(key, img);
    } catch (err) {
      console.warn(`[AssetManager] Error cargando imagen ${key}:`, err);
      this._failedImageKeys.add(key);
      this.usedPlaceholders = true;
    }
  }

  _loadSounds() {
    const entries = Object.entries(this.manifest.sounds);
    for (const [key, path] of entries) {
      this._loadSoundEntry(key, path);
    }
  }

  /**
   * @param {string} key
   * @param {string} path
   */
  _loadSoundEntry(key, path) {
    try {
      const sound = loadSound(
        path,
        () => {},
        (err) => {
          console.warn(`[AssetManager] Audio no encontrado: ${path}.`, err);
          this.sounds.set(key, null);
          this.usedPlaceholders = true;
        }
      );
      this.sounds.set(key, sound);
    } catch (err) {
      console.warn(`[AssetManager] Error cargando audio ${key}:`, err);
      this.sounds.set(key, null);
      this.usedPlaceholders = true;
    }
  }

  _loadFonts() {
    const entries = Object.entries(this.manifest.fonts);
    for (const [key, path] of entries) {
      try {
        const font = loadFont(
          path,
          () => {},
          () => {
            console.warn(`[AssetManager] Fuente no encontrada: ${path}.`);
            this.fonts.set(key, null);
            this.usedPlaceholders = true;
          }
        );
        this.fonts.set(key, font);
      } catch (err) {
        console.warn(`[AssetManager] Error cargando fuente ${key}:`, err);
        this.fonts.set(key, null);
        this.usedPlaceholders = true;
      }
    }
  }

  /**
   * Placeholder gráfico identificable por clave.
   * @param {string} key
   * @returns {p5.Graphics}
   */
  _createImagePlaceholder(key) {
    const isStrip = key.startsWith('parte_') || key.startsWith('letra_');
    const w = isStrip ? 640 : 320;
    const h = isStrip ? 80 : 160;
    const g = createGraphics(w, h);
    g.pixelDensity(1);
    g.background(40, 48, 70);
    g.noStroke();
    g.fill(255, 204, 0);
    g.rect(6, 6, w - 12, h - 12, 10);
    g.fill(30, 24, 8);
    g.textAlign(CENTER, CENTER);
    g.textSize(Math.min(22, w / 10));
    g.text(key, w / 2, h / 2);
    return g;
  }
}
