// jscript/gameUI.js

import { gameState } from './state.js';
import { rule_dragenter, rule_dragover, rule_dragleave, rule_drop, rule_dragstart, rule_dragend, rule_mousedown, rule_mouseup } from './controllers.js';
import { nextMove, nextByRule } from './gamelogic.js';

export const COLORS = ['#9f9eb1', '#e33a3a', '#ff8026', '#e1d943', '#55d55a', '#56aaee', '#9d65d5', '#523742'];
export const COLOR_KEY = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'black'];

export const current_cell_overlay_left_offset = 11.46;

export function init_rows() {
	const gameboard_el = document.getElementById('gameboard');
	gameboard_el.innerHTML = "<tr><th>Rules</th><th colspan='" + (gameState.COLS - 1) + "'>Sequence</th><th>Goal</th></tr>";


	clearInterval(entry_page.anim_interval);
	document.body.style.backgroundColor = "#bdcfcf";

	for (let i = 0; i < gameState.ROWS; i++) {
		const row_tr = document.createElement('TR');

		// Attach event listeners to the table row
		row_tr.addEventListener('dragenter', rule_dragenter);
		row_tr.addEventListener('dragover', rule_dragover);
		row_tr.addEventListener('dragleave', rule_dragleave);
		row_tr.addEventListener('drop', rule_drop);

		const row_label_td = document.createElement('TD');

		const row_label_div = document.createElement('DIV');
		row_label_div.id = "label_" + i;
		row_label_div.draggable = "true"; // Draggable element
		row_label_div.className = "row_label";

		// Add event listeners to the draggable element
		row_label_div.addEventListener('dragstart', rule_dragstart);
		row_label_div.addEventListener('dragend', rule_dragend);
		row_label_div.addEventListener('mousedown', rule_mousedown);
		row_label_div.addEventListener('mouseup', rule_mouseup);

		row_label_td.appendChild(row_label_div);
		row_tr.appendChild(row_label_td);

		for (let j = 0; j < gameState.COLS; j++) {
			const cell_td = document.createElement('TD');
			cell_td.className = "game_cell_td";
			const cell_div = document.createElement('DIV');
			if (j == gameState.CURRENT_MOVE) {
				if (gameState.COOL_TRANSITIONS_ENABLED) {
					cell_div.className = "game_cell_invisible";
					document.getElementById('gameboard_overlay_container').style.opacity = "1";
				} else {
					cell_div.className = "game_cell_current";
				}
				////////////////////
			} else if (j == gameState.COLS - 1) {
				cell_div.className = "game_cell_goal";
				cell_div.style.backgroundColor = COLORS[gameState.GOALS[i]];
			} else if (j < gameState.CURRENT_MOVE) {
				cell_div.className = "game_cell_past";
			} else {
				cell_div.className = "game_cell_future";
			}
			cell_div.id = "cell_" + i + "_" + j;

			cell_td.appendChild(cell_div);
			row_tr.appendChild(cell_td);
		}

		gameboard_el.appendChild(row_tr);
	}

	//////////////////////////////
	const gameboard_overlay_el = document.getElementById('gameboard_overlay_container');
	gameboard_overlay_el.innerHTML = "";
	gameboard_overlay_el.style.top = (-11.7 * gameState.ROWS) + "em";
	gameboard_overlay_el.style.left = (current_cell_overlay_left_offset * gameState.CURRENT_MOVE) + "em";
	for (let i = 0; i < gameState.ROWS; i++) {
		const cell_overlay_container_el = document.createElement('DIV');
		cell_overlay_container_el.className = "gameboard_overlay_cell";

		const cell_overlay_el = document.createElement('DIV');
		cell_overlay_el.className = "game_cell_current";
		cell_overlay_el.id = "current_cell_" + i;
		const state = gameState.CA_STATE_MATRIX[i][gameState.CURRENT_MOVE];
		cell_overlay_el.style.backgroundColor = COLORS[state];
		cell_overlay_container_el.appendChild(cell_overlay_el);
		gameboard_overlay_el.appendChild(cell_overlay_container_el);
	}
	////////////////////////////////
}

