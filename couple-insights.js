((root)=>{
'use strict';

const VERSION='20260902-1730';

function stamp(value){
  if(typeof value==='number')return Number.isFinite(value)?value:0;
  const parsed=new Date(value||0).getTime();
  return Number.isFinite(parsed)?parsed:0;
}
function dateKey(value=new Date()){
  const date=value instanceof Date?new Date(value):new Date(value);
  if(Number.isNaN(date.getTime()))return'';
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function weekStart(value=new Date()){
  const date=value instanceof Date?new Date(value):new Date(value);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate()-((date.getDay()+6)%7));
  return date;
}
function inWeek(value,start){
  const at=stamp(value),fromDate=start instanceof Date?new Date(start):new Date(start),from=fromDate.getTime(),until=new Date(fromDate);
  until.setDate(until.getDate()+7);
  return at>=from&&at<until.getTime();
}
function completionInWeek(completion,start){
  if(!completion?.date)return false;
  return inWeek(`${completion.date}T12:00:00`,start);
}
function requestAnswered(request){
  return !!(request?.acceptedAt||request?.declinedAt||request?.counter?.createdAt||request?.responseUpdatedAt||request?.doneAt);
}
function invitationAnswer(invitation){
  return invitation?.finalResponse||invitation?.response||null;
}
function weeklyMirror(state,now=new Date()){
  const start=weekStart(now),requests=(state?.seenRequests||[]).filter(item=>item&&!item.deleted&&!item.expiredAt&&item.responseState!=='expired'),support=requests.filter(item=>item.source==='nudge'||item.kind==='support'),initiatives=requests.filter(item=>item.source==='initiative'),invitations=(state?.coupleInvitations||[]).filter(item=>item&&!item.deleted),completions=(state?.completions||[]).filter(item=>item?.kind==='house'&&completionInWeek(item,start));
  const asked=support.filter(item=>inWeek(item.createdAt,start)).length;
  const answered=support.filter(item=>requestAnswered(item)&&inWeek(item.acceptedAt||item.declinedAt||item.counter?.createdAt||item.responseUpdatedAt||item.doneAt,start)).length;
  const completed=requests.filter(item=>item.done&&inWeek(item.doneAt||item.completionUpdatedAt,start)).length;
  const initiativeStarted=initiatives.filter(item=>inWeek(item.createdAt,start)).length;
  const initiativeCompleted=initiatives.filter(item=>item.done&&inWeek(item.doneAt||item.completionUpdatedAt,start)).length;
  const thanks=requests.filter(item=>item.appreciationText&&inWeek(item.appreciationAt,start)).length;
  const invitationsSent=invitations.filter(item=>inWeek(item.createdAt,start)).length;
  const invitationsAnswered=invitations.filter(item=>{const answer=invitationAnswer(item);return answer&&inWeek(answer.createdAt||answer.createdAtIso,start)}).length;
  const invitationsAccepted=invitations.filter(item=>{const answer=invitationAnswer(item);return answer?.kind==='yes'&&inWeek(answer.createdAt||answer.createdAtIso,start)}).length;
  const sharedMoments=completed+invitationsAccepted;
  return {
    start:dateKey(start),
    chores:completions.length,
    asked,
    answered,
    completed,
    initiativeStarted,
    initiativeCompleted,
    thanks,
    invitationsSent,
    invitationsAnswered,
    invitationsAccepted,
    sharedMoments
  };
}
function isoDay(value=new Date()){
  const day=(value instanceof Date?value:new Date(value)).getDay();
  return day===0?7:day;
}
function preferredDays(task){
  return [...new Set((Array.isArray(task?.preferredDays)?task.preferredDays:[]).map(Number).filter(day=>day>=1&&day<=7))];
}
function scheduledToday(task,now=new Date()){
  const days=preferredDays(task);
  return !days.length||days.includes(isoDay(now));
}
function firstWinTask(state,now=new Date()){
  const today=dateKey(now),doneToday=new Set((state?.completions||[]).filter(item=>item?.date===today).map(item=>String(item.taskId))),start=weekStart(now),week=(state?.completions||[]).filter(item=>completionInWeek(item,start)),active=new Set((state?.seenRequests||[]).filter(item=>!item?.deleted&&!item?.done&&!item?.declinedAt&&!item?.expiredAt&&item?.responseState!=='expired'&&item?.taskId!=null).map(item=>String(item.taskId))),tasks=(state?.tasks||[]).filter(task=>task?.kind==='house'&&!active.has(String(task.id)));
  const remaining=tasks.filter(task=>{
    if(task.type==='daily')return scheduledToday(task,now)&&!doneToday.has(String(task.id));
    if(task.type==='flex')return week.filter(item=>String(item.taskId)===String(task.id)).length<Math.max(1,Number(task.freq)||1);
    return false;
  });
  return (remaining.length?remaining:tasks).sort((a,b)=>(a.type==='daily'?0:1)-(b.type==='daily'?0:1)||Number(a.pts||0)-Number(b.pts||0)||String(a.name||'').localeCompare(String(b.name||''),'nb'))[0]||null;
}
function firstSharedWin(state){
  const requests=(state?.seenRequests||[]).filter(item=>item&&!item.deleted&&(item.kind==='support'||item.source==='nudge'||item.source==='initiative'));
  const completed=requests.filter(item=>{
    if(!item.done)return false;
    if(item.source!=='initiative')return true;
    const seenBy=Array.isArray(item.seenBy)?item.seenBy:[item.seenBy].filter(Boolean),completionSeen=Array.isArray(item.completionSeenBy)?item.completionSeenBy:[];
    return !!item.appreciationText||[...seenBy,...completionSeen].some(name=>name&&name!==item.by);
  }).sort((a,b)=>stamp(a.doneAt)-stamp(b.doneAt))[0]||null;
  if(completed)return{stage:'completed',request:completed,taskName:completed.taskName||'en oppgave',completedAt:completed.doneAt||null,thanked:!!completed.appreciationText};
  const awaiting=requests.filter(item=>item.done&&item.source==='initiative').sort((a,b)=>stamp(a.doneAt)-stamp(b.doneAt))[0]||null;
  if(awaiting)return{stage:'awaiting',request:awaiting,taskName:awaiting.taskName||'en oppgave'};
  const active=requests.filter(item=>!item.done&&!item.declinedAt).sort((a,b)=>stamp(a.createdAt)-stamp(b.createdAt))[0]||null;
  if(active){
    const accepted=!!(active.acceptedBy||active.responseState==='accepted');
    return{stage:accepted?'accepted':'started',request:active,taskName:active.taskName||'en oppgave',accepted};
  }
  return{stage:'ready',request:null,taskName:''};
}

const api={VERSION,stamp,dateKey,weekStart,weeklyMirror,firstWinTask,firstSharedWin};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.FlytCoupleInsights=api;
})(typeof globalThis!=='undefined'?globalThis:this);
