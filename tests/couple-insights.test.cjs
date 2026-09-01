const assert=require('node:assert/strict');
const insights=require('../couple-insights.js');

const now=new Date('2026-09-01T18:00:00');
const at=value=>new Date(value).getTime();
const state={
  user:'Tore',
  tasks:[
    {id:'dish',name:'Tømme oppvaskmaskin',kind:'house',type:'daily',preferredDays:[2],pts:20},
    {id:'laundry',name:'Vaske klær',kind:'house',type:'flex',freq:2,pts:45}
  ],
  completions:[{id:1,taskId:'dish',kind:'house',date:'2026-09-01',by:'Tore'}],
  seenRequests:[
    {id:'support',kind:'support',source:'nudge',taskId:'laundry',taskName:'Vaske klær',by:'Jannicke',createdAt:at('2026-09-01T08:00:00'),acceptedAt:'2026-09-01T08:30:00',done:true,doneAt:'2026-09-01T09:30:00',appreciationText:'Takk ❤️',appreciationAt:'2026-09-01T10:00:00'},
    {id:'initiative',kind:'initiative',source:'initiative',taskId:'dish',taskName:'Tømme oppvaskmaskin',by:'Tore',createdAt:at('2026-09-01T11:00:00'),acceptedAt:'2026-09-01T11:00:00',done:true,doneAt:'2026-09-01T11:20:00',seenBy:'Jannicke'}
  ],
  coupleInvitations:[
    {id:'invite',by:'Tore',createdAt:at('2026-09-01T12:00:00'),response:{kind:'yes',by:'Jannicke',createdAt:at('2026-09-01T12:15:00')}}
  ]
};

const mirror=insights.weeklyMirror(state,now);
assert.equal(mirror.start,'2026-08-31');
assert.equal(mirror.chores,1);
assert.equal(mirror.asked,1);
assert.equal(mirror.answered,1);
assert.equal(mirror.completed,2);
assert.equal(mirror.initiativeStarted,1);
assert.equal(mirror.initiativeCompleted,1);
assert.equal(mirror.thanks,1);
assert.equal(mirror.invitationsSent,1);
assert.equal(mirror.invitationsAnswered,1);
assert.equal(mirror.invitationsAccepted,1);
assert.equal(mirror.sharedMoments,3);

const mirrorAfterPointsAreSpent=insights.weeklyMirror({...state,points:{Jannicke:900,Tore:0},rewardRedemptions:[{claimedBy:'Tore',cost:420}]},now);
assert.deepEqual(mirrorAfterPointsAreSpent,mirror);

const first=insights.firstSharedWin(state);
assert.equal(first.stage,'completed');
assert.equal(first.taskName,'Vaske klær');
assert.equal(first.thanked,true);

const withoutCompletions={...state,completions:[],seenRequests:[],coupleInvitations:[]};
assert.equal(insights.firstSharedWin(withoutCompletions).stage,'ready');
assert.equal(insights.firstWinTask(withoutCompletions,now).id,'dish');

const awaiting={...withoutCompletions,seenRequests:[{id:'first',source:'initiative',kind:'initiative',taskId:'dish',taskName:'Tømme oppvaskmaskin',by:'Tore',done:true,doneAt:'2026-09-01T13:00:00'}]};
assert.equal(insights.firstSharedWin(awaiting).stage,'awaiting');
awaiting.seenRequests[0].completionSeenBy=['Jannicke'];
assert.equal(insights.firstSharedWin(awaiting).stage,'completed');

console.log('ok - weekly mirror measures the full interaction loop and first shared win');
