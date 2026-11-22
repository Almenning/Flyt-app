'use strict';
/* Gangetabellen iPad pilot at exact PR head. Real Tallvika route, selected
 * original troll and real 10x10 multiplication renderer. Preview-only. */
const {chromium,webkit}=require('playwright');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=process.env.LARIA_GANGETABELLEN_IPAD||'/tmp/laria-gangetabellen-ipad';
fs.mkdirSync(dir,{recursive:true});
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Prøvebarn',avatar:'girl',
 setupVersion:2,tallvikaTroll:'storesoster'},mastery:{},mistakes:{},skillMastery:{},
 skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},
 answerLog:[],sessionLog:[],activeSession:null};
const devices=[
 ['portrait-820',{width:820,height:1180},'portrait'],
 ['portrait-1024',{width:1024,height:1366},'portrait'],
 ['landscape-1180',{width:1180,height:820},'wide'],
 ['landscape-1366',{width:1366,height:1024},'wide']
];
(async()=>{
 const results=[];
 for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   for(const [device,viewport,orientation] of devices){
    const ctx=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:1,
      reducedMotion:'reduce',serviceWorkers:'block'});
    await ctx.addInitScript(data=>localStorage.setItem('laerlittmer-v2',JSON.stringify(data)),seed);
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:85000});
    await openHomeSubject(page,'math');
    await page.locator('#tallvika-world .tv-sign[data-tv="table"]').click();
    const screen=page.locator('#multiplication-lab-screen.active[data-mp-direct-tallvika="true"]');
    await screen.locator('.mp-explore-screen .mp-times-grid').waitFor({state:'visible',timeout:25000});
    const audit=await page.evaluate(()=>{
      const screen=document.querySelector('#multiplication-lab-screen.active');
      const rect=sel=>{const el=screen.querySelector(sel),r=el?.getBoundingClientRect();
        return r?{top:Math.round(r.top),bottom:Math.round(r.bottom),
          left:Math.round(r.left),right:Math.round(r.right),
          width:Math.round(r.width),height:Math.round(r.height)}:null;};
      const shell=screen.querySelector('.mp-shell');
      return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,
        document.documentElement.scrollHeight],background:getComputedStyle(shell).backgroundImage,
        nav:rect('.mp-nav'),heading:rect('.mp-heading'),tabs:rect('.mp-explore-tabs'),
        world:rect('.mp-explore-world'),grid:rect('.mp-table-viewport'),
        table:rect('.mp-times-grid'),inspector:rect('.mp-table-inspector'),
        mascot:rect('.mp-mascot-small'),actor:rect('.mp-mascot-small>img'),
        touchTargets:[...screen.querySelectorAll('.mp-times-grid button,.mp-back')].map(b=>{
          const r=b.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};
        })};
    });
    results.push({engine,device,...audit});
    console.log('[iPad Gangetabellen] '+engine+' '+device+': '+JSON.stringify({
      viewport:audit.viewport,scroll:audit.scroll,world:audit.world,nav:audit.nav,
      grid:audit.grid,inspector:audit.inspector,actor:audit.actor,background:audit.background}));
    await page.screenshot({path:path.join(dir,engine+'-'+device+'.png'),
      fullPage:false,animations:'disabled'});
    assert.match(audit.background,
      /tallvika-fjord-no-buildings-(portrait|wide)-20261107\.webp/,
      engine+' '+device+' must use locked Tallvika artwork');
    assert.ok(audit.background.includes('tallvika-fjord-no-buildings-'+orientation),
      engine+' '+device+' wrong orientation art');
    assert.equal(await screen.locator('.mp-times-grid .mp-grid-cell').count(),100,
      engine+' '+device+' lost 100 cells');
    assert.equal(await screen.locator('.gm-classic-return').count(),0,
      engine+' '+device+' duplicated legacy back button');
    assert.equal(await screen.locator('#multiplication-lab-back').getAttribute('aria-label'),
      'Tilbake til Tallvika');
    assert.ok(audit.touchTargets.every(x=>x.w>=44&&x.h>=44),
      engine+' '+device+' lost 44px touch size');
    assert.ok(audit.scroll[0]<=audit.viewport[0]+3,engine+' '+device+' horizontal overflow');
    assert.ok(audit.scroll[1]<=audit.viewport[1]+3,
      engine+' '+device+' legacy empty space allows vertical scrolling: '+JSON.stringify(audit.scroll));
    assert.ok(audit.world&&audit.nav&&audit.actor&&audit.actor.height>30,
      engine+' '+device+' missing world/nav/companion');
    assert.ok(audit.grid.bottom<=audit.viewport[1]+3&&audit.nav.bottom<=audit.viewport[1]+3,
      engine+' '+device+' table or navigation below iPad first viewport: '+JSON.stringify(audit));
    await screen.locator('.mp-grid-cell[data-row="2"][data-col="3"]').click();
    assert.match(await screen.locator('.mp-inspector-equation b').innerText(),/2\s*×\s*3\s*=\s*6/);
    await screen.locator('#multiplication-lab-back').click();
    await page.locator('#tallvika-world').waitFor({state:'visible',timeout:15000});
    assert.deepEqual(errors,[],engine+' '+device+' runtime errors');
    await ctx.close();
   }
  } finally {await browser.close()}
 }
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify({
   head:process.env.PR_HEAD_SHA||process.env.GITHUB_SHA||null,source:'actual app; preview branch, not published',results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
