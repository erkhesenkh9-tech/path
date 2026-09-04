/**
 * The searchable business directory, and the cards used for it and on the
 * home page. Filtering here also drives the map, via the callback passed to
 * init().
 */
(function (root) {
    'use strict';

    var data = null;
    var onFilter = null;
    var group = 'all';
    var query = '';
    var results = null;
    var countEl = null;

    function escapeHtml(value) {
        return String(value)
            .replace(/&(?![a-z]+;|#\d+;)/gi, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Names in the data carry a few HTML entities (&amp;). Strip them for
    // searching and for anything that needs plain text.
    function plain(value) {
        return String(value).replace(/&amp;/g, '&').replace(/&[a-z]+;/gi, ' ');
    }

    function initials(name) {
        var words = plain(name).replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
        if (!words.length) return '?';
        return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
    }

    function card(item) {
        var link = document.createElement('a');
        link.className = 'biz-card';
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        var badge = data.groups[item.group].badge;
        var tagClass = 'biz-tag' + (item.group === 'pathway' ? ' biz-tag--ours' : '');

        // Preview images may not exist for every site; the fallback shows the
        // initials behind, and the image is removed if it fails to load.
        var preview =
            '<div class="biz-preview">' +
                '<div class="biz-fallback"><span>' + escapeHtml(initials(item.name)) + '</span></div>' +
                (item.image
                    ? '<img src="' + escapeHtml(item.image) + '" alt="Homepage of ' +
                      escapeHtml(plain(item.name)) + '" loading="lazy" decoding="async" width="640" height="400">'
                    : '') +
                '<div class="biz-chrome"><i></i><i></i><i></i><span>' + escapeHtml(item.domain) + '</span></div>' +
                '<span class="' + tagClass + '">' + badge + '</span>' +
            '</div>';

        link.innerHTML = preview +
            '<div class="biz-body">' +
                '<h3>' + item.name + '</h3>' +
                '<div class="biz-meta">' + item.meta + '</div>' +
                (item.address ? '<div class="biz-detail">' + escapeHtml(item.address) + '</div>' : '') +
                (item.description ? '<p>' + item.description + '</p>' : '') +
                (item.metric ? '<div class="biz-result">' + item.metric + '</div>' : '') +
                '<span class="biz-visit">Visit website' + arrowIcon() + '</span>' +
            '</div>';

        var img = link.querySelector('.biz-preview img');
        if (img) img.addEventListener('error', function () { img.remove(); });

        return link;
    }

    function arrowIcon() {
        return '<svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true">' +
            '<path d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10" stroke="currentColor" ' +
            'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    function matches() {
        var q = query.trim().toLowerCase();
        return data.directory.filter(function (item) {
            if (group !== 'all' && item.group !== group) return false;
            if (!q) return true;
            return (plain(item.name) + ' ' + plain(item.meta) + ' ' + item.domain + ' ' +
                (item.address || '')).toLowerCase().indexOf(q) !== -1;
        });
    }

    function render() {
        if (!results) return;

        var found = matches();
        if (onFilter) onFilter(found);

        results.textContent = '';

        if (!found.length) {
            var empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Nothing matched that search. Try a neighbourhood like Mission, or a type like coffee.';
            results.appendChild(empty);
            if (countEl) countEl.textContent = '';
            return;
        }

        ['pathway', 'sf', 'example'].forEach(function (key) {
            var items = found.filter(function (item) { return item.group === key; });
            if (!items.length) return;

            var section = document.createElement('section');
            section.className = 'dir-group';

            var head = document.createElement('div');
            head.className = 'dir-group-head';
            head.innerHTML =
                '<div class="row"><h3>' + data.groups[key].title + '</h3>' +
                '<span class="count">' + items.length + (items.length === 1 ? ' business' : ' businesses') + '</span></div>' +
                '<p>' + data.groups[key].note + '</p>';
            section.appendChild(head);

            var grid = document.createElement('div');
            grid.className = 'biz-grid';
            items.forEach(function (item) { grid.appendChild(card(item)); });
            section.appendChild(grid);

            results.appendChild(section);
        });

        if (countEl) {
            countEl.innerHTML = 'Showing <b>' + found.length + '</b> of <b>' +
                data.directory.length + '</b> businesses';
        }
    }

    function renderFeatured() {
        var host = document.getElementById('featured');
        if (!host) return;
        host.textContent = '';
        data.directory
            .filter(function (item) { return item.group === 'pathway'; })
            .forEach(function (item) { host.appendChild(card(item)); });
    }

    function init(options) {
        options = options || {};
        data = root.Pathway.data;
        onFilter = options.onFilter || null;
        results = document.getElementById('dir-results');
        countEl = document.getElementById('dir-count');

        renderFeatured();

        document.querySelectorAll('[data-filter]').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('[data-filter]').forEach(function (other) {
                    other.setAttribute('aria-pressed', 'false');
                });
                chip.setAttribute('aria-pressed', 'true');
                group = chip.getAttribute('data-filter');
                render();
            });
        });

        var input = document.getElementById('dir-search');
        if (input) {
            var timer = null;
            input.addEventListener('input', function () {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    query = input.value;
                    render();
                }, 110);
            });
        }

        render();

        var total = document.getElementById('stat-directory');
        if (total) total.textContent = data.directory.length;
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.directory = { init: init, render: render, card: card, plain: plain };
})(window);
