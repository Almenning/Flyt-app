const assert=require('node:assert/strict');
const test=require('node:test');
const core=require('../seen-core.js');

const state={
  user:'Tore',
  status:{Tore:{},Maria:{}},
  tasks:[{id:'kitchen',name:'Rydde kjøkkenet',pts:20}],
  completions:[
    {id:1,taskId:'kitchen',date:'2026-09-03',by:'Maria',registeredAt:'2026-09-03T14:25:00Z'},
    {id:2,taskId:'kitchen',date:'2026-09-03',by:'Tore',registeredAt:'2026-09-03T15:00:00Z'},
    {id:3,taskId:'kitchen',date:'2026-09-02',by:'Maria',registeredAt:'2026-09-02T11:00:00Z'}
  ],
  plannedTasks:[
    {id:'extra_done',title:'Bestille tannlegetime',date:'2026-09-03',done:true,doneBy:'Maria',doneAt:'2026-09-03T16:40:00Z',points:10},
    {id:'extra_open',title:'Handle maling',date:'2026-09-03',done:false,doneBy:null}
  ],
  recognitions:[]
};

test('dagslisten viser bare partnerens fullførte bidrag på valgt dato',()=>{
  const rows=core.contributions(state,{user:'Tore',date:'2026-09-03'});
  assert.deepEqual(rows.map(row=>row.title),['Rydde kjøkkenet','Bestille tannlegetime']);
  assert.ok(rows.every(row=>row.by==='Maria'));
  assert.ok(!rows.some(row=>row.id==='extra_open'));
});

test('dagslisten prioriterer høyest poengverdi og deretter siste fullføring',()=>{
  const sorted=core.contributions({
    user:'Tore',
    tasks:[
      {id:'high_early',name:'Stor tidlig',pts:50},
      {id:'high_late',name:'Stor sen',pts:50},
      {id:'low_latest',name:'Liten senest',pts:10}
    ],
    completions:[
      {id:11,taskId:'high_early',date:'2026-09-03',by:'Maria',registeredAt:'2026-09-03T12:00:00Z'},
      {id:12,taskId:'high_late',date:'2026-09-03',by:'Maria',registeredAt:'2026-09-03T14:00:00Z'},
      {id:13,taskId:'low_latest',date:'2026-09-03',by:'Maria',registeredAt:'2026-09-03T16:00:00Z'}
    ]
  },{user:'Tore',date:'2026-09-03'});
  assert.deepEqual(sorted.map(row=>row.title),['Stor sen','Stor tidlig','Liten senest']);
  assert.deepEqual(sorted.map(row=>row.points),[50,50,10]);
});

test('Sett kan slås på og av uten å endre selve fullføringen',()=>{
  const added=core.toggleAcknowledgement(state,{kind:'completion',id:1,user:'Tore',now:1000});
  assert.equal(added.action,'added');
  assert.equal(added.state.completions.length,state.completions.length);
  assert.equal(core.contributions(added.state,{user:'Tore',date:'2026-09-03'})[0].acknowledgement.by,'Tore');
  const removed=core.toggleAcknowledgement(added.state,{kind:'completion',id:1,user:'Tore',now:2000});
  assert.equal(removed.action,'removed');
  assert.equal(core.contributions(removed.state,{user:'Tore',date:'2026-09-03'})[0].acknowledgement,null);
});

test('personlig tekst må bekreftes før anerkjennelsen fjernes',()=>{
  const added=core.toggleAcknowledgement(state,{kind:'completion',id:1,user:'Tore',text:'Takk for at du så meg',now:1000});
  const blocked=core.toggleAcknowledgement(added.state,{kind:'completion',id:1,user:'Tore'});
  assert.equal(blocked.requiresConfirmation,true);
  assert.equal(blocked.state,added.state);
  const removed=core.toggleAcknowledgement(added.state,{kind:'completion',id:1,user:'Tore',allowTextRemoval:true});
  assert.equal(removed.action,'removed');
});

test('historikken inneholder bare faktiske anerkjennelser',()=>{
  const taskAck=core.toggleAcknowledgement(state,{kind:'completion',id:1,user:'Tore',now:1000}).state;
  const personal=core.addRecognition(taskAck,{type:'personal',text:'Jeg satte pris på at du var tålmodig.',user:'Tore',to:'Maria',now:2000});
  const room=core.addRecognition(personal,{type:'space',text:'Du trenger ikke prestere noe i dag ❤️',user:'Maria',to:'Tore',now:3000});
  const events=core.recognitionEvents(room);
  assert.equal(events.length,3);
  assert.deepEqual(events.map(event=>event.type),['space','personal','task']);
  assert.ok(!events.some(event=>event.id.includes('completion_2')));
});

test('hurtigforslag er individuelle, kan sorteres og tilbakestilles',()=>{
  const maria=core.setSuggestions(state,'Maria',['Så meg','Tok initiativ']);
  const tore=core.setSuggestions(maria,'Tore',['Ga meg rom']);
  assert.deepEqual(core.suggestions(tore,'Maria'),['Så meg','Tok initiativ']);
  assert.deepEqual(core.suggestions(tore,'Tore'),['Ga meg rom']);
  const reset=core.resetSuggestions(tore,'Tore');
  assert.deepEqual(core.suggestions(reset,'Tore'),core.DEFAULT_SUGGESTIONS);
  assert.deepEqual(core.suggestions(reset,'Maria'),['Så meg','Tok initiativ']);
});
