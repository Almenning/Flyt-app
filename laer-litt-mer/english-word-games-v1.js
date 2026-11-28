/* English picture match and letter-grid hunt for the SHA-verified Kinnaklova.
 * All vocab is authored here; Norwegian activity data and progress are untouched. */
(function(root,factory){
 'use strict';
 const game=factory();
 if(typeof module==='object'&&module.exports){module.exports=game;return}
 root.LARIA_ENGLISH_WORD_GAMES=game.setup(root);
})(typeof window==='object'?window:null,()=>{
 'use strict';
 const KEY='laria-english-word-games-v1';
 const VERSION=1;
 const WORDS=Object.freeze({
  church:{nb:'kirke',where:'Se etter steinbygningen med den store døra.',box:[17,51,23,25]},
  bird:{nb:'fugl',where:'Se etter hvite vinger høyt over sjøen.',box:[77,15,8,13]},
  sea:{nb:'sjø',where:'Se etter det som er blått og bølger.',box:[84,47,15,16]},
  house:{nb:'hus',where:'Se etter en rød bygning nederst til høyre.',box:[80,81,17,15]},
  mountain:{nb:'fjell',where:'Se etter toppene midt i bildet.',box:[40,27,22,20]},
  tower:{nb:'tårn',where:'Se etter et lite tak på en høy steinmur.',box:[56,64,8,23]},
  path:{nb:'sti',where:'Se etter veien fra kirkedøra mot tårnet.',box:[39,77,16,12]},
  sky:{nb:'himmel',where:'Se høyt oppe over fjelltoppene.',box:[51,5,19,15]},
  cat:{nb:'katt'},dog:{nb:'hund'},sun:{nb:'sol'},fish:{nb:'fisk'},boat:{nb:'båt'},rock:{nb:'stein'}
 });
 const PICTURE=Object.freeze([['bird','church','sea','house'],['mountain','tower','path','sky']]);
 // Short words, left-to-right or top-to-bottom. Filler does not spell a second
 // occurrence of a target. The grid solver validates both selection directions.
 const GRIDS=Object.freeze([
  {title:'Dyr og dagen',rows:['CATQF','RUNZI','EDAGS','ADOGH','SUNYX'],words:['cat','dog','sun','fish']},
  {title:'Ved sjøen',rows:['BOATM','LRSQX','EOKYU','DCYRM','ZKSEA'],words:['boat','sky','rock','sea']}
 ]);
 const MODES=Object.freeze(['picture','grid']);
 const own=(o,k)=>Object.hasOwn(o,k);
 const rounds=mode=>mode==='picture'?PICTURE:GRIDS;
 const targets=(mode,index)=>mode==='picture'?PICTURE[index]:GRIDS[index].words;
 const clean=raw=>Object.fromEntries(MODES.map(mode=>{
  const state=raw?.version===VERSION&&raw[mode];
  const round=Number.isInteger(state?.round)&&state.round>=0&&state.round<rounds(mode).length?state.round:0;
  const found=Array.isArray(state?.found)?[...new Set(state.found)].filter(word=>targets(mode,round).includes(word)):[];
  const completed=Number.isInteger(state?.completed)&&state.completed>=0?Math.min(9999,state.completed):0;
  return [mode,{round,found,completed}];
 }));
 function line(first,last){
  if(!first||!last)return [];
  const [r,c]=first,[endR,endC]=last;
  if(![r,c,endR,endC].every(n=>Number.isInteger(n)&&n>=0&&n<5)||r!==endR&&c!==endC)return [];
  const dy=Math.sign(endR-r),dx=Math.sign(endC-c),n=Math.max(Math.abs(endR-r),Math.abs(endC-c));
  return Array.from({length:n+1},(_,i)=>[r+dy*i,c+dx*i]);
 }
 function answer(grid,first,last){
  const coords=line(first,last);
  const label=coords.map(([r,c])=>grid.rows[r][c]).join('').toLowerCase();
  return grid.words.find(word=>word===label||word===[...label].reverse().join(''))||null;
 }
 function locate(grid,word){
  for(let r=0;r<5;r++)for(let c=0;c<5;c++)for(const [endR,endC] of [[r+word.length-1,c],[r,c+word.length-1]]){
   const coords=line([r,c],[endR,endC]);
   if(coords.map(([y,x])=>grid.rows[y][x]).join('').toLowerCase()===word)return coords;
  }
  return [];
 }
 function setup(win){
  const doc=win.document;
  let dialog,mode,origin,progress,selected,anchor,hint,speech,drag,ignoreUntil=0;
  const icons={
   back:'<path d="m15 5-7 7 7 7"/>',
   audio:'<path d="M5 9v6h4l5 4V5L9 9zM17 8q4 4 0 8M20 5q6 7 0 14"/>',
   picture:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m4 16 5-5 4 4 2-2 5 4M16 8h1"/>',
   grid:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
   hint:'<path d="M9 18h6M10 21h4M9 15c0-3-3-3-3-7a6 6 0 0 1 12 0c0 4-3 4-3 7z"/>'
  };
  function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>'}
  const press=(action,text,cls='')=>'<button class="ewg-button '+cls+'" type="button" data-ewg="'+action+'"'+(action==='back'?' aria-label="Tilbake"':'')+'>'+text+'</button>';
  const titles={menu:'Ordlek',picture:'Find the Words',grid:'Word Hunt'};
  const active=()=>progress[mode];
  const found=word=>active().found.includes(word);
  const complete=()=>mode!=='menu'&&active().found.length===targets(mode,active().round).length;
  const coord=node=>node?[Number(node.dataset.r),Number(node.dataset.c)]:null;
  const activeTarget=()=>selected&&!found(selected)?selected:targets(mode,active().round).find(word=>!found(word))||null;
  function persist(){
   try{win.localStorage.setItem(KEY,JSON.stringify({version:VERSION,...progress}))}catch(_){/* Continue without storage. */}
  }
  function stopAudio(){
   if(speech){try{win.speechSynthesis?.cancel()}catch(_){} speech=null}
  }
  function feedback(message,mood='idle'){
   const status=dialog.querySelector('#ewg-status');
   if(status)status.textContent=message;
   const troll=dialog.querySelector('.ewg-troll');
   win.LARIA_TROLL_ACTOR?.mood?.(troll,mood,{say:false});
  }
  function listen(word){
   if(!own(WORDS,word))return;
   try{
    const engine=win.speechSynthesis;
    if(!engine||!win.SpeechSynthesisUtterance)throw new Error('unavailable');
    const list=engine.getVoices?.()||[];
    const en=list.filter(v=>/^en(?:-|_)/i.test(v.lang));
    const voice=en.find(v=>v.localService===true&&/^en[-_]gb$/i.test(v.lang))||en.find(v=>v.localService===true);
    if(list.length&&!voice)throw new Error('unavailable');
    stopAudio();
    win.stopSpeech?.();
    const utterance=new win.SpeechSynthesisUtterance(word);
    utterance.lang=voice?.lang.replace('_','-')||'en-GB';utterance.rate=.86;
    if(voice)utterance.voice=voice;
    utterance.onend=()=>{if(speech===utterance)speech=null};
    utterance.onerror=()=>{if(speech===utterance){speech=null;feedback('Opplesing er ikke tilgjengelig akkurat nå. Du kan fortsatt spille.')}};
    speech=utterance;engine.speak(utterance);
   }catch(_){feedback('Opplesing er ikke tilgjengelig akkurat nå. Du kan fortsatt spille.')}
  }
  function picture(){
   const words=targets(mode,active().round);
   return '<div class="ewg-picture"><img class="ewg-landscape" alt="Kinnaklova, med fjell, sjø og den gamle steinkirken" width="1672" height="941" draggable="false">'+
    words.map(word=>{
     const [x,y,w,h]=WORDS[word].box;
     return '<button class="ewg-object'+(found(word)?' is-found':'')+(hint===word?' is-hinted':'')+'" type="button" data-ewg-object="'+word+'" '+
      'aria-label="'+WORDS[word].nb+'" style="--x:'+x+'%;--y:'+y+'%;--w:'+w+'%;--h:'+h+'%"'+(found(word)?' disabled':'')+'>'+
      '<span aria-hidden="true">'+(found(word)?'✓':'')+'</span></button>';
    }).join('')+'</div>';
  }
  function grid(){
   const board=GRIDS[active().round];
   const match=new Set(active().found.flatMap(word=>locate(board,word).map(p=>p.join(':'))));
   const first=hint?locate(board,hint)[0]?.join(':'):null;
   return '<div class="ewg-grid" aria-label="Bokstaver i '+board.title+'" role="group">'+board.rows.map((row,r)=>
    [...row].map((letter,c)=>{
     const id=r+':'+c;
     return '<button class="ewg-letter'+(match.has(id)?' is-found':'')+(anchor?.join(':')===id?' is-held':'')+
      (first===id?' is-hinted':'')+'" type="button" data-r="'+r+'" data-c="'+c+'" lang="en" aria-label="'+letter+', rad '+(r+1)+', kolonne '+(c+1)+'">'+letter+'</button>';
    }).join('')).join('')+'</div>';
  }
  function header(){
   return '<header class="ewg-header">'+press('back',icon('back')+'<span>Tilbake</span>','ewg-back')+
    '<div><p class="ewg-kicker">ENGELSK · KINNAKLOVA</p><h2 id="ewg-title"'+(mode==='menu'?'':' lang="en"')+'>'+titles[mode]+'</h2></div></header>';
  }
  function companion(){
   const actor=win.LARIA_TROLL_ACTOR;
   const id=actor?.choice?.()||'storesoster';
   const name=actor?.label?.(id)||'Storesøster';
   return '<div class="ewg-guide">'+
    '<div class="ewg-troll laria-troll-host" data-troll="'+id+'" data-laria-troll-mood="idle">'+
    '<img alt="" draggable="false" src="'+(actor?.source?.(id)||'./assets/gangemagi-troll/storesoster.webp')+'"></div>'+
    '<div><span class="ewg-guide-name">'+name+'</span><p id="ewg-status" role="status" aria-live="polite"></p></div></div>';
  }
  function render(focus,utterance,mood){
   const scroller=dialog.scrollTop;
   dialog.className='ewg-game laria-word-play ewg-mode-'+mode;
   if(mode==='menu'){
    dialog.innerHTML=header()+'<div class="ewg-menu-art"><div class="ewg-menu-copy"><span class="ewg-kicker">ORDLANDSBYEN</span>'+
     '<p>Finn stedet. Hør ordet. Ta med deg et nytt engelsk ord.</p></div></div><div class="ewg-choices">'+
     press('picture',icon('picture')+'<span><strong lang="en">Find the Words</strong><small>Finn engelske ord i Kinnaklova-bildet.</small></span>')+
     press('grid',icon('grid')+'<span><strong lang="en">Word Hunt</strong><small>Jakt på ord mellom bokstavene.</small></span>')+
     '</div>'+companion();
    dialog.querySelector('.ewg-menu-art').style.backgroundImage='url("'+win.LARIA_KINNAKLOVA.art+'")';
    feedback('Hvilken ordlek skal vi ta?','wave');
   }else{
    const words=targets(mode,active().round);
    dialog.innerHTML=header()+'<div class="ewg-layout"><div class="ewg-board"><div class="ewg-instruction">'+
     '<strong>'+(mode==='picture'?'Velg et ord. Trykk på riktig ting.':'Finn ordene i bokstavene.')+'</strong>'+
     '<span class="ewg-count">'+active().found.length+' av '+words.length+'</span></div>'+
     (mode==='picture'?picture():grid())+'</div><div class="ewg-panel">'+
     '<div class="ewg-targets" role="group" aria-label="Engelske ord">'+
     words.map(word=>'<button class="ewg-button ewg-word'+(found(word)?' is-found':'')+
      '" data-ewg-word="'+word+'" type="button" aria-pressed="'+String(selected===word)+'">'+
      '<span lang="en">'+word+'</span>'+(found(word)?'<small><span class="ewg-found-mark" aria-hidden="true">✓</span> '+WORDS[word].nb+'</small>':'')+'</button>').join('')+'</div>'+
     '<div class="ewg-tools">'+press('listen',icon('audio')+'Hør ordet')+press('hint',icon('hint')+'Hint')+'</div>'+
     companion()+'<button class="ewg-button ewg-next" type="button" data-ewg="next"'+(complete()?'':' hidden')+'>Ny runde <span aria-hidden="true">›</span></button></div></div>';
    if(mode==='picture')dialog.querySelector('.ewg-landscape').src=win.LARIA_KINNAKLOVA.art;
    feedback(utterance||(complete()?'Du fant alle fire!':mode==='picture'?'Velg et ord. Jeg blir med og leter!':'Trykk på første og siste bokstav, eller dra mellom dem.'),mood||'idle');
   }
   dialog.scrollTop=scroller;
   if(focus)dialog.querySelector(focus)?.focus({preventScroll:true});
  }
  function resetTransient(){selected=null;anchor=null;hint=null;drag=null;ignoreUntil=0}
  function choose(next){stopAudio();resetTransient();mode=next;dialog.scrollTop=0;render('.ewg-back')}
  function match(word,focus){
   if(!word){hint=null;anchor=null;render(focus,'Ikke helt. Prøv en gang til!','support');return}
   if(found(word)){render(focus,'Det ordet har du allerede funnet.','curious');return}
   active().found.push(word);hint=null;anchor=null;selected=null;
   if(complete())active().completed=Math.min(9999,active().completed+1);
   persist();
   render(focus,complete()?'Alle fire! '+word+' betyr '+WORDS[word].nb+'.':'Du fant '+word+'! Det betyr '+WORDS[word].nb+'.','celebrate');
  }
  function cell(start,end,focus){anchor=null;match(answer(GRIDS[active().round],start,end),focus)}
  function handleClick(event){
   const btn=event.target.closest('button');
   if(!btn||!dialog.contains(btn))return;
   const action=btn.dataset.ewg,word=btn.dataset.ewgWord,object=btn.dataset.ewgObject;
   if(action==='back'){if(mode==='menu')dialog.close();else choose('menu');return}
   if(MODES.includes(action)){choose(action);return}
   if(mode==='menu')return;
   if(action==='listen'){if(selected||activeTarget())listen(selected||activeTarget());else feedback('Velg et ord for å høre det.');return}
   if(action==='hint'){
    if(complete())return;
    hint=activeTarget();
    if(mode==='picture')selected=hint;
    render('[data-ewg="hint"]',mode==='picture'?WORDS[hint].where:'Se etter den første bokstaven i '+hint+'.','hint');
    return;
   }
   if(action==='next'&&complete()){
    active().round=(active().round+1)%rounds(mode).length;active().found=[];
    persist();choose(mode);return;
   }
   if(word&&own(WORDS,word)){
    selected=word;hint=null;
    render('[data-ewg-word="'+word+'"]',found(word)?word+' betyr '+WORDS[word].nb+'.':mode==='picture'?'Finn riktig ting til '+word+'.':'Finn '+word+' blant bokstavene.','think');
    return;
   }
   if(object&&mode==='picture'){
    if(!selected||found(selected)){feedback('Velg et ord først.','think');return}
    const focus='[data-ewg-word="'+selected+'"]';
    if(object!==selected){feedback('Ikke helt. Se en gang til, eller trykk på Hint.','support');return}
    match(selected,focus);return;
   }
   if(mode==='grid'&&btn.matches('.ewg-letter')&&!complete()&&Date.now()>=ignoreUntil){
    const point=coord(btn),focus='[data-r="'+point[0]+'"][data-c="'+point[1]+'"]';
    if(anchor&&anchor.join()!==point.join()){cell(anchor,point,focus);return}
    anchor=anchor?null:point;render(focus,'Trykk på den siste bokstaven i ordet.','think');
   }
  }
  function onDown(e){
   if(mode!=='grid'||complete()||e.button!==0||!e.isPrimary)return;
   const node=e.target.closest('.ewg-letter'),board=node?.closest('.ewg-grid');
   if(!node||!board)return;
   drag={id:e.pointerId,start:coord(node),end:coord(node),x:e.clientX,y:e.clientY,board,moved:false};
  }
  function onMove(e){
   if(!drag||e.pointerId!==drag.id)return;
   if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
   drag.moved=true;
   try{drag.board.setPointerCapture(e.pointerId)}catch(_){}
   const node=doc.elementFromPoint(e.clientX,e.clientY)?.closest('.ewg-letter');
   if(node&&drag.board.contains(node))drag.end=coord(node);
   drag.board.querySelectorAll('.is-preview').forEach(el=>el.classList.remove('is-preview'));
   for(const [r,c] of line(drag.start,drag.end))drag.board.querySelector('[data-r="'+r+'"][data-c="'+c+'"]')?.classList.add('is-preview');
  }
  function onUp(e){
   if(!drag||e.pointerId!==drag.id)return;
   const d=drag;drag=null;
   if(!d.moved)return;
   ignoreUntil=Date.now()+280;
   if(d.start.join()!==d.end.join())cell(d.start,d.end,null);
   else d.board.querySelectorAll('.is-preview').forEach(el=>el.classList.remove('is-preview'));
  }
  function open(button){
   if(!win.LARIA_KINNAKLOVA?.ready()||dialog?.open)return false;
   try{progress=clean(JSON.parse(win.localStorage.getItem(KEY)||'null'))}catch(_){progress=clean(null)}
   if(!dialog){
    dialog=doc.createElement('dialog');dialog.setAttribute('aria-labelledby','ewg-title');
    dialog.addEventListener('click',handleClick);
    dialog.addEventListener('pointerdown',onDown);
    dialog.addEventListener('pointermove',onMove);
    dialog.addEventListener('pointerup',onUp);
    dialog.addEventListener('pointercancel',()=>{drag?.board.querySelectorAll('.is-preview').forEach(el=>el.classList.remove('is-preview'));drag=null});
    dialog.addEventListener('cancel',event=>{if(mode!=='menu'){event.preventDefault();choose('menu')}});
    dialog.addEventListener('close',()=>{stopAudio();resetTransient();origin?.focus({preventScroll:true});origin=null});
    doc.body.append(dialog);
   }
   origin=button||doc.activeElement;mode='menu';resetTransient();render();
   dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.ewg-back').focus({preventScroll:true});
   return true;
  }
  return Object.freeze({open});
 }
 return Object.freeze({KEY,VERSION,WORDS,PICTURE,GRIDS,clean,line,answer,locate,setup});
});
