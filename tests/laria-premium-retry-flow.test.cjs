'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
function source(name){
 const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+1);
 assert(start>=0&&end>start,'Missing function '+name);
 return html.slice(start,end);
}
function harness(question,grade=2){
 const element=()=>({style:{},textContent:'',classList:{toggle(){},add(){},remove(){}},setAttribute(){}});
 const elements=new Map(),buttons=question.options.map(answer=>({...element(),dataset:{answer},disabled:false}));
 const ctx={
  document:{querySelectorAll:()=>buttons,getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)}},
  sessionQuestions:[structuredClone(question)],qIndex:0,currentAnswered:null,sessionCorrect:0,sessionStrengthened:new Set(),
  sessionScope:{subject:question.subject,grade},state:{answerLog:[],activeSession:{startedAt:1}},
  countries:{dk:{name:'Danmark',capital:'Copenhagen',continent:'Europa'}},
  currentGrade:()=>grade,isPracticeRepeat:q=>!!q.practiceRepeat,
  bumpSkill:()=>({grade,newlyMastered:false,strengthened:false,after:'learning'}),
  bump:()=>({newlyMastered:false,strengthened:false,after:'learning'}),
  masteryKey:(country,type)=>country+':'+type,countryStatus:()=> 'learning',
  questionIdentity:q=>[q.subject,q.k,q.type,q.skill,q.prompt,q.answer].join('|'),
  celebrateCorrect(){},updateAnswerPronunciation(){},showScreen(){},renderQuestion(){},
  persistActiveSession(){ctx.state.activeSession={questions:JSON.parse(JSON.stringify(ctx.sessionQuestions)),answered:ctx.currentAnswered&&JSON.parse(JSON.stringify(ctx.currentAnswered))}},
  elements,buttons
 };
 ctx.state.mistakes={};
 vm.createContext(ctx);
 for(const name of ['recordLearningAnswer','recordAnswer','learningFeedbackText','rememberWrongAttempt','applyChoiceAnswerState','answerLearningChoice','showLearningFeedback','repeatCompletedSession','answerText'])vm.runInContext(source(name),ctx);
 return ctx;
}
const math={subject:'math',type:'learning-choice',skill:'place-value',prompt:'Hva er verdien til 2 i tallet 27?',answer:'20',options:['70','20','2','7']};
for(const subject of ['math','english','norwegian','geography']){
 test(subject+': wrong, duplicate, correction, saved state and clean replay',()=>{
  const q=subject==='geography'?{k:'dk',type:'flag',prompt:'Hvilket land har dette flagget?',answer:'Danmark',options:['Sverige','Danmark','Finland']}:
   {...math,subject,...(subject==='math'?{}:{answer:'A',options:['B','A','C']})};
  const c=harness(q),originalKey=c.questionIdentity(c.sessionQuestions[0]);
  const answer=subject==='geography'?c.answerText:c.answerLearningChoice;
  answer(q.options[0]);answer(q.options[0]);
  assert.equal(c.state.answerLog.length,1,'only one assessment for repeated wrong tap');
  assert.equal(c.currentAnswered,null,'retry remains open');
  assert.equal(c.buttons[0].disabled,true);
  assert.equal(c.elements.get('next-question').style.display,'none');
  c.sessionQuestions=JSON.parse(JSON.stringify(c.state.activeSession.questions));
  c.buttons.forEach(b=>b.disabled=false);c.applyChoiceAnswerState(c.sessionQuestions[0],null);
  assert.equal(c.buttons[0].disabled,true,'rejected choice survives resume');
  answer(q.answer);answer(q.answer);
  assert.equal(c.state.answerLog.length,1);assert.equal(c.sessionCorrect,0);
  assert.equal(c.currentAnswered.correct,false);assert.equal(c.currentAnswered.corrected,true);
  assert.equal(c.questionIdentity(c.sessionQuestions[0]),originalKey);
  c.lastCompletedQuestions=JSON.parse(JSON.stringify(c.sessionQuestions));
  c.lastCompletedScope={...c.sessionScope};
  c.repeatCompletedSession();
  assert.equal(c.sessionQuestions[0]._youngFirstAttemptWrong,undefined);
  assert.equal(c.sessionQuestions[0]._youngWrongAnswers,undefined);
  answer(q.answer);
  assert.equal(c.currentAnswered.correct,true,'a fresh correct answer is not an old correction');
  assert.equal(c.currentAnswered.corrected,undefined);
  assert.equal(c.sessionCorrect,1);assert.equal(c.state.answerLog.length,2);
  assert.equal(c.state.answerLog.at(-1).countsForLearning,false,'replay does not inflate mastery');
  assert.equal(c.questionIdentity(c.sessionQuestions[0]),originalKey);
  assert.equal(c.lastCompletedQuestions[0]._youngFirstAttemptWrong,true,'copy does not mutate completed history');
 });
}
test('Math retry explains the current place value instead of a later task',()=>{
 const c=harness(math);c.answerLearningChoice('2');
 const copy=c.elements.get('feedback-copy').textContent;
 assert.match(copy,/tierplassen/);assert.match(copy,/10/);assert.doesNotMatch(copy,/neste oppgave|senere/);
});
test('Older geography retains its single assessed answer',()=>{
 const q={k:'dk',type:'flag',prompt:'Flagg?',answer:'Danmark',options:['Sverige','Danmark']};
 const c=harness(q,3);let rendered=0;c.applyAnsweredState=()=>rendered++;
 c.answerText('Sverige');c.answerText('Danmark');
 assert.equal(c.state.answerLog.length,1);assert.equal(c.currentAnswered.correct,false);assert.equal(rendered,1);
});
test('Pending automatic reading respects explicit cancellation and screen navigation',()=>{
 let queued,speaks=0,active=true;
 const q={subject:'math',prompt:'1 + 2 = ?'};
 const c={state:{preferences:{autoRead:true}},currentGrade:()=>2,canSpeak:()=>true,
  sessionQuestions:[q],qIndex:0,lariaSpeechRun:0,speakQuestion:()=>speaks++,
  document:{getElementById:id=>id==='session-screen'?{classList:{contains:()=>active}}:null},
  setTimeout:fn=>{queued=fn}};
 vm.createContext(c);vm.runInContext(source('bindReadAloud'),c);
 c.bindReadAloud(q);active=false;queued();assert.equal(speaks,0);
 active=true;c.bindReadAloud(q);c.lariaSpeechRun++;queued();assert.equal(speaks,0);
 c.bindReadAloud(q);queued();assert.equal(speaks,1);
});
