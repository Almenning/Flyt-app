(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.FlytSyncMerge=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';

const VERSION='20260923-revision-sync1';
const MISSING=Symbol('missing');
const ENTITY_ARRAYS=new Set([
  'tasks','custom','completions','plannedTasks','taskClaims','taskHelpRequests','taskMoves',
  'work','seenRequests','recognitions','goals','rewardOffers','rewardPurchases',
  'rewards','rewardRedemptions','quickTemptations','coupleInvitations','setupHistory',
  'acknowledgements','thanks'
]);
const SET_ARRAYS=new Set(['seenBy','contributors','firstWinSeenBy','addedTaskIds','removedTaskIds','dismissedIds','customizedFields']);

function clone(value){
  if(value===MISSING)return MISSING;
  if(value===undefined)return undefined;
  return structuredClone(value);
}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object'){
    const result={};
    for(const key of Object.keys(value).sort())if(value[key]!==undefined)result[key]=stable(value[key]);
    return result;
  }
  return value;
}
function equal(a,b){
  if(a===MISSING||b===MISSING)return a===b;
  try{return JSON.stringify(stable(a))===JSON.stringify(stable(b))}catch(error){return false}
}
function isObject(value){return !!value&&typeof value==='object'&&!Array.isArray(value)}
function pathKey(path){return path[path.length-1]||''}
function entityKey(item,path,index){
  if(!isObject(item))return null;
  const field=pathKey(path);
  if(field==='completions'&&item.taskSnapshot?.type==='daily'&&item.taskId!=null&&item.date)return `daily:${item.taskId}:${item.date}`;
  if(field==='thanks'||field==='acknowledgements')return item.by!=null?`by:${String(item.by)}`:null;
  if(item.id!=null)return `id:${String(item.id)}`;
  if(field==='completions')return item.taskId!=null&&item.date?`completion:${item.taskId}:${item.date}:${item.registeredAt||item.by||index}`:null;
  if(field==='taskClaims')return item.taskId!=null&&item.date?`claim:${item.taskId}:${item.date}:${item.createdAt||item.claimedBy||index}`:null;
  if(field==='plannedTasks')return item.taskId!=null&&item.date?`planned:${item.taskId}:${item.date}`:null;
  if(item.createdAt!=null)return `created:${String(item.createdAt)}:${String(item.by||item.title||index)}`;
  return null;
}
function mergeSet(base,local,remote){
  const values=[];
  for(const value of [...local,...remote,...base])if(!values.some(existing=>equal(existing,value)))values.push(value);
  const has=(items,value)=>items.some(item=>equal(item,value)),result=[];
  for(const value of values){
    const b=has(base,value),l=has(local,value),r=has(remote,value);
    const keep=l===r?l:l===b?r:r===b?l:l;
    if(keep)result.push(clone(value));
  }
  return result;
}
function mergeEntityArray(base,local,remote,path){
  const map=(items)=>{
    const result=new Map();
    items.forEach((item,index)=>{const key=entityKey(item,path,index);if(key!=null)result.set(key,item)});
    return result;
  };
  const baseMap=map(base),localMap=map(local),remoteMap=map(remote);
  const order=[];
  for(const [key] of localMap)order.push(key);
  for(const [key] of remoteMap)if(!localMap.has(key))order.push(key);
  const result=[];
  for(const key of order){
    const b=baseMap.has(key)?baseMap.get(key):MISSING;
    const l=localMap.has(key)?localMap.get(key):MISSING;
    const r=remoteMap.has(key)?remoteMap.get(key):MISSING;
    const concurrentlyCreated=b===MISSING&&l!==MISSING&&r!==MISSING&&!equal(l,r);
    const value=concurrentlyCreated?clone(l):mergeValue(b,l,r,[...path,key]);
    if(value!==MISSING)result.push(value);
  }
  return result;
}
function canMergeEntities(items,path){
  return items.every((item,index)=>entityKey(item,path,index)!=null);
}
function mergeArray(base,local,remote,path){
  const key=pathKey(path);
  if(SET_ARRAYS.has(key))return mergeSet(base,local,remote);
  const all=[...base,...local,...remote];
  if(ENTITY_ARRAYS.has(key)&&canMergeEntities(all,path))return mergeEntityArray(base,local,remote,path);
  return clone(local);
}
function mergePoints(base,local,remote){
  const b=base===MISSING?0:Number(base),l=local===MISSING?0:Number(local),r=remote===MISSING?0:Number(remote);
  if(![b,l,r].every(Number.isFinite))return clone(local);
  return Math.max(0,b+(l-b)+(r-b));
}
function mergeValue(base,local,remote,path=[]){
  if(equal(local,remote))return clone(local);
  if(equal(local,base))return clone(remote);
  if(equal(remote,base))return clone(local);

  if(base===MISSING){
    if(local===MISSING)return clone(remote);
    if(remote===MISSING)return clone(local);
    if(Array.isArray(local)&&Array.isArray(remote))base=[];
    else if(isObject(local)&&isObject(remote))base={};
  }else if(local===MISSING||remote===MISSING){
    return MISSING;
  }

  if(path[0]==='points'&&path.length===2)return mergePoints(base,local,remote);
  if(Array.isArray(base)&&Array.isArray(local)&&Array.isArray(remote))return mergeArray(base,local,remote,path);
  if(isObject(base)&&isObject(local)&&isObject(remote)){
    const result={};
    const keys=new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)]);
    for(const key of keys){
      const value=mergeValue(
        Object.prototype.hasOwnProperty.call(base,key)?base[key]:MISSING,
        Object.prototype.hasOwnProperty.call(local,key)?local[key]:MISSING,
        Object.prototype.hasOwnProperty.call(remote,key)?remote[key]:MISSING,
        [...path,key]
      );
      if(value!==MISSING)result[key]=value;
    }
    return result;
  }
  return clone(local);
}
function mergeSharedState(base={},local={},remote={}){
  const result=mergeValue(base||{},local||{},remote||{},[]);
  const merged=result===MISSING?{}:result;
  correctDuplicateDailyPoints(base||{},local||{},remote||{},merged);
  return merged;
}

