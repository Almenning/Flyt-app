const test=require('node:test');
const assert=require('node:assert/strict');
const {mergeSharedState,saveWithRevision}=require('../sync-merge.js');

function memoryServer(initial){
  let state=structuredClone(initial),revision=0;
  return{
    read:()=>({state:structuredClone(state),revision}),
    save:async(candidate,expected)=>{
      if(expected!==revision)return{ok:false,conflict:true,state:structuredClone(state),revision};
      state=structuredClone(candidate);revision+=1;
      return{ok:true,conflict:false,revision};
    }
  };
}

const baseState=()=>({
  tasks:[{id:'dishes',name:'Oppvask',owner:'Begge',pts:30}],
  completions:[],recognitions:[],taskClaims:[],goals:[],points:{Tore:0,Jannicke:0},
  taskOrder:{Kjøkken:['dishes']},status:{Tore:{energy:'med'},Jannicke:{energy:'med'}}
});

test('to separate clients preserve concurrent additive changes',async()=>{
  const initial=baseState(),server=memoryServer(initial),snapshot=server.read();
  const clientA={...structuredClone(initial),completions:[{id:101,taskId:'dishes',date:'2026-09-23',by:'Tore'}],points:{Tore:30,Jannicke:0}};
  const clientB={...structuredClone(initial),recognitions:[{id:'recognition_1',type:'recognition',by:'Jannicke',to:'Tore',text:'Takk ❤️',at:'2026-09-23T12:00:00Z'}]};

  const first=await saveWithRevision({base:initial,state:clientA,revision:snapshot.revision,save:server.save});
  const second=await saveWithRevision({base:initial,state:clientB,revision:snapshot.revision,save:server.save});

  assert.equal(first.revision,1);
  assert.equal(second.revision,2);
  assert.equal(second.conflicted,true);
  assert.deepEqual(server.read().state.completions.map(item=>item.id),[101]);
  assert.deepEqual(server.read().state.recognitions.map(item=>item.id),['recognition_1']);
  assert.equal(server.read().state.points.Tore,30);
});

test('same entity merges separate fields and latest explicit field wins',async()=>{
  const initial=baseState(),server=memoryServer(initial);
  const ownerChange=structuredClone(initial);ownerChange.tasks[0].owner='Tore';
  const effortChange=structuredClone(initial);effortChange.tasks[0].pts=50;
  await saveWithRevision({base:initial,state:ownerChange,revision:0,save:server.save});
  await saveWithRevision({base:initial,state:effortChange,revision:0,save:server.save});
  assert.deepEqual(server.read().state.tasks[0],{id:'dishes',name:'Oppvask',owner:'Tore',pts:50});

  const sameBase=server.read(),first=structuredClone(sameBase.state),second=structuredClone(sameBase.state);
  first.tasks[0].owner='Jannicke';second.tasks[0].owner='Begge';
  await saveWithRevision({base:sameBase.state,state:first,revision:sameBase.revision,save:server.save});
  await saveWithRevision({base:sameBase.state,state:second,revision:sameBase.revision,save:server.save});
  assert.equal(server.read().state.tasks[0].owner,'Begge');
});

test('offline client merges its queued change after reconnect',async()=>{
  const initial=baseState(),server=memoryServer(initial),offlineSnapshot=server.read();
  const online=structuredClone(initial);online.taskClaims.push({id:'claim_1',taskId:'dishes',date:'2026-09-23',claimedBy:'Tore'});
  await saveWithRevision({base:initial,state:online,revision:0,save:server.save});

  const offline=structuredClone(initial);offline.goals.push({id:'goal_1',title:'Helgemål',status:'active'});
  const reconnected=await saveWithRevision({base:offlineSnapshot.state,state:offline,revision:offlineSnapshot.revision,save:server.save});
  assert.equal(reconnected.conflicted,true);
  assert.deepEqual(server.read().state.taskClaims.map(item=>item.id),['claim_1']);
  assert.deepEqual(server.read().state.goals.map(item=>item.id),['goal_1']);
});

