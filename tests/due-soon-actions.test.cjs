const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'recurrence-ui.js'), 'utf8');

test('På tide har samme dagshandlinger som ordinære gjøremål', () => {
  assert.match(source, /canPlanChange=canActToday/);
  assert.match(source, /data-task-help-request/);
  assert.match(source, /data-task-claim/);
  assert.match(source, /data-day-plan-tomorrow/);
  assert.match(source, /data-day-plan-remove/);
  assert.match(source, /data-task-reorder-start/);
  assert.match(source, /data-due-soon-swap/);
});

test('På tide viser Hvem gjorde den og støtter fullføringsvalg', () => {
  assert.match(source, /planned\|\|!!soonStatus/);
  assert.match(source, /data-task-complete-partner/);
  assert.match(source, /data-task-complete-together/);
});

test('På tide-handlinger beholder særlogikk for forslag', () => {
  assert.match(source, /data-due-soon-action="1"/);
  assert.match(source, /er fjernet fra På tide i dag/);
  assert.match(source, /data-task-reorder-all="1"/);
  assert.match(source, /reorderAllTasks\?all:plannedTasks/);
});
