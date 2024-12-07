// frontend/jscript/main.js

/**
 * @module main
 * @description This module initializes the Chromaxen game and sets up all the necessary
 * event listeners for the user interface, including menu interactions, game navigation,
 * saving/loading of games, and handling win/lose screens.
 */

import { init_game, nextMove, makeNewGame, next_game_header, retreat, prev_game } from './gamelogic.js';
import { entry_page } from './entry_page.js';
import { solve } from './gameUI.js';
import { saveGame, loadGame } from './saveLoad.js';
import { loadPreset } from './presetMenu.js';
import { get_rules_list } from './get_rules.js';

/**
 * @event DOMContentLoaded
 * @description Fired when the initial HTML document has been completely loaded and parsed.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    init_game();

    // Cache commonly accessed DOM elements
    const entryTitleEl = document.getElementById('entry_title');
    const entryContinueBtn = document.getElementById('entry_continue_button');
    const entryGameBtn = document.getElementById('entry_game_button');
    const entryRandomBtn = document.getElementById('entry_random_button');
    const entryAllRulesBtn = document.getElementById('entry_all_rules_button');

    const backToMenuBtn = document.getElementById('back_to_menu');
    const nextBtn = document.getElementById('next_button');
    const prevBtn = document.getElementById('prev_button');
    const presetSelectEl = document.getElementById('preset_select_el');

    const updateBtn = document.getElementById('update_button');
    const retreatBtn = document.getElementById('retreat_button');
    const resetBtn = document.getElementById('reset_button');
    const randomBtn = document.getElementById('random_button');
    const saveBtn = document.getElementById('save_button');
    const loadGameInput = document.getElementById('load_game_input');
    const loadBtn = document.getElementById('load_button');
    const solveBtn = document.getElementById('solve_button');

    const winScreenContainer = document.getElementById('win_screen_container');
    const replayBtn = document.getElementById('replay_button');
    const nextLevelBtn = document.getElementById('next_level_button');

    const loseScreenContainer = document.getElementById('lose_screen_container');
    const loseReplayBtn = document.getElementById('lose_replay_button');
    const loseNextBtn = document.getElementById('lose_next_button');

    // Entry Page Event Listeners
    /**
     * @listens mousedown
     * @description Starts a color animation on the entry page title.
     */
    entryTitleEl.addEventListener('mousedown', () => entry_page.start_color_animation());

    /**
     * @listens mouseup
     * @description Continues a previously started game from the entry page.
     */
    entryContinueBtn.addEventListener('mouseup', () => entry_page.continue_game());

    /**
     * @listens mouseup
     * @description Starts a new game from the entry page.
     */
    entryGameBtn.addEventListener('mouseup', () => entry_page.start_game());

    /**
     * @listens mouseup
     * @description Starts a random game from the entry page.
     */
    entryRandomBtn.addEventListener('mouseup', () => entry_page.random_game());

    /**
     * @listens mouseup
     * @description Displays all rules from the entry page.
     */
    entryAllRulesBtn.addEventListener('mouseup', () => entry_page.show_all_rules());

    // Game Header Event Listeners
    /**
     * @listens mouseup
     * @description Returns to the main menu from the game.
     */
    backToMenuBtn.addEventListener('mouseup', () => entry_page.back_to_menu());

    /**
     * @listens click
     * @description Advances to the next game.
     */
    nextBtn.addEventListener('click', () => next_game_header());

    /**
     * @listens click
     * @description Goes back to the previous game.
     */
    prevBtn.addEventListener('click', () => prev_game());

    /**
     * @listens change
     * @description Loads a preset game based on the selected index.
     */
    presetSelectEl.addEventListener('change', () => {
        loadPreset(presetSelectEl.selectedIndex);
    });

    // Game Footer Event Listeners
    /**
     * @listens click
     * @description Moves the game state forward by one step.
     */
    updateBtn.addEventListener('click', () => nextMove());

    /**
     * @listens click
     * @description Retreats the game state by one step.
     */
    retreatBtn.addEventListener('click', () => retreat());

    /**
     * @listens click
     * @description Resets the game to its initial state.
     */
    resetBtn.addEventListener('click', () => makeNewGame());

    /**
     * @listens click
     * @description Starts a new random game.
     */
    randomBtn.addEventListener('click', () => makeNewGame(true));

    /**
     * @listens click
     * @description Saves the current game state to a file.
     */
    saveBtn.addEventListener('click', () => saveGame());

    /**
     * @listens click
     * @description Prompts the user to select a game file to load.
     */
    loadBtn.addEventListener('click', () => {
        loadGameInput.click();
    });

    /**
     * @listens change
     * @description Loads the selected game file.
     * @param {Event} event - The file input event.
     */
    loadGameInput.addEventListener('change', (event) => {
        loadGame(event);
    });

    /**
     * @listens click
     * @description Solves the current game (reveals solution).
     */
    solveBtn.addEventListener('click', () => solve());

    // Win Screen Event Listeners
    /**
     * @listens click
     * @description Closes the win screen and restarts the current game.
     */
    replayBtn.addEventListener('click', () => {
        // Close the win screen
        winScreenContainer.style.display = 'none';
        // Restart the current game
        makeNewGame();
    });

    /**
     * @listens click
     * @description Closes the win screen and moves to the next level.
     */
    nextLevelBtn.addEventListener('click', () => {
        // Close the win screen
        winScreenContainer.style.display = 'none';
        // Move to the next level
        next_game_header();
    });

    // Lose Screen Event Listeners
    /**
     * @listens click
     * @description Closes the lose screen and restarts the current game.
     */
    loseReplayBtn.addEventListener('click', () => {
        // Close the lose screen
        loseScreenContainer.style.display = 'none';
        // Restart the current game
        makeNewGame();
    });

    /**
     * @listens click
     * @description Closes the lose screen and moves to the next level.
     */
    loseNextBtn.addEventListener('click', () => {
        // Close the lose screen
        loseScreenContainer.style.display = 'none';
        // Move to the next level
        next_game_header();
    });
});
