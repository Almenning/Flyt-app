'use strict';
/* Acceptance QA: three subject entrances now follow the Kinnaklova model.
 * Check real scenes and navigation on Chromium/WebKit, not mocked screenshots.
 */
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const output=process.env.LARIA_UNIFIED_SUBJECT_SCREENSHOTS||'/tmp/laria-unified-subjects';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
async function server(){
 return new Promise(resolve=>{
  const srv=http.createServer((req,res)=>{
   const pathname=new URL(req.url,'http://127.0.0.1').pathname;
   const name=path.resolve(root,decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html');
   if(!name.startsWith(root+path.sep)&&name!==path.join(root,'index.html')){res.writeHead(403);res.end();return;}
   fs.readFile(name,(error,data)=>{
    if(error){res.writeHead(404);res.end('Missing');return;}
    res.setHeader('Content-Type',mime[path.extname(name)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(data);
   });
  });
  srv.listen(0,'127.0.0.1',()=>resolve({srv,url:'http://127.0.0.1:'+srv.address().port+'/'}));
 });
}
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const dimensions=[
 ['iphone-portrait',390,844],['iphone-landscape',844,390],
 ['ipad-portrait',834,1112],['ipad-landscape',1194,834],
 ['mac-landscape',1440,900]
];
function assertRect(rect,viewport,title){
 assert.ok(rect&&rect.width>=44&&rect.height>=44,title+' small target '+JSON.stringify(rect));
 assert.ok(rect.left>=-2&&rect.right<=viewport.width+2,title+' outside horizontal view '+JSON.stringify(rect));
 assert.ok(rect.top>=-2&&rect.bottom<=viewport.height+2,title+' outside vertical view '+JSON.stringify(rect));
}
async function checkNav(page,selector,viewport,title){
 const items=await page.locator(selector).evaluateAll(els=>els.map(el=>{
  const r=el.getBoundingClientRect(),st=getComputedStyle(el);
  return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,
   visible:st.display!=='none'&&st.visibility==='visible'};
 }));
 assert.equal(items.length,3,title+' requires exactly three primary activity signs');
 assert.ok(items.every(x=>x.visible),title+' hidden primary sign');
 items.forEach((x,i)=>assertRect(x,viewport,title+' sign '+i));
 for(let i=0;i<items.length;i++)for(let j=0;j<i;j++){
  const a=items[i],b=items[j];
  const overlapX=Math.min(a.right,b.right)-Math.max(a.left,b.left);
  const overlapY=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
  assert.ok(overlapX<=3||overlapY<=3,title+' overlapping signs '+i+' and '+j);
 }
}
async function visit(page,url,subject){
 await page.goto(url+'?app=laria&unified-qa='+subject,{waitUntil:'domcontentloaded'});
 await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').waitFor({state:'visible',timeout:22000});
 await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]').click();
}
async function screenshot(page,name){
 fs.mkdirSync(output,{recursive:true});
 await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled',fullPage:false});
}
async function verify(type,name,width,height,url){
 const browser=await type.launch({headless:true,args:type===chromium?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,
   isMobile:width<600,serviceWorkers:'block',reducedMotion:'reduce'});
 await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
 await page.route('https://api.worldbank.org/**',r=>r.abort());
 const engine=type===webkit?'webkit':'chromium',tag=engine+'-'+name,v={width,height};
 try{
  await visit(page,url,'norwegian');
  await page.locator('#eggenipa-world .eg-world-brand:visible').waitFor({timeout:20000});
  await checkNav(page,'#eggenipa-world .eg-scene-hit:visible',v,tag+' Norsk');
  assert.equal(await page.locator('#eggenipa-world .eg-portals:visible').count(),0,'Norsk has duplicate card row');
  assert.equal(await page.locator('#eggenipa-world .eg-scene-home:visible').count(),1,'Norsk needs in-world Home');
  assert.ok(await page.locator('#eggenipa-world .eg-master').evaluate(el=>el.complete&&el.naturalWidth>1000),
    'Norsk approved scene missing');
  await screenshot(page,tag+'-norsk');
  await page.locator('#eggenipa-world .eg-scene-home').click();
  await page.locator('#home-screen.active').waitFor({timeout:15000});

  await visit(page,url,'math');
  await page.locator('#tallvika-world .tv-sign-nav:visible').waitFor({timeout:20000});
  await checkNav(page,'#tallvika-world .tv-sign:visible',v,tag+' Matte');
  assert.equal(await page.locator('#tallvika-world .tv-scene-home:visible').count(),1,'Math home missing');
  const menuBackground=await page.locator('#tallvika-world .tv-sign-nav').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.equal(menuBackground,'none','Old stacked Tallvika signpost still rendered');
  await screenshot(page,tag+'-matte');
  await page.locator('#tallvika-world .tv-scene-home').click();
  await page.locator('#home-screen.active').waitFor({timeout:15000});

  await visit(page,url,'geography');
  await page.locator('#laria-geography-world .gv-brand:visible').waitFor({timeout:20000});
  await checkNav(page,'#laria-geography-world .gv-sign:visible',v,tag+' Geografi');
  assert.equal(await page.locator('#laria-geography-world .gv-home:visible').count(),1,'Geography home missing');
  assert.ok(await page.locator('#laria-geography-world .gv-landscape').evaluate(el=>el.complete&&el.naturalWidth>900),
   'Geography landscape asset missing');
  await screenshot(page,tag+'-geografi');
  await page.locator('[data-gv="journey"]').click();
  await page.locator('#geography-screen.active .locked-journey-map:visible').waitFor({timeout:14000});
  await page.locator('#geography-screen.active .locked-journey-back:visible').click();
  await page.locator('#laria-geography-world .gv-brand:visible').waitFor({timeout:12000});
  await page.locator('[data-gv="globe"]').click();
  await page.locator('#world-screen.active').waitFor({timeout:16000});
  assert.deepEqual(errors,[],tag+' runtime exceptions');
  console.log('PASS '+tag+' unified Kinnaklova template for Norsk, Matte, Geografi; map and Kloden route');
 }finally{await context.close();await browser.close();}
}
(async()=>{
 const {srv,url}=await server();
 try{
  for(const [type,engine] of [[chromium,'chromium'],[webkit,'webkit']]){
   for(const [name,w,h] of dimensions){
    await verify(type,name,w,h,url);
   }
  }
 }finally{srv.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
