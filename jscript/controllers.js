// jscript/controllers.js

var dragSrcEl_;
var draggedRule = null; // Global variable to store the dragged rule
var prevRow = null;

function rule_dragstart(e){
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    e.dataTransfer.setData('image/jpeg', e.currentTarget.style.backgroundImage);
    e.dataTransfer.setData('text/plain', ''); // For Safari

    draggedRule = e.currentTarget.getAttribute('data-rule'); // Store the rule
    dragSrcEl_ = e.currentTarget;
    e.currentTarget.classList.add('moving');
}


function rule_dragover(e){
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    if (dragSrcEl_ != e.currentTarget) {
        e.currentTarget.classList.add('over');
    }
    var row = e.currentTarget.rowIndex - 1; // Adjust for header row
    var rule = draggedRule; // Use the global variable
    drawRow(row, 1, rule); // Pass the rule to drawRow
}

function rule_dragleave(e){
    e.currentTarget.classList.remove('over');
    var row = e.currentTarget.rowIndex - 1;
    drawRow(row, 0); // Redraw without the new rule
}

function rule_drop(e){
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (dragSrcEl_ != e.currentTarget) {
        DRAG_COUNT++;
        localStorage.dragCount = DRAG_COUNT;
        MOVE_COUNT++;
        localStorage.move_count = MOVE_COUNT;
        updateMoveCounter();

        var targetDiv = e.currentTarget.querySelector('.row_label'); // The draggable element in the row
        var prev_html = targetDiv.innerHTML;
        targetDiv.innerHTML = e.dataTransfer.getData('text/html');
        var prev_bg_img = targetDiv.style.backgroundImage;
        targetDiv.style.backgroundImage = e.dataTransfer.getData('image/jpeg');
        var rule = dragSrcEl_.getAttribute('data-rule');
        var prev_rule = targetDiv.getAttribute('data-rule');
        targetDiv.setAttribute('data-rule', rule);

        var idx = e.currentTarget.rowIndex - 1; // Row index
        setRule(idx, parseInt(rule));

        if (SWAP_ENABLED) {
            dragSrcEl_.setAttribute('data-rule', prev_rule);
            dragSrcEl_.innerHTML = prev_html;
            dragSrcEl_.style.backgroundImage = prev_bg_img;
            setRule(parseInt(dragSrcEl_.id.split('_')[1]), parseInt(prev_rule));
        }

        timer.start();

        drawRows();
        if (test_win()) {
            reveal_solve_button();
            if (CURRENT_MOVE == COLS - 2) {
                enable_advance_button();
            }
        } else {
            hide_solve_button();
            if (CURRENT_MOVE == COLS - 2) {
                disable_advance_button();
            }
        }
    }
}


function rule_dragend(e){
    var rule_els = document.getElementsByClassName('row_label');
    for (var i = 0; i < rule_els.length; i++) {
        rule_els[i].classList.remove('moving');
    }
    if (e.currentTarget && e.currentTarget.id) {
        var row = parseInt(e.currentTarget.id.split('_')[1]);
        drawRow(row, 0);
    }
    draggedRule = null; // Clear the global variable
}

function rule_mousedown(e){
    var row = parseInt(e.currentTarget.id.split('_')[1]);
    drawRow(row, 1);
}

function rule_mouseup(e){
    var row = parseInt(e.currentTarget.id.split('_')[1]);
    drawRow(row, 0);
}

function rule_dragenter(e){
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
}

