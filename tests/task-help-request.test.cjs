const test=require('node:test');
const assert=require('node:assert/strict');
const loop=require('../daily-loop.js');

const task={id:'bedtime',name:'Legging av barn',owner:'Begge',type:'daily',kind:'house',pts:30};
const base=()=>({user:'Tore',tasks:[task],taskHelpRequests:[],taskClaims:[],completions:[],points:{Tore:0,Jannicke:0}});

test('one pending help request per task occurrence',()=>{
  let state=loop.requestTaskHelp(base(),{task,date:'2026-09-14',user:'Tore',target:'Jannicke',now:1000});
  state=loop.requestTaskHelp(state,{task,date:'2026-09-14',user:'Tore',target:'Jannicke',now:2000});
  assert.equal(state.taskHelpRequests.length,1);
  assert.equal(loop.activeHelpRequest(state,task.id,'2026-09-14').requestedTo,'Jannicke');
});

test('accepting creates the existing shared claim without points',()=>{
  let state=loop.requestTaskHelp(base(),{task,date:'2026-09-14',user:'Tore',target:'Jannicke',now:1000});
  const request=state.taskHelpRequests[0],points={...state.points};
  state=loop.respondTaskHelp(state,{requestId:request.id,user:'Jannicke',accepted:true,task,now:2000});
  assert.equal(state.taskHelpRequests[0].status,'accepted');
  assert.equal(loop.activeClaim(state,task.id,'2026-09-14').claimedBy,'Jannicke');
  assert.deepEqual(state.points,points);
});

test('not now leaves the task and points unchanged',()=>{
  let state=loop.requestTaskHelp(base(),{task,date:'2026-09-14',user:'Tore',target:'Jannicke',now:1000});
  const request=state.taskHelpRequests[0];
  state=loop.respondTaskHelp(state,{requestId:request.id,user:'Jannicke',accepted:false,task,now:2000});
  assert.equal(state.taskHelpRequests[0].status,'not_now');
  assert.equal(loop.activeClaim(state,task.id,'2026-09-14'),null);
  assert.deepEqual(state.points,{Tore:0,Jannicke:0});
});

test('completion or removal closes a pending request',()=>{
  let state=loop.requestTaskHelp(base(),{task,date:'2026-09-14',user:'Tore',target:'Jannicke',now:1000});
  state=loop.closeTaskHelpRequests(state,{taskId:task.id,date:'2026-09-14',reason:'completed',user:'Tore',now:2000});
  assert.equal(loop.activeHelpRequest(state,task.id,'2026-09-14'),null);
  assert.equal(state.taskHelpRequests[0].closedReason,'completed');
});

test('old pending requests expire on the next date',()=>{
  let state=loop.requestTaskHelp(base(),{task,date:'2026-09-14',user:'Tore',target:'Jannicke',now:1000});
  state=loop.closeExpiredTaskHelpRequests(state,'2026-09-15',2000);
  assert.equal(loop.activeHelpRequest(state,task.id,'2026-09-14'),null);
  assert.equal(state.taskHelpRequests[0].closedReason,'expired');
});


test('optional warm message is stored with an 80 character limit',()=>{
  const state=loop.requestTaskHelp(base(),{task,date:'2026-09-15',user:'Tore',target:'Jannicke',message:'Jeg er litt tom i dag ❤️',now:1000});
  assert.equal(state.taskHelpRequests[0].message,'Jeg er litt tom i dag ❤️');
  const clipped=loop.requestTaskHelp(base(),{task,date:'2026-09-15',user:'Tore',target:'Jannicke',message:'x'.repeat(90),now:1000});
  assert.equal(clipped.taskHelpRequests[0].message.length,80);
});

test('not now temporarily prevents another request for the same task',()=>{
  let state=loop.requestTaskHelp(base(),{task,date:'2026-09-15',user:'Tore',target:'Jannicke',now:1000});
  state=loop.respondTaskHelp(state,{requestId:state.taskHelpRequests[0].id,user:'Jannicke',accepted:false,task,now:2000});
  const blocked=loop.requestTaskHelp(state,{task,date:'2026-09-15',user:'Tore',target:'Jannicke',now:3000});
  assert.equal(blocked.taskHelpRequests.length,1);
  const retry=loop.requestTaskHelp(state,{task,date:'2026-09-15',user:'Tore',target:'Jannicke',now:4*60*60*1000+2001});
  assert.equal(retry.taskHelpRequests.length,2);
});
