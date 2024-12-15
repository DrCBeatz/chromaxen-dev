// jscript/__tests__/timer.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Timer } from '../Timer.js'

describe('Timer', () => {
  let displayEl
  let timer
  let originalDateNow

  beforeEach(() => {
    // Reset JSDOM and mocks before each test
    displayEl = document.createElement('div')
    document.body.appendChild(displayEl)

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      // Instead of a real animation frame, we immediately invoke the callback
      // In a real test scenario, you may store this callback and call it later
      return setTimeout(cb, 0)
    })

    // Reset system time (if previously set)
    vi.useRealTimers()
    originalDateNow = Date.now()
  })

  it('initializes with the given start time', () => {
    timer = new Timer(displayEl, null, 60000)
    expect(timer.start_ms).toBe(60000)
    expect(timer.elapsed_ms).toBe(60000)
    // Initial view update happens in set_time if called, but here it only updates view on certain methods
    // Let’s call update_view to confirm display
    timer.update_view()
    expect(displayEl.innerHTML).toBe('01:00') // 60,000 ms = 1 minute
  })

  it('starts the timer and updates elapsed time', async () => {
    const mockCallback = vi.fn()
    timer = new Timer(displayEl, mockCallback)
    
    // Freeze time at a certain point
    const start = new Date('2020-01-01T00:00:00Z').getTime()
    vi.setSystemTime(start)

    // Start the timer
    timer.start()
    expect(timer.is_running).toBe(true)

    // Move time forward by 2 seconds
    vi.setSystemTime(start + 2000)
    
    // Invoke the requestAnimationFrame callback to simulate an animation frame passing
    await new Promise(resolve => setTimeout(resolve, 0)) // wait for requestAnimationFrame mock

    expect(timer.elapsed_ms).toBe(timer.start_ms + 2000)
    expect(mockCallback).toHaveBeenCalled()
    // Update view happens after each frame
    expect(displayEl.innerHTML).toBe('00:02')
  })

  it('stops the timer without resetting elapsed time', async () => {
    timer = new Timer(displayEl)
    vi.setSystemTime(originalDateNow)
    timer.start()
    
    // Advance by 3 seconds
    vi.setSystemTime(originalDateNow + 3000)
    await new Promise(resolve => setTimeout(resolve, 0)) 

    timer.stop()
    expect(timer.is_running).toBe(false)

    // Move forward another 2 seconds and simulate another frame
    vi.setSystemTime(originalDateNow + 5000)
    await new Promise(resolve => setTimeout(resolve, 0))

    // Since timer is stopped, elapsed_ms should not advance
    expect(timer.elapsed_ms).toBe(timer.start_ms + 3000)
  })

  it('resets the timer', () => {
    timer = new Timer(displayEl)
    timer.start_ms = 60000
    timer.elapsed_ms = 61000
    timer.reset()
    expect(timer.is_running).toBe(false)
    expect(timer.start_ms).toBe(0)
    expect(timer.elapsed_ms).toBe(0)
    expect(displayEl.innerHTML).toBe('00:00')
  })

  it('formats time correctly', () => {
    timer = new Timer(displayEl)
    timer.elapsed_ms = 125000 // 2 minutes 5 seconds
    expect(timer.get_time_str()).toBe('02:05')
  })

  it('converts time string to seconds correctly', () => {
    timer = new Timer(displayEl)
    expect(timer.t_string_to_sec('02:05')).toBe(125) // 2*60 + 5 = 125 seconds
  })
})
