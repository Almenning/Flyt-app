import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui=readFileSync(new URL('../couple-invitation-ui.js',import.meta.url),'utf8');
const nudge=readFileSync(new URL('../nudge-ui.js',import.meta.url),'utf8');
const sync=readFileSync(new URL('../sync.js',import.meta.url),'utf8');
const watchdog=readFileSync(new URL('../app-watchdog.js',import.meta.url),'utf8');
const oss=readFileSync(new URL('../oss.js',import.meta.url),'utf8');
const rewards=readFileSync(new URL('../rewards-ui.js',import.meta.url),'utf8');

assert.match(ui,/const VERSION='20260901-1200'/);
for(const answer of ['Gjerne','Litt senere','Foreslå noe annet','Ikke i kveld'])assert.match(ui,new RegExp(answer),`missing invitation answer: ${answer}`);
assert.match(ui,/Aldri poeng, betaling eller plikt/,'invitations must be visibly separate from rewards');
assert.match(ui,/s\.view!==['"]us['"]/,'relationship invitations must live under Oss');
assert.match(ui,/data-view=\"us\"/,'invitation badges must point to Oss');
assert.match(oss,/id=\"ossInvitationMount\"/,'Oss must own the invitation mount');
assert.match(rewards,/Kjæresteinvitasjoner ligger separat under Oss/,'point rewards must explain the separation');
assert.match(ui,/coupleInvitations/,'couple invitations need their own state collection');
assert.doesNotMatch(ui,/rewardRedemptions|requiresPoints|data-reward-activate/,'time-together invitations must not enter the reward economy');
assert.match(nudge,/coupleInvitations:\[invitation/,'relationship nudges must create a dedicated invitation');
assert.doesNotMatch(nudge,/linkedRequestId/,'help requests and invitations must not be transactionally linked');
assert.match(sync,/coupleInvitations:\[\]/,'new households must start with an invitation collection');
assert.match(watchdog,/couple-invitation-ui\.js\?v=20260901-1200/,'watchdog must load the current invitation UI');

console.log('ok - time-together invitations stay separate from chores and points');
