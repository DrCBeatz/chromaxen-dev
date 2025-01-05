// tests/gameUI.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Import the things we want to test
import * as gameUI from '../gameUI.js';
import { gameState } from '../state.js';
// ^ Adjust import paths as needed based on your project structure

describe('gameUI module tests', () => {
    let dom;
    let document;
    let window;

    /**
     * Before each test, we create a fresh JSDOM environment
     * and set up the essential DOM elements that gameUI interacts with.
     */
    beforeEach(() => {
        dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <table id="gameboard"></table>
          <div id="gameboard_overlay_container" style="opacity:0;"></div>

          <button id="retreat_button" class="button"></button>
          <button id="update_button" class="button"></button>
          <button id="solve_button" style="display:none;"></button>
          <div id="dragndrop_style_display"></div>

          <div id="win_screen_container" style="display:none;"></div>
          <div id="lose_screen_container" style="display:none;"></div>

          <h1 id="game_title_display"></h1>
          <p id="game_desc_display"></p>

          <select id="preset_select_el"></select>
          <button id="prev_button" style="display:none;"></button>
          <button id="next_button" style="display:none;"></button>
          <button id="random_button" style="display:none;"></button>
          <div id="update_counter"></div>
        </body>
      </html>
    `);

        document = dom.window.document;
        window = dom.window;

        // Attach them to global so the functions in gameUI can access.
        global.document = document;
        global.window = window;

        // Mock the gameState so we have predictable values
        gameState.ROWS = 3;
        gameState.COLS = 4;
        gameState.CURRENT_MOVE = 1;
        gameState.COOL_TRANSITIONS_ENABLED = false;
        gameState.GOALS = [1, 2, 3];
        gameState.CA_STATE_MATRIX = [
            [0, 1, 2, 3],
            [1, 2, 3, 1],
            [2, 3, 1, 0],
        ];
        gameState.RULES = [0, 1, 2];
        gameState.GAME_NAME = "Test Game";
        gameState.GAME_DESC = "This is a test description.";
        gameState.SWAP_ENABLED = false;
        gameState.MOVE_COUNT = 5;
        gameState.GAME_PRESETS = [
            { name: "Preset 1" },
            { name: "Preset 2" },
            { name: "Preset 3" },
        ];
        gameState.PRESET = 1;
    });

    /**
     * After each test, we can clean up by removing global references
     * to avoid collisions between tests.
     */
    afterEach(() => {
        global.document = undefined;
        global.window = undefined;
    });

    describe('init_rows()', () => {
        it('should create the table rows and cells', () => {
            gameUI.init_rows();

            // 1st row is the <tr> with <th> elements for the header
            const rows = document.querySelectorAll('#gameboard tr');
            expect(rows.length).toBe(1 + gameState.ROWS);
            // Expect 1 header row + 3 data rows = 4 total

            // Each data row has 1 TD for the label, plus `gameState.COLS` TDs for cells
            const firstDataRow = rows[1];
            const tds = firstDataRow.querySelectorAll('td');
            // 1 label cell + 4 game cells = 5 total
            expect(tds.length).toBe(1 + gameState.COLS);
        });

        it('should set background color of body to rgb(189, 207, 207)', () => {
            gameUI.init_rows();
            expect(document.body.style.backgroundColor).toBe('rgb(189, 207, 207)');
        });
    });
    
      
    describe('Button enable/disable functions', () => {
        it('disable_retreat_button() should change retreat_button to disabled style', () => {
            const retreatBtn = document.getElementById('retreat_button');
            // Initial
            expect(retreatBtn.className).toBe('button');

            gameUI.disable_retreat_button();
            expect(retreatBtn.className).toBe('button_disabled');
            expect(retreatBtn.style.cursor).toBe('default');
        });

        it('enable_retreat_button() should revert retreat_button to normal style', () => {
            const retreatBtn = document.getElementById('retreat_button');
            retreatBtn.className = 'button_disabled';

            gameUI.enable_retreat_button();
            expect(retreatBtn.className).toBe('button');
            expect(retreatBtn.style.cursor).toBe('pointer');
        });

        it('disable_advance_button() should disable the update_button', () => {
            const advanceBtn = document.getElementById('update_button');
            expect(advanceBtn.className).toBe('button');

            gameUI.disable_advance_button();
            expect(advanceBtn.className).toBe('button_disabled');
            // Also test the onclick was replaced
            expect(advanceBtn.onclick()).toBe(false);
        });

        it('enable_advance_button() should enable the update_button', () => {
            const advanceBtn = document.getElementById('update_button');
            advanceBtn.className = 'button_disabled';

            gameUI.enable_advance_button();
            expect(advanceBtn.className).toBe('button');
            // Check that the onclick is set to nextMove (from gamelogic.js).
            // Because we didn’t import nextMove in test, the best we can do is test type or existence
            expect(typeof advanceBtn.onclick).toBe('function');
        });
    });

    describe('reveal_solve_button() and hide_solve_button()', () => {
        it('reveal_solve_button() should make solve_button visible', () => {
            const solveBtn = document.getElementById('solve_button');
            expect(solveBtn.style.display).toBe('none');

            gameUI.reveal_solve_button();
            expect(solveBtn.style.display).toBe('block');
        });

        it('hide_solve_button() should hide solve_button', () => {
            const solveBtn = document.getElementById('solve_button');
            solveBtn.style.display = 'block';

            gameUI.hide_solve_button();
            expect(solveBtn.style.display).toBe('none');
        });
    });

    describe('update_dragndrop_style_display()', () => {
        it('should show Swap when SWAP_ENABLED is true', () => {
            gameState.SWAP_ENABLED = true;
            const styleDisplay = document.getElementById('dragndrop_style_display');

            gameUI.update_dragndrop_style_display();
            expect(styleDisplay.innerHTML).toBe('Style: Swap');
        });

        it('should show Copy and Replace when SWAP_ENABLED is false', () => {
            gameState.SWAP_ENABLED = false;
            const styleDisplay = document.getElementById('dragndrop_style_display');

            gameUI.update_dragndrop_style_display();
            expect(styleDisplay.innerHTML).toBe('Style: Copy and Replace');
        });
    });

    describe('update_title_header()', () => {
        it('should update the game title and description', () => {
            gameUI.update_title_header();
            expect(document.getElementById('game_title_display').innerHTML).toBe('Test Game');
            expect(document.getElementById('game_desc_display').innerHTML).toBe('This is a test description.');
        });
    });

    describe('updateMoveCounter()', () => {
        it('should display the correct move count', () => {
            const counterEl = document.getElementById('update_counter');
            expect(counterEl.innerHTML).toBe(''); // Initially empty

            gameUI.updateMoveCounter();
            expect(counterEl.innerHTML).toBe(String(gameState.MOVE_COUNT));
            // => '5'
        });
    });

    describe('display_preset_features()', () => {
        it('should hide the random button and show preset dropdown for valid preset', () => {
            // PRESET = 1 (valid), from our beforeEach
            gameUI.display_preset_features();

            const randomBtn = document.getElementById('random_button');
            const presetSelect = document.getElementById('preset_select_el');

            expect(randomBtn.style.display).toBe('none');
            expect(presetSelect.style.display).toBe('block');
        });

        it('should display next_button, hide prev_button if PRESET=0', () => {
            gameState.PRESET = 0;
            gameUI.display_preset_features();
            const prevBtn = document.getElementById('prev_button');
            const nextBtn = document.getElementById('next_button');

            expect(prevBtn.style.display).toBe('none');
            expect(nextBtn.style.display).toBe('block');
        });

        it('should hide next_button if PRESET = last index', () => {
            gameState.PRESET = gameState.GAME_PRESETS.length - 1; // 2
            gameUI.display_preset_features();
            const nextBtn = document.getElementById('next_button');

            expect(nextBtn.style.display).toBe('none');
        });
    });

});
