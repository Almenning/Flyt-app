/* Læria Math adventure 2: Mønsterhagen.
 * Independent, authored learning games. INTERNAL PREVIEW, NOT RELEASED.
 * Does not write to legacy journey.nodes or journey.gradeWins.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LARIA_MATH_PATTERN_HAVEN=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const CHAPTER=Object.freeze({id:'monsterhagen-2',title:'Mønsterhagen',
   subject:'math',grade:2,number:2,published:false,artApproved:false});
 const KEY='math:2:monsterhagen-2';
 const STAGES=Object.freeze([
   {id:'formstien',title:'Formstien',symbol:'△',focus:'Former, sider og hjørner'},
   {id:'monsterbekken',title:'Mønsterbekken',symbol:'✿',focus:'Fortsett figurrekkene'},
   {id:'speildammen',title:'Speildammen',symbol:'◈',focus:'Mal et ekte speilbilde'},
   {id:'tallbroen',title:'Tallbroen',symbol:'➜',focus:'Oppdag hvordan tallene vokser'},
   {id:'stjernelunden',title:'Stjernelunden',symbol:'✦',focus:'Samle de beste oppdagelsene'}
 ].map(x=>Object.freeze(x)));
 const q=(id,prompt,visual,options,answer,hint)=>Object.freeze({id,kind:'choice',prompt,visual,
   options:Object.freeze(options),answer,hint});
 const m=(id,prompt,left,hint)=>Object.freeze({id,kind:'mirror',prompt,left:Object.freeze(left.map(r=>Object.freeze(r))),hint});
 const TASKS=Object.freeze({
   formstien:Object.freeze([
     q('form1','Hvilken form har tre hjørner?','△   ○   □',['Trekant','Sirkel','Kvadrat'],'Trekant','En trekant har tre sider og tre hjørner.'),
     q('form2','Hvilken form kan rulle uten hjørner?','□   ○   △',['Sirkel','Trekant','Kvadrat'],'Sirkel','En sirkel er rund og har ingen hjørner.'),
     q('form3','Hvilken form har fire like lange sider?','△   □   ○',['Rektangel','Sirkel','Kvadrat'],'Kvadrat','Et kvadrat har fire like lange sider.'),
     q('form4','Hvilken form kan ha to lange og to korte sider?','▭   △   ○',['Rektangel','Trekant','Sirkel'],'Rektangel','Et rektangel har fire hjørner og parvis like lange sider.'),
     q('form5','Hvor mange hjørner har en femkant?','⬟   △   □',['3','4','5'],'5','En femkant har fem hjørner og fem rette sider.'),
     q('form6','Hvilken figur har seks hjørner?','⬡   △   ○',['Sekskant','Sirkel','Trekant'],'Sekskant','En sekskant har seks hjørner og seks sider.'),
     q('form7','Hvor mange hjørner finner du i en trekant?','△',['3','4','5'],'3','Du kan telle de tre spissene på trekanten.'),
     q('form8','Hvor mange rette sider har en sirkel?','○',['0','2','4'],'0','Sirkelen er rund hele veien og har ingen rette sider.')
   ]),
   monsterbekken:Object.freeze([
     q('pattern1','Hva kommer etter?','●  ▲  ●  ▲  ●  ?',['▲','●','■'],'▲','Sirkel og trekant bytter på.'),
     q('pattern2','Hvilken figur mangler?','■  ■  ○  ■  ■  ?',['■','○','▲'],'○','To firkanter følges av én sirkel.'),
     q('pattern3','Hvilken figur fortsetter stien?','★  ●  ▲  ★  ●  ?',['▲','★','●'],'▲','Tre ulike figurer gjentar seg.'),
     q('pattern4','Hvilken kommer nå?','○  ▲  ▲  ○  ▲  ▲  ?',['○','▲','■'],'○','Mønsteret er én sirkel og to trekanter.'),
     q('pattern5','Hvilken figur fortsetter den nye stien?','▲  ▲  ●  ▲  ▲  ●  ▲  ?',['▲','●','□'],'▲','To trekanter kommer før hver sirkel.'),
     q('pattern6','Hva kommer etter tre ulike figurer?','■  ○  ▲  ■  ○  ?',['▲','■','○'],'▲','Firkant, sirkel og trekant gjentas i samme rekkefølge.'),
     q('pattern7','Hvilken figur mangler helt til slutt?','★  ★  ○  ★  ★  ○  ★  ★  ?',['○','★','▲'],'○','To stjerner følges alltid av én sirkel.'),
     q('pattern8','Hva blir den neste figuren ved bekken?','▲  □  ○  ○  ▲  □  ?',['○','□','▲'],'○','Fire figurer utgjør mønsteret: trekant, firkant og to sirkler.')
   ]),
   speildammen:Object.freeze([
     m('mirror1','Trykk på rutene til høyre for å speile det blå mønsteret.',[[1,0],[0,1],[1,1],[0,1]],'Hver rute har en tvilling på motsatt side av midten.'),
     m('mirror2','Kan du lage den lille trappen på høyre side?',[[1,0],[1,1],[0,1],[0,0]],'Speilbildet snur trappen mot midtstreken.'),
     m('mirror3','Speil stjernestien på den andre siden.',[[0,1],[1,0],[0,1],[1,0]],'Mønsteret vendes vannrett, ikke opp ned.'),
     m('mirror4','Bygg to halvdeler som ser mot hverandre.',[[1,1],[0,1],[0,1],[1,1]],'Høyre side viser venstre side i et speil.'),
     m('mirror5','Bygg et speilbilde av hjørnet som er malt.',[[1,1],[1,0],[0,0],[0,0]],'Se på hvilke ruter som er nærmest den loddrette midtstreken.'),
     m('mirror6','Speil den skjeve trappen i vannet.',[[0,0],[0,1],[1,1],[1,0]],'Rutene skal snus mot høyre, men beholde sin rad.'),
     m('mirror7','Fyll inn rutene som gjør stripemønsteret symmetrisk.',[[1,0],[1,1],[1,0],[1,1]],'Hver fargelagte rute får en tvilling på andre siden.'),
     m('mirror8','Kan du speile de to små søylene?',[[0,1],[0,1],[1,0],[1,0]],'De øverste og nederste rutene speiles hver for seg.')
   ]),
   tallbroen:Object.freeze([
     q('number1','Hvilket tall bygger neste brostein?','2 · 4 · 6 · 8 · ?',['9','10','12'],'10','Vi legger til to hver gang.'),
     q('number2','Hvilket tall kommer nå?','5 · 10 · 15 · ?',['20','25','18'],'20','Vi teller fem om gangen.'),
     q('number3','Hvilket tall mangler?','30 · 27 · 24 · ?',['20','21','22'],'21','Vi går tre ned for hvert steg.'),
     q('number4','Hva kommer etter?','11 · 21 · 31 · ?',['40','41','42'],'41','Vi legger til ti hver gang.'),
     q('number5','Hvilket tall blir neste steg på broen?','1 · 3 · 5 · 7 · ?',['8','9','10'],'9','Vi hopper to tall videre hver gang.'),
     q('number6','Hvilket tall mangler når vi teller bakover?','100 · 90 · 80 · ?',['60','70','75'],'70','For hvert steg trekker vi fra ti.'),
     q('number7','Hva blir den neste brosteinen?','4 · 8 · 12 · 16 · ?',['18','20','24'],'20','Vi legger til fire på hvert trinn.'),
     q('number8','Hvilket tall kommer nå?','25 · 20 · 15 · ?',['5','10','12'],'10','Denne gangen tar vi bort fem for hvert steg.')
   ]),
   stjernelunden:Object.freeze([
     q('star1','Hva mangler i figurmønsteret?','▲  ○  ○  ▲  ○  ○  ?',['▲','○','□'],'▲','Én trekant og to sirkler gjentar seg.'),
     m('star2','Kan du speile den lille stjernen?',[[0,1],[1,1],[1,0],[0,1]],'Det nær midten speiles nær midten.'),
     q('star3','Hvilket tall finner veien videre?','3 · 6 · 9 · 12 · ?',['14','15','16'],'15','Vi legger til tre om gangen.'),
     q('star4','Hvilken figur har ingen rette sider?','◯   △   □',['Sirkel','Trekant','Kvadrat'],'Sirkel','En sirkel er rund hele veien.'),
     q('star5','Hvilken figur fortsetter stjernemønsteret?','▲  ▲  ▲  ○  ▲  ▲  ▲  ?',['○','▲','□'],'○','Tre trekanter følges av én sirkel hver gang.'),
     m('star6','Speil de lysende rutene i stjernelunden.',[[0,1],[1,0],[1,0],[0,1]],'De ytterste rutene i mønsteret blir ytterst også på speilsiden.'),
     q('star7','Hvilket tall finner veien videre?','50 · 45 · 40 · ?',['35','30','36'],'35','Tallene synker med fem for hvert steg.'),
     q('star8','Hvilken figur har seks rette sider?','⬡   △   ○',['Sekskant','Sirkel','Trekant'],'Sekskant','En sekskant har seks rette sider og seks hjørner.')
   ])
 });
 const STAGE_BY_ID=Object.fromEntries(STAGES.map(s=>[s.id,s]));
 const taskById=new Map(Object.values(TASKS).flat().map(t=>[t.id,t]));
 const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const positive=x=>Number.isInteger(x)&&x>=0?x:0;
 function assert(ok,why){if(!ok)throw Error('Mønsterhagen: '+why)}
 function previewEnabled(search){
   return new URLSearchParams(String(search||'').replace(/^\?/,'')).get('math-chapter2-preview')==='1';
 }
 function validate(){
   assert(CHAPTER.published===false&&CHAPTER.artApproved===false,'unapproved adventure');
   assert(STAGES.length===5&&taskById.size===40,'exactly five places and forty unique challenges');
   for(const stage of STAGES){
     const questions=TASKS[stage.id];assert(questions.length===8,'missing a second independent task set in '+stage.id);
     for(const x of questions){
       assert(x.prompt.length>14&&x.hint.length>15,'missing editorial learning text');
       if(x.kind==='choice')assert(x.options.length===3&&new Set(x.options).size===3&&x.options.includes(x.answer),'invalid choices '+x.id);
       else if(x.kind==='mirror')assert(x.left.length===4&&x.left.every(row=>row.length===2&&row.every(v=>v===0||v===1)),'invalid mirror '+x.id);
       else assert(false,'unknown kind');
     }
   }
   return true;
 }
 function ensure(state){
   assert(isObj(state),'state object required');
   if(!isObj(state.journey))state.journey={};
   if(!isObj(state.journey.chapterProgress))state.journey.chapterProgress={};
   let rec=state.journey.chapterProgress[KEY];
   if(!isObj(rec)){rec={version:1,places:{},draft:null,completedAt:null};state.journey.chapterProgress[KEY]=rec}
   if(!isObj(rec.places))rec.places={};
   return rec;
 }
 function validDraft(d){
   if(!isObj(d)||!STAGE_BY_ID[d.stageId]||!Array.isArray(d.order))return false;
   const ids=TASKS[d.stageId].map(t=>t.id);
   if(d.order.length!==4||new Set(d.order).size!==4||!d.order.every(id=>ids.includes(id)))return false;
   if(!Number.isInteger(d.index)||d.index<0||d.index>=4||!Number.isInteger(d.correct)||d.correct<0||d.correct>d.index+1)return false;
   if(!Array.isArray(d.mirror)||d.mirror.length>8||new Set(d.mirror).size!==d.mirror.length||
      d.mirror.some(key=>!/^[0-3]-[23]$/.test(key)))return false;
   return d.feedback===null||(isObj(d.feedback)&&typeof d.feedback.correct==='boolean'&&typeof d.feedback.hint==='string');
 }
 function resume(state){
   const rec=ensure(state),d=rec.draft;
   if(d===null)return null;
   if(!validDraft(d)){rec.draft=null;return null}
   return {stage:STAGE_BY_ID[d.stageId],task:taskById.get(d.order[d.index]),
     index:d.index,total:d.order.length,correct:d.correct,mirror:[...d.mirror],
     feedback:d.feedback?{...d.feedback}:null};
 }
 function targetMirror(task){
   assert(task&&task.kind==='mirror','mirror question required');
   const cells=[];
   for(let r=0;r<4;r++)for(let c=0;c<2;c++)if(task.left[r][c])cells.push(r+'-'+(3-c));
   return cells.sort();
 }
 function progress(state){
   const rec=ensure(state),places=STAGES.map(s=>{
     const x=isObj(rec.places[s.id])?rec.places[s.id]:{};
     return {id:s.id,title:s.title,focus:s.focus,attempts:positive(x.attempts),
       best:positive(x.best),visited:!!x.visitedAt};
   });
   const done=places.filter(p=>p.visited).length;
   return {chapterId:CHAPTER.id,done,total:5,complete:done===5,
     recommended:places.find(p=>!p.visited)?.id||STAGES[0].id,places,
     draft:rec.draft&&validDraft(rec.draft)?rec.draft.stageId:null};
 }
 function start(state,stageId){
   assert(!!STAGE_BY_ID[stageId],'unknown stage '+stageId);
   const rec=ensure(state),items=TASKS[stageId];
   // The next finished visit explores a different set, rather than rearranging old tasks.
   // Old four-item mirror drafts remain valid and are never silently migrated.
   const group=positive(rec.places[stageId]?.attempts)%(items.length/4);
   rec.draft={stageId,order:items.slice(group*4,group*4+4).map(x=>x.id),
     index:0,correct:0,mirror:[],feedback:null};
   return resume(state);
 }
 function submitChoice(state,answer){
   const session=resume(state);assert(session&&session.task.kind==='choice','choice activity required');
   const d=ensure(state).draft;
   if(d.feedback)return {...d.feedback};
   assert(session.task.options.includes(answer),'answer not offered');
   const correct=answer===session.task.answer;
   d.feedback={correct,answer:session.task.answer,hint:session.task.hint};
   if(correct)d.correct++;
   return {...d.feedback};
 }
 function toggleMirror(state,r,c){
   const session=resume(state);assert(session&&session.task.kind==='mirror','mirror activity required');
   assert(Number.isInteger(r)&&r>=0&&r<4&&(c===2||c===3),'only right-hand mirror cells');
   const d=ensure(state).draft;
   if(d.feedback?.correct)return session;
   // A wrong attempt may be repainted and checked again.
   if(d.feedback&&!d.feedback.correct)d.feedback=null;
   const key=r+'-'+c,index=d.mirror.indexOf(key);
   if(index>=0)d.mirror.splice(index,1);else d.mirror.push(key);
   return resume(state);
 }
 function checkMirror(state){
   const session=resume(state);assert(session&&session.task.kind==='mirror','mirror activity required');
   const d=ensure(state).draft;
   if(d.feedback)return {...d.feedback};
   const correct=targetMirror(session.task).join(',')===[...d.mirror].sort().join(',');
   d.feedback={correct,answer:'Hver rute speiles på motsatt side av streken.',hint:session.task.hint};
   if(correct)d.correct++;
   return {...d.feedback};
 }
 function advance(state,at=Date.now()){
   const session=resume(state),rec=ensure(state);
   assert(session&&rec.draft.feedback,'answer before continuing');
   const d=rec.draft;
   if(d.index<d.order.length-1){
     d.index++;d.mirror=[];d.feedback=null;
     return {finished:false,session:resume(state)};
   }
   const prev=isObj(rec.places[d.stageId])?rec.places[d.stageId]:{};
   rec.places[d.stageId]={visitedAt:Number(prev.visitedAt)||at,
     attempts:positive(prev.attempts)+1,best:Math.max(positive(prev.best),d.correct)};
   const result={finished:true,stageId:d.stageId,correct:d.correct,total:d.order.length};
   rec.draft=null;
   if(STAGES.every(s=>!!rec.places[s.id]?.visitedAt))rec.completedAt=rec.completedAt||at;
   return result;
 }
 validate();
 return Object.freeze({CHAPTER,KEY,STAGES,TASKS,previewEnabled,validate,
   ensure,progress,start,resume,submitChoice,toggleMirror,targetMirror,checkMirror,advance});
});