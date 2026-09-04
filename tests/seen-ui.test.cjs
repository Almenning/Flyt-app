const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const seenCore=require('../seen-core.js');

test('Sett rendrer den mobile hovedflyten fra eksisterende fullføringer',()=>{
  const day=seenCore.dateKey(),content={dataset:{},innerHTML:'',scrollTop:0,scrollHeight:900,clientHeight:650},styles=new Map(),navButtons=Array.from({length:5},()=>({dataset:{},classList:{toggle(){}}}));
  let state={user:'Tore',view:'seen',status:{Tore:{},Maria:{}},tasks:[{id:'one',name:'Ryddet kjøkkenet'}],completions:[{id:1,taskId:'one',date:day,by:'Maria',registeredAt:new Date().toISOString()},{id:2,taskId:'one',date:day,by:'Tore',registeredAt:new Date().toISOString()}],plannedTasks:[],recognitions:[{id:'r1',type:'personal',text:'Takk, det hjalp i går ❤️',by:'Tore',to:'Maria',at:new Date().toISOString(),date:day}]};
  const document={
    head:{appendChild(node){if(node.id)styles.set(node.id,node)}},
    body:{appendChild(){}},
    createElement(tag){return{tagName:tag.toUpperCase(),id:'',className:'',style:{},dataset:{},setAttribute(){},addEventListener(){},remove(){}}},
    querySelector(selector){if(selector==='#content')return content;if(selector==='#flytSeenStyles')return styles.get('flytSeenStyles')||null;return null},
    querySelectorAll(selector){return selector==='#nav button'?navButtons:[]},
    addEventListener(){}
  };
  const context={console,Date,Intl,Map,Set,Event:class{},document,MutationObserver:class{observe(){}},setInterval(){return 1},clearInterval(){},setTimeout(fn){fn();return 1},queueMicrotask(fn){fn()},window:null};
  context.window=context;
  context.FlytSeenCore=seenCore;
  context.FlytBridge={getState:()=>state,setState:next=>{state=next},toast(){}};
  context.FlytSync={getContext:()=>({user_id:'u_tore',members:[{id:'u_tore',display_name:'Tore'},{id:'u_maria',display_name:'Maria'}]}),queueSave(){}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','seen-ui.js'),'utf8'),context,{filename:'seen-ui.js'});
  context.FlytSeenUI.render({resetScroll:true});
  assert.equal(content.dataset.flytOwner,'seen-recognition');
  assert.match(content.innerHTML,/Se og anerkjenn det partneren din faktisk bidrar med/);
  assert.match(content.innerHTML,/<div class="ey">Sett<\/div><h1 class="seenTitle">Se hverandre<\/h1>/);
  assert.match(content.innerHTML,/class="pill seenDateButton"[^>]*>I dag<\/button>/);
  assert.doesNotMatch(content.innerHTML,/seenDateButton[^>]*><span/);
  assert.match(content.innerHTML,/Ryddet kjøkkenet/);
  assert.match(content.innerHTML,/Sett ♡/);
  assert.equal((content.innerHTML.match(/data-seen-contribution=/g)||[]).length,1,'egen fullføring skal ikke vises');
  assert.match(content.innerHTML,/Noe annet du satte pris på\?/);
  assert.match(content.innerHTML,/Siste anerkjennelse/);
  const latest=content.innerHTML.match(/<div class="card seenLatest">([\s\S]*?)<\/section>/)?.[1]||'';
  assert.match(latest,/Takk, det hjalp i går/);
  assert.equal((latest.match(/[♡♥❤]/g)||[]).length,1,'siste anerkjennelse skal bare vise ett diskret hjerte');
});
