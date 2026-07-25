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
 * @property {string} label       Etiqueta UI del fader (fallback si no hay icono)
 * @property {string} [iconKey]   Clave de imagen en AssetManager (cara / i_…)
 * @property {'voice'|'instrument'} role
 * @property {boolean} [timebase] Si true, esta pista marca el progreso (órbita / lyrics)
 * @property {boolean} [fader]    Si false, no aparece en el mezclador (default true)
 */

/** @type {TrackItem[]} */
const TRACK_CATALOG = [
  {
    id: 'norte',
    file: 'est_app_norte.mp3',
    label: 'PEPE\n(NORTE)',
    iconKey: 'cara_pepe',
    role: 'voice',
  },
  {
    id: 'sur',
    file: 'est_app_sur.mp3',
    label: 'MELISA\n(SUR)',
    iconKey: 'cara_melisa',
    role: 'voice',
    timebase: true,
  },
  {
    id: 'chelo',
    file: 'est_app_chelo.mp3',
    label: 'CHELO',
    iconKey: 'i_chelo',
    role: 'instrument',
  },
  {
    id: 'clave',
    file: 'est_app_clave.mp3',
    label: 'CLAVE',
    iconKey: 'i_clave',
    role: 'instrument',
  },
  {
    id: 'contrabajo',
    file: 'est_app_contrabajo.mp3',
    label: 'CONTRA\nBAJO',
    iconKey: 'i_contrabajo',
    role: 'instrument',
  },
  {
    id: 'viola',
    file: 'est_app_viola.mp3',
    label: 'VIOLA',
    iconKey: 'i_viola',
    role: 'instrument',
  },
  {
    id: 'violin1',
    file: 'est_app_violin_1.mp3',
    label: 'VIOLÍN 1',
    iconKey: 'i_violin1',
    role: 'instrument',
  },
  {
    id: 'violin2',
    file: 'est_app_violin_2.mp3',
    label: 'VIOLÍN 2',
    iconKey: 'i_violin2',
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
  'violin1',
  'violin2',
  'viola',
  'chelo',
  'contrabajo',
  'clave',
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
