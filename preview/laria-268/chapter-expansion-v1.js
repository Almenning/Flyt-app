/* Læria: chapter-based progression for additional adventures.
 * Independent of gradeWins and every existing grade-2 journey node.
 * First pilot: Fortellingsdalen, a private preview until new map art is approved.
 */
(function(root,factory){
  const stories=root?.LARIA_FORTELLINGSDALEN_STORIES||
    (typeof require==='function'?require('./fortellingsdalen-stories-v1.js'):null);
  const api=factory(stories);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_CHAPTER_EXPANSION=api;
})(typeof window!=='undefined'?window:globalThis,function(stories){
  'use strict';
  if(!stories||!stories.validate())throw new Error('Fortellingsdalen requires its validated story bank');
  const CHAPTER_ID='fortellingsdalen-2';
  const STORAGE_KEY='norwegian:2:'+CHAPTER_ID;
  const CHAPTERS=Object.freeze([
    Object.freeze({id:'bokskogen-1',subject:'norwegian',grade:2,number:1,title:'Bokskogen',published:true,existing:true}),
    Object.freeze({id:CHAPTER_ID,subject:'norwegian',grade:2,number:2,title:'Fortellingsdalen',published:false,existing:false}),
    Object.freeze({id:'tallenga-1',subject:'math',grade:2,number:1,title:'Tallenga',published:true,existing:true}),
    Object.freeze({id:'ordlandsbyen-1',subject:'english',grade:2,number:1,title:'Ordlandsbyen',published:true,existing:true}),
    Object.freeze({id:'nordlysleiren-1',subject:'geography',grade:2,number:1,title:'Nordlysleiren',published:true,existing:true})
  ]);
  const STAGES=Object.freeze([
    Object.freeze({id:'brevhytta',title:'Brevhytta',focus:'Finn detaljer i korte brev',type:'detail',passScore:3,questionCount:4}),
    Object.freeze({id:'eventyrbrua',title:'Eventyrbrua',focus:'Sett hendelser i riktig rekkefølge',type:'sequence',passScore:3,questionCount:4}),
    Object.freeze({id:'sporstien',title:'Sporstien',focus:'Oppdag spor og trekk slutninger',type:'inference',passScore:3,questionCount:4}),
    Object.freeze({id:'fortellermolla',title:'Fortellermølla',focus:'Forstå hvorfor noe skjer',type:'cause',passScore:3,questionCount:4}),
    Object.freeze({id:'stjernetoppen',title:'Stjernetoppen',focus:'Samle alt i en liten fortelling',type:'checkpoint',passScore:4,questionCount:5})
  ]);
  const STAGE_BY_ID=Object.freeze(Object.fromEntries(STAGES.map(s=>[s.id,s])));
  const isPlainObject=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const nonneg=v=>Math.max(0,Math.floor(Number(v)||0));
  function catalogFor(subject,grade){return CHAPTERS.filter(c=>c.subject===subject&&c.grade===Number(grade))}
  function unlocked(state,chapterId,firstChapterComplete=false){
    if(chapterId!=='fortellingsdalen-2')return CHAPTERS.some(c=>c.id===chapterId&&c.existing);
    return firstChapterComplete===true||!!state?.journey?.gradeWins?.['norwegian:2'];
  }
  // This only ADDS a namespaced record when the private chapter is actually used.
  // It never migrates, renames or rewrites existing journey.nodes/gradeWins.
  function ensureState(state){
    if(!isPlainObject(state))throw new TypeError('Læria state object required');
    if(!isPlainObject(state.journey))state.journey={};
    if(!isPlainObject(state.journey.chapterProgress))state.journey.chapterProgress={};
    let entry=state.journey.chapterProgress[STORAGE_KEY];
    if(!isPlainObject(entry)){
      entry={version:1,stages:{},rotation:{},draft:null,completedAt:null};
      state.journey.chapterProgress[STORAGE_KEY]=entry;
    }
    if(!isPlainObject(entry.stages))entry.stages={};
    if(!isPlainObject(entry.rotation))entry.rotation={};
    if(entry.draft!==null&&!isPlainObject(entry.draft))entry.draft=null;
    return entry;
  }
  function progress(state){
    const entry=ensureState(state);
    const stages=STAGES.map(s=>{
      const record=isPlainObject(entry.stages[s.id])?entry.stages[s.id]:{};
      return {id:s.id,title:s.title,focus:s.focus,attempts:nonneg(record.attempts),best:nonneg(record.best),
        passed:!!record.passedAt,passedAt:Number(record.passedAt)||null};
    });
    const done=stages.filter(s=>s.passed).length;
    return {chapterId:CHAPTER_ID,storageKey:STORAGE_KEY,done,total:STAGES.length,pct:Math.round(done/STAGES.length*100),
      complete:done===STAGES.length,completedAt:entry.completedAt||null,
      recommended:stages.find(s=>!s.passed)?.id||STAGES[0].id,stages};
  }
  function resume(state){
    const entry=ensureState(state),draft=entry.draft;
    if(!isPlainObject(draft)||!STAGE_BY_ID[draft.stageId])return null;
    const story=stories.storyFor(draft.storyId);
    if(!story||story.stage!==draft.stageId||!Array.isArray(draft.answers))return null;
    if(draft.answers.length>=story.questions.length||draft.answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=story.questions[i].options.length))return null;
    const correct=draft.answers.reduce((count,a,i)=>count+Number(story.questions[i].options[a]===story.questions[i].answer),0);
    return {chapterId:CHAPTER_ID,stage:STAGE_BY_ID[draft.stageId],story,index:draft.answers.length,
      answers:[...draft.answers],correct,total:story.questions.length,startedAt:draft.startedAt};
  }
  function start(state,stageId,at=Date.now()){
    const stage=STAGE_BY_ID[stageId];if(!stage)throw new Error('Unknown chapter stage '+stageId);
    const entry=ensureState(state);
    const ongoing=resume(state);
    if(ongoing&&ongoing.stage.id===stageId)return ongoing;
    const variants=stories.BANK[stageId],rot=nonneg(entry.rotation[stageId]);
    const chosen=variants[rot%variants.length];
    entry.rotation[stageId]=rot+1;
    entry.draft={stageId,storyId:chosen.id,startedAt:Number(at)||Date.now(),answers:[]};
    return resume(state);
  }
  function abandon(state){ensureState(state).draft=null}
  function answer(state,optionIndex,at=Date.now()){
    const session=resume(state);
    if(!session)throw new Error('No unfinished story session');
    const question=session.story.questions[session.index];
    if(!Number.isInteger(optionIndex)||optionIndex<0||optionIndex>=question.options.length)
      throw new RangeError('Answer must be an existing choice');
    const entry=ensureState(state);
    entry.draft.answers.push(optionIndex);
    const correct=question.options[optionIndex]===question.answer;
    const atEnd=entry.draft.answers.length===session.story.questions.length;
    let outcome=null;
    if(atEnd){
      const final=session.correct+Number(correct),stage=session.stage,old=isPlainObject(entry.stages[stage.id])?entry.stages[stage.id]:{};
      const passed=final>=stage.passScore;
      entry.stages[stage.id]={
        attempts:nonneg(old.attempts)+1,best:Math.max(nonneg(old.best),final),
        passedAt:old.passedAt||(passed?(Number(at)||Date.now()):null),
        lastPlayedAt:Number(at)||Date.now(),lastStoryId:session.story.id
      };
      entry.draft=null;
      const chapter=progress(state),firstCompletion=chapter.complete&&!entry.completedAt;
      if(firstCompletion)entry.completedAt=Number(at)||Date.now();
      outcome={stageId:stage.id,storyId:session.story.id,correct:final,total:session.total,
        passed,chapterCompleted:firstCompletion,chapterProgress:progress(state)};
    }
    return {questionId:question.id,correct,answer:question.answer,
      selected:question.options[optionIndex],finished:atEnd,outcome};
  }
  function previewEnabled(search){
    try{return new URLSearchParams(String(search||'')).get('chapter2-preview')==='1'}
    catch(_){return false}
  }
  return Object.freeze({CHAPTER_ID,STORAGE_KEY,CHAPTERS,STAGES,STAGE_BY_ID,catalogFor,unlocked,
    ensureState,progress,start,resume,answer,abandon,previewEnabled});
});
