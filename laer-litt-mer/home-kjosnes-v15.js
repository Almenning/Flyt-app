/* Læria Hjem v15 — locked Kjøsnesfjorden / Grovanova masters.
   Approved artwork is stored as immutable WebP assets. The mountain is never regenerated. */
(function(){
'use strict';

const TABLET_MASTER='./assets/home-v15/kjosnes-home-tablet.webp?v=20261024-locked1';
const PHONE_MASTER='./assets/home-v15/kjosnes-home-phone.webp?v=20261024-locked1';
let activeMasterSrc='';

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
function isPhone(){return matchMedia('(max-width:700px) and (orientation:portrait)').matches}

function decoded(src){
 return new Promise((resolve,reject)=>{
   const img=new Image();
   img.onload=()=>resolve(src);
   img.onerror=()=>reject(new Error('Could not decode Læria Home master'));
   img.src=src;
 });
}

async function activate(){
 const host=document.querySelector('#home-screen .bc12');
 if(!host)return false;
 const detachedView=host.dataset.bc13View && host.dataset.bc13View!=='home';
 if((host.dataset.mode && host.dataset.mode!=='home') || detachedView){
   host.classList.remove('bc15-locked-home');
   host.style.removeProperty('--bc15-home-art');
   host.dataset.bc15Asset='inactive';
   return false;
 }
 const phone=isPhone();
 try{
   const src=await decoded(phone?PHONE_MASTER:TABLET_MASTER);
   activeMasterSrc=src;
   host.style.setProperty('--bc15-home-art','url("'+src+'")');
   host.classList.add('bc15-locked-home');
   host.dataset.bc15Asset=phone?'phone-ready':'tablet-ready';

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
const mq=matchMedia('(max-width:700px) and (orientation:portrait)');
mq.addEventListener?.('change',activate);
})();
