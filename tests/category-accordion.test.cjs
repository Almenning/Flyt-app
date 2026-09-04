const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadAccordion() {
  const window = {};
  const context = vm.createContext({
    encodeURIComponent,
    requestAnimationFrame: fn => fn(),
    setTimeout: fn => { fn(); return 1; },
    window,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'category-accordion.js'), 'utf8'), context);
  return window.FlytCategoryAccordion;
}

function loadSetup() {
  let state = {
    categoryRelevant: {},
    custom: [],
    setupDone: true,
    tasks: [
      { cat: 'Barn', freq: 1, id: 'child', kind: 'house', name: 'Følge barnet', owner: 'Begge', pts: 20, type: 'flex' },
      { cat: 'Dyr', freq: 1, id: 'pet', kind: 'house', name: 'Mate dyret', owner: 'Begge', pts: 10, type: 'flex' },
    ],
  };
  const bodyListeners = {};
  const body = {
    addEventListener(type, handler) { (bodyListeners[type] ||= []).push(handler); },
    innerHTML: '',
    querySelector() { return null; },
    scrollTop: 0,
    style: {},
  };
  const nodes = {
    '#flytSetupV2Back': { addEventListener() {}, style: {}, textContent: '' },
    '#flytSetupV2Body': body,
    '#flytSetupV2Next': { addEventListener() {}, style: {}, textContent: '' },
    '#flytSetupV2Title': { textContent: '' },
  };
  const classes = new Set(['hidden']);
  const rootNode = {
    classList: {
      add: value => classes.add(value),
      contains: value => classes.has(value),
      remove: value => classes.delete(value),
    },
    querySelector: selector => nodes[selector] || null,
    setAttribute() {},
    style: {},
  };
  let rootAdded = false;
  const document = {
    activeElement: { blur() {} },
    body: { appendChild() { rootAdded = true; } },
    createElement: () => rootNode,
    querySelector(selector) {
      if (selector === '#flytSetupV2') return rootAdded ? rootNode : null;
      if (selector === '#flytSetupV2Body') return body;
      return null;
    },
    querySelectorAll: () => [],
    readyState: 'complete',
  };
  const window = {
    FlytBridge: {
      getState: () => state,
      setState: next => { state = next; },
    },
    FlytSync: { getContext: () => ({ members: [] }), isReady: () => true, queueSave() {} },
  };
  const context = vm.createContext({
    Date,
    MutationObserver: class { observe() {} },
    clearInterval() {},
    document,
    encodeURIComponent,
    requestAnimationFrame: fn => fn(),
    setInterval: () => 1,
    setTimeout: fn => { fn(); return 1; },
    structuredClone,
    window,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'category-accordion.js'), 'utf8'), context);
  window.FlytTaskLanguage = { catalog: state.tasks };
  vm.runInContext(fs.readFileSync(path.join(root, 'setup-v2.js'), 'utf8'), context);

  return {
    api: window.FlytSetupV2,
    body,
    async clickCategory(key) {
      const button = { dataset: { v2CategoryToggle: encodeURIComponent(key) } };
      const event = { target: { closest: selector => selector === 'button' ? button : null } };
      for (const handler of bodyListeners.click || []) await handler(event);
    },
    getState: () => state,
  };
}

test('accordion åpner én kategori, bytter og lukker samme kategori', () => {
  const api = loadAccordion();
  let open = null;

  open = api.nextOpen(open, 'Barn');
  assert.equal(open, 'Barn');
  open = api.nextOpen(open, 'Dyr');
  assert.equal(open, 'Dyr');
  open = api.nextOpen(open, 'Dyr');
  assert.equal(open, null);
});

test('lukket kategori skjuler innhold og hele overskriften er en knapp', () => {
  const api = loadAccordion();
  const closed = api.item({ key: 'Barn', label: 'Barn', count: 25, open: false, attribute: 'data-v2-category-toggle', body: '<p>Skjult</p>' });
  const opened = api.item({ key: 'Barn', label: 'Barn', count: 25, open: true, attribute: 'data-v2-category-toggle', body: '<p>Synlig</p>' });

  assert.match(closed, /<button[^>]+class="categoryAccordionHeader"[^>]+aria-expanded="false"/);
  assert.doesNotMatch(closed, /Skjult/);
  assert.match(opened, /aria-expanded="true"/);
  assert.match(opened, /<p>Synlig<\/p>/);
  assert.match(opened, />⌃<\/span>/);
});

test('scrollankring holder den valgte kategorioverskriften på samme sted', () => {
  const api = loadAccordion();
  const container = {
    scrollTop: 150,
    querySelector: () => ({ getBoundingClientRect: () => ({ top: 300 - container.scrollTop }) }),
  };

  api.restore(container, '[data-task-category="Barn"]', 100);
  assert.equal(container.scrollTop, 200);
});

