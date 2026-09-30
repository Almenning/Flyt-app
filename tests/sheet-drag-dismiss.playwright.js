'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');

async function drag(page,selector,dy){
  const box=await page.locator(selector).boundingBox();
  assert(box,'missing drag handle');
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x,y+dy,{steps:6});
  await page.mouse.up();
}

async function basePage(browser){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--ink:#452f29;--muted:#806b61;--accent:#e56c50;--deep:#5a3329;--line:#ead8d0}body{margin:0;background:#fff7f1}button,input{font:inherit}#content{height:100dvh;overflow:auto;padding:18px}.ey{font-size:12px;font-weight:900}.title{font:500 34px Georgia}</style></head><body><main id="content"></main><nav id="nav"></nav></body></html>');
  await page.addScriptTag({path:path.join(root,'edge-swipe-back.js')});
  return page;
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    // Shared interaction: short drag returns, long drag dismisses.
    {
      const page=await basePage(browser);
      await page.evaluate(()=>{
        const layer=document.createElement('div');
        layer.id='testLayer';
        layer.style.cssText='position:fixed;inset:0;display:flex;align-items:flex-end;background:#0006';
        layer.innerHTML='<section id="testSheet" style="width:100%;height:500px;background:white;border-radius:28px 28px 0 0"><div id="testHandle" style="width:38px;height:5px;margin:10px auto;background:#d9bcb0"></div></section>';
        document.body.appendChild(layer);
        window.__dismissed=0;
        const sheet=document.querySelector('#testSheet'),handle=document.querySelector('#testHandle');
        FlytSheetDragDismiss.bind(sheet,{handle,layer,onDismiss:()=>{window.__dismissed++;layer.remove()}});
      });
      assert.equal(await page.locator('#testHandle').getAttribute('data-flyt-sheet-drag-handle'),'1');
      await drag(page,'#testHandle',42);
      await page.waitForTimeout(240);
      assert.equal(await page.evaluate(()=>window.__dismissed),0);
      assert.equal(await page.locator('#testSheet').evaluate(el=>getComputedStyle(el).transform==='none'||el.style.transform===''||el.style.transform==='translate3d(0px, 0px, 0px)'),true);
      await drag(page,'#testHandle',150);
      await page.waitForFunction(()=>window.__dismissed===1);
      assert.equal(await page.locator('#testLayer').count(),0);
      await page.close();
    }

    // Fristelse: real flow gets a real handle and drag closes the flow.
    {
      const page=await basePage(browser);
      await page.evaluate(()=>{
        window.__state={
          user:'Tore',view:'rewards',status:{Tore:{},Jannicke:{}},
          points:{Tore:1000,Jannicke:50},rewardPurchases:[],rewardOffers:[],goals:[],completions:[],
          tasks:[{id:'bedkids',name:'Kveldsstell og legging',kind:'house',cat:'Barn',pts:20}]
        };
        window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:()=>{}};
        window.FlytSync={queueSave:()=>{}};
      });
      await page.addScriptTag({path:path.join(root,'rewards-goals-core.js')});
      await page.addScriptTag({path:path.join(root,'rewards-ui.js')});
      await page.evaluate(()=>window.FlytRewardsUI.openChallenge());
      await page.locator('.temptationShell').waitFor();
      assert.equal(await page.locator('.temptationDragHandle').getAttribute('data-flyt-sheet-drag-handle'),'1');
      await drag(page,'.temptationDragHandle',170);
      await page.waitForFunction(()=>!document.querySelector('#goalSheetLayer'));
      assert.equal(await page.locator('.temptationShell').count(),0);
      await page.close();
    }

    console.log('Sheet drag dismiss passed');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
