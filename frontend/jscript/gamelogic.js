// jscript/gamelogic.js

/**
 * Game logic module.
 * Manages game state, presets, transitions, and utility functions for Cellular Automata games.
 * This module provides functionality for starting, resetting, and transitioning between game states.
 * @module GameLogic
 */

import { gameState } from './state.js';
import { get_rules_list } from './get_rules.js';
import { loadPresets } from './presets.js';
import { loadPreset } from './presetMenu.js';
import { Timer } from './timer.js';
import { updateMoveCounter, resize, init_rows, drawRows, display_rules, update_title_header, update_dragndrop_style_display, init_preset_menu, display_preset_features, enable_advance_button, hide_solve_button, display_rule, transition_states_animation, hide_screens, set_preset_menu, reveal_solve_button, solve, disable_advance_button } from './gameUI.js';
import { win } from './win.js';
import { dereference } from './utility.js';

// Game play globals.
gameState.ROWS = 8
gameState.COLS = 8
gameState.RULES = [127, 53, 61, 43, 41, 17, 123, 213]
gameState.GOALS = [0, 0, 0, 0, 0, 0, 0, 0]
gameState.PRESET

gameState.moveHistory = []; // Stack to keep track of game moves

gameState.CURRENT_MOVE = 0
gameState.DRAG_COUNT = 0
gameState.MOVE_COUNT = 0

gameState.TIME = 0
gameState.timer = null;

gameState.SWAP_ENABLED = true
gameState.SHOW_SOLVED_ROWS = false
gameState.COOL_TRANSITIONS_ENABLED = true
gameState.is_cool_transitions_animating = false

// Instantiate 8x8 state matrix
gameState.CA_STATE_MATRIX = []

gameState.GAME_PRESETS = []

gameState.GAME_XML_URL = "games.xml"

gameState.GAME_NAME
gameState.GAME_DESC
gameState.SEEDS

gameState.initial_state = {}

/**
 * Initializes the game by loading presets and setting up the initial game state.
 * Displays the "Continue" button if a previous game state exists in localStorage.
 */
export function init_game() {
	if (localStorage.current_move !== undefined) {
		document.getElementById('entry_continue_button').style.display = "block"
	}

	get_rules_list(document.getElementById('all_rules'))
	loadPresets("games/" + gameState.GAME_XML_URL, function (xml) {
		const game_nodes = xml.getElementsByTagName("game")
		for (let i = 0; i < game_nodes.length; i++) {
			const game = {
				id: parseInt(
					game_nodes[i].getElementsByTagName("id")[0].childNodes[0].nodeValue),
				name: game_nodes[i].getElementsByTagName("name")[0].childNodes[0].nodeValue,
				desc: game_nodes[i].getElementsByTagName("desc")[0].childNodes[0].nodeValue,
				rows: parseInt(
					game_nodes[i].getElementsByTagName("rows")[0].childNodes[0].nodeValue),
				columns: parseInt(
					game_nodes[i].getElementsByTagName("columns")[0].childNodes[0].nodeValue),
				rules: parse_comma_number_list(
					game_nodes[i].getElementsByTagName("rules")[0].childNodes[0].nodeValue),
				seeds: parse_comma_number_list(
					game_nodes[i].getElementsByTagName("seeds")[0].childNodes[0].nodeValue),
				goals: parse_comma_number_list(
					game_nodes[i].getElementsByTagName("goals")[0].childNodes[0].nodeValue),
				show_rows_ahead: JSON.parse(
					game_nodes[i].getElementsByTagName("show_ahead")[0].childNodes[0].nodeValue
				),
				swap_enabled: JSON.parse(
					game_nodes[i].getElementsByTagName("swap_enabled")[0].childNodes[0].nodeValue
				)
			}
			gameState.GAME_PRESETS.push(game)
		}

		start_game(undefined, false)
	})
}

/**
 * Parses a string of comma-separated numbers and returns an array of integers.
 * @param {string} str - The input string containing comma-separated numbers.
 * @returns {number[]} An array of parsed integers.
 */
