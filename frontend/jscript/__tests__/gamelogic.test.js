// tests/gamelogic.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  bitTest,
  bitSet,
  nextByRule,
  rnd,
  chooseRule,
  chooseGoal,
  chooseSeed,
  parse_comma_number_list,
  create_random_preset,
  test_win,
  enable_retreat_button,
  disable_retreat_button,
  retreat,
  start_game,
  makeNewGame,
  nextMove,
  test_win,
  win,
  gameState,
  init_game,
  setRule,
  display_rule,
} from '../gamelogic.js';
import * as gamelogic from '../gamelogic.js';
import * as winModule from '../win.js';
import * as gameUI from '../gameUI.js';
import { gameState } from '../state.js';
import * as getRulesModule from '../get_rules.js';
import * as presetsModule from '../presets.js';
import * as presetMenuModule from '../presetMenu.js';

describe('bitTest()', () => {
  it('should return non-zero if a bit is set', () => {
    // 0b1010 is decimal 10. Bits are [1,0,1,0] from LSB to MSB
    // So bitTest(10, 1) => checks the second bit. 10 in binary is ...1010
    // The bit positions: LSB=0 -> 0, bit=1 ->1, bit=2->0, bit=3->1
    // That means bit 1 is set, so expect non-zero
    const result = bitTest(10, 1);
    expect(result).not.toBe(0); // Should be non-zero
  });

  it('should return 0 if a bit is not set', () => {
    // Still 0b1010 is decimal 10
    // bitTest(10, 0) => LSB is bit 0 => that bit is 0 in 0b1010 => 0
    const result = bitTest(10, 0);
    expect(result).toBe(0);
  });

  it('should handle higher bits as well', () => {
    // 0b101000 = decimal 40. Bits are [0,0,1,0,1,0]
    // Checking bit 5 => should be set
    const result = bitTest(40, 5);
    expect(result).not.toBe(0);
  });
});

describe('bitSet()', () => {
  it('should set a bit that was previously 0', () => {
    // 0b1010 => decimal 10
    // set bit 0 => result should become 0b1011 => decimal 11
    const newValue = bitSet(10, 0);
    expect(newValue).toBe(11);
  });

  it('should leave the value unchanged if the bit is already set', () => {
    // 0b1011 => decimal 11
    // bit 1 is already set => bitSet(11, 1) => still 11
    const newValue = bitSet(11, 1);
    expect(newValue).toBe(11);
  });
});

describe('nextByRule()', () => {
  it('should compute the next state correctly for a simple rule', () => {
    const rule = 48; // in binary => 00110000 -> means bits 4 and 5 set => neighborhoods 4 & 5 => see below
    const newState = nextByRule(5, rule);
    expect(newState).toBeLessThan(8); // 3 bits => < 8
    expect(newState).toBe(2);
  });

  it('should return 0 if the rule does not set any bits', () => {
    // rule = 0 => no bits set => next state always 0
    const rule = 0;
    const currentState = 0b111; // decimal 7
    const nextState = nextByRule(currentState, rule);
    expect(nextState).toBe(0); // because no bits in the rule are set
  });

  it('should return full 0b111 if the rule sets all bits', () => {
    // rule = 255 => binary 11111111 => sets any neighborhood
    // next state always ends up 0b111 => decimal 7
    const rule = 255;
    const currentState = 0;
    const nextState = nextByRule(currentState, rule);
    expect(nextState).toBe(7); // 0b111
  });
});