export function drawRow(id, hint, new_rule) {
	let states = [];
	let wouldBeSolved = false;

	// Check if we're dragging over the source row
	const isSourceRow = (gameState.dragSrcEl_ && parseInt(gameState.dragSrcEl_.id.split('_')[1]) === id);

	// **Add this check to ensure CA_STATE_MATRIX[id] exists**
	if (!gameState.CA_STATE_MATRIX[id]) {
		console.error(`CA_STATE_MATRIX[${id}] is undefined`);
		return; // Exit the function if undefined
	}

	// **Add this check to ensure the last element exists**
	if (typeof gameState.CA_STATE_MATRIX[id][gameState.COLS - 1] === 'undefined') {
		console.error(`CA_STATE_MATRIX[${id}][${gameState.COLS - 1}] is undefined`);
		return; // Exit the function if undefined
	}

	// Determine if the row is already solved
	const isAlreadySolved = gameState.CA_STATE_MATRIX[id][gameState.COLS - 1] === gameState.GOALS[id];

	if (new_rule !== undefined && !isSourceRow) {
		// Use existing states up to the current move
		for (let i = 0; i <= gameState.CURRENT_MOVE; i++) {
			states.push(gameState.CA_STATE_MATRIX[id][i]);
		}

		// Recalculate future states starting from the current move using the new rule
		let state = gameState.CA_STATE_MATRIX[id][gameState.CURRENT_MOVE];
		for (let j = gameState.CURRENT_MOVE + 1; j < gameState.COLS; j++) {
			state = nextByRule(state, new_rule);
			states.push(state);
		}

		// Check if the row would be solved
		wouldBeSolved = states[gameState.COLS - 1] === gameState.GOALS[id];
	} else {
		states = gameState.CA_STATE_MATRIX[id];
		wouldBeSolved = states[gameState.COLS - 1] === gameState.GOALS[id];
	}

	// Update the goal cell display based on whether the row is solved or would be solved
	const goalCell = document.getElementById('cell_' + id + '_' + (gameState.COLS - 1));

	if (isAlreadySolved) {
		// If the row is already solved, ensure it retains the 'Solved' appearance
		goalCell.className = 'game_cell_goal_solved';
		goalCell.style.color = ''; // Reset color
		goalCell.innerHTML = '<b>SOLVED!</b>';
	} else if (wouldBeSolved && hint && new_rule !== undefined && !isSourceRow) {
		// Show the preview only if the row is not already solved and not the source row
		goalCell.className = 'game_cell_goal_solved_preview';
		goalCell.style.color = COLORS[gameState.GOALS[id]]; // Set the color for the circle
		goalCell.innerHTML = '<span>Will be Solved!</span>';
	} else {
		// Default goal cell appearance
		goalCell.className = 'game_cell_goal';
		goalCell.style.color = ''; // Reset color
		goalCell.innerHTML = '';
	}

	// Update the cell colors for each state
	for (let i = 0; i < gameState.COLS - 1; i++) {
		const state = states[i];
		const cell_id = 'cell_' + id + '_' + i;
		const cell_el = document.getElementById(cell_id);
		cell_el.style.backgroundColor = COLORS[state];

		if (i === gameState.CURRENT_MOVE) {
			if (gameState.COOL_TRANSITIONS_ENABLED) {
				cell_el.className = 'game_cell_invisible';
				document.getElementById('gameboard_overlay_container').style.display = 'block';
			} else {
				document.getElementById('gameboard_overlay_container').style.display = 'none';
				cell_el.className = 'game_cell_current';
			}
		} else if (i < gameState.CURRENT_MOVE) {
			cell_el.className = 'game_cell_past';
		} else {
			cell_el.className = 'game_cell_future';
			if (gameState.show_rows_ahead || hint) {
				cell_el.style.backgroundColor = COLORS[state];
			} else {
				cell_el.style.backgroundColor = '#bcc';
			}
		}
	}
}

