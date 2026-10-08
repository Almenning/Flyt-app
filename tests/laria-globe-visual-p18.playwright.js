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
        canvas:{w:canvas.width,h:canvas.height,opacity:Number(getComputedStyle(canvasEl).opacity||1)},
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
    assert.equal(metrics.overflow,false,label+' horizontal overflow');
    const minGlobeWidth=viewport.width<600?viewport.width*.84:(viewport.width>viewport.height?viewport.height*.52:viewport.width*.68);
    assert.ok(metrics.canvas.w>=minGlobeWidth,label+' globe too narrow for locked composition: '+metrics.canvas.w+' < '+minGlobeWidth);
    assert.ok(metrics.canvas.h>=300,label+' globe too short: '+metrics.canvas.h);
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

    // A matching zoom radius is not enough: the painted earth must agree with
    // genuine land polygons. This catches the old Spain-on-the-ocean atlas bug.
    await page.waitForFunction(()=>window.__LARIA_GLOBE_GEO_ATLAS?.ready===true,{timeout:30000});
    const geographicAlignment=await page.evaluate(()=>{
      const geo=window.__LARIA_GLOBE_GEO_ATLAS;
      const probes=[
        ['Spania',-4,40,true],['USA',-100,40,true],['Brasil',-55,-11,true],
        ['Norge',12,64,true],['Japan',139,36,true],['Island',-19,65,true],
        ['Sahara',12,25,true],['Atlanterhavet',-43,34,false],
        ['Stillehavet',-145,0,false],['Indiahavet',75,-25,false]
      ];
      const prev={lon:globeLon,lat:globeLat,zoom:globeZoom,selected:globeSelected};
      const canvas=document.getElementById('globe-canvas'),ctx=canvas.getContext('2d');
      const samples=[];
      globeSelected=null;globeZoom=1.5;
      for(const [name,lon,lat,expectedLand] of probes){
        globeLon=lon;globeLat=lat;window.drawGlobe();
        const x=Math.round(canvas.width/2),y=Math.round(canvas.height/2);
        const rgba=[...ctx.getImageData(x,y,1,1).data];
        samples.push({name,lon,lat,expectedLand,land:geo.isLandAt(lon,lat),rgba});
      }
      globeLon=prev.lon;globeLat=prev.lat;globeZoom=prev.zoom;globeSelected=prev.selected;window.drawGlobe();
      return {geometryCount:geo.geometryCount,projection:geo.projection,source:geo.source,samples};
    });
    assert.ok(geographicAlignment.geometryCount>=130,label+' missing country geometries in atlas');
    assert.equal(geographicAlignment.projection,'EPSG:4326',label+' atlas is not georeferenced');
    assert.equal(geographicAlignment.source,'real-country-geometries',label+' stale illustrative raster still active');
    for(const p of geographicAlignment.samples)assert.equal(p.land,p.expectedLand,label+' incorrect coastline at '+p.name);
    const spain=geographicAlignment.samples.find(p=>p.name==='Spania');
    const ocean=geographicAlignment.samples.find(p=>p.name==='Atlanterhavet');
    assert.ok(spain.rgba[0]>ocean.rgba[0]+20,label+' visible atlas fails Spain vs Atlantic pixel contrast: '+JSON.stringify({spain:spain.rgba,ocean:ocean.rgba}));

    const projectionSync=await page.evaluate(()=>{
      const canvas=document.getElementById('globe-canvas'),w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h);
      const previous={lon:globeLon,lat:globeLat,zoom:globeZoom};
      globeLon=15;globeLat=18;globeZoom=1.25;
      window.drawGlobe();
      const x=w*.57,y=h*.46,anchor=globeInverse(x,y);
      globeZoom=3.2;
      keepGlobeAnchor(anchor,x,y);
      window.drawGlobe();
      const after=globeInverse(x,y),atlas={...(window.__LARIA_GLOBE_ATLAS_STATE||{})};
      const lonDiff=Math.abs(((after.lon-anchor.lon+540)%360)-180),latDiff=Math.abs(after.lat-anchor.lat);
      const expectedRadius=s*.455*globeZoom;
      globeLon=previous.lon;globeLat=previous.lat;globeZoom=previous.zoom;window.drawGlobe();
      return {lonDiff,latDiff,atlas,expectedRadius};
    });
    assert.ok(projectionSync.lonDiff<.12,label+' pinch anchor longitude drifted: '+projectionSync.lonDiff);
    assert.ok(projectionSync.latDiff<.12,label+' pinch anchor latitude drifted: '+projectionSync.latDiff);
    assert.ok(Math.abs(Number(projectionSync.atlas.radius)-projectionSync.expectedRadius)<1.2,label+' illustrated atlas is not using the same zoomed projection radius as country geometry');
    assert.ok(Math.abs(Number(projectionSync.atlas.zoom)-3.2)<.001,label+' illustrated atlas did not receive globe zoom');

    // Capture the two user-reported failure cases with a selected-country
    // polygon ON the geographically registered texture at real focus zoom.
    for(const countryName of ['Spania','Island']){
      const focused=await page.evaluate(name=>{
        const c=WORLD_COUNTRIES.find(x=>x.name===name);
        focusCountry(c.id);
        window.drawGlobe();
        return {selected:globeSelected,expected:c.id,land:window.__LARIA_GLOBE_GEO_ATLAS.isLandAt(c.lon,c.lat),zoom:globeZoom};
      },countryName);
      assert.equal(focused.selected,focused.expected,label+' selected country mismatch for '+countryName);
      assert.equal(focused.land,true,label+' selected country is over painted ocean: '+countryName);
      assert.ok(focused.zoom>1.5,label+' country focus did not zoom: '+countryName);
      await page.screenshot({path:path.join(out,label+'-focus-'+countryName.toLowerCase()+'.png'),fullPage:true});
    }
    await page.locator('#reset-globe').click();

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
    console.log('ok - Prompt 18 globe visual evidence captured');
  }finally{s.close()}
})().catch(err=>{console.error(err);process.exit(1)});