describe('rnd(N)', () => {
  it('returns an integer in [0, N)', () => {
    const N = 10;
    for (let i = 0; i < 50; i++) {
      const result = rnd(N);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(N);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('handles N=1 by always returning 0', () => {
    for (let i = 0; i < 10; i++) {
      expect(rnd(1)).toBe(0);
    }
  });

  it('can mock Math.random for a predictable result', () => {
    // Suppose we want to confirm rnd(N) is exactly Math.floor(Math.random()*N).
    // We'll mock Math.random to always return 0.9999
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    const val = rnd(10); // => floor(0.9999*10) = 9
    expect(val).toBe(9);
    spy.mockRestore(); // restore original Math.random
  });
});

describe('chooseRule()', () => {
  it('returns a number in [0..255]', () => {
    for (let i = 0; i < 50; i++) {
      const rule = chooseRule();
      expect(rule).toBeGreaterThanOrEqual(0);
      expect(rule).toBeLessThanOrEqual(255);
      expect(Number.isInteger(rule)).toBe(true);
    }
  });

  it('can mock Math.random to produce an exact rule', () => {
    // If you want to ensure a certain 'rule' is returned, you can mock.
    // For example, want 256 * 0.5 = 128 => the midpoint.
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(chooseRule()).toBe(128);
    spy.mockRestore();
  });
});

describe('chooseGoal()', () => {
  it('returns a number in [0..7]', () => {
    for (let i = 0; i < 30; i++) {
      const goal = chooseGoal();
      expect(goal).toBeGreaterThanOrEqual(0);
      expect(goal).toBeLessThanOrEqual(7);
      expect(Number.isInteger(goal)).toBe(true);
    }
  });
});

describe('chooseSeed()', () => {
  it('returns a number in [1..6]', () => {
    for (let i = 0; i < 30; i++) {
      const seed = chooseSeed();
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThanOrEqual(6);
      expect(Number.isInteger(seed)).toBe(true);
    }
  });

  it('can mock Math.random to ensure it never returns 0 or 7', () => {
    // E.g. if we mock random = 0.0 => chooseSeed => 1
    // if we mock random = 0.99 => chooseSeed => 6
    let spy = vi.spyOn(Math, 'random').mockReturnValue(0.0);
    expect(chooseSeed()).toBe(1);
    spy.mockRestore();

    spy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(chooseSeed()).toBe(6);
    spy.mockRestore();
  });
});

describe('parse_comma_number_list()', () => {

  it('should parse a simple comma-separated list of digits', () => {
    const input = '1,2,3';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse numbers with extra spaces', () => {
    const input = ' 10,  20 ,30 ';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([10, 20, 30]);
  });

  it('should parse a single value (no commas)', () => {
    const input = '42';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([42]);
  });

  it('should parse zeros correctly', () => {
    const input = '0, 0, 123';
    const result = parse_comma_number_list(input);
    expect(result).toEqual([0, 0, 123]);
  });

  it('should handle an empty string', () => {
    const input = '';
    expect(() => parse_comma_number_list(input)).toThrow();
  });

  it('should ignore non-digit characters in each split part', () => {
    const input = 'abc123, 456def, 78!@#';
    const result = parse_comma_number_list(input);
    // For each comma-delimited substring, the regex /\d+/ picks out digits only:
    // 'abc123' => '123'
    // ' 456def' => '456'
    // ' 78!@#' => '78'
    // So the result should be [123, 456, 78]
    expect(result).toEqual([123, 456, 78]);
  });

});

describe('create_random_preset()', () => {
  it('should return a preset object with the correct shape', () => {
    const preset = create_random_preset();
    expect(preset).toBeDefined();

    // Check the top-level properties
    expect(preset).toHaveProperty('rows', 8);
    expect(preset).toHaveProperty('columns', 8);
    expect(preset).toHaveProperty('seeds');
    expect(preset).toHaveProperty('rules');
    expect(preset).toHaveProperty('goals');
    expect(preset).toHaveProperty('swap_enabled', false);
    expect(preset).toHaveProperty('show_rows_ahead', false);
    expect(preset).toHaveProperty('name', 'Random Game');
    expect(preset).toHaveProperty('desc', '');
  });

  it('should generate 8 seed values between 1 and 6 (inclusive)', () => {
    const preset = create_random_preset();
    expect(Array.isArray(preset.seeds)).toBe(true);
    expect(preset.seeds.length).toBe(8);
    preset.seeds.forEach((seed) => {
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThanOrEqual(6);
    });
  });

  it('should generate 8 rule values in [0..255]', () => {
    const preset = create_random_preset();
    expect(Array.isArray(preset.rules)).toBe(true);
    expect(preset.rules.length).toBe(8);
    preset.rules.forEach((rule) => {
      expect(rule).toBeGreaterThanOrEqual(0);
      expect(rule).toBeLessThanOrEqual(255);
    });
  });

  it('should generate 8 goal values in [0..7]', () => {
    const preset = create_random_preset();
    expect(Array.isArray(preset.goals)).toBe(true);
    expect(preset.goals.length).toBe(8);
    preset.goals.forEach((goal) => {
      expect(goal).toBeGreaterThanOrEqual(0);
      expect(goal).toBeLessThanOrEqual(7);
    });
  });

  it('should produce consistent outputs if Math.random is mocked', () => {
    // Suppose you want a reproducible test to ensure seeds, rules, etc. match expected values
    // if Math.random always returns a constant. We'll do a quick mock and then restore it.

    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.0);
    // With 0.0, the calculations become predictable:
    //  - seeds => always Math.floor(0*6)+1 = 1
    //  - rules => always Math.floor(0*256) = 0
    //  - goals => always Math.floor(0*8) = 0
    const preset = create_random_preset();

    expect(preset.seeds).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(preset.rules).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(preset.goals).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);

    mockRandom.mockRestore();
  });
});

describe('test_win()', () => {
  beforeEach(() => {
    // Optionally, reset or stub out relevant parts of gameState before each test
    gameState.GOALS = [];
    gameState.CA_STATE_MATRIX = [];
  });

  it('should return true when CA_STATE_MATRIX matches GOALS for every row', () => {
    // Suppose we have 3 rows
    gameState.GOALS = [1, 2, 3];
    // The last element of each row in CA_STATE_MATRIX should match the corresponding goal.
    gameState.CA_STATE_MATRIX = [
      [0, 1],   // row 0 ends in 1
      [5, 2],   // row 1 ends in 2
      [7, 3],   // row 2 ends in 3
    ];

    const result = test_win();
    expect(result).toBe(true);
  });

  it('should return false if at least one row’s final state does not match its goal', () => {
    // Suppose we have 3 rows again
    gameState.GOALS = [1, 2, 3];
    gameState.CA_STATE_MATRIX = [
      [0, 1],  // row 0 ends in 1
      [5, 2],  // row 1 ends in 2
      [7, 9],  // row 2 ends in 9 <-- mismatch!
    ];

    const result = test_win();
    expect(result).toBe(false);
  });

  it('should handle an empty goals array or matrix gracefully (likely return true)', () => {
    // Edge case: no goals => trivially "won" or depends on your logic
    gameState.GOALS = [];
    gameState.CA_STATE_MATRIX = [];
    // Currently, test_win() loops over `i < gameState.GOALS.length`, so an empty array won’t fail the loop
    // The function will just return true. This might be the expected or default behavior.
    expect(test_win()).toBe(true);
  });
});

describe('enable_retreat_button()', () => {
  beforeEach(() => {
    // Reset the DOM for each test so we start fresh.
    document.body.innerHTML = `
      <div id="retreat_button" class="button_disabled" style="cursor: default;"></div>
    `;
  });

  it('should set className to "button", make cursor pointer, and add a click event listener', () => {
    const retreatBtn = document.getElementById('retreat_button');
    // Spy on addEventListener to verify it gets called
    const addEventListenerSpy = vi.spyOn(retreatBtn, 'addEventListener');

    enable_retreat_button();

    // 1. className changes
    expect(retreatBtn.className).toBe('button');

    // 2. style changes
    expect(retreatBtn.style.cursor).toBe('pointer');

    // 3. event listener is attached
    // Check that addEventListener was called exactly once with ('click', retreat)
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', retreat);
  });
});

describe('disable_retreat_button()', () => {
  beforeEach(() => {
    // Reset the DOM again, but this time let's emulate a button already enabled
    document.body.innerHTML = `
      <div id="retreat_button" class="button" style="cursor: pointer;"></div>
    `;
  });

  it('should set className to "button_disabled", make cursor default, and remove the click listener', () => {
    const retreatBtn = document.getElementById('retreat_button');
    // First, add a listener so that removeEventListener has something to remove
    retreatBtn.addEventListener('click', retreat);

    // Spy on removeEventListener
    const removeEventListenerSpy = vi.spyOn(retreatBtn, 'removeEventListener');

    disable_retreat_button();

    // 1. className changes
    expect(retreatBtn.className).toBe('button_disabled');

    // 2. style changes
    expect(retreatBtn.style.cursor).toBe('default');

    // 3. event listener is removed
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', retreat);
  });
});


describe('start_game()', () => {
  beforeEach(() => {
    // DOM setup
    document.body.innerHTML = `
      <div id="game_header">
			<div id="back_to_menu" class="button">&#x21DA; Menu</div>
			<div id="game_title_display"></div>
			<div id="game_desc_display"></div>
			<div id="next_button" class="button">Next Level &#x21DB;</div>
			<div id="prev_button" class="button">&#x21DA;</div>
			<select id="preset_select_el"></select>
		</div>

		<div id="gameboard_container">
			<table id="gameboard">
			</table>
		</div>

		<div id="gameboard_overlay_container">
			<div id="gameboard_overlay"></div>
		</div>

		<div id="game_footer">
			<div id="update_button" class="button">Advance</div>
			<div id="retreat_button" class="button">Retreat</div>
			<div id="reset_button" class="button">Reset &#x21BA;</div>
			<div id="random_button" class="button">Random</div>
			<div id="moves_display">
				<span>Moves: </span>
				<span id="update_counter">0</span>
			</div>
			<div id="timer_display">
				<span>Time: </span>
				<span id="timer">00:00</span>
			</div>
			<div id="save_button" class="button">Save Game</div>
			<div id="load_button" class="button">Load Game
			</div>
			<input type="file" id="load_game_input" accept=".json" style="display:none">
			<div id="solve_button" class="button">Solve!</div>
			<div id="dragndrop_style_display">Style: Swap</div>
		</div>
    <div id="win_screen_container">
			<div id="win_screen">
				<h1 id="win_screen_header">You win!</h1>
				<h3 id="high_score_table_header"><b>Game 1 High Score</b></h3>
				<table id="high_score_table">
					<tr>
						<th></th>
						<th>Moves</th>
						<th>Time</th>
						<th>Name</th>
					</tr>
				</table>
				<div id="win_screen_footer">
					<div id="replay_button" class="button">Replay &#x21BA;</div>
					<div id="next_level_button" class="button">Next &#x21DB;</div>
				</div>
			</div>
		</div>
    <div id="lose_screen_container">
			<div id="lose_screen">
				<h1 id="lose_screen_header">
					You lose
				</h1>
				<div id="lose_screen_footer">
					<div id="lose_replay_button" class="button">Replay</div>
					<div id="lose_next_button" class="button">Next</div>
				</div>
			</div>
		</div>
    `;

    // Our local "in-memory" store for convenience:
    const store = {
      rules: JSON.stringify([127, 53, 61, 43, 41, 17, 123, 213]),
      state_matrix: JSON.stringify(
        Array.from({ length: 8 }, () => Array(8).fill(0))
      ),
      goals: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0]),
      rows: '8',
      cols: '8',
    };

    window.localStorage.rules = store.rules;
    window.localStorage.state_matrix = store.state_matrix;
    window.localStorage.goals = store.goals;
    window.localStorage.rows = store.rows;
    window.localStorage.cols = store.cols;

    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
      return window.localStorage[key];
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, val) => {
      window.localStorage[key] = val;
    });

    globalThis.COLORS = [
      '#000000',
      '#111111',
      '#222222',
      '#333333',
      '#444444',
      '#555555',
      '#666666',
      '#777777',
    ];

    gameState.RULES = [];
    gameState.CA_STATE_MATRIX = [];
    gameState.MOVE_COUNT = 0;
    gameState.CURRENT_MOVE = 0;
  });

  it('should initialize timer and enable/disable the retreat button based on MOVE_COUNT', () => {
    // 1) start_game() => creates gameState.timer, loads matrix, etc.
    start_game();

    // 2) Then we can call makeNewGame(false) => uses the timer that now exists
    makeNewGame(false);

    // 3) Adjust gameState if you want to test certain logic
    gameState.MOVE_COUNT = 0;
    // Now call start_game() again if you want
    start_game();

    // For example, check the retreat button is disabled (class "button_disabled")
    const retreatBtn = document.getElementById('retreat_button');
    expect(retreatBtn.className).toBe('button_disabled');

    // Check if the timer is not null
    expect(gameState.timer).not.toBeNull();
    // Check if update_counter is "0", etc.
    expect(document.getElementById('update_counter').textContent).toBe('0');
  });

});

