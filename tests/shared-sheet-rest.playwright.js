'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');

async function pageFor(browser,view='home'){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.setContent(`<!doctype html><html lang="nb"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{--bg:#fff7f1;--paper:#fffdfa;--ink:#452f29;--muted:#806b61;--accent:#e56c50;--deep:#5a3329;--line:#ead8d0}*{box-sizing:border-box}body{margin:0;background:#fff7f1;color:var(--ink);font-family:system-ui}.hidden{display:none!important}button,input,textarea,select{font:inherit}.content,#content{height:100dvh;overflow:auto;padding:18px}.ey{font-size:11px;font-weight:900}.title{font:500 34px Georgia}.row{display:flex;align-items:center;gap:10px}.grow{flex:1}.pill,.primary,.secondary{min-height:42px}.nav{display:grid;grid-template-columns:repeat(4,1fr)}</style></head><body><header class="top"><button id="switchUser">Tore</button><div><button id="setupBtn">Oppsett</button></div></header><main id="content" class="content"></main><nav id="nav" class="nav"><button data-view="home">Hjem</button><button data-view="tasks">Gjøre</button><button data-view="seen">Sett</button><button data-view="rewards">Belønning</button></nav></body></html>`);
  await page.evaluate(v=>{
    const now=new Date().toISOString();
    window.__state={
      user:'Tore',view:v,setupDone:true,
      status:{Tore:{capacity:'med',capacity_level:'calm',needs:[],daily_updated_at:now,updated_at:now},Jannicke:{}},
      points:{Tore:100,Jannicke:80},tasks:[],custom:[],completions:[],plannedTasks:[],goals:[],rewardPurchases:[],rewardOffers:[],
      appPreferences:{household:{},personal:{}},recognitions:[]
    };
    window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:()=>{}};
    window.FlytSync={
      getContext:()=>({user_id:'u_tore',members:[{id:'u_tore',display_name:'Tore'}]}),
      myName:()=>window.__state.user,
      queueSave:()=>{}
    };
    window.FlytNudgeUI={augment(){},refreshStatus(){},updatePreference(){}};
  },view);
  await page.addScriptTag({path:path.join(root,'sheet-ui.js')});
  return {page,context};
}

