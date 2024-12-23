// frontend/jscript/__tests__/win.test.js

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { gameState } from '../state.js'
import * as WinModule from '../win.js'

// Mock the modules that win.js imports
vi.mock('../gameUI.js', () => ({
    hide_solve_button: vi.fn(),
}))

vi.mock('../state.js', () => ({
    gameState: {
        MOVE_COUNT: 42,
        GAME_NAME: 'Game 1',
        timer: {
            stop: vi.fn(),
            get_time_str: vi.fn(() => '00:45'),
            t_string_to_sec: vi.fn((timeStr) => {
                const [mm, ss] = timeStr.split(':')
                return parseInt(mm) * 60 + parseInt(ss)
            }),
        }
    }
}))

function setupDom() {
    document.body.innerHTML = `
    <div id="win_screen_container" style="display:none">
      <div id="win_screen">
        <h3 id="high_score_table_header"></h3>
        <table id="high_score_table"></table>
      </div>
    </div>
    <div id="lose_screen_container" style="display:none"></div>
  `
}

describe('win.js', () => {
    let mockFetch

    beforeEach(() => {
        vi.restoreAllMocks()
        setupDom()

        // Mock fetch globally if we want to test network calls (e.g., send_win_data, get_leader_board)
        mockFetch = vi.fn()
        global.fetch = mockFetch

        global.localStorage = {
            clear: vi.fn(),
        }
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    // ---------------------
    // Testing the "lose" function
    // ---------------------
    it('lose() shows the lose screen and clears local storage', () => {
        WinModule.lose()
        const loseScreen = document.getElementById('lose_screen_container')
        expect(loseScreen.style.display).toBe('block')
        expect(global.localStorage.clear).toHaveBeenCalled()
    })

    // ---------------------
    // Testing the "win" function
    // ---------------------
    it('win() calls fetch, shows the win screen, etc.', async () => {
        vi.useFakeTimers()

        // Mock fetch so it doesn't fail
        global.fetch.mockResolvedValueOnce({
            ok: true,
            statusText: '',
            json: async () => ([{ moves: 30, time: '00:20', name: 'Alpha' }]),
        })

        WinModule.win()

        // Fire the 500ms timer
        vi.runAllTimers()

        // Let the async code finish
        await vi.runAllTicks()

        // Confirm fetch got called with the correct URL
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/win_states?game=Game%201'),
            expect.objectContaining({ method: 'GET' })
        )

        // Confirm the DOM is updated
        expect(document.getElementById('win_screen_container').style.display).toBe('block')

        // Confirm the timer was stopped
        expect(gameState.timer.stop).toHaveBeenCalled()

        // Confirm localStorage was cleared
        expect(global.localStorage.clear).toHaveBeenCalled()
    })

    // ---------------------
    // Testing "draw_leaderboard"
    // ---------------------
    it('draw_leaderboard populates #high_score_table with the data', () => {
        const table = document.getElementById('high_score_table')
        table.innerHTML = ''

        const sampleScores = [
            { moves: 30, time: '00:20', name: 'Alpha' },
            { moves: 40, time: '00:30', name: 'Bravo' },
        ]
        const sampleWinData = { moves: 30, time: '00:20', is_mine_new: false }

        WinModule.draw_leaderboard(sampleScores, sampleWinData)

        const rows = table.querySelectorAll('tr')
        expect(rows.length).toBeGreaterThanOrEqual(3) // 1 header + 2 data rows

        // Check first data row
        const row1Cells = rows[1].querySelectorAll('td')
        expect(row1Cells[1].innerHTML).toBe('30') // moves
        expect(row1Cells[2].innerHTML).toBe('00:20') // time
        expect(row1Cells[3].innerHTML).toBe('Alpha') // name
    })
    
})

describe('win.js - get_leader_board()', () => {
    let mockFetch

    beforeEach(() => {
        vi.restoreAllMocks()
        setupDom()

        mockFetch = vi.fn()
        global.fetch = mockFetch
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('calls fetch with correct URL and updates DOM header', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ([
                { moves: 30, time: '00:20', name: 'TestUser' }
            ]),
        })

        await WinModule.get_leader_board()

        // 1. Confirm fetch was called
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/win_states?game=Game%201'),
            expect.objectContaining({ method: 'GET' })
        )

        // 2. Confirm DOM changed => "High Score for Game 1"
        const headerEl = document.getElementById('high_score_table_header')
        expect(headerEl.innerHTML).toBe('High Score for Game 1')

        // 3. Confirm that the final HTML in #high_score_table
        //    (or wherever) is what you'd expect after "processing" 
        //    the new data. For example, you might check row contents:
        const table = document.getElementById('high_score_table')
        // If `process_leaderboard` calls `draw_leaderboard`, check what `table.innerHTML` includes
        expect(table.innerHTML).toContain('TestUser')
        expect(table.innerHTML).toContain('00:20')
    })

    it('logs an error if the response is not ok', async () => {
        // 1. Provide a mock fetch response that is not ok
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Server error',
            json: async () => ([]), // won't matter because of !response.ok
        })

        // 2. Spy on console.error to see if it logs
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        // 3. Call get_leader_board()
        await WinModule.get_leader_board()

        // 4. Expect an error to be logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error fetching leaderboard:',
            'Server error'
        )

        // 5. process_leaderboard shouldn't run
        const processLeaderboardSpy = vi.spyOn(WinModule, 'process_leaderboard')
        expect(processLeaderboardSpy).not.toHaveBeenCalled()

        consoleErrorSpy.mockRestore()
    })

    it('catches and logs fetch errors (e.g., network error)', async () => {
        // 1. Make fetch reject
        mockFetch.mockRejectedValueOnce(new Error('Network Failure'))

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        // 2. Call get_leader_board()
        await WinModule.get_leader_board()

        // 3. It should log the thrown error
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error fetching leaderboard:',
            expect.any(Error) // or 'Network Failure'
        )

        consoleErrorSpy.mockRestore()
    })
})