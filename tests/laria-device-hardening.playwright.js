'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const base=process.env.QA_URL||'http://127.0.0.1:8765/laer-litt-mer/?app=laria';
const shots=process.env.QA_DEVICE_SCREENSHOTS||'/tmp/laria-device-hardening';
fs.mkdirSync(shots,{recursive:true});

const devices=[
  {name:'small-iphone',width:320,height:568,grade:2,mobile:true},
  {name:'iphone',width:390,height:844,grade:4,mobile:true},
  {name:'ipad-portrait',width:820,height:1180,grade:7,mobile:false},
  {name:'ipad-landscape',width:1180,height:820,grade:9,mobile:false}
];

function seed(grade){
  return {
    version:7,progressSchemaVersion:3,
    profile:{grade:grade,onboarded:true,name:'DeviceQA',avatar:'girl',setupVersion:2},
    mastery:{'no:flag':2},mistakes:{},
    skillMastery:{},skillMistakes:{},skillLastSeen:{},
    masteryEvidence:{},skillEvidence:{},
    preferences:{sound:false,autoRead:false},
    lastMilestone:null,recentCountryWin:null,lastActivity:null,
    journey:{nodes:{},gradeWins:{},viewGrades:{}},
    answerLog:[{at:1700000000000,subject:'math',skill:'device-qa',grade:grade,type:'learning-choice',questionKey:'device-qa-preserve',correct:true,countsForLearning:true}],
    sessionLog:[],activeSession:null
  };
}

async function screenshot(page,engineName,device,label){
  if(engineName!=='webkit'&&!(engineName==='chromium'&&device.name==='ipad-landscape'))return;
  await page.screenshot({path:path.join(shots,engineName+'-'+device.name+'-'+label+'.png'),fullPage:true});
}

async function fit(page,label,selectors){
  const result=await page.evaluate(function(sels){
    function visible(el){
      if(!el)return false;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.02&&r.width>0&&r.height>0;
    }
    function rect(el){
      const r=el.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    }
    const requested=[];
    sels.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el,i){
        if(visible(el))requested.push({sel:sel,i:i,rect:rect(el)});
      });
    });
    const fixed=[...document.querySelectorAll('body *')].filter(function(el){
      return visible(el)&&['fixed','sticky'].includes(getComputedStyle(el).position);
    }).map(function(el){
      return {tag:el.tagName,id:el.id,cls:String(el.className||'').slice(0,100),rect:rect(el)};
    });
    const active=document.querySelector('.screen.active');
    return {
      vw:innerWidth,vh:innerHeight,
      documentWidth:document.documentElement.scrollWidth,
      bodyWidth:document.body.scrollWidth,
      active:active?{id:active.id,rect:rect(active)}:null,
      app:document.querySelector('.app')?rect(document.querySelector('.app')):null,
      requested:requested,fixed:fixed
    };
  },selectors);
  assert.ok(result.documentWidth<=result.vw+1,label+': horizontal document overflow '+JSON.stringify(result));
  assert.ok(result.bodyWidth<=result.vw+1,label+': horizontal body overflow '+JSON.stringify(result));
  result.requested.forEach(function(item){
    assert.ok(item.rect.left>=-2&&item.rect.right<=result.vw+2,label+': '+item.sel+'['+item.i+'] exceeds viewport '+JSON.stringify(item.rect));
  });
  result.fixed.forEach(function(item){
    assert.ok(item.rect.left>=-2&&item.rect.right<=result.vw+2,label+': fixed/sticky element exceeds viewport '+JSON.stringify(item));
  });
  if(result.vw>=700&&result.active&&result.active.id==='home-screen'){
    assert.ok((result.app&&result.app.width||0)>=Math.min(700,result.vw-2),label+': tablet Home collapsed to phone width '+JSON.stringify(result.app));
  }
  return result;
}

async function touchTargets(page,label,selectors,min){
  min=min||44;
  const targets=await page.evaluate(function(sels){
    function visible(el){
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.02&&r.width>0&&r.height>0&&!el.disabled;
    }
    const out=[];
    sels.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el,i){
        if(!visible(el))return;
        const r=el.getBoundingClientRect();
        out.push({sel:sel,i:i,w:r.width,h:r.height,text:String(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,60)});
      });
    });
    return out;
  },selectors);
  assert.ok(targets.length>0,label+': no visible touch targets for '+selectors.join(', '));
  targets.forEach(function(t){
    assert.ok(t.w>=min&&t.h>=min,label+': undersized touch target '+JSON.stringify(t));
  });
}

async function noOverlap(page,label,a,b){
  const m=await page.evaluate(function(pair){
    const a=document.querySelector(pair[0]),b=document.querySelector(pair[1]);
    if(!a||!b)return {skip:true};
    function visible(el){const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0}
    if(!visible(a)||!visible(b))return {skip:true};
    const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
    const w=Math.max(0,Math.min(x.right,y.right)-Math.max(x.left,y.left));
    const h=Math.max(0,Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top));
    return {area:w*h,a:{left:x.left,right:x.right,top:x.top,bottom:x.bottom},b:{left:y.left,right:y.right,top:y.top,bottom:y.bottom}};
  },[a,b]);
  if(!m.skip)assert.equal(m.area,0,label+': unintended overlap '+a+' vs '+b+' '+JSON.stringify(m));
}