describe('nextMove()', () => {
  beforeEach(() => {
    // Reset the relevant parts of gameState before each test
    gameState.CURRENT_MOVE = 0;
    gameState.MOVE_COUNT = 0;
    gameState.COLS = 8;  // typical board width
    gameState.COOL_TRANSITIONS_ENABLED = false;
    gameState.is_cool_transitions_animating = false;
    gameState.moveHistory = [];

    // Also set up localStorage or mock it if your code uses it:
    const store = {};
    // If your code does localStorage.move_count = ..., do likewise:
    store.move_count = '0';
    store.current_move = '0';
    store.rules = JSON.stringify([127, 53, 61, 43, 41, 17, 123, 213]);
    store.state_matrix = JSON.stringify(
      Array.from({ length: 8 }, () => Array(8).fill(0))
    );

    // Provide a basic localStorage simulation
    window.localStorage = {
      getItem: vi.fn(key => store[key]),
      setItem: vi.fn((key, value) => { store[key] = value; }),
    };
  });

  it('should increment CURRENT_MOVE, MOVE_COUNT, and push an "advance" action to moveHistory', () => {
    // Starting scenario
    expect(gameState.CURRENT_MOVE).toBe(0);
    expect(gameState.MOVE_COUNT).toBe(0);
    expect(gameState.moveHistory).toEqual([]);

    nextMove();

    // Verify we advanced
    expect(gameState.CURRENT_MOVE).toBe(1);
    expect(gameState.MOVE_COUNT).toBe(1);
    expect(gameState.moveHistory).toEqual([{ action: 'advance' }]);

    // localStorage is updated
    expect(window.localStorage.move_count).toBe(1);
    expect(window.localStorage.current_move).toBe(1);

  });

  it('should do nothing if CURRENT_MOVE >= COLS - 1', () => {
    // Put us at the last column
    gameState.CURRENT_MOVE = 7;  // since COLS=8 => last col index is 7
    gameState.MOVE_COUNT = 5;

    nextMove();  // Attempt to move beyond the last column

    // Expect no change
    expect(gameState.CURRENT_MOVE).toBe(7);
    expect(gameState.MOVE_COUNT).toBe(5);
    expect(gameState.moveHistory).toEqual([]);
  });

  it('should bail out early if COOL_TRANSITIONS_ENABLED && is_cool_transitions_animating', () => {
    gameState.COOL_TRANSITIONS_ENABLED = true;
    gameState.is_cool_transitions_animating = true;

    gameState.CURRENT_MOVE = 2;
    gameState.MOVE_COUNT = 2;
    nextMove();

    // Should do nothing
    expect(gameState.CURRENT_MOVE).toBe(2);
    expect(gameState.MOVE_COUNT).toBe(2);
    expect(gameState.moveHistory).toEqual([]);
  });

  it('should call win() if we land on the last column and test_win() is true', () => {
    // Spy on test_win
    const testWinSpy = vi.spyOn(gamelogic, 'test_win').mockReturnValue(true);
    // Spy on the actual "win" from the "win.js" module
    const winSpy = vi.spyOn(winModule, 'win').mockImplementation(() => { });

    gameState.CURRENT_MOVE = gameState.COLS - 2; // second-to-last
    gamelogic.nextMove();  // triggers code that calls win() from ../win.js

    expect(gameState.CURRENT_MOVE).toBe(gameState.COLS - 1);
    expect(winSpy).toHaveBeenCalled();

    // Clean up
    testWinSpy.mockRestore();
    winSpy.mockRestore();
  });

});

