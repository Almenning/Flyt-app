const assert=require('node:assert/strict');
const fs=require('node:fs');
const index=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
const modal=fs.readFileSync(require('node:path').join(__dirname,'..','modal-scroll-lock.js'),'utf8');
const recurrence=fs.readFileSync(require('node:path').join(__dirname,'..','recurrence-ui.js'),'utf8');

assert.match(index,/role="status" aria-live="polite" aria-atomic="true"/,'the global toast must announce status changes');
assert.match(index,/<nav id="nav" class="nav" aria-label="Hovednavigasjon">/,'the primary navigation needs an accessible name');
assert.match(index,/button:focus-visible/,'keyboard focus must remain visibly apparent');
assert.match(modal,/function trapFocus/,'modal focus must be trapped');
assert.match(modal,/function muteBackground/,'modal background must be made inert');
assert.match(modal,/setAttribute\('inert',''\)/,'background must not remain keyboard-accessible');
assert.match(modal,/focusOrigins/,'focus must be returned after closing a dialog');
assert.match(modal,/aria-pressed/,'selected controls must expose a non-colour state to assistive technology');
assert.match(recurrence,/data-task-reorder-move="up"/,'sorting must offer moving an item up without drag and drop');
assert.match(recurrence,/data-task-reorder-move="down"/,'sorting must offer moving an item down without drag and drop');

console.log('ok - central accessibility safeguards are present');
