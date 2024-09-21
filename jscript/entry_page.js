var entry_page = {}
entry_page.continue_game = function(){
    document.getElementById('container').style.display = "block"
    document.getElementById('entry_page').style.display = "none"
    history.pushState({},"Game","#game")
    window.onpopstate = this.back_to_menu

    start_game()
}
entry_page.tutorial = function(){
    document.getElementById('container').style.display = "block"
    document.getElementById('entry_page').style.display = "none"
    start_game(0)
}
entry_page.start_game = function(){
    document.getElementById('container').style.display = "block"
    document.getElementById('entry_page').style.display = "none"
    history.pushState({},"Game","#game")
    window.onpopstate = this.back_to_menu
    start_game(0)
}
entry_page.random_game = function(){
    document.getElementById('container').style.display = "block"
    document.getElementById('entry_page').style.display = "none"
    history.pushState({}," Random Game","#random_game")
    window.onpopstate = this.back_to_menu
    start_game(-1)
}

entry_page.show_all_rules = function(){
    window.location.href = "all_rules.htm"
}

entry_page.back_to_menu = function(){
    if(this!==window) history.back()
    //this.start_color_animation()
    document.getElementById('container').style.display = "none"
    document.getElementById('entry_page').style.display = "block"

    window.onpopstate = null
}
entry_page.start_color_animation = function(){
    this.state = [0,1,2,3,4,5,6,7]
    this.rule = 27
    entry_page.change_color()
    this.anim_interval = setInterval(function(){
        var new_state = []
        for(var i = 0; i < entry_page.state.length; i++){
            new_state.push(nextByRule(entry_page.state[i],entry_page.rule))
        }
        entry_page.state = new_state
        entry_page.change_color()
    },4000)
}
entry_page.change_color = function(){
    document.body.style.backgroundColor = COLORS[entry_page.state[0]]
    document.getElementById('entry_page').style.borderColor =  COLORS[entry_page.state[1]]
    document.getElementById('entry_page').style.backgroundColor = COLORS[entry_page.state[2]]
    document.getElementById('entry_title').style.color =  COLORS[entry_page.state[3]]
    document.getElementById('entry_continue_button').style.backgroundColor = COLORS[entry_page.state[7]]
    //document.getElementById('entry_tutorial_button').style.backgroundColor = COLORS[entry_page.state[4]]
    document.getElementById('entry_game_button').style.backgroundColor = COLORS[entry_page.state[4]]
    document.getElementById('entry_random_button').style.backgroundColor = COLORS[entry_page.state[5]]
    document.getElementById('entry_all_rules_button').style.backgroundColor = COLORS[entry_page.state[6]]
}
