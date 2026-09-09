(()=>{
'use strict';
const TARGETS=new Set(['seen','rewards']);
const REORDER_STABILITY_VERSION='20260909-beta1';
function scrollTop(){const c=document.querySelector('#content');if(!c)return;c.style.overflowAnchor='none';const apply=()=>{c.scrollTop=0};apply();requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});setTimeout(()=>{apply();c.style.overflowAnchor=''},90)}
function onNavClick(e){const b=e.target?.closest?.('#nav button[data-view]');if(!b)return;const view=b.dataset.view,s=window.FlytBridge?.getState?.();if(!s||s.view!==view||!TARGETS.has(view))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();scrollTop()}
function loadTaskReorderStability(){if(window.FlytTaskReorderStability?.version===REORDER_STABILITY_VERSION){window.FlytTaskReorderStability.install?.();return}if(document.querySelector('script[data-flyt-task-reorder-stability]'))return;const script=document.createElement('script');script.src=`./task-reorder-stability.js?v=${REORDER_STABILITY_VERSION}`;script.setAttribute('data-flyt-task-reorder-stability','1');script.addEventListener('load',()=>window.FlytTaskReorderStability?.install?.(),{once:true});document.head.appendChild(script)}
window.addEventListener('click',onNavClick,true);
window.addEventListener('DOMContentLoaded',loadTaskReorderStability,{once:true});
window.addEventListener('pageshow',loadTaskReorderStability);
window.FlytNavScrollTop={scrollTop,loadTaskReorderStability,version:'20260909-beta1'};
})();
