(()=>{
'use strict';
const DEFAULT_TASKS=[
{id:'dish_empty',cat:'Kjøkken',name:'Tømme oppvaskmaskin',freq:7,pts:20,type:'daily',kind:'house'},
{id:'dish_fill',cat:'Kjøkken',name:'Fylle oppvaskmaskin',freq:7,pts:20,type:'daily',kind:'house'},
{id:'kitchen',cat:'Kjøkken',name:'Rydde kjøkken',freq:7,pts:25,type:'daily',kind:'house'},
{id:'counter',cat:'Kjøkken',name:'Vaske kjøkkenbenken',freq:7,pts:15,type:'daily',kind:'house'},
{id:'dinner',cat:'Kjøkken',name:'Lage middag',freq:5,pts:40,type:'daily',kind:'house'},
{id:'lunch',cat:'Barn',name:'Lage matpakker',freq:5,pts:25,type:'daily',kind:'house'},
{id:'bag',cat:'Barn',name:'Pakke sekk til barna',freq:5,pts:15,type:'daily',kind:'house'},
{id:'bedkids',cat:'Barn',name:'Legging',freq:7,pts:35,type:'daily',kind:'house'},
{id:'bath',cat:'Bad',name:'Vaske bad',freq:1,pts:70,type:'flex',kind:'house'},
{id:'living',cat:'Stue',name:'Rydde stuen',freq:3,pts:25,type:'flex',kind:'house'},
{id:'laundry',cat:'Vask & klær',name:'Vaske/brette klær',freq:3,pts:45,type:'flex',kind:'house'},
{id:'trash',cat:'Vedlikehold',name:'Søppel/pant',freq:2,pts:25,type:'flex',kind:'house'},
{id:'train',cat:'Personlig investering',name:'Trening',freq:3,pts:40,type:'flex',kind:'personal'}
];
function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'}
function rescue(){const app=document.querySelector('.app'),gate=document.querySelector('#betaGate'),legacy=document.querySelector('#login');if(visible(app)||visible(gate)||visible(legacy))return;const box=document.createElement('div');box.id='flytRescue';box.className='login';box.innerHTML='<div class="loginbox"><div class="logo">fl<b>y</b>t</div><div class="ey">Oppstart</div><h1 style="font:500 30px Georgia">Flyt fikk ikke startet</h1><p class="sub">Ingen data er slettet. Last siden på nytt for å prøve igjen.</p><button id="flytReload" class="primary full">Last inn Flyt på nytt</button></div>';document.body.appendChild(box);document.querySelector('#flytReload').onclick=()=>location.reload()}
function restoreOwnedView(view){if(view==='home'&&window.FlytHomeUI?.render){queueMicrotask(()=>window.FlytHomeUI.render({resetScroll:false}));return}if(view==='tasks'&&window.FlytTasksUI?.render){queueMicrotask(()=>{window.FlytTasksUI.render({resetScroll:false});setTimeout(()=>window.FlytPlannedUI?.paint?.(),0)});return}if(view==='us'&&window.FlytOss?.render){queueMicrotask(()=>window.FlytOss.render({refresh:false}));return}if(view==='seen'&&window.FlytSeenUI?.render){queueMicrotask(()=>window.FlytSeenUI.render())}}
function installRenderGuard(){const b=window.FlytBridge;if(!b||b.__stabilityWrapped)return false;const original=b.setState?.bind(b);if(!original)return false;b.setState=next=>{original(next);restoreOwnedView(next?.view)};b.__stabilityWrapped=true;restoreOwnedView(b.getState?.()?.view);return true}
function keepGuardAlive(){if(installRenderGuard())return;let tries=0;const timer=setInterval(()=>{tries++;if(installRenderGuard()||tries>40)clearInterval(timer)},100)}
function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'1');document.head.appendChild(s)}
function loadPlanned(){if(window.FlytPlannedUI)return;loadScript('./planned-ui.js?v=20260825-0012','flyt-planned')}
function loadDayCompleted(){if(window.FlytTasksDayCompleted)return;loadScript('./tasks-day-completed-ui.js?v=20260824-1350','flyt-day-completed')}
function loadModal(){if(window.FlytModal)return;loadScript('./modal-ui.js?v=20260824-1414','flyt-modal')}
function loadCustomCategories(){if(window.FlytCustomCategories)return;loadScript('./custom-categories-ui.js?v=20260824-1548','flyt-custom-categories')}
function loadRecurrence(){if(window.FlytRecurrenceUI)return;loadScript('./recurrence-ui.js?v=20260824-2354','flyt-recurrence')}
function loadBeta(){if(window.FlytBetaUI)return;loadScript('./beta-ui.js?v=20260824-1628','flyt-beta')}
function loadResponsive(){if(document.querySelector('#flytResponsiveUi'))return;loadScript('./responsive-ui.js?v=20260825-0648','flyt-responsive')}
function loadRewardsEditGuard(){if(window.FlytRewardsEditGuard)return;loadScript('./rewards-edit-guard.js?v=20260825-0708','flyt-rewards-edit')}
function loadSetupNavGuard(){if(window.FlytSetupNavGuard)return;loadScript('./setup-nav-guard.js?v=20260825-0712','flyt-setup-nav')}
function loadHome(){if(window.FlytHomeUI)return;loadScript('./home-ui.js?v=20260824-1945','flyt-home-current')}
async function modal(){if(window.FlytModal)return window.FlytModal;loadModal();for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,50));if(window.FlytModal)return window.FlytModal}return null}
function snapshot(s,label){return{id:Date.now()+'_'+Math.random().toString(36).slice(2,6),savedAt:new Date().toISOString(),label,tasks:structuredClone(s.tasks||[]),custom:structuredClone(s.custom||[]),areas:structuredClone(s.areas||{}),trainingFor:structuredClone(s.trainingFor||{}),categoryRelevant:structuredClone(s.categoryRelevant||{})}}
function archive(s,label){const hist=Array.isArray(s.setupHistory)?[...s.setupHistory]:[],snap=snapshot(s,label);hist.unshift(snap);return hist.slice(0,5)}
function bridge(){return window.FlytBridge}
function saveState(next){const b=bridge();if(!b)return;b.setState(next);window.FlytSync?.queueSave?.()}
async function askConfirm(opts){const m=await modal();return m?m.confirm(opts):false}
async function askPrompt(opts){const m=await modal();return m?m.prompt(opts):null}
document.addEventListener('click',async e=>{
 const reset=e.target.closest('#resetActiveTasks,#resetTasks');
 if(reset){e.preventDefault();e.stopImmediatePropagation();const yes=await askConfirm({ey:'Oppsett',title:'Tilbakestille aktive gjøremål?',text:'Historikk, poeng og statistikk beholdes.',ok:'Tilbakestill'});if(!yes)return;const b=bridge(),s=b?.getState?.();if(!s)return;const relevant=s.categoryRelevant||{},tasks=DEFAULT_TASKS.filter(t=>relevant[t.cat]!==false).map(t=>({...t,owner:'Begge'}));saveState({...s,tasks,custom:reset.id==='resetTasks'?[]:(s.custom||[]),setupHistory:archive(s,'Før tilbakestilling')});window.FlytTasksUI?.openSetup?.(1);b.toast?.('Gjøremål er tilbakestilt');return}
 const restore=e.target.closest('[data-setup-restore]');
 if(restore){e.preventDefault();e.stopImmediatePropagation();const b=bridge(),s=b?.getState?.(),snap=(s?.setupHistory||[]).find(x=>String(x.id)===String(restore.dataset.setupRestore));if(!s||!snap)return;const yes=await askConfirm({ey:'Oppsett',title:'Gjenopprette oppsett?',text:'Historikk og statistikk beholdes.',ok:'Gjenopprett'});if(!yes)return;saveState({...s,tasks:structuredClone(snap.tasks||[]),custom:structuredClone(snap.custom||[]),areas:structuredClone(snap.areas||s.areas||{}),trainingFor:structuredClone(snap.trainingFor||s.trainingFor||{}),categoryRelevant:structuredClone(snap.categoryRelevant||{}),setupHistory:archive(s,'Før gjenoppretting')});window.FlytTasksUI?.openSetup?.(1);b.toast?.('Oppsettet er gjenopprettet');return}
 const custom=e.target.closest('#addCustomTask,#customTask');
 if(custom){e.preventDefault();e.stopImmediatePropagation();if(window.FlytCustomCategories?.openGeneral){await window.FlytCustomCategories.openGeneral();return}const name=await askPrompt({ey:'Oppsett',title:'Legg til egendefinert oppgave',label:'Navn på oppgaven',placeholder:'F.eks. Rydde boden',ok:'Legg til'});if(!name?.trim())return;const b=bridge(),s=b?.getState?.();if(!s)return;const x={id:'custom_'+Date.now(),cat:'Egendefinert',name:name.trim(),freq:1,pts:30,type:'flex',kind:'house'};saveState({...s,custom:[...(s.custom||[]),x],tasks:[...(s.tasks||[]),{...x,owner:'Begge'}]});window.FlytTasksUI?.openSetup?.(1);return}
 const seen=e.target.closest('#seenAdd,#addWork');
 if(seen){e.preventDefault();e.stopImmediatePropagation();const title=await askPrompt({ey:'Sett',title:'Legg til bidrag',text:'Registrer noe som ellers lett kunne gått ubemerket hen.',label:'Hva gjorde du?',placeholder:'F.eks. ordnet avtalen med tannlegen',ok:'Legg til'});if(!title?.trim())return;const b=bridge(),s=b?.getState?.();if(!s)return;const now=Date.now(),work=[{id:now,title:title.trim(),by:s.user,seen:false,source:'manual',createdAt:now},...(s.work||[])];saveState({...s,work,view:'seen'});b.toast?.('Bidraget er lagt i Sett');return}
 const resetReward=e.target.closest('[data-reset-reward]');
 if(resetReward){e.preventDefault();e.stopImmediatePropagation();const b=bridge(),s=b?.getState?.(),rewards=[...(s?.rewards||[])],r=rewards.find(x=>String(x.id)===String(resetReward.dataset.resetReward)&&x.by===s.user);if(!s||!r)return;const yes=await askConfirm({ey:'Fristelser',title:'Tilbakestille fristelsen?',text:'Fristelsen blir åpen og krever ikke poeng.',ok:'Tilbakestill'});if(!yes)return;r.requiresPoints=false;r.cost=0;saveState({...s,rewards});b.toast?.('Fristelsen er tilbakestilt');return}
 const deleteReward=e.target.closest('[data-delete-reward]');
 if(deleteReward){e.preventDefault();e.stopImmediatePropagation();const b=bridge(),s=b?.getState?.(),rewards=[...(s?.rewards||[])],i=rewards.findIndex(x=>String(x.id)===String(deleteReward.dataset.deleteReward)&&x.by===s.user);if(!s||i<0)return;const yes=await askConfirm({ey:'Fristelser',title:'Slette fristelsen?',text:'Fristelsen fjernes permanent.',ok:'Slett'});if(!yes)return;rewards.splice(i,1);saveState({...s,rewards});b.toast?.('Fristelsen er slettet');return}
},true);
window.addEventListener('DOMContentLoaded',()=>{loadResponsive();loadHome();loadModal();loadPlanned();loadDayCompleted();loadCustomCategories();loadRecurrence();loadBeta();loadRewardsEditGuard();loadSetupNavGuard();keepGuardAlive();setTimeout(rescue,5000)});
window.addEventListener('error',()=>setTimeout(rescue,50));
window.addEventListener('unhandledrejection',()=>setTimeout(rescue,50));
})();