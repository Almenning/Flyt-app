'use strict';
/* Premium country detail from the actual app: Egypt, Tsjad, return to Kloden,
   existing learning data and country practice on WebKit iPhone/iPad + Chromium. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {webkit,chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const seed={
  version:7,progressSchemaVersion:3,
  profile:{grade:2,onboarded:true,name:'Læria QA',avatar:'girl',setupVersion:2},
  mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
  masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
  lastMilestone:null,recentCountryWin:null,lastActivity:null,
  journey:{nodes:{},gradeWins:{},viewGrades:{}},
  answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp',
  '.svg':'image/svg+xml','.json':'application/json'};
function startServer(){
  return new Promise((resolve,reject)=>{
    const app=http.createServer((req,res)=>{
      let uri=new URL(req.url,'http://localhost').pathname;
      if(uri.endsWith('/'))uri+='index.html';
      const filename=path.resolve(root,'.'+decodeURIComponent(uri));
      if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
      fs.readFile(filename,(err,bytes)=>{
        if(err){res.writeHead(404);res.end('Missing');return}
        res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
        res.setHeader('Cache-Control','no-store');res.end(bytes);
      });
    });
    app.once('error',reject);
    app.listen(0,'127.0.0.1',()=>{
      resolve({app,url:'http://127.0.0.1:'+app.address().port+'/laer-litt-mer/?app=laria'});
    });
  });
}
async function run(engine,label,viewport,url){
  const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
  try{
    const context=await browser.newContext({
      viewport,hasTouch:true,isMobile:label.includes('iphone'),
      reducedMotion:'reduce',serviceWorkers:'block'
    });
    await context.addInitScript(s=>{
      if(!localStorage.getItem('laerlittmer-v2'))localStorage.setItem('laerlittmer-v2',JSON.stringify(s));
    },seed);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
    await page.route('https://api.worldbank.org/**',r=>r.abort());
    await page.goto(url+'&country-guide-qa='+label,{waitUntil:'domcontentloaded'});
    await page.locator('.bc14-subject[data-camp="subject-norwegian"]').waitFor({timeout:20000});
    for(const name of ['Egypt','Tsjad']){
      const progressBefore=await page.evaluate(()=>JSON.stringify(state.journey));
      await page.evaluate(countryName=>{
        const key=Object.keys(countries).find(id=>countries[id].name===countryName);
        if(!key)throw Error('Missing original country: '+countryName);
        showScreen('world');
        openDetail(key,'world');
      },name);
      const guide=page.locator('#detail-screen.active .laria-country-guide');
      await guide.waitFor({timeout:14000});
      assert.equal(await page.evaluate(()=>JSON.stringify(state.journey)),progressBefore,
        label+' country detail wrote journey progression');
      assert.equal(await guide.locator('.laria-country-guide-fox').count(),1,
        label+' selected personal fox missing from country guide');
      assert.equal((await guide.locator('.laria-country-guide-title').innerText()).trim(),name,
        label+' wrong country displayed');
      assert.equal(await guide.locator('.laria-country-guide-flag').count(),1,
        label+' flag disappeared');
      assert.equal(await guide.locator('.laria-country-fact').count(),3,
        label+' lost country facts');
      assert.equal(await guide.locator('.laria-country-guide-insight').count(),1,
        label+' missing country story');
      assert.match(await guide.locator('.laria-country-guide-insight-text').innerText(),/./);
      const action=guide.locator('.laria-country-guide-practice');
      assert.match(await action.innerText(),new RegExp('Øv på '+name));
      await page.waitForFunction(()=>
        document.querySelector('#detail-screen.active .laria-country-guide-scene')?.dataset.painted==='true'
      ,null,{timeout:12000});
      const metrics=await guide.evaluate(el=>{
        const hero=el.querySelector('.laria-country-guide-hero').getBoundingClientRect();
        const btn=el.querySelector('.laria-country-guide-practice').getBoundingClientRect();
        const scene=el.querySelector('canvas');
        const ctx=scene.getContext('2d');
        const a=ctx.getImageData(0,0,1,1).data,b=ctx.getImageData(0,scene.height-1,1,1).data;
        return {
          viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          hero:{width:hero.width,height:hero.height,left:hero.left,right:hero.right},
          button:{width:btn.width,height:btn.height,left:btn.left,right:btn.right},
          paintedDifferent:a.some((v,i)=>v!==b[i]),
          canvas:{width:scene.width,height:scene.height},
          screenHeight:document.getElementById('detail-screen').getBoundingClientRect().height,
          viewportHeight:innerHeight
        };
      });
      assert(metrics.hero.width>240&&metrics.hero.height>195,
        label+' illustrated hero unexpectedly small '+JSON.stringify(metrics));
      assert(metrics.button.width>180&&metrics.button.height>=48,
        label+' practice tap target too small');
      assert(metrics.scrollWidth<=metrics.viewport+2&&metrics.hero.left>=-1&&
        metrics.hero.right<=metrics.viewport+2&&metrics.button.right<=metrics.viewport+2,
        label+' country detail has horizontal overflow '+JSON.stringify(metrics));
      assert(metrics.canvas.width>100&&metrics.canvas.height>100&&metrics.paintedDifferent,
        label+' country panorama has no painted content');
      assert(metrics.screenHeight>=metrics.viewportHeight-3,
        label+' detail stage leaves uncovered viewport');
      if(process.env.COUNTRY_GUIDE_SCREENSHOTS){
        fs.mkdirSync(process.env.COUNTRY_GUIDE_SCREENSHOTS,{recursive:true});
        await page.screenshot({path:path.join(process.env.COUNTRY_GUIDE_SCREENSHOTS,
          label+'-'+name.toLowerCase()+'.png'),animations:'disabled'});
      }
      await page.locator('#detail-back').click();
      await page.locator('#world-screen.active').waitFor({timeout:12000});
    }
    await page.evaluate(()=>{
      const key=Object.keys(countries).find(id=>countries[id].name==='Egypt');
      openDetail(key,'world');
    });

    await page.locator('.laria-country-guide-practice').click();
    await page.locator('#session-screen.active').waitFor({timeout:16000});
    assert.deepEqual(errors,[],label+' javascript errors');
    console.log('PASS premium country guide',label,viewport);
    await context.close();
  }finally{await browser.close()}
}
(async()=>{
  const {app,url}=await startServer();
  try{
    for(const [engine,label,viewport] of [
      [webkit,'webkit-iphone-small',{width:320,height:640}],
      [webkit,'webkit-iphone',{width:390,height:844}],
      [webkit,'webkit-ipad-portrait',{width:820,height:1180}],
      [webkit,'webkit-ipad-landscape',{width:1180,height:820}],
      [chromium,'chromium-ipad-landscape',{width:1180,height:820}]
    ])await run(engine,label,viewport,url);
  }finally{await new Promise(resolve=>app.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});