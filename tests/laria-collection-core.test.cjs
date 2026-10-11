'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../laer-litt-mer/laria-collection-core.js');
const {normalize,evidence,reconcile,equip,unequip,available,CATALOG}=core;
const answer=(subject,extras={})=>({subject,correct:true,countsForLearning:true,...extras});
test('catalog stays deterministic, unique and accessible to both saved fox choices',()=>{
  assert.equal(core.VERSION,1);
  assert.equal(new Set(CATALOG.map(x=>x.id)).size,CATALOG.length);
  assert.ok(CATALOG.length>=9);
  assert.ok(CATALOG.every(x=>x.unlock&&x.title&&x.description));
  assert.ok(!JSON.stringify(CATALOG).match(/random|lootbox|streak|price|premium|screen.?time/i));
  assert.ok(CATALOG.some(x=>x.kind==='clothing'&&x.slot==='head'));
  assert.ok(CATALOG.some(x=>x.kind==='clothing'&&x.slot==='neck'));
});
test('existing profiles migrate to starter book without altering saved learning data',()=>{
  const old={profile:{avatar:'girl',name:'Barn'},journey:{nodes:{}},answerLog:[]};
  const original=JSON.stringify(old);
  const result=reconcile(old.collectibles,old);
  assert.deepEqual(result.collection.ownedIds,['magisk-samlebok']);
  assert.deepEqual(result.newlyUnlocked,[]);
  assert.equal(result.collection.equipped.head,null);
  assert.equal(result.collection.equipped.neck,null);
  assert.equal(result.collection.equipped.back,null);
  assert.equal(result.collection.equipped.cape,null);
  assert.equal(JSON.stringify(old),original);
});
test('malformed and forged collection entries cannot equip locked or invalid gear',()=>{
  const raw={version:999,
    ownedIds:['magisk-samlebok','eventyrskjerf','eventyrskjerf','FAKE',null,{},'oppdagerhatt'],
    equipped:{head:'eventyrskjerf',neck:'eventyrskjerf',back:'FAKE',cape:'nordlyskappe',admin:'hacked'}};
  const safe=normalize(raw);
  assert.deepEqual(safe.ownedIds,['magisk-samlebok','eventyrskjerf','oppdagerhatt']);
  assert.equal(safe.equipped.head,null);
  assert.equal(safe.equipped.neck,'eventyrskjerf');
  assert.equal(safe.equipped.back,null);
  assert.equal(safe.equipped.cape,null);
  assert.equal(Object.keys(safe.equipped).length,4);
  assert.deepEqual(equip(safe,'nordlyskappe').changed,false);
  assert.deepEqual(equip(safe,'FAKE').reason,'unknown-item');
});
test('learning attempts and repeat-practice rules follow the existing app evidence',()=>{
  const stats=evidence({answerLog:[
    answer('norwegian'),answer('norwegian',{correct:false}),
    answer('norwegian',{countsForLearning:false}),
    answer('math'),answer('english'),{country:'NO',correct:true,countsForLearning:true},
    {country:'US',correct:true,countsForLearning:false}
  ]});
  assert.equal(stats.correctAnswers,4);
  assert.equal(stats.effortUnits,5);
  assert.deepEqual(stats.bySubject,{norwegian:3,math:1,english:1,geography:2});
  assert.equal(stats.completedGrades,0);
});
test('collecting all four world souvenirs needs evidence, not tapping a card',()=>{
  const p={answerLog:[answer('norwegian'),answer('math'),answer('english'),{country:'NO',correct:true}]};
  const won=reconcile(null,p);
  const got=won.collection.ownedIds;
  for(const id of ['magisk-samlebok','bokskogens-fjaer','tallkrystall','ordlandets-nokkel','nordlys-kompass'])
    assert.ok(got.includes(id),id);
  assert.ok(got.includes('eventyrskjerf'),'early scarf should not require every subject');
  assert.ok(!got.includes('oppdagerhatt'),'hat should not unlock after only four answers');
  assert.ok(!got.includes('stjerneryggsekk'));
  assert.equal(won.newlyUnlocked.includes('magisk-samlebok'),false);
});
test('pre-existing journey attempts grant realm keepsakes for older users',()=>{
  const p={journey:{nodes:{
    'norwegian:2:lyder':{attempts:1,passed:false},
    'geography:2:country':{passed:true}
  }}};
  const won=reconcile(undefined,p);
  assert.ok(won.collection.ownedIds.includes('bokskogens-fjaer'));
  assert.ok(won.collection.ownedIds.includes('nordlys-kompass'));
  assert.ok(!won.collection.ownedIds.includes('tallkrystall'));
});
test('replaying a favorite subject can earn wearable gear without world-hopping',()=>{
  const p={answerLog:Array.from({length:45},()=>answer('math'))};
  const won=reconcile(null,p);
  for(const id of ['eventyrskjerf','oppdagerhatt','stjerneryggsekk','nordlyskappe'])
    assert.ok(won.collection.ownedIds.includes(id),id);
  assert.ok(!won.collection.ownedIds.includes('bokskogens-fjaer'));
  assert.equal(won.stats.correctAnswers,45);
  assert.equal(won.stats.effortUnits,45);
});
test('a child who struggles still earns clothes for thoughtful attempts',()=>{
  const p={answerLog:Array.from({length:12},(_,i)=>({
    subject:'norwegian',correct:false,countsForLearning:true,questionKey:'try-'+i
  }))};
  const won=reconcile(null,p);
  assert.equal(won.stats.correctAnswers,0);
  assert.equal(won.stats.effortUnits,12);
  assert.ok(won.collection.ownedIds.includes('eventyrskjerf'));
  assert.ok(won.collection.ownedIds.includes('oppdagerhatt'));
  assert.ok(won.collection.ownedIds.includes('bokskogens-fjaer'));
});
test('completed repetition sessions count, without rewriting daily goal flags',()=>{
  const p={sessionLog:Array.from({length:10},(_,i)=>({
    endedAt:1720000000000+i,total:3,correct:0,practiceOnly:true,countsTowardGoal:false
  })),answerLog:[{subject:'math',correct:false,countsForLearning:false}]};
  const copy=JSON.stringify(p);
  const won=reconcile(null,p);
  assert.equal(won.stats.completedSessions,10);
  assert.equal(won.stats.effortUnits,30);
  assert.ok(won.collection.ownedIds.includes('eventyrskjerf'));
  assert.ok(won.collection.ownedIds.includes('oppdagerhatt'));
  assert.ok(won.collection.ownedIds.includes('stjerneryggsekk'));
  assert.equal(JSON.stringify(p),copy,'collection should not rewrite goal accounting');
});
test('a completed grade also unlocks cape but does not alter learning progression',()=>{
  const p={journey:{nodes:{},gradeWins:{'math:2':{at:1720000000000}}}};
  const snap=JSON.stringify(p);
  const won=reconcile(null,p);
  assert.ok(won.collection.ownedIds.includes('nordlyskappe'));
  assert.equal(JSON.stringify(p),snap);
});
test('reconciliation is idempotent and owned items survive resets or grade changes',()=>{
  const p={profile:{grade:2,avatar:'girl'},answerLog:Array.from({length:30},()=>answer('norwegian'))};
  const first=reconcile(null,p);
  assert.ok(first.newlyUnlocked.length>0);
  const second=reconcile(first.collection,p);
  assert.deepEqual(second.newlyUnlocked,[]);
  assert.deepEqual(second.collection,first.collection);
  const reset=reconcile(first.collection,{profile:{grade:3,avatar:'boy'},answerLog:[]});
  assert.deepEqual(reset.collection.ownedIds,first.collection.ownedIds);
});
test('wearing and removing an earned item persists per slot, with no unlocked-for-free shortcuts',()=>{
  const p={answerLog:Array.from({length:30},()=>answer('math'))};
  const owned=reconcile(null,p).collection;
  let result=equip(owned,'oppdagerhatt');
  assert.equal(result.changed,true);
  assert.equal(result.collection.equipped.head,'oppdagerhatt');
  result=equip(result.collection,'eventyrskjerf');
  assert.equal(result.changed,true);
  assert.equal(result.collection.equipped.head,'oppdagerhatt');
  assert.equal(result.collection.equipped.neck,'eventyrskjerf');
  assert.equal(equip(result.collection,'eventyrskjerf').changed,false);
  let saved=JSON.parse(JSON.stringify(result.collection));
  assert.equal(normalize(saved).equipped.head,'oppdagerhatt');
  assert.equal(unequip(saved,'unknown').changed,false);
  let removed=unequip(saved,'head');
  assert.equal(removed.changed,true);
  assert.equal(removed.collection.equipped.head,null);
  assert.ok(removed.collection.ownedIds.includes('oppdagerhatt'),'unequipping must not delete earned clothing');
  assert.equal(available(removed.collection).find(x=>x.id==='eventyrskjerf').equipped,true);
});
test('no state mutation from available catalogue or invalid input',()=>{
  const raw={ownedIds:['eventyrskjerf'],equipped:{neck:'eventyrskjerf'}};
  const original=JSON.stringify(raw);
  const snapshot=available(raw);
  assert.ok(snapshot.find(x=>x.id==='eventyrskjerf').equipped);
  assert.ok(!snapshot.find(x=>x.id==='oppdagerhatt').owned);
  assert.equal(JSON.stringify(raw),original);
  assert.doesNotThrow(()=>reconcile('garbage',{answerLog:[null,false,{}]}));
});