async function dragDown(page,selector,dy=120){
  await page.locator(selector).evaluate((handle,delta)=>{
    const r=handle.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,id=73;
    const touch=clientY=>new Touch({identifier:id,target:handle,clientX:x,clientY,pageX:x,pageY:clientY,screenX:x,screenY:clientY,radiusX:2,radiusY:2,rotationAngle:0,force:1});
    const a=touch(y),b=touch(y+delta);
    handle.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[a],targetTouches:[a],changedTouches:[a]}));
    handle.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[b],targetTouches:[b],changedTouches:[b]}));
    handle.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],targetTouches:[],changedTouches:[b]}));
  },dy);
}
async function assertShared(page,{layer,sheet,handle,scroll}){
  assert.equal(await page.locator(layer).evaluate(el=>el.classList.contains('flytSheetLayer')),true,layer+' must use shared layer');
  assert.equal(await page.locator(sheet).evaluate(el=>el.classList.contains('flytSheet')),true,sheet+' must use shared sheet');
  assert.equal(await page.locator(handle).evaluate(el=>el.classList.contains('flytSheetHandle')),true,handle+' must use shared handle');
  if(scroll)assert.equal(await page.locator(scroll).evaluate(el=>el.classList.contains('flytSheetScroll')),true,scroll+' must use shared scroll');
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    // Hjem: dagsform is a genuine bottom sheet.
    {
      const {page,context}=await pageFor(browser,'home');
      await page.addScriptTag({path:path.join(root,'daily-status.js')});
      await page.addScriptTag({path:path.join(root,'day-plan.js')});
      await page.addScriptTag({path:path.join(root,'home-ui.js')});
      await page.evaluate(()=>window.FlytHomeUI.render({resetScroll:true}));
      await page.locator('[data-home-status-edit]').click();
      await page.locator('.homeStatusSheet').waitFor();
      await assertShared(page,{layer:'.homeStatusSheetLayer',sheet:'.homeStatusSheet',handle:'.homeStatusSheetHandle',scroll:'.homeStatusSheetBody'});
      await dragDown(page,'.homeStatusSheetHandle');
      await page.waitForFunction(()=>!document.querySelector('.homeStatusSheet'));
      await context.close();
    }

    // Innstillinger: same component, same dismiss gesture.
    {
      const {page,context}=await pageFor(browser,'home');
      await page.addScriptTag({path:path.join(root,'settings-ui.js')});
      await page.evaluate(()=>window.FlytSettingsUI.open());
      await page.locator('.flytSettingsPanel').waitFor();
      await assertShared(page,{layer:'#flytSettings',sheet:'#flytSettings .flytSettingsPanel',handle:'#flytSettings .flytSettingsHandle',scroll:'#flytSettings .flytSettingsScroll'});
      await dragDown(page,'#flytSettings .flytSettingsHandle');
      await page.waitForFunction(()=>!document.querySelector('#flytSettings'));
      await context.close();
    }

    // Mer-meny: no bespoke bottom-sheet physics.
    {
      const {page,context}=await pageFor(browser,'home');
      await page.addScriptTag({path:path.join(root,'buyer-polish-ui.js')});
      await page.evaluate(()=>window.FlytBuyerPolish.openMenu());
      await page.locator('#flytAppMenu .flytMenuSheet').waitFor();
      await assertShared(page,{layer:'#flytAppMenu',sheet:'#flytAppMenu .flytMenuSheet',handle:'#flytAppMenu .flytMenuHandle',scroll:'#flytAppMenu .flytMenuBody'});
      await dragDown(page,'#flytAppMenu .flytMenuHandle');
      await page.waitForFunction(()=>!document.querySelector('#flytAppMenu'));
      await context.close();
    }

    // Min liste editor: editor sheets use the same system; the full-page list remains a page.
    {
      const {page,context}=await pageFor(browser,'tasks');
      await page.addScriptTag({path:path.join(root,'personal-tasks-ui.js')});
      await page.evaluate(()=>window.FlytPrivateTasks.open());
      await page.locator('[data-private-new]').click();
      await page.locator('#privateTaskEditor .privateTaskEditorSheet').waitFor();
      await assertShared(page,{layer:'#privateTaskEditor',sheet:'#privateTaskEditor .privateTaskEditorSheet',handle:'#privateTaskEditor .privateTaskEditorHandle',scroll:'#privateTaskEditor .privateTaskEditorBody'});
      await dragDown(page,'#privateTaskEditor .privateTaskEditorHandle');
      await page.waitForFunction(()=>!document.querySelector('#privateTaskEditor'));
      assert.equal(await page.locator('#privateTaskPage').count(),1,'dragging editor must not close Min liste page');
      await context.close();
    }

    // Oppsummering history is a bottom sheet; summary alert stays a centered popup.
    {
      const {page,context}=await pageFor(browser,'tasks');
      await page.addScriptTag({path:path.join(root,'summary-core.js')});
      await page.addScriptTag({path:path.join(root,'summary-ui.js')});
      await page.evaluate(()=>window.FlytSummaryUI.openHistory());
      await page.locator('#flytSummaryHistory .flytSummaryHistoryPanel').waitFor();
      await assertShared(page,{layer:'#flytSummaryHistory',sheet:'#flytSummaryHistory .flytSummaryHistoryPanel',handle:'#flytSummaryHistory .flytSummaryHistoryHandle',scroll:'#flytSummaryHistory .flytSummaryHistoryBody'});
      await dragDown(page,'#flytSummaryHistory .flytSummaryHistoryHandle');
      await page.waitForFunction(()=>!document.querySelector('#flytSummaryHistory'));
      await context.close();
    }

    console.log('Shared sheet system covers natural bottom sheets across the app');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
