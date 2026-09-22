const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const seenCore=require('../seen-core.js');

test('Sett prioriterer partnerens faktiske bidrag og toner ned øvrige handlinger',()=>{
  const day=seenCore.dateKey(),content={dataset:{},innerHTML:'',scrollTop:0,scrollHeight:900,clientHeight:650},styles=new Map(),navButtons=Array.from({length:4},()=>({dataset:{},classList:{toggle(){}}}));
  let state={user:'Tore',view:'seen',status:{Tore:{},Maria:{}},tasks:[{id:'one',name:'Rydde kjøkkenet',pts:30}],completions:[{id:1,taskId:'one',date:day,by:'Maria',registeredAt:new Date().toISOString()}],plannedTasks:[],recognitions:[],seenPersonalNudges:{}};
  const document={
    head:{appendChild(node){if(node.id)styles.set(node.id,node)}},
    body:{appendChild(){}},
    createElement(tag){return{tagName:tag.toUpperCase(),id:'',className:'',style:{},dataset:{},setAttribute(){},addEventListener(){},remove(){}}},
    querySelector(selector){if(selector==='#content')return content;if(selector==='#flytSeenStyles')return styles.get('flytSeenStyles')||null;return null},
    querySelectorAll(selector){return selector==='#nav button'?navButtons:[]},
    addEventListener(){}
  };
  const context={console,Date,Intl,Map,Set,Event:class{},document,MutationObserver:class{observe(){}},setInterval(){return 1},clearInterval(){},setTimeout(fn){fn();return 1},clearTimeout(){},requestAnimationFrame(fn){fn()},queueMicrotask(fn){fn()},window:null,addEventListener(){}};
  context.window=context;
  context.FlytSeenCore=seenCore;
  context.FlytBridge={getState:()=>state,setState:next=>{state=next},toast(){}};
  context.FlytSync={getContext:()=>({user_id:'u_tore',members:[{id:'u_tore',display_name:'Tore'},{id:'u_maria',display_name:'Maria'}]}),queueSave(){}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','seen-ui.js'),'utf8'),context,{filename:'seen-ui.js'});
  context.FlytSeenUI.render({resetScroll:true});
  assert.equal(content.dataset.flytOwner,'seen-actions');
  assert.match(content.innerHTML,/<h1 class="seenTitle">Se hverandre<\/h1>/);
  assert.match(content.innerHTML,/Maria har bidratt i dag/);
  assert.match(content.innerHTML,/Rydde kjøkkenet/);
  assert.match(content.innerHTML,/data-seen-ack="completion\|1"/);
  assert.match(content.innerHTML,/Sett ♡/);
  assert.match(content.innerHTML,/Noe annet du satte pris på\?/);
  assert.match(content.innerHTML,/\+ Gi anerkjennelse/);
  for(const label of ['Noe fint','Flørt','Gi litt rom'])assert.match(content.innerHTML,new RegExp(label));
  assert.match(content.innerHTML,/Se historikk →/,'den enkle eksisterende historikken er fortsatt tilgjengelig');
  assert.match(content.innerHTML,/seenContributionList/);
  assert.doesNotMatch(content.innerHTML,/Forslag akkurat nå|Hva vil du gjøre\?|Lag en kaffe|Ta oppvasken|En liten fristelse/);
  assert.doesNotMatch(content.innerHTML,/poeng|rangering|prosent/i);
});
