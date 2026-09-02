(()=>{
'use strict';
const TARGETS=new Set(['seen','rewards']);
function scrollTop(){const c=document.querySelector('#content');if(!c)return;c.style.overflowAnchor='none';const apply=()=>{c.scrollTop=0};apply();requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});setTimeout(()=>{apply();c.style.overflowAnchor=''},90)}
function onNavClick(e){const b=e.target?.closest?.('#nav button[data-view]');if(!b)return;const view=b.dataset.view,s=window.FlytBridge?.getState?.();if(!s||s.view!==view||!TARGETS.has(view))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();scrollTop()}
window.addEventListener('click',onNavClick,true);
window.FlytNavScrollTop={scrollTop,version:'20260829-0815'};
})();