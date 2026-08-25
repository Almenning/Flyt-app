(()=>{
'use strict';
const root=()=>document.querySelector('#flytSetupV2');
const back=()=>document.querySelector('#flytSetupV2Back');
const title=()=>document.querySelector('#flytSetupV2Title');
function firstStep(){return (title()?.textContent||'').includes('Hva er viktig for dere?')}
function sync(){const r=root(),b=back();if(!r||!b)return;if(!r.classList.contains('hidden')&&firstStep()){b.style.visibility='visible';b.textContent='Tilbake';b.disabled=false}}
document.addEventListener('click',e=>{const b=e.target.closest?.('#flytSetupV2Back');if(!b||!firstStep())return;e.preventDefault();e.stopImmediatePropagation();window.FlytSetupV2?.close?.()},true);
function install(){sync();const r=root();if(r){const obs=new MutationObserver(()=>queueMicrotask(sync));obs.observe(r,{attributes:true,childList:true,subtree:true})}let n=0;const timer=setInterval(()=>{sync();if(root()&&back()&&++n>20)clearInterval(timer)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytSetupBackUI={sync,version:'20260825-2058'};
})();