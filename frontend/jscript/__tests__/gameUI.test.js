// tests/gameUI.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Import the things we want to test
import * as gameUI from '../gameUI.js';
import { gameState } from '../state.js';

describe('gameUI module tests', () => {
    let dom;
    let document;
    let window;

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

    it('hide_screens() should set win/lose containers to display=none', () => {
        const winScreen = document.getElementById('win_screen_container');
        const loseScreen = document.getElementById('lose_screen_container');
        winScreen.style.display = 'block';
        loseScreen.style.display = 'block';

        gameUI.hide_screens();
        expect(winScreen.style.display).toBe('none');
        expect(loseScreen.style.display).toBe('none');
    });

    it('set_preset_menu() should set the select value to GAME_NAME', () => {
        // Suppose we know gameState.GAME_NAME = "Test Game"

        const selectEl = document.getElementById('preset_select_el');
        // Add an option whose value matches "Test Game"
        const option = document.createElement('option');
        option.value = "Test Game";
        option.textContent = "Test Game";
        selectEl.appendChild(option);

        // Start with no selection
        selectEl.value = '';

        gameUI.set_preset_menu();

        // Now it should work
        expect(selectEl.value).toBe('Test Game');
    });

    it('init_preset_menu() should populate the select with GAME_PRESETS', () => {
        // e.g. gameState.GAME_PRESETS has 3 items
        const selectEl = document.getElementById('preset_select_el');
        gameUI.init_preset_menu();
        // expect 3 option elements
        expect(selectEl.querySelectorAll('option').length).toBe(3);
        // Option 1 => "Preset 1", etc.
        expect(selectEl.querySelectorAll('option')[0].innerHTML).toBe('Preset 1');
    });

    it('toggle_preset_menu() should toggle display style of #preset_select_el', () => {
        const selectEl = document.getElementById('preset_select_el');
        expect(selectEl.style.display).toBe(''); // possibly empty string

        gameUI.toggle_preset_menu();
        expect(selectEl.style.display).toBe('block');

        gameUI.toggle_preset_menu();
        expect(selectEl.style.display).toBe('none');
    });


    it('hide_screens() should set win/lose containers to display=none', () => {
        const winScreen = document.getElementById('win_screen_container');
        const loseScreen = document.getElementById('lose_screen_container');

        // Initially make them "visible"
        winScreen.style.display = 'block';
        loseScreen.style.display = 'block';

        // Call the function
        gameUI.hide_screens();

        // Now assert they're hidden
        expect(winScreen.style.display).toBe('none');
        expect(loseScreen.style.display).toBe('none');
    });

    it('resize() should reduce font-size if ROWS > 4', () => {
        gameState.ROWS = 5;
        gameUI.resize();
        // e.g. expected font-size = 14 - (5 - 4) = 13px
        expect(document.body.style.fontSize).toBe('13px');
    });

    it('resize() should keep 14px for ROWS <= 4', () => {
        gameState.ROWS = 4;
        gameUI.resize();
        expect(document.body.style.fontSize).toBe('14px');
    });

    it('transition_states_animation() forward calls callback after 800ms and updates classes', () => {
        const callback = vi.fn();
      
        // Make sure ROWS, COLS, CURRENT_MOVE, etc. are set
        gameState.CURRENT_MOVE = 1;
        gameState.ROWS = 3;
        gameState.COLS = 4;
        // Or whatever config you need
      
        // 1. Initialize rows so the DOM actually has the <td> and <div> elements
        gameUI.init_rows();
        
        // 2. Now run the animation
        vi.useFakeTimers();
        gameUI.transition_states_animation(callback, true);
      
        // 3. Immediately after calling, the code sets those elements to display="none"
        //    Then after 800ms, callback is invoked
      
        vi.advanceTimersByTime(800);
        expect(callback).toHaveBeenCalledTimes(1);
      
        vi.useRealTimers();
      });
        

});

