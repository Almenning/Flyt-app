/* Læria Oppgavescene v15
   Uses existing learning/session logic; replaces only the presentation for Norwegian and English. */
(function(){
  'use strict';

  if(typeof renderQuestion!=='function')return;

  const baseRenderQuestion=renderQuestion;
  const sceneSubjects=new Set(['norwegian','english','math']);
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
    return subject==='english'?'Ordlandsbyen':subject==='math'?'Tallriket':'Bokskogen';
  }
  function subjectName(subject){
    return subject==='english'?'ENGLISH':subject==='math'?'MATTE':'NORSK';
  }
  function foxSource(){
    const which=(typeof state!=='undefined'&&state?.profile?.avatar==='girl')?'girl':'boy';
    try{
      if(typeof avatarSrc==='function')return avatarSrc(which);
    }catch(_){}
    const fromProfile=window.LARIA_PROFILE_AVATARS?.[which];
    return fromProfile||'./lia-fox-explorer.webp';
  }

  function premiumIllustrationSvg(visual){
    const common='<ellipse cx="130" cy="158" rx="78" ry="12" fill="rgba(78,92,65,.12)"/>';
    const art={
      '🏠':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M55 92L130 34l75 58v58H55z" fill="#F6C66B" stroke="#80512E" stroke-width="6" stroke-linejoin="round"/><path d="M43 94L130 27l87 67" fill="none" stroke="#7E4A2B" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M111 112h38v38h-38z" fill="#A86538" stroke="#78462C" stroke-width="5"/><path d="M72 103h28v25H72zM160 103h28v25h-28z" fill="#9DDBE9" stroke="#6F5140" stroke-width="4"/><path d="M62 151q17-30 34 0M165 151q19-31 37 0" fill="#73A75D" stroke="#507A45" stroke-width="4" stroke-linecap="round"/></svg>',
      '🐱':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M89 80l11-31 25 20 28-18 9 31" fill="#D88A4D" stroke="#75462E" stroke-width="6" stroke-linejoin="round"/><ellipse cx="128" cy="103" rx="49" ry="44" fill="#E99A55" stroke="#75462E" stroke-width="6"/><path d="M104 101h1M151 101h1" stroke="#2F3940" stroke-width="7" stroke-linecap="round"/><path d="M125 113q5 6 10 0M130 116v9" fill="none" stroke="#75462E" stroke-width="4" stroke-linecap="round"/><path d="M83 113H54M88 122H59M174 113h29M170 122h29" stroke="#75462E" stroke-width="3" stroke-linecap="round"/><path d="M162 132q36 8 28-22" fill="none" stroke="#D88A4D" stroke-width="12" stroke-linecap="round"/></svg>',
      '🐶':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M91 76Q61 52 63 96q8 27 33 18M166 76q30-24 28 20-8 27-33 18" fill="#9B673E" stroke="#6A442D" stroke-width="6" stroke-linejoin="round"/><ellipse cx="129" cy="104" rx="50" ry="43" fill="#C48753" stroke="#6A442D" stroke-width="6"/><ellipse cx="130" cy="117" rx="18" ry="14" fill="#F6DFC2"/><circle cx="107" cy="101" r="5" fill="#26343B"/><circle cx="151" cy="101" r="5" fill="#26343B"/><path d="M124 113h12l-6 7z" fill="#3B3533"/><path d="M130 120q-5 9-12 5M130 120q5 9 12 5" fill="none" stroke="#6A442D" stroke-width="4" stroke-linecap="round"/></svg>',
      '🍎':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M130 63q-8-22 4-36" stroke="#6D4B2F" stroke-width="8" stroke-linecap="round"/><path d="M136 43q20-17 37-4-16 18-37 11z" fill="#68A958" stroke="#467E3D" stroke-width="4"/><path d="M129 64c-23-16-57 0-58 35-1 43 28 63 58 57 31 7 61-14 60-57-1-34-36-51-60-35z" fill="#E66856" stroke="#8C443B" stroke-width="6"/><path d="M96 78q17-12 31-4" fill="none" stroke="#F7A092" stroke-width="7" stroke-linecap="round"/></svg>',
      '📘':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M49 59q40-18 79 7v81q-40-19-79-7z" fill="#5B86D6" stroke="#334F7F" stroke-width="6" stroke-linejoin="round"/><path d="M211 59q-42-18-82 7v81q41-19 82-7z" fill="#79A0E5" stroke="#334F7F" stroke-width="6" stroke-linejoin="round"/><path d="M129 67v80" stroke="#334F7F" stroke-width="5"/><path d="M67 79q24-8 44 2M67 96q25-7 44 2M149 80q23-9 44 1M149 97q24-8 44 1" fill="none" stroke="#DCE9FF" stroke-width="5" stroke-linecap="round"/></svg>',
      '🚗':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M56 101l18-35h86l30 35 16 4v34H48v-31z" fill="#E56F58" stroke="#824437" stroke-width="6" stroke-linejoin="round"/><path d="M86 71h63l22 30H72z" fill="#A6D9E8" stroke="#724B40" stroke-width="5"/><circle cx="82" cy="139" r="17" fill="#39424A" stroke="#20272D" stroke-width="5"/><circle cx="177" cy="139" r="17" fill="#39424A" stroke="#20272D" stroke-width="5"/><circle cx="82" cy="139" r="6" fill="#C8D1D7"/><circle cx="177" cy="139" r="6" fill="#C8D1D7"/></svg>',
      '🐟':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M57 100q43-50 104-7 21-22 47-27-4 26-1 52-25-5-45-24-63 47-105 6z" fill="#68B6C7" stroke="#3D6F7D" stroke-width="6" stroke-linejoin="round"/><circle cx="95" cy="90" r="5" fill="#24343B"/><path d="M122 104q13 9 27 0" fill="none" stroke="#3D6F7D" stroke-width="4" stroke-linecap="round"/></svg>',
      '⛵':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M130 38v93" stroke="#694A34" stroke-width="7" stroke-linecap="round"/><path d="M124 48L73 116h51z" fill="#F6EFE0" stroke="#7B5A42" stroke-width="5" stroke-linejoin="round"/><path d="M138 55l51 61h-51z" fill="#E9B65B" stroke="#7B5A42" stroke-width="5" stroke-linejoin="round"/><path d="M58 128h145q-13 30-72 31-57-1-73-31z" fill="#5E9CB5" stroke="#3F6B7C" stroke-width="6" stroke-linejoin="round"/><path d="M39 158q25-11 47 0 25 11 48 0 23-10 48 0 20 8 40 0" fill="none" stroke="#8AC9D5" stroke-width="5" stroke-linecap="round"/></svg>',
      '🌳':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M118 98h25v58h-25z" fill="#8B5A36" stroke="#68432D" stroke-width="5"/><circle cx="101" cy="87" r="34" fill="#78A75F" stroke="#4F7543" stroke-width="6"/><circle cx="142" cy="74" r="39" fill="#86B66A" stroke="#4F7543" stroke-width="6"/><circle cx="164" cy="102" r="29" fill="#6F9D5A" stroke="#4F7543" stroke-width="6"/><circle cx="113" cy="112" r="27" fill="#83AE66"/></svg>',
      '⚽':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<circle cx="130" cy="101" r="57" fill="#F8F6EF" stroke="#475058" stroke-width="6"/><path d="M130 76l20 15-8 24h-24l-8-24zM89 67l14 5-8 27-22-3M171 66l-14 7 8 27 23-4M95 129l22-14 20 0 27 17M104 72l26-19 27 20" fill="#46515B" stroke="#46515B" stroke-width="3" stroke-linejoin="round"/></svg>',
      '☀️':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<g stroke="#D49A2A" stroke-width="8" stroke-linecap="round"><path d="M130 24v18M130 137v18M54 91h18M188 91h18M76 38l13 13M171 131l13 13M183 38l-13 13M89 131l-13 13"/></g><circle cx="130" cy="91" r="43" fill="#FFD968" stroke="#D49A2A" stroke-width="6"/><path d="M110 86h1M149 86h1" stroke="#735627" stroke-width="6" stroke-linecap="round"/><path d="M113 105q17 15 34 0" fill="none" stroke="#735627" stroke-width="5" stroke-linecap="round"/></svg>',
      '🌙':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M162 42q-44 14-40 55 4 40 44 48-25 23-59 6-43-21-36-69 7-47 55-58 22-5 36 18z" fill="#F2D071" stroke="#A98237" stroke-width="6" stroke-linejoin="round"/><circle cx="182" cy="58" r="6" fill="#F0B74D"/><circle cx="196" cy="83" r="4" fill="#F0B74D"/><path d="M191 111l5 9 10 2-7 7 2 10-10-5-9 5 2-10-7-7 10-2z" fill="#EFB74D"/></svg>',
      '🌼':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M130 105v48" stroke="#4E8D4B" stroke-width="8" stroke-linecap="round"/><path d="M129 130q-25-15-38 5 24 10 38 2M131 138q20-18 38-3-20 14-38 9" fill="#74A963" stroke="#4E8D4B" stroke-width="4"/><g fill="#F8F1D6" stroke="#C89A3B" stroke-width="4"><ellipse cx="130" cy="70" rx="18" ry="31"/><ellipse cx="130" cy="70" rx="18" ry="31" transform="rotate(60 130 70)"/><ellipse cx="130" cy="70" rx="18" ry="31" transform="rotate(120 130 70)"/></g><circle cx="130" cy="70" r="18" fill="#F5C74D" stroke="#C89A3B" stroke-width="4"/></svg>'
    };
    return art[visual]||'';
  }
  function taskVisualMarkup(q){
    if(!q?.visual)return '';
    const premium=premiumIllustrationSvg(String(q.visual).trim());
    if(premium){
      return '<div class="task-visual-row premium-visual"><div class="task-object-stage">'+premium+'</div></div>';
    }
    return '<div class="task-visual-row"><div class="task-object-stage"><div class="task-emoji-sticker" aria-hidden="true">'+text(q.visual)+'</div></div></div>';
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
    screen.dataset.taskSceneVersion='15';
    document.body.classList.add('laria-task-scene-open');
    closeButton.innerHTML='<span aria-hidden="true">‹</span><span>Hjem</span>';
    closeButton.setAttribute('aria-label','Tilbake til faget');
  }
  function clearScene(){
    screen.classList.remove('task-scene');
    delete screen.dataset.taskSubject;
    delete screen.dataset.taskBand;
    delete screen.dataset.taskSceneVersion;
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
    const visual=taskVisualMarkup(q);
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
