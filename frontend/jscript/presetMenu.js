// jscript/presetMenu.js

/**
 * @module presetMenu
 * @description This module provides functions to load and apply preset game configurations,
 * including random presets. It updates the game state, localStorage, and the UI based on
 * the selected preset.
 */

import { gameState } from './state.js';
import {
    updateMoveCounter,
    disable_retreat_button,
    enable_advance_button,
    resize,
    init_rows,
    display_rules,
    hide_solve_button,
    drawRows,
    display_preset_features,
    update_title_header,
    update_dragndrop_style_display,
    init_preset_menu
} from './gameUI.js';
import { dereference } from './utility.js';
import { nextByRule } from './gamelogic.js';
import { create_random_preset } from './gamelogic.js';

/**
 * Loads a game preset and updates the game state, UI elements, and local storage accordingly.
 * 
 * If the `preset_index` is `-1`, a random preset is generated and loaded. Otherwise, the specified
 * preset from `gameState.GAME_PRESETS` is used. This function resets timers, counters, clears history,
 * initializes the CA state matrix based on the preset's seeds and rules, and updates the displayed UI.
 * 
 * **Side effects:**
 * - Resets and starts the game timer.
 * - Updates `gameState` properties (rows, columns, rules, goals, etc.).
 * - Updates `localStorage` entries to persist the current game configuration.
 * - Resets move counters and history, disables/enables navigation buttons.
 * - Updates the UI by resizing, initializing rows, displaying rules, hiding solve buttons, drawing rows,
 *   displaying preset features, updating headers, and dragging/dropping styles.
 * - Calls `init_preset_menu()` after loading the preset.
 *
 * @function loadPreset
 * @param {number} preset_index - The index of the preset to load. If `-1`, a random preset is used.
 * @param {boolean} [updateLocalStoragePreset=false] - Whether to update the `localStorage.preset` value. 
 *  Currently always updates `localStorage.preset`, this parameter may be used for future conditions.
 * @returns {void}
 */
export function loadPreset(preset_index, updateLocalStoragePreset = false) {
    gameState.timer.reset();
    gameState.timer.start();

    gameState.CURRENT_MOVE = 0;
    localStorage.current_move = gameState.CURRENT_MOVE;
    gameState.DRAG_COUNT = 0;
    localStorage.drag_count = gameState.DRAG_COUNT;
    gameState.MOVE_COUNT = 0;
    localStorage.move_count = gameState.MOVE_COUNT;
    updateMoveCounter();
    gameState.PRESET = preset_index;
    localStorage.preset = gameState.PRESET; // Always update localStorage.preset

    // Reset the moveHistory array and update localStorage
    gameState.moveHistory = [];
    localStorage.moveHistory = JSON.stringify(gameState.moveHistory);

    // Disable the retreat button, as there are no moves to undo
    disable_retreat_button();

    // Enable the advance button if applicable
    enable_advance_button();

    if (preset_index >= -1 && preset_index < gameState.GAME_PRESETS.length) {
        let game;
        if (preset_index === -1) {
            game = create_random_preset();
            gameState.initial_state = game;
            localStorage.initial_state = JSON.stringify(gameState.initial_state);
        } else {
            game = gameState.GAME_PRESETS[preset_index];
        }

        gameState.ROWS = game.rows;
        localStorage.rows = gameState.ROWS;
        gameState.COLS = game.columns;
        localStorage.cols = gameState.COLS;

        gameState.SEEDS = game.seeds;

        gameState.RULES = dereference(game.rules);
        localStorage.rules = JSON.stringify(gameState.RULES);

        // Initialize empty matrix
        gameState.CA_STATE_MATRIX = [];
        for (let i = 0; i < gameState.ROWS; i++) {
            gameState.CA_STATE_MATRIX.push([]);
            for (let j = 0; j < gameState.COLS; j++) {
                gameState.CA_STATE_MATRIX[i].push(0);
            }
        }

        // Fill matrix
        for (let i = 0; i < gameState.ROWS; i++) {
            gameState.CA_STATE_MATRIX[i][0] = gameState.SEEDS[i];
            let state = gameState.CA_STATE_MATRIX[i][0];
            for (let j = 1; j < gameState.COLS; j++) {
                state = nextByRule(state, gameState.RULES[i]);
                gameState.CA_STATE_MATRIX[i][j] = state;
            }
        }
        localStorage.state_matrix = JSON.stringify(gameState.CA_STATE_MATRIX);

        gameState.GOALS = game.goals;
        localStorage.goals = JSON.stringify(gameState.GOALS);

        gameState.SWAP_ENABLED = game.swap_enabled;
        localStorage.swap_enabled = gameState.SWAP_ENABLED;

        gameState.show_rows_ahead = game.show_rows_ahead;
        localStorage.show_rows_ahead = gameState.show_rows_ahead;

        gameState.GAME_NAME = game.name;
        localStorage.game_name = gameState.GAME_NAME;

        gameState.GAME_DESC = game.desc;
        localStorage.game_desc = gameState.GAME_DESC;

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
