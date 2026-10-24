/* Læria Hjem v15 — opt-in activation of locked Kjøsnesfjorden masters. */
(function(){
'use strict';
const TABLET='./assets/home/kjosnes-home-tablet.webp?v=20261024-locked1';
const PHONE='./assets/home/kjosnes-home-phone.webp?v=20261024-locked1';

function preload(src){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(true);
    img.onerror=()=>resolve(false);
    img.src=src;
  });
}
function isPhone(){return matchMedia('(max-width:700px) and (orientation:portrait)').matches}
async function activate(){
  const host=document.querySelector('#home-screen .bc12');
  if(!host)return false;
  const ok=await preload(isPhone()?PHONE:TABLET);
  if(!ok){
    host.classList.remove('bc15-locked-home');
    host.dataset.bc15Asset='missing';
    return false;
  }
  host.classList.add('bc15-locked-home');
  host.dataset.bc15Asset='ready';

  // The approved direction replaces the fox identity on Home only.
  // Other screens retain their existing logic until their own redesign pass.
  const wardrobe=host.querySelector('.bc12-nav [data-camp="wardrobe"]');
  if(wardrobe){
    wardrobe.setAttribute('aria-label','Mine troll');
    wardrobe.lastChild && wardrobe.lastChild.nodeType===Node.TEXT_NODE && (wardrobe.lastChild.textContent='Mine troll');
  }
  const adult=host.querySelector('[data-camp-adult]');
  if(adult)adult.setAttribute('aria-label','Hold inne for voksenområdet');
  return true;
}

function schedule(){
  requestAnimationFrame(()=>{activate();});
}
document.addEventListener('DOMContentLoaded',schedule,{once:true});
document.addEventListener('laria:home-rendered',schedule);
const observer=new MutationObserver(()=>{
  const host=document.querySelector('#home-screen .bc12');
  if(host && !host.dataset.bc15Observed){
    host.dataset.bc15Observed='true';
    activate();
  }
});
observer.observe(document.documentElement,{subtree:true,childList:true});
matchMedia('(max-width:700px) and (orientation:portrait)').addEventListener?.('change',activate);
})();
