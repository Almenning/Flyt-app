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
  state=core.markRewardUsed(state,id,'Tore',NOW+2);
  assert.equal(state.points.Tore,before);
  assert.equal(state.goals[0].status,'reached');
  assert.equal(state.goals[0].reward.status,'used');
  assert.equal(state.rewardPurchases.length,0);
});

test('utløpt utfordring gir ingen belønning og flyttes til ikke fullført',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',deadline:'2026-09-01T23:59:59Z',metric:{type:'task_count',target:3},reward:{title:'Massasje',type:'challenge'}},Date.parse('2026-08-31T12:00:00Z'));
  state=core.acceptGoal({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',Date.parse('2026-08-31T13:00:00Z'));
  state=core.refreshState(state,NOW);
  assert.equal(state.goals[0].status,'not_completed');
  assert.equal(state.goals[0].reward.status,'expired');
  assert.notEqual(state.goals[0].reward.status,'available');
});

test('belønningsbiblioteket er voksent uten vanlig hverdagsomsorg som valuta',()=>{
  assert.deepEqual(Object.keys(core.REWARD_LIBRARY),['Tid og frihet','Opplevelser','Fristelse ❤️']);
  assert.deepEqual(core.REWARD_LIBRARY['Tid og frihet'],['Sovemorgen','Egentid','Kveld ute med venner','Hobby-/gamingtid','Fri fra hjemmeoppgaver']);
  assert.deepEqual(core.REWARD_LIBRARY.Opplevelser,['Takeaway','Datekveld','Restaurant','Aktivitet på eget valg','Hotell / helgetur']);
  assert.deepEqual(core.REWARD_LIBRARY['Fristelse ❤️'],['Massasje','Sexy undertøy','En intim kveld','30 minutter bare for deg','Du velger ❤️']);
  const all=Object.values(core.REWARD_LIBRARY).flat();
  assert.ok(!all.includes('Kaffe på senga'));
  assert.ok(!all.includes('Klem'));
});

test('personlig mål bruker nye poeng fra målstart som standard',()=>{
  const state=core.createGoal(base(),{kind:'personal'},NOW),goal=state.goals[0];
  assert.equal(goal.metric.type,'points_new');
  assert.equal(goal.metric.target,80);
  assert.equal(goal.title,'Tjen 80 nye poeng');
  assert.equal(goal.trackingStartedAt,new Date(NOW).toISOString());
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

test('bare mottakeren kan markere belønningen fra en utfordring som brukt',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',metric:{type:'manual'},reward:{title:'Sovemorgen',cost:40,type:'challenge'}},NOW);
  state=core.acceptGoal({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',NOW+1);
  state=core.markManualDone(state,state.goals[0].id,'Jannicke',NOW+2);
  const rejected=core.markRewardUsed({...state,user:'Tore'},state.goals[0].id,'Tore',NOW+3);
  assert.equal(rejected.goals[0].reward.status,'available');
  const used=core.markRewardUsed({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',NOW+3);
  assert.equal(used.goals[0].reward.status,'used');
  assert.deepEqual(used.points,state.points);
});

test('nye katalogkjøp er slått av og historiske belønninger består',()=>{
  let state=core.createGoal(base(),{kind:'personal',metric:{type:'manual'},reward:{title:'Egentid',cost:60,type:'self'}},NOW);
  state=core.markManualDone(state,state.goals[0].id,'Tore',NOW+1);
  const goalId=state.goals[0].id,result=core.redeemCatalogReward(state,{title:'En egen bok',cost:70},'Tore',NOW+2);
  assert.equal(result.ok,false);
  assert.equal(result.reason,'unavailable');
  assert.equal(result.state.points.Tore,80);
  assert.equal(result.state.goals[0].id,goalId);
  assert.equal(result.state.goals[0].status,'reached');
  assert.equal(result.state.goals[0].reward.status,'available');
});

test('partneravhengig biblioteksbelønning blir tilgjengelig etter avtale uten poengtrekk',()=>{
  let state=base();
  state=core.requestRewardOffer(state,{title:'Massasje',cost:70,category:'Fristelse ❤️'},'Tore',NOW+1);
  assert.equal(state.rewardOffers[0].status,'pending');
  assert.deepEqual(state.points,{Tore:80,Jannicke:45});
  state=core.respondToRewardOffer({...state,user:'Jannicke'},state.rewardOffers[0].id,'Jannicke',true,NOW+2);
  assert.equal(state.rewardOffers[0].status,'available');
  state=core.markRewardOfferUsed({...state,user:'Tore'},state.rewardOffers[0].id,'Tore',NOW+3);
  assert.equal(state.rewardOffers[0].status,'used');
  assert.deepEqual(state.points,{Tore:80,Jannicke:45});
});

test('avslått belønningsønske blir ikke tilgjengelig',()=>{
  let state=core.requestRewardOffer(base(),{title:'Massasje',cost:70,category:'Fristelse ❤️'},'Tore',NOW);
  state=core.respondToRewardOffer({...state,user:'Jannicke'},state.rewardOffers[0].id,'Jannicke',false,NOW+1);
  assert.equal(core.redeemCatalogReward({...state,user:'Tore'},{title:'Massasje',offerId:state.rewardOffers[0].id},'Tore',NOW+2).ok,false);
});

test('felles akseptert mål gjør belønningen klar uten poengtrekk eller dobbeltbruk',()=>{
  let state=core.createGoal(base(),{kind:'shared',metric:{type:'manual'},reward:{title:'Date på ditt valg',cost:100,type:'shared'}},NOW);
  state=core.acceptGoal({...state,user:'Jannicke'},state.goals[0].id,'Jannicke',NOW+1);
  state=core.markManualDone({...state,user:'Tore'},state.goals[0].id,'Tore',NOW+2);
  assert.equal(state.goals[0].reward.status,'available');
  const used=core.markRewardUsed(state,state.goals[0].id,'Tore',NOW+3);
  assert.deepEqual(used.points,{Tore:80,Jannicke:45});
  assert.equal(used.goals[0].reward.status,'used');
  assert.equal(core.markRewardUsed(used,state.goals[0].id,'Tore',NOW+4),used);
});

test('poengoversikt skiller tilgjengelig, ukentlig, historisk og brukt',()=>{
  const state={...base(),points:{Tore:10,Jannicke:45},completions:[
    {taskId:'kitchen',date:'2026-08-20',by:'Tore',taskSnapshot:{pts:20}},
    {taskId:'bedkids',date:'2026-09-02',by:'Tore',taskSnapshot:{pts:15}}
  ],rewardPurchases:[{paidBy:{Tore:25}}],rewardRedemptions:[{claimedBy:'Tore',cost:5}]};
  assert.deepEqual(core.pointSummary(state,'Tore',NOW),{available:35,earnedWeek:15,totalEarned:35,used:30});
});

test('utfordring kan fullføres og markeres brukt uten å trekke poeng',()=>{
  let state=core.createGoal(base(),{kind:'challenge',targetUser:'Jannicke',metric:{type:'manual'},title:'Tar du leggingen i kveld?',deadline:'2026-09-04T20:00:00Z',reward:{title:'Jeg venter på sofaen ❤️',type:'challenge',direct:true,cost:0}},NOW);
  const id=state.goals[0].id;
  state=core.acceptGoal({...state,user:'Jannicke'},id,'Jannicke',NOW+1);
  state=core.markManualDone({...state,user:'Jannicke'},id,'Jannicke',NOW+2);
  assert.equal(state.goals[0].reward.status,'available');
  const before=structuredClone(state.points);
  state=core.markRewardUsed(state,id,'Jannicke',NOW+4);
  assert.deepEqual(state.points,before);
  assert.equal(state.goals[0].reward.status,'used');
});

test('Fristelse teller bare poeng opptjent etter aksept og blir klar nøyaktig én gang',()=>{
  let state={...base(),points:{Tore:80,Jannicke:1000},completions:[
    {id:'before',taskId:'kitchen',date:'2026-09-03',by:'Jannicke',taskSnapshot:{pts:1000},registeredAt:'2026-09-03T11:59:00Z'}
  ]};
  state=core.createGoal(state,{kind:'challenge',targetUser:'Jannicke',metric:{type:'points_new',target:100},reward:{title:'Massasje',category:'Fristelse ❤️'}},NOW);
  const id=state.goals[0].id;
  state=core.acceptGoal({...state,user:'Jannicke'},id,'Jannicke',NOW+1000);
  assert.equal(core.progress(state,state.goals[0],NOW+2000).value,0);
  state={...state,completions:[...state.completions,{id:'forty',taskId:'kitchen',date:'2026-09-03',by:'Jannicke',taskSnapshot:{pts:40},registeredAt:'2026-09-03T12:02:00Z'}]};
  assert.equal(core.progress(state,state.goals[0],NOW+3000).value,40);
  state={...state,completions:[...state.completions,{id:'sixty',taskId:'bedkids',date:'2026-09-03',by:'Jannicke',taskSnapshot:{pts:60},registeredAt:'2026-09-03T12:03:00Z'}]};
  const before=structuredClone(state.points),purchases=structuredClone(state.rewardPurchases);
  state=core.refreshState(state,NOW+4000);
  assert.equal(state.goals[0].status,'reached');
  assert.equal(state.goals[0].reward.status,'available');
  assert.equal(state.goals[0].reward.cost,0);
  assert.deepEqual(state.points,before);
  assert.deepEqual(state.rewardPurchases,purchases);
  const again=core.refreshState(state,NOW+5000);
  assert.equal(again,state,'gjentatt render/synk skal være idempotent');
  assert.equal(again.goals.filter(goal=>goal.id===id).length,1);
});

test('personlig mål kan ikke opprettes med partneravhengig belønning',()=>{
  const state=base(),next=core.createGoal(state,{kind:'personal',metric:{type:'points_new',target:500},reward:{title:'Massasje',category:'Fristelse ❤️'}},NOW);
  assert.equal(core.canAttachReward('personal',{title:'Massasje',category:'Fristelse ❤️'}),false);
  assert.equal(next,state);
  assert.equal(next.goals.length,0);
});

test('personlig poengmål teller fra opprettelsen, ikke eksisterende poeng',()=>{
  let state={...base(),points:{Tore:1000,Jannicke:45},completions:[{id:'old',taskId:'kitchen',date:'2026-09-03',by:'Tore',taskSnapshot:{pts:500},registeredAt:'2026-09-03T11:00:00Z'}]};
  state=core.createGoal(state,{kind:'personal',metric:{type:'points_new',target:500}},NOW);
  assert.equal(core.progress(state,state.goals[0],NOW+1).value,0);
  state={...state,completions:[...state.completions,{id:'new',taskId:'kitchen',date:'2026-09-03',by:'Tore',taskSnapshot:{pts:50},registeredAt:'2026-09-03T12:01:00Z'}]};
  assert.equal(core.progress(state,state.goals[0],NOW+61000).value,50);
});

test('bestemt gjøremål X ganger teller registreringer etter målstart',()=>{
  let state={...base(),completions:[{id:'old',taskId:'bedkids',date:'2026-09-03',by:'Tore',registeredAt:'2026-09-03T11:00:00Z'}]};
  state=core.createGoal(state,{kind:'personal',metric:{type:'task_specific',taskId:'bedkids',target:2}},NOW);
  state={...state,completions:[...state.completions,
    {id:'one',taskId:'bedkids',date:'2026-09-03',by:'Tore',registeredAt:'2026-09-03T12:01:00Z'},
    {id:'other',taskId:'kitchen',date:'2026-09-03',by:'Tore',registeredAt:'2026-09-03T12:02:00Z'},
    {id:'two',taskId:'bedkids',date:'2026-09-03',by:'Tore',registeredAt:'2026-09-03T12:03:00Z'}
  ]};
  assert.deepEqual(core.progress(state,state.goals[0],NOW+240000),{value:2,target:2,pct:100,label:'2 av 2 fullført'});
});

test('eget mål fungerer fortsatt',()=>{
  let state=core.createGoal(base(),{kind:'personal',title:'Rydd boden',metric:{type:'manual'}},NOW);
  assert.equal(state.goals[0].title,'Rydd boden');
  state=core.markManualDone(state,state.goals[0].id,'Tore',NOW+1);
  assert.equal(state.goals[0].status,'reached');
});

test('gamle måltyper og historiske kjøp beholdes ved normalisering',()=>{
  const historicalPurchase={id:'purchase-old',title:'Takeaway',status:'used',cost:70,paidBy:{Tore:70}},oldGoal={id:'old-goal',kind:'personal',owner:'Tore',createdBy:'Tore',createdAt:'2026-08-01T10:00:00Z',deadline:'2026-09-07',status:'active',title:'Nå ukesmålet',metric:{type:'week_goal',target:100},reward:{status:'none',title:'',cost:0}};
  const state={...base(),goals:[oldGoal],rewardPurchases:[historicalPurchase]},next=core.refreshState(state,NOW);
  assert.equal(core.progress(next,next.goals[0],NOW).target,100);
  assert.deepEqual(next.rewardPurchases,[historicalPurchase]);
});

test('normalisering av opptjent belønning er idempotent og oppretter ikke kjøp',()=>{
  const legacyGoal={id:'legacy-ready',kind:'personal',owner:'Tore',createdBy:'Tore',createdAt:'2026-09-01T10:00:00Z',deadline:'2026-09-07',status:'reached',title:'Eget mål',metric:{type:'manual',target:1},reward:{title:'Takeaway',status:'active',cost:70,direct:false}};
  const purchase={id:'old-purchase',status:'redeemed',title:'Gammel bok',cost:50,buyer:'Tore',paidBy:{Tore:50}};
  const state={...base(),goals:[legacyGoal],rewardPurchases:[purchase]},first=core.refreshState(state,NOW),second=core.refreshState(first,NOW+1);
  assert.equal(first.goals[0].reward.status,'available');
  assert.equal(first.goals[0].reward.cost,0);
  assert.equal(first.goals[0].reward.model,'earned');
  assert.deepEqual(first.rewardPurchases,[purchase]);
  assert.equal(second,first);
});
