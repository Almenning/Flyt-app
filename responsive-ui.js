(()=>{
'use strict';
const style=document.createElement('style');
style.id='flytResponsiveUi';
style.textContent=`
html,body{max-width:100%;overflow-x:hidden}.app,.content,.top,.nav{min-width:0;max-width:100%}.top{overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}.top::-webkit-scrollbar{display:none}.top>button,.top>div,.top .pill{flex:0 0 auto}.content>*{max-width:100%}.row{min-width:0}.grow{min-width:0}.card{overflow:hidden}.homeStats{grid-template-columns:repeat(3,minmax(0,1fr))}.homeStats div{min-width:0;padding:11px 5px}.homeStats b{font-size:clamp(18px,6vw,24px);line-height:1.05;overflow-wrap:anywhere}.homeStats span{display:block;font-size:clamp(10px,3.2vw,13px);line-height:1.15;overflow-wrap:anywhere;margin-top:4px}.homeSegments button{min-width:0;padding-left:5px;padding-right:5px;font-size:clamp(12px,3.6vw,15px)}
@media(max-width:390px){.content{padding-left:12px;padding-right:12px}.title{font-size:31px}.card{padding:13px}.top{padding-left:9px;padding-right:9px;gap:6px}.pill{padding:9px 11px}.nav button{font-size:9px}.homeStats{gap:6px}}
`;
document.head.appendChild(style);

function setupVisible(){const el=document.querySelector('#setup');return !!el&&!el.classList.contains('hidden')}
function currentSetupStep(){const title=(document.querySelector('#setupTitle')?.textContent||'').trim();if(title.includes('Hva er viktig'))return 0;if(title.includes('Bygg husholdningen'))return 1;if(title.includes('Slik blir Flyt'))return 2;const body=(document.querySelector('#setupBody')?.textContent||'');if(body.includes('Hva skal Flyt hjelpe'))return 0;if(body.includes('Hva gjør dere'))return 1;if(body.includes('Dette er deres oppsett')||body.includes('Dette er deres uke'))return 2;return 0}
function finishSetup(){const b=window.FlytBridge,s=b?.getState?.();if(s)b.setState({...s,setupDone:true});document.querySelector('#setup')?.classList.add('hidden');const view=b?.getState?.()?.view;if(view==='tasks')window.FlytTasksUI?.render?.({resetScroll:true});else window.FlytHomeUI?.render?.({resetScroll:true});window.FlytSync?.queueSave?.()}

window.addEventListener('click',e=>{
 if(!setupVisible())return;
 const next=e.target.closest?.('#setupNext');
 const back=e.target.closest?.('#setupBack');
 if(!next&&!back)return;
 const api=window.FlytTasksUI;
 if(!api?.openSetup)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 const step=currentSetupStep();
 if(back){if(step>0)api.openSetup(step-1);return}
 if(step<2){api.openSetup(step+1);return}
 finishSetup();
},true);
})();