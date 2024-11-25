// jscript/all_rules.js

import {
    get_rules_list,
    show_rule,
    show_prev_rule,
    show_next_rule,
    back_to_rules,
    refresh_rule
  } from './get_rules.js';
  
  // Attach event listeners to your buttons
  document.getElementById('back_button_prev').addEventListener('mousedown', show_prev_rule);
  document.getElementById('back_button_all_rules').addEventListener('mousedown', back_to_rules);
  document.getElementById('back_button_next').addEventListener('mousedown', show_next_rule);
  document.getElementById('back_button_refresh').addEventListener('mousedown', refresh_rule);
  
  // Initialize the rules list
  get_rules_list(document.getElementById('all_rules_container'));
  