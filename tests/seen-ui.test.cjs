const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const seenCore=require('../seen-core.js');

test('Sett prioriterer partnerens faktiske bidrag og toner ned øvrige handlinger',()=>{
  const day=seenCore.dateKey(),content={dataset:{},style:{},innerHTML:'',scrollTop:0,scrollHeight:900,clientHeight:650},styles=new Map(),navButtons=Array.from({length:4},()=>({dataset:{},classList:{toggle(){}}}));
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
  assert.match(content.innerHTML,/Gi anerkjennelse/);
  assert.match(content.innerHTML,/Send noe til Maria →/);
  assert.match(content.innerHTML,/Se historikk →/,'den enkle eksisterende historikken er fortsatt tilgjengelig');
  assert.match(content.innerHTML,/seenContributionList/);
  assert.doesNotMatch(content.innerHTML,/Forslag akkurat nå|Hva vil du gjøre\?|Noe annet du satte pris på\?|Noe fint|Flørt|Gi litt rom|Lag en kaffe|Ta oppvasken|En liten fristelse|Siste anerkjennelse/);
  assert.doesNotMatch(content.innerHTML,/poeng|rangering|prosent/i);
  context.FlytSeenUI.openCategory('recognition');
  const manual=content.innerHTML.slice(content.innerHTML.indexOf('<section class="seenSheet seenMessageSheet"'));
  assert.match(manual,/seenMessageSheet/);
  assert.equal((manual.match(/seenMessageChoice/g)||[]).length,4,'manual-sheeten har nøyaktig fire forslag');
  for(const text of ['Tok initiativ','Var tålmodig','Ordnet noe praktisk','Støttet meg'])assert.match(manual,new RegExp(text));
  assert.match(manual,/maxlength="200"/);
  assert.match(manual,/data-seen-send="recognition" disabled/);
  for(const forbidden of ['<div class="ey">Sett</div>','Ga meg rom','Gjorde dagen lettere','Jeg satte pris på at du …','Det kan være noe partneren gjorde'])assert.doesNotMatch(manual,new RegExp(forbidden));
  for(const [kind,choices] of Object.entries({nice:['Tenkte bare på deg ❤️','Du gjør hverdagen finere','Jeg er glad for oss','Ville bare sende noe fint'],flirt:['Du er skikkelig fin','Gleder meg til senere 😏','Tenker på deg','Du er litt uimotståelig'],space:['Jeg tar litt mer i dag','Du kan slappe av litt','Jeg ordner det praktiske','Du trenger ikke prestere noe i dag ❤️']})){
    context.FlytSeenUI.openCategory(kind);
    const message=content.innerHTML.slice(content.innerHTML.indexOf('<section class="seenSheet seenMessageSheet"'));
    assert.equal((message.match(/seenMessageChoice/g)||[]).length,4,`${kind} har nøyaktig fire forslag`);
    assert.match(message,/maxlength="200"/);assert.match(message,/data-seen-send="[^"]+" disabled/);
    for(const choice of choices)assert.match(message,new RegExp(choice.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});
