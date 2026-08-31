((root)=>{
'use strict';

const VERSION='20260831-1200';
const MAX_REPLY_LENGTH=220;
const INVITATION_RESPONSES=new Set(['yes','later','counter','no']);

function iso(now=Date.now()){
  const value=typeof now==='number'?now:new Date(now).getTime();
  return new Date(Number.isFinite(value)?value:Date.now()).toISOString();
}
function cleanText(value,max=MAX_REPLY_LENGTH){
  return String(value||'').trim().replace(/\s+/g,' ').slice(0,max);
}
function requestState(request){
  if(!request)return'missing';
  if(request.deleted)return'withdrawn';
  if(request.done)return'completed';
  if(request.declinedAt||request.responseState==='declined')return'declined';
  if(request.counter?.status==='pending'||request.responseState==='countered')return'countered';
  if(request.acceptedBy||request.responseState==='accepted')return'accepted';
  return'pending';
}
function requestActive(request){
  return ['pending','countered','accepted'].includes(requestState(request));
}
function canWithdrawRequest(request,user){
  return !!request&&request.by===user&&requestState(request)==='pending';
}
function canDeleteRequest(request,user){
  return !!request&&request.by===user&&!requestActive(request);
}
function makeSupportRequest({state,task,text,now=Date.now()}){
  return {
    id:`req_${now}`,
    kind:'support',
    type:'practical',
    source:'nudge',
    text:cleanText(text,600),
    by:state?.user||'',
    createdAt:now,
    responseState:'pending',
    taskId:task?.id??null,
    taskName:task?.name||'',
    seen:false,
    seenBy:null,
    seenAt:null,
    acceptedBy:null,
    acceptedAt:null,
    done:false,
    doneBy:null,
    doneAt:null,
    deleted:false,
    deletedAt:null,
    replies:[]
  };
}
function makeInitiative({state,task,partnerName='partneren din',now=Date.now()}){
  const taskName=String(task?.name||'gjøremålet').trim();
  return {
    id:`initiative_${now}`,
    kind:'initiative',
    type:'practical',
    source:'initiative',
    text:`Jeg tar ${taskName.charAt(0).toLowerCase()+taskName.slice(1)} i dag.`,
    by:state?.user||'',
    for:partnerName,
    createdAt:now,
    responseState:'accepted',
    taskId:task?.id??null,
    taskName,
    seen:false,
    seenBy:null,
    seenAt:null,
    acceptedBy:state?.user||'',
    acceptedAt:iso(now),
    done:false,
    doneBy:null,
    doneAt:null,
    deleted:false,
    deletedAt:null,
    replies:[]
  };
}
function markSeen(request,user,now=Date.now()){
  const next={...request};
  next.seen=true;
  next.seenBy=next.seenBy||user;
  next.seenAt=next.seenAt||iso(now);
  return next;
}
function acceptRequest(request,user,now=Date.now()){
  if(!request||request.by===user||requestState(request)!=='pending')return request;
  const next=markSeen(request,user,now);
  next.responseState='accepted';
  next.acceptedBy=user;
  next.acceptedAt=iso(now);
  next.responseUpdatedAt=now;
  next.responseSeenBy=[user];
  return next;
}
function declineRequest(request,user,now=Date.now()){
  if(!request||request.by===user||!['pending','countered'].includes(requestState(request)))return request;
  const next=markSeen(request,user,now);
  next.responseState='declined';
  next.declinedBy=user;
  next.declinedAt=iso(now);
  next.responseUpdatedAt=now;
  next.responseSeenBy=[user];
  return next;
}
function replyToRequest(request,user,text,now=Date.now()){
  const value=cleanText(text);
  if(!request||!value||!requestActive(request))return request;
  const next=markSeen(request,user,now),replies=Array.isArray(request.replies)?request.replies.slice(-3):[];
  next.replies=[...replies,{id:`reply_${now}`,text:value,by:user,createdAt:now}];
  next.replyUpdatedAt=now;
  next.replySeenBy=[user];
  return next;
}
function counterRequest(request,user,task,text='',now=Date.now()){
  if(!request||request.by===user||requestState(request)!=='pending'||!task)return request;
  const next=markSeen(request,user,now);
  next.responseState='countered';
  next.counter={
    taskId:task.id??null,
    taskName:task.name||'',
    text:cleanText(text),
    by:user,
    createdAt:now,
    status:'pending'
  };
  next.responseUpdatedAt=now;
  next.responseSeenBy=[user];
  return next;
}
function acceptCounter(request,user,now=Date.now()){
  if(!request||request.by!==user||requestState(request)!=='countered'||request.counter?.status!=='pending')return request;
  const next={...request,counter:{...request.counter,status:'accepted',answeredAt:iso(now),answeredBy:user}};
  next.taskId=request.counter.taskId;
  next.taskName=request.counter.taskName;
  next.responseState='accepted';
  next.acceptedBy=request.counter.by;
  next.acceptedAt=iso(now);
  next.decisionUpdatedAt=now;
  next.decisionSeenBy=[user];
  return next;
}
function keepOriginalRequest(request,user,now=Date.now()){
  if(!request||request.by!==user||requestState(request)!=='countered'||request.counter?.status!=='pending')return request;
  const next={...request,counter:{...request.counter,status:'not_used',answeredAt:iso(now),answeredBy:user}};
  next.responseState='pending';
  next.decisionUpdatedAt=now;
  next.decisionSeenBy=[user];
  return next;
}
function completeRequest(request,user,now=Date.now()){
  if(!request||!requestActive(request))return request;
  const state=requestState(request),initiative=request.source==='initiative';
  if(initiative&&request.acceptedBy!==user)return request;
  if(!initiative&&state==='accepted'&&request.acceptedBy!==user)return request;
  if(!initiative&&state==='pending'&&request.by===user)return request;
  const next=markSeen(request,user,now);
  next.responseState='completed';
  next.acceptedBy=next.acceptedBy||user;
  next.acceptedAt=next.acceptedAt||iso(now);
  next.done=true;
  next.doneBy=user;
  next.doneAt=iso(now);
  next.completionUpdatedAt=now;
  next.completionSeenBy=[user];
  return next;
}
function markRequestUpdatesSeen(request,user){
  if(!request)return request;
  const next={...request};
  for(const key of ['response','decision','completion','reply']){
    if(!next[`${key}UpdatedAt`])continue;
    const seen=new Set(Array.isArray(next[`${key}SeenBy`])?next[`${key}SeenBy`]:[]);
    seen.add(user);
    next[`${key}SeenBy`]=[...seen];
  }
  return next;
}
function canThank(request,user){
  if(requestState(request)!=='completed'||request.appreciationText||!request.doneBy)return false;
  if(request.source==='initiative')return user!==request.by&&request.doneBy===request.by;
  return user===request.by&&request.doneBy!==user;
}
function addThanks(request,user,text,now=Date.now()){
  const value=cleanText(text,180);
  if(!value||!canThank(request,user))return request;
  return {
    ...request,
    appreciationText:value,
    appreciationBy:user,
    appreciationAt:iso(now),
    appreciationSeenBy:[user]
  };
}
function markThanksSeen(request,user){
  if(!request?.appreciationText)return request;
  const seen=new Set(Array.isArray(request.appreciationSeenBy)?request.appreciationSeenBy:[]);
  seen.add(user);
  return {...request,appreciationSeenBy:[...seen]};
}

function makeInvitation({state,text,notifyPartner=true,now=Date.now()}){
  return {
    id:`invite_${now}`,
    text:cleanText(text,240),
    by:state?.user||'',
    createdAt:now,
    notifyPartner:notifyPartner!==false,
    seenBy:[state?.user||''].filter(Boolean),
    response:null,
    finalResponse:null,
    deleted:false,
    deletedAt:null
  };
}
function invitationState(invitation){
  if(!invitation)return'missing';
  if(invitation.deleted)return'withdrawn';
  if(invitation.finalResponse?.kind==='yes')return'accepted';
  if(invitation.finalResponse?.kind==='later')return'later';
  if(invitation.finalResponse?.kind==='no')return'declined';
  const kind=invitation.response?.kind;
  if(kind==='yes')return'accepted';
  if(kind==='later')return'later';
  if(kind==='no')return'declined';
  if(kind==='counter')return'countered';
  return'pending';
}
function invitationActive(invitation){
  return ['pending','countered'].includes(invitationState(invitation));
}
function respondInvitation(invitation,user,kind,text='',now=Date.now()){
  if(!invitation||invitation.by===user||invitationState(invitation)!=='pending'||!INVITATION_RESPONSES.has(kind))return invitation;
  const value=kind==='counter'?cleanText(text,180):'';
  if(kind==='counter'&&!value)return invitation;
  const seen=new Set(Array.isArray(invitation.seenBy)?invitation.seenBy:[]);
  seen.add(user);
  return {
    ...invitation,
    seenBy:[...seen],
    response:{kind,text:value,by:user,createdAt:now,createdAtIso:iso(now)}
  };
}
function acceptInvitationCounter(invitation,user,now=Date.now()){
  if(!invitation||invitation.by!==user||invitationState(invitation)!=='countered')return invitation;
  return {
    ...invitation,
    finalResponse:{kind:'yes',text:invitation.response?.text||'',by:user,createdAt:now,createdAtIso:iso(now)}
  };
}

const core={
  VERSION,
  MAX_REPLY_LENGTH,
  cleanText,
  requestState,
  requestActive,
  canWithdrawRequest,
  canDeleteRequest,
  makeSupportRequest,
  makeInitiative,
  markSeen,
  acceptRequest,
  declineRequest,
  replyToRequest,
  counterRequest,
  acceptCounter,
  keepOriginalRequest,
  completeRequest,
  markRequestUpdatesSeen,
  canThank,
  addThanks,
  markThanksSeen,
  makeInvitation,
  invitationState,
  invitationActive,
  respondInvitation,
  acceptInvitationCounter
};

if(typeof module==='object'&&module.exports)module.exports=core;
if(root)root.FlytCoupleCore=core;
})(typeof window!=='undefined'?window:null);
