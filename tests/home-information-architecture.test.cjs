const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function fixedDateClass() {
  const NativeDate = Date;
  const timestamp = NativeDate.parse('2026-09-03T10:00:00.000Z');
  return class FixedDate extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [timestamp])); }
    static now() { return timestamp; }
  };
}

function renderHome() {
  let openedFilter = null;
  let state = {
    completions: [{ by: 'Tore', date: '2026-09-03', kind: 'house', taskId: 'done' }],
    dayPlans: {},
    points: { Tore: 0 },
    setupDone: false,
    status: {},
    tasks: [
      { id: 'done', kind: 'house', name: 'Ferdig', owner: 'Tore', preferredDays: [4], type: 'daily' },
      { id: 'left', kind: 'house', name: 'Gjenstår', owner: 'Partner', preferredDays: [4], type: 'daily' },
    ],
    user: 'Tore',
    view: 'home',
  };
  const listeners = {};
  const content = { dataset: {}, innerHTML: '', scrollTop: 0, style: {} };
  const document = {
    readyState: 'complete',
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    querySelector(selector) { return selector === '#content' ? content : null; },
    querySelectorAll() { return []; },
  };
  const window = {
    addEventListener() {},
    FlytBridge: {
      getState: () => state,
      setState(next) { state = next; },
      toast() {},
    },
    FlytNudgeUI: { augment() {} },
    FlytRecurrenceUI: { openToday(filter) { openedFilter = filter; } },
    FlytSync: { getContext: () => ({ members: [] }), myName: () => 'Tore', queueSave() {} },
  };
  const context = vm.createContext({
    Date: fixedDateClass(),
    document,
    queueMicrotask: fn => fn(),
    requestAnimationFrame: fn => fn(),
    setTimeout: fn => { fn(); return 1; },
    window,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'day-plan.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'daily-loop.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'home-ui.js'), 'utf8'), context);

  return {
    clickDayPlan() {
      const button = { blur() {}, dataset: { homeDestination: 'tasks' } };
      const event = {
        preventDefault() {},
        stopImmediatePropagation() {},
        target: { closest: selector => selector === '[data-home-day-plan-open]' ? button : null },
      };
      for (const handler of listeners.click || []) handler(event);
    },
    content,
    getOpenedFilter: () => openedFilter,
    getState: () => state,
  };
}

test('Hjem viser oss i dag uten å duplisere arbeidsflaten', () => {
  const harness = renderHome();
  const html = harness.content.innerHTML;

  assert.match(html, /data-home-status-card/);
  assert.match(html, /data-home-daily-goal/);
  assert.match(html, /50 %/);
  assert.match(html, /1 av 2 ferdig/);
  assert.match(html, /1 igjen/);
  assert.match(html, />Se dagens gjøremål<\//);
  assert.doesNotMatch(html, /data-home-next|data-home-week|>Neste<|>Denne uka</);
  assert.ok(html.indexOf('data-home-status-card') < html.indexOf('data-home-daily-goal'));
  assert.ok(html.indexOf('data-home-daily-goal') < html.indexOf('homeNudgeMount'));
});

test('Se dagens gjøremål åpner Gjøre Dag med Gjenstår', () => {
  const harness = renderHome();
  harness.clickDayPlan();

  assert.equal(harness.getState().view, 'tasks');
  assert.equal(harness.getOpenedFilter(), 'remaining');
});
