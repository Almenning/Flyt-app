((root,factory)=>{
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.FlytGoalsCore=api;
})(typeof window!=='undefined'?window:globalThis,root=>{
'use strict';

const VERSION='20260903-goals1';
const OSLO_TIME_ZONE='Europe/Oslo';
const REWARD_LIBRARY=Object.freeze({
  'Tid og frihet':Object.freeze(['Sovemorgen','Kveld ute med venner','En kveld helt fri','En halv dag for deg selv','Hobby-/gamingkveld','Jeg tar barna alene en kveld','Jeg tar morgenen','Fri fra hjemmeoppgaver en dag']),
  'Opplevelser':Object.freeze(['Date på ditt valg','Restaurant på ditt valg','Aktivitet på ditt valg','En liten gave','Hotellovernatting','Helgetur','Du bestemmer kveldens program','Overraskelse']),
  'Fristelse ❤️':Object.freeze(['Massasje','Sexy undertøy','En intim kveld','30 minutter bare for deg','Du velger ❤️','Ditt intime ønske','En erotisk overraskelse'])
});
const METRICS=Object.freeze([
  {type:'today_goal',label:'Nå dagens mål'},
  {type:'week_goal',label:'Nå ukesmålet'},
  {type:'week_percent',label:'Nå minst X % av ukesmålet'},
  {type:'task_count',label:'Gjennomfør X gjøremål denne uka'},
  {type:'task_specific',label:'Gjør et bestemt gjøremål X ganger'},
  {type:'task_once',label:'Fullfør et bestemt gjøremål'},
  {type:'streak',label:'Nå målet X uker på rad'},
  {type:'manual',label:'Eget mål'}
]);

function id(prefix='goal'){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`}
function copy(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value))}
function stamp(value){const n=typeof value==='number'?value:new Date(value||0).getTime();return Number.isFinite(n)?n:0}
function dateKey(value=new Date()){
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return'';
  const parts=Object.fromEntries(new Intl.DateTimeFormat('nb-NO',{timeZone:OSLO_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function addDays(key,amount){const [y,m,d]=String(key).split('-').map(Number);return new Date(Date.UTC(y,m-1,d+amount,12)).toISOString().slice(0,10)}
function weekRange(key=dateKey()){
  const date=new Date(`${key}T12:00:00Z`),weekday=date.getUTCDay(),start=addDays(key,-((weekday+6)%7));
  return{start,end:addDays(start,6)};
}
function endOfWeek(key=dateKey()){return `${weekRange(key).end}T23:59:59.999Z`}
function goals(state){return Array.isArray(state?.goals)?state.goals:[]}
function people(state){const names=Object.keys(state?.status||{});if(state?.user&&!names.includes(state.user))names.unshift(state.user);if(names.length<2)names.push(state?.user==='Du'?'Partner':'Du');return [...new Set(names)]}
function partnerName(state,user=state?.user){return people(state).find(name=>name!==user)||(user==='Du'?'Partner':'Du')}
function taskById(state,taskId){return (state?.tasks||[]).find(task=>String(task.id)===String(taskId))||root?.FlytDayPlan?.resolveTask?.(state,taskId)||null}
function metricLabel(metric={}){return METRICS.find(item=>item.type===metric.type)?.label||'Eget mål'}
function goalTitle(state,metric={},customTitle=''){
  if(String(customTitle||'').trim())return String(customTitle).trim();
  const amount=Math.max(1,Number(metric.target)||1),task=taskById(state,metric.taskId)?.name||'valgt gjøremål';
  if(metric.type==='today_goal')return'Nå dagens mål';
  if(metric.type==='week_goal')return'Nå ukesmålet';
  if(metric.type==='week_percent')return`Nå minst ${Math.min(100,amount)} % av ukesmålet`;
  if(metric.type==='task_count')return`Gjennomfør ${amount} gjøremål denne uka`;
  if(metric.type==='task_specific')return`Gjør ${task} ${amount} ${amount===1?'gang':'ganger'}`;
  if(metric.type==='task_once')return`Fullfør ${task}`;
  if(metric.type==='streak')return`Nå målet ${amount} ${amount===1?'uke':'uker'} på rad`;
  return'Eget mål';
}
function rewardInput(input,kind,createdBy){
  const title=String(input?.title||'').trim();
  if(!title)return{status:'none',title:'',category:'',secret:false,type:'none'};
  const type=input.type||((kind==='challenge')?'challenge':kind==='shared'?'shared':'self');
  const pending=type==='partner_request';
  return{title,category:String(input.category||'').trim(),secret:!!input.secret,type,offeredBy:input.offeredBy||createdBy,status:pending?'pending':'active',requestedFrom:input.requestedFrom||null,usedAt:null,unlockedAt:null};
}
function lockSnapshot(goal){return copy({title:goal.title,metric:goal.metric,deadline:goal.deadline,reward:goal.reward?.status==='none'?null:{title:goal.reward.title,category:goal.reward.category,secret:!!goal.reward.secret,type:goal.reward.type}})}
function createGoal(state,input={},now=Date.now()){
  const kind=['personal','shared','challenge'].includes(input.kind)?input.kind:'personal',createdBy=input.createdBy||state?.user||'Meg';
  const owner=kind==='personal'?(input.owner||createdBy):null,targetUser=kind==='challenge'?(input.targetUser||partnerName(state,createdBy)):null;
  const metric={type:input.metric?.type||'manual',target:Math.max(1,Number(input.metric?.target)||1),taskId:input.metric?.taskId||null};
  if(metric.type==='today_goal'||metric.type==='week_goal'||metric.type==='task_once')metric.target=metric.type==='task_once'?1:100;
  if(metric.type==='week_percent')metric.target=Math.min(100,metric.target);
  const reward=rewardInput(input.reward,kind,createdBy),requiresApproval=kind==='shared'||kind==='challenge';
  const item={id:id(kind==='challenge'?'challenge':'goal'),kind,title:goalTitle(state,metric,input.title),metric,owner,targetUser,createdBy,createdAt:new Date(now).toISOString(),deadline:input.deadline||endOfWeek(dateKey(new Date(now))),note:String(input.note||'').trim(),status:requiresApproval?'pending':'active',acceptedBy:[],acceptedAt:null,lockedSnapshot:null,reward,manualCompletedAt:null,changeProposal:null};
  if(!requiresApproval)item.lockedSnapshot=null;
  return{...state,goals:[item,...goals(state)]};
}
function replaceGoal(state,goal){return{...state,goals:goals(state).map(item=>String(item.id)===String(goal.id)?goal:item)}}
function editPendingGoal(state,goalId,patch,user=state?.user){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  if(!goal||goal.status!=='pending'||goal.acceptedAt)return state;
  if(goal.createdBy!==user){
    const allowed=goal.kind==='challenge'?goal.targetUser===user:goal.kind==='shared';
    return allowed?proposeChange(state,goalId,patch,user):state;
  }
  const metric=patch.metric?{...goal.metric,...copy(patch.metric)}:goal.metric;
  const next={...goal,...copy(patch),metric,title:goalTitle(state,metric,patch.title??goal.title)};
  if(patch.reward)next.reward=rewardInput({...goal.reward,...patch.reward},goal.kind,goal.createdBy);
  return replaceGoal(state,next);
}
function acceptGoal(state,goalId,user=state?.user,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  if(!goal||goal.status!=='pending'||goal.createdBy===user||goal.changeProposal?.status==='pending')return state;
  if(goal.kind==='challenge'&&goal.targetUser!==user)return state;
  const next={...goal,status:'active',acceptedBy:[...new Set([...(goal.acceptedBy||[]),user])],acceptedAt:new Date(now).toISOString()};
  if(next.reward?.status!=='none')next.reward={...next.reward,status:'active'};
  next.lockedSnapshot=lockSnapshot(next);
  return replaceGoal(state,next);
}
function declineGoal(state,goalId,user=state?.user,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  if(!goal||goal.status!=='pending'||goal.createdBy===user)return state;
  return replaceGoal(state,{...goal,status:'declined',declinedBy:user,declinedAt:new Date(now).toISOString()});
}
function approveReward(state,goalId,user=state?.user,approve=true,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  if(!goal||goal.reward?.status!=='pending'||goal.reward.requestedFrom!==user)return state;
  return replaceGoal(state,{...goal,reward:{...goal.reward,status:approve?'active':'declined',respondedBy:user,respondedAt:new Date(now).toISOString()}});
}
function addPartnerReward(state,goalId,input={},user=state?.user,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  if(!goal||goal.kind!=='personal'||goal.owner===user||!['active','pending'].includes(goal.status)||goal.reward?.status!=='none')return state;
  const reward=rewardInput({...input,type:'partner_added',offeredBy:user},goal.kind,user);
  if(reward.status==='none')return state;
  return replaceGoal(state,{...goal,reward:{...reward,addedAt:new Date(now).toISOString()}});
}
function proposeChange(state,goalId,patch={},user=state?.user,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  const participants=goal?.kind==='challenge'?[goal.createdBy,goal.targetUser]:goal?.kind==='shared'?[goal.createdBy,...people(state).filter(name=>name!==goal.createdBy)]:[];
  if(!goal||!['challenge','shared'].includes(goal.kind)||!['pending','active'].includes(goal.status)||!participants.includes(user)||goal.changeProposal?.status==='pending')return state;
  const proposal={id:id('change'),proposedBy:user,createdAt:new Date(now).toISOString(),status:'pending',type:patch.cancel?'cancel':'change',patch:patch.cancel?{}:copy(patch)};
  return replaceGoal(state,{...goal,changeProposal:proposal});
}
function respondToChange(state,goalId,user=state?.user,accept=true,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId)),proposal=goal?.changeProposal;
  const participants=goal?.kind==='challenge'?[goal.createdBy,goal.targetUser]:goal?.kind==='shared'?[goal.createdBy,...people(state).filter(name=>name!==goal.createdBy)]:[];
  if(!goal||proposal?.status!=='pending'||proposal.proposedBy===user||!participants.includes(user))return state;
  if(!accept)return replaceGoal(state,{...goal,changeProposal:{...proposal,status:'declined',respondedBy:user,respondedAt:new Date(now).toISOString()}});
  if(proposal.type==='cancel')return replaceGoal(state,{...goal,status:'cancelled',cancelledAt:new Date(now).toISOString(),changeProposal:{...proposal,status:'accepted',respondedBy:user,respondedAt:new Date(now).toISOString()}});
  const patch=copy(proposal.patch||{}),metric=patch.metric?{...goal.metric,...patch.metric}:goal.metric;
  const next={...goal,...patch,metric,title:goalTitle(state,metric,patch.title??goal.title),changeProposal:{...proposal,status:'accepted',respondedBy:user,respondedAt:new Date(now).toISOString()}};
  if(patch.reward)next.reward=rewardInput({...goal.reward,...patch.reward},goal.kind,goal.createdBy);
  next.lockedSnapshot=lockSnapshot(next);
  return replaceGoal(state,next);
}
function filteredCompletions(state,goal,range){
  const actor=goal.kind==='shared'?null:(goal.kind==='challenge'?goal.targetUser:goal.owner);
  return (state?.completions||[]).filter(item=>item&&item.date>=range.start&&item.date<=range.end&&(!actor||item.by===actor));
}
function weekProgress(state,key){
  if(root?.FlytDailyLoop?.weekProgress)return root.FlytDailyLoop.weekProgress(state,key);
  const range=weekRange(key),tasks=(state?.tasks||[]).filter(task=>task.kind==='house'&&task.type!=='period'),total=tasks.reduce((sum,task)=>sum+Math.max(1,Number(task.freq)||1),0),done=Math.min(total,(state?.completions||[]).filter(item=>item.date>=range.start&&item.date<=range.end&&item.kind==='house').length);
  return{done,total,pct:total?Math.round(done/total*100):0,range};
}
function dayProgress(state,key){
  if(root?.FlytDailyLoop?.dayProgress)return root.FlytDailyLoop.dayProgress(state,key);
  const all=(state?.tasks||[]).filter(task=>task.kind==='house'&&task.type==='daily'),doneIds=new Set((state?.completions||[]).filter(item=>item.date===key).map(item=>String(item.taskId))),done=all.filter(task=>doneIds.has(String(task.id))).length;
  return{done,total:all.length,pct:all.length?Math.round(done/all.length*100):0};
}
function streakProgress(state,goal,key){
  const target=Math.max(1,Number(goal.metric?.target)||1);let count=0,cursor=weekRange(key).start;
  for(let i=0;i<target;i++){
    const progress=weekProgress(state,cursor);
    if(progress.total&&progress.pct>=100)count++;
    else break;
    cursor=addDays(cursor,-7);
  }
  return{value:count,target,pct:Math.min(100,Math.round(count/target*100)),label:`${count} av ${target} uker`};
}
function progress(state,goal,now=Date.now()){
  const key=dateKey(new Date(now)),metric=goal?.metric||{},target=Math.max(1,Number(metric.target)||1),range=weekRange(key);
  if(metric.type==='today_goal'){const p=dayProgress(state,key);return{value:p.pct,target:100,pct:p.pct,label:`${p.done} av ${p.total} gjøremål i dag`}}
  if(metric.type==='week_goal'){const p=weekProgress(state,key);return{value:p.pct,target:100,pct:p.pct,label:`${p.done} av ${p.total} denne uka`}}
  if(metric.type==='week_percent'){const p=weekProgress(state,key);return{value:p.pct,target,pct:Math.min(100,Math.round(p.pct/target*100)),label:`${p.pct} av ${target} %`}}
  if(metric.type==='streak')return streakProgress(state,goal,key);
  if(metric.type==='manual'){const value=goal.manualCompletedAt?1:0;return{value,target:1,pct:value?100:0,label:value?'Markert som fullført':'Markeres manuelt'}}
  const list=filteredCompletions(state,goal,range);
  if(metric.type==='task_count'){const value=list.length;return{value,target,pct:Math.min(100,Math.round(value/target*100)),label:`${value} av ${target} gjøremål`}}
  if(metric.type==='task_specific'||metric.type==='task_once'){
    const value=list.filter(item=>String(item.taskId)===String(metric.taskId)).length,needed=metric.type==='task_once'?1:target;
    return{value,target:needed,pct:Math.min(100,Math.round(value/needed*100)),label:`${value} av ${needed} fullført`};
  }
  return{value:0,target,pct:0,label:'Ikke startet'};
}
function markManualDone(state,goalId,user=state?.user,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  const allowed=goal?.kind==='shared'||goal?.owner===user||goal?.targetUser===user;
  if(!goal||goal.metric?.type!=='manual'||goal.status!=='active'||!allowed)return state;
  return refreshState(replaceGoal(state,{...goal,manualCompletedAt:new Date(now).toISOString()}),now);
}
function markRewardUsed(state,goalId,user=state?.user,now=Date.now()){
  const goal=goals(state).find(item=>String(item.id)===String(goalId));
  if(!goal||goal.reward?.status!=='unlocked'||![goal.owner,goal.targetUser,goal.createdBy,goal.reward?.offeredBy,...(goal.acceptedBy||[])].filter(Boolean).includes(user))return state;
  return replaceGoal(state,{...goal,reward:{...goal.reward,status:'used',usedAt:new Date(now).toISOString(),usedBy:user}});
}
function refreshState(state,now=Date.now()){
  let changed=false;
  const next=goals(state).map(goal=>{
    if(goal.status!=='active')return goal;
    const p=progress(state,goal,now),reached=p.pct>=100;
    if(reached){changed=true;const reward=goal.reward?.status==='active'?{...goal.reward,status:'unlocked',unlockedAt:new Date(now).toISOString()}:goal.reward;return{...goal,status:'reached',reachedAt:new Date(now).toISOString(),reward}}
    const deadlineKey=String(goal.deadline||'').slice(0,10);
    if(deadlineKey&&deadlineKey<dateKey(new Date(now))){changed=true;return{...goal,status:'not_completed',endedAt:new Date(now).toISOString()}}
    return goal;
  });
  return changed?{...state,goals:next}:state;
}
function statusLabel(goal){
  if(goal?.reward?.status==='unlocked')return'Låst opp';
  if(goal?.reward?.status==='used')return'Gjennomført / brukt';
  return({pending:'Venter på svar',active:'Aktiv',reached:'Mål nådd',not_completed:'Ikke fullført',declined:'Avslått',cancelled:'Avsluttet'})[goal?.status]||'Aktiv';
}

return{VERSION,METRICS,REWARD_LIBRARY,acceptGoal,addPartnerReward,approveReward,createGoal,dateKey,declineGoal,editPendingGoal,endOfWeek,goalTitle,goals,markManualDone,markRewardUsed,metricLabel,partnerName,progress,proposeChange,refreshState,respondToChange,statusLabel,weekRange};
});
