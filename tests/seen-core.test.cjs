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
  assert.deepEqual(rows.map(row=>row.title),['Bestille tannlegetime','Rydde kjøkkenet']);
  assert.ok(rows.every(row=>row.by==='Maria'));
  assert.ok(!rows.some(row=>row.id==='extra_open'));
});

test('dagslisten viser nyeste faktiske bidrag først uten poengrangering',()=>{
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
  assert.deepEqual(sorted.map(row=>row.title),['Liten senest','Stor sen','Stor tidlig']);
  assert.deepEqual(sorted.map(row=>row.points),[10,50,50]);
});

test('Sett kan slås på og av uten å endre selve fullføringen',()=>{
  const added=core.toggleAcknowledgement(state,{kind:'completion',id:1,user:'Tore',now:1000});
  assert.equal(added.action,'added');
  assert.equal(added.state.completions.length,state.completions.length);
  assert.equal(core.contributions(added.state,{user:'Tore',date:'2026-09-03'}).find(row=>row.id==='1').acknowledgement.by,'Tore');
  const removed=core.toggleAcknowledgement(added.state,{kind:'completion',id:1,user:'Tore',now:2000});
  assert.equal(removed.action,'removed');
  assert.equal(core.contributions(removed.state,{user:'Tore',date:'2026-09-03'}).find(row=>row.id==='1').acknowledgement,null);
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

test('personlige nudges lagres per bruker og kategori',()=>{
  const next=core.setPersonalNudges(state,'Tore',[
    {id:'a',category:'flirt',text:'Du er skikkelig fin'},
    {id:'b',category:'space',text:'Ta den tiden du trenger'}
  ]);
  assert.deepEqual(core.personalNudges(next,'Tore'),[
    {id:'a',category:'flirt',text:'Du er skikkelig fin'},
    {id:'b',category:'space',text:'Ta den tiden du trenger'}
  ]);
  assert.deepEqual(core.personalNudges(next,'Maria'),[]);
});

test('handlingstyper i nye Sett beholdes uten å påvirke poeng',()=>{
  const next=core.addRecognition({...state,points:{Tore:40,Maria:20}},{type:'flirt',text:'Du er fin',user:'Tore',to:'Maria',now:4000});
  assert.equal(next.recognitions.at(-1).type,'flirt');
  assert.deepEqual(next.points,{Tore:40,Maria:20});
});

test('oppgaveanerkjennelse blir en ulest Sett-hendelse hos mottakeren',()=>{
  const beforePoints={Tore:40,Maria:20},before={...state,points:beforePoints,taskClaims:[{taskId:'kitchen',by:'Maria'}]};
  const added=core.toggleAcknowledgement(before,{kind:'completion',id:1,user:'Tore',now:1000}).state;
  assert.equal(core.pendingRecognitionEvents(added,'Tore').length,0);
  const pending=core.pendingRecognitionEvents(added,'Maria');
  assert.equal(pending.length,1);
  assert.equal(pending[0].type,'task');
  assert.equal(pending[0].title,'Rydde kjøkkenet');
  assert.equal(pending[0].by,'Tore');
  assert.deepEqual(added.points,beforePoints);
  assert.deepEqual(added.taskClaims,before.taskClaims);
  const read=core.markRecognitionEventSeen(added,pending[0].id,'Maria');
  assert.equal(core.pendingRecognitionEvents(read,'Maria').length,0);
  assert.equal(core.recognitionEvents(read).filter(item=>item.id===pending[0].id).length,1);
});

test('valgfri melding oppdaterer eksisterende Sett uten å lage duplikat',()=>{
  const added=core.toggleAcknowledgement(state,{kind:'completion',id:1,user:'Tore',now:1000}).state;
  const updated=core.setAcknowledgementText(added,{kind:'completion',id:1,user:'Tore',text:'Takk for at du tok dette.',now:2000}).state;
  const events=core.recognitionEvents(updated).filter(item=>item.type==='task');
  assert.equal(events.length,1);
  assert.equal(events[0].text,'Takk for at du tok dette.');
  assert.equal(updated.recognitions.length,0);
});

test('Sett fungerer begge veier og gjentatt lesing eller synk lager ikke duplikater',()=>{
  let shared=core.addRecognition(state,{type:'recognition',text:'Du gjorde dagen lettere.',user:'Tore',to:'Maria',now:5000});
  shared=core.addRecognition(shared,{type:'recognition',text:'Du gjorde dagen lettere.',user:'Tore',to:'Maria',now:5000});
  shared=core.addRecognition(shared,{type:'space',text:'Du trenger ikke prestere noe i dag ❤️',user:'Maria',to:'Tore',now:6000});
  assert.equal(shared.recognitions.length,2);
  assert.equal(core.pendingRecognitionEvents(shared,'Maria').length,1);
  assert.equal(core.pendingRecognitionEvents(shared,'Tore').length,1);
  const first=core.markRecognitionEventSeen(shared,shared.recognitions[0].id,'Maria');
  const second=core.markRecognitionEventSeen(first,shared.recognitions[0].id,'Maria');
  assert.equal(second,first);
  assert.equal(core.recognitionEvents(second).length,2);
});

test('gammel Sett-historikk beholdes og temptation leses uten å skape ny Fristelse',()=>{
  const legacy={...state,completions:state.completions.map(item=>item.id===1?{...item,thanks:[{by:'Tore',to:'Maria',at:'2026-09-03T15:30:00Z'}]}:item),recognitions:[
    {id:'old-action',type:'action',text:'Jeg lager kaffe',by:'Tore',to:'Maria',at:'2026-09-01T08:00:00Z',seenBy:['Tore','Maria']},
    {id:'old-temptation',type:'temptation',text:'En gammel melding',by:'Maria',to:'Tore',at:'2026-09-01T09:00:00Z',seenBy:['Maria','Tore']}
  ],quickTemptations:[{id:'existing'}]};
  assert.equal(core.recognitionEvents(legacy).length,3);
  const legacyTask=core.pendingRecognitionEvents(legacy,'Maria').find(item=>item.type==='task');
  const read=core.markRecognitionEventSeen(legacy,legacyTask.id,'Maria');
  assert.equal(core.pendingRecognitionEvents(read,'Maria').some(item=>item.id===legacyTask.id),false);
  const next=core.addRecognition(legacy,{type:'flirt',text:'Du er fin',user:'Tore',to:'Maria',now:7000});
  assert.deepEqual(next.quickTemptations,legacy.quickTemptations);
  assert.equal(next.recognitions.at(-1).type,'flirt');
});
