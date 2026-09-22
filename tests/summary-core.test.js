'use strict';
const assert=require('node:assert/strict');
global.FlytDayPlan={
  category:task=>task.cat||'Egendefinert',
  resolveTask:(state,id)=>[...(state.tasks||[]),...(state.custom||[])].find(task=>String(task.id)===String(id)),
  planTasks:(state,key)=>{const change=state.dayPlans?.[key]||{},removed=new Set((change.removedTaskIds||[]).map(String)),ids=new Set();return[...(state.tasks||[]).filter(task=>task.type==='daily'),...(change.addedTaskIds||[]).map(id=>global.FlytDayPlan.resolveTask(state,id))].filter(task=>task&&!removed.has(String(task.id))&&!ids.has(String(task.id))&&ids.add(String(task.id)))}
};
const core=require('../summary-core.js');
const state={
  user:'Tore',
  tasks:[{id:'a',name:'Legging',cat:'Barn',type:'daily',kind:'house'},{id:'b',name:'Middag',cat:'Kjøkken',type:'daily',kind:'house'}],
  completions:[
    {id:1,taskId:'a',date:'2026-09-14',by:'Tore',taskSnapshot:{name:'Legging',cat:'Barn',type:'daily',kind:'house'}},
    {id:2,taskId:'b',date:'2026-09-14',by:'Sammen',contributors:['Tore','Jannicke'],taskSnapshot:{name:'Middag',cat:'Kjøkken',type:'daily',kind:'house'}},
    {id:3,taskId:'a',date:'2026-09-15',by:'Jannicke',taskSnapshot:{name:'Legging',cat:'Barn',type:'daily',kind:'house'}},
    {id:4,taskId:'b',date:'2026-09-16',by:'Tore'}
  ],
  dayPlans:{'2026-09-14':{removedTaskIds:['b'],addedTaskIds:[]},'2026-09-15':{addedTaskIds:['b'],removedTaskIds:[]}},
  recognitions:[{date:'2026-09-14'},{date:'2026-09-16'}]
};
assert.deepEqual(core.weekRange('2026-09-17'),{start:'2026-09-14',end:'2026-09-20'});
assert.deepEqual(core.weekRange('2026-09-21'),{start:'2026-09-21',end:'2026-09-27'});
const summary=core.stats(state,'2026-09-14','2026-09-20');
assert.equal(summary.planned,13);
assert.equal(summary.completed,3);
assert.equal(summary.registered,4);
assert.equal(summary.together,1);
assert.equal(summary.moved,1);
assert.equal(summary.recognitions,2);
assert.deepEqual(summary.actors,{Tore:2,Sammen:1,Jannicke:1});
assert.equal(summary.tasks.find(task=>task.id==='a').count,2);
assert.equal(summary.categories.find(category=>category.name==='Barn').count,2);
const patch=core.archivePatch(state,'2026-09-17');
assert.equal(patch.completionSnapshots['1'],undefined);
assert.ok(patch.completionSnapshots['4']);
assert.ok(patch.planSnapshots['2026-09-17']);
assert.ok(patch.planSnapshots['2026-07-23']);
const renamed={...state,tasks:state.tasks.map(task=>task.id==='a'?{...task,name:'Nytt navn',cat:'Annet'}:task),summaryArchive:patch};
const stable=core.stats(renamed,'2026-09-14','2026-09-20');
assert.equal(stable.tasks.find(task=>task.id==='a').name,'Legging');
assert.equal(stable.tasks.find(task=>task.id==='a').cat,'Barn');
const explicit={...state,taskMoves:[{fromDate:'2026-09-14',toDate:'2026-09-15',taskId:'b'}]};
assert.equal(core.stats(explicit,'2026-09-14','2026-09-20').moved,1);
assert.equal(core.weeks(state,6,'2026-09-17').length,6);
console.log('summary-core tests passed');
