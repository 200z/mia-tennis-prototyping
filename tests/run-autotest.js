#!/usr/bin/env node
// One-command automated test for index.html.
//   npm install && npx playwright install chromium
//   node tests/run-autotest.js                       # desktop Chrome
//   node tests/run-autotest.js --device "Pixel 7" --cpu 4   # phone screen + 4x slower CPU (approximates a mid-range phone)
//   node tests/run-autotest.js --file ./index.html --perfSec 8 --n 60 --out ./autotest-results
// Exit code 0 = PASS/WARN, 1 = FAIL. Writes report JSON + CSV + a screenshot of the result panel.
const path = require('path'), fs = require('fs');
const { chromium, devices } = require('playwright');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const file = path.resolve(opt('file', path.join(__dirname, '..', 'index.html')));
const device = opt('device', null), cpu = +opt('cpu', 1), perfSec = +opt('perfSec', 8), n = +opt('n', 120);
const outDir = path.resolve(opt('out', './autotest-results'));

(async () => {
    const browser = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-component-update'], args: ['--component-updater=fast-update'], headless: true });
    const owner = (process.env.DEVBOX_OWNER || process.env.USER || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
    const tmp = await browser.newPage(); const defaultUA = await tmp.evaluate(() => navigator.userAgent); await tmp.close();
    const base = device ? devices[device] : { viewport: { width: 1280, height: 720 } };
    if (device && !base) throw new Error('Unknown device: ' + device);
    // landscape for phones: the game is played sideways
    const ctxOpts = Object.assign({}, base, base.isMobile ? { viewport: { width: base.viewport.height, height: base.viewport.width } } : {});
    ctxOpts.userAgent = `${base.userAgent || defaultUA} mia/${owner || 'unknown'} (mia; Playwright; +internal)`;
    const context = await browser.newContext(ctxOpts);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    if (cpu > 1) { const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
    const url = 'file://' + file + `?autotest=quick&perfSec=${perfSec}&n=${n}`;
    console.log(`Running ${url}\n  device=${device || 'desktop'} cpuThrottle=${cpu}x`);
    const t0 = Date.now();
    await page.goto(url);
    await page.waitForFunction(() => window.__autotestResult, null, { timeout: 15 * 60 * 1000, polling: 1000 });
    const rep = await page.evaluate(() => window.__autotestResult);
    rep.runner = { device: device || 'desktop', cpuThrottle: cpu, wallSec: (Date.now() - t0) / 1000, pageErrors: errors };
    fs.mkdirSync(outDir, { recursive: true });
    const tag = (device || 'desktop').replace(/\W+/g, '-') + (cpu > 1 ? `-cpu${cpu}x` : '');
    fs.writeFileSync(path.join(outDir, `autotest-${tag}.json`), JSON.stringify(rep, null, 2));
    fs.writeFileSync(path.join(outDir, `autotest-${tag}.csv`), await page.evaluate(() => window.__tennis.AT.toCsv()));
    await page.screenshot({ path: path.join(outDir, `autotest-${tag}.png`), fullPage: false });
    await browser.close();

    console.log(`\nOverall: ${rep.overall}  (${rep.runner.wallSec.toFixed(0)}s)`);
    for (const c of rep.checks) console.log(`  [${c.status}] ${c.id.padEnd(6)} ${c.name} — ${c.detail}`);
    for (const p of rep.perf) console.log(`  FPS ${p.scene.padEnd(26)} avg ${p.avgFps.toFixed(1)}  1%low ${p.low1Fps.toFixed(1)}  JS ${p.cpuAvgMs.toFixed(2)}ms/frame  busy ${(100 * p.cpuBusy).toFixed(1)}%`);
    const rc = rep.recommendation || {};
    console.log(`  Recommended window: ${rc.recommendedWindow} ms (meets targets: ${(rc.windowsMeetingTargets || []).join(', ')}), max ball speed for Casual: ${rc.maxFeedForCasual} m/s, fair AI error: ${rc.fairAiErr}`);
    if (errors.length) console.log('  Page errors:', errors.slice(0, 5));
    console.log(`  Results → ${outDir}`);
    process.exit(rep.overall === 'FAIL' || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
