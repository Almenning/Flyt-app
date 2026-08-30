import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const seen = readFileSync(new URL('../seen-ui.js', import.meta.url), 'utf8');
const watchdog = readFileSync(new URL('../app-watchdog.js', import.meta.url), 'utf8');
const alert = readFileSync(new URL('../seen-request-alert-ui.js', import.meta.url), 'utf8');

assert.match(seen, /const VERSION='20260830-1600'/, 'Sett must expose the active/archive version');
assert.match(seen, /const ARCHIVE_MS=90\*DAY_MS/, 'Sett archive must retain details for 90 days');
assert.match(seen, /const CONTRIBUTION_GRACE_MS=DAY_MS/, 'Seen contributions must remain visible for one day');
assert.match(seen, /function requestActive\(r\).*?!r\.done&&!r\.deleted/s, 'Done or withdrawn requests must leave the active inbox');
assert.match(seen, /function contributionArchived\(/, 'Sett must archive acknowledged manual contributions');
assert.match(seen, /data-archive-toggle/, 'Sett must provide an archive control');
assert.match(seen, /Slett permanent/, 'Creators must have a permanent delete action');
assert.match(seen, /item\.by!==s\.user/, 'Permanent deletion must be limited to the creator');
assert.match(seen, /Ferdige ting ligger her i opptil 90 dager/, 'Archive retention must be explained in the UI');
assert.match(seen, /data-request-accept/, 'Nudge-based chore requests must let the partner accept the task');
assert.match(seen, /function finishNudgeRequest\(/, 'Finishing a nudge request must use the linked chore flow');
assert.match(seen, /completionId/, 'A finished linked request must record the chore completion');
assert.match(watchdog, /seen-ui\.js\?v=20260830-1600/, 'Watchdog must cache-bust the current Sett UI');
assert.match(watchdog, /seen-request-alert-ui\.js\?v=20260827-2056/, 'Watchdog must cache-bust the current Sett alert UI');
assert.match(alert, /til den er ordnet eller avsenderen trekker den tilbake/, 'Alerts must reflect the active inbox lifecycle');

console.log('ok - Sett uses active inbox, archive, creator deletion and 90-day retention');
