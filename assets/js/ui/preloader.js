/**
 * The loading screen. Tracks real progress (stylesheets, scripts, images that
 * are already in flight) rather than animating a fake bar, and always gets out
 * of the way — even if something never finishes loading.
 */
(function (root) {
    'use strict';

    var HARD_LIMIT = 2500;   // never hold the page longer than this

    function init() {
        var loader = document.getElementById('loader');
        if (!loader) return;

        var fill = loader.querySelector('.loader-fill');
        var progress = 0;
        var finished = false;

        function set(value) {
            progress = Math.max(progress, Math.min(value, 1));
            if (fill) fill.style.width = (progress * 100) + '%';
        }

        function finish() {
            if (finished) return;
            finished = true;
            set(1);
            // Let the filled bar register before fading out.
            setTimeout(function () {
                loader.classList.add('is-done');
                document.documentElement.classList.add('is-loaded');
                setTimeout(function () { loader.remove(); }, 450);
            }, 160);
        }

        // Count resources as the browser reports them.
        function measure() {
            if (!root.performance || !root.performance.getEntriesByType) return 0.6;
            var done = root.performance.getEntriesByType('resource').length;
            // Roughly what a first paint needs; the exact number does not
            // matter, only that the bar moves and then completes.
            return Math.min(done / 14, 0.9);
        }

        set(0.12);
        var ticker = setInterval(function () { set(measure()); }, 120);

        root.addEventListener('load', function () {
            clearInterval(ticker);
            finish();
        });

        // Belt and braces: a stalled font or third-party script must not keep
        // the loading screen up.
        setTimeout(function () {
            clearInterval(ticker);
            finish();
        }, HARD_LIMIT);
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.preloader = { init: init };
})(window);
