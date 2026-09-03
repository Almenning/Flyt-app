const assert=require('node:assert/strict');
const test=require('node:test');
const loop=require('../daily-loop.js');

const seven={id:'daily',name:'Daglig oppgave',cat:'Kjøkken',kind:'house',type:'daily',freq:7,preferredDays:[1,2,3,4,5,6,7],pts:20,owner:'Sam'};
const flex={id:'flex',name:'Ukentlig oppgave',cat:'Bad',kind:'house',type:'flex',freq:3,pts:30,owner:'Begge'};
const base={user:'Alex',tasks:[seven,flex],custom:[],categoryRelevant:{},dayPlans:{},taskClaims:[],points:{Alex:0,Sam:0},completions:[
  {id:1,taskId:'daily',date:'2026-08-24',kind:'house',by:'Sam'},
  {id:2,taskId:'daily',date:'2026-08-25',kind:'house',by:'Alex'},
  {id:3,taskId:'daily',date:'2026-08-26',kind:'house',by:'Sam'},
  {id:4,taskId:'daily',date:'2026-08-26',kind:'house',by:'Alex'},
  {id:5,taskId:'flex',date:'2026-08-24',kind:'house',by:'Alex'}
]};

test('dag og uke har separat fremdrift for samme gjentakende oppgave',()=>{
  const day=loop.dayProgress(base,'2026-08-26'),week=loop.weekProgress(base,'2026-08-26'),dailyRow=week.rows.find(row=>row.task.id==='daily');
  assert.deepEqual({done:day.done,total:day.total,remaining:day.remaining,pct:day.pct},{done:1,total:1,remaining:0,pct:100});
  assert.deepEqual({count:dailyRow.count,goal:dailyRow.goal},{count:3,goal:7});
  assert.deepEqual({done:week.done,total:week.total,pct:week.pct},{done:4,total:10,pct:40});
});

test('dagens mål følger den faktiske dagsplanen og ikke et manuelt tall',()=>{
  const state={...base,completions:[],dayPlans:{'2026-08-26':{removedTaskIds:['daily'],addedTaskIds:['flex']}}};
  const metric=loop.dayProgress(state,'2026-08-26');
  assert.equal(metric.total,1);
  assert.equal(metric.tasks[0].id,'flex');
});

test('overtakelse gjelder dagens forekomst og kan angres uten å endre fast eier',()=>{
  const claimed=loop.claimTask(base,{task:seven,date:'2026-08-26',user:'Alex',now:1000});
  assert.equal(loop.effectiveOwner(claimed,seven,'2026-08-26'),'Alex');
  assert.equal(loop.effectiveOwner(claimed,seven,'2026-08-27'),'Sam');
  assert.equal(seven.owner,'Sam');
  const released=loop.releaseClaim(claimed,{taskId:seven.id,date:'2026-08-26',user:'Alex',now:2000});
  assert.equal(loop.effectiveOwner(released,seven,'2026-08-26'),'Sam');
});

test('én enkel takk lagres på partnerens konkrete fullføring',()=>{
  const thanked=loop.thankCompletion(base,{completionId:3,user:'Alex',now:3000});
  const completion=thanked.completions.find(item=>item.id===3);
  assert.deepEqual(completion.thanks.map(item=>item.by),['Alex']);
  assert.equal(loop.thankCompletion(thanked,{completionId:3,user:'Alex',now:4000}),thanked);
  assert.equal(loop.canThank(base.completions.find(item=>item.id===2),'Alex'),false);
});

test('fullføring oppdaterer fremdrift og saldo i samme state-endring',()=>{
  const empty={...base,completions:[],points:{Alex:0,Sam:0}},result=loop.recordCompletion(empty,{task:seven,date:'2026-08-26',user:'Alex',now:5000});
  assert.equal(result.created,true);
  assert.equal(result.state.points.Alex,20);
  assert.equal(loop.dayProgress(result.state,'2026-08-26').pct,100);
  const duplicate=loop.recordCompletion(result.state,{task:seven,date:'2026-08-26',user:'Alex',now:6000});
  assert.equal(duplicate.created,false);
  assert.equal(duplicate.state.completions.length,1);
});
