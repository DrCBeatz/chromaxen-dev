// jscript/__tests__/presetMenu.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

import * as presetMenu from '../presetMenu.js';
import { gameState } from '../state.js';
import * as gameUI from '../gameUI.js';
import * as gamelogic from '../gamelogic.js';

describe('presetMenu module tests', () => {
    let dom;
    let document;
    let window;

    let initRowsSpy, drawRowsSpy, resizeSpy;
    let localStorageMock;

    beforeEach(() => {
        // Basic DOM setup
        dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <table id="gameboard"></table>
            <div id="gameboard_overlay_container"></div>
        
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
        global.document = document;
        global.window = window;

        // Mock localStorage
        localStorageMock = {};
        global.localStorage = localStorageMock;

        // Provide a minimal timer
        gameState.timer = {
            reset: vi.fn(),
            start: vi.fn()
        };

        // Provide some sample presets
        gameState.GAME_PRESETS = [
            {
                rows: 3,
                columns: 4,
                seeds: [0, 1, 2],
                rules: [0, 1, 2],
                goals: [2, 3, 1],
                swap_enabled: false,
                show_rows_ahead: false,
                name: 'Preset 1',
                desc: 'Sample 1'
            }
        ];

        // Spies on UI
        initRowsSpy = vi.spyOn(gameUI, 'init_rows');
        drawRowsSpy = vi.spyOn(gameUI, 'drawRows');
        resizeSpy = vi.spyOn(gameUI, 'resize');
        // ... etc.
    });

    afterEach(() => {
        global.document = undefined;
        global.window = undefined;
        global.localStorage = undefined;
        vi.restoreAllMocks();
    });

    it('loadPreset(0) sets ROWS, COLS, calls init_rows, drawRows, timer reset/start', () => {
        // initial state
        gameState.ROWS = 1;
        gameState.COLS = 1;

        presetMenu.loadPreset(0);

        expect(gameState.ROWS).toBe(3);
        expect(gameState.COLS).toBe(4);
        expect(gameState.timer.reset).toHaveBeenCalled();
        expect(gameState.timer.start).toHaveBeenCalled();
        expect(initRowsSpy).toHaveBeenCalled();
        expect(drawRowsSpy).toHaveBeenCalled();
        expect(resizeSpy).toHaveBeenCalled();
    });
    it('loadPreset(-1) uses create_random_preset', () => {
        // Spy on create_random_preset
        const createRandomSpy = vi.spyOn(gamelogic, 'create_random_preset')
            .mockReturnValue({
                rows: 2,
                columns: 3,
                seeds: [0, 1],
                rules: [2, 2],
                goals: [2, 3],  // <--- Provide 2 goals for 2 rows
                swap_enabled: false,
                show_rows_ahead: false,
                name: 'Random 99',
                desc: 'Auto-generated random preset'
            });


        presetMenu.loadPreset(-1);

        // Check it was called
        expect(createRandomSpy).toHaveBeenCalled();

        // Then check gameState was updated with the random data
        expect(gameState.ROWS).toBe(2);
        expect(gameState.GAME_NAME).toBe('Random 99');
        // ...
    });

});
