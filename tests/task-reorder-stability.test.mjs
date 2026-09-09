import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../task-reorder-stability.js', import.meta.url), 'utf8');
const window = {};
const context = vm.createContext({
  window,
  setTimeout() {},
  clearTimeout() {},
  setInterval() { return 1; },
  clearInterval() {},
  requestAnimationFrame() { return 1; },
  cancelAnimationFrame() {},
  queueMicrotask() {},
});
vm.runInContext(source, context);
const api = window.FlytTaskReorderStability;

assert.ok(api, 'stability API must be exported');
assert.equal(api.VERSION, '20260909-beta1');

const task = (id, cat='Kjøkken') => ({ id, cat });
const state = {
  tasks: [task('a'), task('b'), task('c'), task('d'), task('x', 'Bad')],
  taskOrder: { Kjøkken: ['a', 'b', 'c', 'd'], Bad: ['x'] },
};

assert.deepEqual(
  Array.from(api.mergeVisibleOrder(state, 'Kjøkken', ['c', 'a'])),
  ['c', 'b', 'a', 'd'],
  'reordering a visible subset must preserve hidden task slots',
);
assert.deepEqual(
  Array.from(api.mergeVisibleOrder(state, 'Kjøkken', ['d', 'c', 'b', 'a'])),
  ['d', 'c', 'b', 'a'],
  'reordering the whole category must persist the exact chosen order',
);
assert.deepEqual(
  Array.from(api.mergeVisibleOrder(state, 'Kjøkken', ['a', 'c'])),
  ['a', 'b', 'c', 'd'],
  'an unchanged visible order must leave the category unchanged',
);
assert.deepEqual(
  Array.from(api.orderedCategoryIds({ ...state, taskOrder: { Kjøkken: ['c', 'ghost', 'a'] } }, 'Kjøkken')),
  ['c', 'a', 'b', 'd'],
  'stale stored ids must not leak into the active order',
);
assert.equal(api.category({ id: 'laundry_fold', cat: 'Vask & klær' }), 'Klesvask');
assert.equal(api.category({ id: 'trash', cat: 'Hus' }), 'Kjøkken');

assert.match(source, /visualViewport/, 'popup positioning should use the iPhone visual viewport when available');
assert.match(source, /flytTaskSortAnchor/, 'drag completion should use a stable visual scroll anchor');
assert.match(source, /requestNativeSortDone/, 'sort mode should have a forced exit path');
assert.match(source, /requestAnimationFrame/, 'pointer work should be frame-coalesced');
assert.match(source, /will-change:auto!important/, 'inactive task cards must not keep permanent compositor hints');

console.log('ok - task reorder stability preserves global order and mobile safeguards');
