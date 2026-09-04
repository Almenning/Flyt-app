((root,factory)=>{
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.FlytSeenCore=api;
})(typeof window!=='undefined'?window:globalThis,()=>{
'use strict';

const VERSION='20260904-priority1';
const OSLO_TIME_ZONE='Europe/Oslo';
const DEFAULT_SUGGESTIONS=['Tok initiativ','Var tålmodig','Ordnet noe praktisk','Ga meg rom','Støttet meg','Gjorde dagen lettere'];

function dateKey(value=new Date()){
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return'';
  const parts=Object.fromEntries(new Intl.DateTimeFormat('nb-NO',{timeZone:OSLO_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function addDays(key,amount){
  const [year,month,day]=String(key||'').split('-').map(Number);
  if(!year||!month||!day)return'';
  return new Date(Date.UTC(year,month-1,day+Number(amount||0),12)).toISOString().slice(0,10);
}
function stamp(value){
  if(value==null)return 0;
  if(typeof value==='number'&&Number.isFinite(value))return value;
  const numeric=Number(value);
  if(Number.isFinite(numeric)&&numeric>0)return numeric;
  const parsed=new Date(value).getTime();
  return Number.isFinite(parsed)?parsed:0;
}
function taskName(state,item){
  const direct=String(item?.taskName||item?.taskSnapshot?.name||item?.title||'').trim();
  if(direct)return direct;
  const task=[...(state?.tasks||[]),...(state?.custom||[])].find(entry=>String(entry?.id)===String(item?.taskId));
  return String(task?.name||'Gjennomført gjøremål').trim();
}
function taskPoints(state,item){
  const snapshot=Number(item?.taskSnapshot?.pts);
  if(Number.isFinite(snapshot)&&snapshot>=0)return snapshot;
  const task=[...(state?.tasks||[]),...(state?.custom||[])].find(entry=>String(entry?.id)===String(item?.taskId));
  const configured=Number(task?.pts);
  if(Number.isFinite(configured)&&configured>=0)return configured;
  const recorded=Number(item?.housePts);
  return Number.isFinite(recorded)&&recorded>=0?recorded:0;
}
function acknowledgements(item){
  const list=[];
  for(const entry of [...(Array.isArray(item?.acknowledgements)?item.acknowledgements:[]),...(Array.isArray(item?.thanks)?item.thanks:[])]){
    if(!entry?.by)continue;
    const key=String(entry.by);
    if(list.some(existing=>String(existing.by)===key))continue;
    list.push({...entry,type:'task'});
  }
  return list;
}
function acknowledgementBy(item,user){return acknowledgements(item).find(entry=>String(entry.by)===String(user))||null}
function contributions(state,{user=state?.user,date=dateKey()}={}){
  const rows=[];
  for(const completion of state?.completions||[]){
    if(completion?.date!==date||!completion.by||completion.by===user)continue;
    rows.push({kind:'completion',id:String(completion.id),source:completion,title:taskName(state,completion),by:completion.by,date,at:stamp(completion.registeredAt)||stamp(completion.id),points:taskPoints(state,completion),acknowledgement:acknowledgementBy(completion,user)});
  }
  for(const planned of state?.plannedTasks||[]){
    if(!planned?.done||planned.date!==date||!planned.doneBy||planned.doneBy===user)continue;
    rows.push({kind:'planned',id:String(planned.id),source:planned,title:String(planned.title||'Ekstraoppgave').trim(),by:planned.doneBy,date,at:stamp(planned.doneAt)||stamp(planned.createdAt),points:Math.max(0,Number(planned.points)||0),acknowledgement:acknowledgementBy(planned,user)});
  }
  return rows.sort((a,b)=>(b.points||0)-(a.points||0)||(b.at||0)-(a.at||0)||a.title.localeCompare(b.title,'nb'));
}
function toggleAcknowledgement(state,{kind='completion',id,user=state?.user,text='',now=Date.now(),allowTextRemoval=false}={}){
  if(!state||!user)return{state,changed:false};
  const field=kind==='planned'?'plannedTasks':'completions',items=Array.isArray(state[field])?state[field]:[],index=items.findIndex(item=>String(item?.id)===String(id));
  if(index<0)return{state,changed:false};
  const item=items[index],recipient=kind==='planned'?item.doneBy:item.by;
  if(!recipient||recipient===user)return{state,changed:false};
  const existing=acknowledgementBy(item,user);
  if(existing?.text&&!allowTextRemoval)return{state,changed:false,requiresConfirmation:true,existing};
  const nextItem={...item};
  nextItem.acknowledgements=(Array.isArray(item.acknowledgements)?item.acknowledgements:[]).filter(entry=>String(entry?.by)!==String(user));
  nextItem.thanks=(Array.isArray(item.thanks)?item.thanks:[]).filter(entry=>String(entry?.by)!==String(user));
  let action='removed';
  if(!existing){
    action='added';
    const acknowledgement={id:`seen_${now}_${String(id)}`,type:'task',by:user,to:recipient,at:new Date(now).toISOString()};
    const cleaned=String(text||'').trim().slice(0,250);if(cleaned)acknowledgement.text=cleaned;
    nextItem.acknowledgements.push(acknowledgement);
  }
  const nextItems=items.slice();nextItems[index]=nextItem;
  return{state:{...state,[field]:nextItems},changed:true,action};
}
function addRecognition(state,{type='personal',text,user=state?.user,to='',now=Date.now()}={}){
  const value=String(text||'').trim().replace(/\s+/g,' ').slice(0,250);
  if(!state||!user||!to||user===to||!value)return state;
  const item={id:`recognition_${now}`,type:type==='space'?'space':'personal',text:value,by:user,to,at:new Date(now).toISOString(),date:dateKey(new Date(now)),seenBy:[user]};
  return{...state,recognitions:[...(Array.isArray(state.recognitions)?state.recognitions:[]),item]};
}
function recognitionEvents(state){
  const events=[];
  for(const completion of state?.completions||[]){
    for(const acknowledgement of acknowledgements(completion))events.push({id:String(acknowledgement.id||`completion_${completion.id}_${acknowledgement.by}`),type:'task',text:String(acknowledgement.text||taskName(state,completion)),title:taskName(state,completion),by:acknowledgement.by,to:acknowledgement.to||completion.by,at:stamp(acknowledgement.at)||stamp(completion.registeredAt)||stamp(completion.id),date:completion.date,seenBy:acknowledgement.seenBy||[]});
  }
  for(const planned of state?.plannedTasks||[]){
    for(const acknowledgement of acknowledgements(planned))events.push({id:String(acknowledgement.id||`planned_${planned.id}_${acknowledgement.by}`),type:'task',text:String(acknowledgement.text||planned.title||'Ekstraoppgave'),title:String(planned.title||'Ekstraoppgave'),by:acknowledgement.by,to:acknowledgement.to||planned.doneBy,at:stamp(acknowledgement.at)||stamp(planned.doneAt),date:planned.date,seenBy:acknowledgement.seenBy||[]});
  }
  for(const item of state?.recognitions||[]){
    if(!item?.text||!item.by||!item.to)continue;
    events.push({id:String(item.id),type:item.type==='space'?'space':'personal',text:String(item.text),title:String(item.text),by:item.by,to:item.to,at:stamp(item.at||item.createdAt||item.id),date:item.date||dateKey(item.at||item.createdAt),seenBy:item.seenBy||[]});
  }
  return events.sort((a,b)=>b.at-a.at);
}
function suggestions(state,user=state?.user){
  const saved=state?.seenSuggestionPreferences?.[user];
  if(!Array.isArray(saved))return DEFAULT_SUGGESTIONS.slice();
  const clean=[...new Set(saved.map(value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,48)).filter(Boolean))];
  return clean.length?clean:DEFAULT_SUGGESTIONS.slice();
}
function setSuggestions(state,user,values){
  if(!state||!user)return state;
  const clean=[...new Set((values||[]).map(value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,48)).filter(Boolean))].slice(0,12);
  return{...state,seenSuggestionPreferences:{...(state.seenSuggestionPreferences||{}),[user]:clean.length?clean:DEFAULT_SUGGESTIONS.slice()}};
}
function resetSuggestions(state,user){
  if(!state||!user)return state;
  const preferences={...(state.seenSuggestionPreferences||{})};delete preferences[user];
  return{...state,seenSuggestionPreferences:preferences};
}

return{VERSION,DEFAULT_SUGGESTIONS,dateKey,addDays,stamp,acknowledgements,acknowledgementBy,contributions,toggleAcknowledgement,addRecognition,recognitionEvents,suggestions,setSuggestions,resetSuggestions};
});