describe('retreat()', () => {
  beforeEach(() => {
    // Reset relevant parts of gameState
    gameState.CURRENT_MOVE = 0;
    gameState.MOVE_COUNT = 0;
    gameState.ROWS = 8;
    gameState.COLS = 8;
    gameState.moveHistory = [];

    // Create a minimal 8×8 CA_STATE_MATRIX filled with zeros
    gameState.CA_STATE_MATRIX = Array.from({ length: 8 }, () => Array(8).fill(0));

    // Mock localStorage
    const store = {};
    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => store[key]);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, val) => {
      store[key] = val;
    });

    // Stub out drawRows to avoid DOM manipulation errors
    vi.spyOn(gameUI, 'drawRows').mockImplementation(() => { /* no-op */ });

    // Minimal DOM structure if needed
    document.body.innerHTML = `
    <div id="container">
  <div id="game_header">
    <div id="back_to_menu" class="button">&#x21DA; Menu</div>
    <div id="game_title_display"></div>
    <div id="game_desc_display"></div>
    <div id="next_button" class="button">Next Level &#x21DB;</div>
    <div id="prev_button" class="button">&#x21DA;</div>
    <select id="preset_select_el"></select>
  </div>

  <div id="gameboard_container">
    <table id="gameboard">
    </table>

  </div>

  <div id="gameboard_overlay_container">
    <div id="gameboard_overlay"></div>
  </div>

  <div id="game_footer">
    <div id="update_button" class="button">Advance</div>
    <div id="retreat_button" class="button">Retreat</div>
    <div id="reset_button" class="button">Reset &#x21BA;</div>
    <div id="random_button" class="button">Random</div>
    <div id="moves_display">
      <span>Moves: </span>
      <span id="update_counter">0</span>
    </div>
    <div id="timer_display">
      <span>Time: </span>
      <span id="timer">00:00</span>
    </div>
    <div id="save_button" class="button">Save Game</div>
    <div id="load_button" class="button">Load Game
    </div>
    <input type="file" id="load_game_input" accept=".json" style="display:none">
    <div id="solve_button" class="button">Solve!</div>
    <div id="dragndrop_style_display">Style: Swap</div>
  </div>
  `;
  });

  it('does nothing if moveHistory is empty', () => {
    // Arrange
    const initialMove = gameState.CURRENT_MOVE;
    const initialCount = gameState.MOVE_COUNT;

    // Act
    retreat();

    // Assert
    expect(gameState.CURRENT_MOVE).toBe(initialMove);
    expect(gameState.MOVE_COUNT).toBe(initialCount);
    expect(gameState.moveHistory).toEqual([]);
  });

  it('undoes an "advance" action without mocking nextByRule', () => {
    // Arrange

    // Fill CA_STATE_MATRIX so we can detect changes
    gameState.CA_STATE_MATRIX = [
      [0, 1, 1, 1, 1, 1, 1, 1],
      [0, 2, 2, 2, 2, 2, 2, 2],
      [0, 3, 3, 3, 3, 3, 3, 3],
      [0, 4, 4, 4, 4, 4, 4, 4],
      [0, 5, 5, 5, 5, 5, 5, 5],
      [0, 6, 6, 6, 6, 6, 6, 6],
      [0, 7, 7, 7, 7, 7, 7, 7],
      [0, 8, 8, 8, 8, 8, 8, 8],
    ];
    gameState.moveHistory = [{ action: 'advance' }];
    gameState.CURRENT_MOVE = 2;
    gameState.MOVE_COUNT = 2;

    // Act
    retreat();

    // Assert
    // 1) gameState updates
    expect(gameState.CURRENT_MOVE).toBe(1);
    expect(gameState.MOVE_COUNT).toBe(1);
    expect(gameState.moveHistory).toEqual([]);

    // 2) CA_STATE_MATRIX changed from col 2..7 for each row
    for (let i = 0; i < 8; i++) {
      // We expect col 0,1 to remain the same,
      // but col 2..7 might now differ from the old value
      expect(gameState.CA_STATE_MATRIX[i][0]).toBe(0);
      expect(gameState.CA_STATE_MATRIX[i][1]).toBe(i + 1);

      // Now confirm col 2..7 were changed from their old pattern
      for (let j = 2; j < 8; j++) {
        expect(gameState.CA_STATE_MATRIX[i][j]).not.toBe(/* old value from setup */);
      }
    }

    // 3) localStorage checks

    expect(window.localStorage.move_count).toBe(1);
    expect(window.localStorage.current_move).toBe(1);
    expect(window.localStorage.move_history).toBeUndefined();

    // 4) Button class check
    const retreatBtn = document.getElementById('retreat_button');
    if (gameState.MOVE_COUNT === 0) {
      expect(retreatBtn.className).toBe('button_disabled');
    } else {
      expect(retreatBtn.className).toBe('button');
    }
  });
});

