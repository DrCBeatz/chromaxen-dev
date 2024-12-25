// tests/saveLoad.test.js

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { saveGame, loadGame, validateGameData, init_game_after_load } from '../saveLoad.js';
import { gameState } from '../state.js';

// We'll need to mock some browser APIs:
const originalAlert = global.alert;
const originalURL = global.URL;
const originalCreateElement = global.document.createElement;
const originalLocalStorage = global.localStorage;

/**
 * Provide a mock implementation for localStorage, alert, and any other DOM APIs used.
 */
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = value;
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

describe('saveLoad.js', () => {
    beforeEach(() => {
        const gameTitleEl = document.createElement('div');
        gameTitleEl.id = 'game_title_display';
        document.body.appendChild(gameTitleEl);

        const gameDescEl = document.createElement('div');
        gameDescEl.id = 'game_desc_display';
        document.body.appendChild(gameDescEl);

        const gameboard = document.createElement('table');
        gameboard.id = 'gameboard';
        document.body.appendChild(gameboard);

        // For gameboard_overlay_container 
        const overlayContainer = document.createElement('div');
        overlayContainer.id = 'gameboard_overlay_container';
        document.body.appendChild(overlayContainer);

        const timerEl = document.createElement('div');
        timerEl.id = 'timer';
        document.body.appendChild(timerEl);
        // Mock alert
        global.alert = vi.fn();

        const retreatButton = document.createElement('button');
        retreatButton.id = 'retreat_button';
        document.body.appendChild(retreatButton);

        const updateButton = document.createElement('button');
        updateButton.id = 'update_button';
        document.body.appendChild(updateButton);

        const solveButton = document.createElement('button');
        solveButton.id = 'solve_button';
        solveButton.style.display = 'none';  // can default to hidden
        document.body.appendChild(solveButton);

        const dragndropStyle = document.createElement('div');
        dragndropStyle.id = 'dragndrop_style_display';
        document.body.appendChild(dragndropStyle);

        const presetSelect = document.createElement('select');
        presetSelect.id = 'preset_select_el';
        document.body.appendChild(presetSelect);

        const moveCounter = document.createElement('span');
        moveCounter.id = 'update_counter';
        moveCounter.innerHTML = '0';
        document.body.appendChild(moveCounter);

        const prevBtn = document.createElement('button');
        prevBtn.id = 'prev_button';
        document.body.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.id = 'next_button';
        document.body.appendChild(nextBtn);

        const randBtn = document.createElement('button');
        randBtn.id = 'random_button';
        document.body.appendChild(randBtn);

        const winScreen = document.createElement('div');
        winScreen.id = 'win_screen_container';
        winScreen.style.display = 'none';
        document.body.appendChild(winScreen);

        const loseScreen = document.createElement('div');
        loseScreen.id = 'lose_screen_container';
        loseScreen.style.display = 'none';
        document.body.appendChild(loseScreen);

        // Mock localStorage
        const mockStorage = new MockLocalStorage();
        global.localStorage = mockStorage;

        // Mock URL
        global.URL = {
            createObjectURL: vi.fn(() => 'mockObjectURL'),
            revokeObjectURL: vi.fn(),
        };

        // Mock document.createElement to handle <a> usage in saveGame
        global.document.createElement = vi.fn((tag) => {
            if (tag === 'a') {
                // Actually create an <a> element using JSDOM
                const anchor = originalCreateElement.call(document, 'a');
                // Add your mocks for .click, .setAttribute, etc.
                anchor.click = vi.fn();
                anchor.setAttribute = vi.fn();
                anchor.download = '';
                anchor.href = '';
                anchor.style = {};
                return anchor;
            }
            return originalCreateElement.call(document, tag);
        });


        // Reset gameState to a known default before each test
        gameState.ROWS = 8;
        gameState.COLS = 8;
        gameState.RULES = [127, 53, 61, 43, 41, 17, 123, 213];
        gameState.GOALS = [0, 0, 0, 0, 0, 0, 0, 0];
        gameState.CA_STATE_MATRIX = [];
        gameState.CURRENT_MOVE = 0;
        gameState.MOVE_COUNT = 0;
        gameState.TIME = 12345; // set some time
        gameState.timer = { elapsed_ms: 12345 };
        gameState.SWAP_ENABLED = true;
        gameState.show_rows_ahead = true;
        gameState.GAME_NAME = 'Test Game';
        gameState.GAME_DESC = 'Testing saveLoad';
        gameState.PRESET = 1;
        gameState.moveHistory = [];
    });

    afterEach(() => {
        // Restore the originals
        global.alert = originalAlert;
        global.URL = originalURL;
        global.document.createElement = originalCreateElement;
        global.localStorage = originalLocalStorage;
    });

    // -------------------------
    // Test validateGameData()
    // -------------------------
    describe('validateGameData()', () => {
        it('should return true for valid game data', () => {
            const validData = {
                ROWS: 8,
                COLS: 8,
                RULES: [1, 2, 3, 4, 5, 6, 7, 8,],
                GOALS: [0, 1, 1, 0, 1, 0, 1, 0],
                // Here's a valid 8×8 matrix with all zeroes:
                CA_STATE_MATRIX: Array.from({ length: 8 }, () => Array(8).fill(0)),

                CURRENT_MOVE: 2,
                MOVE_COUNT: 5,
                TIME: 9999,
                SWAP_ENABLED: false,
                show_rows_ahead: false,
                GAME_NAME: 'Loaded Game',
                GAME_DESC: 'Some loaded description',
                PRESET: 0,
                moveHistory: [{ action: 'advance' }],
            };

            expect(validateGameData(validData)).toBe(true);
        });

        it('should return false if a required property is missing', () => {
            const invalidData = {
                // Missing e.g. 'RULES', 'GOALS', etc.
                ROWS: 8,
                COLS: 8,
                CA_STATE_MATRIX: [],
                CURRENT_MOVE: 0,
                MOVE_COUNT: 0,
                SWAP_ENABLED: true,
                show_rows_ahead: true,
                GAME_NAME: 'My Game',
                GAME_DESC: 'desc',
                moveHistory: [],
            };
            expect(validateGameData(invalidData)).toBe(false);
        });

        it('should return false if data is not an object', () => {
            expect(validateGameData(null)).toBe(false);
            expect(validateGameData('string')).toBe(false);
            expect(validateGameData(123)).toBe(false);
        });
    });

    // -------------------------
    // Test saveGame()
    // -------------------------
    describe('saveGame()', () => {
        it('should create a valid JSON Blob and download link', () => {
            // Call the function
            saveGame();

            // The link creation & click should have been called
            const createElCalls = global.document.createElement.mock.calls;
            expect(createElCalls.length).toBeGreaterThan(0);
            // The a element's .download property should be set
            const anchorElement = createElCalls
                .map((call) => call[0] === 'a' && call[1])
                .filter(Boolean)[0];
            // anchorElement is our mock 'a' element returned above
            // The real check: we can see if .click was called
            // or if the 'download' attribute was set.
            // But we used a single mock object for all <a> creations.
            // So let's verify the mock calls:
            expect(global.document.createElement).toHaveBeenCalledWith('a');
            // We could also check that the anchor’s `download` includes the game name:
            // (Recall we set gameState.GAME_NAME = "Test Game")
            // Our mock 'a' object is the return from the vi.fn() above, so we do:
            // (We don’t have direct reference to it, but we can check calls.)
            // But typically you'd do something like:
            // anchorElement.download.includes('Test_Game.json')

            // Check that URL.createObjectURL was called
            expect(global.URL.createObjectURL).toHaveBeenCalled();

            // Because we can’t truly verify the contents of the Blob easily with this approach,
            // we might do additional checks inside the code or via mocking Blob, if desired.
        });
    });

    // -------------------------
    // Test loadGame()
    // -------------------------
    describe('loadGame()', () => {
        let consoleErrorSpy;

        beforeAll(() => {
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        });

        afterAll(() => {
            consoleErrorSpy.mockRestore();
        });

        // A helper to create a mock File instance for the event
        function createMockFile(contents, name = 'testSave.json') {
            return new File([contents], name, { type: 'application/json' });
        }

        it('should load a valid save file and update gameState', async () => {
            // Prepare a valid JSON string
            const validData = {
                ROWS: 8,
                COLS: 8,
                RULES: [1, 2, 3, 4, 5, 6, 7, 8],
                GOALS: [0, 1, 1, 0, 1, 0, 1, 0],
                CA_STATE_MATRIX: Array.from({ length: 8 }, () => Array(8).fill(0)),
                CURRENT_MOVE: 2,
                MOVE_COUNT: 5,
                TIME: 9999,
                SWAP_ENABLED: false,
                show_rows_ahead: false,
                GAME_NAME: 'Loaded Game',
                GAME_DESC: 'Some loaded description',
                PRESET: 0,
                moveHistory: [{ action: 'advance' }],
            };
            const file = createMockFile(JSON.stringify(validData));

            // Create a mock event target as if user selected a file
            const event = {
                target: {
                    files: [file],
                },
            };

            // We’ll call loadGame with this event
            loadGame(event);

            // Wait a tick for FileReader.onload to process
            // In Vitest, this typically requires the test to be async
            // and we can just queue a nextTick or small setTimeout:
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Now verify gameState
            expect(gameState.ROWS).toBe(8);
            expect(gameState.COLS).toBe(8);
            expect(gameState.RULES).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(gameState.CURRENT_MOVE).toBe(2);
            expect(gameState.MOVE_COUNT).toBe(5);
            expect(gameState.TIME).toBe(9999);
            expect(gameState.SWAP_ENABLED).toBe(false);
            expect(gameState.show_rows_ahead).toBe(false);
            expect(gameState.GAME_NAME).toBe('Loaded Game');
            expect(gameState.GAME_DESC).toBe('Some loaded description');
            expect(gameState.PRESET).toBe(0);
            expect(gameState.moveHistory).toEqual([{ action: 'advance' }]);

            // Check that localStorage also got updated
            expect(localStorage.rows).toBe(8);
            expect(localStorage.cols).toBe(8);

            // etc. for the rest as needed
            // Also ensure the success alert was called
            expect(global.alert).toHaveBeenCalledWith('Game loaded successfully!');
        });

        it('should show an alert and not update if JSON is invalid', async () => {
            // Provide invalid JSON
            const file = createMockFile('this is not valid JSON');
            const event = { target: { files: [file] } };

            // Call loadGame
            loadGame(event);
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Expect an alert for failure
            expect(global.alert).toHaveBeenCalledWith('Failed to load game. Invalid file format.');
            // gameState should remain unchanged from the default
            expect(gameState.ROWS).toBe(8);
            expect(gameState.COLS).toBe(8);
        });

        it('should show alert if file is missing required properties', async () => {
            // Missing "RULES", etc.
            const incompleteData = {
                ROWS: 8,
                COLS: 8,
                // ...
            };
            const file = createMockFile(JSON.stringify(incompleteData));
            const event = { target: { files: [file] } };

            loadGame(event);
            await new Promise((resolve) => setTimeout(resolve, 50));

            // The function should alert: 'Invalid game data.'
            expect(global.alert).toHaveBeenCalledWith('Invalid game data.');
            // gameState remains unchanged
            expect(gameState.ROWS).toBe(8);
            expect(gameState.COLS).toBe(8);
        });

        it('should do nothing if no file is selected', () => {
            const event = { target: { files: [] } };
            loadGame(event);
            // No alerts, no changes
            expect(global.alert).not.toHaveBeenCalled();
        });
    });

    // -------------------------
    // Test init_game_after_load()
    // (If you want to test re-initialization in isolation)
    // -------------------------
    describe('init_game_after_load()', () => {
        it('should call various UI initialization methods without error', () => {
            gameState.CA_STATE_MATRIX = Array.from({ length: 8 }, () => Array(8).fill(0));

            // Just call it and ensure it doesn’t crash
            // Typically you would spy on `resize`, `drawRows`, etc.
            // But here we only check that it runs with no error
            expect(() => init_game_after_load()).not.toThrow();
        });
    });
});
