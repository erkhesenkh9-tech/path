/**
 * Reveals elements as they scroll into view. Rebound whenever a new page is
 * shown so the incoming page animates from the top.
 */
(function (root) {
    'use strict';

    var observer = null;

    function bind(scope) {
        if (!('IntersectionObserver' in root)) {
            // Old browser: just show everything.
            document.querySelectorAll('[data-reveal]').forEach(function (el) {
                el.classList.add('is-in');
            });
            return;
        }

        if (observer) observer.disconnect();

        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
                if (delay) el.style.transitionDelay = delay + 'ms';
                el.classList.add('is-in');
                observer.unobserve(el);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

        var root_ = scope || document.querySelector('.page.is-active') || document;
        root_.querySelectorAll('[data-reveal]:not(.is-in)').forEach(function (el) {
            observer.observe(el);
        });
    }

    function reset(scope) {
        if (!scope) return;
        scope.querySelectorAll('[data-reveal].is-in').forEach(function (el) {
            el.classList.remove('is-in');
            el.style.transitionDelay = '';
        });
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.reveal = { bind: bind, reset: reset };
})(window);
