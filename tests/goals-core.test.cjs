const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../rewards-goals-core.js');

const NOW=Date.parse('2026-09-03T12:00:00Z');
function base(user='Tore'){
  return{
    user,
    status:{Tore:{},Jannicke:{}},
    goals:[],
    points:{Tore:80,Jannicke:45},
    rewardPurchases:[],
    rewardOffers:[],
    tasks:[
      {id:'bedkids',name:'Kveldsstell og legging',kind:'house',type:'daily',freq:7,pts:15,preferredDays:[1,2,3,4,5,6,7]},
      {id:'kitchen',name:'Rydde kjøkkenet',kind:'house',type:'flex',freq:3,pts:10}
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

test('måloppnåelse gjør belønningen tilgjengelig uten å trekke poeng',()=>{
  let state=core.createGoal(base(),{kind:'personal',metric:{type:'manual'},reward:{title:'En kveld helt fri',type:'self',cost:60}},NOW);
  const id=state.goals[0].id;
  const before=state.points.Tore;
  state=core.markManualDone(state,id,'Tore',NOW+1);
  assert.equal(state.goals[0].status,'reached');
  assert.equal(state.goals[0].reward.status,'available');
  assert.equal(state.points.Tore,before);
  const redeemed=core.redeemGoalReward(state,id,'Tore',NOW+2);
  assert.equal(redeemed.ok,true);
  state=redeemed.state;
  assert.equal(state.points.Tore,20);
  assert.equal(state.goals[0].reward.status,'redeemed');
  state=core.markPurchaseUsed(state,state.goals[0].reward.purchaseId,'Tore',NOW+3);
  assert.equal(state.goals[0].status,'reached');
  assert.equal(state.goals[0].reward.status,'used');
});

test('utløpt utfordring gir ingen belønning og flyttes til ikke fullført',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',deadline:'2026-09-01T23:59:59Z',metric:{type:'task_count',target:3},reward:{title:'Massasje',type:'challenge'}},Date.parse('2026-08-31T12:00:00Z'));
  state=core.acceptGoal({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',Date.parse('2026-08-31T13:00:00Z'));
  state=core.refreshState(state,NOW);
  assert.equal(state.goals[0].status,'not_completed');
  assert.equal(state.goals[0].reward.status,'active');
  assert.notEqual(state.goals[0].reward.status,'available');
});

test('belønningsbiblioteket er voksent uten vanlig hverdagsomsorg som valuta',()=>{
  assert.deepEqual(Object.keys(core.REWARD_LIBRARY),['Tid og frihet','Opplevelser','Fristelse ❤️']);
  assert.deepEqual(core.REWARD_LIBRARY['Tid og frihet'],['Sovemorgen','Kveld ute med venner','En kveld helt fri','Hobby-/gamingkveld','En halv dag for deg selv','Fri fra hjemmeoppgaver']);
  assert.deepEqual(core.REWARD_LIBRARY.Opplevelser,['Restaurant','Date','Aktivitet på eget valg','Gave','Hotell','Helgetur','Overraskelse']);
  assert.deepEqual(core.REWARD_LIBRARY['Fristelse ❤️'],['Massasje','Sexy undertøy','En intim kveld','30 minutter bare for deg','Du velger ❤️','Ditt intime ønske','En erotisk overraskelse','Eget forslag']);
  const all=Object.values(core.REWARD_LIBRARY).flat();
  assert.ok(!all.includes('Kaffe på senga'));
  assert.ok(!all.includes('Klem'));
});

test('personlig mål bruker poeng som standard',()=>{
  const state=core.createGoal(base(),{kind:'personal'},NOW),goal=state.goals[0];
  assert.equal(goal.metric.type,'points_week');
  assert.equal(goal.metric.target,80);
  assert.equal(goal.title,'Tjen 80 poeng denne uka');
});

test('aksept reserverer ikke poeng og bare nye poeng teller i utfordringen',()=>{
  let state=base();
  state.completions=[
    {id:'old_1',taskId:'kitchen',date:'2026-09-03',by:'Jannicke',kind:'house',taskSnapshot:{pts:40},registeredAt:'2026-09-03T11:00:00Z'},
    {id:'older_day',taskId:'bedkids',date:'2026-09-02',by:'Jannicke',kind:'house',taskSnapshot:{pts:15}}
  ];
  state=core.createGoal(state,{kind:'challenge',targetUser:'Jannicke',metric:{type:'points_new',target:60},reward:{title:'Sovemorgen',cost:60,type:'challenge'}},NOW);
  const goalId=state.goals[0].id,before=structuredClone(state.points);
  state=core.acceptGoal({...state,user:'Jannicke'},goalId,'Jannicke',NOW+1);
  assert.deepEqual(state.points,before);
  assert.equal(core.progress(state,state.goals[0],NOW+2).value,0);
  state={...state,completions:[...state.completions,
    {id:'new_1',taskId:'kitchen',date:'2026-09-03',by:'Jannicke',kind:'house',taskSnapshot:{pts:25},registeredAt:'2026-09-03T12:01:00Z'},
    {id:'new_2',taskId:'bedkids',date:'2026-09-04',by:'Jannicke',kind:'house',taskSnapshot:{pts:35},registeredAt:'2026-09-04T10:00:00Z'}
  ]};
  const p=core.progress(state,state.goals[0],Date.parse('2026-09-04T12:00:00Z'));
  assert.equal(p.value,60);
  assert.equal(p.label,'60 av 60 nye poeng');
  state=core.refreshState(state,Date.parse('2026-09-04T12:00:00Z'));
  assert.equal(state.goals[0].status,'reached');
  assert.equal(state.goals[0].reward.status,'available');
  assert.deepEqual(state.points,before);
});

test('bare mottakeren kan innløse belønningen fra en utfordring',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',metric:{type:'manual'},reward:{title:'Sovemorgen',cost:40,type:'challenge'}},NOW);
  state=core.acceptGoal({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',NOW+1);
  state=core.markManualDone(state,state.goals[0].id,'Jannicke',NOW+2);
  assert.equal(core.redeemGoalReward({...state,user:'Tore'},state.goals[0].id,'Tore',NOW+3).reason,'forbidden');
  assert.equal(core.redeemGoalReward({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',NOW+3).ok,true);
});

test('brukeren kan bruke poeng på en annen belønning og utfordringsbelønningen består',()=>{
  let state=core.createGoal(base(),{kind:'personal',metric:{type:'manual'},reward:{title:'Sovemorgen',cost:60,type:'self'}},NOW);
  state=core.markManualDone(state,state.goals[0].id,'Tore',NOW+1);
  const goalId=state.goals[0].id,result=core.redeemCatalogReward(state,{title:'Massasje',cost:70},'Tore',NOW+2);
  assert.equal(result.ok,true);
  assert.equal(result.state.points.Tore,10);
  assert.equal(result.state.goals[0].id,goalId);
  assert.equal(result.state.goals[0].status,'reached');
  assert.equal(result.state.goals[0].reward.status,'available');
  assert.equal(core.redeemCatalogReward(result.state,{title:'Massasje',cost:70},'Tore',NOW+3).ok,false);
});

test('felles innløsning trekker fra faktisk saldo og kan ikke dobbeltbrukes',()=>{
  let state=core.createGoal(base(),{kind:'shared',metric:{type:'manual'},reward:{title:'Date på ditt valg',cost:100,type:'shared'}},NOW);
  state=core.acceptGoal({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',NOW+1);
  state=core.markManualDone({...state,user:'Tore'},state.goals[0].id,'Tore',NOW+2);
  const result=core.redeemGoalReward(state,state.goals[0].id,'Tore',NOW+3);
  assert.equal(result.ok,true);
  assert.deepEqual(result.purchase.paidBy,{Tore:80,Jannicke:20});
  assert.deepEqual(result.state.points,{Tore:0,Jannicke:25});
  assert.equal(core.redeemGoalReward(result.state,state.goals[0].id,'Tore',NOW+4).ok,false);
});

test('poengoversikt skiller tilgjengelig, ukentlig, historisk og brukt',()=>{
  const state={...base(),points:{Tore:10,Jannicke:45},completions:[
    {taskId:'kitchen',date:'2026-08-20',by:'Tore',taskSnapshot:{pts:20}},
    {taskId:'bedkids',date:'2026-09-02',by:'Tore',taskSnapshot:{pts:15}}
  ],rewardPurchases:[{paidBy:{Tore:25}}],rewardRedemptions:[{claimedBy:'Tore',cost:5}]};
  assert.deepEqual(core.pointSummary(state,'Tore',NOW),{available:10,earnedWeek:15,totalEarned:35,used:30});
});
