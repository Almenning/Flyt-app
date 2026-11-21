'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');

const source=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/laria-troll-runtime-v1.js'),'utf8');
const art=id=>'./assets/gangemagi-troll/'+id+'.webp';
const base='./assets/trollactor-motion/storesoster/';
const identitySha='b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
};
const bytesFor=kind=>Buffer.from('verified animation fixture '+kind);
const bufferOf=bytes=>Uint8Array.from(bytes).buffer;
const entryFor=kind=>({
  filename:kind+'-20261121.webp',duration_ms:kind==='wave'?5250:kind==='idle'?6000:3000,
  loop_count:kind==='idle'?0:1,width:264,height:540,bytes:bytesFor(kind).length,
  sha256:createHash('sha256').update(bytesFor(kind)).digest('hex')
});
const manifestFor=kinds=>({version:1,status:'review-only',identity:'storesoster',identity_sha256:identitySha,
  clips:Object.fromEntries(kinds.map(kind=>[kind,entryFor(kind)]))});
const responseFor=kind=>({ok:true,arrayBuffer:async()=>bufferOf(bytesFor(kind))});

// Network bytes, decode completion, visibility and time are controlled here.
// Actual animated WebP decoding and real learning flows belong to browser QA.
function harness({review=true,reduce=false,fetcher,manifestFetcher,manifest,clips=['wave'],main=false}={}){
  const events=new Map(),windowEvents=new Map(),mediaEvents=new Map();
  const pending=new Map(),images=[],urls=[],revoked=[],requests=[],frames=[],observers=[],mainHosts=[];
  let now=0,serial=0,blobSerial=0,saves=0;
  const state={profile:{tallvikaTroll:'storesoster'},journey:{done:['one']},score:42};
  const media={matches:reduce,addEventListener:(name,fn)=>mediaEvents.set(name,fn)};
  const listen=(map,name,fn)=>map.set(name,[...(map.get(name)||[]),fn]);
  const emit=(map,name,event={})=>(map.get(name)||[]).forEach(fn=>fn(event));
  const screen={classList:{contains:name=>name==='active'},parentElement:null};
  const styles=new Map();
  const document={
    readyState:'loading',body:{},hidden:false,
    documentElement:{dataset:{},style:{getPropertyValue:key=>styles.get(key)||'',setProperty:(key,value)=>styles.set(key,value)}},
    addEventListener:(name,fn)=>listen(events,name,fn),
    dispatchEvent:event=>emit(events,event.type,event),
    getElementById:()=>null,
    querySelectorAll:selector=>selector.includes('.tv-actor-touch')?mainHosts:[],
    querySelector:()=>null
  };
  class ImageNode{
    constructor(attributes={src:art('storesoster'),class:'laria-premium-troll-art'}){
      this.attrs={...attributes};this.dataset={troll:'storesoster'};
      this.parentElement=null;this.onload=null;this.onerror=null;
      this.naturalWidth=264;this.naturalHeight=540;
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
  const makeHost=()=>{
    const host={
      dataset:{troll:'storesoster',lariaTrollMood:'idle'},isConnected:true,
      visible:true,style:{},parentElement:screen,
      getClientRects:()=>host.visible?[{}]:[],
      querySelector:selector=>selector.includes('img.laria-premium-troll-art')?host.img:null,
      closest:selector=>selector==='.screen'?screen:selector==='[hidden],[inert]'&&host.inert?host:null,
      matches:selector=>selector.includes('.tv-actor-touch'),
      contains:node=>node===host||node===host.img
    };
    host.img=new ImageNode();host.img.parentElement=host;
    return host;
  };
  const host=makeHost();if(main)mainHosts.push(host);
  const window={
    document,state,location:{search:review?'?laria-troll-motion=1':''},
    matchMedia:()=>media,requestAnimationFrame:fn=>frames.push(fn),
    getComputedStyle:node=>({display:'block',visibility:'visible',opacity:'1',...node.style}),
    addEventListener:(name,fn)=>listen(windowEvents,name,fn),
    setTimeout:(fn,delay)=>{const id=++serial;pending.set(id,{fn,at:now+delay});return id;},
    clearTimeout:id=>pending.delete(id),
    Blob,
    crypto:{subtle:{digest:async(_,bytes)=>bufferOf(createHash('sha256').update(new Uint8Array(bytes)).digest())}},
    URL:{
      createObjectURL:()=>{const url='blob:motion-'+(++blobSerial);urls.push(url);return url;},
      revokeObjectURL:url=>revoked.push(url)
    },
    fetch:src=>{
      requests.push(src);
      if(src.endsWith('/manifest.json'))return manifestFetcher?manifestFetcher():
        Promise.resolve({ok:true,json:async()=>manifest||manifestFor(clips)});
      const kind=src.slice(base.length).split('-')[0];
      return fetcher?fetcher(src):Promise.resolve(responseFor(kind));
    }
  };
  const context={
    window,state,URLSearchParams,Uint8Array,
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}},saveState:()=>saves++
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
  const flush=async()=>{
    for(let count=0;count<8;count++){
      const work=frames.splice(0);work.forEach(fn=>fn());await tick();
      if(!frames.length)break;
    }
  };
  return {
    api:window.LARIA_TROLL_ACTOR,host,state,images,urls,revoked,requests,advance,flush,
    saves:()=>saves,
    assetRequests:()=>requests.filter(src=>!src.endsWith('/manifest.json')),
    addMain:()=>{const extra=makeHost();mainHosts.push(extra);return extra;},
    async decoded(index=images.length-1){assert(images[index],'expected a verified image to be decoded');images[index].onload?.();await tick();},
    async reduce(value){media.matches=value;mediaEvents.get('change')?.({matches:value});await tick();},
    async visibility(hidden){document.hidden=hidden;emit(events,'visibilitychange');await flush();},
    async changed(){observers.forEach(fn=>fn([{type:'attributes',attributeName:'style',target:host}]));await flush();},
    pagehide:()=>emit(windowEvents,'pagehide'),
    pageshow:()=>emit(windowEvents,'pageshow')
  };
}

test('ordinary app URL, reduced motion and hidden actors do not fetch motion or manifest',async()=>{
  for(const options of [{review:false},{reduce:true},{hidden:true},{invisible:true}]){
    const h=harness(options);
    if(options.hidden)h.host.visible=false;
    if(options.invisible)h.host.style.visibility='hidden';
    h.api.mood(h.host,'wave',{say:false});await h.flush();
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.requests.length,0);
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
  }
});

