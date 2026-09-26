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
  const content = {
    clientHeight: 800,
    dataset: {},
    innerHTML: '',
    scrollHeight: 1200,
    scrollTop: 0,
    style: {},
  };
  const document = {
    addEventListener(type, handler) {
      (listeners[type] ||= []).push(handler);
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
  const openMore=()=>harness.click({'[data-task-popup-toggle]':{dataset:{taskPopupToggle:'more:dish_empty'},getBoundingClientRect:()=>({bottom:160,left:20,right:120,top:120})}});

  harness.click({'[data-task-category]':{dataset:{taskCategory:encodeURIComponent('Kjøkken')}}});
  openMore();
  assert.match(harness.content.innerHTML,/data-task-claim="dish_empty"[^>]*>Jeg tar denne/);
  harness.click({'[data-task-claim]':{dataset:{taskClaim:assigned.id}}});
  assert.equal(harness.getState().taskClaims.at(-1).claimedBy,'Person A');
  harness.api.render({resetScroll:false});
  assert.match(harness.content.innerHTML,/Du tar denne/);
  openMore();
  assert.match(harness.content.innerHTML,/data-task-release="dish_empty"[^>]*>Slipp oppgaven/);

  harness.click({'[data-task-release]':{dataset:{taskRelease:assigned.id}}});
  assert.ok(harness.getState().taskClaims.at(-1).revokedAt);
  harness.api.render({resetScroll:false});
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

test('tidligere dag kan etterregistreres på partner eller sammen', () => {
  const makeHarness = () => loadRecurrence({
    completions: [],
    custom: [],
    dayPlans: {},
    points: { 'Person A': 0, 'Person B': 0 },
    status: { 'Person A': {}, 'Person B': {} },
    tasks: [dailyTask],
    user: 'Person A',
    view: 'tasks',
  });
  const openPastWhoMenu = (harness) => {
    harness.click({ '[data-period-day]': { dataset: { periodDay: '2026-08-25' } } });
    harness.click({ '[data-task-category]': { dataset: { taskCategory: encodeURIComponent('Kjøkken') } } });
    assert.match(harness.content.innerHTML, /data-task-popup-toggle="who:dish_empty"[^>]*>Hvem gjorde den\?/);
    harness.click({
      '[data-task-popup-toggle]': {
        dataset: { taskPopupToggle: 'who:dish_empty' },
        getBoundingClientRect: () => ({ bottom: 160, left: 20, right: 120, top: 120 }),
      },
    });
  };

  const partnerHarness = makeHarness();
  openPastWhoMenu(partnerHarness);
  assert.match(partnerHarness.content.innerHTML, /Partner gjorde den/);
  partnerHarness.click({ '[data-task-complete-partner]': { dataset: { taskCompletePartner: dailyTask.id } } });
  assert.equal(partnerHarness.getState().completions[0].date, '2026-08-25');
  assert.equal(partnerHarness.getState().completions[0].by, 'Person B');

  const togetherHarness = makeHarness();
  openPastWhoMenu(togetherHarness);
  togetherHarness.click({ '[data-task-complete-together]': { dataset: { taskCompleteTogether: dailyTask.id } } });
  assert.equal(togetherHarness.getState().completions[0].date, '2026-08-25');
  assert.equal(togetherHarness.getState().completions[0].by, 'Sammen');
  assert.deepEqual(Array.from(togetherHarness.getState().completions[0].contributors), ['Person A', 'Person B']);
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

test('Dag viser maksimalt tre uferdige faste gjøremål som snart bør tas', () => {
  const laundry = { ...dailyTask, id: 'laundry', name: 'Klesvask', type: 'flex', freq: 3, cat: 'Klesvask', showInDueSoon: true };
  const bedding = { ...dailyTask, id: 'bedding', name: 'Bytte sengetøy', type: 'flex', freq: 1, cat: 'Soverom', showInDueSoon: true };
  const vacuum = { ...dailyTask, id: 'vacuum', name: 'Støvsuge', type: 'flex', freq: 2, cat: 'Renhold', showInDueSoon: true };
  const windows = { ...dailyTask, id: 'windows', name: 'Vaske vinduer', type: 'period', freq: 1, cat: 'Renhold', showInDueSoon: true };
  const dust = { ...dailyTask, id: 'dust', name: 'Tørke støv', type: 'flex', freq: 1, cat: 'Renhold', showInDueSoon: true };
  const followedUp = { ...dailyTask, id: 'trash', name: 'Tømme søppel', type: 'flex', freq: 2, cat: 'Kjøkken' };
  const routineKitchen = { ...dailyTask, id: 'kitchen', name: 'Rydde kjøkkenet etter måltid', type: 'flex', freq: 7, cat: 'Kjøkken' };
  const routineMeal = { ...dailyTask, id: 'meal_other', name: 'Lage frokost eller kveldsmat', type: 'flex', freq: 7, cat: 'Kjøkken' };
  const routineLiving = { ...dailyTask, id: 'living', name: 'Rydde stue og oppholdsrom', type: 'flex', freq: 3, cat: 'Stue & fellesområder' };
  const harness = loadRecurrence({
    completions: [
      { taskId: laundry.id, date: '2026-08-24' },
      { taskId: followedUp.id, date: '2026-08-24' },
      { taskId: followedUp.id, date: '2026-08-25' },
    ],
    custom: [],
    dayPlans: {},
    points: { 'Person A': 0 },
    tasks: [laundry, bedding, vacuum, windows, dust, followedUp, routineKitchen, routineMeal, routineLiving],
    user: 'Person A',
    view: 'tasks',
  });

  assert.match(harness.content.innerHTML, /På tide/);
  assert.match(harness.content.innerHTML, /Klesvask/);
  assert.match(harness.content.innerHTML, /1 av 3 denne uka/);
  assert.match(harness.content.innerHTML, /Fullfør/);
  assert.match(harness.content.innerHTML, /aria-label="Flere valg for Klesvask"/);
  assert.doesNotMatch(harness.content.innerHTML, /Tømme søppel/);
  assert.doesNotMatch(harness.content.innerHTML, /Rydde kjøkkenet etter måltid/);
  assert.doesNotMatch(harness.content.innerHTML, /Lage frokost eller kveldsmat/);
  assert.doesNotMatch(harness.content.innerHTML, /Rydde stue og oppholdsrom/);
  assert.equal((harness.content.innerHTML.match(/taskDueSoon /g) || []).length, 3);

  harness.click({ '[data-task-popup-toggle]': { dataset: { taskPopupToggle: 'more:laundry' }, getBoundingClientRect: () => ({ bottom: 160, left: 20, right: 120, top: 120 }) } });
  assert.match(harness.content.innerHTML, /data-due-soon-swap="laundry"[^>]*>Bytt forslag/);
  harness.click({ '[data-due-soon-swap]': { dataset: { dueSoonSwap: laundry.id } } });
  assert.doesNotMatch(harness.content.innerHTML, /Klesvask/);
  assert.match(harness.content.innerHTML, /Bytte sengetøy/);

  harness.click({ '[data-task-due-soon]': { dataset: { taskDueSoon: 'due-soon' } } });
  assert.match(harness.content.innerHTML, /data-task-due-soon="due-soon"[^>]*aria-expanded="false"/);
  assert.doesNotMatch(harness.content.innerHTML, /Støvsuge/);
  harness.click({ '[data-task-due-soon]': { dataset: { taskDueSoon: 'due-soon' } } });
  assert.match(harness.content.innerHTML, /data-task-due-soon="due-soon"[^>]*aria-expanded="true"/);

  harness.click({ '[data-period-complete]': { dataset: { periodComplete: vacuum.id } } });
  harness.click({ '[data-period-complete]': { dataset: { periodComplete: vacuum.id } } });
  assert.equal(harness.getState().completions.filter(item => item.taskId === vacuum.id && item.date === '2026-08-26').length, 1, 'Fullfør fra På tide must use the existing completion record');
  harness.api.render({ resetScroll: false });
  assert.match(harness.content.innerHTML, /Tørke støv/, 'a completed suggestion is replaced with the next eligible task');
});


test('På tide bruker eksplisitt katalogmerking for oppgaver med reell påminnelsesverdi', () => {
  const language = require('../task-language.js');
  const eligible = new Set(language.catalog.filter(task => task.showInDueSoon === true).map(task => String(task.id)));
  for (const id of ['laundry_whole','laundry_start','vacuum','floors','bath_shower','bath_drain','bed','kids_bedding','fridge_clean','oven_clean']) {
    assert.equal(eligible.has(id), true, `${id} skal kunne foreslås under På tide`);
  }
  for (const id of ['kitchen','meal_other','living','dish_fill','dish_empty','dinner','trash','kids_wakeup','kids_pickup','bedkids']) {
    assert.equal(eligible.has(id), false, `${id} skal ikke foreslås under På tide`);
  }
});


test('På tide kan slås av og oppgavevalg kan overstyres for husholdningen', () => {
  const vacuum = { ...dailyTask, id: 'vacuum_pref', name: 'Støvsuge', type: 'flex', freq: 2, cat: 'Renhold', showInDueSoon: true };
  const kitchen = { ...dailyTask, id: 'kitchen_pref', name: 'Rydde kjøkkenet etter måltid', type: 'flex', freq: 7, cat: 'Kjøkken' };
  const enabledHarness = loadRecurrence({
    appPreferences: { household: { dueSoon: { enabled: true, taskOverrides: { vacuum_pref: false, kitchen_pref: true } } } },
    completions: [],
    custom: [],
    dayPlans: {},
    points: { 'Person A': 0 },
    tasks: [vacuum, kitchen],
    user: 'Person A',
    view: 'tasks',
  });
  assert.doesNotMatch(enabledHarness.content.innerHTML, /Støvsuge/);
  assert.match(enabledHarness.content.innerHTML, /Rydde kjøkkenet etter måltid/);

  const disabledHarness = loadRecurrence({
    appPreferences: { household: { dueSoon: { enabled: false, taskOverrides: { kitchen_pref: true } } } },
    completions: [],
    custom: [],
    dayPlans: {},
    points: { 'Person A': 0 },
    tasks: [vacuum, kitchen],
    user: 'Person A',
    view: 'tasks',
  });
  assert.doesNotMatch(disabledHarness.content.innerHTML, /På tide/);
});

test('dra-og-slipp i Gjøre bruker mobilvennlig håndtak, løpende plassering og auto-scroll', () => {
  const source = fs.readFileSync(path.join(root, 'recurrence-ui.js'), 'utf8');
  assert.match(source, /taskReorderHandle:before/);
  assert.match(source, /touch-action:none/);
  assert.match(source, /-webkit-touch-callout:none/);
  assert.match(source, /addEventListener\('contextmenu'/);
  assert.match(source, /animateReflow/);
  assert.match(source, /insertBefore\(drag\.row/);
  assert.match(source, /transition='transform 150ms ease'/);
  assert.match(source, /runAutoScroll/);
  assert.match(source, /updateDropTarget\(drag\.pointer\.x,drag\.pointer\.y\)/);
  assert.match(source, /root\.classList\.add\('isTaskReordering'\)/);
  assert.match(source, /preserveTaskSortScroll\(scrollTop\)/);
  assert.match(source, /function preserveTaskSortScroll\(scrollTop\)/);
  assert.match(source, /content\.scrollTop=Math\.max\(0,Math\.min\(Number\(scrollTop\)\|\|0/);
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
  assert.match(source, /showWhoActions=.*!sorting/);
  assert.match(source, /showTodayActions=showWhoActions&&isTodaySelected\(\)/);
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
