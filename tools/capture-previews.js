/**
 * Captures a homepage screenshot for every business in the directory that does
 * not already ship one, and writes it to assets/img/previews/<slug>.jpg.
 *
 * Run it again after adding businesses; it skips anything already captured.
 *
 *   node tools/capture-previews.js            capture what is missing
 *   node tools/capture-previews.js --force    recapture everything
 *
 * Sites that time out or refuse to load are skipped and reported at the end.
 * The card falls back to its tinted header, so a missing preview is harmless.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'img', 'previews');
const data = require(path.join(ROOT, 'assets', 'js', 'data', 'businesses.js'));

const CHROME = process.env.CHROME_PATH ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9222 + Math.floor(Math.random() * 500);
const PROFILE = path.join(require('os').tmpdir(), 'pathway-shots-' + process.pid);

const FORCE = process.argv.includes('--force');
const PAGE_TIMEOUT = 20000;   // give up on a slow site
const SETTLE = 2200;          // let fonts, images and banners land

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Only entries that point at a preview file we have to generate.
const targets = data.directory.filter(item =>
    item.image && item.image.startsWith('assets/img/previews/'));

(async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const todo = targets.filter(item =>
        FORCE || !fs.existsSync(path.join(ROOT, item.image)));

    if (!todo.length) {
        console.log('Nothing to capture: all ' + targets.length + ' previews exist.');
        return;
    }
    console.log('Capturing ' + todo.length + ' of ' + targets.length + ' previews...\n');

    const chrome = spawn(CHROME, [
        '--headless=new', '--disable-gpu', '--hide-scrollbars',
        '--disable-features=Translate,MediaRouter',
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
    let loadedResolve = null;
    ws.addEventListener('message', e => {
        const msg = JSON.parse(e.data);
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
        if (msg.method === 'Page.loadEventFired' && loadedResolve) loadedResolve();
    });
    // Page.navigate does not resolve until the navigation commits, so a site
    // that hangs on DNS or TLS would stall the whole run. Every command gets a
    // deadline; a command that misses it is abandoned rather than awaited.
    const send = (method, params, deadline) => new Promise(res => {
        const n = ++id;
        let settled = false;
        const done = value => { if (!settled) { settled = true; pending.delete(n); res(value); } };
        pending.set(n, done);
        ws.send(JSON.stringify({ id: n, method, params }));
        setTimeout(() => done({ timedOut: true }), deadline || 15000);
    });

    await send('Page.enable', {});
    // 1280x800 at half scale gives a 640x400 image straight out of the browser,
    // so there is no resize step and no image library to install.
    await send('Emulation.setDeviceMetricsOverride', {
        width: 1280, height: 800, deviceScaleFactor: 0.5, mobile: false
    });

    const failed = [];
    let done = 0;

    for (const item of todo) {
        const file = path.join(ROOT, item.image);
        process.stdout.write('  [' + (++done) + '/' + todo.length + '] ' + item.domain + ' ... ');
        try {
            const loaded = new Promise(res => { loadedResolve = res; });
            await send('Page.navigate', { url: item.url }, PAGE_TIMEOUT);
            await Promise.race([loaded, sleep(PAGE_TIMEOUT)]);
            loadedResolve = null;
            await send('Page.stopLoading', {}, 4000);
            await sleep(SETTLE);

            const shot = await send('Page.captureScreenshot', {
                format: 'jpeg', quality: 72, captureBeyondViewport: false
            }, 15000);
            const b64 = shot.result && shot.result.data;
            if (!b64) throw new Error('no image returned');

            const buf = Buffer.from(b64, 'base64');
            if (buf.length < 3000) throw new Error('blank page');
            fs.writeFileSync(file, buf);
            console.log('ok (' + Math.round(buf.length / 1024) + ' KB)');
        } catch (err) {
            failed.push(item.domain + ' - ' + err.message);
            console.log('skipped (' + err.message + ')');
        }
        // Leave the tab on a blank page so the next site starts clean.
        await send('Page.navigate', { url: 'about:blank' }, 8000);
    }

    ws.close();
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch { /* best effort */ }

    console.log('\nCaptured ' + (todo.length - failed.length) + '/' + todo.length + '.');
    if (failed.length) {
        console.log('Skipped (these keep their tinted card header):');
        failed.forEach(f => console.log('  - ' + f));
    }
})();
