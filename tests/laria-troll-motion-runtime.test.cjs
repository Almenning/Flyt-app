'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/laria-troll-runtime-v1.js'),'utf8');
const art=id=>'./assets/gangemagi-troll/'+id+'.webp';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
};

// Exercise the public actor API with controlled network, decode and time.
// Actual WebP playback and app layout are covered by the browser review.
function harness({review=true,reduce=false,fetcher}={}){
  const events=new Map(),windowEvents=new Map(),mediaEvents=new Map();
  const pending=new Map(),images=[],urls=[],revoked=[],requests=[];
  let now=0,serial=0,blobSerial=0,saves=0;
  const state={profile:{tallvikaTroll:'storesoster'},journey:{done:['one']},score:42};
  const media={matches:reduce,addEventListener:(name,fn)=>mediaEvents.set(name,fn)};
  const listen=(map,name,fn)=>map.set(name,[...(map.get(name)||[]),fn]);
  const emit=(map,name,event={})=>(map.get(name)||[]).forEach(fn=>fn(event));
  const document={
    readyState:'loading',body:{},
    addEventListener:(name,fn)=>listen(events,name,fn),
    dispatchEvent:event=>emit(events,event.type,event),
    getElementById:()=>null,
    querySelectorAll:()=>[],
    querySelector:()=>null
  };
  class ImageNode{
    constructor(attributes={src:art('storesoster'),class:'laria-premium-troll-art'}){
      this.attrs={...attributes};this.dataset={troll:'storesoster'};
      this.parentElement=null;this.onload=null;this.onerror=null;
    }
    get isConnected(){return !!this.parentElement?.isConnected;}
    get src(){return this.attrs.src;}
    set src(value){this.attrs.src=value;if(value.startsWith('blob:'))images.push(this);}
    getAttribute(name){return this.attrs[name]??null;}
    setAttribute(name,value){if(name==='src')this.src=value;else this.attrs[name]=value;}
    removeAttribute(name){delete this.attrs[name];}
    cloneNode(){const copy=new ImageNode(this.attrs);copy.dataset={...this.dataset};return copy;}
    decode(){return this.decodeError?Promise.reject(this.decodeError):Promise.resolve();}
    replaceWith(next){const host=this.parentElement;host.img=next;next.parentElement=host;this.parentElement=null;}
  }
  const host={
    dataset:{troll:'storesoster',lariaTrollMood:'idle'},isConnected:true,
    querySelector:selector=>selector.includes('img.laria-premium-troll-art')?host.img:null,
    closest:()=>null
  };
  host.img=new ImageNode();host.img.parentElement=host;
  const window={
    document,state,location:{search:review?'?laria-troll-motion=1':''},
    matchMedia:()=>media,requestAnimationFrame:()=>{},
    addEventListener:(name,fn)=>listen(windowEvents,name,fn),
    setTimeout:(fn,delay)=>{const id=++serial;pending.set(id,{fn,at:now+delay});return id;},
    clearTimeout:id=>pending.delete(id),
    URL:{
      createObjectURL:()=>{const url='blob:motion-'+(++blobSerial);urls.push(url);return url;},
      revokeObjectURL:url=>revoked.push(url)
    },
    fetch:src=>{
      requests.push(src);
      return fetcher?fetcher(src):Promise.resolve({ok:true,blob:async()=>({type:'image/webp'})});
    }
  };
  const context={
    window,state,URLSearchParams,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    MutationObserver:class{observe(){}},saveState:()=>saves++
  };
  vm.runInNewContext(source,context);
  emit(events,'DOMContentLoaded');
  const advance=ms=>{
    const target=now+ms;
    while(true){
      const next=[...pending.entries()].filter(([,task])=>task.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next)break;
      pending.delete(next[0]);now=next[1].at;next[1].fn();
    }
    now=target;
  };
  return {
    api:window.LARIA_TROLL_ACTOR,host,state,images,urls,revoked,requests,advance,
    saves:()=>saves,
    async decoded(index=images.length-1){images[index].onload?.();await tick();},
    async reduce(value){media.matches=value;mediaEvents.get('change')?.({matches:value});await tick();},
    pagehide:()=>emit(windowEvents,'pagehide')
  };
}

test('ordinary app URL and reduced-motion preference never fetch AI motion',async()=>{
  for(const options of [{review:false},{reduce:true}]){
    const h=harness(options);
    h.api.mood(h.host,'wave',{say:false});await tick();
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.requests.length,0);
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
  }
});

test('a retired hidden actor does not download the preview animation',async()=>{
  const h=harness();h.host.getClientRects=()=>[];
  h.api.mood(h.host,'wave',{say:false});await tick();
  assert.equal(h.requests.length,0);
  assert.equal(h.host.img.src,art('storesoster'));
});

