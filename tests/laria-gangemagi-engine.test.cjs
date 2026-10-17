'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../laer-litt-mer/multiplication-gangemagi-engine-v1.js');
test('Gangemagi opens with true, empty 3×3 groups and an honest equation',()=>{
 const s=E.initial(),q=E.equation(s);
 assert.equal(s.mode,'mission');assert.deepEqual(s.counts,[0,0,0]);
 assert.equal(q.total,0);assert.equal(q.target,'3 × 3 = 9');assert.equal(q.multiplication,null);
 assert.equal(q.addition,'0 + 0 + 0 = 0');
});
test('Unequal baskets always use addition, equal baskets can use multiplication',()=>{
 let s=E.initial();
 s=E.apply(s,{type:'add',group:0});s=E.apply(s,{type:'add',group:0});
 s=E.apply(s,{type:'add',group:2});
 assert.equal(E.equation(s).addition,'2 + 0 + 1 = 3');
 assert.equal(E.equation(s).multiplication,null);
 s=E.apply(s,{type:'add',group:1});
 s=E.apply(s,{type:'add',group:2});
 assert.equal(E.equation(s).multiplication,null);
 s=E.apply(s,{type:'add',group:1});
 assert.equal(E.equation(s).multiplication,'3 × 2 = 6');
 assert.equal(E.equation(s).complete,false);
});
test('Reward once for a unique mission; replay and undo never duplicate',()=>{
 let s=E.initial();
 for(let g=0;g<3;g++)for(let i=0;i<3;i++)s=E.apply(s,{type:'add',group:g});
 assert.equal(E.filled(s),true);
 assert.equal(E.equation(s).multiplication,'3 × 3 = 9');
 assert.deepEqual(s.wins,['meadow-3-3']);
 const unchanged=E.apply(s,{type:'add',group:0});
 assert.deepEqual(unchanged,s,'full crate cannot overfill');
 s=E.apply(s,{type:'remove',group:0});
 assert.equal(E.filled(s),false);
 s=E.apply(s,{type:'add',group:0});
 assert.deepEqual(s.wins,['meadow-3-3']);
 s=E.apply(s,{type:'reset'});
 assert.deepEqual(s.counts,[0,0,0]);
 assert.deepEqual(s.wins,['meadow-3-3']);
});
test('Free play bounds and transitions are safe and factual',()=>{
 let s=E.apply(E.initial(),{type:'mode',mode:'free'});
 s=E.apply(s,{type:'groups',value:50});
 s=E.apply(s,{type:'each',value:100});
 assert.equal(s.groups,5);assert.equal(s.each,10);assert.equal(E.target(s),50);
 for(let i=0;i<10;i++)s=E.apply(s,{type:'add',group:0});
 assert.equal(E.total(s),10);
 s=E.apply(s,{type:'each',value:2});
 assert.deepEqual(s.counts,[2,0,0,0,0]);assert.equal(E.target(s),10);
 s=E.apply(s,{type:'groups',value:2});
 assert.deepEqual(s.counts,[2,0]);assert.equal(E.equation(s).multiplication,null);
 s=E.apply(s,{type:'next'});
 assert.equal(s.mode,'mission');assert.equal(s.mission,1);assert.deepEqual(s.counts,[0,0]);
 assert.equal(E.equation(s).target,'2 × 5 = 10');
});
test('Corrupt progress, rogue mission IDs and invalid basket indices cannot distort math',()=>{
 const s=E.normalize({mode:'free',groups:-2,each:999,counts:[Infinity,-5,'7'],wins:['nope','meadow-2-5','meadow-2-5']});
 assert.equal(s.groups,1);assert.equal(s.each,10);assert.deepEqual(s.counts,[0]);
 assert.deepEqual(s.wins,['meadow-2-5']);
 assert.deepEqual(E.apply(s,{type:'add',group:10}),s);
 assert.deepEqual(E.apply(s,{type:'remove',group:-1}),s);
 assert.equal(E.equation(s).addition,'0 = 0');
});
test('Each authored mission has a unique ID and a valid bounded target',()=>{
 const ids=new Set();
 for(const m of E.MISSIONS){
  assert.ok(!ids.has(m.id));ids.add(m.id);
  assert.ok(m.groups>=1&&m.groups<=E.MAX_GROUPS);
  assert.ok(m.each>=1&&m.each<=E.MAX_EACH);
  assert.ok(m.text.length>=20&&m.celebrate.length>=20);
 }
 assert.equal(E.MISSIONS.length,8);
});
test('Markedsbok selects any authored mission and preserves collected flowers',()=>{
 let s=E.initial();
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)s=E.apply(s,{type:'add',group:i});
 assert.deepEqual(s.wins,['meadow-3-3']);
 s=E.apply(s,{type:'mission',index:7});
 assert.equal(s.mission,7);assert.equal(s.mode,'mission');
 assert.deepEqual(s.counts,[0,0]);assert.equal(E.equation(s).target,'2 × 10 = 20');
 assert.deepEqual(s.wins,['meadow-3-3']);
 assert.deepEqual(E.apply(s,{type:'mission',index:-1}),s);
 assert.deepEqual(E.apply(s,{type:'mission',index:99}),s);
 assert.deepEqual(E.apply(s,{type:'mission',index:1.4}),s);
 s=E.apply(s,{type:'mode',mode:'free'});
 s=E.apply(s,{type:'mission',index:0});
 assert.equal(s.mode,'mission');assert.deepEqual(s.wins,['meadow-3-3']);
});
