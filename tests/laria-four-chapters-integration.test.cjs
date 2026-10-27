'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const norwegian=require('../laer-litt-mer/chapter-expansion-v1.js');
const math=require('../laer-litt-mer/math-pattern-haven-v1.js');
const english=require('../laer-litt-mer/english-sentence-harbor-v1.js');
const geography=require('../laer-litt-mer/geography-continent-voyage-v1.js');
const engines=[
 ['norwegian',norwegian.STORAGE_KEY],['math',math.KEY],
 ['english',english.KEY],['geography',geography.KEY]
];
function seed(){return {profile:{grade:2,avatar:'girl'},journey:{
 nodes:{'norwegian:2:lyder':{best:4},'math:2:plassverdi':{best:4},'english:2:words':{best:4},'geography:2:one':{best:4}},
 gradeWins:{'norwegian:2':{at:11},'math:2':{at:12},'english:2':{at:13},'geography:2':{at:14}},
 viewGrades:{math:2,english:2}}}}
test('four second adventures have independent and unpublished contracts',()=>{
 const ids=new Set(),keys=new Set();
 for(const [name,key] of engines){assert.ok(key.startsWith(name+':2:'));assert.ok(!keys.has(key));keys.add(key)}
 for(const c of [math.CHAPTER,english.CHAPTER,geography.CHAPTER]){
  assert.equal(c.grade,2);assert.equal(c.number,2);assert.equal(c.published,false);
  assert.equal(c.artApproved,false);assert.ok(!ids.has(c.id));ids.add(c.id);
 }
 assert.equal(norwegian.CHAPTERS.find(c=>c.id===norwegian.CHAPTER_ID).published,false);
 assert.equal(norwegian.STAGES.length,5);
 assert.equal(math.STAGES.length,5);assert.equal(english.STAGES.length,5);assert.equal(geography.STAGES.length,5);
});
test('unapproved chapter 2 preview flags are closed by default and require an explicit URL opt-in',()=>{
 const flags=[
  [norwegian,'chapter2-preview'],
  [math,'math-chapter2-preview'],
  [english,'english-chapter2-preview'],
  [geography,'geography-chapter2-preview']
 ];
 for(const [model,flag] of flags){
  assert.equal(model.previewEnabled('?app=laria'),false,flag+' must not appear in normal app');
  assert.equal(model.previewEnabled(''),false,flag+' must default to hidden');
  assert.equal(model.previewEnabled('?'+flag+'=0'),false,flag+'=0 must not enable the pilot');
  assert.equal(model.previewEnabled('?app=laria&'+flag+'=1'),true,flag+'=1 should remain QA accessible');
 }
});
test('each subject retains its own unfinished story, painted mirror, word tiles and compass after JSON reload',()=>{
 const s=seed(),oldNodes=JSON.stringify(s.journey.nodes),oldWins=JSON.stringify(s.journey.gradeWins);
 norwegian.start(s,'brevhytta',200);norwegian.answer(s,0,201);
 math.start(s,'speildammen');math.toggleMirror(s,0,2);
 const phrase=english.start(s,'setningsverkstedet');
 const tile=phrase.task.tiles.indexOf(phrase.task.goal[0]);english.selectTile(s,tile);
 const compass=geography.start(s,'kompassholmen');
 geography.answer(s,compass.task.answer);geography.advance(s,202);
 const keys=Object.keys(s.journey.chapterProgress).sort();
 assert.deepEqual(keys,engines.map(x=>x[1]).sort(),'all four records must coexist');
 assert.equal(JSON.stringify(s.journey.nodes),oldNodes);
 assert.equal(JSON.stringify(s.journey.gradeWins),oldWins);
 const saved=JSON.parse(JSON.stringify(s));
 assert.equal(norwegian.resume(saved).stage.id,'brevhytta');
 assert.equal(norwegian.resume(saved).index,1);
 assert.deepEqual(math.resume(saved).mirror,['0-2']);
 assert.deepEqual(english.resume(saved).selected,[tile]);
 assert.equal(geography.resume(saved).place.id,'kompassholmen');
 assert.equal(geography.resume(saved).step,1);
 assert.equal(geography.progress(saved).done,0);
 assert.equal(math.progress(saved).done,0);
 assert.equal(english.progress(saved).done,0);
 assert.equal(norwegian.progress(saved).done,0);
});
test('a damaged draft in one chapter cannot erase saved work in three other subjects',()=>{
 const s=seed();
 norwegian.start(s,'brevhytta');math.start(s,'speildammen');english.start(s,'setningsverkstedet');geography.start(s,'kompassholmen');
 const old=JSON.stringify(s.journey.gradeWins);
 s.journey.chapterProgress[math.KEY].draft.order[0]='not-an-id';
 assert.equal(math.resume(s),null);
 assert.ok(norwegian.resume(s));assert.ok(english.resume(s));assert.ok(geography.resume(s));
 assert.equal(JSON.stringify(s.journey.gradeWins),old);
});
test('the integrated app uses all four developer gates without a public chapter launcher',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
 for(const flag of ['chapter2-preview','math-chapter2-preview','english-chapter2-preview','geography-chapter2-preview'])
  assert.ok(html.includes(flag),'missing gated pilot '+flag);
 for(const file of ['chapter-expansion-v1','math-pattern-haven-v1','english-sentence-harbor-v1','geography-continent-voyage-v1'])
  assert.ok(html.includes('<script src="./'+file+'.js'),'unloaded module '+file);
 assert.match(html,/word-hunt\.js\?v=20261026-[a-z0-9-]+/);
 assert.match(html,/word-hunt\.css\?v=20261026-[a-z0-9-]+/);
 assert.match(html,/chapterProgress:\{\.\.\.\(parsed\.journey\?\.chapterProgress\|\|\{\}\)\}/);
});
