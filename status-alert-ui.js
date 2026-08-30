(()=>{
'use strict';
const VERSION='20260830-1945';
const GROUP_WINDOW_MS=5*60*1000;
let busy=false,current=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABEL={low:'Lav',med:'Middels',high:'Høy'};
const FIELD={energy:'Energi',capacity:'Overskudd',closeness:'Nærhet',desire:'Sexlyst',stress:'Stress'};
const NEED={relief:'Avlastning',closeness:'Nærhet',sex:'Sex',initiative:'Initiativ',alone:'Alenetid',quiet:'Ro'};
function stamp(v){const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0}
function text(ev){const c=ev?.changes||{},parts=[];for(const k of ['energy','capacity','closeness','desire','stress'])if(c[k])parts.push(`${FIELD[k]}: ${LABEL[c[k].to]||c[k].to}`);if(c.needs){const a=new Set(c.needs.from||[]),b=new Set(c.needs.to||[]),add=[...b].filter(x=>!a.has(x)).map(x=>NEED[x]||x),rem=[...a].filter(x=>!b.has(x)).map(x=>NEED[x]||x);if(add.length)parts.push(`Trenger ${add.join(', ')}`);if(rem.length)parts.push(`Ikke lenger ${rem.join(', ')}`)}return parts.join(' · ')||'Dagsformen er oppdatert'}
function bundle(events){
  const list=(Array.isArray(events)?events:[]).filter(Boolean).sort((a,b)=>stamp(b.created_at)-stamp(a.created_at));
  if(!list.length)return null;
  const newest=list[0],newestAt=stamp(newest.created_at),actor=newest.actor_name||'Partner';
  const grouped=list.filter(ev=>(ev.actor_name||'Partner')===actor&&newestAt-stamp(ev.created_at)<=GROUP_WINDOW_MS);
  const chronological=[...grouped].sort((a,b)=>stamp(a.created_at)-stamp(b.created_at)),changes={};
  for(const ev of chronological){for(const [key,val] of Object.entries(ev.changes||{})){if(!val||typeof val!=='object')continue;if(!changes[key])changes[key]={from:val.from,to:val.to};else changes[key].to=val.to}}
  return{id:newest.id,ids:grouped.map(ev=>ev.id).filter(Boolean),actor_name:actor,changes,created_at:newest.created_at,count:grouped.length}
}
function close(){document.querySelector('#statusAlertModal')?.remove();current=null}
function show(ev){if(!ev||document.querySelector('#statusAlertModal'))return;current=ev;const el=document.createElement('div');el.id='statusAlertModal';el.style.cssText='position:fixed;inset:0;z-index:120;background:#3a211b88;display:flex;align-items:center;justify-content:center;padding:22px';el.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="statusAlertTitle" style="width:min(390px,100%);background:#fffaf7;border:1px solid #ead8d0;border-radius:24px;padding:22px;box-shadow:0 24px 70px #3b211b55"><div style="font-size:11px;color:#ad4a3c;font-weight:900;letter-spacing:.12em;text-transform:uppercase">Dagsform · Varsel</div><h2 id="statusAlertTitle" style="font:500 28px/1.1 Georgia;margin:10px 0 12px">${esc(ev.actor_name||'Partner')} har oppdatert dagsformen</h2><p style="color:#806d65;line-height:1.5;margin:0 0 18px">${esc(text(ev))}</p><button id="statusAlertOk" style="width:100%;min-height:50px;border:0;border-radius:15px;background:linear-gradient(135deg,#e87961,#ad4a3c);color:#fff;font-weight:900;font:inherit">OK, sett</button></div>`;document.body.appendChild(el)}
async function check(){if(busy||document.hidden||!window.FlytSync?.rpc||document.querySelector('#statusAlertModal'))return;busy=true;try{const {data,error}=await window.FlytSync.rpc('get_home_partner_context');if(error)throw error;const ev=bundle(data?.events);if(ev)show(ev)}catch(e){console.warn('Flyt statusvarsel kunne ikke hentes',e)}finally{busy=false}}
document.addEventListener('click',async e=>{if(!e.target.closest('#statusAlertOk')||!current)return;e.preventDefault();e.stopImmediatePropagation();const ids=(current.ids?.length?current.ids:[current.id]).filter(Boolean),btn=e.target.closest('#statusAlertOk');btn.disabled=true;try{for(const id of ids){const {error}=await window.FlytSync.rpc('mark_status_event_read',{p_event_id:id});if(error)throw error}close();setTimeout(check,80)}catch(err){btn.disabled=false;console.warn('Flyt statusvarsel kunne ikke kvitteres',err)}},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(check,150)});
window.addEventListener('focus',()=>setTimeout(check,150));
let tries=0;const timer=setInterval(()=>{if(window.FlytSync?.rpc){clearInterval(timer);check();return}if(++tries>60)clearInterval(timer)},150);
window.FlytStatusAlert={check,bundle,version:VERSION};
})();