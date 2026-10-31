// Makes the App Store and Google Play screenshots from the built app (run `npm run build` first).
// Usage: node scripts/make-screenshots.cjs   (needs Playwright with Chromium)
// Each screenshot is a caption above a real capture of the app. Example stats are filled in so the stats screen
// isn't empty; everything shown is a real screen of the app.
const { chromium } = require('playwright');
const { mkdirSync, readFileSync } = require('node:fs');
const path = require('node:path');

const app = path.join(__dirname, '..');
const page0 = 'file://' + path.join(app, 'www/index.html');
const out = path.join(app, 'store/screenshots');

const SCENES = [
  { file: '1-play', title: 'One pattern.', sub: 'Everyone plays the same one each day.', setup: lightPads },
  { file: '2-result', title: 'Share your run', sub: 'A spoiler-free result card for the group chat.', setup: showResult },
  { file: '3-stats', title: 'Build your streak', sub: 'Stats, history and a daily reminder.', setup: openStats },
  { file: '4-twists', title: 'Daily twists', sub: 'Mirror, Reverse, Ghost, Surge and more.', setup: showTwists },
];
// Store sizes: Apple 6.9" iPhone (1320×2868) and a 9:16 Android phone (1080×1920). Sizes are CSS px at 3x.
const SETS = [
  { name: 'ios-6.9', w: 440, h: 956 },
  { name: 'android', w: 360, h: 640 },
];

function seedStats() {
  const r = {}, now = Date.now();
  for (let i = 1; i < 34; i++) {
    if (i % 6 === 4) continue;
    const d = new Date(now - i * 864e5).toISOString().slice(0, 10);
    r[d] = { score: 180 + ((i * 53) % 420), rounds: 4 + (i % 7), history: [] };
  }
  localStorage.setItem('pulse:web:v1', JSON.stringify({ streak: 3, best: 598, lastPlayed: Object.keys(r).sort().pop(), results: r, archive: {} }));
}
async function lightPads(p) {
  await p.evaluate(() => { const pads = document.querySelectorAll('.pad'); [0, 4, 8].forEach((i) => pads[i].classList.add('on'));
    document.getElementById('status').textContent = 'Watch closely…'; document.getElementById('start').style.visibility = 'hidden'; });
  await p.evaluate(() => document.getElementById('play').scrollIntoView());
}
async function showResult(p) {
  await p.evaluate(() => {
    const $ = (id) => document.getElementById(id);
    $('rScore').textContent = '412';
    $('rSub').textContent = '7 rounds cleared · ' + document.getElementById('twistlabel').textContent.split('·').pop().trim();
    $('rEmoji').textContent = '🟩🟩🟩🟩🟩🟩🟩🟥🟩🟥🟥';
    $('rText').value = 'PULSE 7 rounds · Score 412\n🟩🟩🟩🟩🟩🟩🟩🟥\n🟩🟥🟥';
    $('result').hidden = false; window.scrollTo(0, $('result').getBoundingClientRect().top + scrollY - 24);
  });
}
async function openStats(p) { await p.click('#statsOpen'); }
async function showTwists(p) { await p.evaluate(() => document.querySelector('.twists').closest('section').scrollIntoView()); }

// The caption pages are blank pages that can't load local files, so the fonts are inlined.
const fonts = readFileSync(path.join(app, 'www/fonts/fonts.css'), 'utf8').replace(/url\(([^)]+\.woff2)\)/g,
  (_, f) => `url(data:font/woff2;base64,${readFileSync(path.join(app, 'www/fonts', f)).toString('base64')})`);

(async () => {
  const browser = await chromium.launch();
  for (const set of SETS) {
    mkdirSync(path.join(out, set.name), { recursive: true });
    const capH = Math.round(set.h * 0.78), capW = set.w - 32;
    for (const sc of SCENES) {
      // 1. Capture the app screen.
      const ctx = await browser.newContext({ viewport: { width: capW, height: capH }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const p = await ctx.newPage();
      await p.goto(page0); await p.evaluate(seedStats); await p.reload();
      await p.evaluate(() => document.fonts.ready);
      await sc.setup(p); await p.waitForTimeout(400);
      const shot = (await p.screenshot()).toString('base64');
      await ctx.close();
      // 2. Frame it under a caption.
      const fctx = await browser.newContext({ viewport: { width: set.w, height: set.h }, deviceScaleFactor: 3 });
      const f = await fctx.newPage();
      await f.setContent(`<style>${fonts}
        html,body{margin:0;height:100%}
        body{background:radial-gradient(120% 60% at 50% 0%,#2A2C57,#0E0F24 70%);color:#F2F1FF;display:flex;flex-direction:column;align-items:center;overflow:hidden}
        h1{font:800 ${set.w / 15}px Unbounded,sans-serif;margin:${set.h * 0.05}px 20px 6px;text-align:center;letter-spacing:-.01em}
        p{font:500 ${set.w / 26}px Manrope,sans-serif;color:#9A9CC8;margin:0 24px;text-align:center}
        img{margin-top:auto;width:${capW}px;border-radius:28px 28px 0 0;border:1px solid #2A2C57;border-bottom:0;display:block}
      </style><h1>${sc.title}</h1><p>${sc.sub}</p><img src="data:image/png;base64,${shot}">`, { waitUntil: 'load' });
      await f.evaluate(() => document.fonts.ready);
      await f.screenshot({ path: path.join(out, set.name, sc.file + '.png') });
      await fctx.close();
    }
  }
  // Google Play feature graphic, 1024×500.
  const g = await browser.newContext({ viewport: { width: 1024, height: 500 } });
  const gp = await g.newPage();
  const icon = readFileSync(path.join(app, 'assets/icon-only.png')).toString('base64');
  await gp.setContent(`<style>${fonts}body{margin:0;width:1024px;height:500px;background:#0E0F24;display:flex;align-items:center;gap:56px;padding:0 80px;box-sizing:border-box;color:#F2F1FF}
    img{width:300px;height:300px;border-radius:66px}h1{font:800 64px Unbounded,sans-serif;margin:0;letter-spacing:.12em}p{font:500 28px Manrope,sans-serif;color:#9A9CC8;margin:10px 0 0}</style>
    <img src="data:image/png;base64,${icon}"><div><h1>PULSE</h1><p>One pattern. Everyone.<br>Every day.</p></div>`, { waitUntil: 'load' });
  await gp.evaluate(() => document.fonts.ready);
  await gp.screenshot({ path: path.join(out, 'android', 'feature-graphic.png') });
  await browser.close();
  console.log('Screenshots written to app/store/screenshots');
})();
