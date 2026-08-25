(()=>{
'use strict';
let handledPointerAt=0;
function setupOpen(){const el=document.querySelector('#setup');return !!el&&!el.classList.contains('hidden')}
function step(){const title=(document.querySelector('#setupTitle')?.textContent||'').trim();if(title.includes('Hva er viktig'))return 0;if(title.includes('Bygg husholdningen'))return 1;if(title.includes('Slik blir Flyt'))return 2;const body=(document.querySelector('#setupBody')?.textContent||'');if(body.includes('Hva skal Flyt hjelpe'))return 0;if(body.includes('Hva gjør dere'))return 1;if(body.includes('Dette er deres oppsett')||body.includes('Dette er deres uke'))return 2;return 0}
function finish(){const b=window.FlytBridge,s=b?.getState?.();if(s)b.setState({...s,setupDone:true});document.querySelector('#setup')?.classList.add('hidden');window.FlytSync?.queueSave?.();const view=b?.getState?.()?.view;if(view==='tasks')window.FlytTasksUI?.render?.({resetScroll:true});else window.FlytHomeUI?.render?.({resetScroll:true})}
function go(dir){if(!setupOpen())return false;const api=window.FlytTasksUI;if(!api?.openSetup)return false;const n=step();if(dir<0){if(n>0)api.openSetup(n-1);return true}if(n<2){api.openSetup(n+1);return true}finish();return true}
function target(e){const el=e.target?.closest?.('#setupNext,#setupBack');if(!el||!setupOpen())return null;return el}
window.addEventListener('pointerup',e=>{const el=target(e);if(!el)return;const dir=el.id==='setupBack'?-1:1;if(!go(dir))return;handledPointerAt=Date.now();e.preventDefault();e.stopImmediatePropagation()},true);
window.addEventListener('click',e=>{const el=target(e);if(!el)return;if(Date.now()-handledPointerAt<700){e.preventDefault();e.stopImmediatePropagation();return}const dir=el.id==='setupBack'?-1:1;if(!go(dir))return;e.preventDefault();e.stopImmediatePropagation()},true);
window.FlytSetupNavGuard={go,version:'20260825-0712'};
})();