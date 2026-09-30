'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');

async function setup(page){
  await page.setContent('<!doctype html><html lang="nb"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--ink:#452f29;--muted:#806b61;--accent:#e56c50;--deep:#5a3329;--line:#ead8d0}*{box-sizing:border-box}body{margin:0;background:#fff7f1;color:var(--ink);font-family:system-ui}button,input{font:inherit}#content{height:100dvh;overflow:auto;padding:18px}.ey{font-size:12px;font-weight:900}.title{font:500 34px Georgia}</style></head><body><main id="content"></main><nav id="nav"></nav></body></html>');
  await page.evaluate(()=>{
    window.__state={
      user:'Tore',view:'rewards',
      status:{Tore:{},Jannicke:{}},
      points:{Tore:1000,Jannicke:50},
      rewardPurchases:[],rewardOffers:[],goals:[],completions:[],
      tasks:[
        {id:'bedkids',name:'Kveldsstell og legging',kind:'house',cat:'Barn',pts:20},
        {id:'kitchen',name:'Rydde kjøkken',kind:'house',cat:'Kjøkken',pts:10}
      ]
    };
    window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:()=>{}};
    window.FlytSync={queueSave:()=>{}};
  });
  await page.addScriptTag({path:path.join(root,'rewards-goals-core.js')});
  await page.addScriptTag({path:path.join(root,'sheet-ui.js')});
  await page.addScriptTag({path:path.join(root,'rewards-ui.js')});
  await page.addScriptTag({path:path.join(root,'edge-swipe-back.js')});
  await page.evaluate(()=>window.FlytRewardsUI.render());
  await page.locator('[data-goal-create="challenge"]').waitFor();
}
async function swipeBack(page,selector){
  await page.locator(selector).evaluate(el=>{
    const base={bubbles:true,pointerId:77,pointerType:'touch',isPrimary:true,button:0};
    el.dispatchEvent(new PointerEvent('pointerdown',{...base,clientX:8,clientY:320}));
    el.dispatchEvent(new PointerEvent('pointermove',{...base,clientX:72,clientY:322}));
    el.dispatchEvent(new PointerEvent('pointerup',{...base,clientX:118,clientY:323}));
  });
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];page.on('pageerror',error=>errors.push(String(error)));
    await setup(page);

    // Fristelse: step 1 has one close control, no fake left close, and edge swipe closes to Belønning.
    await page.evaluate(()=>window.FlytRewardsUI.openChallenge());
    await page.locator('.temptationShell').waitFor();
    assert.equal(await page.locator('.temptationShell').getAttribute('data-flow-step'),'1');
    assert.equal(await page.locator('.temptationBackPlaceholder').count(),1);
    assert.equal(await page.locator('button.temptationBack').count(),0);
    assert.equal(await page.locator('.temptationClose').count(),1);
    await swipeBack(page,'.temptationScreen h2');
    await page.waitForFunction(()=>!document.querySelector('#goalSheetLayer'));
    assert.equal(await page.locator('[data-goal-create="challenge"]').count(),1);

    await page.waitForTimeout(500);

    // Fristelse: later steps edge-swipe one step back.
    await page.evaluate(()=>window.FlytRewardsUI.openChallenge());
    await page.locator('.temptationShell').waitFor();
    await page.locator('[data-temptation-reward="Massasje"]').click();
    await page.locator('[data-temptation-next]').click();
    assert.equal(await page.locator('.temptationShell').getAttribute('data-flow-step'),'2');
    assert.equal(await page.locator('button.temptationBack').count(),1);
    await swipeBack(page,'.temptationScreen h2');
    await page.waitForFunction(()=>document.querySelector('.temptationShell')?.dataset.flowStep==='1');

    await page.waitForTimeout(500);

    // Nested catalog closes first and restores the underlying modal.
    await page.locator('[data-temptation-catalog]').click();
    assert.equal(await page.locator('#fristelseCatalogLayer').count(),1);
    assert.equal(await page.locator('.temptationShell').getAttribute('aria-modal'),'false');
    await swipeBack(page,'.fristelseCatalog .deadlinePickerHead h3');
    await page.waitForFunction(()=>!document.querySelector('#fristelseCatalogLayer'));
    assert.equal(await page.locator('.temptationShell').getAttribute('aria-modal'),'true');
    assert.equal(await page.locator('.temptationShell').getAttribute('data-flow-step'),'1');
    await page.locator('.temptationClose').click();

    await page.waitForTimeout(500);

    // Mål follows the same stack semantics.
    await page.locator('[data-goal-choice]').click();
    await page.locator('.goalFlowShell').waitFor({timeout:5000}).catch(async error=>{
      console.error('Goal flow did not open',await page.evaluate(()=>({goalLayer:!!document.querySelector('#goalSheetLayer'),bodyDialogs:[...document.querySelectorAll('[role="dialog"]')].map(el=>({className:el.className,ariaModal:el.getAttribute('aria-modal')}))})),errors);
      throw error;
    });
    assert.equal(await page.locator('.goalFlowShell').getAttribute('data-flow-step'),'1');
    assert.equal(await page.locator('.goalFlowShell .temptationBackPlaceholder').count(),1);
    assert.equal(await page.locator('.goalFlowShell button.temptationBack').count(),0);
    await page.locator('[data-goalflow-kind="personal"]').click();
    assert.equal(await page.locator('.goalFlowShell').getAttribute('data-flow-step'),'2');
    await swipeBack(page,'.goalFlowStepTwo h2');
    await page.waitForFunction(()=>document.querySelector('.goalFlowShell')?.dataset.flowStep==='1');

    await page.waitForTimeout(500);
    await swipeBack(page,'.goalFlowShell .temptationScreen h2');
    await page.waitForFunction(()=>!document.querySelector('#goalSheetLayer'));

    await page.waitForTimeout(500);

    // History is a secondary screen and edge-swipes back to Belønning.
    await page.locator('[data-goal-history]').click();
    assert.equal(await page.locator('.goalSheet').getAttribute('data-flyt-edge-swipe-back'),'1');
    await swipeBack(page,'.goalSheetTitle');
    await page.waitForFunction(()=>!document.querySelector('#goalSheetLayer'));
    assert.equal(await page.locator('[data-goal-history]').count(),1);

    assert.deepEqual(errors,[]);
    console.log('Rewards edge-swipe navigation passed');
    await page.close();
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
