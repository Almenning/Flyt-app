const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {
  buildCandidates,
  freshStatus,
  makeRequest,
  normalizePreferences,
  quietHours,
  remainingTasks,
  requestMessage
}=require('../nudge-ui.js');
const nudgeSource=fs.readFileSync(path.join(__dirname,'..','nudge-ui.js'),'utf8');

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

assert.equal(freshStatus(fresh,now.getTime()),true,'a recent status from the same day should be eligible');
assert.equal(freshStatus({...fresh,updated_at:'2026-08-28T11:00:00Z'},now.getTime()),false,'stale status must not drive nudges');
assert.equal(freshStatus({...fresh,updated_at:'2026-08-29T23:30:00'},now.getTime()),false,'a status from the previous calendar day must not drive a new day');

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
assert.equal(ask[0]?.task,undefined,'a status signal must not make Flyt choose a chore');
assert.equal(ask[0]?.action,'openTasks');
assert.doesNotMatch(ask[0]?.body||'',/Klesvask|Vaske\/brette/);

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
assert.equal(initiative[0]?.task,undefined,'Flyt must not choose an initiative task on the user’s behalf');
assert.equal(initiative[0]?.action,'openTasks','the user must choose any task themselves');

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

const activeWithoutSignal=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'active'}),
  myStatus:null,
  partnerStatus:null,
  partnerName:'Jannicke',
  now
});
assert.equal(activeWithoutSignal.length,0,'active mode must not invent a generic task recommendation without a concrete signal');

const night=new Date('2026-08-30T00:17:00');
assert.equal(quietHours(night),true,'nighttime must be treated as quiet hours');
const nighttime=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'active'},night),
  myStatus:{...fresh,updated_at:'2026-08-29T23:30:00'},
  partnerStatus:null,
  partnerName:'Jannicke',
  now:night
});
assert.equal(nighttime.length,0,'Flyt must not suggest chores between 23 and 06');

const dismissed=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced',dismissedDate:'2026-08-30',dismissedIds:['ask-help:status:2026-08-30']},now),
  myStatus:fresh,
  partnerStatus:null,
  partnerName:'Jannicke',
  now
});
assert.equal(dismissed.some(candidate=>candidate.id==='ask-help:status:2026-08-30'),false,'a nudge hidden today must stay hidden today');

assert.doesNotMatch(nudgeSource,/function fallbackCandidate|Ett konkret neste steg|Begynn gjerne med/,'Home must not contain a generic task fallback');

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
