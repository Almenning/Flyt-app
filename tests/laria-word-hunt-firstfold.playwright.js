'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');

const app=path.resolve(__dirname,'..','laer-litt-mer');
const seed={version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Ordjakt QA',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
  mastery:{},mistakes:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};

function serve(){
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const source=path.resolve(app,'.'+(pathname==='/'?'/index.html':pathname));
  if(!source.startsWith(app+path.sep)){res.writeHead(403).end();return}
  fs.readFile(source,(err,data)=>{
   if(err){res.writeHead(404).end();return}
   res.writeHead(200,{'Content-Type':mime[path.extname(source)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  });
 });
 return new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve(server));
 });
}

async function capture(page,id,selectors){
 const layout=await page.evaluate(selectors=>{
  const overlay=document.querySelector('#word-hunt-overlay');
  const box=e=>{
   const r=e.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   return {w:r.width,h:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
     hit:top===e||e.contains(top)};
  };
  const items={};
  for(const [name,query] of Object.entries(selectors)){
   items[name]=[...overlay.querySelectorAll(query)].filter(e=>e.getClientRects().length).map(box);
  }
  return {height:innerHeight,width:innerWidth,scrollHeight:overlay.scrollHeight,scrollWidth:overlay.scrollWidth,items};
 },selectors);
 const output=process.env.WORD_HUNT_QA_SCREENSHOTS;
 if(output){
  fs.mkdirSync(output,{recursive:true});
  await page.screenshot({path:path.join(output,id+'.png'),animations:'disabled'});
  fs.writeFileSync(path.join(output,id+'.json'),JSON.stringify(layout,null,2));
 }
 console.log(id,JSON.stringify({
  viewport:[layout.width,layout.height],scroll:[layout.scrollWidth,layout.scrollHeight],
  reachable:Object.fromEntries(Object.entries(layout.items).map(([name,boxes])=>[name,
    boxes.filter(r=>r.hit&&r.top>=-1&&r.bottom<=layout.height+1&&r.left>=-1&&r.right<=layout.width+1).length]))
 }));
 return layout;
}

function reachable(layout,name,count,touch=true){
 const boxes=layout.items[name];
 assert.equal(boxes.length,count,name+' missing/cropped or duplicated');
 for(const r of boxes)assert.ok(r.right<=layout.width+1&&r.bottom<=layout.height+1&&
   r.left>=-1&&r.top>=-1&&(!touch||r.hit),name+' outside viewport or blocked: '+JSON.stringify(r));
}
async function tap(page,target){
 const b=await target.boundingBox();
 assert.ok(b,'could not tap target '+target);
 await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
}
async function solve(page,word){
 const p=await page.evaluate(word=>{
  const a=[...document.querySelectorAll('.word-hunt-cell')].reduce((a,el)=>{
    const r=Number(el.dataset.r),c=Number(el.dataset.c);
    (a[r]??=[])[c]=el.textContent;return a;
  },[]);
  for(let r=0;r<a.length;r++)for(let c=0;c<a.length;c++)for(const [dy,dx] of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]){
   if(Array.from(word,(_,i)=>a[r+dy*i]?.[c+dx*i]).join('')===word){
    return [[r,c],[r+dy*(word.length-1),c+dx*(word.length-1)]];
   }
  }
  return null;
 },word);
 assert.ok(p,'authored word not visible in board: '+word);
 for(const [r,c] of p)await tap(page,page.locator('.word-hunt-cell[data-r="'+r+'"][data-c="'+c+'"]'));
}

