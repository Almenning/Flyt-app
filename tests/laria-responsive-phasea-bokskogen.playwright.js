'use strict';
/* Responsive visual contract for the approved direct Eggenipa Norsk world.
 * Bokskogen was deliberately retired from the child flow; this keeps the
 * small-device regression coverage on the three real activity entrances. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');

const root=path.resolve(__dirname,'..');
const out=process.env.LARIA_RESPONSIVE_PHASEA_IMAGES||'/tmp/laria-responsive-phasea';
const seed={
 version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'EggenipaQA',avatar:'girl',setupVersion:2},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},
 masteryEvidence:{},skillEvidence:{},preferences:{sound:false,autoRead:false},
 lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null
};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};

function serve(){
 return new Promise((resolve,reject)=>{
  const server=http.createServer((req,res)=>{
   let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(file.endsWith('/'))file+='index.html';
   file=path.resolve(root,'.'+file);
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404);res.end('Missing');return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(data);
   });
  });
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/laer-litt-mer/?app=laria'}));
 });
}

async function proof(engine,label,viewport,url){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 let context;
 try{
  context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('laerlittmer-v2',JSON.stringify(value)),seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://raw.githubusercontent.com/**',route=>route.abort());
  await page.route('https://api.worldbank.org/**',route=>route.abort());
  await page.goto(url+'&responsive-phase-a='+label,{waitUntil:'domcontentloaded'});
  await page.locator('.bc14-subject[data-camp="subject-norwegian"]:visible').click();
  await page.locator('#eggenipa-world:visible').waitFor({timeout:16000});
  const master=await page.locator('#eggenipa-world .eg-master').evaluate(async image=>{
   await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};
  });
  assert.deepEqual(master,{width:1672,height:941},label+' lost the approved Eggenipa master');
  const portals=page.locator('#eggenipa-world .eg-portal');
  assert.deepEqual(await portals.evaluateAll(items=>items.map(item=>item.dataset.eg)),['words','find','reading'],
    label+' must offer exactly Ordjakt, Finn ordene and Lesekroken');
  assert.equal(await page.locator('#eggenipa-world [data-eg="map"],#subject-screen.active .locked-journey-map:visible').count(),0,
    label+' retired Bokskogen map returned to the child flow');
  const geometry=await page.evaluate(()=>{
   const world=document.querySelector('#eggenipa-world');
   const master=world.querySelector('.eg-master').getBoundingClientRect();
   const targets=[...world.querySelectorAll('.eg-portal')].map(node=>{
    const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,target=document.elementFromPoint(x,y);
    return {name:node.dataset.eg,top:r.top,bottom:r.bottom,width:r.width,height:r.height,hit:target===node||node.contains(target)};
   });
   return {world:world.getBoundingClientRect(),master,targets,viewport:innerHeight,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  assert.ok(geometry.overflow<=1,label+' horizontal overflow '+JSON.stringify(geometry));
  assert.ok(geometry.targets.every(hit=>hit.width>=44&&hit.height>=44),
    label+' an Eggenipa activity entrance is undersized '+JSON.stringify(geometry));
  for(const activity of ['words','find','reading']){
    const portal=page.locator('#eggenipa-world .eg-portal[data-eg="'+activity+'"]');
    await portal.scrollIntoViewIfNeeded();
    const touch=await portal.evaluate(node=>{
      const r=node.getBoundingClientRect(),target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,hit:target===node||node.contains(target)};
    });
    assert.ok(touch.top>=0&&touch.bottom<=innerHeight&&touch.hit,
      label+' Eggenipa '+activity+' entrance is not reachable after normal scroll '+JSON.stringify(touch));
  }
  await page.locator('#eggenipa-world .eg-portal[data-eg="reading"]').click();
  await page.locator('#session-screen.active').waitFor({timeout:16000});
  const choices=await page.locator('#session-screen.active .answer').evaluateAll(items=>items.slice(0,3).map(item=>{
   const r=item.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,bottom:r.bottom};
  }));
  assert.equal(choices.length,3,label+' Lesekroken lost its three answer choices');
  assert.ok(choices.every(choice=>choice.width>=44&&choice.height>=44),label+' Lesekroken touch target is undersized');
  await fs.promises.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,label+'-eggenipa-lesekroken.png'),animations:'disabled'});
  assert.deepEqual(errors,[],label+' page errors '+JSON.stringify(errors));
  console.log('PASS '+label+' Eggenipa direct activity entrances and Lesekroken responsive flow');
 }finally{if(context)await context.close();await browser.close();}
}

(async()=>{
 const {server,url}=await serve();
 try{
  await proof(chromium,'chromium-iphone-390x844',{width:390,height:844},url);
  for(const [label,viewport] of [
   ['webkit-iphone-320x568',{width:320,height:568}],
   ['webkit-iphone-375x667',{width:375,height:667}],
   ['webkit-iphone-390x844',{width:390,height:844}],
   ['webkit-iphone-430x932',{width:430,height:932}],
   ['webkit-iphone-landscape-844x390',{width:844,height:390}]
  ])await proof(webkit,label,viewport,url);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