export function parse_comma_number_list(str) {
	const str_split = str.split(",")
	const new_array = []
	for (let i = 0; i < str_split.length; i++) {
		const match = str_split[i].match(/\d+/)
		let int_str = ""
		for (let j = 0; j < match.length; j++) {
			int_str += match[j]
		}
		const parsed_int = parseInt(int_str)
		new_array.push(parsed_int)
	}
	return new_array
}

/**
 * Starts a new game or resumes an existing one based on the preset or localStorage state.
 * Updates the game board, initializes timers, and restores UI elements.
 * @param {number} [preset] - The preset to use for initializing the game. If undefined, resumes the saved game state.
 */
export function start_game(preset) {
	gameState.timer = new Timer(document.getElementById('timer'), function (_this) {
		localStorage.time = _this.elapsed_ms;
	});

	gameState.moveHistory = JSON.parse(localStorage.moveHistory || '[]');

	if (gameState.MOVE_COUNT === 0) {
		disable_retreat_button();
	} else {
		enable_retreat_button();
	}

	if (preset !== undefined) {
		// Set PRESET and update localStorage.preset
		gameState.PRESET = preset;
		localStorage.preset = gameState.PRESET;
		loadPreset(preset);
	} else {
		if (localStorage.initial_state !== undefined)
			gameState.initial_state = JSON.parse(localStorage.initial_state);

		gameState.PRESET = parseInt(localStorage.preset) || 0;
		gameState.CURRENT_MOVE = parseInt(localStorage.current_move) || 0;
		gameState.DRAG_COUNT = parseInt(localStorage.drag_count) || 0;
		gameState.MOVE_COUNT = parseInt(localStorage.move_count) || 0;
		updateMoveCounter();

		gameState.TIME = parseInt(localStorage.time) || 0;
		gameState.timer.set_time(gameState.TIME);

		gameState.ROWS = parseInt(localStorage.rows) || 8;
		gameState.COLS = parseInt(localStorage.cols) || 8;
		gameState.RULES = JSON.parse(localStorage.rules || '[]');
		gameState.CA_STATE_MATRIX = JSON.parse(localStorage.state_matrix || '[]');
		gameState.GOALS = JSON.parse(localStorage.goals || '[]');

		gameState.SWAP_ENABLED = JSON.parse(localStorage.swap_enabled || 'true');
		gameState.show_rows_ahead = JSON.parse(localStorage.show_rows_ahead || 'true');
		gameState.GAME_NAME = localStorage.game_name || 'Default Game';
		gameState.GAME_DESC = localStorage.game_desc || '';


		// Initialize the game board
		resize();
		init_rows();
		drawRows();
		display_rules();
		update_title_header();
		update_dragndrop_style_display();
		init_preset_menu();
		display_preset_features();

		// Restore the state of advance and retreat buttons
		if (gameState.CURRENT_MOVE === 0) {
			disable_retreat_button();
		} else {
			enable_retreat_button();
		}
		if (gameState.CURRENT_MOVE === gameState.COLS - 2 && !test_win()) {
			disable_advance_button();
		} else {
			enable_advance_button();
		}

		if (test_win()) {
			reveal_solve_button();
		} else {
			hide_solve_button();
		}
	}

	gameState.timer.start();
}

/**
 * Creates a random game preset with default rows, columns, and randomized rules, seeds, and goals.
 * This function is used to generate a game configuration dynamically.
 * @returns {Object} An object representing the random game preset.
 * @property {number} rows - The number of rows in the game (default: 8).
 * @property {number} columns - The number of columns in the game (default: 8).
 * @property {number[]} seeds - An array of random initial seed values for each row.
 * @property {number[]} rules - An array of random rules for each row.
 * @property {number[]} goals - An array of random goal states for each row.
 * @property {boolean} swap_enabled - Whether swapping is enabled (default: false).
 * @property {boolean} show_rows_ahead - Whether to show rows ahead (default: false).
 * @property {string} name - The name of the game (default: "Random Game").
 * @property {string} desc - The description of the game (default: empty string).
 */
