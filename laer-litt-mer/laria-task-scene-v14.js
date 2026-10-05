/* Læria Oppgavescene v14
   Shared presentation for all four subjects. Existing answer handlers own progression. */
(function(){
  'use strict';

  if(typeof renderQuestion!=='function')return;

  const baseRenderQuestion=renderQuestion;
  const sceneSubjects=new Set(['norwegian','english','math','geography']);
  const objectArt={'🏠':'house','🏡':'house','🐱':'cat','🐈':'cat','🐶':'dog','🐕':'dog','🍎':'apple','🌳':'tree','📘':'book','☀️':'sun','☀':'sun','⚽':'ball','🐟':'fish','🐭':'mouse','🚗':'car','🧀':'cheese','🍦':'icecream','⛵':'boat','🧢':'hat','👟':'shoe','🚆':'train','🐄':'cow','🐑':'lamb','☕':'cup','🛏️':'bed','🌙':'moon','🌼':'flower'};
  const screen=document.getElementById('session-screen');
  const closeButton=document.getElementById('close-session');
  const progressBar=document.getElementById('session-progress-bar');
  const countLabel=document.getElementById('session-count');
  if(!screen||!closeButton||!progressBar||!countLabel)return;

  function text(value){
    return String(value??'')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }
  function attr(value){
    if(typeof escapeAttr==='function')return escapeAttr(value);
    return text(value).replaceAll('"','&quot;');
  }
  function taskBand(){
    const grade=Number(currentGrade());
    if(grade<=2)return 'young';
    if(grade<=4)return 'middle';
    if(grade<=7)return 'older';
    return 'teen';
  }
  function cleanPrompt(q){
    let prompt=String(q?.prompt||'').trim();
    const visual=String(q?.visual||'').trim();
    if(visual&&prompt.startsWith(visual))prompt=prompt.slice(visual.length).trim();
    return prompt||((q?.subject==='english')?'Choose the right answer':'Velg riktig svar');
  }
  function sceneName(subject){
    return {english:'Ordlandsbyen',norwegian:'Bokskogen',math:'Tallriket',geography:'Verden'}[subject];
  }
  function subjectName(subject){
    return {english:'ENGLISH',norwegian:'NORSK',math:'MATTE',geography:'GEOGRAFI'}[subject];
  }
  function foxSource(){
    const which=(typeof state!=='undefined'&&state?.profile?.avatar==='girl')?'girl':'boy';
    try{
      if(typeof avatarSrc==='function')return avatarSrc(which);
    }catch(_){}
    const fromProfile=window.LARIA_PROFILE_AVATARS?.[which];
    return fromProfile||'./lia-fox-explorer.webp';
  }
  function answerLayout(q){
    if(!Array.isArray(q?.options))return '';
    const lengths=q.options.map(x=>String(x).length);
    const max=lengths.length?Math.max(...lengths):0;
    if(q.options.length<=3&&max<=15)return 'short-answers';
    if(q.options.length<=4&&max<=26)return 'medium-answers';
    return 'wide-answers';
  }
  function cardMode(q){
    if(q?.passage)return 'has-passage';
    if(q?.visual)return 'has-visual';
    return 'text-only';
  }
  function taskTypeClass(q){
    return 'task-type-'+String(q?.type||'choice').replace(/[^a-z0-9_-]/gi,'-');
  }
  function activateScene(q){
    screen.classList.add('task-scene');
    screen.dataset.taskSubject=q.subject;
    screen.dataset.taskBand=taskBand();
    document.body.classList.add('laria-task-scene-open');
    closeButton.innerHTML='<span aria-hidden="true">‹</span><span>Tilbake</span>';
    closeButton.setAttribute('aria-label','Tilbake til faget');
  }
  function clearScene(){
    screen.classList.remove('task-scene');
    delete screen.dataset.taskSubject;
    delete screen.dataset.taskBand;
    document.body.classList.remove('laria-task-scene-open');
    closeButton.textContent='×';
    closeButton.setAttribute('aria-label','Avslutt');
    const wrap=document.getElementById('question-wrap');
    if(wrap)wrap.classList.remove('task-scene-wrap');
  }
  function interactionMarkup(q){
    if(q.type==='map'&&!q.subject){
      const region=q.mapRegion||countries[q.k].continent;
      return '<div class="map-region">'+text(region)+'</div><div class="map quiz-real-map" id="quiz-map"><canvas id="quiz-map-canvas" aria-label="Kart over '+attr(region)+'"></canvas></div>';
    }
    if(q.type==='build-word'){
      return '<div class="letter-slots" id="letter-slots"></div>'+
        '<div class="letter-helper" id="letter-helper" aria-live="polite">'+
        (q.subject==='english'?'Tap a space and a letter, or drag the letter into place.':'Trykk på en rute og en bokstav, eller dra bokstaven dit.')+
        '</div>'+
        '<div class="letter-bank">'+q.letters.map((x,i)=>'<button type="button" class="letter-tile" data-idx="'+i+'" aria-label="'+(q.subject==='english'?'Letter ':'Bokstav ')+attr(x.l)+'">'+text(x.l)+'</button>').join('')+'</div>'+
        '<button class="secondary" id="check-build" type="button">'+(q.subject==='english'?'Check the word':'Sjekk ordet')+'</button>';
    }
    if(q.type==='sentence-order'){
      return '<div class="sentence-target" id="sentence-target"></div>'+
        '<div class="word-bank">'+q.words.map((w,i)=>'<button type="button" class="word-tile" data-idx="'+i+'">'+text(w)+'</button>').join('')+'</div>'+
        '<button class="secondary" id="check-sentence" type="button">'+(q.subject==='english'?'Check the sentence':'Sjekk setningen')+'</button>';
    }
    if(q.type==='number-input'){
      return '<div class="number-input-wrap"><input class="math-input" id="math-input" inputmode="decimal" autocomplete="off" aria-label="Skriv svaret"><button class="secondary" id="check-number" type="button">Sjekk svaret</button></div>';
    }
    if(q.type==='sequence-order'){
      return '<div class="sequence-target" id="sequence-target"></div><div class="sequence-bank" id="sequence-bank">'+q.items.map((x,i)=>'<button type="button" class="sequence-tile" data-idx="'+i+'">'+text(x)+'</button>').join('')+'</div><button class="secondary" id="check-sequence" type="button">Sjekk rekkefølgen</button>';
    }
    const options=Array.isArray(q.options)?q.options:[];
    return '<div class="answers">'+options.map(o=>'<button class="answer" data-answer="'+attr(o)+'">'+text(o)+'</button>').join('')+'</div>';
  }
  function bindInteraction(q,wrap){
    if(!q.subject){
      if(q.type==='map')requestAnimationFrame(()=>renderQuizMap(q,currentAnswered));
      else wrap.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answerText(b.dataset.answer));
    }
    else if(q.type==='build-word')renderBuildWord(q,wrap);
    else if(q.type==='sentence-order')renderSentenceOrder(q,wrap);
    else if(q.type==='number-input')renderNumberInput(q,wrap);
    else if(q.type==='sequence-order')renderSequenceOrder(q,wrap);
    else wrap.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answerLearningChoice(b.dataset.answer));
  }
  function restoreAnswered(q,wrap){
    if(!currentAnswered)return;
    if(!q.subject){applyAnsweredState(q,currentAnswered);return;}
    if(q.type==='learning-choice'){
      wrap.querySelectorAll('.answer').forEach(b=>{
        b.disabled=true;
        if(b.dataset.answer===String(q.answer))b.classList.add('correct');
        else if(b.dataset.answer===String(currentAnswered.selected))b.classList.add('wrong');
      });
    }
    const input=wrap.querySelector('#math-input');
    if(input){input.value=currentAnswered.selected??'';input.disabled=true}
    if(q.type==='build-word'){
      const selected=Array.from(String(currentAnswered.selected||''));
      wrap.querySelectorAll('.letter-slot').forEach((slot,i)=>{
        slot.textContent=selected[i]||'';slot.classList.toggle('filled',!!selected[i]);slot.disabled=true;
        slot.setAttribute('aria-label','Rute '+(i+1)+': '+(selected[i]||'tom'));
      });
      wrap.querySelectorAll('.letter-tile,#check-build').forEach(b=>b.disabled=true);
    }
    if(q.type==='sentence-order'||q.type==='sequence-order'){
      const target=wrap.querySelector('.sentence-target,.sequence-target');
      if(target)target.textContent=String(currentAnswered.selected||'').replaceAll('|',' · ');
      wrap.querySelectorAll('.word-tile,.sequence-tile,#check-sentence').forEach(b=>b.disabled=true);
    }
    wrap.querySelectorAll('#check-number,#check-sequence').forEach(b=>b.disabled=true);
    showLearningFeedback(q,currentAnswered.correct);
  }
  function renderSceneQuestion(q){
    const subject=q.subject||'geography';
    activateScene({subject});

    const total=Math.max(1,sessionQuestions.length);
    const position=Math.max(0,Math.min(total,qIndex+1));
    progressBar.style.width=(qIndex/total*100)+'%';
    const progress=progressBar.parentElement;
    progress.setAttribute('role','progressbar');
    progress.setAttribute('aria-label','Fullførte oppgaver');
    progress.setAttribute('aria-valuemin','0');
    progress.setAttribute('aria-valuemax',String(total));
    progress.setAttribute('aria-valuenow',String(qIndex));
    countLabel.textContent='Oppdrag '+position+' av '+total;
    countLabel.setAttribute('aria-live','polite');

    const wrap=document.getElementById('question-wrap');
    if(!wrap)return;
    wrap.classList.add('task-scene-wrap');

    const gradeLabel=GRADE_CONFIG[currentGrade()]?.label||currentGrade()+'. klasse';
    const prompt=cleanPrompt(q);
    const mode=cardMode(q);
    const layout=answerLayout(q);
    // Only replace an exact single object. Counting groups and flags retain their meaning.
    const artwork=q.answer==='EPLER'&&q.visual==='🍎'?'apples':objectArt[String(q.visual||'').trim()];
    const imageSource=q.visual==='🦊'?'./lia-fox-explorer-home.webp':artwork?'./task-'+artwork+'-v21.webp':null;
    const visual=q.visual
      ? '<div class="task-visual-row"><div class="task-object-stage">'+(imageSource?'<img class="task-object-art" src="'+imageSource+'" alt="'+attr(q.visual)+'">':'<div class="big-flag" aria-hidden="true">'+text(q.visual)+'</div>')+'</div></div>'
      : '';
    const passage=q.passage?'<div class="learning-passage">'+text(q.passage)+'</div>':'';
    const readButton=readAloudButton(q);

    wrap.innerHTML=
      '<article class="laria-task-card '+mode+' '+layout+' '+taskTypeClass(q)+'" style="--answer-count:'+Math.min(3,q.options?.length||3)+'">'+
        '<div class="task-world-chip">'+text(sceneName(subject))+'</div>'+
        '<div class="task-card-head"><div class="qtype">'+subjectName(subject)+' · '+text(String(gradeLabel).toUpperCase())+'</div>'+readButton+'</div>'+
        '<div class="question">'+text(prompt)+'</div>'+
        passage+
        visual+
        '<div class="task-fox-companion" aria-hidden="true"><img src="'+attr(foxSource())+'" alt=""></div>'+
        '<div class="task-interaction">'+interactionMarkup(q)+'</div>'+
        '<div class="feedback" id="feedback"><strong id="feedback-title"></strong><p id="feedback-copy"></p></div>'+
        '<button class="primary next" id="next-question" type="button">'+(q.subject==='english'?'Next':'Neste')+'</button>'+
      '</article>';

    bindInteraction(q,wrap);
    const next=wrap.querySelector('#next-question');
    if(next)next.onclick=nextQuestion;
    bindReadAloud(q);
    restoreAnswered(q,wrap);
  }

  renderQuestion=function(){
    const q=sessionQuestions[qIndex];
    if(q&&sceneSubjects.has(q.subject||'geography'))return renderSceneQuestion(q);
    clearScene();
    return baseRenderQuestion();
  };

  const syncOpenState=()=>{
    const open=screen.classList.contains('active')&&screen.classList.contains('task-scene');
    document.body.classList.toggle('laria-task-scene-open',open);
    if(!open&&screen.classList.contains('task-scene')===false){
      closeButton.textContent='×';
      closeButton.setAttribute('aria-label','Avslutt');
    }
  };
  const observer=new MutationObserver(syncOpenState);
  observer.observe(screen,{attributes:true,attributeFilter:['class']});
  syncOpenState();
})();
