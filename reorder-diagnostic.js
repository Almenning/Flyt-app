(()=>{
'use strict';
const PREFIX='[Flyt reorder trace]';
const order=value=>{try{return structuredClone(value?.taskOrder||{})}catch(error){return value?.taskOrder||{}}};
const now=()=>new Date().toISOString();
const emit=(phase,extra={})=>console.info(PREFIX,{phase,at:now(),currentOrder:order(window.FlytBridge?.getState?.()),...extra});
let installed=false,last='';
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
    if(event.target?.closest?.('[data-task-reorder-handle]'))emit('drag-start');
  },true);
  document.addEventListener('pointerup',event=>{
    if(!event.target?.closest?.('[data-task-reorder-handle]'))return;
    emit('drop');
    setTimeout(()=>emit('after-drop-1s'),1000);
    setTimeout(()=>emit('after-drop-5s'),5000);
  },true);
  last=snapshot();
  setInterval(()=>{const next=snapshot();if(next!==last){emit('observed-order-change',{previousOrder:last});last=next}},250);
  emit('installed');
  return true;
}
if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},100)}
})();
