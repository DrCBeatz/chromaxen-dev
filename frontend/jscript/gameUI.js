// jscript/gameUI.js

var COLORS = ['#9f9eb1', '#e33a3a', '#ff8026', '#e1d943', '#55d55a', '#56aaee', '#9d65d5', '#523742']
var COLOR_KEY = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'black']

var current_cell_overlay_left_offset = 11.46

var show_rows_ahead = true


function init_rows() {
	var gameboard_el = document.getElementById('gameboard');
	gameboard_el.innerHTML = "<tr><th>Rules</th><th colspan='" + (COLS - 1) + "'>Sequence</th><th>Goal</th></tr>";


	clearInterval(entry_page.anim_interval)
	document.body.style.backgroundColor = "#bdcfcf"

	for (var i = 0; i < ROWS; i++) {
		var row_tr = document.createElement('TR');

		// Attach event listeners to the table row
		row_tr.addEventListener('dragenter', rule_dragenter);
		row_tr.addEventListener('dragover', rule_dragover);
		row_tr.addEventListener('dragleave', rule_dragleave);
		row_tr.addEventListener('drop', rule_drop);

		var row_label_td = document.createElement('TD');

		var row_label_div = document.createElement('DIV');
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

		for (var j = 0; j < COLS; j++) {
			var cell_td = document.createElement('TD')
			cell_td.className = "game_cell_td"
			var cell_div = document.createElement('DIV')
			if (j == CURRENT_MOVE) {
				if (COOL_TRANSITIONS_ENABLED) {
					cell_div.className = "game_cell_invisible"
					document.getElementById('gameboard_overlay_container').style.opacity = "1"
				} else {
					cell_div.className = "game_cell_current"
				}
				////////////////////
			} else if (j == COLS - 1) {
				cell_div.className = "game_cell_goal"
				cell_div.style.backgroundColor = COLORS[GOALS[i]]
			} else if (j < CURRENT_MOVE) {
				cell_div.className = "game_cell_past"
			} else {
				cell_div.className = "game_cell_future"
			}
			cell_div.id = "cell_" + i + "_" + j

			cell_td.appendChild(cell_div)
			row_tr.appendChild(cell_td)
		}

		gameboard_el.appendChild(row_tr)
	}

	//////////////////////////////
	var gameboard_overlay_el = document.getElementById('gameboard_overlay_container')
	gameboard_overlay_el.innerHTML = ""
	gameboard_overlay_el.style.top = (-11.7 * ROWS) + "em"
	gameboard_overlay_el.style.left = (current_cell_overlay_left_offset * CURRENT_MOVE) + "em"
	for (var i = 0; i < ROWS; i++) {
		var cell_overlay_container_el = document.createElement('DIV')
		cell_overlay_container_el.className = "gameboard_overlay_cell"

		var cell_overlay_el = document.createElement('DIV')
		cell_overlay_el.className = "game_cell_current"
		cell_overlay_el.id = "current_cell_" + i
		var state = CA_STATE_MATRIX[i][CURRENT_MOVE]
		cell_overlay_el.style.backgroundColor = COLORS[state]
		cell_overlay_container_el.appendChild(cell_overlay_el)
		gameboard_overlay_el.appendChild(cell_overlay_container_el)
	}
	////////////////////////////////
}

function drawRow(id, hint, new_rule) {
	var states = [];
	var wouldBeSolved = false;

	// Check if we're dragging over the source row
	var isSourceRow = (dragSrcEl_ && parseInt(dragSrcEl_.id.split('_')[1]) === id);

	// Determine if the row is already solved
	var isAlreadySolved = CA_STATE_MATRIX[id][COLS - 1] === GOALS[id];

	if (new_rule !== undefined && !isSourceRow) {
		// Use existing states up to the current move
		for (var i = 0; i <= CURRENT_MOVE; i++) {
			states.push(CA_STATE_MATRIX[id][i]);
		}

		// Recalculate future states starting from the current move using the new rule
		var state = CA_STATE_MATRIX[id][CURRENT_MOVE];
		for (var j = CURRENT_MOVE + 1; j < COLS; j++) {
			state = nextByRule(state, new_rule);
			states.push(state);
		}

		// Check if the row would be solved
		wouldBeSolved = states[COLS - 1] === GOALS[id];
	} else {
		states = CA_STATE_MATRIX[id];
		wouldBeSolved = states[COLS - 1] === GOALS[id];
	}

	// Update the goal cell display based on whether the row is solved or would be solved
	var goalCell = document.getElementById('cell_' + id + '_' + (COLS - 1));

	if (isAlreadySolved) {
		// If the row is already solved, ensure it retains the 'Solved' appearance
		goalCell.className = 'game_cell_goal_solved';
		goalCell.style.color = ''; // Reset color
		goalCell.innerHTML = '<b>SOLVED!</b>';
	} else if (wouldBeSolved && hint && new_rule !== undefined && !isSourceRow) {
		// Show the preview only if the row is not already solved and not the source row
		goalCell.className = 'game_cell_goal_solved_preview';
		goalCell.style.color = COLORS[GOALS[id]]; // Set the color for the circle
		goalCell.innerHTML = '<span>Will be Solved!</span>';
	} else {
		// Default goal cell appearance
		goalCell.className = 'game_cell_goal';
		goalCell.style.color = ''; // Reset color
		goalCell.innerHTML = '';
	}

	// Update the cell colors for each state
	for (var i = 0; i < COLS - 1; i++) {
		var state = states[i];
		var cell_id = 'cell_' + id + '_' + i;
		var cell_el = document.getElementById(cell_id);
		cell_el.style.backgroundColor = COLORS[state];

		if (i === CURRENT_MOVE) {
			if (COOL_TRANSITIONS_ENABLED) {
				cell_el.className = 'game_cell_invisible';
				document.getElementById('gameboard_overlay_container').style.display = 'block';
			} else {
				document.getElementById('gameboard_overlay_container').style.display = 'none';
				cell_el.className = 'game_cell_current';
			}
		} else if (i < CURRENT_MOVE) {
			cell_el.className = 'game_cell_past';
		} else {
			cell_el.className = 'game_cell_future';
			if (show_rows_ahead || hint) {
				cell_el.style.backgroundColor = COLORS[state];
			} else {
				cell_el.style.backgroundColor = '#bcc';
			}
		}
	}
}

