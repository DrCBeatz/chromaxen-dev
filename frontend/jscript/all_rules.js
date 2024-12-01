// jscript/all_rules.js

/**
 * Initializes the "All Rules" view.
 * Attaches event listeners to navigation buttons and initializes the rules list.
 * @module AllRules
 */

import {
  get_rules_list,
  show_prev_rule,
  show_next_rule,
  back_to_rules,
  refresh_rule
} from './get_rules.js';

// Cache DOM elements
const backButtonPrev = document.getElementById('back_button_prev');
const backButtonAllRules = document.getElementById('back_button_all_rules');
const backButtonNext = document.getElementById('back_button_next');
const backButtonRefresh = document.getElementById('back_button_refresh');
const rulesContainer = document.getElementById('all_rules_container');

// Attach event listeners to your buttons
backButtonPrev.addEventListener('mousedown', show_prev_rule);
backButtonAllRules.addEventListener('mousedown', back_to_rules);
backButtonNext.addEventListener('mousedown', show_next_rule);
backButtonRefresh.addEventListener('mousedown', refresh_rule);

// Initialize the rules list
get_rules_list(rulesContainer);
