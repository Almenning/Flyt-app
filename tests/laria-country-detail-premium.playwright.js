'use strict';
/* Country detail: actual country data, chosen fox, contextual globe scene,
 * native return path and original practice routing on iPhone and iPad. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {webkit,chromium}=require('playwright');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const screenshotDir=process.env.COUNTRY_STORY_QA_SCREENSHOTS||'/tmp/laria-country-story';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.png':'image/png',
  '.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
const base={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'LandQA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},
  answerLog:[],sessionLog:[],activeSession:null
};
async function server(){
  const app=http.createServer((req,res)=>{
    let file;
    try{
      let part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(part==='/')part='/index.html';
      file=path.resolve(root,'.'+part);
      if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){
        res.writeHead(403);res.end();return;
      }
    }catch(_){res.writeHead(400);res.end();return;}
    fs.readFile(file,(error,bytes)=>{
      if(error){res.writeHead(404);res.end('missing');return;}
      res.setHeader('Cache-Control','no-store');
      res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
      res.end(bytes);
    });
  });
  await new Promise((resolve,reject)=>{
    app.once('error',reject);
    app.listen(0,'127.0.0.1',resolve);
  });
  return {app,url:'http://127.0.0.1:'+app.address().port+'/?app=laria'};
}
async function run(engine,label,viewport,url,avatar='girl'){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport,isMobile:label.includes('iphone'),hasTouch:true,
      deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'
    });
    const seed={...base,profile:{...base.profile,avatar}};
    await context.addInitScript(state=>{
      if(!localStorage.getItem('laerlittmer-v2'))
        localStorage.setItem('laerlittmer-v2',JSON.stringify(state));
    },seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&country-story='+label,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof openDetail==='function'&&
      !!window.LARIA_COUNTRY_DETAIL_PREMIUM&&!!window.LARIA_GLOBE_COUNTRY_SCENE_V25,
      null,{timeout:22000});
    // Script functions can exist while Basecamp is still finishing its first
    // render. Opening a country before navigation is ready can be overwritten
    // by the final boot render, especially on slower WebKit runners.
    await page.locator('.bc14-subject[data-camp="subject-geography"]')
      .waitFor({state:'visible',timeout:22000});
    await page.locator('#home-screen.active').waitFor({state:'visible',timeout:22000});
    const before=await page.evaluate(()=>JSON.stringify({
      journey:state.journey,answerLog:state.answerLog,mastery:state.mastery
    }));
    // The product still navigates through the SAME openDetail() as the globe card.
    await page.evaluate(()=>openDetail('eg','world'));
    const card=page.locator('#detail-screen.active .country-story[data-country-detail="eg"]');
    try{
      await card.waitFor({timeout:12000});
    }catch(error){
      const diagnostic=await page.evaluate(()=>({
        activeScreen:document.querySelector('.screen.active')?.id,
        countryStoryId:document.querySelector('#detail-content .country-story')?.dataset.countryDetail,
        detailHtml:document.querySelector('#detail-content')?.innerHTML.slice(0,180),
        appReady:!!document.querySelector('#home-screen'),
        countryLoaded:!!window.LARIA_COUNTRY_DETAIL_PREMIUM
      }));
      throw new Error('Country detail did not render after Basecamp became ready: '+JSON.stringify(diagnostic),{cause:error});
    }
    await card.locator('h1').waitFor();
    assert.equal((await card.locator('h1').innerText()).trim(),'Egypt',label+' wrong country');
    assert.match(await card.locator('.country-story-tagline').innerText(),/Nilen.*pyramider/,
      label+' lost existing country-specific illustration summary');
    assert.match(await card.locator('.country-story-facts').innerText(),/Kairo/);
    assert.match(await card.locator('.country-story-facts').innerText(),/Afrika/);
    assert.match(await card.locator('.country-story-facts').innerText(),/116,5\s+mill/,
      label+' offline Egypt population is outdated');
    assert.match(await card.locator('.country-story-facts').innerText(),/2024/,
      label+' Egypt population source year missing');
    // The new detail mounts before the next browser paint; validate rendered
    // pixels only after the shared globe illustrator has drawn the canvas.
    await page.waitForFunction(()=>{
      const c=document.querySelector('#detail-screen.active .country-story-board canvas');
      if(!c||c.width<=0||c.height<=0)return false;
      const pixel=c.getContext('2d').getImageData(Math.floor(c.width*.5),
        Math.floor(c.height*.5),1,1).data;
      return pixel[3]>0;
    },null,{timeout:12000});
    // A true country-specific 2.5D scene must have decoded and replaced the
    // original mini-canvas, not merely changed a CSS background color.
    await page.waitForFunction(()=>{
      const card=document.querySelector('#detail-screen.active .country-story');
      const art=card?.querySelector('.country-story-hero-art');
      return card?.classList.contains('has-landscape-art')&&art?.naturalWidth>0&&
        getComputedStyle(art).opacity==='1';
    },null,{timeout:15000});
    const egyptArt=await page.locator('.country-story-hero-art').getAttribute('src');
    assert.equal(egyptArt,'./assets/country-stories/egypt-nile-v2.svg',
      label+' Egypt did not receive the curated Nile/Giza artwork');
    const details=await page.evaluate(()=>{
      const card=document.querySelector('#detail-screen.active .country-story');
      const frame=card.getBoundingClientRect();
      const scene=card.querySelector('canvas');
      const canvas=scene.getContext('2d');
      const sample=canvas.getImageData(Math.floor(scene.width*.5),
        Math.floor(scene.height*.5),1,1).data;
      const action=card.querySelector('.country-story-practice');
      const button=action.getBoundingClientRect();
      const bodyStyle=getComputedStyle(document.getElementById('detail-screen'));
      const fox=card.querySelector('.country-story-fox');
      const foxRect=fox.getBoundingClientRect();
      return {
        x:frame.x,right:frame.right,width:frame.width,height:frame.height,
        viewport:innerWidth,sceneWidth:scene.width,sceneHeight:scene.height,paintAlpha:sample[3],
        actionHeight:button.height,actionWidth:button.width,canvasHeight:scene.getBoundingClientRect().height,
        background:bodyStyle.backgroundImage,
        foxSrc:fox.getAttribute('src'),selected:window.LARIA_FOX.worldSource(window.LARIA_FOX.choice()),
        foxWidth:foxRect.width,foxHeight:foxRect.height,scrollWidth:document.documentElement.scrollWidth,
        factCount:card.querySelectorAll('.country-story-fact').length
      };
    });
    assert(details.x>=-1&&details.right<=details.viewport+1,label+' country page clipped horizontally '+JSON.stringify(details));
    assert(details.width>=details.viewport*.75,label+' tablet still uses tiny white mobile panel '+JSON.stringify(details));
    assert(details.sceneWidth>=160&&details.sceneHeight>=76&&details.paintAlpha>0,
      label+' country art not actually painted '+JSON.stringify(details));
    assert(details.canvasHeight>=240,label+' illustrated hero shrunk too far');
    assert(details.foxSrc===details.selected&&details.foxWidth>60&&details.foxHeight>70,
      label+' wrong or missing selected fox '+JSON.stringify(details));
    assert(details.actionHeight>=48&&details.actionWidth>140,label+' practice button too small');
    assert(details.factCount===3,label+' facts missing or duplicated');
    if(viewport.width>=700&&viewport.height>520){
      const outline=page.locator('#detail-screen.active .country-story-map');
      assert(await outline.isVisible(),label+' iPad still has empty space instead of country contour');
      const outlinePixels=await outline.locator('canvas').evaluate(canvas=>{
        const ctx=canvas.getContext('2d');
        const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let ink=0;
        for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)ink++;
        return ink;
      });
      assert(outlinePixels>120,label+' country contour did not use real geometry');
      // A reading page may scroll. The CTA must remain reachable, not force
      // three discoveries into tiny type just to fit the first viewport.
      await page.locator('.country-story-practice').scrollIntoViewIfNeeded();
      const rect=await page.locator('.country-story-practice').boundingBox();
      assert(rect&&rect.y>=0&&rect.y+rect.height<=viewport.height+1,
        label+' practice button is not reachable by scrolling');
      await page.evaluate(()=>window.scrollTo(0,0));
    }
    assert(details.scrollWidth<=details.viewport+2,label+' horizontal scroll on country page '+JSON.stringify(details));
    assert(details.background.includes('basecamp-v11'),label+' missing Læria illustrated world');
    assert.equal(await page.evaluate(()=>JSON.stringify({
      journey:state.journey,answerLog:state.answerLog,mastery:state.mastery
    })),before,label+' opening country detail mutated learning/progress');

    fs.mkdirSync(screenshotDir,{recursive:true});
    if(['webkit-iphone','webkit-ipad-portrait','webkit-ipad-landscape'].includes(label)){
      await page.screenshot({path:path.join(screenshotDir,label+'-egypt.png'),
        animations:'disabled',fullPage:false});
    }

    await page.locator('#detail-back').click();
    await page.locator('#world-screen.active').waitFor({timeout:9000});
    await page.evaluate(()=>openDetail('td','world'));
    await page.locator('#detail-screen.active .country-story[data-country-detail="td"]').waitFor({timeout:9000});
    await page.waitForFunction(()=>{
      const card=document.querySelector('#detail-screen.active .country-story');
      const art=card?.querySelector('.country-story-hero-art');
      return card?.classList.contains('has-landscape-art')&&art?.naturalWidth>0&&
        getComputedStyle(art).opacity==='1';
    },null,{timeout:15000});
    assert.equal(await page.locator('.country-story-hero-art').getAttribute('src'),
      './assets/country-stories/chad-sahel-ennedi-v2.svg',
      label+' Tsjad reused Egyptian pyramids');
    assert.match(await page.locator('.country-story-summary').innerText(),/Ennedi/,
      label+' Tsjad-specific Sahel explanation missing');
    assert.match(await page.locator('.country-story-facts').innerText(),/20,3\s+mill/,
      label+' offline Tsjad population is outdated');
    if(viewport.width>=700&&viewport.height>520){
      // Previously the Chad contour could appear as an empty beige panel
      // even while the country hero image was fully visible.
      await page.waitForFunction(()=>{
        const canvas=document.querySelector('#detail-screen.active .country-story-outline');
        if(!canvas||canvas.width<140||canvas.dataset.outlineReady!=='true')return false;
        const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
        let ink=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)ink++;
        return ink>120;
      },null,{timeout:9000});
    }
    if(['webkit-iphone','webkit-ipad-portrait','webkit-ipad-landscape'].includes(label)){
      await page.screenshot({path:path.join(screenshotDir,label+'-tsjad.png'),
        animations:'disabled',fullPage:false});
    }
    await page.locator('#detail-back').click();
    await page.locator('#world-screen.active').waitFor({timeout:9000});
    await page.evaluate(()=>openDetail('no','world'));
    await page.locator('#detail-screen.active .country-story[data-country-detail="no"]').waitFor();
    assert.equal((await page.locator('#detail-screen.active .country-story h1').innerText()).trim(),
      'Norge',label+' country data was cached incorrectly');
    assert.equal(await page.locator('#detail-screen.active .country-story-hero-art').count(),0,
      label+' generic countries must not receive wrong curated artwork');

    // Original practice action continues through startCountryPractice(), not a
    // synthetic mini-quiz added by the visual redesign.
    await page.locator('.country-story-practice').click();
    await page.locator('#session-screen.active').waitFor({timeout:10000});
    assert.equal(await page.evaluate(()=>sessionScope.type),'country',
      label+' redesigned CTA changed the practice type');
    assert.deepEqual(errors,[],label+' javascript errors');
    console.log('PASS premium country story',label,avatar,viewport);
    await context.close();
  }finally{await browser.close();}
}
(async()=>{
  const {app,url}=await server();
  try{
    for(const [engine,label,viewport,avatar] of [
      [webkit,'webkit-iphone',{width:390,height:844},'girl'],
      [webkit,'webkit-iphone-small',{width:320,height:640},'boy'],
      [webkit,'webkit-ipad-portrait',{width:820,height:1180},'girl'],
      [webkit,'webkit-ipad-landscape',{width:1180,height:820},'boy'],
      [chromium,'chromium-iphone',{width:390,height:844},'girl']
    ])await run(engine,label,viewport,url,avatar);
  }finally{await new Promise(resolve=>app.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});