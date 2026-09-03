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
const fresh={user_id:'me',energy:'med',capacity:'low',stress:'med',needs:[],daily_updated_at:'2026-08-30T11:00:00Z',updated_at:'2026-08-30T11:00:00Z'};
const base={
  user:'Alex',
  tasks:[
    {id:'laundry',name:'Vaske/brette klær',kind:'house',type:'daily',freq:7,pts:45,owner:'Begge'},
    {id:'bath',name:'Vaske bad',kind:'house',type:'flex',freq:1,pts:70,owner:'Begge'},
    {id:'train',name:'Trening',kind:'personal',type:'flex',freq:3,pts:40,owner:'Alex'}
  ],
  completions:[],
  seenRequests:[]
};

assert.equal(freshStatus(fresh,now.getTime()),true,'a recent status from the same day should be eligible');
assert.equal(freshStatus({...fresh,daily_updated_at:'2026-08-28T11:00:00Z',updated_at:'2026-08-30T11:00:00Z'},now.getTime()),false,'a newer relationship update must not refresh stale daily capacity');
assert.equal(freshStatus({...fresh,daily_updated_at:'2026-08-29T23:30:00'},now.getTime()),false,'a status from the previous calendar day must not drive a new day');

const remaining=remainingTasks(base,now);
assert.deepEqual(remaining.map(task=>task.id),['laundry','bath'],'only unfinished household tasks should be suggested');

const ask=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:fresh,
  partnerStatus:null,
  partnerName:'Sam',
  now
});
assert.equal(ask[0]?.kind,'askHelp','own low capacity should prioritize asking for concrete help');
assert.equal(ask[0]?.task,undefined,'a status signal must not make Flyt choose a chore');
assert.equal(ask[0]?.action,'openTasks');
assert.doesNotMatch(ask[0]?.body||'',/Klesvask|Vaske\/brette/);
assert.match(nudgeSource,/FlytRecurrenceUI\?\.openToday\?\.\('remaining'\)/,'Se dagens plan must open the remaining filter');

const bothLow=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:fresh,
  partnerStatus:{...fresh,user_id:'partner',capacity:'low'},
  partnerName:'Sam',
  now
});
assert.equal(bothLow[0]?.id,'balance:both-low','when both have low capacity, good-enough guidance should outrank asking more of either person');

const initiative=buildCandidates({
  state:base,
  preferences:normalizePreferences({askHelp:false,frequency:'balanced'}),
  myStatus:null,
  partnerStatus:{...fresh,user_id:'partner',capacity:'low'},
  partnerName:'Sam',
  now
});
assert.equal(initiative[0]?.kind,'initiative','partner low capacity should trigger an initiative nudge');
assert.match(initiative[0]?.body||'',/Sam/);
assert.equal(initiative[0]?.task,undefined,'Flyt must not choose an initiative task on the user’s behalf');
assert.equal(initiative[0]?.action,'openTasks','the user must choose any task themselves');

const explicitRelief=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:{...fresh,energy:'med',needs:['relief']},
  partnerStatus:null,
  partnerName:'Sam',
  now
});
assert.equal(explicitRelief[0]?.kind,'askHelp','an explicit need for relief should be actionable even when energy is medium');
assert.match(explicitRelief[0]?.body||'',/behov for avlastning/);

const ownInitiative=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:{...fresh,energy:'high',capacity:'high',needs:['closeness','initiative']},
  partnerStatus:null,
  partnerName:'Sam',
  now
});
assert.equal(ownInitiative.some(candidate=>candidate.kind==='askHelp'),false,'own initiative need must not be misread as a request for relief');
assert.equal(ownInitiative.some(candidate=>/avlastning/.test(candidate.body||'')),false,'the UI must not claim relief was selected when only initiative was selected');

const partnerWantsInitiative=buildCandidates({
  state:base,
  preferences:normalizePreferences({askHelp:false,frequency:'balanced'}),
  myStatus:null,
  partnerStatus:{...fresh,user_id:'partner',energy:'high',capacity:'high',needs:['initiative']},
  partnerName:'Sam',
  now
});
assert.equal(partnerWantsInitiative[0]?.kind,'initiative','a partner initiative need should prompt the viewer to take initiative');
assert.match(partnerWantsInitiative[0]?.body||'',/behov for initiativ/);
assert.doesNotMatch(partnerWantsInitiative[0]?.body||'',/avlastning/);

const completed={...base,completions:[{taskId:'laundry',date:'2026-08-30',kind:'house',by:'Alex'}]};
const relationship=buildCandidates({
  state:completed,
  preferences:normalizePreferences({initiative:false,askHelp:false,recognition:false,frequency:'balanced'}),
  myStatus:null,
  partnerStatus:{...fresh,user_id:'partner',energy:'med',needs:['closeness']},
  partnerName:'Sam',
  now
});
assert.equal(relationship.some(candidate=>candidate.kind==='relationship'),true,'fresh closeness need and completed daily rhythm should offer an invitation');
assert.equal(relationship.find(candidate=>candidate.kind==='relationship')?.action,'invitation');

const stale=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced'}),
  myStatus:{...fresh,daily_updated_at:'2026-08-28T11:00:00Z'},
  partnerStatus:null,
  partnerName:'Sam',
  now
});
assert.equal(stale.some(candidate=>candidate.kind==='askHelp'),false,'balanced mode should not invent status-based advice from stale data');
assert.equal(stale.some(candidate=>candidate.kind==='progress'),true,'balanced mode may still show a factual progress nudge');

const activeWithoutSignal=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'active'}),
  myStatus:null,
  partnerStatus:null,
  partnerName:'Sam',
  now
});
assert.equal(activeWithoutSignal[0]?.kind,'progress','active mode may show a factual progress nudge without reading intent into the couple');

const night=new Date('2026-08-30T00:17:00');
assert.equal(quietHours(night),true,'nighttime must be treated as quiet hours');
const nighttime=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'active'},night),
  myStatus:{...fresh,daily_updated_at:'2026-08-29T23:30:00'},
  partnerStatus:null,
  partnerName:'Sam',
  now:night
});
assert.equal(nighttime.length,0,'Flyt must not suggest chores between 23 and 06');

const dismissed=buildCandidates({
  state:base,
  preferences:normalizePreferences({frequency:'balanced',dismissedDate:'2026-08-30',dismissedIds:['ask-help:status:2026-08-30']},now),
  myStatus:fresh,
  partnerStatus:null,
  partnerName:'Sam',
  now
});
assert.equal(dismissed.some(candidate=>candidate.id==='ask-help:status:2026-08-30'),false,'a nudge hidden today must stay hidden today');

assert.doesNotMatch(nudgeSource,/function fallbackCandidate|Ett konkret neste steg|Begynn gjerne med/,'Home must not choose a specific task as a generic fallback');

const message=requestMessage({task:base.tasks[0],partnerName:'Sam',tone:'warm',status:fresh});
assert.match(message,/oppgaven «Klesvask \(tidligere samlet\)»/);
assert.match(message,/Jeg hadde satt stor pris på/);
assert.doesNotMatch(message,/du tok vaske|\. Hadde satt/i);
assert.match(message,/dagen litt lettere/);
assert.doesNotMatch(message,/overskudd til oss|betaling|belønning/i,'help copy must not turn closeness into payment for chores');

for(const tone of ['warm','direct','gentle']){
  for(const task of [{id:'bath_shower',name:'Vaske badekar eller dusj'},{id:'dinner',name:'Lage middag'},{id:'dish_fill',name:'Sette inn i oppvaskmaskinen'}]){
    const generated=requestMessage({task,partnerName:'Sam',tone,status:fresh});
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
