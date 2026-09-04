/**
 * Client-side routing for the five pages. The URL fragment is the source of
 * truth, so every page is linkable and the back button works.
 */
(function (root) {
    'use strict';

    var PAGES = ['home', 'about', 'services', 'directory', 'contact'];

    var TITLES = {
        home: 'Pathway — Free websites for immigrant-owned businesses',
        about: 'About — Pathway',
        services: 'How it works — Pathway',
        directory: 'The businesses — Pathway',
        contact: 'Get started — Pathway'
    };

    var listeners = [];
    var current = null;
    var ignoreNextHash = false;

    function fromHash() {
        var raw = (root.location.hash || '').replace(/^#\/?/, '');
        return PAGES.indexOf(raw) !== -1 ? raw : null;
    }

    function show(page, options) {
        options = options || {};
        if (PAGES.indexOf(page) === -1) page = 'home';
        if (page === current && !options.force) return;

        PAGES.forEach(function (id) {
            var el = document.getElementById('page-' + id);
            if (el) el.classList.toggle('is-active', id === page);
        });

        document.querySelectorAll('.nav [data-page]').forEach(function (link) {
            if (link.getAttribute('data-page') === page) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });

        document.title = TITLES[page] || TITLES.home;
        document.body.classList.toggle('wants-cta', page !== 'contact');

        if (!options.fromHash) {
            var target = page === 'home' ? '#/' : '#/' + page;
            if (root.location.hash !== target) {
                ignoreNextHash = true;
                root.location.hash = target;
            }
        }

        if (!options.silent) root.scrollTo(0, 0);

        current = page;
        listeners.forEach(function (fn) { fn(page); });
    }

    function onChange(fn) { listeners.push(fn); }

    function init() {
        document.addEventListener('click', function (event) {
            var link = event.target.closest('[data-page]');
            if (!link) return;
            event.preventDefault();
            show(link.getAttribute('data-page'));
        });

        root.addEventListener('hashchange', function () {
            if (ignoreNextHash) { ignoreNextHash = false; return; }
            var page = fromHash();
            if (page) show(page, { fromHash: true });
        });

        show(fromHash() || 'home', { fromHash: true, force: true, silent: true });
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.router = { init: init, show: show, onChange: onChange, pages: PAGES };
})(window);
