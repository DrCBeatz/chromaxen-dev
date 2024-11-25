// jscript/saveLoad.js

import { gameState } from './state.js';
import { updateMoveCounter, resize, init_rows, drawRows, display_rules, update_title_header, update_dragndrop_style_display, init_preset_menu, display_preset_features, enable_advance_button, hide_solve_button, reveal_solve_button, enable_retreat_button, disable_retreat_button } from './gameUI.js';
import { test_win } from './gamelogic.js';
import { Timer } from './timer.js';

export function saveGame() {
    // Gather all necessary game data into an object
    var gameData = {
        ROWS: gameState.ROWS,
        COLS: gameState.COLS,
        RULES: gameState.RULES,
        GOALS: gameState.GOALS,
        CA_STATE_MATRIX: gameState.CA_STATE_MATRIX,
        CURRENT_MOVE: gameState.CURRENT_MOVE,
        MOVE_COUNT: gameState.MOVE_COUNT,
        TIME: gameState.timer.elapsed_ms,
        SWAP_ENABLED: gameState.SWAP_ENABLED,
        show_rows_ahead: gameState.show_rows_ahead,
        GAME_NAME: gameState.GAME_NAME,
        GAME_DESC: gameState.GAME_DESC,
        PRESET: gameState.PRESET,
        moveHistory: gameState.moveHistory
    };

    // Serialize the game data to JSON
    var gameDataJSON = JSON.stringify(gameData);

    // Create a Blob with the JSON data
    var blob = new Blob([gameDataJSON], { type: "application/json" });

    // Create a link to download the Blob as a file
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ChromaXen_SaveGame_' + gameState.GAME_NAME.replace(/\s+/g, '_') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// In jscript/saveLoad.js

export function loadGame(event) {
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
                gameState.ROWS = gameData.ROWS;
                gameState.COLS = gameData.COLS;
                gameState.RULES = gameData.RULES;
                gameState.GOALS = gameData.GOALS;
                gameState.CA_STATE_MATRIX = gameData.CA_STATE_MATRIX;
                gameState.CURRENT_MOVE = gameData.CURRENT_MOVE;
                gameState.MOVE_COUNT = gameData.MOVE_COUNT;
                gameState.TIME = gameData.TIME || 0;
                gameState.SWAP_ENABLED = gameData.SWAP_ENABLED;
                gameState.show_rows_ahead = gameData.show_rows_ahead;
                gameState.GAME_NAME = gameData.GAME_NAME;
                gameState.GAME_DESC = gameData.GAME_DESC;
                gameState.PRESET = gameData.PRESET;
                gameState.moveHistory = gameData.moveHistory || [];

                // Update localStorage if needed
                localStorage.rows = gameState.ROWS;
                localStorage.cols = gameState.COLS;
                localStorage.rules = JSON.stringify(gameState.RULES);
                localStorage.goals = JSON.stringify(gameState.GOALS);
                localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX);
                localStorage.current_move = gameState.CURRENT_MOVE;
                localStorage.move_count = gameState.MOVE_COUNT;
                localStorage.time = gameState.TIME;
                localStorage.swap_enabled = gameState.SWAP_ENABLED;
                localStorage.show_rows_ahead = gameState.show_rows_ahead;
                localStorage.game_name = gameState.GAME_NAME;
                localStorage.game_desc = gameState.GAME_DESC;
                localStorage.preset = gameState.PRESET;
                localStorage.moveHistory = JSON.stringify(gameState.moveHistory);

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

export function validateGameData(data) {
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

export function init_game_after_load() {
    gameState.timer = new Timer(document.getElementById('timer'), function (_this) {
        localStorage.time = _this.elapsed_ms;
    });

    gameState.timer.set_time(gameState.TIME);

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

    gameState.timer.start();
}
