(()=>{
'use strict';
let observer=null,waiting=null;
const bridge=()=>window.FlytBridge;
const state=()=>bridge()?.getState?.()||null;
function safeId(v){return window.CSS?.escape?CSS.escape(v):String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&')}
function tuneSetup(){const body=document.querySelector('#flytSetupV2Body');if(!body)return;const s=state();if(!s)return;for(const sel of body.querySelectorAll('select[data-v2-type]')){const id=String(sel.dataset.v2Type||''),task=(s.tasks||[]).find(t=>String(t.id)===id),input=body.querySelector(`input[data-v2-freq="${safeId(id)}"]`);if(!task||!input)continue;const label=input.closest('label')?.querySelector('.label');input.disabled=false;input.min='1';input.max=sel.value==='daily'?'20':'31';input.value=String(Math.max(1,Number(task.freq)||1));if(label)label.textContent=sel.value==='daily'?'Antall per dag':sel.value==='period'?'Antall per måned':'Antall per uke'}}
function attach(){const root=document.querySelector('#flytSetupV2');if(!root)return false;if(!observer){observer=new MutationObserver(()=>queueMicrotask(tuneSetup));observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}tuneSetup();return true}
function install(){attach();if(!observer){let tries=0;waiting=setInterval(()=>{if(attach()||++tries>100){clearInterval(waiting);waiting=null}},100)}document.addEventListener('change',e=>{if(e.target.matches?.('select[data-v2-type],input[data-v2-freq]'))setTimeout(tuneSetup,0)},true);window.addEventListener('pageshow',()=>{attach();tuneSetup()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytDailyFrequencyUI={tuneSetup,version:'20260825-2356'};
})();