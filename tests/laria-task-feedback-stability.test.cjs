'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const commercialSource=read('laer-litt-mer/commercial-content-v18.js');
const html=read('laer-litt-mer/index.html');
const sceneJs=read('laer-litt-mer/laria-task-scene-v15.js');
const style=read('laer-litt-mer/laria-task-feedback-stable-v1.css');

function bank(){
  const ctx={window:{}};
  vm.runInNewContext(commercialSource,ctx,{timeout:3000});
  return ctx.window.LARIA_COMMERCIAL_CONTENT_V18.english(2,'words');
}
function baseEnglishQuestions(){
  const start=html.indexOf('function englishPool(grade,module){');
  const end=html.indexOf('\nfunction makeEnglishBuild(',start);
  assert(start>=0&&end>start,'original English pool unavailable');
  const ctx={
    CURRICULUM:{english:'ENG01-06'},
    choiceQuestion:(subject,skill,prompt,answer,options,extra={})=>
      ({subject,skill,prompt,answer,options, ...extra}),
    makeEnglishBuild:(answer,visual)=>({subject:'english',skill:'spelling',type:'build-word',answer,visual}),
    shuffle:array=>array
  };
  vm.runInNewContext(html.slice(start,end)+'\nthis.getEnglishQuestions=englishPool;',ctx,{timeout:3000});
  return ctx.getEnglishQuestions(2,'words');
}
function assertChoice(q,label){
  assert(q,label+' question not present');
  assert.equal(q.options.filter(option=>String(option)===String(q.answer)).length,1,label+' no unique correct answer');
  assert(q.englishWord&&q.norwegianMeaning,label+' target language metadata missing');
}

test('Grade 1-2 English supplement: four, seven and two are unambiguous',()=>{
  const b=bank();
  const four=b.find(q=>q.norwegianMeaning==='fire');
  const seven=b.find(q=>q.englishWord==='seven');
  const two=b.find(q=>q.englishWord==='two');
  for(const [q,label] of [[four,'four'],[seven,'seven'],[two,'two']])assertChoice(q,label);
  assert.equal(four.answer,'four');
  assert.match(four.prompt,/tallet fire på engelsk/i);
  assert.equal(seven.answer,'sju');
  assert.match(seven.prompt,/på norsk/i);
  assert.equal(two.answer,'to');
  assert(b.every(q=>q.options?.includes(String(q.answer))), 'unanswerable English question in commercial word bank');
});
test('Main English bank explicitly asks for the NUMBER three',()=>{
  const numbers=baseEnglishQuestions().filter(q=>q.skill==='numbers');
  const three=numbers.find(q=>q.englishWord==='three');
  assertChoice(three,'three');
  assert.match(three.prompt,/tallet tre på engelsk/i);
  assert.equal(three.answer,'three');
  assert(numbers.every(q=>q.options?.includes(String(q.answer))), 'unanswerable main English number question');
});
test('New task card is anchored and scrolls instead of re-centering on feedback',()=>{
  assert.match(style,/grid-template-rows:max-content max-content!important/);
  assert.match(style,/align-self:start!important/);
  assert.match(style,/overflow-y:auto!important/);
  assert.match(style,/max-height:100dvh!important/);
  assert.match(html,/laria-task-feedback-stable-v1\.css/);
  assert.match(sceneJs,/scrollHost\.scrollTop=0/);
  assert.match(sceneJs,/normalizeLegacyYoungEnglish\(q\)/);
});
test('Fox presence remains separate from the single Norwegian answer guide',()=>{
  assert(!sceneJs.includes('    bindFoxReaction(wrap);'),'duplicate legacy fox reaction listener was reintroduced');
  assert(sceneJs.includes('LARIA_FOX_PRESENCE'),'other subjects must retain established fox presence');
  assert.match(sceneJs,/if\(subject==='norwegian'\)\s*\{\s*bindNorskGuideReaction\(wrap\.querySelector\('\.task-interaction'\)\);/,
    'Norsk reaction must bind to each new answer interaction');
  assert(sceneJs.includes('let celebrated=false'),'each new Norwegian question must suppress repeated celebrations');
  assert(sceneJs.includes('currentAnswered?.correct===true'),'Norsk guide must celebrate only a genuinely correct answer');
  assert(sceneJs.includes('bindNorskHint(wrap,q)'),'Norsk hints must be connected to real question events');
  assert(sceneJs.includes("aria-controls=\"task-norsk-hint\""),'Norsk hint must be an accessible button');
  assert(sceneJs.includes("step=step===2?0:step+1"),'Norsk hint must close without affecting progress');
  assert.match(sceneJs,/task-hear-word/,'English pronunciation must be preserved');
  assert(!html.includes("textContent=correct?(currentGrade()<=2?'🦊 ⭐ Riktig!'"),'feedback emoji portrait leaked back');
});
test('Norwegian instructions and English pronunciation use separate voices',()=>{
  const start=html.indexOf('function canSpeak(){');
  const end=html.indexOf('function renderQuestion(){',start);
  assert(start>=0&&end>start,'speech helpers missing');
  const spoken=[];
  const ctx={
    window:{speechSynthesis:{cancel(){},speak(utterance){spoken.push({text:utterance.text,lang:utterance.lang})}}},
    SpeechSynthesisUtterance:class{constructor(text){this.text=text}},
    currentGrade:()=>2,
    document:{getElementById:()=>null},
    sessionQuestions:[],qIndex:0,
    setTimeout
  };
  vm.runInNewContext(html.slice(start,end),ctx,{timeout:3000});
  const q={subject:'english',prompt:'Hva betyr “seven” på norsk?',answer:'sju',
    options:['sju','tre','ti'],englishWord:'seven',norwegianMeaning:'sju'};
  const segments=ctx.speechSegmentsForQuestion(q);
  assert.deepEqual(Array.from(segments,x=>x.lang),['nb-NO','en-GB','nb-NO','nb-NO','nb-NO']);
  assert.equal(segments[1].text,'seven');
  assert.equal(segments.at(-1).text,'sju, tre, ti');
  assert.equal(ctx.englishPronunciationTarget(q),'seven');
  const four={subject:'english',prompt:'Hva heter tallet fire på engelsk?',answer:'four',
    options:['four','five','three'],englishWord:'four',norwegianMeaning:'fire'};
  assert.equal(ctx.speechSegmentsForQuestion(four)[0].lang,'nb-NO');
  assert.equal(ctx.speechSegmentsForQuestion(four).at(-1).lang,'en-GB');
  ctx.speakEnglishWord('four');
  assert.equal(spoken.at(-1).lang,'en-GB');
  assert.equal(spoken.at(-1).text,'four');
  assert.equal(ctx.englishPronunciationTarget({subject:'english',prompt:'Hva heter dette på engelsk?',answer:'apple'}),'apple');
});
