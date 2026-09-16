(()=>{
'use strict';
const VERSION='20260916-modalscrolllock6';
let locked=false,lockedScrollTop=0,scheduled=false,touchStartY=0;
const $=s=>document.querySelector(s);
function content(){return $('#content')}
function visible(element){if(!element||element.hidden||element.classList.contains('hidden'))return false;const style=getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden'&&element.getClientRects().length>0}
function modal(){const dialogs=[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(visible);return dialogs[dialogs.length-1]||null}
function lock(){if(locked)return;const c=content();if(!c)return;lockedScrollTop=c.scrollTop;locked=true;c.classList.add('flytModalScrollLockedContent');c.style.overflow='hidden';c.style.overscrollBehavior='none';document.documentElement.classList.add('flytModalPageLocked')}
function unlock(){if(!locked)return;const c=content();locked=false;document.documentElement.classList.remove('flytModalPageLocked');if(!c)return;c.classList.remove('flytModalScrollLockedContent');c.style.overflow='';c.style.overscrollBehavior='';const restore=()=>{if(!modal())c.scrollTop=lockedScrollTop};restore();requestAnimationFrame(()=>{restore();requestAnimationFrame(restore)})}
function sync(){scheduled=false;modal()?lock():unlock()}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(sync)}
function scrollParent(target,dialog){for(let node=target instanceof Element?target:null;node&&node!==dialog.parentElement;node=node.parentElement){const style=getComputedStyle(node);if(/(auto|scroll)/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+1)return node}return null}
function guardTouchStart(event){if(event.touches?.[0])touchStartY=event.touches[0].clientY}
function guardTouchMove(event){if(!locked)return;const dialog=modal();if(!dialog||!dialog.contains(event.target)){event.preventDefault();return}const scroller=scrollParent(event.target,dialog);if(!scroller){event.preventDefault();return}const touch=event.touches?.[0];if(!touch)return;const delta=touch.clientY-touchStartY;const atTop=scroller.scrollTop<=0,atBottom=scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-1;if((atTop&&delta>0)||(atBottom&&delta<0))event.preventDefault()}
function install(){if($('#flytModalScrollLockStyles'))return;const style=document.createElement('style');style.id='flytModalScrollLockStyles';style.textContent='html.flytModalPageLocked{overscroll-behavior:none}#content.flytModalScrollLockedContent{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important;-webkit-overflow-scrolling:auto!important}[role=dialog][aria-modal=true]{overscroll-behavior:contain}.flytSettingsPanel{height:92dvh!important;max-height:92dvh!important;display:flex!important;flex-direction:column!important}.flytSettingsScroll{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}.flytMenuSheet,.homeStatusSheet,.dailyCheckinPopup{touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}';document.head.appendChild(style);document.addEventListener('touchstart',guardTouchStart,{capture:true,passive:true});document.addEventListener('touchmove',guardTouchMove,{capture:true,passive:false});new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-modal','role','class','hidden','style']});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytModalScrollLock={version:VERSION,sync,lock,unlock};
})();
