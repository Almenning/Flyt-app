(()=>{
'use strict';
let restoring=false,observer=null,readyTimer=null;
const bridge=()=>window.FlytBridge;
const content=()=>document.querySelector('#content');
const ready=()=>!!window.FlytRecurrenceUI?.render;
function modernMarkup(){const c=content();return !!c?.querySelector('[data-period-nav]')&&!!c?.querySelector('[data-task-filter-bar]')}
function restore({resetScroll=false}={}){if(restoring||!ready())return false;const s=bridge()?.getState?.(),c=content();if(!s||!c||s.view!=='tasks')return false;if(modernMarkup())return true;restoring=true;queueMicrotask(()=>{try{window.FlytRecurrenceUI?.render?.({resetScroll})}finally{restoring=false}});return true}
function openTasks(resetScroll=true){const b=bridge(),s=b?.getState?.();if(!b||!s||!ready())return false;if(s.view!=='tasks')b.setState({...s,view:'tasks'});window.FlytRecurrenceUI.render({resetScroll});return true}
function intercept(e){const nav=e.target?.closest?.('#nav button[data-view="tasks"]');if(!nav||!ready())return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openTasks(true)}
function waitForModernView(){let tries=0;clearInterval(readyTimer);readyTimer=setInterval(()=>{tries++;if(ready()){restore({resetScroll:false});if(modernMarkup()||tries>80){clearInterval(readyTimer);readyTimer=null}}else if(tries>80){clearInterval(readyTimer);readyTimer=null}},100)}
function install(){window.addEventListener('click',intercept,true);const c=content();if(c){observer=new MutationObserver(()=>queueMicrotask(()=>restore({resetScroll:false})));observer.observe(c,{childList:true,subtree:true})}[0,80,180,400,900,1800,3000].forEach(ms=>setTimeout(()=>restore({resetScroll:false}),ms));waitForModernView();window.addEventListener('pageshow',()=>{setTimeout(()=>restore({resetScroll:false}),0);waitForModernView()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){setTimeout(()=>restore({resetScroll:false}),0);waitForModernView()}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytTasksViewGuard={restore,openTasks,version:'20260828-2205'};
})();