// Timer.js

/**
 * @module TimerModule
 * @description This module provides a `Timer` class for measuring and displaying elapsed time. 
 * The timer can be started, stopped, reset, and updated at regular intervals using `requestAnimationFrame`.
 */

/**
 * @class Timer
 * @classdesc A timer that tracks elapsed time, updates a display element, and can execute a callback.
 * @param {HTMLElement} display_el - The HTML element where the timer's elapsed time will be displayed.
 * @param {function} [callback] - A callback function that is executed on every update.
 * @param {number} [start_ms=0] - The initial start time in milliseconds.
 * @property {number} start_ms - The base start time in ms for this timer.
 * @property {number} elapsed_ms - The total elapsed time in ms since the timer started.
 * @property {HTMLElement} display_element - The HTML element used to display the timer.
 */
export class Timer {
    constructor(display_el, callback, start_ms = 0) {
        this.display_element = display_el;
        this.callback = callback;
        this.start_ms = start_ms;
        this.elapsed_ms = start_ms;

        // Instead of local vars, we store these on the instance.
        this.is_running = false;
        this.then = new Date();
    }

    /**
     * Starts the timer if it is not already running.
     * @returns {void}
     */
    start() {
        if (!this.is_running) {
            this.then = new Date();
            this.is_running = true;
            this.update();
        }
    }

    /**
     * Sets the timer to a specific time.
     * @param {number} time - The time in milliseconds to set the timer to.
     * @returns {void}
     */
    set_time(time) {
        this.start_ms = time;
        this.elapsed_ms = time;
        this.update_view();
    }

    /**
     * Returns the current elapsed time as a formatted string "MM:SS".
     * @returns {string} The current time string formatted as "MM:SS".
     */
    get_time_str() {
        return this._make_time_string(this.elapsed_ms);
    }

    /**
     * Resets the timer to zero and updates the display.
     * @returns {void}
     */
    reset() {
        this.is_running = false;
        this.start_ms = 0;
        this.elapsed_ms = 0;
        this.then = new Date(); // Reset 'then' to current time
        this.update_view();
        if (this.callback) this.callback(this);
    }

    /**
     * Stops the timer without resetting it.
     * @returns {void}
     */
    stop() {
        this.is_running = false;
        // Do not modify this.start_ms here
    }

    /**
     * Toggles the timer's running state. Starts it if it is stopped, or stops it if it is running.
     * @returns {void}
     */
    toggle_start_stop() {
        if (!this.is_running) {
            this.start();
        } else {
            this.stop();
        }
    }

    /**
     * Updates the elapsed time and refreshes the display. Continues updating if the timer is running.
     * @private
     * @returns {void}
     */
    update() {
        const now = new Date();
        this.elapsed_ms = this.start_ms + (now.getTime() - this.then.getTime());
        if (this.callback) this.callback(this);

        // loop
        if (this.is_running) {
            window.requestAnimationFrame(this.update.bind(this));
        }

        this.update_view();
    }

    /**
     * Updates the displayed time using the current `elapsed_ms`.
     * @private
     * @returns {void}
     */
    update_view() {
        this.display_element.innerHTML = this._make_time_string(this.elapsed_ms);
    }

    /**
     * Converts a time string in "MM:SS" format to total seconds.
     * @param {string} t_string - The time string to convert (e.g., "05:30").
     * @returns {number} The total seconds represented by the time string.
     */
    t_string_to_sec(t_string) {
        const minutes = parseInt(t_string.slice(0, 2));
        const seconds = parseInt(t_string.slice(3, 5));
        return (minutes * 60) + seconds;
    }

    /**
     * Converts a millisecond value into a "MM:SS" time string.
     * @private
     * @param {number} time - The time in milliseconds.
     * @returns {string} The formatted time string "MM:SS".
     */
    _make_time_string(time) {
        const format = new Date(time);
        const min = format.getMinutes();
        const sec = format.getSeconds();
        const timeString = this._zero_pad(min, 2) + ":" + this._zero_pad(sec, 2);
        return timeString;
    }

    /**
     * Pads a number with leading zeros to achieve a specified length.
     * @private
     * @param {number} number - The number to pad.
     * @param {number} length - The desired length of the result.
     * @returns {string} The padded string.
     */
    _zero_pad(number, length) {
        let result = number.toString();
        let pad = length - result.length;
        while (pad > 0) {
            result = '0' + result;
            pad--;
        }
        return result;
    }
}
