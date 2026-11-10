/* Læria Engelsk / Kinnaklova V2.
 * This is a presentation adapter. No changes to learning, progress or profiles.
 * The approved 1672x941 scene is a separate clean master without the three
 * rejected, baked-in trolls; transparent hit targets sit over painted signs.
 * No fox, no newly synthesized characters, no CSS pseudo-rigging.
 */
(() => {
  'use strict';
  const screen=document.getElementById('subject-screen');
  if(!screen)return;
  // The October image is SHA-verified and may render, but its painted
  // title/Words/Sentences/Reading signs make it INVALID as November's clean
  // premium scene. Rendering readiness is not visual-art approval.
  const ART='./assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp';
  const PREMIUM_CLEAN_ART_APPROVED=false;
  // Show only after a pixel-locked clean master and device QA have been approved.
  // A 1672x941 file that still contains the rejected characters is NOT valid.
  const APPROVED_ART_SHA256='d2e2d37b4c54191383457f423c1d568cd538391046e79e6f66e7a8b1928c0e57';
  const REJECTED_REFERENCE_SHA256='3b1d6b6e6c9908dd31c519593504ac22dd2c7473ef05fa51ecd57885cdc6e035';
  // Draft background is intentionally absent. Do not request an unapproved
  // asset, throw HTTP 404s or display it before pixel-locked verification.
  const HAS_CLEAN_MASTER=/^[0-9a-f]{64}$/.test(APPROVED_ART_SHA256)&&
    APPROVED_ART_SHA256!==REJECTED_REFERENCE_SHA256;
  const CHARACTERS=Object.freeze([
    {id:'storesoster',name:'Storesøster',src:'./assets/gangemagi-troll/storesoster.webp',sceneSrc:'./assets/kinnaklova/storesoster-inworld-approved-20261026.webp'},
    {id:'lillebror',name:'Lillebror',src:'./assets/gangemagi-troll/lillebror.webp'},
    {id:'lillesoster',name:'Lillesøster',src:'./assets/gangemagi-troll/lillesoster.webp'}
  ]);
  const ACTIONS=Object.freeze([
    {id:'words',name:'Words',description:'Lær nye ord',module:'words',icon:'ABC'},
    {id:'sentences',name:'Sentences',description:'Lag engelske setninger',module:'sentences',icon:'Hi!'},
    {id:'reading',name:'Reading',description:'Les og forstå små tekster',module:'reading',icon:'📖'}
  ]);
  const bridge=()=>window.LARIA_TALLVIKA_BRIDGE;
  const isActive=()=>screen.classList.contains('active')&&screen.dataset.subject==='english';
  const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let root=null;
  let renderKey='';
  let verifiedArtUrl=null;
  function revokeArt(){
    if(verifiedArtUrl){
      URL.revokeObjectURL(verifiedArtUrl);
      verifiedArtUrl=null;
    }
  }
  function ensureRoot(){
    if(root&&root.isConnected)return root;
    root=document.createElement('section');
    root.id='kinnaklova-world';
    root.setAttribute('aria-label','Engelsk: Oppdag Kinnaklova');
    screen.insertBefore(root,screen.firstChild);
    return root;
  }
  async function onArtStatus(image){
    if(!root||!image.isConnected)return;
    const setStatus=(status,reason='')=>{
      if(!root?.contains(image))return;
      root.dataset.kiArt=status;
      root.dataset.kiArtReason=reason;
      const failure=root.querySelector('.ki-art-unavailable');
      if(failure)failure.hidden=status==='ready'||status==='loading';
    };
    if(!image.complete){setStatus('loading','image-pending');return;}
    if(image.naturalWidth!==1672||image.naturalHeight!==941){
      setStatus('missing','unexpected-dimensions');return;
    }
    // Fail closed until the CLEAN art has its own approved SHA. Never use
    // the reference SHA: it proves that the three rejected trolls are baked in.
    if(!/^[0-9a-f]{64}$/.test(APPROVED_ART_SHA256) ||
        APPROVED_ART_SHA256===REJECTED_REFERENCE_SHA256){
      setStatus('unapproved','missing-approved-sha');return;
    }
    try{
      const response=await fetch(ART,{cache:'no-store'});
      if(!response.ok||!globalThis.crypto?.subtle)throw Error('Art integrity unavailable');
      const bytes=await response.arrayBuffer();
      const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
      const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      if(actual!==APPROVED_ART_SHA256){setStatus('unapproved','sha-mismatch');return;}
      // ART carries a cache-busted script path and the fetch above uses
      // no-store. Keep the already decoded static source in place: assigning
      // a second blob URL makes Safari/WebKit reject an otherwise verified
      // WebP on some iPhone/iPad configurations.
      if(!root?.contains(image))return;
      // A resolved SHA check is not sufficient for the child's first frame:
      // an image can still paint blank in portrait WebKit/Chromium until
      // decode and compositing are complete. Never show a green placeholder
      // with apparently ready activity signs.
      try{await image.decode();}
      catch(_){setStatus('unapproved','decode-failed');return;}
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(!root?.contains(image))return;
      setStatus(image.naturalWidth===1672&&image.naturalHeight===941?'ready':'unapproved',
        image.naturalWidth===1672&&image.naturalHeight===941?'verified':'verified-dimensions-failed');
    }catch(error){setStatus('unapproved',error?.message||'integrity-error');}
  }
  function portal(action){
    return '<button type="button" class="ki-card ki-card-'+action.id+'" data-ki="'+action.id+
      '" aria-label="Start '+action.name+'">'+
      '<span class="ki-card-symbol" aria-hidden="true">'+action.icon+'</span>'+
      '<span class="ki-card-copy"><strong>'+action.name+'</strong><small>'+action.description+'</small></span>'+
      '<span class="ki-card-arrow" aria-hidden="true">›</span></button>';
  }
  function build(){
    if(!isActive())return;
    // The shared subject renderer still prepares its retired journey map.
    // Remove visual-state classes only, not mission records or saved history.
    for(const cls of ['locked-journey-active','locked-journey-subject-english','premium-journey-active']){
      if(screen.classList.contains(cls))screen.classList.remove(cls);
    }
    document.body.classList.remove('locked-journey-subject-english');
    const app=bridge(),state=app?.state?.(),grade=Number(app?.currentGrade?.()||2);
    const name=String(state?.profile?.name||'').trim();
    const resume=state?.activeSession?.scope?.subject==='english';
    const selectedId=CHARACTERS.some(c=>c.id===state?.profile?.tallvikaTroll)?state.profile.tallvikaTroll:'storesoster';
    const selected=CHARACTERS.find(c=>c.id===selectedId)||CHARACTERS[0];
    const selectedSrc=window.LARIA_TROLL_ACTOR?.source?.(selectedId)||selected.src;
    const key=JSON.stringify([grade,name,resume,selectedId]);
    const host=ensureRoot();
    // "ready" below means the historical image decoded and matched its SHA,
    // not that a clean master was approved. Never export a premium-ready
    // status while the locked release manifest has clean=null.
    host.dataset.kiPremiumArt=PREMIUM_CLEAN_ART_APPROVED?'approved':'blocked';
    if(renderKey===key&&host.firstElementChild){
      if(!screen.classList.contains('kinnaklova-active'))screen.classList.add('kinnaklova-active');
      return;
    }
    renderKey=key;
    revokeArt();
    host.innerHTML=
      '<header class="ki-utility"><button type="button" data-ki="home" aria-label="Tilbake til Hjem">‹ Hjem</button>'+
      '<span>ENGELSK · KINNAKLOVA</span><span class="ki-grade">'+grade+'. klasse</span>'+
      '<button type="button" class="ki-utility-choose" data-ki="choose" aria-label="Mine troll, velg følgesvenn">Mine troll</button></header>'+
      '<div class="ki-stage" role="group" aria-label="Kinnaklova med Words, Sentences og Reading">'+
      '<span class="ki-stage-grade" aria-hidden="true">'+grade+'. klasse</span>'+
      '<button type="button" class="ki-stage-choose" data-ki="choose" aria-label="Mine troll, velg følgesvenn">Mine troll</button>'+
      '<img class="ki-master"'+(HAS_CLEAN_MASTER?' src="'+ART+'"':'')+' alt="Kinnaklova med Kinn kyrkje, klokketårnet, sjøen og de karakteristiske tvillingtoppene" width="1672" height="941" draggable="false" decoding="async">'+
      '<div class="ki-art-unavailable" hidden role="status"><strong>Den låste Kinnaklova-illustrasjonen mangler i denne utviklingsversjonen.</strong>'+
      '<span>Import av ren bakgrunn er nødvendig før visuell godkjenning og publisering.</span></div>'+
      '<div class="ki-companions" aria-label="Ditt valgte troll er med på Kinnaklova">'+
      '<button type="button" class="ki-companion-actor laria-troll-host laria-troll-actor" data-ki="troll" data-troll="'+selectedId+'" data-laria-troll-mood="idle" aria-label="Snakk med '+escapeText(selected.name)+' på Kinnaklova">'+
      '<img class="ki-troll laria-premium-troll-art" data-ki-character="'+selectedId+'" src="'+escapeText(selectedSrc)+'" alt="" aria-hidden="true" draggable="false" loading="eager"></button>'+
      '</div>'+
      '<button type="button" class="ki-painted-hit ki-painted-home" data-ki="home" aria-label="Tilbake til Hjem"><span aria-hidden="true">‹ Hjem</span></button>'+
      ACTIONS.map(a=>'<button type="button" class="ki-painted-hit ki-painted-'+a.id+' laria-wayfinder'+
        '" data-ki="'+a.id+'" aria-label="Åpne '+a.name+' ved Kinnaklova"><span class="ki-plank-name" aria-hidden="true">'+a.name+'</span></button>').join('')+
      '</div>'+
      '<div class="ki-intro"><div><small>ENGELSK · VELG DET DU LIKER</small><h2>Hva vil du oppdage?</h2></div>'+
      '<p>'+(name?'Hei, '+escapeText(name)+'! ':'')+'Utforsk ordene, lek med setninger, eller les en historie.</p></div>'+
      '<nav class="ki-actions" aria-label="Velg engelskaktivitet">'+ACTIONS.map(portal).join('')+'</nav>'+
      (resume?'<aside class="ki-resume" aria-label="Pågående Engelsk-økt"><p>Du har en engelskøkt du kan fortsette.</p>'+
        '<button type="button" data-ki="resume">Fortsett økten ›</button></aside>':'');
    window.LARIA_SCENE_UI?.enhance?.(host,'english');
    const image=host.querySelector('.ki-master');
    image.addEventListener('load',()=>onArtStatus(image),{once:true});
    image.addEventListener('error',()=>onArtStatus(image),{once:true});
    onArtStatus(image);
    if(!screen.classList.contains('kinnaklova-active'))screen.classList.add('kinnaklova-active');
    requestAnimationFrame(()=>{
      const actor=host.querySelector('.ki-companion-actor');
      if(actor)window.LARIA_TROLL_ACTOR?.mood?.(actor,'wave',{say:false,duration:1050});
    });
  }
  screen.addEventListener('click',event=>{
    const button=event.target.closest?.('#kinnaklova-world [data-ki]');
    if(!button||!isActive())return;
    const action=button.dataset.ki;
    if(action==='home'){
      if(!window.LARIA_RETURN_TO_BASECAMP?.())bridge()?.setTab?.('home');
    }else if(action==='choose'){
      window.LARIA_TROLL_ACTOR?.openChooser?.();
    }else if(action==='troll'){
      const actor=root?.querySelector('.ki-companion-actor');
      if(actor&&root?.dataset.kiArt==='ready')
        window.LARIA_TROLL_ACTOR?.mood?.(actor,'curious',{say:'Ready to learn some English?'});
    }else if(action==='resume'){
      bridge()?.resumeSession?.('english');
    }else{
      const activity=ACTIONS.find(item=>item.id===action);
      // The sign the child chose determines the subject of all five questions.
      // Fallback to mixed play only when that grade lacks enough module tasks.
      if(activity)bridge()?.startLearningSession?.('english',activity.module,activity.name,true);
    }
  });
  // The same host is used by Norsk and Matte. A detached English scene must
  // never shadow their paintings or intercept their taps.
  const observer=new MutationObserver(()=>{
    if(isActive())build();
    else{
      if(screen.classList.contains('kinnaklova-active'))screen.classList.remove('kinnaklova-active');
      if(root){root.remove();root=null;renderKey='';revokeArt();}
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
  document.addEventListener('laria:troll-changed',()=>{if(isActive()){renderKey='';build();}});
  if(isActive())build();
  window.LARIA_KINNAKLOVA=Object.freeze({
    build,art:ART,
    characters:CHARACTERS.map(({id})=>id),
    actions:ACTIONS.map(({id})=>id),
    ready:()=>root?.dataset.kiArt==='ready',
    premiumReady:()=>root?.dataset.kiPremiumArt==='approved'
  });
})();
