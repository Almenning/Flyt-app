'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Tallvika QA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const url=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const output=process.env.LARIA_TALLVIKA_SCREENSHOTS;
async function shot(page,name){if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled',fullPage:true});}}
async function inWorldComparison(page,label){
  if(!output)return;
  const image=page.locator('#tallvika-world .tv-companion[data-troll-id="storesoster"] img');
  const closeBox=await page.locator('#tallvika-world .tv-companion').boundingBox();
  const after=await image.getAttribute('src');
  // Capture the old locked source and the new source-derived scene treatment
  // in the exact same live browser composition. This changes no saved state.
  await image.evaluate((img,src)=>{img.src=src},'./assets/gangemagi-troll/storesoster.webp');
  await image.evaluate(img=>img.decode());
  await shot(page,label+'-storesoster-before');
  await image.evaluate((img,src)=>{img.src=src},after);
  await image.evaluate(img=>img.decode());
  await shot(page,label+'-storesoster-after');
  // A Tallvika rebuild can replace the companion node while Playwright waits
  // for locator stability. Crop the current page from its measured box instead
  // of holding a locator across that asynchronous render.
  if(closeBox)await page.screenshot({path:path.join(output,label+'-storesoster-closeup-after.png'),animations:'disabled',clip:{x:Math.max(0,closeBox.x-12),y:Math.max(0,closeBox.y-12),width:closeBox.width+24,height:closeBox.height+24}});
}
async function enter(page){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  const tile=page.locator('.bc14-subject[data-camp="subject-math"]');await tile.waitFor({timeout:18000});await tile.click();
  await page.locator('#tallvika-world').waitFor({state:'visible',timeout:18000});
  assert.equal(await page.locator('#subject-screen').evaluate(el=>el.classList.contains('locked-journey-active')),false,
    'Tallvika must not inherit the legacy journey display:none contract');
  assert.equal(await page.locator('#subject-screen').evaluate(el=>el.classList.contains('premium-journey-active')),false,
    'Tallvika must clear the retired premium journey view state');
}
async function run(browserType,label,viewport){
  const browser=await browserType.launch({headless:true,args:browserType===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({viewport,isMobile:viewport.width<=480,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    // Seed only a fresh browser profile. The persistence assertion below
    // reloads the page; overwriting storage on every navigation makes the
    // test itself discard the child's legitimately saved troll selection.
    await context.addInitScript(value=>{
      if(!localStorage.getItem('laerlittmer-v2'))
        localStorage.setItem('laerlittmer-v2',JSON.stringify(value));
    },seed);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://raw.githubusercontent.com/**',route=>route.abort());await page.route('https://api.worldbank.org/**',route=>route.abort());
    await enter(page);await shot(page,label);await inWorldComparison(page,label);
    assert.equal(await page.locator('.tv-scene').count(),1,label+' renders one locked Tallvika scene');
    assert.equal(await page.locator('.tv-scene').evaluate(el=>getComputedStyle(el).backgroundImage.includes('tallvika-master-laast-20261025.png')),true,label+' uses the locked landscape');
    const art=await page.locator('.tv-scene').evaluate(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    assert.ok(art.w>250,label+' has a visible world');assert.ok(art.scroll<=art.client+2,label+' has no horizontal overflow');
    const shell=await page.locator('.app').evaluate(el=>({
      padding:parseFloat(getComputedStyle(el).paddingBottom),
      background:getComputedStyle(el).backgroundColor
    }));
    assert.equal(shell.padding,0,label+' must not retain the hidden bottom navigation gutter');
    assert.equal(shell.background,'rgb(247, 240, 223)',label+' must match Tallvika cream below the scene');
    assert.equal(await page.locator('#subject-screen').evaluate(el=>getComputedStyle(el).backgroundColor),
      'rgb(247, 240, 223)',label+' must not expose the former dark journey background');
    await page.locator('#tallvika-world [data-tv="grade"]').click();
    await page.locator('#tallvika-world .tv-grade-dialog[open]').waitFor();
    assert.equal(await page.locator('#tallvika-world [data-tv-grade]').count(),10,label+' grade options missing');
    await page.locator('#tallvika-world [data-tv-grade="3"]').click();
    assert.deepEqual(await page.evaluate(()=>[window.LARIA_TALLVIKA_BRIDGE.currentGrade(),window.LARIA_TALLVIKA_BRIDGE.journeyViewGrade('math')]),[2,3],label+' grade view must not change the profile');
    await page.locator('#tallvika-world [data-tv="grade"]').click();
    await page.locator('#tallvika-world .tv-grade-dialog[open] [data-tv-grade="2"]').click();
    if(viewport.width<=480){
      // Inspect the real last viewport fold, not only a container's style:
      // legacy fixed navigation can cover an otherwise correctly painted page.
      const footer=await page.evaluate(()=>{
        const point=[Math.round(innerWidth/2),Math.round(innerHeight-36)];
        const stack=document.elementsFromPoint(...point).slice(0,10).map(el=>{
          const style=getComputedStyle(el),box=el.getBoundingClientRect();
          return {tag:el.tagName,id:el.id,cls:String(el.className).slice(0,95),bg:style.backgroundColor,
            bgImage:style.backgroundImage.slice(0,80),position:style.position,
            rect:{top:Math.round(box.top),bottom:Math.round(box.bottom)}};
        });
        return {point,html:getComputedStyle(document.documentElement).backgroundColor,
          body:getComputedStyle(document.body).backgroundColor,
          app:getComputedStyle(document.querySelector('.app')).backgroundColor,stack};
      });
      console.log('[TALLVIKA_FOOTER_AUDIT]',label,JSON.stringify(footer));
    }
    if(viewport.width<=480){
      // The locked landscape carries both the world sign and the house labels.
      // Cropping it on narrow portrait phones cuts off the approved artwork.
      assert.ok(Math.abs(art.h-art.w*941/1672)<3,label+' must show the entire uncropped Tallvika artwork on portrait phones');
      assert.equal(await page.locator('.tv-scene-copy').isVisible(),false,label+' must not duplicate the painted world sign');
      assert.equal(await page.locator('.tv-mobile-actions [data-tv]').count(),3,label+' keeps all three accessible activity buttons');
    }
    await page.locator('[data-tv="choose"]').first().click();await page.locator('.tv-dialog[open]').waitFor();
    assert.equal(await page.locator('[data-tv-troll]').count(),3,label+' offers all three locked trolls');
    // Every original forest troll must be selectable, render from its own
    // approved image, and persist without changing the child's learning data.
    for(const id of ['storesoster','lillesoster','lillebror']){
      if(id!=='storesoster'){
        await page.locator('#tallvika-world [data-tv="choose"]').click();
        await page.locator('.tv-dialog[open]').waitFor();
      }
      await page.locator('[data-tv-troll="'+id+'"]').click();
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('laerlittmer-v2')).profile.tallvikaTroll),id,label+' does not persist '+id);
      const image=page.locator('#tallvika-world .tv-companion img');
      const src=await image.getAttribute('src');
      assert.ok(id==='storesoster'?src.includes('/storesoster-inworld-approved-20261026.webp'):src.includes('/'+id+'.webp'),label+' shows wrong troll for '+id);
      assert.equal(await page.locator('#tallvika-world .tv-companion').getAttribute('data-troll-treatment'),id==='storesoster'?'approved-painterly-20261026':'locked-original',label+' must keep the intended source treatment');
      await image.evaluate(img=>img.decode());
      if(id==='storesoster'){
        const imageInfo=await image.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,filter:getComputedStyle(img).filter}));
        assert.equal(imageInfo.width,512,label+' storesoster approved art width');
        assert.equal(imageInfo.height,1024,label+' storesoster approved art height');
        assert.ok(!['brightness(', 'saturate(', 'contrast('].some(fn=>imageInfo.filter.includes(fn)),label+' approved artwork must retain its colours');
        if(viewport.width<=480){
          const placement=await page.locator('#tallvika-world .tv-companion').evaluate(el=>{
            const scene=el.closest('.tv-scene').getBoundingClientRect(),box=el.getBoundingClientRect();
            return {left:(box.left-scene.left)/scene.width,top:(box.top-scene.top)/scene.height,
              width:box.width/scene.width,height:box.height/scene.height,
              bottom:(scene.bottom-box.bottom)/scene.height};
          });
          // On portrait phones the unchanged entire panorama shrinks ~3×.
          // Enlarge only the approved Storesøster's foreground placement:
          // don't shrink her with the original iPad percentage dimensions.
          assert.ok(placement.height>=.42&&placement.height<=.45,label+' Storesøster must be large enough to recognise on a phone');
          assert.ok(placement.width>=.13&&placement.width<=.14,label+' portrait companion footprint is expected');
          assert.ok(placement.left>=.54&&placement.left<=.57,label+' leave the painted Brøklab sign legible');
          assert.ok(placement.top>=.42&&placement.top<=.47,label+' companion remains grounded in the lower path');
          assert.ok(placement.bottom>=.11&&placement.bottom<=.14,label+' companion feet remain on the path');
        }
      }
      if(viewport.width<=480&&output)await shot(page,label+'-'+id);
    }
    await page.reload({waitUntil:'domcontentloaded',timeout:90000});await page.locator('.bc14-subject[data-camp="subject-math"]').click();await page.locator('#tallvika-world').waitFor();
    assert.match(await page.locator('.tv-companion').getAttribute('aria-label'),/Lillebror/,label+' restores selected troll');
    await page.locator('[data-tv="fraction"]:visible').first().click();await page.locator('#fraction-lab-screen.active').waitFor({timeout:12000});
    await page.locator('#fraction-lab-back').click();await page.locator('#tallvika-world').waitFor({timeout:12000});
    await page.locator('[data-tv="table"]:visible').first().click();await page.locator('#multiplication-lab-screen.active').waitFor({timeout:12000});
    assert.deepEqual(errors,[],label+' emits no page errors');
    await context.close();
  } finally {await browser.close();}
}
(async()=>{for(const [label,viewport] of [['iphone-compact',{width:320,height:568}],['iphone-portrait',{width:390,height:844}],['iphone-landscape',{width:844,height:390}],['ipad-portrait',{width:834,height:1112}],['ipad-landscape',{width:1194,height:834}]]){await run(chromium,'chromium-'+label,viewport);await run(webkit,'webkit-'+label,viewport);}})().catch(error=>{console.error(error);process.exitCode=1});
