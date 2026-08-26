((root)=>{
'use strict';

function dateKey(value){
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return keyDate(value)?value:null;
  const d=value instanceof Date?new Date(value):new Date(value);
  if(Number.isNaN(d.getTime()))return null;
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function keyDate(key){
  const match=String(key||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match)return null;
  const d=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12);
  return Number.isNaN(d.getTime())||d.getFullYear()!==Number(match[1])||d.getMonth()!==Number(match[2])-1||d.getDate()!==Number(match[3])?null:d;
}
function addDays(key,amount){
  const d=keyDate(key);
  if(!d)return null;
  d.setDate(d.getDate()+amount);
  return dateKey(d);
}
function mondayKey(value=new Date()){
  const d=value instanceof Date?new Date(value):keyDate(dateKey(value));
  if(!d||Number.isNaN(d.getTime()))return null;
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  return dateKey(d);
}
function taskNameMap(state){
  const map=new Map();
  for(const t of [...(state?.tasks||[]),...(state?.custom||[])]){
    if(t?.id!=null&&t?.name)map.set(String(t.id),String(t.name));
  }
  return map;
}
function events(state){
  const names=taskNameMap(state),out=[];
  for(const completion of state?.completions||[]){
    const day=dateKey(completion?.date),id=completion?.taskId;
    if(!day||id==null)continue;
    const known=String(completion.taskName||names.get(String(id))||'').trim();
    out.push({key:known?`task:${id}`:'task:unknown',name:known||'Tidligere gjøremål',date:day,by:String(completion.by||'')});
  }
  for(const task of state?.plannedTasks||[]){
    if(!task?.done)continue;
    const day=dateKey(task.doneAt||task.date),name=String(task.title||'Ekstraoppgave').trim()||'Ekstraoppgave';
    if(!day)continue;
    out.push({key:`planned:${task.id??name}`,name,date:day,by:String(task.doneBy||'')});
  }
  return out;
}
function aggregate(list){
  const map=new Map();
  for(const event of list){
    let row=map.get(event.key);
    if(!row){row={key:event.key,name:event.name,count:0,by:{}};map.set(event.key,row)}
    row.count++;
    if(event.by)row.by[event.by]=(row.by[event.by]||0)+1;
  }
  return [...map.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'nb'));
}
function currentWeek(state,now=new Date(),mineOnly=false){
  const start=mondayKey(now),end=addDays(start,6),me=String(state?.user||'');
  const list=events(state).filter(x=>x.date>=start&&x.date<=end&&(!mineOnly||x.by===me));
  return {start,end,total:list.length,rows:aggregate(list)};
}
function olderWeeks(state,now=new Date(),mineOnly=false){
  const current=mondayKey(now),me=String(state?.user||''),groups=new Map();
  for(const event of events(state)){
    if(event.date>=current||(mineOnly&&event.by!==me))continue;
    const start=mondayKey(event.date);
    if(!start)continue;
    if(!groups.has(start))groups.set(start,[]);
    groups.get(start).push(event);
  }
  return [...groups.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([start,list])=>({start,end:addDays(start,6),total:list.length,rows:aggregate(list)}));
}

const core={dateKey,mondayKey,events,aggregate,currentWeek,olderWeeks};
if(typeof module==='object'&&module.exports)module.exports=core;
if(!root?.document)return;

const document=root.document,$=s=>document.querySelector(s),bridge=()=>root.FlytBridge;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let historyScope='mine',previousFocus=null,scheduled=false;

function actorSummary(row,state){
  const me=String(state?.user||''),parts=Object.entries(row.by||{}).filter(([,n])=>n>0).sort(([a],[b])=>a===b?0:a===me?-1:b===me?1:a.localeCompare(b,'nb'));
  return parts.map(([name,count])=>`${name===me?'Du':name} ${count}`).join(' · ')||`${row.count} ${row.count===1?'registrering':'registreringer'}`;
}
function rowHtml(row,state){
  return `<div class="card" style="margin:8px 0"><div class="row"><div class="grow"><strong>${esc(row.name)}</strong><div class="taskmeta">${esc(actorSummary(row,state))}</div></div><span class="tag">${row.count} ${row.count===1?'gang':'ganger'}</span></div></div>`;
}
function weekLabel(week){
  const start=keyDate(week.start),end=keyDate(week.end);
  if(!start||!end)return 'Tidligere uke';
  const sameMonth=start.getMonth()===end.getMonth()&&start.getFullYear()===end.getFullYear();
  const first=start.toLocaleDateString('nb-NO',sameMonth?{day:'numeric'}:{day:'numeric',month:'long'});
  const last=end.toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'});
  return `${first}.–${last}`;
}
function ensureStyles(){
  if($('#flytHistoryStyles'))return;
  const style=document.createElement('style');
  style.id='flytHistoryStyles';
  style.textContent=`
  #flytSettingsRoot{position:fixed;inset:0;z-index:295;background:#fff7f1;display:grid;grid-template-rows:auto minmax(0,1fr);color:var(--ink)}
  #flytSettingsRoot .flytSettingsHead{padding:max(14px,env(safe-area-inset-top)) 16px 12px;border-bottom:1px solid var(--line);background:#fff;display:flex;align-items:center;gap:10px}
  #flytSettingsRoot .flytSettingsBody{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:18px 15px max(28px,env(safe-area-inset-bottom))}
  #flytSettingsRoot .flytSettingsAction{width:100%;display:flex;align-items:center;gap:12px;text-align:left;margin-top:9px}
  @media(min-width:700px){#flytSettingsRoot{width:420px;height:min(880px,calc(100dvh - 40px));inset:auto;border:7px solid #211816;border-radius:38px;overflow:hidden}}
  `;
  document.head.appendChild(style);
}
function ensureRoot(){
  let el=$('#flytSettingsRoot');
  if(el)return el;
  ensureStyles();
  el=document.createElement('div');
  el.id='flytSettingsRoot';
  el.className='hidden';
  el.setAttribute('aria-hidden','true');
  document.body.appendChild(el);
  return el;
}
function closeSettings(){
  const el=ensureRoot();
  el.classList.add('hidden');
  el.setAttribute('aria-hidden','true');
  previousFocus?.focus?.();
  previousFocus=null;
}
function shell(title,body,back=false){
  const el=ensureRoot();
  el.innerHTML=`<div class="flytSettingsHead"><button type="button" class="pill" data-history-back="${back?'settings':'close'}">${back?'Tilbake':'Lukk'}</button><div class="grow"><div class="ey">Innstillinger</div><strong>${esc(title)}</strong></div><button type="button" class="pill" data-history-close="1" aria-label="Lukk">×</button></div><div class="flytSettingsBody">${body}</div>`;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>el.querySelector('[data-history-back]')?.focus());
}
function openSettings(){
  if(ensureRoot().classList.contains('hidden')){
    const active=document.activeElement;
    previousFocus=active?.closest?.('#flytAppMenu')?$('#flytMoreBtn'):active;
  }
  root.FlytBuyerPolish?.closeMenu?.();
  shell('Innstillinger',`<div class="ey">Flyt</div><h1 class="title">Innstillinger</h1><p class="sub">Oppsett og tidligere aktivitet ligger samlet her.</p><button type="button" class="secondary flytSettingsAction" data-settings-setup="1"><span style="font-size:20px">⚙</span><span><strong>Rediger oppsett</strong><span class="taskmeta" style="display:block">Gjøremål, rytme, poeng og ansvar</span></span></button><button type="button" class="secondary flytSettingsAction" data-settings-history="1"><span style="font-size:20px">↶</span><span><strong>Historikk</strong><span class="taskmeta" style="display:block">Se hva som er gjort i tidligere uker</span></span></button>`);
}
function openHistory(){
  const state=bridge()?.getState?.();
  if(!state)return;
  const weeks=olderWeeks(state,new Date(),historyScope==='mine');
  const body=`<div class="ey">Gjøremål</div><h1 class="title">Historikk</h1><p class="sub">Gjennomførte gjøremål, uke for uke. Innhold fra Sett, Oss og Fristelser vises ikke her.</p><div class="segments" style="grid-template-columns:repeat(2,1fr);margin:14px 0 18px"><button type="button" data-history-scope="mine" class="${historyScope==='mine'?'on':''}">Mine</button><button type="button" data-history-scope="together" class="${historyScope==='together'?'on':''}">Sammen</button></div>${weeks.length?weeks.map(week=>`<section class="section"><div class="row"><strong class="grow">${esc(weekLabel(week))}</strong><span class="tag">${week.total} gjort</span></div>${week.rows.map(row=>rowHtml(row,state)).join('')}</section>`).join(''):'<div class="card"><strong>Ingen eldre historikk ennå</strong><p class="sub" style="margin-bottom:0">Gjennomføringer dukker opp her når en uke er avsluttet.</p></div>'}`;
  shell('Historikk',body,true);
}
function openSetup(){
  closeSettings();
  const open=()=>root.FlytSetupV2?.open?.(1)||root.FlytTasksUI?.openSetup?.(1);
  if(open())return;
  bridge()?.toast?.('Oppsettet kunne ikke åpnes. Last inn appen på nytt.');
}
function augmentMenu(){
  const menu=$('#flytAppMenu');
  if(!menu||menu.querySelector('[data-flyt-history-settings]'))return;
  const before=menu.querySelector('[data-flyt-menu="feedback"]'),button=document.createElement('button');
  button.type='button';
  button.className='secondary flytMenuAction';
  button.dataset.flytHistorySettings='1';
  button.innerHTML='<span class="flytMenuIcon">⚙</span><span><strong>Innstillinger</strong><span class="taskmeta" style="display:block">Oppsett og historikk</span></span>';
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSettings()});
  before?.parentNode?.insertBefore(button,before);
}
function augmentTopButton(){
  const button=$('#setupBtnV2,#setupBtn');
  if(!button)return;
  if(button.textContent!=='Innstillinger')button.textContent='Innstillinger';
  if(button.getAttribute('aria-label')!=='Innstillinger')button.setAttribute('aria-label','Innstillinger');
}
function augmentWeek(){
  const state=bridge()?.getState?.(),content=$('#content');
  if(!state||state.view!=='tasks'||!content||root.FlytRecurrenceUI?.getMode?.()!=='week')return;
  if(content.querySelector('[data-current-week-history]'))return;
  const week=currentWeek(state),section=document.createElement('section');
  section.className='section';
  section.dataset.currentWeekHistory='1';
  section.innerHTML=`<div class="ey">Gjort denne uken</div><p class="sub">${week.total?`${week.total} ${week.total===1?'gjennomføring er registrert':'gjennomføringer er registrert'} så langt.`:'Her samles gjøremål etter hvert som de blir gjort.'}</p>${week.rows.length?week.rows.map(row=>rowHtml(row,state)).join(''):'<div class="card">Ingen gjøremål registrert denne uken.</div>'}`;
  const anchor=content.querySelector('#plannedSection')||content.querySelector('[data-open-new-setup],[data-open-setup]');
  if(anchor)content.insertBefore(section,anchor);else content.appendChild(section);
}
function scheduleAugment(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;augmentMenu();augmentTopButton();augmentWeek()});
}
function handleClick(e){
  const top=e.target.closest?.('#setupBtnV2,#setupBtn');
  if(top&&bridge()?.getState?.()?.setupDone!==false){e.preventDefault();e.stopImmediatePropagation();openSettings();return}
  if(e.target.closest?.('[data-history-close]')){e.preventDefault();closeSettings();return}
  const back=e.target.closest?.('[data-history-back]');
  if(back){e.preventDefault();back.dataset.historyBack==='settings'?openSettings():closeSettings();return}
  if(e.target.closest?.('[data-settings-history]')){e.preventDefault();historyScope='mine';openHistory();return}
  if(e.target.closest?.('[data-settings-setup]')){e.preventDefault();openSetup();return}
  const scope=e.target.closest?.('[data-history-scope]');
  if(scope){e.preventDefault();historyScope=scope.dataset.historyScope==='together'?'together':'mine';openHistory()}
}
function install(){
  ensureStyles();
  ensureRoot();
  scheduleAugment();
  document.addEventListener('click',handleClick,true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!ensureRoot().classList.contains('hidden')){e.preventDefault();closeSettings()}},true);
  new MutationObserver(scheduleAugment).observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
root.FlytHistoryUI={openSettings,openHistory,close:closeSettings,augmentWeek,core,version:'20260826-1740'};
})(typeof window!=='undefined'?window:null);
