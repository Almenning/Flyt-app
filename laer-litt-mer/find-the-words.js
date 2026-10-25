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
    fugl:{label:'fugl',clue:'Noe med vinger sitter i et tre.',x:70,y:37,w:13,h:17},
    eple:{label:'eple',clue:'Se etter noe rødt som vokser på et tre.',x:7,y:5,w:18,h:24},
    ugle:{label:'ugle',clue:'En nattfugl sitter på en grein.',x:22,y:11,w:12,h:22},
    sommerfugl:{label:'sommerfugl',clue:'Noe med fargerike vinger flyr over hagen.',x:48,y:3,w:17,h:20},
    lykt:{label:'lykt',clue:'Se etter det som lyser fra greina.',x:34,y:21,w:9,h:23},
    bro:{label:'bro',clue:'Hva går over vannet uten å bli vått?',x:30,y:42,w:37,h:26},
    sopp:{label:'sopp',clue:'En rød hatt med hvite prikker står i gresset.',x:69,y:67,w:17,h:27},
    bok:{label:'bok',clue:'Noe med sider ligger åpent ved bekken.',x:0,y:66,w:29,h:23},
    pinnsvin:{label:'pinnsvin',clue:'Et lite dyr med pigger rusler ved elvebredden.',x:82,y:65,w:18,h:27}
  });
  const FOREST_IDS=Object.freeze(['sol','tre','telt','vann','rev','sekk','bat','fugl']);
  const GARDEN_IDS=Object.freeze(['eple','ugle','sommerfugl','lykt','bro','sopp','bok','pinnsvin']);
  // The original three forest round indices never change: saved progress in
  // version 1 remains valid. A NEW garden alternates between them when the
  // child chooses another adventure; no forced level or locked curriculum.
  const ROUND_ORDER=Object.freeze([0,3,1,4,2,5]);
  const ROUNDS=[
    ['sol','tre','telt','vann','rev','sekk'],
    ['fugl','bat','tre','telt','sol','sekk'],
    ['vann','rev','fugl','bat','tre','sol'],
    ['sommerfugl','bok','eple','ugle','bro','sopp'],
    ['pinnsvin','lykt','bok','bro','eple','ugle'],
    ['sopp','sommerfugl','lykt','pinnsvin','bro','eple']
  ];
  let active=null,overlay=null,previousFocus=null,previousOverflow='',reactionTimer=null;
  let hintStage=0,hintWord=null,selectedWord=null,wrongAttempts=0;
  let pointerDrag=null,dragGhost=null,lastDraggedWord=null,dragClickTimer=null,sceneEffectTimer=null;

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
      {round:ROUND_ORDER[progress().rounds%ROUND_ORDER.length],found:new Set(),completed:false};
    selectedWord=typeof saved?.selected==='string'&&words().includes(saved.selected)&&
      !active.found.has(saved.selected)?saved.selected:null;
    wrongAttempts=0;
  }
  function persist(){
    write(ACTIVE_KEY,{version:1,round:active.round,found:[...active.found],completed:active.completed,selected:selectedWord});
  }
  function chosenFox(){
    const saved=root.LARIA_FOX?.choice?.()||'boy';
    const troll=root.LARIA_SKOGSTROLL;
    if(troll?.enabled?.())return {
      choice:saved,troll:true,label:troll.labelForActivity('findTheWords'),
      source:troll.sourceForActivity('findTheWords')
    };
    const api=root.LARIA_FOX;
    return {choice:saved,troll:false,label:api?.label?.(saved)||'Din rev',
      source:api?.worldSource?.(saved)||'./lia-fox-explorer-home.webp'};
  }
  function words(){return ROUNDS[active.round]}
  function sceneId(){return active?.round>=3?'garden':'forest'}
  function sceneObjects(){return sceneId()==='garden'?GARDEN_IDS:FOREST_IDS}
  function objectButtons(){
    return sceneObjects().map(id=>{
      const item=OBJECTS[id];
      return '<button type="button" class="fw-object" data-fw-object="'+id+'" aria-label="'+item.label+
      '" style="left:'+item.x+'%;top:'+item.y+'%;width:'+item.w+'%;height:'+item.h+'%">'+
      '<span class="fw-pin" aria-hidden="true">✓</span></button>'; }).join('');
  }
  function markup(){
    const fox=chosenFox(),garden=sceneId()==='garden';
    const scene= garden?'./find-the-words-garden-premium.webp?v=20261023-premiumgarden3':'./find-the-words-scene.svg?v=20261018-a';
    const sceneAlt=garden?
      'Magisk hage med rødt eple, ugle, sommerfugl, lykt, liten bro, sopp, bok og pinnsvin':
      'Illustrert skog med vann, telt, sol og mange små oppdagelser';
    return '<div class="fw-shell">'+
      '<header class="fw-top"><button type="button" class="fw-back" aria-label="Tilbake til Utforsk">←</button>'+
      '<div class="fw-title"><span class="fw-eyebrow">NORSK · '+(garden?'DEN HEMMELIGE HAGEN':'BOKSKOGEN')+'</span><h1 id="fw-title">Finn ordene</h1>'+
      '<p>Velg et ord. Finn riktig ting!</p></div>'+
      '<button type="button" class="fw-audio" aria-label="Les opp oppgaven">♪ <span>Hør</span></button></header>'+
      '<div class="fw-layout"><aside class="fw-word-panel" aria-labelledby="fw-list-title">'+
      '<div class="fw-list-heading"><div><span class="fw-tiny">'+(garden?'DEN HEMMELIGE HAGEN':'BOKSKOGEN')+'</span>'+
      '<h2 id="fw-list-title">Finn ordene</h2></div><span class="fw-counter"></span></div>'+
      '<p class="fw-panel-copy">Se deg rundt i '+(garden?'den hemmelige hagen':'Bokskogen')+'. Velg et ord og finn tingen i bildet.</p>'+
      '<div class="fw-list" role="list"></div><div class="fw-progress" aria-hidden="true"><span></span></div>'+
      '<button type="button" class="fw-hint">💡 Hint</button>'+
      '<p class="fw-list-foot">Trykk på ordet og finn tingen, eller dra ordet rett til bildet.</p></aside>'+
      '<div class="fw-stage"><div class="fw-stage-label"><strong class="fw-active-target" role="status" aria-live="polite">2. Finn ordet i bildet</strong><span aria-hidden="true">✦</span></div>'+
      '<div class="fw-art" role="group" aria-label="Eventyrbilde med ting du kan finne">'+
      '<div class="fw-picture">'+
      '<img src="'+scene+'" class="fw-scene-image" alt="'+sceneAlt+'" draggable="false">'+
      objectButtons()+'<svg class="fw-fx" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true"></svg>'+
      '<div class="fw-celebration" hidden aria-hidden="true">✦ ✧ ✦</div></div></div>'+
      '<div class="fw-scene-bottom"><span class="fw-scenery-caption">Trykk på et ord eller dra det til tingen.</span></div></div></div>'+
      '<footer class="fw-bottom"><div class="fw-companion'+(fox.troll?' is-skogstroll':'')+'" data-mood="idle">'+
      '<button type="button" class="fw-fox-button" aria-label="'+(fox.troll?'Spør skogstrollet om et hint':'Spør reven om et hint')+'"><img class="fw-fox" src="'+fox.source+'" alt="'+fox.label+'" draggable="false"></button>'+ 
      '<div class="fw-speech" role="status" aria-live="polite">Jeg blir med! Velg et ord, så finner vi tingen.</div></div>'+
      '<div class="fw-controls"><button type="button" class="fw-next">Ny ordjakt <span aria-hidden="true">↗</span></button></div></footer></div>';
  }
  function refresh(){
    if(!overlay||!active)return;
    overlay.dataset.scene=sceneId();
    const garden=sceneId()==='garden';
    const placeLabel=overlay.querySelector('.fw-tiny');
    const panelCopy=overlay.querySelector('.fw-panel-copy');
    if(placeLabel) placeLabel.textContent=garden?'DEN HEMMELIGE HAGEN':'BOKSKOGEN';
    if(panelCopy) panelCopy.textContent='Se deg rundt i '+(garden?'den hemmelige hagen':'Bokskogen')+'. Velg et ord og finn tingen i bildet.';
    const all=words();
    overlay.querySelector('.fw-list').innerHTML=all.map(word=>{
      const item=OBJECTS[word],found=active.found.has(word),selected=selectedWord===word;
      return '<div class="fw-list-item" role="listitem"><button type="button" class="fw-word'+
        (found?' is-found':'')+(selected?' is-selected':'')+'" data-fw-read="'+word+'" aria-pressed="'+selected+
        '" aria-label="'+item.label+(found?', allerede funnet':selected?', valgt, finn i bildet':', velg for å lete')+'">'+
        '<span class="fw-word-icon" aria-hidden="true">'+({sol:'☀️',tre:'🌳',telt:'⛺',vann:'💧',rev:'🦊',sekk:'🎒',bat:'⛵',fugl:'🐦',eple:'🍎',ugle:'🦉',sommerfugl:'🦋',lykt:'🏮',bro:'🌉',sopp:'🍄',bok:'📖',pinnsvin:'🦔'}[word])+
        '</span><strong>'+item.label+'</strong><span class="fw-word-check" aria-hidden="true">'+(found?'✓':'◦')+
        '</span></button></div>';
    }).join('');
    overlay.querySelector('.fw-counter').textContent=active.found.size+' / '+all.length;
    const goal=overlay.querySelector('.fw-active-target');
    const footer=overlay.querySelector('.fw-scenery-caption');
    const label=selectedWord?OBJECTS[selectedWord].label:null;
    goal.textContent=label?'2. Finn «'+label+'» i bildet':'2. Velg et ord først';
    footer.textContent=label?'Finn '+label+' i bildet, eller dra ordet dit.':'Trykk på et ord eller dra det til tingen.';
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
  // The fox's guidance and the child's discovery happen INSIDE the illustrated
  // scene, without intercepting a single picture tap or altering its hitboxes.
  // Coordinates are derived from the same 1200x720 plane as the image + buttons.
  function clearSceneEffect(){
    if(sceneEffectTimer){root.clearTimeout(sceneEffectTimer);sceneEffectTimer=null}
    const layer=overlay?.querySelector('.fw-fx');
    if(layer)layer.replaceChildren();
  }
  function sceneEffect(id,kind){
    const item=OBJECTS[id],layer=overlay?.querySelector('.fw-fx');
    if(!item||!layer)return;
    clearSceneEffect();
    const x=Math.round((item.x+item.w/2)*12),y=Math.round((item.y+item.h/2)*7.2);
    if(kind==='guide'){
      // First hint is verbal. Only a second request paints this calm trail
      // from the child's fox at the lower-left frame to the searched-for object.
      const c1x=Math.min(x*.45+85,335),c1y=Math.max(225,y+170);
      const c2x=Math.max(160,x-170),c2y=Math.max(115,y+112);
      const d='M 30 704 C '+Math.round(c1x)+' '+Math.round(c1y)+', '+Math.round(c2x)+' '+Math.round(c2y)+', '+x+' '+y;
      layer.innerHTML='<path class="fw-guide-glow" d="'+d+'"/>'+
        '<path class="fw-guide-spark" d="'+d+'"/>'+
        '<g class="fw-target-flower" data-fx-object="'+id+'" transform="translate('+x+' '+y+')">'+
        '<circle r="36" fill="none" stroke="#fff9be" stroke-width="9"/>'+
        '<circle r="46" fill="none" stroke="#6eb6a5" stroke-width="5" stroke-dasharray="12 16"/>'+
        '<path d="M0 -61V-51M0 51V61M-61 0H-51M51 0H61" stroke="#fff5ca" stroke-width="6" stroke-linecap="round"/></g>';
    }else if(kind==='success'){
      const rays=Array.from({length:8},(_,i)=>{
        const a=i*Math.PI/4,sx=Math.round(Math.cos(a)*34),sy=Math.round(Math.sin(a)*34);
        const ex=Math.round(Math.cos(a)*60),ey=Math.round(Math.sin(a)*60);
        return '<path d="M'+sx+' '+sy+'L'+ex+' '+ey+'" stroke="#ffe5a0" stroke-width="8" stroke-linecap="round"/>';
      }).join('');
      layer.innerHTML='<g class="fw-success-burst" data-fx-object="'+id+'" transform="translate('+x+' '+y+')">'+
        '<circle r="24" fill="#fff4ad" fill-opacity=".68"/>'+rays+
        '<circle r="19" fill="none" stroke="#fffbea" stroke-width="6"/></g>';
    }else if(kind==='try'){
      layer.innerHTML='<circle class="fw-try-ring" data-fx-object="'+id+'" cx="'+x+'" cy="'+y+'" r="27" fill="none" stroke="#ffebaa" stroke-width="8"/>';
    }
    sceneEffectTimer=root.setTimeout(clearSceneEffect,kind==='guide'?3100:1300);
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
  function selectWord(word,fromKeyboard=false){
    if(!active||!words().includes(word))return;
    if(active.found.has(word)){
      say(OBJECTS[word].label);
      react('celebrate','Det ordet har du allerede funnet! Velg et annet.');
      return;
    }
    selectedWord=word;
    clearSceneEffect();
    hintStage=0;hintWord=null;wrongAttempts=0;
    persist();refresh();
    say(OBJECTS[word].label);
    react('curious','Nå leter vi etter '+OBJECTS[word].label+'! Finn tingen i bildet.');
    // WebKit may scroll the entire compact screen when a replaced button is
    // focused after a touch tap. Only restore focus for keyboard activation.
    if(fromKeyboard){
      const before=overlay.scrollTop;
      overlay.querySelector('.fw-word.is-selected')?.focus({preventScroll:true});
      overlay.scrollTop=before;
    }
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
      sceneEffect(id,'try');
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
    sceneEffect(id,'success');
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
      sceneEffect(id,'guide');
      react('support','Der er et lite spor. Kan du finne '+item.label+'?');
      hintStage=0;
    }
  }
  /* Optional tactile shortcut: drag the written word onto the pictured item.
     Native HTML5 drag/drop is unreliable in iPad Safari; Pointer Events work
     on fingers, mouse and pens. The existing two-tap/keyboard path stays intact.
     Nothing is awarded until selectObject verifies the chosen word + object. */
  function clearDrag(){
    if(pointerDrag?.source?.isConnected)pointerDrag.source.classList.remove('is-dragging');
    dragGhost?.remove();dragGhost=null;
    overlay?.classList.remove('fw-dragging');
    overlay?.querySelectorAll('.fw-object.is-drop-target').forEach(el=>el.classList.remove('is-drop-target'));
    pointerDrag=null;
  }
  function pointerDown(event){
    if(!active||active.completed||event.button!==0||!event.isPrimary)return;
    const source=event.target.closest?.('.fw-word[data-fw-read]');
    const word=source?.dataset?.fwRead;
    if(!word||!words().includes(word)||active.found.has(word))return;
    pointerDrag={source,word,id:event.pointerId,x:event.clientX,y:event.clientY,dragging:false};
    try{source.setPointerCapture(event.pointerId)}catch(_){}
  }
  function pointerMove(event){
    const d=pointerDrag;
    if(!d||d.id!==event.pointerId)return;
    if(!d.dragging&&Math.hypot(event.clientX-d.x,event.clientY-d.y)<12)return;
    if(!d.dragging){
      d.dragging=true;
      d.source.classList.add('is-dragging');
      overlay.classList.add('fw-dragging');
      dragGhost=DOC.createElement('div');
      dragGhost.className='fw-drag-ghost';
      dragGhost.setAttribute('aria-hidden','true');
      dragGhost.textContent=OBJECTS[d.word].label;
      overlay.appendChild(dragGhost);
    }
    if(event.cancelable)event.preventDefault();
    dragGhost.style.left=event.clientX+'px';
    dragGhost.style.top=event.clientY+'px';
    const hovered=DOC.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-fw-object]');
    overlay.querySelectorAll('.fw-object.is-drop-target').forEach(el=>el.classList.remove('is-drop-target'));
    if(hovered&&overlay.contains(hovered))hovered.classList.add('is-drop-target');
  }
  function pointerUp(event){
    const d=pointerDrag;
    if(!d||d.id!==event.pointerId)return;
    if(!d.dragging){clearDrag();return}
    if(event.cancelable)event.preventDefault();
    const target=DOC.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-fw-object]');
    const matchingTarget=target&&overlay.contains(target)?target.dataset.fwObject:null;
    const word=d.word;
    lastDraggedWord=word;
    if(dragClickTimer)root.clearTimeout(dragClickTimer);
    dragClickTimer=root.setTimeout(()=>{lastDraggedWord=null;dragClickTimer=null},400);
    clearDrag();
    if(!matchingTarget){
      // Release outside the illustration: leave a highlighted, selected word
      // so the child can finish with a simple tap instead.
      selectWord(word);
      react('support','Ord valgt! Nå kan du trykke på tingen i bildet.');
      return;
    }
    selectedWord=word;
    persist();
    selectObject(matchingTarget);
  }
  function pointerCancel(event){
    if(pointerDrag&&event.pointerId===pointerDrag.id)clearDrag();
  }
  function nextRound(){
    const old=active?.round||0;
    const idx=ROUND_ORDER.indexOf(old);
    active={round:ROUND_ORDER[(idx+1)%ROUND_ORDER.length],found:new Set(),completed:false};
    clearDrag();clearSceneEffect();
    hintStage=0;hintWord=null;selectedWord=null;wrongAttempts=0;
    persist();
    // The second illustrated world has its own hotspots, word list and art.
    // Rebuild DOM on scene change; never leave the previous world's image up.
    overlay.innerHTML=markup();refresh();
    react('greet',sceneId()==='garden'?'Velkommen til den hemmelige hagen! Her er helt nye ting å oppdage.':'Nye ord i Bokskogen! Velg eller dra et ord til riktig ting.');
    const first=overlay?.querySelector('.fw-word');
    first?.focus({preventScroll:true});
  }
  function onClick(event){
    const button=event.target.closest('button');
    // Some Safari versions synthesize a click on the drag source after pointerup.
    // Never reinterpret that synthetic click as a new selected word.
    if(lastDraggedWord&&button?.dataset?.fwRead===lastDraggedWord){
      lastDraggedWord=null;event.preventDefault();return;
    }
    if(!button||!overlay.contains(button))return;
    if(button.classList.contains('fw-back')){close();return}
    if(button.classList.contains('fw-hint')||button.classList.contains('fw-fox-button')){hint();return}
    if(button.classList.contains('fw-next')){nextRound();return}
    if(button.classList.contains('fw-repeat')||button.classList.contains('fw-audio')){
      say('Finn ordene. Velg et ord fra listen. Finn så riktig ting i bildet.');return;
    }
    if(button.dataset.fwRead){selectWord(button.dataset.fwRead,event.detail===0);return}
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
      overlay.addEventListener('pointerdown',pointerDown);
      overlay.addEventListener('pointermove',pointerMove);
      overlay.addEventListener('pointerup',pointerUp);
      overlay.addEventListener('pointercancel',pointerCancel);
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
    clearDrag();clearSceneEffect();lastDraggedWord=null;
    if(dragClickTimer){root.clearTimeout(dragClickTimer);dragClickTimer=null}
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
