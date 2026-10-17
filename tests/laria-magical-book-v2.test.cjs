'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const book=require('../laer-litt-mer/laria-magical-collection-v2.js');
const worlds=[
  {id:'bokskogens-fjaer',realm:'norwegian',title:'Fjær',owned:true},
  {id:'tallkrystall',realm:'math',title:'Krystall',owned:true},
  {id:'ordlandets-nokkel',realm:'english',title:'Nøkkel',owned:false},
  {id:'nordlys-kompass',realm:'geography',title:'Kompass',owned:false}
];
test('exactly four book spreads and no impossible reward promises',()=>{
  assert.deepEqual(book.PAGES.map(p=>p.id),['treasures','words','berries','place']);
  assert.equal(book.VERSION,1);
  assert.equal(book.KEY,'laria-magical-book-scene-v1');
  assert.ok(book.REALMS.norwegian&&book.REALMS.math&&book.REALMS.english&&book.REALMS.geography);
});
test('input computes existing earned collectibles without silently awarding unearned ones',()=>{
  const x=book.normalizeInput({treasures:worlds,wordPacks:[{id:'animals',title:'Dyr'},{id:'magic',title:'Magi'}],
    themeRounds:{animals:1,magic:0},missions:[{id:'meadow-3-3',heading:'Jordbærmarkedet',groups:3,each:3},
      {id:'baskets-2-5',heading:'To kurver',groups:2,each:5}],wins:['meadow-3-3'],avatar:'girl'});
  assert.deepEqual(x.treasures.map(x=>x.owned),[true,true,false,false]);
  assert.deepEqual(x.words.map(x=>x.owned),[true,false]);
  assert.deepEqual(x.missions.map(x=>x.earned),[true,false]);
  assert.equal(x.avatar,'girl');
});
test('scene accepts only owned and catalogued keepsakes; rejects duplicates',()=>{
  assert.deepEqual(book.normalizePlace({spots:['bokskogens-fjaer','bokskogens-fjaer','ordlandets-nokkel']},worlds).spots,
    ['bokskogens-fjaer',null,null]);
  assert.deepEqual(book.normalizePlace({spots:['FAKE',{},'tallkrystall']},worlds).spots,[null,null,'tallkrystall']);
  assert.deepEqual(book.normalizePlace(null,worlds).spots,[null,null,null]);
  assert.equal(book.placeItem(null,0,'ordlandets-nokkel',worlds).spots[0],null,'a locked artifact is not available');
  let s=book.placeItem(null,0,'bokskogens-fjaer',worlds);
  s=book.placeItem(s,2,'tallkrystall',worlds);
  assert.deepEqual(s.spots,['bokskogens-fjaer',null,'tallkrystall']);
  s=book.placeItem(s,1,'bokskogens-fjaer',worlds);
  assert.deepEqual(s.spots,[null,'bokskogens-fjaer','tallkrystall']);
  assert.deepEqual(book.placeItem(s,100,'tallkrystall',worlds).spots,s.spots);
});
test('preserves inputs and never executes injected string or HTML',()=>{
  const input={treasures:[...worlds],missions:[],themeRounds:{}};
  const copy=JSON.stringify(input);
  const x=book.normalizeInput(input);
  assert.equal(JSON.stringify(input),copy);
  assert.equal(x.avatar,'boy');
  assert.deepEqual(x.words,[]);
  assert.equal(book.normalizePlace({spots:['__proto__','constructor','eventyrskjerf']},worlds).spots.every(x=>x===null),true);
});