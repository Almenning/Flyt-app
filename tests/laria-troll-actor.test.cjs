const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('laer-litt-mer/laria-troll-actor.js','utf8');

function load(saved){
  const store=new Map();
  if(saved)store.set('laerlittmer-v2',JSON.stringify(saved));
  const window={};
  const context={
    window,
    localStorage:{
      getItem:key=>store.has(key)?store.get(key):null,
      setItem:(key,value)=>store.set(key,String(value))
    },
    CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail}},
    console
  };
  vm.runInNewContext(source,context,{filename:'laria-troll-actor.js'});
  return window.LARIA_TROLL_ACTOR;
}

test('TrollActor preserves selected forest-troll identity',()=>{
  const actor=load({profile:{tallvikaTroll:'lillesoster'}});
  assert.equal(actor.version,'core-v1');
  assert.equal(actor.choice(),'lillesoster');
  assert.equal(actor.meta().name,'Lillesøster');
  assert.match(actor.render({state:'hint'}),/data-troll-id="lillesoster"/);
  assert.match(actor.render({state:'hint'}),/data-troll-state="hint"/);
  assert.match(actor.render({state:'hint'}),/data-troll-rig="flat-fallback"/);
  assert.match(actor.render({state:'hint'}),/assets\/gangemagi-troll\/lillesoster\.webp/);
});

test('Storesoster uses the already approved painterly source',()=>{
  const actor=load({profile:{tallvikaTroll:'storesoster'}});
  assert.equal(actor.choice(),'storesoster');
  assert.match(actor.render({state:'idle'}),/assets\/tallvika\/storesoster-inworld-approved-20261026\.webp/);
});

test('reaction moods map to the five rig-ready semantic states',()=>{
  const actor=load({profile:{tallvikaTroll:'lillebror'}});
  assert.equal(actor.stateForMood('curious'),'idle');
  assert.equal(actor.stateForMood('cheer'),'wave');
  assert.equal(actor.stateForMood('think'),'think');
  assert.equal(actor.stateForMood('help'),'hint');
  assert.equal(actor.stateForMood('celebrate'),'celebrate');
  assert.deepEqual(Array.from(actor.states),['idle','wave','think','hint','celebrate']);
});

test('invalid saved identity and state fall back safely',()=>{
  const actor=load({profile:{tallvikaTroll:'not-a-real-troll'}});
  assert.equal(actor.choice(),'storesoster');
  assert.match(actor.render({state:'banana'}),/data-troll-state="idle"/);
});