export function create_random_preset() {
	const game = {}
	game.rows = 8
	game.columns = 8
	game.seeds = []
	for (let i = 0; i < game.rows; i++) {
		game.seeds.push(Math.floor(Math.random() * 6) + 1)
	}
	game.rules = []
	for (let i = 0; i < game.rows; i++) {
		game.rules.push(Math.floor(Math.random() * 256))
	}
	game.goals = []
	for (let i = 0; i < game.rows; i++) {
		game.goals.push(Math.floor(Math.random() * 8))
	}
	game.swap_enabled = false
	game.show_rows_ahead = false
	game.name = "Random Game"
	game.desc = ""
	return game
}

/**
 * Advances the game to the next move.
 * Updates the game state, move count, and UI. Handles transitions if enabled.
 */
export function nextMove() {
	if (gameState.COOL_TRANSITIONS_ENABLED && gameState.is_cool_transitions_animating) return

	if (gameState.CURRENT_MOVE < gameState.COLS - 1) {
		gameState.MOVE_COUNT++
		localStorage.move_count = gameState.MOVE_COUNT
		updateMoveCounter()

		// Record the move
		gameState.moveHistory.push({ action: 'advance' });
		localStorage.moveHistory = JSON.stringify(gameState.moveHistory);

		gameState.CURRENT_MOVE++
		localStorage.current_move = gameState.CURRENT_MOVE

		enable_retreat_button()
		if (gameState.CURRENT_MOVE == gameState.COLS - 2) {
			if (!test_win()) {
				disable_advance_button()
			}
		}

		if (gameState.COOL_TRANSITIONS_ENABLED) {
			transition_states_animation(function () {
				drawRows()

				gameState.timer.start()

				if (gameState.CURRENT_MOVE == gameState.COLS - 1 && test_win()) {
					win()
				}
			}, true)
		} else {
			drawRows()

			gameState.timer.start()

			if (gameState.CURRENT_MOVE == gameState.COLS - 1 && test_win()) {
				win()
			}
		}

	}
}

/**
 * Moves the game back one step in the move history.
 * Handles undoing the last action, updating the game state, and recalculating the Cellular Automata state matrix.
 * Skips action if animations are in progress.
 */
export function retreat() {
	if (gameState.COOL_TRANSITIONS_ENABLED && gameState.is_cool_transitions_animating) return;

	if (gameState.moveHistory.length > 0) {
		const lastMove = gameState.moveHistory.pop();

		if (lastMove.action === 'advance') {
			// Decrement MOVE_COUNT safely
			if (gameState.MOVE_COUNT > 0) {
				gameState.MOVE_COUNT--;
				localStorage.move_count = gameState.MOVE_COUNT;
				updateMoveCounter();
			}

			// Undo the advance move safely
			if (gameState.CURRENT_MOVE > 0) {
				gameState.CURRENT_MOVE--;
				localStorage.current_move = gameState.CURRENT_MOVE;
			}

			enable_advance_button();

			// Recalculate CA_STATE_MATRIX from CURRENT_MOVE onwards
			for (let i = 0; i < gameState.ROWS; i++) {
				let state = gameState.CA_STATE_MATRIX[i][gameState.CURRENT_MOVE];
				for (let j = gameState.CURRENT_MOVE + 1; j < gameState.COLS; j++) {
					state = nextByRule(state, gameState.RULES[i]);
					gameState.CA_STATE_MATRIX[i][j] = state;
				}
			}

			localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX);

			if (gameState.COOL_TRANSITIONS_ENABLED) {
				transition_states_animation(function () {
					drawRows();
					gameState.timer.start();

					if (gameState.CURRENT_MOVE === gameState.COLS - 1 && test_win()) {
						win();
					}
				}, false);
			} else {
				drawRows();
				gameState.timer.start();
			}
		} else if (lastMove.action === 'ruleChange') {
			// Decrement MOVE_COUNT safely
			if (gameState.MOVE_COUNT > 0) {
				gameState.MOVE_COUNT--;
				localStorage.move_count = gameState.MOVE_COUNT;
				updateMoveCounter();
			}

			// Undo the rule change
			const fromIndex = lastMove.fromIndex;
			const toIndex = lastMove.toIndex;
			const fromRule = lastMove.fromRule;
			const toRule = lastMove.toRule;

			// Swap back the rules
			setRule(fromIndex, fromRule, true);
			setRule(toIndex, toRule, true);

			// Update the rule display
			display_rule(fromIndex);
			display_rule(toIndex);

			// Recalculate the CA_STATE_MATRIX for affected rows
			for (let i = 0; i < gameState.ROWS; i++) {
				let state = gameState.CA_STATE_MATRIX[i][0];
				for (let j = 1; j < gameState.COLS; j++) {
					state = nextByRule(state, gameState.RULES[i]);
					gameState.CA_STATE_MATRIX[i][j] = state;
				}
			}

			localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX);

			drawRows();
			gameState.timer.start();
		}

		// Disable the retreat button if MOVE_COUNT == 0
		if (gameState.MOVE_COUNT === 0) {
			disable_retreat_button();
		} else {
			enable_retreat_button();
		}
	} else {
		// If moveHistory is empty, ensure buttons are correctly disabled
		disable_retreat_button();
		// Optionally, enable the advance button if needed
		enable_advance_button();
	}
}

