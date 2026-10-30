'use strict';
/* Home v16 is deliberately a navigation pilot only.
   This test MUST NOT certify removal of the four baked-in bottom cards. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium,webkit}=require('playwright');

const out=process.env.LARIA_HOME_V16_SCREENSHOTS||'/tmp/laria-home-v16';
const address=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const src=[
 ['kjosnes-home-tablet.webp',459450,'246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5'],
 ['kjosnes-home-phone.webp',52882,'0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7']
];
for(const [name,bytes,hash] of src){
 const raw=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/assets/home-v15',name));
 assert.equal(raw.length,bytes,name+' original byte count changed');
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),hash,name+' locked image SHA changed');
}
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null
};
const screens=[
 ['pc-1920x1080',{width:1920,height:1080},true],
 ['mac-1440x900',{width:1440,height:900},true],
 ['ipad-landscape-1366x1024',{width:1366,height:1024},true],
 ['ipad-portrait-1024x1366',{width:1024,height:1366},false],
 ['iphone-portrait-393x852',{width:393,height:852},false],
 ['iphone-landscape-852x393',{width:852,height:393},false]
];
const expects=[['norwegian','subject'],['math','subject'],['english','subject'],['geography','geography']];
fs.mkdirSync(out,{recursive:true});
async function run(engine,browserType,name,viewport,expectSigns){
 const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  const ctx=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<700,serviceWorkers:'block',reducedMotion:'reduce'});
  await ctx.addInitScript(v=>localStorage.setItem('laerlittmer-v2',JSON.stringify(v)),seed);
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  const url=new URL(address);url.searchParams.set('laria-home-v16-preview','1');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:75000});
  const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
  await home.waitFor({state:'visible',timeout:22000});
  await page.waitForFunction(()=>Boolean(document.querySelector('#home-screen .bc12')?.dataset.bc16Stage) && document.querySelector('#home-screen .bc12')?.dataset.bc16Stage!=='not-ready',null,{timeout:18000});
  const actual=await home.getAttribute('data-bc16-stage');
  const signs=home.locator('.bc16-sign');
  if(expectSigns){
   assert.equal(actual,'navigation-pilot',engine+' '+name+' new left sign navigation did not mount: '+actual);
   assert.equal(await signs.count(),4,engine+' '+name+' four wooden sign routes missing');
   const audit=await home.evaluate(el=>{
    const art=getComputedStyle(el).getPropertyValue('--bc15-home-art');
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const buttons=[...el.querySelectorAll('.bc16-sign')].map(x=>({...rect(x),subject:x.dataset.bc16Subject,label:x.getAttribute('aria-label')}));
    const nav=rect(el.querySelector('.bc16-sign-nav'));
    const old=el.querySelector('.bc14-subjects');
    const ctl=getComputedStyle(old);
    const journey=el.querySelector('.bc12-journey'),live=el.querySelector('.bc15-live-next');
    return {art,nav,buttons,oldVisibility:ctl.visibility,oldPointerEvents:ctl.pointerEvents,
      stage:el.dataset.bc16Stage,journeyDescription:journey.getAttribute('aria-describedby'),
      liveId:live.id,liveText:live.textContent,realNext:el.querySelector('[data-camp-next]').textContent,
      screen:{w:innerWidth,h:innerHeight,scrollWidth:document.documentElement.scrollWidth}};
   });
   assert.match(audit.art,/kjosnes-home-tablet\.webp/,engine+' '+name+' changed original master');
   assert.deepEqual(audit.buttons.map(b=>b.subject),expects.map(x=>x[0]),'incorrect subject order');
   assert.equal(audit.oldVisibility,'hidden',engine+' '+name+' old bottom hit areas still active');
   assert.equal(audit.oldPointerEvents,'none',engine+' '+name+' old bottom hit areas intercept taps');
   assert.equal(audit.journeyDescription,audit.liveId,'dynamic progress is disconnected');
   assert(audit.liveText.includes(audit.realNext),'dynamic next title not bound to real state');
   assert(audit.buttons.every(b=>b.w>=44&&b.h>=44),'a wooden sign has an inaccessible hit target');
   assert(audit.buttons.every(b=>b.right<=viewport.width+2&&b.x>=-2&&b.y>=-2&&b.bottom<=viewport.height+2),'sign hit outside viewport');
   assert(audit.nav.x<viewport.width*.28,'wooden signs are not on the left');
   assert(audit.buttons.every(b=>b.x>=audit.nav.x-2&&b.right<=audit.nav.right+2),'sign outside its artwork map');
   assert(audit.buttons.every((b,i)=>i===0||b.y>=audit.buttons[i-1].bottom-1),'wooden signs overlap');
   assert(audit.screen.scrollWidth<=audit.screen.w+2,'horizontal overflow');
   fs.writeFileSync(path.join(out,engine+'-'+name+'.json'),JSON.stringify({automatedNavigationPassed:true,artworkApproved:false,...audit},null,2));
   // Verify actual existing navigation, not a prototype function or a mock.
   for(const [subject,screen] of expects){
    await home.locator('.bc16-sign[data-bc16-subject="'+subject+'"]').click();
    await page.locator('#'+screen+'-screen.active').waitFor({state:'visible',timeout:18000});
    await page.evaluate(()=>{showScreen('home');});
    await page.locator('#home-screen.active .bc16-sign-nav').waitFor({timeout:22000});
   }
  }else{
   assert.notEqual(actual,'navigation-pilot',engine+' '+name+' should not fake signs in an unapproved portrait/short-landscape painting');
   assert.equal(await signs.count(),0,engine+' '+name+' drew fake signposts over the original children');
   assert.equal(await home.locator('.bc14-subject:visible').count(),4,'fallback must preserve the original four subject gateways');
  }
  await page.screenshot({path:path.join(out,engine+'-'+name+'.png'),fullPage:false,animations:'disabled'});
  assert.deepEqual(errors,[],engine+' '+name+' page errors');
  await ctx.close();
 }finally{await browser.close();}
}
(async()=>{
 fs.writeFileSync(path.join(out,'README.json'),JSON.stringify({
  description:'Home v16 draft navigation pilot, not an approved clean illustration',
  head:process.env.LARIA_GIT_SHA||'unrecorded',originalArtworkUnchanged:true,
  bottomPaintedCardsStillPresent:true,awaitingApprovedCleanDerivative:true,
  allScreensAreRealBrowserRenders:true,
 },null,2));
 let failed=0;
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  for(const [name,viewport,supported] of screens){
   try{await run(engine,browserType,name,viewport,supported);console.log('PASS',engine,name);}
   catch(e){failed++;console.error('FAIL',engine,name,e.stack||e.message);}
  }
 }
 assert.equal(failed,0,failed+' Home v16 preview cases failed');
})().catch(e=>{console.error(e);process.exitCode=1;});
