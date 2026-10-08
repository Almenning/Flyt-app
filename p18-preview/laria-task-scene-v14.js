/* Læria Oppgavescene v14
   Uses existing learning/session logic; replaces only the presentation for Norwegian and English. */
(function(){
  'use strict';

  if(typeof renderQuestion!=='function')return;

  const baseRenderQuestion=renderQuestion;
  const sceneSubjects=new Set(['norwegian','english']);
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
    return subject==='english'?'Ordlandsbyen':'Bokskogen';
  }
  function subjectName(subject){
    return subject==='english'?'ENGLISH':'NORSK';
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
    closeButton.innerHTML='<span aria-hidden="true">‹</span><span>Hjem</span>';
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
    if(q.type==='build-word')renderBuildWord(q,wrap);
    else if(q.type==='sentence-order')renderSentenceOrder(q,wrap);
    else if(q.type==='number-input')renderNumberInput(q,wrap);
    else if(q.type==='sequence-order')renderSequenceOrder(q,wrap);
    else wrap.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answerLearningChoice(b.dataset.answer));
  }
  function restoreAnswered(q,wrap){
    if(!currentAnswered)return;
    if(q.type==='learning-choice'){
      wrap.querySelectorAll('.answer').forEach(b=>{
        b.disabled=true;
        if(b.dataset.answer===String(q.answer))b.classList.add('correct');
        else if(b.dataset.answer===String(currentAnswered.selected))b.classList.add('wrong');
      });
    }
    const input=wrap.querySelector('#math-input');
    if(input){input.value=currentAnswered.selected??'';input.disabled=true}
    wrap.querySelectorAll('#check-number,#check-sequence').forEach(b=>b.disabled=true);
    showLearningFeedback(q,currentAnswered.correct);
  }
  function renderSceneQuestion(q){
    activateScene(q);

    const total=Math.max(1,sessionQuestions.length);
    const position=Math.max(0,Math.min(total,qIndex+1));
    progressBar.style.width=(qIndex/total*100)+'%';
    countLabel.textContent='Oppdrag '+position+' av '+total;

    const wrap=document.getElementById('question-wrap');
    if(!wrap)return;
    wrap.classList.add('task-scene-wrap');

    const gradeLabel=GRADE_CONFIG[currentGrade()]?.label||currentGrade()+'. klasse';
    const prompt=cleanPrompt(q);
    const mode=cardMode(q);
    const layout=answerLayout(q);
    const visual=q.visual
      ? '<div class="task-visual-row"><div class="task-object-stage"><div class="big-flag" aria-hidden="true">'+text(q.visual)+'</div></div></div>'
      : '';
    const passage=q.passage?'<div class="learning-passage">'+text(q.passage)+'</div>':'';
    const readButton=readAloudButton(q);

    wrap.innerHTML=
      '<article class="laria-task-card '+mode+' '+layout+' '+taskTypeClass(q)+'">'+
        '<div class="task-world-chip">'+text(sceneName(q.subject))+'</div>'+
        '<div class="task-card-head"><div class="qtype">'+subjectName(q.subject)+' · '+text(String(gradeLabel).toUpperCase())+'</div>'+readButton+'</div>'+
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
    if(q&&sceneSubjects.has(q.subject))return renderSceneQuestion(q);
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
