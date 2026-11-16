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
 // The clean Home painting loads asynchronously. The original subject
 // regions can briefly be visible, then become inert while the new oak rail
 // appears. A one-time isVisible() branch races that swap. Playwright's
 // :visible locator re-resolves on retries and clicks a REAL active control.
 // Never click an offscreen, hidden or inert legacy hitbox as a test shortcut.
 const target=home.locator(
   '.bc15-subject-signs:not([hidden]) [data-bc15-subject="'+id+'"]:visible,'+
   '.bc14-subjects:not([inert]) .bc14-subject[data-camp="subject-'+id+'"]:visible'
 );
 await target.last().click({timeout:26000});
};
