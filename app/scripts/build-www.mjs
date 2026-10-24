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
  '<link rel="stylesheet" href="fonts/fonts.css">\n<link rel="stylesheet" href="app.css">\n<script src="app.js"></script>',
  'the Google Fonts link');
// PULSE+ is sold through Stripe, which app stores don't allow, so it is always off in the app.
replaceOnce(/var PLUS=\{enabled:(true|false)/.exec(html)?.[0] ?? '<missing PLUS config>', 'var PLUS={enabled:false', 'the PULSE+ switch');
replaceOnce('Free daily game · plays in your browser', 'Free daily memory game', 'the nav note');
if (/https:\/\/fonts\.g/.test(html)) throw new Error('build-www: a Google Fonts reference is left in the page');

rmSync(www, { recursive: true, force: true });
mkdirSync(www);
cpSync(app + 'static', www, { recursive: true });
writeFileSync(www + '/index.html', html);
console.log('Built app/www from public/index.html');
