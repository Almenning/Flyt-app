const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const fixedNow = '2026-08-26T10:00:00.000Z';

function fixedDateClass(iso = fixedNow) {
  const NativeDate = Date;
  const timestamp = NativeDate.parse(iso);
  return class FixedDate extends NativeDate {
    constructor(...args) {
      super(...(args.length ? args : [timestamp]));
    }

    static now() {
      return timestamp;
    }
  };
}

function eventTarget(matches) {
  return {
    closest(selector) {
      return matches[selector] || null;
    },
  };
}

function loadRecurrence(initialState) {
  let state = structuredClone(initialState);
  let intervalCallback = null;
  const listeners = {};
  let hitTest = () => [];
  const content = {
    clientHeight: 800,
    dataset: {},
    innerHTML: '',
    scrollHeight: 1200,
    scrollTop: 0,
    style: {},
  };
  const document = {
    body: { appendChild() {} },
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    elementsFromPoint(x, y) {
      return hitTest(x, y);
    },
    querySelector(selector) {
      return selector === '#content' ? content : null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const window = {
    FlytBridge: {
      getState: () => state,
      setState: (next) => {
        state = next;
      },
      toast() {},
    },
    FlytTasksUI: { openSetup() {}, render() {} },
    addEventListener() {},
  };
  const context = vm.createContext({
    Date: fixedDateClass(),
    Intl,
    MutationObserver: class { observe() {} },
    clearInterval() {},
    document,
    queueMicrotask: (fn) => fn(),
    requestAnimationFrame: (fn) => fn(),
    setInterval: (fn) => {
      intervalCallback = fn;
      return 1;
    },
    setTimeout: (fn) => {
      fn();
      return 1;
    },
    window,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'day-plan.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'daily-loop.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'category-accordion.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'recurrence-ui.js'), 'utf8'), context);
  intervalCallback?.();

  return {
    api: window.FlytRecurrenceUI,
    click(matches) {
      const event = {
        preventDefault() {},
        stopImmediatePropagation() {},
        target: eventTarget(matches),
      };
      for (const handler of listeners.click || []) handler(event);
    },
    content,
    dispatchDocument(type, event) {
      for (const handler of listeners[type] || []) handler(event);
    },
    setElementsAt(fn) {
      hitTest = fn;
    },
    getState: () => state,
  };
}

function loadTasks(initialState) {
  let state = structuredClone(initialState);
  const listeners = {};
  const toasts = [];
  const setup = { classList: { contains: () => true } };
  const document = {
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
    },
    querySelector(selector) {
      return selector === '#setup' ? setup : null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const window = {
    FlytBridge: {
      getState: () => state,
      setState: (next) => {
        state = next;
      },
      toast: (message) => toasts.push(message),
    },
  };
  const context = vm.createContext({
    Date: fixedDateClass(),
    Intl,
    confirm: () => true,
    document,
    prompt: () => null,
    requestAnimationFrame: (fn) => fn(),
    structuredClone,
    window,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'tasks-ui.js'), 'utf8'), context);

  return {
    clickTask(id) {
      const button = { dataset: { taskComplete: id } };
      const matches = { '[data-task-complete]': button };
      const event = {
        preventDefault() {},
        stopImmediatePropagation() {},
        target: eventTarget(matches),
      };
      for (const handler of listeners.click || []) handler(event);
    },
    getState: () => state,
    toasts,
  };
}

const dailyTask = {
  cat: 'Kjøkken',
  freq: 7,
  id: 'dish_empty',
  kind: 'house',
  name: 'Tømme oppvaskmaskin',
  owner: 'Begge',
  pts: 20,
  type: 'daily',
};

test('innganger fra Hjem åpner dagens gjenstående gjøremål', () => {
  const harness = loadRecurrence({
    completions: [],
    custom: [],
    dayPlans: {},
    points: { 'Person A': 0 },
    tasks: [dailyTask],
    user: 'Person A',
    view: 'tasks',
  });
  harness.api.openToday();
  assert.equal(harness.api.getTaskFilter(), 'remaining');
  assert.match(harness.content.innerHTML, /data-task-filter="remaining"[^>]+border:1px solid var\(--accent\)/);
});

test('Dag viser én forekomst, mens Uke teller unike Oslo-datoer', () => {
  const flexTask = { ...dailyTask, freq: 3, id: 'laundry', name: 'Vaske klær', type: 'flex' };
  const monthlyTask = { ...dailyTask, freq: 1, id: 'windows', name: 'Vaske vinduer', type: 'period' };
  const harness = loadRecurrence({
    completions: [
      { by: 'Person A', date: '2026-08-23', taskId: dailyTask.id },
      { by: 'Person A', date: '2026-08-24', taskId: dailyTask.id },
      { by: 'Person B', date: '2026-08-25', taskId: dailyTask.id },
      { by: 'Person A', date: '2026-08-26', taskId: dailyTask.id },
      { by: 'Person A', date: '2026-08-26', taskId: dailyTask.id },
      { by: 'Person A', date: '2026-08-31', taskId: dailyTask.id },
      { by: 'Person A', date: '2026-08-26', taskId: flexTask.id },
      { by: 'Person B', date: '2026-08-26', taskId: flexTask.id },
    ],
    points: { 'Person A': 80 },
    tasks: [dailyTask, flexTask, monthlyTask],
    user: 'Person A',
    view: 'tasks',
  });

  assert.match(harness.content.innerHTML, /1 av 1 ferdig/);
  assert.match(harness.content.innerHTML, /1 av 1 ferdig · 100 %/);
  assert.doesNotMatch(harness.content.innerHTML, /class="progressRing"/, 'Gjøre must use compact progress instead of the large Home donut');
  assert.doesNotMatch(harness.content.innerHTML, /1\/7/);
  assert.doesNotMatch(harness.content.innerHTML, /Fullført · 1 av 1/, 'lukket kategori skjuler oppgaven');
  harness.click({ '[data-task-category]': { dataset: { taskCategory: encodeURIComponent('Kjøkken') } } });
  assert.match(harness.content.innerHTML, /Fullført · 1 av 1/);
  assert.deepEqual(
    { ...harness.api.progress(harness.getState(), dailyTask, 'day') },
    { count: 1, done: true, goal: 1 },
  );

  harness.click({
    '[data-period-mode]': {
      blur() {},
      dataset: { periodMode: 'week' },
    },
  });

  assert.doesNotMatch(harness.content.innerHTML, /3 av 7 denne uka/);
  harness.click({ '[data-task-category]': { dataset: { taskCategory: encodeURIComponent('Kjøkken') } } });
  assert.match(harness.content.innerHTML, /3 av 7 denne uka/);
  assert.match(harness.content.innerHTML, /Du 2 · Person B 1/);
  assert.match(harness.content.innerHTML, /2 av 3 denne uka/);
  assert.doesNotMatch(harness.content.innerHTML, /Vaske vinduer/);
});

test('Gjøre holder bare én kategori åpen og lar den lukkes igjen', () => {
  const petTask = { ...dailyTask, cat: 'Dyr', id: 'feed_pet', name: 'Mate dyret', type: 'flex' };
  const harness = loadRecurrence({
    completions: [],
    custom: [],
    points: { 'Person A': 0 },
    tasks: [dailyTask, petTask],
    user: 'Person A',
    view: 'tasks',
  });
  const originalState = structuredClone(harness.getState());

  harness.click({ '[data-period-mode]': { blur() {}, dataset: { periodMode: 'week' } } });
  assert.match(harness.content.innerHTML, /data-task-category="Kj%C3%B8kken"[^>]+aria-expanded="false"/);
  assert.match(harness.content.innerHTML, /data-task-category="Dyr"[^>]+aria-expanded="false"/);
  assert.doesNotMatch(harness.content.innerHTML, /Tømme oppvaskmaskin/);
  assert.doesNotMatch(harness.content.innerHTML, /Mate dyret/);

  harness.click({ '[data-task-category]': { dataset: { taskCategory: encodeURIComponent('Kjøkken') } } });
  assert.match(harness.content.innerHTML, /Tømme oppvaskmaskin/);
  assert.doesNotMatch(harness.content.innerHTML, /Mate dyret/);

  harness.click({ '[data-task-category]': { dataset: { taskCategory: 'Dyr' } } });
  assert.doesNotMatch(harness.content.innerHTML, /Tømme oppvaskmaskin/);
  assert.match(harness.content.innerHTML, /Mate dyret/);
  assert.match(harness.content.innerHTML, /data-task-category="Dyr"[^>]+aria-expanded="true"/);

  harness.click({ '[data-task-category]': { dataset: { taskCategory: 'Dyr' } } });
  assert.doesNotMatch(harness.content.innerHTML, /Tømme oppvaskmaskin|Mate dyret/);
  assert.deepEqual(harness.getState(), originalState, 'accordion navigation must not change task data');
});

test('Oslo-dato og uke følger lokal midnatt og mandag–søndag', () => {
  const harness = loadRecurrence({ completions: [], tasks: [], user: 'Person A', view: 'tasks' });

  assert.equal(harness.api.dateKey(new Date('2026-03-28T23:30:00.000Z')), '2026-03-29');
  assert.deepEqual(
    { ...harness.api.weekRange(new Date('2026-08-26T10:00:00.000Z')) },
    { end: '2026-08-30', start: '2026-08-24' },
  );
});

test('et nytt trykk på samme dag lager ikke dobbel fullføring eller doble poeng', () => {
  const harness = loadTasks({
    completions: [],
    points: { 'Person A': 0 },
    tasks: [dailyTask],
    user: 'Person A',
    view: 'tasks',
  });

  harness.clickTask(dailyTask.id);
  harness.clickTask(dailyTask.id);

  assert.equal(harness.getState().completions.length, 1);
  assert.equal(harness.getState().points['Person A'], 20);
  assert.match(harness.toasts.at(-1), /allerede fullført i dag/);
});

test('Angre fjerner dagens egne registreringer uten å påvirke ukegrensen', () => {
  const harness = loadRecurrence({
    completions: [
      { by: 'Person A', date: '2026-08-26', taskId: dailyTask.id },
      { by: 'Person A', date: '2026-08-26', taskId: dailyTask.id },
    ],
    points: { 'Person A': 40 },
    tasks: [dailyTask],
    user: 'Person A',
    view: 'tasks',
  });
  const undoButton = {
    dataset: { periodScope: 'day', periodUndo: dailyTask.id },
  };

  harness.click({ '[data-period-undo]': undoButton });
  assert.equal(harness.getState().completions.length, 1);
  assert.equal(harness.getState().points['Person A'], 20);
  assert.equal(harness.api.progress(harness.getState(), dailyTask, 'day').count, 1);

  harness.click({ '[data-period-undo]': undoButton });
  assert.equal(harness.getState().completions.length, 0);
  assert.equal(harness.getState().points['Person A'], 0);
  assert.equal(harness.api.progress(harness.getState(), dailyTask, 'day').count, 0);
});

test('Jeg tar denne flytter dagens ansvar og kan angres', () => {
  const assigned={...dailyTask,owner:'Person B'};
  const harness=loadRecurrence({completions:[],custom:[],dayPlans:{},taskClaims:[],points:{'Person A':0},tasks:[assigned],user:'Person A',view:'tasks'});

  harness.click({'[data-task-category]':{dataset:{taskCategory:encodeURIComponent('Kjøkken')}}});
  assert.match(harness.content.innerHTML,/data-task-claim="dish_empty"[^>]*>Jeg tar denne/);
  harness.click({'[data-task-claim]':{dataset:{taskClaim:assigned.id}}});
  assert.equal(harness.getState().taskClaims.at(-1).claimedBy,'Person A');
  assert.match(harness.content.innerHTML,/Du tok denne/);
  assert.match(harness.content.innerHTML,/Angre overtakelse/);

  harness.click({'[data-task-release]':{dataset:{taskRelease:assigned.id}}});
  assert.ok(harness.getState().taskClaims.at(-1).revokedAt);
  assert.match(harness.content.innerHTML,/Person B/);
});

test('partnerens fullførte oppgave kan få én enkel takk', () => {
  const harness=loadRecurrence({completions:[{id:77,taskId:dailyTask.id,date:'2026-08-26',kind:'house',by:'Person B'}],custom:[],dayPlans:{},taskClaims:[],points:{'Person A':0},tasks:[dailyTask],user:'Person A',view:'tasks'});

  harness.click({'[data-task-category]':{dataset:{taskCategory:encodeURIComponent('Kjøkken')}}});
  assert.match(harness.content.innerHTML,/data-task-thank="77"[^>]*>Takk ❤️/);
  harness.click({'[data-task-thank]':{dataset:{taskThank:'77'}}});
  assert.deepEqual(Array.from(harness.getState().completions[0].thanks,entry=>entry.by),['Person A']);
  assert.match(harness.content.innerHTML,/Takk mottatt ❤️/);
  assert.doesNotMatch(harness.content.innerHTML,/data-task-thank="77"/);
});

test('Andre gjøremål er foldet per kategori og kan legges i eller flyttes fra dagsplanen', () => {
  const flexibleTask = { ...dailyTask, id: 'laundry_fold', name: 'Brette klær', type: 'flex', cat: 'Klesvask', pts: 40 };
  const harness = loadRecurrence({
    completions: [],
    custom: [flexibleTask],
    dayPlans: {},
    points: { 'Person A': 0 },
    tasks: [dailyTask],
    user: 'Person A',
    view: 'tasks',
  });

  assert.match(harness.content.innerHTML, /Andre gjøremål/);
  assert.doesNotMatch(harness.content.innerHTML, /Brette klær/);
  assert.ok(harness.content.innerHTML.indexOf('Andre gjøremål')>harness.content.innerHTML.indexOf('data-task-category="Kj%C3%B8kken"'),'dagens kategorier skal vises før biblioteket');

  harness.click({ '[data-day-plan-open]': {} });
  assert.match(harness.content.innerHTML, /Finn raskt et gjøremål/);
  assert.match(harness.content.innerHTML, /Klesvask/);
  assert.doesNotMatch(harness.content.innerHTML, /Brette klær/);

  harness.click({ '[data-library-category]': { dataset: { libraryCategory: 'Klesvask' } } });
  assert.match(harness.content.innerHTML, /Brette klær/);

  harness.click({ '[data-day-plan-add]': { dataset: { dayPlanAdd: flexibleTask.id } } });
  assert.deepEqual(Array.from(harness.getState().dayPlans['2026-08-26'].addedTaskIds), [flexibleTask.id]);
  assert.doesNotMatch(harness.content.innerHTML, /Brette klær/, 'ny kategori er lukket til brukeren åpner den');
  harness.click({ '[data-task-category]': { dataset: { taskCategory: 'Klesvask' } } });
  assert.match(harness.content.innerHTML, /Brette klær/);

  harness.click({ '[data-day-plan-tomorrow]': { dataset: { dayPlanTomorrow: flexibleTask.id } } });
  assert.deepEqual(Array.from(harness.getState().dayPlans['2026-08-27'].addedTaskIds), [flexibleTask.id]);
  assert.equal(harness.getState().dayPlans['2026-08-26'], undefined);
});

test('lagret rekkefølge brukes for gjøremål i samme kategori', () => {
  const morning = { ...dailyTask, id: 'morning_care', name: 'Morgenstell barn', cat: 'Barn' };
  const bedtime = { ...dailyTask, id: 'bedtime_care', name: 'Legging barn', cat: 'Barn' };
  const harness = loadRecurrence({
    completions: [],
    custom: [],
    dayPlans: {},
    points: { 'Person A': 0 },
    taskOrder: { Barn: ['morning_care', 'bedtime_care'] },
    tasks: [bedtime, morning],
    user: 'Person A',
    view: 'tasks',
  });

  harness.click({ '[data-task-category]': { dataset: { taskCategory: encodeURIComponent('Barn') } } });
  assert.ok(harness.content.innerHTML.indexOf('Morgenstell barn') < harness.content.innerHTML.indexOf('Legging barn'));
  assert.match(harness.content.innerHTML, /data-task-reorder-handle="morning_care"/);
});

test('dra-og-slipp i Gjøre bruker den enkle, aktive splice-motoren', () => {
  const source = fs.readFileSync(path.join(root, 'recurrence-ui.js'), 'utf8');
  assert.match(source, /taskReorderHandle:before/);
  assert.match(source, /touch-action:none/);
  assert.match(source, /-webkit-touch-callout:none/);
  assert.match(source, /function initSimpleTaskReordering/);
  assert.match(source, /initTaskReordering=initSimpleTaskReordering/);
  assert.match(source, /handle\.setPointerCapture/);
  assert.match(source, /root\.addEventListener\('pointerdown',begin/);
  assert.match(source, /root\.addEventListener\('pointermove',move/);
  assert.match(source, /root\.addEventListener\('pointerup',finish/);
  assert.match(source, /drag\.workingOrder\.splice\(from,1\)/);
  assert.match(source, /drag\.workingOrder\.splice\(to,0,drag\.sourceId\)/);
  assert.match(source, /parent\?\.insertBefore\(drag\.row/);
  assert.match(source, /saveWorkingTaskOrder\(current\.category,current\.workingOrder\)/);
  assert.match(source, /flytReorderActive/);
  assert.match(source, /flytSkipScrollRestore/);
  assert.doesNotMatch(source, /initTaskReordering=initStableTaskReordering/);
});

test('workingOrder flytter sikkert én eller flere plasser og til topp eller bunn', () => {
  const harness = loadRecurrence({
    completions: [],
    custom: [],
    dayPlans: {},
    points: { 'Person A': 0 },
    tasks: [],
    user: 'Person A',
    view: 'tasks',
  });
  const reorder = harness.api.reorderIds;
  const ids = ['a', 'b', 'c', 'd'];
  assert.deepEqual(Array.from(reorder(ids, 'b', 2)), ['a', 'c', 'b', 'd']);
  assert.deepEqual(Array.from(reorder(ids, 'c', 1)), ['a', 'c', 'b', 'd']);
  assert.deepEqual(Array.from(reorder(ids, 'd', 0)), ['d', 'a', 'b', 'c']);
  assert.deepEqual(Array.from(reorder(ids, 'a', 3)), ['b', 'c', 'd', 'a']);
});

test('pointer-drag bruker én workingOrder, lagrer den og beholder den etter ny lasting', () => {
  const makeTask = (id) => ({ ...dailyTask, id, name: id, cat: 'Barn' });
  const harness = loadRecurrence({
    completions: [], custom: [], dayPlans: {}, points: { 'Person A': 0 },
    tasks: ['a', 'b', 'c', 'd', 'e'].map(makeTask), user: 'Person A', view: 'tasks',
  });
  const rootListeners = {};
  const classList = () => {
    const values = new Set();
    return {
      add: (...names) => names.forEach((name) => values.add(name)),
      remove: (...names) => names.forEach((name) => values.delete(name)),
      contains: (name) => values.has(name),
    };
  };
  const parent = {
    children: [],
    insertBefore(node, before) {
      const oldIndex = this.children.indexOf(node);
      if (oldIndex >= 0) this.children.splice(oldIndex, 1);
      const nextIndex = before ? this.children.indexOf(before) : this.children.length;
      this.children.splice(nextIndex < 0 ? this.children.length : nextIndex, 0, node);
    },
  };
  const rows = ['a', 'b', 'c', 'd', 'e'].map((id) => {
    const row = {
      classList: classList(),
      dataset: { taskReorderCategory: 'Barn', taskReorderRow: id },
      parentNode: parent,
      getBoundingClientRect() {
        return { height: 70, left: 10, top: 100 + parent.children.indexOf(row) * 80, width: 300 };
      },
      closest(selector) {
        return selector === '[data-task-reorder-row]' ? row : null;
      },
    };
    Object.defineProperty(row, 'nextSibling', {
      get() { return parent.children[parent.children.indexOf(row) + 1] || null; },
    });
    return row;
  });
  parent.children.push(...rows);
  const rootElement = {
    classList: classList(), clientHeight: 600, scrollHeight: 1600, scrollTop: 137, style: {}, dataset: {},
    addEventListener(type, handler) { (rootListeners[type] ||= []).push(handler); },
    getBoundingClientRect: () => ({ bottom: 600, top: 0 }),
    querySelectorAll: () => parent.children,
  };
  const handleFor = (row) => ({
    closest: (selector) => selector === '[data-task-reorder-row]' ? row : null,
    setPointerCapture() {},
  });
  const event = (pointerId, y, row) => ({
    button: 0, clientX: 280, clientY: y, pointerId, pointerType: 'touch',
    preventDefault() {}, stopPropagation() {}, target: { closest: () => handleFor(row) },
  });
  let hit = null;
  harness.setElementsAt(() => hit ? [hit] : []);

  harness.api.bindReorder(rootElement);
  rootListeners.pointerdown[0](event(7, 135, rows[0]));
  hit = rows[1];
  rootListeners.pointermove[0](event(7, 215, rows[0]));
  hit = rows[2];
  rootListeners.pointermove[0](event(7, 295, rows[0]));
  hit = rows[3];
  rootListeners.pointermove[0](event(7, 375, rows[0]));
  rootListeners.pointerup[0](event(7, 375, rows[0]));

  assert.deepEqual(parent.children.map((row) => row.dataset.taskReorderRow), ['b', 'c', 'd', 'a', 'e']);
  assert.deepEqual(Array.from(harness.getState().taskOrder.Barn), ['b', 'c', 'd', 'a', 'e']);

  rootListeners.pointerdown[0](event(8, 375, rows[3]));
  hit = rows[2];
  rootListeners.pointermove[0](event(8, 295, rows[3]));
  rootListeners.pointerup[0](event(8, 295, rows[3]));

  assert.deepEqual(parent.children.map((row) => row.dataset.taskReorderRow), ['b', 'd', 'c', 'a', 'e']);
  assert.deepEqual(Array.from(harness.getState().taskOrder.Barn), ['b', 'd', 'c', 'a', 'e']);
  assert.equal(rootElement.scrollTop, 137);
  for (const periodMode of ['week', 'month', 'day']) {
    harness.click({ '[data-period-mode]': { dataset: { periodMode }, blur() {} } });
    assert.deepEqual(Array.from(harness.getState().taskOrder.Barn), ['b', 'd', 'c', 'a', 'e']);
  }
  assert.deepEqual(Array.from(loadRecurrence(harness.getState()).getState().taskOrder.Barn), ['b', 'd', 'c', 'a', 'e']);
});

test('Gjøre eies av recurrence-rendereren etter state-endring og synk', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const watchdog = fs.readFileSync(path.join(root, 'app-watchdog.js'), 'utf8');
  const sync = fs.readFileSync(path.join(root, 'sync.js'), 'utf8');
  assert.match(index, /state\.view==='tasks'&&window\.FlytRecurrenceUI\?\.render/);
  assert.match(watchdog, /content\?\.dataset\.flytOwner!=='recurrence'/);
  assert.match(watchdog, /window\.FlytRecurrenceUI\?\.render/);
  assert.match(sync, /view==='tasks'&&window\.FlytRecurrenceUI\?\.render/);
});

test('sortering åpnes per kategori og skjuler drag-håndtaket i normalvisning', () => {
  const source = fs.readFileSync(path.join(root, 'recurrence-ui.js'), 'utf8');
  assert.match(source, /Endre rekkefølge/);
  assert.match(source, /data-task-reorder-start/);
  assert.match(source, /data-task-reorder-done/);
  assert.match(source, /Sortering er ferdig/);
  assert.match(source, /\.taskReorderHandle\{display:none!important\}/);
  assert.match(source, /\.content\.isTaskSortMode \.taskReorderHandle\{display:grid!important\}/);
  assert.match(source, /isTaskSortMode \[data-task-reorder-row\]>.row:nth-child\(2\)/);
  assert.match(source, /taskSortMode/);
  assert.match(source, /showTaskActions=.*!sorting/);
  assert.match(source, /data-task-reorder-start="\$\{encodeURIComponent\(category\(t\)\)\}"/);
  assert.match(source.match(/function groupCards[\s\S]*?function dayCards/)?.[0] || '', /headerAction=sorting/);
  assert.match(source.match(/function groupCards[\s\S]*?function dayCards/)?.[0] || '', /taskSortHeaderAction isSorting/);
  assert.match(source, /function sortableCategoryTasks\(s,key\)/);
  assert.match(source, /mode==='day'\)return plannedTasks\(s,selectedDay\)/);
  assert.match(source, /installReorderMenus\(root\)/);
  assert.match(source, /mode==='week'/);
  assert.match(source, /t\.type==='period'/);
});

test('oppgavekort har separate kompakte menyer for utfører og dagsplan', () => {
  const source = fs.readFileSync(path.join(root, 'recurrence-ui.js'), 'utf8');
  assert.match(source, /Hvem gjorde den\?/);
  assert.match(source, /Partner gjorde den/);
  assert.match(source, /Vi gjorde den sammen/);
  assert.match(source, /Flytt til i morgen/);
  assert.match(source, /Fjern fra i dag/);
  assert.match(source, /data-task-popup-toggle/);
  assert.match(source, /taskActionPopup/);
  assert.match(source, /data-task-reorder-handle/);
  assert.match(source, /taskPopupOpen/);
  assert.match(source, /\.categoryAccordion,.categoryAccordionBody,.card\[data-task-reorder-row\]\{overflow:visible\}/);
  assert.match(source, /max-width:calc\(100vw - 44px\)/);
  assert.match(source, /popupPosition\(trigger,type\)/);
  assert.match(source, /data-popup-placement/);
  assert.match(source, /\[data-popup-placement="below"\]/);
  assert.match(source, /\[data-popup-placement="above"\]/);
});

test('oppsettet beskriver daily-frekvens som dager per uke og begrenser til syv', () => {
  const setup = fs.readFileSync(path.join(root, 'setup-v2.js'), 'utf8');
  const custom = fs.readFileSync(path.join(root, 'custom-categories-ui.js'), 'utf8');

  assert.match(setup, /Dager per uke/);
  assert.match(setup, /type==='daily'\?7:31/);
  assert.match(custom, /Dager per uke/);
  assert.match(custom, /freq\.max=daily\?'7':'31'/);
});
