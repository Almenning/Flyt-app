(()=>{
'use strict';
const PREFIX='[Flyt reorder trace]';
const SHOW_PANEL=new URLSearchParams(location.search).has('reorderTrace');
const order=value=>{try{return structuredClone(value?.taskOrder||{})}catch(error){return value?.taskOrder||{}}};
const now=()=>new Date().toISOString();
let panel=null,panelLines=[],activeCategory='';
function categoryOrder(value){const all=order(value);if(activeCategory)return{[activeCategory]:all[activeCategory]||[]};return all}
function compact(value){try{return JSON.stringify(value)}catch(error){return String(value)}}
function drawPanel(){if(!SHOW_PANEL)return;if(!panel){panel=document.createElement('pre');panel.id='flytReorderTracePanel';panel.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:5000;max-height:42dvh;overflow:auto;margin:0;padding:10px;border:2px solid #b95639;border-radius:12px;background:#fffdfbf5;color:#452f29;font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;box-shadow:0 12px 30px #48221444';document.body.appendChild(panel)}panel.textContent=['REORDER TESTTRACE'+(activeCategory?' · '+activeCategory:''),...panelLines].join('\n')}
const emit=(phase,extra={})=>{const event={phase,at:now(),currentOrder:order(window.FlytBridge?.getState?.()),...extra};console.info(PREFIX,event);if(SHOW_PANEL){const nextOrder=extra.nextOrder?categoryOrder(extra.nextOrder):null;panelLines.push(phase+'\n  nå: '+compact(categoryOrder(event.currentOrder))+(nextOrder?'\n  neste: '+compact(nextOrder):''));panelLines=panelLines.slice(-8);drawPanel()}};
let installed=false,last='',dragging=false;
function snapshot(){try{return JSON.stringify(order(window.FlytBridge?.getState?.()))}catch(error){return ''}}
function install(){
  if(installed||!window.FlytBridge?.setState)return false;
  installed=true;
  const bridge=window.FlytBridge,originalSetState=bridge.setState.bind(bridge);
  bridge.setState=next=>{
    emit('before-setState',{nextOrder:order(next)});
    const result=originalSetState(next);
    emit('after-setState');
    queueMicrotask(()=>emit('after-render-microtask'));
    return result;
  };
  if(window.FlytSync?.queueSave){
    const originalQueueSave=window.FlytSync.queueSave.bind(window.FlytSync);
    window.FlytSync.queueSave=(...args)=>{emit('before-queueSave');const result=originalQueueSave(...args);emit('after-queueSave');return result};
  }
  document.addEventListener('pointerdown',event=>{
    const handle=event.target?.closest?.('[data-task-reorder-handle]');
    if(!handle)return;
    activeCategory=handle.closest?.('[data-task-reorder-row]')?.dataset?.taskReorderCategory||'';
    panelLines=[];dragging=true;emit('drag-start');
  },true);
  document.addEventListener('pointerup',()=>{
    if(!dragging)return;
    dragging=false;emit('drop');
    setTimeout(()=>emit('after-drop-1s'),1000);
    setTimeout(()=>emit('after-drop-5s'),5000);
  },true);
  document.addEventListener('pointercancel',()=>{dragging=false},true);
  last=snapshot();
  setInterval(()=>{const next=snapshot();if(next!==last){emit('observed-order-change',{previousOrder:last});last=next}},250);
  emit('installed');
  return true;
}
if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},100)}
})();
