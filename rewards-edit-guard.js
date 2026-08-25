(()=>{
'use strict';
let draft=null,restoring=false;
function state(){return window.FlytBridge?.getState?.()||null}
function saveDraft(el){if(!el?.matches?.('[data-rcost]'))return;draft={id:String(el.dataset.rcost),value:el.value,selectionStart:el.selectionStart,selectionEnd:el.selectionEnd,at:Date.now()}}
function restore(){if(restoring||!draft)return;const s=state();if(s?.view!=='rewards'){draft=null;return}const el=document.querySelector(`[data-rcost="${CSS.escape(draft.id)}"]`);if(!el)return;restoring=true;el.value=draft.value;requestAnimationFrame(()=>{try{el.focus({preventScroll:true});if(typeof el.setSelectionRange==='function'){const a=draft.selectionStart??el.value.length,b=draft.selectionEnd??a;el.setSelectionRange(a,b)}}catch(e){}restoring=false})}
document.addEventListener('focusin',e=>{if(e.target.matches?.('[data-rcost]'))saveDraft(e.target)},true);
document.addEventListener('input',e=>{if(e.target.matches?.('[data-rcost]'))saveDraft(e.target)},true);
document.addEventListener('change',e=>{if(!e.target.matches?.('[data-rcost]'))return;saveDraft(e.target);const s=state(),r=(s?.rewards||[]).find(x=>String(x.id)===String(e.target.dataset.rcost));if(!s||!r)return;r.cost=Math.max(0,Number(e.target.value)||0);window.FlytBridge.setState({...s,rewards:[...(s.rewards||[])]});window.FlytSync?.queueSave?.();draft=null},true);
document.addEventListener('focusout',e=>{if(!e.target.matches?.('[data-rcost]'))return;setTimeout(()=>{if(document.activeElement?.matches?.('[data-rcost]'))return;const live=document.querySelector(`[data-rcost="${CSS.escape(String(e.target.dataset.rcost))}"]`);if(live&&live!==e.target)return;draft=null},150)},true);
const obs=new MutationObserver(()=>{if(draft)restore()});window.addEventListener('DOMContentLoaded',()=>{const c=document.querySelector('#content');if(c)obs.observe(c,{childList:true,subtree:true})});let tries=0;const timer=setInterval(()=>{const c=document.querySelector('#content');if(c){obs.observe(c,{childList:true,subtree:true});clearInterval(timer)}else if(++tries>60)clearInterval(timer)},100);
window.FlytRewardsEditGuard={restore,version:'20260825-0645'};
})();