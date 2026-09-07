(()=>{
'use strict';
const $=s=>document.querySelector(s);
const bridge=()=>window.FlytBridge;
const VERSION='20260907-homechallenge1';
let partnerCtx=null,loadingPartner=false,statusEditorOpen=false,statusDraft=null,statusSaving=false,statusError='';
const LABEL={low:'Lav',med:'Middels',high:'Høy'};
const NEED_LABEL={relief:'Avlastning',closeness:'Nærhet',sex:'Intimitet',initiative:'Initiativ',alone:'Alenetid',quiet:'Ro'};
const STATUS_LEVELS=[
  {key:'heavy',label:'Tung',capacity:'low',rank:1},
  {key:'low',label:'Lite overskudd',capacity:'low',rank:2},
  {key:'calm',label:'Rolig',capacity:'med',rank:3},
  {key:'good',label:'God',capacity:'high',rank:4},
  {key:'full',label:'Mye overskudd',capacity:'high',rank:5}
];
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
function partnerDailyStatus(s){const remote=partnerCtx?.partner?.status||null,shared=s?.status?.[partnerName(s)]||null,sharedFresh=freshDaily(shared);if(!remote)return shared;return sharedFresh&&sharedFresh.capacity===remote.capacity?{...sharedFresh,...remote,capacity_level:sharedFresh.capacity_level||remote.capacity_level}:{...remote}}
function freshDaily(status){return dailyApi()?.current?.(status,{kind:'daily'})||null}
function previousDaily(status){const stamp=dailyStamp(status);if(!status||!stamp||freshDaily(status))return null;const then=new Date(stamp),now=new Date(),todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()),previousStart=new Date(todayStart);previousStart.setDate(previousStart.getDate()-1);return then>=previousStart&&then<todayStart?status:null}
function dailyStamp(status){return dailyApi()?.updatedAt?.(status,'daily')||status?.updated_at||null}
function cleanNeeds(values){return dailyApi()?.cleanNeeds?.(values)||[]}
function defaultLevel(capacity){return capacity==='low'?'low':capacity==='high'?'good':capacity==='med'?'calm':''}
function statusLevel(status){const key=String(status?.capacity_level||'');return STATUS_LEVELS.some(level=>level.key===key)?key:defaultLevel(status?.capacity)}
function levelInfo(key){return STATUS_LEVELS.find(level=>level.key===key)||null}
function startStatusDraft(s){const current=freshDaily(myStatus(s));statusDraft={level:statusLevel(current),capacity:current?.capacity||'',needs:cleanNeeds(current?.needs),notify:false};statusError=''}
function statusNeedButtons(){const needs=dailyApi()?.NEEDS||[];return needs.map(([key,label])=>`<button type="button" class="need ${(statusDraft?.needs||[]).includes(key)?'on':''}" data-home-status-need="${key}" aria-pressed="${(statusDraft?.needs||[]).includes(key)}">${esc(label)}</button>`).join('')}
function moodDots(status){const selected=levelInfo(statusLevel(status))?.rank||0;return `<div class="homeMoodDots" aria-label="${selected?`${selected} av 5`:'Ikke registrert'}">${STATUS_LEVELS.map(level=>`<span class="${level.rank<=selected?'isFilled':''}${level.rank===selected?' isSelected':''}" aria-hidden="true"></span>`).join('')}</div>`}
function quickStatusChoices(){return `<div class="homeMoodQuickChoices" aria-label="Velg dagsform">${STATUS_LEVELS.map(level=>`<button type="button" data-home-status-quick="${level.key}" aria-label="${esc(level.label)}"><span aria-hidden="true"></span><small>${esc(level.label)}</small></button>`).join('')}</div>`}
function statusShortcutMarkup(previous){const info=levelInfo(statusLevel(previous));if(!previous||!info)return'';return `<div class="homeMoodShortcut"><small>I går: ${esc(info.label)}</small><button type="button" class="small" data-home-status-same="1">Samme i dag</button><button type="button" class="small" data-home-status-change="1">Endre</button></div>`}
function moodPersonMarkup({name,status,mine=false,previous=null}){const info=levelInfo(statusLevel(status)),missing=mine&&!status,meta=status?age(dailyStamp(status)):'Ikke registrert',attributes=mine&&!missing?'data-home-status-edit role="button" tabindex="0" aria-label="Endre din dagsform"':mine?'':'data-home-partner-status';return `<div class="homeMoodPerson ${mine?'isMine':''} ${missing?'isMissing':''}" ${attributes}><span class="homeMoodAvatar" aria-hidden="true">${esc(String(name||'?').trim().charAt(0).toUpperCase())}</span><div class="homeMoodCopy"><span>${mine?'Deg':esc(name)}</span><strong>${esc(info?.label||'Ikke registrert')}</strong>${moodDots(status)}<small>${esc(meta)}</small></div>${mine&&!missing?'<span class="homeMoodEdit">Endre</span>':''}${missing?`${quickStatusChoices()}${statusShortcutMarkup(previous)}`:''}</div>`}
function statusEditorMarkup(s){return `<div class="homeMoodEditor"><strong>Hvor mye har du å gå på i dag?</strong><div class="homeMoodChoices">${STATUS_LEVELS.map(level=>`<button type="button" data-home-status-level="${level.key}" class="${statusDraft?.level===level.key?'on':''}" aria-pressed="${statusDraft?.level===level.key}"><span aria-hidden="true"></span>${esc(level.label)}</button>`).join('')}</div><div class="homeMoodNeedsTitle">Hva hadde hjulpet?</div><div class="taskmeta">Valgfritt. Velg gjerne flere.</div><div class="grid2 homeMoodNeeds">${statusNeedButtons()}</div>${hasPartner()?`<label class="homeMoodNotify"><input id="homeStatusNotify" type="checkbox" ${statusDraft?.notify?'checked':''}><span><strong>Varsle ${esc(partnerName(s))}</strong><small>Bruk dette bare når endringen bør få oppmerksomhet.</small></span></label>`:''}${statusError?`<p role="alert" class="homeMoodError">${esc(statusError)}</p>`:''}<div class="homeMoodEditorActions"><button type="button" class="secondary" data-home-status-cancel ${statusSaving?'disabled':''}>Avbryt</button><button type="button" class="primary" data-home-status-save ${statusSaving||!statusDraft?.capacity?'disabled':''}>${statusSaving?'Lagrer…':'Oppdater dagsform'}</button></div></div>`}
function dailyStatusMarkup(s){const rawMyStatus=myStatus(s),status=freshDaily(rawMyStatus),previous=previousDaily(rawMyStatus),partnerStatus=hasPartner()?freshDaily(partnerDailyStatus(s)):null;return `<section class="homeSurface homeMoodCard" data-home-status-card data-home-couple-status><div class="homeSectionTitle"><span class="homeSectionIcon" aria-hidden="true">☺</span><div><h2>Dagsform</h2><p>Hvordan har dere det i dag?</p></div></div><div class="homeMoodGrid">${moodPersonMarkup({name:currentName(s),status,mine:true,previous})}${hasPartner()?moodPersonMarkup({name:partnerName(s),status:partnerStatus}):`<div class="homeMoodPerson isEmpty"><span class="homeMoodAvatar" aria-hidden="true">♡</span><div class="homeMoodCopy"><span>Partner</span><strong>Ikke koblet til</strong>${moodDots(null)}</div></div>`}</div>${statusEditorOpen?(statusDraft||startStatusDraft(s),statusEditorMarkup(s)):''}</section>`}
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
    return `<section class="homeSurface homeJourneyCard" data-first-win-card="completed"><div class="row" style="align-items:flex-start"><div class="homeSectionIcon" aria-hidden="true">✓</div><div class="grow"><div class="ey">Første felles seier</div><strong>Dere fullførte ${esc(taskReference(win.taskName))} sammen</strong><p class="sub">Én tok initiativ eller spurte. Den andre svarte. Handlingen ble gjort.</p></div></div><button type="button" class="primary full" data-first-win-finish="1">Se hva dere får til sammen</button></section>`;
  }
  if(win.stage==='awaiting'){
    const mine=win.request?.by===s.user;
    return `<section class="homeSurface homeJourneyCard" data-first-win-card="awaiting"><div class="ey">Første felles seier · nesten i mål</div><strong>${mine?'Din del er gjort':`${name} har fullført ${esc(taskReference(win.taskName))}`}</strong><p class="sub">${mine?`Når ${esc(name)} har sett det, er den første felles løkken komplett.`:'Se handlingen og send gjerne et lite takk.'}</p><button type="button" class="primary full" data-home-destination="seen">Åpne Sett</button></section>`;
  }
  if(win.stage==='started'||win.stage==='accepted'){
    const mine=win.request?.by===s.user,label=win.stage==='accepted'?'Avtalt – nå gjenstår handlingen':mine?`Invitasjonen til samarbeid er sendt`:`${name} har startet deres første felles seier`;
    return `<section class="homeSurface homeJourneyCard" data-first-win-card="active"><div class="ey">Første felles seier · ${win.stage==='accepted'?'2 av 3':'1 av 3'}</div><strong>${esc(label)}</strong><p class="sub">${esc(win.taskName)} · ${win.stage==='accepted'?'Når den er utført, har dere fullført hele løkken.':'Se og svar i Sett.'}</p><button type="button" class="primary full" data-home-destination="seen">${win.stage==='accepted'?'Fullfør i Sett':'Åpne Sett'}</button></section>`;
  }
  return'';
}
function ensureStyles(){if($('#flytHomeStyles')||typeof document.createElement!=='function')return;const style=document.createElement('style');style.id='flytHomeStyles';style.textContent=`
  #content[data-flyt-owner="home"]{background:radial-gradient(circle at 84% 2%,#f7d8c833 0 115px,transparent 116px);color:#3d2d28}
  .homeHeader{margin:0 2px 20px}.homeHeader .ey{color:#b85e43;letter-spacing:.17em}.homeHeader .title{margin:5px 0 5px;font-weight:500;color:#392822}.homeHeader .sub{margin:0;color:#806b61}
  .homeSurface{margin:14px 0;padding:17px;border:1px solid #eadbd2;border-radius:22px;background:#fffdf9;box-shadow:0 9px 24px #79503a0c}
  .homeSectionTitle{display:flex;align-items:center;gap:10px}.homeSectionTitle h2,.homeSectionTitle h2:first-child{margin:0;font:600 22px/1.15 Georgia,serif;color:#3d2b25}.homeSectionTitle p{margin:3px 0 0;color:#806b61;font-size:14px}
  .homeSectionIcon{width:32px;height:32px;display:grid;place-items:center;flex:0 0 32px;border:1.5px solid #d98761;border-radius:50%;color:#c66c4d;font-size:19px;background:#fff8f3}
  .homeGoalGrid{display:grid;grid-template-columns:minmax(142px,1.1fr) minmax(116px,.9fr);gap:14px;align-items:center;margin-top:13px}
  .homeProgressRing{--progress:0;width:min(42vw,174px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:conic-gradient(from -90deg,#d77b52 calc(var(--progress)*1%),#f4dfcf 0);position:relative;margin:auto}
  .homeProgressRing:after{content:'';position:absolute;inset:15px;border-radius:50%;background:#fffdf9;box-shadow:inset 0 0 0 1px #f0e3da}
  .homeProgressRing span{position:relative;z-index:1;display:grid;text-align:center}.homeProgressRing strong{font:500 27px/1 Georgia,serif;color:#3b2923}.homeProgressRing small{margin-top:5px;color:#7a665d;font-size:13px}
  .homeGoalStats{display:grid;gap:0}.homeGoalStats>div{display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:center;min-height:38px;border-bottom:1px solid #efe3dc;color:#725f56;font-size:14px}.homeGoalStats>div:last-child{border:0}.homeGoalStats strong{font:600 20px/1 Georgia,serif;color:#42302a}.homeGoalStats .isDone,.homeGoalStats .isLeft{width:10px;height:10px;border-radius:50%;background:#d77b52}.homeGoalStats .isLeft{background:#f1d7c3}
  .homeGoalEncouragement{display:flex;justify-content:center;align-items:center;gap:7px;margin:11px 0 5px;color:#b9684b;font-size:15px}.homeGoalEncouragement span{font-size:20px}.homeTextAction{display:block;margin:5px auto 0;padding:7px 10px;border:0;background:transparent;color:#a8553f;font:700 14px/1.2 inherit;text-decoration:underline;text-underline-offset:4px}
  .homeMoodGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}.homeMoodPerson{position:relative;display:flex;align-items:center;gap:9px;min-width:0;padding:11px;border:1px solid #eee0d6;border-radius:17px;background:#fffaf6}.homeMoodPerson.isMine{cursor:pointer}.homeMoodPerson.isMissing{display:flex;flex-wrap:wrap;cursor:default}.homeMoodPerson.isMine:focus-visible{outline:3px solid #d9775744;outline-offset:2px}.homeMoodAvatar{width:40px;height:40px;display:grid;place-items:center;flex:0 0 40px;border-radius:50%;background:#f6d9c6;color:#7a4a39;font:600 20px/1 Georgia,serif}.homeMoodPerson:nth-child(2) .homeMoodAvatar{background:#f7e4d4}.homeMoodCopy{min-width:0;display:grid}.homeMoodCopy>span{font-size:13px;color:#78635a}.homeMoodCopy strong{font:500 19px/1.2 Georgia,serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.homeMoodCopy small{margin-top:4px;color:#98857c;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.homeMoodDots{display:flex;gap:5px;margin-top:7px}.homeMoodDots span{width:9px;height:9px;border-radius:50%;background:#edddd1}.homeMoodDots span.isFilled{background:#df9a75}.homeMoodDots span.isSelected{box-shadow:0 0 0 2px #fff,0 0 0 3px #c76e4e}.homeMoodEdit{position:absolute;right:8px;top:7px;color:#a85b44;font-size:11px;font-weight:700}.homeMoodQuickChoices{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;flex-basis:100%;margin-top:9px}.homeMoodQuickChoices button{min-width:0;border:0;border-radius:9px;background:#f8e9df;color:#806056;padding:6px 1px;font:inherit}.homeMoodQuickChoices button span{display:block;width:10px;height:10px;margin:0 auto 3px;border-radius:50%;background:#d77b52}.homeMoodQuickChoices button:nth-child(1) span{background:#c98668}.homeMoodQuickChoices button:nth-child(2) span{background:#da9b75}.homeMoodQuickChoices button:nth-child(3) span{background:#e7b38b}.homeMoodQuickChoices button:nth-child(4) span{background:#dc8a61}.homeMoodQuickChoices button:nth-child(5) span{background:#c96e4d}.homeMoodQuickChoices small{display:block;font-size:8px;line-height:1.1;white-space:normal}.homeMoodShortcut{display:flex;flex-wrap:wrap;align-items:center;gap:4px;flex-basis:100%;margin-top:8px;color:#806b61}.homeMoodShortcut>small{flex:1 0 100%;font-size:10px}.homeMoodShortcut .small{padding:5px 7px;font-size:10px}
  .homeMoodEditor{margin-top:14px;padding-top:14px;border-top:1px solid #ecddd4}.homeMoodChoices{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:9px}.homeMoodChoices button{min-width:0;padding:8px 3px;border:1px solid #eadbd2;border-radius:12px;background:#fffaf7;color:#705d54;font-size:11px;line-height:1.2}.homeMoodChoices button span{display:block;width:12px;height:12px;margin:0 auto 5px;border-radius:50%;background:#edddd1}.homeMoodChoices button.on{border-color:#d47454;background:#fff0e8;color:#874632;box-shadow:0 0 0 2px #d474541a}.homeMoodChoices button.on span{background:#d47454}.homeMoodNeedsTitle{margin-top:15px;font-weight:800}.homeMoodNeeds{margin-top:8px}.homeMoodNotify{display:flex;gap:9px;margin-top:12px;padding:10px;border:1px solid #eadbd2;border-radius:14px;background:#fffaf7}.homeMoodNotify input{margin-top:3px;accent-color:#cf6f4f}.homeMoodNotify span{display:grid}.homeMoodNotify small{color:#816e65;margin-top:2px}.homeMoodError{color:#a63c31;font-weight:750}.homeMoodEditorActions{display:grid;grid-template-columns:1fr 1.35fr;gap:9px;margin-top:13px}
  .homeJourneyCard{background:linear-gradient(145deg,#fffdf9,#fff1e9)}.homeJourneyCard>strong,.homeJourneyCard .grow>strong{display:block;font:600 21px/1.2 Georgia,serif;margin-top:6px}.homeJourneyCard .sub{margin:7px 0 0}.homeJourneyCard button{margin-top:13px}
  .homeChallengeCard{padding:15px 16px}.homeChallengeCard .homeSectionTitle p{max-width:260px}.homeChallengeEmpty,.homeChallengeActive{display:grid;gap:4px;margin:13px 0 0;padding:12px 13px;border:1px solid #eee0d6;border-radius:16px;background:#fffaf6}.homeChallengeEmpty strong,.homeChallengeActive strong{font:600 18px/1.2 Georgia,serif;color:#453029}.homeChallengeEmpty span,.homeChallengeActive>span{color:#806b61;font-size:13px;line-height:1.35}.homeChallengeReward{margin-top:2px;color:#a85b44;font-size:12px;font-weight:750}.homeChallengeProgress{height:6px;overflow:hidden;margin-top:7px;border-radius:999px;background:#f1e3dc}.homeChallengeProgress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#d77b52,#edb18a)}.homeChallengeActions{display:grid;grid-template-columns:1.2fr 1fr;gap:9px;margin-top:11px}.homeChallengeActions .primary,.homeChallengeActions .secondary{min-height:42px;margin:0;padding:8px;font-size:12px}.homeChallengeCard .homeTextAction{margin:8px 0 0 auto}
  @media(max-width:390px){.homeSurface{padding:15px}.homeGoalGrid{grid-template-columns:136px 1fr;gap:9px}.homeProgressRing{width:136px}.homeProgressRing:after{inset:13px}.homeMoodPerson{padding:9px 7px;gap:6px}.homeMoodAvatar{width:32px;height:32px;flex-basis:32px;font-size:17px}.homeMoodCopy strong{font-size:16px}.homeMoodDots{gap:3px}.homeMoodDots span{width:7px;height:7px}.homeMoodEdit{display:none}}
`;document.head.appendChild(style)}
function ensureGoalCompactStyles(){if($('#flytHomeGoalCompactStyles')||typeof document.createElement!=='function')return;const style=document.createElement('style');style.id='flytHomeGoalCompactStyles';style.textContent=`
.homeGoalCard{padding:13px 15px 10px}
.homeGoalHead{display:flex;align-items:center;justify-content:space-between;gap:10px}
.homeGoalHead .homeSectionTitle{gap:8px;min-width:0}
.homeGoalHead .homeSectionIcon{width:28px;height:28px;flex:0 0 28px;font-size:16px}
.homeGoalHead h2{font-size:20px}
.homeGoalCard .homeGoalEncouragement{margin:0;justify-content:flex-end;white-space:nowrap;font-size:13px;line-height:1.2}
.homeGoalCard .homeGoalEncouragement span{font-size:17px}
.homeGoalCard .homeGoalGrid{grid-template-columns:minmax(104px,.9fr) minmax(124px,1.1fr);gap:12px;margin-top:9px}
.homeGoalCard .homeProgressRing{width:min(29vw,118px)}
.homeGoalCard .homeProgressRing:after{inset:11px}
.homeGoalCard .homeProgressRing strong{font-size:21px}
.homeGoalCard .homeProgressRing small{margin-top:2px;font-size:11px}
.homeGoalCard .homeGoalSummary{display:grid;gap:5px;align-content:center;padding:3px 0}.homeGoalCard .homeGoalSummary>strong{font:600 25px/1 Georgia,serif;color:#49342c}.homeGoalCard .homeGoalSummary>span{color:#b9684b;font-size:13px;line-height:1.3}.homeGoalCard .homeGoalSummary .homeTextAction{justify-self:start;margin:4px 0 0;padding:2px 0;font-size:12px}
.homeGoalCard .homeGoalStats>div{min-height:31px;gap:7px;font-size:13px}
.homeGoalCard .homeGoalStats strong{font-size:18px}
.homeGoalCard .homeGoalStats .isDone,.homeGoalCard .homeGoalStats .isLeft{width:9px;height:9px}
.homeGoalCard .homeTextAction{margin:1px 0 0 auto;padding:2px 4px;font-size:12px}
@media (max-width:390px){.homeGoalCard{padding:12px 13px 9px}.homeGoalHead h2{font-size:19px}.homeGoalCard .homeGoalEncouragement{font-size:12px}.homeGoalCard .homeGoalGrid{grid-template-columns:minmax(96px,.85fr) minmax(118px,1.15fr);gap:9px}.homeGoalCard .homeProgressRing{width:106px}.homeGoalCard .homeProgressRing strong{font-size:19px}.homeGoalCard .homeGoalSummary>strong{font-size:22px}}
`;document.head.appendChild(style)}
function progressRing(plan){const value=Math.min(100,Math.max(0,Number(plan?.pct)||0));return `<div class="homeProgressRing" style="--progress:${value}" role="img" aria-label="${value} prosent fullført, ${plan.done} av ${plan.total} gjøremål"><span><strong>${value} %</strong></span></div>`}
function goalEncouragement(plan){if(!plan.total)return'En rolig dag i planen';if(!plan.remaining)return'Dagens mål er nådd';if(plan.pct>=70)return'Dere er nesten i mål';if(plan.pct>=40)return'Dere er godt i rute';if(plan.done)return'God start på dagen';return'Små ting. Stor forskjell.'}
function dailyGoalMarkup(plan){
  const remaining=plan.remaining||0,remainingLabel=remaining===1?'1 igjen':`${remaining} igjen`;
  return `<section class="homeSurface homeGoalCard" data-home-daily-goal><div class="homeGoalHead"><div class="homeSectionTitle"><span class="homeSectionIcon" aria-hidden="true">◎</span><h2>Dagens mål</h2></div></div><div class="homeGoalGrid">${progressRing(plan)}<div class="homeGoalSummary"><strong>${esc(!plan.total?'Rolig dag':!remaining?'Ferdig i dag':remainingLabel)}</strong><span>${esc(goalEncouragement(plan))}</span><button type="button" class="homeTextAction" data-home-day-plan-open="1" data-home-destination="tasks">Se dagens gjøremål <span aria-hidden="true">→</span></button></div></div></section>`;
}
function activeChallenge(s){const goals=window.FlytGoalsCore?.goals?.(s)||[];return goals.find(goal=>goal?.kind==='challenge'&&['pending','active','reached'].includes(goal.status)&&((goal.createdBy===s.user)||(goal.targetUser===s.user)))||null}
function challengeRewardMarkup(challenge,s){const reward=challenge?.reward;if(!reward||['none','declined','used'].includes(reward.status))return'';const title=reward.secret&&reward.offeredBy!==s.user&&!['available','redeemed'].includes(reward.status)?'Hemmelig belønning 🔒':reward.title;return title?`<span class="homeChallengeReward">♡ ${esc(title)}</span>`:''}
function homeChallengeMarkup(s){
  const challenge=activeChallenge(s);
  if(!challenge)return `<section class="homeSurface homeChallengeCard" data-home-challenge-card><div class="homeSectionTitle"><span class="homeSectionIcon" aria-hidden="true">◇</span><div><h2>Utfordring</h2><p>En liten avtale kan gjøre hverdagen litt lettere.</p></div></div><div class="homeChallengeEmpty"><strong>Klar for en liten utfordring?</strong><span>Gi partneren et lite dytt – eller be om ett tilbake.</span></div><div class="homeChallengeActions"><button type="button" class="primary" data-home-challenge-create="1">Gi en utfordring</button><button type="button" class="secondary" data-home-challenge-request="1">Be om en utfordring</button></div></section>`;
  const progress=window.FlytGoalsCore?.progress?.(s,challenge)||{pct:0,label:'På gang'},status=challenge.status==='pending'?'Venter på svar':String(progress.label||'På gang');
  return `<section class="homeSurface homeChallengeCard" data-home-challenge-card data-home-challenge-id="${esc(challenge.id)}"><div class="homeSectionTitle"><span class="homeSectionIcon" aria-hidden="true">◇</span><div><h2>Utfordring</h2><p>${esc(challenge.createdBy===s.user?`Til ${challenge.targetUser||partnerName(s)}`:`Fra ${challenge.createdBy||partnerName(s)}`)}</p></div></div><div class="homeChallengeActive"><strong>${esc(challenge.title||'Utfordring')}</strong><span>${esc(status)}</span>${challengeRewardMarkup(challenge,s)}<div class="homeChallengeProgress" aria-label="${esc(status)}"><i style="width:${Math.max(0,Math.min(100,Number(progress.pct)||0))}%"></i></div></div><button type="button" class="homeTextAction" data-home-challenge-open="${esc(challenge.id)}">Se utfordring <span aria-hidden="true">→</span></button></section>`;
}
function requestChallenge(){const s=bridge()?.getState?.(),to=partnerName(s),next=window.FlytSeenCore?.addRecognition?.(s,{type:'action',text:'Har du lyst til å gi meg en liten utfordring i dag? ❤️',user:s?.user,to});if(!s||!next||next===s)return;bridge().setState(next);window.FlytSync?.queueSave?.();bridge()?.toast?.(`Forespørselen er sendt til ${to}`)}
function startFirstWin(taskId){const s=bridge()?.getState?.(),task=(s?.tasks||[]).find(item=>String(item.id)===String(taskId));if(!s||!task)return;const item=window.FlytCoupleCore?.makeInitiative?.({state:s,task,partnerName:partnerName(s)})||null;if(!item)return;bridge().setState({...s,seenRequests:[{...item,journeyKey:'first_shared_win'},...(s.seenRequests||[])],coupleJourney:{...(s.coupleJourney||{}),firstWinStartedAt:s.coupleJourney?.firstWinStartedAt||new Date().toISOString()}});window.FlytSync?.queueSave?.();bridge()?.toast?.(`Første felles seier er startet med ${taskReference(task.name)}`);render({resetScroll:false});window.FlytSeenRequestAlert?.checkAlerts?.()}
async function loadPartner(force=false){if((loadingPartner&&!force)||!window.FlytSync?.rpc||!window.FlytSync?.getContext?.()?.user_id)return;loadingPartner=true;try{const {data,error}=await window.FlytSync.rpc('get_home_partner_context');if(error)throw error;let next=data||null;if(next&&!next.me){const detail=await window.FlytSync.rpc('get_oss_context');if(!detail.error){const userId=detail.data?.user_id,status=(detail.data?.statuses||[]).find(item=>String(item.user_id)===String(userId))||null,member=(detail.data?.members||[]).find(item=>String(item.id)===String(userId))||null;next={...next,me:{user_id:userId,display_name:member?.display_name||currentName(bridge()?.getState?.()),status}}}}partnerCtx=next;if(bridge()?.getState?.()?.view==='home')render({resetScroll:false})}catch(e){console.warn('Flyt Hjem-status kunne ikke hentes',e)}finally{loadingPartner=false}}
async function saveHomeStatus(){
  const s=bridge()?.getState?.();
  if(!s||statusSaving||!dailyApi()?.validCapacity?.(statusDraft?.capacity))return;
  const next={capacity:statusDraft.capacity,capacity_level:statusDraft.level,needs:cleanNeeds(statusDraft.needs),notify:!!statusDraft.notify},previous=myStatus(s),now=new Date().toISOString(),context=window.FlytSync?.getContext?.();
  statusSaving=true;statusError='';render({resetScroll:false});
  try{
    if(context?.user_id&&window.FlytSync?.rpc){
      const {error}=await window.FlytSync.rpc('save_my_daily_status',{p_capacity:next.capacity,p_needs:next.needs,p_notify:next.notify});
      if(error)throw error;
      partnerCtx={...(partnerCtx||{}),me:{...(partnerCtx?.me||{}),user_id:context.user_id,display_name:currentName(s),status:{...(previous||{}),capacity:next.capacity,capacity_level:next.capacity_level,needs:next.needs,daily_updated_at:now,updated_at:now}}};
      bridge().setState({...s,status:{...(s.status||{}),[currentName(s)]:{...(previous||{}),capacity:next.capacity,capacity_level:next.capacity_level,needs:next.needs,daily_updated_at:now,updated_at:now}}});
      window.FlytSync?.queueSave?.();
    }else{
      const legacy=dailyApi()?.fallbackLegacyFields?.(previous,next.capacity)||{energy:next.capacity,capacity:next.capacity,closeness:'med',desire:'med',stress:'med'};
      bridge().setState({...s,status:{...(s.status||{}),[currentName(s)]:{...(previous||{}),...legacy,capacity_level:next.capacity_level,needs:next.needs,daily_updated_at:now,updated_at:now}}});
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
  ensureStyles();
  ensureGoalCompactStyles();
  c.dataset.flytOwner='home';
  const first=firstWinMarkup(s);
  c.innerHTML=`<header class="homeHeader"><div class="ey">Hjem</div><h1 class="title">${greeting()}, ${esc(name)}</h1><p class="sub">Et raskt overblikk over dagen deres</p></header>${dailyGoalMarkup(plan)}${dailyStatusMarkup(s)}${homeChallengeMarkup(s)}<div id="homeNudgeMount" ${first?'data-first-win-active="1"':''} aria-live="polite">${first}</div>`;
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
  const challengeCreate=e.target.closest('[data-home-challenge-create]');
  if(challengeCreate){e.preventDefault();e.stopImmediatePropagation();const s=bridge().getState();bridge().setState({...s,view:'rewards'});queueMicrotask(()=>window.FlytRewardsUI?.openChallenge?.());return}
  const challengeOpen=e.target.closest('[data-home-challenge-open]');
  if(challengeOpen){e.preventDefault();e.stopImmediatePropagation();const s=bridge().getState();bridge().setState({...s,view:'rewards'});queueMicrotask(()=>window.FlytRewardsUI?.openChallenge?.(challengeOpen.dataset.homeChallengeOpen));return}
  const challengeRequest=e.target.closest('[data-home-challenge-request]');
  if(challengeRequest){e.preventDefault();e.stopImmediatePropagation();requestChallenge();return}
  const quick=e.target.closest('[data-home-status-quick]');
  if(quick){e.preventDefault();e.stopImmediatePropagation();const info=levelInfo(quick.dataset.homeStatusQuick);if(!info)return;statusDraft={level:info.key,capacity:info.capacity,needs:[],notify:false};saveHomeStatus();return}
  const same=e.target.closest('[data-home-status-same]');
  if(same){e.preventDefault();e.stopImmediatePropagation();const previous=previousDaily(myStatus(bridge().getState()));if(!previous)return;statusDraft={level:statusLevel(previous),capacity:previous.capacity,needs:cleanNeeds(previous.needs),notify:false};saveHomeStatus();return}
  const change=e.target.closest('[data-home-status-change]');
  if(change){e.preventDefault();e.stopImmediatePropagation();statusEditorOpen=true;startStatusDraft(bridge().getState());render({resetScroll:false});return}
  const edit=e.target.closest('[data-home-status-edit]');
  if(edit){e.preventDefault();e.stopImmediatePropagation();statusEditorOpen=true;startStatusDraft(bridge().getState());render({resetScroll:false});return}
  const cancel=e.target.closest('[data-home-status-cancel]');
  if(cancel){e.preventDefault();e.stopImmediatePropagation();statusEditorOpen=false;statusDraft=null;statusError='';render({resetScroll:false});return}
  const level=e.target.closest('[data-home-status-level]');
  if(level){e.preventDefault();e.stopImmediatePropagation();if(!statusDraft)startStatusDraft(bridge().getState());const info=levelInfo(level.dataset.homeStatusLevel);statusDraft.level=info?.key||'';statusDraft.capacity=info?.capacity||'';statusError='';render({resetScroll:false});return}
  const need=e.target.closest('[data-home-status-need]');
  if(need){e.preventDefault();e.stopImmediatePropagation();if(!statusDraft)startStatusDraft(bridge().getState());const key=need.dataset.homeStatusNeed,index=statusDraft.needs.indexOf(key);index>=0?statusDraft.needs.splice(index,1):statusDraft.needs.push(key);statusDraft.needs=cleanNeeds(statusDraft.needs);render({resetScroll:false});return}
  const save=e.target.closest('[data-home-status-save]');
  if(save){e.preventDefault();e.stopImmediatePropagation();saveHomeStatus();return}
  const start=e.target.closest('[data-first-win-start]');
  if(start){e.preventDefault();e.stopImmediatePropagation();startFirstWin(start.dataset.firstWinStart);return}
  const finish=e.target.closest('[data-first-win-finish]');
  if(finish){e.preventDefault();e.stopImmediatePropagation();const s=bridge().getState();markFirstWinSeen(s);bridge().setState({...bridge().getState(),view:'seen'});queueMicrotask(()=>window.FlytSeenUI?.render?.({resetScroll:true}));return}
  const destination=e.target.closest('[data-home-destination]');
  if(destination){e.preventDefault();e.stopImmediatePropagation();const requested=destination.dataset.homeDestination,next=requested==='us'?'seen':requested,s=bridge().getState();if(!['seen','rewards','tasks'].includes(next)||!s)return;bridge().setState({...s,view:next});queueMicrotask(()=>next==='seen'?window.FlytSeenUI?.render?.():next==='rewards'?window.FlytRewardsUI?.render?.():window.FlytRecurrenceUI?.render?.({resetScroll:true}));return}
},true);
document.addEventListener('change',e=>{if(e.target?.id==='homeStatusNotify'&&statusDraft){statusDraft.notify=!!e.target.checked}},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target?.matches?.('[data-home-status-edit]')){e.preventDefault();statusEditorOpen=true;startStatusDraft(bridge()?.getState?.());render({resetScroll:false})}},true);
window.FlytHomeUI={render,claim,openStatusEditor(){statusEditorOpen=true;startStatusDraft(bridge()?.getState?.());render({resetScroll:false})},version:VERSION};
const claimSoon=()=>queueMicrotask(()=>claim({resetScroll:false}));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',claimSoon,{once:true});else claimSoon();
window.addEventListener('pageshow',claimSoon);
})();