function dailyKey(item){return item?.taskSnapshot?.type==='daily'&&item?.taskId!=null&&item?.date?`${item.taskId}:${item.date}`:null}
function correctDuplicateDailyPoints(base,local,remote,merged){
  if(!isObject(merged?.points))return;
  const known=new Set((base.completions||[]).map(dailyKey).filter(Boolean));
  const localAdded=new Map((local.completions||[]).filter(item=>{const key=dailyKey(item);return key&&!known.has(key)}).map(item=>[dailyKey(item),item]));
  for(const item of remote.completions||[]){
    const key=dailyKey(item),other=key?localAdded.get(key):null;
    if(!other||String(other.id)===String(item.id))continue;
    for(const [name,amount] of Object.entries(item.pointAwards||{})){
      const current=Number(merged.points[name]),value=Number(amount);
      if(Number.isFinite(current)&&Number.isFinite(value))merged.points[name]=Math.max(0,current-value);
    }
  }
}

async function saveWithRevision({base={},state={},revision=0,save,maxAttempts=5}={}){
  if(typeof save!=='function')throw new TypeError('save must be a function');
  let currentBase=clone(base||{}),candidate=clone(state||{}),expected=Number(revision)||0,conflicted=false;
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    const response=await save(candidate,expected);
    if(response?.ok){
      return{ok:true,state:candidate,revision:Number(response.revision),attempts:attempt,conflicted};
    }
    if(!response?.conflict)throw new Error(response?.message||'STATE_SAVE_FAILED');
    conflicted=true;
    const remote=clone(response.state||{});
    candidate=mergeSharedState(currentBase,candidate,remote);
    currentBase=remote;
    expected=Number(response.revision)||0;
  }
  const error=new Error('STATE_CONFLICT_RETRY_LIMIT');
  error.code='STATE_CONFLICT_RETRY_LIMIT';
  throw error;
}

return{VERSION,equal,mergeSharedState,saveWithRevision};
});
