(()=>{
'use strict';
const root=()=>document.querySelector('#flytSetupV2');
const back=()=>document.querySelector('#flytSetupV2Back');
const title=()=>document.querySelector('#flytSetupV2Title');
const state=()=>window.FlytBridge?.getState?.()||null;
function firstStep(){return (title()?.textContent||'').includes('Hva er viktig for dere?')}
function sync(){const r=root(),b=back(),s=state();if(!r||!b)return;const shouldShow=!r.classList.contains('hidden')&&firstStep()&&!!s?.setupDone;if(shouldShow){if(b.style.visibility!=='visible')b.style.visibility='visible';b.textContent='Tilbake';b.disabled=false}else if(firstStep()&&!s?.setupDone){if(b.style.visibility!=='hidden')b.style.visibility='hidden'}}
document.addEventListener('click',e=>{const b=e.target.closest?.('#flytSetupV2Back');if(!b||!firstStep()||!state()?.setupDone)return;e.preventDefault();e.stopImmediatePropagation();window.FlytSetupV2?.close?.()},true);
function install(){sync();const r=root();if(r){const obs=new MutationObserver(()=>queueMicrotask(sync));obs.observe(r,{attributes:true,childList:true,subtree:true});}let n=0;const timer=setInterval(()=>{sync();if(root()&&back()&&++n>20)clearInterval(timer)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytSetupBackUI={sync,version:'20260825-1824'};
})();