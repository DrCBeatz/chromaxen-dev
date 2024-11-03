// jscript/controllers.js

var dragSrcEl_;
var draggedRule = null; // Global variable to store the dragged rule
var prevRow = null;

function rule_dragstart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    e.dataTransfer.setData('image/jpeg', e.currentTarget.style.backgroundImage);
    e.dataTransfer.setData('text/plain', ''); // For Safari

    draggedRule = e.currentTarget.getAttribute('data-rule'); // Store the rule
    dragSrcEl_ = e.currentTarget;
    e.currentTarget.classList.add('moving');
}

function rule_dragend(e) {
    // Remove the 'moving' class from the dragged element
    e.currentTarget.classList.remove('moving');

    // Clear the 'over' class from all rows to ensure no visual artifacts remain after dragging ends
    var rows = document.getElementsByTagName('tr');
    for (var i = i; i < rows.length; i++) {
        var row = i - 1;
        drawRow(row, 0);
    }

    // Clear the global variable
    draggedRule = null;
}



function rule_dragover(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('over');

    var row = e.currentTarget.rowIndex - 1; // Adjust for header row
    var rule = draggedRule; // Use the global variable
    drawRow(row, 1, rule); // Pass the rule to drawRow
}

function rule_dragleave(e) {
    e.currentTarget.classList.remove('over');
    var row = e.currentTarget.rowIndex - 1;
    drawRow(row, 0); // Redraw without the new rule
}

function rule_drop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    if (dragSrcEl_ != e.currentTarget) {
        DRAG_COUNT++;
        localStorage.dragCount = DRAG_COUNT;
        MOVE_COUNT++;
        localStorage.move_count = MOVE_COUNT;
        updateMoveCounter();

        var targetDiv = e.currentTarget.querySelector('.row_label'); // The draggable element in the row
        var prev_html = targetDiv.innerHTML;
        var prev_bg_img = targetDiv.style.backgroundImage;
        var prev_rule = targetDiv.getAttribute('data-rule');

        var rule = dragSrcEl_.getAttribute('data-rule');

        // Corrected moveHistory push
        moveHistory.push({
            action: 'ruleChange',
            fromIndex: parseInt(dragSrcEl_.id.split('_')[1]),
            toIndex: e.currentTarget.rowIndex - 1,
            fromRule: parseInt(rule),
            toRule: parseInt(prev_rule)
        });
        localStorage.moveHistory = JSON.stringify(moveHistory);

        enable_retreat_button();

        // Update the target rule display
        targetDiv.innerHTML = e.dataTransfer.getData('text/html');
        targetDiv.style.backgroundImage = e.dataTransfer.getData('image/jpeg');
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

        // Remove the 'over' class and redraw the row without hint
        e.currentTarget.classList.remove('over');
        drawRow(idx, 0);

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

function rule_mousedown(e) {
    var row = parseInt(e.currentTarget.id.split('_')[1]);
    drawRow(row, 1);
}

function rule_mouseup(e) {
    var row = parseInt(e.currentTarget.id.split('_')[1]);
    drawRow(row, 0);
}

function rule_dragenter(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
}

