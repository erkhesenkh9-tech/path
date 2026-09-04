/**
 * Accessible disclosure rows. The markup ships as real buttons, so this only
 * has to manage open state and aria.
 */
(function (root) {
    'use strict';

    function init() {
        document.querySelectorAll('.faq-item').forEach(function (item, i) {
            var button = item.querySelector('.faq-q');
            var answer = item.querySelector('.faq-a');
            if (!button || !answer) return;

            var id = 'faq-a-' + i;
            answer.id = id;
            button.setAttribute('aria-controls', id);
            button.setAttribute('aria-expanded', 'false');

            button.addEventListener('click', function () {
                var open = item.classList.toggle('is-open');
                button.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        });
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.faq = { init: init };
})(window);
