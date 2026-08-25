(()=>{
'use strict';
let handledAt=0,handledKind='';
function setupEl(){return document.querySelector('#setup')}
function bodyEl(){return document.querySelector('#setupBody')}
function nextEl(){return document.querySelector('#setupNext')}
function backEl(){return document.querySelector('#setupBack')}
function setupOpen(){const el=setupEl();return !!el&&!el.classList.contains('hidden')}
function step(){const title=(document.querySelector('#setupTitle')?.textContent||'').trim();if(title.includes('Hva er viktig'))return 0;if(title.includes('Bygg husholdningen'))return 1;if(title.includes('Slik blir Flyt'))return 2;const body=(bodyEl()?.textContent||'');if(body.includes('Hva skal Flyt hjelpe'))return 0;if(body.includes('Hva gjør dere'))return 1;if(body.includes('Dette er deres oppsett')||body.includes('Dette er deres uke'))return 2;return 0}
function hardenButtons(){for(const b of [nextEl(),backEl()])if(b){b.disabled=false;b.style.pointerEvents='auto';b.style.touchAction='manipulation';b.style.position='relative';b.style.zIndex='3'}}
function settleSetupTop(){const setup=setupEl(),body=bodyEl();if(!setup||!body)return;setup.style.zIndex='120';setup.style.pointerEvents='auto';setup.style.touchAction='auto';body.style.overflowY='auto';body.style.webkitOverflowScrolling='touch';body.style.touchAction='pan-y';body.style.overscrollBehavior='contain';body.style.overflowAnchor='none';hardenButtons();const apply=()=>{body.scrollTop=0;setup.scrollTop=0};apply();requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});setTimeout(()=>{apply();body.style.overflowAnchor=''},120)}
function openSetup(startStep){const api=window.FlytTasksUI;if(!api?.openSetup)return false;document.activeElement?.blur?.();api.openSetup(startStep);setupEl()?.classList.remove('hidden');settleSetupTop();setTimeout(()=>{if(setupOpen()&&step()!==startStep)api.openSetup(startStep)},40);return true}
function finish(){const b=window.FlytBridge,s=b?.getState?.();if(s)b.setState({...s,setupDone:true});setupEl()?.classList.add('hidden');window.FlytSync?.queueSave?.();const view=b?.getState?.()?.view;if(view==='tasks')window.FlytTasksUI?.render?.({resetScroll:true});else window.FlytHomeUI?.render?.({resetScroll:true})}
function go(dir){if(!setupOpen())return false;const n=step();if(dir<0){if(n>0)openSetup(n-1);return true}if(n<2){openSetup(n+1);return true}finish();return true}
function isDuplicate(kind){const now=Date.now();if(handledKind===kind&&now-handledAt<650)return true;handledKind=kind;handledAt=now;return false}
function navTarget(e){const el=e.target?.closest?.('#setupNext,#setupBack');return el&&setupOpen()?el:null}
function openTarget(e){const el=e.target?.closest?.('#setupBtn,[data-open-setup],[data-open-new-setup]');return el&&!setupOpen()?el:null}
function handle(e){const open=openTarget(e);if(open){const kind='open:'+open.id+':'+(open.dataset.openNewSetup||open.dataset.openSetup||'');if(isDuplicate(kind)){e.preventDefault();e.stopImmediatePropagation();return}const start=open.id==='setupBtn'?0:1;if(!openSetup(start))return;e.preventDefault();e.stopImmediatePropagation();return}const nav=navTarget(e);if(!nav)return;const kind=nav.id;if(isDuplicate(kind)){e.preventDefault();e.stopImmediatePropagation();return}const dir=nav.id==='setupBack'?-1:1;if(!go(dir))return;e.preventDefault();e.stopImmediatePropagation()}
for(const type of ['pointerdown','touchstart','pointerup','click'])window.addEventListener(type,handle,{capture:true,passive:false});
function bindDirect(){hardenButtons();const n=nextEl(),b=backEl();if(n&&!n.__flytDirect){n.__flytDirect=true;n.addEventListener('click',e=>{if(!setupOpen())return;e.preventDefault();go(1)})}if(b&&!b.__flytDirect){b.__flytDirect=true;b.addEventListener('click',e=>{if(!setupOpen())return;e.preventDefault();go(-1)})}}
const obs=new MutationObserver(()=>{if(setupOpen()){settleSetupTop();bindDirect()}});
window.addEventListener('DOMContentLoaded',()=>{const setup=setupEl();if(setup)obs.observe(setup,{attributes:true,childList:true,subtree:true});bindDirect()});
window.addEventListener('pageshow',()=>{if(setupOpen()){settleSetupTop();bindDirect()}});
window.FlytSetupNavGuard={go,openSetup,version:'20260825-1249'};
})();