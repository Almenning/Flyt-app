'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const {KEY,PICTURE,GRIDS,locate}=require('../laer-litt-mer/english-word-games-v1.js');
const openSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const shots=process.env.QA_SCREENSHOTS;
const pwaOffline=process.env.QA_PWA_OFFLINE==='1';
const seed={
 version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Demo English',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
 preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null
};
const oldKeys=['laria-find-words-v1','laria-find-words-active-v1','laria-wordhunt-v1','laria-wordhunt-unfinished-round-v1'];
async function press(page,locator,touch){
 await locator.waitFor({state:'visible'});
 const geometry=await locator.evaluate(el=>{
  const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
  return {x,y,w:r.width,h:r.height,top:r.top,bottom:r.bottom,left:r.left,right:r.right,iw:innerWidth,ih:innerHeight,
   hit:el.contains(document.elementFromPoint(x,y)),gameScroll:el.closest('dialog')?.scrollTop||0};
 });
 const {x,y,w,h,hit,top,bottom,left,right,iw,ih,gameScroll}=geometry;
 assert.ok(w>=44&&h>=44&&hit&&top>=-.5&&bottom<=ih+.5&&left>=-.5&&right<=iw+.5&&gameScroll===0,
  JSON.stringify({geometry,control:await locator.getAttribute('class')}));
 if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
}
async function run(browser,engine,width,height,touch){
 const cn=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch&&Math.min(width,height)<600,
  reducedMotion:'reduce',serviceWorkers:pwaOffline?'allow':'block'});
 try{
  await cn.addInitScript(({seed,oldKeys})=>{
   if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(seed));
   for(const key of oldKeys)if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({sentinel:key}));
   // Browser automation can validate user gesture and language routing but
   // cannot distinguish the actual installed system TTS voice audibly.
   window.qaWords=[];
   Object.defineProperty(window,'speechSynthesis',{value:{
    getVoices:()=>[{lang:'nb-NO',localService:true},{lang:'en-GB',localService:true}],
    cancel:()=>{},speak:u=>window.qaWords.push({text:u.text,lang:u.lang,voice:u.voice?.lang})
   }});
   Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {constructor(text){this.text=text}}});
  },{seed,oldKeys});
  const page=await cn.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(pwaOffline){
   await page.waitForFunction(()=>navigator.serviceWorker?.controller?.state==='activated',null,{timeout:30000});
   // First boot can precede worker control; warm the installed app once.
   await page.reload({waitUntil:'domcontentloaded'});
  }
  const screenshot=async state=>{if(shots)await page.screenshot({path:path.join(shots,engine+'-'+width+'x'+height+'-'+state+'.jpg'),type:'jpeg',animations:'disabled',quality:86})};
  const world=page.locator('#kinnaklova-world[data-ki-art="ready"][data-ki-premium-art="approved"]');
  const dialog=page.locator('dialog.ewg-game[open]');
  const gameNav=()=>world.locator('nav.laria-scene-navigation:visible [data-ki="word-games"]');
  const btn=action=>dialog.locator('[data-ewg="'+action+'"]');
  const word=id=>dialog.locator('[data-ewg-word="'+id+'"]');
  const object=id=>dialog.locator('[data-ewg-object="'+id+'"]');
  const cell=([r,c])=>dialog.locator('[data-r="'+r+'"][data-c="'+c+'"]');
  const status=dialog.locator('#ewg-status');
  const p=locator=>press(page,locator,touch);
  async function firstFold(state){
   const geometry=await dialog.evaluate(el=>{
    const root=el.getBoundingClientRect();
    return {scroll:el.scrollTop,overflow:el.scrollHeight-el.clientHeight,screen:innerHeight,
     clipped:[...el.querySelectorAll('button:not(:disabled):not([hidden])')].flatMap(b=>{
      const r=b.getBoundingClientRect(),hit=b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
      return r.left>=root.left-.5&&r.right<=root.right+.5&&r.top>=root.top-.5&&r.bottom<=root.bottom+.5&&hit?[]:
       [{control:b.dataset.ewg||b.dataset.ewgWord||b.dataset.ewgObject||b.textContent,top:r.top,bottom:r.bottom,hit}];
     })};
   });
   assert.ok(geometry.scroll===0&&geometry.overflow<=1&&geometry.clipped.length===0,state+' before scrolling: '+JSON.stringify(geometry));
  }
  await openSubject(page,'english');
  await world.waitFor({timeout:28000});
  await world.locator('nav.laria-scene-navigation button[data-ki="word-games"]:visible').waitFor();
  const buttons=await world.locator('nav.laria-scene-navigation:visible button').evaluateAll(els=>els.map(el=>el.dataset.ki));
  assert.deepEqual(buttons,['words','sentences','reading','word-games']);
  await screenshot('entry');
  await p(gameNav());
  assert.equal(await dialog.locator('h2').innerText(),'Ordlek');
  await firstFold('game menu');
  await p(btn('picture'));
  assert.equal(await dialog.locator('h2').innerText(),'Find the Words');
  assert.equal(await dialog.locator('.ewg-troll').getAttribute('data-troll'),'lillesoster');
  await dialog.locator('.ewg-landscape').evaluate(img=>img.decode());
  await firstFold('picture opening');
  await p(object('bird'));
  assert.match(await status.innerText(),/Velg et ord først/);
  await p(word('bird'));await p(btn('listen'));
  assert.deepEqual(await page.evaluate(()=>window.qaWords),[{text:'bird',lang:'en-GB',voice:'en-GB'}]);
  await p(object('church'));
  assert.match(await status.innerText(),/Ikke helt/);
  await p(btn('hint'));
  assert.equal(await object('bird').evaluate(e=>e.classList.contains('is-hinted')),true);
  await screenshot('picture');
  for(const id of PICTURE[0]){
   await p(word(id));await p(object(id));
   assert.match(await word(id).innerText(),/✓/);
  }
  assert.equal(await dialog.locator('.ewg-count').innerText(),'4 av 4');
  assert.match(await status.innerText(),/Alle fire/);
  await firstFold('picture success');
  await screenshot('picture-complete');
  await p(btn('next'));
  await firstFold('second picture round');
  assert.equal(await dialog.locator('.ewg-count').innerText(),'0 av 4');
  await p(word('mountain'));await p(object('mountain'));

  await p(btn('back'));await p(btn('grid'));
  assert.equal(await dialog.locator('h2').innerText(),'Word Hunt');
  await firstFold('grid opening');
  await p(btn('listen'));
  assert.equal(await page.evaluate(()=>window.qaWords.at(-1).text),'cat');
  await p(btn('hint'));assert.equal(await dialog.locator('.ewg-letter.is-hinted').innerText(),'C');
  await screenshot('grid');
  for(const [i,id] of GRIDS[0].words.entries()){
   const trace=locate(GRIDS[0],id);
   if(!touch&&i===0){
    const a=await cell(trace[0]).boundingBox(),b=await cell(trace.at(-1)).boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});await page.mouse.up();
    // Real drag synthesizes a click; wait for the click guard before next action.
    await page.waitForTimeout(310);
   }else{
    await p(cell(trace.at(-1)));await p(cell(trace[0]));
   }
   assert.match(await word(id).innerText(),/✓/);
  }
  assert.equal(await dialog.locator('.ewg-count').innerText(),'4 av 4');
  await firstFold('grid success');
  await screenshot('grid-complete');
  await p(btn('back'));await p(btn('back'));
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.dataset.ki==='word-games');
  if(pwaOffline){
   const workerSource=await fs.readFile(path.join(__dirname,'../laer-litt-mer/sw.js'),'utf8');
   const activeCache=workerSource.match(/^const CACHE='([^']+)';/)?.[1];
   assert.ok(activeCache,'current app cache ID not found in service-worker source');
   const cached=await page.evaluate(async current=>{
    const ids=await caches.keys();
    if(!ids.includes(current))return {ids,urls:[]};
    const cache=await caches.open(current);
    return {ids,urls:(await cache.keys()).map(request=>new URL(request.url).pathname)};
   },activeCache);
   for(const name of ['english-word-games-v1.js','english-word-games-v1.css','kinnaklova-ui-free-approved.webp']){
    assert.ok(cached.urls.some(url=>url.endsWith('/'+name)),name+' is not in the current installed app cache: '+JSON.stringify(cached.ids));
   }
   await cn.setOffline(true);
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await openSubject(page,'english');await world.waitFor({timeout:28000});await p(gameNav());await p(btn('picture'));
  assert.equal(await dialog.locator('.ewg-count').innerText(),'1 av 4');
  assert.match(await word('mountain').innerText(),/fjell/);
  await p(btn('back'));await p(btn('grid'));
  assert.equal(await dialog.locator('.ewg-count').innerText(),'4 av 4');
  const storage=await page.evaluate(({key,old})=>[JSON.parse(localStorage.getItem(key)),old.map(k=>JSON.parse(localStorage.getItem(k)))],{key:KEY,old:oldKeys});
  assert.equal(storage[0].picture.completed,1);assert.equal(storage[0].grid.completed,1);
  assert.deepEqual(storage[1],oldKeys.map(sentinel=>({sentinel})));
  assert.deepEqual(errors,[]);
  console.log('PASS',engine,width+'x'+height,'Kinn rail, picture, word grid, TTS routing, '+(pwaOffline?'offline reload under service worker, progress retained':'save/resume'));
 }finally{await cn.close()}
}
(async()=>{
 if(shots)await fs.mkdir(shots,{recursive:true});
 const select=process.env.QA_VIEWPORTS?.split(',');
 const views=[[1440,900,false],[820,1180,true],[1180,820,true],[390,844,true],[844,390,true],[375,667,true],[320,568,true],[667,375,true],[568,320,true]];
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.QA_ENGINE&&process.env.QA_ENGINE!==name)continue;
  for(const [w,h,t] of views.filter(([x,y])=>!select||select.includes(x+'x'+y))){
   const exe=name==='chromium'&&process.env.QA_CHROMIUM_PATH;
   const args=process.env.QA_CHROMIUM_SINGLE==='1'?['--no-sandbox','--no-zygote','--single-process']:['--no-sandbox'];
   const b=await type.launch(exe?{executablePath:exe,args}:{});
   try{await run(b,name,w,h,t)}finally{await b.close()}
  }
 }
})().catch(error=>{console.error(error);process.exitCode=1});
