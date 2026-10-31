// Builds app/www from the website's public/index.html so the app and the site always share one game.
// Each change must match exactly once; if the website file changes shape, the build stops instead of shipping a broken app.
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('..', import.meta.url));
const www = app + 'www';
let html = readFileSync(app + '../public/index.html', 'utf8');

function replaceOnce(find, replacement, why) {
  const count = html.split(find).length - 1;
  if (count !== 1) throw new Error(`build-www: expected 1 match for ${why}, found ${count}`);
  html = html.replace(find, replacement);
}

replaceOnce('<html lang="en">', '<html lang="en" class="app">', 'the <html> tag');
// Fonts come from the app, not Google, so text looks right offline.
html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '');
replaceOnce(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/.exec(html)?.[0] ?? '<missing Google Fonts link>',
  '<link rel="stylesheet" href="fonts/fonts.css">\n<link rel="stylesheet" href="app.css">',
  'the Google Fonts link');
// PULSE+ is sold through Stripe, which app stores don't allow, so it is always off in the app.
replaceOnce(/var PLUS=\{enabled:(true|false)/.exec(html)?.[0] ?? '<missing PLUS config>', 'var PLUS={enabled:false', 'the PULSE+ switch');
replaceOnce('Free daily game · plays in your browser', 'Free daily memory game', 'the nav note');
// Capacitor and its plugins load as plain scripts (no bundler), then the app-only script, after the game has set up the page.
const VENDOR = ['core/dist/capacitor.js', 'share/dist/plugin.js', 'haptics/dist/plugin.js', 'local-notifications/dist/plugin.js'];
replaceOnce('</body>', VENDOR.map((f) => `<script src="vendor/${f.split('/')[0]}.js"></script>\n`).join('') +
  '<script src="app.js"></script>\n</body>', 'the </body> tag');
if (/https:\/\/fonts\.g/.test(html)) throw new Error('build-www: a Google Fonts reference is left in the page');

rmSync(www, { recursive: true, force: true });
mkdirSync(www);
cpSync(app + 'static', www, { recursive: true });
mkdirSync(www + '/vendor');
for (const f of VENDOR) cpSync(app + 'node_modules/@capacitor/' + f, `${www}/vendor/${f.split('/')[0]}.js`);
writeFileSync(www + '/index.html', html);
console.log('Built app/www from public/index.html');
