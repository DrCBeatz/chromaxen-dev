// Timer.js

export const Timer = function(display_el, callback, start_ms) {
    let is_running = false;
    let then = new Date();

    this.start_ms = start_ms || 0;
    this.elapsed_ms = start_ms || 0;
    this.display_element = display_el;

    this.start = function() {
        if (is_running === false) {
            then = new Date();
            is_running = true;
            this.update();
        }
    };

    this.set_time = function(time) {
        this.start_ms = time;
        this.elapsed_ms = time;
        this.update_view();
    };

    this.get_time_str = function() {
        return make_time_string(this.elapsed_ms);
    };

    this.reset = function() {
        is_running = false;
        this.start_ms = 0;
        this.elapsed_ms = 0;
        then = new Date(); // Reset 'then' to current time
        this.update_view();
        if (callback) callback(this);
    };

    this.stop = function() {
        is_running = false;
        // Do not modify this.start_ms here
    };

    this.toggle_start_stop = function() {
        if (!is_running) {
            this.start();
        } else {
            this.stop();
        }
    };

    this.update = function() {
        var now = new Date();
        this.elapsed_ms = this.start_ms + (now.getTime() - then.getTime());
        if (callback) callback(this);

        // loop
        if (is_running) {
            window.requestAnimationFrame(this.update.bind(this));
        }

        this.update_view();
    };

    this.update_view = function() {
        display_el.innerHTML = make_time_string(this.elapsed_ms);
    };

    this.t_string_to_sec = function(t_string) {
        const minutes = parseInt(t_string.slice(0, 2));
        const seconds = parseInt(t_string.slice(3, 5));
        return (minutes * 60) + seconds;
    };

    function make_time_string(time) {
        const format = new Date(time);
        const min = format.getMinutes();
        const sec = format.getSeconds();
        const timeString = zero_pad(min, 2) + ":" + zero_pad(sec, 2);
        return timeString;
    }

    function zero_pad(number, length) {
        let result = number.toString();
        let pad = length - result.length;
        while (pad > 0) {
            result = '0' + result;
            pad--;
        }
        return result;
    }
};