async function openTask(page,grade){
  await page.evaluate(function(g){
    state.profile.grade=g;saveState();renderAll();
    sessionScope={type:'subject',subject:'math',label:'Matte · Device QA',grade:g,practiceOnly:true};
    sessionQuestions=[choiceQuestion('math','device-qa','Hva er 2 + 2?','4',['4','3','5'],{curriculum:'MAT01-06',practiceRepeat:true})];
    qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
    state.activeSession={startedAt:Date.now()};persistActiveSession();showScreen('session');renderQuestion();
  },grade);
  await page.locator('#session-screen.active').waitFor();
}

async function swipeBack(page){
  await page.evaluate(function(){
    const el=document.getElementById('swipe-back-edge');
    if(!el)throw new Error('swipe edge missing');
    function fire(type,x,y){
      el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:71,pointerType:'touch',clientX:x,clientY:y,isPrimary:true}));
    }
    fire('pointerdown',2,260);
    fire('pointermove',28,260);
    fire('pointermove',96,262);
    fire('pointerup',104,262);
  });
}

(async function(){
  const errors=[];
  for(const engineItem of [['chromium',chromium],['webkit',webkit]]){
    const engineName=engineItem[0],engine=engineItem[1];
    const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
    try{
      for(const device of devices){
        const ctx=await browser.newContext({
          viewport:{width:device.width,height:device.height},
          isMobile:device.mobile,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'
        });
        const page=await ctx.newPage();
        page.on('pageerror',function(e){errors.push(engineName+'/'+device.name+': '+e.message)});
        const badLocal=[];
        page.on('response',function(res){
          const u=res.url();
          if(u.startsWith(new URL(base).origin)&&res.status()>=400)badLocal.push({url:u,status:res.status()});
        });
        await page.route('https://raw.githubusercontent.com/**',function(r){return r.fulfill({status:200,contentType:'application/json',body:'{"type":"FeatureCollection","features":[]}'})});
        await page.route('https://api.worldbank.org/**',function(r){return r.fulfill({status:200,contentType:'application/json',body:'[{},[]]'})});
        await page.addInitScript(function(s){localStorage.setItem('laerlittmer-v2',JSON.stringify(s))},seed(device.grade));

        const target=base+(base.includes('?')?'&':'?')+'deviceqa='+engineName+'-'+device.name;
        await page.goto(target,{waitUntil:'domcontentloaded'});
        await page.locator('#home-screen.active').waitFor({timeout:10000});
        await page.waitForFunction(function(){
          const map={2:'young',4:'middle',7:'older',9:'teen'};
          return document.querySelector('.app')&&document.querySelector('.app').classList.contains('grade-band-'+map[state.profile.grade]);
        },null,{timeout:10000});
        await page.waitForFunction(function(){return document.documentElement.dataset.safeChallengeRelease==='challenge-rc1'},null,{timeout:10000});

        if(device.grade<=2){
          await page.locator('.bc12').waitFor({state:'visible'});
          await fit(page,engineName+'/'+device.name+'/home',['.bc12','.bc12-heading','.safe-challenge-young','.bc12-nav']);
          await touchTargets(page,engineName+'/'+device.name+'/home',['.bc12-nav button','.safe-challenge-young']);
          await noOverlap(page,engineName+'/'+device.name+'/home','.safe-challenge-young','.bc12-heading');
          await noOverlap(page,engineName+'/'+device.name+'/home','.safe-challenge-young','.bc12-nav');
          await noOverlap(page,engineName+'/'+device.name+'/home','.safe-challenge-young','.bc12-quest');
          await noOverlap(page,engineName+'/'+device.name+'/home','.safe-challenge-young','.bc12-fox');
          assert.equal(await page.locator('.bc12-nav button').count(),4,device.name+': Basecamp navigation count changed');
          await screenshot(page,engineName,device,'home');

          await page.locator('.safe-challenge-young').tap();
          await page.locator('#safe-challenge-dialog[open]').waitFor();
          await fit(page,engineName+'/'+device.name+'/challenge',['#safe-challenge-dialog','.sc-shell']);
          await touchTargets(page,engineName+'/'+device.name+'/challenge',['#sc-close','.sc-subject','.sc-primary','.sc-secondary']);
          await screenshot(page,engineName,device,'challenge');
          await page.locator('#sc-close').tap();

          await page.locator('.bc12-journey').tap();
          await page.locator('#subject-screen.active').waitFor();
        }else{
          await fit(page,engineName+'/'+device.name+'/home',['#home-screen','.dashboard-welcome','.home-subject-grid','.dashboard-main-grid','#bottom-nav']);
          await touchTargets(page,engineName+'/'+device.name+'/home',['#open-geography','#open-norwegian','#open-math','#open-english','#bottom-nav button','#safe-challenge-entry']);
          await screenshot(page,engineName,device,'home');

          await page.locator('#safe-challenge-entry').tap();
          await page.locator('#safe-challenge-dialog[open]').waitFor();
          await fit(page,engineName+'/'+device.name+'/challenge',['#safe-challenge-dialog','.sc-shell']);
          await touchTargets(page,engineName+'/'+device.name+'/challenge',['#sc-close','.sc-subject','.sc-primary','.sc-secondary']);
          await screenshot(page,engineName,device,'challenge');
          await page.locator('#sc-close').tap();

          await page.evaluate(function(){openSubject('norwegian')});
          await page.locator('#subject-screen.active').waitFor();
        }

        await fit(page,engineName+'/'+device.name+'/subject',['#subject-screen','.subject-page-banner','#subject-screen .subject-hero','.journey-map']);
        await touchTargets(page,engineName+'/'+device.name+'/subject',['#subject-back','#start-subject-session','.journey-grade-choice']);
        await screenshot(page,engineName,device,'subject');

        if(engineName==='webkit'&&device.name==='iphone'){
          await swipeBack(page);
          await page.locator('#home-screen.active').waitFor({timeout:3000});
          await page.evaluate(function(){openSubject('norwegian')});
          await page.locator('#subject-screen.active').waitFor();
        }

        await page.evaluate(function(){renderGeographyContinue();showScreen('geography')});
        await page.locator('#geography-screen.active').waitFor();
        await fit(page,engineName+'/'+device.name+'/geography',['#geography-screen','.geography-banner','.geography-continue','.geo-journey-shell']);
        await touchTargets(page,engineName+'/'+device.name+'/geography',['#geography-back','#open-world','#geography-continue-button','.journey-grade-choice']);
        await screenshot(page,engineName,device,'geography');

        await page.evaluate(function(){openGlobe('explore')});
        await page.locator('#world-screen.active').waitFor();
        await page.waitForFunction(function(){const c=document.getElementById('globe-canvas');return !!(c&&c._cssW&&c._cssH)},null,{timeout:3000});
        await fit(page,engineName+'/'+device.name+'/globe',['#world-screen','.globe-mode','.globe-wrap','.globe-actions','.searchbox']);
        await touchTargets(page,engineName+'/'+device.name+'/globe',['#world-back','.globe-mode button','.globe-zoom button','.globe-actions button','#start-world-from-globe'],44);
        const canvas=await page.locator('#globe-canvas').boundingBox();
        assert.ok(canvas&&canvas.width>=Math.min(280,device.width-40)&&canvas.height>=280,engineName+'/'+device.name+': globe too small '+JSON.stringify(canvas));
        await screenshot(page,engineName,device,'globe');

        if(device.name==='ipad-landscape'){
          await page.setViewportSize({width:820,height:1180});
          await page.waitForTimeout(150);
          await page.evaluate(function(){try{resizeGlobe();drawGlobe()}catch(_){}});
          await fit(page,engineName+'/'+device.name+'/rotated-globe',['#world-screen','.globe-mode','.globe-wrap','.globe-actions']);
          const rotated=await page.locator('#globe-canvas').boundingBox();
          assert.ok(rotated&&rotated.width>=300&&rotated.height>=300,engineName+': rotated iPad globe collapsed '+JSON.stringify(rotated));
          await page.setViewportSize({width:1180,height:820});
          await page.waitForTimeout(150);
        }

        await page.evaluate(function(){setTab('progress')});
        await page.locator('#progress-screen.active').waitFor();
        await fit(page,engineName+'/'+device.name+'/progress',['#progress-screen','.progress-page-banner','#grade-round-card','.subject-progress-grid','#bottom-nav']);
        await touchTargets(page,engineName+'/'+device.name+'/progress',['#bottom-nav button','.grade-round-subjects button','.subject-progress-grid button']);
        await screenshot(page,engineName,device,'progress');

        await openTask(page,device.grade);
        await fit(page,engineName+'/'+device.name+'/task',['#session-screen','.session-top','#question-wrap','.answers']);
        await touchTargets(page,engineName+'/'+device.name+'/task',['#close-session','.answer','.read-aloud'],44);
        await noOverlap(page,engineName+'/'+device.name+'/task','.session-top','.question-tools');
        await screenshot(page,engineName,device,'task');

        await page.evaluate(function(){state.activeSession=null;saveState();setTab('home')});
        const before=await page.evaluate(function(){return JSON.stringify({profile:state.profile,mastery:state.mastery,answerLog:state.answerLog})});
        await page.reload({waitUntil:'domcontentloaded'});
        await page.locator('#home-screen.active').waitFor();
        const after=await page.evaluate(function(){return JSON.stringify({profile:state.profile,mastery:state.mastery,answerLog:state.answerLog})});
        assert.equal(after,before,engineName+'/'+device.name+': reload changed persisted user data');
        assert.equal(badLocal.length,0,engineName+'/'+device.name+': broken local asset/reference '+JSON.stringify(badLocal));
        await ctx.close();
      }
    }finally{
      await browser.close();
    }
  }
  assert.deepEqual(errors,[],'Prompt 17 must have no page errors');
  console.log('Laria Prompt 17 device hardening matrix passed');
})().catch(function(err){console.error(err);process.exit(1)});
