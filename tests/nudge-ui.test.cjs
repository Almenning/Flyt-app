const assert=require('node:assert/strict');
const {
  buildCandidates,
  freshStatus,
  makeRequest,
  normalizePreferences,
  remainingTasks,
  requestMessage
}=require('../nudge-ui.js');

const now=new Date('2026-08-30T12:00:00Z');
const fresh={user_id:'me',energy:'low',capacity:'med',stress:'med',needs:[],updated_at:'2026-08-30T11:00:00Z'};
const base={
  user:'Tore',
  tasks:[
    {id:'laundry',name:'Vaske/brette klær',kind:'house',type:'daily',freq:7,pts:45,owner:'Begge'},
    {id:'bath',name:'Vaske bad',kind:'house',type:'flex',freq:1,pts:70,owner:'Begge'},
    {id:'train',name:'Trening',kind:'personal',type:'flex',freq:3,pts:40,owner:'Tore'}
  ],
  completions:[],
  seenRequests:[]
};

assert.equal(freshStatus(fresh,now.getTime()),true,'status from the last 24 hours should be eligible');
assert.equal(freshStatus({...fresh,updated_at:'2026-08-28T11:00:00Z'},now.getTime()),false,'stale status must not drive nudges');

const remaining=remainingTasks(base,now);
assert.deepEqual(remaining.map(task=>task.id),['laundry','bath'],'only unfinished household tasks should be suggested');

const ask=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:fresh,
  partnerStatus:null,
  partnerName:'Jannicke',
  now
});
assert.equal(ask[0]?.kind,'askHelp','own low capacity should prioritize asking for concrete help');
assert.equal(ask[0]?.task.id,'laundry');
assert.match(ask[0]?.actionLabel||'',/Jannicke/);

const bothLow=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:fresh,
  partnerStatus:{...fresh,user_id:'partner',capacity:'low'},
  partnerName:'Jannicke',
  now
});
assert.equal(bothLow[0]?.id,'balance:both-low','when both have low capacity, good-enough guidance should outrank asking more of either person');

const initiative=buildCandidates({
  state:base,
  preferences:normalizePreferences({askHelp:false,frequency:'balanced'}),
  myStatus:null,
  partnerStatus:{...fresh,user_id:'partner',capacity:'low'},
  partnerName:'Jannicke',
  now
});
assert.equal(initiative[0]?.kind,'initiative','partner low capacity should trigger an initiative nudge');
assert.match(initiative[0]?.body||'',/Jannicke/);
assert.equal(initiative[0]?.action,'takeInitiative','initiative nudges should create a visible commitment, not only open the task list');

const explicitRelief=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:{...fresh,energy:'med',needs:['relief']},
  partnerStatus:null,
  partnerName:'Jannicke',
  now
});
assert.equal(explicitRelief[0]?.kind,'askHelp','an explicit need for relief should be actionable even when energy is medium');
assert.match(explicitRelief[0]?.body||'',/behov for avlastning/);

const completed={...base,completions:[{taskId:'laundry',date:'2026-08-30',kind:'house',by:'Tore'}]};
const relationship=buildCandidates({
  state:completed,
  preferences:normalizePreferences({initiative:false,askHelp:false,recognition:false,frequency:'balanced'}),
  myStatus:null,
  partnerStatus:{...fresh,user_id:'partner',energy:'med',needs:['closeness']},
  partnerName:'Jannicke',
  now
});
assert.equal(relationship[0]?.kind,'relationship','fresh closeness need and completed daily rhythm should offer an invitation');
assert.equal(relationship[0]?.action,'invitation');

const stale=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:{...fresh,updated_at:'2026-08-28T11:00:00Z'},
  partnerStatus:null,
  partnerName:'Jannicke',
  now
});
assert.equal(stale.length,0,'balanced mode should not invent status-based advice from stale data');

const dismissed=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced',dismissedDate:'2026-08-30',dismissedIds:['ask-help:laundry']},now),
  myStatus:fresh,
  partnerStatus:null,
  partnerName:'Jannicke',
  now
});
assert.equal(dismissed.some(candidate=>candidate.id==='ask-help:laundry'),false,'a nudge hidden today must stay hidden today');

const message=requestMessage({task:base.tasks[0],partnerName:'Jannicke',tone:'warm',status:fresh});
assert.match(message,/oppgaven «Klesvask \(tidligere samlet\)»/);
assert.match(message,/Jeg hadde satt stor pris på/);
assert.doesNotMatch(message,/du tok vaske|\. Hadde satt/i);
assert.match(message,/dagen litt lettere/);
assert.doesNotMatch(message,/overskudd til oss|betaling|belønning/i,'help copy must not turn closeness into payment for chores');

for(const tone of ['warm','direct','gentle']){
  for(const task of [{id:'bath_shower',name:'Vaske badekar eller dusj'},{id:'dinner',name:'Lage middag'},{id:'dish_fill',name:'Sette inn i oppvaskmaskinen'}]){
    const generated=requestMessage({task,partnerName:'Jannicke',tone,status:fresh});
    assert.match(generated,new RegExp(`oppgaven «${task.name}»`));
    assert.doesNotMatch(generated,/du tok (vaske|lage|fylle|tømme)|Kan du ta (vaske|lage|fylle|tømme)/i);
  }
}

const made=makeRequest({state:base,task:base.tasks[0],text:message,now:1234});
assert.equal(made.request.type,'practical');
assert.equal(made.request.source,'nudge');
assert.equal(made.request.responseState,'pending');
assert.equal(made.reward,undefined,'an invitation must never be bundled into a help request');

console.log('ok - contextual nudges, freshness, preferences and request flow');
