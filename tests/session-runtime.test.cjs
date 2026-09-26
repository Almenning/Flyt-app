const test=require('node:test');
const assert=require('node:assert/strict');
const {harness,storage,server,deferred}=require('./helpers/sync-harness.cjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const addCompletion=s=>({...s,completions:[...s.completions,{id:'done-1',taskId:'task',date:'2026-09-26',by:'A'}],points:{A:(s.points.A||0)+10}});

test('a delayed pull cannot restore private state or cache after logout',async()=>{
 const h=harness();await h.api.bootstrap();const late=deferred();h.rpc(()=>late.promise);
 const pull=h.api.pull(true);await tick();assert.equal(await h.api.logout(),true);
 late.resolve({data:h.remote.context(),error:null});assert.equal(await pull,false);
 assert.equal(h.api.getContext(),null);assert.equal(h.api.isReady(),false);
 assert.deepEqual(h.state.completions,[]);assert.equal(Object.keys(h.store.entries()).some(k=>k.startsWith('flyt_state_v6:')),false);
});
test('late save success AND failure cannot resurrect a logged-out session',async()=>{
 for(const fail of [false,true]){
  const h=harness();await h.api.bootstrap();h.edit(addCompletion);const late=deferred();h.rpc((name,args)=>name==='save_my_flyt_state_v2'?late.promise:{data:h.remote.context(),error:null});
  const saving=h.api.retrySave();await tick();await h.api.logout();
  if(fail)late.reject(new Error('network'));else late.resolve({data:{ok:true,revision:1},error:null});
  assert.equal(await saving,false);assert.equal(h.api.getContext(),null);assert.deepEqual(h.state.completions,[]);
  await h.timers();assert.equal(h.api.getContext(),null);
 }
});
test('delayed bootstrap/resume never starts polling after logout',async()=>{
 for(const resume of [false,true]){
  const h=harness({native:true});if(resume)await h.api.bootstrap();const late=deferred();h.getSession(()=>late.promise);
  const work=resume?h.api.resumeAfterForeground():h.api.bootstrap();await tick();await h.api.logout();
  late.resolve({data:{session:{user:{id:'user-a'}}},error:null});await work;
  assert.equal(h.api.getContext(),null);assert.equal(h.api.isReady(),false);assert.equal(h.intervals(),0);
 }
});
test('late old-account context cannot enter the next account',async()=>{
 const h=harness();await h.api.bootstrap();const late=deferred();h.rpc(()=>late.promise);
 const pulling=h.api.pull();await tick();h.switchUser('user-b');
 late.resolve({data:h.remote.context('user-a'),error:null});await pulling;
 assert.equal(h.api.getContext(),null);assert.deepEqual(h.state.completions,[]);
});
test('Keychain cleanup failure is not a successful logout and blocks resume across restart',async()=>{
 const store=storage(),h=harness({storage:store,native:true,clearKeychain:()=>Promise.reject(new Error('locked'))});
 await h.api.bootstrap();assert.equal(await h.api.logout(),false);
 assert.match(h.nodes.get('betaGateBox').innerHTML,/retryLogout/);assert.equal(store.getItem('hverdagsoss:auth-blocked:v1'),'1');
 const next=harness({storage:store,native:true});assert.equal(await next.api.bootstrap(),false);assert.equal(next.api.getContext(),null);
 assert.equal(await next.api.resumeAfterForeground(),false);
});
test('a thrown SDK signout still attempts Keychain cleanup',async()=>{
 const h=harness({native:true,signOut:()=>Promise.reject(new Error('offline'))});await h.api.bootstrap();
 assert.equal(await h.api.logout(),false);assert.ok(h.calls.includes('clear-keychain'));assert.equal(h.api.getContext(),null);
});
test('failed logout can be retried and a fresh explicit login works',async()=>{
 let fail=true;const h=harness({native:true,clearKeychain:async()=>{if(fail)throw new Error('locked')}});await h.api.bootstrap();
 assert.equal(await h.api.logout(),false);fail=false;assert.equal(await h.api.logout(),true);
 h.nodes.get('chooseSignin').onclick();h.nodes.get('betaEmail').value='user-b';h.nodes.get('betaPassword').value='safe-password';
 await h.nodes.get('betaSignin').onclick();assert.equal(h.api.getContext().user_id,'user-b');assert.equal(h.store.getItem('hverdagsoss:auth-blocked:v1'),null);
});
test('offline edit survives process restart and syncs once on reconnect',async()=>{
 const store=storage(),remote=server(),first=harness({storage:store,server:remote});await first.api.bootstrap();
 first.navigator.onLine=false;first.edit(addCompletion);assert.equal(await first.api.retrySave(),false);
 assert.ok(Object.keys(store.entries()).some(k=>k.startsWith('hverdagsoss:outbox:v1:')));
 const next=harness({storage:store,server:remote});await next.api.bootstrap();assert.equal(next.state.completions.length,1);
 assert.equal(await next.api.retrySave(),true);assert.equal(remote.state.completions.length,1);assert.equal(remote.state.points.A,10);
 assert.equal(Object.keys(store.entries()).some(k=>k.startsWith('hverdagsoss:outbox:v1:')),false);
});
test('a committed write with a lost response is not scored twice after restart',async()=>{
 const store=storage(),remote=server(),first=harness({storage:store,server:remote});await first.api.bootstrap();first.edit(addCompletion);
 first.rpc((name,args)=>{if(name==='save_my_flyt_state_v2'){remote.save(args);throw new Error('response lost')}return{data:remote.context(),error:null}});
 assert.equal(await first.api.retrySave(),false);assert.equal(remote.state.points.A,10);
 const next=harness({storage:store,server:remote});await next.api.bootstrap();await next.api.retrySave();
 assert.equal(remote.state.points.A,10);assert.equal(next.state.points.A,10);assert.equal(remote.state.completions.length,1);
});
test('a late committed write conflicts with a retry and its receipt prevents duplicate points',async()=>{
 const store=storage(),remote=server(),first=harness({storage:store,server:remote});await first.api.bootstrap();first.edit(addCompletion);
 let delayedArgs;first.rpc((name,args)=>{if(name==='save_my_flyt_state_v2'){delayedArgs=args;throw new Error('request status unknown')}return{data:remote.context(),error:null}});await first.api.retrySave();
 const next=harness({storage:store,server:remote});await next.api.bootstrap();remote.save(delayedArgs);
 assert.equal(await next.api.retrySave(),true);assert.equal(remote.state.points.A,10);assert.equal(next.state.points.A,10);
});
test('edits during an in-flight save survive and are uploaded by the next save',async()=>{
 const h=harness();await h.api.bootstrap();h.edit(addCompletion);const late=deferred();let args;
 h.rpc((name,a)=>{if(name==='save_my_flyt_state_v2'){args=a;return late.promise}return{data:h.remote.context(),error:null}});const first=h.api.retrySave();await tick();
 h.edit(s=>({...s,recognitions:[{id:'thanks-1',text:'Thanks'}]}));late.resolve(h.remote.save(args));await first;
 assert.equal(h.state.recognitions.length,1);h.rpc(null);await h.api.retrySave();assert.equal(h.remote.state.recognitions.length,1);
});
test('unconfirmed membership or a different account never restores another outbox',async()=>{
 const store=storage(),remote=server(),first=harness({storage:store,server:remote});await first.api.bootstrap();first.navigator.onLine=false;first.edit(addCompletion);
 const other=harness({storage:store,server:server(),userId:'user-b'});await other.api.bootstrap();assert.equal(other.state.completions.length,0);
 const offline=harness({storage:store,getSession:async()=>({data:{session:{user:{id:'user-a'}}},error:null}),rpc:async()=>{throw new Error('offline')}});await offline.api.bootstrap();assert.equal(offline.api.isReady(),false);assert.equal(offline.state.completions.length,0);
 assert.ok(Object.keys(store.entries()).some(k=>k.startsWith('hverdagsoss:outbox:v1:')));
});
test('consent changes or partner disconnection never replay previous drafts',async()=>{
 const store=storage(),remote=server(),h=harness({storage:store,server:remote});await h.api.bootstrap();h.navigator.onLine=false;h.edit(addCompletion);
 const next=harness({storage:store,server:remote,rpc:async()=>({data:{...remote.context(),consent:{privacy_version:'v2'}},error:null})});await next.api.bootstrap();assert.equal(next.state.completions.length,0);
 remote.disconnect();next.rpc(null);await next.api.pull(true);assert.equal(next.api.isReady(),false);assert.equal(next.api.getContext()?.household,null);
});
test('storage quota failure never claims durable saving succeeded',async()=>{
 const store=storage(),h=harness({storage:store});await h.api.bootstrap();const set=store.setItem;store.setItem=(k,v)=>{if(k.startsWith('hverdagsoss:outbox'))throw new Error('quota');return set(k,v)};
 h.edit(addCompletion);h.api.openConnection();assert.match(h.nodes.get('syncBody').innerHTML,/Kunne ikke lagre lokalt/);
});
test('parallel bootstrap and resume events share their active work',async()=>{
 const h=harness({native:true}),late=deferred();let count=0;h.getSession(()=>{count++;return late.promise});
 const a=h.api.bootstrap(),b=h.api.bootstrap(),c=h.api.resumeAfterForeground();await tick();assert.equal(count,1);
 late.resolve({data:{session:{user:{id:'user-a'}}},error:null});await Promise.all([a,b,c]);assert.equal(h.intervals(),1);
});

test('UI module memory is discarded only after confirmed logout cleanup',async()=>{
 let reloads=0,fail=true;const h=harness({native:true,reload:()=>reloads++,clearKeychain:async()=>{if(fail)throw new Error('locked')}});
 await h.api.bootstrap();assert.equal(await h.api.logout(),false);assert.equal(reloads,0);
 fail=false;assert.equal(await h.api.logout(),true);assert.equal(reloads,1);
});
test('a still-open offline client verifies membership before replaying its queued write',async()=>{
 const h=harness();await h.api.bootstrap();h.navigator.onLine=false;h.edit(addCompletion);h.remote.disconnect();h.navigator.onLine=true;
 assert.equal(await h.api.retrySave(),false);assert.equal(h.remote.state.completions,undefined);
 assert.equal(h.calls.filter(x=>x==='save_my_flyt_state_v2').length,0);assert.equal(h.api.isReady(),false);
});
