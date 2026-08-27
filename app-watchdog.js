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
function restoreOwnedView(view){if(view==='home'&&window.FlytHomeUI?.render){queueMicrotask(()=>window.FlytHomeUI.render({resetScroll:false}));return}if(view==='tasks'&&window.FlytTasksUI?.render){queueMicrotask(()=>{window.FlytTasksUI.render({resetScroll:false});setTimeout(()=>window.FlytPlannedUI?.paint?.(),0)});return}if(view==='us'&&window.FlytOss?.render){queueMicrotask(()=>window.FlytOss.render({refresh:false}));return}if(view==='seen'&&window.FlytSeenUI?.render){queueMicrotask(()=>window.FlytSeenUI.render());return}if(view==='rewards'&&window.FlytRewardsUI?.render){queueMicrotask(()=>{window.FlytRewardsUI.render();setTimeout(()=>window.FlytQuickTemptationUI?.augment?.(),0)});return}if(view==='rewards'&&window.FlytRewardsSummaryUI?.paint){queueMicrotask(()=>window.FlytRewardsSummaryUI.paint())}}
function installRenderGuard(){const b=window.FlytBridge;if(!b||b.__stabilityWrapped)return false;const original=b.setState?.bind(b);if(!original)return false;b.setState=next=>{original(next);restoreOwnedView(next?.view)};b.__stabilityWrapped=true;restoreOwnedView(b.getState?.()?.view);return true}
function keepGuardAlive(){if(installRenderGuard())return;let tries=0;const timer=setInterval(()=>{tries++;if(installRenderGuard()||tries>40)clearInterval(timer)},100)}
function homeMarkupIsModern(c){if(!c)return false;const text=c.textContent||'';return c.dataset.flytOwner==='home'&&!!c.querySelector('[data-homeui-mode]')&&!/Husholdningsmotor|Ukebanken/.test(text)}
function ensureHomeOwnership(){const b=window.FlytBridge,c=document.querySelector('#content');if(b?.getState?.()?.view!=='home')return true;if(window.FlytHomeUI?.version!=='20260827-2005'){loadHome();return false}if(homeMarkupIsModern(c))return true;window.FlytHomeUI.render?.({resetScroll:false});return homeMarkupIsModern(c)}
function guardHomeStartup(){[0,60,180,450,900,1600,3000].forEach(ms=>setTimeout(()=>ensureHomeOwnership(),ms))}
function loadScript(src,key,onload){const existing=document.querySelector(`script[data-${key}]`);if(existing){if(onload)existing.addEventListener('load',onload,{once:true});return}const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'1');if(onload)s.addEventListener('load',onload,{once:true});document.head.appendChild(s)}
function loadStartupHydration(){if(window.FlytStartupHydration?.version==='20260826-0746')return;loadScript('./startup-hydration-ui.js?v=20260826-0746','flyt-startup-hydration-0746')}
function loadBuyerPolish(){if(window.FlytBuyerPolish?.version==='20260827-2352')return;loadScript('./buyer-polish-ui.js?v=20260827-2352','flyt-buyer-polish-2352')}
function loadAccount(){if(window.FlytAccountUI?.version==='20260827-2350')return;loadScript('./account-ui.js?v=20260827-2350','flyt-account-2350')}
function loadPlanned(){if(window.FlytPlannedUI?.version==='20260827-0240')return;loadScript('./planned-ui.js?v=20260827-0240','flyt-planned-0240')}
function loadDayCompleted(){if(window.FlytTasksDayCompleted)return;loadScript('./tasks-day-completed-ui.js?v=20260824-1350','flyt-day-completed')}
function loadModal(){if(window.FlytModal)return;loadScript('./modal-ui.js?v=20260825-1933','flyt-modal')}
function loadCustomCategories(){if(window.FlytCustomCategories?.version==='20260827-0918')return;loadScript('./custom-categories-ui.js?v=20260827-0918','flyt-custom-categories-0918')}
function loadRecurrence(){if(window.FlytRecurrenceUI?.version==='20260827-2256')return;loadScript('./recurrence-ui.js?v=20260827-2256','flyt-recurrence-2256')}
function loadBeta(){if(window.FlytBetaUI)return;loadScript('./beta-ui.js?v=20260824-1628','flyt-beta')}
function loadResponsive(){if(document.querySelector('#flytResponsiveUi'))return;loadScript('./responsive-ui.js?v=20260825-0648','flyt-responsive')}
function loadSeen(){if(window.FlytSeenUI?.version==='20260827-2054')return;loadScript('./seen-ui.js?v=20260827-2054','flyt-seen-current-2054')}
function loadSeenRequestAlert(){if(window.FlytSeenRequestAlert?.version==='20260827-2056')return;loadScript('./seen-request-alert-ui.js?v=20260827-2056','flyt-seen-request-alert-2056')}
function loadRewardsEditGuard(){if(window.FlytRewardsEditGuard)return;loadScript('./rewards-edit-guard.js?v=20260825-2102','flyt-rewards-edit')}
function loadRewardsSummary(){if(window.FlytRewardsSummaryUI)return;loadScript('./rewards-summary-ui.js?v=20260825-1035','flyt-rewards-summary')}
function loadRewardsUI(){if(window.FlytRewardsUI)return;loadScript('./rewards-ui.js?v=20260825-2056','flyt-rewards-ui')}
function loadQuickTemptation(){if(window.FlytQuickTemptationUI)return;loadScript('./quick-temptation-ui.js?v=20260825-2210','flyt-quick-temptation')}
function loadSetupV2(){if(window.FlytSetupV2?.version==='20260827-1412')return;loadScript('./setup-v2.js?v=20260827-1412','flyt-setup-v2-1412')}
function loadHome(){if(window.FlytHomeUI?.version==='20260827-2005'){ensureHomeOwnership();return}loadScript('./home-ui.js?v=20260827-2005','flyt-home-current-2005',()=>queueMicrotask(ensureHomeOwnership))}
function loadHistory(){if(window.FlytHistoryUI?.version==='20260827-0108')return;loadScript('./history-ui.js?v=20260827-0108','flyt-history-0108')}
async function modal(){if(window.FlytModal)return window.FlytModal;loadModal();for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,50));if(window.FlytModal)return window.FlytModal}return null}
function snapshot(s,label){return{id:Date.now()+'_'+Math.random().toString(36).slice(2,6),savedAt:new Date().toISOString(),label,tasks:structuredClone(s.tasks||[]),custom:structuredClone(s.custom||[]),areas:structuredClone(s.areas||{}),trainingFor:structuredClone(s.trainingFor||{}),categoryRelevant:structuredClone(s.categoryRelevant||{})}}
function archive(s,label){const hist=Array.isArray(s.setupHistory)?[...s.setupHistory]:[],snap=snapshot(s,label);hist.unshift(snap);return hist.slice(0,5)}
function bridge(){return window.FlytBridge}
function saveState(next){const b=bridge();if(!b)return;b.setState(next);window.FlytSync?.queueSave?.()}
async function askConfirm(opts){const m=await modal();return m?m.confirm(opts):false}
async function askPrompt(opts){const m=await modal();return m?m.prompt(opts):null}
document.addEventListener('click',async e=>{
 const reset=e.target.closest('#resetActiveTasks,#resetTasks');
 if(reset){e.preventDefault();e.stopImmediatePropagation();const yes=await askConfirm({ey:'Oppsett',title:'Tilbakestille aktive gjøremål?',text:'Historikk, poeng og statistikk beholdes.',ok:'Tilbakestill'});if(!yes)return;const b=bridge(),s=b?.getState?.();if(!s)return;const relevant=s.categoryRelevant||{},tasks=DEFAULT_TASKS.filter(t=>relevant[t.cat]!==false).map(t=>({...t,owner:'Begge'}));saveState({...s,tasks,custom:reset.id==='resetTasks'?[]:(s.custom||[]),setupHistory:archive(s,'Før tilbakestilling')});window.FlytSetupV2?.open?.(1);b.toast?.('Gjøremål er tilbakestilt');return}
 const restore=e.target.closest('[data-setup-restore]');
 if(restore){e.preventDefault();e.stopImmediatePropagation();const b=bridge(),s=b?.getState?.(),snap=(s?.setupHistory||[]).find(x=>String(x.id)===String(restore.dataset.setupRestore));if(!s||!snap)return;const yes=await askConfirm({ey:'Oppsett',title:'Gjenopprette oppsett?',text:'Historikk og statistikk beholdes.',ok:'Gjenopprett'});if(!yes)return;saveState({...s,tasks:structuredClone(snap.tasks||[]),custom:structuredClone(snap.custom||[]),areas:structuredClone(snap.areas||s.areas||{}),trainingFor:structuredClone(snap.trainingFor||s.trainingFor||{}),categoryRelevant:structuredClone(snap.categoryRelevant||{}),setupHistory:archive(s,'Før gjenoppretting')});window.FlytSetupV2?.open?.(1);b.toast?.('Oppsettet er gjenopprettet');return}
 const custom=e.target.closest('#addCustomTask,#customTask');
 if(custom){e.preventDefault();e.stopImmediatePropagation();if(window.FlytCustomCategories?.openGeneral){await window.FlytCustomCategories.openGeneral();return}const name=await askPrompt({ey:'Oppsett',title:'Legg til egendefinert oppgave',label:'Navn på oppgaven',placeholder:'F.eks. Rydde boden',ok:'Legg til'});if(!name?.trim())return;const b=bridge(),s=b?.getState?.();if(!s)return;const x={id:'custom_'+Date.now(),cat:'Egendefinert',name:name.trim(),freq:1,pts:30,type:'flex',kind:'house'};saveState({...s,custom:[...(s.custom||[]),x],tasks:[...(s.tasks||[]),{...x,owner:'Begge'}]});window.FlytSetupV2?.open?.(1);return}
 const seen=e.target.closest('#seenAdd,#addWork');
 if(seen){e.preventDefault();e.stopImmediatePropagation();const title=await askPrompt({ey:'Sett',title:'Legg til bidrag',text:'Registrer noe som ellers lett kunne gått ubemerket hen.',label:'Hva gjorde du?',placeholder:'F.eks. ordnet avtalen med tannlegen',ok:'Legg til'});if(!title?.trim())return;const b=bridge(),s=b?.getState?.();if(!s)return;const now=Date.now(),work=[{id:now,title:title.trim(),by:s.user,seen:false,source:'manual',createdAt:now},...(s.work||[])];saveState({...s,work,view:'seen'});b.toast?.('Bidraget er lagt i Sett');return}
 const resetReward=e.target.closest('[data-reset-reward]');
 if(resetReward){e.preventDefault();e.stopImmediatePropagation();const b=bridge(),s=b?.getState?.(),rewards=[...(s?.rewards||[])],r=rewards.find(x=>String(x.id)===String(resetReward.dataset.resetReward)&&x.by===s.user);if(!s||!r)return;const yes=await askConfirm({ey:'Fristelser',title:'Tilbakestille fristelsen?',text:'Fristelsen blir åpen og krever ikke poeng.',ok:'Tilbakestill'});if(!yes)return;r.requiresPoints=false;r.cost=0;saveState({...s,rewards});b.toast?.('Fristelsen er tilbakestilt');return}
 const deleteReward=e.target.closest('[data-delete-reward]');
 if(deleteReward){e.preventDefault();e.stopImmediatePropagation();const b=bridge(),s=b?.getState?.(),rewards=[...(s?.rewards||[])],i=rewards.findIndex(x=>String(x.id)===String(deleteReward.dataset.deleteReward)&&x.by===s.user);if(!s||i<0)return;const yes=await askConfirm({ey:'Fristelser',title:'Slette fristelsen?',text:'Fristelsen fjernes permanent.',ok:'Slett'});if(!yes)return;rewards.splice(i,1);saveState({...s,rewards});b.toast?.('Fristelsen er slettet');return}
},true);
window.addEventListener('DOMContentLoaded',()=>{loadStartupHydration();loadBuyerPolish();loadAccount();loadResponsive();loadHome();loadModal();loadSeen();loadSeenRequestAlert();loadRewardsEditGuard();loadPlanned();loadDayCompleted();loadCustomCategories();loadRecurrence();loadBeta();loadRewardsSummary();loadRewardsUI();loadQuickTemptation();loadSetupV2();loadHistory();keepGuardAlive();guardHomeStartup();setTimeout(rescue,5000)});
window.addEventListener('pageshow',()=>{loadBuyerPolish();loadAccount();loadHome();window.FlytAccountUI?.checkConsent?.();guardHomeStartup()});
window.addEventListener('error',()=>setTimeout(rescue,50));
window.addEventListener('unhandledrejection',()=>setTimeout(rescue,50));
})();