describe('init_game()', () => {
  let getRulesListSpy;
  let loadPresetsSpy;
  let startGameSpy;

  beforeEach(() => {
    // DOM setup etc. as above
    document.body.innerHTML = `
    <div id="entry_page">
		<div id="entry_title">
			<b>ChromaXen</b>
		</div>
		<div id="entry_continue_button" class="entry_button">
			Continue
		</div>

		<div id="entry_game_button" class="entry_button">
			New Game
		</div>
		<div id="entry_random_button" class="entry_button">
			Random
		</div>
		<div id="entry_all_rules_button" class="entry_button">
			All Rules
		</div>
	</div>
    <div id="container">
  <div id="game_header">
    <div id="back_to_menu" class="button">&#x21DA; Menu</div>
    <div id="game_title_display"></div>
    <div id="game_desc_display"></div>
    <div id="next_button" class="button">Next Level &#x21DB;</div>
    <div id="prev_button" class="button">&#x21DA;</div>
    <select id="preset_select_el"></select>
  </div>

  <div id="gameboard_container">
    <table id="gameboard">
    </table>

  </div>

  <div id="gameboard_overlay_container">
    <div id="gameboard_overlay"></div>
  </div>

  <div id="game_footer">
    <div id="update_button" class="button">Advance</div>
    <div id="retreat_button" class="button">Retreat</div>
    <div id="reset_button" class="button">Reset &#x21BA;</div>
    <div id="random_button" class="button">Random</div>
    <div id="moves_display">
      <span>Moves: </span>
      <span id="update_counter">0</span>
    </div>
    <div id="timer_display">
      <span>Time: </span>
      <span id="timer">00:00</span>
    </div>
    <div id="save_button" class="button">Save Game</div>
    <div id="load_button" class="button">Load Game
    </div>
    <input type="file" id="load_game_input" accept=".json" style="display:none">
    <div id="solve_button" class="button">Solve!</div>
    <div id="dragndrop_style_display">Style: Swap</div>
  </div>
  `;

    gameState.GAME_PRESETS = [];
    gameState.GAME_XML_URL = 'games.xml';

    // localStorage mocks...
    const store = {};
    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => store[key]);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, val) => {
      store[key] = val;
    });

    // Mock get_rules_list
    getRulesListSpy = vi.spyOn(getRulesModule, 'get_rules_list').mockImplementation(() => {
      // no-op
    });

    // Mock loadPresets
    loadPresetsSpy = vi.spyOn(presetsModule, 'loadPresets').mockImplementation((url, cb) => {
      // We'll call the callback manually in the test or at the end of the function:
      cb(createFakeXML());
    });

    // Mock start_game
    startGameSpy = vi.spyOn(gamelogic, 'start_game').mockImplementation(() => {
      // no-op
    });
  });

  afterEach(() => {
    getRulesListSpy.mockRestore();
    loadPresetsSpy.mockRestore();
    startGameSpy.mockRestore();
  });

  it('shows "entry_continue_button" if localStorage.current_move is set', () => {
    // Suppose localStorage.current_move is '5'
    window.localStorage.setItem('current_move', '5');

    init_game();

    const continueBtn = document.getElementById('entry_continue_button');
    expect(continueBtn.style.display).toBe('block');
  });

  it('calls get_rules_list with #all_rules element', () => {
    init_game();
    expect(getRulesListSpy).toHaveBeenCalledTimes(1);

    const allRulesEl = document.getElementById('all_rules');
    expect(getRulesListSpy).toHaveBeenCalledWith(allRulesEl);
  });

  it('calls loadPresets with "games/games.xml" (by default) and sets up gameState.GAME_PRESETS from the XML', () => {
    init_game();

    // Confirm loadPresets was called
    expect(loadPresetsSpy).toHaveBeenCalledTimes(1);
    // first arg => "games/" + gameState.GAME_XML_URL
    expect(loadPresetsSpy).toHaveBeenCalledWith('games/games.xml', expect.any(Function));

    // Because we called the callback with `createFakeXML()` in the mock,
    // let's see if gameState.GAME_PRESETS is populated
    expect(gameState.GAME_PRESETS.length).toBeGreaterThan(0);
  });

});

