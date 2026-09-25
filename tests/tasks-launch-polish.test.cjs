const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const recurrence=fs.readFileSync(path.join(root,'recurrence-ui.js'),'utf8');
const watchdog=fs.readFileSync(path.join(root,'app-watchdog.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(recurrence,/const VERSION='20260925-tasks-polish1'/);
assert.match(recurrence,/class="small taskCompleteButton" data-period-complete/,'Fullfør must remain the visible primary task action');
assert.match(recurrence,/data-task-popup-toggle="who:/,'Hvem gjorde den? must remain a secondary action');
assert.match(recurrence,/data-task-popup-toggle="more:/,'secondary actions must remain in the more menu');
for(const action of ['Jeg tar denne','Flytt til i morgen','Fjern fra i dag','Endre rekkefølge'])assert.match(recurrence,new RegExp(action),'the existing more-menu action must remain available');
assert.match(recurrence,/<span class="taskClaimStatus">/,'a claim must remain visible');
assert.match(recurrence,/<div class="taskmeta">\$\{meta\}\$\{claimStatus\}<\/div>/,'claim status must stay compact with task metadata');
assert.match(recurrence,/Dra for å flytte\./,'sort mode must keep a concise drag instruction');
assert.match(recurrence,/data-task-reorder-done="1">Ferdig/,'sort mode must retain its clear finish action');
assert.match(recurrence,/taskReorderHandle/,'sort mode must retain the drag handle');
assert.match(recurrence,/padding-bottom:max\(46px,env\(safe-area-inset-bottom\)\)/,'task content must leave room above the bottom navigation');
assert.match(watchdog,/recurrence-ui\.js\?v=20260925-tasks-polish1/,'the watchdog must load the polished task UI');
assert.match(index,/recurrence-ui\.js\?v=20260925-tasks-polish1/,'the initial task UI load must use the polished version');

console.log('ok - Gjøre launch polish preserves task actions and mobile hierarchy');
