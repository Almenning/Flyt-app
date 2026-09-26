(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.FlytSyncJournal=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const PREFIX='hverdagsoss:outbox:v1:';
  const BLOCK_KEY='hverdagsoss:auth-blocked:v1';
  const copy=value=>structuredClone(value);
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  function key(userId,householdId){
    if(!userId||!householdId)throw new Error('OUTBOX_IDENTITY_REQUIRED');
    return PREFIX+encodeURIComponent(userId)+':'+encodeURIComponent(householdId);
  }
  function read(storage,userId,householdId){
    const raw=storage.getItem(key(userId,householdId));
    if(raw===null)return null;
    const record=JSON.parse(raw);
    if(record.version!==1||record.userId!==userId||record.householdId!==householdId||!object(record.base)||!object(record.local))throw new Error('OUTBOX_INVALID');
    if(record.pending&&(!record.pending.id||!object(record.pending.local)))throw new Error('OUTBOX_INVALID');
    return record;
  }
  function write(storage,userId,householdId,base,local,pending=null,consent=null){
    const record={version:1,userId,householdId,base:copy(base),local:copy(local),pending:copy(pending),consent,updatedAt:Date.now()};
    storage.setItem(key(userId,householdId),JSON.stringify(record));
    return record;
  }
  function remove(storage,userId,householdId){storage.removeItem(key(userId,householdId));}
  function clear(storage){
    for(let i=storage.length-1;i>=0;i--){const k=storage.key(i);if(k?.startsWith(PREFIX))storage.removeItem(k);}
  }
  // Receipts make a committed write whose response was lost safe to retry.
  function acknowledged(record,remote){return !!record.pending&&remote?._syncReceipts?.[record.pending.clientId]===record.pending.id;}
  function recover(record,remote,merge){
    return merge(acknowledged(record,remote)?record.pending.local:record.base,record.local,remote);
  }
  return{PREFIX,BLOCK_KEY,key,read,write,remove,clear,acknowledged,recover};
});
