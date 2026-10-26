'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const app=n=>path.join(__dirname,'..','laer-litt-mer',n);
const js=fs.readFileSync(app('kinnaklova.js'),'utf8'),css=fs.readFileSync(app('kinnaklova.css'),'utf8'),html=fs.readFileSync(app('index.html'),'utf8');
test('English world mounted after learning bridge, isolated to English',()=>{
 assert.match(html,/kinnaklova\.js\?v=/);assert.match(html,/kinnaklova\.css\?v=/);
 assert.ok(html.indexOf('kinnaklova.js')>html.indexOf('LARIA_TALLVIKA_BRIDGE'));
 assert.match(js,/dataset\.subject==='english'/);assert.match(css,/#subject-screen\.kinnaklova-active/);
 assert.doesNotMatch(js,/localStorage\.setItem|journey\.nodes\s*=/);
 execFileSync(process.execPath,['--check',app('kinnaklova.js')]);
});
test('Three direct activities reuse existing English modules',()=>{
 for(const [id,module] of [['words','words'],['sentences','sentences'],['reading','reading']]){
   assert.match(js,new RegExp("id:'"+id+"'"));
   assert.match(js,new RegExp("module:'"+module+"'"));
 }
 assert.match(js,/startLearningSession\?\.\('english',item\.module,item\.title\)/);
 assert.match(js,/resumeSession\?\.\('english'\)/);
 assert.match(js,/locked-journey-subject-english/);
});
test('English remains independent of Math, Norsk, Geography, and chapter-two preview',()=>{
 assert.match(js,/LARIA_KINNAKLOVA/);
 assert.doesNotMatch(js,/LARIA_ENGLISH_SENTENCE_HARBOR_UI\.open/);
 assert.doesNotMatch(js,/setJourneyViewGrade\?\.\('english'/);
 assert.doesNotMatch(js,/assets\/gangemagi-troll/);
 assert.match(css,/@media\(max-width:700px\)/);
});
