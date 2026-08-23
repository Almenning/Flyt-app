(()=>{
'use strict';
function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'}
function rescue(){const app=document.querySelector('.app'),gate=document.querySelector('#betaGate'),legacy=document.querySelector('#login');if(visible(app)||visible(gate)||visible(legacy))return;const box=document.createElement('div');box.id='flytRescue';box.className='login';box.innerHTML='<div class="loginbox"><div class="logo">fl<b>y</b>t</div><div class="ey">Oppstart</div><h1 style="font:500 30px Georgia">Flyt fikk ikke startet</h1><p class="sub">Ingen data er slettet. Last siden på nytt for å prøve igjen.</p><button id="flytReload" class="primary full">Last inn Flyt på nytt</button></div>';document.body.appendChild(box);document.querySelector('#flytReload').onclick=()=>location.reload()}
window.addEventListener('DOMContentLoaded',()=>setTimeout(rescue,5000));
window.addEventListener('error',()=>setTimeout(rescue,50));
window.addEventListener('unhandledrejection',()=>setTimeout(rescue,50));
})();