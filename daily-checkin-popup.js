(()=>{
'use strict';
const VERSION='20260913-dailycheckin1';
const LEVELS=[
  {key:'heavy',label:'Tung',capacity:'low'},
  {key:'low',label:'Lav',capacity:'low'},
  {key:'calm',label:'Rolig',capacity:'med'},
  {key:'good',label:'God',capacity:'high'},
  {key:'full',label:'Mye overskudd',capacity:'high'}
];
let open=false,saving=false;
const $=s=>document.querySelector(s);
const bridge=()=>window.FlytBridge;
function dateKey(){return window.FlytDailyStatus?.dateKey?.(new Date())||new Date().toISOString().slice(0,10)}
function name(s){return String(window.FlytSync?.myName?.()||s?.user||'Meg').trim()||'Meg'}
function profileKey(s){return String(window.FlytSync?.getContext?.()?.user_id||name(s)).replace(/[^a-z0-9_-]/gi,'_')}
function skipKey(s){return 'flyt:daily-checkin-skip:'+profileKey(s)+':'+dateKey()}
function isSkipped(s){try{return localStorage.getItem(skipKey(s))==='1'}catch(_){return false}}
function skip(s){try{localStorage.setItem(skipKey(s),'1')}catch(_){}}
function myStatus(s){return s?.status?.[name(s)]||null}
function isRegistered(s){return !!window.FlytDailyStatus?.current?.(myStatus(s),{kind:'daily'})}
function eligible(s){return !!(window.FlytSettingsUI?.enabled?.('popups.dailyCheckin',true)!==false&&s?.setupDone&&s?.user&&!isRegistered(s)&&!isSkipped(s))}
function remove(){const el=$('#dailyCheckinPopup');el?.remove();open=false;saving=false}
function markup(){return `<div id="dailyCheckinPopup" class="dailyCheckinLayer" role="presentation"><section class="dailyCheckinPopup" role="dialog" aria-modal="true" aria-labelledby="dailyCheckinTitle"><div class="dailyCheckinEy">DAGSFORM I DAG</div><h2 id="dailyCheckinTitle">Hvordan har du det i dag?</h2><p>Velg det som passer best akkurat nå.</p><div class="dailyCheckinChoices">${LEVELS.map(level=>`<button type="button" data-daily-checkin-level="${level.key}"><span aria-hidden="true"></span>${level.label}</button>`).join('')}</div><button type="button" class="dailyCheckinSkip" data-daily-checkin-skip="1">Ikke nå</button><p class="dailyCheckinError" role="alert" hidden></p></section></div>`}
function show(){const s=bridge()?.getState?.();if(open||!eligible(s)||$('#dailyCheckinPopup'))return false;document.body.insertAdjacentHTML('beforeend',markup());open=true;return true}
function setError(message){const el=$('.dailyCheckinError');if(!el)return;el.textContent=message;el.hidden=false}
async function saveLevel(key){
 const s=bridge()?.getState?.(),level=LEVELS.find(item=>item.key===key);
 if(!s||!level||saving)return;
 saving=true;
 document.querySelectorAll('[data-daily-checkin-level], [data-daily-checkin-skip]').forEach(button=>button.disabled=true);
 const previous=myStatus(s),now=new Date().toISOString(),who=name(s),nextStatus={...(previous||{}),capacity:level.capacity,capacity_level:level.key,needs:[],daily_updated_at:now,updated_at:now};
 try{
   const context=window.FlytSync?.getContext?.();
   if(context?.user_id&&window.FlytSync?.rpc){
     const {error}=await window.FlytSync.rpc('save_my_daily_status',{p_capacity:level.capacity,p_needs:[],p_notify:false});
     if(error)throw error;
   }else{
     Object.assign(nextStatus,window.FlytDailyStatus?.fallbackLegacyFields?.(previous,level.capacity)||{});
     nextStatus.capacity=level.capacity;nextStatus.capacity_level=level.key;nextStatus.needs=[];nextStatus.daily_updated_at=now;nextStatus.updated_at=now;
   }
   bridge()?.setState?.({...s,status:{...(s.status||{}),[who]:nextStatus}});
   window.FlytSync?.queueSave?.();
   window.FlytNudgeUI?.refreshStatus?.(true);
   remove();
 }catch(error){
   console.warn('Flyt dagsform kunne ikke lagres',error);
   saving=false;
   document.querySelectorAll('[data-daily-checkin-level], [data-daily-checkin-skip]').forEach(button=>button.disabled=false);
   setError('Kunne ikke lagre dagsformen akkurat nå. Prøv igjen.');
 }
}
function check(){const s=bridge()?.getState?.();if(!s?.setupDone)return;show()}
document.addEventListener('click',event=>{
 const level=event.target.closest?.('[data-daily-checkin-level]');
 if(level){event.preventDefault();event.stopImmediatePropagation();saveLevel(level.dataset.dailyCheckinLevel);return}
 const later=event.target.closest?.('[data-daily-checkin-skip]');
 if(later){event.preventDefault();event.stopImmediatePropagation();const s=bridge()?.getState?.();if(s)skip(s);remove()}
},true);
const schedule=()=>[0,120,500,1200,2500].forEach(wait=>setTimeout(check,wait));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
window.addEventListener('pageshow',schedule);
window.FlytDailyCheckin={version:VERSION,check};
})();