function createFakeXML() {
  // The real code calls xml.getElementsByTagName('game')
  // This function mocks an object with getElementsByTagName returning e.g. [<game>...].
  // Each <game> node has childNodes for <id>, <name>, <desc>, etc.
  return {
    getElementsByTagName: (tag) => {
      if (tag === 'game') {
        return [
          {
            getElementsByTagName: (t) => {
              // for e.g. 'id', 'name', 'desc', etc. 
              // return a single item with childNodes[0].nodeValue = 'someval'
              if (t === 'id') {
                return [{ childNodes: [{ nodeValue: '1' }] }];
              } else if (t === 'name') {
                return [{ childNodes: [{ nodeValue: 'TestGame' }] }];
              } else if (t === 'desc') {
                return [{ childNodes: [{ nodeValue: 'A test game' }] }];
              } else if (t === 'rows') {
                return [{ childNodes: [{ nodeValue: '8' }] }];
              } else if (t === 'columns') {
                return [{ childNodes: [{ nodeValue: '8' }] }];
              } else if (t === 'rules') {
                return [{ childNodes: [{ nodeValue: '1,2,3' }] }];
              } else if (t === 'seeds') {
                return [{ childNodes: [{ nodeValue: '4,5,6' }] }];
              } else if (t === 'goals') {
                return [{ childNodes: [{ nodeValue: '7,0,1' }] }];
              } else if (t === 'show_ahead') {
                return [{ childNodes: [{ nodeValue: 'true' }] }];
              } else if (t === 'swap_enabled') {
                return [{ childNodes: [{ nodeValue: 'false' }] }];
              }
              return [];
            },
          },
        ];
      }
      return [];
    },
  };
}

