'use strict';
/* Phase C3: real WebKit/Chromium evidence, all FOUR original phone journeys.
 * No art replacement or coordinate changes. Keep Geografi's Kloden access. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const base=path.resolve(__dirname,'..');
const out=process.env.LARIA_RESPONSIVE_C3_IMAGES||'/tmp/laria-responsive-c3';
const subjects=['norwegian','math','english','geography'];
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Elev',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png',
 '.svg':'image/svg+xml','.json':'application/json'};
function serve(){
 return new Promise((resolve,reject)=>{
  const server=http.createServer((req,res)=>{
   let file=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   if(file.endsWith('/'))file+='index.html';
   file=path.resolve(base,'.'+file);
   if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(err,buf)=>{
    if(err){res.writeHead(404);res.end('Missing');return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(buf);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>{
   resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'});
  });
 });
}
async function photo(page,name){
 await fs.promises.mkdir(out,{recursive:true});
 await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled',timeout:18000});
}
async function visit(page,subject){
 await page.locator('.bc14-subject[data-camp="subject-'+subject+'"]:visible').click();
 const screen=page.locator('#'+(subject==='geography'?'geography':'subject')+'-screen.active.locked-journey-active');
 await screen.waitFor({timeout:18000});
 await page.waitForFunction(which=>{
  const map=document.querySelector('.screen.active.locked-journey-active .locked-journey-map');
  const image=map?.querySelector('.locked-journey-image');
  return map?.dataset.journeySubject===which&&image?.complete&&
    image.naturalWidth===941&&image.naturalHeight===1672&&
    !map.querySelector('.locked-journey-art-guard');
 },subject,{timeout:30000});
 return screen;
}
function measure(page){
 return page.evaluate(()=>{
  const el=q=>document.querySelector(q);
  const rect=node=>{
   if(!node)return null;
   const r=node.getBoundingClientRect();
   return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
  };
  const screen=el('.screen.active.locked-journey-active');
  const app=el('.app'),map=screen?.querySelector('.locked-journey-map');
  const board=map?.querySelector('.locked-journey-board');
  const img=map?.querySelector('.locked-journey-image');
  const points=[...map.querySelectorAll('.locked-journey-hotspot')];
  const oldGlobe=el('#open-world');
  const children=[...screen.children].filter(node=>{
   if(node.contains(map))return false;
   return getComputedStyle(node).display!=='none';
  }).map(node=>({id:node.id,position:rect(node)}));
  return {
   viewport:{width:innerWidth,height:innerHeight},
   app:rect(app),screen:rect(screen),map:rect(map),
   board:rect(board),image:rect(img),
   appBottom:getComputedStyle(app).paddingBottom,
   appBackground:getComputedStyle(app).backgroundImage,
   screenBg:getComputedStyle(screen).backgroundImage,
   journeyBg:getComputedStyle(screen.querySelector('#subject-journey-section')||screen.querySelector('#geo-journey-shell')).backgroundImage,
   boardRadius:getComputedStyle(board).borderTopLeftRadius,
   imageFit:getComputedStyle(img).objectFit,
   imageOriginal:[img.naturalWidth,img.naturalHeight],
   subject:map.dataset.journeySubject,
   troll:map.querySelectorAll('.locked-journey-traveler.laria-troll-host[data-laria-troll="'+
     ({norwegian:'storesoster',math:'lillebror',english:'lillesoster',geography:'storesoster'}[map.dataset.journeySubject]||'')+'"]').length,
   hits:points.map(rect),labels:points.map(node=>node.getAttribute('aria-label')),
   nonMapChildren:children,
   globePresent:!!oldGlobe,
   globeDisplay:oldGlobe?getComputedStyle(oldGlobe).display:null,
   horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
   scrollHeight:document.documentElement.scrollHeight,
   bodyClass:document.body.className
  };
 });
}
async function validate(page,subject,label,view,screen){
 const g=await measure(page);
 const slug=subject==='norwegian'?'bokskogen-reference-bg.webp':subject+'-premium.webp';
 assert(g.subject===subject,label+' wrong journey '+JSON.stringify(g));
 assert(Math.abs(g.board.width/g.board.height-941/1672)<.003,
  label+' original portrait proportions changed '+JSON.stringify(g.board));
 assert(Math.abs(g.image.width/g.image.height-941/1672)<.003,
  label+' original source was distorted '+JSON.stringify(g.image));
 assert.deepEqual(g.imageOriginal,[941,1672],label+' approved art missing');
 assert(g.imageFit==='contain',label+' approved art cropped');
 assert(g.boardRadius==='0px',label+' image has pale rounded edge '+JSON.stringify(g));
 // The approved renderer intentionally auto-scrolls to the NEXT mission,
 // especially on landscape phones where the portrait map is much taller.
 // A negative top is acceptable only if the first/current mission is visibly
 // focused; explicitly scroll to y=0 for the separate top-edge art capture.
 assert(g.screen.y<=1&&g.board.y<=1,
  label+' empty strip above the illustrated stage '+JSON.stringify(g));
 assert(g.app.bottom>=view.height-1,
  label+' scenic stage does not cover the full opening viewport '+JSON.stringify(g));
 if(g.board.y< -1){
  const first=g.hits[0];
  assert(first.y>=0&&first.bottom<=view.height,
   label+' auto-scroll hid rather than focused the next mission '+JSON.stringify(g));
 }else{
  assert(g.screen.y>=-1&&g.board.y>=-1,
   label+' unexpected map offset '+JSON.stringify(g));
 }
 // Regression for the 320px Nordlysleiren case: a current mission that
 // already fits above the bottom safe-touch zone must not force the child to
 // enter halfway down the illustrated journey and miss its painted header.
 if(view.height>view.width&&g.hits.length){
  const first=g.hits[0],naturalTop=first.y-g.board.y;
  const naturalBottom=first.bottom-g.board.y;
  const topLimit=Math.max(48,view.height*.12);
  if(naturalTop>=topLimit&&naturalBottom<=view.height-48){
   assert(g.board.y>=-1,
    label+' scrolled past header although next mission was already visible '+
     JSON.stringify({naturalTop,naturalBottom,board:g.board,first}));
  }
 }
 assert(g.screen.height>=view.height-1,label+' lower phone stage exposed '+JSON.stringify(g));
 assert(g.app.width>=view.width-2,label+' narrow app in phone viewport '+JSON.stringify(g));
 assert(g.appBottom==='0px',label+' leftover white bottom navigation padding');
 assert(g.appBackground.includes(slug)||
  (subject==='norwegian'&&g.journeyBg.includes(slug)),
  label+' wrong or blank background '+JSON.stringify({slug,app:g.appBackground,screen:g.screenBg}));
 assert(g.horizontalOverflow<=2,label+' horizontal overflow '+g.horizontalOverflow);
 assert(g.hits.length===5&&g.hits.every(x=>x.width>=44&&x.height>=44),
  label+' five usable mission touch targets not retained '+JSON.stringify(g.hits));
 assert(g.troll===1,label+' original approved skogstroll missing or duplicated');
 assert(g.labels.every(t=>t?.includes('Sted ')),label+' mission labels inaccessible');
 if(subject!=='geography'){
  assert.equal(g.nonMapChildren.length,0,
   label+' older subject dashboard still showing '+JSON.stringify(g.nonMapChildren));
 }else{
  assert(g.globePresent&&g.globeDisplay!=='none',
   label+' Kloden access hidden while preserving Nordlysleiren');
 }
 await fs.promises.mkdir(out,{recursive:true});
 await fs.promises.writeFile(path.join(out,label+'-'+subject+'-geometry.json'),JSON.stringify(g,null,2));
 await page.evaluate(()=>window.scrollTo(0,0));
 await photo(page,label+'-'+subject+'-top');
 if((view.width===320||view.width===390)&&view.height>view.width){
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await photo(page,label+'-'+subject+'-bottom');
 }
 const current=screen.locator('.locked-journey-hotspot.state-current').first();
 await current.scrollIntoViewIfNeeded();
 await current.click({timeout:7000});
 const sheet=page.locator('.locked-journey-overlay:not([hidden])');
 await sheet.waitFor({timeout:7000});
 assert(await sheet.locator('.locked-journey-missions button').count()>0,
  label+' current mission lacks real choices');
 await sheet.locator('.locked-sheet-close').click();
 await screen.locator('.locked-journey-back').scrollIntoViewIfNeeded();
 await screen.locator('.locked-journey-back').click();
 await page.locator('#home-screen.active .bc14-subject').first().waitFor({timeout:11000});
 // A subject class left on the body must not leak scenery onto Home.
 const home=await page.evaluate(()=>({
  active:document.querySelector('.screen.active')?.id,
  activeJourney:!!document.querySelector('.screen.active.locked-journey-active'),
  homeWidth:document.querySelector('.bc12')?.getBoundingClientRect().width
 }));
 assert(home.active==='home-screen'&&!home.activeJourney,
  label+' journey retained as active after going home '+JSON.stringify(home));
 console.log('PASS '+label+' '+subject+' phone storybook edge, hotspots, fox, back');
}
async function run(engine,label,view,url){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let context;
 try{
  context=await browser.newContext({
   viewport:{width:view.width,height:view.height},hasTouch:true,isMobile:true,
   deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'
  });
  await context.addInitScript(s=>localStorage.setItem('laerlittmer-v2',JSON.stringify(s)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://raw.githubusercontent.com/**',r=>r.abort());
  await page.route('https://api.worldbank.org/**',r=>r.abort());
  await page.goto(url+'&responsive-phasec3='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]:visible').waitFor({timeout:16000});
  for(const subject of subjects){
   const screen=await visit(page,subject);
   await validate(page,subject,label,view,screen);
  }
  assert.deepEqual(errors,[],label+' JS errors '+JSON.stringify(errors));
 }finally{if(context)await context.close();await browser.close();}
}
(async()=>{
 const {server,url}=await serve();
 try{
  await fs.promises.mkdir(out,{recursive:true});
  for(const [label,view] of [
   ['webkit-iphone-320x568',{width:320,height:568}],
   ['webkit-iphone-375x667',{width:375,height:667}],
   ['webkit-iphone-390x844',{width:390,height:844}],
   ['webkit-iphone-430x932',{width:430,height:932}],
   ['webkit-iphone-landscape-844x390',{width:844,height:390}]
  ])await run(webkit,label,view,url);
  await run(chromium,'chromium-iphone-390x844',{width:390,height:844},url);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
