const assert = require('node:assert/strict');
const test = require('node:test');

global.FlytTaskLanguage = require('../task-language.js');
const dayPlan = require('../day-plan.js');

const monday = '2026-08-31';
const tuesday = '2026-09-01';
const dailyMonday = { id: 'daily_monday', cat: 'Kjøkken', name: 'Mandagsoppgave', type: 'daily', kind: 'house', pts: 20, preferredDays: [1] };
const dailyTuesday = { id: 'daily_tuesday', cat: 'Bad', name: 'Tirsdagsoppgave', type: 'daily', kind: 'house', pts: 30, preferredDays: [2] };
const flexible = { id: 'flexible', cat: 'Vask & klær', name: 'Fleksibel oppgave', type: 'flex', kind: 'house', pts: 40 };

function state(overrides = {}) {
  return { completions: [], custom: [flexible], dayPlans: {}, tasks: [dailyMonday, dailyTuesday], ...overrides };
}

test('grunnrytmen lager en plan for riktig ukedag', () => {
  assert.deepEqual(dayPlan.planTasks(state(), monday).map(task => task.id), ['daily_monday']);
  assert.deepEqual(dayPlan.planTasks(state(), tuesday).map(task => task.id), ['daily_tuesday']);
});

test('en enkelt dag kan tilpasses uten å endre fast oppsett', () => {
  const original = state();
  const changed = dayPlan.addToDay(dayPlan.removeFromDay(original, monday, dailyMonday.id), monday, flexible.id);

  assert.deepEqual(dayPlan.planTasks(changed, monday).map(task => task.id), ['flexible']);
  assert.deepEqual(original.tasks, [dailyMonday, dailyTuesday]);
  assert.deepEqual(changed.dayPlans[monday], {
    addedTaskIds: ['flexible'],
    removedTaskIds: ['daily_monday'],
  });
});

test('flytting tar oppgaven ut av dagens plan og inn i morgendagens', () => {
  const withExtra = dayPlan.addToDay(state(), monday, flexible.id);
  const moved = dayPlan.moveToDay(withExtra, monday, tuesday, flexible.id);

  assert.deepEqual(dayPlan.planTasks(moved, monday).map(task => task.id), ['daily_monday']);
  assert.deepEqual(dayPlan.planTasks(moved, tuesday).map(task => task.id), ['daily_tuesday', 'flexible']);
  assert.equal(moved.dayPlans[monday], undefined);
});

test('planfremdrift teller gjøremål, ikke poengverdi', () => {
  const planned = dayPlan.addToDay(state({
    completions: [{ taskId: flexible.id, date: monday, registeredAt: '2026-08-31T09:00:00Z' }],
  }), monday, flexible.id);

  const progress = dayPlan.progress(planned, monday);
  assert.equal(progress.done, 1);
  assert.equal(progress.total, 2);
});

test('nylig brukt er kort, unik og utelater dagens plan', () => {
  const current = state({
    completions: [
      { id: 1, taskId: flexible.id, date: '2026-08-29', registeredAt: '2026-08-29T09:00:00Z' },
      { id: 2, taskId: flexible.id, date: '2026-08-30', registeredAt: '2026-08-30T09:00:00Z' },
      { id: 3, taskId: dailyTuesday.id, date: '2026-08-30', registeredAt: '2026-08-30T10:00:00Z' },
    ],
  });

  assert.deepEqual(dayPlan.recentTasks(current, { excludeIds: [dailyTuesday.id] }).map(task => task.id), [flexible.id]);
});