export function drawRows() {
	for (let i = 0; i < gameState.ROWS; i++) {
		drawRow(i, 0);	// draw row, hint=0
	}
}

export function update_title_header() {
	const header_el = document.getElementById('game_title_display');
	header_el.innerHTML = gameState.GAME_NAME;

	const desc_el = document.getElementById('game_desc_display');
	desc_el.innerHTML = gameState.GAME_DESC;
}

export function disable_retreat_button() {
	const retreat_btn = document.getElementById('retreat_button');
	retreat_btn.className = "button_disabled";
	retreat_btn.style.cursor = 'default';
}

export function enable_retreat_button() {
	const retreat_btn = document.getElementById('retreat_button');
	retreat_btn.className = "button";
	retreat_btn.style.cursor = 'pointer';
}

export function disable_advance_button() {
	const advance_btn = document.getElementById('update_button');
	advance_btn.className = "button_disabled";
	advance_btn.onclick = function () { return false };
}

export function enable_advance_button() {
	const advance_btn = document.getElementById('update_button');
	advance_btn.className = "button";
	advance_btn.onclick = nextMove;
}

export function reveal_solve_button() {
	const solve_btn = document.getElementById('solve_button');
	solve_btn.style.display = "block";
}

export function hide_solve_button() {
	const solve_btn = document.getElementById('solve_button');
	solve_btn.style.display = "none";
}

export function update_dragndrop_style_display() {
	const style_display_el = document.getElementById('dragndrop_style_display');
	if (gameState.SWAP_ENABLED) {
		style_display_el.innerHTML = "Style: Swap";
	} else {
		style_display_el.innerHTML = "Style: Copy and Replace";
	}
}

export function solve() {
	disable_retreat_button();
	nextMove();
	--gameState.MOVE_COUNT;
	let interval = setInterval(function () {
		nextMove();
		--gameState.MOVE_COUNT;
		if (gameState.CURRENT_MOVE == gameState.COLS - 1) { clearInterval(interval) }
	}, 850)
}

export function display_rules() {
	for (let i = 0; i < gameState.ROWS; i++) {
		display_rule(i);
	}
}

export function display_rule(idx) {
	// Set the display.
	const rule = gameState.RULES[idx];

	const div_id = `label_${idx}`;
	const theDiv = document.getElementById(div_id);

	const image = `img/rule_images_svg/rule${rule}.svg`;

	theDiv.style.backgroundImage = `url(${image}`;
	theDiv.innerHTML = `<header id='header_${idx}'>${rule}</header>`;

	theDiv.setAttribute('data-rule', rule);
}

export function transition_states_animation(callback, is_forwards) {
	gameState.is_cool_transitions_animating = true;

	if (is_forwards) {
		for (let i = 0; i < gameState.ROWS; i++) {
			const next_el = document.getElementById(`cell_${i}_${gameState.CURRENT_MOVE}`);
			const next_state = gameState.CA_STATE_MATRIX[i][gameState.CURRENT_MOVE];

			next_el.style.display = "none";

			const overlay_el = document.getElementById(`current_cell_${i}`);
			overlay_el.className += " stretch_and_move";
			overlay_el.style.transition = "background-color .8s";
			overlay_el.style.backgroundColor = COLORS[next_state];
		}
		setTimeout(function () {
			for (let i = 0; i < gameState.ROWS; i++) {
				const next_el = document.getElementById(`cell_${i}_${gameState.CURRENT_MOVE}`);
				next_el.style.display = "block";

				const overlay_el = document.getElementById(`current_cell_${i}`);
				overlay_el.style.transition = "none";
				overlay_el.className = "game_cell_current";
			}

			const gameboard_overlay_el = document.getElementById('gameboard_overlay_container');
			gameboard_overlay_el.style.left = `${current_cell_overlay_left_offset * gameState.CURRENT_MOVE}em`;

			gameState.is_cool_transitions_animating = false;

			callback();
			if (gameState.CURRENT_MOVE == (gameState.COLS - 1)) {
				document.getElementById('gameboard_overlay_container').style.opacity = '0';
			}
		}, 800)
	} else {
		for (let i = 0; i < gameState.ROWS; i++) {
			const next_el = document.getElementById(`cell_${i}_${gameState.CURRENT_MOVE}`);
			const next_state = gameState.CA_STATE_MATRIX[i][gameState.CURRENT_MOVE];

			next_el.style.display = "none";

			const overlay_el = document.getElementById(`current_cell_${i}`);
			overlay_el.className += " stretch_and_move_backward";
			overlay_el.style.transition = "background-color .8s";
			overlay_el.style.backgroundColor = COLORS[next_state];
		}
		setTimeout( () => {
			for (let i = 0; i < gameState.ROWS; i++) {
				const next_el = document.getElementById(`cell_${i}_${gameState.CURRENT_MOVE}`);
				next_el.style.display = "block";

				const overlay_el = document.getElementById(`current_cell_${i}`);
				overlay_el.style.transition = "none";
				overlay_el.className = "game_cell_current";
			}

			const gameboard_overlay_el = document.getElementById('gameboard_overlay_container');
			gameboard_overlay_el.style.left = `${current_cell_overlay_left_offset * gameState.CURRENT_MOVE}em`;

			gameState.is_cool_transitions_animating = false;

			callback();
		}, 800)
	}
}

