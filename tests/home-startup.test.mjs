import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../home-ui.js', import.meta.url), 'utf8');
const watchdog = readFileSync(new URL('../app-watchdog.js', import.meta.url), 'utf8');

assert.match(home, /const VERSION='20260827-2005'/, 'Home must expose the current startup version');
assert.match(home, /function claim\(/, 'Home must expose an explicit claim path');
assert.match(home, /DOMContentLoaded[^\n]+claimSoon|claimSoon[^\n]+DOMContentLoaded/, 'Home must claim the home view on startup');
assert.match(home, /window\.addEventListener\('pageshow',claimSoon\)/, 'Home must reclaim after Safari pageshow');

assert.match(watchdog, /function ensureHomeOwnership\(/, 'Watchdog must verify Home ownership');
assert.match(watchdog, /function homeMarkupIsModern\(/, 'Watchdog must verify the actual Home markup, not only a stale owner flag');
assert.match(watchdog, /data-homeui-mode/, 'Watchdog must require a marker from the modern Home UI');
assert.match(watchdog, /Husholdningsmotor\|Ukebanken/, 'Watchdog must reject legacy Home markup');
assert.match(watchdog, /FlytHomeUI\?\.version!=='20260827-2005'/, 'Watchdog must target the current Home version');
assert.match(watchdog, /home-ui\.js\?v=20260827-2005/, 'Watchdog must cache-bust the current Home module');
assert.match(watchdog, /function guardHomeStartup\(\)/, 'Watchdog must retry ownership across startup races');
for (const delay of ['60','180','450','900','1600','3000']) assert.match(watchdog, new RegExp(delay), `Watchdog must include the ${delay} ms recovery checkpoint`);
assert.match(watchdog, /window\.addEventListener\('pageshow',[^\n]+guardHomeStartup/, 'Watchdog must repeat recovery after Safari pageshow');
assert.doesNotMatch(watchdog, /home-ui\.js\?v=20260827-1905/, 'Old Home loader must not remain active');

console.log('ok - modern Home claims startup and watchdog repairs legacy overwrites');
