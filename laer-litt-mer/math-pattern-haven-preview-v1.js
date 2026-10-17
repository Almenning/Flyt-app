/* Mønsterhagen: interactive chapter-two INTERNAL preview for grade-2 Math.
 * Illustrations are a development mockup, not approved premium artwork.
 */
(function(){
 'use strict';
 const buddy=window.LARIA_CHAPTER_FOX_BUDDY;
 const core=window.LARIA_MATH_PATTERN_HAVEN;
 if(!core)return;
 let ui=null;
 const escape=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function fox(){
   return '<img class="mh-fox" src="'+escape(ui.foxSrc)+'" alt="Reven din er med i Mønsterhagen">';
 }
 function shell(content){
   return '<div class="mh-shell"><header class="mh-top"><button type="button" data-mh-act="close" class="mh-back" aria-label="Lukk Mønsterhagen">← Tilbake</button>'+
     '<span class="mh-development">INTERN TEST · MATTE KAPITTEL 2</span></header><main class="mh-main">'+content+'</main></div>';
 }
 function intro(){
   const p=core.progress(ui.state),resume=core.resume(ui.state);
   const stages=core.STAGES.map((stage,i)=>{
     const record=p.places.find(x=>x.id===stage.id);
     return '<button type="button" class="mh-place'+(record.visited?' mh-done':'')+
       '" data-mh-act="stage" data-mh-stage="'+escape(stage.id)+'" aria-label="'+escape(stage.title)+
       '. '+escape(stage.focus)+(record.visited?'. Utforsket, spill igjen.':'. Utforsk nå.')+'">'+
       '<span class="mh-place-symbol" aria-hidden="true">'+escape(record.visited?'✓':stage.symbol)+'</span>'+
       '<span><strong>'+(i+1)+'. '+escape(stage.title)+'</strong><small>'+escape(stage.focus)+'</small></span>'+
       '<span class="mh-place-chevron" aria-hidden="true">›</span></button>';
   }).join('');
   return shell('<section class="mh-intro">'+
     '<div class="mh-intro-header"><div><span class="mh-eyebrow">ET NYTT EVENTYR</span>'+
     '<h1 tabindex="-1" class="mh-heading">Mønsterhagen</h1><p>Finn formen. Følg rytmen. Bygg et speilbilde. Her får du prøve selv!</p></div>'+
     fox()+'</div>'+
     '<div class="mh-landscape" aria-hidden="true"><div class="mh-sun"></div><div class="mh-mountain mh-mountain-left"></div>'+
     '<div class="mh-mountain mh-mountain-right"></div><div class="mh-pond"></div><div class="mh-walk"></div>'+
     '<span class="mh-scenery mh-scenery-a">△</span><span class="mh-scenery mh-scenery-b">○</span>'+
     '<span class="mh-scenery mh-scenery-c">✿</span><span class="mh-scenery mh-scenery-d">✦</span></div>'+
     '<div class="mh-progress" role="status"><strong>'+p.done+' av 5 steder utforsket</strong>'+
     '<span>Du kan velge fritt, og favorittene kan spilles igjen.</span>'+
     '<div class="mh-progress-track"><span style="width:'+(p.done*20)+'%"></span></div></div>'+
     (resume?'<button type="button" class="mh-continue" data-mh-act="resume">Fortsett der du var: '+
       escape(resume.stage.title)+' →</button>':'')+
     '<div class="mh-places" aria-label="Velg et av fem eventyrsteder">'+stages+'</div>'+
     '<p class="mh-note">Kartbildet er en midlertidig utviklingsscene, ikke godkjent premiumillustrasjon. Tallenga er uendret.</p>'+
     '</section>');
 }
 function drawMirror(task,session){
   const marked=new Set(session.mirror),rows=[];
   for(let r=0;r<4;r++){
     for(let c=0;c<4;c++){
       const lit=c<2?!!task.left[r][c]:marked.has(r+'-'+c);
       if(c<2){
         rows.push('<span class="mh-cell mh-cell-left'+(lit?' mh-lit':'')+
           '" role="img" aria-label="Rad '+(r+1)+', venstre rute '+(c+1)+(lit?' farget':' blank')+'"></span>');
       }else{
         rows.push('<button type="button" class="mh-cell mh-cell-right'+(lit?' mh-lit':'')+
           (c===2?' mh-divider':'')+'" data-mh-act="mirror" data-mh-r="'+r+'" data-mh-c="'+c+
           '" aria-pressed="'+String(lit)+'" aria-label="Rad '+(r+1)+', kolonne '+(c+1)+
           (lit?' er farget':' er blank')+'"'+(session.feedback?.correct?' disabled':'')+'></button>');
       }
     }
   }
   return '<div class="mh-mirror-instructions">Venstre side er laget. Trykk på rutene til høyre for å speile den.</div>'+
     '<div class="mh-mirror-board" role="group" aria-label="Speilbrett med fire rader og fire kolonner">'+rows.join('')+'</div>'+
     (!session.feedback?.correct?'<button type="button" data-mh-act="check-mirror" class="mh-check">Sjekk speilet ✨</button>':'');
 }
 function taskView(){
   const session=core.resume(ui.state);
   if(!session)return intro();
   const t=session.task,n=session.index+1;
   const foxState=buddy.response({subject:'math',stageId:session.stage.id,kind:t.kind,
     feedback:session.feedback,expanded:ui.hintShown});
   const foxPanel='<div class="mh-companion mh-fox-'+foxState.mood+'">'+fox()+
     '<div class="mh-fox-copy"><span class="mh-eyebrow">REVENS VERKSTED</span>'+
     '<p id="mh-fox-message" role="status">'+escape(foxState.text)+'</p></div>'+
     (foxState.showHint?'<button type="button" class="mh-fox-help" data-mh-act="hint" aria-controls="mh-fox-message" aria-expanded="'+String(foxState.expanded)+'" aria-label="'+(foxState.expanded?'Skjul hint fra reven':'Få hint fra reven')+'">?</button>':'')+'</div>';
   const choices=t.kind==='choice'?'<div class="mh-options" role="group" aria-label="Svaralternativer">'+
     t.options.map((opt,i)=>'<button class="mh-option'+(session.feedback&&opt===session.feedback.answer?' mh-right':'')+
       '" type="button" data-mh-act="answer" data-mh-index="'+i+'"'+(session.feedback?' disabled':'')+'>'+
       '<span class="mh-option-marker">'+String.fromCharCode(65+i)+'</span>'+escape(opt)+'</button>').join('')+'</div>':'';
   const feedback=session.feedback?'<div class="mh-feedback" role="status"><strong>'+
     (session.feedback.correct?'✦ Du fant det!':'Godt forsøk!')+'</strong><p>'+escape(session.feedback.hint)+
     (!session.feedback.correct&&t.kind==='choice'?' Riktig svar er '+escape(session.feedback.answer)+'.':'')+'</p></div>'+
     '<button type="button" class="mh-next" data-mh-act="next">'+(n===session.total?'Se hvordan det gikk →':'Neste oppdagelse →')+'</button>':'';
   return shell('<article class="mh-task" tabindex="-1">'+
     '<div class="mh-task-nav"><button type="button" data-mh-act="intro" class="mh-quiet">← Alle stedene</button>'+
     '<span>'+escape(session.stage.title)+'</span></div>'+
     foxPanel+
     '<div class="mh-step">OPPDAGELSE '+n+' AV '+session.total+
     '<div class="mh-progress-track"><span style="width:'+((n-1+(session.feedback?1:0))/session.total*100)+'%"></span></div></div>'+
     '<div class="mh-paper"><span class="mh-eyebrow">LEK MED '+(t.kind==='mirror'?'SPEILING':'MØNSTRE')+'</span>'+
     '<h1 class="mh-heading" tabindex="-1">'+escape(t.prompt)+'</h1>'+
     (t.kind==='choice'?'<div class="mh-visual" aria-hidden="true">'+escape(t.visual)+'</div>'+choices:drawMirror(t,session))+
     '<button type="button" class="mh-read" data-mh-act="read" aria-label="Les opp spørsmålet">🔊 Les opp</button>'+
     feedback+'</div></article>');
 }
 function resultView(){
   const r=ui.result;
   if(!r)return intro();
   const completed=core.progress(ui.state).complete;
   return shell('<section class="mh-result"><div class="mh-result-symbol">✦</div><span class="mh-eyebrow">UTFORSKET!</span>'+
     '<h1 tabindex="-1" class="mh-heading">'+(completed?'Hele Mønsterhagen er utforsket!':'Et nytt sted i eventyrboken!')+'</h1>'+
     '<p>Du fant '+r.correct+' av '+r.total+' løsninger. Det viktigste var at du prøvde og utforsket. Stedet venter hvis du vil leke mer.</p>'+
     fox()+'<button type="button" class="mh-next" data-mh-act="intro">Til Mønsterhagen →</button>'+
     '<button type="button" class="mh-quiet" data-mh-act="replay" data-mh-stage="'+escape(r.stageId)+'">Spill dette stedet igjen</button></section>');
 }
 function render(focusSelector='.mh-heading',preserveScroll=false){
   const previousScroll=preserveScroll?ui.root.scrollTop:0;
   if(!ui)return;
   ui.root.innerHTML=ui.view==='task'?taskView():ui.view==='result'?resultView():intro();
   ui.root.scrollTop=previousScroll;
   if(focusSelector)ui.root.querySelector(focusSelector)?.focus({preventScroll:true});
 }
 function save(){try{ui?.save?.()}catch(_){/* preview continues when storage is unavailable */}}
 function start(stage){
   core.start(ui.state,stage);ui.view='task';ui.result=null;ui.hintShown=false;save();render();
 }
 function read(){
   const s=core.resume(ui.state);if(!s||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
   const words=s.task.prompt+(s.task.kind==='choice'?' Valg: '+s.task.options.join(', '):' Trykk på rutene på høyre side av speilet.');
   const u=new SpeechSynthesisUtterance(words);u.lang='nb-NO';u.rate=.86;
   window.speechSynthesis.cancel();window.speechSynthesis.speak(u);
 }
 function onKey(e){
   if(!ui)return;
   if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key!=='Tab')return;
   const visible=[...ui.root.querySelectorAll('button:not([disabled])')]
     .filter(el=>!el.hidden&&el.getClientRects().length);
   if(!visible.length){e.preventDefault();ui.root.focus();return}
   const first=visible[0],last=visible[visible.length-1],active=document.activeElement;
   if(e.shiftKey&&(active===first||!visible.includes(active))){e.preventDefault();last.focus({preventScroll:true})}
   else if(!e.shiftKey&&(active===last||!visible.includes(active))){e.preventDefault();first.focus({preventScroll:true})}
 }
 function close(){
   if(!ui)return;
   const old=ui;ui=null;
   window.speechSynthesis?.cancel?.();
   document.removeEventListener('keydown',onKey);
   old.root.remove();
   document.documentElement.style.overflow=old.overflow;
   if(old.app)old.app.inert=old.wasInert;
   if(old.focus?.isConnected)old.focus.focus({preventScroll:true});
 }
 function handle(e){
   const b=e.target.closest('button[data-mh-act]');if(!b||!ui)return;
   const cmd=b.dataset.mhAct;
   if(cmd==='close'){close();return}
   if(cmd==='intro'){ui.view='intro';ui.result=null;ui.hintShown=false;render();return}
   if(cmd==='stage'||cmd==='replay'){start(b.dataset.mhStage);return}
   if(cmd==='resume'){ui.view='task';ui.result=null;render();return}
   if(cmd==='read'){read();return}
   if(cmd==='hint'){ui.hintShown=!ui.hintShown;render('[data-mh-act="hint"]',true);return}
   if(cmd==='answer'){
     const s=core.resume(ui.state);if(!s||s.task.kind!=='choice')return;
     core.submitChoice(ui.state,s.task.options[Number(b.dataset.mhIndex)]);
     save();render('.mh-feedback',true);return;
   }
   if(cmd==='mirror'){
     const r=Number(b.dataset.mhR),c=Number(b.dataset.mhC);
     core.toggleMirror(ui.state,r,c);save();render('[data-mh-r="'+r+'"][data-mh-c="'+c+'"]',true);return;
   }
   if(cmd==='check-mirror'){core.checkMirror(ui.state);save();render('.mh-feedback');return}
   if(cmd==='next'){
     const step=core.advance(ui.state);ui.hintShown=false;save();
     if(step.finished){ui.result=step;ui.view='result'}else ui.view='task';
     render();
   }
 }
 function open(args){
   if(!core.previewEnabled(window.location.search))return false;
   if(ui){ui.root.focus({preventScroll:true});return true}
   if(!args||!args.state||typeof args.save!=='function')throw Error('Mønsterhagen requires state and save');
   const app=document.querySelector('.app'),root=document.createElement('section');
   const src=String(args.foxSrc||'');
   const safe=/^(?:\.\/|\/)(?!\/)/.test(src)||/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(src);
   ui={root,app,wasInert:app?.inert||false,focus:document.activeElement,
     overflow:document.documentElement.style.overflow,
     foxSrc:safe?src:'./lia-fox-explorer-home.webp',state:args.state,save:args.save,
     view:'intro',result:null,hintShown:false};
   root.id='laria-math-pattern-haven-preview';root.className='mh-root';
   root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
   root.setAttribute('aria-label','Mønsterhagen, intern test av Mattekappittel 2');root.tabIndex=-1;
   root.addEventListener('click',handle);document.body.appendChild(root);
   if(app)app.inert=true;
   document.documentElement.style.overflow='hidden';
   document.addEventListener('keydown',onKey);
   render();
   return true;
 }
 window.LARIA_MATH_PATTERN_HAVEN_UI=Object.freeze({open,close});
})();