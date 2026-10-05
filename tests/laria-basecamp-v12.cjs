/* Læria basecamp v12 + Ordjakt: local browser regression and responsive touch checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const screenshots=process.env.QA_SCREENSHOTS||'/tmp/laria-v12-qa';fs.mkdirSync(screenshots,{recursive:true});
 const errors=[];
 for(const [name,width,height] of [['ipad-landscape',1180,820],['ipad-portrait',820,1180],['iphone',390,844],['small-phone',320,568],['desktop',1024,768]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));
  await page.addInitScript(()=>localStorage.setItem('laerlittmer-v2',JSON.stringify({profile:{grade:2,onboarded:true,name:'Testbarn',avatar:'boy',setupVersion:1}})));
  await page.goto(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/',{waitUntil:'networkidle'});
  await page.locator('.bc12').waitFor({state:'visible'});
  await page.screenshot({path:`${screenshots}/${name}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');

  for(const [action,screen,back] of [['globe','world','world-back'],['fraction','fraction-lab','fraction-lab-back'],['multiply','multiplication-lab','multiplication-lab-back']]){
   await page.locator(`.bc12-place[data-camp="${action}"]`).tap();
   await page.locator(`#${screen}-screen.active`).waitFor();
   await page.locator('#'+back).tap();await page.locator('#home-screen.active').waitFor();
  }

  await page.locator('.bc12-place[data-camp="words"]').tap();
  const hunt=page.locator('#word-hunt-overlay');await hunt.waitFor({state:'visible'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' Ordjakt overflow');
  const pick=await page.evaluate(()=>{
    const cells=[...document.querySelectorAll('.word-hunt-cell')];
    const size=Math.round(Math.sqrt(cells.length));
    const letters=cells.map(x=>x.textContent.trim());
    const word=document.querySelector('.word-hunt-word')?.textContent.replace(/^✓\s*/,'').trim();
    const dirs=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    if(!word)return null;
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)for(const [dr,dc] of dirs){
      let s='',rr=r,cc=c;for(let i=0;i<word.length;i++,rr+=dr,cc+=dc){
        if(rr<0||cc<0||rr>=size||cc>=size){s='';break}s+=letters[rr*size+cc];
      }
      if(s===word)return {word,start:[r,c],end:[r+dr*(word.length-1),c+dc*(word.length-1)]};
    }
    return null;
  });
  assert(pick,name+' could not locate first Ordjakt word in grid');
  await page.locator(`.word-hunt-cell[data-r="${pick.start[0]}"][data-c="${pick.start[1]}"]`).tap();
  await page.locator(`.word-hunt-cell[data-r="${pick.end[0]}"][data-c="${pick.end[1]}"]`).tap();
  assert(await page.locator('.word-hunt-word.found').count()>=1,name+' Ordjakt selection did not register');
  await page.locator('.word-hunt-back').tap();await hunt.waitFor({state:'hidden'});

  await page.locator('.bc12-journey').tap();await page.locator('#subject-screen.active').waitFor();await page.locator('.bok-v10-home').tap();
  await page.locator('[data-camp="quest"]').tap();assert(await page.locator('#bc12-dialog').isVisible());await page.getByRole('button',{name:'Kanskje senere'}).tap();
  await page.locator('.bc12-nav [data-camp="collection"]').tap();await page.getByRole('heading',{name:'Samlingen din'}).waitFor();await page.getByRole('button',{name:'Tilbake til basecamp'}).tap();
  await page.locator('.bc12-nav [data-camp="explore"]').tap();assert.equal(await page.locator('.bc12 h1').textContent(),'Hva vil du leke med?');
  assert.equal(await page.locator('[data-camp-fox-call]').textContent(),'Velg noe du liker!');
  await page.locator('.bc12-nav [data-camp="home"]').tap();
  assert.equal(await page.evaluate(()=>state.profile.grade),2);
  console.log(name+': basecamp, real Ordjakt, routes, returns, optional quest, collection and explore passed');
  await context.close();
 }
 assert.deepEqual(errors,[],'No JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
