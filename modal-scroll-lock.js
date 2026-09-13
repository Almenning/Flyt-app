(()=>{
'use strict';
const VERSION='20260913-modalscrolllock2';
let locked=false,lockedScrollTop=0,scheduled=false;
const $=s=>document.querySelector(s);
function content(){return $('#content')}
function modal(){return document.querySelector('[role="dialog"][aria-modal="true"]')}
function lock(){if(locked)return;const c=content();if(!c)return;lockedScrollTop=c.scrollTop;locked=true;document.documentElement.classList.add('flytModalScrollLocked');document.body.classList.add('flytModalScrollLocked');c.classList.add('flytModalScrollLockedContent');c.style.overflow='hidden';c.style.overscrollBehavior='none'}
function unlock(){if(!locked)return;const c=content();locked=false;document.documentElement.classList.remove('flytModalScrollLocked');document.body.classList.remove('flytModalScrollLocked');if(!c)return;c.classList.remove('flytModalScrollLockedContent');c.style.overflow='';c.style.overscrollBehavior='';const restore=()=>{if(!modal())c.scrollTop=lockedScrollTop};restore();requestAnimationFrame(()=>{restore();requestAnimationFrame(restore)})}
function sync(){scheduled=false;modal()?lock():unlock()}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(sync)}
document.addEventListener('touchmove',event=>{const sheet=modal();if(!sheet)return;const target=event.target;if(!(target instanceof Element)||!sheet.contains(target))event.preventDefault()},{capture:true,passive:false});
function install(){if($('#flytModalScrollLockStyles'))return;const style=document.createElement('style');style.id='flytModalScrollLockStyles';style.textContent='html.flytModalScrollLocked,body.flytModalScrollLocked{overscroll-behavior:none!important;overflow:hidden!important;height:100%!important}#content.flytModalScrollLockedContent{touch-action:pan-x!important;overflow:hidden!important;overscroll-behavior:none!important}[role=dialog][aria-modal=true]{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}';document.head.appendChild(style);new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-modal','role','class']});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytModalScrollLock={version:VERSION,sync,lock,unlock};
})();
