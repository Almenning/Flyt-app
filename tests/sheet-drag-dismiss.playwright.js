'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');

async function touchDrag(page,selector,dy,xRatio=0.5){
  await page.locator(selector).evaluate((handle,{delta,xRatio})=>{
    const r=handle.getBoundingClientRect(),x=r.left+r.width*xRatio,y=r.top+r.height/2,id=41;
    const makeTouch=clientY=>new Touch({identifier:id,target:handle,clientX:x,clientY,pageX:x,pageY:clientY,screenX:x,screenY:clientY,radiusX:2,radiusY:2,rotationAngle:0,force:1});
    const start=makeTouch(y),offsets=Array.isArray(delta)?delta:[delta];
    handle.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[start],targetTouches:[start],changedTouches:[start]}));
    let last=start;
    for(const offset of offsets){
      last=makeTouch(y+offset);
      handle.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[last],targetTouches:[last],changedTouches:[last]}));
    }
    handle.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],targetTouches:[],changedTouches:[last]}));
  },{delta:dy,xRatio});
}

async function basePage(browser){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.setContent('<!doctype html><html lang="nb"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{--ink:#452f29;--muted:#806b61;--accent:#e56c50;--deep:#5a3329;--line:#ead8d0}*{box-sizing:border-box}body{margin:0;background:#fff7f1;color:var(--ink);font-family:system-ui}button,input,textarea{font:inherit}#content{height:100dvh;overflow:auto;padding:18px}.ey{font-size:12px;font-weight:900}.title{font:500 34px Georgia}</style></head><body><main id="content"></main><nav id="nav"><button data-view="seen">Sett</button><button data-view="rewards">Belønning</button></nav></body></html>');
  await page.addScriptTag({path:path.join(root,'sheet-ui.js')});
  return {page,context};
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    // The shared primitive itself must work with iOS-style touch events.
    {
      const {page,context}=await basePage(browser);
      await page.evaluate(()=>{
        const layer=document.createElement('div');
        layer.id='testLayer';layer.className='flytSheetLayer';
        layer.innerHTML='<section id="testSheet" class="flytSheet" style="height:500px" role="dialog" aria-modal="true"><div id="testHandle" class="flytSheetHandle" data-flyt-sheet-handle></div></section>';
        document.body.appendChild(layer);
        window.__dismissed=0;
        FlytSheetUI.bind(layer.querySelector('#testSheet'),{layer,onDismiss:()=>{window.__dismissed++;layer.remove()}});
      });
      const grip=await page.locator('#testHandle').evaluate(el=>({handle:el.getBoundingClientRect().width,sheet:el.parentElement.getBoundingClientRect().width}));
      assert.ok(grip.handle>=grip.sheet*.95,'grip zone must span almost the full sheet width');
      await touchDrag(page,'#testHandle',14,0.12);
      await page.waitForTimeout(230);
      assert.equal(await page.evaluate(()=>window.__dismissed),0,'short drag must snap back');
      assert.equal(await page.locator('#testSheet').count(),1);
      await touchDrag(page,'#testHandle',[80,55],0.12);
      await page.waitForTimeout(230);
      assert.equal(await page.evaluate(()=>window.__dismissed),0,'dragging back upward before release must cancel dismissal even above threshold');
      assert.equal(await page.locator('#testSheet').count(),1);
      await touchDrag(page,'#testHandle',46,0.12);
      await page.waitForFunction(()=>window.__dismissed===1);
      assert.equal(await page.locator('#testLayer').count(),0,'long drag must dismiss');
      await context.close();
    }

    // Sett uses the shared layer, sheet, handle and dismiss behavior.
    let settGeometry;
    {
      const {page,context}=await basePage(browser);
      await page.addScriptTag({path:path.join(root,'seen-core.js')});
      await page.evaluate(()=>{
        const day=window.FlytSeenCore.dateKey();
        window.__state={user:'Tore',view:'seen',status:{Tore:{},Jannicke:{}},points:{Tore:0,Jannicke:0},tasks:[],completions:[],plannedTasks:[],recognitions:[],seenPersonalNudges:{}};
        window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:()=>{}};
        window.FlytSync={getContext:()=>({user_id:'u_tore',members:[{id:'u_tore',display_name:'Tore'},{id:'u_jannicke',display_name:'Jannicke'}]}),queueSave:()=>{}};
        window.FlytSettingsUI={enabled:()=>true};window.FlytEdgeSwipeBack={bind(){},unbind(){}};
      });
      await page.addScriptTag({path:path.join(root,'seen-ui.js')});
      await page.evaluate(()=>window.FlytSeenUI.render({resetScroll:true}));
      await page.getByRole('button',{name:/Gi anerkjennelse/}).click();
      const layer=page.locator('[data-seen-sheet-layer]');
      const sheet=page.locator('.seenSheet');
      assert.equal(await layer.evaluate(el=>el.classList.contains('flytSheetLayer')),true);
      assert.equal(await sheet.evaluate(el=>el.classList.contains('flytSheet')),true);
      assert.equal(await page.locator('.seenSheetHandle').evaluate(el=>el.classList.contains('flytSheetHandle')),true);
      assert.equal(await page.locator('.seenSheetBody').evaluate(el=>el.classList.contains('flytSheetScroll')),true);
      settGeometry=await sheet.evaluate(el=>{const s=getComputedStyle(el);return{width:s.width,borderRadius:s.borderTopLeftRadius}});
      await touchDrag(page,'.seenSheetHandle',14,0.15);
      await page.waitForTimeout(230);
      assert.equal(await sheet.count(),1,'short Sett drag must stay open');
      await touchDrag(page,'.seenSheetHandle',80,0.15);
      await page.waitForFunction(()=>!document.querySelector('.seenSheet'));
      assert.equal(await page.locator('.seenSheet').count(),0,'Sett drag must close the sheet');
      await context.close();
    }

    // Belønning uses the exact same primitive, including nested pickers.
    {
      const {page,context}=await basePage(browser);
      await page.evaluate(()=>{
        window.__state={
          user:'Tore',view:'rewards',status:{Tore:{},Jannicke:{}},points:{Tore:1000,Jannicke:50},
          rewardPurchases:[],rewardOffers:[],goals:[],completions:[],
          tasks:[{id:'bedkids',name:'Kveldsstell og legging',kind:'house',cat:'Barn',pts:20}]
        };
        window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:()=>{}};
        window.FlytSync={queueSave:()=>{}};
        window.FlytEdgeSwipeBack={bind(){},unbind(){}};
      });
      await page.addScriptTag({path:path.join(root,'rewards-goals-core.js')});
      await page.addScriptTag({path:path.join(root,'rewards-ui.js')});
      await page.evaluate(()=>window.FlytRewardsUI.render());
      await page.evaluate(()=>window.FlytRewardsUI.openChallenge());
      const layer=page.locator('#goalSheetLayer'),sheet=page.locator('.temptationShell');
      assert.equal(await layer.evaluate(el=>el.classList.contains('flytSheetLayer')),true);
      assert.equal(await sheet.evaluate(el=>el.classList.contains('flytSheet')),true);
      assert.equal(await page.locator('.temptationDragHandle').evaluate(el=>el.classList.contains('flytSheetHandle')),true);
      assert.equal(await page.locator('.temptationBody').evaluate(el=>el.classList.contains('flytSheetScroll')),true);
      const rewardGeometry=await sheet.evaluate(el=>{const s=getComputedStyle(el);return{width:s.width,borderRadius:s.borderTopLeftRadius}});
      assert.deepEqual(rewardGeometry,settGeometry,'Sett and Belønning must share the same mobile sheet geometry');

      await page.locator('[data-temptation-catalog]').click();
      const catalog=page.locator('#fristelseCatalogLayer .fristelseCatalog');
      assert.equal(await catalog.evaluate(el=>el.classList.contains('flytSheet')),true);
      assert.equal(await page.locator('#fristelseCatalogLayer').evaluate(el=>el.classList.contains('flytSheetLayer')),true);
      await touchDrag(page,'#fristelseCatalogLayer .flytSheetHandle',80,0.15);
      await page.waitForFunction(()=>!document.querySelector('#fristelseCatalogLayer'));
      assert.equal(await sheet.count(),1,'closing nested picker must keep Fristelse open');

      await touchDrag(page,'.temptationDragHandle',80,0.15);
      await page.waitForFunction(()=>!document.querySelector('#goalSheetLayer'));
      assert.equal(await page.locator('.temptationShell').count(),0,'Belønning drag must close the sheet');
      await context.close();
    }

    console.log('Shared Sett/Belønning sheet system passed');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
