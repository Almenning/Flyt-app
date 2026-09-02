(()=>{
'use strict';
let observer=null,waiting=null,tuning=false,scheduled=false;
const bridge=()=>window.FlytBridge;
const state=()=>bridge()?.getState?.()||null;
function safeId(v){return window.CSS?.escape?CSS.escape(v):String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&')}
function tuneSetup(){
  if(tuning)return;
  tuning=true;
  try{
    const body=document.querySelector('#flytSetupV2Body');
    if(!body)return;
    const s=state();
    if(!s)return;
    for(const sel of body.querySelectorAll('select[data-v2-type]')){
      const id=String(sel.dataset.v2Type||''),task=(s.tasks||[]).find(t=>String(t.id)===id),input=body.querySelector(`input[data-v2-freq="${safeId(id)}"]`);
      if(!task||!input)continue;
      const label=input.closest('label')?.querySelector('.label');
      const wantedLabel=sel.value==='daily'?'Dager per uke':sel.value==='period'?'Antall per måned':'Antall per uke';
      const wantedMax=sel.value==='daily'?'7':'31';
      const wantedValue=String(Math.min(Number(wantedMax),Math.max(1,Number(task.freq)||1)));
      if(input.disabled)input.disabled=false;
      if(input.min!=='1')input.min='1';
      if(input.max!==wantedMax)input.max=wantedMax;
      if(input.value!==wantedValue)input.value=wantedValue;
      if(label&&label.textContent!==wantedLabel)label.textContent=wantedLabel;
    }
  }finally{tuning=false}
}
function scheduleTune(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;tuneSetup()})}
function attach(){
  const root=document.querySelector('#flytSetupV2');
  if(!root)return false;
  if(!observer){observer=new MutationObserver(scheduleTune);observer.observe(root,{childList:true,subtree:true})}
  tuneSetup();
  return true;
}
function install(){
  attach();
  if(!observer){let tries=0;waiting=setInterval(()=>{if(attach()||++tries>100){clearInterval(waiting);waiting=null}},100)}
  document.addEventListener('change',e=>{if(e.target.matches?.('select[data-v2-type],input[data-v2-freq]'))setTimeout(tuneSetup,0)},true);
  window.addEventListener('pageshow',()=>{attach();tuneSetup()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytDailyFrequencyUI={tuneSetup,version:'20260826-0735'};
})();
