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
 // The card-row may be visible during loading, then become inert. Never
 // decide which control to click until the final painting is selected.
 await page.waitForFunction(()=>{
   const h=document.querySelector('#home-screen.active .bc12.bc15-locked-home');
   return !!h&&/^(phone|tablet)-ready$/.test(h.dataset.bc15Asset||'')&&
     !h.classList.contains('bc15-pending');
 },null,{timeout:26000});
 const clean=(await home.getAttribute('data-bc15-card-art'))==='clean-candidate';
 if(clean){
   const rail=home.locator('.bc15-subject-signs:not([hidden]) [data-bc15-subject="'+id+'"]');
   await rail.waitFor({state:'visible',timeout:26000});
   await rail.click({timeout:26000});
 }else{
   // Complete fallback means original artwork AND its original real routes.
   // Never allow a clean image with invisible card hotspots.
   const original=home.locator('.bc14-subjects:not([inert]) .bc14-subject[data-camp="subject-'+id+'"]');
   await original.waitFor({state:'visible',timeout:26000});
   await original.click({timeout:26000});
 }
};
