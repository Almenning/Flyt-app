'use strict';
const assert=require('node:assert/strict');
const {mkdir,readFile}=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const openSubject=require('./helpers/laria-home-open-subject.cjs');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'};
async function serve(){
 const server=http.createServer(async(req,res)=>{
  try{
   const part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(root,'.'+(part==='/'?'/index.html':part));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
   const bytes=await readFile(file);
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
   res.end(bytes);
  }catch(_){res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return server;
}
const out=process.env.LARIA_COUNTRY_CARD_SHOTS||'/tmp/laria-globe-country-card';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Eventyrer',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};

module.exports=async function run(){
 await mkdir(out,{recursive:true});
 const server=await serve();
 const base='http://127.0.0.1:'+server.address().port+'/?app=laria';
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_COUNTRY_CARD_ENGINE&&process.env.LARIA_COUNTRY_CARD_ENGINE!==name)continue;
  const local=name==='chromium'&&process.env.LARIA_CHROMIUM_PATH;
  const browser=await engine.launch(local?{executablePath:local,args:['--no-sandbox']}:undefined);
  try{
   for(const [device,width,height] of [['iPad-liggende',1180,820],['iPad-staende',820,1180],['iPhone-staende',390,844],['iPhone-liggende',844,390],['iPhone-kompakt',320,568],['desktop',1440,900]]){
    if(process.env.LARIA_COUNTRY_CARD_DEVICE&&device!==process.env.LARIA_COUNTRY_CARD_DEVICE)continue;
    const context=await browser.newContext({viewport:{width,height},hasTouch:device!=='desktop',serviceWorkers:'block',reducedMotion:'reduce'});
    try{
     await context.route('https://raw.githubusercontent.com/**',r=>r.abort());
     await context.route('https://api.worldbank.org/**',r=>r.abort());
     await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     await page.goto(base,{waitUntil:'domcontentloaded'});
     await openSubject(page,'geography');
     await page.locator('#laria-geography-world [data-gv="globe"]').click();
     const world=page.locator('#world-screen.active');
     await world.locator('#atlas-canvas[data-map-ready="true"]').waitFor({timeout:25000});
     const search=async term=>{
      await world.locator('.laria-atlas-find summary').click();
      await world.locator('#world-search').fill(term);
      await world.locator('#world-search-results button').filter({hasText:term}).first().click();
     };
     const before=await page.evaluate(()=>JSON.stringify([state.journey,state.mastery,state.answerLog]));
     for(const [mode,country,flag] of [['explore','Mauritania','🇲🇷'],['classic','Mauritania','🇲🇷'],['mine','Den sentralafrikanske republikk','🇨🇫']]){
      await world.locator('[data-globe-mode="'+mode+'"]').click();
      await world.locator('[data-globe-mode="'+mode+'"].active').waitFor();
      await search(country);
      const card=world.locator('#globe-status.premium-country-selected');
      const learn=card.getByRole('button',{name:'Lær mer om '+country,exact:true});
      await learn.waitFor();
      await card.scrollIntoViewIfNeeded();
      const layout=await card.evaluate(el=>{
       const rect=node=>{const r=node.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};};
       return {card:rect(el),flag:rect(el.querySelector('.flag')),copy:rect(el.querySelector('.globe-country-copy')),
        learn:rect(el.querySelector('.premium-country-learn')),flagText:el.querySelector('.flag').textContent,
        title:rect(el.querySelector('.globe-country-line')),facts:rect(el.querySelector('.premium-country-facts')),
        tagline:rect(el.querySelector('.globe-country-tagline')),actions:rect(el.closest('#world-screen').querySelector('.globe-actions')),
        scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
      });
      const stem=name+'-'+device+'-'+mode;
      await page.screenshot({path:path.join(out,stem+'.jpg'),type:'jpeg',quality:91,animations:'disabled'});
      assert.equal(layout.flagText,flag);
      assert.equal(await card.getByRole('img',{name:'Flagget til '+country,exact:true}).count(),1);
      assert.equal(await learn.innerText(),'Lær mer');
      const overlap=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.5&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.5;
      assert.ok(layout.flag.w>=30&&layout.flag.h>=30,stem+' missing flag');
      assert.ok(layout.learn.w>=44&&layout.learn.h>=44,stem+' learn action under 44px');
      assert.equal(overlap(layout.flag,layout.title),false,stem+' flag overlaps title or status');
      assert.equal(overlap(layout.flag,layout.facts),false,stem+' flag overlaps facts');
      assert.equal(overlap(layout.tagline,layout.facts),false,stem+' teaser overlaps facts');
      assert.equal(overlap(layout.flag,layout.learn),false,stem+' flag overlaps action');
      assert.equal(overlap(layout.copy,layout.learn),false,stem+' copy overlaps action');
      for(const r of [layout.flag,layout.title,layout.facts,layout.tagline,layout.copy,layout.learn]){
       assert.ok(r.x>=layout.card.x-.5&&r.x+r.w<=layout.card.x+layout.card.w+.5,stem+' clips horizontally');
       assert.ok(r.y>=layout.card.y-.5&&r.y+r.h<=layout.card.y+layout.card.h+.5,stem+' clips vertically');
      }
      assert.equal(overlap(layout.card,layout.actions),false,stem+' card overlaps bottom controls');
      assert.ok(layout.card.x>=-.5&&layout.card.x+layout.card.w<=width+.5,stem+' card offscreen');
      assert.ok(layout.scrollWidth<=layout.clientWidth+1,stem+' overflowing card');
      if(mode==='explore'){
       assert.match(await card.innerText(),/Nouakchott/);
       const selected=await page.evaluate(()=>globeSelected);
       await learn.click();
       const detail=page.locator('#detail-screen.active');
       await detail.waitFor();
       assert.match(await detail.innerText(),/Mauritania/);
       await detail.locator('#detail-back').click();
       await learn.waitFor();
       assert.equal(await page.evaluate(()=>globeSelected),selected,'return lost selected country');
      }
     }
     assert.equal(await page.evaluate(()=>JSON.stringify([state.journey,state.mastery,state.answerLog])),before,'preview rewrote learning data');
     assert.deepEqual(errors,[]);
     console.log('PASS country card',name,device);
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }}finally{await new Promise(resolve=>server.close(resolve));}
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