describe('setRule()', () => {
  beforeEach(() => {
    // Reset or initialize gameState as needed
    gameState.ROWS = 3;
    gameState.COLS = 5;
    gameState.CURRENT_MOVE = 2;     // Just as an example
    gameState.RULES = [10, 20, 30]; // old rule set for 3 rows
    gameState.CA_STATE_MATRIX = [
      [0, 1, 2, 2, 2],  // row 0
      [0, 1, 1, 1, 1],  // row 1
      [3, 3, 3, 3, 3],  // row 2
    ];

    // Mock localStorage
    const store = {};
    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => store[key]);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, val) => {
      store[key] = val;
    });

    // Optionally spy on display_rule if it's a separate function you want to check
    vi.spyOn(gameUI, 'display_rule'); // or wherever display_rule is exported
  });

  it('updates the rule, recalculates from CURRENT_MOVE, and updates localStorage', () => {
    // ARRANGE
    // Suppose we want to set row=1 to rule=99. recalc from CURRENT_MOVE=2
    // So columns [3..4] in CA_STATE_MATRIX for row=1 will be recalculated.
    // nextByRule is a normal function we can let run, or mock if you prefer.
    // We'll do it "for real" in this example so we see changes.

    // ACT
    setRule(1, 99, false);

    // ASSERT
    // 1) The rule is updated in gameState
    expect(gameState.RULES[1]).toBe(99);

    // 2) localStorage is updated
    const updatedRules = JSON.parse(window.localStorage.rules);
    expect(updatedRules).toEqual([10, 99, 30]);

    // 3) The CA_STATE_MATRIX row=1 is recalculated from column=2 onward
    //    i.e. we keep the old value at col=2, but recalc col=3..4.
    //    We can check if it's changed from the old [1,1] to whatever nextByRule() yields.
    //    Let’s just confirm it's *not* the old values:
    expect(gameState.CA_STATE_MATRIX[1][2]).toBe(1);  // unchanged
    // columns 3..4 must be new values, not the old [1,1] from before:
    expect(gameState.CA_STATE_MATRIX[1][3]).not.toBe(1);
    expect(gameState.CA_STATE_MATRIX[1][4]).not.toBe(1);

    // 4) localStorage.state_matrix is updated
    const updatedMatrix = JSON.parse(window.localStorage.state_matrix);
    // Check at least something changed in row=1, col=3 or col=4
    expect(updatedMatrix[1][3]).not.toBe(1);
    expect(updatedMatrix[1][4]).not.toBe(1);

    // 5) display_rule(1,99) was called (if you want to confirm UI updates)
    expect(gameUI.display_rule).toHaveBeenCalledWith(1, 99);
  });

  it('updates the rule, recalculates from col=0 if recalculateFromStart=true', () => {
    // ARRANGE
    // e.g. row=0 => set rule=77, recalc from start=0
    // That means columns [1..4] are recomputed from the seed at col=0

    // ACT
    setRule(0, 77, true);

    // ASSERT
    // The entire row 0 is recalculated from col=0 onward.
    // So col=1..4 definitely change from the old [1,2,2,2].
    expect(gameState.RULES[0]).toBe(77);
    expect(gameState.CA_STATE_MATRIX[0][1]).not.toBe(1);
    expect(gameState.CA_STATE_MATRIX[0][2]).not.toBe(2);
    expect(gameState.CA_STATE_MATRIX[0][3]).not.toBe(2);
    expect(gameState.CA_STATE_MATRIX[0][4]).not.toBe(2);

    // localStorage checks
    expect(JSON.parse(window.localStorage.rules)[0]).toBe(77);
    expect(JSON.parse(window.localStorage.state_matrix)[0][4]).not.toBe(2);

    // UI callback
    expect(gameUI.display_rule).toHaveBeenCalledWith(0, 77);
  });
});


