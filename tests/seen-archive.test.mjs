import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const seen=readFileSync(new URL('../seen-ui.js',import.meta.url),'utf8');
const core=readFileSync(new URL('../seen-core.js',import.meta.url),'utf8');
const history=readFileSync(new URL('../history-ui.js',import.meta.url),'utf8');
const watchdog=readFileSync(new URL('../app-watchdog.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.match(seen,/const VERSION='20260922-contributions1'/);
assert.match(core,/const VERSION='20260922-contributions1'/);
assert.match(seen,/Se hverandre/);
assert.match(seen,/har bidratt i dag/);
assert.match(seen,/data-seen-ack=/);
assert.match(seen,/Sett ♡/);
assert.match(seen,/Sett ♥/);
assert.match(seen,/max-height:222px/,'more than three contributions scroll inside a compact list');
assert.match(seen,/Noe annet du satte pris på\?/);
assert.match(seen,/Hva satte du pris på\?/);
for(const key of ['nice','flirt','space'])assert.match(seen,new RegExp(`${key}:\\{title:`));
assert.match(seen,/Du trenger ikke prestere noe i dag ❤️/);
assert.match(seen,/Anerkjennelse sendt ❤️/);
assert.doesNotMatch(seen,/page='sent'|renderSent|Sendt til .*Ferdig/,'sending stays on Sett and uses toast');
assert.doesNotMatch(seen,/Lag en kaffe til partneren|En liten fristelse|Ta oppvasken i dag/);
assert.doesNotMatch(seen,/data-seen-quick-send="temptation"|addRecognition\?\.\(.*temptation/);
assert.match(seen,/visibilitychange/,'recipient popup checks when returning from background');
assert.doesNotMatch(seen,/setInterval\(checkRecognitionAlert/,'recipient popup must not poll during active use');
assert.doesNotMatch(seen,/forholdsscore|relasjonspoeng|streak|quiz/i);
assert.match(history,/Personlige nudges/);
assert.match(history,/data-seen-suggestion-add/);
assert.match(history,/data-seen-suggestion-edit/);
assert.match(history,/data-seen-suggestion-delete/);
assert.match(history,/seenPersonalCategory/,'personal nudges can choose a category');
assert.match(watchdog,/seen-core\.js\?v=20260922-contributions1/);
assert.match(watchdog,/seen-ui\.js\?v=20260922-contributions1/);
assert.doesNotMatch(html,/<button data-view="us"/,'Oss is removed from the main navigation');
assert.match(html,/grid-template-columns:repeat\(4,1fr\)/,'the bottom navigation has four equal destinations');

console.log('ok - Sett centers actual contributions and lightweight recognition');
