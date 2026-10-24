/* Læria Hjem v15 — locked Kjøsnesfjorden / Grovanova masters.
   Approved artwork is stored as immutable WebP assets. The mountain is never regenerated. */
(function(){
'use strict';

const TABLET_MASTER='./assets/home-v15/kjosnes-home-tablet.webp?v=20261024-premium2';
const PHONE_MASTER='./assets/home-v15/kjosnes-home-phone.webp?v=20261024-locked1';
let activeMasterSrc='';

function isPhone(){return matchMedia('(max-width:700px) and (orientation:portrait)').matches}
function isPortrait(){return matchMedia('(orientation:portrait)').matches}

function openTrollDialog(){
 let d=document.getElementById('bc15-troll-dialog');
 if(!d){
   d=document.createElement('dialog');
   d.id='bc15-troll-dialog';
   d.innerHTML='<button type="button" class="bc15-troll-close" aria-label="Lukk">×</button>'+
     '<span class="bc15-troll-eyebrow">Lærias eventyrvenner</span>'+
     '<h2>Mine troll</h2>'+
     '<div class="bc15-troll-art" role="img" aria-label="De tre småtrollene ved Kjøsnesfjorden"></div>'+
     '<p>De tre småtrollene blir med deg gjennom Læria. Her er de samlet på hjemstedet sitt ved Kjøsnesfjorden.</p>'+
     '<button type="button" class="bc15-troll-back">Tilbake til Hjem</button>';
   document.body.append(d);
   d.querySelector('.bc15-troll-close').addEventListener('click',()=>d.close());
   d.querySelector('.bc15-troll-back').addEventListener('click',()=>d.close());
   d.addEventListener('click',e=>{if(e.target===d)d.close()});
 }
 d.dataset.phone=isPhone()?'true':'false';
 const art=d.querySelector('.bc15-troll-art');
 if(art)art.style.backgroundImage='url("'+TABLET_MASTER+'")';
 if(!d.open)d.showModal();
}

function decoded(src){
 return new Promise((resolve,reject)=>{
   const img=new Image();
   img.onload=()=>resolve({src,width:img.naturalWidth,height:img.naturalHeight});
   img.onerror=()=>reject(new Error('Could not decode Læria Home master'));
   img.src=src;
 });
}

function place(el,box,part,viewport){
 if(!el)return;
 const [x,y,w,h]=part;
 const rawLeft=box.left+box.width*x;
 const rawTop=box.top+box.height*y;
 const rawWidth=box.width*w;
 const rawHeight=box.height*h;
 const width=Math.min(rawWidth,viewport.width);
 const height=Math.min(rawHeight,viewport.height);
 const left=Math.min(Math.max(0,rawLeft),Math.max(0,viewport.width-width));
 const top=Math.min(Math.max(0,rawTop),Math.max(0,viewport.height-height));
 el.style.setProperty('left',left+'px','important');
 el.style.setProperty('top',top+'px','important');
 el.style.setProperty('width',width+'px','important');
 el.style.setProperty('height',height+'px','important');
 el.style.setProperty('right','auto','important');
 el.style.setProperty('bottom','auto','important');
}

function mapControlsToArtwork(host,imgW,imgH,portrait){
 const rect=host.getBoundingClientRect();
 const artAspect=imgW/imgH;
 const viewportAspect=rect.width/rect.height;
 const heightScale=rect.height/imgH;
 const maxWidthScale=(rect.width*(portrait?1:1.06))/imgW;
 // Preserve the locked mountain shape. Portrait must never crop the left/right
 // edges because the four subject cards and bottom navigation are part of the artwork.
 // Landscape may use at most 3% crop on each side; scenic fill absorbs spare space.
 const scale=artAspect>viewportAspect?Math.min(heightScale,maxWidthScale):heightScale;
 const box={
   width:imgW*scale,
   height:imgH*scale,
   left:(rect.width-imgW*scale)/2,
   top:rect.height-imgH*scale
 };
 host.dataset.bc15Fit=artAspect>viewportAspect?'safe-width':'safe-height';

 const tabletPortrait=portrait&&rect.width>700;
 const layout=portrait?{
   subjects:[.044,.728,.912,.135],
   journey:[.052,.620,.896,.098],
   nav:[.025,.900,.95,.092],
   adult:[.855,.030,.105,.070],
   liveCopy:tabletPortrait?[.03,.138,.58,.102]:[.00,.138,.66,.105],
   liveNext:tabletPortrait?[.26,.665,.48,.026]:[.22,.665,.56,.026]
 }:{
   subjects:[.353,.692,.611,.242],
   journey:[.028,.747,.304,.161],
   nav:[.711,.023,.272,.135],
   adult:[.025,.020,.205,.155],
   liveCopy:[.115,.172,.225,.062],
   liveNext:[.073,.836,.235,.040]
 };
 const viewport={width:rect.width,height:rect.height};
 place(host.querySelector('.bc14-subjects'),box,layout.subjects,viewport);
 place(host.querySelector('.bc12-journey'),box,layout.journey,viewport);
 place(host.querySelector('.bc12-nav'),box,layout.nav,viewport);
 place(host.querySelector('.bc12-adult-entry'),box,layout.adult,viewport);
 place(host.querySelector('.bc15-live-copy'),box,layout.liveCopy,viewport);
 place(host.querySelector('.bc15-live-next'),box,layout.liveNext,viewport);
 host.style.setProperty('--bc15-art-left',box.left+'px');
 host.style.setProperty('--bc15-art-top',box.top+'px');
 host.style.setProperty('--bc15-art-width',box.width+'px');
 host.style.setProperty('--bc15-art-height',box.height+'px');
}

function syncLiveCopy(host){
 let live=host.querySelector('.bc15-live-copy');
 if(!live){
   live=document.createElement('div');
   live.className='bc15-live-copy';
   live.innerHTML='<div class="bc15-live-greeting"></div><div class="bc15-live-intro"></div>';
   host.appendChild(live);
 }
 const title=host.querySelector('.bc12-heading h1')?.textContent?.trim()||'Hei, eventyrer!';
 const intro='Klar for et nytt eventyr?';
 live.querySelector('.bc15-live-greeting').textContent=title;
 live.querySelector('.bc15-live-intro').textContent=intro;
 live.querySelector('.bc15-live-intro').setAttribute('aria-hidden','true');
 live.setAttribute('aria-label',title+' '+intro);

 let next=host.querySelector('.bc15-live-next');
 if(!next){
   next=document.createElement('div');
   next.className='bc15-live-next';
   host.appendChild(next);
 }
 const place=host.querySelector('[data-camp-next]')?.textContent?.trim()||'Bokskogen';
 const rawType=host.querySelector('[data-camp-next-type]')?.textContent?.trim()||'Neste stopp';
 const active=/pågående/i.test(rawType);
 const type=active?'Pågående':'Neste stopp';
 next.dataset.state=active?'active':'next';
 next.textContent=type+' · '+place;
 next.setAttribute('aria-label',rawType+': '+place);
}

function clearMappedControls(host){
 ['.bc14-subjects','.bc12-journey','.bc12-nav','.bc12-adult-entry'].forEach(sel=>{
   const el=host.querySelector(sel);if(!el)return;
   ['left','top','width','height','right','bottom'].forEach(p=>el.style.removeProperty(p));
 });
 host.style.removeProperty('background-size');
 host.style.removeProperty('background-position');
 ['--bc15-art-left','--bc15-art-top','--bc15-art-width','--bc15-art-height'].forEach(p=>host.style.removeProperty(p));
}

async function activate(){
 const host=document.querySelector('#home-screen .bc12');
 if(!host)return false;
 const youngBand=!!document.querySelector('.grade-band-young');
 if(!youngBand){
   host.classList.remove('bc15-capable','bc15-locked-home','bc15-pending','bc15-fallback');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.dataset.bc15Asset='ineligible';
   host.querySelectorAll('.bc15-live-copy,.bc15-live-next').forEach(el=>el.remove());
   return false;
 }
 host.classList.add('bc15-capable');
 const detachedView=host.dataset.bc13View && host.dataset.bc13View!=='home';
 if((host.dataset.mode && host.dataset.mode!=='home') || detachedView){
   host.classList.remove('bc15-locked-home','bc15-pending');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.dataset.bc15Asset='inactive';
   host.querySelectorAll('.bc15-live-copy,.bc15-live-next').forEach(el=>el.remove());
   return false;
 }
 const portrait=isPortrait();
 const master=portrait?PHONE_MASTER:TABLET_MASTER;
 host.classList.add('bc15-pending');
 host.dataset.bc15Asset='loading';
 try{
   const image=await decoded(master);
   activeMasterSrc=image.src;
   host.style.setProperty('--bc15-home-art','url("'+image.src+'")');
   host.classList.add('bc15-locked-home');
   host.classList.remove('bc15-pending','bc15-fallback');
   host.dataset.bc15Asset=portrait?'phone-ready':'tablet-ready';
   host.dataset.bc15Master=portrait?'portrait':'landscape';
   syncLiveCopy(host);
   mapControlsToArtwork(host,image.width,image.height,portrait);

   const trollNav=host.querySelector('.bc12-nav [data-camp="wardrobe"]');
   if(trollNav){
     trollNav.setAttribute('aria-label','Mine troll');
     if(trollNav.dataset.bc15TrollBound!=='true'){
       trollNav.dataset.bc15TrollBound='true';
       trollNav.addEventListener('click',e=>{
         if(!host.classList.contains('bc15-locked-home'))return;
         e.preventDefault();
         e.stopImmediatePropagation();
         openTrollDialog();
       },true);
     }
   }
   const adult=host.querySelector('[data-camp-adult]');
   if(adult)adult.setAttribute('aria-label','Hold inne for voksenområdet');
   return true;
 }catch(err){
   host.classList.remove('bc15-locked-home','bc15-pending');
   host.classList.add('bc15-fallback');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.dataset.bc15Asset='missing';
   host.querySelectorAll('.bc15-live-copy,.bc15-live-next').forEach(el=>el.remove());
   console.warn('[Læria Home v15] Locked master not activated.',err);
   return false;
 }
}

let liveSyncQueued=false;
function queueLiveSync(host){
 if(liveSyncQueued)return;
 liveSyncQueued=true;
 requestAnimationFrame(()=>{
   liveSyncQueued=false;
   if(host?.classList.contains('bc15-locked-home'))syncLiveCopy(host);
 });
}
function schedule(){requestAnimationFrame(()=>activate())}
if(typeof window.renderAll==='function'&&!window.__LARIA_HOME_V15_RENDERALL_WRAPPED){
 const priorRenderAll=window.renderAll;
 window.renderAll=function(){
   const result=priorRenderAll.apply(this,arguments);
   const host=document.querySelector('#home-screen .bc12');
   if(host?.classList.contains('bc15-locked-home'))queueLiveSync(host);
   return result;
 };
 window.__LARIA_HOME_V15_RENDERALL_WRAPPED=true;
}
document.addEventListener('DOMContentLoaded',schedule,{once:true});
const observer=new MutationObserver(mutations=>{
 const host=document.querySelector('#home-screen .bc12');
 if(!host)return;
 const firstMount=host.dataset.bc15Observed!=='true';
 const stateChanged=mutations.some(m=>m.type==='attributes'&&m.target===host&&(m.attributeName==='data-mode'||m.attributeName==='data-bc13-view'));
 const contentChanged=mutations.some(m=>{
   if(m.type!=='childList'&&m.type!=='characterData')return false;
   const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
   return !el?.closest?.('.bc15-live-copy,.bc15-live-next');
 });
 if(firstMount)host.dataset.bc15Observed='true';
 if(firstMount||stateChanged)activate();
 else if(contentChanged)queueLiveSync(host);
});
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-mode','data-bc13-view']});
const portraitMq=matchMedia('(orientation:portrait)');
portraitMq.addEventListener?.('change',activate);
let resizeTimer=0;
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(activate,80)},{passive:true});
})();
