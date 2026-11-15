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
 const live=home.locator('.bc15-subject-signs:not([hidden]) [data-bc15-subject="'+id+'"]');
 if(await live.isVisible()){await live.click();return;}
 const fallback=home.locator('.bc14-subject[data-camp="subject-'+id+'"]');
 await fallback.waitFor({state:'visible',timeout:14000});
 await fallback.click();
};
