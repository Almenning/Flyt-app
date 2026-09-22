'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');

async function setup(page){
  await page.setContent('<html lang="nb"><head><style>:root{--ink:#452f29;--muted:#806b61;--accent:#e56c50;--deep:#5a3329;--line:#ead8d0}</style></head><body><main id="content"></main><nav id="nav"></nav></body></html>');
  await page.evaluate(()=>{
    window.__state={
      user:'Tore',view:'rewards',points:{Tore:500,Jannicke:0},rewardPurchases:[],rewardOffers:[],
      goals:[{id:'takeaway-goal',kind:'personal',owner:'Tore',createdBy:'Tore',title:'Tjen 500 poeng',status:'reached',deadline:'2099-01-01T23:59:00.000Z',metric:{type:'points_new',target:500},reward:{title:'Takeaway',cost:0,status:'available',direct:true,model:'earned'}}]
    };
    window.__saves=0;
    window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:()=>{}};
    window.FlytSync={queueSave:()=>{window.__saves+=1}};
  });
  await page.addScriptTag({path:path.join(root,'rewards-goals-core.js')});
  await page.addScriptTag({path:path.join(root,'rewards-ui.js')});
  await page.locator('[data-goal-open="takeaway-goal"]').waitFor();
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await setup(page);
    await page.locator('[data-goal-open="takeaway-goal"]').click();
    await page.locator('[data-reward-used="takeaway-goal"]').waitFor();
    assert.equal(await page.locator('text=Bruk 500 poeng').count(),0);
    assert.equal(await page.locator('#flytGlobalModal').count(),0);
    await page.locator('[data-reward-used="takeaway-goal"]').click();
    await page.locator('#goalSheetLayer').waitFor({state:'detached'});
    const result=await page.evaluate(()=>structuredClone(window.__state));
    assert.equal(result.points.Tore,500);
    assert.equal(result.goals[0].reward.status,'used');
    assert.equal(result.rewardPurchases.length,0);
    assert.equal(await page.evaluate(()=>window.__saves),1);
    console.log('rewards earned browser test passed');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
