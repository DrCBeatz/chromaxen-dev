// frontend/jscript/state.js

/**
 * Represents the state of the Cellular Automata game.
 * Stores configuration, gameplay variables, and state data shared across the application.
 * @module GameState
 */

export const gameState = {
  /**
   * Number of rows in the game grid.
   * @type {number}
   * @default 8
   */
  ROWS: 8,

  /**
   * Number of columns in the game grid.
   * @type {number}
   * @default 8
   */
  COLS: 8,

  /**
   * Array of rule numbers for each row.
   * Rules determine the behavior of the Cellular Automata.
   * @type {number[]}
   * @default [127, 53, 61, 43, 41, 17, 123, 213]
   */
  RULES: [127, 53, 61, 43, 41, 17, 123, 213],

  /**
   * Array of goal states for each row.
   * Represents the target state of the Cellular Automata.
   * @type {number[]}
   * @default [0, 0, 0, 0, 0, 0, 0, 0]
   */
  GOALS: [0, 0, 0, 0, 0, 0, 0, 0],

  /**
   * Current preset index being used in the game.
   * @type {number|undefined}
   * @default undefined
   */
  PRESET: undefined,

  /**
   * Stack to keep track of moves made by the player.
   * Used for undoing actions.
   * @type {Array<{action: string, [key: string]: any}>}
   */
  moveHistory: [],

  /**
   * Current move index in the game.
   * @type {number}
   * @default 0
   */
  CURRENT_MOVE: 0,

  /**
   * Counter for drag-and-drop operations.
   * @type {number}
   * @default 0
   */
  DRAG_COUNT: 0,

  /**
   * Total number of moves made by the player.
   * @type {number}
   * @default 0
   */
  MOVE_COUNT: 0,

  /**
   * Elapsed game time in milliseconds.
   * @type {number}
   * @default 0
   */
  TIME: 0,

  /**
   * Timer object for tracking game time.
   * @type {Timer|null}
   * @default null
   */
  timer: null,

  /**
   * Whether swapping rows is enabled in the game.
   * @type {boolean}
   * @default true
   */
  SWAP_ENABLED: true,

  /**
   * Whether solved rows should be visually highlighted.
   * @type {boolean}
   * @default false
   */
  SHOW_SOLVED_ROWS: false,

  /**
   * Whether "cool" transitions are enabled in the UI.
   * @type {boolean}
   * @default true
   */
  COOL_TRANSITIONS_ENABLED: true,

  /**
   * Whether the game is currently animating a "cool" transition.
   * @type {boolean}
   * @default false
   */
  is_cool_transitions_animating: false,

  /**
   * Matrix representing the state of the Cellular Automata.
   * @type {number[][]}
   * @default []
   */
  CA_STATE_MATRIX: [],

  /**
   * Array of game preset configurations.
   * @type {Array<Object>}
   * @default []
   */
  GAME_PRESETS: [],

  /**
   * Path to the XML file containing game configurations.
   * @type {string}
   * @default 'games.xml'
   */
  GAME_XML_URL: 'games.xml',


  /**
   * Name of the current game being played.
   * @type {string}
   * @default ''
   */
  GAME_NAME: '',


  /**
   * Description of the current game being played.
   * @type {string}
   * @default ''
   */
  GAME_DESC: '',

  /**
   * Initial state of the game, used for resetting.
   * @type {Object}
   * @default {}
   */
  initial_state: {},

  /**
   * Whether rows ahead of the current state should be visible.
   * @type {boolean}
   * @default true
   */
  show_rows_ahead: true,

  /**
   * Source element being dragged in a drag-and-drop operation.
   * @type {HTMLElement|null}
   * @default null
   */
  dragSrcEl_: null,
};
