// jscript/get_rules.js

/**
 * @module get_rules
 * @description This module provides functions for fetching, displaying, and navigating through rules
 * in the Chromaxen game.
 */

import { COLORS } from './gameUI.js';
import { nextByRule } from './gamelogic.js';

/**
 * Fetches a list of rules images from a JSON file, sorts them, and appends them as clickable elements
 * to a specified DOM element. Once done, optionally calls a callback function.
 *
 * @async
 * @function get_rules_list
 * @param {HTMLElement} el - The DOM element to which the rules will be appended.
 * @param {Function} [callback] - An optional callback function to be called after the rules are fetched and appended.
 * @returns {Promise<void>} A promise that resolves once the rules have been fetched and appended.
 */
export async function get_rules_list(el, callback) {
    try {
        const response = await fetch("json/get_rule_img_list.json")
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`)
        }

        const json = await response.json()
        json.sort((n1, n2) => {
            const number1 = parseInt(n1.split("/")[2].match(/\d+/)[0])
            const number2 = parseInt(n2.split("/")[2].match(/\d+/)[0])
            return number1 > number2 ? 1 : -1
        })

        el.innerHTML = ""
        for (let i = 0; i < json.length; i++) {
            const url = json[i]
            const is_finished = /svg/.test(url)

            let title = json[i].split(".")[0]
            title = title.split("/")[2]

            const rule_number = /\d+/.exec(title)
            const old_url = "img/old_images/x" + title + ".jpg"

            const rule_el = document.createElement('DIV')
            rule_el.style.backgroundImage = `url(${url})`
            rule_el.innerHTML = `<header>${title}</header>`
            rule_el.className = "rule"
            rule_el.id = "rule" + rule_number

            rule_el.dataset.title = title
            rule_el.dataset.url = url
            rule_el.dataset.old_url = old_url
            rule_el.dataset.is_finished = is_finished
            rule_el.dataset.rule_number = rule_number

            rule_el.onclick = function () {
                show_rule(this.dataset.rule_number)
            }
            el.appendChild(rule_el)
        }

        if (typeof callback === 'function') {
            callback()
        }
    } catch (error) {
        console.error('Failed to fetch rule list:', error)
    }
}

/**
 * Displays a specific rule by updating the rule display area and the tester container
 * with the selected rule's data.
 *
 * @function show_rule
 * @param {number|string} rule_number - The number (or numeric string) representing the rule to show.
 */
export function show_rule(rule_number) {
    const rule_el = document.getElementById('rule' + rule_number)

    document.getElementById('all_rules_container').style.display = 'none'
    document.getElementById('tester_container').style.display = 'block'

    document.getElementById('rule_display').innerHTML = rule_el.dataset.title
    document.getElementById('img_display').style.backgroundImage = "url(" + rule_el.dataset.url + ")"

    document.getElementById('old_img_display').style.backgroundImage = "none"
    if (rule_el.dataset.is_finished == "true") {
        document.getElementById('old_img_display').style.backgroundImage = "url(" + rule_el.dataset.old_url + ")"
    }

    const table = document.getElementById('color_test_table')
    table.innerHTML = ""

    let state = [0, 1, 2, 3, 4, 5, 6, 7]
    for (let i = 0; i < 8; i++) {
        const tr = document.createElement('TR')

        const td = document.createElement('TD')
        td.style.backgroundColor = COLORS[i]
        td.style.width = "2em"
        td.style.height = "2em"
        tr.appendChild(td)
        for (let j = 0; j < state.length; j++) {
            const td = document.createElement('TD')
            const next = nextByRule(state[i], rule_el.dataset.rule_number)
            state[i] = next
            td.style.backgroundColor = COLORS[next]
            td.style.width = "2em"
            td.style.height = "2em"
            tr.appendChild(td)
        }
        table.appendChild(tr)
    }
}

/**
 * Shows the previous rule based on the currently displayed rule. If the current rule number
 * is greater than 0, it decrements it; otherwise, it wraps around to 255.
 *
 * @function show_prev_rule
 */
export function show_prev_rule() {
    get_rules_list(document.getElementById('all_rules_container'), function () {
        const rule_number = /\d+/.exec(document.getElementById('rule_display').innerHTML)
        if (rule_number > 0) {
            show_rule(--rule_number)
        } else {
            show_rule(255)
        }
    })
}

/**
 * Shows the next rule based on the currently displayed rule. If the current rule number
 * is less than 255, it increments it; otherwise, it wraps around to 0.
 *
 * @function show_next_rule
 */
export function show_next_rule() {
    get_rules_list(document.getElementById('all_rules_container'), function () {
        const rule_number_match = /\d+/.exec(document.getElementById('rule_display').innerHTML);
        let rule_number = rule_number_match ? parseInt(rule_number_match[0], 10) : 0;
        if (rule_number < 255) {
            show_rule(++rule_number)
        } else {
            show_rule(0)
        }
    })
}

/**
 * Returns the interface to show all rules, hiding the tester container and displaying
 * the all_rules_container.
 *
 * @function back_to_rules
 */
export function back_to_rules() {
    get_rules_list(document.getElementById('all_rules_container'), function () {
        document.getElementById('all_rules_container').style.display = 'block'
        document.getElementById('tester_container').style.display = 'none'
    })
}

/**
 * Refreshes the currently displayed rule by fetching the rules list again and showing
 * the current rule number's data.
 *
 * @function refresh_rule
 */
export function refresh_rule() {
    get_rules_list(document.getElementById('all_rules_container'), function () {
        const rule_number_match = /\d+/.exec(document.getElementById('rule_display').innerHTML);
        const rule_number = rule_number_match ? parseInt(rule_number_match[0], 10) : 0;
        show_rule(rule_number)
    })
}
