/**
 * Catálogo de sincronización letra / partitura.
 *
 * t: tiempo normalizado de la canción (0 → 1)
 * x: posición en píxeles sobre la tira en resolución NATIVA (sin escala UI)
 *
 * Escala de dibujo = LAYOUT.LYRIC_H / LYRIC_STRIP_HEIGHT
 * (ancho, avance y playhead usan la misma escala).
 *
 * Toggle partitura ↔ letra: cuando existan assets de letra,
 * agregar claves imageKeyScore / imageKeyLyrics y consumirlas desde PlayState.
 */

/** Ancho nativo de las tiras PNG (parte-norte / parte-sur). */
const LYRIC_STRIP_WIDTH = 3200;

/** Alto nativo de las tiras PNG (y de armadura/fundido). */
const LYRIC_STRIP_HEIGHT = 80;

/**
 * @typedef {object} LyricKeyframe
 * @property {number} t
 * @property {number} x
 */

/**
 * @typedef {object} LyricTrackMap
 * @property {string} id
 * @property {string} imageKeyScore   Clave en AssetManager (partitura)
 * @property {string} [imageKeyLyrics] Clave futura para modo letra
 * @property {LyricKeyframe[]} map
 */

/** @type {LyricTrackMap[]} */
const LYRIC_MAP_CATALOG = [
  {
    id: 'norte',
    imageKeyScore: 'parte_norte',
    // imageKeyLyrics: 'letra_norte', // TODO cuando existan assets
    map: [
      { t: 0.0, x: LYRIC_STRIP_WIDTH / 2 + 16 },
      { t: 1.0, x: LYRIC_STRIP_WIDTH / 2 + LYRIC_STRIP_WIDTH + 22 },
    ],
  },
  {
    id: 'sur',
    imageKeyScore: 'parte_sur',
    // imageKeyLyrics: 'letra_sur',
    map: [
      { t: 0.0, x: 16 },
      { t: 1.0, x: LYRIC_STRIP_WIDTH + 22 },
    ],
  },
];

/**
 * @param {string} id
 * @returns {LyricTrackMap|null}
 */
function getLyricMapById(id) {
  for (const item of LYRIC_MAP_CATALOG) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
}
