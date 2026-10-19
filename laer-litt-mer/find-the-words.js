/* Læria: Finn ordene. An illustrated observation game; independent of the letter-grid Ordjakt. */
(function(root){
  'use strict';
  const DOC=root.document;
  const PROGRESS_KEY='laria-find-words-v1';
  const ACTIVE_KEY='laria-find-words-active-v1';
  const OBJECTS=Object.freeze({
    sol:{label:'sol',clue:'Se opp mot den lyse himmelen.',x:84,y:8,w:13,h:18},
    tre:{label:'tre',clue:'Noe høyt med grønne blader står ved stien.',x:7,y:12,w:30,h:55},
    telt:{label:'telt',clue:'Se etter et sted å sove ved leirbålet.',x:75,y:59,w:23,h:31},
    vann:{label:'vann',clue:'Se etter det blå som glitrer mellom fjellene.',x:34,y:63,w:12,h:12},
    rev:{label:'rev',clue:'En liten skogsvenn hviler ved steinene.',x:62,y:73,w:13,h:18},
    sekk:{label:'sekk',clue:'Se ved stien, i nærheten av treet.',x:19,y:72,w:13,h:19},
    bat:{label:'båt',clue:'Noe flyter ved bryggen.',x:47,y:75,w:15,h:18},
    fugl:{label:'fugl',clue:'Noe med vinger sitter i et tre.',x:70,y:37,w:13,h:17}
  });
  const ROUNDS=[
    ['sol','tre','telt','vann','rev','sekk'],
    ['fugl','bat','tre','telt','sol','sekk'],
    ['vann','rev','fugl','bat','tre','sol']
  ];
  let active=null,overlay=null,previousFocus=null,previousOverflow='',reactionTimer=null;
  let hintStage=0,hintWord=null;

  function read(key){try{return JSON.parse(root.localStorage.getItem(key)||'null')}catch(_){return null}}
  function write(key,data){try{root.localStorage.setItem(key,JSON.stringify(data))}catch(_){}}
  function progress(){
    const data=read(PROGRESS_KEY);
    return {rounds:Number.isInteger(data?.rounds)&&data.rounds>=0?Math.min(data.rounds,99999):0};
  }
  function validActive(saved){
    return saved&&saved.version===1&&Number.isInteger(saved.round)&&saved.round>=0&&
      saved.round<ROUNDS.length&&Array.isArray(saved.found)&&
      saved.found.length<=ROUNDS[saved.round].length&&
      new Set(saved.found).size===saved.found.length&&
      saved.found.every(word=>ROUNDS[saved.round].includes(word))&&
      typeof saved.completed==='boolean'&&
      saved.completed===(saved.found.length===ROUNDS[saved.round].length);
  }
  function restore(){
    const saved=read(ACTIVE_KEY);
    active=validActive(saved)?{round:saved.round,found:new Set(saved.found),completed:saved.completed}:
      {round:progress().rounds%ROUNDS.length,found:new Set(),completed:false};
  }
  function persist(){
    write(ACTIVE_KEY,{version:1,round:active.round,found:[...active.found],completed:active.completed});
  }
  function chosenFox(){
    const api=root.LARIA_FOX;
    const choice=api?.choice?.()||'boy';
    return {choice,label:api?.label?.(choice)||'Din rev',
      source:api?.worldSource?.(choice)||'./lia-fox-explorer-home.webp'};
  }
  function words(){return ROUNDS[active.round]}
  function objectButtons(){
    return Object.entries(OBJECTS).map(([id,item])=>
      '<button type="button" class="fw-object" data-fw-object="'+id+'" aria-label="'+item.label+
      '" style="left:'+item.x+'%;top:'+item.y+'%;width:'+item.w+'%;height:'+item.h+'%">'+
      '<span class="fw-pin" aria-hidden="true">✓</span></button>').join('');
  }
  function markup(){
    const fox=chosenFox();
    return '<div class="fw-shell">'+
      '<header class="fw-top"><button type="button" class="fw-back" aria-label="Tilbake til Utforsk">←</button>'+
      '<div class="fw-title"><span class="fw-eyebrow">NORSK · BOKSKOGEN</span><h1 id="fw-title">Finn ordene</h1>'+
      '<p>Se deg rundt i bildet. Trykk på tingene du finner!</p></div>'+
      '<button type="button" class="fw-audio" aria-label="Les opp oppgaven">♪ <span>Hør</span></button></header>'+
      '<div class="fw-layout"><aside class="fw-word-panel" aria-labelledby="fw-list-title">'+
      '<div class="fw-list-heading"><div><span class="fw-tiny">SKOGENS HEMMELIGHETER</span>'+
      '<h2 id="fw-list-title">Ord å finne</h2></div><span class="fw-counter"></span></div>'+
      '<div class="fw-list" role="list"></div><div class="fw-progress" aria-hidden="true"><span></span></div>'+
      '<p class="fw-list-foot">Trykk på et ord for å høre det.</p></aside>'+
      '<div class="fw-stage"><div class="fw-stage-label">Et eventyr i Bokskogen <span aria-hidden="true">✦</span></div>'+
      '<div class="fw-art" role="group" aria-label="Eventyrbilde med ting du kan finne">'+
      '<img src="./find-the-words-scene.svg?v=20261018-a" class="fw-scene-image" alt="Illustrert skog med vann, telt, sol og mange små oppdagelser" draggable="false">'+
      objectButtons()+'<div class="fw-celebration" hidden aria-hidden="true">✦ ✧ ✦</div></div>'+
      '<div class="fw-scene-bottom"><span class="fw-scenery-caption">Ta deg god tid. Det er mye å oppdage!</span>'+
      '<button type="button" class="fw-hint">💡 Vis meg et hint</button></div></div></div>'+
      '<footer class="fw-bottom"><div class="fw-companion" data-mood="idle">'+
      '<button type="button" class="fw-fox-button" aria-label="Spør reven om et hint"><img class="fw-fox" src="'+fox.source+'" alt="'+fox.label+'" draggable="false"></button>'+ 
      '<div class="fw-speech" role="status" aria-live="polite">Jeg blir med! Hva vil du finne først?</div></div>'+
      '<div class="fw-controls"><button type="button" class="fw-next">Ny ordjakt <span aria-hidden="true">↗</span></button>'+
      '<button type="button" class="fw-repeat">Hør oppgaven</button></div></footer></div>';
  }
  function refresh(){
    if(!overlay||!active)return;
    const all=words();
    overlay.querySelector('.fw-list').innerHTML=all.map(word=>{
      const item=OBJECTS[word],found=active.found.has(word);
      return '<div class="fw-list-item" role="listitem"><button type="button" class="fw-word'+
        (found?' is-found':'')+'" data-fw-read="'+word+'" aria-label="'+item.label+(found?', funnet':'')+'">'+
        '<span class="fw-word-icon" aria-hidden="true">'+({sol:'☀️',tre:'🌳',telt:'⛺',vann:'💧',rev:'🦊',sekk:'🎒',bat:'⛵',fugl:'🐦'}[word])+
        '</span><strong>'+item.label+'</strong><span class="fw-word-check" aria-hidden="true">'+(found?'✓':'◦')+
        '</span></button></div>';
    }).join('');
    overlay.querySelector('.fw-counter').textContent=active.found.size+' / '+all.length;
    overlay.querySelector('.fw-progress span').style.width=(active.found.size/all.length*100)+'%';
    overlay.querySelectorAll('[data-fw-object]').forEach(button=>{
      const found=active.found.has(button.dataset.fwObject);
      button.classList.toggle('is-found',found);
      button.classList.remove('is-hint');
      button.setAttribute('aria-pressed',String(found));
    });
    const next=overlay.querySelector('.fw-next');
    next.textContent=active.completed?'Oppdag på nytt ↗':'Ny ordjakt ↗';
    overlay.classList.toggle('fw-complete',active.completed);
  }
  function react(mood,message){
    if(!overlay)return;
    const buddy=overlay.querySelector('.fw-companion');
    buddy.dataset.mood='idle';
    void buddy.offsetWidth;
    buddy.dataset.mood=mood;
    buddy.querySelector('.fw-speech').textContent=message;
    if(reactionTimer)root.clearTimeout(reactionTimer);
    reactionTimer=root.setTimeout(()=>{if(buddy.isConnected)buddy.dataset.mood='idle';reactionTimer=null},1050);
  }
  function say(text){
    if(!root.speechSynthesis||typeof root.SpeechSynthesisUtterance!=='function')return;
    try{
      root.speechSynthesis.cancel();
      const utterance=new root.SpeechSynthesisUtterance(text);
      utterance.lang='nb-NO';utterance.rate=.84;utterance.pitch=1.06;
      root.speechSynthesis.speak(utterance);
    }catch(_){}
  }
  function selectObject(id){
    const item=OBJECTS[id];
    if(!item||!active)return;
    if(!words().includes(id)){
      react('curious','Du oppdaget '+item.label+'! Prøv å finne et ord på listen.');
      return;
    }
    if(active.found.has(id)){
      react('curious','Den fant du allerede. Se etter noe nytt!');
      return;
    }
    active.found.add(id);
    hintStage=0;hintWord=null;
    if(active.found.size===words().length){
      active.completed=true;
      const p=progress();write(PROGRESS_KEY,{rounds:p.rounds+1});
      react('complete','Du fant alle ordene! For en oppdagelsesferd!');
      const stars=overlay.querySelector('.fw-celebration');
      stars.hidden=false;
      root.setTimeout(()=>{stars.hidden=true},1900);
    }else{
      react('celebrate','Der fant du '+item.label+'! Så fint sett!');
    }
    persist();refresh();
  }
  function hint(){
    if(!active)return;
    if(active.completed){react('celebrate','Du fant alt! Vil du gå på en ny ordjakt?');return}
    const remaining=words().filter(word=>!active.found.has(word));
    const id=hintWord&&remaining.includes(hintWord)?hintWord:remaining[0];
    if(!id)return;
    if(hintWord!==id){hintWord=id;hintStage=0}
    const item=OBJECTS[id];
    if(hintStage===0){
      react('support','Se etter '+item.label+'. '+item.clue);
      hintStage=1;
    }else{
      const hotspot=overlay.querySelector('[data-fw-object="'+id+'"]');
      hotspot?.classList.add('is-hint');
      react('support','Der er et lite spor. Kan du finne '+item.label+'?');
      hintStage=0;
    }
  }
  function nextRound(){
    const old=active?.round||0;
    active={round:(old+1)%ROUNDS.length,found:new Set(),completed:false};
    hintStage=0;hintWord=null;
    persist();refresh();
    react('greet','Nye ord å oppdage! Jeg blir med deg.');
    const first=overlay?.querySelector('.fw-word');
    first?.focus({preventScroll:true});
  }
  function onClick(event){
    const button=event.target.closest('button');
    if(!button||!overlay.contains(button))return;
    if(button.classList.contains('fw-back')){close();return}
    if(button.classList.contains('fw-hint')||button.classList.contains('fw-fox-button')){hint();return}
    if(button.classList.contains('fw-next')){nextRound();return}
    if(button.classList.contains('fw-repeat')||button.classList.contains('fw-audio')){
      say('Finn ordene. Se deg rundt i bildet, og trykk på tingene du finner.');return;
    }
    if(button.dataset.fwRead){say(OBJECTS[button.dataset.fwRead].label);return}
    if(button.dataset.fwObject){selectObject(button.dataset.fwObject)}
  }
  function onKeydown(event){
    if(event.key==='Escape'){event.preventDefault();close();return}
    if(event.key!=='Tab')return;
    const focusable=[...overlay.querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&(DOC.activeElement===first||!focusable.includes(DOC.activeElement))){
      event.preventDefault();last.focus({preventScroll:true});
    }else if(!event.shiftKey&&(DOC.activeElement===last||!focusable.includes(DOC.activeElement))){
      event.preventDefault();first.focus({preventScroll:true});
    }
  }
  function open(){
    if(!DOC||!root.LARIA_FOX)return;
    if(!overlay){
      overlay=DOC.createElement('section');overlay.id='find-the-words-overlay';
      overlay.className='fw-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','fw-title');
      DOC.body.appendChild(overlay);
      overlay.addEventListener('click',onClick);
      // Empty scenery taps get calm fox feedback; never deduct points or reveal a word.
      overlay.addEventListener('click',event=>{
        if(event.target.closest('.fw-art')&&!event.target.closest('.fw-object'))
          react('support','Se nøye etter! Prøv en av tingene fra ordlisten.');
      });
      overlay.addEventListener('keydown',onKeydown);
    }
    if(!overlay.hidden)return;
    previousFocus=DOC.activeElement;previousOverflow=DOC.documentElement.style.overflow;
    restore();
    overlay.innerHTML=markup();overlay.hidden=false;
    DOC.documentElement.style.overflow='hidden';
    refresh();react('greet','Jeg blir med! Se på ordlisten og finn tingene i bildet.');
    overlay.querySelector('.fw-back').focus({preventScroll:true});
  }
  function close(){
    if(!overlay||overlay.hidden)return;
    persist();
    overlay.hidden=true;DOC.documentElement.style.overflow=previousOverflow;
    if(reactionTimer){root.clearTimeout(reactionTimer);reactionTimer=null}
    try{root.speechSynthesis?.cancel?.()}catch(_){}
    if(typeof root.LARIA_RETURN_TO_BASECAMP==='function')root.LARIA_RETURN_TO_BASECAMP();
    const origin=previousFocus;
    previousFocus=null;previousOverflow='';
    const fallback=DOC.querySelector('.bc13-panel:not([hidden]) [data-bc13-action="find-words"]');
    const target=origin?.isConnected&&origin.getClientRects().length?origin:fallback;
    try{target?.focus?.({preventScroll:true})}catch(_){}
  }
  root.openFindTheWords=open;
  root.closeFindTheWords=close;
})(window);
