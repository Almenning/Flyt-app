(()=>{
'use strict';
let migrated=false,observer=null;
const bridge=()=>window.FlytBridge;
const state=()=>bridge()?.getState?.()||null;
function save(next){bridge()?.setState?.(next);window.FlytSync?.queueSave?.()}
function migrateLegacyDailyCounts(){if(migrated)return;const s=state();if(!s)return;if(s.dailyFrequencyPerDayV1){migrated=true;return}const normalize=list=>(list||[]).map(t=>t?.type==='daily'?{...t,freq:1}:{...t});save({...s,tasks:normalize(s.tasks),custom:normalize(s.custom),dailyFrequencyPerDayV1:true});migrated=true}
function tuneSetup(){const body=document.querySelector('#flytSetupV2Body');if(!body)return;const s=state();if(!s)return;for(const sel of body.querySelectorAll('select[data-v2-type]')){const id=String(sel.dataset.v2Type||''),task=(s.tasks||[]).find(t=>String(t.id)===id),input=body.querySelector(`input[data-v2-freq="${CSS.escape(id)}"]`);if(!task||!input)continue;const label=input.closest('label')?.querySelector('.label');input.disabled=false;input.min='1';input.max=sel.value==='daily'?'20':'31';input.value=String(Math.max(1,Number(task.freq)||1));if(label)label.textContent=sel.value==='daily'?'Antall per dag':sel.value==='period'?'Antall per måned':'Antall per uke'} }
function install(){migrateLegacyDailyCounts();tuneSetup();const root=document.querySelector('#flytSetupV2');if(root&&!observer){observer=new MutationObserver(()=>queueMicrotask(tuneSetup));observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}document.addEventListener('change',e=>{if(e.target.matches?.('select[data-v2-type],input[data-v2-freq]'))setTimeout(tuneSetup,0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytDailyFrequencyUI={tuneSetup,version:'20260825-2348'};
})();