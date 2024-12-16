// frontend/jscript/__tests__/controllers.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest'

// We import the module under test *after* mocking dependencies.
import { rule_dragstart, rule_dragend, rule_dragover, rule_drop, rule_dragleave, rule_dragenter, rule_mousedown, rule_mouseup } from '../controllers.js'

// Mock dependencies from state.js and gameUI.js
vi.mock('../state.js', () => {
    return {
        gameState: {
            ROWS: 5,
            COLS: 5,
            DRAG_COUNT: 0,
            MOVE_COUNT: 0,
            CURRENT_MOVE: 0,
            SWAP_ENABLED: false,
            moveHistory: [],
            timer: {
                start: vi.fn(),
            },
        },
    }
})

vi.mock('../gameUI.js', () => {
    return {
        drawRow: vi.fn(),
        updateMoveCounter: vi.fn(),
        enable_retreat_button: vi.fn(),
        hide_solve_button: vi.fn(),
        reveal_solve_button: vi.fn(),
        disable_advance_button: vi.fn(),
        enable_advance_button: vi.fn(),
    }
})

vi.mock('../gamelogic.js', () => {
    return {
        setRule: vi.fn(),
        test_win: vi.fn(() => false), // Default no win scenario
    }
})

class MockDragEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.dataTransfer = options.dataTransfer || {
        setData: vi.fn(),
        getData: vi.fn(),
        dropEffect: '',
        effectAllowed: ''
      };
    }
  }
  
  // If DragEvent doesn't exist, define it globally:
  if (typeof DragEvent === 'undefined') {
    global.DragEvent = MockDragEvent;
  }

import { gameState } from '../state.js'
import { drawRow, updateMoveCounter, enable_retreat_button, hide_solve_button, reveal_solve_button, disable_advance_button, enable_advance_button } from '../gameUI.js'
import { setRule, test_win } from '../gamelogic.js'

