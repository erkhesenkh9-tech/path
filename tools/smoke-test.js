/**
 * Drives the real page over the DevTools protocol and checks the things a
 * visitor actually does: navigating, searching, filtering, choosing a place on
 * the map, typing a place, and opening the FAQ.
 *
 *   node tools/smoke-test.js
 *
 * Exits non-zero if any check fails.
 */
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME_PATH ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9700 + Math.floor(Math.random() * 200);
const PROFILE = path.join(require('os').tmpdir(), 'pathway-test-' + process.pid);
const PAGE_URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/').replace(/ /g, '%20');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const chrome = spawn(CHROME, [
        '--headless=new', '--disable-gpu',
        '--remote-debugging-port=' + PORT,
        '--user-data-dir=' + PROFILE,
        'about:blank'
    ], { stdio: 'ignore' });

    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
        await sleep(500);
        try {
            const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
            target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
        } catch { /* still starting */ }
    }
    if (!target) { console.error('Could not start Chrome.'); chrome.kill(); process.exit(1); }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));

    let id = 0;
    const pending = new Map();
    const problems = [];
    ws.addEventListener('message', e => {
        const msg = JSON.parse(e.data);
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
        if (msg.method === 'Runtime.exceptionThrown') {
            const d = msg.params.exceptionDetails;
            problems.push((d.exception && d.exception.description) || d.text);
        }
    });
    const send = (method, params) => new Promise(res => {
        const n = ++id;
        pending.set(n, res);
        ws.send(JSON.stringify({ id: n, method, params }));
    });
    const evaluate = async expr => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        return r.result && r.result.result ? r.result.result.value : undefined;
    };

    await send('Runtime.enable', {});
    await send('Page.enable', {});
    await send('Page.navigate', { url: PAGE_URL + '#/directory' });
    await sleep(6000);

    const checks = [];
    const check = (label, actual, expected) => {
        const pass = String(actual) === String(expected);
        checks.push({ label, pass, actual, expected });
        console.log((pass ? 'PASS  ' : 'FAIL  ') + label +
            (pass ? '' : '\n        got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
    };

    // --- Structure ---
    check('no uncaught exceptions', problems.length ? problems[0] : 'none', 'none');
    check('stylesheets loaded', await evaluate('document.styleSheets.length >= 5'), true);
    check('data module present', await evaluate('!!(window.Pathway && window.Pathway.data)'), true);
    check('directory page active', await evaluate("document.querySelector('.page.is-active')?.id"), 'page-directory');

    // --- Directory ---
    check('all 111 businesses render as cards',
        await evaluate("document.querySelectorAll('#dir-results .biz-card').length"), 111);
    check('three groups', await evaluate("document.querySelectorAll('.dir-group').length"), 3);
    check('cards carry preview images',
        await evaluate("document.querySelectorAll('#dir-results .biz-preview img').length > 40"), true);

    await evaluate(`(() => { const i = document.getElementById('dir-search');
        i.value = 'coffee'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(400);
    check('search narrows the directory',
        await evaluate("document.querySelectorAll('#dir-results .biz-card').length"), 9);

    await evaluate(`(() => { const i = document.getElementById('dir-search');
        i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(400);
    await evaluate("document.querySelector('[data-filter=\"pathway\"]').click()");
    await sleep(300);
    check('"Built by Pathway" filter shows 3',
        await evaluate("document.querySelectorAll('#dir-results .biz-card').length"), 3);
    await evaluate("document.querySelector('[data-filter=\"all\"]').click()");
    await sleep(300);

    // --- Map: places ---
    check('map opens on the United States',
        await evaluate("document.querySelector('.place[aria-pressed=\"true\"]')?.dataset.place"), 'us');
    check('default map frame shows the US',
        await evaluate("decodeURIComponent(document.getElementById('map-frame').src).includes('United States')"), true);
    check('place selector shows the busiest places plus a "more" toggle',
        await evaluate("document.querySelectorAll('#map-places .place').length"), 9);
    check('the toggle names how many are hidden',
        await evaluate("document.querySelector('.place--more').textContent"), '16 more places');
    await evaluate("document.querySelector('.place--more').click()");
    await sleep(300);
    check('expanding shows every place',
        await evaluate("document.querySelectorAll('#map-places .place').length"), 25);
    await evaluate("document.querySelector('.place--more').click()");
    await sleep(300);
    check('San Francisco is the biggest place',
        await evaluate("[...document.querySelectorAll('#map-places .place')][1].querySelector('.place-name').textContent"),
        'San Francisco, CA');
    check('badge shows its count',
        await evaluate("[...document.querySelectorAll('#map-places .place')][1].querySelector('.place-badge').textContent"), '50');
    check('country badge counts every located business',
        await evaluate("document.querySelector('#map-places .place .place-badge').textContent"), '74');

    await evaluate("[...document.querySelectorAll('#map-places .place')].find(p => p.textContent.includes('San Francisco')).click()");
    await sleep(500);
    check('choosing a place filters the list',
        await evaluate("document.querySelectorAll('#map-list .map-item').length"), 50);
    check('choosing a place moves the map',
        await evaluate("decodeURIComponent(document.getElementById('map-frame').src).includes('San Francisco')"), true);
    check('note reports the place',
        await evaluate("document.getElementById('map-note').textContent"), '50 businesses in San Francisco, CA');

    // --- Map: typed location ---
    await evaluate(`(() => { const i = document.getElementById('map-place-input');
        i.value = 'Chicago'; document.getElementById('map-place-form')
            .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); })()`);
    await sleep(500);
    check('typing a known place selects it',
        await evaluate("document.getElementById('map-note').textContent"), '2 businesses in Chicago, IL');

    await evaluate(`(() => { const i = document.getElementById('map-place-input');
        i.value = 'Reykjavik, Iceland'; document.getElementById('map-place-form')
            .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); })()`);
    await sleep(500);
    check('typing an unknown place still moves the map',
        await evaluate("decodeURIComponent(document.getElementById('map-frame').src).includes('Reykjavik')"), true);
    check('and says there is nothing there yet',
        await evaluate("document.getElementById('map-note').textContent"), 'No businesses on file in Reykjavik, Iceland');

    // --- Map: picking a business ---
    await evaluate("document.querySelector('#map-places .place').click()");
    await sleep(400);
    await evaluate("[...document.querySelectorAll('#map-list .map-item')].find(b => b.textContent.includes('Zuni')).click()");
    await sleep(400);
    check('selecting a business moves the map to its address',
        await evaluate("decodeURIComponent(document.getElementById('map-frame').src).includes('1658 Market St')"), true);

    // --- Routing, FAQ ---
    await evaluate("document.querySelector('.nav a[data-page=\"contact\"]').click()");
    await sleep(500);
    check('navigation switches page', await evaluate("document.querySelector('.page.is-active')?.id"), 'page-contact');
    check('URL is shareable', await evaluate('location.hash'), '#/contact');
    check('title follows the page', await evaluate('document.title'), 'Get started — Pathway');

    await evaluate("document.querySelector('.faq-q').click()");
    await sleep(400);
    check('FAQ opens', await evaluate("document.querySelector('.faq-q').getAttribute('aria-expanded')"), 'true');
    check('FAQ answer has height',
        await evaluate("document.querySelector('.faq-a').getBoundingClientRect().height > 20"), true);

    await evaluate('history.back()');
    await sleep(700);
    check('back button works', await evaluate("document.querySelector('.page.is-active')?.id"), 'page-directory');

    // --- Loading screen and layout ---
    check('loading screen has dismissed itself', await evaluate("!document.getElementById('loader')"), true);
    check('no horizontal overflow',
        await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);

    ws.close();
    chrome.kill();
    try { require('fs').rmSync(PROFILE, { recursive: true, force: true }); } catch { /* best effort */ }

    const failed = checks.filter(c => !c.pass).length;
    console.log('\n' + (checks.length - failed) + '/' + checks.length + ' checks passed');
    process.exit(failed ? 1 : 0);
})();