test('slow loading keeps V1 visible and grants full manifest duration after decode',async()=>{
  const network=deferred(),h=harness({fetcher:()=>network.promise});
  h.api.mood(h.host,'wave',{say:false,duration:1050});await tick();
  h.advance(3000);
  assert.equal(h.host.img.src,art('storesoster'));
  assert.equal(h.host.dataset.lariaTrollSequence,undefined);
  network.resolve(responseFor('wave'));await tick();
  assert.equal(h.host.img.src,art('storesoster'));
  await h.decoded();
  assert.match(h.host.img.src,/^blob:/);
  assert.equal(h.host.dataset.lariaTrollSequence,'wave');
  h.advance(5249);assert.match(h.host.img.src,/^blob:/);
  h.advance(1);await h.flush();assert.equal(h.host.img.src,art('storesoster'));
  assert.equal(h.host.dataset.lariaTrollMood,'idle');
  assert.deepEqual(h.revoked,h.urls);
  assert.equal(h.saves(),0);
  assert.equal(h.state.score,42);
});

test('repeat playback uses fresh timelines and cached verified bytes',async()=>{
  const h=harness();
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  const first=h.host.img.src;
  h.advance(2000);
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  const second=h.host.img.src;
  assert.notEqual(first,second);assert.deepEqual(h.revoked,[first]);
  assert.equal(h.assetRequests().length,1);
  assert.equal(h.requests.filter(src=>src.endsWith('/manifest.json')).length,1);
  h.advance(3250);assert.equal(h.host.img.src,second);
  h.advance(2000);assert.equal(h.host.img.src,art('storesoster'));
  assert.deepEqual(h.revoked,[first,second]);
});

test('a timed-out manifest can be retried and its late response cannot replace the new catalog',async()=>{
  const slow=deferred();let calls=0;
  const h=harness({manifestFetcher:()=>++calls===1?slow.promise:
    Promise.resolve({ok:true,json:async()=>manifestFor(['wave'])})});
  h.api.mood(h.host,'wave',{say:false});await tick();h.advance(10000);
  assert.equal(h.host.img.src,art('storesoster'));
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  assert.equal(calls,2);
  assert.equal(h.host.dataset.lariaTrollSequence,'wave');
  slow.resolve({ok:true,json:async()=>manifestFor([])});await tick();
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  assert.equal(h.host.dataset.lariaTrollSequence,'wave');
  assert.equal(h.assetRequests().length,1);
});

