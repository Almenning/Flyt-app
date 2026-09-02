const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const customSource=fs.readFileSync(path.join(root,'custom-categories-ui.js'),'utf8');
const setupSource=fs.readFileSync(path.join(root,'setup-v2.js'),'utf8');
const context=vm.createContext({
  window:{},
  document:{addEventListener(){},querySelector(){return null}},
  MutationObserver:class{observe(){}},
  setInterval:()=>1,
  clearInterval(){},
  setTimeout(){},
  queueMicrotask(){},
  Date,
  Math,
  Promise,
  console
});

vm.runInContext(customSource,context,{filename:'custom-categories-ui.js'});
const custom=context.window.FlytCustomCategories;

assert.equal(custom.pointsForEffort(1),10);
assert.equal(custom.pointsForEffort(3),30);
assert.equal(custom.pointsForEffort(5),50);
assert.equal(custom.pointsForEffort(0),10,'innsatsnivå skal avgrenses nedover');
assert.equal(custom.pointsForEffort(8),50,'innsatsnivå skal avgrenses oppover');

const task=custom.makeTask('Vanne planter','Hage & ute','flex',2,[],4);
assert.equal(task.name,'Vanne planter');
assert.equal(task.cat,'Hage & ute');
assert.equal(task.effortLevel,4);
assert.equal(task.pts,40);
assert.equal(task.freq,2);

assert.match(customSource,/Legg til gjøremål/);
assert.match(customSource,/Innsatsnivå 1–5/);
assert.match(customSource,/Nivået kan endres senere/);
assert.match(customSource,/id="flytCustomCategory"/);
assert.match(setupSource,/data-v2-effort=/);
assert.match(setupSource,/t\.effortLevel=effort;t\.pts=effort\*10/);
assert.match(setupSource,/kan endres på alle oppgaver/);

console.log('ok - oppretting og senere endring av innsatsnivå');
