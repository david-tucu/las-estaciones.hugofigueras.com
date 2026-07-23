/**
 * Constantes globales de Las Estaciones.
 * Único lugar para valores de configuración fácilmente modificables.
 */

/** Resolución de diseño (coordenadas lógicas). Formato vertical totem / webapp. */
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;

/** Título completo de la experiencia (UI). */
const APP_TITLE = 'Las Estaciones';
const APP_SUBTITLE = 'Multijuego';
const APP_AUTHOR = 'Hugo Figueras';
const APP_FULL_TITLE = 'Las Estaciones — Multijuego — Hugo Figueras';

/** Identificadores de estados de la máquina. */
const STATES = Object.freeze({
  INTRO: 'intro',
  PLAY: 'play',
  INFO: 'info',
});

/**
 * Claves de audio de UI / SFX (coinciden con AssetManager).
 * Las pistas musicales viven en TRACK_CATALOG (js/data/TrackCatalog.js).
 */
const AUDIO_KEYS = Object.freeze({
  CLIC: 'sfx_clic',
  // Preparado para ampliar:
  // UI_CONFIRM: 'sfx_confirm',
});

/** Paleta provisional (look & feel aún no definitivo). */
const COLORS = Object.freeze({
  LETTERBOX: [15, 15, 18],
  BG: [18, 22, 36],
  BG_ALT: [24, 30, 48],
  ACCENT: [255, 204, 0],
  TEXT: [240, 244, 255],
  TEXT_DIM: [160, 170, 190],
  BUTTON_FILL: [255, 200, 40],
  BUTTON_LABEL: [40, 30, 10],
  OVERLAY: [10, 10, 14],
});

/**
 * Layout de Play en coordenadas de diseño 1080×1920.
 * Ajustar acá sin tocar la lógica de clases.
 */
const LAYOUT = Object.freeze({
  NAV_Y: 90,
  NAV_BAR_H: 140,
  /** Bloque orbital ampliado. */
  ORBIT_Y: 130,
  ORBIT_H: 640,
  TRANSPORT_Y: 800,
  /** Franja de partituras: más baja y más alta. */
  LYRIC_NORTE_Y: 880,
  LYRIC_SUR_Y: 1060,
  LYRIC_H: 112,
  /**
   * Factor extra de escala de las tiras (ancho + avance + overlays).
   * escala final = (LYRIC_H / alto_nativo_80) * LYRIC_SCALE_FACTOR
   * 1 = solo la proporción por alto; >1 agranda más; <1 reduce.
   */
  LYRIC_SCALE_FACTOR: 1.5,
  /**
   * Faders más abajo (sin botón INICIO inferior) y ~20% más chicos
   * (altura de pista ≈ 512 vs 640 previos).
   */
  FADER_TOP: 1360,
  FADER_BOTTOM: 1872,
  /** Escala visual de knobs / trazo del fader (1 = original). */
  FADER_SCALE: 0.8,
  /** Posición X del playhead sobre las tiras (fracción del ancho). */
  PLAYHEAD_X_FACTOR: 0.3,
});

/**
 * Vueltas de la Tierra sobre su eje por cada órbita completa (progreso 0→1).
 * No es escala real 365: es un valor pedagógico / visual.
 */
const EARTH_SPINS_PER_ORBIT = 20;

/** Inclinación del eje terrestre (grados). */
const EARTH_AXIS_TILT_DEG = 23.5;

/**
 * Desfase de longitud (radianes) de Pepe (Norte) respecto al meridiano base.
 * Positivo = más avanzado en el giro.
 */
const PEPE_LONGITUDE_OFFSET = 1.65;

/** Volumen inicial de cada fader (0–1). */
const FADER_DEFAULT_VOLUME = 0.35;

/** Suavizado de volumen hacia el valor del fader (por frame ~60fps). */
const VOLUME_LERP = 0.08;
