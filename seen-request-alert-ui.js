(()=>{
'use strict';
const VERSION='20260826-1405';
const NOTIFY_SINCE=new Date('2026-08-26T11:45:00Z').getTime();
const TYPE_LABEL={need:'Behov',wish:'Ønske',practical:'Praktisk'};
const TYPE_TITLE={need:'har delt et behov',wish:'har delt et ønske',practical:'har delt noe praktisk'};
let lastShown=new Set();
const $=s=>document.querySelector(s);
const bridge=()=>window.FlytBridge;
function state(){return bridge()?.getState?.()||null}
function save(s){bridge()?.setState?.(s);window.FlytSync?.queueSave?.()}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function requests(s){return Array.isArray(s?.seenRequests)?s.seenRequests:[]}
function incoming(s,r){return !!r&&!r.deleted&&!r.done&&r.by&&r.by!==s?.user}
function unread(s,r){return incoming(s,r)&&!r.seen}
function dismissedBy(r,user){return Array.isArray(r.alertDismissedBy)&&r.alertDismissedBy.includes(user)}
function eligible(s,r){const created=Number(r.createdAt||0);return unread(s,r)&&created>=NOTIFY_SINCE&&!dismissedBy(r,s.user)&&!lastShown.has(String(r.id))}
function updateBadge(){const s=state(),nav=document.querySelector('#nav button[data-view="seen"]');if(!s||!nav)return;const count=requests(s).filter(r=>unread(s,r)).length;nav.style.position='relative';let badge=nav.querySelector('[data-seen-request-badge]');if(!count){badge?.remove();return}if(!badge){badge=document.createElement('span');badge.dataset.seenRequestBadge='1';badge.style.cssText='position:absolute;top:5px;right:calc(50% - 22px);min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#c85745;color:white;font-size:10px;font-weight:900;line-height:17px;text-align:center;box-shadow:0 0 0 2px #fffaf7';nav.appendChild(badge)}badge.textContent=count>9?'9+':String(count);nav.setAttribute('aria-label',`Sett, ${count} ulest${count===1?'':'e'}`)}
function mutateRequest(id,fn){const s=state();if(!s)return null;const all=requests(s).map(x=>({...x})),r=all.find(x=>String(x.id)===String(id));if(!r)return null;fn(r,s);save({...s,seenRequests:all});return r}
function dismiss(r){mutateRequest(r.id,(x,s)=>{const list=Array.isArray(x.alertDismissedBy)?[...x.alertDismissedBy]:[];if(!list.includes(s.user))list.push(s.user);x.alertDismissedBy=list;x.alertDismissedAt=new Date().toISOString()});$('#seenRequestAlertModal')?.remove();updateBadge()}
function openSeen(r){const s=state();if(!s)return;mutateRequest(r.id,(x,current)=>{x.seen=true;x.seenBy=current.user;x.seenAt=x.seenAt||new Date().toISOString();const list=Array.isArray(x.alertDismissedBy)?[...x.alertDismissedBy]:[];if(!list.includes(current.user))list.push(current.user);x.alertDismissedBy=list});$('#seenRequestAlertModal')?.remove();const fresh=state();if(fresh)save({...fresh,view:'seen'});setTimeout(()=>window.FlytSeenUI?.render?.(),0);updateBadge()}
function modalBlocked(){return !!document.querySelector('#seenRequestAlertModal,#quickAlertModal,#statusAlertModal,#flytGlobalModal,#seenRequestModal,#quickTemptationModal,#flytAppMenu')}
function systemNotice(r){if(!('Notification'in window)||Notification.permission!=='granted')return;const label=TYPE_LABEL[r.type]||'Behov';try{new Notification(`${label} fra ${r.by}`,{body:String(r.text||''),tag:`flyt-seen-${r.id}`})}catch(e){}}
function showAlert(r){const s=state();if(!s||!eligible(s,r)||modalBlocked())return false;lastShown.add(String(r.id));systemNotice(r);const label=TYPE_LABEL[r.type]||'Behov',title=TYPE_TITLE[r.type]||'har delt noe med deg';const el=document.createElement('div');el.id='seenRequestAlertModal';el.style.cssText='position:fixed;inset:0;z-index:335;background:#3a211b99;display:flex;align-items:center;justify-content:center;padding:22px';el.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="seenAlertTitle" style="width:min(390px,100%);background:#fffaf7;border:1px solid #ead8d0;border-radius:26px;padding:22px;box-shadow:0 24px 70px #3b211b55"><div class="ey">Sett · ${esc(label)}</div><h2 id="seenAlertTitle" style="font:500 28px/1.12 Georgia;margin:10px 0 8px">${esc(r.by)} ${title}</h2><div class="card hero" style="margin:16px 0"><div style="font-size:18px;line-height:1.48">${esc(r.text)}</div></div><p class="sub" style="margin:0">Tydelig beskjed, uten at den andre må gjette. Et overraskende avansert konsept for menneskeheten.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button type="button" id="seenAlertLater" class="secondary">Senere</button><button type="button" id="seenAlertOpen" class="primary">Åpne Sett</button></div></div>`;document.body.appendChild(el);$('#seenAlertLater').onclick=()=>dismiss(r);$('#seenAlertOpen').onclick=()=>openSeen(r);return true}
function checkAlerts(){const s=state();if(!s){updateBadge();return}updateBadge();if(modalBlocked())return;for(const r of requests(s).sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0))){if(showAlert(r))break}}
document.addEventListener('click',e=>{const seen=e.target.closest?.('[data-request-seen],[data-request-done]');if(seen)setTimeout(()=>{updateBadge();checkAlerts()},50)},true);
window.addEventListener('DOMContentLoaded',()=>{updateBadge();checkAlerts()});
window.addEventListener('pageshow',()=>{updateBadge();checkAlerts()});
setInterval(checkAlerts,1200);
window.FlytSeenRequestAlert={checkAlerts,updateBadge,version:VERSION};
})();