function drawRows() {
	for (var i = 0; i < ROWS; i++) {
		drawRow(i, 0);	// draw row, hint=0
	}
}

function update_title_header() {
	//update title header
	var header_el = document.getElementById('game_title_display')
	header_el.innerHTML = GAME_NAME//"Game "+(PRESET+1)

	var desc_el = document.getElementById('game_desc_display')
	desc_el.innerHTML = GAME_DESC
}

function disable_retreat_button() {
	var retreat_btn = document.getElementById('retreat_button')
	retreat_btn.className = "button_disabled"
	// retreat_btn.onclick = function () { return false }
	retreat_btn.style.cursor = 'default';
}

function enable_retreat_button() {
	var retreat_btn = document.getElementById('retreat_button')
	retreat_btn.className = "button"
	retreat_btn.style.cursor = 'pointer';
	// retreat_btn.onclick = retreat
}

function disable_advance_button() {
	var advance_btn = document.getElementById('update_button')
	advance_btn.className = "button_disabled"
	advance_btn.onclick = function () { return false }
}

function enable_advance_button() {
	var advance_btn = document.getElementById('update_button')
	advance_btn.className = "button"
	advance_btn.onclick = nextMove
}

function reveal_solve_button() {
	document.getElementById('solve_button').style.display = "block"
}

function hide_solve_button() {
	document.getElementById('solve_button').style.display = "none"
}

function update_dragndrop_style_display() {
	var style_display_el = document.getElementById('dragndrop_style_display')
	if (SWAP_ENABLED) {
		style_display_el.innerHTML = "Style: Swap"
	} else {
		style_display_el.innerHTML = "Style: Copy and Replace"
	}
}

function solve() {
	disable_retreat_button()
	nextMove()
	--MOVE_COUNT
	var interval = setInterval(function () {
		nextMove()
		--MOVE_COUNT
		if (CURRENT_MOVE == COLS - 1) { clearInterval(interval) }
	}, 850)
}

function display_rules() {
	for (var i = 0; i < ROWS; i++) {
		display_rule(i)
	}
}

function display_rule(idx) {
	// Set the display.
	var rule = RULES[idx]

	var div_id = "label_" + idx
	var theDiv = document.getElementById(div_id)
	//var rule_onebased = rule + 1

	var image = "img/rule_images_svg/rule" + rule + ".svg"
	//var image = "img/xRuleImages_80x80xx/xrule" + rule_onebased + ".jpg"

	theDiv.style.backgroundImage = "url(" + image + ")"
	//if(PRESET>9 || PRESET == -1){
	theDiv.innerHTML = "<header id='header_" + idx + "'>" + rule + "</header>"
	//}

	theDiv.setAttribute('data-rule', rule)
}

