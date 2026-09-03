((root,factory)=>{
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.FlytDailyLoop=api;
})(typeof window!=='undefined'?window:globalThis,root=>{
'use strict';

const VERSION='20260903-2330';
const OSLO_TIME_ZONE='Europe/Oslo';
const dayPlan=typeof module==='object'&&module.exports?require('./day-plan.js'):root?.FlytDayPlan;

function dateKey(value=new Date()){
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return'';
  const parts=Object.fromEntries(new Intl.DateTimeFormat('nb-NO',{timeZone:OSLO_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function validDateKey(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
function keyDate(key){return new Date(`${key}T12:00:00Z`)}
function addDays(key,amount){const [year,month,day]=String(key).split('-').map(Number),next=new Date(Date.UTC(year,month-1,day+amount,12));return next.toISOString().slice(0,10)}
function weekRangeForKey(key){const date=keyDate(key),weekday=date.getUTCDay(),start=addDays(key,-((weekday+6)%7));return{start,end:addDays(start,6)}}
function preferredDays(task){return [...new Set((Array.isArray(task?.preferredDays)?task.preferredDays:[]).map(Number).filter(day=>day>=1&&day<=7))].sort((a,b)=>a-b)}
function weeklyGoal(task){
  if(!task||task.kind!=='house'||task.type==='period')return 0;
  if(task.type==='daily')return preferredDays(task).length||Math.min(7,Math.max(1,Number(task.freq)||1));
  return Math.max(1,Number(task.freq)||1);
}
function relevant(state,task){return dayPlan?.relevant?.(state,task)!==false}
function tasksForDay(state,key=dateKey()){
  const tasks=dayPlan?.planTasks?.(state,key)||(state?.tasks||[]).filter(task=>task?.type==='daily');
  return tasks.filter(task=>task?.kind==='house'&&relevant(state,task));
}
function completionsForDay(state,key=dateKey()){return (state?.completions||[]).filter(item=>item&&item.date===key)}
function completionForTask(state,taskId,key=dateKey()){
  return [...completionsForDay(state,key)].reverse().find(item=>String(item.taskId)===String(taskId))||null;
}
function dayProgress(state,key=dateKey()){
  const tasks=tasksForDay(state,key),doneIds=new Set(completionsForDay(state,key).map(item=>String(item.taskId))),done=tasks.filter(task=>doneIds.has(String(task.id))).length,total=tasks.length;
  return{done,total,remaining:Math.max(0,total-done),pct:total?Math.round(done/total*100):0,tasks};
}
function taskWeekCount(state,task,range){
  const list=(state?.completions||[]).filter(item=>item&&String(item.taskId)===String(task.id)&&validDateKey(item.date)&&item.date>=range.start&&item.date<=range.end);
  return task.type==='daily'?new Set(list.map(item=>item.date)).size:list.length;
}
function weekProgress(state,key=dateKey()){
  const range=weekRangeForKey(key),rows=[];
  for(const task of state?.tasks||[]){
    const goal=weeklyGoal(task);
    if(!goal||!relevant(state,task))continue;
    const count=Math.min(goal,taskWeekCount(state,task,range));
    rows.push({task,count,goal,done:count>=goal});
  }
  const total=rows.reduce((sum,row)=>sum+row.goal,0),done=rows.reduce((sum,row)=>sum+row.count,0);
  return{done,total,remaining:Math.max(0,total-done),pct:total?Math.round(done/total*100):0,range,rows};
}
function activeClaim(state,taskId,key=dateKey()){
  return [...(state?.taskClaims||[])].reverse().find(item=>item&&String(item.taskId)===String(taskId)&&item.date===key&&!item.revokedAt)||null;
}
function effectiveOwner(state,task,key=dateKey()){return activeClaim(state,task?.id,key)?.claimedBy||task?.owner||'Begge'}
function claimTask(state,{task,date=dateKey(),user=state?.user,now=Date.now()}={}){
  if(!state||!task||!user)return state;
  const current=activeClaim(state,task.id,date);
  if(current?.claimedBy===user)return state;
  const claims=(state.taskClaims||[]).map(item=>item&&String(item.taskId)===String(task.id)&&item.date===date&&!item.revokedAt?{...item,revokedAt:new Date(now).toISOString(),revokedBy:user}:item);
  claims.push({id:`claim_${now}_${String(task.id)}`,taskId:task.id,taskName:task.name||'',date,claimedBy:user,previousOwner:effectiveOwner(state,task,date),createdAt:new Date(now).toISOString()});
  return{...state,taskClaims:claims};
}
function releaseClaim(state,{taskId,date=dateKey(),user=state?.user,now=Date.now()}={}){
  const current=activeClaim(state,taskId,date);
  if(!current||current.claimedBy!==user)return state;
  return{...state,taskClaims:(state.taskClaims||[]).map(item=>item?.id===current.id?{...item,revokedAt:new Date(now).toISOString(),revokedBy:user}:item)};
}
function recordCompletion(state,{task,date=dateKey(),user=state?.user,now=Date.now()}={}){
  if(!state||!task||!user)return{state,completion:null,created:false};
  if(task.type==='daily'&&completionForTask(state,task.id,date))return{state,completion:completionForTask(state,task.id,date),created:false};
  const points={...(state.points||{})},value=Number(task.pts||0),kind=task.kind||'house';
  points[user]=(points[user]||0)+value;
  const completion={id:now,taskId:task.id,taskName:task.name||'',date,by:user,kind,housePts:kind==='house'?value:Math.round(value*.2),registeredAt:new Date(now).toISOString(),backdated:date!==dateKey(),taskSnapshot:{name:task.name||'',cat:task.cat||'',pts:value,type:task.type||'flex',kind}};
  return{state:{...state,points,completions:[...(state.completions||[]),completion]},completion,created:true};
}
function thanks(completion){const all=[...(Array.isArray(completion?.acknowledgements)?completion.acknowledgements:[]),...(Array.isArray(completion?.thanks)?completion.thanks:[])],seen=new Set();return all.filter(item=>{const key=String(item?.by||'');if(!key||seen.has(key))return false;seen.add(key);return true})}
function canThank(completion,user){return !!completion?.by&&completion.by!==user&&!thanks(completion).length}
function thankCompletion(state,{completionId,user=state?.user,now=Date.now()}={}){
  let changed=false;
  const completions=(state?.completions||[]).map(item=>{
    if(String(item?.id)!==String(completionId)||!canThank(item,user))return item;
    changed=true;
    return{...item,thanks:[{by:user,at:new Date(now).toISOString()}]};
  });
  return changed?{...state,completions}:state;
}
function contributionSummary(state,key=dateKey()){
  const day=completionsForDay(state,key),week=weekProgress(state,key),contributors=new Set(day.map(item=>item.by).filter(Boolean));
  const houseIds=new Set((state?.tasks||[]).filter(task=>task?.kind==='house').map(task=>String(task.id)));
  return{weekDone:week.done,bothContributedToday:contributors.size>=2,myWeek:(state?.completions||[]).filter(item=>houseIds.has(String(item?.taskId))&&item.by===state?.user&&validDateKey(item.date)&&item.date>=week.range.start&&item.date<=week.range.end).length};
}

return{VERSION,activeClaim,addDays,canThank,claimTask,completionForTask,contributionSummary,dateKey,dayProgress,effectiveOwner,releaseClaim,recordCompletion,taskWeekCount,tasksForDay,thankCompletion,thanks,weekProgress,weekRangeForKey,weeklyGoal};
});