describe('gameUI DOM side effects', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <table id="gameboard"></table>
            <div id="gameboard_overlay_container" style="opacity:0;"></div>
          </body>
        </html>
      `);
        document = dom.window.document;
        window = dom.window;
        global.document = document;
        global.window = window;

        // Mock gameState with predictable data
        gameState.ROWS = 3;
        gameState.COLS = 4;
        gameState.CURRENT_MOVE = 1;
        gameState.COOL_TRANSITIONS_ENABLED = false;
        gameState.GOALS = [1, 2, 3]; // each row's goal
        gameState.CA_STATE_MATRIX = [
            // row 0 states
            [0, 1, 2, 3],
            // row 1 states
            [1, 2, 3, 1],
            // row 2 states
            [2, 3, 1, 0],
        ];
        // So row 0 has states [0 -> 1 -> 2 -> 3]
        // row 1 has states [1 -> 2 -> 3 -> 1]
        // row 2 has states [2 -> 3 -> 1 -> 0]

        // Colors array: 
        //   index 0 => #9f9eb1
        //   index 1 => #e33a3a
        //   index 2 => #ff8026
        //   index 3 => #e1d943
        // ...
        gameState.show_rows_ahead = false;
    });

    afterEach(() => {
        global.document = undefined;
        global.window = undefined;
    });

    it("should update each row’s cells with the correct classes and background colors after drawRows", () => {
        // 1) Initialize the table
        gameUI.init_rows();

        // 2) Now call drawRows, which calls drawRow internally
        gameUI.drawRows();

        /**
         * Based on the logic in init_rows & drawRow:
         * - For a given row i:
         *   - Cells [0 .. CURRENT_MOVE - 1] => .game_cell_past
         *   - Cell [CURRENT_MOVE] => .game_cell_current
         *   - Cells [CURRENT_MOVE+1 .. COLS-2] => .game_cell_future (if any)
         *   - Cell [COLS-1] => .game_cell_goal (with a background color = COLORS[gameState.GOALS[i]])
         *
         *   Also, each cell [i, j] gets a backgroundColor from the CA_STATE_MATRIX: 
         *   index => gameUI.COLORS[state].
         *
         *   Because COOL_TRANSITIONS_ENABLED = false, we won’t see any “game_cell_invisible” classes. 
         */


        // ------------------------------
        // Row 0 checks
        // - states = [0, 1, 2, 3]
        // - CURRENT_MOVE = 1
        // => cell_0_0 => .game_cell_past, backgroundColor = COLORS[0] (#9f9eb1)
        // => cell_0_1 => .game_cell_current, backgroundColor = COLORS[1] (#e33a3a)
        // => cell_0_2 => .game_cell_future, backgroundColor = (hint=0 => #bcc? Actually, see code below.)
        // => cell_0_3 => .game_cell_goal, backgroundColor = COLORS[1] (because GOALS[0] = 1 => #e33a3a)
        //   (But the code for cell_0_2 checks if `show_rows_ahead || hint`, which is false => background #bcc, 
        //    except the code also first sets it to COLORS[2], then overwrites with #bcc if show_rows_ahead/hint is false.
        //    So we expect #bcc for cell_0_2.)

        const row0cell0 = document.getElementById('cell_0_0');
        const row0cell1 = document.getElementById('cell_0_1');
        const row0cell2 = document.getElementById('cell_0_2');
        const row0cell3 = document.getElementById('cell_0_3');

        // Class checks
        expect(row0cell0.className).toBe('game_cell_past');
        expect(row0cell1.className).toBe('game_cell_current');
        expect(row0cell2.className).toBe('game_cell_future');
        expect(row0cell3.className).toBe('game_cell_goal');

        // Background colors
        expect(row0cell0.style.backgroundColor).toBe('rgb(159, 158, 177)'); // #9f9eb1
        expect(row0cell1.style.backgroundColor).toBe('rgb(227, 58, 58)');   // #e33a3a
        // Because show_rows_ahead is falsy, row0cell2 is #bcc => rgb(188, 204, 204)
        expect(row0cell2.style.backgroundColor).toBe('rgb(187, 204, 204)');
        // The goal cell background = COLORS[ gameState.GOALS[0] ] => #e33a3a => 'rgb(227, 58, 58)'
        expect(row0cell3.style.backgroundColor).toBe('rgb(227, 58, 58)');

        // ------------------------------
        // Row 1 checks
        // states = [1, 2, 3, 1]
        // => cell_1_0 => .game_cell_past, bg = #e33a3a
        // => cell_1_1 => .game_cell_current, bg = #ff8026? No, actually states[1] = 2 => #ff8026
        // => cell_1_2 => .game_cell_future => #bcc (since show_rows_ahead/hint=0)
        // => cell_1_3 => .game_cell_goal => color = COLORS[ gameState.GOALS[1] ] => GOALS[1] = 2 => #ff8026
        const row1cell0 = document.getElementById('cell_1_0');
        const row1cell1 = document.getElementById('cell_1_1');
        const row1cell2 = document.getElementById('cell_1_2');
        const row1cell3 = document.getElementById('cell_1_3');

        expect(row1cell0.className).toBe('game_cell_past');
        expect(row1cell1.className).toBe('game_cell_current');
        expect(row1cell2.className).toBe('game_cell_future');
        expect(row1cell3.className).toBe('game_cell_goal');

        // Now the backgrounds:
        // cell_1_0 => state=1 => #e33a3a => rgb(227, 58, 58)
        expect(row1cell0.style.backgroundColor).toBe('rgb(227, 58, 58)');
        // cell_1_1 => state=2 => #ff8026 => rgb(255, 128, 38)
        expect(row1cell1.style.backgroundColor).toBe('rgb(255, 128, 38)');
        // cell_1_2 => would be state=3 => #e1d943 => overwritten w/ #bcc => rgb(188, 204, 204)
        expect(row1cell2.style.backgroundColor).toBe('rgb(187, 204, 204)');
        // cell_1_3 => goal => GOALS[1] = 2 => #ff8026 => rgb(255, 128, 38)
        expect(row1cell3.style.backgroundColor).toBe('rgb(255, 128, 38)');

        // ------------------------------
        // Row 2 checks
        // states = [2, 3, 1, 0]
        // => cell_2_0 => .game_cell_past => #ff8026
        // => cell_2_1 => .game_cell_current => #e1d943
        // => cell_2_2 => .game_cell_future => #bcc
        // => cell_2_3 => .game_cell_goal => GOALS[2] = 3 => #e1d943 => 'rgb(225, 217, 67)'
        const row2cell0 = document.getElementById('cell_2_0');
        const row2cell1 = document.getElementById('cell_2_1');
        const row2cell2 = document.getElementById('cell_2_2');
        const row2cell3 = document.getElementById('cell_2_3');

        expect(row2cell0.className).toBe('game_cell_past');
        expect(row2cell1.className).toBe('game_cell_current');
        expect(row2cell2.className).toBe('game_cell_future');
        expect(row2cell3.className).toBe('game_cell_goal');

        expect(row2cell0.style.backgroundColor).toBe('rgb(255, 128, 38)');  // #ff8026
        expect(row2cell1.style.backgroundColor).toBe('rgb(225, 217, 67)');  // #e1d943
        expect(row2cell2.style.backgroundColor).toBe('rgb(187, 204, 204)'); // #bcc
        expect(row2cell3.style.backgroundColor).toBe('rgb(225, 217, 67)');  // #e1d943
    });
});

