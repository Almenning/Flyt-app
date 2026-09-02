(()=>{
'use strict';
const $=s=>document.querySelector(s);
const bridge=()=>window.FlytBridge;
const VERSION='20260902-1730';
let mode='day',partnerCtx=null,loadingPartner=false,statusEditorOpen=false,statusDraft=null,statusSaving=false,statusError='';
const LABEL={low:'Lav',med:'Middels',high:'Høy'};
const NEED_LABEL={relief:'Avlastning',closeness:'Nærhet',sex:'Intimitet',initiative:'Initiativ',alone:'Alenetid',quiet:'Ro'};
const FIELD_LABEL={energy:'Energi',capacity:'Overskudd',closeness:'Nærhet',desire:'Lyst',stress:'Stress'};
const QUICK_META={need:{label:'Behov',icon:'♡',tone:'#80558f',bg:'#f3edf7'},wish:{label:'Ønske',icon:'☆',tone:'#c85d35',bg:'#fff0e8'},practical:{label:'Praktisk',icon:'✓',tone:'#4d8464',bg:'#edf5ef'},reward:{label:'Poengbelønning',icon:'♢',tone:'#c84457',bg:'#faecef'}};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function taskReference(value){return window.FlytTaskLanguage?.taskReference?.(value)||`oppgaven «${String(value||'gjøremålet').trim()}»`}
function monday(){const d=new Date(),x=new Date(d),day=(x.getDay()+6)%7;x.setHours(0,0,0,0);x.setDate(x.getDate()-day);return x}
function today(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function monthKey(){return today().slice(0,7)}
function isoToday(){const n=new Date().getDay();return n===0?7:n}
function preferredDays(t){return [...new Set((Array.isArray(t?.preferredDays)?t.preferredDays:[]).map(Number).filter(n=>n>=1&&n<=7))]}
function scheduledToday(t){const days=preferredDays(t);return !days.length||days.includes(isoToday())}
function dayName(){return new Intl.DateTimeFormat('nb-NO',{weekday:'long'}).format(new Date()).replace(/^./,c=>c.toUpperCase())}
function greeting(){const h=new Date().getHours();if(h<6)return 'Hei';if(h<10)return 'God morgen';if(h<17)return 'God dag';return 'God kveld'}
function weekComps(s){const m=monday();return (s.completions||[]).filter(c=>new Date(c.date+'T12:00:00')>=m)}
function monthComps(s){const ym=monthKey();return (s.completions||[]).filter(c=>String(c.date||'').startsWith(ym))}
function todayComps(s){const d=today();return (s.completions||[]).filter(c=>c.date===d)}
function dailyTasks(s){return (s.tasks||[]).filter(t=>t.kind==='house'&&t.type==='daily')}
function todayTasks(s){return window.FlytDayPlan?.planTasks?.(s,today())||dailyTasks(s).filter(scheduledToday)}
function weeklyTasks(s){return (s.tasks||[]).filter(t=>t.kind==='house'&&t.type==='flex')}
function monthlyTasks(s){return (s.tasks||[]).filter(t=>t.kind==='house'&&t.type==='period')}
function goalFor(tasks){return tasks.reduce((a,t)=>a+Math.max(1,Number(t.freq||1))*Number(t.pts||0),0)}
function doneFor(comps,tasks){const ids=new Set(tasks.map(t=>String(t.id)));return comps.filter(c=>c.kind==='house'&&ids.has(String(c.taskId))).reduce((a,c)=>a+Number(c.housePts||0),0)}
function dailyGoal(s){return todayTasks(s).reduce((a,t)=>a+Number(t.pts||0),0)}
function doneToday(s){const completed=new Set(todayComps(s).filter(c=>c.kind==='house').map(c=>String(c.taskId)));return todayTasks(s).reduce((a,t)=>a+(completed.has(String(t.id))?Number(t.pts||0):0),0)}
function dayPlanProgress(s){const fromModule=window.FlytDayPlan?.progress?.(s,today());if(fromModule)return fromModule;const tasks=todayTasks(s),doneIds=new Set(todayComps(s).map(c=>String(c.taskId)));return{done:tasks.filter(t=>doneIds.has(String(t.id))).length,total:tasks.length,tasks}}
function todayPointTotal(s){return todayComps(s).reduce((sum,c)=>sum+Number(c.taskSnapshot?.pts??c.housePts??0),0)}
function totalWeekly(s){return goalFor([...dailyTasks(s),...weeklyTasks(s)])}
function doneWeekly(s){const cs=weekComps(s);return [...dailyTasks(s),...weeklyTasks(s)].reduce((sum,t)=>{const matches=cs.filter(c=>c.kind==='house'&&String(c.taskId)===String(t.id));const count=t.type==='daily'?new Set(matches.map(c=>String(c.date||''))).size:matches.length;const goal=Math.max(1,Number(t.freq||1));return sum+Math.min(goal,count)*Number(t.pts||0)},0)}
function totalMonthly(s){return goalFor(monthlyTasks(s))}
function doneMonthly(s){return doneFor(monthComps(s),monthlyTasks(s))}
function pct(done,goal){return goal?Math.min(100,Math.round(done/goal*100)):0}
function tabs(){return `<div class="segments homeSegments" style="grid-template-columns:repeat(3,minmax(0,1fr));margin:14px 0 18px"><button type="button" data-homeui-mode="day" class="${mode==='day'?'on':''}">${dayName()}</button><button type="button" data-homeui-mode="week" class="${mode==='week'?'on':''}">Uke</button><button type="button" data-homeui-mode="month" class="${mode==='month'?'on':''}">Måned</button></div>`}
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
function compactNeeds(status){const needs=cleanNeeds(status?.needs);return needs.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${needs.slice(0,3).map(value=>`<span class="tag" style="padding:5px 8px">${esc(dailyApi()?.needLabel?.(value)||value)}</span>`).join('')}</div>`:''}
function partnerStatusRow(s){const linked=hasPartner(),name=partnerName(s),status=freshDaily(partnerCtx?.partner?.status),waiting=linked&&!partnerCtx;if(!linked)return `<div data-home-partner-status style="padding:13px 14px;border-radius:17px;background:#fff2eb;border:1px solid #efd2c7"><strong style="display:block;font:600 19px/1.2 Georgia">Partner</strong><div class="taskmeta" style="margin-top:5px">Koble til partner for å dele dagsform.</div></div>`;if(waiting)return `<div data-home-partner-status style="padding:13px 14px;border-radius:17px;background:#fff2eb;border:1px solid #efd2c7"><strong style="display:block;font:600 19px/1.2 Georgia">${esc(name)}</strong><div class="taskmeta" style="margin-top:5px">Henter dagsform…</div></div>`;if(!status)return `<div data-home-partner-status style="padding:13px 14px;border-radius:17px;background:#fff2eb;border:1px solid #efd2c7"><div class="row"><div aria-hidden="true" style="width:39px;height:39px;flex:0 0 39px;border-radius:50%;display:grid;place-items:center;background:#fac0aa;color:#ad4a3c;font-size:22px">♡</div><div class="grow"><strong style="display:block;font:600 19px/1.2 Georgia">${esc(name)}</strong><div class="taskmeta" style="margin-top:4px">Ikke oppdatert i dag</div></div></div></div>`;const label=dailyApi()?.capacityLabel?.(status.capacity)||LABEL[status.capacity]||'Oppdatert';return `<div data-home-partner-status style="padding:13px 14px;border-radius:17px;background:linear-gradient(145deg,#fff0e8,#fff8f4);border:1px solid #eecabc"><div class="row" style="align-items:flex-start"><div aria-hidden="true" style="width:39px;height:39px;flex:0 0 39px;border-radius:50%;display:grid;place-items:center;background:#fac0aa;color:#ad4a3c;font-size:22px">♡</div><div class="grow"><strong style="display:block;font:600 19px/1.2 Georgia">${esc(name)} · ${esc(label)}</strong><div class="taskmeta" style="margin-top:4px">${age(dailyStamp(status))}</div>${compactNeeds(status)}</div></div></div>`}
function myStatusRow(s){const status=freshDaily(myStatus(s));if(statusEditorOpen){if(!statusDraft)startStatusDraft(s);return `<div data-home-my-status style="margin-top:13px;padding-top:13px;border-top:1px solid var(--line)"><div class="ey">Din dagsform</div>${statusEditorMarkup(s)}</div>`}if(!status)return `<div class="row" data-home-my-status style="margin-top:12px;padding:12px 3px 0;border-top:1px solid var(--line);align-items:flex-start"><div class="grow"><strong>Du</strong><div class="taskmeta" style="margin-top:4px">Ikke oppdatert i dag</div></div><button type="button" class="small" data-home-status-edit>Sjekk inn</button></div>`;const label=dailyApi()?.capacityLabel?.(status.capacity)||LABEL[status.capacity]||'Oppdatert';return `<div class="row" data-home-my-status style="margin-top:12px;padding:12px 3px 0;border-top:1px solid var(--line);align-items:flex-start"><div class="grow"><strong>Du · ${esc(label)}</strong><div class="taskmeta" style="margin-top:4px">${age(dailyStamp(status))}</div>${compactNeeds(status)}</div><button type="button" class="small" data-home-status-edit>Endre</button></div>`}
function coupleStatusMarkup(s){return `<section class="card" data-home-status-card data-home-couple-status style="margin:14px 0;border-color:#e6cfc4;background:linear-gradient(145deg,#fffdfb,#fff6f0);box-shadow:0 10px 26px #65351d0d"><div class="ey" style="margin-bottom:9px">Dagsform · dere i dag</div>${partnerStatusRow(s)}${myStatusRow(s)}</section>`}
function changeText(ev){const c=ev?.changes||{},parts=[];for(const k of ['energy','capacity','closeness','desire','stress'])if(c[k])parts.push(`${FIELD_LABEL[k]}: ${LABEL[c[k].to]||c[k].to}`);if(c.needs){const before=new Set(c.needs.from||[]),after=new Set(c.needs.to||[]),added=[...after].filter(x=>!before.has(x)).map(x=>NEED_LABEL[x]||x),removed=[...before].filter(x=>!after.has(x)).map(x=>NEED_LABEL[x]||x);if(added.length)parts.push(`Trenger ${added.join(', ')}`);if(removed.length)parts.push(`Ikke lenger ${removed.join(', ')}`)}return parts.slice(0,3).join(' · ')||'Dagsformen er oppdatert'}
function partnerRequest(s,type,name){return (Array.isArray(s?.seenRequests)?s.seenRequests:[]).filter(r=>r&&r.type===type&&r.by===name&&!r.deleted&&!r.done&&!r.declinedAt&&!r.expiredAt&&r.responseState!=='expired').sort((a,b)=>Number(b.createdAt||b.id||0)-Number(a.createdAt||a.id||0))[0]||null}
function partnerReward(s,name){return (Array.isArray(s?.rewards)?s.rewards:[]).filter(r=>r&&r.by===name).sort((a,b)=>Number(b.createdAt||b.id||0)-Number(a.createdAt||a.id||0))[0]||null}
function quickRow(kind,item,{empty,destination,badge}={}){const m=QUICK_META[kind],text=item?.text||item?.title||empty||'Ingen aktive',isNew=kind!=='reward'&&item&&!item.seen;return `<button type="button" data-home-destination="${destination}" style="width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px;text-align:left;border:0;border-top:1px solid var(--line);background:#fffdfb;padding:10px 12px;color:var(--ink);font:inherit"><span aria-hidden="true" style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:${m.bg};color:${m.tone};font-size:23px;font-weight:700">${m.icon}</span><span style="min-width:0"><strong style="display:block;color:${m.tone};font-size:13px;line-height:1.15">${m.label}</strong><span style="display:block;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px">${esc(text)}</span></span><span style="display:flex;align-items:center;gap:7px">${isNew?'<span class="tag" style="background:#ffe5df;color:#ad4a3c">Ny</span>':badge?`<span class="taskmeta">${esc(badge)}</span>`:''}<span aria-hidden="true" style="font-size:24px;color:var(--muted);line-height:1">›</span></span></button>`}
function partnerCard(s){const name=partnerName(s),events=Array.isArray(partnerCtx?.events)?partnerCtx.events:[],need=partnerRequest(s,'need',name),wish=partnerRequest(s,'wish',name),practical=partnerRequest(s,'practical',name),reward=partnerReward(s,name),rewardBadge=reward?.requiresPoints?`${Math.max(1,Number(reward.cost)||1)} p`:reward?'Åpen':'';return `<div class="card" style="padding:0;overflow:hidden;margin-top:18px;background:linear-gradient(145deg,#fff8f4,#fffdfb);border-color:#efd8cf"><div style="padding:15px 17px 13px"><div class="row"><div class="grow"><div class="ey">Fra partneren</div><strong style="display:block;font:600 21px/1.1 Georgia;margin-top:5px">${esc(name)}</strong></div>${events.length?`<span class="tag">${events.length} ny${events.length>1?'e':''}</span>`:''}</div><p class="sub" style="font-size:13px;margin:7px 0 0">Behov, ønsker og praktiske beskjeder dere har delt.</p></div><div style="border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden">${quickRow('need',need,{empty:'Ingen aktivt behov',destination:'seen'})}${quickRow('wish',wish,{empty:'Ingen aktivt ønske',destination:'seen'})}${quickRow('practical',practical,{empty:'Ingen praktisk beskjed',destination:'seen'})}${quickRow('reward',reward,{empty:'Ingen poengbelønning akkurat nå',destination:'rewards',badge:rewardBadge})}</div><div style="display:flex;justify-content:center;gap:10px;padding:12px 14px"><button type="button" class="small" data-home-destination="seen" style="border:0;background:transparent;color:var(--deep);font-weight:850">Se behov og ønsker</button><span class="taskmeta" aria-hidden="true">·</span><button type="button" class="small" data-home-destination="rewards" style="border:0;background:transparent;color:var(--deep);font-weight:850">Belønninger</button></div></div>`}
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
function statsMarkup(p,done,goal,label,pointsLabel,goalLabel){return `<div class="stat homeStats"><div><b>${p}%</b><span>${label}</span></div><div><b>${done}</b><span>${pointsLabel}</span></div><div><b>${goal}</b><span>${goalLabel}</span></div></div>`}
function settleScroll(c,pos,forceTop){const target=forceTop?0:Math.max(0,pos||0);c.style.overflowAnchor='none';const apply=()=>{c.scrollTop=target};apply();requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});setTimeout(()=>{apply();c.style.overflowAnchor=''},90)}
function render({resetScroll=false}={}){
  const s=bridge()?.getState?.(),c=$('#content');
  if(!s||!c||s.view!=='home')return;
  const pos=resetScroll?0:c.scrollTop,name=currentName(s),plan=dayPlanProgress(s),dayPct=plan.total?Math.round(plan.done/plan.total*100):0,dayPoints=todayPointTotal(s),dayRegistrations=todayComps(s).length,wg=totalWeekly(s),wd=doneWeekly(s),wp=pct(wd,wg),mg=totalMonthly(s),md=doneMonthly(s),mp=pct(md,mg);
  c.dataset.flytOwner='home';
  let intro,hero,stats,tail;
  if(mode==='day'){
    intro='Ett blikk på dagens rytme og det dere har delt.';
    hero=`<button type="button" class="card hero" data-home-day-plan-open="1" style="display:block;width:100%;text-align:left;color:inherit;font:inherit;cursor:pointer"><div class="row"><div class="grow"><strong>Dagens plan</strong><p>${!plan.total?'Dagen er åpen. Legg til det som er viktig i dag.':plan.done>=plan.total?'Alt i dagens plan er gjort.':plan.done?`${plan.done} fullført · ${plan.total-plan.done} gjenstår.`:`${plan.total} gjøremål ligger i planen. Tilpass det som ikke passer i dag.`}</p></div><span class="tag">Åpne</span></div><div class="progress"><i style="width:${dayPct}%"></i></div></button>`;
    stats=`<div class="stat homeStats"><div><b>${plan.done}</b><span>gjort fra planen</span></div><div><b>${dayPoints}</b><span>poeng i dag</span></div><div><b>${dayRegistrations}</b><span>registreringer</span></div></div>`;
    tail=`<div class="card"><strong>${!plan.total?'Ingen fast lås på dagen.':plan.done>=plan.total?'Dagens plan er tatt.':'Planen kan tilpasses.'}</strong><p class="sub">${!plan.total?'Hele gjøremålsbiblioteket er tilgjengelig under Gjøre.':plan.done>=plan.total?'Ekstra gjøremål kan fortsatt registreres og gir poeng.':'Legg til, fjern eller flytt gjøremål under Gjøre dersom dagen blir annerledes enn oppsettet.'}</p></div>`;
  }else if(mode==='week'){
    intro='Se retningen for uken, uten å gjøre forholdet til et regneark.';
    hero=`<div class="card hero"><div class="row"><div class="grow"><strong>Ukemålet</strong><p>${!wg?'Ingen gjøremål med ukerytme er valgt ennå.':wp>=100?'Ukens mål er nådd.':`Dere er ${wp}% gjennom ukens mål.`}</p></div><span class="tag">${wp}%</span></div><div class="progress"><i style="width:${wp}%"></i></div></div>`;
    stats=statsMarkup(wp,wd,wg,'Uken','ukepoeng','ukens mål');
    tail=`<div class="card"><strong>${!wg?'Ingen ukerytme ennå.':'Ukemålet er retning, ikke tak.'}</strong><p class="sub">${!wg?'Gjøremål kan legges til i Oppsett når dere ønsker dem.':'Ekstra utføringer registreres og gir poeng, men målet teller etter valgt rytme: dager per uke eller ganger per uke.'}</p></div>`;
  }else{
    intro='De større rytmene som lett forsvinner i en travel hverdag.';
    hero=`<div class="card hero"><div class="row"><div class="grow"><strong>Månedsmålet</strong><p>${!mg?'Ingen gjøremål med månedsrytme er valgt ennå.':mp>=100?'Månedens mål er nådd.':`Dere er ${mp}% gjennom månedens mål.`}</p></div><span class="tag">${mp}%</span></div><div class="progress"><i style="width:${mp}%"></i></div></div>`;
    stats=statsMarkup(mp,md,mg,'Måneden','månedspoeng','månedens mål');
    tail=`<div class="card"><strong>${!mg?'Ingen månedsrytme ennå.':'Måneden viser de større rytmene.'}</strong><p class="sub">${!mg?'Månedlige gjøremål kan legges til i Oppsett når dere trenger dem.':'Målet teller ønsket antall ganger, men ekstra utføringer er fortsatt lov og blir registrert.'}</p></div>`;
  }
  const first=firstWinMarkup(s);
  c.innerHTML=`<div class="ey">Hjem</div><h1 class="title">Dere i dag</h1><p class="sub">${greeting()}, ${esc(name)}. ${intro}</p>${coupleStatusMarkup(s)}<div id="homeNudgeMount" ${first?'data-first-win-active="1"':''} aria-live="polite">${first}</div>${tabs()}${hero}${stats}${partnerCard(s)}${tail}`;
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
  if(dayPlan){e.preventDefault();e.stopImmediatePropagation();dayPlan.blur?.();const s=bridge().getState();bridge().setState({...s,view:'tasks'});queueMicrotask(()=>window.FlytRecurrenceUI?.openToday?.()||window.FlytTasksUI?.render?.({resetScroll:true}));return}
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
  const tab=e.target.closest('[data-homeui-mode]');
  if(tab){e.preventDefault();e.stopImmediatePropagation();tab.blur?.();mode=['day','week','month'].includes(tab.dataset.homeuiMode)?tab.dataset.homeuiMode:'day';render({resetScroll:true});return}
  const destination=e.target.closest('[data-home-destination]');
  if(destination){e.preventDefault();e.stopImmediatePropagation();const next=destination.dataset.homeDestination,s=bridge().getState();if(!['seen','rewards','us'].includes(next)||!s)return;bridge().setState({...s,view:next});queueMicrotask(()=>next==='seen'?window.FlytSeenUI?.render?.():next==='rewards'?window.FlytRewardsUI?.render?.():window.FlytOss?.render?.({refresh:true,resetScroll:true}));return}
},true);
document.addEventListener('change',e=>{if(e.target?.id==='homeStatusNotify'&&statusDraft){statusDraft.notify=!!e.target.checked}},true);
window.FlytHomeUI={render,claim,version:VERSION};
const claimSoon=()=>queueMicrotask(()=>claim({resetScroll:false}));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',claimSoon,{once:true});else claimSoon();
window.addEventListener('pageshow',claimSoon);
})();
