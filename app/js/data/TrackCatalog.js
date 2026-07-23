/**
 * Catálogo de pistas musicales (stems).
 *
 * Para agregar una pista:
 * 1) Colocar el archivo en assets/audio/
 * 2) Agregar una fila acá
 * AssetManager carga todo desde este catálogo.
 */

const AUDIO_ASSETS_DIR = 'assets/audio/';

/**
 * @typedef {object} TrackItem
 * @property {string} id          Clave interna (también clave de AssetManager: track:<id>)
 * @property {string} file        Nombre de archivo en AUDIO_ASSETS_DIR
 * @property {string} label       Etiqueta UI del fader
 * @property {'voice'|'instrument'} role
 * @property {boolean} [timebase] Si true, esta pista marca el progreso (órbita / lyrics)
 * @property {boolean} [fader]    Si false, no aparece en el mezclador (default true)
 */

/** @type {TrackItem[]} */
const TRACK_CATALOG = [
  {
    id: 'norte',
    file: 'est_app_norte.mp3',
    label: 'Pepe\n(Norte)',
    role: 'voice',
  },
  {
    id: 'sur',
    file: 'est_app_sur.mp3',
    label: 'Melisa\n(Sur)',
    role: 'voice',
    timebase: true,
  },
  {
    id: 'chelo',
    file: 'est_app_chelo.mp3',
    label: 'Chelo',
    role: 'instrument',
  },
  {
    id: 'clave',
    file: 'est_app_clave.mp3',
    label: 'Clave',
    role: 'instrument',
  },
  {
    id: 'contrabajo',
    file: 'est_app_contrabajo.mp3',
    label: 'Contrabajo',
    role: 'instrument',
  },
  {
    id: 'viola',
    file: 'est_app_viola.mp3',
    label: 'Viola',
    role: 'instrument',
  },
  {
    id: 'violin1',
    file: 'est_app_violin_1.mp3',
    label: 'Violín 1',
    role: 'instrument',
  },
  {
    id: 'violin2',
    file: 'est_app_violin_2.mp3',
    label: 'Violín 2',
    role: 'instrument',
  },
];

/**
 * Orden de faders en UI (ids del catálogo).
 * Ideal: agregar pista = 1 fila en TRACK_CATALOG + 1 id acá.
 */
const FADER_ORDER = [
  'norte',
  'sur',
  'chelo',
  'clave',
  'contrabajo',
  'viola',
  'violin1',
  'violin2',
];

/**
 * @param {string} id
 * @returns {TrackItem|null}
 */
function getTrackById(id) {
  for (const track of TRACK_CATALOG) {
    if (track.id === id) {
      return track;
    }
  }
  return null;
}

/**
 * Pista que marca el progreso temporal (órbita / letras).
 * @returns {TrackItem|null}
 */
function getTimebaseTrack() {
  for (const track of TRACK_CATALOG) {
    if (track.timebase) {
      return track;
    }
  }
  return TRACK_CATALOG.length ? TRACK_CATALOG[0] : null;
}
