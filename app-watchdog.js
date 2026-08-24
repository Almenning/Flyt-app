(()=>{
'use strict';
function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'}
function rescue(){const app=document.querySelector('.app'),gate=document.querySelector('#betaGate'),legacy=document.querySelector('#login');if(visible(app)||visible(gate)||visible(legacy))return;const box=document.createElement('div');box.id='flytRescue';box.className='login';box.innerHTML='<div class="loginbox"><div class="logo">fl<b>y</b>t</div><div class="ey">Oppstart</div><h1 style="font:500 30px Georgia">Flyt fikk ikke startet</h1><p class="sub">Ingen data er slettet. Last siden på nytt for å prøve igjen.</p><button id="flytReload" class="primary full">Last inn Flyt på nytt</button></div>';document.body.appendChild(box);document.querySelector('#flytReload').onclick=()=>location.reload()}
function restoreOwnedView(view){if(view==='home'&&window.FlytHomeUI?.render){queueMicrotask(()=>window.FlytHomeUI.render());return}if(view==='tasks'&&window.FlytTasksUI?.render){queueMicrotask(()=>{window.FlytTasksUI.render();window.FlytPlannedUI?.paint?.();window.FlytTasksDayCompleted?.augment?.()});return}if(view==='us'&&window.FlytOss?.render){queueMicrotask(()=>window.FlytOss.render({refresh:false}))}}
function installRenderGuard(){const b=window.FlytBridge;if(!b||b.__stabilityWrapped)return false;const original=b.setState?.bind(b);if(!original)return false;b.setState=next=>{original(next);restoreOwnedView(next?.view)};b.__stabilityWrapped=true;restoreOwnedView(b.getState?.()?.view);return true}
function keepGuardAlive(){if(installRenderGuard())return;let tries=0;const timer=setInterval(()=>{tries++;if(installRenderGuard()||tries>40)clearInterval(timer)},100)}
function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'1');document.head.appendChild(s)}
function loadPlanned(){loadScript('./planned-ui.js?v=20260824-0945','flyt-planned')}
function loadDayCompleted(){loadScript('./tasks-day-completed-ui.js?v=20260824-1350','flyt-day-completed')}
window.addEventListener('DOMContentLoaded',()=>{loadPlanned();loadDayCompleted();keepGuardAlive();setTimeout(rescue,5000)});
window.addEventListener('error',()=>setTimeout(rescue,50));
window.addEventListener('unhandledrejection',()=>setTimeout(rescue,50));
})();
