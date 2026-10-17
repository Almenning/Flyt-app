/* Læria · Gangemagi: a first-playable, original Tallenga activity.
 * The existing multiplication suite remains available through "Tabell og øving".
 * All presentation is local; no user profiling or remote assets.
 */
(function(){
 'use strict';
 const E=window.LARIA_GANGEMAGI_ENGINE;
 const root=document.getElementById('multiplication-lab-root');
 if(!E||!root||typeof window.openMultiplicationLab!=='function')return;
 const KEY='laria-gangemagi-v1';
 const originalOpen=window.openMultiplicationLab;
 let state=load(),undo=[],hintStep=0,notice='',suppressClickUntil=0,drag=null;
 let foxMood='curious',lastAction='',lastGroup=-1;
 let returnToMath=false;
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const berrySvg='<svg viewBox="0 0 48 56" aria-hidden="true" focusable="false"><defs><linearGradient id="gmB" x1=".2" x2=".85" y2="1"><stop stop-color="#ff9780"/><stop offset=".42" stop-color="#d94855"/><stop offset="1" stop-color="#9c3547"/></linearGradient></defs><path d="M24 14C11 5 2 19 6 33C10 46 19 52 24 54C30 51 41 43 43 29C45 16 34 8 24 14Z" fill="url(#gmB)" stroke="#963a46" stroke-width="2"/><path d="M24 12C14 4 9 4 7 8L15 17L4 14L9 22L23 18L38 21L44 13L31 16L40 9C36 5 29 6 24 12Z" fill="#5c9867" stroke="#407e60" stroke-width="1.4"/><path d="M24 12Q24 6 28 3" stroke="#4a7650" stroke-width="2.5" fill="none" stroke-linecap="round"/><g fill="#ffe8ac"><ellipse cx="16" cy="28" rx="1.9" ry="3.1" transform="rotate(-24 16 28)"/><ellipse cx="30" cy="27" rx="1.8" ry="3" transform="rotate(16 30 27)"/><ellipse cx="23" cy="37" rx="1.8" ry="3"/><ellipse cx="13" cy="36" rx="1.5" ry="2.5"/><ellipse cx="33" cy="37" rx="1.5" ry="2.5"/></g><path d="M11 24Q11 18 18 18" stroke="#ffb2a0" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/></svg>';
 function load(){try{return E.normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){return E.initial();}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
 function selectedFox(){
   const which=window.LARIA_FOX?.choice?.()==='girl'?'girl':'boy';
   const wardrobe=window.LARIA_FOX_WARDROBE;
   if(typeof wardrobe?.render==='function')
     return wardrobe.render(which,wardrobe.inventory?.()||{equipped:{}},'world');
   const path=window.LARIA_FOX?.worldSource?.(which)||window.LARIA_FOX?.source?.(which);
   return path?'<img src="'+esc(path)+'" alt="" aria-hidden="true">':'';
 }
 function message(){
   const amount=E.total(state),left=E.target(state)-amount;
   if(hintStep){
     const ix=state.counts.findIndex(n=>n<state.each);
     if(ix<0)return 'Du har fylt alle kurvene. Se hvordan gange og pluss henger sammen!';
     const missing=state.each-state.counts[ix];
     return hintStep===1?'Se på kurv '+(ix+1)+'. Hvor mange mangler for å få '+state.each+'?':
       'Det mangler '+missing+' i kurv '+(ix+1)+'. Trykk på kurven for å legge i ett bær.';
   }
   if(E.filled(state))return state.mode==='mission'?E.MISSIONS[state.mission].celebrate:
     'Du laget '+state.groups+' like grupper med '+state.each+' i hver!';
   if(notice)return notice;
   if(!amount)return state.mode==='mission'?'Trykk på en kurv! Hvert trykk legger i ett jordbær.':
     'Lag ditt eget gangestykke. Du bestemmer hvor mange som skal i hver kurv.';
   if(left===1)return 'Bare ett jordbær igjen!';
   if(lastAction==='add'&&lastGroup>=0&&lastGroup<state.groups){
     const count=state.counts[lastGroup];
     if(count===state.each)return 'Kurv '+(lastGroup+1)+' er full! Du har '+amount+' jordbær i alt.';
     return count+' av '+state.each+' i kurv '+(lastGroup+1)+'. Nå har vi '+amount+' jordbær!';
   }
   if(lastAction==='remove')return 'Du tok ut ett jordbær. Nå er det '+amount+' igjen. Prøv videre!';
   const ix=state.counts.findIndex(n=>n<state.each);
   return 'Det går fint! Prøv kurv '+(ix+1)+' nå.';
 }
 function fruit(n,empty){
   let parts='';
   for(let i=0;i<n;i++)parts+='<span class="gm-fruit gm-fruit-pop">'+berrySvg+'</span>';
   for(let i=0;i<empty;i++)parts+='<span class="gm-fruit gm-fruit-empty" aria-hidden="true"></span>';
   return parts;
 }
 function crate(i){
   const count=state.counts[i],missing=state.each-count;
   return '<div class="gm-crate-wrap"><button type="button" class="gm-crate '+(!missing?'gm-crate-full':'')+'" data-gm-action="basket" data-gm-basket="'+i+'" aria-label="Kurv '+(i+1)+': '+count+' av '+state.each+'. '+(missing?'Trykk for å legge i ett jordbær.':'Kurven er full.')+'">'+
      '<span class="gm-crate-handle" aria-hidden="true"></span>'+
      '<span class="gm-crate-caption">Kurv '+(i+1)+'</span>'+
      '<span class="gm-fruit-bed" aria-hidden="true">'+fruit(count,missing)+'</span>'+
      '<span class="gm-crate-front" aria-hidden="true"><span class="gm-crate-tag">'+count+' / '+state.each+'</span></span>'+
      '</button><button type="button" class="gm-remove" data-gm-action="remove" data-group="'+i+'" aria-label="Ta ett jordbær ut av kurv '+(i+1)+'" '+(!count?'disabled':'')+'><span aria-hidden="true">−</span></button></div>';
 }
 function challengeText(){
   return state.mode==='mission'?E.MISSIONS[state.mission].text:
       'Fyll kurvene akkurat slik du vil, og se hva som skjer med tallene.';
 }
 function storyTitle(){
   return state.mode==='mission'?E.MISSIONS[state.mission].heading:'Ditt eget jordbærmarked';
 }
 function render(){
   const prevFocus=root.contains(document.activeElement)?document.activeElement:null;
   const focusKey=prevFocus?.dataset?.gmAction?{action:prevFocus.dataset.gmAction,group:prevFocus.dataset.group,basket:prevFocus.dataset.gmBasket}:null;
   const result=E.equation(state),sum=result.total,goal=E.target(state),complete=result.complete;
   const nextIndex=state.counts.findIndex(n=>n<state.each);
   const free=state.mode==='free',modeClass=free?'free':'mission';
   const progress=Math.round(sum/goal*100);
   const msg=message();
   const equation=result.multiplication||result.addition;
   const active=state.mode==='mission'?'Oppdrag':'Fri lek';
   root.innerHTML='<main class="gm-shell" data-gm-mode="'+modeClass+'" data-gm-complete="'+complete+'">'+
      '<div class="gm-layout"><header class="gm-top">'+
      '<button type="button" class="gm-back" id="multiplication-lab-back" data-gm-action="back" aria-label="Tilbake til matte">‹</button>'+
      '<div class="gm-brand"><span class="gm-brand-mark">Læ<span>ria</span> ✦</span><small>TALLENGA / GANGEMAGI</small></div>'+
      '<button type="button" class="gm-classic" data-gm-action="classic" aria-label="Åpne gangetabell og øving">Tabellen <span aria-hidden="true">↗</span></button>'+
      '</header>'+
      '<div class="gm-heading"><div><span class="gm-eyebrow">✿ ET LITE MATTEEVENTYR</span><h1>Gangemagi</h1><p>Plukk, pakk og oppdag hva gange betyr.</p></div>'+
      '<div class="gm-modes" role="group" aria-label="Velg spillmåte">'+
      '<button type="button" class="'+(!free?'selected':'')+'" data-gm-action="mode" data-mode="mission" aria-pressed="'+(!free)+'">Et oppdrag</button>'+
      '<button type="button" class="'+(free?'selected':'')+'" data-gm-action="mode" data-mode="free" aria-pressed="'+free+'">Fri lek</button>'+
      '</div></div>'+
      '<section class="gm-world" aria-label="Jordbærmarkedet i Tallenga">'+
       '<header class="gm-story"><div class="gm-story-main"><span class="gm-story-kicker">'+(free?'DU BESTEMMER':'OPPDRAG '+(state.mission+1)+' AV '+E.MISSIONS.length)+'</span><h2>'+esc(storyTitle())+'</h2><p>'+esc(challengeText())+'</p></div>'+
       '<span class="gm-story-progress" aria-label="'+sum+' av '+goal+' jordbær pakket"><strong>'+sum+'</strong><span>av '+goal+'</span></span></header>'+
       '<div class="gm-scene"><div class="gm-fox" data-mood="'+(complete?'celebrate':hintStep?'help':foxMood)+'">'+
         '<div class="gm-fox-art" aria-hidden="true">'+selectedFox()+'</div>'+
         '<div class="gm-fox-bubble"><span class="gm-fox-bubble-label">Din rev sier:</span><span class="gm-fox-message" role="status" aria-live="polite">'+esc(msg)+'</span>'+
         '<button type="button" data-gm-action="read" class="gm-read" aria-label="Les opp det reven sier">◖))</button></div>'+
       '</div>'+
       '<div class="gm-market"><div class="gm-market-sign" aria-hidden="true"><span class="gm-sign-leaf">✿</span> Fra Tallengas hage <span class="gm-sign-leaf">✿</span></div>'+
       '<div class="gm-crates" style="--gm-groups:'+state.groups+';--gm-cols:'+(state.each<=5?state.each:Math.ceil(state.each/2))+'" role="group" aria-label="'+state.groups+' kurver som kan fylles med jordbær">'+state.counts.map((n,i)=>crate(i)).join('')+'</div>'+
       '<p class="gm-play-hint">'+(complete?'Se hva du har laget! Du kan endre kurvene eller fortsette.':state.groups>=4?'Trykk på kurvene. Sveip sidelengs for å se alle.':'Trykk på en kurv for å legge i et jordbær')+'</p></div>'+
       '</div>'+
       '<div class="gm-math"><div class="gm-math-label"><span>Dette har du laget</span><span class="gm-goal">Målet: '+state.groups+' × '+state.each+'</span></div>'+
         '<div class="gm-math-equation '+(complete?'gm-equation-win':'')+'" aria-label="'+esc(equation)+'">'+esc(equation)+'</div>'+
         '<div class="gm-progress-track" role="progressbar" aria-label="Jordbær pakket" aria-valuemin="0" aria-valuemax="'+goal+'" aria-valuenow="'+sum+'"><span style="width:'+progress+'%"></span></div>'+
         '<div class="gm-math-note">'+(result.multiplication?'Like mange i hver kurv betyr at vi kan gange.':'Når kurvene har ulikt antall, legger vi sammen.')+'</div></div>'+
       (complete?'<div class="gm-celebration" role="status"><span aria-hidden="true">✿</span><strong>'+esc(free?'Så fint du laget det!':'Oppdraget er klart!')+'</strong><span>Du fant '+goal+' jordbær.</span></div>':'')+
       '</section>'+
       '<div class="gm-actions '+(complete?'gm-actions-complete':'')+'">'+
         (complete?
           (free?'<button type="button" class="gm-next" data-gm-action="restart">Pakk kurvene på nytt <span aria-hidden="true">↻</span></button>':
              '<button type="button" class="gm-next" data-gm-action="next">Neste oppdrag <span aria-hidden="true">➜</span></button>'):
           '<button type="button" class="gm-pick" data-gm-action="source" aria-label="Plukk et jordbær og legg det i neste ledige kurv"><span class="gm-pick-fruit">'+berrySvg+'</span><span>Plukk et jordbær</span><small>Trykk eller dra</small></button>'+
           '<button type="button" class="gm-tool" data-gm-action="hint"><span aria-hidden="true">✧</span> Hint</button>')+
         '<button type="button" class="gm-tool" data-gm-action="undo" '+(!undo.length?'disabled':'')+'><span aria-hidden="true">↶</span> Angre</button>'+
       '</div>'+
       (free?'<div class="gm-free-controls" aria-label="Lag ditt eget gangestykke">'+factor('groups','Antall kurver',state.groups,1,E.MAX_GROUPS)+factor('each','Jordbær i hver',state.each,1,E.MAX_EACH)+'</div>':'')+
       '<footer class="gm-footer"><span>✿ '+state.wins.length+' av '+E.MISSIONS.length+' markedsblomster samlet</span><button type="button" data-gm-action="restart">Begynn på nytt ↻</button></footer>'+
       '</div></main>';
   if(focusKey){
     const old=Array.from(root.querySelectorAll('button[data-gm-action]')).find(el=>el.dataset.gmAction===focusKey.action&&(el.dataset.group||'')===(focusKey.group||'')&&(el.dataset.gmBasket||'')===(focusKey.basket||''));
     if(old&&!old.disabled)try{old.focus({preventScroll:true});}catch(_){}
   }
 }
 function factor(key,label,n,min,max){
   return '<div class="gm-free-adjust"><span>'+esc(label)+'</span><div><button type="button" data-gm-action="factor" data-key="'+key+'" data-step="-1" aria-label="Færre '+esc(label.toLowerCase())+'" '+(n<=min?'disabled':'')+'>−</button>'+
    '<strong>'+n+'</strong><button type="button" data-gm-action="factor" data-key="'+key+'" data-step="1" aria-label="Flere '+esc(label.toLowerCase())+'" '+(n>=max?'disabled':'')+'>+</button></div></div>';
 }
 function change(action){
   const before=JSON.stringify(state);
   const next=E.apply(state,action);
   const changed=JSON.stringify(next)!==before;
   if(!changed)return false;
   undo.push(E.normalize(state));if(undo.length>50)undo.shift();
   const wasComplete=E.filled(state);
   state=next;hintStep=0;notice='';
   lastAction=action.type;
   lastGroup=action.group!==undefined&&Number.isInteger(Number(action.group))?Number(action.group):-1;
   foxMood=E.filled(state)?'celebrate':action.type==='add'?'cheer':action.type==='remove'?'think':'curious';
   save();render();
   if(!wasComplete&&E.filled(state))celebrate();
   return true;
 }
 function celebrate(){
   const fox=root.querySelector('.gm-fox');
   if(fox){fox.classList.remove('gm-jubilee');void fox.offsetWidth;fox.classList.add('gm-jubilee');}
   const world=root.querySelector('.gm-world');
   if(world){world.classList.remove('gm-bloom');void world.offsetWidth;world.classList.add('gm-bloom');}
 }
 function back(){
   const origin=document.getElementById('multiplication-lab-screen')?.dataset.gmReturnOrigin;
   if(returnToMath||origin==='subject'){
     // The Maths screen already exists beneath Gangemagi. Returning to that
     // exact screen avoids rerunning journey navigation and losing the parent.
     const subject=document.getElementById('subject-screen');
     if(subject?.dataset.subject==='math'){
       try{showScreen('subject');return;}catch(_){}
     }
     try{openSubject('math');return;}catch(_){}
   }
   try{if(typeof window.LARIA_RETURN_TO_BASECAMP==='function'&&window.LARIA_RETURN_TO_BASECAMP())return;}catch(_){}
   try{openSubject('math');return;}catch(_){}
   try{showScreen('subject');}catch(_){}
 }
 function open(preserveOrigin=false){
   // Basecamp and Maths are different parents. Going to the classic submode
   // and back must retain the same parent rather than reset it.
   if(!preserveOrigin)returnToMath=!!document.querySelector('#subject-screen.active');
   const screen=document.getElementById('multiplication-lab-screen');
   if(screen){
     screen.dataset.returnToMathSubject=String(returnToMath);
     screen.dataset.gmReturnOrigin=returnToMath?'subject':'basecamp';
     screen.setAttribute('data-explore-release','explore-rc1');
   }
   hintStep=0;notice='';foxMood='curious';lastAction='';lastGroup=-1;render();
   try{showScreen('multiplication-lab');}catch(_){}
 }
 function speak(){
   if(!('speechSynthesis' in window))return;
   try{window.speechSynthesis.cancel();const phrase=new SpeechSynthesisUtterance(message());
     phrase.lang='nb-NO';phrase.rate=.86;phrase.pitch=1.04;window.speechSynthesis.speak(phrase);}catch(_){}
 }
 function nextOpen(){
   const screen=document.getElementById('multiplication-lab-screen'),backFlag=screen?.dataset.returnToMathSubject;
   originalOpen();
   if(screen)screen.dataset.returnToMathSubject=backFlag||'false';
 }
 function onClick(event){
   const button=event.target.closest('button[data-gm-action]');
   if(!button||!root.contains(button))return;
   // This is a standalone child game. Do not let old document-level
   // lab/back delegates also act on the same click.
   event.preventDefault();event.stopPropagation();
   const kind=button.dataset.gmAction;
   if(kind==='back'){back();return;}
   if(kind==='classic'){nextOpen();return;}
   if(kind==='back-from-classic'){open(true);return;}
   if(kind==='read'){speak();return;}
   if(kind==='hint'){hintStep=Math.min(2,hintStep+1);notice='';foxMood='help';render();speak();return;}
   if(kind==='undo'){
     if(undo.length){
       const previous=undo.pop();
       // A collected blossom stays earned even if the child experiments or undoes.
       state=E.normalize({...previous,wins:[...new Set([...previous.wins,...state.wins])]});
       save();hintStep=0;notice='';foxMood='curious';lastAction='';lastGroup=-1;render();
     }
     return;
   }
   if(kind==='restart'){change({type:'reset'});return;}
   if(kind==='mode'){if(button.dataset.mode!==state.mode)change({type:'mode',mode:button.dataset.mode});return;}
   if(kind==='next'){change({type:'next'});return;}
   if(kind==='factor'){change({type:button.dataset.key,value:state[button.dataset.key]+Number(button.dataset.step)});return;}
   if(kind==='remove'){change({type:'remove',group:Number(button.dataset.group)});return;}
   if(kind==='basket'){const i=Number(button.dataset.gmBasket);if(!change({type:'add',group:i})){notice='Denne kurven er full. Prøv en annen!';render();}return;}
   if(kind==='source'){
     if(Date.now()<suppressClickUntil)return;
     const ix=state.counts.findIndex(n=>n<state.each);
     if(ix>=0)change({type:'add',group:ix});
   }
 }
 function clearDrag(){
   if(drag?.ghost?.isConnected)drag.ghost.remove();
   drag=null;
 }
 function onPointerDown(event){
   const button=event.target.closest('button[data-gm-action="source"]');
   if(!button||!root.contains(button)||button.disabled||event.button!==0)return;
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,ghost:null};
 }
 function onPointerMove(event){
   if(!drag||event.pointerId!==drag.id)return;
   if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>9){
     drag.moved=true;
     const ghost=document.createElement('div');
     ghost.className='gm-drag-fruit';ghost.innerHTML=berrySvg;
     document.body.appendChild(ghost);drag.ghost=ghost;
   }
   if(drag.moved&&drag.ghost){
     drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
     if(event.cancelable)event.preventDefault();
   }
 }
 function onPointerUp(event){
   if(!drag||event.pointerId!==drag.id)return;
   if(drag.moved){
     suppressClickUntil=Date.now()+400;
     const el=document.elementFromPoint(event.clientX,event.clientY);
     const crate=el?.closest?.('[data-gm-basket]');
     const group=crate&&root.contains(crate)?Number(crate.dataset.gmBasket):NaN;
     if(Number.isInteger(group))change({type:'add',group});
   }
   clearDrag();
 }
 root.addEventListener('click',onClick);
 root.addEventListener('pointerdown',onPointerDown);
 window.addEventListener('pointermove',onPointerMove,{passive:false});
 window.addEventListener('pointerup',onPointerUp);
 window.addEventListener('pointercancel',clearDrag);
 // The classic exercise can still be used. Keep a visible return route when
 // its DOM is rebuilt after changing modes/questions.
 const observer=new MutationObserver(()=>{
   if(!root.querySelector('.mp-shell')||root.querySelector('.gm-classic-return'))return;
   const link=document.createElement('button');
   link.className='gm-classic-return';
   link.type='button';link.dataset.gmAction='back-from-classic';
   link.textContent='‹ Til Gangemagi';
   root.prepend(link);
 });
 observer.observe(root,{childList:true});
 window.LARIA_MULT_CLASSIC_OPEN=originalOpen;
 window.openMultiplicationLab=open;
 const entry=document.getElementById('open-multiplication-lab');
 // A DOM click passes an Event argument; it must not become preserveOrigin.
 if(entry)entry.onclick=()=>open(false);
 window.LARIA_GANGEMAGI=Object.freeze({version:'playable-v1',open,
   snapshot:()=>({...E.normalize(state),equation:E.equation(state),undo:undo.length}),
   reset:()=>{state=E.initial();save();hintStep=0;undo=[];render();}});
})();