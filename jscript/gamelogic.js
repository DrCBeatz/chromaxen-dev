// jscript/gamelogic.js

// Game play globals.
var ROWS = 8
var COLS = 8
var RULES = [ 127, 53, 61, 43, 41, 17, 123, 213 ]
var GOALS = [ 0,0,0,0,0,0,0,0 ]
var PRESET

var CURRENT_MOVE = 0
var DRAG_COUNT = 0
var MOVE_COUNT = 0

var TIME = 0
var timer

var SWAP_ENABLED = true
var SHOW_SOLVED_ROWS = false
var COOL_TRANSITIONS_ENABLED = true
var is_cool_transitions_animating = false

// Instantiate 8x8 state matrix
var CA_STATE_MATRIX = []

var GAME_PRESETS = []

var GAME_XML_URL = "games.xml"

var GAME_NAME
var GAME_DESC

var initial_state = {}

function init_game(){
	if(localStorage.current_move!=undefined){
		document.getElementById('entry_continue_button').style.display = "block"
	}

	get_rules_list(document.getElementById('all_rules'))
	loadPresets("games/"+GAME_XML_URL,function(xml){
		var game_nodes = xml.getElementsByTagName("game")
		for(var i = 0; i < game_nodes.length; i++){
			var game = {
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
			GAME_PRESETS.push(game)
		}
		start_game()
	})
}

function parse_comma_number_list(str){
	var str_split = str.split(",")
	var new_array = []
	for(var i = 0; i < str_split.length; i++){
		var match = str_split[i].match(/\d+/)
	    var int_str = ""
		for(var j = 0; j < match.length; j++){
		    int_str += match[j]
		}
		var parsed_int = parseInt(int_str)
		new_array.push(parsed_int)
	}
	return new_array
}

function start_game(preset){
	timer = new Timer(document.getElementById('timer'),function(_this){
		localStorage.time = _this.elapsed_ms
	})

	if(preset !== undefined){
		loadPreset(preset)
    }else{
		if(localStorage.initial_state !== undefined)
			initial_state = JSON.parse(localStorage.initial_state)

		PRESET = parseInt(localStorage.preset)
		CURRENT_MOVE = parseInt(localStorage.current_move)
		DRAG_COUNT = parseInt(localStorage.drag_count)
		MOVE_COUNT = parseInt(localStorage.move_count)
		updateMoveCounter()

		TIME = parseInt(localStorage.time)
		timer.set_time(TIME)

		ROWS = parseInt(localStorage.rows)
		COLS = parseInt(localStorage.cols)
		RULES = JSON.parse(localStorage.rules)
		CA_STATE_MATRIX = JSON.parse(localStorage.state_matrix)
		GOALS = JSON.parse(localStorage.goals)

		SWAP_ENABLED = JSON.parse(localStorage.swap_enabled)
		show_rows_ahead = JSON.parse(localStorage.show_rows_ahead)
		GAME_NAME = localStorage.game_name
		GAME_DESC = localStorage.game_desc
	}
	resize()
	init_rows()
	drawRows()
	for(var i = 0; i< ROWS; i++){
		setRule(i,RULES[i])
	}
	update_title_header()
	update_dragndrop_style_display()
	init_preset_menu()
	if(CURRENT_MOVE==0){
		disable_retreat_button()
	}else{
		enable_retreat_button()
	}
	if(CURRENT_MOVE == COLS-2 && !test_win()){
		disable_advance_button()
	}else{
		enable_advance_button()
	}
	//if((PRESET==3||PRESET==4||PRESET==5)&&CURRENT_MOVE>0){
	//	disable_advance_button()
	//}

	display_preset_features()
	if(test_win()){
		reveal_solve_button()
	}else{
		hide_solve_button()
	}
}

function create_random_preset(){
	var game = {}
	game.rows = 8
	game.columns = 8
	game.seeds = []
	for(var i = 0; i < game.rows; i++){
	    game.seeds.push(Math.floor(Math.random()*6)+1)
	}
	game.rules = []
	for(var i = 0; i < game.rows; i++){
	    game.rules.push(Math.floor(Math.random()*256))
	}
	game.goals = []
	for(var i = 0; i < game.rows; i++){
	    game.goals.push(Math.floor(Math.random()*8))
	}
	game.swap_enabled = false
	game.show_rows_ahead = false
	game.name = "Random Game"
	game.desc = ""
	return game
}

// Move counter
function nextMove()
{
	if(COOL_TRANSITIONS_ENABLED&&is_cool_transitions_animating) return
	if(CURRENT_MOVE < COLS-1){
		MOVE_COUNT++
		localStorage.move_count = MOVE_COUNT
		updateMoveCounter()

		CURRENT_MOVE++
		localStorage.current_move = CURRENT_MOVE

		enable_retreat_button()
		if(CURRENT_MOVE == COLS-2){
			if (!test_win()) {
				disable_advance_button()
			}
		}
		//disable advance after first step
		//if((PRESET==3||PRESET==4||PRESET==5)&&CURRENT_MOVE>0){
		//	disable_advance_button()
		//}
		if(COOL_TRANSITIONS_ENABLED){
			transition_states_animation(function(){
				drawRows()

				timer.start()

				if(CURRENT_MOVE == COLS-1 && test_win()){
					win()
				}
			},true)
		}else{
			drawRows()

			timer.start()

			if(CURRENT_MOVE == COLS-1 && test_win()){
				win()
			}
		}

	}
}

function retreat() {
    if (COOL_TRANSITIONS_ENABLED && is_cool_transitions_animating) return;
    if (CURRENT_MOVE > 0) {
        MOVE_COUNT++;
        localStorage.move_count = MOVE_COUNT;
        updateMoveCounter();

        CURRENT_MOVE--;
        localStorage.current_move = CURRENT_MOVE;

        enable_advance_button();

        for (var i = 0; i < ROWS; i++) {
            var state = CA_STATE_MATRIX[i][CURRENT_MOVE];
            for (var j = CURRENT_MOVE + 1; j < COLS; j++) {
                state = nextByRule(state, RULES[i]);
                CA_STATE_MATRIX[i][j] = state;
            }
        }

        localStorage.state_matrix = JSON.stringify(CA_STATE_MATRIX);

        if (CURRENT_MOVE == 0) {
            disable_retreat_button();
        }

        if (COOL_TRANSITIONS_ENABLED) {
            transition_states_animation(function () {
                drawRows();

                timer.start();

                if (CURRENT_MOVE == COLS - 1 && test_win()) {
                    win();
                }
            }, false);
        } else {
            drawRows();

            timer.start();
        }
    }
}

function test_win(){
	for(var i = 0; i < GOALS.length; i++){
	    if(GOALS[i]!=CA_STATE_MATRIX[i].slice(-1)[0]){
			return false
		}
	}
	return true
}

function next_game_header(){
	if(test_win()){
		solve()
	}else{
		next_game()
	}
}

function next_game_win(){
	if(document.getElementById('name_input') != null &&
		document.getElementById('name_input').value){
		send_win_data("moves="+MOVE_COUNT+"&time="+timer.get_time_str()+"&game="+GAME_NAME+"&name="+
			document.getElementById('name_input').value
		)
		setTimeout(next_game,1000)
	}else{
		next_game()
	}
}

function next_game(){
	PRESET++
	if(PRESET==GAME_PRESETS.length) PRESET = 0
	reset()
}

function prev_game(){
	PRESET--
	if(PRESET<0) PRESET = 0
	reset()
}

function setSeed(idx, seed)
{
	CA_STATE_MATRIX[idx][0] = seed
	localStorage.state_matrix = JSON.stringify(CA_STATE_MATRIX)
}

function resetSeeds()
{
	var i
	for(i=0; i<ROWS; i++){
		setSeed(i, chooseSeed())
	}
}

function setGoal(idx, goal)
{
	GOALS[idx] = goal
	localStorage.goals = JSON.stringify(GOALS)
}

function resetGoals()
{
	var i
	for(i=0; i<COLS; i++)
		setGoal(i, chooseGoal())
}

function resetRules()
{
	var i
	for(i=0; i<COLS; i++)
		setRule(i, chooseRule())
}

function setRule(idx, rule) {
    // Save the new rule
    RULES[idx] = rule;
    localStorage.rules = JSON.stringify(RULES);

    // Recalculate the state matrix starting from CURRENT_MOVE
    var state = CA_STATE_MATRIX[idx][CURRENT_MOVE]; // Start from the current state
    for (var i = CURRENT_MOVE + 1; i < COLS; i++) {
        state = nextByRule(state, rule);
        CA_STATE_MATRIX[idx][i] = state;
    }
    localStorage.state_matrix = JSON.stringify(CA_STATE_MATRIX);
    display_rule(idx, rule);
}

function makeNewGame(is_random)
{
	timer.reset()
	CURRENT_MOVE = 0
	localStorage.current_move = CURRENT_MOVE

	DRAG_COUNT = 0
	localStorage.drag_count = DRAG_COUNT

	updateMoveCounter()
	update_dragndrop_style_display()
	hide_solve_button()
	disable_retreat_button()
	//if(PRESET!=0)
	enable_advance_button()
	hide_screens()
	display_preset_features()

	if(PRESET == -1){
		if(is_random){
			loadPreset(PRESET)
		}else{
			ROWS = initial_state.rows
			localStorage.rows = ROWS
			COLS = initial_state.columns
			localStorage.cols = COLS

			SEEDS = initial_state.seeds

			RULES = dereference(initial_state.rules)
			localStorage.rules = JSON.stringify(RULES)

			//init empty matrix
			CA_STATE_MATRIX = []
			for (i = 0; i < ROWS; i++)	{
				CA_STATE_MATRIX.push([])
				for(var j = 0; j < COLS; j++){
				    CA_STATE_MATRIX[i].push(0)
				}
			}

			//fill matrix
			for(var i = 0; i < ROWS; i++){
				CA_STATE_MATRIX[i][0] = SEEDS[i]
				var state = CA_STATE_MATRIX[i][0]
				for(var j = 1; j < COLS; j++){
					state = nextByRule(state, RULES[i])
				    CA_STATE_MATRIX[i][j] = state
				}
			}
			localStorage.state_matrix = JSON.stringify(CA_STATE_MATRIX)

			GOALS = initial_state.goals
			localStorage.goals = JSON.stringify(GOALS)

			SWAP_ENABLED = initial_state.swap_enabled
			localStorage.swap_enabled = SWAP_ENABLED

			show_rows_ahead = initial_state.show_rows_ahead
			localStorage.show_rows_ahead = show_rows_ahead

			GAME_NAME = initial_state.name
			localStorage.game_name = GAME_NAME

			GAME_DESC = initial_state.desc
			localStorage.game_desc = GAME_DESC

			init_rows()
			display_rules()
			hide_solve_button()
			drawRows()
			//display_preset_features()
		}
	}else{
		loadPreset(PRESET)
	}

	set_preset_menu()
}

function reset()
{
	makeNewGame(false)
}

function random()
{
	makeNewGame(true)
}
/****************************
	Cellular Automata
*****************************/
function bitTest(value, bit)
{
	return value & (1 << bit)
}
function bitSet(value, bit)
{
	return value | ( 1 << bit )
}
function nextByRule(state, rule)
{
//	if ( state == 0 ) return state;	// suppress grey cells
	var n = 3
	var newState = 0
	for(var i=0; i<n; i++)
	{
		var n1 = bitTest(state, i)
		var n2 = bitTest(state, (i+1)%n)
		var n3 = bitTest(state, (i+2)%n)
		var ri = 0
		if ( n1 ) ri = 1
		if ( n2 ) ri += 2
		if ( n3 ) ri += 4
		if ( bitTest(rule, ri ) )
			newState = bitSet(newState, ( i+1 ) %n)
	}
	return newState
}

// Utilities
function rnd(N)
{
	return Math.floor(Math.random()* (N))
}
function chooseRule()
{
	// Choose a new rule at random
	return Math.floor(Math.random()* (256))	// 256 is the number of CA rules.
}
function chooseGoal()
{
	// Choose a new goal at random
	return Math.floor(Math.random()* (8))	// 8 is the number of possible states.
}
function chooseSeed()
{
	// There are 8 possible CA states, but gameplay requires that seeds
	// cannot be 0 or 7.
	// This routine returns a pseudo-random number between 1 and 6, inclusive.
	return Math.floor(Math.random()* (6)) + 1
}
