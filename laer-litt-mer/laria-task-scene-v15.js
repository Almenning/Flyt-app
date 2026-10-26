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
    if(Number(currentGrade())<=2){
      return subject==='english'?'Ordlandsbyen':subject==='math'?'Tallvika':subject==='geography'?'Nordlysleiren':'Eggenipa';
    }
    return subject==='english'?'Ordlandsbyen':subject==='math'?'Tallriket':subject==='geography'?'Oppdagelsesriket':'Eggenipa';
  }
  function subjectName(subject){
    return subject==='english'?'ENGELSK':subject==='math'?'MATTE':subject==='geography'?'GEOGRAFI':'NORSK';
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
  function foxSource(){return window.LARIA_FOX.source(foxChoice());}
  // Norsk uses a neutral helper until the separately approved TrollActor exists.
  // The shared fox-presence engine deliberately does not own this symbol, so
  // successful answers must trigger its one short reaction here instead.
  function reactNorskGuide(){
    const guide=document.querySelector('#session-screen.task-scene[data-task-subject="norwegian"] .task-norsk-guide');
    if(!guide)return;
    guide.classList.remove('fox-correct');
    void guide.offsetWidth;
    guide.classList.add('fox-correct');
    window.setTimeout(()=>guide.classList.remove('fox-correct'),620);
  }
  function bindNorskGuideReaction(interaction){
    if(!interaction||interaction.dataset.norskGuideReactionBound==='true')return;
    interaction.dataset.norskGuideReactionBound='true';
    // The interaction node is replaced on every question, unlike #question-wrap.
    // Suppress duplicate celebration within one question, but reset for the next.
    let celebrated=false;
    interaction.addEventListener('click',event=>{
      if(celebrated||!event.target.closest?.('button,[role="button"]'))return;
      // The answer handler updates currentAnswered before the click bubbles.
      // Read aloud, navigation and taps outside answer controls do not trigger.
      if(typeof currentAnswered!=='undefined'&&currentAnswered?.correct===true){
        celebrated=true;
        reactNorskGuide();
      }
    });
  }

  const PREMIUM_VISUAL_KEYS=Object.freeze(['🏠','🐱','🐶','📘','🍎','🚗','⛵','🌳','☀️','🌙','🐟','⚽']);
  window.LARIA_TASK_PREMIUM_VISUALS=PREMIUM_VISUAL_KEYS.slice();

  function premiumIllustrationSvg(visual){
    const common='<ellipse cx="130" cy="158" rx="78" ry="12" fill="rgba(78,92,65,.12)"/>';
    const art={
      '🏠':'<svg class="task-illustration task-illustration-house" viewBox="0 0 460 300" aria-hidden="true"><defs><linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FFF0B5"/><stop offset=".55" stop-color="#F0C875"/><stop offset="1" stop-color="#DDA85D"/></linearGradient><linearGradient id="hr" x1=".1" y1=".1" x2=".9" y2="1"><stop stop-color="#B9633E"/><stop offset=".55" stop-color="#934B34"/><stop offset="1" stop-color="#6E382B"/></linearGradient><linearGradient id="tree" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#9DC871"/><stop offset=".55" stop-color="#6FA254"/><stop offset="1" stop-color="#4F7E42"/></linearGradient><linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#A7C977"/><stop offset="1" stop-color="#6D9A50"/></linearGradient></defs><ellipse cx="230" cy="262" rx="158" ry="20" fill="rgba(76,79,54,.13)"/><path d="M52 250q31-35 77-14 35-33 72-6 35-28 72-3 42-30 89 5 26-13 49 18z" fill="url(#grass)"/><path d="M91 247q10-27 29-15 11-22 30-3 12-19 31 8" fill="#6E9E54"/><path d="M316 242q12-26 31-11 12-17 27-4 13-14 30 12" fill="#6A984F"/><g fill="#F0A37F"><circle cx="104" cy="240" r="5"/><circle cx="129" cy="247" r="4"/><circle cx="351" cy="239" r="5"/><circle cx="379" cy="247" r="4"/></g><g fill="#F2D369"><circle cx="116" cy="234" r="4"/><circle cx="145" cy="242" r="4"/><circle cx="337" cy="245" r="4"/></g><path d="M325 205h70v36h-70z" fill="#F4E7C8" opacity=".95"/><path d="M325 208v38M348 208v38M372 208v38M395 208v38" stroke="#B68C58" stroke-width="4"/><path d="M322 207h77M322 231h77" stroke="#B68C58" stroke-width="4"/><path d="M156 118L238 58l89 64v117H156z" fill="url(#hw)" stroke="#7A4933" stroke-width="7" stroke-linejoin="round"/><path d="M137 126L238 44l107 81" fill="none" stroke="url(#hr)" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/><path d="M302 72v49h28V91z" fill="#8F513A" stroke="#6E402F" stroke-width="6"/><path d="M299 68q-3-18 11-26 7-4 8-13" fill="none" stroke="#D8C7B6" stroke-width="9" stroke-linecap="round" opacity=".8"/><path d="M218 176h47v63h-47z" fill="#A9633E" stroke="#72422F" stroke-width="6"/><path d="M228 180q14-11 28 0" fill="none" stroke="#C8875D" stroke-width="4"/><circle cx="256" cy="207" r="4" fill="#F2D277"/><g stroke="#6B4A38" stroke-width="5"><rect x="177" y="153" width="34" height="36" rx="3" fill="#A7DCE8"/><path d="M194 153v36M177 171h34"/><rect x="280" y="153" width="34" height="36" rx="3" fill="#A7DCE8"/><path d="M297 153v36M280 171h34"/></g><path d="M204 239q25-26 51 0" fill="#D5BC85"/><path d="M211 236q-11 10-27 22h117q-17-14-34-22z" fill="#D8C192"/><g fill="#B9A06E"><ellipse cx="205" cy="251" rx="12" ry="6"/><ellipse cx="238" cy="246" rx="14" ry="7"/><ellipse cx="274" cy="253" rx="13" ry="6"/></g><path d="M107 121q-18-36 8-66 22-27 56-9 33-15 52 13-5 32-29 49-27 18-87 13z" fill="url(#tree)" stroke="#4E7742" stroke-width="6"/><path d="M151 103v126" stroke="#7D5335" stroke-width="15" stroke-linecap="round"/><path d="M149 149q-25 22-44 42M153 151q24 22 41 41" stroke="#6E492F" stroke-width="6" stroke-linecap="round"/><g fill="#F2C85D"><circle cx="124" cy="77" r="6"/><circle cx="160" cy="61" r="5"/></g><path d="M126 230q14-21 31-7 13-19 29-2" fill="#77A65C" stroke="#567F49" stroke-width="5" stroke-linecap="round"/><path d="M290 231q14-22 31-7 12-18 30-2" fill="#73A158" stroke="#547B47" stroke-width="5" stroke-linecap="round"/><g fill="#E47C6C"><circle cx="139" cy="230" r="5"/><circle cx="165" cy="235" r="4"/><circle cx="309" cy="232" r="5"/><circle cx="334" cy="237" r="4"/></g><g fill="#FFF1D3" opacity=".95"><ellipse cx="71" cy="91" rx="31" ry="12"/><ellipse cx="97" cy="88" rx="24" ry="10"/><ellipse cx="372" cy="83" rx="29" ry="11"/><ellipse cx="397" cy="87" rx="20" ry="9"/></g></svg>',
      '🐱':'<svg class="task-illustration" viewBox="0 0 260 180" aria-hidden="true">'+common+'<path d="M89 80l11-31 25 20 28-18 9 31" fill="#D88A4D" stroke="#75462E" stroke-width="6" stroke-linejoin="round"/><ellipse cx="128" cy="103" rx="49" ry="44" fill="#E99A55" stroke="#75462E" stroke-width="6"/><path d="M104 101h1M151 101h1" stroke="#2F3940" stroke-width="7" stroke-linecap="round"/><path d="M125 113q5 6 10 0M130 116v9" fill="none" stroke="#75462E" stroke-width="4" stroke-linecap="round"/><path d="M83 113H54M88 122H59M174 113h29M170 122h29" stroke="#75462E" stroke-width="3" stroke-linecap="round"/><path d="M162 132q36 8 28-22" fill="none" stroke="#D88A4D" stroke-width="12" stroke-linecap="round"/></svg>',
      '🐶':'<svg class="task-illustration task-illustration-dog" viewBox="0 0 260 180" aria-hidden="true">'+common+
        '<path d="M78 111Q55 113 52 92Q49 83 55 75" fill="none" stroke="#98653D" stroke-width="13" stroke-linecap="round" data-dog-detail="curved-tail"/>'+
        '<path d="M78 112Q73 96 85 87Q96 78 113 83Q145 90 162 117L171 151Q170 165 152 165H86Q72 157 78 141Z" fill="#C78F59" stroke="#805139" stroke-width="5" stroke-linejoin="round"/>'+
        '<path d="M89 91Q110 85 126 101Q126 127 94 134Q80 124 89 91Z" fill="#E3B583" opacity=".9"/>'+
        '<path d="M89 123Q72 124 70 152Q70 165 86 166H100L106 151Q87 148 91 137Z" fill="#A9744A" stroke="#805139" stroke-width="4" stroke-linejoin="round"/>'+
        '<g data-dog-detail="paws" stroke="#805139" stroke-width="4" stroke-linecap="round"><path d="M125 132L125 160Q125 168 110 168Q100 168 105 158L111 137Z" fill="#D7A16A"/><path d="M141 121L155 125L160 158Q162 168 148 168Q135 167 136 156Z" fill="#E4B884"/></g>'+
        '<path d="M132 113Q146 118 160 116L170 130Q153 143 130 127Z" fill="#558878" stroke="#36685D" stroke-width="3" stroke-linejoin="round" data-dog-detail="collar"/>'+
        '<circle cx="153" cy="135" r="7" fill="#EFD17C" stroke="#A4763D" stroke-width="2"/>'+
        '<path d="M132 84Q140 55 160 52Q185 46 199 69Q204 76 203 92Q220 98 228 110Q235 120 218 128Q199 136 182 123Q168 138 150 127Q129 115 132 84Z" fill="#DEA86F" stroke="#815237" stroke-width="5" stroke-linejoin="round"/>'+
        '<path d="M148 67Q128 60 127 83Q123 109 132 131Q140 143 152 131Q160 118 156 86Z" fill="#915B3C" stroke="#72462F" stroke-width="4" stroke-linejoin="round" data-dog-detail="floppy-ear"/>'+
        '<path d="M137 84Q134 108 139 118" fill="none" stroke="#B77D52" stroke-width="6" stroke-linecap="round"/>'+
        '<ellipse cx="181" cy="86" rx="5" ry="5.5" fill="#2F3A3A"/><circle cx="179.5" cy="84" r="1.8" fill="#FFF7E7"/>'+
        '<path d="M185 96Q201 94 222 103Q235 110 228 120Q219 132 198 129Q185 125 182 113Z" fill="#F9E6CA" stroke="#BD8A66" stroke-width="3" data-dog-detail="long-muzzle"/>'+
        '<ellipse cx="224" cy="107" rx="8" ry="6" fill="#403B37"/>'+
        '<path d="M220 117Q210 123 201 120" fill="none" stroke="#8C5C49" stroke-width="3" stroke-linecap="round"/>'+
        '<path d="M205 122Q209 130 217 122L216 132Q210 141 206 131Z" fill="#D8797D" stroke="#AF6264" stroke-width="2"/>'+
        '<path d="M163 72Q175 62 186 67" fill="none" stroke="#F4CB93" stroke-width="5" stroke-linecap="round" opacity=".65"/></svg>',
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

  // Keep the persisted question model intact; only change the young child's interaction.
  function youngMathChoices(q){
    if(q?.subject!=='math'||q.type!=='number-input'||Number(currentGrade())>2)return null;
    const correct=Number(String(q.answer).trim().replace(',','.'));
    if(!Number.isFinite(correct)||correct<0||!Number.isInteger(correct))return null;
    const candidates=[];
    if(q.skill==='place-value'){
      const match=String(q.prompt).match(/verdien til\s+(\d+)\s+i tallet\s+(\d+)/i);
      if(match){
        const digit=Number(match[1]),whole=Number(match[2]);
        candidates.push(digit,whole,whole%10,digit*10+10);
      }
    }
    if(q.skill==='number-order'){
      const match=String(q.prompt).match(/hvilket tall er størst av\s+([\d,\s]+)\?/i);
      if(match){
        const listed=(match[1].match(/\d+/g)||[]).map(Number);
        // A "which of these numbers" problem must not offer invented, larger numbers.
        if(listed.includes(correct))candidates.push(...listed.filter(n=>n!==correct));
      }
    }
    candidates.push(correct+10,Math.max(0,correct-10),correct+1,Math.max(0,correct-1),correct+2);
    const pool=[String(correct)];
    for(const n of candidates){
      if(Number.isInteger(n)&&n>=0&&!pool.includes(String(n)))pool.push(String(n));
      if(pool.length===3)break;
    }
    if(pool.length<3)return null;
    // Stable order across rerenders/resume, with a varied correct position.
    const hash=Array.from(String(q.prompt)).reduce((h,ch)=>(Math.imul(h,31)+ch.charCodeAt(0))>>>0,0);
    const rightIndex=hash%3;
    const others=pool.slice(1,3);
    others.splice(rightIndex,0,pool[0]);
    return others;
  }
  function youngMathChoice(q){return youngMathChoices(q)!==null}
  function youngMathChoiceMarkup(q){
    const choices=youngMathChoices(q);
    return '<div class="answers young-math-answers" role="group" aria-label="Velg riktig tall">'+choices.map(value=>
      '<button type="button" class="answer young-math-option" data-answer="'+attr(value)+'">'+text(value)+'</button>'
    ).join('')+'</div>';
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
    screen.dataset.taskFoxRelease='fox-rc1';
    document.body.classList.add('laria-task-scene-open');
    const subjectNameForBack={norwegian:'Norsk',math:'Matte',english:'Engelsk',geography:'Geografi'}[subject]||'faget';
    closeButton.innerHTML='<span aria-hidden="true">‹</span><span>Tilbake</span>';
    closeButton.setAttribute('aria-label','Tilbake til '+subjectNameForBack);
  }
  function clearScene(){
    screen.classList.remove('task-scene');
    delete screen.dataset.taskSubject;
    delete screen.dataset.taskBand;
    delete screen.dataset.taskSceneVersion;
    delete screen.dataset.taskSceneRelease;
    delete screen.dataset.taskIllustrationRelease;
    delete screen.dataset.taskFoxRelease;
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
      if(youngMathChoice(q))return youngMathChoiceMarkup(q);
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
    else if(q.type==='number-input'&&!youngMathChoice(q))renderNumberInput(q,wrap);
    else if(q.type==='sequence-order')renderSequenceOrder(q,wrap);
    else wrap.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answerLearningChoice(b.dataset.answer));
  }
  function restoreAnswered(q,wrap){
    if(!currentAnswered)return;
    if(q.type==='learning-choice'||youngMathChoice(q)){
      wrap.querySelectorAll('.answer').forEach(b=>{
        b.disabled=true;
        if(b.dataset.answer===String(q.answer))b.classList.add('correct');
        else if(b.dataset.answer===String(currentAnswered.selected))b.classList.add('wrong');
      });
    }
    const input=wrap.querySelector('#math-input');
    if(input){input.value=currentAnswered.selected??'';input.disabled=true}
    wrap.querySelectorAll('#check-number,#check-sequence').forEach(b=>b.disabled=true);
    showLearningFeedback(q,currentAnswered.correct||currentAnswered.corrected);
  }

  function restoreGeographyAnswered(q){
    if(!currentAnswered)return;
    applyAnsweredState(q,currentAnswered);
  }

  // A saved session may still contain one of the old ambiguous number
  // questions. Repair that model before it is drawn or assessed.
  function normalizeLegacyYoungEnglish(q){
    if(!q||q.subject!=='english'||taskBand()!=='young')return;
    const prompt=String(q.prompt||'').trim();
    let repair;
    if(/^What is [“"]fire[”"] in English\?$/.test(prompt))
      repair={prompt:'Hva heter tallet fire på engelsk?',answer:'four',options:['four','five','three'],englishWord:'four',norwegianMeaning:'fire'};
    else if(prompt==='What is «tre» in English?')
      repair={prompt:'Hva heter tallet tre på engelsk?',answer:'three',options:['three','two','ten'],englishWord:'three',norwegianMeaning:'tre'};
    else if(/^What is [“"]seven[”"] in Norwegian\?$/.test(prompt))
      repair={prompt:'Hva betyr “seven” på norsk?',answer:'sju',options:['sju','tre','ti'],englishWord:'seven',norwegianMeaning:'sju'};
    else if(/^What is [“"]two[”"] in Norwegian\?$/.test(prompt))
      repair={prompt:'Hva betyr “two” på norsk?',answer:'to',options:['to','tolv','tre'],englishWord:'two',norwegianMeaning:'to'};
    if(repair)Object.assign(q,repair);
  }

  function renderSceneQuestion(q){
    normalizeLegacyYoungEnglish(q);
    const subject=taskSubject(q);
    activateScene(q,subject);
    // The previous question may have been scrolled on a short phone.
    // Every new question starts at the top of its own task scene.
    const scrollHost=screen.querySelector('.session');
    if(scrollHost)scrollHost.scrollTop=0;

    const total=Math.max(1,sessionQuestions.length);
    const position=Math.max(0,Math.min(total,qIndex+1));
    progressBar.style.width=(position/total*100)+'%';
    countLabel.textContent='Oppdrag '+position+' av '+total;
    const progressTrack=screen.querySelector('.session-progress');
    if(progressTrack){
      progressTrack.setAttribute('role','progressbar');
      progressTrack.setAttribute('aria-label','Fremdrift i oppdraget');
      progressTrack.setAttribute('aria-valuemin','0');
      progressTrack.setAttribute('aria-valuemax',String(total));
      progressTrack.setAttribute('aria-valuenow',String(position));
      progressTrack.setAttribute('aria-valuetext','Oppdrag '+position+' av '+total);
    }

    const wrap=document.getElementById('question-wrap');
    if(!wrap)return;
    wrap.classList.add('task-scene-wrap');

    const gradeLabel=GRADE_CONFIG[currentGrade()]?.label||currentGrade()+'. klasse';
    const prompt=cleanPrompt(q);
    const mode=cardMode(q);
    const layout=youngMathChoice(q)?'young-math-choice-layout':answerLayout(q);
    const visual=taskVisualMarkup(q);
    const passage=q.passage?'<div class="learning-passage">'+text(q.passage)+'</div>':'';
    const readButton=readAloudButton(q);
    const finalQuestion=position===total;
    const avatar=foxChoice();
    // In Norsk use a discrete symbol until the approved TrollActor is rigged.
    // Other subjects continue to use their existing selected avatar.
    const fox=subject==='norwegian'
      ?'<div class="task-norsk-guide" aria-hidden="true"><span>✦</span></div>'
      :'<div class="task-fox-companion" data-avatar="'+avatar+'" aria-hidden="true"><img src="'+attr(foxSource())+'" alt=""><span class="task-profile-marker">'+(avatar==='girl'?'✿':'✦')+'</span></div>';
    // A number-choice question has no illustration to stand beside.
    // Give the ONE selected full-body fox a real place next to the prompt,
    // not an absolutely positioned thumbnail stuck to the card's corner.
    // The wardrobe/presence engine still owns its sprite and reactions.
    const inlineFox=taskBand()==='young'&&!visual&&!passage;
    const visualWithFox=visual?'<div class="task-visual-companion-stage">'+visual+fox+'</div>':fox;
    const questionScene=inlineFox?
      '<div class="task-prompt-fox-stage"><div class="question">'+text(prompt)+'</div>'+fox+'</div>':
      '<div class="question">'+text(prompt)+'</div>'+passage+visualWithFox;

    wrap.innerHTML=
      '<article class="laria-task-card '+mode+' '+layout+' '+(inlineFox?'task-inline-fox ':'')+taskTypeClass(q)+'">'+
        '<div class="task-world-chip">'+text(sceneName(subject))+'</div>'+
        '<div class="task-card-head"><div class="qtype">'+subjectName(subject)+' · '+text(String(gradeLabel).toUpperCase())+'</div>'+readButton+'</div>'+
        questionScene+
        '<div class="task-interaction">'+(subject==='geography'?geographyInteractionMarkup(q):interactionMarkup(q))+'</div>'+
        '<div class="feedback" id="feedback" role="status" aria-live="polite" aria-atomic="true"><strong id="feedback-title"></strong><p id="feedback-copy"></p>'+(subject==='english'?'<button class="task-hear-word" id="task-hear-word" type="button" hidden aria-label="Hør engelsk uttale">🔊 Hør engelsk</button>':'')+'</div>'+
        '<button class="primary next" id="next-question" type="button" aria-label="'+(finalQuestion?'Fullfør oppdraget':'Neste oppgave')+'">'+(finalQuestion?'Fullfør':'Neste')+'</button>'+
      '</article>';

    if(subject==='geography')bindGeographyInteraction(q,wrap);
    else bindInteraction(q,wrap);
    // Other subjects are handled by LARIA_FOX_PRESENCE. Norsk has no fox.
    if(subject==='norwegian')bindNorskGuideReaction(wrap.querySelector('.task-interaction'));
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
