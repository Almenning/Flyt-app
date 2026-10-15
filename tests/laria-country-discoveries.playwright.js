'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {webkit,chromium}=require('playwright');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const screenshots=process.env.COUNTRY_DISCOVERY_SCREENSHOTS||'/tmp/laria-country-discoveries';
const seed={version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'LandQA',avatar:'girl',setupVersion:2},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'};
async function makeServer(){
 const server=http.createServer((req,res)=>{
   let file;try{let part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(part==='/')part='/index.html';file=path.resolve(root,'.'+part);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}}catch(_){res.writeHead(400);res.end();return}
   fs.readFile(file,(e,b)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b)});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {server,url:'http://127.0.0.1:'+server.address().port+'/?app=laria'};
}
async function prepare(context,url,avatar='girl',supported=true){
 await context.addInitScript(({seed,avatar,supported})=>{
   seed.profile.avatar=avatar;localStorage.setItem('laerlittmer-v2',JSON.stringify(seed));
   window.__countrySpeech={items:[],cancels:0};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:supported?{
     cancel(){window.__countrySpeech.cancels++},
     getVoices(){return [{name:'Norwegian test voice',lang:'nb-NO'}]},
     speak(u){window.__countrySpeech.items.push(u)}
   }:undefined});
   Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:supported?class{constructor(text){this.text=text}}:undefined});
 },{seed,avatar,supported});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.LARIA_COUNTRY_DISCOVERY_UI&&!!window.LARIA_COUNTRY_DETAIL_PREMIUM&&typeof openDetail==='function');
 return {page,errors};
}
async function run(engine,label,viewport,url,avatar){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  const {page,errors}=await prepare(context,url,avatar);
  const before=await page.evaluate(()=>JSON.stringify({journey:state.journey,answerLog:state.answerLog,mastery:state.mastery}));
  await page.evaluate(()=>{openGlobe('explore');focusCountry('ch')});
  await page.waitForFunction(()=>document.querySelector('#globe-status .globe-country-tagline')?.textContent===LARIA_COUNTRY_DISCOVERIES.get('ch').teaser);
  const globe=await page.evaluate(()=>JSON.stringify([globeLon,globeLat,globeZoom,globeSelected]));
  await page.locator('#globe-status .premium-country-learn').click();
  await page.locator('#detail-screen.active .country-discovery').first().waitFor();
  assert.equal(await page.locator('.country-discovery').count(),3,label);
  assert.match(await page.locator('.country-discoveries').innerText(),/Matterhorn/);
  assert.match(await page.locator('.country-discoveries').innerText(),/retoromansk/);
  assert.equal(await page.locator('.country-story').getAttribute('data-country-content'),'ready');
  assert.equal(await page.locator('.country-story-fox').getAttribute('src'),await page.evaluate(()=>LARIA_FOX.worldSource(LARIA_FOX.choice())));
  assert.match(await page.locator('.country-story-facts').innerText(),/2024/);
  assert(!/8,2/.test(await page.locator('.country-story-facts').innerText()));
  assert.equal(await page.evaluate(()=>__countrySpeech.items.length),0,'No country autoplay');
  await page.locator('.country-read-aloud').click();
  assert.equal(await page.locator('.country-read-aloud').getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>__countrySpeech.items[0].lang),'nb-NO');
  assert.match(await page.evaluate(()=>__countrySpeech.items[0].text),/Matterhorn/);
  await page.evaluate(()=>{window.__staleCountryEnd=__countrySpeech.items[0].onend;__countrySpeech.items[0].onend()});
  assert.equal(await page.evaluate(()=>__countrySpeech.items.length),2);
  assert.match(await page.evaluate(()=>__countrySpeech.items[1].text),/Fire språk/);
  await page.locator('.country-read-aloud').click();
  await page.evaluate(()=>window.__staleCountryEnd());
  assert.equal(await page.evaluate(()=>__countrySpeech.items.length),2,'Cancelled callback requeued speech');
  assert.equal(await page.locator('.country-read-aloud').getAttribute('aria-pressed'),'false');
  await page.locator('.country-discovery-sources summary').click();
  const links=await page.locator('.country-discovery-sources a').evaluateAll(nodes=>nodes.map(n=>({href:n.href,rel:n.rel})));
  assert(links.length>=3&&links.every(a=>a.href.startsWith('https:')&&a.rel.includes('noopener')));
  await page.locator('.country-discovery-sources summary').click();
  assert(await page.locator('.country-discovery p').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),label+' horizontal overflow');
  await page.locator('.country-story-practice').scrollIntoViewIfNeeded();
  const cta=await page.locator('.country-story-practice').boundingBox();
  assert(cta&&cta.height>=48&&cta.width>=120&&cta.y+cta.height<=viewport.height+2);
  await page.evaluate(()=>window.scrollTo(0,0));
  fs.mkdirSync(screenshots,{recursive:true});
  await page.screenshot({path:path.join(screenshots,label+'-switzerland.png'),fullPage:true,animations:'disabled'});
  await page.locator('.country-read-aloud').click();
  const cancels=await page.evaluate(()=>__countrySpeech.cancels);
  await page.locator('#detail-back').click();
  await page.locator('#world-screen.active').waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify([globeLon,globeLat,globeZoom,globeSelected])),globe,'Return lost globe view');
  assert(await page.evaluate(()=>__countrySpeech.cancels)>cancels,'Navigation did not stop reading');
  await page.evaluate(()=>openDetail('cz','world'));
  assert.match(await page.locator('.country-discoveries').innerText(),/robot/);
  assert(!/Matterhorn/.test(await page.locator('.country-discoveries').innerText()));
  await page.locator('.country-read-aloud').click();
  await page.evaluate(()=>__countrySpeech.items.at(-1).onerror({error:'synthesis-failed'}));
  assert.equal(await page.locator('.country-read-aloud').getAttribute('aria-pressed'),'false');
  assert.match(await page.locator('.country-reading-status').innerText(),/prøve igjen/);
  await page.locator('.country-read-aloud').click();
  await page.evaluate(()=>openDetail('ch','world'));
  assert.equal(await page.locator('.country-read-aloud').getAttribute('aria-pressed'),'false','Switch country left reader active');
  await page.evaluate(()=>openDetail('cz','world'));
  await page.screenshot({path:path.join(screenshots,label+'-czechia.png'),fullPage:true,animations:'disabled'});
  await page.evaluate(()=>openDetail('al','world'));
  assert.equal(await page.locator('.country-story').getAttribute('data-country-content'),'missing');
  assert.equal(await page.locator('.country-discovery').count(),0,'Fallback invented discoveries');
  assert.equal(await page.locator('.country-story-fact').count(),3);
  assert.match(await page.locator('.country-story h2').innerText(),/Kort om Albania/);
  assert(!/Tre|spennende spor/.test(await page.locator('.country-story h2').innerText()));
  assert.equal(await page.evaluate(()=>JSON.stringify({journey:state.journey,answerLog:state.answerLog,mastery:state.mastery})),before,'Reading changed learning data');
  await page.evaluate(()=>openDetail('cz','world'));
  await page.locator('.country-story-practice').click();
  await page.locator('#session-screen.active').waitFor();
  assert.equal(await page.evaluate(()=>sessionScope.type),'country');
  assert.deepEqual(errors,[],label+' page errors');
  console.log('PASS country discoveries',label,avatar);
  await context.close();
  if(label==='webkit-iphone'){
    const off=await browser.newContext({viewport,serviceWorkers:'block'});
    const {page:p}=await prepare(off,url,avatar,false);
    await p.evaluate(()=>openDetail('ch','world'));
    assert(await p.locator('.country-read-aloud').isDisabled());
    assert.match(await p.locator('.country-reading-status').innerText(),/ikke tilgjengelig/);
    await off.close();console.log('PASS unavailable speech fallback');
  }
 }finally{await browser.close()}
}
(async()=>{
 const {server,url}=await makeServer();
 try{for(const [engine,label,viewport,avatar] of [
  [webkit,'webkit-iphone',{width:390,height:844},'girl'],
  [webkit,'webkit-small',{width:320,height:640},'boy'],
  [webkit,'webkit-ipad-portrait',{width:820,height:1180},'girl'],
  [webkit,'webkit-ipad-landscape',{width:1180,height:820},'boy'],
  [webkit,'webkit-iphone-landscape',{width:844,height:390},'girl'],
  [chromium,'chromium-iphone',{width:390,height:844},'girl']
 ])await run(engine,label,viewport,url,avatar)}finally{await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
