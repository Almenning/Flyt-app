'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const url=new URL(process.env.QA_URL||'http://127.0.0.1:8793/laer-litt-mer/?app=laria');
url.searchParams.delete('lariaTrollbutikk');
const root=process.env.TROLLBUTIKKEN_SCREENSHOTS;
const matrix=process.env.TB_LAYOUT_ONLY==='1'?[
 ['ipad-13-tall',1024,1366,true,'storesoster'],['ipad-13-wide',1366,1024,true,'lillesoster'],
 ['ipad-4x3',1024,768,true,'lillebror'],['phone-375',375,667,true,'storesoster'],
 ['phone-393',393,852,true,'lillesoster'],['phone-430',430,932,true,'lillebror'],
 ['desktop-small',1280,720,false,'storesoster'],['desktop-large',1920,1080,false,'lillebror']
]:[
 ['ipad-wide',1180,820,true,'storesoster'],['ipad-tall',820,1180,true,'lillesoster'],
 ['phone-tall',390,844,true,'lillebror'],['phone-wide',844,390,true,'storesoster'],
 ['phone-compact-wide',667,375,true,'storesoster'],['phone-micro-wide',568,320,true,'storesoster'],
 ['desktop',1440,900,false,'storesoster']
];
async function run(type,browser,[name,width,height,hasTouch,troll]){
 if(process.env.TB_VIEW&&process.env.TB_VIEW!==name)return;
 const recordVideo=process.env.TB_VIDEO?{dir:process.env.TB_VIDEO,size:{width,height}}:undefined;
 const context=await browser.newContext({viewport:{width,height},hasTouch,reducedMotion:'reduce',serviceWorkers:'block',recordVideo});
 await context.addInitScript(troll=>{if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify({
   version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',tallvikaTroll:troll,setupVersion:2},
   mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
   lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{},chapterProgress:{}},answerLog:[],sessionLog:[],activeSession:null
 }));},troll);
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const shop=page.locator('#trollbutikken-screen.active');
 const button=(id,attr='')=>shop.locator('[data-tb-action="'+id+'"]'+attr);
 const directTouch=type==='webkit'&&width<=667&&width>height;
 const tapControl=async(control,id)=>{
  if(directTouch||name==='phone-micro-wide'||width>height&&height<=460&&['add','remove','basket','trip-check','stock-add','stock-remove','stock-check','stock-next','next','hint'].includes(id)){
   const point=await control.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const hit=el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
    return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,hit,viewport:innerHeight,
      scrolled:document.getElementById('trollbutikken-screen').scrollTop,
      panels:[...document.querySelectorAll('#trollbutikken-screen :is(.tb-order,.tb-shelf,.tb-basket,.tb-helper)')].map(panel=>{
       const q=panel.getBoundingClientRect();return [panel.className,Math.round(q.top),Math.round(q.height)];
      })};
   });
   assert.ok(point.w>=44&&point.h>=44&&point.y>=0&&point.bottom<=point.viewport+1&&point.hit&&point.scrolled===0,
    name+' '+id+' must work before scrolling: '+JSON.stringify(point));
   if(directTouch){await page.touchscreen.tap(point.x+point.w/2,point.y+point.h/2);return}
  }
  await control.click();
 };
 const tap=(id,attr='')=>tapControl(button(id,attr),id);
 const moveCoin=async(n,valid=true,withTouch=false)=>{
   const source=button('coin','[data-tb-coin="'+n+'"]');
   const target=valid?shop.locator('[data-tb-drop="cash"]'):shop.locator('.tb-wallet');
   const a=await source.boundingBox(),b=await target.boundingBox();
   const from={x:a.x+a.width/2,y:a.y+a.height/2},to={x:b.x+b.width-18,y:b.y+b.height/2};
   if(withTouch){
     const cdp=await context.newCDPSession(page);
     const send=(type,point)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:point?[point]:[]});
     await send('touchStart',from);
     for(let i=1;i<=6;i++)await send('touchMove',{x:from.x+(to.x-from.x)*i/6,y:from.y+(to.y-from.y)*i/6});
     if(valid)assert.equal(await shop.locator('.tb-cashtray').evaluate(e=>e.classList.contains('tb-over')),true);
     await send('touchEnd',null);await cdp.detach();
   }else{
     await page.mouse.move(from.x,from.y);await page.mouse.down();
     await page.mouse.move(to.x,to.y,{steps:8});
     if(valid)assert.equal(await shop.locator('.tb-cashtray').evaluate(e=>e.classList.contains('tb-over')),true);
     await page.mouse.up();
   }
   assert.equal(await shop.locator('.tb-ghost').count(),0);
 };
 const price=shop.getByLabel('Varene koster, hele kroner');
 const confirmPrice=shop.locator('[data-tb-price-confirm]');
 const phase=title=>shop.getByRole('heading',{name:title,exact:true}).waitFor();
 const shot=async sequence=>{
   if(!root)return;
   fs.mkdirSync(root,{recursive:true});
   await page.screenshot({path:path.join(root,type+'-'+name+'-'+sequence+'.png'),animations:'disabled'});
 };
 const enter=async()=>{
   // Keep keyboard coverage for entering from the narrow WebKit Home. Other
   // shapes still use the actual pointer entry; game controls remain hit-tested.
   await openHomeSubject(page,'math',{keyboard:type==='webkit'&&width<=667&&width>height});
   const nav=page.locator('#tallvika-world .tv-sign-nav');
   await nav.locator('[data-tv="shop"]').waitFor();
   if(width>=768&&width<=1366&&height>=650)
    await nav.locator('[data-tv="shop"].laria-premium-sign .laria-premium-sign-face').waitFor({timeout:25000});
   const rects=await nav.getByRole('button').evaluateAll(items=>items.map(i=>{
     const {x,y,width,height}=i.getBoundingClientRect();return {id:i.dataset.tv,x,y,width,height};}));
   assert.deepEqual(rects.filter(r=>r.id!=='next').map(r=>r.id),['multiply','fraction','table','shop']);
   assert.ok(rects.every((r,i)=>r.width>=44&&r.height>=44&&(!i||r.y>=rects[i-1].y+rects[i-1].height-1)),JSON.stringify(rects));
   await shot('00-tallvika');
   const shopSign=nav.locator('[data-tv="shop"]');
   if(type==='webkit'&&width<=667&&width>height){
    assert.ok(await shopSign.evaluate(el=>{
     const r=el.getBoundingClientRect();
     return r.height>=44&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
    }),'the compact Tallvika sign must be visibly reachable');
    await shopSign.press('Enter');
   }else await shopSign.click();
   await shop.waitFor();
 };
 const runTrip=async()=>{
  const ownerSnapshot=await page.evaluate(()=>localStorage.getItem('laria-trollbutikken-v1'));
  await tap('trip');await phase('På handletur');await shot('10-trip-shopping-list');
  assert.match(await shop.locator('.tb-tripLedger').innerText(),/30 kr/);
  assert.equal(await shop.locator('[data-tb-actor="helper"]').getAttribute('data-troll'),troll);
  const shopping={apple:2,bread:1,milk:1};
  for(const [id,n] of Object.entries(shopping))for(let i=0;i<n;i++)await tap('add','[data-tb-id="'+id+'"]');
  assert.match(await shop.locator('.tb-tripLedger').innerText(),/28 kr/);
  await tap('add','[data-tb-id="apple"]');await tap('trip-check');
  assert.match(await shop.locator('#tb-helper-copy').innerText(),/mer enn du har/);await shot('10b-trip-budget-retry');
  await tap('hint');assert.equal(await shop.locator('[data-tb-actor="helper"]').getAttribute('data-laria-troll-mood'),'hint');
  assert.match(await shop.locator('.tb-tripOver').innerText(),/3 kr/);await shot('11-trip-over-budget');
  await tap('remove','[data-tb-id="apple"]');
  await tap('remove','[data-tb-id="milk"]');await tap('trip-check');
  assert.match(await shop.locator('#tb-helper-copy').innerText(),/akkurat/);
  await tap('add','[data-tb-id="milk"]');await tap('trip-check');await phase('Betal for varene');
  assert.notEqual(await shop.locator('[data-tb-actor="seller"]').getAttribute('data-troll'),troll);
  if((name==='phone-micro-wide'||name==='phone-compact-wide'))await tap('hint');
  if(name==='ipad-wide')await moveCoin(2000,true,type==='chromium');
  else await tap('coin','[data-tb-coin="2000"]');
  assert.equal(await button('coin','[data-tb-coin="2000"]').isDisabled(),true);
  assert.equal(await shop.locator('.tb-trayCoins button').count(),1);
  await tap('coin','[data-tb-coin="500"]');await tap('trip-pay');
  assert.match(await shop.locator('#tb-helper-copy').innerText(),/dekker ikke/);
  if((name==='phone-micro-wide'||name==='phone-compact-wide')){
   const hintBeforeFold=await shop.locator('#tb-helper-copy').evaluate(el=>{
    const {top,bottom}=el.getBoundingClientRect();return top>=0&&bottom<=innerHeight;
   });
   assert.equal(hintBeforeFold,true,'payment correction must be readable without scrolling');
  }
  if(name==='ipad-wide'){
   await page.setViewportSize({width:height,height:width});
   assert.match(await shop.locator('.tb-sum').innerText(),/25 kr/);
   await page.setViewportSize({width,height});
  }
  await tap('resume');
  assert.equal(await page.evaluate(()=>localStorage.getItem('laria-trollbutikken-v1')),ownerSnapshot);
  if(name==='ipad-wide'){
   await page.reload();
   await enter();
  }
  await tap('trip');await phase('Betal for varene');
  assert.match(await shop.locator('.tb-sum').innerText(),/25 kr/);
  for(let i=0;i<5;i++)await tap('coin','[data-tb-coin="100"]');
  assert.equal(await button('coin','[data-tb-coin="100"]').isDisabled(),true);
  assert.match(await shop.locator('.tb-sum').innerText(),/30 kr/);
  const singles=button('uncoin').filter({hasText:'×5'});
  await tapControl(singles,'uncoin');
  assert.match(await shop.locator('.tb-sum').innerText(),/29 kr/);
  assert.equal(await button('coin','[data-tb-coin="100"]').isEnabled(),true);
  await tap('coin','[data-tb-coin="100"]');
  if((name==='phone-micro-wide'||name==='phone-compact-wide')){
   const v=await shop.locator('.tb-sum').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,height:innerHeight,
      scrolled:document.getElementById('trollbutikken-screen').scrollTop};
   });
   assert.ok(v.top>=0&&v.bottom<=v.height&&v.scrolled===0,'payment total must remain before scrolling: '+JSON.stringify(v));
  }
  await shot('12-trip-wallet');await tap('trip-pay');await phase('Handleturen er ferdig');
  assert.match(await shop.locator('.tb-receipt').innerText(),/30 kr − 28 kr = 2 kr igjen/);
  assert.match(await shop.locator('.tb-receipt .tb-ledger').innerText(),/Du fikk tilbake\s+2 kr/);
  await shot('13-trip-receipt');
  await tap('trip-next');await phase('På handletur');
  assert.match(await shop.locator('.tb-tripCard').innerText(),/tre forskjellige/);
  for(const id of ['apple','bread','berry'])await tap('add','[data-tb-id="'+id+'"]');
  await tap('trip-check');await phase('Betal for varene');
  for(const denomination of [100,500,1000,2000])await tap('coin','[data-tb-coin="'+denomination+'"]');
  assert.match(await shop.locator('.tb-sum').innerText(),/36 kr/);
  await shot('14-trip-all-denominations');
  assert.equal(await button('uncoin').count(),4);
  await tapControl(button('uncoin').last(),'uncoin');
  assert.match(await shop.locator('.tb-sum').innerText(),/16 kr/);
  await tap('coin','[data-tb-coin="2000"]');
  const penny=button('uncoin','[data-tb-coin="100"]');
  await penny.press('Enter');
  assert.equal(await button('coin','[data-tb-coin="100"]').evaluate(el=>el===document.activeElement),true);
  await tap('coin','[data-tb-coin="100"]');
  for(let i=0;i<3;i++)await tapControl(button('uncoin').first(),'uncoin');
  assert.match(await shop.locator('.tb-sum').innerText(),/20 kr/);
  await tap('trip-pay');await phase('Handleturen er ferdig');
  assert.match(await shop.locator('.tb-receipt').innerText(),/40 kr − 18 kr = 22 kr igjen/);
  assert.match(await shop.locator('.tb-receipt .tb-ledger').innerText(),/Du fikk tilbake\s+2 kr/);
  const savedTrip=await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-trollbutikken-customer-v1')));
  assert.equal(savedTrip.completed,2);
  await tap('resume');
  assert.equal(await page.evaluate(()=>localStorage.getItem('laria-trollbutikken-v1')),ownerSnapshot);
 };
 const runWarehouse=async()=>{
  const snapshots=await page.evaluate(()=>['laria-trollbutikken-v1','laria-trollbutikken-customer-v1'].map(key=>localStorage.getItem(key)));
  await tap('warehouse');await phase('Hjelp på lageret');
  assert.equal(await shop.locator('.tb-stockSource .tb-goodsRow>span').count(),12);
  await tap('stock-check');assert.match(await shop.locator('#tb-helper-copy').innerText(),/Tell én/);
  for(let i=0;i<5;i++)await tap('stock-add','[data-tb-index="0"]');
  assert.equal(await shop.locator('.tb-stockBins>section').first().locator('.tb-goodsRow>span').count(),5);
  await tap('hint');
  assert.equal(await shop.locator('[data-tb-actor="helper"]').getAttribute('data-laria-troll-mood'),'hint');
  await tap('stock-remove','[data-tb-index="0"]');
  for(const index of [1,2])for(let i=0;i<4;i++)await tap('stock-add','[data-tb-index="'+index+'"]');
  assert.equal(await shop.locator('.tb-stockSource .tb-goodsRow>span').count(),0);
  assert.deepEqual(await shop.locator('.tb-stockBins>section').evaluateAll(bins=>bins.map(el=>el.querySelectorAll('.tb-goodsRow>span').length)),[4,4,4]);
  await shot('14-warehouse-baskets');await tap('stock-check');await phase('Leveransen er på plass');
  await tap('stock-next');await phase('Hjelp på lageret');
  assert.equal(await shop.locator('.tb-stockBin .tb-goodsRow>span').count(),6);
  for(let i=0;i<4;i++)await tap('stock-add','[data-tb-index="0"]');
  assert.equal(await shop.locator('.tb-stockSource .tb-goodsRow>span').count(),4);
  await tap('resume');await tap('warehouse');
  assert.equal(await shop.locator('.tb-stockBin .tb-goodsRow>span').count(),10);
  await tap('stock-check');await phase('Leveransen er på plass');await shot('15-warehouse-shelf');
  await tap('resume');
  assert.deepEqual(await page.evaluate(()=>['laria-trollbutikken-v1','laria-trollbutikken-customer-v1'].map(key=>localStorage.getItem(key))),snapshots);
 };
 try{
  await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:90000});
  if(name==='ipad-wide'&&process.env.TB_LAYOUT_ONLY!=='1'&&!process.env.TB_DEMO_CUT){
   const world=page.locator('#subject-screen.active #tallvika-world');
   const destinations=()=>world.locator('.tv-sign').evaluateAll(els=>els.map(e=>e.dataset.tv));
   const original=['multiply','fraction','table'];
   const chooseGrade=async n=>{
    await world.locator('[data-tv="grade"]').click();
    await world.locator('[data-tv-grade="'+n+'"]').click();
   };
   const gradeStatus=()=>page.evaluate(()=>[window.LARIA_TALLVIKA_BRIDGE.currentGrade(),window.LARIA_TALLVIKA_BRIDGE.journeyViewGrade('math')]);
   await openHomeSubject(page,'math');
   assert.deepEqual(await destinations(),[...original,'shop'],'2nd grade must show the standard game entrance');
   for(const outside of [1,3]){
    await chooseGrade(outside);
    assert.deepEqual(await destinations(),original);
    assert.deepEqual(await gradeStatus(),[2,outside]);
    assert.equal(await page.evaluate(()=>window.LARIA_TROLLBUTIKKEN.open()),false,'alternate-grade entry guard');
    assert.equal(await shop.count(),0);
   }
   const optin=new URL(url);optin.searchParams.set('lariaTrollbutikk','1');
   await page.goto(optin.href,{waitUntil:'domcontentloaded',timeout:90000});
   await openHomeSubject(page,'math');
   assert.deepEqual(await gradeStatus(),[2,3]);
   assert.deepEqual(await destinations(),[...original,'shop'],'explicit preview still works when 3rd grade is shown');
   await chooseGrade(2);
   const optout=new URL(url);optout.searchParams.set('lariaTrollbutikk','0');
   await page.goto(optout.href,{waitUntil:'domcontentloaded',timeout:90000});
   await openHomeSubject(page,'math');
   assert.deepEqual(await gradeStatus(),[2,2]);
   assert.deepEqual(await destinations(),original,'explicit opt-out must restore original Tallvika');
   assert.equal(await page.evaluate(()=>window.LARIA_TROLLBUTIKKEN),undefined);
   assert.equal(await shop.count(),0);
   await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:90000});
  }
  await enter();
  if(process.env.TB_LAYOUT_ONLY==='1'){
   const inspect=async()=>{
    const result=await shop.evaluate(el=>{
     const buttons=[...el.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height];});
     return {scroll:el.scrollWidth,width:el.clientWidth,buttons};
    });
    assert.ok(result.scroll<=result.width+1&&result.buttons.every(([w,h])=>w>=44&&h>=44),JSON.stringify(result));
   };
   await tap('trip');await phase('På handletur');await inspect();
   for(const [id,n] of [['apple',2],['bread',1],['milk',1]])for(let i=0;i<n;i++)await tap('add','[data-tb-id="'+id+'"]');
   await tap('trip-check');await phase('Betal for varene');await inspect();
   await tap('coin','[data-tb-coin="2000"]');
   await tap('resume');await tap('warehouse');await phase('Hjelp på lageret');await inspect();
   await tap('stock-add','[data-tb-index="2"]');
   assert.equal(await shop.locator('.tb-stockBins section').nth(2).locator('.tb-goodsRow>span').count(),1);
   assert.deepEqual(errors,[]);
   console.log(type,name,width+'×'+height,'reachable sign, shop, wallet, warehouse and target geometry passed');
   return;
  }
  if(process.env.TB_WAREHOUSE_ONLY==='1'){
   await runWarehouse();assert.deepEqual(errors,[]);
   console.log(type,name,width+'×'+height,'warehouse, grouping, subtraction, correction and separate state passed');
   return;
  }
  if(process.env.TB_TRIP_ONLY==='1'){
   await runTrip();
   assert.deepEqual(errors,[]);
   console.log(type,name,width+'×'+height,'handletur, stock, budget, payment, receipt and separate resume passed');
   return;
  }
  await phase('Velkommen til Trollbutikken');
  if(name==='phone-micro-wide'||name==='phone-compact-wide'){
   const welcome=await shop.locator('.tb-start button').evaluateAll(items=>items.map(el=>{
    const r=el.getBoundingClientRect();
    return {action:el.dataset.tbAction,w:r.width,h:r.height,top:r.top,bottom:r.bottom,
      viewport:innerHeight,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
   }));
   assert.deepEqual(welcome.map(x=>x.action),['start','trip','warehouse','free']);
   assert.ok(welcome.every(x=>x.w>=44&&x.h>=44&&x.top>=0&&x.bottom<=x.viewport&&x.hit),
    name+' welcome modes must work without scrolling: '+JSON.stringify(welcome));
  }
  await shot('01-entry');await tap('start');
  await phase('Plukk varer');
  await page.waitForFunction(()=>[...document.querySelectorAll('#trollbutikken-screen.active .tb-product img')].every(img=>img.complete&&img.naturalWidth>0));
  assert.deepEqual(await shop.locator('.tb-shelfRow').evaluateAll(rows=>rows.map(row=>row.querySelectorAll('button').length)),[3,3]);
  assert.match(await shop.locator('.tb-room').evaluate(el=>getComputedStyle(el).backgroundImage),/shop-interior-review-v1\.webp/);
  await shot('02-order');
  const layout=await shop.evaluate(el=>({w:el.clientWidth,scroll:el.scrollWidth,buttons:[...el.querySelectorAll('button')].map(b=>[b.getBoundingClientRect().width,b.getBoundingClientRect().height])}));
  assert.ok(layout.scroll<=layout.w+1,JSON.stringify(layout));
  assert.ok(layout.buttons.every(([w,h])=>w>=44&&h>=44),JSON.stringify(layout));
  assert.equal(await shop.locator('[data-tb-actor="helper"]').getAttribute('data-troll'),troll);
  assert.notEqual(await shop.locator('[data-tb-actor="customer"]').getAttribute('data-troll'),troll);
  await tap('add','[data-tb-id="carrot"]');await tap('basket');
  assert.match(await shop.locator('#tb-helper-copy').innerText(),/handlelappen/);
  await tap('hint');assert.match(await shop.locator('#tb-helper-copy').innerText(),/handlelappen/);
  assert.equal(await shop.locator('[data-tb-actor="helper"]').getAttribute('data-laria-troll-mood'),'hint');
  await shot('03-hint');
  await tap('remove','[data-tb-id="carrot"]');
  if(name==='ipad-wide'){
   const fruit=await button('add','[data-tb-id="apple"]').boundingBox(),drop=await shop.locator('[data-tb-drop]').boundingBox();
   await page.mouse.move(fruit.x+fruit.width/2,fruit.y+fruit.height/2);
   await page.mouse.down();await page.mouse.move(drop.x+drop.width/2,drop.y+drop.height/2,{steps:12});await page.mouse.up();
   assert.match(await shop.locator('.tb-basketLine').innerText(),/1 eple/);
  }else await tap('add','[data-tb-id="apple"]');
  await tap('add','[data-tb-id="apple"]');
  await tap('add','[data-tb-id="apple"]');
  await tap('add','[data-tb-id="bread"]');
  await tap('add','[data-tb-id="bread"]');
  assert.equal(await shop.locator('.tb-basketContents img').count(),5);
  assert.deepEqual(await shop.locator('.tb-basketItemName').allTextContents(),['3 epler','2 brød']);
  assert.match(await shop.locator('.tb-basketHead').innerText(),/5 varer/);
  assert.doesNotMatch(await shop.locator('.tb-basketWork').innerText(),/kr/);
  assert.ok(await shop.locator('.tb-remove').evaluateAll(items=>items.every(i=>i.offsetWidth>=44&&i.offsetHeight>=44)));
  await shot('04-filled');
  await tap('basket');await phase('Tell i kassen');
  assert.equal(await shop.locator('.tb-cashMachine .tb-brassCrown').count(),1);
  assert.equal(await shop.locator('.tb-cashMachine img').count(),0);
  assert.equal(await shop.locator('.tb-cashMachine button').count(),12);
  assert.ok(await shop.locator('.tb-machineKeys button').evaluateAll(keys=>keys.every(key=>{
    const r=key.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return r.width>=44&&r.height>=44&&key.contains(hit);
  })),'Every key is a visible 44px control and owns its center');
  assert.equal(await shop.locator('.tb-merchBackdrop button').count(),0);
  await tap('scan','[data-tb-id="apple"]');await tap('scan','[data-tb-id="bread"]');
  assert.equal(await price.inputValue(),'');
  assert.doesNotMatch(await shop.locator('.tb-sceneTill').innerText(),/35 kr/);
  await tapControl(confirmPrice,'confirmPrice');assert.match(await shop.locator('#tb-helper-copy').innerText(),/hele kroner/);
  await price.fill('3,5');assert.equal(await price.inputValue(),'');
  assert.equal(await shop.locator('.tb-counterWorld [data-tb-actor="customer"]').count(),1);
  const firstKey=button('keypad','[data-tb-key="3"]');
  const keyBox=await firstKey.boundingBox();
  await page.mouse.move(keyBox.x+keyBox.width/2,keyBox.y+keyBox.height/2);
  await page.mouse.down();
  assert.equal(await firstKey.locator('.tb-keycap').evaluate(cap=>new DOMMatrix(getComputedStyle(cap).transform).m42),3,
    'holding the actual key depresses its brass cap');
  assert.equal(await price.inputValue(),'','a hold does not enter a digit early');
  await page.mouse.up();
  assert.equal(await price.inputValue(),'3');
  if(hasTouch){
    const zero=await button('keypad','[data-tb-key="0"]').boundingBox();
    await page.touchscreen.tap(zero.x+zero.width/2,zero.y+zero.height/2);
  }else await tap('keypad','[data-tb-key="0"]');
  assert.equal(await price.inputValue(),'30');
  await tapControl(confirmPrice,'confirmPrice');
  assert.match(await shop.locator('#tb-helper-copy').innerText(),/for lav/);
  assert.equal(await price.inputValue(),'30');
  assert.equal(await shop.locator('.tb-scan[aria-pressed="true"]').count(),2);
  await tap('hint');assert.equal(await price.inputValue(),'30');
  await tap('keypad','[data-tb-key="del"]');await tap('keypad','[data-tb-key="5"]');
  assert.equal(await price.inputValue(),'35');
  assert.match(await shop.locator('[data-tb-price-display]').innerText(),/35 kr/);
  await shot('05-register');
  await price.press('Enter');await phase('Gi tilbake veksel');
  assert.match(await shop.locator('.tb-banknote').innerText(),/50 kr/);
  assert.match(await shop.locator('.tb-counterTotal').innerText(),/35 kr/);
  assert.match(await shop.locator('.tb-handOff [data-tb-drop="cash"]').getAttribute('aria-label'),/^Veksel til /);
  if(name==='phone-tall'){
   const controls=shop.locator('.tb-handOff button,.tb-cashDrawer button');
   for(const control of await controls.all()){
    const box=await control.boundingBox();
    assert.ok(box&&box.width>=44&&box.height>=44&&box.y+box.height<=height,'coin interaction visible and reachable without scrolling');
   }
  }
  await tap('coin','[data-tb-coin="2000"]');await tap('settle');assert.match(await shop.locator('#tb-helper-copy').innerText(),/for mye/);
  assert.equal(await shop.locator('[data-tb-actor="helper"]').getAttribute('data-laria-troll-mood'),'support');
  await tap('uncoin','[data-tb-index="0"]');
  if(name==='ipad-wide'||name==='desktop'){
   await moveCoin(1000,false);
   assert.equal(await shop.locator('.tb-trayCoins button').count(),0);
   await moveCoin(1000,true,type==='chromium'&&name==='ipad-wide');
   assert.equal(await shop.locator('.tb-trayCoins button').count(),1);
   assert.equal(await shop.locator('.tb-sceneCoins').locator('.tb-sum').count(),0);
   assert.match(await shop.locator('.tb-trayCoins button').innerText(),/^10\s*kr$/);
  }else await tap('coin','[data-tb-coin="1000"]');
  await shot('06-coins');
  if(name==='ipad-wide'){
   await page.setViewportSize({width:height,height:width});
   assert.equal(await shop.locator('.tb-sceneCoins').locator('.tb-sum').count(),0);
   assert.match(await shop.locator('.tb-trayCoins button').innerText(),/^10\s*kr$/);
   await page.setViewportSize({width,height});
  }
  await tap('coin','[data-tb-coin="500"]');await tap('settle');
  await phase('Kvittering');assert.match(await shop.locator('.tb-receipt').innerText(),/35 kr \+ 15 kr = 50 kr/);
  await shot('07-receipt');
  if(recordVideo&&process.env.TB_DEMO_CUT==='1'){
   assert.deepEqual(errors,[]);
   await page.waitForTimeout(2200);
   const video=page.video();await page.close();await video.saveAs(path.join(recordVideo.dir,type+'-'+name+'-gameplay.webm'));
   console.log(type,name,'recorded one complete first trade');return;
  }
  await tap('next');await phase('Plukk varer');await tap('back');
  await page.locator('#tallvika-world [data-tv="shop"]').click();await phase('Plukk varer');
  assert.match(await shop.locator('.tb-statusline').innerText(),/Kunde 2 av 3/);
  for(const [orders,coins,quote] of [[{milk:1,carrot:2,berry:2},[100,100],18],[{honey:1,bread:2,apple:1},[1000,100,100,100],37]]){
   for(const [id,n] of Object.entries(orders))for(let i=0;i<n;i++)await tap('add','[data-tb-id="'+id+'"]');
   await tap('basket');
   for(const id of Object.keys(orders))await tap('scan','[data-tb-id="'+id+'"]');
   await price.fill(String(quote));await tapControl(confirmPrice,'confirmPrice');for(const n of coins)await tap('coin','[data-tb-coin="'+n+'"]');
   await tap('settle');await phase('Kvittering');await tap('next');
  }
  await phase('Butikkdagen er ferdig');await shot('08-closing');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-trollbutikken-v1')));
  assert.equal(saved.served,3);assert.equal(saved.days,1);
  await tap('free');await phase('Fri butikk');
  await tap('add','[data-tb-id="honey"]');await tap('add','[data-tb-id="bread"]');
  assert.match(await shop.locator('.tb-sum').innerText(),/22 kr/);await shot('09-free');
  await tap('remove','[data-tb-id="bread"]');assert.match(await shop.locator('.tb-sum').innerText(),/12 kr/);
  await tap('resume');await phase('Butikkdagen er ferdig');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('laria-trollbutikken-v1'))),saved);
  await runTrip();await runWarehouse();

  await tap('back');await page.locator('#tallvika-world [data-tv="back"]').click();
  await page.locator('#home-screen.active').waitFor();
  const appState=await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')));
  assert.equal(appState.profile.tallvikaTroll,troll);assert.deepEqual(appState.mastery,{});assert.equal(appState.answerLog.length,0);
  assert.deepEqual(errors,[]);
  if(recordVideo){const video=page.video();await page.close();await video.saveAs(path.join(recordVideo.dir,type+'-'+name+'-gameplay.webm'));}
  console.log(type,name,width+'×'+height,'complete day, handletur, warehouse, correction, payment, separate resume, Tallvika and Home passed');
 }catch(error){await shot('needs-layout-review').catch(()=>{});throw error}finally{await context.close();}
}
(async()=>{
 for(const [type,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.TB_ENGINE&&process.env.TB_ENGINE!==type)continue;
  const browser=await engine.launch({headless:true,slowMo:process.env.TB_VIDEO?175:0,...(type==='chromium'&&process.env.LARIA_CHROMIUM_EXECUTABLE?{executablePath:process.env.LARIA_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{})});
  try{for(const row of matrix)await run(type,browser,row);}finally{await browser.close();}
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
