import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const seen=readFileSync(new URL('../seen-ui.js',import.meta.url),'utf8');
const core=readFileSync(new URL('../seen-core.js',import.meta.url),'utf8');
const history=readFileSync(new URL('../history-ui.js',import.meta.url),'utf8');
const watchdog=readFileSync(new URL('../app-watchdog.js',import.meta.url),'utf8');
const alerts=readFileSync(new URL('../seen-request-alert-ui.js',import.meta.url),'utf8');

assert.match(seen,/const VERSION='20260903-visual2'/,'Sett exposes the current recognition UI version');
assert.match(core,/const VERSION='20260903-2330'/,'Sett core exposes the current version');
assert.match(seen,/Se og anerkjenn det partneren din faktisk bidrar med/,'Sett states its recognition purpose');
assert.match(seen,/data-seen-day="-1"/,'past days are available');
assert.match(seen,/seenContributionList\{max-height:.*overflow-y:auto/s,'long contribution lists scroll independently');
assert.match(seen,/Sett \$\{active\?'♥':'♡'\}/,'task recognition has a reversible visual state');
assert.match(seen,/Noe annet du satte pris på\?/,'the two relational actions follow the contribution list');
assert.match(seen,/Hva satte du pris på\?/,'personal recognition has a dedicated writing view');
assert.match(seen,/Jeg satte pris på at du …/,'the writing view has the requested placeholder');
assert.match(seen,/Anerkjennelse sendt ❤️/,'sending gives calm immediate feedback');
assert.match(seen,/Du trenger ikke prestere noe i dag ❤️/,'the room message is available');
assert.match(seen,/Siste anerkjennelse/,'main view shows one latest recognition');
assert.match(seen,/Ingen registrerte bidrag ennå \$\{selectedDate===todayKey\?'i dag':'denne dagen'\}\./,'the requested empty copy is preserved');
assert.match(seen,/seenDateHeading\{font:500 15px/,'the date heading stays subordinate to Sett');
assert.match(seen,/seenActionGrid \.secondary\{min-height:36px/,'secondary actions stay compact');
assert.match(seen,/seenLatest\{padding:9px 10px[^}]*box-shadow:none/,'latest recognition remains light and compact');
assert.match(seen,/Dette har dere sett hos hverandre/,'history has the requested purpose');
assert.match(seen,/Tidligere denne uken/,'history groups acknowledgements by recency');
assert.doesNotMatch(seen,/Trenger svar|Ukebanken|poeng|streak/i,'Sett does not rank, score or act as the old request inbox');
assert.match(history,/data-settings-seen-suggestions/,'personal suggestions are available in settings');
assert.match(history,/data-seen-suggestion-move/,'suggestions can be reordered');
assert.match(history,/data-seen-suggestion-edit/,'suggestions can be edited');
assert.match(history,/data-seen-suggestion-delete/,'suggestions can be deleted');
assert.match(history,/data-seen-suggestion-reset/,'suggestions can be reset');
assert.match(watchdog,/seen-core\.js\?v=20260903-2330/,'watchdog loads the Sett core');
assert.match(watchdog,/seen-ui\.js\?v=20260903-visual2/,'watchdog cache-busts the current Sett UI');
assert.doesNotMatch(alerts,/new Notification/,'Sett does not issue browser push notifications');

console.log('ok - Sett is a focused recognition flow with day navigation and history');
