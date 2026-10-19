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
 let foxMood='curious',lastAction='',lastGroup=-1,justAddedGroup=-1;
 let returnToMath=false,bookOpen=false;
 let selectedGroup=null; // transient UI selection, no changes to stored schema.
  let holdingBerry=false;
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
       'Det mangler '+missing+' i kurv '+(ix+1)+'. Velg kurven og trykk på Plukk et jordbær.';
   }
   if(E.filled(state))return state.mode==='mission'?E.MISSIONS[state.mission].celebrate:
     'Du laget '+state.groups+' like grupper med '+state.each+' i hver!';
   if(notice)return notice;
   if(lastAction==='select'&&selectedGroup!==null)return 'Kurv '+(selectedGroup+1)+' er valgt! Nå kan du plukke jordbær.';
   const same=state.counts.length>0&&state.counts[0]>0&&state.counts.every(n=>n===state.counts[0]);
   if(same)return 'Se! '+state.groups+' kurver med '+state.counts[0]+' i hver. '+state.groups+' ganger '+state.counts[0]+' er '+amount+'!';
   if(!amount)return state.mode==='mission'?(selectedGroup===null?'Trykk på en kurv for å starte!':'Kurv '+(selectedGroup+1)+' er valgt. Trykk på Plukk et jordbær!'):
     'Lag ditt eget gangestykke. Du bestemmer hvor mange som skal i hver kurv.';
   if(left===1)return 'Bare ett jordbær igjen!';
   if(lastAction==='add'&&lastGroup>=0&&lastGroup<state.groups){
     const count=state.counts[lastGroup];
     if(count===state.each)return state.mode==='mission'?'Kurv '+(lastGroup+1)+' er full! Velg en ny kurv.':
        'Kurv '+(lastGroup+1)+' er full! Du har '+amount+' jordbær i alt.';
     return count+' av '+state.each+' i kurv '+(lastGroup+1)+'. Nå har vi '+amount+' jordbær!';
   }
   if(lastAction==='remove')return 'Du tok ut ett jordbær. Nå er det '+amount+' igjen. Prøv videre!';
   const ix=state.counts.findIndex(n=>n<state.each);
   return 'Det går fint! Prøv kurv '+(ix+1)+' nå.';
 }
 /* Animate the ONE newly picked berry, never replay the pop on all existing
    berries when the live scene is re-rendered. Counting stays visually stable. */
 function fruit(n,empty,animateLast){
   let parts='';
   for(let i=0;i<n;i++)parts+='<span class="gm-fruit'+(animateLast&&i===n-1?' gm-fruit-pop':'')+'" data-gm-fruit="'+i+'">'+berrySvg+'</span>';
   for(let i=0;i<empty;i++)parts+='<span class="gm-fruit gm-fruit-empty" aria-hidden="true"></span>';
   return parts;
 }
 function crate(i){
   const count=state.counts[i],missing=state.each-count;
   const chosen=state.mode==='mission'&&selectedGroup===i;
   const invite=state.mode==='mission'&&selectedGroup===null&&missing>0&&!E.filled(state);
   const interaction=state.mode==='mission'?(chosen?'Denne kurven er valgt. Trykk på Plukk et jordbær.':missing?'Trykk her for å velge kurven.':'Denne kurven er full. Velg en annen.'):(missing?'Trykk for å legge i et jordbær.':'Kurven er full.');
   return '<div class="gm-crate-wrap"><button type="button" class="gm-crate '+(!missing?'gm-crate-full ':'')+(chosen?'gm-crate-selected ':'')+(invite?'gm-crate-invite':'')+'" data-gm-action="basket" data-gm-basket="'+i+'" data-gm-count="'+count+'" data-gm-selected="'+chosen+'" aria-pressed="'+chosen+'" aria-label="Kurv '+(i+1)+': '+count+' av '+state.each+'. '+interaction+'">'+
      (state.mode==='mission'?'<img class="gm-basket-illustration" alt="" aria-hidden="true" src="gangemagi-basket-locked-illustration.svg">':'<span class="gm-crate-handle" aria-hidden="true"></span><span class="gm-crate-caption">Kurv '+(i+1)+'</span>')+
      '<span class="gm-fruit-bed" aria-hidden="true" style="--gm-visible-cols:'+Math.max(1,Math.min(count,5))+'">'+fruit(count,state.mode==='mission'?0:missing,justAddedGroup===i)+'</span>'+
      '<span class="gm-crate-front" aria-hidden="true">'+(state.mode==='mission'?'<span class="gm-crate-caption">Kurv '+(i+1)+'</span>':'')+'<span class="gm-crate-tag">'+count+' / '+state.each+'</span></span>'+
      '</button><button type="button" class="gm-remove" data-gm-action="remove" data-group="'+i+'" aria-label="Ta ett jordbær ut av kurv '+(i+1)+'" '+(!count?'disabled':'')+'><span aria-hidden="true">−</span></button></div>';
 }
 function challengeText(){
   return state.mode==='mission'?E.MISSIONS[state.mission].text:
       'Fyll kurvene akkurat slik du vil, og se hva som skjer med tallene.';
 }
 function storyTitle(){
   return state.mode==='mission'?E.MISSIONS[state.mission].heading:'Ditt eget jordbærmarked';
 }

 /* Dagens oppdrag follows the child's real mission and never substitutes an image for play. */
 /* All instructional baskets reuse the exact same approved wicker material
    as the child's tappable baskets. Artwork is separate from live maths. */
 const gmBasketArt='<img class="gm-quest-wicker" alt="" src="gangemagi-basket-locked-illustration.svg">';
 const gmHandArt='<svg class="gm-quest-hand" viewBox="0 0 34 39" focusable="false" aria-hidden="true"><path d="M5 18q0-5 4-5t4 5V8q0-5 5-5t5 5v10q3-3 6 0q3 3 0 9l-4 7q-3 4-8 3l-10-9q-5-5-2-10Z" fill="#ffe6c5" stroke="#b9764b" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 9v12M10 18v4" stroke="#d3956d" stroke-width="1.6" stroke-linecap="round"/></svg>';
 function questStep(n,art,label){
   const current=E.filled(state)?3:(selectedGroup===null?1:2);
   const active=n===current;
   return '<div class="gm-quest-step'+(active?' gm-quest-step-active':'')+'" data-gm-step="'+n+'" role="listitem" '+(active?'aria-current="step" ':'')+'><span class="gm-quest-index" aria-hidden="true">'+n+'</span>'+
     '<span class="gm-quest-icon" aria-hidden="true">'+art+'</span><strong>'+esc(label)+'</strong></div>';
 }
 function questBoard(sum,goal){
   const groups=state.groups,each=state.each,mission=E.MISSIONS[state.mission];
   const fruitArt='<span class="gm-quest-fruit">'+berrySvg+'</span>';
   // The last illustrated step shows actual groups of filled mini-baskets,
   // not a second copy of the equation. One mini-basket per real group.
   const filledBasketPreview='<span class="gm-quest-filled-preview" aria-hidden="true">'+
     Array.from({length:groups},()=>'<span class="gm-quest-mini-basket">'+gmBasketArt+
       '<span class="gm-quest-mini-berries" style="--gm-mini-cols:'+Math.min(each,5)+'">'+
         Array.from({length:each},()=>'<i></i>').join('')+'</span></span>').join('')+
     '</span>';
   return '<header class="gm-story gm-quest" aria-label="Dagens oppdrag">'+
     '<div class="gm-quest-head"><span class="gm-quest-ribbon">✦ Dagens oppdrag ✦</span>'+
     '<span class="gm-quest-meta">Oppdrag '+(state.mission+1)+' av '+E.MISSIONS.length+' · '+esc(mission.heading)+'</span></div>'+
     '<h2 class="gm-quest-callout"><span>Fyll <em>'+groups+' '+(groups===1?'kurv':'kurver')+'</em> med</span> <span><em>'+each+' jordbær</em> i hver.</span></h2>'+
     '<div class="gm-quest-steps" role="list" aria-label="Tre steg i oppdraget">'+
       questStep(1,gmBasketArt+gmHandArt,'Velg en kurv')+
       '<span class="gm-quest-arrow" aria-hidden="true">➜</span>'+
       questStep(2,fruitArt+gmBasketArt,'Legg i jordbær')+
       '<span class="gm-quest-arrow" aria-hidden="true">➜</span>'+
       questStep(3,filledBasketPreview,'Se at '+groups+' × '+each+' = '+goal)+
     '</div></header>';
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
   root.innerHTML='<main class="gm-shell" data-gm-mode="'+modeClass+'" data-gm-groups="'+state.groups+'" data-gm-selected="'+selectedGroup+'" data-gm-complete="'+complete+'">'+
      '<div class="gm-layout"><header class="gm-top">'+
      '<button type="button" class="gm-back" id="multiplication-lab-back" data-gm-action="back" aria-label="Tilbake til matte">‹</button>'+
      '<div class="gm-brand"><span class="gm-brand-mark">Læ<span>ria</span> ✦</span><small>TALLENGA / GANGEMAGI</small></div>'+ 
      (!free?'<div class="gm-top-title"><h1>Gangemagi</h1><span>Et lite matteeventyr</span></div><div class="gm-top-progress">Oppdrag '+(state.mission+1)+' av '+E.MISSIONS.length+'</div>':'')+ 
      '<button type="button" class="gm-book-quick" data-gm-action="open-book" aria-label="Åpne Min markedsbok. '+state.wins.length+' av '+E.MISSIONS.length+' blomster samlet" title="Min markedsbok">✿ <span class="gm-book-quick-count">'+state.wins.length+'/'+E.MISSIONS.length+'</span></button>'+
      
      '</header>'+
      '<div class="gm-heading"><div><span class="gm-eyebrow">✿ ET LITE MATTEEVENTYR</span><h1>Gangemagi</h1><p>Plukk, pakk og oppdag hva gange betyr.</p></div></div>'+
       '<section class="gm-world" aria-label="Jordbærmarkedet i Tallenga">'+
       (free?'<header class="gm-story"><div class="gm-story-main"><span class="gm-story-kicker">DU BESTEMMER</span><h2>'+esc(storyTitle())+'</h2><p>'+esc(challengeText())+'</p></div>'+
       '<span class="gm-story-progress" aria-label="'+sum+' av '+goal+' jordbær pakket"><strong>'+sum+'</strong><span>av '+goal+'</span></span></header>':questBoard(sum,goal))+
       '<div class="gm-scene"><div class="gm-fox" data-mood="'+(complete?'celebrate':hintStep?'help':foxMood)+'">'+
         '<div class="gm-fox-art" aria-hidden="true">'+selectedFox()+'</div>'+
         '<div class="gm-fox-bubble"><span class="gm-fox-bubble-label">Din rev sier:</span><span class="gm-fox-message" role="status" aria-live="polite">'+esc(msg)+'</span>'+
         '<button type="button" data-gm-action="read" class="gm-read" aria-label="Les opp det reven sier">◖))</button></div>'+
       '</div>'+
       '<div class="gm-market"><div class="gm-market-sign" aria-hidden="true"><span class="gm-sign-leaf">✿</span> Fra Tallengas hage <span class="gm-sign-leaf">✿</span></div>'+
       '<div class="gm-crates" style="--gm-groups:'+state.groups+';--gm-cols:'+(state.each<=5?state.each:Math.ceil(state.each/2))+'" role="group" aria-label="'+state.groups+' kurver som kan fylles med jordbær">'+state.counts.map((n,i)=>crate(i)).join('')+'</div>'+
       '<p class="gm-play-hint">'+(complete?'Se hva du har laget! Du kan endre kurvene eller fortsette.':free?(state.groups>=4?'Trykk på kurvene. Sveip sidelengs for å se alle.':'Trykk på en kurv for å legge i et jordbær'):(holdingBerry?'Trykk på kurven du vil legge jordbæret i.':'Dra jordbær til kurvene, eller trykk på jordbær og deretter en kurv.'))+'</p></div>'+
       '</div>'+
       '<div class="gm-math"><div class="gm-math-label"><span>Dette lager du</span><span class="gm-goal">Målet: '+state.groups+' × '+state.each+'</span></div>'+
         '<div class="gm-math-equation '+(complete?'gm-equation-win':'')+'" aria-label="'+esc(equation)+'">'+esc(equation)+'</div>'+
         '<div class="gm-progress-track" role="progressbar" aria-label="Jordbær pakket" aria-valuemin="0" aria-valuemax="'+goal+'" aria-valuenow="'+sum+'"><span style="width:'+progress+'%"></span></div>'+ 
         (!free?'<div class="gm-berry-progress"><strong>'+sum+' av '+goal+'</strong><div aria-hidden="true">'+Array.from({length:goal},(_,i)=>'<span class="gm-berry-slot '+(i<sum?'gm-berry-earned':'')+'">'+berrySvg+'</span>').join('')+'</div></div>':'')+
         '<div class="gm-math-note'+(result.multiplication?' gm-math-discovery':'')+'"'+(result.multiplication?' role="status"':'')+'>'+(result.multiplication?'✦ Like grupper: '+state.groups+' kurver med '+state.counts[0]+' bær = '+sum+'!':'Når kurvene har ulikt antall, legger vi sammen.')+'</div></div>'+
       (complete?'<div class="gm-celebration" role="status"><span aria-hidden="true">✿</span><strong>'+esc(free?'Så fint du laget det!':'Oppdraget er klart!')+'</strong><span>Du fant '+goal+' jordbær.</span></div>':'')+
       '</section>'+
       '<div class="gm-actions '+(complete?'gm-actions-complete':'')+'">'+
         (complete?
           (free?'<button type="button" class="gm-next" data-gm-action="restart">Pakk kurvene på nytt <span aria-hidden="true">↻</span></button>':
              '<button type="button" class="gm-next" data-gm-action="next">Neste oppdrag <span aria-hidden="true">➜</span></button>'):
           '<button type="button" class="gm-pick" data-gm-action="source" aria-label="'+(free?'Plukk et jordbær og legg det i neste ledige kurv':'Plukk jordbær. Dra til en kurv, eller trykk på kurven etterpå.')+'"><span class="gm-pick-fruit">'+berrySvg+'</span><span>Plukk et jordbær</span><small>'+(free?'Trykk eller dra':holdingBerry?'Trykk på en kurv':'Dra eller trykk')+'</small></button>'+
           '<button type="button" class="gm-tool" data-gm-action="hint"><span aria-hidden="true">✧</span> Hint</button>')+
         '<button type="button" class="gm-tool" data-gm-action="undo" '+(!undo.length?'disabled':'')+'><span aria-hidden="true">↶</span> Angre</button>'+
       '</div>'+
       '<nav class="gm-secondary-nav" aria-label="Andre spillvalg"><div class="gm-modes" role="group" aria-label="Velg spillmåte">'+
        '<button type="button" class="'+(!free?'selected':'')+'" data-gm-action="mode" data-mode="mission" aria-pressed="'+(!free)+'">Et oppdrag</button>'+ 
        '<button type="button" class="'+(free?'selected':'')+'" data-gm-action="mode" data-mode="free" aria-pressed="'+free+'">Fri lek</button></div>'+ 
        '<button type="button" class="gm-classic" data-gm-action="classic" aria-label="Åpne gangetabellen og øving">Gangetabellen ↗</button></nav>'+ 
        (free?'<div class="gm-free-controls" aria-label="Lag ditt eget gangestykke">'+factor('groups','Antall kurver',state.groups,1,E.MAX_GROUPS)+factor('each','Jordbær i hver',state.each,1,E.MAX_EACH)+'</div>':'')+
       '<footer class="gm-footer"><span>✿ Blomster som du har samlet, er dine for alltid</span><button type="button" data-gm-action="restart">Begynn på nytt ↻</button></footer>'+book()+
       '</div></main>';
   document.body.classList.toggle('laria-markedsbok-open',bookOpen);
   if(bookOpen){
     const journal=root.querySelector('.gm-book');
     if(journal)for(const sibling of journal.parentElement.children)if(sibling!==journal)sibling.inert=true;
   }
   if(focusKey){
     const old=Array.from(root.querySelectorAll('button[data-gm-action]')).find(el=>el.dataset.gmAction===focusKey.action&&(el.dataset.group||'')===(focusKey.group||'')&&(el.dataset.gmBasket||'')===(focusKey.basket||''));
     if(old&&!old.disabled)try{old.focus({preventScroll:true});}catch(_){}
   }
   // Animation is a one-render signal, not persistent gameplay state.
   // Hint, speech and other re-renders must not replay the previous berry pop.
   justAddedGroup=-1;
 }
 function bookFoxMessage(){
   const n=state.wins.length;
   if(!n)return 'Vi kan begynne hvor du vil. Jeg blir med og hjelper deg!';
   if(n===E.MISSIONS.length)return 'Se! Vi fant alle markedsblomstene. Skal vi leke favoritten vår igjen?';
   return 'Vi har samlet '+n+' '+(n===1?'magisk blomst':'magiske blomster')+'! Hvor vil du dra videre?';
 }
 function book(){
   const n=state.wins.length,total=E.MISSIONS.length;
   if(!bookOpen)return '<section class="gm-book gm-book-collapsed" aria-label="Markedsboken"><button type="button" class="gm-book-toggle" data-gm-action="book" aria-expanded="false"><span class="gm-book-emblem" aria-hidden="true">✿</span><span><strong>Min markedsbok</strong><small>'+n+' av '+total+' blomster samlet · Åpne eventyrboken</small></span><span class="gm-book-chevron" aria-hidden="true">⌄</span></button></section>';
   const cards=E.MISSIONS.map((m,i)=>{
     const earned=state.wins.includes(m.id),selected=state.mode==='mission'&&state.mission===i;
     return '<button type="button" class="gm-book-mission '+(earned?'gm-book-earned ':'')+(selected?'gm-book-current':'')+
       '" data-gm-action="select-mission" data-index="'+i+'" '+(selected?'aria-current="step" ':'')+
       'aria-label="Oppdrag '+(i+1)+': '+esc(m.heading)+'. '+m.groups+' kurver med '+m.each+' i hver. '+(earned?'Blomst samlet.':'Blomsten kan samles.')+'">'+
       '<span class="gm-book-landscape gm-book-landscape-'+i+'" data-gm-art-index="'+i+'" aria-hidden="true"></span>'+
       '<span class="gm-book-flower" aria-hidden="true">'+(earned?'✿':'✧')+'</span>'+
       '<span class="gm-book-number" aria-hidden="true">OPPDRAG '+(i+1)+'</span>'+
       '<span class="gm-book-copy"><strong>'+esc(m.heading)+'</strong><small>'+m.groups+' kurver med '+m.each+' i hver</small></span>'+
       '</button>';
   }).join('');
   return '<section class="gm-book gm-book-open gm-book-v2" role="dialog" aria-modal="true" aria-label="Min markedsbok">'+
     '<button type="button" class="gm-book-back" data-gm-action="book" aria-label="Tilbake til Gangemagi"><span aria-hidden="true">‹</span> Tilbake til Gangemagi</button>'+
     '<div class="gm-book-v2-world"><div class="gm-book-v2-inner">'+
       '<header class="gm-book-intro">'+
         '<div class="gm-book-fox-art" aria-hidden="true">'+selectedFox()+'</div>'+
         '<div class="gm-book-intro-copy"><span class="gm-book-overline">✦ EVENTYRBOK FRA TALLENGA ✦</span>'+
         '<h2>Min markedsbok</h2><p>Her kan du velge et eventyr og spille det så mange ganger du vil. Jeg blir med deg!</p></div>'+
         '<div class="gm-book-trophy" role="img" aria-label="'+n+' av '+total+' magiske blomster samlet">'+
           '<span class="gm-book-trophy-flower" aria-hidden="true">✿</span>'+
           '<strong>'+n+' / '+total+'</strong><span>blomster</span></div>'+
       '</header>'+
       '<div class="gm-book-fox-line"><span class="gm-book-fox-sparkle" aria-hidden="true">✦</span>'+
         '<span>'+esc(bookFoxMessage())+'</span>'+
         '<button type="button" data-gm-action="book-read" aria-label="Hør hva reven sier" title="Hør reven">◖))</button></div>'+
       '<div class="gm-book-pages" id="gm-book-pages">'+
         '<p class="gm-book-invite">Trykk på et oppdrag for å gå til kurvene. Blomstene du samler er dine for alltid.</p>'+
         '<div class="gm-book-grid">'+cards+'</div>'+
       '</div></div><div class="gm-book-ribbon" aria-hidden="true">✦</div></div>'+
     '</section>';
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
   if(['next','mission','mode','reset','groups','each'].includes(action.type)){selectedGroup=null;holdingBerry=false;}
    // When a basket fills, return to the illustrated "choose a basket" step.
    // Never leave the Plukk action targeted at an already full basket.
    if(state.mode==='mission'&&selectedGroup!==null
       &&state.counts[selectedGroup]>=state.each&&!E.filled(state))selectedGroup=null;
   lastAction=action.type;
   lastGroup=action.group!==undefined&&Number.isInteger(Number(action.group))?Number(action.group):-1;
   justAddedGroup=action.type==='add'?lastGroup:-1;
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
   hintStep=0;notice='';foxMood='curious';lastAction='';lastGroup=-1;bookOpen=false;render();
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
   // A completed drag can dispatch a synthetic click on touch browsers.
   if(Date.now()<suppressClickUntil&&(kind==='basket'||kind==='source'))return;
   if(kind==='back'){back();return;}
   if(kind==='open-book'){bookOpen=true;render();root.querySelector('.gm-book-open .gm-book-back')?.focus({preventScroll:true});return;}
   if(kind==='book'){bookOpen=!bookOpen;render();if(!bookOpen){root.querySelector('.gm-book-quick')?.focus({preventScroll:true});root.querySelector('.gm-top')?.scrollIntoView({behavior:'auto',block:'start'});}return;}
   if(kind==='select-mission'){
     const index=Number(button.dataset.index);
     if(!Number.isInteger(index)||index<0||index>=E.MISSIONS.length)return;
     // Each selected adventure begins fresh. Undo stays inside one adventure;
     // already earned flowers remain attached to the child's saved progress.
     state=E.apply(state,{type:'mission',index});selectedGroup=null;holdingBerry=false;
     undo=[];hintStep=0;notice='';foxMood='curious';lastAction='';lastGroup=-1;
     bookOpen=false;save();render();
     root.querySelector('.gm-top')?.scrollIntoView({behavior:'auto',block:'start'});
     return;
   }
   if(kind==='book-read'){
     if('speechSynthesis' in window){
       try{window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(bookFoxMessage());voice.lang='nb-NO';voice.rate=.86;window.speechSynthesis.speak(voice);}catch(_){}
     }
     return;
   }
   if(kind==='classic'){nextOpen();return;}
   if(kind==='back-from-classic'){open(true);return;}
   if(kind==='read'){speak();return;}
   if(kind==='hint'){hintStep=Math.min(2,hintStep+1);notice='';foxMood='help';render();speak();return;}
   if(kind==='undo'){
     if(undo.length){
       const previous=undo.pop();
       // A collected blossom stays earned even if the child experiments or undoes.
       state=E.normalize({...previous,wins:[...new Set([...previous.wins,...state.wins])]});
       // Keep the child's basket choice when undoing a berry. Only clear
       // it when the restored state makes that target invalid or full.
       if(state.mode!=='mission'||selectedGroup!==null&&
         (!Number.isInteger(selectedGroup)||selectedGroup>=state.groups||
           state.counts[selectedGroup]>=state.each))selectedGroup=null;
       save();hintStep=0;notice='';foxMood='curious';lastAction='';lastGroup=-1;render();
     }
     return;
   }
   if(kind==='restart'){change({type:'reset'});return;}
   if(kind==='mode'){if(button.dataset.mode!==state.mode)change({type:'mode',mode:button.dataset.mode});return;}
   if(kind==='next'){change({type:'next'});return;}
   if(kind==='factor'){change({type:button.dataset.key,value:state[button.dataset.key]+Number(button.dataset.step)});return;}
   if(kind==='remove'){
     holdingBerry=false;
     const i=Number(button.dataset.group);
     if(state.mode==='mission')selectedGroup=i;
     change({type:'remove',group:i});return;
   }
   if(kind==='basket'){
     const i=Number(button.dataset.gmBasket);
     // Tap the actual berry to take it back out, without a separate minus action.
     // The containing basket is still a normal accessible button and the existing
     // large remove control is retained for keyboard / assistive technology.
     if(event.target.closest('.gm-fruit[data-gm-fruit]')&&state.counts[i]>0){
       holdingBerry=false;
       if(state.mode==='mission')selectedGroup=i;
       change({type:'remove',group:i});return;
     }
     if(state.mode==='mission'){
       if(holdingBerry){holdingBerry=false;selectedGroup=i;
         if(!change({type:'add',group:i})){notice='Denne kurven er full. Prøv en annen!';foxMood='help';render();}
         return;
       }
       const full=state.counts[i]===state.each;
       selectedGroup=full?null:i;lastAction='select';lastGroup=i;hintStep=0;
       notice=full?'Denne kurven er full. Velg en annen!':'';
       foxMood=full?'help':'cheer';render();return;
     }
     if(!change({type:'add',group:i})){notice='Denne kurven er full. Prøv en annen!';render();}
     return;
   }
   if(kind==='source'){
     if(Date.now()<suppressClickUntil)return;
     if(state.mode==='mission'){
       if(selectedGroup!==null&&state.counts[selectedGroup]<state.each){
         holdingBerry=false;change({type:'add',group:selectedGroup});return;
       }
       holdingBerry=true;notice='Jordbæret er plukket! Trykk på en kurv, eller dra jordbæret dit.';foxMood='cheer';render();
       return;
     }
     const ix=state.counts.findIndex(n=>n<state.each);
     if(ix>=0)change({type:'add',group:ix});
   }
 }
 // Pointer events power both interactions: source -> basket adds, basket
 // berry -> source removes. The actual maths still goes through E.apply.
 function clearDropHighlights(){
   root.querySelectorAll('.gm-drop-target,.gm-drop-blocked').forEach(el=>{
     el.classList.remove('gm-drop-target','gm-drop-blocked');
   });
 }
 function clearDrag(){
   if(drag?.ghost?.isConnected)drag.ghost.remove();
   clearDropHighlights();
   drag=null;
 }
 function onPointerDown(event){
   if(event.button!==0||!root.contains(event.target))return;
   const source=event.target.closest('button[data-gm-action="source"]');
   const berry=event.target.closest('.gm-fruit[data-gm-fruit]');
   const basket=berry?.closest('button[data-gm-action="basket"]');
   if(source&&!source.disabled){
     drag={id:event.pointerId,kind:'source',x:event.clientX,y:event.clientY,moved:false,ghost:null};
   }else if(basket){
     const group=Number(basket.dataset.gmBasket);
     if(state.counts[group]>0)drag={id:event.pointerId,kind:'basket',group,
       x:event.clientX,y:event.clientY,moved:false,ghost:null};
   }
 }
 function onPointerMove(event){
   if(!drag||event.pointerId!==drag.id)return;
   if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>9){
     drag.moved=true;
     const ghost=document.createElement('div');
     ghost.className='gm-drag-fruit';ghost.innerHTML=berrySvg;
     document.body.appendChild(ghost);drag.ghost=ghost;
   }
   if(!drag.moved)return;
   if(drag.ghost){
     drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
   }
   clearDropHighlights();
   const under=document.elementFromPoint(event.clientX,event.clientY);
   if(drag.kind==='source'){
     const basket=under?.closest?.('button[data-gm-action="basket"]');
     if(basket&&root.contains(basket)){
       const group=Number(basket.dataset.gmBasket);
       basket.classList.add(state.counts[group]<state.each?'gm-drop-target':'gm-drop-blocked');
     }
   }else{
     const source=under?.closest?.('button[data-gm-action="source"]');
     if(source&&root.contains(source))source.classList.add('gm-drop-target');
   }
   if(event.cancelable)event.preventDefault();
 }
 function onPointerUp(event){
   if(!drag||event.pointerId!==drag.id)return;
   const current=drag;
   if(current.moved){
     // Without suppression, iOS can fire a second click after pointerup.
     suppressClickUntil=Date.now()+450;
     const under=document.elementFromPoint(event.clientX,event.clientY);
     if(current.kind==='source'){
       const basket=under?.closest?.('button[data-gm-action="basket"]');
       const group=basket&&root.contains(basket)?Number(basket.dataset.gmBasket):NaN;
       if(Number.isInteger(group)){
         holdingBerry=false;
         if(state.mode==='mission')selectedGroup=group;
         if(!change({type:'add',group})){
           notice='Denne kurven er full. Prøv en annen!';foxMood='help';render();
         }
       }
     }else{
       const source=under?.closest?.('button[data-gm-action="source"]');
       if(source&&root.contains(source)){
         holdingBerry=false;
         if(state.mode==='mission')selectedGroup=current.group;
         change({type:'remove',group:current.group});
       }
     }
   }
   clearDrag();
 }
 function onJournalKey(event){
   if(!bookOpen)return;
   if(event.key==='Escape'){
     event.preventDefault();bookOpen=false;render();
     root.querySelector('.gm-top')?.scrollIntoView({behavior:'auto',block:'start'});
     root.querySelector('.gm-book-quick')?.focus({preventScroll:true});
     return;
   }
   if(event.key!=='Tab')return;
   const items=[...root.querySelectorAll('.gm-book-open button:not(:disabled)')];
   if(!items.length)return;
   const first=items[0],last=items[items.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 root.addEventListener('keydown',onJournalKey);
 root.addEventListener('click',onClick);
 root.addEventListener('pointerdown',onPointerDown);
 window.addEventListener('pointermove',onPointerMove,{passive:false});
 window.addEventListener('pointerup',onPointerUp);
 window.addEventListener('pointercancel',clearDrag);
 window.addEventListener('blur',clearDrag);
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
 function openMission(index){
   if(!Number.isInteger(index)||index<0||index>=E.MISSIONS.length)return false;
   state=E.apply(state,{type:'mission',index});selectedGroup=null;holdingBerry=false;
   undo=[];hintStep=0;notice='';foxMood='curious';lastAction='';lastGroup=-1;
   bookOpen=false;selectedGroup=null;save();open(false);return true;
 }
 window.LARIA_GANGEMAGI=Object.freeze({version:'playable-v1',open,openMission,
   snapshot:()=>({...E.normalize(state),equation:E.equation(state),selectedBasket:selectedGroup,undo:undo.length}),
   reset:()=>{clearDrag();suppressClickUntil=0;state=E.initial();selectedGroup=null;holdingBerry=false;save();hintStep=0;undo=[];render();}});
})();