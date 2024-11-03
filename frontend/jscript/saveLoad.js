// jscript/saveLoad.js

function saveGame() {
    // Gather all necessary game data into an object
    var gameData = {
        ROWS: ROWS,
        COLS: COLS,
        RULES: RULES,
        GOALS: GOALS,
        CA_STATE_MATRIX: CA_STATE_MATRIX,
        CURRENT_MOVE: CURRENT_MOVE,
        MOVE_COUNT: MOVE_COUNT,
        TIME: timer.elapsed_ms, // Assuming you have a timer object
        SWAP_ENABLED: SWAP_ENABLED,
        show_rows_ahead: show_rows_ahead,
        GAME_NAME: GAME_NAME,
        GAME_DESC: GAME_DESC,
        PRESET: PRESET,
        moveHistory: moveHistory
    };

    // Serialize the game data to JSON
    var gameDataJSON = JSON.stringify(gameData);

    // Create a Blob with the JSON data
    var blob = new Blob([gameDataJSON], { type: "application/json" });

    // Create a link to download the Blob as a file
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ChromaXen_SaveGame_' + GAME_NAME.replace(/\s+/g, '_') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// In jscript/saveLoad.js

function loadGame(event) {
    var file = event.target.files[0];
    if (!file) {
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var gameData = JSON.parse(e.target.result);

            // Validate the loaded data (optional but recommended)
            if (validateGameData(gameData)) {
                // Update game variables
                ROWS = gameData.ROWS;
                COLS = gameData.COLS;
                RULES = gameData.RULES;
                GOALS = gameData.GOALS;
                CA_STATE_MATRIX = gameData.CA_STATE_MATRIX;
                CURRENT_MOVE = gameData.CURRENT_MOVE;
                MOVE_COUNT = gameData.MOVE_COUNT;
                TIME = gameData.TIME || 0;
                SWAP_ENABLED = gameData.SWAP_ENABLED;
                show_rows_ahead = gameData.show_rows_ahead;
                GAME_NAME = gameData.GAME_NAME;
                GAME_DESC = gameData.GAME_DESC;
                PRESET = gameData.PRESET;
                moveHistory = gameData.moveHistory || [];

                // Update localStorage if needed
                localStorage.rows = ROWS;
                localStorage.cols = COLS;
                localStorage.rules = JSON.stringify(RULES);
                localStorage.goals = JSON.stringify(GOALS);
                localStorage.state_matrix = JSON.stringify(CA_STATE_MATRIX);
                localStorage.current_move = CURRENT_MOVE;
                localStorage.move_count = MOVE_COUNT;
                localStorage.time = TIME;
                localStorage.swap_enabled = SWAP_ENABLED;
                localStorage.show_rows_ahead = show_rows_ahead;
                localStorage.game_name = GAME_NAME;
                localStorage.game_desc = GAME_DESC;
                localStorage.preset = PRESET;
                localStorage.moveHistory = JSON.stringify(moveHistory);

                // Re-initialize the game
                init_game_after_load();

                alert('Game loaded successfully!');
            } else {
                alert('Invalid game data.');
            }
        } catch (error) {
            console.error('Error parsing game data:', error);
            alert('Failed to load game. Invalid file format.');
        }
    };
    reader.readAsText(file);
}

function validateGameData(data) {
    // Basic validation to check for required properties
    if (typeof data !== 'object') return false;
    var requiredProperties = [
        'ROWS', 'COLS', 'RULES', 'GOALS', 'CA_STATE_MATRIX',
        'CURRENT_MOVE', 'MOVE_COUNT', 'SWAP_ENABLED',
        'show_rows_ahead', 'GAME_NAME', 'GAME_DESC', 'moveHistory'
    ];
    for (var i = 0; i < requiredProperties.length; i++) {
        if (!(requiredProperties[i] in data)) {
            console.error('Missing property:', requiredProperties[i]);
            return false;
        }
    }
    // Add additional checks if necessary (e.g., data types, array lengths)
    return true;
}

function init_game_after_load() {
    timer = new Timer(document.getElementById('timer'), function (_this) {
        localStorage.time = _this.elapsed_ms;
    });

    timer.set_time(TIME);

    resize();
    init_rows();
    drawRows();
    display_rules();
    update_title_header();
    update_dragndrop_style_display();
    init_preset_menu();
    display_preset_features();

    updateMoveCounter();

    // Restore the state of advance and retreat buttons
    if (CURRENT_MOVE === 0) {
        disable_retreat_button();
    } else {
        enable_retreat_button();
    }
    if (CURRENT_MOVE === COLS - 2 && !test_win()) {
        disable_advance_button();
    } else {
        enable_advance_button();
    }

    if (test_win()) {
        reveal_solve_button();
    } else {
        hide_solve_button();
    }

    timer.start();
}
