/* Private playable chapter-two preview. No new map is published before art approval. */
(function(){
  'use strict';
  const core=window.LARIA_CHAPTER_EXPANSION,bank=window.LARIA_FORTELLINGSDALEN_STORIES,art=window.LARIA_FORTELLINGSDALEN_ART;
  if(!core||!bank||!art)return;
  let ui=null;
  const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const mark=(n,total)=>Math.min(100,Math.round(n/Math.max(1,total)*100));
  const safeAvatar=src=>{const value=String(src||'');return /^(\.\/|\/|https:\/\/)/.test(value)||/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/i.test(value)?value:'./lia-fox-explorer-home.webp'};
  function fox(){
    return '<img class="fd-fox-portrait" alt="Din rev er med på eventyret" src="'+esc(ui.foxSrc)+'">';
  }
  function shell(body){
    return '<div class="fd-app"><header class="fd-top"><button class="fd-back" type="button" data-fd-action="close" aria-label="Lukk Fortellingsdalen">← Tilbake</button>'+
      '<span class="fd-preview-tag">FORHÅNDSVISNING · KAPITTEL 2</span></header>'+
      '<main class="fd-panel">'+body+'</main></div>';
  }
  // Stage markers are positioned on the exact 941x1672 atlas canvas, not
  // on a cropped background or a set of invented map boxes.
  // Five child-visible markers and the selected companion belong to the
  // versioned art contract, never an unrelated duplicated geometry table.
  function foxStage(progress){return progress.complete?'stjernetoppen':progress.recommended}
  function foxDestination(progress){return art.foxStyle(foxStage(progress))}
  function renderIntro(){
    const progress=core.progress(ui.state),draft=core.resume(ui.state);
    const stages=core.STAGES.map((stage,i)=>{
      const p=progress.stages.find(x=>x.id===stage.id);
      if(!art.stop(stage.id))throw new Error('Missing painted atlas stop '+stage.id);
      return '<button class="fd-place fd-map-place'+(p.passed?' fd-place-done':'')+
        (!progress.complete&&progress.recommended===stage.id?' fd-place-next':'')+
        '" style="'+art.markerStyle(stage.id)+'" data-fd-action="stage" data-fd-stage="'+esc(stage.id)+
        '" aria-label="'+esc(stage.title)+': '+esc(stage.focus)+(p.passed?', fullført':'')+'" type="button">'+
        '<span class="fd-place-number">'+(p.passed?'✓':String(i+1))+'</span><span class="fd-place-label"><strong>'+esc(stage.title)+
        '</strong><small>'+esc(p.passed?'Spill igjen':stage.focus)+'</small></span></button>';
    }).join('');
    const status=progress.complete?'Alle fem stedene er utforsket. Historiene kan spilles igjen.':
      progress.done+' av 5 steder utforsket. Du velger selv hvor du vil gå.';
    return shell('<div class="fd-intro fd-intro-map">'+
      '<div class="fd-intro-hero fd-map-header"><div><span class="fd-eyebrow">NORSK · KAPITTEL 2</span>'+
      '<h1 id="fd-title">Fortellingsdalen</h1><p>Fem steder. Mange små fortellinger. Du bestemmer hvor eventyret fortsetter.</p></div>'+
      '<div class="fd-map-crest" aria-hidden="true">✦</div></div>'+
      '<div class="fd-visual-layout"><section class="fd-atlas" aria-label="Illustrert kart med fem spillbare oppdrag">'+
      '<img class="fd-atlas-paint" src="'+esc(art.ASSET.src)+'" alt="" draggable="false" decoding="async" width="'+art.DIMENSIONS.width+'" height="'+art.DIMENSIONS.height+'">'+
      '<div class="fd-atlas-shade" aria-hidden="true"></div>'+
      '<div class="fd-map-caption" aria-hidden="true">FORTELLINGSDALEN <span>✦</span></div>'+
      '<div class="fd-fox fd-map-fox" style="'+foxDestination(progress)+'" data-fd-fox-stage="'+esc(foxStage(progress))+'">'+fox()+'</div>'+
      '<div class="fd-places fd-map-stages">'+stages+'</div>'+
      '</section><div class="fd-map-aside">'+
      '<div class="fd-progress" role="status" aria-label="'+esc(status)+'"><div><strong>'+progress.done+' av 5 steder utforsket</strong>'+
      '<span>Du velger selv hvor du vil gå</span></div><div class="fd-progress-track"><span style="width:'+progress.pct+'%"></span></div></div>'+
      (draft?'<button class="fd-continue" data-fd-action="resume" type="button">Fortsett historien du begynte på →</button>':'')+
      '<div class="fd-map-hint"><strong>Se etter magiske steder</strong><p>Trykk på et skilt i dalen for å finne en historie. Brev, spor og mysterier venter.</p></div>'+
      (progress.complete?'<div class="fd-complete">🏆 Du har oppdaget alle fem stedene! Historiene venter fortsatt på deg.</div>':'')+
      '<p class="fd-development-note">Intern illustrert kartprototype. Ingen av de fire låste eventyrreisene er endret.</p>'+
      '</div></div></div>');
  }
  function renderStory(){
    const session=core.resume(ui.state)||ui.pending?.session;
    if(!session){ui.mode='intro';return renderIntro()}
    const q=ui.pending?.question||session.story.questions[session.index];
    const pending=ui.pending;
    const n=pending?pending.number:session.index+1;
    const options=q.options.map((answer,i)=>{
      const chosen=pending?.selected===answer,correct=pending?.answer===answer;
      return '<button type="button" class="fd-option'+(pending?(correct?' fd-option-correct':chosen?' fd-option-incorrect':''):'')+
        '" data-fd-action="answer" data-fd-index="'+i+'"'+(pending?' disabled':'')+'><span class="fd-option-letter">'+String.fromCharCode(65+i)+'</span>'+
        '<span>'+esc(answer)+'</span></button>';
    }).join('');
    return shell('<article class="fd-story-layout">'+
      '<div class="fd-story-top"><button type="button" class="fd-quiet-back" data-fd-action="intro">← Alle stedene</button><span>'+esc(session.stage.title)+'</span></div>'+
      '<div class="fd-story-companion" data-fd-story-place="'+esc(session.stage.id)+'" style="--fd-scene-x:'+art.stop(session.stage.id).marker.x+'%;--fd-scene-y:'+art.stop(session.stage.id).marker.y+'%;" aria-label="Reven din er med på historien">'+
      '<img class="fd-story-art" src="'+esc(art.ASSET.src)+'" alt="" draggable="false" loading="eager" aria-hidden="true">'+fox()+
      '<div><span class="fd-eyebrow">REVENS FORTELLERKROK</span><p>'+(pending?(pending.correct?
        'Et spor funnet! Klar for neste?':'Prøv gjerne en ny historie senere. Vi utforsker videre.'):
        'Les historien i ditt tempo. Jeg kan lese den høyt for deg.')+'</p></div></div>'+
      '<div class="fd-story-banner"><span>SPOR '+n+' AV '+session.total+'</span><div class="fd-story-bar"><span style="width:'+mark(pending?n:n-1,session.total)+'%"></span></div></div>'+
      '<div class="fd-letter"><div class="fd-letter-decoration">✦</div><h2>'+esc(session.story.title)+'</h2><p>'+esc(session.story.passage)+'</p>'+
      '<button type="button" class="fd-read" data-fd-action="read" aria-label="Les opp historien, spørsmålet og svaralternativene">🔊 Les høyt</button></div>'+
      '<div class="fd-question"><span class="fd-eyebrow">FINN SPORET</span><h3 class="fd-question-prompt" tabindex="-1">'+esc(q.prompt)+'</h3>'+
      '<div class="fd-options">'+options+'</div></div>'+
      (pending?'<div class="fd-feedback" role="status"><strong>'+(pending.correct?'★ Du fant riktig spor!':'Det var ikke helt riktig denne gangen.')+
        '</strong><span>Svaret er: '+esc(pending.answer)+'</span></div>'+
        '<button class="fd-primary fd-next" type="button" data-fd-action="next">'+(pending.finished?'Se hvordan det gikk →':'Neste spørsmål →')+'</button>':'')+
      '</article>');
  }
  function renderResult(){
    const r=ui.lastResult;
    if(!r){ui.mode='intro';return renderIntro()}
    const title=r.chapterCompleted?'Hele Fortellingsdalen er utforsket!':r.passed?'Du fant veien videre!':'Du har oppdaget nye spor!';
    return shell('<div class="fd-result"><div class="fd-celebrate">✦</div><span class="fd-eyebrow">HISTORIEN ER FERDIG</span>'+
      '<h1 tabindex="-1">'+title+'</h1><p>Du svarte riktig på '+r.correct+' av '+r.total+' spørsmål. '+(r.passed?
        'Dette stedet er nå med i eventyrboken din.':'Historien kan prøves igjen når du har lyst.')+'</p>'+
      '<div class="fd-result-fox">'+fox()+'</div>'+
      '<button class="fd-primary" data-fd-action="intro" type="button">Til stedene i dalen →</button>'+
      '<button class="fd-secondary" data-fd-action="replay" data-fd-stage="'+esc(r.stageId)+'" type="button">Prøv en annen historie</button>'+
      '</div>');
  }
  function render(){
    if(!ui)return;
    ui.root.innerHTML=ui.mode==='story'?renderStory():ui.mode==='result'?renderResult():renderIntro();
    ui.root.setAttribute('aria-label','Fortellingsdalen, intern forhåndsvisning');
  }
  function save(){try{ui?.save?.()}catch(_){/* local preview must remain playable */}}
  function start(stageId){
    core.start(ui.state,stageId);
    ui.pending=null;ui.lastResult=null;ui.mode='story';save();render();
  }
  function speak(){
    if(!ui||!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return;
    const s=core.resume(ui.state)||ui.pending?.session;if(!s)return;
    window.speechSynthesis.cancel();
    const spokenQuestion=ui.pending?.question||s.story.questions[s.index];
    const alternatives=spokenQuestion.options.map((value,i)=>
      'Svar '+(i+1)+': '+value+'.').join(' ');
    const u=new SpeechSynthesisUtterance(s.story.passage+'. '+spokenQuestion.prompt+
      ' Svaralternativer. '+alternatives);
    u.lang='nb-NO';u.rate=0.86;window.speechSynthesis.speak(u);
  }
  function close(){
    if(!ui)return;
    if('speechSynthesis' in window)window.speechSynthesis.cancel();
    const focus=ui.focus,root=ui.root;ui=null;
    root.remove();document.removeEventListener('keydown',onKey);
    if(focus?.isConnected)focus.focus({preventScroll:true});
    window.LARIA_NORWEGIAN_CHAPTER_PICKER?.refresh?.();
  }
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close()}}
  function onClick(event){
    const b=event.target.closest('[data-fd-action]');if(!b||!ui)return;
    const action=b.dataset.fdAction;
    if(action==='close'){close();return}
    if(action==='read'){speak();return}
    if(action==='intro'){
      if('speechSynthesis' in window)window.speechSynthesis.cancel();
      ui.pending=null;ui.lastResult=null;ui.mode='intro';save();render();return;
    }
    if(action==='resume'){ui.pending=null;ui.mode='story';render();return}
    if(action==='stage'||action==='replay'){start(b.dataset.fdStage);return}
    if(action==='next'){
      if('speechSynthesis' in window)window.speechSynthesis.cancel();
      const completed=!!ui.pending?.finished,outcome=ui.pending?.outcome||null;
      ui.pending=null;
      if(completed){ui.lastResult=outcome;ui.mode='result'}else ui.mode='story';
      render();
      const destination=ui.root.querySelector(completed?'.fd-result h1':'.fd-question-prompt');
      destination?.focus({preventScroll:true});
      destination?.scrollIntoView({block:'nearest',behavior:'instant'});
      return;
    }
    if(action==='answer'&&ui.mode==='story'&&!ui.pending){
      const s=core.resume(ui.state);if(!s)return;
      const question=s.story.questions[s.index];
      const response=core.answer(ui.state,Number(b.dataset.fdIndex));
      save();
      ui.pending={question,number:s.index+1,correct:response.correct,
        answer:response.answer,selected:response.selected,session:s,
        finished:response.finished,outcome:response.outcome};
      render();
      const next=ui.root.querySelector('.fd-next');
      next?.scrollIntoView({block:'nearest',behavior:'instant'});
      next?.focus({preventScroll:true});
    }
  }
  function open(options={}){
    if(ui){ui.mode='intro';render();return}
    if(!options.state||typeof options.save!=='function')throw new TypeError('Chapter preview requires the app state and saveState callback');
    const root=document.createElement('div');root.id='laria-fortellingsdalen-preview';
    root.className='fd-overlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
    ui={root,state:options.state,save:options.save,foxSrc:safeAvatar(options.foxSrc),focus:document.activeElement,
      mode:core.resume(options.state)?'story':'intro',pending:null,lastResult:null};
    root.addEventListener('click',onClick);
    document.body.appendChild(root);
    document.addEventListener('keydown',onKey);
    render();
    root.querySelector('.fd-back')?.focus({preventScroll:true});
    save();
  }
  window.LARIA_FORTELLINGSDALEN_PREVIEW=Object.freeze({open,close});
})();
