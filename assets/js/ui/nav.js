/**
 * Header behaviour: the mobile menu, and the surface that appears once the
 * page has scrolled so the brand never sits on top of body text.
 */
(function (root) {
    'use strict';

    function init() {
        var header = document.getElementById('header');
        var nav = document.getElementById('nav');
        var toggle = document.getElementById('menu-toggle');

        if (header) {
            var sync = function () {
                header.classList.toggle('is-stuck', root.scrollY > 8);
            };
            root.addEventListener('scroll', sync, { passive: true });
            sync();
        }

        if (!nav || !toggle) return;

        function setOpen(open) {
            nav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        }

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            setOpen(!nav.classList.contains('is-open'));
        });

        nav.addEventListener('click', function (event) {
            if (event.target.closest('a')) setOpen(false);
        });

        document.addEventListener('click', function (event) {
            if (!nav.classList.contains('is-open')) return;
            if (event.target.closest('#nav') || event.target.closest('#menu-toggle')) return;
            setOpen(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') setOpen(false);
        });
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.nav = { init: init };
})(window);