/**
 * Checks if the current game state matches the goal state.
 * @returns {boolean} True if the current game state meets all goals; otherwise, false.
 */
export function test_win() {
	for (let i = 0; i < gameState.GOALS.length; i++) {
		if (gameState.GOALS[i] != gameState.CA_STATE_MATRIX[i].slice(-1)[0]) {
			return false
		}
	}
	return true
}

/**
 * Advances the game to the next preset header.
 * Loads the next game preset, wrapping around to the first preset if the end is reached.
 */
export function next_game_header() {
	let nextPresetIndex = gameState.PRESET + 1;

	if (nextPresetIndex >= gameState.GAME_PRESETS.length) {
		// If there are no more presets, handle accordingly
		nextPresetIndex = 0; // or return; to prevent wrapping around
	}

	loadPreset(nextPresetIndex);
}

/**
 * Handles the transition to the next game after a win.
 * Sends the win data if a name is provided, then starts the next game.
 */
export function next_game_win() {
	if (document.getElementById('name_input') != null &&
		document.getElementById('name_input').value) {
		send_win_data(`moves=${gameState.MOVE_COUNT}&time=${gameState.timer.get_time_str()}&game=${gameState.GAME_NAME}&name=${document.getElementById('name_input').value}`);
		setTimeout(next_game, 1000)
	} else {
		next_game()
	}
}

/**
 * Advances to the next game preset.
 * Resets the game state if the last preset is reached.
 */
export function next_game() {
	gameState.PRESET++
	if (gameState.PRESET == gameState.GAME_PRESETS.length) gameState.PRESET = 0
	reset()
}

/**
 * Moves back to the previous game preset.
 * Prevents navigating before the first preset.
 */
export function prev_game() {
	gameState.PRESET--
	if (gameState.PRESET < 0) gameState.PRESET = 0
	reset()
}

/**
 * Sets the initial seed value for a specific row in the Cellular Automata state matrix.
 * Updates the corresponding state in localStorage.
 * @param {number} idx - The index of the row to set the seed for.
 * @param {number} seed - The seed value to set.
 */
export function setSeed(idx, seed) {
	gameState.CA_STATE_MATRIX[idx][0] = seed
	localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX)
}

/**
 * Resets the seed values for all rows in the Cellular Automata state matrix.
 * Assigns a random seed to each row using the `chooseSeed` function.
 */
export function resetSeeds() {
	for (let i = 0; i < gameState.ROWS; i++) {
		setSeed(i, chooseSeed())
	}
}

/**
 * Sets the goal state for a specific column in the game.
 * Updates the corresponding goal in localStorage.
 * @param {number} idx - The index of the column to set the goal for.
 * @param {number} goal - The goal value to set.
 */
export function setGoal(idx, goal) {
	gameState.GOALS[idx] = goal
	localStorage.goals = JSON.stringify(gameState.GOALS)
}

/**
 * Resets the goal values for all columns in the game.
 * Assigns a random goal to each column using the `chooseGoal` function.
 */
export function resetGoals() {
	for (let i = 0; i < gameState.COLS; i++)
		setGoal(i, chooseGoal())
}

