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
    window.__saves=0;
    window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:()=>{}};
    window.FlytSync={queueSave:()=>{window.__saves+=1}};
  });
  await page.addScriptTag({path:path.join(root,'rewards-goals-core.js')});
  await page.addScriptTag({path:path.join(root,'sheet-ui.js')});
  await page.addScriptTag({path:path.join(root,'rewards-ui.js')});
  await page.locator('[data-goal-create="challenge"]').click();
  await page.locator('[data-temptation-reward="Massasje"]').click();
  await page.locator('[data-temptation-next]').click();
  await page.locator('[data-temptation-type="points"]').click();
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [390,320]){
      const page=await browser.newPage({viewport:{width,height:844}});
      const errors=[];page.on('pageerror',error=>errors.push(String(error)));
      await setup(page);

      const wheel=page.locator('[data-temptation-point-wheel]');
      await wheel.waitFor();
      assert.equal(await page.locator('#pointPickerLayer').count(),0,'Fristelse should not open a second point modal');
      assert.equal(await page.locator('[name="temptationPoints"]').inputValue(),'60');

      const layout=await page.evaluate(()=>{
        const progress=document.querySelector('.temptationProgress'),mini=document.querySelector('.temptationStepTwo>.temptationMini'),body=document.querySelector('.temptationBody'),focus=document.querySelector('.temptationPointFocus'),rail=document.querySelector('.temptationPointRail');
        return {gap:mini.getBoundingClientRect().top-progress.getBoundingClientRect().bottom,overflow:body.scrollWidth>body.clientWidth,focusWidth:focus.getBoundingClientRect().width,railWidth:rail.getBoundingClientRect().width};
      });
      assert(layout.gap>=0&&layout.gap<=50,JSON.stringify(layout));
      assert.equal(layout.overflow,false);
      assert(layout.focusWidth>180&&layout.focusWidth<=layout.railWidth,JSON.stringify(layout));
      assert.match(await page.locator('.temptationPointGestureHint').innerText(),/Trykk på valgt tall/);

      // A neighbour tap centers only. Tapping that now-centered value confirms and advances.
      await page.locator('[data-inline-point="70"]').click();
      assert.equal(await page.locator('.temptationShell').getAttribute('data-flow-step'),'2');
      assert.equal(await page.locator('[name="temptationPoints"]').inputValue(),'70');
      await page.locator('[data-inline-point="70"]').click();
      await page.waitForFunction(()=>document.querySelector('.temptationShell').dataset.flowStep==='3');
      assert.match(await page.locator('.temptationMini').innerText(),/70/);
      await page.locator('[data-temptation-back]').click();
      assert.equal(await page.locator('[name="temptationPoints"]').inputValue(),'70');

      // A drag's compatibility click must never confirm the value.
      await page.locator('[data-temptation-point-wheel]').evaluate(el=>{
        const selected=el.querySelector('[aria-selected="true"]');
        const init={bubbles:true,pointerId:1,isPrimary:true,button:0,clientX:120,clientY:90};
        el.dispatchEvent(new PointerEvent('pointerdown',init));
        el.dispatchEvent(new PointerEvent('pointermove',{...init,clientY:120}));
        el.dispatchEvent(new PointerEvent('pointerup',{...init,clientY:120}));
        selected.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      });
      assert.equal(await page.locator('.temptationShell').getAttribute('data-flow-step'),'2');

      // Next must commit the currently centered value even if scroll just changed.
      await wheel.evaluate(el=>{el.scrollTop=13*44;document.querySelector('[data-temptation-next]').click()});
      await page.waitForFunction(()=>document.querySelector('.temptationShell').dataset.flowStep==='3');
      assert.match(await page.locator('.temptationMini').innerText(),/140/);
      await page.locator('[data-temptation-back]').click();
      assert.equal(await page.locator('[name="temptationPoints"]').inputValue(),'140');

      // Manual values are inline too, without another sheet.
      await page.locator('[data-temptation-points-mode="manual"]').click();
      const input=page.locator('[data-temptation-point-input]');
      assert(Number.parseFloat(await input.evaluate(el=>getComputedStyle(el).fontSize))>=16);
      for(const invalid of ['','0','-10','1.5','abc']){
        await input.fill(invalid);
        assert.equal(await page.locator('[data-temptation-next]').isDisabled(),true,invalid);
      }
      await input.fill('75');
      assert.equal(await page.locator('[data-temptation-next]').isDisabled(),false);
      await page.locator('[data-temptation-next]').click();
      assert.match(await page.locator('.temptationMini').innerText(),/75/);
      await page.locator('[data-temptation-back]').click();
      assert.equal(await input.inputValue(),'75');

      // Switching condition type does not discard the draft value.
      await input.fill('2000');
      await page.locator('[data-temptation-type="task"]').click();
      await page.locator('[data-temptation-task="bedkids"]').click();
      await page.locator('[data-temptation-type="manual"]').click();
      await page.locator('[name="temptationManual"]').fill('Rydd boden');
      await page.locator('[data-temptation-type="points"]').click();
      assert.equal(await page.locator('[data-temptation-point-input]').inputValue(),'2000');

      await page.locator('[data-temptation-next]').click();
      await page.locator('[data-temptation-deadline="tomorrow"]').click();
      await page.locator('[data-temptation-next]').click();
      await page.locator('#temptationFlowForm button[type="submit"]').click();

      const result=await page.evaluate(()=>structuredClone(window.__state));
      assert.equal(result.goals.length,1);
      assert.equal(result.goals[0].metric.type,'points_new');
      assert.equal(result.goals[0].metric.target,2000);
      assert.deepEqual(result.points,{Tore:1000,Jannicke:50});
      assert.equal(await page.evaluate(()=>window.__saves),1);
      assert.deepEqual(errors,[]);
      await page.close();
      console.log('Fristelse inline points '+width+'px passed');
    }
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
