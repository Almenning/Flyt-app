/* Kontinentseilasen, geography 2: private playable voyage.
 * Authoritative country positions remain in the real Læria globe. The harbor
 * scene below is decorative development art, not a fictional map of Earth.
 */
(function(){
 'use strict';
 const buddy=window.LARIA_CHAPTER_FOX_BUDDY;
 const core=window.LARIA_GEO_CONTINENT_VOYAGE;if(!core)return;
 let ui=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fox=()=>'<img class="cv-fox" alt="Reven din er med på reisen" src="'+esc(ui.foxSrc)+'">';
 const shell=body=>'<div class="cv-shell"><header class="cv-top"><button type="button" data-cv-act="close" class="cv-quiet">← Tilbake</button>'+
   '<span class="cv-development">INTERN TEST · GEOGRAFI KAPITTEL 2</span></header>'+
   '<main class="cv-main">'+body+'</main></div>';
 function overview(){
   // Separate opt-in art review; never replace the tested default map silently.
   const paintedCandidate=new URLSearchParams(window.location.search).get('geography-chapter2-art-v2')==='1';
   const mapArt=paintedCandidate?'./geography-continent-voyage-art-candidate-v2.svg':'./geography-continent-voyage-storymap-v1.svg';
   const p=core.progress(ui.state),session=core.resume(ui.state);
   const positions={kompassholmen:[27,24],passbrygga:[75,39],
     havpassasjen:[28,55],naturøya:[74,71],reisefyret:[45,86]};
   const recommended=core.STAGES.find(stop=>stop.id===p.recommended)||core.STAGES[0];
   // Keep a voluntary start beside the fox before the map on small devices.
   // An unfinished voyage gets Resume rather than a second start.
   const quickStart=!session?'<button type="button" class="cv-quick-start" data-cv-act="quick-start" data-cv-stage="'+esc(recommended.id)+'">'+
     '✦ '+(p.complete?'Seil igjen til ':'Seil til ')+esc(recommended.title)+' →</button>':'';
   const places=core.STAGES.map((s,i)=>{
     const visited=p.places.find(x=>x.id===s.id)?.visited,point=positions[s.id];
     if(!point)throw Error('Kontinentseilasen missing storybook stop '+s.id);
     return '<button type="button" class="cv-place cv-map-stop'+(visited?' cv-map-stop-visited':'')+(s.id===recommended.id?' cv-map-stop-recommended':'')+'" data-cv-act="stage" data-cv-stage="'+esc(s.id)+'"'+
       ' style="--cv-x:'+point[0]+'%;--cv-y:'+point[1]+'%"'+
       ' aria-label="'+esc(s.title)+'. '+esc(s.focus)+(visited?'. Utforsket, spill igjen':'. Utforsk nå')+'">'+
       '<span class="cv-place-symbol" aria-hidden="true">'+(visited?'✓':String(i+1))+'</span>'+
       '<span class="cv-map-stop-name">'+esc(s.title)+'</span></button>';
   }).join('');
   return shell('<section class="cv-intro"><div class="cv-intro-header"><div><span class="cv-eyebrow">GEOGRAFI · KAPITTEL 2</span>'+
     '<h1 class="cv-heading" tabindex="-1">Kontinentseilasen</h1>'+
     '<p>Seil på et fantasihav, finn verdenskartets land og samle stempler i reisepasset.</p></div></div>'+
     '<div class="cv-story-layout"><div class="cv-story-aside"><div class="cv-story-hero"><div class="cv-story-fox">'+fox()+'<p>Hvor skal vi seile? Jeg følger med på reisen!</p></div>'+quickStart+
     (session?'<button type="button" class="cv-primary" data-cv-act="resume">Fortsett i '+esc(session.place.title)+' →</button>':'')+
     '</div>'+
     '<aside class="cv-story-rail" aria-label="Din reise">'+
     '<div class="cv-progress" role="status"><strong>'+p.done+' av 5 steder utforsket</strong>'+
     '<small>'+(p.places.some(place=>place.attempts===1)?'Flere nye oppdagelser venter når du besøker et sted igjen.':'Alle stedene kan gjentas når du vil.')+'</small>'+
     '<div class="cv-bar"><span style="width:'+p.done*20+'%"></span></div></div>'+
     '<div class="cv-story-guide"><strong>Finn veien til verden</strong>'+
     '<p>Styr med kompass, sett stempler og finn spennende land med den ekte kloden.</p></div>'+
     '<p class="cv-note">Eventyrhavet er fantasi, ikke et verdenskart. Den ekte globusen er uendret.</p>'+
     '</aside></div>'+
     '<div class="cv-story-map" role="group" aria-label="Illustrert fantasihav med fem interaktive eventyrsteder">'+
     '<img class="cv-map-art" data-cv-art-variant="'+(paintedCandidate?'candidate-v2':'default-v1')+'" src="'+mapArt+'" alt="" draggable="false" loading="eager">'+
     '<div class="cv-places">'+places+'</div></div>'+
     '</div></section>');
 }
 function controls(task,feedback){
   if(task.kind==='compass'){
     const dirs=[['N','↑'],['V','←'],['Ø','→'],['S','↓']];
     return '<div class="cv-compass" role="group" aria-label="Styr båten med kompass">'+
       dirs.map(([letter,arrow])=>'<button type="button" data-cv-act="answer" data-cv-answer="'+esc(letter)+'"'+
         (feedback?' disabled':'')+' class="cv-direction cv-dir-'+letter.toLowerCase()+
         (feedback?.answer===letter?' cv-selected':'')+'" aria-label="'+({N:'Nord',S:'Sør','Ø':'Øst',V:'Vest'}[letter])+
         '"><span>'+arrow+'</span><strong>'+letter+'</strong></button>').join('')+
       '<span class="cv-compass-center" aria-hidden="true">✦</span></div>';
   }
   if(task.kind==='stamp'){
     return '<div class="cv-passport"><span class="cv-eyebrow">REISEPASS</span><strong>'+esc(task.country)+'</strong>'+
       '<small>Hvilken verdensdel skal få dette stempelet?</small></div>'+
       '<div class="cv-stamps" role="group" aria-label="Velg et kontinentstempel">'+
       task.options.map(c=>'<button type="button" data-cv-act="answer" data-cv-answer="'+esc(c)+'"'+
         (feedback?' disabled':'')+' class="cv-stamp'+(feedback?.answer===c?' cv-selected':'')+'">'+esc(c)+'</button>').join('')+'</div>';
   }
   return '<div class="cv-answers" role="group" aria-label="Svaralternativer">'+task.options.map((x,i)=>
     '<button type="button" class="cv-answer'+(feedback?.answer===x?' cv-selected':'')+
     '" data-cv-act="answer" data-cv-answer="'+esc(x)+'"'+(feedback?' disabled':'')+'>'+
     '<span>'+String.fromCharCode(65+i)+'</span>'+esc(x)+'</button>').join('')+'</div>';
 }
 function challenge(){
   const s=core.resume(ui.state);if(!s)return overview();
   const feedback=s.feedback;
   const foxState=buddy.response({subject:'geography',stageId:s.place.id,kind:s.task.kind,
     feedback,expanded:ui.hintShown});
   const foxPanel='<div class="cv-companion cv-fox-'+foxState.mood+'">'+fox()+
     '<div class="cv-fox-copy"><span class="cv-eyebrow">REVENS KOMPASS</span>'+
     '<p id="cv-fox-message" role="status">'+esc(foxState.text)+'</p></div>'+
     (foxState.showHint?'<button type="button" class="cv-fox-help" data-cv-act="hint" aria-controls="cv-fox-message" aria-expanded="'+String(foxState.expanded)+'" aria-label="'+(foxState.expanded?'Skjul hint fra reven':'Få hint fra reven')+'">Hint</button>':'')+'</div>';
   return shell('<article class="cv-task"><div class="cv-task-nav"><button class="cv-quiet" data-cv-act="intro" type="button">← Alle stedene</button>'+
     '<span>'+esc(s.place.title)+'</span></div>'+
     foxPanel+
     '<div class="cv-count">OPPDAGELSE '+(s.step+1)+' AV 4<div class="cv-bar"><span style="width:'+((s.step+(feedback?1:0))*25)+'%"></span></div></div>'+
     '<div class="cv-paper"><span class="cv-eyebrow">'+(s.task.kind==='compass'?'STYR MED KOMPASS':s.task.kind==='stamp'?'FÅ ET REISESTEMPEL':'FINN ET STED I VERDEN')+'</span>'+
     '<h1 class="cv-heading" tabindex="-1">'+esc(s.task.prompt)+'</h1>'+controls(s.task,feedback)+
     (feedback?'<div class="cv-feedback" role="status" tabindex="-1"><strong>'+(feedback.correct?'✦ Du fant riktig vei!':'Bra at du prøver!')+
       '</strong><p>'+esc(feedback.hint)+'</p></div>'+
       '<button type="button" data-cv-act="next" class="cv-primary">'+
       (s.step===3?'Se reisen din →':'Neste oppdagelse →')+'</button>':'')+
     '<button type="button" class="cv-read" data-cv-act="read">🔊 Les opp</button></div></article>');
 }
 function summary(){
   const s=ui.result;if(!s)return overview();
   return shell('<section class="cv-summary"><span class="cv-final-symbol">✦</span>'+
     '<span class="cv-eyebrow">STEMPEL I REISEBOKEN!</span>'+
     '<h1 class="cv-heading" tabindex="-1">'+(core.progress(ui.state).complete?'Hele Kontinentseilasen er utforsket!':'Nytt sted utforsket!')+'</h1>'+
     '<p>Du fant '+s.correct+' av '+s.total+' løsninger. Her kan du reise tilbake og leke videre.</p>'+fox()+
     '<button type="button" data-cv-act="intro" class="cv-primary">Til alle stedene →</button>'+
     '<button type="button" data-cv-act="replay" data-cv-stage="'+esc(s.placeId)+'" class="cv-quiet">Spill dette stedet igjen</button></section>');
 }
 function render(focus='.cv-heading',preserveScroll=false,revealFeedback=false){
   if(!ui)return;
   const previousScroll=preserveScroll?ui.root.scrollTop:0;
   ui.root.innerHTML=ui.mode==='challenge'?challenge():ui.mode==='summary'?summary():overview();
   // A malformed or unavailable optional art file must not blank the chapter map.
   // Keep all HTML stops and progress intact; fallback only the decorative image.
   if(ui.mode==='intro'){
     const art=ui.root.querySelector('.cv-map-art[data-cv-art-variant="candidate-v2"]');
     if(art){
       const fallback=()=>{
         if(art.getAttribute('data-cv-art-variant')!=='candidate-v2')return;
         art.setAttribute('data-cv-art-variant','fallback-v1');
         art.src='./geography-continent-voyage-storymap-v1.svg';
       };
       art.addEventListener('error',fallback,{once:true});
       art.addEventListener('load',()=>{
         if(art.naturalWidth!==800||art.naturalHeight!==1000)fallback();
       },{once:true});
       // Cached but malformed candidates may be complete before the load listener exists.
       if(art.complete&&(art.naturalWidth!==800||art.naturalHeight!==1000))fallback();
     }
   }
   ui.root.scrollTop=previousScroll;
   const target=ui.root.querySelector(focus);
   if(target){
     target.focus({preventScroll:true});
     // Reveal the child's feedback on small screens without extra searching.
     if(revealFeedback){
       target.scrollIntoView({behavior:'auto',block:'center',inline:'nearest'});
       // Keep the action to continue visible without hiding the feedback.
       ui.root.querySelector('[data-cv-act="next"]')?.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});
     }
   }
 }
 function save(){try{ui?.save?.()}catch(_){/* keep draft playable in memory */}}
 function play(id){
   // A second tap on the child's current stop resumes the saved voyage step.
   if(core.resume(ui.state)?.place.id!==id)core.start(ui.state,id);
   ui.mode='challenge';ui.result=null;ui.hintShown=false;save();render();
 }
 function read(){
   const s=core.resume(ui.state);if(!s||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
   const utterance=new SpeechSynthesisUtterance(s.task.prompt);utterance.lang='nb-NO';utterance.rate=.85;
   speechSynthesis.cancel();speechSynthesis.speak(utterance);
 }
 function close(){
   if(!ui)return;const old=ui;ui=null;
   window.speechSynthesis?.cancel?.();document.removeEventListener('keydown',onKey);
   old.root.remove();document.documentElement.style.overflow=old.overflow;
   if(old.app)old.app.inert=old.wasInert;
   if(old.focus?.isConnected)old.focus.focus({preventScroll:true});
 }
 function onKey(e){
   if(!ui)return;
   if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key!=='Tab')return;
   const all=[...ui.root.querySelectorAll('button:not([disabled])')].filter(b=>!b.hidden&&b.getClientRects().length);
   if(!all.length){e.preventDefault();ui.root.focus();return}
   const focus=document.activeElement,first=all[0],last=all[all.length-1];
   if(e.shiftKey&&(focus===first||!all.includes(focus))){e.preventDefault();last.focus({preventScroll:true})}
   else if(!e.shiftKey&&(focus===last||!all.includes(focus))){e.preventDefault();first.focus({preventScroll:true})}
 }
 function handle(e){
   const b=e.target.closest('button[data-cv-act]');if(!b||!ui)return;
   const cmd=b.dataset.cvAct;
   if(cmd==='close'){close();return}
   if(cmd==='intro'){ui.mode='intro';ui.result=null;ui.hintShown=false;render();return}
   if(cmd==='stage'||cmd==='replay'||cmd==='quick-start'){play(b.dataset.cvStage);return}
   if(cmd==='resume'){ui.mode='challenge';ui.result=null;render();return}
   if(cmd==='read'){read();return}
   if(cmd==='hint'){ui.hintShown=!ui.hintShown;render('[data-cv-act="hint"]',true);return}
   if(cmd==='answer'){core.answer(ui.state,b.dataset.cvAnswer);save();render('.cv-feedback',true,true);return}
   if(cmd==='next'){
     const result=core.advance(ui.state);ui.hintShown=false;save();
     if(result.finished){ui.result=result;ui.mode='summary'}else ui.mode='challenge';
     render();
   }
 }
 function open(args){
   if(!core.previewEnabled(location.search))return false;
   if(ui){ui.root.focus({preventScroll:true});return true}
   if(!args||!args.state||typeof args.save!=='function')throw Error('Kontinentseilasen requires state and save');
   const src=String(args.foxSrc||''),safe=/^(?:\.\/|\/)(?!\/)/.test(src)||
     /^data:image\/(?:png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(src);
   const app=document.querySelector('.app'),root=document.createElement('section');
   ui={root,app,wasInert:app?.inert||false,focus:document.activeElement,
     overflow:document.documentElement.style.overflow,foxSrc:safe?src:'./lia-fox-explorer-home.webp',
     state:args.state,save:args.save,mode:'intro',result:null,hintShown:false};
   root.id='laria-geo-continent-voyage-preview';root.className='cv-root';
   root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
   root.setAttribute('aria-label','Kontinentseilasen, intern forhåndsvisning');root.tabIndex=-1;
   root.addEventListener('click',handle);document.body.append(root);
   if(app)app.inert=true;document.documentElement.style.overflow='hidden';
   document.addEventListener('keydown',onKey);render();return true;
 }
 window.LARIA_GEO_CONTINENT_VOYAGE_UI=Object.freeze({open,close});
})();