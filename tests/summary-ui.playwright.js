'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function setup(page,user,userId,shared={}){
  await page.setContent('<html lang="nb"><head><style>:root{--ink:#452f29;--muted:#806b61;--accent:#e56c50}</style></head><body><main class="app" id="content" data-flyt-owner="recurrence"><div class="taskViewContent"><button data-open-new-setup>Oppsett</button></div></main></body></html>');
  await page.addScriptTag({path:path.join(root,'summary-core.js')});
  await page.evaluate(({user,userId,shared})=>{
    const today=window.FlytSummaryCore.dateKey(),current=window.FlytSummaryCore.weekRange(today),last=window.FlytSummaryCore.addDays(current.start,-7);
    const tasks=[{id:'a',name:'Legging',cat:'Barn',type:'daily',kind:'house'},{id:'b',name:'Middag',cat:'Kjøkken',type:'daily',kind:'house'}];
    window.__state={user,view:'tasks',setupDone:true,tasks,custom:[],dayPlans:{},completions:[{id:1,taskId:'a',date:last,by:user,taskSnapshot:{name:'Legging',cat:'Barn',type:'daily',kind:'house'}}],recognitions:[],...shared};
    window.FlytBridge={getState:()=>window.__state,setState:next=>window.__state=next};
    window.FlytSync={getContext:()=>({user_id:userId}),isSummaryReady:()=>true,queueSave:()=>{}};
    window.FlytAccountUI={isConsentReady:()=>true};
    window.FlytSettingsUI={enabled:(key,fallback)=>key==='summaries.weekly'?true:key==='summaries.daily'?false:fallback};
    window.FlytDayPlan={VERSION:'test',category:task=>task?.cat||'Egendefinert',resolveTask:(state,id)=>state.tasks.find(task=>String(task.id)===String(id)),planTasks:state=>state.tasks,moveToDay:(state,fromDate,toDate,id)=>({...state,dayPlans:{...state.dayPlans,[fromDate]:{removedTaskIds:[id]},[toDate]:{addedTaskIds:[id]}}})};
  },{user,userId,shared});
  await page.addScriptTag({path:path.join(root,'summary-ui.js')});
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await setup(page,'Tore','tore-id');
    await page.locator('#flytSummaryDialog').waitFor();
    assert.equal(await page.locator('[data-summary-details]').isVisible(),true);
    await page.locator('[data-summary-done]').click();
    await page.locator('#flytSummaryDialog').waitFor({state:'detached'});
    const shared=await page.evaluate(()=>structuredClone(window.__state));
    assert.ok(shared.appPreferences.personal['tore-id'].summarySeen.weekly);
    await page.locator('[data-summary-history-open]').click();
    await page.locator('#flytSummaryHistory').waitFor();
    await page.locator('[data-summary-week]').first().click();
    assert.match(await page.locator('[data-summary-history-body]').innerText(),/Overblikk/);
    await page.locator('[data-summary-task]').first().click();
    assert.match(await page.locator('[data-summary-history-body]').innerText(),/registrerte fullføringer/);
    await page.locator('[data-summary-back]').click();
    assert.match(await page.locator('[data-summary-history-body]').innerText(),/Mest gjort/);
    await page.locator('[data-summary-history-close]').click();
    await page.locator('#flytSummaryHistory').waitFor({state:'detached'});
    const partner=await browser.newPage({viewport:{width:390,height:844}});
    await setup(partner,'Jannicke','jannicke-id',shared);
    await partner.locator('#flytSummaryDialog').waitFor();
    assert.equal(await partner.locator('[data-summary-done]').isVisible(),true);
    console.log('summary-ui browser tests passed');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
