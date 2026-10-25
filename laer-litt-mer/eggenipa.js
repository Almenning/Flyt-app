/* Eggenipa is a presentation-only Norwegian subject landing.
 * Do not alter learning records, the approved Bokskogen map, or other subjects.
 * Locked art is external: assets/norsk/eggenipa-master-laast-20261025.png.
 */
(() => {
  'use strict';
  const screen=document.getElementById('subject-screen');
  if(!screen)return;
  const ART='./assets/norsk/eggenipa-master-laast-20261025.png';
  const actions=[
    {id:'words',name:'Ordjakt',copy:'Finn og bygg ord',image:'./assets/cards/utforsk/words-premium.webp'},
    {id:'find',name:'Finn ordene',copy:'Oppdag ting i bildene',image:'./find-the-words-garden-premium.webp'},
    {id:'map',name:'Bokskogen',copy:'Utforsk oppdragene dine',image:'./bokskogen-atlas32.webp'}
  ];
  const bridge=()=>window.LARIA_TALLVIKA_BRIDGE;
  const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\u0027':'&#39;'}[ch]));
  let mapVisible=false;
  let root=null;
  const isActive=()=>screen.classList.contains('active')&&screen.dataset.subject==='norwegian';
  const grade=()=>bridge()?.journeyViewGrade?.('norwegian')||bridge()?.currentGrade?.()||2;
  function getProgress(){
    try{
      const g=grade();
      return {g,completed:bridge()?.journeyProgress?.('norwegian',g)?.complete||false,
        progress:bridge()?.journeyProgress?.('norwegian',g),
        recommended:bridge()?.journeyRecommendedNode?.('norwegian',g)};
    }catch(_){return {g:2,completed:false,progress:null,recommended:null};}
  }
  function portal(action){
    return '<button type="button" class="eg-portal eg-portal-'+action.id+'" data-eg="'+action.id+'" aria-label="'+safe('Åpne '+action.name)+
      '"><span class="eg-portal-art"><img src="'+action.image+'" loading="lazy" alt="" draggable="false"></span>'+
      '<span class="eg-portal-copy"><strong>'+action.name+'</strong><small>'+action.copy+'</small></span>'+
      '<span class="eg-portal-arrow" aria-hidden="true">›</span></button>';
  }
  function gradeOptions(g,mine){
    return Array.from({length:10},(_,i)=>{
      const current=i+1;
      return '<button type="button" data-eg-grade="'+current+'" class="'+(g===current?'selected':'')+
        '" aria-pressed="'+(g===current)+'"><strong>'+current+'.</strong><small>'+
        (current===mine?'Mitt trinn':current===g?'Valgt':'Utforsk')+'</small></button>';
    }).join('');
  }
  function build(){
    if(!isActive()||mapVisible)return;
    const app=bridge();
    // Existing journey renderers sometimes leave visual-state classes on the
    // shared #subject-screen. Remove only those style flags, not data.
    const flags=['locked-journey-active','locked-journey-subject-norwegian','premium-journey-active'];
    for(const flag of flags)if(screen.classList.contains(flag))screen.classList.remove(flag);
    const state=app?.state?.(),mine=Number(app?.currentGrade?.()||2);
    const p=getProgress(),displayGrade=p.g;
    const recommended=p.recommended;
    const greeting=String(state?.profile?.name||'').trim();
    if(!root){
      root=document.createElement('section');
      root.id='eggenipa-world';
      root.setAttribute('aria-label','Eggenipa, norskverdenen');
      screen.insertBefore(root,screen.firstChild);
    }
    const nextLabel=p.completed?'Prøv et bonusoppdrag':recommended?.title||'Oppdag neste oppdrag';
    const available=Boolean(recommended||p.completed);
    const showChapters=mine===2&&window.LARIA_CHAPTER_EXPANSION?.previewEnabled?.(location.search);
    root.innerHTML=
      '<header class="eg-top"><button type="button" class="eg-home" data-eg="home" aria-label="Tilbake til Hjem">← <span>Hjem</span></button>'+
      '<span class="eg-top-label">LÆRIA · NORSK</span><button type="button" class="eg-grade" data-eg="grade" aria-label="Velg klassetrinn">'+displayGrade+'. klasse</button></header>'+
      '<section class="eg-hero" aria-label="Eventyr ved Eggenipa">'+
      '<img class="eg-master" src="'+ART+'" width="1672" height="941" alt="Illustrert eventyrlandskap ved Eggenipa, med fjord, magisk trehytte, blomster, bro og bibliotek" draggable="false">'+
      '<div class="eg-world-label"><small>NORSK · VELG DIN EGEN VEI</small><h1>Eggenipa</h1>'+
      '<p>'+(greeting?'Hei, '+safe(greeting)+'! ':'')+'Her bor ordene og historiene.</p></div>'+
      '<button class="eg-scene-hit eg-scene-words" data-eg="words" aria-label="Åpne Ordjakt i trehytta" type="button"><span>Ordjakt</span></button>'+
      '<button class="eg-scene-hit eg-scene-find" data-eg="find" aria-label="Åpne Finn ordene ved hagen" type="button"><span>Finn ordene</span></button>'+
      '<button class="eg-scene-hit eg-scene-map" data-eg="map" aria-label="Åpne Bokskogen ved biblioteket" type="button"><span>Bokskogen</span></button>'+
      '</section>'+
      '<div class="eg-intro"><div><small>VELG HVOR DU VIL GÅ</small><h2>Tre steder å utforske</h2></div>'+
      '<p>Du bestemmer. Spill favorittene dine så mange ganger du vil.</p></div>'+
      '<nav class="eg-portals" aria-label="Norskaktiviteter">'+actions.map(portal).join('')+'</nav>'+
      '<section class="eg-next" aria-label="Neste frivillige oppdrag"><div><small>NESTE EVENTYR · HELT FRIVILLIG</small>'+
      '<h2>'+safe(nextLabel)+'</h2><p>Du kan alltid bli i favorittleken din.</p></div>'+
      '<button type="button" data-eg="next" '+(available?'':'disabled')+' aria-label="Start neste frivillige norskoppdrag">Prøv oppdraget ›</button></section>'+
      (showChapters?'<button class="eg-preview" type="button" data-eg="chapters">Mine eventyr · testversjon</button>':'')+
      '<dialog class="eg-grade-dialog" aria-label="Velg klassetrinn"><form method="dialog">'+
      '<button type="submit" class="eg-dialog-close" aria-label="Lukk">×</button>'+
      '<small>UTFORSK I DITT TEMPO</small><h2>Velg klassetrinn</h2>'+
      '<p>Du kan utforske andre trinn uten å endre profilen din.</p>'+
      '<div class="eg-grade-grid">'+gradeOptions(displayGrade,mine)+'</div></form></dialog>';
    if(!screen.classList.contains('eggenipa-active'))screen.classList.add('eggenipa-active');
  }
  function openMap(){
    if(!isActive())return;
    mapVisible=true;
    if(root)root.hidden=true;
    if(screen.classList.contains('eggenipa-active'))screen.classList.remove('eggenipa-active');
    // Re-render the original map for the selected view grade, including higher
    // grades. This does not modify saved learning evidence or completed nodes.
    bridge()?.setJourneyViewGrade?.('norwegian',grade(),true);
    let returnButton=document.getElementById('eggenipa-map-return');
    if(!returnButton){
      returnButton=document.createElement('button');
      returnButton.type='button';
      returnButton.id='eggenipa-map-return';
      returnButton.textContent='← Til Eggenipa';
      returnButton.setAttribute('aria-label','Tilbake til Norsk ved Eggenipa');
      document.getElementById('subject-journey-section')?.appendChild(returnButton);
    }
    returnButton.hidden=false;
  }
  function closeMap(){
    mapVisible=false;
    document.getElementById('eggenipa-map-return')?.remove();
    if(root)root.hidden=false;
    build();
    window.scrollTo(0,0);
  }
  screen.addEventListener('click',event=>{
    const back=event.target.closest?.('#eggenipa-map-return');
    if(back&&isActive()){closeMap();return;}
    const btn=event.target.closest?.('#eggenipa-world [data-eg]');
    if(!btn||!isActive()||mapVisible)return;
    const action=btn.dataset.eg;
    if(action==='home'){
      if(!window.LARIA_RETURN_TO_BASECAMP?.())bridge()?.setTab?.('home');
    }else if(action==='words'){
      window.openWordHunt?.();
    }else if(action==='find'){
      window.openFindTheWords?.();
    }else if(action==='map'){
      openMap();
    }else if(action==='grade'){
      root?.querySelector('.eg-grade-dialog')?.showModal();
    }else if(action==='next'){
      const p=getProgress();
      if(p.completed)bridge()?.startJourneyChallenge?.('norwegian');
      else if(p.recommended)bridge()?.startJourneyNode?.('norwegian',p.recommended.id,p.g);
    }else if(action==='chapters'){
      document.querySelector('[data-laria-chapter2-preview]')?.click();
    }
  });
  screen.addEventListener('click',event=>{
    const button=event.target.closest?.('#eggenipa-world [data-eg-grade]');
    if(!button||!isActive()||mapVisible)return;
    const g=Number(button.dataset.egGrade);
    if(!Number.isInteger(g)||g<1||g>10)return;
    root?.querySelector('.eg-grade-dialog')?.close();
    bridge()?.setJourneyViewGrade?.('norwegian',g,true);
    build();
  });
  const observer=new MutationObserver(()=>{
    if(isActive()){
      if(!mapVisible)build();
    }else{
      mapVisible=false;
      document.getElementById('eggenipa-map-return')?.remove();
      if(screen.classList.contains('eggenipa-active'))screen.classList.remove('eggenipa-active');
      if(root){root.remove();root=null;}
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
  if(isActive())build();
  window.LARIA_EGGENIPA=Object.freeze({build,openMap,closeMap,art:ART});
})();