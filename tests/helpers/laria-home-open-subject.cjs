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
 // On approved default iPad Home the legacy rail can exist for a moment
 // while SHA verification loads v16. Never tap that transient control.
 // Explicit v15 fixture tests keep the original fallback route.
 const expectedV16=await page.evaluate(()=>{
   const q=new URLSearchParams(location.search);
   if(!document.querySelector('.grade-band-young')||q.get('lariaV16')==='0'||
      window.__LARIA_QA_SKIP_V16===true)return null;
   const desktop=window.LARIA_HOME_V16?.supportsDesktop?.();
   const ipad=matchMedia('(min-width:768px) and (max-width:1366px) and (min-height:650px)').matches;
   if(!desktop&&!ipad)return null;
   return (desktop?'desktop':'ipad')+'-v16-'+
     (matchMedia('(orientation:portrait)').matches?'portrait':'landscape');
 });
 if(expectedV16){
   await page.waitForFunction(expected=>{
     const h=document.querySelector('#home-screen.active .bc12');
     return h?.dataset.bc15Asset===expected && h.querySelectorAll('.bc15-v16-signs button').length===4;
   },expectedV16,{timeout:30000});
 }
 // Wait for a final Home artwork state before choosing the ACTUAL visible
 // child-facing route. The old photo-card row is intentionally inert whenever
 // the locked wooden sign rail is active, including v15 landscape.
 await page.waitForFunction(()=>{
   const h=document.querySelector('#home-screen.active .bc12.bc15-locked-home');
   return !!h&&!h.classList.contains('bc15-pending')&&
     (/^(phone|tablet)-ready$/.test(h.dataset.bc15Asset||'')||
       /^(ipad|desktop)-v16-(portrait|landscape)$/.test(h.dataset.bc15Asset||''));
 },null,{timeout:26000});
 // Resolve the active button at click time. A Home rerender can replace an
 // entire rail between reading isVisible() and doing the real pointer action.
 const key='[data-bc15-subject="'+id+'"]';
 const activeRail=page.locator('#home-screen.active .bc12.bc15-locked-home:not(.bc15-pending) :is('+
   '.bc15-v16-locked .bc15-v16-signs .bc15-v16-sign'+key+
   ', .bc12:not(.bc15-v16-locked) .bc15-subject-signs:not([hidden]) '+key+
   ', .bc12:not(.bc15-v16-locked):not(:has(.bc15-subject-signs:not([hidden]))) '+
   '.bc14-subjects:not([inert]) .bc14-subject[data-camp="subject-'+id+'"]'+
   '):visible');
 await activeRail.click({timeout:26000});
};
