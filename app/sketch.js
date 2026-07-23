/**
 * sketch.js
 * Punto de entrada de p5.js.
 * Solo contiene preload / setup / draw e input; toda la lógica vive en Game.
 */

/** @type {Game} */
let game;

function preload() {
  game = new Game();
  game.preload();
}

function setup() {
  // Desactiva menú contextual en touch/click derecho (pantalla táctil).
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  game.setup();
}

function draw() {
  game.draw();
}

function windowResized() {
  if (game) {
    game.windowResized();
  }
}

// Mouse (desarrollo) + Touch (totem / webapp) → mismo pipeline
function mousePressed() {
  game.pointerPressed();
}

function mouseReleased() {
  return game.pointerReleased();
}

function mouseDragged() {
  game.pointerDragged();
}

function mouseOut() {
  if (game) {
    game.pointerCancel();
  }
}

function touchStarted() {
  game.pointerPressed();
  return false;
}

function touchEnded() {
  game.pointerReleased();
  return false;
}

function touchMoved() {
  game.pointerDragged();
  return false;
}

/**
 * Atajos de desarrollo / operador:
 * D → debug (barras de progreso / mapeo)
 * F / ESC → pantalla completa
 * Q → reiniciar a INTRO
 * 1–3 → saltar a Intro / Play / Info
 */
function keyPressed() {
  if (game) {
    game.handleKey(key, keyCode);
  }
  return false;
}

function mouseWheel(event) {
  if (game) {
    game.handleWheel(event.delta);
  }
  return false;
}
