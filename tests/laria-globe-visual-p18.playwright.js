'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const out=process.env.QA_SCREENSHOTS||'/tmp/laria-p18-globe';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};

function server(){
  return new Promise((resolve,reject)=>{
    const s=http.createServer((req,res)=>{
      const u=new URL(req.url,'http://127.0.0.1');
      const rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';
      const file=path.resolve(root,rel);
      if(!file.startsWith(root)){res.writeHead(403);res.end('forbidden');return}
      fs.readFile(file,(err,data)=>{
        if(err){res.writeHead(404);res.end('not found');return}
        res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');res.end(data);
      });
    });
    s.once('error',reject);s.listen(0,'127.0.0.1',()=>resolve({s,url:'http://127.0.0.1:'+s.address().port+'/'}));
  });
}
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'GlobeQA',avatar:'boy',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
  preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};

async function assertProfileFoxSelection(browserType){
  const browser=await browserType.launch({headless:true});
  try{
    const sources={};
    for(const avatar of ['boy','girl']){
      const avatarSeed={...seed,profile:{...seed.profile,avatar}};
      const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',deviceScaleFactor:1});
      const page=await ctx.newPage();
      await page.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),avatarSeed);
      await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
      await page.route('https://api.worldbank.org/**',r=>r.abort());
      await page.goto(globalThis.__url+'?app=laria&p18=profile-'+avatar,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>typeof openGlobe==='function'&&window.LARIA_PROFILE_AVATARS);
      await page.evaluate(()=>openGlobe());
      await page.locator('#world-screen.active .premium-globe-fox').waitFor();
      const pair=await page.evaluate(a=>({
        actual:document.querySelector('#world-screen.active .premium-globe-fox')?.getAttribute('src')||'',
        expected:window.LARIA_PROFILE_AVATARS?.[a]||'',
        guide:document.querySelector('#world-screen.active .premium-globe-guide')?.getAttribute('src')||'',
        guideAvatar:document.querySelector('#world-screen.active .premium-globe-guide')?.dataset.profileAvatar||''
      }),avatar);
      assert.ok(pair.expected.startsWith('data:image/webp;base64,'),'missing '+avatar+' profile fox source');
      assert.equal(pair.actual,pair.expected,'globe did not render selected '+avatar+' profile fox');
      assert.equal(pair.guide,'./lia-fox-explorer-home.webp','physical globe guide must use the established transparent explorer asset');
      assert.equal(pair.guideAvatar,avatar,'physical globe guide lost profile context');
      sources[avatar]=pair.actual;
      await ctx.close();
    }
    assert.notEqual(sources.boy,sources.girl,'boy and girl globe companions must remain distinct');
  }finally{await browser.close()}
}

