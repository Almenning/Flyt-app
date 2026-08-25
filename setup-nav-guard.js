(()=>{
'use strict';
let handledPointerAt=0,handledOpenAt=0;
function setupEl(){return document.querySelector('#setup')}
function bodyEl(){return document.querySelector('#setupBody')}
function setupOpen(){const el=setupEl();return !!el&&!el.classList.contains('hidden')}
function step(){const title=(document.querySelector('#setupTitle')?.textContent||'').trim();if(title.includes('Hva er viktig'))return 0;if(title.includes('Bygg husholdningen'))return 1;if(title.includes('Slik blir Flyt'))return 2;const body=(bodyEl()?.textContent||'');if(body.includes('Hva skal Flyt hjelpe'))return 0;if(body.includes('Hva gjør dere'))return 1;if(body.includes('Dette er deres oppsett')||body.includes('Dette er deres uke'))return 2;return 0}
function settleSetupTop(){const setup=setupEl(),body=bodyEl();if(!setup||!body)return;setup.style.zIndex='120';setup.style.touchAction='auto';body.style.overflowY='auto';body.style.webkitOverflowScrolling='touch';body.style.overscrollBehavior='contain';body.style.overflowAnchor='none';const apply=()=>{body.scrollTop=0;setup.scrollTop=0};apply();requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});setTimeout(()=>{apply();body.style.overflowAnchor=''},120)}
function openSetup(startStep){const api=window.FlytTasksUI;if(!api?.openSetup)return false;const active=document.activeElement;if(active&&typeof active.blur==='function')active.blur();api.openSetup(startStep);const setup=setupEl();if(setup)setup.classList.remove('hidden');settleSetupTop();return true}
function finish(){const b=window.FlytBridge,s=b?.getState?.();if(s)b.setState({...s,setupDone:true});setupEl()?.classList.add('hidden');window.FlytSync?.queueSave?.();const view=b?.getState?.()?.view;if(view==='tasks')window.FlytTasksUI?.render?.({resetScroll:true});else window.FlytHomeUI?.render?.({resetScroll:true})}
function go(dir){if(!setupOpen())return false;const n=step();if(dir<0){if(n>0){openSetup(n-1);return true}return true}if(n<2){openSetup(n+1);return true}finish();return true}
function navTarget(e){const el=e.target?.closest?.('#setupNext,#setupBack');if(!el||!setupOpen())return null;return el}
function openTarget(e){const el=e.target?.closest?.('#setupBtn,[data-open-setup],[data-open-new-setup]');if(!el||setupOpen())return null;return el}
function handleOpen(e,el){const start=el.id==='setupBtn'?0:1;if(!openSetup(start))return false;handledOpenAt=Date.now();e.preventDefault();e.stopImmediatePropagation();return true}
window.addEventListener('pointerup',e=>{const open=openTarget(e);if(open){handleOpen(e,open);return}const el=navTarget(e);if(!el)return;const dir=el.id==='setupBack'?-1:1;if(!go(dir))return;handledPointerAt=Date.now();e.preventDefault();e.stopImmediatePropagation()},true);
window.addEventListener('click',e=>{const open=openTarget(e);if(open){if(Date.now()-handledOpenAt<700){e.preventDefault();e.stopImmediatePropagation();return}handleOpen(e,open);return}const el=navTarget(e);if(!el)return;if(Date.now()-handledPointerAt<700){e.preventDefault();e.stopImmediatePropagation();return}const dir=el.id==='setupBack'?-1:1;if(!go(dir))return;e.preventDefault();e.stopImmediatePropagation()},true);
window.addEventListener('pageshow',()=>{if(setupOpen())settleSetupTop()});
window.FlytSetupNavGuard={go,openSetup,version:'20260825-0832'};
})();