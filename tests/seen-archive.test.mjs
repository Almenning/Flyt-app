import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const seen=readFileSync(new URL('../seen-ui.js',import.meta.url),'utf8');
const core=readFileSync(new URL('../seen-core.js',import.meta.url),'utf8');
const history=readFileSync(new URL('../history-ui.js',import.meta.url),'utf8');
const watchdog=readFileSync(new URL('../app-watchdog.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.match(seen,/const VERSION='20260906-actions1'/);
assert.match(core,/const VERSION='20260906-actions1'/);
assert.match(seen,/Forslag akkurat nå/);
assert.match(seen,/Hva vil du gjøre\?/);
for(const key of ['nice','flirt','recognition','space'])assert.match(seen,new RegExp(`${key}:\\{title:`));
assert.match(seen,/scroll-snap-type:x mandatory/,'suggestions support horizontal swipe');
assert.match(seen,/slice\(0,3\)/,'suggestion lists are capped at three');
assert.match(seen,/Bytt forslag/);
assert.match(seen,/Skriv selv/);
assert.match(seen,/Egen beskjed <span class="taskmeta">· valgfritt<\/span>/);
assert.match(seen,/\?\.value\.trim\(\)\|\|item\?\.text/,'empty custom text falls back to the visible suggestion');
assert.match(seen,/Lag en kaffe til partneren/);
assert.match(seen,/En liten fristelse/);
assert.match(seen,/Ta oppvasken i dag/);
assert.match(seen,/capacity\(theirs\)==='low'/,'low partner capacity prioritizes room');
assert.match(seen,/if\(rows\.length\)return'recognition'/,'completed partner tasks prioritize recognition');
assert.doesNotMatch(seen,/forholdsscore|relasjonspoeng|streak|quiz/i);
assert.match(history,/Personlige nudges/);
assert.match(history,/data-seen-suggestion-add/);
assert.match(history,/data-seen-suggestion-edit/);
assert.match(history,/data-seen-suggestion-delete/);
assert.match(history,/seenPersonalCategory/,'personal nudges can choose a category');
assert.match(watchdog,/seen-core\.js\?v=20260906-actions1/);
assert.match(watchdog,/seen-ui\.js\?v=20260906-actions1/);
assert.doesNotMatch(html,/<button data-view="us"/,'Oss is removed from the main navigation');
assert.match(html,/grid-template-columns:repeat\(4,1fr\)/,'the bottom navigation has four equal destinations');

console.log('ok - Sett is a warm, context-aware action flow');