/**
 * Resets the rules for all rows in the Cellular Automata.
 * Assigns a random rule to each row using the `chooseRule` function.
 */
export function resetRules() {
	for (let i = 0; i < gameState.COLS; i++)
		setRule(i, chooseRule())
}

/**
 * Sets a rule for a specific row in the Cellular Automata.
 * Updates the rule in localStorage and recalculates the state matrix from the specified move onwards.
 * @param {number} idx - The index of the row to set the rule for.
 * @param {number} rule - The rule value to set.
 * @param {boolean} [recalculateFromStart=false] - Whether to recalculate the state matrix from the first move.
 */
export function setRule(idx, rule, recalculateFromStart = false) {
	// Save the new rule
	gameState.RULES[idx] = rule;
	localStorage.rules = JSON.stringify(gameState.RULES);

	// Recalculate the state matrix starting from the appropriate point
	const startMove = recalculateFromStart ? 0 : gameState.CURRENT_MOVE;
	let state = gameState.CA_STATE_MATRIX[idx][startMove]; // Start from the seed or current move
	for (let i = startMove + 1; i < gameState.COLS; i++) {
		state = nextByRule(state, rule);
		gameState.CA_STATE_MATRIX[idx][i] = state;
	}
	localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX);
	display_rule(idx, rule);
}

/**
 * Resets the game state and initializes a new game.
 * Configures either a random game or a preset game based on the provided parameter.
 * @param {boolean} [is_random=false] - Whether to create a random game. Defaults to `false` for a preset game.
 */
export function makeNewGame(is_random = false) {
	gameState.timer.reset()
	gameState.timer.start()

	gameState.CURRENT_MOVE = 0

	gameState.MOVE_COUNT = 0;
	localStorage.move_count = gameState.MOVE_COUNT;

	localStorage.current_move = gameState.CURRENT_MOVE

	gameState.DRAG_COUNT = 0
	localStorage.drag_count = gameState.DRAG_COUNT

	gameState.moveHistory = [];
	localStorage.moveHistory = JSON.stringify(gameState.moveHistory);

	disable_retreat_button()

	updateMoveCounter()
	update_dragndrop_style_display()
	hide_solve_button()
	disable_retreat_button()
	//if(PRESET!=0)
	enable_advance_button()
	hide_screens()
	display_preset_features()

	if (gameState.PRESET == -1) {
		if (is_random) {
			loadPreset(gameState.PRESET)
		} else {
			gameState.ROWS = gameState.initial_state.rows
			localStorage.rows = gameState.ROWS
			gameState.COLS = gameState.initial_state.columns
			localStorage.cols = gameState.COLS

			gameState.SEEDS = gameState.initial_state.seeds

			gameState.RULES = dereference(gameState.initial_state.rules)
			localStorage.rules = JSON.stringify(gameState.RULES)

			//init empty matrix
			gameState.CA_STATE_MATRIX = []
			for (let i = 0; i < gameState.ROWS; i++) {
				gameState.CA_STATE_MATRIX.push([])
				for (let j = 0; j < gameState.COLS; j++) {
					gameState.CA_STATE_MATRIX[i].push(0)
				}
			}

			//fill matrix
			for (let i = 0; i < gameState.ROWS; i++) {
				gameState.CA_STATE_MATRIX[i][0] = gameState.SEEDS[i]
				let state = gameState.CA_STATE_MATRIX[i][0]
				for (let j = 1; j < gameState.COLS; j++) {
					state = nextByRule(state, gameState.RULES[i])
					gameState.CA_STATE_MATRIX[i][j] = state
				}
			}
			localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX)

			gameState.GOALS = gameState.initial_state.goals
			localStorage.goals = JSON.stringify(gameState.GOALS)

			gameState.SWAP_ENABLED = gameState.initial_state.swap_enabled
			localStorage.swap_enabled = gameState.SWAP_ENABLED

			show_rows_ahead = gameState.initial_state.show_rows_ahead
			localStorage.show_rows_ahead = show_rows_ahead

			gameState.GAME_NAME = gameState.initial_state.name
			localStorage.game_name = gameState.GAME_NAME

			gameState.GAME_DESC = gameState.initial_state.desc
			localStorage.game_desc = gameState.GAME_DESC

			init_rows()
			display_rules()
			hide_solve_button()
			drawRows()
			//display_preset_features()
		}
	} else {
		loadPreset(gameState.PRESET)
	}

	set_preset_menu()
}

