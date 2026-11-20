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
 const requiresV16=await page.evaluate(()=>{
   const q=new URLSearchParams(location.search);
   return matchMedia('(min-width:768px) and (max-width:1366px) and (min-height:650px)').matches &&
     !!document.querySelector('.grade-band-young') && q.get('lariaV16')!=='0' &&
     window.__LARIA_QA_SKIP_V16!==true;
 });
 if(requiresV16){
   await page.waitForFunction(()=>{
     const h=document.querySelector('#home-screen.active .bc12');
     const dir=matchMedia('(orientation:portrait)').matches?'portrait':'landscape';
     return h?.dataset.bc15Asset==='ipad-v16-'+dir &&
       h.querySelectorAll('.bc15-v16-signs button').length===4;
   },null,{timeout:30000});
 }
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
 // The child-facing rails sometimes remount after returning from another
 // subject. Wait for the rail first. The old cards may briefly become visible
 // during paint, but are intentionally inert in the final premium scene.
 if(await v16.count()&&await v16.isVisible()){
   await v16.click({timeout:26000});
   return;
 }
 try{
   // The rail is rebuilt asynchronously after the legacy WebP decodes. In
   // WebKit, a briefly visible node is not proof of a tappable finished sign.
   // Verify its real on-screen hit area before exercising the child's route.
   await page.waitForFunction(subject=>{
     const host=document.querySelector('#home-screen.active .bc12.bc15-locked-home');
     const nav=host?.querySelector('.bc15-subject-signs:not([hidden])');
     const target=nav?.querySelector('[data-bc15-subject="'+subject+'"]');
     if(!target||host.classList.contains('bc15-pending'))return false;
     const style=getComputedStyle(target),rect=target.getBoundingClientRect();
     if(style.display==='none'||style.visibility!=='visible'||
        rect.width<44||rect.height<44)return false;
     const centerX=rect.left+rect.width/2,centerY=rect.top+rect.height/2;
     if(centerX<0||centerY<0||centerX>=innerWidth||centerY>=innerHeight)return false;
     const hit=document.elementFromPoint(centerX,centerY);
     return hit===target||target.contains(hit);
   },id,{timeout:18000});
   await rail.click({timeout:18000});
   return;
 }catch(error){
   // Fail with a concrete Safari paint/hit-test snapshot, never force-click
   // an invisible or covered sign and claim the child can use it.
   if(await rail.count()){
     const debug=await page.evaluate(subject=>{
       const home=document.querySelector('#home-screen.active .bc12');
       const nav=home?.querySelector('.bc15-subject-signs');
       const target=nav?.querySelector('[data-bc15-subject="'+subject+'"]');
       const style=target?getComputedStyle(target):null;
       const rect=target?.getBoundingClientRect();
       const cx=rect?rect.left+rect.width/2:0,cy=rect?rect.top+rect.height/2:0;
       const hit=rect?document.elementFromPoint(cx,cy):null;
       return {asset:home?.dataset.bc15Asset,master:home?.dataset.bc15Master,
         presentation:nav?.dataset.bc15Presentation,navHidden:nav?.hidden,
         homeClasses:home?.className,rect:rect?.toJSON(),
         display:style?.display,visibility:style?.visibility,
         pointerEvents:style?.pointerEvents,opacity:style?.opacity,
         hit:hit?.outerHTML?.slice(0,300),
         activeScreens:[...document.querySelectorAll('.screen.active')].map(x=>x.id),
         viewport:{width:innerWidth,height:innerHeight}};
     },id);
     throw new Error('Læria real subject sign not tappable: '+
       JSON.stringify(debug)+'; '+error.message);
   }
 }
 await original.waitFor({state:'visible',timeout:15000});
 await original.click({timeout:15000});
};