async function capture(browserType,label,viewport){
  const browser=await browserType.launch({headless:true});
  try{
    const ctx=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:true,serviceWorkers:'block',deviceScaleFactor:1});
    const page=await ctx.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.addInitScript(x=>localStorage.setItem('laerlittmer-v2',JSON.stringify(x)),seed);
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(globalThis.__url+'?app=laria&p18=globe-'+label,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof openGlobe==='function'&&document.getElementById('globe-canvas'));
    await page.evaluate(()=>openGlobe());
    await page.locator('#world-screen.active').waitFor();
    await page.waitForFunction(()=>{
      const c=document.getElementById('globe-canvas'),r=c?.getBoundingClientRect();
      return r&&r.width>250&&r.height>250;
    });
    await page.waitForTimeout(650);
    const sceneName=viewport.width>viewport.height&&viewport.width>=900?'landscape':viewport.width>=700?'tablet':'mobile';
    const backgroundImage=await page.evaluate(()=>getComputedStyle(document.getElementById('world-screen')).backgroundImage);
    assert.ok(backgroundImage.includes('globe-locked-environment-v36-'+sceneName+'.svg'),label+' did not load the correct illustrated nature scene: '+backgroundImage);
    assert.ok(!backgroundImage.includes('basecamp-v11'),label+' incorrectly shows fantasy village behind globe');
    // Prevent the old unified globe plaque/fox pseudos from painting a gold
    // vertical seam through the locked landscape in any device configuration.
    const legacyPseudos=await page.evaluate(()=>{
      const screen=document.getElementById('world-screen');
      return ['::before','::after'].map(pseudo=>{
        const computed=getComputedStyle(screen,pseudo);
        return {pseudo,display:computed.display,content:computed.content};
      });
    });
    for(const pseudo of legacyPseudos){
      assert.equal(pseudo.display,'none',label+' legacy globe overlay '+pseudo.pseudo+' must not appear');
    }
    const metrics=await page.evaluate(()=>{
      const screen=document.getElementById('world-screen').getBoundingClientRect();
      const canvasEl=document.getElementById('globe-canvas');
      const canvas=canvasEl.getBoundingClientRect();
      const mode=document.getElementById('globe-mode').getBoundingClientRect();
      const back=document.getElementById('world-back').getBoundingClientRect();
      const zoomIn=document.getElementById('globe-zoom-in').getBoundingClientRect();
      const zoomOut=document.getElementById('globe-zoom-out').getBoundingClientRect();
      const wrap=document.querySelector('.globe-wrap');
      const guide=document.querySelector('.premium-globe-guide');
      const guideBox=guide?.getBoundingClientRect();
      const statusBox=document.querySelector('.globe-status')?.getBoundingClientRect();
      return {
        screen:{w:screen.width,h:screen.height},
        canvas:{w:canvas.width,h:canvas.height,opacity:Number(getComputedStyle(canvasEl).opacity||1),
          bitmapW:canvasEl.width,bitmapH:canvasEl.height,dpr:canvasEl._dpr||1},
        mode:{w:mode.width,h:mode.height},
        back:{w:back.width,h:back.height},
        zoomIn:{w:zoomIn.width,h:zoomIn.height},
        zoomOut:{w:zoomOut.width,h:zoomOut.height},
        underlay:getComputedStyle(wrap,'::before').backgroundImage||'',
        guide:guide?{display:getComputedStyle(guide).display,w:guideBox?.width||0,h:guideBox?.height||0,top:guideBox?.top||0,bottom:guideBox?.bottom||0}:null,
        status:statusBox?{top:statusBox.top,bottom:statusBox.bottom}:null,
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
      };
    });

    // Capture the actual card, controls and canvas rectangles so a live country
    // label cannot disappear behind a button even when all elements are visible.
    const layout=await page.evaluate(()=>{
      const box=q=>{
        const el=document.querySelector(q),r=el?.getBoundingClientRect();
        return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width}:null;
      };
      return {
        country:box('#globe-status'),
        actions:box('#world-screen .globe-actions'),
        tagline:box('#world-screen .globe-country-tagline'),
        modes:box('#globe-mode'),
        globe:box('#globe-canvas'),
        zoomIn:box('#globe-zoom-in'),
        zoomOut:box('#globe-zoom-out')
      };
    });
    assert.ok(layout.country&&layout.actions&&layout.globe,label+' missing active globe layout');
    // The zoom pair belongs at the globe's visual equator, not in its top
    // quadrant. Verify real pixels in Chromium and Safari on all QA sizes.
    assert.ok(layout.zoomIn&&layout.zoomOut,label+' missing usable zoom buttons');
    const globeCenter=(layout.globe.top+layout.globe.bottom)/2;
    const zoomCenter=(layout.zoomIn.top+layout.zoomOut.bottom)/2;
    assert.ok(Math.abs(globeCenter-zoomCenter)<=Math.max(12,layout.globe.height*.045),
      label+' zoom pair is not centered on globe: '+JSON.stringify({globeCenter,zoomCenter,layout}));
    assert.ok(layout.zoomIn.top>layout.modes.bottom+7,
      label+' zoom-in collides with mode selector');
    assert.ok(layout.zoomOut.bottom<layout.country.top-7,
      label+' zoom-out collides with country card');
    assert.ok(layout.zoomIn.left>=-1&&layout.zoomOut.right<=viewport.width+1,
      label+' zoom buttons spill beyond viewport');

    assert.ok(layout.country.bottom+8<=layout.actions.top,label+' country card overlaps bottom actions: '+JSON.stringify(layout));
    if(layout.tagline){
      assert.ok(layout.tagline.bottom<=layout.country.bottom-3,label+' country tagline clipped by status card: '+JSON.stringify(layout));
    }
    if(viewport.width>=900&&viewport.width>viewport.height){
      assert.ok(layout.modes.bottom+3<=layout.globe.top,label+' mode tabs collide with rotating globe: '+JSON.stringify(layout));
      assert.ok(layout.globe.bottom+3<=layout.country.top,label+' globe collides with land card: '+JSON.stringify(layout));
    }
    // Child-facing text must stay legible on the physical country card.
    const readability=await page.evaluate(()=>{
      const facts=[...document.querySelectorAll('#world-screen.active .premium-country-facts span')];
      const fontSize=el=>Number.parseFloat(getComputedStyle(el).fontSize);
      const rect=el=>el.getBoundingClientRect();
      const card=document.querySelector('#world-screen.active .globe-status');
      return {fonts:facts.map(fontSize),
        allWithinCard:facts.every(el=>rect(el).bottom<=rect(card).bottom+1),
        scene:getComputedStyle(document.getElementById('world-screen')).backgroundImage,
        foxMask:getComputedStyle(document.querySelector('#world-screen.active .premium-globe-fox')).maskImage||''};
    });
    const minimumFactSize=viewport.width<700?10:viewport.width>viewport.height&&viewport.height<=700?10.9:11.9;
    assert.ok(readability.fonts.length>=2,label+' missing visible country facts');
    assert.ok(readability.fonts.every(v=>v>=minimumFactSize),label+' country facts are too small: '+JSON.stringify(readability));
    assert.ok(readability.allWithinCard,label+' country facts overflow their card');
    assert.ok(readability.scene.includes('globe-locked-environment-v36-'),label+' old landscape still visible');
    if(label==='webkit-desktop-landscape'){
      const canvasBox=await page.locator('#globe-canvas').boundingBox();
      const cx=canvasBox.x+canvasBox.width*.55,cy=canvasBox.y+canvasBox.height*.55;
      const beforeLon=await page.evaluate(()=>globeLon);
      await page.mouse.move(cx,cy);
      await page.mouse.down();
      await page.mouse.move(cx+52,cy+15,{steps:6});
      await page.mouse.up();
      const afterLon=await page.evaluate(()=>globeLon);
      assert.ok(Math.abs(afterLon-beforeLon)>3,label+' real pointer drag failed to rotate globe');
      const beforeZoom=await page.evaluate(()=>globeZoom);
      await page.locator('#globe-zoom-in').click();
      const afterZoom=await page.evaluate(()=>globeZoom);
      assert.ok(afterZoom>beforeZoom+.1,label+' zoom-in failed to enlarge globe');
      await page.locator('#globe-zoom-out').click();
      await page.evaluate(()=>{globeLon=15;globeLat=18;window.drawGlobe()});
    }
    assert.equal(metrics.overflow,false,label+' horizontal overflow');
    const minGlobeWidth=viewport.width<600?viewport.width*.84:(viewport.width>viewport.height?viewport.height*.52:viewport.width*.68);
    assert.ok(metrics.canvas.w+0.75>=minGlobeWidth,label+' globe too narrow for locked composition: '+metrics.canvas.w+' < '+minGlobeWidth);
    assert.ok(metrics.canvas.h>=300,label+' globe too short: '+metrics.canvas.h);
    // A round globe is non-negotiable: CSS and backing bitmap must use the
    // same proportions on iPhone, iPad and landscape desktop Safari.
    assert.ok(Math.abs(metrics.canvas.w-metrics.canvas.h)<=1,
      label+' globe has been visually stretched: '+JSON.stringify(metrics.canvas));
    assert.ok(Math.abs(metrics.canvas.bitmapW/metrics.canvas.bitmapH-metrics.canvas.w/metrics.canvas.h)<.01,
      label+' canvas bitmap ratio disagrees with CSS globe ratio: '+JSON.stringify(metrics.canvas));
    assert.ok(metrics.back.h>=44,label+' globe back control below 44px');
    assert.ok(metrics.mode.h>=44,label+' globe mode control below 44px');
    assert.ok(metrics.zoomIn.h>=44&&metrics.zoomIn.w>=44,label+' zoom-in control below 44px');
    assert.ok(metrics.zoomOut.h>=44&&metrics.zoomOut.w>=44,label+' zoom-out control below 44px');
    assert.ok(metrics.canvas.opacity>=.95,label+' rotating globe canvas must stay visually primary');
    assert.equal(metrics.underlay.includes('globe-map-art-v1.png'),false,label+' must not place static geography behind the rotating globe');
    assert.ok(!metrics.guide||metrics.guide.display==='none',label+' physical explorer must not overlap the locked atlas composition');
    assert.equal(await page.locator('[data-globe-mode="explore"]').isVisible(),true);
    assert.equal(await page.locator('[data-globe-mode="mine"]').isVisible(),true);
    assert.equal(await page.locator('[data-globe-mode="classic"]').isVisible(),true);
    assert.equal(await page.locator('#globe-mode [data-globe-mode]').count(),3,label+' must expose Utforsk, Min verden and Kloden');
    assert.equal(await page.locator('#random-country').isVisible(),true);
    assert.equal(await page.locator('#reset-globe').isVisible(),true);
    assert.equal(await page.locator('#globe-zoom-in').isVisible(),true,label+' zoom-in hidden');
    assert.equal(await page.locator('#globe-zoom-out').isVisible(),true,label+' zoom-out hidden');

    const projectionSync=await page.evaluate(()=>{
      const canvas=document.getElementById('globe-canvas'),w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h);
      const previous={lon:globeLon,lat:globeLat,zoom:globeZoom};
      globeLon=15;globeLat=18;globeZoom=1.25;
      window.drawGlobe();
      const x=w*.57,y=h*.46,anchor=globeInverse(x,y);
      globeZoom=3.2;
      keepGlobeAnchor(anchor,x,y);
      window.drawGlobe();
      const after=globeInverse(x,y);
      const lonDiff=Math.abs(((after.lon-anchor.lon+540)%360)-180),latDiff=Math.abs(after.lat-anchor.lat);
      globeLon=previous.lon;globeLat=previous.lat;globeZoom=previous.zoom;window.drawGlobe();
      return {lonDiff,latDiff,renderSource:window.__LARIA_GLOBE_RENDER_SOURCE};
    });
    assert.ok(projectionSync.lonDiff<.12,label+' pinch anchor longitude drifted: '+projectionSync.lonDiff);
    assert.ok(projectionSync.latDiff<.12,label+' pinch anchor latitude drifted: '+projectionSync.latDiff);

    assert.equal(projectionSync.renderSource,'country-geometry',label+' must draw visible land from real country polygons');
    for(const mode of ['explore','mine','classic']){
      await page.locator('[data-globe-mode="'+mode+'"]').click();
      await page.waitForTimeout(250);
      assert.equal(await page.locator('[data-globe-mode="'+mode+'"]').getAttribute('class').then(x=>(x||'').includes('active')),true,label+' '+mode+' mode did not activate');
      await page.screenshot({path:path.join(out,label+'-'+mode+'.png'),fullPage:true});
    }
    fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(metrics,null,2));
    assert.deepEqual(errors,[],label+' page errors: '+errors.join('\n'));
    await ctx.close();
  }finally{await browser.close()}
}

