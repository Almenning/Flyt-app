/* Læria Hjem v15 — locked Kjøsnesfjorden / Grovanova masters.
   The approved artwork is stored as small base64 text chunks so GitHub can keep
   the exact pixels without regenerating the mountain. */
(function(){
'use strict';

const TABLET_PARTS=[
 './assets/home-v15/tablet.b64.01',
 './assets/home-v15/tablet.b64.02',
 './assets/home-v15/tablet.b64.03',
 './assets/home-v15/tablet.b64.04',
 './assets/home-v15/tablet.b64.05',
 './assets/home-v15/tablet.b64.06',
 './assets/home-v15/tablet.b64.07'
];
const PHONE_PARTS=[
 './assets/home-v15/phone.b64',
 './assets/home-v15/phone.b64.02',
 './assets/home-v15/phone.b64.03',
 './assets/home-v15/phone.b64.04'
];

const cache=new Map();
function isPhone(){return matchMedia('(max-width:700px) and (orientation:portrait)').matches}

async function readMaster(parts,key){
 if(cache.has(key))return cache.get(key);
 const task=Promise.all(parts.map(async path=>{
   const res=await fetch(path,{cache:'force-cache'});
   if(!res.ok)throw new Error('Missing Læria Home master: '+path);
   return (await res.text()).trim();
 })).then(chunks=>{
   const b64=chunks.join('');
   if(!b64.startsWith('UklGR'))throw new Error('Invalid Læria Home WebP master: '+key);
   return 'data:image/webp;base64,'+b64;
 });
 cache.set(key,task);
 return task;
}

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
 const phone=isPhone();
 try{
   const src=await decoded(await readMaster(phone?PHONE_PARTS:TABLET_PARTS,phone?'phone':'tablet'));
   host.style.setProperty('--bc15-home-art','url("'+src+'")');
   host.classList.add('bc15-locked-home');
   host.dataset.bc15Asset=phone?'phone-ready':'tablet-ready';

   const trollNav=host.querySelector('.bc12-nav [data-camp="wardrobe"]');
   if(trollNav)trollNav.setAttribute('aria-label','Mine troll');
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
const observer=new MutationObserver(()=>{
 const host=document.querySelector('#home-screen .bc12');
 if(host && host.dataset.bc15Observed!=='true'){
   host.dataset.bc15Observed='true';
   activate();
 }
});
observer.observe(document.documentElement,{subtree:true,childList:true});
const mq=matchMedia('(max-width:700px) and (orientation:portrait)');
mq.addEventListener?.('change',activate);
})();
