/* Læria Oppgavescene v15
   Uses existing learning/session logic; unifies Norwegian, English, Math and Geography tasks. */
(function(){
  'use strict';

  if(typeof renderQuestion!=='function')return;

  const baseRenderQuestion=renderQuestion;
  const sceneSubjects=new Set(['norwegian','english','math','geography']);
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
    return subject==='english'?'Ordlandsbyen':subject==='math'?'Tallriket':subject==='geography'?'Oppdagelsesriket':'Bokskogen';
  }
  function subjectName(subject){
    return subject==='english'?'ENGLISH':subject==='math'?'MATTE':subject==='geography'?'GEOGRAFI':'NORSK';
  }
  function taskSubject(q){
    if(q?.subject)return q.subject;
    const geoTypes=new Set(['flag','capital','country','continent','map']);
    if(q&&(q.k||geoTypes.has(q.type)))return 'geography';
    return null;
  }
  function foxChoice(){
    try{return (typeof state!=='undefined'&&state?.profile?.avatar==='girl')?'girl':'boy'}catch(_){return 'boy'}
  }
  function foxSource(){
    // Onboarding portraits may contain baked backgrounds. The task companion is world art, not a profile thumbnail.
    return './lia-fox-explorer.webp';
  }

  const PREMIUM_VISUAL_KEYS=Object.freeze(['🏠','🐱','🐶','📘','🍎','🚗','⛵','🌳','☀️','🌙','🐟','⚽']);
  window.LARIA_TASK_PREMIUM_VISUALS=PREMIUM_VISUAL_KEYS.slice();

  function premiumIllustrationSvg(visual){
    const common='<ellipse cx="130" cy="158" rx="78" ry="12" fill="rgba(78,92,65,.12)"/>';
    const art={
      '🏠':'<svg class="task-illustration task-illustration-house" viewBox="0 0 460 300" aria-hidden="true"><defs><linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FFF0B5"/><stop offset=".55" stop-color="#F0C875"/><stop offset="1" stop-color="#DDA85D"/></linearGradient><linearGradient id="hr" x1=".1" y1=".1" x2=".9" y2="1"><stop stop-color="#B9633E"/><stop offset=".55" stop-color="#934B34"/><stop offset="1" stop-color="#6E382B"/></linearGradient><linearGradient id="tree" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#9DC871"/><stop offset=".55" stop-color="#6FA254"/><stop offset="1" stop-color="#4F7E42"/></linearGradient><linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#A7C977"/><stop offset="1" stop-color="#6D9A50"/></linearGradient></defs><ellipse cx="230" cy="262" rx="158" ry="20" fill="rgba(76,79,54,.13)"/><path d="M52 250q31-35 77-14 35-33 72-6 35-28 72-3 42-30 89 5 26-13 49 18z" fill="url(#grass)"/><path d="M91 247q10-27 29-15 11-22 30-3 12-19 31 8" fill="#6E9E54"/><path d="M316 242q12-26 31-11 12-17 27-4 13-14 30 12" fill="#6A984F"/><g fill="#F0A37F"><circle cx="104" cy="240" r="5"/><circle cx="129" cy="247" r="4"/><circle cx="351" cy="239" r="5"/><circle cx="379" cy="247" r="4"/></g><g fill="#F2D369"><circle cx="116" cy="234" r="4"/><circle cx="145" cy="242" r="4"/><circle cx="337" cy="245" r="4"/></g><path d="M325 205h70v36h-70z" fill="#F4E7C8" opacity=".95"/><path d="M325 208v38M348 208v38M372 208v38M395 208v38" stroke="#B68C58" stroke-width="4"/><path d="M322 207h77M322 231h77" stroke="#B68C58" stroke-width="4"/><path d="M156 118L238 58l89 64v117H156z" fill="url(#hw)" stroke="#7A4933" stroke-width="7" stroke-linejoin="round"/><path d="M137 126L238 44l107 81" fill="none" stroke="url(#hr)" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/><path d="M302 72v49h28V91z" fill="#8F513A" stroke="#6E402F" stroke-width="6"/><path d="M299 68q-3-18 11-26 7-4 8-13" fill="none" stroke="#D8C7B6" stroke-width="9" stroke-linecap="round" opacity=".8"/><path d="M218 176h47v63h-47z" fill="#A9633E" stroke="#72422F" stroke-width="6"/><path d="M228 180q14-11 28 0" fill="none" stroke="#C8875D" stroke-width="4"/><circle cx="256" cy="207" r="4" fill="#F2D277"/><g stroke="#6B4A38" stroke-width="5"><rect x="177" y="153" width="34" height="36" rx="3" fill="#A7DCE8"/><path d="M194 153v36M177 171h34"/><rect x="280" y="153" width="34" height="36" rx="3" fill="#A7DCE8"/><path d="M297 153v36M280 171h34"/></g><path d="M204 239q25-26 51 0" fill="#D5BC85"/><path d="M211 236q-11 10-27 22h117q-17-14-34-22z" fill="#D8C192"/><g fill="#B9A06E"><ellipse cx="205" cy="251" rx="12" ry="6"/><ellipse cx="238" cy="246" rx="14" ry="7"/><ellipse cx="274" cy="253" rx="13" ry="6"/></g><path d="M107 121q-18-36 8-66 22-27 56-9 33-15 52 13-5 32-29 49-27 18-87 13z" fill="url(#tree)" stroke="#4E7742" stroke-width="6"/><path d="M151 103v126" stroke="#7D5335" stroke-width="15" stroke-linecap="round"/><path d="M149 149q-25 22-44 42M153 151q24 22 41 41" stroke="#6E492F" stroke-width="6" stroke-linecap="round"/><g fill="#F2C85D"><circle cx="124" cy="77" r="6"/><circle cx="160" cy="61" r="5"/></g><path d="M126 230q14-21 31-7 13-19 29-2" fill="#77A65C" stroke="#567F49" stroke-width="5" stroke-linecap="round"/><path d="M290 231q14-22 31-7 12-18 30-2" fill="#73A158" stroke="#547B47" stroke-width="5" stroke-linecap="round"/><g fill="#E47C6C"><circle cx="139" cy="230" r="5"/><circle cx="165" cy="235" r="4"/><circle cx="309" cy="232" r="5"/><circle cx="334" cy="237" r="4"/></g><g fill="#FFF1D3" opacity=".95"><ellipse cx="71" cy="91" rx="31" ry="12"/><ellipse cx="97" cy="88" rx="24" ry="10"/><ellipse cx="372" cy="83" rx="29" ry="11"/><ellipse cx="397" cy="87" rx="20" ry="9"/></g></svg>',
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
    const key=String(q.visual).trim();
    const premium=premiumIllustrationSvg(key);
    if(premium){
      return '<div class="task-visual-row premium-visual" data-task-visual-kind="premium" data-task-visual-release="illustrations-rc1" data-task-visual-key="'+attr(key)+'"><div class="task-object-stage">'+premium+'</div></div>';
    }
    return '<div class="task-visual-row" data-task-visual-kind="fallback" data-task-visual-key="'+attr(key)+'"><div class="task-object-stage"><div class="task-emoji-sticker" aria-hidden="true">'+text(q.visual)+'</div></div></div>';
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
  function activateScene(q,subject=taskSubject(q)){
    screen.classList.add('task-scene');
    screen.dataset.taskSubject=subject;
    screen.dataset.taskBand=taskBand();
    screen.dataset.taskSceneVersion='15';
    screen.dataset.taskSceneRelease='task-rc1';
    screen.dataset.taskIllustrationRelease='illustrations-rc1';
    document.body.classList.add('laria-task-scene-open');
    closeButton.innerHTML='<span aria-hidden="true">‹</span><span>Hjem</span>';
    closeButton.setAttribute('aria-label','Tilbake til faget');
  }
  function clearScene(){
    screen.classList.remove('task-scene');
    delete screen.dataset.taskSubject;
    delete screen.dataset.taskBand;
    delete screen.dataset.taskSceneVersion;
    delete screen.dataset.taskSceneRelease;
    delete screen.dataset.taskIllustrationRelease;
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

  function geographyInteractionMarkup(q){
    if(q.type==='map'){
      const region=q.mapRegion||(typeof countries!=='undefined'&&countries[q.k]?countries[q.k].continent:'Verden');
      return '<div class="map-region">🗺️ '+text(region)+'</div><div class="map quiz-real-map" id="quiz-map"><canvas id="quiz-map-canvas" aria-label="Kart over '+attr(region)+'"></canvas></div>';
    }
    const options=Array.isArray(q.options)?q.options:[];
    return '<div class="answers">'+options.map(o=>'<button class="answer" data-answer="'+attr(o)+'">'+text(o)+'</button>').join('')+'</div>';
  }
  function bindGeographyInteraction(q,wrap){
    if(q.type==='map')requestAnimationFrame(()=>renderQuizMap(q,currentAnswered));
    else wrap.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answerText(b.dataset.answer));
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

  function restoreGeographyAnswered(q){
    if(!currentAnswered)return;
    applyAnsweredState(q,currentAnswered);
  }

  function renderSceneQuestion(q){
    const subject=taskSubject(q);
    activateScene(q,subject);

    const total=Math.max(1,sessionQuestions.length);
    const position=Math.max(0,Math.min(total,qIndex+1));
    progressBar.style.width=(position/total*100)+'%';
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
        '<div class="task-world-chip">'+text(sceneName(subject))+'</div>'+
        '<div class="task-card-head"><div class="qtype">'+subjectName(subject)+' · '+text(String(gradeLabel).toUpperCase())+'</div>'+readButton+'</div>'+
        '<div class="question">'+text(prompt)+'</div>'+
        passage+
        visual+
        '<div class="task-fox-companion" data-avatar="'+foxChoice()+'" aria-hidden="true"><img src="'+attr(foxSource())+'" alt=""></div>'+
        '<div class="task-interaction">'+(subject==='geography'?geographyInteractionMarkup(q):interactionMarkup(q))+'</div>'+
        '<div class="feedback" id="feedback"><strong id="feedback-title"></strong><p id="feedback-copy"></p></div>'+
        '<button class="primary next" id="next-question" type="button">'+(subject==='english'?'Next':'Neste')+'</button>'+
      '</article>';

    if(subject==='geography')bindGeographyInteraction(q,wrap);
    else bindInteraction(q,wrap);
    const next=wrap.querySelector('#next-question');
    if(next)next.onclick=nextQuestion;
    bindReadAloud(q);
    if(subject==='geography')restoreGeographyAnswered(q);
    else restoreAnswered(q,wrap);
  }

  renderQuestion=function(){
    const q=sessionQuestions[qIndex],subject=taskSubject(q);
    if(q&&sceneSubjects.has(subject))return renderSceneQuestion(q);
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
