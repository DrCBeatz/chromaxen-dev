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
          json: async () => ([ { moves: 30, time: '00:20', name: 'Alpha' } ]),
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
