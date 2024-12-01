// jscript/entry_page.js

/**
 * Entry page controller.
 * Manages navigation, game starting logic, and color animations for the entry page.
 * @module EntryPage
 */

import { nextByRule, start_game } from './gamelogic.js';
import { COLORS } from './gameUI.js';

// Cache DOM elements
const container = document.getElementById('container');
const entryPage = document.getElementById('entry_page');
const credits = document.getElementById('credits');
const entryTitle = document.getElementById('entry_title');
const continueButton = document.getElementById('entry_continue_button');
const gameButton = document.getElementById('entry_game_button');
const randomButton = document.getElementById('entry_random_button');
const allRulesButton = document.getElementById('entry_all_rules_button');

export const entry_page = {
    /**
     * Starts or resumes a game and navigates to the game screen.
     */
    continue_game: function () {
        container.style.display = "block";
        entryPage.style.display = "none";
        credits.style.display = "none";
        history.pushState({}, "Game", "#game");
        window.onpopstate = this.back_to_menu;

        start_game();
    },

    /**
     * Starts a tutorial game (preset 0) and navigates to the game screen.
     */
    tutorial: function () {
        container.style.display = "block";
        entryPage.style.display = "none";
        start_game(0);
    },

    /**
     * Starts a new game (preset 0) and navigates to the game screen.
     */
    start_game: function () {
        container.style.display = "block";
        entryPage.style.display = "none";
        credits.style.display = "none";
        history.pushState({}, "Game", "#game");
        window.onpopstate = this.back_to_menu;

        start_game(0); // Start a new game with preset 0
    },

    /**
     * Starts a new random game and navigates to the game screen.
     */
    random_game: function () {
        container.style.display = "block";
        entryPage.style.display = "none";
        credits.style.display = "none";
        history.pushState({}, "Random Game", "#random_game");
        window.onpopstate = this.back_to_menu;

        start_game(-1);
    },

    /**
     * Navigates to the All Rules page.
     */
    show_all_rules: function () {
        window.location.href = "all_rules.htm";
    },

    /**
     * Navigates back to the menu from the game screen.
     */
    back_to_menu: function () {
        if (this !== window) history.back();
        container.style.display = "none";
        entryPage.style.display = "block";
        credits.style.display = "inline";

        window.onpopstate = null;
    },

    /**
     * Starts the color animation for the entry page background and buttons.
     */
    start_color_animation: function () {
        this.state = [0, 1, 2, 3, 4, 5, 6, 7];
        this.rule = 27;
        this.change_color();
        this.anim_interval = setInterval(() => {
            this.state = this.state.map(s => nextByRule(s, this.rule));
            this.change_color();
        }, 4000);
    },

    change_color: function () {
        updateColors(this.state);
    }
};

/**
 * Updates the background and button colors based on the current state.
 * @param {Array<number>} state - Array of color indices for various elements.
 */
function updateColors(state) {
    document.body.style.backgroundColor = COLORS[state[0]];
    entryPage.style.borderColor = COLORS[state[1]];
    entryPage.style.backgroundColor = COLORS[state[2]];
    entryTitle.style.color = COLORS[state[3]];
    continueButton.style.backgroundColor = COLORS[state[7]];
    gameButton.style.backgroundColor = COLORS[state[4]];
    randomButton.style.backgroundColor = COLORS[state[5]];
    allRulesButton.style.backgroundColor = COLORS[state[6]];
}