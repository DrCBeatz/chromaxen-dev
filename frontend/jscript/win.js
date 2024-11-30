// jscript/win.js

import { gameState } from "./state.js";
import { hide_solve_button } from "./gameUI.js";

export var HIGH_SCORE_LENGTH = 10
export var API_BASE_URL = "";

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


export function win() {
    hide_solve_button()
    setTimeout(function () {
        var win_screen_element = document.getElementById('win_screen_container')
        win_screen_element.style.display = 'block'

        var high_score_header_el = document.getElementById('high_score_table_header')
        high_score_header_el.innerHTML = "Loading highscores..."
        var table_el = document.getElementById('high_score_table')
        table_el.style.visibility = 'collapse'

        gameState.timer.stop()
        localStorage.clear()
        get_leader_board()
    }, 500)
}

export function lose() {
    var lose_screen_element = document.getElementById('lose_screen_container')
    lose_screen_element.style.display = 'block'
    localStorage.clear()
}

export function send_win_data(win_data) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4) {
            if (xhttp.status == 200) {
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

export function get_leader_board() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4) {
            if (xhttp.status == 200) {
                var high_score_header_el = document.getElementById('high_score_table_header');
                high_score_header_el.innerHTML = "High Score for " + gameState.GAME_NAME;

                var high_scores = JSON.parse(xhttp.responseText) || [];
                process_leaderboard(high_scores);
            } else {
                console.error("Error fetching leaderboard:", xhttp.statusText);
            }
        }
    };
    xhttp.open("GET", API_BASE_URL + "/api/win_states?game=" + encodeURIComponent(gameState.GAME_NAME), true);
    xhttp.send();
}
export function process_leaderboard(high_scores) {
    var win_data = {
        moves: gameState.MOVE_COUNT,
        time: gameState.timer.get_time_str(),
        game: gameState.GAME_NAME,
        is_mine_new: true
    }
    if (high_scores.length > 0) {
        var is_highscore = false
        for (let i = 0; i < high_scores.length; i++) {
            if (win_data.moves < high_scores[i].moves ||
                (win_data.moves == high_scores[i].moves &&
                    (gameState.timer.t_string_to_sec(win_data.time) < gameState.timer.t_string_to_sec(high_scores[i].time)))) {
                high_scores.splice(i, 0, win_data)
                is_highscore = true
                break
            }
        }
        if (!is_highscore && high_scores.length < HIGH_SCORE_LENGTH) {
            high_scores.push(win_data)
        }
    } else {
        high_scores.push(win_data)
    }

    draw_leaderboard(high_scores, win_data)
}

export function draw_leaderboard(high_scores, win_data) {
    var table_el = document.getElementById('high_score_table')
    table_el.style.visibility = 'visible'
    table_el.innerHTML = "<tr><th></th><th>Moves</th><th>Time</th><th>Name</th></tr>"
    for (var i = 0; i < HIGH_SCORE_LENGTH; i++) {
        var tr_el = document.createElement('tr')

        if (i < high_scores.length) {

            if (high_scores[i].is_mine) {
                tr_el.className = "is_mine"
            }

            var td_el = document.createElement('td')
            td_el.innerHTML = i + 1
            tr_el.appendChild(td_el)

            var td_el = document.createElement('td')
            td_el.innerHTML = high_scores[i].moves
            tr_el.appendChild(td_el)

            var td_el = document.createElement('td')
            td_el.innerHTML = high_scores[i].time
            tr_el.appendChild(td_el)

            if (high_scores[i].is_mine_new) {
                tr_el.className = "is_mine_new"
                var td_el = document.createElement('td')
                td_el.appendChild(create_enter_name_form(win_data))
            } else {
                var td_el = document.createElement('td')
                td_el.innerHTML = high_scores[i].name
            }

        } else {//create empty row
            var td_el = document.createElement('td')
            td_el.innerHTML = i + 1
            tr_el.appendChild(td_el)

            var td_el = document.createElement('td')
            td_el.innerHTML = "---"
            tr_el.appendChild(td_el)

            var td_el = document.createElement('td')
            td_el.innerHTML = "---"
            tr_el.appendChild(td_el)

            var td_el = document.createElement('td')
            td_el.innerHTML = "---"
        }

        tr_el.appendChild(td_el)

        table_el.appendChild(tr_el)
        try {
            document.getElementById('name_input').focus()
        } catch (e) { }
    }
}

export function create_enter_name_form(win_data) {
    var form = document.createElement('FORM');
    form.id = "your_name";
    var span = document.createElement('SPAN');
    span.innerHTML = "Enter Name: ";
    form.appendChild(span);
    var input = document.createElement('INPUT');
    input.type = 'text';
    input.id = 'name_input';
    form.appendChild(input);
    var button = document.createElement('BUTTON');
    button.innerHTML = "send";

    // Modify the button's onclick handler
    button.onclick = function (event) {
        event.preventDefault(); // Prevent form submission
        var name = document.getElementById('name_input').value;

        // Construct the win_data object with the name
        var updated_win_data = {
            moves: win_data.moves,
            time: win_data.time,
            game: win_data.game,
            name: name
        };

        // Send the data
        send_win_data(updated_win_data);

        // Update the form to display the name
        document.getElementById('your_name').innerHTML = name;
    };
    form.appendChild(button);
    return form;
}
