'use strict';
/* Læria Home: exercise the actual child-facing navigation, not invisible
 * deprecated card hotspots. Clean artwork is loaded asynchronously; waiting
 * for the final asset state avoids a hidden-card click during rail handoff.
 */
module.exports=async function openHomeSubject(page,id){
 if(!['norwegian','math','english','geography'].includes(id))
   throw Error('Unsupported Læria subject: '+id);
 const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
 await home.waitFor({state:'visible',timeout:22000});
 // Wait for a final Home artwork state before choosing the ACTUAL visible
 // child-facing route. The old photo-card row is intentionally inert whenever
 // the locked wooden sign rail is active, including v15 landscape.
 await page.waitForFunction(()=>{
   const h=document.querySelector('#home-screen.active .bc12.bc15-locked-home');
   return !!h&&!h.classList.contains('bc15-pending')&&
     (/^(phone|tablet)-ready$/.test(h.dataset.bc15Asset||'')||
       /^ipad-v16-(portrait|landscape)$/.test(h.dataset.bc15Asset||''));
 },null,{timeout:26000});
 const v16=home.locator('.bc15-v16-signs .bc15-v16-sign[data-bc15-subject="'+id+'"]');
 const rail=home.locator('.bc15-subject-signs:not([hidden]) [data-bc15-subject="'+id+'"]');
 const original=home.locator('.bc14-subjects:not([inert]) .bc14-subject[data-camp="subject-'+id+'"]');
 // Some transitions mount the rail just after the data marker is updated.
 // The waiter deliberately accepts only a rendered, enabled user-facing route.
 await page.waitForFunction(subject=>{
   const h=document.querySelector('#home-screen.active .bc12.bc15-locked-home');
   if(!h)return false;
   const selectors=[
     '.bc15-v16-signs .bc15-v16-sign[data-bc15-subject="'+subject+'"]',
     '.bc15-subject-signs:not([hidden]) [data-bc15-subject="'+subject+'"]',
     '.bc14-subjects:not([inert]) .bc14-subject[data-camp="subject-'+subject+'"]'
   ];
   return selectors.some(selector=>{
     const el=h.querySelector(selector);
     if(!el||el.disabled||el.closest('[inert],[hidden]'))return false;
     const style=getComputedStyle(el),r=el.getBoundingClientRect();
     return style.display!=='none'&&style.visibility!=='hidden'&&r.width>0&&r.height>0;
   });
 },id,{timeout:26000});
 if(await v16.isVisible()){
   await v16.click({timeout:26000});
 }else if(await rail.isVisible()){
   await rail.click({timeout:26000});
 }else{
   await original.click({timeout:26000});
 }
};
