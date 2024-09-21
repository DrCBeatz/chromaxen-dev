function get_rules_list(el,callback){
    var xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function(){
        if(xhttp.readyState == 4 && xhttp.status == 200){
            var json = JSON.parse(xhttp.responseText)
            json.sort(function(n1,n2){
                var number1 = parseInt(n1.split("/")[2].match(/\d+/)[0])
                var number2 = parseInt(n2.split("/")[2].match(/\d+/)[0])
                if(number1>number2){
                    return 1
                }else{
                    return -1
                }
            })

            el.innerHTML = ""
            for(var i = 0; i < json.length; i++){
                var url = json[i]
                var is_finished = false
                if(url.match(/svg/)){
                    is_finished = true
                }else{
                    is_finished = false
                }

                var title = json[i].split(".")[0]
                title = title.split("/")[2]

                var rule_number = /\d+/.exec(title)

                var old_url = "img/old_images/x"+title+".jpg"

                var rule_el = document.createElement('DIV')
                rule_el.style.backgroundImage = "url(" + url + ")"
            	rule_el.innerHTML = "<header>"+title+"</header>"
                rule_el.className = "rule"
                rule_el.id = "rule"+rule_number

                rule_el.dataset.title = title
                rule_el.dataset.url = url
                rule_el.dataset.old_url = old_url
                rule_el.dataset.is_finished = is_finished
                rule_el.dataset.rule_number = rule_number

                rule_el.onclick = function(){
                    show_rule(this.dataset.rule_number)
                }
                el.appendChild(rule_el)
            }

            if(typeof(callback)=='function'){
                callback()
            }
        }
    }
    xhttp.open("GET","json/get_rule_img_list.json",true)
    xhttp.send()
}

function show_rule(rule_number){
    var rule_el = document.getElementById('rule'+rule_number)

    document.getElementById('all_rules_container').style.display = 'none'
    document.getElementById('tester_container').style.display = 'block'

    document.getElementById('rule_display').innerHTML = rule_el.dataset.title
    document.getElementById('img_display').style.backgroundImage = "url(" + rule_el.dataset.url + ")"

    document.getElementById('old_img_display').style.backgroundImage = "none"
    if(rule_el.dataset.is_finished=="true"){
        document.getElementById('old_img_display').style.backgroundImage = "url(" + rule_el.dataset.old_url + ")"
    }

    var table = document.getElementById('color_test_table')
    table.innerHTML = ""

    var state = [0,1,2,3,4,5,6,7]
    for(var i = 0; i < 8; i++){
        var tr = document.createElement('TR')

        var td = document.createElement('TD')
        td.style.backgroundColor = COLORS[i]
        td.style.width = "2em"
        td.style.height = "2em"
        tr.appendChild(td)
        for(var j = 0; j < state.length; j++){
            var td = document.createElement('TD')
            var next = nextByRule(state[i],rule_el.dataset.rule_number)
            state[i] = next
            td.style.backgroundColor = COLORS[next]
            td.style.width = "2em"
            td.style.height = "2em"
            tr.appendChild(td)
        }
        table.appendChild(tr)
    }
}

function show_prev_rule(){
    get_rules_list(document.getElementById('all_rules_container'),function(){
        var rule_number = /\d+/.exec(document.getElementById('rule_display').innerHTML)
        if(rule_number>0){
            show_rule(--rule_number)
        }else{
            show_rule(255)
        }
    })
}

function show_next_rule(){
    get_rules_list(document.getElementById('all_rules_container'),function(){
        var rule_number = /\d+/.exec(document.getElementById('rule_display').innerHTML)
        if(rule_number<255){
            show_rule(++rule_number)
        }else{
            show_rule(0)
        }
    })
}

function back_to_rules(){
    get_rules_list(document.getElementById('all_rules_container'),function(){
        document.getElementById('all_rules_container').style.display = 'block'
        document.getElementById('tester_container').style.display = 'none'
    })
}

function refresh_rule(){
    get_rules_list(document.getElementById('all_rules_container'),function(){
        var rule_number = /\d+/.exec(document.getElementById('rule_display').innerHTML)
        show_rule(rule_number)
    })
}
