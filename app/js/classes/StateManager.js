/**
 * StateManager
 * Máquina de estados con transiciones animadas (overlay de fundido).
 *
 * Flujo base:
 *   INTRO → PLAY → INFO → INTRO
 */
class StateManager {
  /**
   * @param {Game} game
   */
  constructor(game) {
    this.game = game;

    /** @type {Map<string, BaseState>} */
    this.states = new Map();

    /** @type {BaseState|null} */
    this.current = null;

    /** @type {string|null} */
    this.currentId = null;

    this.phase = 'idle'; // idle | fadeOut | fadeIn
    this.transitionAlpha = 0;
    this.transitionDuration = 0.45;
    this._transitionElapsed = 0;
    this._pendingStateId = null;
    this._onTransitionMidpoint = null;
  }

  /**
   * @param {string} id
   * @param {BaseState} state
   */
  register(id, state) {
    this.states.set(id, state);
  }

  /**
   * @param {string} id
   */
  start(id) {
    const state = this.states.get(id);
    if (!state) {
      console.error(`[StateManager] Estado desconocido: ${id}`);
      return;
    }
    this.current = state;
    this.currentId = id;
    this.phase = 'idle';
    this.transitionAlpha = 0;
    this.current.enter();
  }

  /**
   * @param {string} id
   */
  forceStart(id) {
    const state = this.states.get(id);
    if (!state) {
      console.error(`[StateManager] Estado desconocido: ${id}`);
      return;
    }
    if (this.current) {
      this.current.exit();
    }
    this.phase = 'idle';
    this.transitionAlpha = 0;
    this._transitionElapsed = 0;
    this._pendingStateId = null;
    this._onTransitionMidpoint = null;
    this.current = state;
    this.currentId = id;
    this.current.enter();
  }

  /**
   * @param {string} nextId
   * @param {{ duration?: number, onMidpoint?: function }} [options]
   */
  changeTo(nextId, options = {}) {
    if (!this.states.has(nextId)) {
      console.error(`[StateManager] Estado desconocido: ${nextId}`);
      return;
    }
    if (this.phase !== 'idle') {
      console.warn('[StateManager] Ya hay una transición en curso.');
      return;
    }

    this._pendingStateId = nextId;
    this.transitionDuration = options.duration || 0.45;
    this._onTransitionMidpoint = options.onMidpoint || null;
    this._transitionElapsed = 0;
    this.phase = 'fadeOut';
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (this.phase === 'idle') {
      if (this.current) {
        this.current.update(dt);
      }
      return;
    }

    this._transitionElapsed += dt;
    const t = Math.min(1, this._transitionElapsed / this.transitionDuration);

    if (this.phase === 'fadeOut') {
      this.transitionAlpha = Easing.easeInOutQuad(t);
      if (this.current) {
        this.current.update(dt);
      }
      if (t >= 1) {
        this._swapState();
        this.phase = 'fadeIn';
        this._transitionElapsed = 0;
      }
      return;
    }

    if (this.phase === 'fadeIn') {
      this.transitionAlpha = 1 - Easing.easeInOutQuad(t);
      if (this.current) {
        this.current.update(dt);
      }
      if (t >= 1) {
        this.transitionAlpha = 0;
        this.phase = 'idle';
        this._pendingStateId = null;
      }
    }
  }

  draw() {
    if (this.current) {
      this.current.draw();
    }
    this._drawTransitionOverlay();
  }

  pointerPressed(x, y) {
    if (this.phase !== 'idle' || !this.current) {
      return;
    }
    if (typeof this.current.pointerPressed === 'function') {
      this.current.pointerPressed(x, y);
    }
  }

  pointerReleased(x, y) {
    if (!this.current) {
      return;
    }
    if (typeof this.current.pointerReleased === 'function') {
      this.current.pointerReleased(x, y);
    }
  }

  pointerDragged(x, y) {
    if (this.phase !== 'idle' || !this.current) {
      return;
    }
    if (typeof this.current.pointerDragged === 'function') {
      this.current.pointerDragged(x, y);
    }
  }

  pointerCancel() {
    if (!this.current) {
      return;
    }
    if (typeof this.current.pointerCancel === 'function') {
      this.current.pointerCancel();
    }
  }

  /**
   * @returns {boolean}
   */
  get isTransitioning() {
    return this.phase !== 'idle';
  }

  _swapState() {
    if (this.current) {
      this.current.exit();
    }

    if (this._onTransitionMidpoint) {
      this._onTransitionMidpoint();
      this._onTransitionMidpoint = null;
    }

    const next = this.states.get(this._pendingStateId);
    this.current = next;
    this.currentId = this._pendingStateId;
    this.current.enter();
  }

  _drawTransitionOverlay() {
    if (this.transitionAlpha <= 0.001) {
      return;
    }
    push();
    noStroke();
    const [r, g, b] = COLORS.OVERLAY;
    fill(r, g, b, this.transitionAlpha * 255);
    rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    pop();
  }
}
