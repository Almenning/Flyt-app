/* Læria Geografi: Kinnaklova-style entry to the original Nordlysleiren.
 * Presentation only. The five-place journey, progress, globe and country pools
 * remain in their existing engines. No historical journey data is rewritten.
 */
(() => {
  'use strict';
  const screen=document.getElementById('geography-screen');
  if(!screen)return;
  const ART='./assets/cards/reisen/geography-premium.webp';
  const bridge=()=>window.LARIA_TALLVIKA_BRIDGE;
  const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const active=()=>screen.classList.contains('active');
  let root=null,key='',phase='landing';
  function landing(){
    if(!active()||phase!=='landing')return;
    if(!root||!root.isConnected){
      root=document.createElement('section');
      root.id='laria-geography-world';
      root.setAttribute('aria-label','Læria Geografi, Nordlysleiren');
      screen.insertBefore(root,screen.firstChild);
    }
    const state=bridge()?.state?.();
    const grade=Number(bridge()?.currentGrade?.()||2);
    const id=['storesoster','lillesoster','lillebror'].includes(state?.profile?.tallvikaTroll)
      ?state.profile.tallvikaTroll:'storesoster';
    const src=window.LARIA_TROLL_ACTOR?.source?.(id)||'./assets/gangemagi-troll/'+id+'.webp';
    const next=JSON.stringify([grade,id]);
    if(key!==next||!root.firstElementChild){
      key=next;
      root.innerHTML=
        '<div class="gv-scene" role="group" aria-label="Nordlysleiren med tre veier videre">'+
        '<img class="gv-landscape" src="'+ART+'" alt="Illustrert nordlyshimmel over norske fjell, fjord og eventyrleir" width="1024" height="704" draggable="false" loading="eager" decoding="async">'+
        '<button class="gv-home" type="button" data-gv="home" aria-label="Tilbake til Hjem">‹ Hjem</button>'+
        '<span class="gv-grade" aria-hidden="true">'+grade+'. klasse</span>'+
        '<div class="gv-brand" aria-label="Læria, Geografi"><strong>Læria</strong><span>Oppdag Nordlysleiren</span></div>'+
        '<button type="button" class="gv-sign gv-sign-journey" data-gv="journey" aria-label="Åpne Geografireisen">Geografireisen <span aria-hidden="true">›</span></button>'+
        '<button type="button" class="gv-sign gv-sign-globe" data-gv="globe" aria-label="Åpne Kloden">Kloden <span aria-hidden="true">›</span></button>'+
        '<button type="button" class="gv-sign gv-sign-country" data-gv="country" aria-label="Start Land og flagg">Land og flagg <span aria-hidden="true">›</span></button>'+
        '<button type="button" class="gv-troll laria-troll-host laria-troll-actor" data-gv="troll" data-troll="'+id+'" data-laria-troll-mood="idle" aria-label="Snakk med trollet ditt i Nordlysleiren">'+
        '<img class="laria-premium-troll-art" src="'+safe(src)+'" alt="" aria-hidden="true" draggable="false"></button>'+
        '</div>';
      requestAnimationFrame(()=>{
        const actor=root?.querySelector('.gv-troll');
        if(actor?.isConnected)window.LARIA_TROLL_ACTOR?.mood?.(actor,'wave',{say:false,duration:1050});
      });
    }
    root.hidden=false;
    if(!screen.classList.contains('gv-visible'))screen.classList.add('gv-visible');
  }
  function journey(){
    // The original Nordlysleiren and its five painted places stay live.
    // This is a view switch, not a new journey or a progress migration.
    phase='journey';
    if(root)root.hidden=true;
    if(screen.classList.contains('gv-visible'))screen.classList.remove('gv-visible');
    // Always render the genuine journey after entering the landscape sign.
    // The old 'locked-journey-active' class may be set before the map is visible.
    try{window.renderGeoJourney?.();}catch(error){
      console.error('[Læria] Geografireisen kunne ikke åpnes',error);
    }
    requestAnimationFrame(()=>window.scrollTo(0,0));
  }
  function returnLanding(){
    phase='landing';landing();
    requestAnimationFrame(()=>window.scrollTo(0,0));
  }
  screen.addEventListener('click',event=>{
    const button=event.target.closest?.('#laria-geography-world [data-gv]');
    if(!button||!active())return;
    const action=button.dataset.gv;
    if(action==='home'){
      if(!window.LARIA_RETURN_TO_BASECAMP?.())bridge()?.setTab?.('home');
    }else if(action==='troll'){
      const actor=root?.querySelector('.gv-troll');
      if(actor)window.LARIA_TROLL_ACTOR?.mood?.(actor,'curious',{say:'Skal vi utforske verden sammen?'});
    }else if(action==='journey'){
      journey();
    }else if(action==='globe'){
      window.openGlobe?.('explore');
    }else if(action==='country'){
      const country=screen.querySelector('[data-geo-theme="country"]');
      country?.click();
      screen.querySelector('#start-geography-theme')?.click();
    }
  });
  // Give children a genuine return route from the original journey map to
  // the new subject entrance; intercept ONLY its two map-back buttons.
  screen.addEventListener('click',event=>{
    if(phase!=='journey'||!active())return;
    if(!event.target.closest?.('.locked-journey-back,.locked-journey-floating-back'))return;
    event.preventDefault();event.stopImmediatePropagation();
    returnLanding();
  },true);
  new MutationObserver(()=>{
    if(active()){
      if(phase==='landing')landing();
    }else{
      // A geography mission temporarily opens the common session/complete
      // screen. Preserve the journey phase so "Tilbake" returns to the same
      // painted map, not to a landing overlay hiding the restored journey.
      // Navigating elsewhere (Home, Utforsk, another subject) resets it.
      const childLearningScreen=['session-screen','complete-screen'].some(id=>
        document.getElementById(id)?.classList.contains('active'));
      if(!(phase==='journey'&&childLearningScreen))phase='landing';
      key='';
      if(screen.classList.contains('gv-visible'))screen.classList.remove('gv-visible');
      if(root){root.remove();root=null;}
    }
  }).observe(screen,{attributes:true,attributeFilter:['class']});
  if(active())landing();
  window.LARIA_GEOGRAPHY_SCENE=Object.freeze({landing,journey,art:ART});
})();
