(()=>{
'use strict';
const VERSION='20260930-shared-sheet3';
const bindings=new WeakMap();
function ensureStyles(){
  if(document.querySelector('#flytSharedSheetStyles'))return;
  const style=document.createElement('style');
  style.id='flytSharedSheetStyles';
  style.textContent=`
  .flytSheetLayer.flytSheetLayer{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;overscroll-behavior:none;background:#2f1e1a8c;backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
  .flytSheet.flytSheet{box-sizing:border-box;width:min(100%,470px);max-height:calc(100dvh - max(8px,env(safe-area-inset-top)));border-radius:28px 28px 0 0;background:linear-gradient(180deg,#fffaf6,#fff5ee);box-shadow:0 -20px 64px #35201a36;color:var(--ink);overflow:hidden}
  .flytSheet.flytSheet.flytSheetDark{background:#3b2824;color:#fff7f2}
  .flytSheetHandle.flytSheetHandle{position:relative;display:block;flex:0 0 42px;width:100%;height:42px;min-height:42px;margin:0;border:0;border-radius:0;background:transparent;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
  .flytSheetHandle.flytSheetHandle::before{content:"";position:absolute;left:50%;top:12px;width:38px;height:5px;transform:translateX(-50%);border-radius:999px;background:#d9bcb0}
  .flytSheetDark .flytSheetHandle::before{background:#9d7d73}
  .flytSheetScroll{min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}
  .flytSheet[data-flyt-sheet-dragging="1"]{will-change:transform;cursor:grabbing}
  @media(prefers-reduced-motion:reduce){.flytSheet[data-flyt-sheet-dragging="1"]{transition:none!important}}
  `;
  document.head.appendChild(style);
}
function handleFor(sheet,explicit){
  return explicit||sheet?.querySelector?.('[data-flyt-sheet-handle],.flytSheetHandle,.seenSheetHandle,.temptationDragHandle,.deadlineHandle,.goalSheetHandle');
}
function normalize(sheet,layer,handle){
  ensureStyles();
  sheet?.classList?.add('flytSheet');
  layer?.classList?.add('flytSheetLayer');
  if(handle){
    handle.classList?.add('flytSheetHandle');
    handle.setAttribute?.('data-flyt-sheet-handle','1');
    handle.setAttribute?.('aria-hidden','true');
  }
}
function restoreVisual(sheet,entry,animated=true){
  if(!sheet?.isConnected)return;
  sheet.removeAttribute('data-flyt-sheet-dragging');
  sheet.style.transition=animated&&!entry.reduceMotion?'transform 180ms cubic-bezier(.2,.75,.25,1)':'none';
  sheet.style.transform='translate3d(0,0,0)';
  clearTimeout(entry.resetTimer);
  entry.resetTimer=setTimeout(()=>{
    if(!sheet?.isConnected)return;
    sheet.style.transition=entry.original.transition;
    sheet.style.transform=entry.original.transform;
    sheet.style.willChange=entry.original.willChange;
  },animated&&!entry.reduceMotion?190:0);
}
function finishDismiss(sheet,entry){
  if(entry.dismissing||entry.canDismiss?.()===false){restoreVisual(sheet,entry,true);return}
  entry.dismissing=true;
  const active=document.activeElement;
  if(active&&sheet.contains(active)&&active.matches?.('input,textarea,select,[contenteditable="true"]'))active.blur();
  sheet.removeAttribute('data-flyt-sheet-dragging');
  if(entry.reduceMotion){entry.onDismiss?.();return}
  sheet.style.transition='transform 190ms cubic-bezier(.3,.7,.25,1)';
  sheet.style.transform=`translate3d(0,${Math.max(window.innerHeight||0,sheet.getBoundingClientRect().height)+40}px,0)`;
  clearTimeout(entry.resetTimer);
  entry.resetTimer=setTimeout(()=>entry.onDismiss?.(),195);
}
function bind(sheet,{layer=null,handle=null,onDismiss=null,canDismiss=null}={}){
  if(!sheet)return null;
  unbind(sheet);
  layer=layer||sheet.parentElement;
  handle=handleFor(sheet,handle);
  if(!handle)return null;
  normalize(sheet,layer,handle);
  const original={transform:sheet.style.transform,transition:sheet.style.transition,willChange:sheet.style.willChange};
  const entry={
    layer,handle,onDismiss,canDismiss:typeof canDismiss==='function'?canDismiss:()=>canDismiss!==false,
    original,active:null,resetTimer:0,dismissing:false,
    reduceMotion:!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  };
  const start=(source,id,x,y,time)=>{
    if(entry.active||entry.dismissing||entry.canDismiss()===false)return false;
    clearTimeout(entry.resetTimer);
    entry.active={source,id,startX:x,startY:y,lastY:y,lastTime:time,dy:0,velocity:0,lastDirection:'none',locked:false};
    return true;
  };
  const move=(source,id,x,y,time,event)=>{
    const a=entry.active;if(!a||a.source!==source||a.id!==id)return;
    const rawDy=y-a.startY,dx=x-a.startX;
    if(!a.locked){
      if(Math.abs(rawDy)<4&&Math.abs(dx)<4)return;
      if(Math.abs(dx)>Math.abs(rawDy)*1.35){entry.active=null;restoreVisual(sheet,entry,true);return}
      a.locked=true;
      sheet.setAttribute('data-flyt-sheet-dragging','1');
      sheet.style.transition='none';
      sheet.style.willChange='transform';
      const active=document.activeElement;if(active&&sheet.contains(active)&&active.matches?.('input,textarea,select,[contenteditable="true"]'))active.blur();
    }
    if(event?.cancelable)event.preventDefault();
    const dy=rawDy<0?rawDy*.16:rawDy;
    const stepDy=y-a.lastY;
    const dt=Math.max(1,time-a.lastTime);
    a.velocity=stepDy/dt;
    if(stepDy>2)a.lastDirection='down';
    else if(stepDy<-2)a.lastDirection='up';
    a.lastY=y;a.lastTime=time;a.dy=Math.max(0,rawDy);
    sheet.style.transform=`translate3d(0,${dy}px,0)`;
  };
  const end=(source,id)=>{
    const a=entry.active;if(!a||a.source!==source||a.id!==id)return;
    entry.active=null;
    if(!a.locked){restoreVisual(sheet,entry,false);return}
    if(a.lastDirection==='up'){restoreVisual(sheet,entry,true);return}
    const threshold=Math.min(90,Math.max(44,sheet.getBoundingClientRect().height*.078));
    if(a.dy>=threshold||(a.dy>=18&&a.velocity>.25))finishDismiss(sheet,entry);
    else restoreVisual(sheet,entry,true);
  };
  const cancel=(source,id)=>{
    const a=entry.active;if(!a||a.source!==source||a.id!==id)return;
    entry.active=null;restoreVisual(sheet,entry,true);
  };

  const touchStart=event=>{
    if(event.touches?.length!==1)return;
    const t=event.touches[0];start('touch',t.identifier,t.clientX,t.clientY,performance.now());
  };
  const touchMove=event=>{
    const a=entry.active;if(!a||a.source!=='touch'||event.touches?.length!==1)return;
    const t=[...event.touches].find(item=>item.identifier===a.id)||event.touches[0];
    move('touch',a.id,t.clientX,t.clientY,performance.now(),event);
  };
  const touchEnd=event=>{
    const a=entry.active;if(!a||a.source!=='touch')return;
    const t=[...(event.changedTouches||[])].find(item=>item.identifier===a.id);
    if(t)move('touch',a.id,t.clientX,t.clientY,performance.now(),event);
    end('touch',a.id);
  };
  const touchCancel=()=>{const a=entry.active;if(a?.source==='touch')cancel('touch',a.id)};
  const pointerDown=event=>{
    if(event.pointerType==='touch'||event.isPrimary===false||event.button!==0)return;
    if(start('pointer',event.pointerId,event.clientX,event.clientY,performance.now())){
      try{handle.setPointerCapture?.(event.pointerId)}catch{}
    }
  };
  const pointerMove=event=>move('pointer',event.pointerId,event.clientX,event.clientY,performance.now(),event);
  const pointerUp=event=>{
    const a=entry.active;if(!a||a.source!=='pointer'||a.id!==event.pointerId)return;
    move('pointer',event.pointerId,event.clientX,event.clientY,performance.now(),event);
    try{handle.releasePointerCapture?.(event.pointerId)}catch{}
    end('pointer',event.pointerId);
  };
  const pointerCancel=event=>cancel('pointer',event.pointerId);

  Object.assign(entry,{touchStart,touchMove,touchEnd,touchCancel,pointerDown,pointerMove,pointerUp,pointerCancel});
  handle.addEventListener('touchstart',touchStart,{passive:true});
  handle.addEventListener('touchmove',touchMove,{passive:false});
  handle.addEventListener('touchend',touchEnd,{passive:false});
  handle.addEventListener('touchcancel',touchCancel,{passive:true});
  handle.addEventListener('pointerdown',pointerDown,{passive:true});
  handle.addEventListener('pointermove',pointerMove,{passive:false});
  handle.addEventListener('pointerup',pointerUp,{passive:false});
  handle.addEventListener('pointercancel',pointerCancel,{passive:true});
  bindings.set(sheet,entry);
  return sheet;
}
function unbind(sheet){
  const entry=bindings.get(sheet);if(!entry)return;
  clearTimeout(entry.resetTimer);
  const h=entry.handle;
  h?.removeEventListener('touchstart',entry.touchStart);
  h?.removeEventListener('touchmove',entry.touchMove);
  h?.removeEventListener('touchend',entry.touchEnd);
  h?.removeEventListener('touchcancel',entry.touchCancel);
  h?.removeEventListener('pointerdown',entry.pointerDown);
  h?.removeEventListener('pointermove',entry.pointerMove);
  h?.removeEventListener('pointerup',entry.pointerUp);
  h?.removeEventListener('pointercancel',entry.pointerCancel);
  sheet.removeAttribute?.('data-flyt-sheet-dragging');
  sheet.style.transform=entry.original.transform;
  sheet.style.transition=entry.original.transition;
  sheet.style.willChange=entry.original.willChange;
  bindings.delete(sheet);
}
ensureStyles();
window.FlytSheetUI={VERSION,bind,unbind};
})();