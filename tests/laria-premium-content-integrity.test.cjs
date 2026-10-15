'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../laer-litt-mer');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scene=fs.readFileSync(path.join(root,'laria-task-scene-v15.js'),'utf8');
function extract(source,name){
 const start=source.indexOf('function '+name+'(');
 assert(start>=0,'Missing function '+name);
 const tail=source.slice(start),end=tail.indexOf('\nfunction ',1),indented=tail.indexOf('\n  function ',1);
 const limits=[end,indented].filter(n=>n>0);
 return tail.slice(0,Math.min(...limits));
}
test('The saved plural spelling task shows two existing apples without changing identity',()=>{
 const c={text:String,attr:String};vm.createContext(c);
 for(const fn of ['premiumIllustrationSvg','taskVisualMarkup'])vm.runInContext(extract(scene,fn),c);
 vm.runInContext(extract(html,'questionIdentity'),c);
 const q={subject:'norwegian',type:'build-word',skill:'letter-sound',prompt:'Bygg ordet',answer:'EPLER',visual:'\u{1F34E}'};
 const before=JSON.stringify(q),key=c.questionIdentity(q),markup=c.taskVisualMarkup(q);
 assert.equal((markup.match(/data-task-object="apple"/g)||[]).length,2);
 const original=c.premiumIllustrationSvg(q.visual).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 assert.equal(markup.split(original).length-1,2,'Both objects use the exact existing artwork');
 assert.equal(c.questionIdentity(q),key);assert.equal(JSON.stringify(q),before);
 for(const other of [{...q,answer:'EPLE'},{...q,subject:'english',answer:'apple'}]){
  const single=c.taskVisualMarkup(other);
  assert.equal(single.split(original).length-1,1,'Singular questions still show one apple');
 }
});
function completion({practice=false,preview=false,correct=4,strengthened=1,milestoneAt=900,reward=false,gradeWin=false}={}){
 const nodes=new Map(),copy=id=>nodes.get(id)?.textContent||'';
 const c={
  document:{getElementById(id){if(!nodes.has(id))nodes.set(id,{textContent:'',style:{}});return nodes.get(id)}},
  Date:{now:()=>2000},sessionScope:{type:'journey',subject:'norwegian',label:'Bokstavporten',practiceOnly:practice,previewOnly:preview},
  sessionQuestions:Array.from({length:5},(_,i)=>({answer:String(i)})),sessionCorrect:correct,sessionStrengthened:new Set(Array.from({length:strengthened},(_,i)=>i)),
  state:{activeSession:{startedAt:1000},answerLog:[],sessionLog:[],collectibles:{owned:['previous']},lastMilestone:{at:milestoneAt,title:'Gammel eller aktuell seier',copy:'Original copy'}},
  GRADE_CONFIG:{2:{label:'2. klasse'}},SUBJECTS:{norwegian:{title:'Norsk'}},currentGrade:()=>2,
  sessionActivityKey:()=> 'norwegian:letters',dayKeyOffset:()=> 'today',localDay:()=> 'today',
  recordJourneySessionResult(r){if(reward)r.journeyReward={label:'Gullbladet',areaTitle:'Bokstavporten',emoji:'*'};if(gradeWin)r.gradeCompleted={grade:2}},
  window:{LARIA_COLLECTION_CORE:{reconcile(collection){return {collection}}}},
  saveState(){},renderAll(){},showScreen(name){c.opened=name}
 };
 vm.createContext(c);
 for(const fn of ['nextTeaserForScope','finishSession'])vm.runInContext(extract(html,fn),c);
 c.finishSession();return {c,copy,nodes};
}
test('Completion never claims a milestone from an earlier or future round',()=>{
 for(const at of [900,2100]){
  const {c,copy}=completion({milestoneAt:at});
  assert.equal(copy('young-reward-title'),'Oppdrag fullf\u00f8rt!');
  assert.equal(copy('complete-copy'),'Du jobbet deg gjennom 5 oppgaver.');
  assert.equal(c.state.lastMilestone.at,at,'Saved history is untouched');
  assert.equal(c.state.collectibles.owned[0],'previous');
 }
 assert.equal(completion({milestoneAt:1500}).copy('young-reward-title'),'Gammel eller aktuell seier');
 assert.equal(completion({milestoneAt:1500,strengthened:0}).copy('young-reward-title'),'Oppdrag fullf\u00f8rt!');
});
test('Repeat completion is warm and factual, without new learning credit or repeated rewards',()=>{
 const {c,copy}=completion({practice:true,correct:5,milestoneAt:1500});
 assert.equal(copy('complete-copy'),'Du har \u00f8vd p\u00e5 5 oppgaver igjen.');
 assert.equal(copy('young-reward-title'),'Godt \u00f8vd!');
 assert.equal(c.state.sessionLog[0].countsTowardGoal,false);
 assert.equal(c.state.sessionLog[0].strengthened,0);
 c.finishSession();c.finishSession();assert.equal(c.state.sessionLog.length,1);
});
test('Only recorded journey rewards and completions are named; replay remains available',()=>{
 const won=completion({reward:true});
 assert.match(won.copy('complete-copy'),/Bokstavporten.*Gullbladet/);
 assert.equal(won.copy('young-reward-title'),'Du fikk Gullbladet!');
 const done=completion({gradeWin:true});
 assert.match(done.copy('complete-copy'),/2\. klasse/);
 assert.match(done.copy('young-reward-copy'),/favorittstedene/);
 for(const state of [won,done,completion({preview:true}),completion({correct:5}),completion({correct:0})]){
  const all=[...state.nodes.values()].map(e=>e.textContent).join(' ');
  assert.doesNotMatch(all,/kunstig|checkpoint|progresjon|beat your|neste verden er|appens|vet appen/i);
  assert.equal(state.nodes.get('complete-repeat').style.display,'block');
 }
});

test('Young multiplication keeps all five or ten counted groups in the compact picture',()=>{
 const css=fs.readFileSync(path.join(root,'multiplication-premium-parity-v4.css'),'utf8');
 assert.match(css,/data-mp3-groups="5"[\s\S]*grid-template-columns:repeat\(5/);
 assert.match(css,/data-mp3-groups="10"[\s\S]*grid-template-columns:repeat\(5/);
 assert.match(css,/data-mp3-groups="10"[\s\S]*max-width:11px!important/);
 assert.match(css,/grid-column:auto!important/);
 const app=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(app,/multiplication-premium-parity-v4\.css\?v=20261015-full-count1/);
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.match(sw.split('\n')[0],/mult-full-count1/);
});
