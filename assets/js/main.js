/**
 * Boots the site. Every module is independent and defensive, so one failing
 * feature cannot take the page down with it.
 */
(function (root) {
    'use strict';

    var P = root.Pathway || {};

    function safely(name, fn) {
        try {
            fn();
        } catch (err) {
            if (root.console) console.error('Pathway: ' + name + ' failed to start.', err);
        }
    }

    function start() {
        safely('preloader', function () { P.preloader.init(); });
        safely('navigation', function () { P.nav.init(); });
        safely('faq', function () { P.faq.init(); });
        safely('translate', function () { P.translate.init(); });

        // The map goes first: the directory's initial render calls straight
        // into it to keep the place counts in step with the list.
        safely('map', function () { P.map.init(); });

        safely('directory', function () {
            P.directory.init({
                onFilter: function (found) {
                    if (P.map && P.map.update) P.map.update(found);
                }
            });
        });

        safely('router', function () {
            P.router.onChange(function () {
                var page = document.querySelector('.page.is-active');
                if (!page) return;
                P.reveal.reset(page);
                // Wait for layout to settle at the top of the new page before
                // deciding what is on screen.
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () { P.reveal.bind(page); });
                });
            });
            P.router.init();
        });

        safely('reveal', function () {
            P.reveal.bind(document.querySelector('.page.is-active'));
        });

        var year = document.getElementById('year');
        if (year) year.textContent = String(new Date().getFullYear());
    }

    document.documentElement.classList.remove('no-js');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})(window);
