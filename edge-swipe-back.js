(()=>{
'use strict';
const VERSION='20260930-edgeswipe-sheetdrag1',EDGE=25,DISTANCE=80,RATIO=1.35,configs=new Map(),sheetConfigs=new Map();
let active=null,lockedUntil=0;
function interactive(target){return !!target?.closest?.('input,textarea,select,[contenteditable="true"],[data-flyt-edge-swipe-ignore]')}
function keyboardOpen(){const active=document.activeElement;return !!active?.matches?.('input,textarea,select,[contenteditable="true"]')}
function visible(el){return !!el&&!!(el.offsetWidth||el.offsetHeight||el.getClientRects?.().length)}
function blocked(root){return[...document.querySelectorAll('[aria-modal="true"]')].some(dialog=>visible(dialog)&&dialog!==root&&!root.contains(dialog))}
function within(root,x,y){const box=root?.getBoundingClientRect?.();return !!box&&x>=box.left&&x<=box.right&&y>=box.top&&y<=box.bottom}
function rootFor(target,x,y){const direct=target?.closest?.('[data-flyt-edge-swipe-back]');if(direct&&configs.has(direct))return[direct,configs.get(direct)];return[...configs.entries()].reverse().find(([root])=>root.isConnected&&visible(root)&&within(root,x,y))||[]}
function bind(root,options={}){if(!root)return null;root.dataset.flytEdgeSwipeBack='1';configs.delete(root);configs.set(root,options);return root}
function unbind(root){if(!root)return;configs.delete(root);delete root.dataset.flytEdgeSwipeBack}
function ready(root,config){return !!root?.isConnected&&!keyboardOpen()&&!blocked(root)&&config?.canGoBack?.()!==false}
function begin({source,id,x,y,target}){if(active||Date.now()<lockedUntil||x>EDGE||interactive(target))return;const[root,config]=rootFor(target,x,y);if(!ready(root,config))return;active={source,id,root,config,x,y}}
function move({source,id,x,y}){if(!active||active.source!==source||active.id!==id)return;const dx=x-active.x,dy=y-active.y;if(Math.abs(dy)>Math.abs(dx)||dx<-12)active=null}
function finish({source,id,x,y}){const gesture=active;if(!gesture||gesture.source!==source||gesture.id!==id)return;active=null;const dx=x-gesture.x,dy=y-gesture.y;
  if(dx<DISTANCE||Math.abs(dx)<Math.abs(dy)*RATIO||!ready(gesture.root,gesture.config))return;
  lockedUntil=Date.now()+450;
  gesture.config.onBack?.();
}
document.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')begin({source:'pointer',id:event.pointerId,x:event.clientX,y:event.clientY,target:event.target})},{capture:true,passive:true});
document.addEventListener('pointermove',event=>{if(event.pointerType==='touch')move({source:'pointer',id:event.pointerId,x:event.clientX,y:event.clientY})},{capture:true,passive:true});
document.addEventListener('pointerup',event=>{if(event.pointerType==='touch')finish({source:'pointer',id:event.pointerId,x:event.clientX,y:event.clientY})},{capture:true,passive:true});
document.addEventListener('pointercancel',event=>{if(active?.source==='pointer'&&active.id===event.pointerId)active=null},{capture:true,passive:true});
document.addEventListener('touchstart',event=>{if(active||event.touches.length!==1)return;const touch=event.touches[0];begin({source:'touch',id:touch.identifier,x:touch.clientX,y:touch.clientY,target:event.target})},{capture:true,passive:true});
document.addEventListener('touchmove',event=>{if(active?.source!=='touch'||event.touches.length!==1)return;const touch=event.touches[0];move({source:'touch',id:touch.identifier,x:touch.clientX,y:touch.clientY})},{capture:true,passive:true});
document.addEventListener('touchend',event=>{if(active?.source!=='touch')return;const touch=event.changedTouches[0];if(touch)finish({source:'touch',id:touch.identifier,x:touch.clientX,y:touch.clientY})},{capture:true,passive:true});
document.addEventListener('touchcancel',()=>{if(active?.source==='touch')active=null},{capture:true,passive:true});

function ensureSheetStyle(){
  if(document.querySelector('#flytSheetDragDismissStyle'))return;
  const style=document.createElement('style');style.id='flytSheetDragDismissStyle';style.textContent=`
  [data-flyt-sheet-drag-handle]{position:relative!important;display:block!important;width:64px!important;height:24px!important;min-height:24px!important;margin:0 auto!important;background:transparent!important;border:0!important;border-radius:0!important;touch-action:none!important;cursor:grab;user-select:none;-webkit-user-select:none}
  [data-flyt-sheet-drag-handle]::before{content:"";position:absolute;left:50%;top:8px;width:38px;height:5px;transform:translateX(-50%);border-radius:999px;background:var(--flyt-sheet-handle-color,#d9bcb0)}
  [data-flyt-sheet-dragging]{will-change:transform;cursor:grabbing}
  @media(prefers-reduced-motion:reduce){[data-flyt-sheet-dragging]{transition:none!important}}
  `;document.head.appendChild(style);
}
function sheetInteractive(target){return !!target?.closest?.('button,a,input,textarea,select,[contenteditable="true"]')}
function sheetUnbind(sheet){
  const entry=sheetConfigs.get(sheet);if(!entry)return;
  entry.handle?.removeEventListener('pointerdown',entry.down);
  entry.handle?.removeEventListener('pointermove',entry.move);
  entry.handle?.removeEventListener('pointerup',entry.up);
  entry.handle?.removeEventListener('pointercancel',entry.cancel);
  if(entry.timer)clearTimeout(entry.timer);
  entry.handle?.removeAttribute('data-flyt-sheet-drag-handle');
  sheet.removeAttribute('data-flyt-sheet-dragging');
  sheet.style.transform=entry.original.transform;
  sheet.style.transition=entry.original.transition;
  sheet.style.willChange=entry.original.willChange;
  sheetConfigs.delete(sheet);
}
function sheetBind(sheet,options={}){
  if(!sheet)return null;sheetUnbind(sheet);ensureSheetStyle();
  const handle=options.handle||sheet.querySelector('[data-sheet-handle],.seenSheetHandle,.homeStatusSheetHandle,.temptationDragHandle,.deadlineHandle');
  if(!handle)return null;
  const layer=options.layer||sheet.parentElement;
  const original={transform:sheet.style.transform,transition:sheet.style.transition,willChange:sheet.style.willChange};
  const color=getComputedStyle(handle).backgroundColor;
  if(color&&color!=='rgba(0, 0, 0, 0)'&&color!=='transparent')handle.style.setProperty('--flyt-sheet-handle-color',color);
  handle.setAttribute('data-flyt-sheet-drag-handle','1');
  let gesture=null,timer=0;
  const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const canDismiss=()=>options.canDismiss?.()!==false;
  const restore=animated=>{
    if(!sheet.isConnected)return;
    sheet.removeAttribute('data-flyt-sheet-dragging');
    sheet.style.transition=animated&&!reduce()?'transform 180ms cubic-bezier(.2,.75,.25,1)':'none';
    sheet.style.transform='translate3d(0,0,0)';
    timer=window.setTimeout(()=>{if(!sheet.isConnected)return;sheet.style.transition=original.transition;sheet.style.transform=original.transform;sheet.style.willChange=original.willChange},animated&&!reduce()?190:0);
  };
  const dismiss=()=>{
    if(!sheet.isConnected||!canDismiss()){restore(true);return}
    const activeEl=document.activeElement;if(activeEl&&sheet.contains(activeEl)&&activeEl.matches?.('input,textarea,select,[contenteditable="true"]'))activeEl.blur();
    sheet.removeAttribute('data-flyt-sheet-dragging');
    if(reduce()){options.onDismiss?.();return}
    sheet.style.transition='transform 190ms cubic-bezier(.3,.7,.25,1)';
    sheet.style.transform=`translate3d(0,${Math.max(window.innerHeight||0,sheet.getBoundingClientRect().height)+36}px,0)`;
    timer=window.setTimeout(()=>options.onDismiss?.(),195);
  };
  const down=event=>{
    if(event.isPrimary===false||event.button!==0||!canDismiss()||sheetInteractive(event.target)&&event.target!==handle)return;
    if(timer)clearTimeout(timer);
    gesture={id:event.pointerId,startY:event.clientY,lastY:event.clientY,lastT:performance.now(),dy:0,velocity:0};
    sheet.setAttribute('data-flyt-sheet-dragging','1');sheet.style.transition='none';sheet.style.willChange='transform';
    try{handle.setPointerCapture(event.pointerId)}catch{}
  };
  const move=event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    const now=performance.now(),dy=Math.max(0,event.clientY-gesture.startY),dt=Math.max(1,now-gesture.lastT);
    gesture.velocity=(event.clientY-gesture.lastY)/dt;gesture.lastY=event.clientY;gesture.lastT=now;gesture.dy=dy;
    sheet.style.transform=`translate3d(0,${dy}px,0)`;
  };
  const finishGesture=event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    const current=gesture;gesture=null;
    try{handle.releasePointerCapture(event.pointerId)}catch{}
    const threshold=Math.min(150,Math.max(88,sheet.getBoundingClientRect().height*.16));
    if(current.dy>=threshold||(current.dy>=34&&current.velocity>.72))dismiss();else restore(true);
  };
  const cancel=event=>{if(!gesture||gesture.id!==event.pointerId)return;gesture=null;restore(true)};
  handle.addEventListener('pointerdown',down,{passive:true});
  handle.addEventListener('pointermove',move,{passive:true});
  handle.addEventListener('pointerup',finishGesture,{passive:true});
  handle.addEventListener('pointercancel',cancel,{passive:true});
  const entry={handle,down,move,up:finishGesture,cancel,original,get timer(){return timer},layer};sheetConfigs.set(sheet,entry);return sheet;
}
window.FlytEdgeSwipeBack={VERSION,bind,unbind};
window.FlytSheetDragDismiss={VERSION,bind:sheetBind,unbind:sheetUnbind};
})();