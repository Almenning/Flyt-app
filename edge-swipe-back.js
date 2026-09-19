(()=>{
'use strict';
const VERSION='20260919-edgeswipe2',EDGE=25,DISTANCE=80,RATIO=1.35,configs=new Map();
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
window.FlytEdgeSwipeBack={VERSION,bind,unbind};
})();
