// jscript/gamelogic.js

import { gameState } from './state.js';
import { get_rules_list } from './get_rules.js';
import { loadPresets } from './presets.js';
import { loadPreset } from './presetMenu.js';
import { Timer } from './timer.js';
import { updateMoveCounter, resize, init_rows, drawRows, display_rules, update_title_header, update_dragndrop_style_display, init_preset_menu, display_preset_features, enable_advance_button, hide_solve_button, display_rule, transition_states_animation, hide_screens, set_preset_menu, reveal_solve_button, solve, disable_advance_button } from './gameUI.js';
import { win } from './win.js';

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

// Move counter
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


export function test_win() {
	for (let i = 0; i < gameState.GOALS.length; i++) {
		if (gameState.GOALS[i] != gameState.CA_STATE_MATRIX[i].slice(-1)[0]) {
			return false
		}
	}
	return true
}

export function next_game_header() {
	let nextPresetIndex = gameState.PRESET + 1;

	if (nextPresetIndex >= gameState.GAME_PRESETS.length) {
		// If there are no more presets, handle accordingly
		nextPresetIndex = 0; // or return; to prevent wrapping around
	}

	loadPreset(nextPresetIndex);
}

export function next_game_win() {
	if (document.getElementById('name_input') != null &&
		document.getElementById('name_input').value) {
		send_win_data(`moves=${gameState.MOVE_COUNT}&time=${gameState.timer.get_time_str()}&game=${gameState.GAME_NAME}&name=${document.getElementById('name_input').value}`);
		setTimeout(next_game, 1000)
	} else {
		next_game()
	}
}

export function next_game() {
	gameState.PRESET++
	if (gameState.PRESET == gameState.GAME_PRESETS.length) gameState.PRESET = 0
	reset()
}

export function prev_game() {
	gameState.PRESET--
	if (gameState.PRESET < 0) gameState.PRESET = 0
	reset()
}

export function setSeed(idx, seed) {
	gameState.CA_STATE_MATRIX[idx][0] = seed
	localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX)
}

export function resetSeeds() {
	for (let i = 0; i < gameState.ROWS; i++) {
		setSeed(i, chooseSeed())
	}
}

export function setGoal(idx, goal) {
	gameState.GOALS[idx] = goal
	localStorage.goals = JSON.stringify(gameState.GOALS)
}

export function resetGoals() {
	for (let i = 0; i < gameState.COLS; i++)
		setGoal(i, chooseGoal())
}

export function resetRules() {
	for (let i = 0; i < gameState.COLS; i++)
		setRule(i, chooseRule())
}

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

export function reset() {
	makeNewGame(false)
}

export function random() {
	makeNewGame(true)
}
/****************************
	Cellular Automata
*****************************/
export function bitTest(value, bit) {
	return value & (1 << bit)
}
export function bitSet(value, bit) {
	return value | (1 << bit)
}
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
export function rnd(N) {
	return Math.floor(Math.random() * (N))
}
export function chooseRule() {
	// Choose a new rule at random
	return Math.floor(Math.random() * (256))	// 256 is the number of CA rules.
}
export function chooseGoal() {
	// Choose a new goal at random
	return Math.floor(Math.random() * (8))	// 8 is the number of possible states.
}
export function chooseSeed() {
	// There are 8 possible CA states, but gameplay requires that seeds
	// cannot be 0 or 7.
	// This routine returns a pseudo-random number between 1 and 6, inclusive.
	return Math.floor(Math.random() * (6)) + 1
}

export function enable_retreat_button() {
	const retreat_btn = document.getElementById('retreat_button');
	retreat_btn.className = 'button';
	retreat_btn.addEventListener('click', retreat);
	retreat_btn.style.cursor = 'pointer';
}

export function disable_retreat_button() {
	const retreat_btn = document.getElementById('retreat_button');
	retreat_btn.className = 'button_disabled';
	retreat_btn.removeEventListener('click', retreat);
	retreat_btn.style.cursor = 'default';
}
