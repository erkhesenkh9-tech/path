/**
 * Language switcher on top of Google Translate. The widget itself is hidden;
 * this drives it from a normal menu so it matches the rest of the site.
 */
(function (root) {
    'use strict';

    var LABELS = {
        en: 'EN', es: 'ES', 'zh-CN': 'ZH', 'zh-TW': 'ZH-TW', vi: 'VI', tl: 'TL',
        ko: 'KO', ja: 'JA', fr: 'FR', de: 'DE', pt: 'PT', ru: 'RU', ar: 'AR', hi: 'HI'
    };

    function currentLang() {
        var match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
        return match ? match[1] : 'en';
    }

    function markActive(lang) {
        document.querySelectorAll('[data-lang]').forEach(function (button) {
            button.setAttribute('aria-selected', button.getAttribute('data-lang') === lang ? 'true' : 'false');
        });
        var label = document.getElementById('lang-label');
        if (label) label.textContent = LABELS[lang] || lang.toUpperCase();
    }

    function apply(lang) {
        var domain = root.location.hostname;
        var expired = '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        if (lang === 'en') {
            document.cookie = 'googtrans=' + expired;
            document.cookie = 'googtrans=' + expired + ' domain=' + domain + ';';
        } else {
            document.cookie = 'googtrans=/en/' + lang + '; path=/;';
            document.cookie = 'googtrans=/en/' + lang + '; path=/; domain=' + domain + ';';
        }

        var select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            markActive(lang);
        } else {
            root.location.reload();
        }

        var menu = document.getElementById('lang');
        if (menu) menu.classList.remove('is-open');
    }

    function init() {
        var wrap = document.getElementById('lang');
        var toggle = document.getElementById('lang-toggle');
        if (!wrap || !toggle) return;

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            var open = wrap.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        document.querySelectorAll('[data-lang]').forEach(function (button) {
            button.addEventListener('click', function () { apply(button.getAttribute('data-lang')); });
        });

        document.addEventListener('click', function (event) {
            if (event.target.closest('#lang')) return;
            wrap.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') wrap.classList.remove('is-open');
        });

        markActive(currentLang());

        // The widget loads asynchronously; sync the label once it appears.
        var poll = setInterval(function () {
            if (document.querySelector('.goog-te-combo')) {
                markActive(currentLang());
                clearInterval(poll);
            }
        }, 500);
        setTimeout(function () { clearInterval(poll); }, 15000);
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.translate = { init: init };
})(window);
