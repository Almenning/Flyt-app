const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../rewards-goals-core.js');

const NOW=Date.parse('2026-09-03T12:00:00Z');
function base(user='Tore'){
  return{
    user,
    status:{Tore:{},Jannicke:{}},
    goals:[],
    tasks:[
      {id:'bedkids',name:'Kveldsstell og legging',kind:'house',type:'daily',freq:7,preferredDays:[1,2,3,4,5,6,7]},
      {id:'kitchen',name:'Rydde kjøkkenet',kind:'house',type:'flex',freq:3}
    ],
    completions:[]
  };
}

test('personlig mål kan opprettes uten belønning og måles fra Gjøre',()=>{
  let state=core.createGoal(base(),{kind:'personal',metric:{type:'task_count',target:3}},NOW);
  const goal=state.goals[0];
  assert.equal(goal.status,'active');
  assert.equal(goal.owner,'Tore');
  assert.equal(goal.reward.status,'none');
  state={...state,completions:[
    {taskId:'kitchen',date:'2026-09-01',by:'Tore',kind:'house'},
    {taskId:'bedkids',date:'2026-09-02',by:'Tore',kind:'house'}
  ]};
  assert.deepEqual(core.progress(state,goal,NOW),{value:2,target:3,pct:67,label:'2 av 3 gjøremål'});
});

test('partner kan legge belønning til personlig mål uten å endre målet',()=>{
  let state=core.createGoal(base(),{kind:'personal',title:'Mitt eget mål',metric:{type:'manual'}},NOW);
  const id=state.goals[0].id,before=state.goals[0].title;
  state={...state,user:'Jannicke'};
  state=core.addPartnerReward(state,id,{title:'Hemmelig fristelse',secret:true},'Jannicke',NOW+1);
  assert.equal(state.goals[0].title,before);
  assert.equal(state.goals[0].reward.type,'partner_added');
  assert.equal(state.goals[0].reward.status,'active');
});

test('felles mål er ventende til partneren godkjenner og låses',()=>{
  let state=core.createGoal(base(),{kind:'shared',metric:{type:'week_goal'},reward:{title:'Date på ditt valg',type:'shared'}},NOW);
  const id=state.goals[0].id;
  assert.equal(state.goals[0].status,'pending');
  assert.equal(core.acceptGoal(state,id,'Tore',NOW+1),state,'oppretter kan ikke godkjenne alene');
  state=core.acceptGoal({...state,user:'Jannicke'},id,'Jannicke',NOW+2);
  assert.equal(state.goals[0].status,'active');
  assert.ok(state.goals[0].acceptedAt);
  assert.equal(state.goals[0].lockedSnapshot.reward.title,'Date på ditt valg');
});

test('akseptert utfordring kan ikke redigeres direkte, men kan endres ved godkjent forslag',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',metric:{type:'task_specific',taskId:'bedkids',target:3},reward:{title:'Sovemorgen',type:'challenge',secret:true}},NOW);
  const id=state.goals[0].id;
  state=core.acceptGoal({...state,user:'Jannicke'},id,'Jannicke',NOW+1);
  const locked=structuredClone(state.goals[0].lockedSnapshot);
  assert.equal(state.goals[0].status,'active');
  const direct=core.editPendingGoal({...state,user:'Tore'},id,{title:'Byttet mål'},'Tore');
  assert.deepEqual(direct.goals[0].lockedSnapshot,locked);
  assert.notEqual(direct.goals[0].title,'Byttet mål');
  state=core.proposeChange({...state,user:'Tore'},id,{metric:{target:2}},'Tore',NOW+2);
  assert.equal(state.goals[0].metric.target,3);
  state=core.respondToChange({...state,user:'Jannicke'},id,'Jannicke',true,NOW+3);
  assert.equal(state.goals[0].metric.target,2);
  assert.equal(state.goals[0].lockedSnapshot.metric.target,2);
});

test('mottaker kan foreslå endring før aksept',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',metric:{type:'task_count',target:4},reward:{title:'Sovemorgen',type:'challenge'}},NOW);
  const id=state.goals[0].id;
  state=core.editPendingGoal({...state,user:'Jannicke'},id,{metric:{target:3}},'Jannicke');
  assert.equal(state.goals[0].metric.target,4);
  assert.equal(state.goals[0].changeProposal.status,'pending');
  state=core.respondToChange({...state,user:'Tore'},id,'Tore',true,NOW+1);
  assert.equal(state.goals[0].metric.target,3);
  assert.equal(state.goals[0].status,'pending');
});

test('mål og belønning får separate fullføringsstatuser',()=>{
  let state=core.createGoal(base(),{kind:'personal',metric:{type:'manual'},reward:{title:'En kveld helt fri',type:'self'}},NOW);
  const id=state.goals[0].id;
  state=core.markManualDone(state,id,'Tore',NOW+1);
  assert.equal(state.goals[0].status,'reached');
  assert.equal(state.goals[0].reward.status,'unlocked');
  state=core.markRewardUsed(state,id,'Tore',NOW+2);
  assert.equal(state.goals[0].status,'reached');
  assert.equal(state.goals[0].reward.status,'used');
});

test('utløpt utfordring gir ingen belønning og flyttes til ikke fullført',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',deadline:'2026-09-01T23:59:59Z',metric:{type:'task_count',target:3},reward:{title:'Massasje',type:'challenge'}},Date.parse('2026-08-31T12:00:00Z'));
  state=core.acceptGoal({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',Date.parse('2026-08-31T13:00:00Z'));
  state=core.refreshState(state,NOW);
  assert.equal(state.goals[0].status,'not_completed');
  assert.equal(state.goals[0].reward.status,'active');
  assert.notEqual(state.goals[0].reward.status,'unlocked');
});

test('belønningsbiblioteket er voksent uten vanlig hverdagsomsorg som valuta',()=>{
  assert.deepEqual(Object.keys(core.REWARD_LIBRARY),['Tid og frihet','Opplevelser','Fristelse ❤️']);
  const all=Object.values(core.REWARD_LIBRARY).flat();
  assert.ok(all.includes('Sovemorgen'));
  assert.ok(all.includes('Du velger ❤️'));
  assert.ok(!all.includes('Kaffe på senga'));
  assert.ok(!all.includes('Klem'));
});