test('open editing and sorting keep local draft/order while remote events merge in',()=>{
  const initial=baseState();
  const local=structuredClone(initial);local.tasks[0].name='Oppvask og benk';local.taskOrder.Kjøkken=['new-task','dishes'];
  const remote=structuredClone(initial);remote.completions.push({id:202,taskId:'dishes',date:'2026-09-23',by:'Jannicke'});remote.taskOrder.Kjøkken=['dishes','new-task'];
  const merged=mergeSharedState(initial,local,remote);
  assert.equal(merged.tasks[0].name,'Oppvask og benk');
  assert.deepEqual(merged.taskOrder.Kjøkken,['new-task','dishes']);
  assert.deepEqual(merged.completions.map(item=>item.id),[202]);
});

test('concurrent points deltas and acknowledgement history are additive',()=>{
  const initial=baseState();
  initial.points.Tore=100;
  initial.completions=[{id:1,taskId:'dishes',date:'2026-09-23',by:'Tore',acknowledgements:[]}];
  const local=structuredClone(initial),remote=structuredClone(initial);
  local.points.Tore=130;remote.points.Tore=120;
  local.completions[0].acknowledgements.push({id:'ack_a',by:'Jannicke',to:'Tore',at:'2026-09-23T10:00:00Z'});
  remote.completions[0].acknowledgements.push({id:'ack_b',by:'Mari',to:'Tore',at:'2026-09-23T10:01:00Z'});
  const merged=mergeSharedState(initial,local,remote);
  assert.equal(merged.points.Tore,150);
  assert.deepEqual(merged.completions[0].acknowledgements.map(item=>item.id),['ack_a','ack_b']);
});

test('explicit deletion is not resurrected by a concurrent edit',()=>{
  const initial=baseState(),local=structuredClone(initial),remote=structuredClone(initial);
  local.tasks=[];remote.tasks[0].name='Ny tittel';
  assert.deepEqual(mergeSharedState(initial,local,remote).tasks,[]);
});

test('concurrent day-plan additions merge while an explicit removal stays removed',()=>{
  const initial={...baseState(),dayPlans:{'2026-09-24':{addedTaskIds:['old'],removedTaskIds:[]}}};
  const local=structuredClone(initial),remote=structuredClone(initial);
  local.dayPlans['2026-09-24'].addedTaskIds=['local'];
  remote.dayPlans['2026-09-24'].addedTaskIds=['old','remote'];
  const merged=mergeSharedState(initial,local,remote);
  assert.deepEqual(merged.dayPlans['2026-09-24'].addedTaskIds,['local','remote']);
});

test('same daily task completed concurrently is stored and scored once',()=>{
  const initial=baseState(),local=structuredClone(initial),remote=structuredClone(initial);
  const make=(id,by)=>({id,taskId:'dishes',date:'2026-09-23',by,pointAwards:{[by]:30},taskSnapshot:{type:'daily',name:'Oppvask'}});
  local.completions=[make(1001,'Tore')];local.points.Tore=30;
  remote.completions=[make(1002,'Jannicke')];remote.points.Jannicke=30;
  const merged=mergeSharedState(initial,local,remote);
  assert.equal(merged.completions.length,1);
  assert.equal(merged.completions[0].id,1001);
  assert.deepEqual(merged.points,{Tore:30,Jannicke:0});
});

test('same acknowledgement does not duplicate after concurrent refresh',()=>{
  const initial=baseState();
  initial.completions=[{id:1,taskId:'dishes',date:'2026-09-23',by:'Jannicke',acknowledgements:[]}];
  const local=structuredClone(initial),remote=structuredClone(initial);
  local.completions[0].acknowledgements=[{id:'ack_local',by:'Tore',to:'Jannicke',at:'2026-09-23T12:00:00Z'}];
  remote.completions[0].acknowledgements=[{id:'ack_remote',by:'Tore',to:'Jannicke',at:'2026-09-23T12:00:01Z'}];
  const merged=mergeSharedState(initial,local,remote);
  assert.equal(merged.completions[0].acknowledgements.length,1);
  assert.equal(merged.completions[0].acknowledgements[0].id,'ack_local');
});
