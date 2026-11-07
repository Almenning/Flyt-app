/* Norsk premium: Eggenipa is the locked visual home, not a journey map.
 * Keeps existing learning data, questions and saved profile untouched.
 * Artwork SHA-256 remains fixed by tests/laria-eggenipa-contract.test.cjs.
 */
(() => {
  'use strict';
  const screen=document.getElementById('subject-screen');
  if(!screen)return;
  const ART='./assets/norsk/eggenipa-master-laast-20261025.png';
  const actions=[
    {id:'words',name:'Ordjakt',copy:'Oppdag skjulte ord',image:'./assets/cards/utforsk/words-premium.webp'},
    {id:'find',name:'Finn ordene',copy:'Finn tingene i bildene',image:'./find-the-words-garden-premium.webp'},
    {id:'reading',name:'Lesekroken',copy:'Les, forstå og oppdag',image:'./assets/cards/reisen/norwegian-premium.webp'}
  ];
  const bridge=()=>window.LARIA_TALLVIKA_BRIDGE;
  const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\u0027':'&#39;'}[ch]));
  const isActive=()=>screen.classList.contains('active')&&screen.dataset.subject==='norwegian';
  let root=null;
  let identity='';
  function portal(action){
    return '<button type="button" class="eg-portal eg-portal-'+action.id+'" data-eg="'+action.id+
      '" aria-label="'+safe('Åpne '+action.name)+'">'+
      '<span class="eg-portal-art"><img src="'+action.image+'" loading="eager" alt="" draggable="false"></span>'+
      '<span class="eg-portal-copy"><strong>'+action.name+'</strong><small>'+action.copy+'</small></span>'+
      '<span class="eg-portal-arrow" aria-hidden="true">›</span></button>';
  }
  function isNorwegianSession(state){
    return state?.activeSession?.scope?.subject==='norwegian';
  }
  function build(){
    if(!isActive())return;
    // The previous Bokskogen renderer shares this screen. Hide its visual
    // classes, but never delete its learning IDs or stored progress.
    for(const flag of ['locked-journey-active','locked-journey-subject-norwegian','premium-journey-active']){
      if(screen.classList.contains(flag))screen.classList.remove(flag);
    }
    if(!root){
      root=document.createElement('section');
      root.id='eggenipa-world';
      root.setAttribute('aria-label','Norsk ved Eggenipa');
      screen.insertBefore(root,screen.firstChild);
    }
    const data=bridge()?.state?.();
    const profileGrade=Number(bridge()?.currentGrade?.()||2);
    const greeting=String(data?.profile?.name||'').trim();
    const resume=isNorwegianSession(data);
    const trollId=['storesoster','lillesoster','lillebror'].includes(data?.profile?.tallvikaTroll)
      ?data.profile.tallvikaTroll:'storesoster';
    const trollSrc=window.LARIA_TROLL_ACTOR?.source?.(trollId)||'./assets/gangemagi-troll/'+trollId+'.webp';
    // Do not rebuild buttons under a finger during unrelated class changes.
    const nextIdentity=[profileGrade,greeting,resume,trollId].join('|');
    if(identity===nextIdentity&&root.firstElementChild){
      if(!screen.classList.contains('eggenipa-active'))screen.classList.add('eggenipa-active');
      root.hidden=false;
      return;
    }
    identity=nextIdentity;
    root.innerHTML=
      // In-scene controls are the sole navigation. No hidden duplicate Home.
      '<section class="eg-hero eg-art-pending" aria-label="Eggenipa og tre steder å leke">'+
      '<img class="eg-master" src="'+ART+'" width="1672" height="941" loading="eager" fetchpriority="high" decoding="async" alt="Illustrert landskap ved Eggenipa med fjord, trehytte, blomster, bro og bibliotek" draggable="false">'+
      '<button type="button" class="eg-scene-home eg-home" data-eg="home" aria-label="Tilbake til Hjem">‹ <span>Hjem</span></button>'+
      '<div class="eg-world-brand" aria-label="Læria, norsk ved Eggenipa"><strong>Læria</strong><span>Oppdag Eggenipa</span></div>'+
      '<span class="eg-world-grade" aria-hidden="true">'+profileGrade+'. klasse</span>'+
      '<button type="button" class="eg-scene-choose" data-eg="choose" aria-label="Mine troll, velg følgesvenn">Mine troll</button>'+
      '<button type="button" class="eg-companion-actor laria-troll-host laria-troll-actor" data-eg="troll" data-troll="'+trollId+'" data-laria-troll-mood="idle" aria-label="Snakk med det valgte trollet ved Eggenipa">'+
      '<img class="laria-premium-troll-art" src="'+safe(trollSrc)+'" alt="" aria-hidden="true" draggable="false"></button>'+
      '<button type="button" class="eg-scene-hit eg-scene-words laria-wayfinder" data-eg="words" aria-label="Åpne Ordjakt i trehytta"><span>Ordjakt</span></button>'+
      '<button type="button" class="eg-scene-hit eg-scene-find laria-wayfinder" data-eg="find" aria-label="Åpne Finn ordene ved hagen"><span>Finn ordene</span></button>'+
      '<button type="button" class="eg-scene-hit eg-scene-reading laria-wayfinder" data-eg="reading" aria-label="Åpne Lesekroken ved biblioteket"><span>Lesekroken</span></button></section>'+
      '<div class="eg-intro"><div><small>VELG DIN EGEN VEI</small><h2>Hva vil du oppdage?</h2></div>'+
      '<p>'+(greeting?'Hei, '+safe(greeting)+'! ':'')+'Velg det du liker. Du kan alltid prøve igjen.</p></div>'+
      '<nav class="eg-portals" aria-label="Velg en norskaktivitet">'+actions.map(portal).join('')+'</nav>'+
      (resume?'<section class="eg-resume" aria-label="Pågående norskøkt"><p>Du har en norskøkt du kan fortsette når du vil.</p>'+
        '<button type="button" data-eg="resume">Fortsett økten ›</button></section>':'');
    const master=root.querySelector('.eg-master');
    const hero=root.querySelector('.eg-hero');
    if(master&&hero){
      const reveal=()=>{
        const finish=()=>{if(master.isConnected&&master.naturalWidth>0)hero.classList.remove('eg-art-pending');};
        if(typeof master.decode==='function')master.decode().then(finish,finish);
        else finish();
      };
      if(master.complete)reveal();
      else{
        master.addEventListener('load',reveal,{once:true});
        master.addEventListener('error',()=>hero.classList.add('eg-art-error'),{once:true});
      }
    }
    if(!screen.classList.contains('eggenipa-active'))screen.classList.add('eggenipa-active');
    root.hidden=false;
    requestAnimationFrame(()=>{
      const actor=root?.querySelector('.eg-companion-actor');
      if(actor)window.LARIA_TROLL_ACTOR?.mood?.(actor,'wave',{say:false,duration:1050});
    });
  }
  screen.addEventListener('click',event=>{
    const button=event.target.closest?.('#eggenipa-world [data-eg]');
    if(!button||!isActive())return;
    const action=button.dataset.eg;
    if(action==='home'){
      if(!window.LARIA_RETURN_TO_BASECAMP?.())bridge()?.setTab?.('home');
    }else if(action==='choose'){
      window.LARIA_TROLL_ACTOR?.openChooser?.();
    }else if(action==='troll'){
      const actor=root?.querySelector('.eg-companion-actor');
      if(actor)window.LARIA_TROLL_ACTOR?.mood?.(actor,'curious',{say:'Hva vil du utforske i Bokskogen?'});
    }else if(action==='words'){
      button.focus({preventScroll:true});
      window.openWordHunt?.();
    }else if(action==='find'){
      button.focus({preventScroll:true});
      window.openFindTheWords?.({preferPremium:true});
    }else if(action==='reading'){
      bridge()?.startLearningSession?.('norwegian','reading','Lesekroken');
    }else if(action==='resume'){
      bridge()?.resumeSession?.();
    }
  });
  // Only the active Norwegian subject owns this artwork. After a direct
  // reading session the normal app navigation re-enters this same landing.
  const observer=new MutationObserver(()=>{
    if(isActive())build();
    else{
      if(screen.classList.contains('eggenipa-active'))screen.classList.remove('eggenipa-active');
      if(root){root.remove();root=null;identity='';}
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
  document.addEventListener('laria:troll-changed',()=>{if(isActive()){identity='';build();}});
  if(isActive())build();
  // Read-only compatibility for older app-back integrations. The discarded
  // journey map is never opened by the new Norsk screen.
  window.LARIA_EGGENIPA=Object.freeze({build,isMapOpen:()=>false,art:ART});
})();