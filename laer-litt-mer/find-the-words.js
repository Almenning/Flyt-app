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
    vann:{label:'vann',clue:'Se etter det blå som glitrer mellom fjellene.',x:58,y:58,w:11,h:12},
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
  let hintStage=0,hintWord=null,selectedWord=null,wrongAttempts=0;

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
    selectedWord=typeof saved?.selected==='string'&&words().includes(saved.selected)&&
      !active.found.has(saved.selected)?saved.selected:null;
    wrongAttempts=0;
  }
  function persist(){
    write(ACTIVE_KEY,{version:1,round:active.round,found:[...active.found],completed:active.completed,selected:selectedWord});
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
      '<p>Velg et ord, og finn riktig ting i bildet!</p></div>'+
      '<button type="button" class="fw-audio" aria-label="Les opp oppgaven">♪ <span>Hør</span></button></header>'+
      '<div class="fw-layout"><aside class="fw-word-panel" aria-labelledby="fw-list-title">'+
      '<div class="fw-list-heading"><div><span class="fw-tiny">SKOGENS HEMMELIGHETER</span>'+
      '<h2 id="fw-list-title">1. Velg et ord</h2></div><span class="fw-counter"></span></div>'+
      '<div class="fw-list" role="list"></div><div class="fw-progress" aria-hidden="true"><span></span></div>'+
      '<p class="fw-list-foot">Ord du velger, blir markert. Trykk deretter på tingen i bildet.</p></aside>'+
      '<div class="fw-stage"><div class="fw-stage-label"><strong class="fw-active-target" role="status" aria-live="polite">2. Finn ordet i bildet</strong><span aria-hidden="true">✦</span></div>'+
      '<div class="fw-art" role="group" aria-label="Eventyrbilde med ting du kan finne">'+
      '<img src="./find-the-words-scene.svg?v=20261018-a" class="fw-scene-image" alt="Illustrert skog med vann, telt, sol og mange små oppdagelser" draggable="false">'+
      objectButtons()+'<div class="fw-celebration" hidden aria-hidden="true">✦ ✧ ✦</div></div>'+
      '<div class="fw-scene-bottom"><span class="fw-scenery-caption">Velg et ord fra listen for å begynne!</span>'+
      '<button type="button" class="fw-hint">💡 Vis meg et hint</button></div></div></div>'+
      '<footer class="fw-bottom"><div class="fw-companion" data-mood="idle">'+
      '<button type="button" class="fw-fox-button" aria-label="Spør reven om et hint"><img class="fw-fox" src="'+fox.source+'" alt="'+fox.label+'" draggable="false"></button>'+ 
      '<div class="fw-speech" role="status" aria-live="polite">Jeg blir med! Velg et ord, så finner vi tingen.</div></div>'+
      '<div class="fw-controls"><button type="button" class="fw-next">Ny ordjakt <span aria-hidden="true">↗</span></button>'+
      '<button type="button" class="fw-repeat">Hør oppgaven</button></div></footer></div>';
  }
  function refresh(){
    if(!overlay||!active)return;
    const all=words();
    overlay.querySelector('.fw-list').innerHTML=all.map(word=>{
      const item=OBJECTS[word],found=active.found.has(word),selected=selectedWord===word;
      return '<div class="fw-list-item" role="listitem"><button type="button" class="fw-word'+
        (found?' is-found':'')+(selected?' is-selected':'')+'" data-fw-read="'+word+'" aria-pressed="'+selected+
        '" aria-label="'+item.label+(found?', allerede funnet':selected?', valgt, finn i bildet':', velg for å lete')+'">'+
        '<span class="fw-word-icon" aria-hidden="true">'+({sol:'☀️',tre:'🌳',telt:'⛺',vann:'💧',rev:'🦊',sekk:'🎒',bat:'⛵',fugl:'🐦'}[word])+
        '</span><strong>'+item.label+'</strong><span class="fw-word-check" aria-hidden="true">'+(found?'✓':'◦')+
        '</span></button></div>';
    }).join('');
    overlay.querySelector('.fw-counter').textContent=active.found.size+' / '+all.length;
    const goal=overlay.querySelector('.fw-active-target');
    const footer=overlay.querySelector('.fw-scenery-caption');
    const label=selectedWord?OBJECTS[selectedWord].label:null;
    goal.textContent=label?'2. Finn «'+label+'» i bildet':'2. Velg et ord først';
    footer.textContent=label?'Trykk på '+label+' i bildet. Ikke på andre ting!':'Velg et ord fra listen for å begynne.';
    overlay.dataset.wordSelected=label?'true':'false';
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
  function selectWord(word){
    if(!active||!words().includes(word))return;
    if(active.found.has(word)){
      say(OBJECTS[word].label);
      react('celebrate','Det ordet har du allerede funnet! Velg et annet.');
      return;
    }
    selectedWord=word;
    hintStage=0;hintWord=null;wrongAttempts=0;
    persist();refresh();
    say(OBJECTS[word].label);
    react('curious','Nå leter vi etter '+OBJECTS[word].label+'! Finn tingen i bildet.');
    overlay.querySelector('.fw-word.is-selected')?.focus({preventScroll:true});
  }
  function selectObject(id){
    const item=OBJECTS[id];
    if(!item||!active)return;
    if(!selectedWord){
      react('support','Velg et ord fra listen først. Så kan vi lete!');
      return;
    }
    if(active.found.has(id)){
      react('curious','Den har du allerede funnet. Prøv en annen ting!');
      return;
    }
    if(id!==selectedWord){
      const missed=OBJECTS[selectedWord].label;
      wrongAttempts++;
      // A wrong match cannot be brute-forced through many scene taps.
      // The child must consciously choose an unfinished word again.
      selectedWord=null;hintStage=0;hintWord=null;
      persist();refresh();
      react('support','Ikke helt! Velg «'+missed+'» igjen og se nøye etter.');
      return;
    }
    active.found.add(id);
    selectedWord=null;wrongAttempts=0;
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
    if(!selectedWord){react('support','Velg først ordet du vil ha hjelp til å finne.');return}
    const id=selectedWord;
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
    hintStage=0;hintWord=null;selectedWord=null;wrongAttempts=0;
    persist();refresh();
    react('greet','Nye ord! Velg ett ord, så finner vi riktig ting.');
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
      say('Finn ordene. Velg et ord fra listen. Finn så riktig ting i bildet.');return;
    }
    if(button.dataset.fwRead){selectWord(button.dataset.fwRead);return}
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
          react('support',selectedWord?'Se etter «'+OBJECTS[selectedWord].label+'». Trykk på tingen.':'Velg et ord fra listen først.');
      });
      overlay.addEventListener('keydown',onKeydown);
    }
    if(!overlay.hidden)return;
    previousFocus=DOC.activeElement;previousOverflow=DOC.documentElement.style.overflow;
    restore();
    overlay.innerHTML=markup();overlay.hidden=false;
    DOC.documentElement.style.overflow='hidden';
    refresh();react('greet',selectedWord?'Du leter etter '+OBJECTS[selectedWord].label+'. Se nøye etter!':'Velg et ord fra listen, så finner vi tingen sammen!');
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
