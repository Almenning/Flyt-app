(()=>{
'use strict';
const VERSION='20260913-modalscrolllock4';
let locked=false,lockedScrollTop=0,scheduled=false;
const $=s=>document.querySelector(s);
function content(){return $('#content')}
function visible(element){if(!element||element.hidden||element.classList.contains('hidden'))return false;const style=getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden'&&element.getClientRects().length>0}
function modal(){return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find(visible)||null}
function lock(){if(locked)return;const c=content();if(!c)return;lockedScrollTop=c.scrollTop;locked=true;c.classList.add('flytModalScrollLockedContent');c.style.overflow='hidden';c.style.overscrollBehavior='none'}
function unlock(){if(!locked)return;const c=content();locked=false;if(!c)return;c.classList.remove('flytModalScrollLockedContent');c.style.overflow='';c.style.overscrollBehavior='';const restore=()=>{if(!modal())c.scrollTop=lockedScrollTop};restore();requestAnimationFrame(()=>{restore();requestAnimationFrame(restore)})}
function sync(){scheduled=false;modal()?lock():unlock()}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(sync)}
function install(){if($('#flytModalScrollLockStyles'))return;const style=document.createElement('style');style.id='flytModalScrollLockStyles';style.textContent='#content.flytModalScrollLockedContent{overflow:hidden!important;overscroll-behavior:none!important}[role=dialog][aria-modal=true]{overscroll-behavior:contain}.flytSettingsPanel{height:92dvh!important;max-height:92dvh!important;display:flex!important;flex-direction:column!important}.flytSettingsScroll{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}.flytMenuSheet,.homeStatusSheet{touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}';document.head.appendChild(style);new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-modal','role','class','hidden','style']});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytModalScrollLock={version:VERSION,sync,lock,unlock};
})();
