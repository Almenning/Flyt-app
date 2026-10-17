/* Læria / Setningshavna: chapter-two English preview ONLY.
 * Child-led mini-dialogues and tap-to-build sentences. No final map art.
 */
(function(){
 'use strict';
 const core=window.LARIA_ENGLISH_SENTENCE_HARBOR;if(!core)return;
 let ui=null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const fox=()=>'<img class="sh-fox" src="'+esc(ui.foxSrc)+'" alt="Reven din er med til Setningshavna">';
 const shell=body=>'<div class="sh-shell"><header class="sh-top"><button type="button" data-sh-act="close" class="sh-quiet">← Tilbake</button><span class="sh-tag">INTERN TEST · ENGELSK KAPITTEL 2</span></header><main class="sh-main">'+body+'</main></div>';
 function intro(){
   const p=core.progress(ui.state),session=core.resume(ui.state);
   const positions={hilsenkaia:[26,23],ordbrygga:[75,37],setningsverkstedet:[29,55],
     samtalebaten:[74,72],historiefyret:[45,87]};
   const labels={setningsverkstedet:'Setningsverksted'};
   const stops=core.STAGES.map((stop,i)=>{
     const visited=p.places.find(x=>x.id===stop.id).visited,pos=positions[stop.id];
     if(!pos)throw Error('Setningshavna missing storybook place '+stop.id);
     return '<button type="button" class="sh-stop sh-map-stop'+(visited?' sh-done':'')+
       '" style="--sh-x:'+pos[0]+'%;--sh-y:'+pos[1]+'%" data-sh-act="stage" data-sh-stage="'+esc(stop.id)+'"'+
       ' aria-label="'+esc(stop.title)+'. '+esc(stop.focus)+(visited?'. Utforsket, spill igjen':'. Utforsk nå')+'">'+
       '<span class="sh-stop-icon" aria-hidden="true">'+(visited?'✓':String(i+1))+'</span>'+
       '<span class="sh-map-stop-name">'+esc(labels[stop.id]||stop.title)+'</span></button>';
   }).join('');
   return shell('<section class="sh-intro"><div class="sh-intro-heading">'+
     '<div><span class="sh-eyebrow">ENGELSK · KAPITTEL 2</span><h1 class="sh-heading" tabindex="-1">Setningshavna</h1>'+
     '<p>Hils på venner, finn ord og bygg egne setninger på en spennende havnereise.</p></div></div>'+
     '<div class="sh-story-layout"><div class="sh-story-map" role="group" aria-label="Illustrert eventyrhavn med fem steder du kan trykke på">'+
     '<img class="sh-map-art" src="./english-sentence-harbor-storymap-v1.svg" alt="" draggable="false" loading="eager">'+
     '<div class="sh-stops">'+stops+'</div></div>'+
     '<aside class="sh-story-rail"><div class="sh-story-fox">'+fox()+'<p>Velkommen til havna! Hvor vil du seile i dag?</p></div>'+
     '<div class="sh-progress" role="status"><strong>'+p.done+' av 5 steder utforsket</strong>'+
     '<small>Velg fritt, og kom tilbake til et sted du liker.</small>'+
     '<div class="sh-progress-bar"><span style="width:'+p.done*20+'%"></span></div></div>'+
     (session?'<button type="button" class="sh-continue" data-sh-act="resume">Fortsett i '+esc(session.stage.title)+' →</button>':'')+
     '<div class="sh-story-guide"><strong>Ord blir små eventyr</strong><p>Lytt, prat, les og sett sammen setninger. Reisen er din.</p></div>'+
     '<p class="sh-note">Originalt illustrert havnekart. Intern kandidat, ikke premiumgodkjent eller publisert.</p>'+
     '</aside></div></section>');
 }
 function sentenceUI(session){
   const task=session.task,selected=session.selected;
   return '<p class="sh-instruction">Velg ett og ett ord. Se hvordan setningen vokser.</p>'+
     '<div class="sh-assembled" role="status" aria-label="Setningen du bygger">'+
     (selected.length?selected.map(i=>'<span class="sh-built-word">'+esc(task.tiles[i])+'</span>').join(''):
       '<span class="sh-empty">Setningen din kommer her ✨</span>')+'</div>'+
     '<div class="sh-tiles" role="group" aria-label="Engelske ordbrikker">'+task.tiles.map((w,i)=>
       '<button type="button" class="sh-tile'+(selected.includes(i)?' sh-picked':'')+'" data-sh-act="tile" data-sh-index="'+i+
       '" aria-pressed="'+String(selected.includes(i))+'"'+(session.feedback?.correct?' disabled':'')+'>'+esc(w)+'</button>').join('')+'</div>'+
     '<div class="sh-tools"><button type="button" class="sh-quiet" data-sh-act="clear">Start på nytt</button>'+
     '<button type="button" class="sh-check" data-sh-act="check-sentence"'+
       (selected.length<task.tiles.length?' disabled':'')+'>Sjekk setningen ✦</button></div>';
 }
 function play(){
   const s=core.resume(ui.state);
   if(!s)return intro();
   const t=s.task,index=s.index+1;
   const options=t.kind!=='sentence'?'<div class="sh-options" role="group" aria-label="Velg svar">'+
     t.options.map((opt,i)=>'<button type="button" data-sh-act="answer" data-sh-index="'+i+
     '" class="sh-option'+(s.feedback?.answer===opt?' sh-answer':'')+'"'+(s.feedback?' disabled':'')+
     '><span>'+String.fromCharCode(65+i)+'</span>'+esc(opt)+'</button>').join('')+'</div>':'';
   const feedback=s.feedback?'<div class="sh-feedback" role="status" tabindex="-1"><strong>'+
     (s.feedback.correct?'✦ Du fant løsningen!':'Godt forsøk!')+'</strong><p>'+esc(s.feedback.hint)+
     (s.feedback.correct?'':' Du kan utforske dette stedet igjen når du vil.')+'</p></div>'+
     '<button type="button" data-sh-act="next" class="sh-next">'+
     (index===4?'Se hvordan det gikk →':'Neste oppdagelse →')+'</button>':'';
   return shell('<article class="sh-task"><div class="sh-task-top"><button type="button" class="sh-quiet" data-sh-act="intro">← Alle stedene</button><span>'+esc(s.stage.title)+'</span></div>'+
     '<div class="sh-companion">'+fox()+'<div><span class="sh-eyebrow">REVENS ENGELSKE KROK</span><p>Du kan lese, lytte og prøve. Det er lov å gjøre feil!</p></div></div>'+
     '<div class="sh-step">OPPDAGELSE '+index+' AV 4<div class="sh-progress-bar"><span style="width:'+((index-1+Number(!!s.feedback))*25)+'%"></span></div></div>'+
     '<div class="sh-paper"><span class="sh-eyebrow">'+(t.kind==='sentence'?'BYGG EN SETNING':t.kind==='story'?'LES EN LITEN HISTORIE':'FINN DET RETTE SVARET')+'</span>'+
     (t.kind!=='sentence'?'<div class="sh-english" lang="en">'+esc(t.english)+'</div>':'')+
     '<h1 class="sh-heading" tabindex="-1">'+esc(t.prompt)+'</h1>'+
     (t.kind==='sentence'?sentenceUI(s):options)+
     '<button type="button" class="sh-speak" data-sh-act="speak">🔊 Hør engelsk</button>'+
     feedback+'</div></article>');
 }
 function result(){
   const r=ui.result;if(!r)return intro();
   return shell('<section class="sh-result"><span class="sh-celebration">✦</span>'+
     '<span class="sh-eyebrow">GJORT OG OPPDAGET</span><h1 class="sh-heading" tabindex="-1">'+
     (core.progress(ui.state).complete?'Du har utforsket hele Setningshavna!':'Et nytt sted i Setningshavna!')+
     '</h1><p>Du fant '+r.correct+' av 4 løsninger. Det er fint å prøve på nytt, og ordene dine venter her.</p>'+
     fox()+'<button type="button" class="sh-next" data-sh-act="intro">Se alle stedene →</button>'+
     '<button type="button" class="sh-quiet" data-sh-act="replay" data-sh-stage="'+esc(r.stageId)+'">Leke mer her</button></section>');
 }
 function render(focus='.sh-heading'){
   if(!ui)return;
   ui.root.innerHTML=ui.mode==='play'?play():ui.mode==='result'?result():intro();
   ui.root.scrollTop=0;
   ui.root.querySelector(focus)?.focus({preventScroll:true});
 }
 function save(){try{ui?.save?.()}catch(_){/* keep preview playable */}}
 function start(stage){core.start(ui.state,stage);ui.mode='play';ui.result=null;save();render()}
 function speak(){
   const s=core.resume(ui.state);if(!s||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
   const u=new SpeechSynthesisUtterance(s.task.english);u.lang='en-GB';u.rate=.83;
   window.speechSynthesis.cancel();window.speechSynthesis.speak(u);
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
   const active=document.activeElement,first=all[0],last=all[all.length-1];
   if(e.shiftKey&&(active===first||!all.includes(active))){e.preventDefault();last.focus({preventScroll:true})}
   else if(!e.shiftKey&&(active===last||!all.includes(active))){e.preventDefault();first.focus({preventScroll:true})}
 }
 function handle(e){
   const b=e.target.closest('button[data-sh-act]');if(!b||!ui)return;
   const cmd=b.dataset.shAct;
   if(cmd==='close'){close();return}
   if(cmd==='intro'){ui.mode='intro';ui.result=null;render();return}
   if(cmd==='stage'||cmd==='replay'){start(b.dataset.shStage);return}
   if(cmd==='resume'){ui.mode='play';ui.result=null;render();return}
   if(cmd==='speak'){speak();return}
   if(cmd==='answer'){
     const s=core.resume(ui.state);if(!s)return;
     core.choose(ui.state,s.task.options[Number(b.dataset.shIndex)]);save();render('.sh-feedback');return;
   }
   if(cmd==='tile'){
     const index=Number(b.dataset.shIndex);
     core.selectTile(ui.state,index);save();render('[data-sh-index="'+index+'"]');return;
   }
   if(cmd==='clear'){core.clearTiles(ui.state);save();render('.sh-tile');return}
   if(cmd==='check-sentence'){core.submitSentence(ui.state);save();render('.sh-feedback');return}
   if(cmd==='next'){
     const step=core.advance(ui.state);save();
     if(step.finished){ui.mode='result';ui.result=step}else ui.mode='play';
     render();
   }
 }
 function open(args){
   if(!core.previewEnabled(location.search))return false;
   if(ui){ui.root.focus({preventScroll:true});return true}
   if(!args||!args.state||typeof args.save!=='function')throw Error('Setningshavna needs state and save');
   const src=String(args.foxSrc||''),allowed=/^(?:\.\/|\/)(?!\/)/.test(src)||
     /^data:image\/(?:png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(src);
   const app=document.querySelector('.app'),root=document.createElement('section');
   ui={root,state:args.state,save:args.save,app,wasInert:app?.inert||false,
     focus:document.activeElement,overflow:document.documentElement.style.overflow,
     foxSrc:allowed?src:'./lia-fox-explorer-home.webp',mode:'intro',result:null};
   root.id='laria-english-sentence-harbor-preview';root.className='sh-root';
   root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
   root.setAttribute('aria-label','Setningshavna, internt engelsk eventyr');root.tabIndex=-1;
   root.addEventListener('click',handle);document.body.append(root);
   if(app)app.inert=true;document.documentElement.style.overflow='hidden';
   document.addEventListener('keydown',onKey);render();return true;
 }
 window.LARIA_ENGLISH_SENTENCE_HARBOR_UI=Object.freeze({open,close});
})();