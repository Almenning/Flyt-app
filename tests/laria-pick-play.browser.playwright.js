'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..'),screens=process.env.PICK_QA_SCREENSHOTS||'/tmp/laria-pick-play';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Elev',avatar:'boy',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
function serve(){return new Promise((resolve,reject)=>{const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost').pathname;if(url.endsWith('/'))url+='index.html';const file=path.resolve(base,'.'+decodeURIComponent(url));if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return}fs.readFile(file,(err,content)=>{if(err){res.writeHead(404);res.end('Missing');return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(content)})});server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}))})}
async function image(page,id){await fs.promises.mkdir(screens,{recursive:true});await page.screenshot({path:path.join(screens,id+'.png'),fullPage:true,animations:'disabled'})}
async function open(page,url){await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.LARIA_MULT_PREMIUM&&window.LARIA_MULT_PICK_PLAY&&window.LARIA_MULT_PICK_ENGINE);await page.evaluate(()=>window.openMultiplicationLab());await page.locator('.mp-menu-explore').click();await page.locator('.mp-explore-screen').waitFor()}
async function pickMode(page){await page.locator('.mp-explore-tab[data-mode="pick"]').click();await page.locator('.mp-pick-screen').waitFor()}
async function snapshot(page){return await page.evaluate(()=>window.LARIA_MULT_PICK_PLAY.snapshot())}
async function layout(page,label){const v=await page.evaluate(()=>({screen:innerWidth,scroll:document.documentElement.scrollWidth,groups:[...document.querySelectorAll('.mp-pick-vessel')].map(x=>({rect:x.getBoundingClientRect().toJSON(),count:x.querySelectorAll('.mp-pick-object').length})),buttons:[...document.querySelectorAll('.mp-pick-vessel-actions button, .mp-pick-main-actions button,.mp-pick-secondary-actions button,.mp-pick-check')].map(x=>({size:x.getBoundingClientRect().height,disabled:x.disabled}))}));assert.ok(v.scroll<=v.screen+4,label+' horizontal page overflow: '+JSON.stringify(v));assert.ok(v.buttons.filter(x=>!x.disabled).every(x=>x.size>=44),label+' undersized primary touch buttons '+JSON.stringify(v.buttons));return v}
async function run(browser,engine,label,viewport,url){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',isMobile:viewport.width<700,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed);
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());await page.route('https://api.worldbank.org/**',r=>r.abort());
 try{
  await open(page,url);
  assert.equal(await page.locator('.mp-explore-tab').first().getAttribute('data-mode'),'table','10x10 must always remain first');
  assert.equal(await page.locator('.mp-grid-cell').count(),100,'100 products must remain visible in the default table');
  await pickMode(page);
  assert.equal(await page.locator('.mp-pick-world-btn').count(),10);
  assert.equal(await page.locator('.mp-pick-vessel').count(),3);
  assert.equal(await page.locator('.mp-pick-object').count(),30);
  assert.match(await page.locator('.mp-pick-equation').innerText(),/3 × 10 = 30/);
  await layout(page,label+' initial');

  // Premium storybook contract: math objects stay interactive atop one richly layered
  // scene; controls are BELOW the illustration and cannot occlude basket contents.
  const gallery=await page.evaluate(()=>{
    const stage=document.querySelector('.mp-pick-stage-v2');
    const painted=stage?.querySelector('.mp-pick-storyscape');
    const boxes=[...document.querySelectorAll('.mp-pick-vessel')].map(v=>{
      const art=v.querySelector('.mp-pick-vessel-art').getBoundingClientRect();
      const buttons=v.querySelector('.mp-pick-vessel-actions').getBoundingClientRect();
      const first=v.querySelector('.mp-pick-object')?.getBoundingClientRect();
      const plaque=v.querySelector('.mp-pick-number').getBoundingClientRect();
      return {top:art.y,bottom:art.bottom,actionsTop:buttons.top,width:art.width,
       plaqueWithinArt:plaque.y>=art.y&&plaque.bottom<=art.bottom+2,
       objectInside:!!first&&first.x>=art.x-2&&first.right<=art.right+2};
    });
    const borderStyle=stage?getComputedStyle(stage):null;
    const frame=stage?.getBoundingClientRect();
    const innerWidth=frame?frame.width-parseFloat(borderStyle.borderLeftWidth)-parseFloat(borderStyle.borderRightWidth):0;
    return {painted:!!painted,numberOfScenicDetails:painted?.querySelectorAll('path,ellipse,circle,rect').length||0,
      stageWidth:frame?.width||0,stageInnerWidth:innerWidth,sceneryWidth:painted?.getBoundingClientRect().width||0,boxes};
  });
  assert.ok(gallery.painted&&gallery.numberOfScenicDetails>95,label+' requires a detailed, actual illustrated storybook landscape '+JSON.stringify(gallery));
  assert.ok(Math.abs(gallery.stageInnerWidth-gallery.sceneryWidth)<3,label+' scenic background must fit INNER stage without stretching: '+JSON.stringify(gallery));
  assert.ok(gallery.boxes.every(x=>x.width>=75&&x.actionsTop>=x.bottom+3&&x.plaqueWithinArt&&x.objectInside),
      label+' all counting controls must be clearly separated from physical containers: '+JSON.stringify(gallery.boxes));
  assert.ok(Math.max(...gallery.boxes.map(x=>x.top))-Math.min(...gallery.boxes.map(x=>x.top))<=3,
      label+' locked 3x10 three baskets must share a row');

  if(engine==='webkit')await image(page,label+'-01-garden-3x10');

  // Children must be able to pick a specific object without attempting
  // to hit a tiny 5-in-a-row fruit in the three-basket overview.
  await page.locator('.mp-pick-vessel[data-group="1"] [data-pick-action="zoom"]').click();
  const zoom=page.locator('.mp-pick-zoom-overlay');
  await zoom.waitFor();
  assert.equal(await zoom.locator('[role="dialog"][aria-modal="true"]').count(),1,label+' zoom is a real accessible dialog');
  assert.equal(await zoom.locator('.mp-pick-zoom-item').count(),10,label+' the closeup must show the same ten objects');
  const closeupBounds=await page.locator('.mp-pick-zoom-item').evaluateAll(items=>items.map(el=>{
    const r=el.getBoundingClientRect();return {w:r.width,h:r.height,visible:r.top>=0&&r.bottom<=innerHeight};
  }));
  assert.ok(closeupBounds.every(x=>x.w>=44&&x.h>=44&&x.visible),
    label+' the enlarged objects must have usable physical touch areas '+JSON.stringify(closeupBounds));
  const paintIds=await page.locator('.mp-pick-screen svg defs [id]').evaluateAll(els=>els.map(el=>el.id));
  assert.equal(new Set(paintIds).size,paintIds.length,
    label+' duplicated SVG paint IDs can break Safari gradients between normal and zoom views');
  const zoomToken=await zoom.locator('.mp-pick-zoom-item').nth(3).getAttribute('data-token');
  assert.equal(await page.locator('.mp-pick-vessel[data-group="1"] .mp-pick-object[data-token="'+zoomToken+'"]').count(),1);
  if(engine==='webkit')await image(page,label+'-03-magnified-basket');
  await zoom.locator('.mp-pick-zoom-item[data-token="'+zoomToken+'"]').click();
  assert.deepEqual((await snapshot(page)).counts,[10,9,10],label+' magnified picking must decrease only chosen basket');
  assert.equal(await page.locator('.mp-pick-object[data-token="'+zoomToken+'"]').count(),0);
  assert.equal(await page.locator('.mp-pick-zoom-item[data-token="'+zoomToken+'"]').count(),0);
  assert.match(await page.locator('.mp-pick-equation').innerText(),/3 × 10 − 1 = 29/);
  await page.locator('.mp-pick-zoom-close').click();
  assert.equal(await page.locator('.mp-pick-zoom-overlay').count(),0,label+' closeup must close');
  await page.locator('[data-pick-action="undo"]').click();
  assert.deepEqual((await snapshot(page)).counts,[10,10,10],label+' undo must restore the enlarged picked object');
  assert.equal(await page.locator('.mp-pick-object[data-token="'+zoomToken+'"]').count(),1);


  assert.equal(await page.locator('.mp-pick-world-emoji svg').count(),10,'all unlocked worlds need matching illustrated thumbnails');
  for(const view of ['rows','numberline','circle','groups']){
    await page.locator('[data-pick-action="view"][data-view="'+view+'"]').click();
    assert.equal(await page.locator('.mp-pick-visualization').getAttribute('data-math-view'),view);
    assert.equal((await snapshot(page)).total,30,'representation must not mutate maths');
    assert.equal(await page.locator('.mp-pick-object').count(),30,'representation must not duplicate countable objects');
    if(view==='rows')assert.equal(await page.locator('.mp-pick-mini-dot').count(),30);
    if(view==='circle')assert.equal(await page.locator('.mp-pick-circle-dot').count(),30);
    if(view==='numberline')assert.equal(await page.locator('.mp-pick-numberline').count(),1);
    if(engine==='webkit'&&label==='iphone-safari'&&view==='numberline')await image(page,label+'-numberline-3x10');
  }

  const selectedToken=await page.locator('.mp-pick-vessel[data-group="1"] .mp-pick-object').first().getAttribute('data-token');
  await page.locator('.mp-pick-vessel[data-group="1"] .mp-pick-object[data-token="'+selectedToken+'"]').click();
  assert.equal(await page.locator('.mp-pick-object[data-token="'+selectedToken+'"]').count(),0,'the tapped item itself should disappear');
  assert.equal(await page.locator('.mp-pick-collection-art svg').count(),1,'picked item should appear in the collection');
  assert.deepEqual((await snapshot(page)).counts,[10,9,10]);
  assert.equal(await page.locator('.mp-pick-object[data-token="'+selectedToken+'"]' ).count(),0,'redo should remove the same item');
  assert.equal((await snapshot(page)).collected,1);
  assert.match(await page.locator('.mp-pick-equation').innerText(),/3 × 10 − 1 = 29/);
  await page.locator('[data-pick-action="undo"]').click();
  assert.deepEqual((await snapshot(page)).counts,[10,10,10]);
  assert.equal(await page.locator('.mp-pick-object[data-token="'+selectedToken+'"]' ).count(),1,'undo should restore the same item');
  await page.locator('[data-pick-action="redo"]').click();
  assert.deepEqual((await snapshot(page)).counts,[10,9,10]);
  await page.locator('[data-pick-action="return"][data-group="1"]').click();
  await page.locator('[data-pick-action="takeEach"]').click();
  assert.deepEqual((await snapshot(page)).counts,[9,9,9]);
  assert.match(await page.locator('.mp-pick-equation').innerText(),/3 × 9 = 27/);
  await page.locator('[data-pick-action="moveMode"]').click();
  await page.locator('.mp-pick-vessel[data-group="0"] .mp-pick-object').first().click();
  await page.locator('.mp-pick-vessel[data-group="1"] [data-pick-action="moveTarget"]').click();
  assert.deepEqual((await snapshot(page)).counts,[8,10,9]);
  assert.match(await page.locator('.mp-pick-equation').innerText(),/8 \+ 10 \+ 9 = 27/);
  const worlds=['strawberry','bun','mushroom','apple','treasure','train','beach','farm','aquarium','balloon'];
  for(const world of worlds){
    await page.locator('.mp-pick-world-btn[data-world="'+world+'"]').click();
    assert.equal(await page.locator('.mp-pick-screen').getAttribute('data-pick-world'),world);
    assert.equal((await snapshot(page)).total,27,'world switch changed multiplication');
    assert.equal(await page.locator('.mp-pick-object').count(),27,'world art count differs from maths');
    if(engine==='webkit'){
      await layout(page,label+' world '+world);
      assert.ok(await page.locator('.mp-pick-storyscape').count(),label+' '+world+' requires actual storybook scenery');
      const details=await page.locator('.mp-pick-storyscape').evaluate(el=>el.querySelectorAll('path,ellipse,circle,rect').length);
      assert.ok(details>50,label+' '+world+' scenery too simple: '+details);
      if(label==='iphone-safari'||label==='ipad-safari')await image(page,label+'-world-'+world);
    }
  }
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.LARIA_MULT_PICK_PLAY&&window.LARIA_MULT_PREMIUM);
  await page.evaluate(()=>window.openMultiplicationLab());
  await page.locator('.mp-menu-explore').click();await pickMode(page);
  assert.equal((await snapshot(page)).world,'balloon','world did not persist across reload');
  assert.deepEqual((await snapshot(page)).counts,[8,10,9],'counts did not persist across reload');
  assert.equal((await snapshot(page)).itemIds.reduce((total,arr)=>total+arr.length,0),27,'stable item IDs must persist consistently');
  await page.locator('[data-pick-action="mission"][data-id="twentyfour"]').click();
  for(let i=0;i<6;i++)await page.locator('.mp-pick-vessel[data-group="0"] .mp-pick-vessel-actions [data-pick-action="take"]').click();
  assert.equal((await snapshot(page)).total,24);
  await page.locator('[data-pick-action="check"]').click();
  assert.equal((await snapshot(page)).success,true);
  await page.locator('[data-pick-action="mission"][data-id="equal"]').click();
  assert.deepEqual((await snapshot(page)).counts,[10,8,10]);
  for(let i=0;i<2;i++)await page.locator('[data-pick-action="return"][data-group="1"]').click();
  await page.locator('[data-pick-action="check"]').click();
  assert.equal((await snapshot(page)).success,true);
  await page.locator('[data-pick-action="mission"][data-id="empty"]').click();
  await page.locator('.mp-pick-vessel[data-group="2"] [data-pick-action="empty"]').click();
  assert.match(await page.locator('.mp-pick-equation').innerText(),/2 × 10 = 20/);
  await page.locator('[data-pick-action="check"]').click();
  assert.equal((await snapshot(page)).success,true);
  await page.locator('[data-pick-action="mission"][data-id="twoWays"]').click();
  await page.locator('[data-pick-action="check"]').click();
  assert.deepEqual((await snapshot(page)).found,['3x6']);
  for(const dest of [0,0,0,1,1,1]){
    await page.locator('[data-pick-action="moveMode"]').click();
    await page.locator('.mp-pick-vessel[data-group="2"] .mp-pick-object').first().click();
    await page.locator('.mp-pick-vessel[data-group="'+dest+'"] [data-pick-action="moveTarget"]').click();
  }
  assert.deepEqual((await snapshot(page)).counts,[9,9,0]);
  await page.locator('[data-pick-action="check"]').click();
  assert.equal((await snapshot(page)).success,true,'second multiplication expression not recognized');
  assert.deepEqual((await snapshot(page)).found,['3x6','2x9']);
  await page.locator('[data-pick-action="reset"]').click();
  assert.deepEqual((await snapshot(page)).counts,[10,10,10]);
  assert.equal((await snapshot(page)).mission,null,'reset must leave challenge mode');
  await layout(page,label+' after reset');
  // Drag the actual rendered item, rather than only using the accessible touch fallback.
  const fruit=page.locator('.mp-pick-vessel[data-group="0"] .mp-pick-object').first();
  const movedId=await fruit.getAttribute('data-token');
  const destination=page.locator('.mp-pick-vessel[data-group="1"]');
  // Mission controls left the page scrolled to the bottom; raw mouse coordinates
  // do not auto-scroll. Move both containers into the viewport before dragging.
  await fruit.scrollIntoViewIfNeeded();
  await destination.scrollIntoViewIfNeeded();
  const sourceRect=await fruit.boundingBox();
  const destRect=await destination.boundingBox();
  assert.ok(sourceRect&&destRect,label+' must expose draggable physical items');
  assert.ok(sourceRect.y>=-1&&sourceRect.y+sourceRect.height<=viewport.height+1,
    label+' source fruit must be on screen before synthetic drag: '+JSON.stringify(sourceRect));
  await page.evaluate(()=>{
    window.__pickTrace=[];
    for(const type of ['pointerdown','pointerup','pointercancel'])
      document.addEventListener(type,e=>window.__pickTrace.push({type,x:Math.round(e.clientX),y:Math.round(e.clientY),pointerId:e.pointerId,target:e.target?.className?.baseVal||e.target?.className||''}),true);
  });
  await page.mouse.move(sourceRect.x+sourceRect.width/2,sourceRect.y+sourceRect.height/2);
  await page.mouse.down();
  await page.mouse.move(destRect.x+destRect.width/2,destRect.y+Math.min(40,destRect.height/3),{steps:9});
  await page.mouse.up();
  const pointerTrace=await page.evaluate(()=>window.__pickTrace);
  assert.deepEqual((await snapshot(page)).counts,[9,11,10],label+' must move exactly one item when dragged; trace: '+JSON.stringify(pointerTrace));
  assert.equal(await page.locator('.mp-pick-vessel[data-group="1"] .mp-pick-object[data-token="'+movedId+'"]').count(),1,label+' dragged item must retain its identity');
  assert.equal((await snapshot(page)).total,30,'dragging must not alter the total');

  if(engine==='webkit'&&(label==='iphone-safari'||label==='ipad-safari'))await image(page,label+'-02-missions-finished');
  await page.locator('.mp-explore-tab[data-mode="table"]').click();
  assert.equal(await page.locator('.mp-grid-cell').count(),100,'new activity damaged 10x10 table');
  assert.deepEqual(errors,[],label+' runtime errors');
  console.log('PASS Plukk og tell '+engine+' '+label+' 10 worlds, correct maths, 4 missions, persistence, Safari touch');
 }finally{await context.close()}
}
(async()=>{const {server,url}=await serve();try{for(const [engine,launcher,devices] of [['chromium',chromium,[['iphone',{width:390,height:844}],['ipad',{width:820,height:1180}]]],['webkit',webkit,[['iphone-safari',{width:390,height:844}],['ipad-safari',{width:820,height:1180}]]]]){const browser=await launcher.launch({headless:true});try{for(const [name,viewport] of devices)await run(browser,engine,name,viewport,url)}finally{await browser.close()}}console.log('PASS Plukk og tell browser matrix')}finally{await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
