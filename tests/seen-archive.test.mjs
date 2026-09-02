import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const seen = readFileSync(new URL('../seen-ui.js', import.meta.url), 'utf8');
const watchdog = readFileSync(new URL('../app-watchdog.js', import.meta.url), 'utf8');
const alert = readFileSync(new URL('../seen-request-alert-ui.js', import.meta.url), 'utf8');

assert.match(seen, /const VERSION='20260901-1700'/, 'Sett must expose the current communication version');
assert.match(seen, /status-alert-ui\.js\?v=20260902-1200/, 'Sett must retain the grouped non-blocking status alert UI');
assert.match(seen, /const ARCHIVE_MS=90\*DAY_MS/, 'Sett archive must retain details for 90 days');
assert.match(seen, /const CONTRIBUTION_GRACE_MS=DAY_MS/, 'Seen contributions must remain visible for one day');
assert.match(seen, /function requestActive\(request\).*?pending.*?countered.*?accepted/s, 'Only pending, countered or accepted requests may stay active');
assert.match(seen, /function contributionArchived\(/, 'Sett must archive acknowledged manual contributions');
assert.match(seen, /data-archive-toggle/, 'Sett must provide an archive control');
assert.match(seen, /Slett permanent/, 'Creators must have a permanent delete action');
assert.match(seen, /item\.by!==s\.user/, 'Permanent deletion must be limited to the creator');
assert.match(seen, /Ferdige ting ligger her i opptil 90 dager/, 'Archive retention must be explained in the UI');
assert.match(seen, /data-request-accept/, 'Nudge-based chore requests must let the partner accept the task');
assert.match(seen, /data-request-counter/, 'A partner must be able to propose another concrete chore');
assert.match(seen, /data-request-decline/, 'A partner must be able to decline without starting a chat');
assert.match(seen, /data-request-reply/, 'A partner must be able to write a short contextual reply');
assert.match(seen, /function finishRequest\(/, 'Finishing a request must use the linked chore flow');
assert.match(seen, /completionId/, 'A finished linked request must record the chore completion');
assert.match(seen, /Send et lite takk\?/, 'Completed support must offer a voluntary thank-you');
assert.match(seen, /kan ikke forsvinne stille/, 'Answered agreements must not disappear silently');
assert.match(watchdog, /seen-ui\.js\?v=20260901-1700/, 'Watchdog must cache-bust the current Sett UI');
assert.match(watchdog, /seen-request-alert-ui\.js\?v=20260901-1700/, 'Watchdog must cache-bust the current Sett alert UI');
assert.match(alert, /ta oppgaven, foreslå en annen, si at det ikke passer eller svare kort/, 'Alerts must explain the complete practical response loop');

console.log('ok - Sett uses active inbox, archive, creator deletion and 90-day retention');