test('network, HTTP, decode, byte count, hash and dimension errors leave V1',async()=>{
  for(const failure of ['network','http','decode','bytes','hash','dimensions']){
    const h=harness({fetcher:()=>{
      if(failure==='network')return Promise.reject(new Error('offline'));
      if(failure==='http')return Promise.resolve({ok:false});
      const body=bytesFor('wave');
      if(failure==='bytes')return Promise.resolve({ok:true,arrayBuffer:async()=>bufferOf(body.subarray(1))});
      if(failure==='hash')body[0]^=255;
      return Promise.resolve({ok:true,arrayBuffer:async()=>bufferOf(body)});
    }});
    h.api.mood(h.host,'wave',{say:false});await tick();
    if(failure==='decode'||failure==='dimensions'){
      if(failure==='decode')h.images[0].decodeError=new Error('corrupt image');
      else h.images[0].naturalWidth++;
      await h.decoded();
    }
    assert.equal(h.host.img.src,art('storesoster'),failure);
    assert.equal(h.host.dataset.lariaTrollSequence,undefined,failure);
    assert.equal(h.host.dataset.lariaTrollMood,'idle',failure);
    assert.deepEqual(h.revoked,h.urls,failure);
    if(['bytes','hash'].includes(failure))assert.equal(h.urls.length,0,'unverified bytes must never decode');
  }
});

test('selecting another troll cancels pending and playing clips without changing learning progress',async()=>{
  for(const loaded of [false,true]){
    const h=harness();h.api.mood(h.host,'wave',{say:false});await tick();
    if(loaded)await h.decoded();
    h.api.persistChoice('lillesoster');
    assert.equal(h.host.img.src,art('lillesoster'));
    if(!loaded)await h.decoded();
    h.advance(6000);await h.flush();
    assert.equal(h.host.img.src,art('lillesoster'));
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
    assert.deepEqual(h.revoked,h.urls);
    assert.equal(h.state.score,42);assert.deepEqual(h.state.journey,{done:['one']});
  }
});

test('missing or malformed extra entries preserve wave and CSS fallback for other moods',async()=>{
  const manifest=manifestFor(['wave','hint']);manifest.clips.hint.filename='../unregistered.webp';
  const h=harness({manifest});
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  assert.equal(h.host.dataset.lariaTrollSequence,'wave');
  h.api.mood(h.host,'help',{say:false,duration:1800});await tick();
  assert.equal(h.host.dataset.lariaTrollMood,'hint');
  assert.equal(h.host.img.src,art('storesoster'));
  assert.equal(h.host.dataset.lariaTrollSequence,undefined);
  assert.deepEqual(h.assetRequests(),[base+'wave-20261121.webp']);
  h.advance(1800);assert.equal(h.host.dataset.lariaTrollMood,'idle');
});

test('the manifest must bind the locked identity and disallow unregistered files',async()=>{
  for(const mutate of [m=>m.identity='lillebror',m=>m.identity_sha256='0'.repeat(64),m=>m.status='candidate',m=>m.clips.wave.loop_count=0]){
    const manifest=manifestFor(['wave']);mutate(manifest);
    const h=harness({manifest});h.api.mood(h.host,'wave',{say:false});await tick();
    assert.equal(h.assetRequests().length,0);
    assert.equal(h.urls.length,0);
    assert.equal(h.host.img.src,art('storesoster'));
  }
});

test('a verified cached file cannot bypass different integrity metadata on another clip',async()=>{
  const manifest=manifestFor(['wave']);
  manifest.clips.hint={...manifest.clips.wave,sha256:'0'.repeat(64)};
  const h=harness({manifest});
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  h.api.mood(h.host,'hint',{say:false});await tick();
  assert.equal(h.host.img.src,art('storesoster'));
  assert.equal(h.host.dataset.lariaTrollSequence,undefined);
  assert.equal(h.urls.length,1,'the conflicting entry must never reach image decoding');
});

test('aliases play registered canonical clips and distinct reactions cancel each other',async()=>{
  const h=harness({clips:['wave','think','hint','support']});
  for(const [mood,clip,semantic] of [['help','hint','hint'],['encourage','support','support'],['curious','think','curious'],['wave','wave','wave']]){
    h.api.mood(h.host,mood,{say:false});await tick();await h.decoded();
    assert.equal(h.host.dataset.lariaTrollSequence,clip);
    assert.equal(h.host.dataset.lariaTrollMood,semantic);
  }
  assert.equal(h.revoked.length,3);
  h.advance(3000);assert.equal(h.host.dataset.lariaTrollSequence,'wave');
  h.advance(2250);assert.equal(h.host.img.src,art('storesoster'));
});