function transition_states_animation(callback, is_forwards) {
	is_cool_transitions_animating = true
	if (is_forwards) {
		for (var i = 0; i < ROWS; i++) {
			var next_el = document.getElementById('cell_' + i + '_' + (CURRENT_MOVE))

			var next_state = CA_STATE_MATRIX[i][CURRENT_MOVE]

			next_el.style.display = "none"

			var overlay_el = document.getElementById('current_cell_' + i)
			overlay_el.className += " stretch_and_move"
			overlay_el.style.transition = "background-color .8s"
			overlay_el.style.backgroundColor = COLORS[next_state]
		}
		setTimeout(function () {
			for (var i = 0; i < ROWS; i++) {
				var next_el = document.getElementById('cell_' + i + '_' + (CURRENT_MOVE))

				next_el.style.display = "block"


				var overlay_el = document.getElementById('current_cell_' + i)
				overlay_el.style.transition = "none"
				overlay_el.className = "game_cell_current"
			}
			var gameboard_overlay_el = document.getElementById('gameboard_overlay_container')
			gameboard_overlay_el.style.left = (current_cell_overlay_left_offset * CURRENT_MOVE) + "em"

			is_cool_transitions_animating = false

			callback()
			if (CURRENT_MOVE == (COLS - 1)) {
				document.getElementById('gameboard_overlay_container').style.opacity = '0'
			}
		}, 800)
	} else {
		for (var i = 0; i < ROWS; i++) {
			var next_el = document.getElementById('cell_' + i + '_' + (CURRENT_MOVE))

			var next_state = CA_STATE_MATRIX[i][CURRENT_MOVE]

			next_el.style.display = "none"

			var overlay_el = document.getElementById('current_cell_' + i)
			overlay_el.className += " stretch_and_move_backward"
			overlay_el.style.transition = "background-color .8s"
			overlay_el.style.backgroundColor = COLORS[next_state]
		}
		setTimeout(function () {
			for (var i = 0; i < ROWS; i++) {
				var next_el = document.getElementById('cell_' + i + '_' + (CURRENT_MOVE))

				next_el.style.display = "block"

				var overlay_el = document.getElementById('current_cell_' + i)
				overlay_el.style.transition = "none"
				overlay_el.className = "game_cell_current"
			}
			var gameboard_overlay_el = document.getElementById('gameboard_overlay_container')
			gameboard_overlay_el.style.left = (current_cell_overlay_left_offset * CURRENT_MOVE) + "em"

			is_cool_transitions_animating = false

			callback()
		}, 800)
	}
}

function hide_screens() {
	var win_screen_element = document.getElementById('win_screen_container')
	win_screen_element.style.display = 'none'
	var lose_screen_element = document.getElementById('lose_screen_container')
	lose_screen_element.style.display = 'none'
}

function set_preset_menu() {
	var select_el = document.getElementById('preset_select_el')
	select_el.value = GAME_NAME//"Game "+(PRESET+1)
}

function init_preset_menu() {
	var select_el = document.getElementById('preset_select_el');
	select_el.innerHTML = "";
	for (var i = 0; i < GAME_PRESETS.length; i++) {
		var option_el = document.createElement('OPTION');
		option_el.innerHTML = GAME_PRESETS[i].name; // or use "Game " + (i + 1) if you prefer
		select_el.appendChild(option_el);
	}
	select_el.selectedIndex = PRESET;
}

function toggle_preset_menu() {
	var preset_el = document.getElementById('preset_select_el')
	if (preset_el.style.display == 'block') {
		preset_el.style.display = 'none'
	} else {
		preset_el.style.display = 'block'
	}
}

function display_preset_features() {
	if (PRESET == 0) {
		document.getElementById('prev_button').style.display = 'none'
		document.getElementById('next_button').style.display = 'block'
	} else if (PRESET == -1) {
		document.getElementById('prev_button').style.display = 'none'
		document.getElementById('next_button').style.display = 'none'
	} else if (PRESET == (GAME_PRESETS.length - 1)) {
		document.getElementById('next_button').style.display = 'none'
	} else {
		document.getElementById('prev_button').style.display = 'block'
		document.getElementById('next_button').style.display = 'block'
	}

	if (PRESET == -1) {
		document.getElementById('random_button').style.display = 'block'
		document.getElementById('preset_select_el').style.display = 'none'
	} else {
		document.getElementById('random_button').style.display = 'none'
		document.getElementById('preset_select_el').style.display = 'block'
	}

	//if(PRESET>2 || PRESET == -1){//add advance and retreat button
	document.getElementById('update_button').style.display = 'block'
	document.getElementById('retreat_button').style.display = 'block'
	//}else{
	//	document.getElementById('update_button').style.display = 'none'
	//	document.getElementById('retreat_button').style.display = 'none'
	//}
	//if(PRESET>6){//add game style display
	//	document.getElementById('dragndrop_style_display').style.display = 'block'
	//}else{
	//	document.getElementById('dragndrop_style_display').style.display = 'none'
	//}
	//if(PRESET>9){//add timer display
	//	document.getElementById('timer_display').style.display = 'block'
	//}else{
	//	document.getElementById('timer_display').style.display = 'none'
	//}
}

function resize() {
	if (ROWS > 4) {
		document.body.style.fontSize = (14 - (ROWS - 4)) + 'px'
	} else {
		document.body.style.fontSize = '14px'
	}
}

function updateMoveCounter() {
	document.getElementById("update_counter").innerHTML = MOVE_COUNT
}
function showSolvedRows(flag) {
	SHOW_SOLVED_ROWS = flag
	drawRows()
}
