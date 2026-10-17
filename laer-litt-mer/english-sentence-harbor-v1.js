/* Læria: English chapter 2, Setningshavna. Authored early-language adventure.
 * DEVELOPMENT ONLY: no map artwork approved, no live entry, no grade-completion changes.
 * Children may replay familiar English phrases without being forced onward.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LARIA_ENGLISH_SENTENCE_HARBOR=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const CHAPTER=Object.freeze({id:'setningshavna-2',subject:'english',grade:2,number:2,
   title:'Setningshavna',published:false,artApproved:false});
 const KEY='english:2:setningshavna-2';
 const STAGES=Object.freeze([
   {id:'hilsenkaia',title:'Hilsenkaia',focus:'Hils, presenter deg og si ha det',symbol:'☀'},
   {id:'ordbrygga',title:'Ordbrygga',focus:'Finn mening i små engelske handlinger',symbol:'⚓'},
   {id:'setningsverkstedet',title:'Setningsverkstedet',focus:'Trykk på ord og bygg en hel setning',symbol:'✎'},
   {id:'samtalebaten',title:'Samtalebåten',focus:'Svar i en liten engelsk samtale',symbol:'◈'},
   {id:'historiefyret',title:'Historiefyret',focus:'Forstå korte historier og uttrykk',symbol:'✦'}
 ].map(s=>Object.freeze(s)));
 const makeChoice=(id,prompt,english,options,answer,hint)=>Object.freeze({
   id,kind:'choice',prompt,english,options:Object.freeze(options),answer,hint
 });
 const story=(id,passage,prompt,options,answer,hint)=>Object.freeze({
   id,kind:'story',english:passage,prompt,options:Object.freeze(options),answer,hint
 });
 const sentence=(id,prompt,tiles,goal,hint)=>Object.freeze({
   id,kind:'sentence',prompt,english:goal.join(' '),tiles:Object.freeze(tiles),
   goal:Object.freeze(goal),hint
 });
 const TASKS=Object.freeze({
   hilsenkaia:Object.freeze([
     makeChoice('hello','Du møter en ny venn. Hva kan du si?','Hello!',['Hello!','Goodbye!','Good night!'],'Hello!','Hello betyr hei.'),
     makeChoice('how-are-you','Noen spør «How are you?». Hva passer som svar?','How are you?',['I am fine, thank you.','My cat is blue.','Goodbye forever.'],'I am fine, thank you.','Du kan svare at du har det bra og si takk.'),
     makeChoice('my-name','Noen spør «What is your name?». Hva kan du svare?','What is your name?',['My name is Mia.','I am seven apples.','It is a book.'],'My name is Mia.','My name is betyr jeg heter.'),
     makeChoice('goodbye','Du skal gå hjem. Hva sier du til vennen din?','Goodbye!',['Goodbye!','What is this?','I like milk.'],'Goodbye!','Goodbye betyr ha det.')
   ]),
   ordbrygga:Object.freeze([
     makeChoice('dog-jumps','Hunden hopper. Hvilken engelsk setning passer?','The dog jumps.',['The dog jumps.','The cat sleeps.','The bird sings.'],'The dog jumps.','Dog betyr hund, og jumps betyr hopper.'),
     makeChoice('bird-sings','Fuglen synger. Hva passer?','The bird sings.',['The bird sings.','The fish runs.','The dog reads.'],'The bird sings.','Bird betyr fugl. Sings betyr synger.'),
     makeChoice('red-ball','Hvilken setning forteller om en rød ball?','The ball is red.',['The ball is red.','The ball is blue.','The ball is small.'],'The ball is red.','Red betyr rød på engelsk.'),
     makeChoice('open-door','Du vil be noen åpne døren. Hva sier du?','Open the door, please.',['Open the door, please.','Close the book, please.','I am asleep.'],'Open the door, please.','Open betyr åpne. Please er et høflig ord.')
   ]),
   setningsverkstedet:Object.freeze([
     sentence('build-like','Sett ordene sammen til «Jeg liker epler».',['apples','I','like'],['I','like','apples'],'Vi starter med I, så like, og til slutt apples.'),
     sentence('build-cat','Bygg setningen «Katten er liten».',['small','cat','The','is'],['The','cat','is','small'],'En engelsk setning kan starte med The cat.'),
     sentence('build-outside','Bygg setningen «Vi leker ute».',['outside','play','We'],['We','play','outside'],'We betyr vi. Play betyr leker.'),
     sentence('build-swim','Bygg setningen «Jeg kan svømme».',['swim','can','I'],['I','can','swim'],'I betyr jeg. Can betyr kan.')
   ]),
   samtalebaten:Object.freeze([
     makeChoice('ask-colour','En venn spør «What colour is it?». Ballen er blå. Hva svarer du?','What colour is it?',['It is blue.','I am eight.','This is my mother.'],'It is blue.','Blue betyr blå. It is betyr den er.'),
     makeChoice('ask-like','En venn spør «Do you like apples?». Du liker epler. Hva svarer du?','Do you like apples?',['Yes, I do.','No, thank you.','I am a dog.'],'Yes, I do.','Yes, I do passer når du svarer ja.'),
     makeChoice('ask-age','En venn spør «How old are you?». Du er åtte år. Hva svarer du?','How old are you?',['I am eight.','It is green.','I have a cat.'],'I am eight.','How old are you spør hvor gammel du er.'),
     makeChoice('ask-thanks','En venn gir deg en gave. Hva sier du?','Thank you!',['Thank you!','Go away!','What is my name?'],'Thank you!','Thank you betyr takk.')
   ]),
   historiefyret:Object.freeze([
     story('story-fox','The fox sees a little boat. The boat is red.','Hvilken farge er båten?',['Rød','Blå','Gul'],'Rød','Red betyr rød, og fargen hjelper deg å forstå historien.'),
     story('story-rain','Emma has a yellow coat. It is raining. She goes outside.','Hva slags vær er det?',['Det regner','Det snør','Det er sol'],'Det regner','It is raining betyr det regner.'),
     story('story-shop','Sam buys two apples. He gives one apple to Mia.','Hva gir Sam til Mia?',['Et eple','En bok','En ball'],'Et eple','Apple er eple. One betyr én.'),
     story('story-friend','Lily is happy. Her friend Ben is here. They play in the garden.','Hvor leker Lily og Ben?',['I hagen','På kjøkkenet','På skolen'],'I hagen','Garden betyr hage.')
   ])
 });
 const BY_STAGE=Object.fromEntries(STAGES.map(s=>[s.id,s]));
 const BY_TASK=new Map(Object.values(TASKS).flat().map(t=>[t.id,t]));
 const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const safeInt=x=>Number.isInteger(x)&&x>=0?x:0;
 function assert(ok,message){if(!ok)throw Error('Setningshavna: '+message)}
 function previewEnabled(search){
   return new URLSearchParams(String(search||'').replace(/^\?/,'')).get('english-chapter2-preview')==='1';
 }
 function validate(){
   assert(STAGES.length===5&&BY_TASK.size===20,'five places and twenty unique authored tasks required');
   assert(!CHAPTER.published&&!CHAPTER.artApproved,'unapproved prototype cannot be released');
   for(const stage of STAGES){
     assert(TASKS[stage.id].length===4,'missing exercises '+stage.id);
     for(const t of TASKS[stage.id]){
       assert(t.prompt.length>=18&&t.hint.length>=15,'missing child-friendly question or help for '+t.id);
       if(t.kind==='sentence'){
         assert(t.tiles.length>=3&&t.tiles.length<=5&&t.goal.length===t.tiles.length,'bad sentence length '+t.id);
         assert(new Set(t.tiles).size===t.tiles.length,'ambiguous duplicate tiles '+t.id);
         assert(t.tiles.slice().sort().join('|')===t.goal.slice().sort().join('|'),'sentence goal not represented by tiles '+t.id);
       }else if(t.kind==='choice'||t.kind==='story'){
         assert(t.options.length===3&&new Set(t.options).size===3&&t.options.includes(t.answer),'bad choice '+t.id);
         assert(typeof t.english==='string'&&/[A-Za-z]{2,}/.test(t.english)&&t.english.trim().length>=5,'missing spoken English '+t.id);
       }else assert(false,'unknown play type');
     }
   }
   return true;
 }
 function ensure(state){
   assert(isObj(state),'state required');
   if(!isObj(state.journey))state.journey={};
   if(!isObj(state.journey.chapterProgress))state.journey.chapterProgress={};
   let rec=state.journey.chapterProgress[KEY];
   if(!isObj(rec)){rec={version:1,places:{},draft:null,completedAt:null};state.journey.chapterProgress[KEY]=rec}
   if(!isObj(rec.places))rec.places={};
   return rec;
 }
 function validDraft(d){
   if(!isObj(d)||!BY_STAGE[d.stageId]||!Array.isArray(d.order))return false;
   const all=TASKS[d.stageId].map(t=>t.id);
   if(d.order.length!==4||new Set(d.order).size!==4||!all.every(id=>d.order.includes(id)))return false;
   if(!Number.isInteger(d.index)||d.index<0||d.index>=4||
      !Number.isInteger(d.correct)||d.correct<0||d.correct>d.index+1)return false;
   const t=BY_TASK.get(d.order[d.index]);
   if(!Array.isArray(d.selected)||new Set(d.selected).size!==d.selected.length)return false;
   if(d.selected.some(i=>!Number.isInteger(i)||i<0||i>= (t.kind==='sentence'?t.tiles.length:0)))return false;
   return d.feedback===null||(isObj(d.feedback)&&typeof d.feedback.correct==='boolean'&&typeof d.feedback.hint==='string');
 }
 function resume(state){
   const rec=ensure(state),d=rec.draft;
   if(d===null)return null;
   if(!validDraft(d)){rec.draft=null;return null}
   return {stage:BY_STAGE[d.stageId],task:BY_TASK.get(d.order[d.index]),index:d.index,
     total:4,correct:d.correct,selected:[...d.selected],feedback:d.feedback?{...d.feedback}:null};
 }
 function progress(state){
   const rec=ensure(state),places=STAGES.map(s=>{
     const x=isObj(rec.places[s.id])?rec.places[s.id]:{};
     return {id:s.id,title:s.title,visited:!!x.visitedAt,
       attempts:safeInt(x.attempts),best:safeInt(x.best)};
   });
   const done=places.filter(x=>x.visited).length;
   return {chapterId:CHAPTER.id,done,total:5,complete:done===5,
     recommended:places.find(x=>!x.visited)?.id||STAGES[0].id,
     places,draft:rec.draft&&validDraft(rec.draft)?rec.draft.stageId:null};
 }
 function start(state,stageId){
   assert(!!BY_STAGE[stageId],'unknown stop');
   const rec=ensure(state),list=TASKS[stageId],rot=safeInt(rec.places[stageId]?.attempts)%list.length;
   rec.draft={stageId,order:list.slice(rot).concat(list.slice(0,rot)).map(t=>t.id),
     index:0,correct:0,selected:[],feedback:null};
   return resume(state);
 }
 function selectTile(state,index){
   const s=resume(state);assert(s&&s.task.kind==='sentence','sentence required');
   assert(Number.isInteger(index)&&index>=0&&index<s.task.tiles.length,'unknown tile');
   const d=ensure(state).draft;
   if(d.feedback?.correct)return s;
   if(d.feedback)d.feedback=null;
   const pos=d.selected.indexOf(index);
   if(pos>=0)d.selected.splice(pos,1);else d.selected.push(index);
   return resume(state);
 }
 function clearTiles(state){
   const s=resume(state);assert(s&&s.task.kind==='sentence','sentence required');
   const d=ensure(state).draft;if(!d.feedback?.correct){d.selected=[];d.feedback=null}
   return resume(state);
 }
 function submitSentence(state){
   const s=resume(state);assert(s&&s.task.kind==='sentence','sentence required');
   const d=ensure(state).draft;
   if(d.feedback)return {...d.feedback};
   assert(d.selected.length===s.task.goal.length,'complete all words first');
   const words=d.selected.map(i=>s.task.tiles[i]);
   const correct=words.join(' ')===s.task.goal.join(' ');
   d.feedback={correct,hint:s.task.hint,answer:s.task.goal.join(' ')};
   if(correct)d.correct++;
   return {...d.feedback};
 }
 function choose(state,answer){
   const s=resume(state);assert(s&&(s.task.kind==='choice'||s.task.kind==='story'),'choice required');
   const d=ensure(state).draft;
   if(d.feedback)return {...d.feedback};
   assert(s.task.options.includes(answer),'answer not offered');
   const correct=answer===s.task.answer;
   d.feedback={correct,hint:s.task.hint,answer:s.task.answer};
   if(correct)d.correct++;
   return {...d.feedback};
 }
 function advance(state,time=Date.now()){
   const s=resume(state),rec=ensure(state);assert(s&&rec.draft.feedback,'answer before continuing');
   const d=rec.draft;
   if(d.index<3){d.index++;d.selected=[];d.feedback=null;return {finished:false,session:resume(state)}}
   const old=isObj(rec.places[d.stageId])?rec.places[d.stageId]:{};
   rec.places[d.stageId]={attempts:safeInt(old.attempts)+1,best:Math.max(safeInt(old.best),d.correct),
     visitedAt:Number(old.visitedAt)||time};
   const result={finished:true,stageId:d.stageId,correct:d.correct,total:4};
   rec.draft=null;
   if(STAGES.every(p=>!!rec.places[p.id]?.visitedAt))rec.completedAt=rec.completedAt||time;
   return result;
 }
 validate();
 return Object.freeze({CHAPTER,KEY,STAGES,TASKS,previewEnabled,validate,ensure,progress,
   start,resume,selectTile,clearTiles,submitSentence,choose,advance});
});