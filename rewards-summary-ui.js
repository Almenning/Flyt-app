(()=>{
'use strict';
let painting=false;
function state(){return window.FlytBridge?.getState?.()||null}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function paint(){if(painting)return;const s=state(),c=document.querySelector('#content');if(!s||!c||s.view!=='rewards')return;const h1=c.querySelector('h1.title');if(!h1)return;const me=s.user||'Meg',points=s.points||{},balance=Number(points[me]||0),sig=`${me}|${balance}`,existing=c.querySelector('[data-rewards-summary="1"]');if(existing?.dataset.sig===sig)return;painting=true;const html=`<div data-rewards-summary="1" data-sig="${esc(sig)}" class="card" style="margin:10px 0 12px;padding:12px 14px;box-shadow:none"><div class="row" style="justify-content:space-between;gap:8px"><span class="ey" style="margin:0">Dine poeng</span><strong style="font-size:20px">${balance} poeng</strong></div></div>`;if(existing){existing.outerHTML=html}else{const legacy=h1.nextElementSibling;if(legacy?.classList.contains('card')&&legacy.querySelector('.tag'))legacy.remove();h1.insertAdjacentHTML('afterend',html)}painting=false}
const obs=new MutationObserver(()=>{if(!painting)queueMicrotask(paint)});window.addEventListener('DOMContentLoaded',()=>{const c=document.querySelector('#content');if(c){obs.observe(c,{childList:true,subtree:true});paint()}});let n=0;const timer=setInterval(()=>{const c=document.querySelector('#content');if(c){obs.observe(c,{childList:true,subtree:true});paint();clearInterval(timer)}else if(++n>60)clearInterval(timer)},100);
window.FlytRewardsSummaryUI={paint,version:'20260901-1500'};
})();
