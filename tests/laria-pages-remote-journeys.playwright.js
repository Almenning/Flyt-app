'use strict';
const {webkit,chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');
const openHomeSubject=require('./helpers/laria-home-open-subject.cjs');
const url=process.env.QA_URL||'https://almenning.github.io/Flyt-app/preview/laria-268/?app=laria';
const out=process.env.LARIA_REMOTE_QA||'/tmp/laria-pages-journeys';
fs.mkdirSync(out,{recursive:true});
const seed={version:7,progressSchemaVersion:3,
 profile:{grade:2,onboarded:true,name:'Preview QA',avatar:'girl',setupVersion:2,tallvikaTroll:'storesoster'},
 mastery:{},mistakes:{},skillMastery:{},skillMistakes:{},skillLastSeen:{},masteryEvidence:{},skillEvidence:{},
 preferences:{sound:false,autoRead:false},lastMilestone:null,recentCountryWin:null,lastActivity:null,
 journey:{nodes:{},gradeWins:{},viewGrades:{}},answerLog:[],sessionLog:[],activeSession:null};
(async()=>{
 const results=[];
 for(const [engine,browserType] of [['webkit',webkit],['chromium',chromium]]){
   const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   try{
     for(const [orientation,viewport] of [['portrait',{width:820,height:1180}],['landscape',{width:1180,height:820}]]){
       const ctx=await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:true,serviceWorkers:'block'});
       await ctx.addInitScript(profile=>localStorage.setItem('laerlittmer-v2',JSON.stringify(profile)),seed);
       const page=await ctx.newPage(),errors=[];
       page.on('pageerror',e=>errors.push(e.message));
       const screenshots=[];
       const snap=async name=>{
         const file=path.join(out,engine+'-'+orientation+'-'+name+'.png');
         await page.screenshot({path:file,animations:'disabled',fullPage:false});
         screenshots.push(file);
       };
       const verify=async(name)=>{
         const result=await page.evaluate(()=>{
           const broken=[...document.querySelectorAll('img')].filter(i=>i.checkVisibility()&&i.complete&&i.naturalWidth===0).map(i=>i.src);
           return {title:document.title,activeScreen:document.querySelector('.screen.active')?.id||null,
             broken,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,
             bodyLength:document.body?.innerText.length||0};
         });
         if(result.title!=='Læria'||result.broken.length||result.scrollWidth>result.width+3||result.bodyLength<30)
           throw new Error(name+' '+JSON.stringify(result));
         return result;
       };
       await page.goto(url,{waitUntil:'domcontentloaded',timeout:80000});
       await openHomeSubject(page,'math');
       await page.locator('#subject-screen.active #tallvika-world').waitFor({state:'visible',timeout:20000});
       const tallvika=await verify('tallvika');
       const signs=await page.locator('#tallvika-world .tv-sign').count();
       if(signs!==3)throw new Error('Tallvika needs 3 signs, got '+signs);
       await snap('tallvika');
       await page.locator('#tallvika-world .tv-sign[data-tv="table"]').click();
       await page.locator('#multiplication-lab-screen.active .mp-times-grid').waitFor({state:'visible',timeout:25000});
       const table=await verify('gangetabellen');
       const count=await page.locator('.mp-times-grid .mp-grid-cell').count();
       if(count!==100)throw new Error('Expected 100 real 10x10 cells, got '+count);
       await snap('gangetabellen');
       await page.goto(url,{waitUntil:'domcontentloaded',timeout:80000});
       await openHomeSubject(page,'english');
       await page.locator('#subject-screen.active').waitFor({state:'visible',timeout:20000});
       const english=await verify('english');
       await snap('english');
       if(errors.length)throw new Error('Runtime errors '+engine+' '+orientation+': '+JSON.stringify(errors));
       const record={engine,orientation,url,signs,count,tallvika,table,english,screenshots,errors};
       results.push(record);console.log('[Laria real Pages journeys]',JSON.stringify(record));
       await ctx.close();
     }
   }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({source:'public GitHub Pages, PR #268',results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
