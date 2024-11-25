// frontend/jscript/main.js

// Import your modules
// main.js

// Import your modules
import { init_game, nextMove, makeNewGame, next_game_header, retreat, prev_game } from './gamelogic.js';
import { entry_page } from './entry_page.js';
import { solve } from './gameUI.js';
import { saveGame, loadGame } from './saveLoad.js';
import { loadPreset } from './presetMenu.js';
import { get_rules_list } from './get_rules.js';

// Wait for the DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize your application
    init_game();

    // Entry Page Event Listeners
    document.getElementById('entry_title').addEventListener('mousedown', () => {
        entry_page.start_color_animation();
    });

    document.getElementById('entry_continue_button').addEventListener('mouseup', () => {
        entry_page.continue_game();
    });

    document.getElementById('entry_game_button').addEventListener('mouseup', () => {
        entry_page.start_game();
    });

    document.getElementById('entry_random_button').addEventListener('mouseup', () => {
        entry_page.random_game();
    });

    document.getElementById('entry_all_rules_button').addEventListener('mouseup', () => {
        entry_page.show_all_rules();
    });

    // Game Header Event Listeners
    document.getElementById('back_to_menu').addEventListener('mouseup', () => {
        entry_page.back_to_menu();
    });

    document.getElementById('next_button').addEventListener('click', () => {
        next_game_header();
    });

    document.getElementById('prev_button').addEventListener('click', () => {
        prev_game();
    });

    document.getElementById('preset_select_el').addEventListener('change', function () {
        loadPreset(this.selectedIndex);
    });

    // Game Footer Event Listeners
    document.getElementById('update_button').addEventListener('click', () => {
        nextMove();
    });

    document.getElementById('retreat_button').addEventListener('click', () => {
        retreat();
    });

    document.getElementById('reset_button').addEventListener('click', () => {
        makeNewGame();
    });

    document.getElementById('random_button').addEventListener('click', () => {
        makeNewGame(true);
    });

    document.getElementById('save_button').addEventListener('click', () => {
        saveGame();
    });

    const loadGameInput = document.getElementById('load_game_input');
    document.getElementById('load_button').addEventListener('click', () => {
        loadGameInput.click();
    });

    loadGameInput.addEventListener('change', (event) => {
        loadGame(event);
    });

    document.getElementById('solve_button').addEventListener('click', () => {
        solve();
    });

    // Win Screen Event Listeners
    document.getElementById('replay_button').addEventListener('click', () => {
        // Close the win screen
        document.getElementById('win_screen_container').style.display = 'none';
        // Restart the current game
        makeNewGame();
    });

    document.getElementById('next_level_button').addEventListener('click', () => {
        // Close the win screen
        document.getElementById('win_screen_container').style.display = 'none';
        // Move to the next level
        next_game_header();
    });

    // Lose Screen Event Listeners
    document.getElementById('lose_replay_button').addEventListener('click', () => {
        // Close the lose screen
        document.getElementById('lose_screen_container').style.display = 'none';
        // Restart the current game
        makeNewGame();
    });

    document.getElementById('lose_next_button').addEventListener('click', () => {
        // Close the lose screen
        document.getElementById('lose_screen_container').style.display = 'none';
        // Move to the next level
        next_game_header();
    });

});
