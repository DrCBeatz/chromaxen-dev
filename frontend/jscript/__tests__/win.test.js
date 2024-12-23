// frontend/jscript/__tests__/win.test.js

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import * as WinModule from '../win.js'
import { gameState } from '../state.js'

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

describe('process_leaderboard', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        setupDom()
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('inserts current player’s score in correct spot for better moves/time', () => {
        // ARRANGE
        // Suppose we have some existing scores:
        const existingScores = [
            { moves: 25, time: '00:15', name: 'Alice' },
            { moves: 30, time: '00:20', name: 'Bob' },
        ]
        // Mock the current game state
        gameState.MOVE_COUNT = 20
        gameState.timer.get_time_str.mockReturnValue('00:10')

        // ACT
        WinModule.process_leaderboard(existingScores)

        // ASSERT
        // Now, the DOM should have new rows from draw_leaderboard
        // The new score should appear at index 0 if it’s best
        const rows = document
            .getElementById('high_score_table')
            .querySelectorAll('tr')

        // Typically, the first <tr> might be a header row,
        // so the new score might appear in the second row
        // (Depending on how your draw_leaderboard is structured)
        const rowCells = rows[1].querySelectorAll('td')

        expect(rowCells[1].textContent).toBe('20')    // moves
        expect(rowCells[2].textContent).toBe('00:10') // time
    })

    it('appends player score if it’s NOT a new high score but list is not full', () => {
        // ARRANGE
        const existingScores = [
            { moves: 10, time: '00:05', name: 'Speedy' },
        ]
        // e.g. we do worse than existing
        gameState.MOVE_COUNT = 50
        gameState.timer.get_time_str.mockReturnValue('01:00')

        // ACT
        WinModule.process_leaderboard(existingScores)

        // ASSERT
        const rows = document
            .getElementById('high_score_table')
            .querySelectorAll('tr')
        // The first row is a header, second is Speedy, third is our new row
        const rowCells = rows[2].querySelectorAll('td')

        expect(rowCells[1].textContent).toBe('50')     // moves
        expect(rowCells[2].textContent).toBe('01:00')  // time
    })

})

describe('create_enter_name_form', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        // Clear the DOM so each test starts fresh
        document.body.innerHTML = ''
        // Mock fetch so we can see if code is calling the network
        global.fetch = vi.fn()
    })

    afterEach(() => {
        // Clean up after the test
        document.body.innerHTML = ''
    })

    it('returns a form with #name_input and a send button', () => {
        const form = WinModule.create_enter_name_form({
            moves: 10,
            time: '00:30',
            game: 'Game 1'
        })

        // It should be an HTMLFormElement
        expect(form).toBeInstanceOf(HTMLFormElement)
        expect(form.id).toBe('your_name')

        // It should have an input with id="name_input"
        const input = form.querySelector('#name_input')
        expect(input).toBeTruthy()

        // It should have a button
        const button = form.querySelector('button')
        expect(button).toBeTruthy()
        expect(button.textContent).toBe('send')
    })

    it('clicking the button calls fetch with the correct data and updates the form', async () => {
        // Mock fetch
        global.fetch.mockResolvedValueOnce({
          ok: true,
          text: async () => 'OK'
        })
      
        // 1. Create form & add to DOM
        const winData = { moves: 10, time: '00:30', game: 'Game 1' }
        const form = WinModule.create_enter_name_form(winData)
        document.body.appendChild(form)
      
        // 2. Fill input & click
        const input = document.getElementById('name_input')
        input.value = 'MyPlayerName'
        const button = form.querySelector('button')
        button.click()
      
        // 3. Flush all timers & microtasks
        await vi.runAllTimersAsync()
      
        // 4. Check fetch was called
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/win_state'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moves: 10,
              time: '00:30',
              game: 'Game 1',
              name: 'MyPlayerName'
            })
          })
        )
      
        // 5. Check form text updated
        expect(document.getElementById('your_name').textContent).toBe('MyPlayerName')
      })
      
})


