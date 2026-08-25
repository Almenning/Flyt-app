(()=>{
'use strict';
let lastActionAt=0,lastAction='';
function now(){return Date.now()}
function dedupe(action){const t=now();if(lastAction===action&&t-lastActionAt<700)return true;lastAction=action;lastActionAt=t;return false}
function setupHidden(){return document.querySelector('#setup')?.classList.contains('hidden')!==false}
function ensurePlanned(done){if(window.FlytPlannedUI?.openForm){done();return}if(!document.querySelector('script[data-flyt-task-actions-planned]')){const s=document.createElement('script');s.src='./planned-ui.js?v=20260825-0636';s.defer=true;s.dataset.flytTaskActionsPlanned='1';document.head.appendChild(s)}let n=0;const timer=setInterval(()=>{if(window.FlytPlannedUI?.openForm){clearInterval(timer);done()}else if(++n>40)clearInterval(timer)},50)}
function ensureSetup(done){if(window.FlytSetupNavGuard?.openSetup){done();return}if(!document.querySelector('script[data-flyt-task-actions-setup]')){const s=document.createElement('script');s.src='./setup-nav-guard.js?v=20260825-0832';s.defer=true;s.dataset.flytTaskActionsSetup='1';document.head.appendChild(s)}let n=0;const timer=setInterval(()=>{if(window.FlytSetupNavGuard?.openSetup){clearInterval(timer);done()}else if(++n>40)clearInterval(timer)},50)}
function openPlanned(){ensurePlanned(()=>{document.activeElement?.blur?.();window.FlytPlannedUI.openForm()})}
function openSetup(){ensureSetup(()=>{document.activeElement?.blur?.();window.FlytSetupNavGuard.openSetup(1)})}
function getActionTarget(e){const el=e.target?.closest?.('#openPlannedForm,[data-open-new-setup],[data-open-setup]');if(!el||!setupHidden())return null;const content=document.querySelector('#content');if(content&&!content.contains(el))return null;return el}
function handle(e){const el=getActionTarget(e);if(!el)return;const action=el.id==='openPlannedForm'?'planned':'setup';if(dedupe(action)){e.preventDefault();e.stopImmediatePropagation();return}e.preventDefault();e.stopImmediatePropagation();if(action==='planned')openPlanned();else openSetup()}
for(const type of ['pointerup','touchend','click'])window.addEventListener(type,handle,{capture:true,passive:false});
function harden(){document.querySelectorAll('#openPlannedForm,[data-open-new-setup],[data-open-setup]').forEach(el=>{el.style.pointerEvents='auto';el.style.touchAction='manipulation';el.style.position=el.style.position||'relative';el.style.zIndex='2'})}
const obs=new MutationObserver(harden);window.addEventListener('DOMContentLoaded',()=>{const c=document.querySelector('#content');if(c){obs.observe(c,{childList:true,subtree:true});harden()}});
window.FlytTaskActionsGuard={harden,version:'20260825-0848'};
})();