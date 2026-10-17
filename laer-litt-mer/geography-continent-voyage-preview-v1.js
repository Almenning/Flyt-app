/* Kontinentseilasen, geography 2: private playable voyage.
 * Authoritative country positions remain in the real Læria globe. The harbor
 * scene below is decorative development art, not a fictional map of Earth.
 */
(function(){
 'use strict';
 const core=window.LARIA_GEO_CONTINENT_VOYAGE;if(!core)return;
 let ui=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fox=()=>'<img class="cv-fox" alt="Reven din er med på reisen" src="'+esc(ui.foxSrc)+'">';
 const shell=body=>'<div class="cv-shell"><header class="cv-top"><button type="button" data-cv-act="close" class="cv-quiet">← Tilbake</button>'+
   '<span class="cv-development">INTERN TEST · GEOGRAFI KAPITTEL 2</span></header>'+
   '<main class="cv-main">'+body+'</main></div>';
 function overview(){
   const p=core.progress(ui.state),session=core.resume(ui.state);
   const places=core.STAGES.map((s,i)=>{
     const visited=p.places.find(x=>x.id===s.id)?.visited;
     return '<button type="button" class="cv-place" data-cv-act="stage" data-cv-stage="'+esc(s.id)+'"'+
       ' aria-label="'+esc(s.title)+'. '+esc(s.focus)+(visited?'. Utforsket, spill igjen':'')+'">'+
       '<span class="cv-place-symbol" aria-hidden="true">'+(visited?'✓':esc(s.symbol))+'</span>'+
       '<span><strong>'+(i+1)+'. '+esc(s.title)+'</strong><small>'+esc(s.focus)+'</small></span>'+
       '<span class="cv-chevron" aria-hidden="true">›</span></button>';
   }).join('');
   return shell('<section class="cv-intro"><div class="cv-intro-header"><div><span class="cv-eyebrow">NYTT EVENTYR</span>'+
     '<h1 class="cv-heading" tabindex="-1">Kontinentseilasen</h1>'+
     '<p>Sett stempler i passet. Styr båten med kompass. Utforsk verden i ditt eget tempo.</p></div>'+
     fox()+'</div>'+
     '<div class="cv-harbor" aria-hidden="true"><div class="cv-sun"></div><div class="cv-cliff cv-cliff-a"></div>'+
     '<div class="cv-cliff cv-cliff-b"></div><div class="cv-ocean"></div><div class="cv-boat">⛵</div></div>'+
     '<div class="cv-progress"><strong>'+p.done+' av 5 steder utforsket</strong><small>Alle stedene kan gjentas når du vil.</small>'+
     '<div class="cv-bar"><span style="width:'+p.done*20+'%"></span></div></div>'+
     (session?'<button type="button" class="cv-primary" data-cv-act="resume">Fortsett i '+esc(session.place.title)+' →</button>':'')+
     '<div class="cv-places">'+places+'</div>'+
     '<p class="cv-note">Dette er et kunstutkast. Den ekte kloden med landgrenser er ikke endret.</p></section>');
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
   return shell('<article class="cv-task"><div class="cv-task-nav"><button class="cv-quiet" data-cv-act="intro" type="button">← Alle stedene</button>'+
     '<span>'+esc(s.place.title)+'</span></div>'+
     '<div class="cv-companion">'+fox()+'<p>Du kan prøve deg fram. Passet og kartet venter her!</p></div>'+
     '<div class="cv-count">OPPDAGELSE '+(s.step+1)+' AV 4<div class="cv-bar"><span style="width:'+((s.step+(feedback?1:0))*25)+'%"></span></div></div>'+
     '<div class="cv-paper"><span class="cv-eyebrow">'+(s.task.kind==='compass'?'STYR MED KOMPASS':s.task.kind==='stamp'?'FÅ ET REISESTEMPEL':'FINN ET STED I VERDEN')+'</span>'+
     '<h1 class="cv-heading" tabindex="-1">'+esc(s.task.prompt)+'</h1>'+controls(s.task,feedback)+
     (feedback?'<div class="cv-feedback" role="status"><strong>'+(feedback.correct?'✦ Du fant riktig vei!':'Bra at du prøver!')+
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
 function render(focus='.cv-heading'){
   if(!ui)return;
   ui.root.innerHTML=ui.mode==='challenge'?challenge():ui.mode==='summary'?summary():overview();
   ui.root.scrollTop=0;ui.root.querySelector(focus)?.focus({preventScroll:true});
 }
 function save(){try{ui?.save?.()}catch(_){/* keep draft playable in memory */}}
 function play(id){core.start(ui.state,id);ui.mode='challenge';ui.result=null;save();render()}
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
   if(cmd==='intro'){ui.mode='intro';ui.result=null;render();return}
   if(cmd==='stage'||cmd==='replay'){play(b.dataset.cvStage);return}
   if(cmd==='resume'){ui.mode='challenge';ui.result=null;render();return}
   if(cmd==='read'){read();return}
   if(cmd==='answer'){core.answer(ui.state,b.dataset.cvAnswer);save();render('.cv-feedback');return}
   if(cmd==='next'){
     const result=core.advance(ui.state);save();
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
     state:args.state,save:args.save,mode:'intro',result:null};
   root.id='laria-geo-continent-voyage-preview';root.className='cv-root';
   root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
   root.setAttribute('aria-label','Kontinentseilasen, intern forhåndsvisning');root.tabIndex=-1;
   root.addEventListener('click',handle);document.body.append(root);
   if(app)app.inert=true;document.documentElement.style.overflow='hidden';
   document.addEventListener('keydown',onKey);render();return true;
 }
 window.LARIA_GEO_CONTINENT_VOYAGE_UI=Object.freeze({open,close});
})();