test('a later reaction invalidates pending decode and cannot be replaced by its stale completion',async()=>{
  const h=harness({clips:['wave','celebrate']});
  h.api.mood(h.host,'wave',{say:false});await tick();
  h.api.mood(h.host,'celebrate',{say:false});await tick();await h.decoded(1);
  const current=h.host.img.src;await h.decoded(0);
  assert.equal(h.host.img.src,current);
  assert.equal(h.host.dataset.lariaTrollSequence,'celebrate');
  h.advance(3000);assert.equal(h.host.img.src,art('storesoster'));
  assert.deepEqual(h.revoked,h.urls);
});

test('reduced motion, document hiding and pagehide immediately stop playback',async()=>{
  for(const reason of ['reduce','hidden','pagehide']){
    const h=harness();h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
    if(reason==='reduce')await h.reduce(true);else if(reason==='hidden')await h.visibility(true);else h.pagehide();
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
    assert.deepEqual(h.revoked,h.urls);
    h.api.mood(h.host,'wave',{say:false});await tick();
    assert.equal(h.urls.length,1,'suspended state must block another playback');
  }
});

test('timeout, a detached host or a newly hidden scene cannot attach late images',async()=>{
  for(const reason of ['timeout','detached','hidden']){
    const h=harness();h.api.mood(h.host,'wave',{say:false});await tick();
    if(reason==='timeout')h.advance(10000);
    else if(reason==='detached')h.host.isConnected=false;
    else h.host.style.opacity='0';
    await h.decoded();
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.host.dataset.lariaTrollSequence,undefined);
    assert.deepEqual(h.revoked,h.urls);
  }
});

test('idle loops on only one main companion, keeps one timeline and resumes after a reaction',async()=>{
  const h=harness({clips:['idle','wave'],main:true}),other=h.addMain();
  await h.flush();await h.decoded();
  assert.equal(h.host.dataset.lariaTrollSequence,'idle');
  assert.equal(other.img.src,art('storesoster'));
  const idle=h.host.img.src;h.advance(30000);await h.flush();
  assert.equal(h.host.img.src,idle);assert.equal(h.urls.length,1);
  h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
  assert.equal(h.host.dataset.lariaTrollSequence,'wave');
  h.advance(5250);await h.flush();await h.decoded();
  assert.equal(h.host.dataset.lariaTrollSequence,'idle');
  assert.notEqual(h.host.img.src,idle);
  assert.equal(h.assetRequests().filter(src=>src.includes('idle-')).length,1);
  assert.equal(h.saves(),0);
});

test('idle does not run on thumbnails and stops when its scene becomes hidden',async()=>{
  const thumbnail=harness({clips:['idle']});
  thumbnail.api.mood(thumbnail.host,'idle',{say:false});await thumbnail.flush();
  assert.equal(thumbnail.requests.length,0);
  const h=harness({clips:['idle'],main:true});await h.flush();await h.decoded();
  h.host.style.visibility='hidden';await h.changed();
  assert.equal(h.host.img.src,art('storesoster'));
  assert.equal(h.host.dataset.lariaTrollSequence,undefined);
  h.advance(30000);await h.flush();assert.equal(h.urls.length,1);
  h.host.style.visibility='visible';await h.changed();await h.decoded();
  assert.equal(h.host.dataset.lariaTrollSequence,'idle');
  assert.equal(h.assetRequests().length,1);
});

test('missing or failing idle never enters an automatic download loop',async()=>{
  for(const mode of ['missing','network','decode']){
    const h=harness({main:true,clips:mode==='missing'?['wave']:['idle','wave'],
      fetcher:src=>src.includes('idle-')&&mode==='network'?Promise.reject(new Error('offline')):
        Promise.resolve(responseFor(src.includes('idle-')?'idle':'wave'))});
    await h.flush();
    if(mode==='decode'){h.images[0].decodeError=new Error('invalid idle');await h.decoded();}
    for(let repeat=0;repeat<3;repeat++){h.advance(20000);await h.changed();}
    assert.equal(h.host.img.src,art('storesoster'));
    assert.equal(h.assetRequests().filter(src=>src.includes('idle-')).length,mode==='missing'?0:1);
    h.api.mood(h.host,'wave',{say:false});await tick();await h.decoded();
    assert.equal(h.host.dataset.lariaTrollSequence,'wave','the independent wave remains usable');
  }
});
