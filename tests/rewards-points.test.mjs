import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadScript(file, initialState, { render = true } = {}) {
  let state = structuredClone(initialState);
  let intervalCallback = null;
  const content = { dataset: {}, innerHTML: '' };
  const document = {
    addEventListener() {},
    querySelector(selector) {
      return render && selector === '#content' ? content : null;
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
    FlytModal: { confirm: async () => true },
    FlytRewardsUI: { render() {} },
    addEventListener() {},
  };
  const context = vm.createContext({
    Date,
    Intl,
    MutationObserver: class { observe() {} },
    clearInterval() {},
    document,
    queueMicrotask: (fn) => fn(),
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
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context);
  intervalCallback?.();
  return { content, getState: () => state, window };
}

const baseState = {
  completions: [{ by: 'Tore', date: '2026-09-01', housePts: 70, kind: 'house', taskId: 'bath' }],
  points: { Jannicke: 900, Tore: 420 },
  quickTemptations: [],
  rewardRedemptions: [],
  rewards: [
    { by: 'Jannicke', cost: 250, id: 'paid', requiresPoints: true, title: '20 min massasje' },
    { by: 'Jannicke', cost: 0, id: 'open', requiresPoints: false, title: 'Kaffi på senga' },
  ],
  user: 'Tore',
  view: 'rewards',
};

test('Belønning viser bare egen saldo og forklarer ett poengsystem', () => {
  const harness = loadScript('rewards-ui.js', baseState);

  assert.match(harness.content.innerHTML, /Dine poeng/);
  assert.match(harness.content.innerHTML, /420 poeng/);
  assert.doesNotMatch(harness.content.innerHTML, /900/);
  assert.doesNotMatch(harness.content.innerHTML, /Jannicke · 900/);
  assert.match(harness.content.innerHTML, /Gjøremål gir poeng/);
  assert.match(harness.content.innerHTML, /En åpen belønning krever ingen poeng/);
  assert.doesNotMatch(harness.content.innerHTML, /bytteøkonomi/);
});

test('Poengbelønning trekker saldo uten å endre registrert innsats', async () => {
  const harness = loadScript('rewards-ui.js', baseState);
  const before = structuredClone(harness.getState().completions);

  await harness.window.FlytRewardsUI.activate('paid');

  assert.equal(harness.getState().points.Tore, 170);
  assert.deepEqual(harness.getState().completions, before);
  assert.equal(harness.getState().rewardRedemptions[0].cost, 250);
});

test('Åpen belønning og hurtigfristelse lar poengsaldoen stå urørt', async () => {
  const rewards = loadScript('rewards-ui.js', baseState);
  await rewards.window.FlytRewardsUI.activate('open');
  assert.equal(rewards.getState().points.Tore, 420);

  const temptationState = {
    ...baseState,
    quickTemptations: [{
      acceptedBy: null,
      by: 'Jannicke',
      deadline: '2099-09-01T20:00:00.000Z',
      done: false,
      id: 'quick-1',
      notifyPartner: false,
      reward: 'Massasje',
      seenBy: ['Tore'],
      task: 'Rydd kjøkkenet',
    }],
  };
  const temptation = loadScript('quick-temptation-ui.js', temptationState, { render: false });
  await temptation.window.FlytQuickTemptationUI.acknowledge(temptation.getState().quickTemptations[0], 'accept');
  await temptation.window.FlytQuickTemptationUI.acknowledge(temptation.getState().quickTemptations[0], 'done');

  assert.equal(temptation.getState().points.Tore, 420);
  assert.equal(temptation.getState().quickTemptations[0].done, true);
});
