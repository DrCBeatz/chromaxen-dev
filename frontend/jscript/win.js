// jscript/win.js

var HIGH_SCORE_LENGTH = 10
var API_BASE_URL = "http://localhost:8000"

function win(){
    hide_solve_button()
    setTimeout(function(){
        var win_screen_element = document.getElementById('win_screen_container')
        win_screen_element.style.display = 'block'

        var high_score_header_el = document.getElementById('high_score_table_header')
        high_score_header_el.innerHTML = "Loading highscores..."
        var table_el = document.getElementById('high_score_table')
        table_el.style.visibility = 'collapse'

        timer.stop()
        localStorage.clear()
        get_leader_board()
    },500)
}

function lose(){
    var lose_screen_element = document.getElementById('lose_screen_container')
    lose_screen_element.style.display = 'block'
    localStorage.clear()
}

function send_win_data(win_data) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            console.log(xhttp.responseText);
        }
    };
    xhttp.open("POST", API_BASE_URL + "/api/win_state", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(win_data));
}

function get_leader_board() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var high_score_header_el = document.getElementById('high_score_table_header');
            high_score_header_el.innerHTML = "High Score for " + GAME_NAME;

            var high_scores = JSON.parse(xhttp.responseText) || [];
            process_leaderboard(high_scores);
        }
    };
    xhttp.open("GET", API_BASE_URL + "/api/win_states?game=" + encodeURIComponent(GAME_NAME), true);
    xhttp.send();
}

function process_leaderboard(high_scores){
    var win_data = {
        moves: MOVE_COUNT,
        time: timer.get_time_str(),
        game: GAME_NAME,
        is_mine_new:true
    }
    if(high_scores.length>0){
        var is_highscore = false
        for(var i = 0; i < high_scores.length; i++){
            if(win_data.moves < high_scores[i].moves ||
                (win_data.moves == high_scores[i].moves &&
                    (timer.t_string_to_sec(win_data.time) < timer.t_string_to_sec(high_scores[i].time) ) ) ){
                high_scores.splice(i,0,win_data)
                is_highscore = true
                break
            }
        }
        if(!is_highscore && high_scores.length < HIGH_SCORE_LENGTH){
            high_scores.push(win_data)
        }
    }else{
        high_scores.push(win_data)
    }

    draw_leaderboard(high_scores,win_data)
}

function draw_leaderboard(high_scores, win_data){
    var table_el = document.getElementById('high_score_table')
    table_el.style.visibility = 'visible'
    table_el.innerHTML = "<tr><th></th><th>Moves</th><th>Time</th><th>Name</th></tr>"
    for(var i = 0; i < HIGH_SCORE_LENGTH; i++){
        var tr_el = document.createElement('tr')

        if(i<high_scores.length){

            if(high_scores[i].is_mine){
                tr_el.className = "is_mine"
            }

            var td_el = document.createElement('td')
            td_el.innerHTML = i+1
            tr_el.appendChild(td_el)

            var td_el = document.createElement('td')
            td_el.innerHTML = high_scores[i].moves
            tr_el.appendChild(td_el)

            var td_el = document.createElement('td')
            td_el.innerHTML = high_scores[i].time
            tr_el.appendChild(td_el)

            if(high_scores[i].is_mine_new){
                tr_el.className = "is_mine_new"
                var td_el = document.createElement('td')
                td_el.appendChild(create_enter_name_form(win_data))
            }else{
                var td_el = document.createElement('td')
                td_el.innerHTML = high_scores[i].name
            }

        }else{//create empty row
            var td_el = document.createElement('td')
            td_el.innerHTML = i+1
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
        try{
            document.getElementById('name_input').focus()
        }catch(e){}
    }
}

function create_enter_name_form(win_data){
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
    button.onclick = function(event){
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
