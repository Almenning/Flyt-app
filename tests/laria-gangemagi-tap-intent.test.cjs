'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Engine = require('../laer-litt-mer/multiplication-gangemagi-engine-v1.js');
const source = fs.readFileSync(path.resolve(__dirname,'../laer-litt-mer/multiplication-gangemagi-v1.js'),'utf8');
function game() {
  const handlers = new Map(), stored = new Map();
  const root = {innerHTML:'', contains:el=>!!el, querySelector:()=>null, querySelectorAll:()=>[],
    addEventListener:(name,callback)=>handlers.set(name,callback)};
  const document = {activeElement:null, body:{classList:{toggle(){}}}, querySelector:()=>null,
    getElementById:id=>id==='multiplication-lab-root'?root:null};
  const window = {LARIA_GANGEMAGI_ENGINE:Engine, openMultiplicationLab(){}, addEventListener(){}};
  vm.runInNewContext(source,{window,document,localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},
    MutationObserver:class{observe(){}},console},{filename:'multiplication-gangemagi-v1.js',timeout:1000});
  const tap = (action,basket=0,berry=false,extra={})=>{
    const button = {dataset:{gmAction:action,gmBasket:String(basket),...extra}};
    const target = {closest:selector=>selector==='button[data-gm-action]'?button:selector.includes('.gm-fruit')&&berry?{}:null};
    handlers.get('click')({target,preventDefault(){},stopPropagation(){}});
  };
  return {tap,markup:()=>root.innerHTML,snapshot:()=>JSON.parse(JSON.stringify(window.LARIA_GANGEMAGI.snapshot()))};
}
test('picking then touching an existing berry PLACES the held berry in that basket',()=>{
  const g=game();
  g.tap('source');g.tap('basket',0);
  assert.deepEqual(g.snapshot().counts,[1,0,0]);
  g.tap('source');g.tap('basket',0,true);
  assert.deepEqual(g.snapshot().counts,[2,0,0],
    'the visible contents are part of the destination, not a surprise remove button while holding a berry');
  assert.equal(g.snapshot().equation.total,2);
  g.tap('basket',0,true);
  assert.deepEqual(g.snapshot().counts,[1,0,0],
    'without a held berry the same direct touch still removes one berry');
});
test('placing a held berry onto a full basket never removes an existing berry',()=>{
  const g=game();
  for(let i=0;i<3;i++){g.tap('source');g.tap('basket',0);}
  g.tap('source');g.tap('basket',0,true);
  assert.deepEqual(g.snapshot().counts,[3,0,0],'a full basket rejects a fourth berry without changing the contents');
  g.tap('basket',0,true);
  assert.deepEqual(g.snapshot().counts,[2,0,0],'ordinary direct removal remains available after the rejected placement');
});

test('free-play pickup uses one fruit while missions retain the five-berry crate',()=>{
  const g=game();
  g.tap('source');
  assert.match(g.markup(),/gm-source-berry-4/);
  g.tap('mode',0,false,{mode:'free'});
  assert.equal(g.snapshot().mode,'free');
  assert.doesNotMatch(g.markup(),/gm-source-berry/);
  const art=g.markup().match(/class="gm-pick-fruit"[^>]*>(.*?)<\/span><span>/s);
  assert.ok(art,'free-play pickup art is present');
  assert.equal((art[1].match(/data-gm-prop="berry"/g)||[]).length,1);
  g.tap('source');
  assert.deepEqual(g.snapshot().counts,[1,0,0]);
  g.tap('mode',0,false,{mode:'mission'});
  assert.match(g.markup(),/gm-source-berry-4/,'mission supply remains unchanged');
});
