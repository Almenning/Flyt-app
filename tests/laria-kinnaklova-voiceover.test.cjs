'use strict';
/* Kinnaklova's bilingual answers need correct inherited VoiceOver language.
   Exercise the real question model and the actual task-rendering expressions. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..','laer-litt-mer');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scene=fs.readFileSync(path.join(root,'laria-task-scene-v15.js'),'utf8');
function sourceBetween(source,start,end){
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Missing live source: '+start);
 return source.slice(i,j);
}
const englishPool=new Function('choiceQuestion','makeEnglishBuild','shuffle','CURRICULUM',
 sourceBetween(html,'function englishPool(','\nfunction makeEnglishBuild(')+'\nreturn englishPool;'
)(
 (subject,skill,prompt,answer,options,extra={})=>
   ({subject,skill,type:'learning-choice',prompt,answer,options,...extra}),
 (answer,visual)=>({subject:'english',skill:'spelling',type:'build-word',
   prompt:'Build the word',answer,visual}),
 values=>values,{english:null}
);
const renderPrompt=new Function('prompt','q','directKinnaklova','readingStory',
 'passage','visualWithFox','inlineFox','fox','text',
 sourceBetween(scene,'    const norwegianPrompt=','\n    wrap.innerHTML=')+
 '\nreturn {promptLanguage,answerLanguage,questionScene};'
);
const render=(question,direct=true,reading=false)=>renderPrompt(
 question.prompt,question,direct,reading,
 reading?'<section class="learning-passage ki-reading-story" lang="en">Story</section>':'',
 '',false,'',String
);

test('Kinnaklova question and answer language follow actual translation direction',()=>{
 const norwegianPrompt={prompt:'Hva heter «hav» på engelsk?'};
 const coast=render(norwegianPrompt);
 assert.equal(coast.promptLanguage,'nb');
 assert.equal(coast.answerLanguage,'en');
 assert.match(coast.questionScene,/class="question" lang="nb"/);

 const reversed=render({prompt:'Hva betyr “two” på norsk?'});
 assert.equal(reversed.promptLanguage,'nb');
 assert.equal(reversed.answerLanguage,'nb');

 const english=render({prompt:'What colour is the boat?'});
 assert.equal(english.promptLanguage,'en');
 assert.equal(english.answerLanguage,'en');
 assert.match(english.questionScene,/class="question" lang="en"/);

 const older=render(norwegianPrompt,false);
 assert.equal(older.promptLanguage,'');
 assert.equal(older.answerLanguage,'');
 assert.doesNotMatch(older.questionScene,/lang=/);

 const reading=render({prompt:'Where is the boat?',skill:'reading'},true,true);
 assert.equal(reading.answerLanguage,'en');
 assert.ok(reading.questionScene.indexOf('ki-reading-story')<
   reading.questionScene.indexOf('ki-reading-question'),'Story should precede question');
 assert.match(reading.questionScene,/class="question ki-reading-question" lang="en"/);
});

test('Norwegian vocabulary choices carry explicit source-language metadata',()=>{
 const grade3=englishPool(3,'words');
 const translations3=grade3.filter(q=>q.skill==='vocabulary');
 assert.equal(translations3.length,5);
 assert.ok(translations3.every(q=>q.answerLanguage==='nb'));
 for(const q of translations3)
   assert.equal(render(q).answerLanguage,'nb',q.answer+' should be spoken in Norwegian');

 const grade5=englishPool(5,'words').filter(q=>q.skill==='vocabulary');
 assert.equal(grade5.length,5);
 assert.deepEqual(grade5.map(q=>q.answerLanguage),['en','nb','nb','nb','nb']);
 for(const q of grade5)
   assert.equal(render(q).answerLanguage,q.answerLanguage);

 const grade8=englishPool(8,'words').filter(q=>q.skill==='vocabulary');
 assert.equal(grade8.length,5);
 assert.ok(grade8.every(q=>!q.answerLanguage));
 assert.ok(grade8.every(q=>render(q).answerLanguage==='en'));
});

test('VoiceOver language is inherited by the actual answer and word-bank controls',()=>{
 assert.match(scene,/class="task-interaction"'\+\(directKinnaklova\?' lang="'\+answerLanguage\+'"'\:''\)/);
 assert.match(scene,/class="word-bank"/);
 assert.match(scene,/class="letter-bank"/);
 assert.match(scene,/class="answers"/);
 assert.match(scene,/const promptLanguage=directKinnaklova/);
});