/**
 * Resets the game state and initializes a new preset game.
 */
export function reset() {
	makeNewGame(false)
}

/**
 * Resets the game state and initializes a new random game.
 */
export function random() {
	makeNewGame(true)
}

/****************************
	Cellular Automata
*****************************/

/**
 * Tests whether a specific bit is set in a value.
 * @param {number} value - The number to test.
 * @param {number} bit - The bit position to check (0-indexed).
 * @returns {number} - A non-zero value if the bit is set; otherwise, 0.
 */
export function bitTest(value, bit) {
	return value & (1 << bit)
}

/**
 * Sets a specific bit in a value.
 * @param {number} value - The number to modify.
 * @param {number} bit - The bit position to set (0-indexed).
 * @returns {number} - The new value with the specified bit set.
 */
export function bitSet(value, bit) {
	return value | (1 << bit)
}

/**
 * Calculates the next state of a Cellular Automata row based on the given rule.
 * Applies a 3-cell neighborhood rule to determine the new state.
 * @param {number} state - The current state of the row as a bitmask.
 * @param {number} rule - The rule to apply, represented as an 8-bit number.
 * @returns {number} - The new state of the row as a bitmask.
 */
export function nextByRule(state, rule) {
	//	if ( state == 0 ) return state;	// suppress grey cells
	const n = 3
	let newState = 0
	for (let i = 0; i < n; i++) {
		const n1 = bitTest(state, i)
		const n2 = bitTest(state, (i + 1) % n)
		const n3 = bitTest(state, (i + 2) % n)
		let ri = 0
		if (n1) ri = 1
		if (n2) ri += 2
		if (n3) ri += 4
		if (bitTest(rule, ri))
			newState = bitSet(newState, (i + 1) % n)
	}
	return newState
}

// Utilities

/**
 * Generates a random integer from 0 to N-1.
 * @param {number} N - The upper limit (exclusive) for the random number.
 * @returns {number} - A random integer in the range [0, N).
 */
export function rnd(N) {
	return Math.floor(Math.random() * (N))
}

/**
 * Chooses a random Cellular Automata rule.
 * @returns {number} - A random rule represented as an integer from 0 to 255.
 */
export function chooseRule() {
	// Choose a new rule at random
	return Math.floor(Math.random() * (256))	// 256 is the number of CA rules.
}

/**
 * Chooses a random goal for a Cellular Automata column.
 * @returns {number} - A random goal value represented as an integer from 0 to 7.
 */
export function chooseGoal() {
	// Choose a new goal at random
	return Math.floor(Math.random() * (8))	// 8 is the number of possible states.
}

/**
 * Chooses a random seed for a Cellular Automata row.
 * Seeds cannot be 0 or 7, so this function returns a value between 1 and 6.
 * @returns {number} - A random seed value between 1 and 6 (inclusive).
 */
export function chooseSeed() {
	// There are 8 possible CA states, but gameplay requires that seeds
	// cannot be 0 or 7.
	// This routine returns a pseudo-random number between 1 and 6, inclusive.
	return Math.floor(Math.random() * (6)) + 1
}

/**
 * Enables the retreat button, allowing the user to move back in the game.
 * Attaches a click event listener to the button.
 */
export function enable_retreat_button() {
	const retreat_btn = document.getElementById('retreat_button');
	retreat_btn.className = 'button';
	retreat_btn.addEventListener('click', retreat);
	retreat_btn.style.cursor = 'pointer';
}

/**
 * Disables the retreat button, preventing the user from moving back in the game.
 * Removes the click event listener from the button.
 */
export function disable_retreat_button() {
	const retreat_btn = document.getElementById('retreat_button');
	retreat_btn.className = 'button_disabled';
	retreat_btn.removeEventListener('click', retreat);
	retreat_btn.style.cursor = 'default';
}
