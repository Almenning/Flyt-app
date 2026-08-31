const assert=require('node:assert/strict');
const core=require('../couple-core.js');

const state={user:'Tore'};
const laundry={id:'laundry',name:'Vaske/brette klær'};
const dishes={id:'dishes',name:'Tømme oppvaskmaskinen'};

const request=core.makeSupportRequest({state,task:laundry,text:'Kan du ta klesvasken?',now:1000});
assert.equal(core.requestState(request),'pending');
assert.equal(core.canWithdrawRequest(request,'Tore'),true);

const countered=core.counterRequest(request,'Jannicke',dishes,'Jeg kan ta denne i stedet',2000);
assert.equal(core.requestState(countered),'countered');
assert.equal(core.canWithdrawRequest(countered,'Tore'),false,'a counteroffer must not disappear silently');
assert.deepEqual(countered.responseSeenBy,['Jannicke'],'the responder has seen their own response while the sender still needs an update');

const accepted=core.acceptCounter(countered,'Tore',3000);
assert.equal(core.requestState(accepted),'accepted');
assert.equal(accepted.taskId,'dishes');
assert.equal(accepted.acceptedBy,'Jannicke');
assert.deepEqual(accepted.decisionSeenBy,['Tore'],'the counter decision must remain unread for the partner');

const completed=core.completeRequest(accepted,'Jannicke',4000);
assert.equal(core.requestState(completed),'completed');
assert.equal(core.canThank(completed,'Tore'),true);
assert.deepEqual(completed.completionSeenBy,['Jannicke'],'completion must remain unread for the person who requested help');

const updatesSeen=core.markRequestUpdatesSeen(completed,'Tore');
assert.ok(updatesSeen.responseSeenBy.includes('Tore'));
assert.ok(updatesSeen.decisionSeenBy.includes('Tore'));
assert.ok(updatesSeen.completionSeenBy.includes('Tore'));

const thanked=core.addThanks(completed,'Tore','Takk, det hjalp ❤️',5000);
assert.equal(thanked.appreciationText,'Takk, det hjalp ❤️');
assert.equal(core.canThank(thanked,'Tore'),false,'one completion gets one deliberate thank-you');

const initiative=core.makeInitiative({state,task:laundry,partnerName:'Jannicke',now:6000});
assert.equal(core.requestState(initiative),'accepted');
assert.equal(core.canWithdrawRequest(initiative,'Tore'),false,'a visible initiative is a commitment, not a silent draft');
const initiativeDone=core.completeRequest(initiative,'Tore',7000);
assert.equal(core.canThank(initiativeDone,'Jannicke'),true,'the partner can thank an initiative after completion');

const invitation=core.makeInvitation({state,text:'Sofa og noe godt i kveld?',now:8000});
assert.equal(core.invitationState(invitation),'pending');
const alternative=core.respondInvitation(invitation,'Jannicke','counter','En liten tur i stedet?',9000);
assert.equal(core.invitationState(alternative),'countered');
const agreed=core.acceptInvitationCounter(alternative,'Tore',10000);
assert.equal(core.invitationState(agreed),'accepted');
assert.equal(agreed.finalResponse.text,'En liten tur i stedet?');

const declined=core.respondInvitation(invitation,'Jannicke','no','',11000);
assert.equal(core.invitationState(declined),'declined');
assert.equal(core.invitationActive(declined),false,'declined invitations must not keep nudging');

console.log('ok - practical couple communication lifecycle');
