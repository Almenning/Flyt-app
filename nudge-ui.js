((root)=>{
'use strict';

const VERSION='20260902-0100';
const DAY_MS=86400000;
const coupleCore=typeof module==='object'&&module.exports?require('./couple-core.js'):root?.FlytCoupleCore;
const DEFAULT_PREFERENCES=Object.freeze({
  enabled:true,
  initiative:true,
  askHelp:true,
  relationship:true,
  recognition:true,
  frequency:'balanced',
  tone:'warm',
  dismissedDate:'',
  dismissedIds:[]
});
const NEED_LABEL={relief:'avlastning',closeness:'nærhet',sex:'nærhet',initiative:'initiativ',alone:'alenetid',quiet:'ro'};
const taskLanguage=typeof module==='object'&&module.exports?require('./task-language.js'):root?.FlytTaskLanguage;
const taskName=task=>taskLanguage?.canonicalName?.(task)||String(task?.name||task||'denne oppgaven').trim();
const taskReference=task=>taskLanguage?.taskReference?.(task)||`oppgaven «${taskName(task)}»`;

function dateKey(value=new Date()){
  const d=value instanceof Date?new Date(value):new Date(value);
  if(Number.isNaN(d.getTime()))return'';
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function monday(value=new Date()){
  const d=value instanceof Date?new Date(value):new Date(value);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  return d;
}
function isoDay(value=new Date()){
  const n=(value instanceof Date?value:new Date(value)).getDay();
  return n===0?7:n;
}
function stamp(value){
  const n=typeof value==='number'?value:new Date(value||0).getTime();
  return Number.isFinite(n)?n:0;
}
function freshStatus(status,now=Date.now()){
  const at=stamp(status?.updated_at);
  return !!at&&at<=now+5*60000&&now-at<12*60*60*1000&&dateKey(new Date(at))===dateKey(new Date(now));
}
function quietHours(now=new Date()){
  const hour=(now instanceof Date?now:new Date(now)).getHours();
  return hour<6||hour>=23;
}
function preferredDays(task){
  return [...new Set((Array.isArray(task?.preferredDays)?task.preferredDays:[]).map(Number).filter(n=>n>=1&&n<=7))];
}
function scheduledToday(task,now=new Date()){
  const days=preferredDays(task);
  if(days.length)return days.includes(isoDay(now));
  return task?.type==='daily'&&Number(task?.freq||0)>=7;
}
function weekCompletions(state,now=new Date()){
  const start=monday(now);
  return (state?.completions||[]).filter(c=>stamp(`${c?.date||''}T12:00:00`)>=start.getTime());
}
function activeNudgeTaskIds(state){
  return new Set((state?.seenRequests||[]).filter(r=>(r?.source==='nudge'||r?.source==='initiative')&&r.taskId!=null&&!r.done&&!r.deleted&&!r.declinedAt).map(r=>String(r.taskId)));
}
function remainingTasks(state,now=new Date()){
  const today=dateKey(now),doneToday=new Set((state?.completions||[]).filter(c=>c?.date===today&&c?.kind==='house').map(c=>String(c.taskId))),week=weekCompletions(state,now),requested=activeNudgeTaskIds(state),out=[];
  for(const task of state?.tasks||[]){
    if(!task||task.kind!=='house'||requested.has(String(task.id)))continue;
    if(task.type==='daily'){
      if(scheduledToday(task,now)&&!doneToday.has(String(task.id)))out.push({...task,nudgePeriod:'today',remainingCount:1});
      continue;
    }
    if(task.type==='flex'){
      const count=week.filter(c=>c?.kind==='house'&&String(c.taskId)===String(task.id)).length,goal=Math.max(1,Number(task.freq)||1);
      if(count<goal)out.push({...task,nudgePeriod:'week',remainingCount:goal-count});
    }
  }
  const ownerRank=task=>task.owner==='Begge'||!task.owner?0:task.owner===state?.user?1:2;
  return out.sort((a,b)=>(a.nudgePeriod==='today'?0:1)-(b.nudgePeriod==='today'?0:1)||ownerRank(a)-ownerRank(b)||Number(b.pts||0)-Number(a.pts||0)||String(a.name||'').localeCompare(String(b.name||''),'nb'));
}
function todayProgress(state,now=new Date()){
  const tasks=(state?.tasks||[]).filter(t=>t?.kind==='house'&&t.type==='daily'&&scheduledToday(t,now)),today=dateKey(now),done=new Set((state?.completions||[]).filter(c=>c?.date===today&&c?.kind==='house').map(c=>String(c.taskId))),completed=tasks.filter(t=>done.has(String(t.id))).length;
  return {total:tasks.length,done:completed,remaining:Math.max(0,tasks.length-completed),pct:tasks.length?Math.round(completed/tasks.length*100):0};
}
function todayMine(state,now=new Date()){
  const today=dateKey(now);
  return (state?.completions||[]).filter(c=>c?.date===today&&c?.kind==='house'&&c?.by===state?.user).length;
}
function low(status){return status?.energy==='low'||status?.capacity==='low'||status?.stress==='high'}
function strainText(status){
  const parts=[];
  if(status?.energy==='low')parts.push('lav energi');
  if(status?.capacity==='low')parts.push('lite overskudd');
  if(status?.stress==='high')parts.push('høyt stress');
  return parts.slice(0,2).join(' og ')||'lite å gå på';
}
function currentDismissals(preferences,now=new Date()){
  return preferences?.dismissedDate===dateKey(now)&&Array.isArray(preferences.dismissedIds)?preferences.dismissedIds.map(String):[];
}
function toneText(tone,variants){return variants[tone]||variants.warm||Object.values(variants)[0]}
function preferenceThreshold(frequency){return frequency==='quiet'?90:frequency==='active'?25:50}
function normalizePreferences(value,now=new Date()){
  const next={...DEFAULT_PREFERENCES,...(value&&typeof value==='object'?value:{})};
  next.frequency=['quiet','balanced','active'].includes(next.frequency)?next.frequency:'balanced';
  next.tone=['warm','direct','gentle'].includes(next.tone)?next.tone:'warm';
  for(const key of ['enabled','initiative','askHelp','relationship','recognition'])next[key]=next[key]!==false;
  next.dismissedIds=currentDismissals(next,now);
  next.dismissedDate=next.dismissedIds.length?dateKey(now):'';
  return next;
}
function buildCandidates({state,preferences,myStatus,partnerStatus,partnerName='partneren din',now=new Date()}){
  const prefs=normalizePreferences(preferences,now),remaining=remainingTasks(state,now),progress=todayProgress(state,now),mine=todayMine(state,now),myFresh=freshStatus(myStatus,now.getTime()),partnerFresh=freshStatus(partnerStatus,now.getTime()),candidates=[];
  if(!prefs.enabled||quietHours(now))return candidates;
  const hasRemaining=remaining.length>0,dailyWord=progress.remaining===1?'ett gjøremål':`${progress.remaining} gjøremål`,myNeeds=myFresh?myStatus?.needs||[]:[],partnerNeeds=partnerFresh?partnerStatus?.needs||[]:[],myRelief=myNeeds.some(n=>n==='relief'||n==='initiative'),partnerRelief=partnerNeeds.some(n=>n==='relief'||n==='initiative'),myReason=myRelief?'behov for avlastning':strainText(myStatus),partnerReason=partnerRelief?'behov for avlastning':strainText(partnerStatus);

  if(prefs.askHelp&&myFresh&&partnerFresh&&low(myStatus)&&low(partnerStatus)){
    candidates.push({
      id:'balance:both-low',kind:'askHelp',priority:105,icon:'≈',
      title:toneText(prefs.tone,{warm:'I dag kan godt nok være målet',direct:'Begge har lite kapasitet',gentle:'Kanskje dette er en roligere dag'}),
      body:toneText(prefs.tone,{warm:`Både du og ${partnerName} har markert lite å gå på. Velg det viktigste, og la resten få vente uten dårlig samvittighet.`,direct:`Begge har lite kapasitet. Prioriter det viktigste og utsett resten.`,gentle:`Både du og ${partnerName} har markert lite overskudd. Kanskje dere kan bli enige om hva som faktisk må gjøres i dag.`}),
      action:hasRemaining?'openTasks':null,actionLabel:hasRemaining?'Se dagens plan':''
    });
  }

  if(prefs.askHelp&&myFresh&&(low(myStatus)||myRelief)&&hasRemaining){
    candidates.push({
      id:`ask-help:status:${dateKey(now)}`,kind:'askHelp',priority:100,icon:'♡',
      title:toneText(prefs.tone,{warm:'Litt hjelp kan gjøre dagen lettere',direct:'Be om avlastning nå',gentle:'Kanskje du kan slippe én ting'}),
      body:toneText(prefs.tone,{warm:`Du har valgt ${myReason}. Se dagens plan og velg selv hva det vil hjelpe å få avlastning med.`,direct:`Du har valgt ${myReason}. Velg selv hva du vil be ${partnerName} om hjelp med.`,gentle:`Du har valgt ${myReason}. Hvis det passer, kan du se om noe i planen kan deles eller vente.`}),
      action:'openTasks',actionLabel:'Se dagens plan'
    });
  }

  if(prefs.initiative&&partnerFresh&&(low(partnerStatus)||partnerRelief)&&hasRemaining){
    const left=progress.remaining?`Det står igjen ${dailyWord} i dagens plan.`:'Det står fortsatt gjøremål igjen denne uken.';
    candidates.push({
      id:`initiative:status:${dateKey(now)}`,kind:'initiative',priority:95,icon:'↗',
      title:toneText(prefs.tone,{warm:`Gjør dagen litt lettere for ${partnerName}`,direct:'Ta én oppgave før det blir spurt',gentle:'Et lite initiativ kan hjelpe'}),
      body:toneText(prefs.tone,{warm:`${partnerName} har markert ${partnerReason}. ${left} Se planen og velg selv om det er noe du vil ta.`,direct:`${partnerName} har markert ${partnerReason}. ${left} Velg selv om du vil ta noe.`,gentle:`${partnerName} har markert ${partnerReason}. ${left} Hvis du har kapasitet, kan du se om noe passer å ta.`}),
      action:'openTasks',actionLabel:'Se dagens plan'
    });
  }

  if(prefs.initiative&&partnerFresh&&(partnerStatus?.needs||[]).includes('quiet')&&hasRemaining&&progress.remaining<=2){
    candidates.push({
      id:`quiet:status:${dateKey(now)}`,kind:'initiative',priority:92,icon:'☾',
      title:toneText(prefs.tone,{warm:'Litt mindre rundt dere',direct:'Skap ro nå',gentle:'Kanskje rydde plass til ro'}),
      body:`${partnerName} har markert behov for ro. ${progress.remaining?`Bare ${dailyWord} står igjen i dagens plan.`:'Det står fortsatt noe igjen.'} Se selv om noe kan tas, deles eller vente.`,
      action:'openTasks',actionLabel:'Se dagens plan'
    });
  }

  if(prefs.relationship&&partnerNeeds.some(n=>n==='closeness'||n==='sex')&&(progress.total===0||progress.pct>=70||progress.remaining<=1)){
    const done=progress.total&&progress.pct>=100?'Dagens gjøremål er unnagjort.':progress.total?`Dere har tatt ${progress.pct} % av dagens gjøremål.`:'Dagen har litt plass i seg.';
    candidates.push({
      id:'relationship:partner-needs-closeness',kind:'relationship',priority:progress.pct>=100?91:82,icon:'♥',
      title:toneText(prefs.tone,{warm:'Skap litt rom for dere',direct:'Send en invitasjon',gentle:'Kanskje det er plass til dere'}),
      body:toneText(prefs.tone,{warm:`${done} ${partnerName} har markert behov for nærhet. Kanskje send en liten invitasjon til senere?`,direct:`${done} ${partnerName} ønsker nærhet. Foreslå litt tid sammen.`,gentle:`${done} ${partnerName} har markert nærhet. Hvis det kjennes riktig, kan du åpne døren for litt tid sammen.`}),
      action:'invitation',actionLabel:'Send en liten invitasjon'
    });
  }

  if(prefs.relationship&&myNeeds.some(n=>n==='closeness'||n==='sex')&&(progress.total===0||progress.pct>=70||progress.remaining<=1)){
    candidates.push({
      id:'relationship:my-needs-closeness',kind:'relationship',priority:79,icon:'♥',
      title:toneText(prefs.tone,{warm:'Gjør ønsket ditt tydelig',direct:'Si at du ønsker tid sammen',gentle:'Kanskje dele et lite ønske'}),
      body:`Du har markert behov for nærhet${progress.total?`, og dere er ${progress.pct} % gjennom dagens gjøremål`:''}. Flyt kan hjelpe deg å sende en enkel invitasjon uten å gjøre det større enn det er.`,
      action:'invitation',actionLabel:`Inviter ${partnerName}`
    });
  }

  if(prefs.recognition&&mine>=2){
    candidates.push({
      id:`recognition:${dateKey(now)}:${Math.min(mine,4)}`,kind:'recognition',priority:mine>=4?70:56,icon:'✓',
      title:toneText(prefs.tone,{warm:'Det du gjør teller',direct:'Bra levert',gentle:'Legg merke til det du allerede har gjort'}),
      body:remaining.length?`Du har allerede tatt ${mine} gjøremål i dag. Det står fortsatt noe igjen, men Flyt skal også vise innsatsen – ikke bare neste oppgave.`:`Du har tatt ${mine} gjøremål i dag, og dagens rytme er i mål. Bra levert.`,
      action:null,actionLabel:''
    });
  }

  const dismissed=new Set(currentDismissals(prefs,now));
  return candidates.filter(c=>c.priority>=preferenceThreshold(prefs.frequency)&&!dismissed.has(c.id)).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
}
function requestMessage({task,partnerName,tone='warm',status}){
  const ref=taskReference(task),needs=status?.needs||[],strain=needs.some(n=>n==='relief'||n==='initiative')?'behov for litt avlastning':strainText(status);
  return toneText(tone,{
    warm:`Jeg har ${strain} i dag. Jeg hadde satt stor pris på om du kunne ta deg av ${ref}. Det ville gjort dagen litt lettere for meg ❤️`,
    direct:`Jeg har ${strain} i dag. Kan du ta deg av ${ref}? Det ville hjulpet meg mye.`,
    gentle:`Jeg har ${strain} i dag. Hvis du har mulighet, hadde jeg satt pris på om du kunne ta deg av ${ref}.`
  });
}
function makeRequest({state,task,text,now=Date.now()}){
  const request=coupleCore?.makeSupportRequest?.({state,task,text,now})||{id:`req_${now}`,kind:'support',type:'practical',text:String(text||'').trim(),by:state.user,createdAt:now,responseState:'pending',seen:false,done:false,deleted:false,source:'nudge',taskId:task?.id??null,taskName:task?.name||''};
  return {request};
}

const core={DEFAULT_PREFERENCES,dateKey,freshStatus,quietHours,remainingTasks,todayProgress,normalizePreferences,buildCandidates,requestMessage,makeRequest};
if(typeof module==='object'&&module.exports)module.exports=core;
if(!root?.document)return;

const document=root.document,$=s=>document.querySelector(s),bridge=()=>root.FlytBridge;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let statusContext=null,statusLoadedAt=0,statusLoading=false,painting=false,sessionDay=dateKey(),sessionSkipped=new Set(),currentCandidates=[];

function state(){return bridge()?.getState?.()||null}
function preferenceKey(s=state()){
  const userId=root.FlytSync?.getContext?.()?.user_id;
  return userId?`user:${userId}`:`name:${String(s?.user||'Meg').trim()||'Meg'}`;
}
function preferences(s=state()){
  return normalizePreferences(s?.nudgePreferences?.[preferenceKey(s)]);
}
function withPreferences(s,next){
  return {...s,nudgePreferences:{...(s?.nudgePreferences||{}),[preferenceKey(s)]:normalizePreferences(next)}};
}
function save(next){bridge()?.setState?.(next);root.FlytSync?.queueSave?.()}
function partnerName(s=state()){
  const ctx=root.FlytSync?.getContext?.(),member=ctx?.members?.find(m=>String(m.id)!==String(ctx?.user_id));
  return member?.display_name||Object.keys(s?.points||{}).find(n=>n!==s?.user)||'partneren din';
}
function statuses(){
  const ctx=root.FlytSync?.getContext?.(),rows=Array.isArray(statusContext?.statuses)?statusContext.statuses:[],userId=statusContext?.user_id||ctx?.user_id;
  return {myStatus:rows.find(r=>String(r.user_id)===String(userId))||null,partnerStatus:rows.find(r=>String(r.user_id)!==String(userId))||null};
}
async function refreshStatus(force=false){
  if(statusLoading||!root.FlytSync?.rpc)return;
  if(!force&&statusContext&&Date.now()-statusLoadedAt<60000)return;
  statusLoading=true;
  try{
    const {data,error}=await root.FlytSync.rpc('get_oss_context',{});
    if(error)throw error;
    statusContext=data||{statuses:[]};
    statusLoadedAt=Date.now();
  }catch(error){
    console.warn('Flyt nudges kunne ikke hente dagsform',error);
    statusContext=statusContext||{statuses:[]};
  }finally{
    statusLoading=false;
    augment();
  }
}
function resetSessionDay(){
  const today=dateKey();
  if(sessionDay!==today){sessionDay=today;sessionSkipped=new Set()}
}
function candidates(s=state()){
  resetSessionDay();
  const rows=statuses(),all=buildCandidates({state:s,preferences:preferences(s),myStatus:rows.myStatus,partnerStatus:rows.partnerStatus,partnerName:partnerName(s),now:new Date()});
  return all.filter(c=>!sessionSkipped.has(c.id));
}
function ensureStyles(){
  if($('#flytNudgeStyles'))return;
  const style=document.createElement('style');
  style.id='flytNudgeStyles';
  style.textContent=`
  .flytNudgeCard{position:relative;margin:14px 0;padding:16px;border:1px solid #e9cfbf;border-radius:21px;background:linear-gradient(145deg,#fffdf9,#fff0e8);box-shadow:0 11px 28px #79463012;overflow:hidden}
  .flytNudgeCard:before{content:'';position:absolute;width:110px;height:110px;border-radius:50%;right:-46px;top:-55px;background:#f8d3c177;pointer-events:none}
  .flytNudgeIcon{width:42px;height:42px;flex:0 0 42px;border-radius:14px;display:grid;place-items:center;background:#fff;color:var(--deep);font-size:22px;box-shadow:0 5px 14px #79463012}
  .flytNudgeActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px}
  .flytNudgeActions .primary{flex:1;min-width:180px;min-height:46px}
  .flytNudgeSwitch{width:48px;height:28px;border:0;border-radius:999px;background:#d8cbc5;padding:3px;display:flex;justify-content:flex-start;flex:0 0 auto}
  .flytNudgeSwitch:after{content:'';width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 7px #49302b33}
  .flytNudgeSwitch[aria-checked="true"]{background:var(--accent);justify-content:flex-end}
  #flytNudgeModal{position:fixed;inset:0;z-index:340;background:#3a211b99;display:flex;align-items:center;justify-content:center;padding:20px}
  #flytNudgeModal .flytNudgeDialog{width:min(410px,100%);max-height:90dvh;overflow:auto;background:#fffaf7;border:1px solid var(--line);border-radius:27px;padding:22px;box-shadow:0 28px 80px #3b211b55}
  `;
  document.head.appendChild(style);
}
function cardMarkup(candidate,count){
  return `<section class="flytNudgeCard" data-flyt-nudge-card="${esc(candidate.id)}" aria-label="Et lite dytt"><div class="row" style="align-items:flex-start;position:relative"><div class="flytNudgeIcon" aria-hidden="true">${esc(candidate.icon||'✨')}</div><div class="grow"><div class="ey">Et lite dytt</div><strong style="display:block;font:600 21px/1.15 Georgia,serif;margin-top:5px">${esc(candidate.title)}</strong></div></div><p style="line-height:1.5;margin:13px 0 0">${esc(candidate.body)}</p><div class="flytNudgeActions">${candidate.action?`<button type="button" class="primary" data-nudge-action="${esc(candidate.action)}" data-nudge-id="${esc(candidate.id)}">${esc(candidate.actionLabel)}</button>`:''}${count>1?'<button type="button" class="small" data-nudge-next="1">Vis et annet</button>':''}<button type="button" class="small" data-nudge-dismiss="1">Skjul i dag</button></div></section>`;
}
function augment(){
  if(painting)return;
  const s=state(),mount=$('#homeNudgeMount');
  if(!s||s.view!=='home'||!mount)return;
  if(mount.dataset.firstWinActive==='1')return;
  ensureStyles();
  if(!statusContext&&!statusLoading){refreshStatus();return}
  painting=true;
  try{
    currentCandidates=candidates(s);
    const first=currentCandidates[0];
    const html=first?cardMarkup(first,currentCandidates.length):'';
    if(mount.innerHTML!==html)mount.innerHTML=html;
  }finally{painting=false}
}
function dismissCurrent(){
  const s=state(),id=currentCandidates[0]?.id;
  if(!s||!id)return;
  const prefs=preferences(s),ids=new Set(currentDismissals(prefs));
  ids.add(String(id));
  save(withPreferences(s,{...prefs,dismissedDate:dateKey(),dismissedIds:[...ids]}));
  queueMicrotask(augment);
}
function nextCandidate(){
  const id=currentCandidates[0]?.id;
  if(!id)return;
  sessionSkipped.add(id);
  if(!candidates(state()).length)sessionSkipped.clear();
  augment();
}
function closeModal(){$('#flytNudgeModal')?.remove()}
function openHelp(candidate){
  const s=state();
  if(!s||!candidate?.task)return;
  closeModal();
  const prefs=preferences(s),rows=statuses(),partner=partnerName(s),message=requestMessage({task:candidate.task,partnerName:partner,tone:prefs.tone,status:rows.myStatus}),el=document.createElement('div');
  el.id='flytNudgeModal';
  el.innerHTML=`<div class="flytNudgeDialog" role="dialog" aria-modal="true" aria-labelledby="flytNudgeTitle"><div class="ey">Be om hjelp</div><h2 id="flytNudgeTitle" style="font:500 28px/1.12 Georgia;margin:9px 0 7px">Gjør behovet konkret</h2><p class="sub" style="margin-top:0">Meldingen sendes til ${esc(partner)} under Sett. Du kan endre teksten før du sender.</p><div class="card" style="box-shadow:none"><div class="ey">Gjøremål</div><strong style="display:block;margin-top:5px">${esc(candidate.task.name)}</strong></div><label class="label" for="flytNudgeMessage">Melding</label><textarea id="flytNudgeMessage" rows="5" maxlength="600" style="width:100%;resize:vertical;min-height:125px;border:1px solid var(--line);border-radius:15px;background:#fff;padding:12px 14px;font:inherit;color:inherit;outline:none;margin-top:6px">${esc(message)}</textarea><div class="card" style="box-shadow:none;margin-top:14px;background:#fff9f5"><strong>Konkret forespørsel, fritt svar</strong><p class="sub" style="margin-bottom:0">${esc(partner)} kan ta oppgaven, foreslå en annen, si at det ikke passer eller skrive et kort svar.</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button type="button" class="secondary" data-nudge-modal-cancel="1">Avbryt</button><button type="button" class="primary" data-nudge-send-help="${esc(candidate.id)}">Send til ${esc(partner)}</button></div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click',event=>{if(event.target===el)closeModal()});
  setTimeout(()=>$('#flytNudgeMessage')?.focus(),40);
}
function sendHelp(id){
  const s=state(),candidate=currentCandidates.find(c=>c.id===id)||currentCandidates[0],text=$('#flytNudgeMessage')?.value.trim();
  if(!s||!candidate?.task)return;
  if(!text){$('#flytNudgeMessage')?.focus();return}
  const made=makeRequest({state:s,task:candidate.task,text}),prefs=preferences(s),dismissed=new Set(currentDismissals(prefs));
  dismissed.add(candidate.id);
  let next={...s,seenRequests:[made.request,...(s.seenRequests||[])]};
  next=withPreferences(next,{...prefs,dismissedDate:dateKey(),dismissedIds:[...dismissed]});
  save(next);
  closeModal();
  bridge()?.toast?.('Forespørselen er sendt');
  root.FlytSeenRequestAlert?.checkAlerts?.();
}
function openInvitation(candidate){
  const s=state();
  if(!s)return;
  closeModal();
  const partner=partnerName(s),el=document.createElement('div');
  el.id='flytNudgeModal';
  el.innerHTML=`<div class="flytNudgeDialog" role="dialog" aria-modal="true" aria-labelledby="flytNudgeTitle"><div class="ey">♥ Tid for oss</div><h2 id="flytNudgeTitle" style="font:500 28px/1.12 Georgia;margin:9px 0 7px">Send en liten invitasjon</h2><p class="sub" style="margin-top:0">Et konkret forslag til ${esc(partner)} – uten poeng, plikt eller skjult kontrakt.</p><div style="display:flex;gap:7px;flex-wrap:wrap;margin:14px 0"><button type="button" class="small" data-nudge-invite-preset="Sofa og noe godt i kveld?">🛋 Sofa og noe godt</button><button type="button" class="small" data-nudge-invite-preset="En liten tur sammen senere?">🌿 En liten tur</button><button type="button" class="small" data-nudge-invite-preset="Litt tid tett sammen i kveld?">♥ Tid tett sammen</button></div><label class="label" for="flytNudgeInvitation">Invitasjon</label><input id="flytNudgeInvitation" class="field" maxlength="240" autocomplete="off" value="Litt tid sammen i kveld?" placeholder="F.eks. Skal vi ta en liten tur etter legging?"><div class="card" style="box-shadow:none;margin-top:14px"><strong>En invitasjon, ikke en analyse</strong><p class="sub" style="margin-bottom:0">${esc(partner)} kan svare «Gjerne», «Litt senere», foreslå noe annet eller si «Ikke i kveld».</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button type="button" class="secondary" data-nudge-modal-cancel="1">Avbryt</button><button type="button" class="primary" data-nudge-send-invitation="${esc(candidate?.id||'relationship')}">Send invitasjon</button></div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click',event=>{if(event.target===el)closeModal()});
  setTimeout(()=>$('#flytNudgeInvitation')?.select(),40);
}
function sendInvitation(id){
  const s=state(),title=$('#flytNudgeInvitation')?.value.trim();
  if(!s||!title){$('#flytNudgeInvitation')?.focus();return}
  const now=Date.now(),invitation=coupleCore?.makeInvitation?.({state:s,text:title,notifyPartner:true,now})||{id:`invite_${now}`,text:title,by:s.user,createdAt:now,notifyPartner:true,seenBy:[s.user],response:null,deleted:false},prefs=preferences(s),dismissed=new Set(currentDismissals(prefs));
  dismissed.add(id);
  const next=withPreferences({...s,coupleInvitations:[invitation,...(s.coupleInvitations||[])]},{...prefs,dismissedDate:dateKey(),dismissedIds:[...dismissed]});
  save(next);
  closeModal();
  bridge()?.toast?.(`Invitasjonen er sendt til ${partnerName(s)}`);
  root.FlytCoupleInvitations?.checkAlerts?.();
}
function takeInitiative(candidate){
  const s=state();
  if(!s||!candidate?.task)return;
  const prefs=preferences(s),dismissed=new Set(currentDismissals(prefs)),item=coupleCore?.makeInitiative?.({state:s,task:candidate.task,partnerName:partnerName(s)})||{id:`initiative_${Date.now()}`,kind:'initiative',source:'initiative',type:'practical',text:taskLanguage?.initiativeText?.(candidate.task)||`Jeg tar ansvar for ${taskReference(candidate.task)} i dag.`,by:s.user,for:partnerName(s),createdAt:Date.now(),responseState:'accepted',taskId:candidate.task.id,taskName:taskName(candidate.task),acceptedBy:s.user,acceptedAt:new Date().toISOString(),seen:false,done:false,deleted:false};
  dismissed.add(candidate.id);
  save(withPreferences({...s,seenRequests:[item,...(s.seenRequests||[])]},{...prefs,dismissedDate:dateKey(),dismissedIds:[...dismissed]}));
  bridge()?.toast?.(`Initiativet er registrert: ${taskReference(candidate.task)}`);
  root.FlytSeenRequestAlert?.checkAlerts?.();
}
function openTasks(){
  const s=state();
  if(!s)return;
  save({...s,view:'tasks'});
  queueMicrotask(()=>root.FlytTasksUI?.render?.({resetScroll:true}));
}
function settingsMarkup(){
  const prefs=preferences(),toggle=(key,title,text)=>`<div class="card row" style="box-shadow:none;align-items:flex-start"><div class="grow"><strong>${esc(title)}</strong><p class="sub" style="margin:4px 0 0;font-size:13px">${esc(text)}</p></div><button type="button" class="flytNudgeSwitch" role="switch" aria-label="${esc(title)}" aria-checked="${prefs[key]?'true':'false'}" data-nudge-setting-toggle="${key}"></button></div>`;
  return `<div class="ey">Personlig tilpasning</div><h1 class="title">Nudges og forslag</h1><p class="sub">Velg hva Flyt skal hjelpe deg med. Valgene gjelder bare din visning; partneren kan velge annerledes.</p>${toggle('enabled','Vis nudges på Hjem','Flyt viser bare forslag som bygger på et konkret, ferskt signal.')}<div style="${prefs.enabled?'':'opacity:.48;pointer-events:none'}"><div class="section"><strong>Hva skal Flyt foreslå?</strong>${toggle('initiative','Ta initiativ','Forslag basert på partnerens ferske dagsform og gjøremål som gjenstår.')}${toggle('askHelp','Be om hjelp','Hjelp til å formulere en konkret forespørsel når du har lite kapasitet.')}${toggle('relationship','Tid for oss','Små invitasjoner når dagsrytmen og behovene gir rom for det.')}${toggle('recognition','Anerkjennelse og balanse','Vis også hva du allerede har gjort – ikke bare neste oppgave.')}</div><div class="section"><strong>Hvor ofte?</strong><div class="segments" style="grid-template-columns:repeat(3,1fr);margin-top:9px"><button type="button" data-nudge-frequency="quiet" class="${prefs.frequency==='quiet'?'on':''}">Rolig</button><button type="button" data-nudge-frequency="balanced" class="${prefs.frequency==='balanced'?'on':''}">Balansert</button><button type="button" data-nudge-frequency="active" class="${prefs.frequency==='active'?'on':''}">Aktiv</button></div><p class="sub" style="font-size:13px;margin-top:8px">Valget styrer hvor tydelig signalet må være. Flyt velger aldri et gjøremål på dine vegne.</p></div><div class="section"><strong>Tone</strong><div class="segments" style="grid-template-columns:repeat(3,1fr);margin-top:9px"><button type="button" data-nudge-tone="warm" class="${prefs.tone==='warm'?'on':''}">Varm</button><button type="button" data-nudge-tone="direct" class="${prefs.tone==='direct'?'on':''}">Direkte</button><button type="button" data-nudge-tone="gentle" class="${prefs.tone==='gentle'?'on':''}">Forsiktig</button></div></div></div><div class="card" style="margin-top:18px;background:#fff9f5;box-shadow:none"><strong>Ferske data, ikke tankelesing</strong><p class="sub" style="margin-bottom:0">Statusbaserte forslag brukes bare samme kalenderdag og i maksimalt 12 timer, og aldri mellom kl. 23 og 06. Når Flyt ikke har et godt grunnlag, vises ingen nudge.</p></div>`;
}
function updatePreference(key,value){
  const s=state();
  if(!s)return;
  const prefs=preferences(s),allowed=['enabled','initiative','askHelp','relationship','recognition','frequency','tone'];
  if(!allowed.includes(key))return;
  save(withPreferences(s,{...prefs,[key]:value}));
  if(key==='enabled'&&value)refreshStatus(true);
}
function handleSettingsAction(target){
  const toggle=target.closest?.('[data-nudge-setting-toggle]');
  if(toggle){const key=toggle.dataset.nudgeSettingToggle,prefs=preferences();updatePreference(key,!prefs[key]);return true}
  const frequency=target.closest?.('[data-nudge-frequency]');
  if(frequency){updatePreference('frequency',frequency.dataset.nudgeFrequency);return true}
  const tone=target.closest?.('[data-nudge-tone]');
  if(tone){updatePreference('tone',tone.dataset.nudgeTone);return true}
  return false;
}

document.addEventListener('click',event=>{
  const cancel=event.target.closest?.('[data-nudge-modal-cancel]');
  if(cancel){event.preventDefault();closeModal();return}
  const dismiss=event.target.closest?.('[data-nudge-dismiss]');
  if(dismiss){event.preventDefault();dismissCurrent();return}
  const next=event.target.closest?.('[data-nudge-next]');
  if(next){event.preventDefault();nextCandidate();return}
  const preset=event.target.closest?.('[data-nudge-invite-preset]');
  if(preset){event.preventDefault();const input=$('#flytNudgeInvitation');if(input){input.value=preset.dataset.nudgeInvitePreset;input.focus()}return}
  const action=event.target.closest?.('[data-nudge-action]');
  if(action){event.preventDefault();const candidate=currentCandidates.find(c=>c.id===action.dataset.nudgeId)||currentCandidates[0];if(action.dataset.nudgeAction==='askHelp')openHelp(candidate);else if(action.dataset.nudgeAction==='invitation')openInvitation(candidate);else if(action.dataset.nudgeAction==='takeInitiative')takeInitiative(candidate);else if(action.dataset.nudgeAction==='openTasks')openTasks();return}
  const sendHelpButton=event.target.closest?.('[data-nudge-send-help]');
  if(sendHelpButton){event.preventDefault();sendHelp(sendHelpButton.dataset.nudgeSendHelp);return}
  const sendInvitationButton=event.target.closest?.('[data-nudge-send-invitation]');
  if(sendInvitationButton){event.preventDefault();sendInvitation(sendInvitationButton.dataset.nudgeSendInvitation)}
},true);

function install(){
  ensureStyles();
  const content=$('#content');
  if(content)new MutationObserver(()=>{if(!painting&&state()?.view==='home')queueMicrotask(augment)}).observe(content,{childList:true,subtree:true});
  augment();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
root.addEventListener('pageshow',()=>{statusContext=null;statusLoadedAt=0;augment()});
root.FlytNudgeUI={augment,refreshStatus,settingsMarkup,updatePreference,handleSettingsAction,openHelp,openInvitation,takeInitiative,core,version:VERSION};
})(typeof window!=='undefined'?window:null);
