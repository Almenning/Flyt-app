(()=>{
'use strict';
let draft=null,restoring=false,seenLoading=false;
function state(){return window.FlytBridge?.getState?.()||null}
function saveDraft(el){if(!el?.matches?.('[data-rcost]'))return;draft={id:String(el.dataset.rcost),value:el.value,selectionStart:el.selectionStart,selectionEnd:el.selectionEnd,at:Date.now()}}
function restore(){if(restoring||!draft)return;const s=state();if(s?.view!=='rewards'){draft=null;return}const el=document.querySelector(`[data-rcost="${CSS.escape(draft.id)}"]`);if(!el)return;restoring=true;el.value=draft.value;requestAnimationFrame(()=>{try{el.focus({preventScroll:true});if(typeof el.setSelectionRange==='function'){const a=draft.selectionStart??el.value.length,b=draft.selectionEnd??a;el.setSelectionRange(a,b)}}catch(e){}restoring=false})}
function ensureSeenUi(){if(window.FlytDialog?.openReward||seenLoading||document.querySelector('script[data-flyt-seen-core]'))return;seenLoading=true;const s=document.createElement('script');s.src='./seen-ui.js?v=20260825-0702';s.defer=true;s.dataset.flytSeenCore='1';s.onload=()=>{seenLoading=false};s.onerror=()=>{seenLoading=false};document.head.appendChild(s)}
async function openReward(){if(window.FlytDialog?.openReward){window.FlytDialog.openReward();return}ensureSeenUi();for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,50));if(window.FlytDialog?.openReward){window.FlytDialog.openReward();return}}}
document.addEventListener('click',e=>{const b=e.target.closest?.('#addReward');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openReward()},true);
document.addEventListener('focusin',e=>{if(e.target.matches?.('[data-rcost]'))saveDraft(e.target)},true);
document.addEventListener('input',e=>{if(e.target.matches?.('[data-rcost]'))saveDraft(e.target)},true);
document.addEventListener('change',e=>{if(!e.target.matches?.('[data-rcost]'))return;saveDraft(e.target);const s=state(),r=(s?.rewards||[]).find(x=>String(x.id)===String(e.target.dataset.rcost));if(!s||!r)return;r.cost=r.requiresPoints?Math.max(1,Number(e.target.value)||1):0;e.target.value=String(r.cost);window.FlytBridge.setState({...s,rewards:[...(s.rewards||[])]});window.FlytSync?.queueSave?.();draft=null},true);
document.addEventListener('focusout',e=>{if(!e.target.matches?.('[data-rcost]'))return;setTimeout(()=>{if(document.activeElement?.matches?.('[data-rcost]'))return;const live=document.querySelector(`[data-rcost="${CSS.escape(String(e.target.dataset.rcost))}"]`);if(live&&live!==e.target)return;draft=null},150)},true);
const obs=new MutationObserver(()=>{if(draft)restore()});
function init(){ensureSeenUi();const c=document.querySelector('#content');if(c)obs.observe(c,{childList:true,subtree:true})}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',init,{once:true});else init();
let tries=0;const timer=setInterval(()=>{const c=document.querySelector('#content');if(c){obs.observe(c,{childList:true,subtree:true});clearInterval(timer)}else if(++tries>60)clearInterval(timer)},100);
window.FlytRewardsEditGuard={restore,openReward,ensureSeenUi,version:'20260825-2102'};
})();