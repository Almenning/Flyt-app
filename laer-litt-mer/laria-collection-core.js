/* Læria's magical collection: deterministic, local-first inventory contract.
 * Pure rules only. No random drops, streak pressure, payments or screen-time goals.
 * Visual wardrobe and layered character art are intentionally NOT in this module. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_COLLECTION_CORE=api;
})(typeof window==='object'?window:(typeof globalThis==='object'?globalThis:null),function(){
  'use strict';
  const VERSION=1;
  const SUBJECTS=Object.freeze(['norwegian','math','english','geography']);
  const SLOTS=Object.freeze(['head','neck','back','cape']);
  const CATALOG=Object.freeze([
    {id:'magisk-samlebok',kind:'treasure',realm:'all',title:'Min magiske samlebok',description:'En bok med plass til alt du oppdager.',unlock:{type:'starter'}},
    {id:'bokskogens-fjaer',kind:'treasure',realm:'norwegian',title:'Bokskogens fjær',description:'Et minne fra ord og fortellinger.',unlock:{type:'subject',subject:'norwegian'}},
    {id:'tallkrystall',kind:'treasure',realm:'math',title:'Tallkrystall',description:'En liten skatt fra Tallenga.',unlock:{type:'subject',subject:'math'}},
    {id:'ordlandets-nokkel',kind:'treasure',realm:'english',title:'Ordlandets nøkkel',description:'En nøkkel til nye ord.',unlock:{type:'subject',subject:'english'}},
    {id:'nordlys-kompass',kind:'treasure',realm:'geography',title:'Nordlyskompass',description:'Et minne fra en verden du har utforsket.',unlock:{type:'subject',subject:'geography'}},
    {id:'eventyrskjerf',kind:'clothing',slot:'neck',realm:'all',title:'Eventyrskjerf',description:'Et varmt skjerf til din rev.',unlock:{type:'effort',minimum:3}},
    {id:'oppdagerhatt',kind:'clothing',slot:'head',realm:'all',title:'Oppdagerhatt',description:'En hatt for nysgjerrige oppdagere.',unlock:{type:'effort',minimum:12}},
    {id:'stjerneryggsekk',kind:'clothing',slot:'back',realm:'all',title:'Stjerneryggsekk',description:'En ryggsekk til eventyrskatter.',unlock:{type:'effort',minimum:28}},
    {id:'nordlyskappe',kind:'clothing',slot:'cape',realm:'all',title:'Nordlyskappe',description:'En kappe til store og små reiser.',unlock:{type:'gradeOrEffort',minimum:45}}
  ].map(item=>Object.freeze({...item,unlock:Object.freeze({...item.unlock})})));
  const BY_ID=new Map(CATALOG.map(item=>[item.id,item]));
  const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const record=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
  const starterIds=CATALOG.filter(item=>item.unlock.type==='starter').map(item=>item.id);
  function normalize(raw){
    const original=record(raw)?raw:{};
    const supplied=Array.isArray(original.ownedIds)?original.ownedIds:[];
    const owned=new Set(starterIds);
    for(const id of supplied)if(typeof id==='string'&&BY_ID.has(id))owned.add(id);
    const ownedIds=CATALOG.filter(item=>owned.has(item.id)).map(item=>item.id);
    const suppliedGear=record(original.equipped)?original.equipped:{};
    const equipped={};
    for(const slot of SLOTS){
      const itemId=suppliedGear[slot];
      equipped[slot]=typeof itemId==='string'&&owned.has(itemId)&&BY_ID.get(itemId)?.slot===slot?itemId:null;
    }
    return {version:VERSION,ownedIds,equipped};
  }
  function evidence(progress){
    const p=record(progress)?progress:{};
    const bySubject={norwegian:0,math:0,english:0,geography:0};
    let correctAnswers=0,meaningfulAttempts=0;
    const answers=Array.isArray(p.answerLog)?p.answerLog:[];
    for(const entry of answers){
      if(!record(entry)||(entry.correct!==true&&entry.correct!==false))continue;
      if(entry.countsForLearning!==false){
        meaningfulAttempts++;
        if(entry.correct===true)correctAnswers++;
      }
      // Correct answers are not required to discover the world of a subject.
      const subject=entry.subject==='geography'||hasOwn(bySubject,entry.subject)?entry.subject:
        (entry.country!=null?'geography':null);
      if(subject&&hasOwn(bySubject,subject))bySubject[subject]++;
    }
    // A completed repeat-practice session is valuable even when the core
    // mastery engine correctly marks the repeated questions as non-counting.
    const sessions=Array.isArray(p.sessionLog)?p.sessionLog:[];
    const completedSessions=sessions.filter(s=>record(s)&&Number(s.endedAt)>0&&Number(s.total)>0).length;
    const effortUnits=Math.max(meaningfulAttempts,completedSessions*3);
    const nodes=record(p.journey?.nodes)?p.journey.nodes:{};
    for(const [key,node] of Object.entries(nodes)){
      if(!record(node)||!(node.passed===true||Number(node.attempts)>0))continue;
      const subject=String(key).split(':')[0];
      if(hasOwn(bySubject,subject))bySubject[subject]=Math.max(bySubject[subject],1);
    }
    const wins=record(p.journey?.gradeWins)?p.journey.gradeWins:{};
    const completedGrades=Object.keys(wins).filter(key=>
      SUBJECTS.includes(key.split(':')[0])&&record(wins[key])).length;
    return {correctAnswers,effortUnits,completedSessions,bySubject,completedGrades};
  }
  function qualifies(item,stats){
    const unlock=item.unlock;
    if(unlock.type==='starter')return true;
    if(unlock.type==='subject')return (stats.bySubject[unlock.subject]||0)>0;
    if(unlock.type==='effort')return stats.effortUnits>=unlock.minimum;
    if(unlock.type==='gradeOrEffort')return stats.completedGrades>0||stats.effortUnits>=unlock.minimum;
    return false;
  }
  function reconcile(raw,progress){
    const before=normalize(raw),stats=evidence(progress);
    const have=new Set(before.ownedIds);
    const newlyUnlocked=[];
    for(const item of CATALOG)if(qualifies(item,stats)&&!have.has(item.id)){
      have.add(item.id);newlyUnlocked.push(item.id);
    }
    const collection=normalize({...before,ownedIds:[...have]});
    return {collection,newlyUnlocked,stats};
  }
  function equip(raw,id){
    const collection=normalize(raw),item=BY_ID.get(id);
    if(!item||item.kind!=='clothing'||!SLOTS.includes(item.slot))return {collection,changed:false,reason:'unknown-item'};
    if(!collection.ownedIds.includes(id))return {collection,changed:false,reason:'not-owned'};
    if(collection.equipped[item.slot]===id)return {collection,changed:false,reason:'already-equipped'};
    return {collection:{...collection,equipped:{...collection.equipped,[item.slot]:id}},changed:true,reason:'equipped'};
  }
  function unequip(raw,slot){
    const collection=normalize(raw);
    if(!SLOTS.includes(slot)||!collection.equipped[slot])return {collection,changed:false};
    return {collection:{...collection,equipped:{...collection.equipped,[slot]:null}},changed:true};
  }
  function available(raw){
    const collection=normalize(raw);
    return CATALOG.map(item=>({...item,owned:collection.ownedIds.includes(item.id),
      equipped:item.slot?collection.equipped[item.slot]===item.id:false}));
  }
  return Object.freeze({VERSION,CATALOG,SLOTS,normalize,evidence,reconcile,equip,unequip,available});
});