test('slow motion loading keeps V1 visible and receives the full clip duration after decode',async()=>{
  const network=deferred(),h=harness({fetcher:()=>network.promise});
  h.api.mood(h.host,'wave',{say:false,duration:1050});
  h.advance(3000);
  assert.equal(h.host.img.src,art('storesoster'));
  assert.equal(h.host.dataset.lariaTrollSequence,undefined);
  network.resolve({ok:true,blob:async()=>({type:'image/webp'})});await tick();
  assert.equal(h.host.img.src,art('storesoster'),'V1 remains until the image has decoded');
  await h.decoded();
  assert.match(h.host.img.src,/^blob:/);
  assert.equal(h.host.dataset.lariaTrollSequence,'wave');
  h.advance(5249);assert.match(h.host.img.src,/^blob:/);
  h.advance(1);assert.equal(h.host.img.src,art('storesoster'));
  assert.equal(h.host.dataset.lariaTrollMood,'idle');
  assert.deepEqual(h.revoked,h.urls);
  assert.equal(h.saves(),0,'animation must not save or alter progress');
  assert.equal(h.state.score,42);
});

test('repeat playback uses a fresh timeline without re-fetching encoded bytes',async()=>{
  const h=harness();
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  const first=h.host.img.src;
  h.advance(2000);
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  const second=h.host.img.src;
  assert.notEqual(first,second);
  assert.deepEqual(h.revoked,[first]);
  assert.equal(h.requests.length,1);
  h.advance(3250);assert.equal(h.host.img.src,second,'old playback timer must be cancelled');
  h.advance(2000);assert.equal(h.host.img.src,art('storesoster'));
  assert.deepEqual(h.revoked,[first,second]);
});

test('network, decode and HTTP errors preserve the original character',async()=>{
  for(const failure of ['network','http','decode']){
    const h=harness({fetcher:()=>failure==='network'?Promise.reject(new Error('offline')):
      Promise.resolve({ok:failure!=='http',blob:async()=>({})})});
    h.api.mood(h.host,'wave',{say:false});await tick();
    if(failure==='decode'){
      h.images[0].decodeError=new Error('corrupt image');await h.decoded();
    }
    assert.equal(h.host.img.src,art('storesoster'),failure);
    assert.equal(h.host.dataset.lariaTrollSequence,undefined,failure);
    assert.equal(h.host.dataset.lariaTrollMood,'idle',failure);
    assert.deepEqual(h.revoked,h.urls,failure);
  }
});

test('selecting another troll cancels loading and playing Storesøster immediately',async()=>{
  for(const loaded of [false,true]){
    const h=harness();h.api.mood(h.host,'wave',{say:false});await tick();
    if(loaded)await h.decoded();
    h.api.persistChoice('lillesoster');
    assert.equal(h.host.img.src,art('lillesoster'));
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
    if(!loaded)await h.decoded();
    h.advance(6000);
    assert.equal(h.host.img.src,art('lillesoster'),'late Storesøster must not return');
    assert.deepEqual(h.revoked,h.urls);
    assert.equal(h.state.score,42);
    assert.deepEqual(h.state.journey,{done:['one']});
  }
});

test('a new reaction cancels a pending or playing wave without a stale return',async()=>{
  for(const loaded of [false,true]){
    const h=harness();h.api.mood(h.host,'wave',{say:false});await tick();
    if(loaded)await h.decoded();
    h.api.mood(h.host,'celebrate',{say:false,duration:2000});
    if(!loaded)await h.decoded();
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.host.dataset.lariaTrollMood,'celebrate');
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
    h.advance(2000);assert.equal(h.host.dataset.lariaTrollMood,'idle');
    assert.deepEqual(h.revoked,h.urls);
  }
});

test('changing reduced-motion preference or leaving the page stops active playback',async()=>{
  for(const reason of ['reduce','pagehide']){
    const h=harness();h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
    if(reason==='reduce')await h.reduce(true);else h.pagehide();
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
    assert.deepEqual(h.revoked,h.urls);
    if(reason==='reduce'){
      h.api.mood(h.host,'wave',{say:false});await tick();
      assert.equal(h.urls.length,1,'reduced-motion must prevent a new decode/play');
    }
  }
});

test('a loading timeout or detached host cannot attach a late decoded image',async()=>{
  for(const reason of ['timeout','detached']){
    const h=harness();h.api.mood(h.host,'wave',{say:false});await tick();
    if(reason==='timeout')h.advance(10000);else h.host.isConnected=false;
    await h.decoded();
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
    assert.deepEqual(h.revoked,h.urls);
  }
});
