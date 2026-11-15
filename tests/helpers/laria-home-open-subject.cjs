'use strict';
/* Læria Home: all tests must use the child's visible subject entry.
 * Clean iPad art has only the left oak rail; older phone/desktop versions
 * retain the original four-card fallback until separately redesigned.
 * Never make an invisible image hotspot the primary acceptance test.
 */
module.exports=async function openHomeSubject(page,id){
 if(!['norwegian','math','english','geography'].includes(id))
   throw Error('Unsupported Læria subject: '+id);
 const home=page.locator('#home-screen.active .bc12.bc15-locked-home');
 await home.waitFor({state:'visible',timeout:22000});
 // Wait until a real, child-visible sign has actually been laid out.
 // The old four-card row is intentionally hidden/inert on clean iPad art.
 await page.waitForFunction(id=>{
   const h=document.querySelector('#home-screen.active .bc12.bc15-locked-home');
   if(!h)return false;
   const visible=el=>{
     if(!el||el.closest('[inert]'))return false;
     const s=getComputedStyle(el),r=el.getBoundingClientRect();
     return s.visibility!=='hidden'&&s.display!=='none'&&
       s.pointerEvents!=='none'&&r.width>=38&&r.height>=28;
   };
   const rail=h.querySelector('.bc15-subject-signs:not([hidden]) [data-bc15-subject="'+id+'"]');
   const old=h.querySelector('.bc14-subject[data-camp="subject-'+id+'"]');
   return visible(rail)||visible(old);
 },id,{timeout:22000});
 const live=home.locator('.bc15-subject-signs:not([hidden]) [data-bc15-subject="'+id+'"]');
 if(await live.isVisible()){await live.click();return;}
 const fallback=home.locator('.bc14-subject[data-camp="subject-'+id+'"]');
 await fallback.waitFor({state:'visible',timeout:14000});
 await fallback.click();
};