async function run(browser,size,id,url,withHomeIndicator=false){
 const context=await browser.newContext({viewport:size,hasTouch:true,isMobile:size.width<=430||size.height<=450,
    serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  await context.addInitScript(s=>{
   if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s));
  },seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.openWordHunt==='function');
  // Enter the real picker using the published entry point. No puzzle, solution,
  // progress or rendering data is supplied by this test.
  await page.evaluate(()=>window.openWordHunt());
  const root=page.locator('#word-hunt-overlay');
  // Linux WebKit does not report a hardware home indicator. Separately
  // verify the real game layout with the intended native CSS inset.
  if(withHomeIndicator)await root.evaluate(e=>e.style.setProperty('--wh-safe-bottom','21px'));
  const picker={cards:'.wh-theme-card',close:'.wh-theme-close'};
  const compactPortrait=size.width<=430&&size.height<=730&&size.width<size.height;
  const game={cells:'.word-hunt-cell',targets:'.word-hunt-targets',next:'.word-hunt-new',
    back:'.word-hunt-back',level:'[data-word-level="hard"]',topic:'.word-hunt-theme-mobile,.word-hunt-theme-open',
    hint:'.word-hunt-fox-shortcut,.word-hunt-companion-hint',status:compactPortrait?'.word-hunt-intro':'.word-hunt-companion-speech'};
  const m=await capture(page,id+'-picker',picker);
  if(process.env.WORD_HUNT_AUDIT!=='1'){
   reachable(m,'cards',5); reachable(m,'close',1);
   assert.ok(m.scrollHeight<=size.height+1&&m.scrollWidth<=size.width+1,'theme picker scrolls');
  }
  await tap(page,root.locator('[data-word-theme="mixed"]'));
  const first=await capture(page,id+'-play',game);
  if(process.env.WORD_HUNT_AUDIT!=='1'){
   reachable(first,'cells',36); reachable(first,'next',1);reachable(first,'back',1);
   reachable(first,'level',1);reachable(first,'topic',1); assert.ok(first.items.hint.some(x=>x.hit),'No visible hint control');
   assert.ok(first.scrollHeight<=size.height+1&&first.scrollWidth<=size.width+1,'easy game scrolls');
   assert.ok(first.items.cells.every(x=>x.w>=44&&x.h>=44),'easy cells below 44px');
  }
  if(process.env.WORD_HUNT_AUDIT!=='1'&&size.height<=450){
   await tap(page,root.locator('.word-hunt-fox-shortcut'));
   await page.waitForFunction(()=>document.querySelector('.word-hunt-cell.is-hint-start'));
   const hinted=await capture(page,id+'-hint',game);
   reachable(hinted,'status',1,false);
   reachable(hinted,'next',1);
   assert.ok(hinted.scrollHeight<=size.height+1,'hint pushes game below fold');
  }
  const words=await root.locator('.word-hunt-word').allTextContents();
  if(process.env.WORD_HUNT_AUDIT==='1'){
   // The known baseline can put solution cells outside the viewport.
   // Capture the visual state even if a visible touch can't finish it.
   for(const word of words){ try{await solve(page,word)}catch(_){break} }
  }else{
   await solve(page,words[0]);
   assert.equal(await root.locator('.word-hunt-word.found').count(),1,'First word is not saved');
   if(size.width<=430||size.height<=450){
    const topic=root.locator('.word-hunt-theme-mobile');
    await tap(page,topic);
    const switcher={...picker,start:'.wh-theme-start'};
    const pickerView=await capture(page,id+'-switch-theme',switcher);
    reachable(pickerView,'cards',5); reachable(pickerView,'close',1); reachable(pickerView,'start',1);
    await tap(page,root.locator('.wh-theme-close'));
    assert.equal(await root.locator('.word-hunt-word.found').count(),1,'Canceling theme picker lost a word');
    await tap(page,root.locator('.word-hunt-back'));
    await page.evaluate(()=>window.openWordHunt());
    const resume=await capture(page,id+'-resume',{...picker,start:'.wh-theme-start'});
    reachable(resume,'cards',5);reachable(resume,'start',1);
    await tap(page,root.locator('.wh-theme-start'));
    assert.equal(await root.locator('.word-hunt-word.found').count(),1,'Resuming lost the found word');
   }
   for(const word of words.slice(1))await solve(page,word);
  }
  const finish=await capture(page,id+'-finish',game);
  if(process.env.WORD_HUNT_AUDIT!=='1'){
   assert.equal(await root.locator('.word-hunt-word.found').count(),words.length);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-wordhunt-v1')).rounds),1);
   assert.ok(finish.scrollHeight<=size.height+1&&finish.scrollWidth<=size.width+1,'completion pushes game below fold');
   reachable(finish,'next',1);
   reachable(finish,'status',1,false);
   assert.match(await root.locator(game.status).textContent(),/fant alle ordene/i);
   await tap(page,root.locator('.word-hunt-new'));
   assert.equal(await root.locator('.word-hunt-word.found').count(),0);
   await tap(page,root.locator('[data-word-level="hard"]'));
  }else await root.locator('[data-word-level="hard"]').evaluate(n=>n.click());
  const hard=await capture(page,id+'-hard',game);
  if(process.env.WORD_HUNT_AUDIT!=='1'){
   reachable(hard,'cells',49);reachable(hard,'next',1);
   assert.ok(hard.scrollHeight<=size.height+1&&hard.scrollWidth<=size.width+1,'hard game scrolls');
   assert.ok(hard.items.cells.every(x=>x.w>=28&&x.h>=28),'hard cells cannot be selected reliably');
   assert.deepEqual(errors,[]);
   console.log('PASS Ordjakt first fold '+id);
  }
 }finally{await context.close()}
}

(async()=>{
 const server=await serve();
 try{
  const browserType=process.env.WORD_HUNT_BROWSER==='webkit'?webkit:chromium;
  const executablePath=browserType===chromium?process.env.LARIA_CHROMIUM_PATH:undefined;
  const browser=await browserType.launch({headless:true,executablePath});
  try{
   for(const [width,height] of [[844,390],[667,375],[568,320],[1180,820],[820,1180],[390,844],[375,667],[320,568]]){
    const label=width+'x'+height;
    if(process.env.WORD_HUNT_VIEWPORT&&process.env.WORD_HUNT_VIEWPORT!==label)continue;
    await run(browser,{width,height},browserType.name()+'-'+label,'http://127.0.0.1:'+server.address().port+'/?app=laria');
    if(['844x390','568x320'].includes(label)&&process.env.WORD_HUNT_HOME_INDICATOR==='1')
     await run(browser,{width,height},browserType.name()+'-'+label+'-home-indicator',
      'http://127.0.0.1:'+server.address().port+'/?app=laria',true);
   }
  }finally{await browser.close()}
 }finally{await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
