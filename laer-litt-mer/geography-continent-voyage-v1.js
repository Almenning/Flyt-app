/* Læria Geography adventure two / Kontinentseilasen.
 * Development content/interaction model. No map artwork or public release.
 * Compass and passport mechanics add new play, not more rote country quizzes.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LARIA_GEO_CONTINENT_VOYAGE=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const CHAPTER=Object.freeze({id:'kontinentseilasen-2',title:'Kontinentseilasen',
   subject:'geography',grade:2,number:2,published:false,artApproved:false});
 const KEY='geography:2:kontinentseilasen-2';
 const STAGES=Object.freeze([
   {id:'kompassholmen',title:'Kompassholmen',symbol:'✦',focus:'Styr båten mot nord, sør, øst og vest'},
   {id:'passbrygga',title:'Passbrygga',symbol:'⚓',focus:'Sett et kontinentstempel i reisepasset'},
   {id:'havpassasjen',title:'Havpassasjen',symbol:'≈',focus:'Finn de store havene på verdenskartet'},
   {id:'naturøya',title:'Naturøya',symbol:'❖',focus:'Oppdag steder med fjell, skog, ørken og koraller'},
   {id:'reisefyret',title:'Reisefyret',symbol:'◈',focus:'Fyll passet med nye verdensdeler'}
 ].map(s=>Object.freeze(s)));
 const CONTINENTS=Object.freeze(['Europa','Asia','Afrika','Nord-Amerika','Sør-Amerika','Oseania']);
 const DIRECTIONS=Object.freeze(['N','Ø','S','V']);
 const compass=(id,prompt,answer,hint)=>Object.freeze({id,kind:'compass',prompt,options:DIRECTIONS,answer,hint});
 const stamp=(id,prompt,country,answer,hint)=>Object.freeze({id,kind:'stamp',prompt,country,options:CONTINENTS,answer,hint});
 const choice=(id,prompt,options,answer,hint)=>Object.freeze({id,kind:'choice',prompt,options:Object.freeze(options),answer,hint});
 const TASKS=Object.freeze({
   kompassholmen:Object.freeze([
     compass('compass-n','Kapteinen vil seile mot nord. Hvilken pil styrer du etter?','N','Nord er opp på dette kompasset.'),
     compass('compass-s','Nå skal båten sørover. Hvilken retning velger du?','S','Sør er rett ned på kompasset.'),
     compass('compass-e','Sola står opp i øst. Hvilken pil viser øst?','Ø','Øst vises på høyre side av dette kompasset.'),
     compass('compass-w','Vi skal reise vestover. Hvor peker kompassnåla?','V','Vest ligger til venstre på dette kompasset.')
   ]),
   passbrygga:Object.freeze([
     stamp('stamp-norway','Finn riktig verdensdel og stempl passet for Norge.','Norge','Europa','Norge ligger i den nordlige delen av Europa.'),
     stamp('stamp-japan','Hvilken verdensdel skal få stempelet for Japan?','Japan','Asia','Japan er et øyrike i Asia.'),
     stamp('stamp-kenya','Hvor hører Kenya hjemme i reisepasset?','Kenya','Afrika','Kenya ligger i det østlige Afrika.'),
     stamp('stamp-brazil','Hvilken verdensdel finner vi Brasil i?','Brasil','Sør-Amerika','Brasil ligger i Sør-Amerika.')
   ]),
   havpassasjen:Object.freeze([
     choice('ocean-atlantic','Hvilket hav ligger mellom Sør-Amerika og Afrika?',['Atlanterhavet','Stillehavet','Nordishavet'],'Atlanterhavet','Atlanterhavet ligger mellom disse kontinentene.'),
     choice('ocean-pacific','Hva heter det største havet på jorda?',['Atlanterhavet','Stillehavet','Indiahavet'],'Stillehavet','Stillehavet er jordas største hav.'),
     choice('ocean-indian','Hvilket stort hav finner vi mellom Afrika, Sør-Asia og Australia?',['Indiahavet','Nordishavet','Atlanterhavet'],'Indiahavet','Indiahavet ligger sør for store deler av Asia.'),
     choice('ocean-arctic','Hvilket hav ligger rundt Nordpolen?',['Nordishavet','Stillehavet','Indiahavet'],'Nordishavet','Nordishavet ligger rundt Nordpolen.')
   ]),
   naturøya:Object.freeze([
     choice('nature-sahara','På hvilket kontinent ligger Saharaørkenen?',['Afrika','Europa','Oseania'],'Afrika','Sahara dekker store deler av Nord-Afrika.'),
     choice('nature-amazon','På hvilket kontinent finner vi mesteparten av Amazonasregnskogen?',['Sør-Amerika','Asia','Europa'],'Sør-Amerika','Amazonasregnskogen ligger i Sør-Amerika.'),
     choice('nature-himalaya','Hvor ligger fjellkjeden Himalaya?',['Asia','Afrika','Nord-Amerika'],'Asia','Himalaya er en stor fjellkjede i Asia.'),
     choice('nature-reef','Hvor finner vi Great Barrier Reef, et stort korallrev?',['Oseania','Europa','Afrika'],'Oseania','Korallrevet ligger utenfor Australia i Oseania.')
   ]),
   reisefyret:Object.freeze([
     stamp('stamp-canada','Hvilken verdensdel hører Canada til?','Canada','Nord-Amerika','Canada ligger i Nord-Amerika.'),
     stamp('stamp-australia','Hvilken verdensdel finner vi Australia i?','Australia','Oseania','Australia er både et land og del av verdensdelen Oseania.'),
     stamp('stamp-chile','Sett riktig stempel for landet Chile.','Chile','Sør-Amerika','Chile ligger langs vestkysten av Sør-Amerika.'),
     stamp('stamp-india','Finn verdensdelen som India ligger i.','India','Asia','India ligger i den sørlige delen av Asia.')
   ])
 });
 const stageIndex=Object.fromEntries(STAGES.map(s=>[s.id,s]));
 const byId=new Map(Object.values(TASKS).flat().map(t=>[t.id,t]));
 const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const nonnegative=x=>Number.isInteger(x)&&x>=0?x:0;
 function assert(ok,why){if(!ok)throw Error('Kontinentseilasen: '+why)}
 function previewEnabled(search){
   return new URLSearchParams(String(search||'').replace(/^\?/,'')).get('geography-chapter2-preview')==='1';
 }
 function validate(){
   assert(!CHAPTER.published&&!CHAPTER.artApproved,'unapproved chapter cannot be released');
   assert(STAGES.length===5&&byId.size===20,'exactly five places, twenty authored tasks');
   assert(Object.values(TASKS).flat().filter(t=>t.kind==='stamp').length===8,'eight actual passport stamps');
   assert(Object.values(TASKS).flat().filter(t=>t.kind==='compass').length===4,'four compass moves');
   for(const place of STAGES){
     const tasks=TASKS[place.id];
     assert(tasks.length===4,'four learning activities per place');
     for(const t of tasks){
       assert(t.prompt.length>=25&&t.hint.length>=18,'missing geographical context '+t.id);
       assert(t.options.includes(t.answer)&&new Set(t.options).size===t.options.length,'unanswerable activity '+t.id);
       if(t.kind==='compass')assert(t.options.length===4,'four directions required');
       else if(t.kind==='stamp')assert(CONTINENTS.includes(t.answer)&&t.country.length>3,'invalid continent passport');
       else assert(t.kind==='choice'&&t.options.length===3,'unsupported task type');
     }
   }
   return true;
 }
 function ensure(state){
   assert(isObj(state),'state required');
   if(!isObj(state.journey))state.journey={};
   if(!isObj(state.journey.chapterProgress))state.journey.chapterProgress={};
   let record=state.journey.chapterProgress[KEY];
   if(!isObj(record)){record={version:1,places:{},draft:null,completedAt:null};state.journey.chapterProgress[KEY]=record}
   if(!isObj(record.places))record.places={};
   return record;
 }
 function validDraft(d){
   if(!isObj(d)||!stageIndex[d.stage]||!Array.isArray(d.order))return false;
   const available=TASKS[d.stage].map(t=>t.id);
   if(d.order.length!==4||new Set(d.order).size!==4||!available.every(id=>d.order.includes(id)))return false;
   if(!Number.isInteger(d.step)||d.step<0||d.step>=4||
      !Number.isInteger(d.correct)||d.correct<0||d.correct>d.step+1)return false;
   return d.feedback===null||(isObj(d.feedback)&&typeof d.feedback.correct==='boolean'&&typeof d.feedback.hint==='string');
 }
 function resume(state){
   const record=ensure(state);
   if(record.draft===null)return null;
   if(!validDraft(record.draft)){record.draft=null;return null}
   const d=record.draft;
   return {place:stageIndex[d.stage],task:byId.get(d.order[d.step]),step:d.step,total:4,
     correct:d.correct,feedback:d.feedback?{...d.feedback}:null};
 }
 function progress(state){
   const rec=ensure(state);
   const places=STAGES.map(s=>{
     const p=isObj(rec.places[s.id])?rec.places[s.id]:{};
     return {id:s.id,title:s.title,visited:!!p.visitedAt,attempts:nonnegative(p.attempts),best:nonnegative(p.best)};
   });
   const done=places.filter(x=>x.visited).length;
   return {chapterId:CHAPTER.id,done,total:5,complete:done===5,
     recommended:places.find(x=>!x.visited)?.id||STAGES[0].id,places,
     draft:rec.draft&&validDraft(rec.draft)?rec.draft.stage:null};
 }
 function start(state,placeId){
   assert(!!stageIndex[placeId],'unknown place '+placeId);
   const record=ensure(state),list=TASKS[placeId],offset=nonnegative(record.places[placeId]?.attempts)%4;
   record.draft={stage:placeId,order:list.slice(offset).concat(list.slice(0,offset)).map(t=>t.id),
     step:0,correct:0,feedback:null};
   return resume(state);
 }
 function answer(state,choice){
   const session=resume(state);assert(session,'no voyage activity');
   const record=ensure(state),d=record.draft;
   if(d.feedback)return {...d.feedback};
   assert(session.task.options.includes(choice),'choice not offered');
   const correct=choice===session.task.answer;
   d.feedback={correct,hint:session.task.hint,answer:session.task.answer};
   if(correct)d.correct++;
   return {...d.feedback};
 }
 function advance(state,time=Date.now()){
   const rec=ensure(state),s=resume(state);assert(s&&rec.draft.feedback,'answer before moving on');
   const d=rec.draft;
   if(d.step<3){d.step++;d.feedback=null;return {finished:false,session:resume(state)}}
   const old=isObj(rec.places[d.stage])?rec.places[d.stage]:{};
   rec.places[d.stage]={visitedAt:Number(old.visitedAt)||time,attempts:nonnegative(old.attempts)+1,
     best:Math.max(nonnegative(old.best),d.correct)};
   const result={finished:true,placeId:d.stage,correct:d.correct,total:4};
   rec.draft=null;
   if(STAGES.every(p=>!!rec.places[p.id]?.visitedAt))rec.completedAt=rec.completedAt||time;
   return result;
 }
 validate();
 return Object.freeze({CHAPTER,KEY,STAGES,CONTINENTS,DIRECTIONS,TASKS,previewEnabled,
   validate,ensure,start,resume,progress,answer,advance});
});