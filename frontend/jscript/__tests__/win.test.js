// frontend/jscript/__tests__/win.test.js

import { describe, it, expect,beforeAll, beforeEach, vi, afterEach } from 'vitest'
import { gameState } from '../state.js'

import * as WinModule from '../win.js'

// Mock the modules that win.js imports
vi.mock('../gameUI.js', () => ({
  hide_solve_button: vi.fn(),
}))

// We'll also mock the entire `state.js` module so we can control the gameState
vi.mock('../state.js', () => ({
  gameState: {
    MOVE_COUNT: 42,
    GAME_NAME: 'Game 1',
    timer: {
      stop: vi.fn(),
      get_time_str: vi.fn(() => '00:45'),
      t_string_to_sec: vi.fn((timeStr) => {
        // e.g. "00:45" => 45 seconds
        const [mm, ss] = timeStr.split(':')
        return parseInt(mm) * 60 + parseInt(ss)
      }),
    }
  }
}))

// Utility to create minimal DOM elements used by win.js
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

    // localStorage can also be spied upon or replaced if needed
    global.localStorage = {
      clear: vi.fn(),
    }
  })

  afterEach(() => {
    // Reset DOM, mocks, etc.
    document.body.innerHTML = ''
  })

  // ---------------------
  // Testing the "lose" function
  // ---------------------
  it('lose() shows the lose screen and clears local storage', () => {
    // Act
    WinModule.lose()

    // Assert
    const loseScreen = document.getElementById('lose_screen_container')
    expect(loseScreen.style.display).toBe('block')

    expect(global.localStorage.clear).toHaveBeenCalled()
  })
  
  
  // ---------------------
  // Testing "draw_leaderboard"
  // ---------------------
  it('draw_leaderboard populates #high_score_table with the data', () => {
    // We need a real #high_score_table in the DOM, so let's set it up
    const table = document.getElementById('high_score_table')
    table.innerHTML = ''

    const sampleScores = [
      { moves: 30, time: '00:20', name: 'Alpha' },
      { moves: 40, time: '00:30', name: 'Bravo' },
    ]
    const sampleWinData = { moves: 30, time: '00:20', is_mine_new: false }

    WinModule.draw_leaderboard(sampleScores, sampleWinData)

    // The table should have a header row + up to 10 rows
    const rows = table.querySelectorAll('tr')
    expect(rows.length).toBeGreaterThanOrEqual(3) // 1 header + 2 data rows = 3

    // Check first data row
    const row1Cells = rows[1].querySelectorAll('td')
    expect(row1Cells[1].innerHTML).toBe('30') // moves
    expect(row1Cells[2].innerHTML).toBe('00:20') // time
    expect(row1Cells[3].innerHTML).toBe('Alpha') // name
  })
  
})
