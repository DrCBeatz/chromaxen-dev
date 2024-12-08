// jscript/win.js

import { gameState } from "./state.js";
import { hide_solve_button } from "./gameUI.js";

export const HIGH_SCORE_LENGTH = 10;
export let API_BASE_URL = "";

/**
 * Sets the API base URL depending on the environment (local or production).
 * @function setApiBaseUrl
 * @returns {void}
 */
export function setApiBaseUrl() {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // Local development environment
        API_BASE_URL = "http://localhost:8000";
    } else {
        // Production environment
        API_BASE_URL = window.location.protocol + "//api.chromaxen.com";
    }
}

// Call the function to set API_BASE_URL
setApiBaseUrl();

/**
 * Displays the win screen, stops the timer, and fetches the leaderboard.
 * @function win
 * @returns {void}
 */
export function win() {
    hide_solve_button();
    setTimeout(() => {
        const win_screen_element = document.getElementById('win_screen_container');
        win_screen_element.style.display = 'block';

        const high_score_header_el = document.getElementById('high_score_table_header');
        high_score_header_el.innerHTML = "Loading highscores...";

        const table_el = document.getElementById('high_score_table');
        table_el.style.visibility = 'collapse';

        gameState.timer.stop();
        localStorage.clear();
        get_leader_board();
    }, 500);
}

/**
 * Displays the lose screen and clears local storage.
 * @function lose
 * @returns {void}
 */
export function lose() {
    const lose_screen_element = document.getElementById('lose_screen_container');
    lose_screen_element.style.display = 'block';
    localStorage.clear();
}

/**
 * Sends the player's win data to the server.
 * @function send_win_data
 * @param {Object} win_data - The win data to send.
 * @returns {void}
 */
export function send_win_data(win_data) {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
                console.log(xhttp.responseText);
            } else {
                console.error("Error sending win data:", xhttp.statusText);
            }
        }
    };
    xhttp.open("POST", API_BASE_URL + "/api/win_state", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(win_data));
}

/**
 * Fetches the leaderboard from the server and processes it.
 * @function get_leader_board
 * @returns {void}
 */
export function get_leader_board() {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
                const high_score_header_el = document.getElementById('high_score_table_header');
                high_score_header_el.innerHTML = "High Score for " + gameState.GAME_NAME;

                const high_scores = JSON.parse(xhttp.responseText) || [];
                process_leaderboard(high_scores);
            } else {
                console.error("Error fetching leaderboard:", xhttp.statusText);
            }
        }
    };
    xhttp.open("GET", API_BASE_URL + "/api/win_states?game=" + encodeURIComponent(gameState.GAME_NAME), true);
    xhttp.send();
}

/**
 * Processes the fetched leaderboard, inserting the current player's score if it's a new high score.
 * @function process_leaderboard
 * @param {Array} high_scores - The array of high scores.
 * @returns {void}
 */
export function process_leaderboard(high_scores) {
    const win_data = {
        moves: gameState.MOVE_COUNT,
        time: gameState.timer.get_time_str(),
        game: gameState.GAME_NAME,
        is_mine_new: true
    };

    if (high_scores.length > 0) {
        let is_highscore = false;
        for (let i = 0; i < high_scores.length; i++) {
            if (
                win_data.moves < high_scores[i].moves ||
                (win_data.moves === high_scores[i].moves &&
                (gameState.timer.t_string_to_sec(win_data.time) < gameState.timer.t_string_to_sec(high_scores[i].time)))
            ) {
                high_scores.splice(i, 0, win_data);
                is_highscore = true;
                break;
            }
        }
        if (!is_highscore && high_scores.length < HIGH_SCORE_LENGTH) {
            high_scores.push(win_data);
        }
    } else {
        high_scores.push(win_data);
    }

    draw_leaderboard(high_scores, win_data);
}

/**
 * Draws the leaderboard in the DOM, showing player scores and allowing the user 
 * to submit a name if they have a new high score.
 * @function draw_leaderboard
 * @param {Array} high_scores - The array of high scores to display.
 * @param {Object} win_data - The current player's win data.
 * @returns {void}
 */
export function draw_leaderboard(high_scores, win_data) {
    const table_el = document.getElementById('high_score_table');
    table_el.style.visibility = 'visible';
    table_el.innerHTML = "<tr><th></th><th>Moves</th><th>Time</th><th>Name</th></tr>";
    for (let i = 0; i < HIGH_SCORE_LENGTH; i++) {
        const tr_el = document.createElement('tr');

        if (i < high_scores.length) {
            if (high_scores[i].is_mine) {
                tr_el.className = "is_mine";
            }

            let td_el = document.createElement('td');
            td_el.innerHTML = i + 1;
            tr_el.appendChild(td_el);

            td_el = document.createElement('td');
            td_el.innerHTML = high_scores[i].moves;
            tr_el.appendChild(td_el);

            td_el = document.createElement('td');
            td_el.innerHTML = high_scores[i].time;
            tr_el.appendChild(td_el);

            if (high_scores[i].is_mine_new) {
                tr_el.className = "is_mine_new";
                td_el = document.createElement('td');
                td_el.appendChild(create_enter_name_form(win_data));
            } else {
                td_el = document.createElement('td');
                td_el.innerHTML = high_scores[i].name;
            }

            tr_el.appendChild(td_el);
        } else { // create empty row
            let td_el = document.createElement('td');
            td_el.innerHTML = i + 1;
            tr_el.appendChild(td_el);

            td_el = document.createElement('td');
            td_el.innerHTML = "---";
            tr_el.appendChild(td_el);

            td_el = document.createElement('td');
            td_el.innerHTML = "---";
            tr_el.appendChild(td_el);

            td_el = document.createElement('td');
            td_el.innerHTML = "---";
            tr_el.appendChild(td_el);
        }

        table_el.appendChild(tr_el);
        try {
            document.getElementById('name_input').focus();
        } catch (e) { /* do nothing */ }
    }
}

/**
 * Creates a form to enter the player's name for the high score.
 * @function create_enter_name_form
 * @param {Object} win_data - The current player's win data to send.
 * @returns {HTMLFormElement} The created form element.
 */
export function create_enter_name_form(win_data) {
    const form = document.createElement('FORM');
    form.id = "your_name";

    const span = document.createElement('SPAN');
    span.innerHTML = "Enter Name: ";
    form.appendChild(span);

    const input = document.createElement('INPUT');
    input.type = 'text';
    input.id = 'name_input';
    form.appendChild(input);

    const button = document.createElement('BUTTON');
    button.innerHTML = "send";

    button.onclick = function (event) {
        event.preventDefault(); // Prevent form submission
        const name = document.getElementById('name_input').value;

        const updated_win_data = {
            moves: win_data.moves,
            time: win_data.time,
            game: win_data.game,
            name: name
        };

        send_win_data(updated_win_data);

        // Update the form to display the name
        document.getElementById('your_name').innerHTML = name;
    };
    form.appendChild(button);

    return form;
}
