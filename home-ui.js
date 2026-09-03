(()=>{
'use strict';
const $=s=>document.querySelector(s);
const bridge=()=>window.FlytBridge;
const VERSION='20260903-1800';
let partnerCtx=null,loadingPartner=false,statusEditorOpen=false,statusDraft=null,statusSaving=false,statusError='';
const LABEL={low:'Lav',med:'Middels',high:'Høy'};
const NEED_LABEL={relief:'Avlastning',closeness:'Nærhet',sex:'Intimitet',initiative:'Initiativ',alone:'Alenetid',quiet:'Ro'};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function taskReference(value){return window.FlytTaskLanguage?.taskReference?.(value)||`oppgaven «${String(value||'gjøremålet').trim()}»`}
function today(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function isoToday(){const n=new Date().getDay();return n===0?7:n}
function preferredDays(t){return [...new Set((Array.isArray(t?.preferredDays)?t.preferredDays:[]).map(Number).filter(n=>n>=1&&n<=7))]}
function scheduledToday(t){const days=preferredDays(t);return !days.length||days.includes(isoToday())}
function greeting(){const h=new Date().getHours();if(h<6)return 'Hei';if(h<10)return 'God morgen';if(h<17)return 'God dag';return 'God kveld'}
function todayComps(s){const d=today();return (s.completions||[]).filter(c=>c.date===d)}
function dailyTasks(s){return (s.tasks||[]).filter(t=>t.kind==='house'&&t.type==='daily')}
function todayTasks(s){return window.FlytDayPlan?.planTasks?.(s,today())||dailyTasks(s).filter(scheduledToday)}
function dayPlanProgress(s){const fromLoop=window.FlytDailyLoop?.dayProgress?.(s,today());if(fromLoop)return fromLoop;const fromModule=window.FlytDayPlan?.progress?.(s,today());if(fromModule)return{...fromModule,remaining:Math.max(0,fromModule.total-fromModule.done),pct:fromModule.total?Math.round(fromModule.done/fromModule.total*100):0};const tasks=todayTasks(s),doneIds=new Set(todayComps(s).map(c=>String(c.taskId))),done=tasks.filter(t=>doneIds.has(String(t.id))).length;return{done,total:tasks.length,remaining:Math.max(0,tasks.length-done),pct:tasks.length?Math.round(done/tasks.length*100):0,tasks}}
function currentName(s){const n=window.FlytSync?.myName?.();return String(n||s.user||'Meg').trim()||'Meg'}
function partnerName(s){const fromRpc=partnerCtx?.partner?.display_name;if(fromRpc)return fromRpc;const members=window.FlytSync?.getContext?.()?.members||[],p=members.find(m=>m.display_name&&m.display_name!==s?.user);return p?.display_name||Object.keys(s?.points||{}).find(n=>n!==s?.user)||'Partner'}
function age(ts){if(!ts)return 'Ikke oppdatert ennå';const m=Math.max(0,Math.round((Date.now()-new Date(ts).getTime())/60000));if(m<2)return 'Oppdatert nå';if(m<60)return `Oppdatert for ${m} min siden`;const h=Math.round(m/60);if(h<24)return `Oppdatert for ${h} t siden`;return `Oppdatert for ${Math.round(h/24)} d siden`}
function dailyApi(){return window.FlytDailyStatus}
function localStatus(s){return s?.status?.[currentName(s)]||null}
function myStatus(s){return partnerCtx?.me?.status||localStatus(s)}
function freshDaily(status){return dailyApi()?.current?.(status,{kind:'daily'})||null}
function dailyStamp(status){return dailyApi()?.updatedAt?.(status,'daily')||status?.updated_at||null}
function cleanNeeds(values){return dailyApi()?.cleanNeeds?.(values)||[]}
function startStatusDraft(s){const current=freshDaily(myStatus(s));statusDraft={capacity:current?.capacity||'',needs:cleanNeeds(current?.needs),notify:false};statusError=''}
function statusNeedButtons(){const needs=dailyApi()?.NEEDS||[];return needs.map(([key,label])=>`<button type="button" class="need ${(statusDraft?.needs||[]).includes(key)?'on':''}" data-home-status-need="${key}" aria-pressed="${(statusDraft?.needs||[]).includes(key)}">${esc(label)}</button>`).join('')}
function statusEditorMarkup(s){const options=[['low','Lite å gå på'],['med','Som vanlig'],['high','Godt med overskudd']];return `<div style="margin-top:13px"><div style="font-weight:850;line-height:1.35">Hvor mye har du å gå på i dag?</div><div class="segments" style="grid-template-columns:1fr;margin-top:9px">${options.map(([value,label])=>`<button type="button" data-home-status-level="${value}" class="${statusDraft?.capacity===value?'on':''}" aria-pressed="${statusDraft?.capacity===value}">${label}</button>`).join('')}</div><div style="font-weight:850;margin-top:16px">Hva hadde hjulpet?</div><div class="taskmeta" style="margin-top:4px">Valgfritt. Velg gjerne flere.</div><div class="grid2" style="margin-top:9px">${statusNeedButtons()}</div>${hasPartner()?`<label style="display:flex;align-items:flex-start;gap:10px;margin-top:15px;padding:11px 12px;border:1px solid var(--line);border-radius:14px;background:#fff"><input id="homeStatusNotify" type="checkbox" ${statusDraft?.notify?'checked':''} style="margin-top:3px;accent-color:var(--accent)"><span><strong style="display:block;font-size:14px">Varsle ${esc(partnerName(s))}</strong><span class="taskmeta" style="display:block">Bruk dette bare når endringen bør få oppmerksomhet.</span></span></label>`:''}${statusError?`<p role="alert" style="color:#a63c31;font-weight:750;margin:12px 0 0">${esc(statusError)}</p>`:''}<div style="display:grid;grid-template-columns:1fr 1.35fr;gap:9px;margin-top:14px"><button type="button" class="secondary" data-home-status-cancel ${statusSaving?'disabled':''}>Avbryt</button><button type="button" class="primary" data-home-status-save ${statusSaving||!statusDraft?.capacity?'disabled':''}>${statusSaving?'Lagrer…':'Oppdater dagsform'}</button></div></div>`}
function partnerStatusMarkup(s){if(!hasPartner())return'';const name=partnerName(s),status=freshDaily(partnerCtx?.partner?.status);if(!status)return `<div class="row" data-home-partner-status style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><strong class="grow">${esc(name)}</strong><span class="taskmeta">Ikke oppdatert i dag</span></div>`;const label=dailyApi()?.capacityLabel?.(status.capacity)||LABEL[status.capacity]||'Oppdatert',needs=cleanNeeds(status.needs);return `<div data-home-partner-status style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><div class="row"><strong class="grow">${esc(name)} · ${esc(label)}</strong><span class="taskmeta">${age(dailyStamp(status))}</span></div>${needs.length?`<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:8px">${needs.slice(0,3).map(value=>`<span class="tag">${esc(dailyApi()?.needLabel?.(value)||value)}</span>`).join('')}</div>`:''}</div>`}
function dailyStatusMarkup(s){const raw=myStatus(s),status=freshDaily(raw),needs=cleanNeeds(status?.needs),partner=partnerStatusMarkup(s);if(statusEditorOpen){if(!statusDraft)startStatusDraft(s);return `<section class="card" data-home-status-card data-home-couple-status style="margin:14px 0;border-color:#e6cfc4;background:linear-gradient(145deg,#fffdfb,#fff1e9)"><div class="ey">Dagsform · dere i dag</div>${statusEditorMarkup(s)}${partner}</section>`}if(!status)return `<section class="card" data-home-status-card data-home-couple-status style="margin:14px 0;border-color:#e6cfc4;background:linear-gradient(145deg,#fffdfb,#fff4ed)"><div class="row"><div class="grow"><div class="ey">Dagsform · dere i dag</div><strong style="display:block;font:600 21px/1.2 Georgia;margin-top:6px">Hvordan er dagsformen din?</strong><div class="taskmeta" style="margin-top:6px">Ikke oppdatert i dag</div></div><button type="button" class="small" data-home-status-edit>Sjekk inn</button></div>${partner}</section>`;const label=dailyApi()?.capacityLabel?.(status.capacity)||LABEL[status.capacity]||'Oppdatert';return `<section class="card" data-home-status-card data-home-couple-status style="margin:14px 0;border-color:#e0dac6;background:linear-gradient(145deg,#fffdfb,#f7f5eb)"><div class="row"><div class="grow"><div class="ey">Dagsform · dere i dag</div><strong style="display:block;font:600 21px/1.2 Georgia;margin-top:6px">Du har ${esc(label.toLowerCase())}</strong><div class="taskmeta" style="margin-top:5px">${age(dailyStamp(status))}</div></div><button type="button" class="small" data-home-status-edit>Endre</button></div>${needs.length?`<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:12px">${needs.map(value=>`<span class="tag">${esc(dailyApi()?.needLabel?.(value)||value)}</span>`).join('')}</div>`:''}${partner}</section>`}
function statusSummaryMarkup(status){if(!status)return '<div style="margin-top:13px;color:var(--muted);font-size:14px">Har ikke oppdatert dagsformen i dag.</div>';const needs=cleanNeeds(status.needs),capacity=dailyApi()?.capacityLabel?.(status.capacity)||LABEL[status.capacity]||'Oppdatert';return `<div style="margin-top:14px;padding:12px 13px;border:1px solid #efd8cf;border-radius:15px;background:#fffaf7"><div style="font-size:15.5px;line-height:1.45;color:var(--ink)"><strong>${esc(capacity)}</strong></div>${needs.length?`<div style="margin-top:7px;font-size:15px;line-height:1.4;color:var(--deep);font-weight:700">Trenger: <strong>${esc(needs.slice(0,3).map(value=>dailyApi()?.needLabel?.(value)||NEED_LABEL[value]||value).join(' · '))}</strong></div>`:''}</div>`}
function journeyKey(s){const id=window.FlytSync?.getContext?.()?.user_id;return id?`user:${id}`:`name:${currentName(s)}`}
function firstWinSeen(s){return new Set(Array.isArray(s?.coupleJourney?.firstWinSeenBy)?s.coupleJourney.firstWinSeenBy:[]).has(journeyKey(s))}
function markFirstWinSeen(s){const key=journeyKey(s),seen=new Set(Array.isArray(s?.coupleJourney?.firstWinSeenBy)?s.coupleJourney.firstWinSeenBy:[]);seen.add(key);bridge()?.setState?.({...s,coupleJourney:{...(s.coupleJourney||{}),firstWinSeenBy:[...seen]}});window.FlytSync?.queueSave?.()}
function hasPartner(){const context=window.FlytSync?.getContext?.();return (context?.members||[]).some(member=>String(member.id)!==String(context?.user_id))}
function firstWinMarkup(s){
  if(!s?.setupDone||!hasPartner()||!window.FlytCoupleInsights)return'';
  const win=window.FlytCoupleInsights.firstSharedWin(s),name=partnerName(s);
  if(win.stage==='completed'){
    if(firstWinSeen(s))return'';
    return `<section class="card" data-first-win-card="completed" style="margin:14px 0;border-color:#dce5ce;background:linear-gradient(145deg,#fbfdf7,#edf3e5)"><div class="row" style="align-items:flex-start"><div aria-hidden="true" style="width:44px;height:44px;display:grid;place-items:center;border-radius:15px;background:#fff;font-size:24px">✓</div><div class="grow"><div class="ey" style="color:#607644">Første felles seier</div><strong style="display:block;font:600 21px/1.2 Georgia;margin-top:5px">Dere fullførte ${esc(taskReference(win.taskName))} sammen</strong><p class="sub" style="margin:7px 0 0">Én tok initiativ eller spurte. Den andre svarte. Handlingen ble gjort. Det er Flyt-løkken.</p></div></div><button type="button" class="primary full" data-first-win-finish="1" style="margin-top:14px">Se hva dere får til sammen</button></section>`;
  }
  if(win.stage==='awaiting'){
    const mine=win.request?.by===s.user;
    return `<section class="card" data-first-win-card="awaiting" style="margin:14px 0;border-color:#dfe6d2;background:linear-gradient(145deg,#fffdf9,#f4f5eb)"><div class="ey">Første felles seier · nesten i mål</div><strong style="display:block;font:600 21px/1.2 Georgia;margin-top:6px">${mine?'Din del er gjort':`${name} har fullført ${esc(taskReference(win.taskName))}`}</strong><p class="sub" style="margin:7px 0 0">${mine?`Når ${esc(name)} har sett det, er den første felles løkken komplett.`:'Se handlingen og send gjerne et lite takk. Da lander seieren hos dere begge.'}</p><button type="button" class="primary full" data-home-destination="seen" style="margin-top:14px">Åpne Sett</button></section>`;
  }
  if(win.stage==='started'||win.stage==='accepted'){
    const mine=win.request?.by===s.user,label=win.stage==='accepted'?'Avtalt – nå gjenstår handlingen':mine?`Invitasjonen til samarbeid er sendt`:`${name} har startet deres første felles seier`;
    return `<section class="card" data-first-win-card="active" style="margin:14px 0;border-color:#e7cfc4;background:linear-gradient(145deg,#fffdf9,#fff1e9)"><div class="ey">Første felles seier · ${win.stage==='accepted'?'2 av 3':'1 av 3'}</div><strong style="display:block;font:600 21px/1.2 Georgia;margin-top:6px">${esc(label)}</strong><p class="sub" style="margin:7px 0 0">${esc(win.taskName)} · ${win.stage==='accepted'?'Når den er utført, har dere fullført hele løkken.':'Se og svar i Sett.'}</p><button type="button" class="primary full" data-home-destination="seen" style="margin-top:14px">${win.stage==='accepted'?'Fullfør i Sett':'Åpne Sett'}</button></section>`;
  }
  return'';
}
function progressRing(pct,label){const value=Math.min(100,Math.max(0,Number(pct)||0));return `<div class="progressRing" style="--progress:${value}" role="img" aria-label="${esc(label||`${value} prosent fullført`)}"><span>${value} %</span></div>`}
function dailyGoalMarkup(plan){
  const detail=!plan.total?'Ingen oppgaver er planlagt i dag.':plan.remaining===0?'<span class="goalReached">Dagens mål nådd ✓</span>':`<p>${plan.remaining} ${plan.remaining===1?'igjen':'igjen'}</p>`;
  return `<section class="card goalCard" data-home-daily-goal><div class="ey">Dagens mål</div><div class="goalGrid">${progressRing(plan.pct)}<div class="goalNumbers"><strong>${plan.done} av ${plan.total} ferdig</strong>${detail}</div></div><button type="button" class="secondary full goalAction" data-home-day-plan-open="1" data-home-destination="tasks">Se dagens gjøremål</button></section>`;
}
function startFirstWin(taskId){const s=bridge()?.getState?.(),task=(s?.tasks||[]).find(item=>String(item.id)===String(taskId));if(!s||!task)return;const item=window.FlytCoupleCore?.makeInitiative?.({state:s,task,partnerName:partnerName(s)})||null;if(!item)return;bridge().setState({...s,seenRequests:[{...item,journeyKey:'first_shared_win'},...(s.seenRequests||[])],coupleJourney:{...(s.coupleJourney||{}),firstWinStartedAt:s.coupleJourney?.firstWinStartedAt||new Date().toISOString()}});window.FlytSync?.queueSave?.();bridge()?.toast?.(`Første felles seier er startet med ${taskReference(task.name)}`);render({resetScroll:false});window.FlytSeenRequestAlert?.checkAlerts?.()}
async function loadPartner(force=false){if((loadingPartner&&!force)||!window.FlytSync?.rpc||!window.FlytSync?.getContext?.()?.user_id)return;loadingPartner=true;try{const {data,error}=await window.FlytSync.rpc('get_home_partner_context');if(error)throw error;let next=data||null;if(next&&!next.me){const detail=await window.FlytSync.rpc('get_oss_context');if(!detail.error){const userId=detail.data?.user_id,status=(detail.data?.statuses||[]).find(item=>String(item.user_id)===String(userId))||null,member=(detail.data?.members||[]).find(item=>String(item.id)===String(userId))||null;next={...next,me:{user_id:userId,display_name:member?.display_name||currentName(bridge()?.getState?.()),status}}}}partnerCtx=next;if(bridge()?.getState?.()?.view==='home')render({resetScroll:false})}catch(e){console.warn('Flyt Hjem-status kunne ikke hentes',e)}finally{loadingPartner=false}}
async function saveHomeStatus(){
  const s=bridge()?.getState?.();
  if(!s||statusSaving||!dailyApi()?.validCapacity?.(statusDraft?.capacity))return;
  const next={capacity:statusDraft.capacity,needs:cleanNeeds(statusDraft.needs),notify:!!statusDraft.notify},previous=myStatus(s),now=new Date().toISOString(),context=window.FlytSync?.getContext?.();
  statusSaving=true;statusError='';render({resetScroll:false});
  try{
    if(context?.user_id&&window.FlytSync?.rpc){
      const {error}=await window.FlytSync.rpc('save_my_daily_status',{p_capacity:next.capacity,p_needs:next.needs,p_notify:next.notify});
      if(error)throw error;
      partnerCtx={...(partnerCtx||{}),me:{...(partnerCtx?.me||{}),user_id:context.user_id,display_name:currentName(s),status:{...(previous||{}),capacity:next.capacity,needs:next.needs,daily_updated_at:now,updated_at:now}}};
    }else{
      const legacy=dailyApi()?.fallbackLegacyFields?.(previous,next.capacity)||{energy:next.capacity,capacity:next.capacity,closeness:'med',desire:'med',stress:'med'};
      bridge().setState({...s,status:{...(s.status||{}),[currentName(s)]:{...(previous||{}),...legacy,needs:next.needs,daily_updated_at:now,updated_at:now}}});
    }
    statusEditorOpen=false;statusDraft=null;bridge()?.toast?.('Dagsformen er oppdatert');
    window.FlytNudgeUI?.refreshStatus?.(true);
    if(context?.user_id)await loadPartner(true);
  }catch(error){console.warn('Flyt dagsform kunne ikke lagres',error);statusError='Kunne ikke lagre dagsformen akkurat nå. Prøv igjen.'}
  finally{statusSaving=false;render({resetScroll:false})}
}
function settleScroll(c,pos,forceTop){const target=forceTop?0:Math.max(0,pos||0);c.style.overflowAnchor='none';const apply=()=>{c.scrollTop=target};apply();requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});setTimeout(()=>{apply();c.style.overflowAnchor=''},90)}
function render({resetScroll=false}={}){
  const s=bridge()?.getState?.(),c=$('#content');
  if(!s||!c||s.view!=='home')return;
  const pos=resetScroll?0:c.scrollTop,name=currentName(s),plan=dayPlanProgress(s);
  c.dataset.flytOwner='home';
  const first=firstWinMarkup(s);
  c.innerHTML=`<div class="ey">Hjem</div><h1 class="title">Dere i dag</h1><p class="sub">${greeting()}, ${esc(name)}.</p>${dailyStatusMarkup(s)}${dailyGoalMarkup(plan)}<div id="homeNudgeMount" ${first?'data-first-win-active="1"':''} aria-live="polite">${first}</div>`;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.view==='home'));
  settleScroll(c,pos,resetScroll);
  if(!partnerCtx&&!loadingPartner)loadPartner();
  queueMicrotask(()=>window.FlytNudgeUI?.augment?.());
}
function claim({resetScroll=false}={}){const s=bridge()?.getState?.();if(s?.view!=='home')return false;render({resetScroll});return document.querySelector('#content')?.dataset.flytOwner==='home'}
document.addEventListener('click',e=>{
  const nav=e.target.closest('#nav button[data-view="home"]');
  if(nav){e.preventDefault();e.stopImmediatePropagation();nav.blur?.();const s=bridge()?.getState?.();if(s&&s.view!=='home')bridge().setState({...s,view:'home'});partnerCtx=null;statusEditorOpen=false;statusDraft=null;render({resetScroll:true});window.FlytNudgeUI?.refreshStatus?.(true);return}
  if(bridge()?.getState?.()?.view!=='home')return;
  const dayPlan=e.target.closest('[data-home-day-plan-open]');
  if(dayPlan){e.preventDefault();e.stopImmediatePropagation();dayPlan.blur?.();const s=bridge().getState();bridge().setState({...s,view:'tasks'});queueMicrotask(()=>window.FlytRecurrenceUI?.openToday?.('remaining')||window.FlytTasksUI?.render?.({resetScroll:true}));return}
  const edit=e.target.closest('[data-home-status-edit]');
  if(edit){e.preventDefault();e.stopImmediatePropagation();statusEditorOpen=true;startStatusDraft(bridge().getState());render({resetScroll:false});return}
  const cancel=e.target.closest('[data-home-status-cancel]');
  if(cancel){e.preventDefault();e.stopImmediatePropagation();statusEditorOpen=false;statusDraft=null;statusError='';render({resetScroll:false});return}
  const level=e.target.closest('[data-home-status-level]');
  if(level){e.preventDefault();e.stopImmediatePropagation();if(!statusDraft)startStatusDraft(bridge().getState());statusDraft.capacity=level.dataset.homeStatusLevel;statusError='';render({resetScroll:false});return}
  const need=e.target.closest('[data-home-status-need]');
  if(need){e.preventDefault();e.stopImmediatePropagation();if(!statusDraft)startStatusDraft(bridge().getState());const key=need.dataset.homeStatusNeed,index=statusDraft.needs.indexOf(key);index>=0?statusDraft.needs.splice(index,1):statusDraft.needs.push(key);statusDraft.needs=cleanNeeds(statusDraft.needs);render({resetScroll:false});return}
  const save=e.target.closest('[data-home-status-save]');
  if(save){e.preventDefault();e.stopImmediatePropagation();saveHomeStatus();return}
  const start=e.target.closest('[data-first-win-start]');
  if(start){e.preventDefault();e.stopImmediatePropagation();startFirstWin(start.dataset.firstWinStart);return}
  const finish=e.target.closest('[data-first-win-finish]');
  if(finish){e.preventDefault();e.stopImmediatePropagation();const s=bridge().getState();markFirstWinSeen(s);bridge().setState({...bridge().getState(),view:'us'});queueMicrotask(()=>window.FlytOss?.render?.({refresh:true,resetScroll:true}));return}
  const destination=e.target.closest('[data-home-destination]');
  if(destination){e.preventDefault();e.stopImmediatePropagation();const next=destination.dataset.homeDestination,s=bridge().getState();if(!['seen','rewards','us','tasks'].includes(next)||!s)return;bridge().setState({...s,view:next});queueMicrotask(()=>next==='seen'?window.FlytSeenUI?.render?.():next==='rewards'?window.FlytRewardsUI?.render?.():next==='tasks'?window.FlytRecurrenceUI?.render?.({resetScroll:true}):window.FlytOss?.render?.({refresh:true,resetScroll:true}));return}
},true);
document.addEventListener('change',e=>{if(e.target?.id==='homeStatusNotify'&&statusDraft){statusDraft.notify=!!e.target.checked}},true);
window.FlytHomeUI={render,claim,version:VERSION};
const claimSoon=()=>queueMicrotask(()=>claim({resetScroll:false}));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',claimSoon,{once:true});else claimSoon();
window.addEventListener('pageshow',claimSoon);
})();