describe('controllers.js', () => {
    let draggableElement
    let rowElement
    let dataTransfer

    beforeEach(() => {
        vi.clearAllMocks()

        // Simulate a draggable element (e.g. a rule)
        draggableElement = document.createElement('div')
        draggableElement.setAttribute('data-rule', '3')
        draggableElement.classList.add('rule')

        // Simulate a row (e.g. a table row)
        rowElement = document.createElement('tr')
        // Add a rowIndex property to mimic a real table row
        Object.defineProperty(rowElement, 'rowIndex', { value: 1 }) // 1 means this is the second row in a table (header is row 0)
        const rowLabel = document.createElement('div')
        rowLabel.classList.add('row_label')
        rowLabel.setAttribute('data-rule', '2')
        rowLabel.innerHTML = 'Previous Rule'
        rowLabel.style.backgroundImage = 'url(old.png)'
        rowElement.appendChild(rowLabel)

        // Mock dataTransfer for drag events
        dataTransfer = {
            setData: vi.fn(),
            getData: vi.fn((type) => {
                if (type === 'text/html') return 'Dragged Rule'
                if (type === 'image/jpeg') return 'url(dragged.png)'
                return ''
            }),
            effectAllowed: '',
            dropEffect: ''
        }
    })

    it('rule_dragstart sets up the drag operation', () => {
        const event = new DragEvent('dragstart')
        // Override event properties
        Object.defineProperty(event, 'currentTarget', { value: draggableElement })
        Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })

        rule_dragstart(event)

        expect(dataTransfer.setData).toHaveBeenCalledWith('text/html', draggableElement.innerHTML)
        expect(dataTransfer.setData).toHaveBeenCalledWith('image/jpeg', draggableElement.style.backgroundImage)
        expect(draggableElement.classList.contains('moving')).toBe(true)
        expect(gameState.dragSrcEl_).toBe(draggableElement)
    })

    it('rule_dragend cleans up after dragging', () => {
        const event = new DragEvent('dragend')
        Object.defineProperty(event, 'currentTarget', { value: draggableElement })

        rule_dragend(event)

        expect(draggableElement.classList.contains('moving')).toBe(false)
        // drawRow should have been called for each row (5 rows)
        expect(drawRow).toHaveBeenCalledTimes(gameState.ROWS)
        for (let i = 0; i < gameState.ROWS; i++) {
            expect(drawRow).toHaveBeenCalledWith(i, 0)
        }
    })

    it('rule_dragover prevents default and highlights the row', () => {
        const event = new DragEvent('dragover', { cancelable: true })
        Object.defineProperty(event, 'currentTarget', { value: rowElement })
        Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })

        // Set a global draggedRule for testing
        // Typically draggedRule is set during dragstart via global var.
        // You may need to modify controllers.js to export draggedRule or simulate it differently.
        // For simplicity, assume it's managed by the code we test.
        // The simplest approach: since draggedRule is a closure variable, we can simulate by calling dragstart first.
        draggableElement.setAttribute('data-rule', '3')
        const dragStartEvent = new DragEvent('dragstart')
        Object.defineProperty(dragStartEvent, 'currentTarget', { value: draggableElement })
        Object.defineProperty(dragStartEvent, 'dataTransfer', { value: dataTransfer })
        rule_dragstart(dragStartEvent)

        rule_dragover(event)

        expect(event.defaultPrevented).toBe(true)
        expect(rowElement.classList.contains('over')).toBe(true)
        expect(drawRow).toHaveBeenCalledWith(rowElement.rowIndex - 1, 1, '3')
    })

    it('rule_drop updates state and UI when dropping a new rule', () => {
        // Simulate the scenario where a different element was dragged onto this row
        const event = new DragEvent('drop')
        Object.defineProperty(event, 'currentTarget', { value: rowElement })
        Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })

        // Simulate a previous drag start on a different element
        const draggedEl = document.createElement('div')
        draggedEl.setAttribute('id', 'rule_0')
        draggedEl.setAttribute('data-rule', '3')
        gameState.dragSrcEl_ = draggedEl

        rule_drop(event)

        // move counts should increment
        expect(gameState.DRAG_COUNT).toBe(1)
        expect(gameState.MOVE_COUNT).toBe(1)
        expect(updateMoveCounter).toHaveBeenCalled()

        // The row label should now contain the dragged rule info
        const rowLabel = rowElement.querySelector('.row_label')
        expect(rowLabel.innerHTML).toBe('Dragged Rule') // from getData('text/html')
        expect(rowLabel.style.backgroundImage).toBe('url(dragged.png)')
        expect(rowLabel.getAttribute('data-rule')).toBe('3')

        // setRule should have been called with the correct index and rule
        expect(setRule).toHaveBeenCalledWith(0, 3) // rowIndex-1 = 0

        // Timer should start
        expect(gameState.timer.start).toHaveBeenCalled()

        // Check no win scenario
        expect(test_win).toHaveBeenCalled()
        expect(hide_solve_button).toHaveBeenCalled()
    })

    it('rule_dragleave removes hover class and redraws row', () => {
        rowElement.classList.add('over')
        const event = new DragEvent('dragleave')
        Object.defineProperty(event, 'currentTarget', { value: rowElement })

        rule_dragleave(event)

        expect(rowElement.classList.contains('over')).toBe(false)
        expect(drawRow).toHaveBeenCalledWith(0, 0) // rowIndex-1=0
    })

    it('rule_dragenter prevents default and sets dropEffect', () => {
        const event = new DragEvent('dragenter', { cancelable: true })
        Object.defineProperty(event, 'dataTransfer', { value: dataTransfer })

        rule_dragenter(event)
        expect(event.defaultPrevented).toBe(true)
        expect(dataTransfer.dropEffect).toBe('move')
    })

    it('rule_mousedown highlights the row', () => {
        rowElement.setAttribute('id', 'row_2')
        const event = new MouseEvent('mousedown')
        Object.defineProperty(event, 'currentTarget', { value: rowElement })

        rule_mousedown(event)
        expect(drawRow).toHaveBeenCalledWith(2, 1)
    })

    it('rule_mouseup removes highlight from the row', () => {
        rowElement.setAttribute('id', 'row_2')
        const event = new MouseEvent('mouseup')
        Object.defineProperty(event, 'currentTarget', { value: rowElement })

        rule_mouseup(event)
        expect(drawRow).toHaveBeenCalledWith(2, 0)
    })
})
