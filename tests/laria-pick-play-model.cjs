'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../laer-litt-mer/multiplication-pick-engine-v1.js');
const act=(s,type,opts={})=>E.apply(s,{type,...opts});
test('locked ten worlds and free-access educational mechanics',()=>{
 assert.equal(E.WORLDS.length,10);
 assert.equal(new Set(E.WORLDS.map(x=>x.id)).size,10);
 assert.equal(E.MISSIONS.length,4);
 assert.deepEqual(E.initial().counts,[10,10,10]);
 assert.equal(E.equation(E.initial()).main,'3 × 10 = 30');
});
test('pick, return, equal-group removal, empty and zero are mathematically exact',()=>{
 let s=E.initial();
 s=act(s,'take',{group:1});
 assert.deepEqual(s.counts,[10,9,10]);
 assert.equal(s.collected,1);
 assert.equal(E.equation(s).main,'3 × 10 − 1 = 29');
 assert.match(E.equation(s).detail,/10 \+ 9 \+ 10 = 29/);
 s=act(s,'return',{group:1});
 assert.deepEqual(s.counts,[10,10,10]);assert.equal(s.collected,0);
 s=act(s,'takeEach');
 assert.equal(E.equation(s).main,'3 × 9 = 27');
 assert.equal(s.collected,3);
 s=act(E.initial(),'empty',{group:2});
 assert.deepEqual(s.counts,[10,10,0]);
 assert.equal(E.equation(s).main,'2 × 10 = 20');
 assert.equal(s.collected,10);
 s=act(s,'empty',{group:0});
 s=act(s,'empty',{group:1});
 assert.deepEqual(s.counts,[0,0,0]);
 assert.equal(E.total(s),0);
 assert.equal(E.equation(s).main,'0');
});
test('four views change only how the same number is shown, not mathematical state',()=>{
 let s=E.initial();
 assert.deepEqual(E.VIEWS,['groups','rows','numberline','circle']);
 for(const view of E.VIEWS){
  s=act(s,'view',{view});
  assert.equal(s.view,view);
  assert.deepEqual(s.counts,[10,10,10]);
  assert.equal(E.total(s),30);
  assert.equal(E.equation(s).main,'3 × 10 = 30');
 }
 const picked=act(s,'take',{group:0,token:s.itemIds[0][3]});
 assert.equal(picked.view,'circle','picked math must keep the chosen representation');
 assert.equal(E.total(picked),29);
 assert.equal(act(picked,'view',{view:'bogus'}).view,'circle');
});

test('the exact tapped object disappears, follows drag, and returns from the collection',()=>{
 const start=E.initial();
 const chosen=start.itemIds[1][4];
 assert.equal(start.itemIds[1].length,10);
 let s=act(start,'take',{group:1,token:chosen});
 assert.equal(s.itemIds[1].includes(chosen),false,'clicked object itself must disappear, not a different icon');
 assert.equal(s.pool.at(-1),chosen,'the same object must reach the collection');
 assert.equal(s.itemIds[1].length,s.counts[1]);
 assert.equal(s.pool.length,s.collected);
 s=act(s,'return',{group:1});
 assert.equal(s.itemIds[1].includes(chosen),true,'return restores the same object');
 assert.equal(s.pool.length,0);
 const toMove=s.itemIds[1][2],prior=E.total(s);
 s=act(s,'move',{group:1,to:0,token:toMove});
 assert.equal(s.itemIds[1].includes(toMove),false);
 assert.equal(s.itemIds[0].includes(toMove),true,'direct drag must preserve identity');
 assert.equal(E.total(s),prior,'moving a specific token must conserve total');
 assert.equal(s.counts[0],11);
 assert.equal(s.counts[1],9);
 s=act(s,'empty',{group:0});
 assert.equal(s.itemIds[0].length,0);
 assert.equal(s.pool.length,s.collected);
 const store=JSON.parse(JSON.stringify(s));
 assert.deepEqual(E.normalize(store).itemIds,s.itemIds,'local persistence keeps specific objects intact');
});

test('moving an object conserves total and never fabricates an equal multiplication',()=>{
 let s=act(E.initial(),'takeEach');
 s=act(s,'move',{group:0,to:1});
 assert.deepEqual(s.counts,[8,10,9]);
 assert.equal(E.total(s),27);
 assert.equal(E.equation(s).main,'8 + 10 + 9 = 27');
 assert.equal(s.collected,3);
 const impossible=act(s,'move',{group:0,to:0});
 assert.deepEqual(impossible.counts,s.counts);
 s=act(s,'newGroup');
 assert.deepEqual(s.counts,[8,10,9,0]);
 s=act(s,'return',{group:3});
 assert.deepEqual(s.counts,[8,10,9,1]);
 assert.equal(s.collected,2);
});
test('world selection preserves mathematical state',()=>{
 let s=act(E.initial(),'take',{group:0});
 for(const w of E.WORLDS){
  s=act(s,'world',{world:w.id});
  assert.equal(s.world,w.id);
  assert.deepEqual(s.counts,[9,10,10]);
  assert.equal(E.total(s),29);
 }
});
test('four missions are solvable through child actions; no timing requirement',()=>{
 let s=act(E.initial(),'mission',{id:'twentyfour'});
 assert.deepEqual(s.counts,[10,10,10]);
 s=act(s,'takeEach');s=act(s,'takeEach');
 assert.equal(E.total(s),24);
 s=act(s,'check');
 assert.equal(s.success,true);
 s=act(s,'mission',{id:'equal'});
 assert.deepEqual(s.counts,[10,8,10]);assert.equal(s.collected,2);
 s=act(s,'return',{group:1});s=act(s,'return',{group:1});
 assert.equal(E.equation(s).main,'3 × 10 = 30');
 assert.equal(act(s,'check').success,true);
 s=act(s,'mission',{id:'empty'});
 s=act(s,'empty',{group:0});
 assert.equal(E.equation(s).main,'2 × 10 = 20');
 assert.equal(act(s,'check').success,true);
 s=act(s,'mission',{id:'twoWays'});
 assert.deepEqual(s.counts,[6,6,6]);
 s=act(s,'check');
 assert.deepEqual(s.found,['3x6']);assert.equal(s.success,false);
 s=act(s,'check');assert.deepEqual(s.found,['3x6'],'rechecking same way must not grant second discovery');
 for(let j=0;j<3;j++)s=act(s,'move',{group:2,to:0});
 for(let j=0;j<3;j++)s=act(s,'move',{group:2,to:1});
 assert.deepEqual(s.counts,[9,9,0]);
 assert.equal(E.equation(s).main,'2 × 9 = 18');
 s=act(s,'check');
 assert.deepEqual(s.found,['3x6','2x9']);
 assert.equal(s.success,true);
});
test('limits, normalization and invalid inputs do not change counts',()=>{
 let s=E.initial();
 for(let i=0;i<8;i++)s=act(s,'newGroup');
 assert.equal(s.counts.length,E.MAX_GROUPS);
 s=act(s,'move',{group:0,to:1});
 s=act(s,'move',{group:0,to:1});
 assert.equal(s.counts[1],12);
 const before=E.total(s);
 s=act(s,'move',{group:0,to:1});
 assert.equal(E.total(s),before);
 assert.equal(s.counts[1],12);
 assert.deepEqual(E.normalize({world:'fake',counts:[-5,90,3,4,5,6],collected:-5}).counts,[0,12,3,4,5]);
 assert.equal(E.normalize({world:'fake'}).world,'strawberry');
});
