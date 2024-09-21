var dragSrcEl_

//controller functions
function rule_dragstart(e){
	e.dataTransfer.effectAllowed = 'move'
	e.dataTransfer.setData('text/html', this.innerHTML)
	e.dataTransfer.setData('image/jpeg', this.style.backgroundImage)

	dragSrcEl_ = this
	this.className = this.className + ' moving'
}

function rule_dragover(e){
	if (e.preventDefault) {
		e.preventDefault()
	}
	e.dataTransfer.dropEffect = 'move'
	if (dragSrcEl_ != this)
	{
		this.className = this.className + ' over'
	}
	var row = parseInt(this.id.slice(-1))
	drawRow(row, 1)
}

function rule_dragleave(e){
	this.className = this.className.split(" ")[0]
	var row = parseInt(this.id.slice(-1))
	drawRow(row, 0)
}

function rule_drop(e){
	if (e.stopPropagation) {
		e.stopPropagation()
	}
	if (dragSrcEl_ != this) {
		DRAG_COUNT++
		localStorage.dragCount = DRAG_COUNT
		MOVE_COUNT++
		localStorage.move_count = MOVE_COUNT
		updateMoveCounter()
		var prev_html = this.innerHTML
		this.innerHTML = e.dataTransfer.getData('text/html')
		var prev_bg_img = this.style.backgroundImage
		this.style.backgroundImage = e.dataTransfer.getData('image/jpeg')
		var rule = dragSrcEl_.getAttribute('data-rule')
		var prev_rule = this.getAttribute('data-rule')
		this.setAttribute('data-rule', rule)

		var idx = parseInt(this.id.slice(-1))
		setRule(idx, parseInt(rule))

		if(SWAP_ENABLED){
			dragSrcEl_.setAttribute('data-rule',prev_rule)
			dragSrcEl_.innerHTML = prev_html
			dragSrcEl_.style.backgroundImage = prev_bg_img
			setRule(parseInt(dragSrcEl_.id.slice(-1)),parseInt(prev_rule))
		}

		timer.start()

		drawRows()
		if(test_win()){
			reveal_solve_button()
			if(CURRENT_MOVE == COLS-2){
				enable_advance_button()
			}
		}else{
			hide_solve_button()
			if(CURRENT_MOVE == COLS-2){
				disable_advance_button()
			}
		}
	}
}
//img/rule_images_svg/rule3.svg");
function rule_dragend(e){
	var rule_els = document.getElementsByClassName('row_label')
	for(var i = 0; i < rule_els.length; i++){
		rule_els[i].className = this.className.split(" ")[0]
	}
	var row = parseInt(this.id.slice(-1))
	drawRow(row, 0)
}

function rule_mousedown(e){
	var row = parseInt(this.id.slice(-1))
	drawRow(row, 1)
}

function rule_mouseup(e){
	var row = parseInt(this.id.slice(-1))
	drawRow(row, 0)
}
