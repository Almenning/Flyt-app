'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');

const LIVE=process.env.LARIA_VOICE_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const OUT=process.env.LARIA_VOICE_SHOTS;
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Lydtest',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},
 preferences:{sound:false,autoRead:false},journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};

async function run(type,name,viewport){
 const browser=await type.launch(name==='chromium'?{
  args:['--no-sandbox'],...(process.env.LARIA_CHROMIUM_PATH?{executablePath:process.env.LARIA_CHROMIUM_PATH}:{})}: {});
 try{
  const make=async profile=>{
   const context=await browser.newContext({viewport,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
   await context.route('https://raw.githubusercontent.com/**',route=>route.abort());
   await context.route('https://api.worldbank.org/**',route=>route.abort());
   await context.addInitScript(profile=>{
    if(profile)localStorage.setItem('laerlittmer-v2',JSON.stringify(profile));
    const probe={played:[],canceled:0,voices:[
      {lang:'nb-NO',localService:false,name:'not local'},
      {lang:'nn-NO',localService:true,name:'nynorsk'},
      {lang:'nb-NO',localService:true,name:'testbokmål'}]};
    class Utterance{constructor(text){this.text=text}}
    const synth={getVoices:()=>probe.voices,
      speaking:false,pending:false,paused:false,
      speak(u){probe.played.push(u);this.speaking=true;u.onstart?.()},
      cancel(){probe.canceled++;this.speaking=false}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
    window.__voiceAudit=probe;
   },profile);
   return context;
  };
  {
   const context=await make(null),page=await context.newPage();
   await page.goto(LIVE+'&lariaTrollVoiceTest=1',{waitUntil:'domcontentloaded'});
   await page.locator('#onboarding.show').waitFor();
   await page.waitForFunction(()=>!!document.getElementById('laria-troll-voice-test'));
   assert.equal(await page.locator('#laria-troll-voice-launcher').isVisible(),false);
   assert.equal(await page.evaluate(()=>window.__voiceAudit.played.length),0);
   await context.close();
  }
  const context=await make(seed),page=await context.newPage();
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>requests.push(request.url()));
  await page.goto(LIVE,{waitUntil:'load'});
  await page.locator('#home-screen.active').waitFor();
  assert.equal(await page.locator('#laria-troll-voice-launcher').count(),0);
  assert.ok(!requests.some(url=>url.includes('laria-troll-voice-audition')));
  assert.equal(await page.evaluate(()=>window.__voiceAudit.played.length),0);
  await page.goto(LIVE+'&lariaTrollVoiceTest=1',{waitUntil:'domcontentloaded'});
  const launch=page.getByRole('button',{name:'Test trollstemmer',exact:true});
  await launch.waitFor({timeout:20000});
  await launch.click();
  const dialog=page.getByRole('dialog',{name:'Test trollstemmer'});
  await dialog.waitFor();
  assert.equal(await page.evaluate(()=>window.__voiceAudit.played.length),0);
  const boxes=await dialog.getByRole('button').evaluateAll(nodes=>nodes.map(node=>{
    const r=node.getBoundingClientRect();return [r.x,r.y,r.width,r.height];
  }));
  for(const [x,y,w,h] of boxes)assert.ok(w>=44&&h>=44&&x>=0&&y>=0&&x+w<=viewport.width+1&&y+h<=viewport.height+1);
  if(OUT){
   fs.mkdirSync(OUT,{recursive:true});
   const sha=process.env.LARIA_HEAD_SHA||'worktree';
   await page.screenshot({path:path.join(OUT,`${sha}-${name}-${viewport.width}x${viewport.height}-lariaTrollVoiceTest1.png`),animations:'disabled'});
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.closest('dialog')?.id),'laria-troll-voice-test');
  const samples=[
   ['Storesøster','Bra jobbet! Du klarte det.',.90,.85],
   ['Lillesøster','Wow, se på deg! Dette var flott!',1.25,1],
   ['Lillebror','Hehe, jeg heier på deg!',1.15,1.05]
  ];
  for(const [name,phrase,pitch,rate] of samples){
   await dialog.getByRole('button',{name,exact:true}).click();
   assert.deepEqual(await page.evaluate(()=>{
    const p=window.__voiceAudit.played.at(-1);return [p.text,p.pitch,p.rate,p.lang,p.voice.name];
   }),[phrase,pitch,rate,'nb-NO','testbokmål']);
   await page.evaluate(()=>{window.speechSynthesis.speaking=false;window.__voiceAudit.played.at(-1).onend()});
  }
  await page.evaluate(()=>{window.speechSynthesis.speaking=true});
  const beforeBusy=await page.evaluate(()=>window.__voiceAudit.canceled);
  await dialog.getByRole('button',{name:'Storesøster',exact:true}).click();
  assert.match(await dialog.getByRole('status').textContent(),/annen opplesning/);
  assert.deepEqual(await page.evaluate(()=>[window.__voiceAudit.canceled,window.__voiceAudit.played.length]),[beforeBusy,3]);
  await page.evaluate(()=>{window.speechSynthesis.speaking=false});
  await dialog.getByRole('button',{name:'Storesøster',exact:true}).click();
  await dialog.getByRole('checkbox',{name:'Stemmetest på'}).uncheck();
  assert.equal(await dialog.getByRole('button',{name:'Storesøster',exact:true}).isEnabled(),false);
  assert.equal(await page.evaluate(()=>window.__voiceAudit.canceled),beforeBusy+1);
  await dialog.getByRole('checkbox',{name:'Stemmetest på'}).check();
  await dialog.getByRole('button',{name:'Storesøster',exact:true}).click();
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  assert.equal(await launch.evaluate(button=>document.activeElement===button),true);
  assert.equal(await page.evaluate(()=>window.__voiceAudit.canceled),beforeBusy+2);
  await launch.click();
  await page.evaluate(()=>{window.__voiceAudit.voices=[{lang:'nb-NO',localService:false,name:'not local'}]});
  await dialog.getByRole('button',{name:'Lillebror',exact:true}).click();
  assert.match(await dialog.getByRole('status').textContent(),/Ingen lokal norsk stemme/);
  assert.equal(await page.evaluate(()=>window.__voiceAudit.played.length),5);
  await page.evaluate(()=>{window.__voiceAudit.voices=[{lang:'nb-NO',localService:true,name:'ny lokal'}]});
  await dialog.getByRole('button',{name:'Lillebror',exact:true}).click();
  const beforeNavigate=await page.evaluate(()=>window.__voiceAudit.canceled);
  // The application explicitly clears its native queue once to begin a lesson.
  // The subsequent navigation observer must not cancel the newly started lesson.
  await page.evaluate(()=>{showScreen('session');speakQuestion({prompt:'Hvor mange kongler?',subject:'math'})});
  await dialog.waitFor({state:'hidden'});
  assert.equal(await launch.isVisible(),false);
  assert.deepEqual(await page.evaluate(()=>[window.__voiceAudit.canceled,speechSynthesis.speaking,window.__voiceAudit.played.at(-1).text]),
    [beforeNavigate+1,true,'Hvor mange kongler?']);
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close()}
 console.log(name+' '+viewport.width+'x'+viewport.height+': voice audition isolated');
}

(async()=>{
 for(const [name,browser] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.LARIA_VOICE_BROWSER&&process.env.LARIA_VOICE_BROWSER!==name)continue;
  for(const viewport of [{width:820,height:1180},{width:1180,height:820},{width:390,height:844}]){
   await run(browser,name,viewport);
  }
 }
})().catch(error=>{console.error(error);process.exitCode=1});
