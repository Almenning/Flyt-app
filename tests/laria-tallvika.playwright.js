'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Tallvika QA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_TALLVIKA_SCREENSHOTS;
async function shot(page,name){if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled',fullPage:true});}}
async function enter(page){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  const tile=page.locator('.bc14-subject[data-camp="subject-math"]');await tile.waitFor({timeout:18000});await tile.click();
  await page.locator('#tallvika-world').waitFor({state:'visible',timeout:18000});
}
async function run(browserType,label,viewport){
  const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({viewport,isMobile:viewport.width<=480,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',route=>route.abort());await page.route('https://api.worldbank.org/**',route=>route.abort());
    await enter(page);await shot(page,label);
    assert.equal(await page.locator('.tv-scene').count(),1,label+' renders one locked Tallvika scene');
    assert.equal(await page.locator('.tv-scene').evaluate(el=>getComputedStyle(el).backgroundImage.includes('tallvika-master-laast-20261025.png')),true,label+' uses the locked landscape');
    const art=await page.locator('.tv-scene').evaluate(el=>({w:el.getBoundingClientRect().width,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    assert.ok(art.w>250,label+' has a visible world');assert.ok(art.scroll<=art.client+2,label+' has no horizontal overflow');
    await page.locator('[data-tv="choose"]').first().click();await page.locator('.tv-dialog[open]').waitFor();
    assert.equal(await page.locator('[data-tv-troll]').count(),3,label+' offers all three locked trolls');
    await page.locator('[data-tv-troll="lillebror"]').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll),'lillebror',label+' persists selected troll');
    await page.reload({waitUntil:'domcontentloaded',timeout:90000});await page.locator('.bc14-subject[data-camp="subject-math"]').click();await page.locator('#tallvika-world').waitFor();
    assert.match(await page.locator('.tv-companion').getAttribute('aria-label'),/Lillebror/,label+' restores selected troll');
    await page.locator('[data-tv="fraction"]').last().click();await page.locator('#fraction-lab-screen.active').waitFor({timeout:12000});
    await page.locator('#fraction-lab-back').click();await page.locator('#tallvika-world').waitFor({timeout:12000});
    await page.locator('[data-tv="table"]').last().click();await page.locator('#multiplication-lab-screen.active').waitFor({timeout:12000});
    assert.deepEqual(errors,[],label+' emits no page errors');
    await context.close();
  } finally {await browser.close();}
}
(async()=>{for(const [label,viewport] of [['iphone-portrait',{width:390,height:844}],['iphone-landscape',{width:844,height:390}],['ipad-portrait',{width:834,height:1112}],['ipad-landscape',{width:1194,height:834}]]){await run(chromium,'chromium-'+label,viewport);await run(webkit,'webkit-'+label,viewport);}})().catch(error=>{console.error(error);process.exitCode=1});
