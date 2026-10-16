/* Private playable chapter-two preview. No new map is published before art approval. */
(function(){
  'use strict';
  const core=window.LARIA_CHAPTER_EXPANSION,bank=window.LARIA_FORTELLINGSDALEN_STORIES;
  if(!core||!bank)return;
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
  function renderIntro(){
    const progress=core.progress(ui.state),draft=core.resume(ui.state);
    const stages=core.STAGES.map((stage,i)=>{
      const p=progress.stages.find(x=>x.id===stage.id);
      return '<button class="fd-place'+(p.passed?' fd-place-done':'')+'" data-fd-action="stage" data-fd-stage="'+esc(stage.id)+'" type="button">'+
        '<span class="fd-place-number">'+(p.passed?'✓':String(i+1))+'</span><span class="fd-place-label"><strong>'+esc(stage.title)+
        '</strong><small>'+esc(stage.focus)+'</small></span><span class="fd-place-arrow">›</span></button>';
    }).join('');
    return shell('<div class="fd-intro">'+
      '<div class="fd-intro-hero"><div><span class="fd-eyebrow">ET NYTT EVENTYR VENTER</span>'+
      '<h1 id="fd-title">Fortellingsdalen</h1><p>Her gjemmer det seg brev, små mysterier og historier med spor. Hvilken sti vil du utforske?</p></div>'+
      '<div class="fd-fox">'+fox()+'</div></div>'+
      '<div class="fd-progress"><div><strong>'+progress.done+' av 5 steder utforsket</strong><span>Du velger selv hvor du vil gå</span></div>'+
      '<div class="fd-progress-track"><span style="width:'+progress.pct+'%"></span></div></div>'+
      (draft?'<button class="fd-continue" data-fd-action="resume" type="button">Fortsett historien du begynte på →</button>':'')+
      '<section class="fd-places" aria-label="De fem stedene i Fortellingsdalen">'+stages+'</section>'+
      (progress.complete?'<div class="fd-complete">🏆 Du har oppdaget alle fem stedene! Historiene venter fortsatt på deg.</div>':'')+
      '<p class="fd-development-note">Intern spillbar prototype. Den endelige illustrerte reisekartscenen er ikke publisert.</p></div>');
  }
  function renderStory(){
    const session=core.resume(ui.state);
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
      '<div class="fd-story-banner"><span>HISTORIE '+n+' AV '+session.total+'</span><div class="fd-story-bar"><span style="width:'+mark(n-1,session.total)+'%"></span></div></div>'+
      '<div class="fd-letter"><div class="fd-letter-decoration">✦</div><h2>'+esc(session.story.title)+'</h2><p>'+esc(session.story.passage)+'</p>'+
      '<button type="button" class="fd-read" data-fd-action="read" aria-label="Les opp historien og spørsmålet">◖)) Les opp</button></div>'+
      '<div class="fd-question"><span class="fd-eyebrow">FINN SPORET</span><h3 class="fd-question-prompt">'+esc(q.prompt)+'</h3>'+
      '<div class="fd-options">'+options+'</div></div>'+
      (pending?'<div class="fd-feedback" role="status"><strong>'+(pending.correct?'★ Du fant riktig spor!':'Det var ikke helt riktig denne gangen.')+
        '</strong><span>Svaret er: '+esc(pending.answer)+'</span></div>'+
        '<button class="fd-primary fd-next" type="button" data-fd-action="next">Neste spørsmål →</button>':'')+
      '</article>');
  }
  function renderResult(){
    const r=ui.lastResult;
    if(!r){ui.mode='intro';return renderIntro()}
    const title=r.chapterCompleted?'Hele Fortellingsdalen er utforsket!':r.passed?'Du fant veien videre!':'Du har oppdaget nye spor!';
    return shell('<div class="fd-result"><div class="fd-celebrate">✦</div><span class="fd-eyebrow">HISTORIEN ER FERDIG</span>'+
      '<h1>'+title+'</h1><p>Du fant '+r.correct+' av '+r.total+' svar. '+(r.passed?
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
    const s=core.resume(ui.state);if(!s)return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(s.story.passage+' '+s.story.questions[s.index].prompt);
    u.lang='nb-NO';u.rate=0.86;window.speechSynthesis.speak(u);
  }
  function close(){
    if(!ui)return;
    if('speechSynthesis' in window)window.speechSynthesis.cancel();
    const focus=ui.focus,root=ui.root;ui=null;
    root.remove();document.removeEventListener('keydown',onKey);
    if(focus?.isConnected)focus.focus({preventScroll:true});
  }
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close()}}
  function onClick(event){
    const b=event.target.closest('[data-fd-action]');if(!b||!ui)return;
    const action=b.dataset.fdAction;
    if(action==='close'){close();return}
    if(action==='read'){speak();return}
    if(action==='intro'){ui.pending=null;ui.lastResult=null;ui.mode='intro';save();render();return}
    if(action==='resume'){ui.pending=null;ui.mode='story';render();return}
    if(action==='stage'||action==='replay'){start(b.dataset.fdStage);return}
    if(action==='next'){ui.pending=null;ui.mode='story';render();return}
    if(action==='answer'&&ui.mode==='story'&&!ui.pending){
      const s=core.resume(ui.state);if(!s)return;
      const question=s.story.questions[s.index];
      const response=core.answer(ui.state,Number(b.dataset.fdIndex));
      save();
      if(response.finished){ui.lastResult=response.outcome;ui.mode='result';render();return}
      ui.pending={question,number:s.index+1,correct:response.correct,
        answer:response.answer,selected:response.selected};
      render();
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