test('raskt kategoribytte bruker bare siste anker og korrigerer scroll én gang', () => {
  const window = {};
  const frames = [];
  const context = vm.createContext({
    encodeURIComponent,
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    window,
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'category-accordion.js'), 'utf8'), context);
  const api = window.FlytCategoryAccordion;
  let scrollTop = 240;
  let writes = 0;
  const tops = { Barn: 80, Dyr: 145 };
  const container = {
    dataset: {},
    style: {},
    get scrollTop() { return scrollTop; },
    set scrollTop(value) { writes++; scrollTop = value; },
    querySelector(selector) {
      const key = selector.includes('Barn') ? 'Barn' : 'Dyr';
      return { getBoundingClientRect: () => ({ top: tops[key] }) };
    },
  };

  api.restore(container, '[data-task-category="Barn"]', 70);
  api.restore(container, '[data-task-category="Dyr"]', 125);
  frames.splice(0).forEach(frame => frame());

  assert.equal(writes, 1);
  assert.equal(scrollTop, 260);
  assert.equal(container.style.overflowAnchor, '');
  assert.equal(container.dataset.flytAccordionAnchor, undefined);
});

test('Oppsett starter lukket, bytter kategori uten å endre valgte oppgaver og kan lukkes', async () => {
  const harness = loadSetup();
  const originalState = structuredClone(harness.getState());
  harness.api.open(1);

  assert.match(harness.body.innerHTML, /data-v2-category-toggle="Barn"[^>]+aria-expanded="false"/);
  assert.match(harness.body.innerHTML, /data-v2-category-toggle="Dyr"[^>]+aria-expanded="false"/);
  assert.doesNotMatch(harness.body.innerHTML, /Følge barnet|Mate dyret/);

  await harness.clickCategory('Barn');
  assert.equal(harness.api.getOpenCategory(), 'Barn');
  assert.match(harness.body.innerHTML, /Følge barnet/);
  assert.doesNotMatch(harness.body.innerHTML, /Mate dyret/);

  await harness.clickCategory('Dyr');
  assert.equal(harness.api.getOpenCategory(), 'Dyr');
  assert.doesNotMatch(harness.body.innerHTML, /Følge barnet/);
  assert.match(harness.body.innerHTML, /Mate dyret/);

  await harness.clickCategory('Dyr');
  assert.equal(harness.api.getOpenCategory(), null);
  assert.doesNotMatch(harness.body.innerHTML, /Følge barnet|Mate dyret/);
  assert.deepEqual(harness.getState(), originalState);
});

test('Oppsett og Gjøre bruker den delte sticky accordion-komponenten', () => {
  const setup = fs.readFileSync(path.join(root, 'setup-v2.js'), 'utf8');
  const tasks = fs.readFileSync(path.join(root, 'recurrence-ui.js'), 'utf8');
  const planned = fs.readFileSync(path.join(root, 'planned-ui.js'), 'utf8');
  const accordion = fs.readFileSync(path.join(root, 'category-accordion.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(setup, /openCategory=null/);
  assert.match(setup, /data-v2-category-toggle/);
  assert.match(setup, /accordion\(\)\?\.nextOpen/);
  assert.doesNotMatch(setup, /data-v2-expand|data-v2-collapse/);
  assert.match(tasks, /openTaskCategory=null/);
  assert.match(tasks, /data-task-category/);
  assert.match(tasks, /data-library-category/);
  assert.match(tasks, /data-add-library-category/);
  assert.match(tasks, /\+ Legg til eget gjøremål/);
  assert.match(tasks, /mainMarkup=groupCards\(main,s,\{planned:mode==='day'\}\)/);
  assert.match(tasks, /mode==='day'\?\[\.\.\.tasks\]\.sort/);
  assert.match(html, /\.categoryAccordionHeader\{position:sticky;top:0/);
  assert.match(html, /\.categoryAccordionHeader\{[^}]*min-height:52px/);
  assert.match(html, /\.content\[data-flyt-owner="recurrence"\]\{padding-top:0\}/);
  assert.match(html, /\.taskViewContent,\.setupV2Content\{padding-top:18px\}/);
  assert.match(tasks, /flytAccordionAnchor='1'/);
  assert.match(planned, /flytAccordionAnchor==='1'/);
  assert.doesNotMatch(accordion, /setTimeout/);
  assert.equal((accordion.match(/requestAnimationFrame/g) || []).length, 1);
  assert.match(html, /@media\(max-width:350px\)[^{]*\{[^}]*\.goalGrid/);
  assert.ok(html.indexOf('category-accordion.js') < html.indexOf('recurrence-ui.js'));
});
