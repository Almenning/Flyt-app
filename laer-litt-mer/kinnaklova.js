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
  const ART='./assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp';
  const CHARACTERS=Object.freeze([
    {id:'storesoster',name:'Storesøster',src:'./assets/gangemagi-troll/storesoster.webp'},
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
  function ensureRoot(){
    if(root&&root.isConnected)return root;
    root=document.createElement('section');
    root.id='kinnaklova-world';
    root.setAttribute('aria-label','Engelsk: Oppdag Kinnaklova');
    screen.insertBefore(root,screen.firstChild);
    return root;
  }
  function onArtStatus(image){
    if(!root||!image.isConnected)return;
    const ready=image.complete&&image.naturalWidth===1672&&image.naturalHeight===941;
    root.dataset.kiArt=ready?'ready':image.complete?'missing':'loading';
    const failure=root.querySelector('.ki-art-unavailable');
    if(failure)failure.hidden=ready||!image.complete;
    // Never reveal a scene where unapproved, baked-in troll art is showing:
    // only the clean, reviewed painting can activate the approved characters.
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
    const key=JSON.stringify([grade,name,resume]);
    const host=ensureRoot();
    if(renderKey===key&&host.firstElementChild){
      if(!screen.classList.contains('kinnaklova-active'))screen.classList.add('kinnaklova-active');
      return;
    }
    renderKey=key;
    host.innerHTML=
      '<header class="ki-utility"><button type="button" data-ki="home" aria-label="Tilbake til Hjem">‹ Hjem</button>'+
      '<span>ENGELSK · KINNAKLOVA</span><span class="ki-grade">'+grade+'. klasse</span></header>'+
      '<div class="ki-stage" role="group" aria-label="Kinnaklova med Words, Sentences og Reading">'+
      '<img class="ki-master" src="'+ART+'" alt="Kinnaklova med Kinn kyrkje, klokketårnet, sjøen og de karakteristiske tvillingtoppene" width="1672" height="941" draggable="false" decoding="async">'+
      '<div class="ki-art-unavailable" hidden role="status"><strong>Den låste Kinnaklova-illustrasjonen mangler i denne utviklingsversjonen.</strong>'+
      '<span>Import av ren bakgrunn er nødvendig før visuell godkjenning og publisering.</span></div>'+
      '<div class="ki-companions" aria-label="De tre godkjente skogstrollene">'+
      CHARACTERS.map(c=>'<img class="ki-troll ki-troll-'+c.id+'" data-ki-character="'+c.id+'" src="'+c.src+
       '" alt="'+c.name+'" draggable="false" loading="eager">').join('')+
      '</div>'+
      '<button type="button" class="ki-painted-hit ki-painted-home" data-ki="home" aria-label="Tilbake til Hjem"></button>'+
      ACTIONS.map(a=>'<button type="button" class="ki-painted-hit ki-painted-'+a.id+
        '" data-ki="'+a.id+'" aria-label="Åpne '+a.name+' ved Kinnaklova"></button>').join('')+
      '</div>'+
      '<div class="ki-intro"><div><small>ENGELSK · VELG DET DU LIKER</small><h2>Hva vil du oppdage?</h2></div>'+
      '<p>'+(name?'Hei, '+escapeText(name)+'! ':'')+'Utforsk ordene, lek med setninger, eller les en historie.</p></div>'+
      '<nav class="ki-actions" aria-label="Velg engelskaktivitet">'+ACTIONS.map(portal).join('')+'</nav>'+
      (resume?'<aside class="ki-resume" aria-label="Pågående Engelsk-økt"><p>Du har en engelskøkt du kan fortsette.</p>'+
        '<button type="button" data-ki="resume">Fortsett økten ›</button></aside>':'');
    const image=host.querySelector('.ki-master');
    image.addEventListener('load',()=>onArtStatus(image),{once:true});
    image.addEventListener('error',()=>onArtStatus(image),{once:true});
    onArtStatus(image);
    if(!screen.classList.contains('kinnaklova-active'))screen.classList.add('kinnaklova-active');
  }
  screen.addEventListener('click',event=>{
    const button=event.target.closest?.('#kinnaklova-world [data-ki]');
    if(!button||!isActive())return;
    const action=button.dataset.ki;
    if(action==='home'){
      if(!window.LARIA_RETURN_TO_BASECAMP?.())bridge()?.setTab?.('home');
    }else if(action==='resume'){
      bridge()?.resumeSession?.('english');
    }else{
      const activity=ACTIONS.find(item=>item.id===action);
      if(activity)bridge()?.startLearningSession?.('english',activity.module,activity.name);
    }
  });
  // The same host is used by Norsk and Matte. A detached English scene must
  // never shadow their paintings or intercept their taps.
  const observer=new MutationObserver(()=>{
    if(isActive())build();
    else{
      if(screen.classList.contains('kinnaklova-active'))screen.classList.remove('kinnaklova-active');
      if(root){root.remove();root=null;renderKey='';}
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
  if(isActive())build();
  window.LARIA_KINNAKLOVA=Object.freeze({
    build,art:ART,
    characters:CHARACTERS.map(({id})=>id),
    actions:ACTIONS.map(({id})=>id),
    ready:()=>root?.dataset.kiArt==='ready'
  });
})();
