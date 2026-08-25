(()=>{
'use strict';
let installed=false;
function clearLegacySetupHandlers(){
  const setupBtn=document.querySelector('#setupBtn');
  const next=document.querySelector('#setupNext');
  const back=document.querySelector('#setupBack');
  const body=document.querySelector('#setupBody');
  if(setupBtn)setupBtn.onclick=null;
  if(next)next.onclick=null;
  if(back)back.onclick=null;
  if(body)body.onclick=null;
}
function normalizeSetup(){
  const setup=document.querySelector('#setup'),body=document.querySelector('#setupBody');
  if(!setup||!body||setup.classList.contains('hidden'))return;
  setup.style.zIndex='120';
  setup.style.pointerEvents='auto';
  body.style.overflowY='auto';
  body.style.webkitOverflowScrolling='touch';
  body.style.touchAction='pan-y';
  body.style.overscrollBehavior='contain';
}
function closeOrphanedOverlays(){
  const setup=document.querySelector('#setup');
  if(setup&&!setup.classList.contains('hidden')){
    document.querySelector('#flytGlobalModal')?.remove();
    document.querySelector('#plannedModal')?.remove();
    document.querySelector('#seenRequestModal')?.remove();
  }
}
function install(){
  if(installed)return;
  installed=true;
  clearLegacySetupHandlers();
  normalizeSetup();
  const setup=document.querySelector('#setup');
  if(setup)new MutationObserver(()=>{clearLegacySetupHandlers();normalizeSetup();closeOrphanedOverlays()}).observe(setup,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  window.addEventListener('pageshow',()=>{clearLegacySetupHandlers();normalizeSetup()});
  window.addEventListener('focus',()=>{clearLegacySetupHandlers();normalizeSetup()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytLegacyCleanup={install,normalizeSetup,version:'20260825-0838'};
})();