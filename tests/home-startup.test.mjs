import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../home-ui.js', import.meta.url), 'utf8');
const watchdog = readFileSync(new URL('../app-watchdog.js', import.meta.url), 'utf8');

assert.match(home, /const VERSION='20260902-2200'/, 'Home must expose the current startup version');
assert.match(home, /if\(h<6\)return 'Hei'/, 'Home must not call the hours after midnight morning');
assert.match(home, /dayPlanProgress/, 'Home must use the flexible daily plan');
assert.doesNotMatch(home, /poeng i dag|registreringer/, 'Home must not duplicate Gjøre statistics');
assert.doesNotMatch(home, /<strong>Dagsmålet<\/strong>/, 'Home must not present a point-weighted daily percentage as the daily plan');
assert.match(home, /id="homeNudgeMount"/, 'Home must expose a stable mount for one contextual nudge');
assert.match(home, /data-home-status-card/, 'Home must expose the user’s editable daily status');
assert.match(home, /data-home-couple-status/, 'Home must place both daily statuses in one shared section');
assert.match(home, /data-home-partner-status/, 'Home must make partner status available at the top');
assert.match(home, /<button type="button" class="card hero" data-home-day-plan-open="1"/, 'the daily plan card on Home must be a real button');
assert.match(home, /<span class="tag">Åpne<\/span>/, 'the daily plan action must say Åpne');
assert.match(home, /FlytRecurrenceUI\?\.openToday\?\.\('remaining'\)/, 'opening the daily plan must show unfinished chores for today');
assert.match(home, /\$\{dailyStatusMarkup\(s\)\}<div id="homeNudgeMount"/, 'shared status must appear directly before the contextual nudge');
assert.match(home, /save_my_daily_status/, 'Home must save the compact daily status in one operation');
assert.match(home, /Ikke oppdatert i dag/, 'Home must treat an old partner status as unknown today');
assert.doesNotMatch(home, /Energi <strong>|Stress <strong>/, 'Home must not present overlapping status scales');
assert.match(home, /<h1 class="title">Dere i dag<\/h1>/, 'Home must lead with the shared daily context');
assert.match(home, /if\(!rows\.length\)return''/, 'Home must not add a partner-message card without a current signal');
assert.match(home, /firstSharedWin/, 'Home must use the shared journey state rather than a decorative onboarding card');
assert.match(home, /function claim\(/, 'Home must expose an explicit claim path');
assert.match(home, /DOMContentLoaded[^\n]+claimSoon|claimSoon[^\n]+DOMContentLoaded/, 'Home must claim the home view on startup');
assert.match(home, /window\.addEventListener\('pageshow',claimSoon\)/, 'Home must reclaim after Safari pageshow');

assert.match(watchdog, /function ensureHomeOwnership\(/, 'Watchdog must verify Home ownership');
assert.match(watchdog, /function homeMarkupIsModern\(/, 'Watchdog must verify the actual Home markup, not only a stale owner flag');
assert.match(watchdog, /data-home-destination=\"tasks\"/, 'Watchdog must require the primary Gjøre action from the modern Home UI');
assert.match(watchdog, /Husholdningsmotor\|Ukebanken/, 'Watchdog must reject legacy Home markup');
assert.match(watchdog, /FlytHomeUI\?\.version!=='20260902-2200'/, 'Watchdog must target the current Home version');
assert.match(watchdog, /home-ui\.js\?v=20260902-2200/, 'Watchdog must cache-bust the current Home module');
assert.match(watchdog, /nudge-ui\.js\?v=20260902-2200/, 'Watchdog must load the contextual nudge module');
assert.match(watchdog, /function guardHomeStartup\(\)/, 'Watchdog must retry ownership across startup races');
for (const delay of ['60','180','450','900','1600','3000']) assert.match(watchdog, new RegExp(delay), `Watchdog must include the ${delay} ms recovery checkpoint`);
assert.match(watchdog, /window\.addEventListener\('pageshow',[^\n]+guardHomeStartup/, 'Watchdog must repeat recovery after Safari pageshow');
assert.doesNotMatch(watchdog, /home-ui\.js\?v=20260827-1905/, 'Old Home loader must not remain active');

console.log('ok - modern Home claims startup and watchdog repairs legacy overwrites');
