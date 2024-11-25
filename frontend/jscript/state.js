// frontend/jscript/state.js

export const gameState = {
  // Game play variables
  ROWS: 8,
  COLS: 8,
  RULES: [127, 53, 61, 43, 41, 17, 123, 213],
  GOALS: [0, 0, 0, 0, 0, 0, 0, 0],
  PRESET: undefined,
  moveHistory: [],
  CURRENT_MOVE: 0,
  DRAG_COUNT: 0,
  MOVE_COUNT: 0,
  TIME: 0,
  timer: null,
  SWAP_ENABLED: true,
  SHOW_SOLVED_ROWS: false,
  COOL_TRANSITIONS_ENABLED: true,
  is_cool_transitions_animating: false,
  CA_STATE_MATRIX: [],
  GAME_PRESETS: [],
  GAME_XML_URL: 'games.xml',
  GAME_NAME: '',
  GAME_DESC: '',
  initial_state: {},
  show_rows_ahead: true,
  dragSrcEl_: null,
};
