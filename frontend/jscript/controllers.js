// frontend/jscript/controllers.js

import { gameState } from './state.js';
import { drawRow, updateMoveCounter, enable_retreat_button, hide_solve_button, reveal_solve_button, disable_advance_button, enable_advance_button } from './gameUI.js';
import { setRule, test_win } from './gamelogic.js';

let draggedRule = null; // Global variable to store the dragged rule

/**
 * Handles the dragstart event for draggable rules.
 * Sets up the necessary data transfer attributes for the drag operation
 * and marks the source element as the active draggable item.
 *
 * @param {DragEvent} e - The dragstart event object.
 */
export function rule_dragstart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    e.dataTransfer.setData('image/jpeg', e.currentTarget.style.backgroundImage);
    e.dataTransfer.setData('text/plain', ''); // For Safari

    draggedRule = e.currentTarget.getAttribute('data-rule'); // Store the rule
    gameState.dragSrcEl_ = e.currentTarget;
    e.currentTarget.classList.add('moving');
}

/**
 * Handles the dragend event for draggable rules.
 * Removes visual artifacts and clears the dragged rule state.
 *
 * @param {DragEvent} e - The dragend event object.
 */
export function rule_dragend(e) {
    // Remove the 'moving' class from the dragged element
    e.currentTarget.classList.remove('moving');

    // Clear the 'over' class from all rows to ensure no visual artifacts remain after dragging ends
    for (let row = 0; row < gameState.ROWS; row++) {
        drawRow(row, 0);
    }

    // Clear the global variable
    draggedRule = null;
}


/**
 * Handles the dragover event for rows.
 * Prevents default behavior and updates the visual feedback for the row.
 *
 * @param {DragEvent} e - The dragover event object.
 */
export function rule_dragover(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('over');

    const row = e.currentTarget.rowIndex - 1; // Adjust for header row
    const rule = draggedRule; // Use the global variable
    drawRow(row, 1, rule); // Pass the rule to drawRow
}


/**
 * Handles the dragleave event for rows.
 * Removes the visual feedback from the row.
 *
 * @param {DragEvent} e - The dragleave event object.
 */
export function rule_dragleave(e) {
    e.currentTarget.classList.remove('over');
    const row = e.currentTarget.rowIndex - 1;
    drawRow(row, 0); // Redraw without the new rule
}

/**
 * Handles the drop event for rows.
 * Updates the game state and visual representation based on the dropped rule.
 *
 * @param {DragEvent} e - The drop event object.
 */
export function rule_drop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    if (gameState.dragSrcEl_ != e.currentTarget) {
        gameState.DRAG_COUNT++;
        localStorage.dragCount = gameState.DRAG_COUNT;
        gameState.MOVE_COUNT++;
        localStorage.move_count = gameState.MOVE_COUNT;
        updateMoveCounter();

        const targetDiv = e.currentTarget.querySelector('.row_label'); // The draggable element in the row
        const prev_html = targetDiv.innerHTML;
        const prev_bg_img = targetDiv.style.backgroundImage;
        const prev_rule = targetDiv.getAttribute('data-rule');

        const rule = gameState.dragSrcEl_.getAttribute('data-rule');

        // Corrected moveHistory push
        gameState.moveHistory.push({
            action: 'ruleChange',
            fromIndex: parseInt(gameState.dragSrcEl_.id.split('_')[1]),
            toIndex: e.currentTarget.rowIndex - 1,
            fromRule: parseInt(rule),
            toRule: parseInt(prev_rule)
        });
        localStorage.moveHistory = JSON.stringify(gameState.moveHistory);

        enable_retreat_button();

        // Update the target rule display
        targetDiv.innerHTML = e.dataTransfer.getData('text/html');
        targetDiv.style.backgroundImage = e.dataTransfer.getData('image/jpeg');
        targetDiv.setAttribute('data-rule', rule);

        const idx = e.currentTarget.rowIndex - 1; // Row index
        setRule(idx, parseInt(rule));

        if (gameState.SWAP_ENABLED) {
            gameState.dragSrcEl_.setAttribute('data-rule', prev_rule);
            gameState.dragSrcEl_.innerHTML = prev_html;
            gameState.dragSrcEl_.style.backgroundImage = prev_bg_img;
            setRule(parseInt(gameState.dragSrcEl_.id.split('_')[1]), parseInt(prev_rule));
        }

        gameState.timer.start();

        // Remove the 'over' class and redraw the row without hint
        e.currentTarget.classList.remove('over');
        drawRow(idx, 0);

        if (test_win()) {
            reveal_solve_button();
            if (gameState.CURRENT_MOVE == gameState.COLS - 2) {
                enable_advance_button();
            }
        } else {
            hide_solve_button();
            if (gameState.CURRENT_MOVE == gameState.COLS - 2) {
                disable_advance_button();
            }
        }
    }
}

/**
 * Handles the mousedown event for a row.
 * Provides visual feedback for the clicked row.
 *
 * @param {MouseEvent} e - The mousedown event object.
 */
export function rule_mousedown(e) {
    const row = parseInt(e.currentTarget.id.split('_')[1]);
    drawRow(row, 1);
}

/**
 * Handles the mouseup event for a row.
 * Removes visual feedback from the clicked row.
 *
 * @param {MouseEvent} e - The mouseup event object.
 */
export function rule_mouseup(e) {
    const row = parseInt(e.currentTarget.id.split('_')[1]);
    drawRow(row, 0);
}

/**
 * Handles the dragenter event for rows.
 * Provides visual feedback when a draggable item enters a row.
 *
 * @param {DragEvent} e - The dragenter event object.
 */
export function rule_dragenter(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
}
