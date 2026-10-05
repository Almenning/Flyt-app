/* Run with PLAYWRIGHT_MODULE=<path> node tests/laria-shared-scenes.playwright.js. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.QA_SCREENSHOTS||'/tmp/laria-scenes-qa';
fs.mkdirSync(output,{recursive:true});
const server=spawn('python',['-m','http.server','8767'],{stdio:'ignore'});
let browser;
(async()=>{
  browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  for(const [name,width,height] of [['tablet',1180,820],['portrait',820,1180],['phone',390,844],['small',320,568]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>localStorage.setItem('laerlittmer-v2',JSON.stringify({profile:{name:'Testbarn',grade:2,onboarded:true,setupVersion:1,avatar:'boy'},preferences:{sound:false,autoRead:false}})));
    await page.goto('http://127.0.0.1:8767/laer-litt-mer/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>typeof englishPool==='function');
    async function fixture(kind){
      await page.evaluate(kind=>{
        let q;
        if(kind==='english')q=englishPool(2).find(x=>x.visual==='🏠');
        if(kind==='norwegian')q=norwegianPool(2).find(x=>x.type==='build-word');
        if(kind==='math')q=mathPool(2).find(x=>x.type==='number-input');
        if(kind==='geography'||kind==='map')q=makeQuestion(Object.keys(countries).find(k=>countries[k].name==='Norge'),kind==='map'?'map':'flag');
        if(kind==='sentence')q=englishPool(3).find(x=>x.type==='sentence-order');
        if(kind==='passage')q=englishPool(5).find(x=>x.passage);
        if(kind==='sequence')q=mathPool(2).find(x=>x.type==='sequence-order');
        if(!q)throw new Error('Missing fixture '+kind);
        sessionQuestions=[q,{...q}];qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
        sessionScope={type:'module',subject:q.subject||'geography',label:'Test'};
        showScreen('session');renderQuestion();
      },kind);
      await page.locator('.laria-task-card').waitFor({state:'visible'});
      await page.evaluate(()=>document.fonts.ready);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}/${kind}: overflow`);
      assert.equal(await page.locator('.task-fox-companion').evaluate(e=>getComputedStyle(e).position),'absolute','Fox must sit in its reserved corner');
      assert.match(await page.locator('.question').evaluate(e=>getComputedStyle(e).fontFamily),/LariaRounded/);
    }
    for(const subject of ['english','math','norwegian','geography']){
      await fixture(subject);
      await page.screenshot({path:`${output}/${name}-${subject}.png`,fullPage:true});
      if(subject==='english'){
        assert.equal(await page.locator('.task-object-art').count(),1);
        assert(await page.locator('.task-object-art').evaluate(e=>e.complete&&e.naturalWidth>0));
        await page.locator('[data-answer="house"]').click();
      }else if(subject==='geography')await page.locator('[data-answer="Norge"]').click();
      else if(subject==='math'){
        await page.locator('#math-input').fill(await page.evaluate(()=>String(sessionQuestions[0].answer)));
        await page.locator('#check-number').click();
      }else{
        const letters=await page.evaluate(()=>sessionQuestions[0].answer.split(''));
        for(const [i,letter] of letters.entries()){
          await page.locator('.letter-slot[data-slot="'+i+'"]').click();
          await page.locator('.letter-bank button:not(.used)').filter({hasText:new RegExp('^'+letter+'$')}).first().click();
        }
        await page.locator('#check-build').click();
      }
      assert(await page.evaluate(()=>currentAnswered?.correct),`${name}/${subject}: answer not recorded`);
      if(subject==='norwegian'){
        await page.evaluate(()=>renderQuestion());
        assert.equal(await page.locator('.letter-slot.filled').count(),await page.evaluate(()=>sessionQuestions[0].answer.length),'Restored answer must remain visible');
      }
      assert(await page.locator('#next-question').isVisible());
      await page.locator('#next-question').click();
      assert.equal(await page.evaluate(()=>qIndex),1);
      assert.equal(await page.evaluate(()=>state.activeSession.qIndex),1);
      assert.equal(await page.evaluate(()=>sessionCorrect),1);
    }
    await fixture('english');
    await page.locator('[data-answer="mouse"]').click();
    await page.locator('#next-question').click();
    assert.equal(await page.evaluate(()=>qIndex),1,'Wrong answer must allow continuing');
    await page.locator('[data-answer="house"]').click();
    await page.locator('#next-question').click();
    await page.locator('#complete-screen.active').waitFor();
    assert.match(await page.locator('#complete-screen').evaluate(e=>getComputedStyle(e).backgroundImage),/engelsk-verden/);
    await page.screenshot({path:`${output}/${name}-complete.png`,fullPage:true});
    for(const kind of ['sentence','passage','sequence','map']){
      await fixture(kind);
      await page.screenshot({path:`${output}/${name}-${kind}.png`,fullPage:true});
    }
    for(const lab of ['Fraction','Multiplication']){
      await page.evaluate(lab=>window['open'+lab+'Lab'](),lab);
      assert.equal(Math.round(await page.locator('.app').evaluate(e=>e.getBoundingClientRect().width)),width,'Lab world must fill viewport');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}/${lab}: overflow`);
      await page.screenshot({path:`${output}/${name}-${lab}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[],`${name}: page errors`);
    console.log(name+': four subjects, correct/wrong answers, next, saved progress, completion, other task types and labs passed');
    await context.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server.kill()});
