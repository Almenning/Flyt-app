/* Læria Hjem v15 — locked Kjøsnesfjorden / Grovanova masters.
   Approved artwork is stored as immutable WebP assets. The mountain is never regenerated. */
(function(){
'use strict';

const TABLET_MASTER='./assets/home-v15/kjosnes-home-tablet.webp?v=20261024-locked1';
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
 if(art&&activeMasterSrc)art.style.backgroundImage='url("'+activeMasterSrc+'")';
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
 const rawRight=rawLeft+box.width*w;
 const rawBottom=rawTop+box.height*h;
 const left=Math.max(0,rawLeft);
 const top=Math.max(0,rawTop);
 const right=Math.min(viewport.width,rawRight);
 const bottom=Math.min(viewport.height,rawBottom);
 el.style.setProperty('left',left+'px','important');
 el.style.setProperty('top',top+'px','important');
 el.style.setProperty('width',Math.max(0,right-left)+'px','important');
 el.style.setProperty('height',Math.max(0,bottom-top)+'px','important');
 el.style.setProperty('right','auto','important');
 el.style.setProperty('bottom','auto','important');
}

function mapControlsToArtwork(host,imgW,imgH,portrait){
 const rect=host.getBoundingClientRect();
 const fit=(portrait&&rect.width>700)?'contain':'cover';
 const scale=fit==='contain'
   ?Math.min(rect.width/imgW,rect.height/imgH)
   :Math.max(rect.width/imgW,rect.height/imgH);
 const box={
   width:imgW*scale,
   height:imgH*scale,
   left:(rect.width-imgW*scale)/2,
   top:(rect.height-imgH*scale)/2
 };
 host.dataset.bc15Fit=fit;
 host.style.setProperty('background-size',fit,'important');
 host.style.setProperty('background-position','center center','important');

 const layout=portrait?{
   subjects:[.044,.728,.912,.135],
   journey:[.052,.620,.896,.098],
   nav:[.025,.900,.95,.092],
   adult:[.855,.030,.105,.070]
 }:{
   subjects:[.353,.692,.611,.242],
   journey:[.028,.747,.304,.161],
   nav:[.711,.023,.272,.135],
   adult:[.946,.018,.045,.075]
 };
 const viewport={width:rect.width,height:rect.height};
 place(host.querySelector('.bc14-subjects'),box,layout.subjects,viewport);
 place(host.querySelector('.bc12-journey'),box,layout.journey,viewport);
 place(host.querySelector('.bc12-nav'),box,layout.nav,viewport);
 place(host.querySelector('.bc12-adult-entry'),box,layout.adult,viewport);
 host.style.setProperty('--bc15-art-left',box.left+'px');
 host.style.setProperty('--bc15-art-top',box.top+'px');
 host.style.setProperty('--bc15-art-width',box.width+'px');
 host.style.setProperty('--bc15-art-height',box.height+'px');
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
 const detachedView=host.dataset.bc13View && host.dataset.bc13View!=='home';
 if((host.dataset.mode && host.dataset.mode!=='home') || detachedView){
   host.classList.remove('bc15-locked-home');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.dataset.bc15Asset='inactive';
   return false;
 }
 const portrait=isPortrait();
 const master=portrait?PHONE_MASTER:TABLET_MASTER;
 try{
   const image=await decoded(master);
   activeMasterSrc=image.src;
   host.style.setProperty('--bc15-home-art','url("'+image.src+'")');
   host.classList.add('bc15-locked-home');
   host.dataset.bc15Asset=portrait?'phone-ready':'tablet-ready';
   host.dataset.bc15Master=portrait?'portrait':'landscape';
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
   host.classList.remove('bc15-locked-home');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.dataset.bc15Asset='missing';
   console.warn('[Læria Home v15] Locked master not activated.',err);
   return false;
 }
}

function schedule(){requestAnimationFrame(()=>activate())}
document.addEventListener('DOMContentLoaded',schedule,{once:true});
const observer=new MutationObserver(mutations=>{
 const host=document.querySelector('#home-screen .bc12');
 if(!host)return;
 const firstMount=host.dataset.bc15Observed!=='true';
 const stateChanged=mutations.some(m=>m.type==='attributes'&&m.target===host&&(m.attributeName==='data-mode'||m.attributeName==='data-bc13-view'));
 if(firstMount)host.dataset.bc15Observed='true';
 if(firstMount||stateChanged)activate();
});
observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-mode','data-bc13-view']});
const portraitMq=matchMedia('(orientation:portrait)');
portraitMq.addEventListener?.('change',activate);
let resizeTimer=0;
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(activate,80)},{passive:true});
})();
