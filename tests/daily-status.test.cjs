const assert=require('node:assert/strict');
const daily=require('../daily-status.js');

const now=new Date('2026-09-02T12:00:00+02:00');
const today={capacity:'low',needs:['relief'],daily_updated_at:'2026-09-02T08:00:00+02:00',updated_at:'2026-09-02T08:00:00+02:00'};

assert.equal(daily.isFresh(today,{now:now.getTime()}),true,'today’s daily check-in must be current');
assert.equal(daily.capacityLabel('low'),'Lite å gå på');
assert.equal(daily.capacityLabel('med'),'Som vanlig');
assert.equal(daily.capacityLabel('high'),'Godt med overskudd');
assert.deepEqual(daily.cleanNeeds(['relief','relief','invalid','quiet']),['relief','quiet']);

const yesterday={...today,daily_updated_at:'2026-09-01T23:50:00+02:00'};
assert.equal(daily.isFresh(yesterday,{now:now.getTime()}),false,'yesterday’s daily check-in must never be shown as current');

const relationshipOnly={...today,daily_updated_at:'2026-09-01T08:00:00+02:00',relationship_updated_at:'2026-09-02T10:00:00+02:00',updated_at:'2026-09-02T10:00:00+02:00'};
assert.equal(daily.isFresh(relationshipOnly,{kind:'daily',now:now.getTime()}),false,'relationship updates must not refresh daily capacity');
assert.equal(daily.isFresh(relationshipOnly,{kind:'relationship',now:now.getTime()}),true,'relationship status must keep its own freshness');

console.log('ok - daily status freshness, labels and needs');
