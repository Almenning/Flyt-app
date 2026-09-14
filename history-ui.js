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
function taskInfoMap(state){
  const map=new Map();
  for(const task of [...(state?.tasks||[]),...(state?.custom||[])]){
    if(task?.id==null)continue;
    map.set(String(task.id),{name:String(task.name||'').trim(),category:String(task.category||task.cat||'Egendefinert').trim()||'Egendefinert',points:Math.max(0,Number(task.pts)||0)});
  }
  return map;
}
function taskNameMap(state){return new Map([...taskInfoMap(state)].map(([id,info])=>[id,info.name]))}
function awardsFor(completion,info){
  const awards=completion?.pointAwards;
  if(awards&&typeof awards==='object'&&!Array.isArray(awards))return Object.fromEntries(Object.entries(awards).filter(([name,value])=>name&&Number.isFinite(Number(value))).map(([name,value])=>[String(name),Number(value)]));
  const contributors=Array.isArray(completion?.contributors)&&completion.contributors.length?completion.contributors.map(String).filter(Boolean):[];
  const by=String(completion?.by||'');
  const names=contributors.length?contributors:(by&&by!=='Sammen'?[by]:[]);
  if(!names.length||!info?.points)return {};
  const share=info.points/names.length;
  return Object.fromEntries(names.map(name=>[name,share]));
}
function events(state){
  const info=taskInfoMap(state),out=[];
  for(const completion of state?.completions||[]){
    const day=dateKey(completion?.date),id=completion?.taskId;
    if(!day||id==null)continue;
    const task=info.get(String(id)),known=String(completion.taskName||task?.name||'').trim();
    out.push({key:known?`task:${id}`:'task:unknown',name:known||'Tidligere gjøremål',category:task?.category||'Tidligere gjøremål',date:day,by:String(completion.by||''),contributors:Array.isArray(completion?.contributors)?completion.contributors.map(String).filter(Boolean):[],awards:awardsFor(completion,task)});
  }
  for(const task of state?.plannedTasks||[]){
    if(!task?.done)continue;
    const day=dateKey(task.doneAt||task.date),name=String(task.title||'Ekstraoppgave').trim()||'Ekstraoppgave';
    if(!day)continue;
    out.push({key:`planned:${task.id??name}`,name,category:'Ekstraoppgaver',date:day,by:String(task.doneBy||''),contributors:[],awards:{}});
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
function periodStart(period,now=new Date()){const end=dateKey(now)||dateKey(new Date());const days=period==='quarter'?90:period==='month'?30:7;return addDays(end,-(days-1))}
function isTogether(event){return event?.by==='Sammen'||new Set(event?.contributors||[]).size>1}
function people(state,list){const names=new Set([String(state?.user||'').trim(),...Object.keys(state?.points||{}),...Object.keys(state?.status||{})]);for(const event of list||[]){if(event.by&&event.by!=='Sammen')names.add(event.by);for(const name of event.contributors||[])names.add(name);for(const name of Object.keys(event.awards||{}))names.add(name)}return [...names].filter(Boolean)}
function groupedWeeks(list){const groups=new Map();for(const event of list){const start=mondayKey(event.date);if(!start)continue;if(!groups.has(start))groups.set(start,[]);groups.get(start).push(event)}return [...groups.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([start,items])=>({start,end:addDays(start,6),total:items.length,rows:aggregate(items)}))}
function insights(state,period='week',now=new Date()){
  const end=dateKey(now)||dateKey(new Date()),start=periodStart(period,now),list=events(state).filter(event=>event.date>=start&&event.date<=end),names=people(state,list),counts=Object.fromEntries(names.map(name=>[name,0])),points=Object.fromEntries(names.map(name=>[name,0]));
  let together=0;const categories=new Map();
  for(const event of list){
    if(isTogether(event))together++;else if(event.by)counts[event.by]=(counts[event.by]||0)+1;
    for(const [name,value] of Object.entries(event.awards||{}))points[name]=(points[name]||0)+Number(value||0);
    const key=event.category||'Andre';let row=categories.get(key);if(!row){row={name:key,total:0,by:Object.fromEntries(names.map(name=>[name,0])),together:0};categories.set(key,row)}row.total++;if(isTogether(event))row.together++;else if(event.by)row.by[event.by]=(row.by[event.by]||0)+1;
  }
  const trendStart=mondayKey(start),trendEnd=mondayKey(end),trend=[];for(let key=trendStart;key&&key<=trendEnd;key=addDays(key,7)){trend.push({start:key,end:addDays(key,6),total:list.filter(event=>mondayKey(event.date)===key).length})}
  return {period,start,end,list,total:list.length,names,counts,points,together,categories:[...categories.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'nb')),trend,weeks:groupedWeeks(list)};
}

const core={dateKey,mondayKey,events,aggregate,currentWeek,olderWeeks,periodStart,insights,groupedWeeks};
if(typeof module==='object'&&module.exports)module.exports=core;
if(!root?.document)return;

const document=root.document,$=s=>document.querySelector(s),bridge=()=>root.FlytBridge;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VERSION='20260914-insights2';
let historyPeriod='week',historyWeekStart=null,previousFocus=null,scheduled=false;

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
  .seenPersonalGroup{margin-top:20px}.seenPersonalGroup h2{font:600 19px/1.2 Georgia,serif;margin:0 2px 8px}.seenPersonalRow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center;padding:11px 12px;margin:7px 0;border:1px solid #eadbd2;border-radius:15px;background:#fffdf9}.seenPersonalRow p{margin:0;line-height:1.35}.seenPersonalEditor{padding:14px;border:1px solid #eadbd2;border-radius:18px;background:#fffaf7}.seenPersonalEditor textarea{min-height:112px;resize:vertical}
  .historyInsightCard{margin:12px 0;padding:15px;border:1px solid #eadbd2;border-radius:18px;background:#fffdf9}.historyInsightCard h2{font:600 19px/1.2 Georgia,serif;margin:0 0 10px}.historyPeriodNav{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:8px;margin:-4px 0 16px}.historyPeriodNav button{min-height:40px;padding:0;border:1px solid var(--line);border-radius:13px;background:#fff;color:var(--deep);font-size:23px;font-weight:800}.historyPeriodNav button:disabled{opacity:.38}.historyPeriodNav strong{text-align:center;font-size:14px;line-height:1.25}.historyMetric{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid #f0e1da}.historyMetric:first-of-type{border-top:0}.historyMetric span{color:var(--muted);font-size:13px}.historyMetric strong{white-space:nowrap}.historyTrend{display:grid;grid-template-columns:repeat(var(--history-weeks),minmax(0,1fr));align-items:end;gap:6px;height:104px;margin-top:14px}.historyTrendItem{min-width:0;display:grid;grid-template-rows:1fr auto;gap:5px;text-align:center;color:var(--muted);font-size:10px}.historyTrendBar{min-height:4px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#eea489,#c76045)}.historyTrendItem strong{color:var(--ink);font-size:11px}.historyCategoryMeta{font-size:12px;color:var(--muted);line-height:1.45}.historyDetailTitle{margin:25px 2px 8px;font:600 21px/1.2 Georgia,serif}
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
  el.innerHTML=`<div class="flytSettingsHead"><button type="button" class="pill" data-history-back="${back==='seenSuggestions'?'seenSuggestions':back?'settings':'close'}">${back?'Tilbake':'Lukk'}</button><div class="grow"><div class="ey">Innstillinger</div><strong>${esc(title)}</strong></div><button type="button" class="pill" data-history-close="1" aria-label="Lukk">×</button></div><div class="flytSettingsBody">${body}</div>`;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>el.querySelector('[data-history-back]')?.focus());
}
function openSettings(){
  const settings=root.FlytSettingsUI;
  if(!settings){bridge()?.toast?.('Innstillinger lastes. Prøv igjen om et øyeblikk.');return}
  closeSettings();
  if(!settings.resumeFromSubpage?.())settings.open?.();
}
function openNudges(){
  const body=root.FlytNudgeUI?.settingsMarkup?.();
  if(!body){bridge()?.toast?.('Nudge-innstillingene lastes. Prøv igjen om et øyeblikk.');return}
  shell('Nudges og forslag',body,true);
}
function seenProfileKey(state){return String(root.FlytSync?.getContext?.()?.user_id||state?.user||'')}
const seenCategoryLabels={nice:'Noe fint',flirt:'Flørt',recognition:'Anerkjenn',space:'Gi litt rom'};
function seenSuggestions(){const state=bridge()?.getState?.();return root.FlytSeenCore?.personalNudges?.(state,seenProfileKey(state))||[]}
function saveSeenSuggestions(values){const state=bridge()?.getState?.(),next=state&&root.FlytSeenCore?.setPersonalNudges?.(state,seenProfileKey(state),values);if(!state||!next)return;bridge().setState(next);root.FlytSync?.queueSave?.()}
function openSeenSuggestions(){
  const values=seenSuggestions();
  const groups=Object.entries(seenCategoryLabels).map(([key,label])=>{const rows=values.map((item,index)=>({item,index})).filter(row=>row.item.category===key).map(({item,index})=>`<div class="seenPersonalRow"><p>${esc(item.text)}</p><button type="button" class="small" data-seen-suggestion-edit="${index}">Rediger</button><button type="button" class="small" data-seen-suggestion-delete="${index}" aria-label="Slett ${esc(item.text)}">×</button></div>`).join('');return rows?`<section class="seenPersonalGroup"><h2>${label}</h2>${rows}</section>`:''}).join('');
  shell('Forslag i Sett',`<div class="ey">Sett</div><h1 class="title">Personlige nudges</h1><p class="sub">Dine egne forslag kan dukke opp som alternativer. Appens beste kontekstbaserte forslag vises fortsatt først.</p>${groups||'<div class="card"><strong>Ingen personlige forslag ennå</strong><p class="sub" style="margin-bottom:0">Legg til noe som passer akkurat dere.</p></div>'}<button type="button" class="secondary full" data-seen-suggestion-add="1" style="margin-top:14px">+ Opprett egen nudge</button>`,true);
}
function openSeenSuggestionEditor(index=-1){const values=seenSuggestions(),item=index>=0?values[index]:null;const options=Object.entries(seenCategoryLabels).map(([key,label])=>`<option value="${key}" ${item?.category===key?'selected':''}>${label}</option>`).join('');shell('Personlig nudge',`<div class="ey">Sett</div><h1 class="title">${item?'Rediger nudge':'Ny personlig nudge'}</h1><div class="seenPersonalEditor"><label class="label" for="seenPersonalCategory">Kategori</label><select id="seenPersonalCategory" class="field">${options}</select><label class="label" for="seenPersonalText" style="display:block;margin-top:12px">Melding</label><textarea id="seenPersonalText" class="field" maxlength="250" placeholder="Skriv en kort melding som passer dere">${esc(item?.text||'')}</textarea><button type="button" class="primary full" data-seen-suggestion-save="${index}" style="margin-top:12px">Lagre nudge</button></div>`,'seenSuggestions')}
function pct(value,total){return total?Math.round(Number(value||0)/total*100):0}
function nameLabel(name,state){return String(name)===String(state?.user||'')?'Du':esc(name)}
function amount(value){const n=Number(value||0);return Number.isInteger(n)?String(n):n.toFixed(1).replace('.',',')}
function metricRows(summary,state,total,unit){return summary.names.map(name=>`<div class="historyMetric"><span>${nameLabel(name,state)}</span><strong>${amount(summary.counts?.[name])} ${unit} · ${pct(summary.counts?.[name],total)} %</strong></div>`).join('')}
function pointRows(summary,state,total){return summary.names.map(name=>`<div class="historyMetric"><span>${nameLabel(name,state)}</span><strong>${amount(summary.points?.[name])} poeng · ${pct(summary.points?.[name],total)} %</strong></div>`).join('')}
function categoryRows(summary,state){return summary.categories.map(row=>{const parts=summary.names.map(name=>`${nameLabel(name,state)} ${row.by?.[name]||0} (${pct(row.by?.[name],row.total)} %)`).concat(row.together?`Sammen ${row.together} (${pct(row.together,row.total)} %)`:[]);return `<div class="historyMetric"><span><strong>${esc(row.name)}</strong><small class="historyCategoryMeta">${parts.join(' · ')}</small></span><strong>${row.total} · 100 %</strong></div>`}).join('')}
function trendHtml(summary){const max=Math.max(1,...summary.trend.map(item=>item.total));return `<div class="historyTrend" style="--history-weeks:${Math.max(1,summary.trend.length)}">${summary.trend.map(item=>`<div class="historyTrendItem"><div class="historyTrendBar" style="height:${Math.max(4,Math.round(item.total/max*72))}px" title="${esc(weekLabel(item))}: ${item.total}"></div><strong>${item.total}</strong><span>${esc(weekLabel(item).split('–')[0])}</span></div>`).join('')}</div>`}
function periodLabel(summary){if(summary.period==='week')return weekLabel(summary);const start=keyDate(summary.start),end=keyDate(summary.end);return start&&end?`${start.toLocaleDateString('nb-NO',{day:'numeric',month:'long'})}–${end.toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'})}`:''}
function currentHistoryWeek(){return historyWeekStart&&keyDate(historyWeekStart)?historyWeekStart:mondayKey(new Date())}
function historySummary(state){if(historyPeriod!=='week')return insights(state,historyPeriod,new Date());const start=currentHistoryWeek(),end=addDays(start,6);return insights(state,'week',keyDate(end))}
function openHistory(){
  const state=bridge()?.getState?.();
  if(!state)return;
  const summary=historySummary(state),pointTotal=Object.values(summary.points).reduce((sum,value)=>sum+Number(value||0),0),weekStart=currentHistoryWeek(),nextDisabled=addDays(weekStart,7)>mondayKey(new Date());
  const periodLabels={week:'Uke',month:'Måned',quarter:'3 måneder'};
  const detail=summary.weeks.length?summary.weeks.map(week=>`<section class="section"><div class="row"><strong class="grow">${esc(weekLabel(week))}</strong><span class="tag">${week.total} gjort</span></div>${week.rows.map(row=>rowHtml(row,state)).join('')}</section>`).join(''):'<div class="card"><strong>Ingen gjennomføringer i perioden ennå</strong><p class="sub" style="margin-bottom:0">Gjøremål dukker opp her når de blir registrert.</p></div>';
  const navigator=historyPeriod==='week'?`<div class="historyPeriodNav" aria-label="Velg uke"><button type="button" data-history-week-nav="-1" aria-label="Forrige uke">‹</button><strong>${esc(periodLabel(summary))}</strong><button type="button" data-history-week-nav="1" aria-label="Neste uke" ${nextDisabled?'disabled':''}>›</button></div>`:`<p class="sub" style="margin:-4px 0 16px;text-align:center">${esc(periodLabel(summary))}</p>`;
  const body=`<div class="ey">Gjøremål</div><h1 class="title">Historikk og innsikt</h1><p class="sub">En nøytral oversikt over det dere har fått gjort. Innhold fra Sett, Oss og belønninger vises ikke her.</p><div class="segments" style="grid-template-columns:repeat(3,1fr);margin:14px 0 18px"><button type="button" data-history-period="week" class="${historyPeriod==='week'?'on':''}">Uke</button><button type="button" data-history-period="month" class="${historyPeriod==='month'?'on':''}">Måned</button><button type="button" data-history-period="quarter" class="${historyPeriod==='quarter'?'on':''}">3 mnd.</button></div>${navigator}<section class="historyInsightCard"><h2>${periodLabels[historyPeriod]}</h2><div class="historyMetric"><span>Gjennomførte gjøremål</span><strong>${summary.total}</strong></div><div class="historyMetric"><span>Gjort sammen</span><strong>${summary.together} · ${pct(summary.together,summary.total)} %</strong></div></section><section class="historyInsightCard"><h2>Fordeling av gjennomføringer</h2>${metricRows(summary,state,summary.total,'oppgaver')||'<p class="sub">Ingen registreringer ennå.</p>'}</section><section class="historyInsightCard"><h2>Poengfordeling</h2>${pointRows(summary,state,pointTotal)||'<p class="sub">Ingen poeng registrert ennå.</p>'}</section><section class="historyInsightCard"><h2>Per kategori</h2>${categoryRows(summary,state)||'<p class="sub">Ingen kategorier i perioden ennå.</p>'}</section><section class="historyInsightCard"><h2>Uke for uke</h2><p class="sub" style="margin:0">Antall gjennomførte gjøremål per uke.</p>${trendHtml(summary)}</section><h2 class="historyDetailTitle">Detaljert historikk</h2>${detail}`;
  shell('Historikk og innsikt',body,true);
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
  button.innerHTML='<span class="flytMenuIcon">⚙</span><span><strong>Innstillinger</strong><span class="taskmeta" style="display:block">Oppsett, nudges og historikk</span></span>';
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
async function handleClick(e){
  const top=e.target.closest?.('#setupBtnV2,#setupBtn');
  if(top&&bridge()?.getState?.()?.setupDone!==false){e.preventDefault();e.stopImmediatePropagation();openSettings();return}
  if(e.target.closest?.('[data-history-close]')){e.preventDefault();closeSettings();return}
  const back=e.target.closest?.('[data-history-back]');
  if(back){e.preventDefault();back.dataset.historyBack==='seenSuggestions'?openSeenSuggestions():back.dataset.historyBack==='settings'?openSettings():closeSettings();return}
  if(e.target.closest?.('[data-settings-history]')){e.preventDefault();historyPeriod='week';historyWeekStart=mondayKey(new Date());openHistory();return}
  if(e.target.closest?.('[data-settings-seen-suggestions]')){e.preventDefault();openSeenSuggestions();return}
  if(e.target.closest?.('[data-settings-nudges]')){e.preventDefault();openNudges();return}
  if(e.target.closest?.('[data-settings-setup]')){e.preventDefault();openSetup();return}
  if(root.FlytNudgeUI?.handleSettingsAction?.(e.target)){e.preventDefault();openNudges();return}
  const addSuggestion=e.target.closest?.('[data-seen-suggestion-add]');
  if(addSuggestion){e.preventDefault();openSeenSuggestionEditor();return}
  const editSuggestion=e.target.closest?.('[data-seen-suggestion-edit]');
  if(editSuggestion){e.preventDefault();openSeenSuggestionEditor(Number(editSuggestion.dataset.seenSuggestionEdit));return}
  const saveSuggestion=e.target.closest?.('[data-seen-suggestion-save]');
  if(saveSuggestion){e.preventDefault();const text=$('#seenPersonalText')?.value.trim(),category=$('#seenPersonalCategory')?.value,index=Number(saveSuggestion.dataset.seenSuggestionSave),values=seenSuggestions();if(!text){$('#seenPersonalText')?.focus();return}const item={id:index>=0&&values[index]?.id?values[index].id:`personal_${Date.now()}`,category,text};if(index>=0&&values[index])values[index]=item;else values.push(item);saveSeenSuggestions(values);openSeenSuggestions();bridge()?.toast?.('Nudgen er lagret');return}
  const deleteSuggestion=e.target.closest?.('[data-seen-suggestion-delete]');
  if(deleteSuggestion){e.preventDefault();const values=seenSuggestions(),index=Number(deleteSuggestion.dataset.seenSuggestionDelete),item=values[index];if(!item)return;const yes=root.FlytModal?.confirm?await root.FlytModal.confirm({ey:'Sett',title:'Slette nudgen?',text:'Forslaget fjernes bare fra din personlige liste.',ok:'Slett'}):true;if(!yes)return;values.splice(index,1);saveSeenSuggestions(values);openSeenSuggestions();return}
  const period=e.target.closest?.('[data-history-period]');
  if(period){e.preventDefault();historyPeriod=['week','month','quarter'].includes(period.dataset.historyPeriod)?period.dataset.historyPeriod:'week';if(historyPeriod==='week'&&!historyWeekStart)historyWeekStart=mondayKey(new Date());openHistory();return}
  const weekNav=e.target.closest?.('[data-history-week-nav]');
  if(weekNav&&!weekNav.disabled){e.preventDefault();const next=addDays(currentHistoryWeek(),Number(weekNav.dataset.historyWeekNav||0)*7),latest=mondayKey(new Date());if(next&&next<=latest){historyWeekStart=next;openHistory()}}
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
root.FlytHistoryUI={openSettings,openHistory,openNudges,openSeenSuggestions,close:closeSettings,augmentWeek,core,version:VERSION};
})(typeof window!=='undefined'?window:null);
