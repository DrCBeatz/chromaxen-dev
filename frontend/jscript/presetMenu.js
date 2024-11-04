// jscript/presetMenu.js

function loadPreset(preset_index, updateLocalStoragePreset = false) {
    timer.reset();

    CURRENT_MOVE = 0;
    localStorage.current_move = CURRENT_MOVE;
    DRAG_COUNT = 0;
    localStorage.drag_count = DRAG_COUNT;
    MOVE_COUNT = 0;
    localStorage.move_count = MOVE_COUNT;
    updateMoveCounter();
    PRESET = preset_index;
    localStorage.preset = PRESET; // Always update localStorage.preset

    // **Reset the moveHistory array and update localStorage**
    moveHistory = [];
    localStorage.moveHistory = JSON.stringify(moveHistory);

    // **Disable the retreat button, as there are no moves to undo**
    disable_retreat_button();

    // **Enable the advance button if applicable**
    enable_advance_button();

    if (preset_index >= -1 && preset_index < GAME_PRESETS.length) {
        var game;
        if (preset_index == -1) {
            game = create_random_preset();
            initial_state = game;
            localStorage.initial_state = JSON.stringify(initial_state);
        } else {
            game = GAME_PRESETS[preset_index];
        }

        ROWS = game.rows;
        localStorage.rows = ROWS;
        COLS = game.columns;
        localStorage.cols = COLS;

        SEEDS = game.seeds;

        RULES = dereference(game.rules);
        localStorage.rules = JSON.stringify(RULES);

        // Initialize empty matrix
        CA_STATE_MATRIX = [];
        for (var i = 0; i < ROWS; i++) {
            CA_STATE_MATRIX.push([]);
            for (var j = 0; j < COLS; j++) {
                CA_STATE_MATRIX[i].push(0);
            }
        }

        // Fill matrix
        for (var i = 0; i < ROWS; i++) {
            CA_STATE_MATRIX[i][0] = SEEDS[i];
            var state = CA_STATE_MATRIX[i][0];
            for (var j = 1; j < COLS; j++) {
                state = nextByRule(state, RULES[i]);
                CA_STATE_MATRIX[i][j] = state;
            }
        }
        localStorage.state_matrix = JSON.stringify(CA_STATE_MATRIX);

        GOALS = game.goals;
        localStorage.goals = JSON.stringify(GOALS);

        SWAP_ENABLED = game.swap_enabled;
        localStorage.swap_enabled = SWAP_ENABLED;

        show_rows_ahead = game.show_rows_ahead;
        localStorage.show_rows_ahead = show_rows_ahead;

        GAME_NAME = game.name;
        localStorage.game_name = GAME_NAME;

        GAME_DESC = game.desc;
        localStorage.game_desc = GAME_DESC;

        resize();

        init_rows();
        display_rules();
    }

    hide_solve_button();
    drawRows();
    display_preset_features();
    update_title_header();
    update_dragndrop_style_display();

    // Call init_preset_menu() here
    init_preset_menu();
}
