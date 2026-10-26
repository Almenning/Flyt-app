'use strict';
/* The eight approved WebP paintings stay exact; the fifth Explore card adds an original SVG illustration. */
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'PremiumQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const urls={
 travel:['norwegian','math','english','geography'],
 explore:['globe','words','find-words','fraction','multiply']
};
const lookup={
 norwegian:'reisen/norwegian',math:'reisen/math',english:'reisen/english',geography:'reisen/geography',
 globe:'utforsk/globe',words:'utforsk/words',fraction:'utforsk/fraction',multiply:'utforsk/multiply'
};
async function run(engine,label,width,height){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<600,
   reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
  await page.goto(base+'&premium-card-qa='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc12-nav [data-camp="travel"]').waitFor({timeout:18000});
  for(const mode of ['travel','explore']){
   await page.locator('.bc12-nav [data-camp="'+mode+'"]').click();
   await page.locator('.bc12[data-bc13-view="'+mode+'"] .bc13-card').first().waitFor({timeout:18000});
   assert.equal(await page.locator('.bc13-card:visible').count(),mode==='explore'?5:4,label+' '+mode+' gateway count');
   const cards=await page.locator('.bc13-card').evaluateAll(async(nodes)=>{
    await Promise.all(nodes.map(async node=>{
      const img=node.querySelector('img.bc13-premium-art');
      if(img&&!img.complete)await new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,12000)});
    }));
    return nodes.map(node=>{
     const art=node.querySelector('.bc13-premium-art'),holder=node.querySelector('.bc13-scene'),svg=holder.querySelector('svg');
     const frame=holder.getBoundingClientRect(),image=art.getBoundingClientRect(),css=getComputedStyle(art);
     return {action:node.dataset.bc13Action,src:art?.getAttribute('src'),
      ready:art?.complete,broken:art?.hidden,natural:[art?.naturalWidth,art?.naturalHeight],
      fit:css.objectFit,objectPosition:css.objectPosition,borderBottom:parseFloat(getComputedStyle(holder).borderBottomWidth),
      frame:{w:frame.width,h:frame.height,left:frame.left,right:frame.right},
      image:{w:image.width,h:image.height,left:image.left,right:image.right},
      fallback:!!svg,text:node.querySelector('.bc13-card-copy')?.innerText,
      progress:!!node.querySelector('.bc13-progress')};
    });
   });
   // Preview is restricted to synthetic QA profiles and never includes real child data.
   if(process.env.LARIA_PREMIUM_PREVIEW==='1'&&label==='chromium-iphone'){
    const bytes=await page.locator('.bc13-panel').screenshot({type:'jpeg',quality:58,animations:'disabled'});
    console.log('LARIA_PREVIEW_'+mode.toUpperCase()+'_START'+bytes.toString('base64')+'LARIA_PREVIEW_'+mode.toUpperCase()+'_END');
   }
   for(const card of cards){
    assert.ok(urls[mode].includes(card.action),label+' wrong card '+JSON.stringify(card));
    if(card.action==='find-words'){
      assert.ok(card.src.startsWith('./bokskogen-reference-bg.webp'),label+' card must use painted Bokskogen artwork: '+card.src);
    }else{
      assert.equal(card.src.startsWith('./assets/cards/'+lookup[card.action]+'-premium.webp'),true,label+' stale asset '+card.action);
    }
    assert.equal(card.ready,true,label+' image never finished loading '+card.action);
    assert.equal(card.broken,false,label+' image 404 triggered fallback '+card.action);
    if(card.action==='find-words'){
      assert.ok(card.natural[0]>=240&&card.natural[1]>=120,label+' painted forest image failed to load '+JSON.stringify(card));
    }else{
      assert.deepEqual(card.natural,[1024,704],label+' approved painting dimensions changed '+card.action);
    }
    assert.equal(card.fit,'cover',label+' stretched image '+card.action);
    assert.ok(card.frame.w>95&&card.frame.h>35,label+' missing art surface '+card.action);
    assert.ok(Math.abs(card.frame.w-card.image.w)<1.5&&Math.abs((card.frame.h-card.image.h)-card.borderBottom)<1.5,label+' image geometry differs from image area above card bottom border '+JSON.stringify(card));
    assert.equal(card.fallback,true,label+' missing safe offline fallback '+card.action);
    assert.ok(card.text&&card.text.length>8,label+' card lost HTML labels '+card.action);
    assert.equal(card.progress,mode==='travel',label+' progress was added to free play '+card.action);
   }
   const layout=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,
     nav:document.querySelector('.bc12-nav')?.getBoundingClientRect().toJSON()}));
   assert.ok(layout.document<=layout.width+4,label+' '+mode+' horizontal overflow '+JSON.stringify(layout));
   assert.ok(layout.nav?.width>0,label+' missing bottom nav');
  }
  // The approved Norsk route is Eggenipa with three direct activities, NOT
  // the retired Bokskogen journey map. Card QA must check that real route.
  await page.locator('.bc12-nav [data-camp="travel"]').click();
  await page.locator('.bc13-card[data-bc13-action="norwegian"]').click();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
  const original=await page.locator('#eggenipa-world .eg-master').evaluate(async img=>{
    await img.decode();
    return {width:img.naturalWidth,height:img.naturalHeight};
  });
  assert.deepEqual(original,{width:1672,height:941},
    label+' changed the locked Eggenipa master artwork');
  const destinations=await page.locator('#eggenipa-world .eg-portal').evaluateAll(nodes=>
    nodes.map(node=>node.dataset.eg));
  assert.deepEqual(destinations,['words','find','reading'],
    label+' did not open the three approved Norsk activities');
  assert.equal(await page.locator('#subject-screen.active .locked-journey-map:visible').count(),0,
    label+' retired Norwegian map is still visible');
  await page.locator('#eggenipa-world .eg-portal[data-eg="reading"]').click();
  await page.locator('#session-screen.active').waitFor({timeout:16000});
  const session=await page.evaluate(()=>({subject:sessionScope?.subject,module:sessionScope?.module}));
  assert.equal(session.subject,'norwegian',label+' wrong subject after Norsk card');
  assert.equal(session.module,'reading',label+' Norsk card did not open Lesekroken');
  await page.locator('#close-session').click();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:12000});
  assert.deepEqual(errors,[],label+' runtime errors');
  console.log('[LÆRIA PREMIUM CARDS]',label,'eight approved WebPs, picture-hunt art, Eggenipa master and direct Lesekroken navigation OK');
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const [label,engine,width,height] of [
  ['chromium-iphone',chromium,390,844],
  ['webkit-small-iphone',webkit,320,568],
  ['webkit-iphone',webkit,390,844],
  ['webkit-ipad',webkit,820,1180],
  ['webkit-ipad-landscape',webkit,1180,820]
 ])await run(engine,label,width,height);
})().catch(err=>{console.error(err);process.exitCode=1});
