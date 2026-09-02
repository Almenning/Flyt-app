((root,factory)=>{
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.FlytDayPlan=api;
})(typeof window!=='undefined'?window:globalThis,root=>{
'use strict';

const VERSION='20260902-0100';

function category(task){
  const raw=String(task?.cat||'').trim();
  if(raw==='Husdyr')return'Dyr';
  if(raw==='Utearbeid')return'Hage & ute';
  if(raw==='Periodisk vedlikehold')return'Vedlikehold';
  if(raw==='Usynlig arbeid')return'Planlegging & admin';
  if(raw==='Hus'){
    if(['living','hallway'].includes(task?.id))return'Stue';
    if(task?.id==='bed')return'Soverom';
    if(['laundry','vacuum'].includes(task?.id))return'Vask & klær';
    if(task?.id==='trash')return'Vedlikehold';
  }
  return raw||'Egendefinert';
}

function relevant(state,task){
  return state?.categoryRelevant?.[category(task)]!==false;
}

function isoDay(dateKey){
  const day=new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  return day===0?7:day;
}

function preferredDays(task){
  return [...new Set((Array.isArray(task?.preferredDays)?task.preferredDays:[]).map(Number).filter(day=>day>=1&&day<=7))].sort((a,b)=>a-b);
}

function scheduledFor(task,dateKey){
  const days=preferredDays(task);
  if(days.length)return days.includes(isoDay(dateKey));
  return task?.type==='daily'&&Number(task?.freq||0)>=7;
}

function uniqueIds(values){
  return [...new Set((Array.isArray(values)?values:[]).map(String).filter(Boolean))];
}

function library(state){
  const byId=new Map();
  const add=task=>{
    if(!task||task.id===undefined||task.id===null)return;
    const id=String(task.id),previous=byId.get(id)||{};
    byId.set(id,{...previous,...task,id:task.id,cat:category(task)});
  };
  for(const task of root?.FlytTaskLanguage?.catalog||[])add(task);
  for(const task of state?.custom||[])add(task);
  for(const task of state?.tasks||[])add(task);
  return [...byId.values()];
}

function resolveTask(state,id){
  const key=String(id);
  const found=library(state).find(task=>String(task.id)===key);
  if(found)return found;
  const completion=[...(state?.completions||[])].reverse().find(item=>String(item.taskId)===key);
  if(!completion)return null;
  const snapshot=completion.taskSnapshot||{};
  return {
    id:completion.taskId,
    name:snapshot.name||completion.taskName||'Gjøremål',
    cat:snapshot.cat||'Egendefinert',
    pts:Number(snapshot.pts||completion.housePts||0),
    type:snapshot.type||'flex',
    kind:snapshot.kind||completion.kind||'house'
  };
}

function entry(state,dateKey){
  const value=state?.dayPlans?.[dateKey]||{};
  return {addedTaskIds:uniqueIds(value.addedTaskIds),removedTaskIds:uniqueIds(value.removedTaskIds)};
}

function planTasks(state,dateKey){
  const change=entry(state,dateKey),removed=new Set(change.removedTaskIds),seen=new Set(),out=[];
  const append=task=>{
    if(!task||removed.has(String(task.id))||seen.has(String(task.id)))return;
    seen.add(String(task.id));
    out.push(task);
  };
  for(const task of state?.tasks||[]){
    if(relevant(state,task)&&task.type==='daily'&&scheduledFor(task,dateKey))append(task);
  }
  for(const id of change.addedTaskIds)append(resolveTask(state,id));
  return out;
}

function updateEntry(state,dateKey,nextEntry){
  const dayPlans={...(state?.dayPlans||{})};
  const clean={addedTaskIds:uniqueIds(nextEntry.addedTaskIds),removedTaskIds:uniqueIds(nextEntry.removedTaskIds)};
  if(!clean.addedTaskIds.length&&!clean.removedTaskIds.length)delete dayPlans[dateKey];
  else dayPlans[dateKey]=clean;
  return {...state,dayPlans};
}

function addToDay(state,dateKey,id){
  const key=String(id),current=entry(state,dateKey);
  return updateEntry(state,dateKey,{
    addedTaskIds:[...current.addedTaskIds,key],
    removedTaskIds:current.removedTaskIds.filter(item=>item!==key)
  });
}

function removeFromDay(state,dateKey,id){
  const key=String(id),current=entry(state,dateKey);
  const isBase=(state?.tasks||[]).some(task=>String(task.id)===key&&relevant(state,task)&&task.type==='daily'&&scheduledFor(task,dateKey));
  return updateEntry(state,dateKey,{
    addedTaskIds:current.addedTaskIds.filter(item=>item!==key),
    removedTaskIds:isBase?[...current.removedTaskIds,key]:current.removedTaskIds.filter(item=>item!==key)
  });
}

function moveToDay(state,fromDateKey,toDateKey,id){
  return addToDay(removeFromDay(state,fromDateKey,id),toDateKey,id);
}

function recentTasks(state,{excludeIds=[],limit=5}={}){
  const excluded=new Set(excludeIds.map(String)),seen=new Set(),out=[];
  const completions=[...(state?.completions||[])].sort((a,b)=>{
    const aTime=Date.parse(a.registeredAt||'')||Number(a.id)||0;
    const bTime=Date.parse(b.registeredAt||'')||Number(b.id)||0;
    return bTime-aTime;
  });
  for(const item of completions){
    const id=String(item.taskId);
    if(excluded.has(id)||seen.has(id))continue;
    const task=resolveTask(state,id);
    if(!task||!relevant(state,task))continue;
    seen.add(id);
    out.push(task);
    if(out.length>=limit)break;
  }
  return out;
}

function progress(state,dateKey){
  const tasks=planTasks(state,dateKey),doneIds=new Set((state?.completions||[]).filter(item=>item.date===dateKey).map(item=>String(item.taskId)));
  return {done:tasks.filter(task=>doneIds.has(String(task.id))).length,total:tasks.length,tasks};
}

return {VERSION,addToDay,category,entry,library,moveToDay,planTasks,progress,recentTasks,relevant,removeFromDay,resolveTask,scheduledFor};
});
