(()=>{'use strict';
const THEMES=window.LARIA_WORD_HUNT_THEMES;
const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ';
const KEY='laria-wordhunt-v1';
const ROUND_KEY='laria-wordhunt-unfinished-round-v1';
let ui={level:'easy',theme:'mixed',themeChoice:'mixed',size:6,grid:[],words:[],recentWords:[],found:new Map(),drag:null,tapStart:null,completed:false,magicSeen:false,magicTimer:null,pickerFocus:null,entryPickerActive:false,hintsUsed:0,companionTimer:null,feedbackTimer:null,foxSequence:0,lastMissAt:0,lastFoundWord:null,missCount:0,helpOffered:false};
function stats(){try{return THEMES.normalizeProgress(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){return THEMES.normalizeProgress(null)}}
function saveTheme(){const s=stats();s.theme=ui.theme;localStorage.setItem(KEY,JSON.stringify(s))}
function saveRound(){
  const s=stats(),firstSticker=s.themeRounds[ui.theme]===0;
  s.rounds+=1;s.theme=ui.theme;s.themeRounds[ui.theme]+=1;
  localStorage.setItem(KEY,JSON.stringify(s));
  return firstSticker;
}

// Store the active puzzle separately from the permanent sticker/progress record.
// This allows a child to return to an unfinished word without granting a win.
function persistRound(){
  try{
    if(!ui.grid.length||ui.completed){localStorage.removeItem(ROUND_KEY);return}
    localStorage.setItem(ROUND_KEY,JSON.stringify({
      version:1,theme:ui.theme,level:ui.level,size:ui.size,
      words:ui.words,grid:ui.grid,found:[...ui.found.entries()],
      recentWords:ui.recentWords
    }));
  }catch(_){/* Continue playing when browser storage is unavailable. */}
}
function restoreRound(){
  let data=null;
  try{
    data=JSON.parse(localStorage.getItem(ROUND_KEY)||'null');
    if(!data)return false;
    const allowedTheme=THEMES.list().some(p=>p.id===data.theme);
    const size=data.level==='easy'?6:data.level==='hard'?7:0;
    const count=data.level==='easy'?4:5;
    const allowedWords=allowedTheme?new Set(THEMES.get(data.theme)[data.level]||[]):new Set();
    if(data.version!==1||!allowedTheme||data.theme!==stats().theme||
       data.size!==size||!Array.isArray(data.grid)||data.grid.length!==size||
       !data.grid.every(row=>Array.isArray(row)&&row.length===size&&row.every(ch=>typeof ch==='string'&&/^[A-ZÆØÅ]$/.test(ch)))||
       !Array.isArray(data.words)||data.words.length!==count||
       new Set(data.words).size!==count||!data.words.every(w=>allowedWords.has(w))||
       !Array.isArray(data.found)||data.found.length>=count)throw Error('Invalid saved word hunt');
    const found=new Map();
    for(const item of data.found){
      if(!Array.isArray(item)||item.length!==2)throw Error('Invalid found word');
      const [word,path]=item;
      if(!data.words.includes(word)||found.has(word)||!Array.isArray(path)||path.length!==word.length)throw Error('Invalid found path');
      const sequence=[];
      let dr=0,dc=0;
      for(let i=0;i<path.length;i++){
        const cell=path[i];
        if(!Array.isArray(cell)||cell.length!==2||!cell.every(n=>Number.isInteger(n)&&n>=0&&n<size))throw Error('Invalid found coordinate');
        const [r,col]=cell;
        if(i===1){dr=r-path[0][0];dc=col-path[0][1];
          if(Math.abs(dr)>1||Math.abs(dc)>1||(!dr&&!dc))throw Error('Invalid found direction')}
        if(i>0&&(r!==path[0][0]+dr*i||col!==path[0][1]+dc*i))throw Error('Invalid found line');
        sequence.push(data.grid[r][col]);
      }
      const text=sequence.join('');
      if(text!==word&&[...text].reverse().join('')!==word)throw Error('Invalid found spelling');
      found.set(word,path);
    }
    ui.level=data.level;ui.size=size;ui.theme=data.theme;ui.themeChoice=data.theme;
    ui.words=[...data.words];ui.grid=data.grid.map(row=>[...row]);ui.found=found;ui.hintsUsed=0;ui.lastFoundWord=null;ui.missCount=0;ui.helpOffered=false;
    ui.recentWords=Array.isArray(data.recentWords)&&data.recentWords.every(w=>typeof w==='string')?
      data.recentWords.filter(w=>allowedWords.has(w)).slice(0,7):[...data.words];
    ui.completed=false;ui.magicSeen=false;ui.tapStart=null;ui.drag=null;
    return true;
  }catch(_){
    try{localStorage.removeItem(ROUND_KEY)}catch(__){}
    return false;
  }
}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function dirSet(){return ui.level==='easy'?[[0,1],[1,0]]:[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]}
function directionPlan(){
  // A round should feel intentionally composed, not like four words happened
  // to fall into the same direction. Easy mixes horizontal and vertical.
  // Hard adds both diagonal and reverse-reading placements every round.
  return ui.level==='easy' ? shuffle([[0,1],[1,0],[0,1],[1,0]]) :
    [...shuffle([[0,1],[1,0]]),...shuffle([[1,1],[0,-1],[-1,-1]])];
}
function makeRound(){
  ui.size=ui.level==='easy'?6:7;
  ui.found=new Map();ui.completed=false;ui.tapStart=null;ui.drag=null;ui.magicSeen=false;ui.hintsUsed=0;ui.lastFoundWord=null;ui.missCount=0;ui.helpOffered=false;hideMagic();
  const pool=shuffle(THEMES.get(ui.theme)[ui.level]).filter(w=>w.length<=ui.size);
  const count=ui.level==='easy'?4:5;
  const recent=new Set(ui.recentWords||[]);
  const fresh=[...pool.filter(w=>!recent.has(w)),...pool.filter(w=>recent.has(w))];
  // Long words use straight paths; shorter ones preserve room for diagonal
  // and backward discoveries on the 7×7 board.
  // Give every round a mix of word lengths. The harder puzzle stays hard
  // through its backward/diagonal directions, not five overly long words.
  const shortWords=fresh.filter(word=>word.length<=ui.size-2);
  const longerWords=fresh.filter(word=>word.length>ui.size-2);
  function chooseWords(){
    const unusedLong=longerWords.filter(word=>!recent.has(word));
    const unusedShort=shortWords.filter(word=>!recent.has(word));
    const picked=[];
    if(unusedLong.length)picked.push(shuffle(unusedLong)[0]);
    else if(unusedShort.length<count&&longerWords.length)picked.push(shuffle(longerWords)[0]);
    for(const word of shuffle(unusedShort)){
      if(picked.length>=count)break;
      picked.push(word);
    }
    // The child should not see the previous round again while unused choices
    // exist. Only then permit a repeat, prioritizing shorter diagonals.
    for(const word of [...shuffle(shortWords),...shuffle(unusedLong),...shuffle(longerWords)]){
      if(picked.length>=count)break;
      if(!picked.includes(word))picked.push(word);
    }
    return picked;
  }
  let requested=chooseWords(),board=null;
  function solvePlacement(words,plan){
    const trial=Array.from({length:ui.size},()=>Array(ui.size).fill(''));
    const tasks=words.map((word,index)=>{
      const [dr,dc]=plan[index],starts=[];
      for(let r=0;r<ui.size;r++)for(let c=0;c<ui.size;c++){
        const er=r+dr*(word.length-1),ec=c+dc*(word.length-1);
        if(er>=0&&ec>=0&&er<ui.size&&ec<ui.size)starts.push([r,c]);
      }
      return {word,dr,dc,starts:shuffle(starts)};
    }).sort((a,b)=>a.starts.length-b.starts.length);
    let checks=0;
    function place(index){
      if(index===tasks.length)return true;
      const {word,dr,dc,starts}=tasks[index];
      for(const [r,c] of starts){
        if(++checks>5500)return false;
        let fits=true;
        for(let i=0;i<word.length;i++){
          const existing=trial[r+dr*i][c+dc*i];
          if(existing&&existing!==word[i]){fits=false;break}
        }
        if(!fits)continue;
        const freshCells=[];
        for(let i=0;i<word.length;i++){
          const rr=r+dr*i,cc=c+dc*i;
          if(!trial[rr][cc]){trial[rr][cc]=word[i];freshCells.push([rr,cc])}
        }
        if(place(index+1))return true;
        for(const [rr,cc] of freshCells)trial[rr][cc]='';
      }
      return false;
    }
    return place(0)?trial:null;
  }
  // A bounded backtracker preserves the requested direction balance rather
  // than silently losing words when a random long-word crossing does not fit.
  for(let attempt=0;attempt<16&&!board;attempt++){
    if(attempt>0&&attempt%4===0)requested=chooseWords();
    board=solvePlacement(requested,directionPlan());
  }
  // Defensive last resort; should not be reached with curated balanced packs.
  if(!board){
    board=Array.from({length:ui.size},()=>Array(ui.size).fill(''));
    requested.forEach((word,row)=>{
      const backward=ui.level==='hard'&&row%2===1;
      for(let i=0;i<word.length;i++)board[row][backward?ui.size-1-i:i]=word[i];
    });
  }
  ui.words=requested;
  ui.grid=board;
  ui.recentWords=[...ui.words];
  for(let r=0;r<ui.size;r++)for(let c=0;c<ui.size;c++){
    if(!ui.grid[r][c])ui.grid[r][c]=LETTERS[Math.floor(Math.random()*LETTERS.length)];
  }
  persistRound();
}


function refreshCompanion(){
  // Guidance is independent of the former static fox picture.
  const host=overlay().querySelector('.word-hunt-companion');
  if(host)host.dataset.norskGuide='magic';
}
const FOX_RESPONSES={
  correct:['Ja! Du fant {word}! ✨','Jippi! {word} var riktig!','Så bra! Vi fant {word}!'],
  near:['God start! De første bokstavene passer. Prøv videre!','Du er på sporet! Se om ordet fortsetter her.'],
  wrong:['Godt forsøk! Prøv en annen retning.','Vi leter videre! Se etter ordene i listen.','Ikke helt, men vi finner det sammen!'],
  invalid:['Prøv å følge bokstavene i en rett eller skrå linje.','Velg første og siste bokstav i samme linje.'],
  repeated:['Dette ordet har du allerede funnet! Finn et nytt.','Den fant vi! Se etter ett av ordene som mangler.'],
  cheer:['Heia deg! Vi finner ordene sammen!','Du får dette til! Jeg heier på deg!'],
  complete:['Hurra! Du fant alle ordene!','Hurra! Vi fant alle ordene!']
};
function companionSay(message,mood='greet',kind='idle'){
  const root=overlay(),host=root.querySelector('.word-hunt-companion');
  if(!host)return;
  if(ui.feedbackTimer){clearTimeout(ui.feedbackTimer);ui.feedbackTimer=null}
  host.dataset.foxReaction=kind;
  const bubble=host.querySelector('.word-hunt-companion-speech');
  bubble.textContent=message;
  bubble.classList.remove('is-speaking');
  void bubble.offsetWidth;
  bubble.classList.add('is-speaking');
  // Animate the same saved fox in the phone header too: the large companion
  // sits below the puzzle on small screens, where the child cannot see it.
  const shortcut=root.querySelector('.word-hunt-fox-shortcut');
  if(shortcut){
    shortcut.dataset.foxReaction=kind;
    const tinyFox=shortcut.querySelector('.word-hunt-fox');
    tinyFox.classList.remove('is-reacting');
    void tinyFox.offsetWidth;
    tinyFox.classList.add('is-reacting');
  }
  // The full-size personal fox stays below the puzzle on compact phones.
  // Mirror reactions in the existing thin, first-fold strip, not a new card.
  const intro=root.querySelector('.word-hunt-intro');
  if(intro&&window.matchMedia('(max-width:700px) and (orientation:portrait)').matches){
    if(kind!=='idle'){
      intro.classList.add('has-fox-hint');
      intro.textContent='✦ '+message;
    }else if(intro.classList.contains('has-fox-hint')){
      intro.classList.remove('has-fox-hint');
      intro.textContent='Finn ordene! Dra over bokstavene, eller trykk på første og siste bokstav.';
    }
  }
  // Keep the original semantic feedback events without a pasted avatar.
  host.dataset.lariaFoxMood='idle';
  void host.offsetWidth;
  host.dataset.lariaFoxMood=mood;
}
function foxReact(kind,word='',earned=false){
  if(['wrong','near','invalid','repeated'].includes(kind)){
    const now=Date.now();
    if(now-ui.lastMissAt<900)return;
    ui.lastMissAt=now;
  }
  const variants=FOX_RESPONSES[kind]||FOX_RESPONSES.cheer;
  const message=variants[ui.foxSequence++%variants.length].replaceAll('{word}',word)+
    (kind==='complete'&&earned?' Nytt klistremerke i samleboken!':'');
  const mood=kind==='correct'||kind==='complete'||kind==='cheer'?'celebrate':
    kind==='near'?'curious':'support';
  companionSay(message,mood,kind);
  if(kind!=='complete'){
    const timeout=kind==='correct'?4400:kind==='cheer'?3600:4100;
    ui.feedbackTimer=setTimeout(()=>{
      ui.feedbackTimer=null;
      const root=document.getElementById('word-hunt-overlay');
      if(root&&!root.hidden&&!ui.completed&&root.querySelector('.word-hunt-theme-picker').hidden)
        companionSay('Finn neste ord! Jeg heier på deg.','greet');
    },timeout);
  }
}
function clearHintMarks(){
  overlay().querySelectorAll('.word-hunt-cell.is-hint-start,.word-hunt-cell.is-hint-path')
    .forEach(cell=>cell.classList.remove('is-hint-start','is-hint-path'));
}
function findHintPath(word){
  const directions=dirSet(),size=ui.size;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)for(const [dr,dc] of directions){
    const endR=r+dr*(word.length-1),endC=c+dc*(word.length-1);
    if(endR<0||endC<0||endR>=size||endC>=size)continue;
    const path=Array.from({length:word.length},(_,i)=>[r+dr*i,c+dc*i]);
    if(path.every(([rr,cc],i)=>ui.grid[rr][cc]===word[i]))return path;
  }
  return null;
}
function scheduleCompanionOffer(){
  if(ui.companionTimer)clearTimeout(ui.companionTimer);
  ui.companionTimer=null;
  const root=document.getElementById('word-hunt-overlay');
  if(!root||root.hidden||ui.completed||!ui.grid.length||
     !root.querySelector('.word-hunt-theme-picker').hidden)return;
  // Quiet invitation only: never reveal any letters automatically.
  ui.companionTimer=setTimeout(()=>{
    const current=document.getElementById('word-hunt-overlay');
    ui.companionTimer=null;
    if(!current||current.hidden||ui.completed||!current.querySelector('.word-hunt-theme-picker').hidden)return;
    if(!ui.hintsUsed)companionSay('Vil du ha en ledetråd? Trykk på Hint for å få hjelp!','curious','offer');
  },45000);
}
function hintSay(message,mood){
  const intro=overlay().querySelector('.word-hunt-intro');
  if(intro&&window.matchMedia('(max-width:700px) and (orientation:portrait)').matches)
    intro.classList.add('has-fox-hint');
  companionSay(message,mood,'hint');
}
function giveHint(){
  scheduleCompanionOffer();
  if(ui.completed){companionSay('Du fant alle ordene! Klar for en ny jakt?','celebrate');return}
  const target=ui.words.find(word=>!ui.found.has(word)&&findHintPath(word));
  if(!target)return;
  const path=findHintPath(target),stage=Math.min(ui.hintsUsed,2);
  const [r,c]=path[0];
  clearHintMarks();
  if(stage===0){
    overlay().querySelector('.word-hunt-cell[data-r="'+r+'"][data-c="'+c+'"]')?.classList.add('is-hint-start');
    hintSay('Se etter et ord som begynner på '+target[0]+'! Her er startbokstaven.','curious');
  }else if(stage===1){
    const [lastR,lastC]=path[path.length-1],direction=r===lastR?'bortover':c===lastC?'nedover':'på skrå';
    for(const [rr,cc] of [path[0],path[1]])
      overlay().querySelector('.word-hunt-cell[data-r="'+rr+'"][data-c="'+cc+'"]')?.classList.add('is-hint-path');
    hintSay('Prøv '+direction+' fra den markerte bokstaven!','support');
  }else{
    for(const [rr,cc] of path)
      overlay().querySelector('.word-hunt-cell[data-r="'+rr+'"][data-c="'+cc+'"]')?.classList.add('is-hint-path');
    hintSay('Der er ordet '+target+'! Prøv å velge bokstavene.','greet');
  }
  ui.hintsUsed++;
  ui.helpOffered=true;
}

// The approved Eggenipa garden already depicts an owl, hedgehog and
// butterfly. Reuse that premium scene for Dyrevenner rather than showing
// the retired static fox illustration on the child-facing theme card.
function themeArtwork(id){
  return id==='animals'?'./find-the-words-garden-premium.webp?v=20261026-dyrevenner1':
    './assets/word-hunt/themes/'+id+'.webp?v=20261017-painted1';
}
function themePickerMarkup(){
  return '<section class="word-hunt-theme-picker" hidden role="dialog" aria-modal="true" aria-labelledby="wh-theme-heading">'+
    '<div class="wh-theme-panel"><button type="button" class="wh-theme-close" aria-label="Lukk temavalget">×</button>'+
    '<span class="wh-theme-fox" aria-hidden="true">✦</span>'+
    '<span class="wh-theme-eyebrow">Læria · Eggenipa</span><h2 id="wh-theme-heading">Velg din ordjakt</h2>'+
    '<p>Velg et tema. Ett trykk, så er ordjakten i gang!</p><div class="wh-theme-cards" role="group" aria-label="Velg et av fem ordtemaer">'+
    THEMES.list().map(pack=>'<button type="button" class="wh-theme-card" data-word-theme="'+pack.id+'" aria-pressed="false">'+
      '<img alt="" src="'+themeArtwork(pack.id)+'" loading="lazy">'+
      '<strong>'+pack.title+'</strong><small>'+pack.description+'</small><span class="wh-theme-card-go" aria-hidden="true">Utforsk ›</span><span class="wh-theme-card-check" aria-hidden="true">Sist valgt</span></button>').join('')+
    '</div><button type="button" class="wh-theme-start">Fortsett med sist valgte tema <span aria-hidden="true">▶</span></button></div></section>';
}
function highlightThemeChoice(){
  overlay().querySelectorAll('[data-word-theme]').forEach(button=>{
    const selected=button.dataset.wordTheme===ui.themeChoice;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
}
function revealSelectedTheme(){
  const strip=overlay().querySelector('.wh-theme-cards');
  const chosen=strip?.querySelector('.wh-theme-card.selected');
  if(!strip||!chosen||strip.scrollWidth<=strip.clientWidth+2)return;
  // Preserve the selected topic in the visible part of the narrow horizontal
  // picker. Do not scroll the whole screen or change keyboard focus.
  const frame=strip.getBoundingClientRect(),card=chosen.getBoundingClientRect();
  const center=strip.scrollLeft+(card.left-frame.left)-(strip.clientWidth-card.width)/2;
  strip.scrollLeft=Math.max(0,Math.min(center,strip.scrollWidth-strip.clientWidth));
}
function showThemePicker(entry=false){
  const root=overlay(),picker=root.querySelector('.word-hunt-theme-picker');
  if(!picker.hidden)return;
  ui.entryPickerActive=entry;
  root.classList.toggle('is-theme-entry',entry);
  root.querySelector('.word-hunt-shell').hidden=entry;
  ui.pickerFocus=entry?previousFocus:document.activeElement;
  // The magic emblem is visual-only; no old avatar dependency.
  ui.themeChoice=ui.theme;
  highlightThemeChoice();
  picker.hidden=false;
  if(ui.companionTimer){clearTimeout(ui.companionTimer);ui.companionTimer=null}
  revealSelectedTheme();
  root.querySelector('.word-hunt-shell').inert=true;
  const back=picker.querySelector('.wh-theme-close');
  back.textContent=entry?'←':'×';
  back.setAttribute('aria-label',entry?'Tilbake til Utforsk':'Lukk temavalget');
  const continueButton=picker.querySelector('.wh-theme-start');
  const canResume=ui.grid.length>0&&!ui.completed;
  continueButton.hidden=Boolean(entry&&!canResume);
  continueButton.textContent=entry?'Fortsett ordjakten i '+THEMES.get(ui.theme).title+' ▶':'Spill valgt tema ▶';
  picker.querySelector('.wh-theme-close').focus({preventScroll:true});
}
function closeThemePicker(){
  const root=overlay(),picker=root.querySelector('.word-hunt-theme-picker');
  if(picker.hidden)return;
  picker.hidden=true;
  root.querySelector('.word-hunt-shell').hidden=false;
  root.querySelector('.word-hunt-shell').inert=false;
  root.classList.remove('is-theme-entry');
  ui.entryPickerActive=false;
  if(ui.pickerFocus?.isConnected)ui.pickerFocus.focus({preventScroll:true});
  scheduleCompanionOffer();
  ui.pickerFocus=null;
}
function startChosenTheme(){
  const existingRound=ui.grid.length>0&&!ui.completed&&ui.theme===ui.themeChoice;
  const canResume=ui.entryPickerActive&&existingRound;
  ui.theme=THEMES.get(ui.themeChoice).id;
  saveTheme();
  if(!canResume)makeRound();
  render();
  closeThemePicker();
  companionSay('Jeg er klar! Skal vi finne ordene sammen?','greet');
  scheduleCompanionOffer();
  overlay().querySelector('.word-hunt-back').focus({preventScroll:true});
}
function hideMagic(){
  if(ui.magicTimer)clearTimeout(ui.magicTimer);
  ui.magicTimer=null;
  const magic=document.querySelector('#word-hunt-overlay .word-hunt-magic');
  if(magic)magic.hidden=true;
}
function showMagic(word,sceneOverride=null){
  const scene=sceneOverride||THEMES.reaction(word,ui.theme);
  if(!scene)return;
  const magic=overlay().querySelector('.word-hunt-magic');
  if(!magic)return;
  hideMagic();
  magic.querySelector('.word-hunt-magic-symbol').textContent=scene.icon;
  magic.querySelector('.word-hunt-magic-message').textContent=scene.message;
  magic.hidden=false;
  ui.magicTimer=setTimeout(()=>{magic.hidden=true;ui.magicTimer=null},sceneOverride?3600:2200);
}

function overlay(){
  let root=document.getElementById('word-hunt-overlay');if(root)return root;
  root=document.createElement('section');root.id='word-hunt-overlay';root.className='word-hunt-overlay';root.dataset.exploreRelease='explore-rc1';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Ordjakt ved Eggenipa');
  root.innerHTML='<div class="word-hunt-shell"><div class="word-hunt-top"><button type="button" class="word-hunt-back" aria-label="Tilbake til Læria">←</button><div class="word-hunt-title"><small>Lek & utforsk</small><h1>Ordjakt</h1></div><button type="button" class="word-hunt-fox-shortcut" aria-label="Få hint" title="Få hint"><span class="word-hunt-fox" aria-hidden="true">✦</span><span class="word-hunt-fox-shortcut-label" aria-hidden="true">Hint</span></button></div><div class="word-hunt-intro">Finn ordene! Dra over bokstavene, eller trykk på første og siste bokstav.</div><div class="word-hunt-levels" role="group" aria-label="Vanskelighetsgrad og ordtema"><button type="button" class="word-hunt-level" data-word-level="easy">🌱 Rolig</button><button type="button" class="word-hunt-level" data-word-level="hard">✨ Litt lurere</button><button type="button" class="word-hunt-theme-mobile" aria-label="Velg ordtema"><span class="word-hunt-mobile-icon" aria-hidden="true">✨</span><span class="word-hunt-mobile-label">Blandet</span></button></div><div class="word-hunt-board-wrap"><div class="word-hunt-board-card"><div class="word-hunt-board" role="grid" aria-label="Bokstavrutenett"></div><div class="word-hunt-magic" hidden aria-hidden="true"><span class="word-hunt-magic-symbol"></span><strong class="word-hunt-magic-message"></strong></div></div><aside class="word-hunt-side"><button type="button" class="word-hunt-theme-open" aria-label="Velg ordtema"><img class="word-hunt-theme-icon" alt="" src="./assets/word-hunt/themes/mixed.webp?v=20261017-painted1"><span><small>ORDTEMA</small><strong class="word-hunt-current-theme">Blandede ord</strong></span><span class="word-hunt-theme-change" aria-hidden="true">Bytt ›</span></button><div class="word-hunt-targets"><div class="word-hunt-targets-heading"><h2>Finn disse</h2><span class="word-hunt-targets-count" aria-hidden="true"></span></div><div class="word-hunt-words"></div></div><div class="word-hunt-companion" data-laria-fox-mood="idle"><div class="word-hunt-companion-stage"><span class="word-hunt-companion-fox" aria-hidden="true">✦</span><span class="word-hunt-companion-sparkles" aria-hidden="true">✦ ✧</span></div><div class="word-hunt-companion-panel"><p class="word-hunt-companion-speech" aria-live="polite">Jeg blir med på ordjakten!</p><div class="word-hunt-companion-controls"><button type="button" class="word-hunt-companion-hint">💡 Gi meg et hint</button><button type="button" class="word-hunt-companion-cheer">🎉 Heia!</button></div></div></div><div class="word-hunt-status" aria-hidden="true"></div><div class="word-hunt-actions"><button type="button" class="word-hunt-new">Ny runde</button><div class="word-hunt-rounds"></div></div></aside></div></div>';
  root.insertAdjacentHTML('beforeend',themePickerMarkup());
  document.body.append(root);
  root.querySelectorAll('.word-hunt-theme-open,.word-hunt-theme-mobile').forEach(b=>b.onclick=()=>showThemePicker(false));
  root.querySelector('.wh-theme-close').onclick=()=>{
    if(ui.entryPickerActive)closeWordHunt();
    else closeThemePicker();
  };
  root.querySelector('.wh-theme-start').onclick=startChosenTheme;
  root.querySelectorAll('[data-word-theme]').forEach(b=>b.onclick=()=>{
    ui.themeChoice=b.dataset.wordTheme;
    highlightThemeChoice();
    // One tap from Utforsk starts the selected adventure. Mid-game use
    // the separate confirm button to avoid accidentally losing a round.
    if(ui.entryPickerActive)startChosenTheme();
  });
  root.querySelector('.word-hunt-theme-picker').addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    // A first-time player has no resume action. Hidden controls must not
    // become tab stops or let focus escape this modal on Safari/iPad.
    const visible=[...e.currentTarget.querySelectorAll('button:not([disabled])')]
      .filter(button=>!button.hidden&&button.getClientRects().length&&getComputedStyle(button).visibility!=='hidden');
    if(!visible.length){e.preventDefault();return}
    const first=visible[0],last=visible[visible.length-1],active=document.activeElement;
    if(e.shiftKey&&(active===first||!visible.includes(active))){
      e.preventDefault();last.focus({preventScroll:true});
    }else if(!e.shiftKey&&(active===last||!visible.includes(active))){
      e.preventDefault();first.focus({preventScroll:true});
    }
  });
  root.querySelector('.word-hunt-back').onclick=closeWordHunt;
  root.querySelector('.word-hunt-new').onclick=()=>{makeRound();render();companionSay('Ny jakt! Jeg heier på deg.','greet');scheduleCompanionOffer()};
  root.querySelector('.word-hunt-companion-hint').onclick=giveHint;
  root.querySelector('.word-hunt-fox-shortcut').onclick=giveHint;
  root.querySelector('.word-hunt-companion-cheer').onclick=()=>{foxReact('cheer');scheduleCompanionOffer()};
  root.querySelectorAll('[data-word-level]').forEach(b=>b.onclick=()=>{ui.level=b.dataset.wordLevel;makeRound();render();companionSay('Nå prøver vi en ny utfordring!','curious');scheduleCompanionOffer()});
  const board=root.querySelector('.word-hunt-board');
  board.addEventListener('pointerdown',pointerDown);
  board.addEventListener('pointermove',pointerMove);
  board.addEventListener('pointerup',pointerUp);
  board.addEventListener('pointercancel',clearPreview);
  board.addEventListener('click',tapSelect);
  document.addEventListener('keydown',e=>{if(e.key!=='Escape'||root.hidden)return;if(ui.entryPickerActive)closeWordHunt();else if(!root.querySelector('.word-hunt-theme-picker').hidden)closeThemePicker();else closeWordHunt()});
  return root;
}
function cellFromEvent(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest('.word-hunt-cell')}
function coord(cell){return cell?[Number(cell.dataset.r),Number(cell.dataset.c)]:null}
function line(a,b){
  if(!a||!b)return[];const [r1,c1]=a,[r2,c2]=b,dr=r2-r1,dc=c2-c1;
  if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)))return[];
  const n=Math.max(Math.abs(dr),Math.abs(dc)),sr=n?Math.sign(dr):0,sc=n?Math.sign(dc):0,out=[];
  for(let i=0;i<=n;i++)out.push([r1+sr*i,c1+sc*i]);return out
}
function wordFor(path){return path.map(([r,c])=>ui.grid[r][c]).join('')}
function keyPath(path){return path.map(([r,c])=>r+':'+c).join('|')}
function preview(path,anchor=false){
  const root=overlay();root.querySelectorAll('.word-hunt-cell').forEach(x=>x.classList.remove('preview','anchor'));
  if(anchor&&path[0])root.querySelector('[data-r="'+path[0][0]+'"][data-c="'+path[0][1]+'"]')?.classList.add('anchor');
  else for(const [r,c] of path)root.querySelector('[data-r="'+r+'"][data-c="'+c+'"]')?.classList.add('preview')
}
function clearPreview(){ui.drag=null;preview(ui.tapStart?[ui.tapStart]:[],!!ui.tapStart)}
function pointerDown(e){
  const cell=e.target.closest('.word-hunt-cell');if(!cell)return;
  // After a swipe, suppress only its synthetic trailing click.
  // A new real finger contact must never be blocked for 250ms.
  const root=e.currentTarget.closest('.word-hunt-overlay');
  if(root)root.dataset.draggedUntil='0';
  scheduleCompanionOffer();
  ui.drag={id:e.pointerId,start:coord(cell),end:coord(cell),moved:false};try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}
}
function pointerMove(e){
  if(!ui.drag||ui.drag.id!==e.pointerId)return;const cell=cellFromEvent(e);if(!cell)return;
  const end=coord(cell);
  if(end[0]!==ui.drag.start[0]||end[1]!==ui.drag.start[1]){
    if(!ui.drag.moved)ui.tapStart=null;
    ui.drag.moved=true;
  }
  ui.drag.end=end;preview(line(ui.drag.start,end))
}
function pointerUp(e){
  if(!ui.drag||ui.drag.id!==e.pointerId)return;
  const d=ui.drag;
  // On iOS a quick release may have a fresher endpoint than the last move.
  // Read the final point before releasing pointer capture, rather than
  // silently treating a real swipe as a tap.
  const cell=cellFromEvent(e);
  if(cell&&e.currentTarget.contains(cell)){
    const end=coord(cell);
    d.end=end;
    if(end[0]!==d.start[0]||end[1]!==d.start[1]){
      d.moved=true;ui.tapStart=null;
    }
  }
  ui.drag=null;
  if(d.moved){
    e.preventDefault();
    checkLine(line(d.start,d.end));
    overlay().dataset.draggedUntil=String(Date.now()+250);
  }else preview([],false)
}
function tapSelect(e){
  const root=overlay();if(Number(root.dataset.draggedUntil||0)>Date.now())return;
  const cell=e.target.closest('.word-hunt-cell');if(!cell)return;const p=coord(cell);
  if(!ui.tapStart){ui.tapStart=p;preview([p],true);companionSay('God start! Velg siste bokstav i ordet.','curious','start');return}
  const start=ui.tapStart;ui.tapStart=null;checkLine(line(start,p))
}
function checkLine(path){
  if(ui.completed)return;
  if(path.length<2){
    preview([],false);
    status('Velg bokstavene langs et ord.');
    foxReact('invalid');
    return;
  }
  const raw=wordFor(path),rev=[...raw].reverse().join('');let hit=null;
  for(const w of ui.words)if(!ui.found.has(w)&&(w===raw||w===rev)){hit=w;break}
  if(!hit){
    preview([],false);
    const repeated=ui.words.some(w=>ui.found.has(w)&&(w===raw||w===rev));
    const near=!repeated&&ui.words.some(w=>!ui.found.has(w)&&
      [raw,rev].some(candidate=>candidate.length>=2&&w.startsWith(candidate.slice(0,2))));
    ui.missCount++;
    if(ui.missCount>=4&&!ui.helpOffered){
      ui.helpOffered=true;
      companionSay('Skal vi prøve et hint sammen? Trykk på Hint når du vil!','curious','offer');
    }else foxReact(repeated?'repeated':near?'near':'wrong');
    status('Ikke et av ordene denne gangen. Prøv en annen retning.');
    return;
  }
  ui.found.set(hit,path);ui.lastFoundWord=hit;ui.missCount=0;ui.helpOffered=false;
  preview([],false);clearHintMarks();ui.hintsUsed=0;
  if(!ui.magicSeen||THEMES.reaction(hit))showMagic(hit);
  ui.magicSeen=true;
  try{navigator.vibrate?.(22)}catch(_){}
  try{typeof playSuccessTone==='function'&&playSuccessTone()}catch(_){}
  if(ui.found.size===ui.words.length){
    ui.completed=true;
    const earned=saveRound(),pack=THEMES.get(ui.theme);
    foxReact('complete',hit,earned);
    if(earned){
      status('✦ Du fikk et nytt klistremerke for «'+pack.title+'»! Det ligger i samleboken på Hjem.',true,true);
      showMagic(null,{icon:pack.icon,message:'Nytt klistremerke! «'+pack.title+'» er i samleboken.'});
    }else status('Du fant alle ordene! 🌟 Klar for en ny runde.',true);
  }else{
    foxReact('correct',hit);
    const left=ui.words.length-ui.found.size;
    status('Du fant '+hit+'! '+(left===1?'Ett ord igjen.':left+' ord igjen.'));
  }
  persistRound();
  render(false);
  scheduleCompanionOffer();
}
function status(message,success=false,newSticker=false){
  const s=overlay().querySelector('.word-hunt-status');
  const quiet=!success&&!newSticker&&(
    message==='Se etter ord bortover og nedover.'||
    message==='Ordene kan også ligge baklengs og på skrå.'
  );
  // The fox already guides the child: do not repeat its idle instructions
  // in a second big card. Keep meaningful progress and reward feedback.
  s.classList.toggle('is-quiet',quiet);
  s.classList.toggle('is-sticker-earned',newSticker);
  s.innerHTML='<strong>'+(success?'Ordjakten er løst!':'På sporet!')+'</strong>'+message;
  if(success){s.classList.remove('word-hunt-success');void s.offsetWidth;s.classList.add('word-hunt-success')}
}
function render(resetStatus=true){
  const root=overlay(),board=root.querySelector('.word-hunt-board');
  refreshCompanion();
  root.classList.toggle('word-hunt-complete',ui.completed);
  board.style.setProperty('--size',ui.size);
  board.innerHTML=ui.grid.flatMap((row,r)=>row.map((ch,c)=>'<button type="button" class="word-hunt-cell" role="gridcell" data-r="'+r+'" data-c="'+c+'" aria-label="'+ch+'">'+ch+'</button>')).join('');
  for(const path of ui.found.values())for(const [r,c] of path)board.querySelector('[data-r="'+r+'"][data-c="'+c+'"]')?.classList.add('found');
  root.querySelector('.word-hunt-targets-count').textContent=ui.found.size+' av '+ui.words.length;
  root.querySelector('.word-hunt-words').innerHTML=ui.words.map(w=>
    '<span class="word-hunt-word '+(ui.found.has(w)?'found ':'')+(ui.lastFoundWord===w?'just-found':'')+
    '" aria-label="'+w+(ui.found.has(w)?', funnet':', ikke funnet')+'">'+(ui.found.has(w)?'✓ ':'')+w+'</span>').join('');
  root.querySelectorAll('[data-word-level]').forEach(b=>b.classList.toggle('active',b.dataset.wordLevel===ui.level));
  const pack=THEMES.get(ui.theme);
  root.querySelector('.word-hunt-current-theme').textContent=pack.title;
  const mobile=root.querySelector('.word-hunt-theme-mobile');
  mobile.querySelector('.word-hunt-mobile-icon').textContent=pack.icon;
  mobile.querySelector('.word-hunt-mobile-label').textContent=pack.short;
  mobile.dataset.theme=pack.id;
  mobile.setAttribute('aria-label','Velg ordtema. Nå: '+pack.title);
  root.querySelector('.word-hunt-theme-icon').setAttribute('src',themeArtwork(pack.id));
  root.querySelector('.word-hunt-theme-open').setAttribute('aria-label','Velg ordtema. Nå: '+pack.title);
  const rounds=Number(stats().rounds||0);
  root.querySelector('.word-hunt-rounds').textContent=rounds===1?'Du har fullført 1 ordjakt':'Du har fullført '+rounds+' ordjakter';
  if(resetStatus){
    const intro=root.querySelector('.word-hunt-intro');
    intro.classList.remove('has-fox-hint');
    intro.textContent='Finn ordene! Dra over bokstavene, eller trykk på første og siste bokstav.';
    status(ui.level==='easy'?'Se etter ord bortover og nedover.':'Ordene kan også ligge baklengs og på skrå.');
  }
}
let previousOverflow='',previousFocus=null;
function openWordHunt(){
  const root=overlay();if(!root.hidden)return;
  previousOverflow=document.documentElement.style.overflow;
  previousFocus=document.activeElement;
  // Theme selection is the first thing the child sees, every time.
  // Returning players may resume the last unfinished board, also after reload.
  if(!ui.grid.length)restoreRound();
  ui.theme=stats().theme;
  ui.themeChoice=ui.theme;
  root.hidden=false;
  document.documentElement.style.overflow='hidden';
  showThemePicker(true);
}
function closeWordHunt(){
  const root=overlay();if(root.hidden)return;
  closeThemePicker();hideMagic();
  if(ui.companionTimer){clearTimeout(ui.companionTimer);ui.companionTimer=null}
  root.hidden=true;
  document.documentElement.style.overflow=previousOverflow;
  ui.drag=null;ui.tapStart=null;
  // When opened from Norsk's Eggenipa subject, return to that subject;
  // only direct Basecamp entry should jump back to the Home/Utforsk panel.
  const fromEggenipa=!!previousFocus?.closest?.('#eggenipa-world')&&
    !!document.querySelector('#subject-screen.active.eggenipa-active');
  if(!fromEggenipa&&typeof window.LARIA_RETURN_TO_BASECAMP==='function')window.LARIA_RETURN_TO_BASECAMP();
  const origin=previousFocus;
  previousFocus=null;previousOverflow='';
  // The illustrated Utforsk chooser is re-rendered on return, so the
  // original card can be detached. Focus its new accessible replacement.
  const fallback=document.querySelector('.bc13-panel:not([hidden]) .bc13-card[data-bc13-action="words"]');
  const target=origin?.isConnected&&origin.getClientRects().length?origin:fallback;
  if(target&&typeof target.focus==='function')
    try{target.focus({preventScroll:true})}catch(_){}
}
window.openWordHunt=openWordHunt;window.closeWordHunt=closeWordHunt;
})();