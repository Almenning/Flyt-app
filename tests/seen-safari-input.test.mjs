import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const seen=readFileSync(new URL('../seen-ui.js',import.meta.url),'utf8');
const lock=readFileSync(new URL('../modal-scroll-lock.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const serviceWorker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

assert.match(seen,/\.seenTextarea\{[^}]*font-family:inherit;font-size:16px;line-height:1\.45;font-weight:400/,'Sett-felt må ha eksplisitt 16px iOS-typografi');
assert.doesNotMatch(seen,/font:16px\/1\.45 inherit/,'den usikre font-shorthanden må ikke brukes i Sett');
assert.match(seen,/function blurSheetInput\(\)/,'aktivt felt må blurres før sheeten fjernes');
assert.match(seen,/function closeSheet\(\)\{blurSheetInput\(\);sheet=null/,'X og bakgrunnstrykk må blurre før lukking');
assert.match(seen,/function sendMessage\([^\n]+blurSheetInput\(\);sheet=null/,'sending må blurre før sheeten fjernes');
assert.match(seen,/data-seen-task-message-save[^\n]+blurSheetInput\(\);sheet=null/,'meldinger på konkrete bidrag må følge samme lukking');
assert.match(seen,/window\.visualViewport\?\.addEventListener\('resize',sync\)/,'keyboard-endringer må følge visualViewport');
assert.match(seen,/--seen-viewport-height/,'sheeten må begrenses av faktisk visuell viewport');
assert.match(seen,/overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y/,'sheeten må kunne scrolle internt mens bakgrunnen er låst');
assert.match(seen,/\.seenTextarea:focus,.seenTextarea:focus-visible\{border-color:#dfd0c8;outline:0;box-shadow:0 0 0 2px #d67a5a80\}/,'feltet skal ha én kontrollert focus-ring');
assert.match(lock,/\.seenSheet\{touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important\}/,'felles modal-lås må la Sett-sheeten scrolles');
assert.match(index,/seen-ui\.js\?v=20260926-seen-premium1/);
assert.match(index,/modal-scroll-lock\.js\?v=20260925-accessibility1/);
assert.match(index,/app-watchdog\.js\?v=20260926-scroll-stability1/);
assert.match(serviceWorker,/const CACHE='flyt-v82'/);

console.log('ok - Sett tekstfelt håndterer iPhone-tastatur og fokus uten zoom/låsing');