export function hide_screens() {
	const win_screen_element = document.getElementById('win_screen_container');
	win_screen_element.style.display = 'none';
	const lose_screen_element = document.getElementById('lose_screen_container');
	lose_screen_element.style.display = 'none';
}

export function set_preset_menu() {
	const select_el = document.getElementById('preset_select_el');
	select_el.value = gameState.GAME_NAME;
}

export function init_preset_menu() {
	const select_el = document.getElementById('preset_select_el');
	select_el.innerHTML = "";
	for (let i = 0; i < gameState.GAME_PRESETS.length; i++) {
		const option_el = document.createElement('OPTION');
		option_el.innerHTML = gameState.GAME_PRESETS[i].name; // or use "Game " + (i + 1) if you prefer
		select_el.appendChild(option_el);
	}
	select_el.selectedIndex = gameState.PRESET;
}

export function toggle_preset_menu() {
	const preset_el = document.getElementById('preset_select_el');
	if (preset_el.style.display == 'block') {
		preset_el.style.display = 'none';
	} else {
		preset_el.style.display = 'block';
	}
}

export function display_preset_features() {
	const preset = gameState.PRESET;
	const gamePresetsLength = gameState.GAME_PRESETS.length;

	const prevButton = document.getElementById('prev_button');
	const nextButton = document.getElementById('next_button');
	const randomButton = document.getElementById('random_button');
	const presetSelect = document.getElementById('preset_select_el');
	const updateButton = document.getElementById('update_button');
	const retreatButton = document.getElementById('retreat_button');

	// Handle prev/next button visibility
	if (preset === 0) {
		prevButton.style.display = 'none';
		nextButton.style.display = 'block';
	} else if (preset === -1) {
		prevButton.style.display = 'none';
		nextButton.style.display = 'none';
	} else if (preset === (gamePresetsLength - 1)) {
		nextButton.style.display = 'none';
	} else {
		prevButton.style.display = 'block';
		nextButton.style.display = 'block';
	}

	// Handle random/preset select visibility
	if (preset === -1) {
		randomButton.style.display = 'block';
		presetSelect.style.display = 'none';
	} else {
		randomButton.style.display = 'none';
		presetSelect.style.display = 'block';
	}

	// Show update and retreat buttons
	updateButton.style.display = 'block';
	retreatButton.style.display = 'block';
}

export function resize() {
	if (gameState.ROWS > 4) {
		document.body.style.fontSize = (14 - (gameState.ROWS - 4)) + 'px';
	} else {
		document.body.style.fontSize = '14px';
	}
}

export function updateMoveCounter() {
	document.getElementById("update_counter").innerHTML = gameState.MOVE_COUNT;
}

export function showSolvedRows(flag) {
	gameState.SHOW_SOLVED_ROWS = flag;
	drawRows();
}