(async()=>{
  const {s,url}=await server();globalThis.__url=url;
  try{
    const rendererSource=fs.readFileSync(path.join(root,'globe-v25-renderer.js'),'utf8');
    for(const token of ["'Europa':'#6D9E50'","'Asia':'#879A50'","'Afrika':'#B9784F'","'Nord-Amerika':'#57934F'","'Sør-Amerika':'#3D8B50'"]){
      assert.ok(rendererSource.includes(token),'locked natural-atlas base drift: '+token);
    }
    assert.ok(rendererSource.includes('paintPolarLand(ctx,w,h,s);'),'locked globe polar treatment missing');
    assert.ok(rendererSource.includes('paintStoryBiomes(ctx,w,h,s);'),'locked globe biome relief missing');
    assert.ok(rendererSource.includes('paintAtlasTexture(ctx,w,h,s);'),'locked globe painterly land texture missing');
    assert.ok(rendererSource.includes("['desert',14,25,.220]"),'Sahara biome lost locked atlas scale');
    assert.ok(rendererSource.includes("type==='mountains'?1.38"),'storybook relief scale drifted down');
    assert.ok(rendererSource.includes("const borderAlpha=globeZoom>2.5?.48:globeZoom>1.65?.34:.22"),'political borders became visually dominant again');
    assert.equal(rendererSource.includes("const sparks=[[-.95,-.70"),false,'legacy target-ring/spark marker must stay removed');
    await assertProfileFoxSelection(chromium);
    await capture(chromium,'chromium-iphone',{width:390,height:844});
    await capture(webkit,'webkit-iphone',{width:390,height:844});
    await capture(webkit,'webkit-ipad',{width:820,height:1180});
    await capture(webkit,'webkit-ipad-landscape',{width:1180,height:820});
    await capture(webkit,'webkit-desktop-landscape',{width:1525,height:864});
    console.log('ok - Prompt 18 globe visual evidence captured');
  }finally{s.close()}
})().catch(err=>{console.error(err);process.exit(1)});
