// jscript/entry_page.js

import { nextByRule, start_game } from './gamelogic.js';
import { COLORS } from './gameUI.js';

export const entry_page = {
    continue_game: function () {
        document.getElementById('container').style.display = "block";
        document.getElementById('entry_page').style.display = "none";
        document.getElementById('credits').style.display = "none";
        history.pushState({}, "Game", "#game");
        window.onpopstate = this.back_to_menu;

        start_game();
    },

    tutorial: function () {
        document.getElementById('container').style.display = "block";
        document.getElementById('entry_page').style.display = "none";
        start_game(0);
    },

    start_game: function () {
        document.getElementById('container').style.display = "block";
        document.getElementById('entry_page').style.display = "none";
        document.getElementById('credits').style.display = "none";
        history.pushState({}, "Game", "#game");
        window.onpopstate = this.back_to_menu;

        start_game(0); // Start a new game with preset 0
    },

    random_game: function () {
        document.getElementById('container').style.display = "block";
        document.getElementById('entry_page').style.display = "none";
        document.getElementById('credits').style.display = "none";
        history.pushState({}, "Random Game", "#random_game");
        window.onpopstate = this.back_to_menu;

        start_game(-1);
    },

    show_all_rules: function () {
        window.location.href = "all_rules.htm";
    },

    back_to_menu: function () {
        if (this !== window) history.back();
        document.getElementById('container').style.display = "none";
        document.getElementById('entry_page').style.display = "block";
        document.getElementById('credits').style.display = "inline";

        window.onpopstate = null;
    },

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
        document.body.style.backgroundColor = COLORS[this.state[0]];
        document.getElementById('entry_page').style.borderColor = COLORS[this.state[1]];
        document.getElementById('entry_page').style.backgroundColor = COLORS[this.state[2]];
        document.getElementById('entry_title').style.color = COLORS[this.state[3]];
        document.getElementById('entry_continue_button').style.backgroundColor = COLORS[this.state[7]];
        document.getElementById('entry_game_button').style.backgroundColor = COLORS[this.state[4]];
        document.getElementById('entry_random_button').style.backgroundColor = COLORS[this.state[5]];
        document.getElementById('entry_all_rules_button').style.backgroundColor = COLORS[this.state[6]];
    }
};
