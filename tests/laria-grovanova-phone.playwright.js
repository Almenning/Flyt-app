'use strict';
const assert=require('node:assert/strict'),p=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=process.env.LARIA_PHONE_SHOTS||'/tmp/laria-grovanova-phone';
fs.mkdirSync(root,{recursive:true});
(async()=>{const kind=process.env.LARIA_PHONE_ENGINE||"webkit";
for(const [w,h] of [[390,844],[844,390],[375,667],[320,568],[820,1180],[1180,820]]){
const b=await p[kind].launch(kind==="chromium"?{...(process.env.LARIA_CHROMIUM_PATH?{executablePath:process.env.LARIA_CHROMIUM_PATH}:{}),args:["--no-sandbox","--no-zygote","--single-process"]}:{}); const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:w<700,serviceWorkers:'block',reducedMotion:'reduce'});
await c.addInitScript(()=>localStorage.setItem('laerlittmer-v2',JSON.stringify({version:7,progressSchemaVersion:3,profile:{grade:2,onboarded:true,name:'Demo Læria',avatar:'girl',setupVersion:2,tallvikaTroll:'lillesoster'},mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},masteryEvidence:{},preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null})));
const page=await c.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria',{waitUntil:'domcontentloaded'});
const home=page.locator('#home-screen.active .bc12.bc15-v16-locked');await home.waitFor({timeout:25000});
await page.screenshot({path:path.join(root,'Hjem-'+kind+'-'+w+'x'+h+'.png'),animations:'disabled'});
const runs=await home.locator('.bc15-v16-sign,.bc15-v16-reisen,.bc12-journey').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {w:r.width,h:r.height,x:r.x,y:r.y,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n}}));
console.log(w,h,await home.getAttribute('data-bc15-v16-device'),JSON.stringify(runs),errors);
if(w<800||h<600){assert.equal(await home.getAttribute('data-bc15-v16-device'),'phone');assert(runs.every(r=>r.hit&&r.w>=44&&r.h>=44&&r.x>=-1&&r.y>=-1&&r.x+r.w<=w+1&&r.y+r.h<=h+1));}
assert.deepEqual(await home.locator('.bc15-v16-sign').evaluateAll(list=>list.map(n=>n.dataset.bc15Subject)),['norwegian','math','english','geography']);
if(w<800||h<600){
 assert.deepEqual(await home.locator('.bc12-nav button:visible').evaluateAll(list=>list.map(n=>[n.dataset.camp,Math.round(n.getBoundingClientRect().height)>=44])),[['home',true],['explore',true],['collection',true],['wardrobe',true]]);
 assert.equal(await home.locator('.bc14-subjects').getAttribute('aria-hidden'),'true');
 assert.equal(await home.locator('button.bc15-v16-troll').count(),1);
}
await home.locator('[data-bc15-subject="math"]').tap();await page.locator('#tallvika-world:visible').waitFor({timeout:12000});assert.deepEqual(errors,[]);
await c.close();await b.close();
}
})().catch(e=>{console.error(e);process.exit(1)});