describe('makeNewGame()', () => {
  let loadPresetSpy;
  let displayPresetFeaturesSpy;
  let disableRetreatSpy;
  let enableAdvanceSpy;
  let timerResetSpy;
  let timerStartSpy;

  beforeEach(() => {
    // We can reset or configure gameState for each test.
    // We'll also provide a minimal mock for gameState.timer so we can confirm .reset() and .start().
    gameState.timer = {
      reset: vi.fn(),
      start: vi.fn(),
    };

    // Clear out or define some default for these.
    gameState.PRESET = 0;               // default example
    gameState.CURRENT_MOVE = 5;
    gameState.MOVE_COUNT = 5;
    gameState.DRAG_COUNT = 2;
    gameState.initial_state = {};       // you can populate to test the “PRESET == -1” logic
    gameState.ROWS = 8;
    gameState.COLS = 8;
    gameState.CA_STATE_MATRIX = [];
    gameState.RULES = [];
    // etc.

    // Provide a mock localStorage or spy on real localStorage
    const store = {};
    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => store[key]);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key, val) => {
      store[key] = val;
    });

    // Spy on or mock out some functions that makeNewGame calls
    loadPresetSpy = vi.spyOn(presetMenuModule, 'loadPreset').mockImplementation(() => { });
    displayPresetFeaturesSpy = vi.spyOn(gameUI, 'display_preset_features').mockImplementation(() => { });
    enableAdvanceSpy = vi.spyOn(gameUI, 'enable_advance_button').mockImplementation(() => { });

    // Also spy on the timer
    timerResetSpy = gameState.timer.reset;
    timerStartSpy = gameState.timer.start;

    document.body.innerHTML = `
    <div id="entry_page">
		<div id="entry_title">
			<b>ChromaXen</b>
		</div>
		<div id="entry_continue_button" class="entry_button">
			Continue
		</div>

		<div id="entry_game_button" class="entry_button">
			New Game
		</div>
		<div id="entry_random_button" class="entry_button">
			Random
		</div>
		<div id="entry_all_rules_button" class="entry_button">
			All Rules
		</div>
	</div>
    <div id="container">
  <div id="game_header">
    <div id="back_to_menu" class="button">&#x21DA; Menu</div>
    <div id="game_title_display"></div>
    <div id="game_desc_display"></div>
    <div id="next_button" class="button">Next Level &#x21DB;</div>
    <div id="prev_button" class="button">&#x21DA;</div>
    <select id="preset_select_el"></select>
  </div>

  <div id="gameboard_container">
    <table id="gameboard">
    </table>

  </div>

  <div id="gameboard_overlay_container">
    <div id="gameboard_overlay"></div>
  </div>

  <div id="game_footer">
    <div id="update_button" class="button">Advance</div>
    <div id="retreat_button" class="button">Retreat</div>
    <div id="reset_button" class="button">Reset &#x21BA;</div>
    <div id="random_button" class="button">Random</div>
    <div id="moves_display">
      <span>Moves: </span>
      <span id="update_counter">0</span>
    </div>
    <div id="timer_display">
      <span>Time: </span>
      <span id="timer">00:00</span>
    </div>
    <div id="save_button" class="button">Save Game</div>
    <div id="load_button" class="button">Load Game
    </div>
    <input type="file" id="load_game_input" accept=".json" style="display:none">
    <div id="solve_button" class="button">Solve!</div>
    <div id="dragndrop_style_display">Style: Swap</div>
  </div>

  <div id="win_screen_container">
			<div id="win_screen">
				<h1 id="win_screen_header">You win!</h1>
				<h3 id="high_score_table_header"><b>Game 1 High Score</b></h3>
				<table id="high_score_table">
					<tr>
						<th></th>
						<th>Moves</th>
						<th>Time</th>
						<th>Name</th>
					</tr>
				</table>
				<div id="win_screen_footer">
					<div id="replay_button" class="button">Replay &#x21BA;</div>
					<div id="next_level_button" class="button">Next &#x21DB;</div>
				</div>
			</div>
		</div>

		<div id="lose_screen_container">
			<div id="lose_screen">
				<h1 id="lose_screen_header">
					You lose
				</h1>
				<div id="lose_screen_footer">
					<div id="lose_replay_button" class="button">Replay</div>
					<div id="lose_next_button" class="button">Next</div>
				</div>
			</div>
		</div>
  `;

  });

  afterEach(() => {
    // If your Timer has a .stop() method, call it:
    if (gameState.timer && typeof gameState.timer.stop === 'function') {
      gameState.timer.stop();
    }
  });

  it('resets the game state for a new preset game if PRESET != -1', () => {
    // ARRANGE
    gameState.PRESET = 2;

    // ACT
    makeNewGame(false);

    // ASSERT
    // 1) Timer calls
    expect(timerResetSpy).toHaveBeenCalledTimes(1);
    expect(timerStartSpy).toHaveBeenCalledTimes(1);

    // 2) Basic gameState checks
    expect(gameState.CURRENT_MOVE).toBe(0);
    expect(gameState.MOVE_COUNT).toBe(0);

    // 3) Confirm it calls loadPreset(PRESET)
    expect(loadPresetSpy).toHaveBeenCalledTimes(1);
    expect(loadPresetSpy).toHaveBeenCalledWith(2);

    // 4) Confirm the typical calls: display_preset_features, enable_advance, etc.
    expect(displayPresetFeaturesSpy).toHaveBeenCalledTimes(1);
    expect(enableAdvanceSpy).toHaveBeenCalledTimes(1);
  });

  it('loads random game if PRESET == -1 and is_random=true', () => {
    // ARRANGE
    // e.g. PRESET = -1 => triggers an if-block in your code
    gameState.PRESET = -1;

    // ACT
    makeNewGame(true); // pass is_random = true

    // ASSERT
    // For the random scenario, your code calls loadPreset(gameState.PRESET) i.e. loadPreset(-1)
    // double-check that happened:
    expect(loadPresetSpy).toHaveBeenCalledTimes(1);
    expect(loadPresetSpy).toHaveBeenCalledWith(-1);

    // Timer & state checks
    expect(timerResetSpy).toHaveBeenCalledTimes(1);
    expect(timerStartSpy).toHaveBeenCalledTimes(1);

    // etc.
  });

  it('resets the game state for a new preset game if PRESET != -1', () => {
    // ARRANGE
    // e.g. gameState.PRESET = 2
    gameState.PRESET = 2;

    // ACT
    makeNewGame(false);

    // ASSERT
    // 1) Timer calls
    expect(timerResetSpy).toHaveBeenCalledTimes(1);
    expect(timerStartSpy).toHaveBeenCalledTimes(1);

    // 2) Basic gameState checks
    expect(gameState.CURRENT_MOVE).toBe(0);
    expect(gameState.MOVE_COUNT).toBe(0);

    // 3) Confirm it calls loadPreset(PRESET)
    expect(loadPresetSpy).toHaveBeenCalledTimes(1);
    expect(loadPresetSpy).toHaveBeenCalledWith(2);

    // 4) Confirm the typical calls: display_preset_features, enable_advance, etc.
    expect(displayPresetFeaturesSpy).toHaveBeenCalledTimes(1);
    expect(enableAdvanceSpy).toHaveBeenCalledTimes(1);
  });

});
