/* Isolated local-browser regression and responsive checks; never modifies a user's profile. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const screenshots=process.env.QA_SCREENSHOTS||'/tmp/laria-v11-qa';fs.mkdirSync(screenshots,{recursive:true});
 const errors=[];
 for(const [name,width,height] of [['ipad-landscape',1180,820],['ipad-portrait',820,1180],['iphone',390,844],['small-phone',320,568],['desktop',1024,768]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('laerlittmer-v2',JSON.stringify({profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'boy',setupVersion:1}})));
  await page.goto(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/',{waitUntil:'networkidle'});
  await page.locator('.bc11').waitFor({state:'visible'});
  await page.screenshot({path:`${screenshots}/${name}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');
  for(const [action,screen,back] of [['globe','world','world-back'],['fraction','fraction-lab','fraction-lab-back'],['words','subject','subject-back'],['multiply','multiplication-lab','multiplication-lab-back']]){
   await page.locator(`.bc11-place[data-camp="${action}"]`).tap();
   await page.locator(`#${screen}-screen.active`).waitFor();
   await page.locator(back==='subject-back'?'.bok-v10-home':'#'+back).tap();await page.locator('#home-screen.active').waitFor();
  }
  await page.locator('.bc11-journey').tap();await page.locator('#subject-screen.active').waitFor();await page.locator('.bok-v10-home').tap();
  await page.locator('[data-camp="quest"]').tap();assert(await page.locator('#bc11-dialog').isVisible());await page.getByRole('button',{name:'Kanskje senere'}).tap();
  await page.locator('.bc11-nav [data-camp="collection"]').tap();await page.getByRole('heading',{name:'Samlingen din'}).waitFor();await page.getByRole('button',{name:'Tilbake til basecamp'}).tap();
  await page.locator('.bc11-nav [data-camp="explore"]').tap();assert.equal(await page.locator('.bc11 h1').textContent(),'Hva vil du leke med?');
  await page.locator('.bc11-nav [data-camp="home"]').tap();
  assert.equal(await page.evaluate(()=>state.profile.grade),2);
  console.log(name+': touch routes, returns, optional quest, collection, explore and overflow passed');
  await context.close();
 }
 assert.deepEqual(errors,[],'No JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
