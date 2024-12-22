// frontend/jscript/__tests__/get_rules.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as GetRulesModule from '../get_rules.js'

// Mock imports
vi.mock('../gameUI.js', () => ({
    COLORS: ['#000000', '#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777'],
  }))
  
  vi.mock('../gamelogic.js', () => ({
    nextByRule: vi.fn((currentState, ruleNumber) => (currentState + 1) % 8),
  }))

describe('get_rules.js', () => {
  let container
  let mockFetch

  beforeEach(() => {
    vi.resetAllMocks()
    container = document.createElement('div')
    document.body.appendChild(container)

    const allRulesContainer = document.createElement('div')
    allRulesContainer.id = 'all_rules_container'
    document.body.appendChild(allRulesContainer)

    const testerContainer = document.createElement('div')
    testerContainer.id = 'tester_container'
    document.body.appendChild(testerContainer)

    const ruleDisplay = document.createElement('div')
    ruleDisplay.id = 'rule_display'
    document.body.appendChild(ruleDisplay)

    const imgDisplay = document.createElement('div')
    imgDisplay.id = 'img_display'
    document.body.appendChild(imgDisplay)

    const oldImgDisplay = document.createElement('div')
    oldImgDisplay.id = 'old_img_display'
    document.body.appendChild(oldImgDisplay)

    const colorTestTable = document.createElement('table')
    colorTestTable.id = 'color_test_table'
    document.body.appendChild(colorTestTable)

    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  it('get_rules_list fetches, sorts, and appends rules', async () => {
    // Mock JSON response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        "img/rules/rule10.jpg",
        "img/rules/rule2.jpg",
        "img/rules/rule1.svg"
      ])
    })

    await GetRulesModule.get_rules_list(container)

    // Check fetch call
    expect(mockFetch).toHaveBeenCalledWith("json/get_rule_img_list.json")

    // After sorting by rule number, order should be: rule1.svg, rule2.jpg, rule10.jpg
    const children = container.querySelectorAll('.rule')
    expect(children.length).toBe(3)

    // Check first child corresponds to rule1.svg
    expect(children[0].dataset.title).toBe('rule1')
    expect(children[0].dataset.is_finished).toBe("true") // svg means finished
    expect(children[0].style.backgroundImage).toContain('rule1.svg')

    // Check second child corresponds to rule2.jpg
    expect(children[1].dataset.title).toBe('rule2')
    expect(children[1].dataset.is_finished).toBe("false") // jpg means not finished
    expect(children[1].style.backgroundImage).toContain('rule2.jpg')

    // Check third child corresponds to rule10.jpg
    expect(children[2].dataset.title).toBe('rule10')

  })

  it('get_rules_list handles network error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await GetRulesModule.get_rules_list(container)

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch rule list:', expect.any(Error))
    consoleErrorSpy.mockRestore()
  })

  it('get_rules_list calls callback if provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })
    const callback = vi.fn()
    await GetRulesModule.get_rules_list(container, callback)
    expect(callback).toHaveBeenCalled()
  })

  it('show_rule displays the correct rule data', () => {
    // Simulate a rule element as if created by get_rules_list
    const ruleEl = document.createElement('div')
    ruleEl.id = 'rule5'
    ruleEl.dataset.title = 'rule5'
    ruleEl.dataset.url = 'img/rules/rule5.svg'
    ruleEl.dataset.old_url = 'img/old_images/xrule5.jpg'
    ruleEl.dataset.is_finished = 'true'
    document.body.appendChild(ruleEl)

    document.getElementById('rule_display').innerHTML = 'Rule 5'

    GetRulesModule.show_rule(5)

    expect(document.getElementById('all_rules_container').style.display).toBe('none')
    expect(document.getElementById('tester_container').style.display).toBe('block')
    expect(document.getElementById('rule_display').innerHTML).toBe('rule5')
    expect(document.getElementById('img_display').style.backgroundImage).toBe('url(img/rules/rule5.svg)')
    expect(document.getElementById('old_img_display').style.backgroundImage).toBe('url(img/old_images/xrule5.jpg)')

    // Check the color_test_table is populated
    const rows = document.getElementById('color_test_table').querySelectorAll('tr')
    expect(rows.length).toBe(8) // 8 rows
    // Each row should have 1 td for the initial color + 8 tds for the transitions
    rows.forEach(row => {
      const tds = row.querySelectorAll('td')
      expect(tds.length).toBe(9)
    })
  })

  it('show_rule displays no old image if not finished', () => {
    const ruleEl = document.createElement('div')
    ruleEl.id = 'rule10'
    ruleEl.dataset.title = 'rule10'
    ruleEl.dataset.url = 'img/rules/rule10.jpg'
    ruleEl.dataset.old_url = 'img/old_images/xrule10.jpg'
    ruleEl.dataset.is_finished = 'false'
    document.body.appendChild(ruleEl)

    GetRulesModule.show_rule(10)
    expect(document.getElementById('old_img_display').style.backgroundImage).toBe('none')
  })

  it('back_to_rules shows all rules again', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(["img/rules/rule0.jpg"])
    })

    await GetRulesModule.back_to_rules()
    // after back_to_rules executes, all_rules_container should be visible, tester_container hidden
    expect(document.getElementById('all_rules_container').style.display).toBe('block')
    expect(document.getElementById('tester_container').style.display).toBe('none')
  }),

  describe('show_next_rule', () => {
    beforeEach(() => {
      // Always return a successful, empty array for the rule list
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    })
    
    it('increments the rule number if < 255', async () => {
      document.getElementById('rule_display').innerHTML = 'Rule 5'
      
      const rule6 = document.createElement('div')
      rule6.id = 'rule6'
      rule6.dataset.title = 'rule6'
      rule6.dataset.url = 'img/rules/rule6.jpg'
      rule6.dataset.old_url = 'img/old_images/xrule6.jpg'
      rule6.dataset.is_finished = 'false'
      document.body.appendChild(rule6)
    
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    
      await GetRulesModule.show_next_rule()
    
    }),

    it('wraps around to 0 if the rule is 255', async () => {
      // Suppose the current rule is 255
      document.getElementById('rule_display').innerHTML = 'Rule 255'
  
      // show_next_rule will call show_rule(0),
      // so let's create <div id="rule0"> in the DOM
      const rule0 = document.createElement('div')
      rule0.id = 'rule0'
      rule0.dataset.title = 'rule0'
      rule0.dataset.url = 'img/rules/rule0.jpg'
      rule0.dataset.old_url = 'img/old_images/xrule0.jpg'
      rule0.dataset.is_finished = 'false'
      document.body.appendChild(rule0)
  
      await GetRulesModule.show_next_rule()
  
      // Now it should show rule0
      expect(document.getElementById('rule_display').innerHTML).toBe('rule0')
      expect(document.getElementById('all_rules_container').style.display).toBe('none')
      expect(document.getElementById('tester_container').style.display).toBe('block')
    }),

    it('handles missing or non-numeric rule_display gracefully', async () => {
      // Suppose rule_display is nonsense like "No rule here!"
      document.getElementById('rule_display').innerHTML = 'No rule here!'
  
      // If the code sees no valid rule number, it defaults to 0, then increments => 1
      // So eventually, it will call show_rule(1).
      // Therefore, let's create <div id="rule1">
      const rule1 = document.createElement('div')
      rule1.id = 'rule1'
      rule1.dataset.title = 'rule1'
      rule1.dataset.url = 'img/rules/rule1.jpg'
      rule1.dataset.old_url = 'img/old_images/xrule1.jpg'
      rule1.dataset.is_finished = 'false'
      document.body.appendChild(rule1)
  
      await GetRulesModule.show_next_rule()
  
      // Now it should show rule1
      expect(document.getElementById('rule_display').innerHTML).toBe('rule1')
    })
    
  })
  
})
