/* Læria English / Kinnaklova. Presentation only: no new learning state. */
(() => {
  'use strict';
  const screen=document.getElementById('subject-screen');
  if(!screen)return;
  const bridge=()=>window.LARIA_TALLVIKA_BRIDGE;
  const active=()=>screen.classList.contains('active')&&screen.dataset.subject==='english';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const actions=[
    {id:'words',title:'Words',desc:'Finn og lær nye ord',symbol:'ABC',module:'words'},
    {id:'sentences',title:'Sentences',desc:'Bygg små engelske setninger',symbol:'Hi!',module:'sentences'},
    {id:'reading',title:'Reading',desc:'Les og forstå historier',symbol:'📖',module:'reading'}
  ];
  let root=null,renderKey='';
  function build(){
    if(!active())return;
    // Keep legacy learning engines and IDs, but retire their page-level map classes.
    for(const cls of ['locked-journey-active','locked-journey-subject-english','premium-journey-active']){
      if(screen.classList.contains(cls))screen.classList.remove(cls);
    }
    if(!root){
      root=document.createElement('section');
      root.id='kinnaklova-world';
      root.setAttribute('aria-label','Engelsk i Kinnaklova');
      screen.insertBefore(root,screen.firstChild);
    }
    const state=bridge()?.state?.(),name=String(state?.profile?.name||'').trim();
    const grade=Number(bridge()?.currentGrade?.()||2);
    const resume=state?.activeSession?.scope?.subject==='english';
    const key=JSON.stringify([name,grade,resume]);
    if(key===renderKey&&root.firstElementChild){
      if(!screen.classList.contains('kinnaklova-active'))screen.classList.add('kinnaklova-active');
      return;
    }
    renderKey=key;
    root.innerHTML=`
      <header class="ki-top"><button type="button" data-ki="home" aria-label="Tilbake til Hjem">‹ <span>Hjem</span></button><strong>LÆRIA · ENGELSK</strong><span class="ki-grade">${grade}. klasse</span></header>
      <div class="ki-landscape" aria-label="Kinnaklova ved havet">
        <div class="ki-sky" aria-hidden="true"></div>
        <div class="ki-horizon" aria-hidden="true"></div>
        <div class="ki-island" aria-hidden="true"><span class="ki-peak ki-peak-left"></span><span class="ki-peak ki-peak-right"></span><span class="ki-cliff"></span><span class="ki-grass"></span></div>
        <div class="ki-coast" aria-hidden="true"><span class="ki-lighthouse"></span><span class="ki-house"></span></div>
        <div class="ki-sea" aria-hidden="true"></div>
        <div class="ki-sail" aria-hidden="true">⛵</div>
        <div class="ki-scene-heading"><small>ENGLISH ADVENTURES</small><h1>Kinnaklova</h1><p>Små ord. Store oppdagelser.</p></div>
        <button type="button" data-ki="words" class="ki-hotspot ki-hotspot-words"><b>Words</b><span>ABC</span></button>
        <button type="button" data-ki="sentences" class="ki-hotspot ki-hotspot-sentences"><b>Sentences</b><span>Hi!</span></button>
        <button type="button" data-ki="reading" class="ki-hotspot ki-hotspot-reading"><b>Reading</b><span>📖</span></button>
      </div>
      <div class="ki-intro"><div><small>VELG DET DU VIL UTFORSKE</small><h2>What shall we discover?</h2></div><p>${name?'Hei, '+esc(name)+'! ':''}Du velger selv, og kan prøve igjen så ofte du vil.</p></div>
      <nav class="ki-actions" aria-label="Engelskaktiviteter">
        ${actions.map(a=>'<button type="button" class="ki-card ki-card-'+a.id+'" data-ki="'+a.id+'" aria-label="Start '+a.title+'"><span class="ki-card-symbol" aria-hidden="true">'+a.symbol+'</span><span><strong>'+a.title+'</strong><small>'+a.desc+'</small></span><em aria-hidden="true">›</em></button>').join('')}
      </nav>
      ${resume?'<aside class="ki-resume"><p>Du har allerede begynt på en engelskøkt.</p><button type="button" data-ki="resume">Fortsett økten ›</button></aside>':''}
      <p class="ki-art-note">Kinnaklova · illustrert konsept for ny Engelsk-forside</p>`;
    if(!screen.classList.contains('kinnaklova-active'))screen.classList.add('kinnaklova-active');
  }
  screen.addEventListener('click',event=>{
    const button=event.target.closest?.('#kinnaklova-world [data-ki]');
    if(!button||!active())return;
    const action=button.dataset.ki;
    if(action==='home'){
      if(!window.LARIA_RETURN_TO_BASECAMP?.())bridge()?.setTab?.('home');
    }else if(action==='resume'){
      bridge()?.resumeSession?.('english');
    }else{
      const item=actions.find(a=>a.id===action);
      if(item)bridge()?.startLearningSession?.('english',item.module,item.title);
    }
  });
  const observer=new MutationObserver(()=>{
    if(active())build();
    else{
      if(screen.classList.contains('kinnaklova-active'))screen.classList.remove('kinnaklova-active');
      if(root){root.remove();root=null;renderKey='';}
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
  if(active())build();
  window.LARIA_KINNAKLOVA=Object.freeze({build,actions:actions.map(a=>a.id)});
})();
