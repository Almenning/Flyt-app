(()=>{
'use strict';
const VERSION='20260919-edgeswipe1',EDGE=25,DISTANCE=80,RATIO=1.35,configs=new WeakMap();
let active=null,lockedUntil=0;
function interactive(target){return !!target?.closest?.('input,textarea,select,[contenteditable="true"],[data-flyt-edge-swipe-ignore]')}
function keyboardOpen(){const active=document.activeElement;return !!active?.matches?.('input,textarea,select,[contenteditable="true"]')}
function visible(el){return !!el&&!!(el.offsetWidth||el.offsetHeight||el.getClientRects?.().length)}
function blocked(root){return[...document.querySelectorAll('[aria-modal="true"]')].some(dialog=>visible(dialog)&&dialog!==root&&!root.contains(dialog))}
function bind(root,options={}){if(!root)return null;root.dataset.flytEdgeSwipeBack='1';configs.set(root,options);return root}
function unbind(root){if(!root)return;configs.delete(root);delete root.dataset.flytEdgeSwipeBack}
function ready(root,config){return !!root?.isConnected&&!keyboardOpen()&&!blocked(root)&&config?.canGoBack?.()!==false}
document.addEventListener('touchstart',event=>{
  if(Date.now()<lockedUntil||event.touches.length!==1)return;
  const touch=event.touches[0];if(touch.clientX>EDGE||interactive(event.target))return;
  const root=event.target.closest?.('[data-flyt-edge-swipe-back]'),config=configs.get(root);
  if(!ready(root,config))return;
  active={root,config,x:touch.clientX,y:touch.clientY};
},{capture:true,passive:true});
document.addEventListener('touchmove',event=>{
  if(!active||event.touches.length!==1)return;
  const touch=event.touches[0],dx=touch.clientX-active.x,dy=touch.clientY-active.y;
  if(Math.abs(dy)>Math.abs(dx)||dx<-12)active=null;
},{capture:true,passive:true});
document.addEventListener('touchend',event=>{
  const gesture=active;active=null;if(!gesture)return;
  const touch=event.changedTouches[0],dx=touch.clientX-gesture.x,dy=touch.clientY-gesture.y;
  if(dx<DISTANCE||Math.abs(dx)<Math.abs(dy)*RATIO||!ready(gesture.root,gesture.config))return;
  lockedUntil=Date.now()+450;
  gesture.config.onBack?.();
},{capture:true,passive:true});
document.addEventListener('touchcancel',()=>{active=null},{capture:true,passive:true});
window.FlytEdgeSwipeBack={VERSION,bind,unbind};
})();
