/* Presentation-only renderer for the four ORIGINAL approved journey PNGs.
 * Refuses mismatched/unavailable art and keeps the existing renderer intact.
 * All progress and mission execution remain with the original app engine.
 */
(function(){
  'use strict';
  const contract=window.LARIA_LOCKED_JOURNEYS;
  if(!contract||typeof renderSubjectJourney!=='function'||typeof renderGeoJourney!=='function')return;
  const previousSubject=renderSubjectJourney,previousGeo=renderGeoJourney;
  // OFF until all FOUR exact October 10 source PNGs have been uploaded and
  // visually compared. This avoids broken 404 requests in the live fallback.
  // Only the automated decoder test opts in with a page-init flag.
  const ORIGINAL_SOURCE_IMAGES_VERIFIED=true;
  const assets=new Map();
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const escapeId=value=>esc(value);
  function selectedAvatar(){
    try{return state?.profile?.avatar==='girl'?'girl':'boy'}catch(_){return 'boy'}
  }
  function selectedAvatarSource(subject){
    if(window.LARIA_SKOGSTROLL?.enabled?.())return window.LARIA_SKOGSTROLL.sourceForSubject(subject);
    const which=selectedAvatar();
    try{
      if(typeof avatarSrc==='function')return avatarSrc(which);
      return window.LARIA_PROFILE_AVATARS?.[which]||'./lia-fox-explorer-home.webp';
    }catch(_){return './lia-fox-explorer-home.webp'}
  }
  // Reversible transparent cleanup patches. The four approved original
  // paintings remain byte-for-byte intact and own all hotspots and geometry.
  // Coordinates are source-image pixels on the unchanged 941x1672 canvas.
  const FOX_FREE_OVERLAYS=Object.freeze({
    norwegian:Object.freeze({asset:'bokskogen-fox-free-overlay.png',rect:[56,1012,297,280]}),
    math:Object.freeze({asset:'tallenga-fox-free-overlay.png',rect:[98,1044,311,342]}),
    english:Object.freeze({asset:'ordlandsbyen-fox-free-overlay.png',rect:[118,1082,279,317]}),
    geography:Object.freeze({asset:'nordlysleiren-fox-free-overlay.png',rect:[124,1093,287,313]})
  });
  function foxFreeOverlayMarkup(subject){
    const patch=FOX_FREE_OVERLAYS[subject];
    if(!patch)return '';
    const [x,y,w,h]=patch.rect;
    const px=(n,total)=>(n/total*100).toFixed(6)+'%';
    return '<img class="locked-journey-fox-free" src="./locked-journeys/fox-free/'+patch.asset+
      '" alt="" aria-hidden="true" draggable="false" data-fox-free-subject="'+subject+
      '" width="'+w+'" height="'+h+'" style="left:'+px(x,941)+';top:'+px(y,1672)+
      ';width:'+px(w,941)+';height:'+px(h,1672)+'">';
  }
  function liveProfileMarkup(progress,subject){
    const which=selectedAvatar(),troll=!!window.LARIA_SKOGSTROLL?.enabled?.();
    const label=troll?window.LARIA_SKOGSTROLL.labelForSubject(subject):
      which==='girl'?'Din valgte revejente':'Din valgte revegutt';
    // The approved painting contains a sample portrait and "127". Cover both
    // with real local profile/progress UI so decorative pixels are never
    // presented as the child's saved avatar or earned score.
    return '<div class="locked-journey-profile'+(troll?' laria-troll-host':'')+'"'+(troll?'':' data-avatar="'+which+'"')+
      (troll?' data-laria-troll="'+window.LARIA_SKOGSTROLL.keyFor(subject)+'"':'')+
      ' aria-label="'+label+'">'+
      '<img src="'+esc(selectedAvatarSource(subject))+'" alt=""></div>'+
      '<div class="locked-journey-live-progress" role="status" aria-label="'+esc(progress.done+' av '+progress.total+' oppdrag fullført i denne reisen')+'">'+
      '<span aria-hidden="true">★</span><b>'+progress.done+' / '+progress.total+'</b></div>';
  }
  function screenFor(geo){return document.getElementById(geo?'geography-screen':'subject-screen')}
  function hostFor(geo){return document.getElementById(geo?'geo-journey-map':'journey-map')}
  // Keep the active illustrated journey explicit in the DOM.  Presentation
  // rules must not infer it from a nested map with :has(): WebKit and
  // Chromium may evaluate that relationship at different points while the
  // original PNG is decoding.
  function setJourneyContext(subject){
    const names=['norwegian','math','english','geography'];
    const classes=names.map(name=>'locked-journey-subject-'+name);
    document.body.classList.remove(...classes);
    document.body.classList.add('locked-journey-subject-'+subject);
    [screenFor(false),screenFor(true)].forEach(screen=>screen?.classList.remove(...classes));
    screenFor(subject==='geography')?.classList.add('locked-journey-subject-'+subject);
  }
  function clearJourneyContext(){
    const classes=['norwegian','math','english','geography'].map(name=>'locked-journey-subject-'+name);
    document.body.classList.remove(...classes);
    [screenFor(false),screenFor(true)].forEach(screen=>screen?.classList.remove(...classes));
  }
  function resetJourneyScroll(){
    // A subject card can be focused while Basecamp is scrolled. Keep the
    // illustrated first landmark at the viewport edge when the journey opens,
    // including WebKit after a device rotation.
    window.scrollTo(0,0);
  }
  function backHome(geo){
    // Navigate directly rather than simulating a click on a separate, hidden
    // back button. WebKit at 320px occasionally left the journey active after
    // the proxy click; the real Basecamp return keeps Explore/Home context.
    clearJourneyContext();
    if(typeof window.LARIA_RETURN_TO_BASECAMP==='function'&&
       window.LARIA_RETURN_TO_BASECAMP())return;
    if(typeof setTab==='function'){setTab('home');return}
    const btn=document.getElementById(geo?'geography-back':'subject-back');
    btn?.click();
  }
  function notifyLoaded(subject){
    requestAnimationFrame(()=>{
      if(subject==='geography'){
        if(screenFor(true)?.classList.contains('active')&&journeyViewGrade('geography')<=2)renderGeoJourney();
      }else if(screenFor(false)?.classList.contains('active')&&activeSubject===subject&&journeyViewGrade(subject)<=2){
        renderSubjectJourney();
      }
    });
  }
  function ensureOriginalArt(subject){
    const previous=assets.get(subject);
    if(previous)return previous.status==='ready';
    const definition=contract.get(subject);
    if(!definition)return false;
    const img=new Image();
    const record={status:'pending',image:img};
    assets.set(subject,record);
    img.onload=()=>{
      if(!contract.matchesOriginalSize(subject,img.naturalWidth,img.naturalHeight)){
        record.status='invalid';notifyLoaded(subject);return;
      }
      const ready=()=>{record.status='ready';notifyLoaded(subject);};
      if(typeof img.decode==='function')img.decode().then(ready,ready);
      else ready();
    };
    img.onerror=()=>{record.status='missing';notifyLoaded(subject)};
    img.decoding='async';
    img.src='./'+definition.asset;
    return false;
  }
  const WAITING_ART_TITLES=Object.freeze({
    norwegian:'Bokskogen',math:'Tallenga',english:'Ordlandsbyen',geography:'Nordlysleiren'
  });
  // Four already-approved card thumbnails total under 400 KB; preload these,
  // never the four multi-MB original maps. An immediate child tap should show
  // existing illustrated card art instead of an empty thumbnail frame.
  const approvedCardPreviews=Object.fromEntries(Object.keys(WAITING_ART_TITLES).map(subject=>{
    const image=new Image();
    image.decoding='async';
    image.src='./assets/cards/reisen/'+subject+'-premium.webp';
    return [subject,image];
  }));
  // One source of truth for the visible intermediate frame. Never briefly
  // expose the retired world renderer or a blank dark canvas during decoding.
  function artworkGuard(subject,failed,overlay){
    const label=WAITING_ART_TITLES[subject]||'Eventyrreisen';
    const thumbSrc=approvedCardPreviews[subject]?.src||'./assets/cards/reisen/'+subject+'-premium.webp';
    return '<div class="locked-journey-art-guard" '+(overlay?'aria-hidden="true"':'role="status" aria-live="polite"')+'>'+
      '<div class="locked-journey-art-card">'+
        '<img src="'+thumbSrc+'" alt="" draggable="false" decoding="async" width="1024" height="704">'+
        '<strong>'+label+'</strong><span>'+(failed?'Kartet kunne ikke åpnes.':'Eventyret åpner seg …')+'</span>'+
        (failed?'<button type="button" class="locked-journey-art-retry">Prøv igjen</button>':'')+
      '</div></div>';
  }
  function renderWaiting(subject,geo,failed){
    const host=hostFor(geo),screen=screenFor(geo);
    if(!host||!screen)return;
    if(host.dataset.journeyWaiting===subject&&host.dataset.journeyFailed===String(!!failed))return;
    host.className='journey-map locked-journey-map';
    host.dataset.journeySubject=subject;
    host.dataset.journeyWaiting=subject;
    host.dataset.journeyFailed=String(!!failed);
    host.innerHTML='<section class="locked-journey-board locked-journey-waiting-stage" aria-label="'+
      esc((WAITING_ART_TITLES[subject]||'Reisen')+' åpnes')+'">'+
      artworkGuard(subject,failed,false)+
      '<button class="locked-journey-waiting-back" type="button" aria-label="Tilbake fra eventyrreisen">← <span>Tilbake</span></button>'+
      '</section>';
    screen.classList.add('locked-journey-active');
    setJourneyContext(subject);
    resetJourneyScroll();
    // The original geography HTML puts two retired cards before the journey.
    // Prioritize Nordlysleiren while its approved PNG is still loading, not
    // only after decode. Otherwise Safari briefly shows the legacy cards.
    if(geo){
      const shell=document.getElementById('geo-journey-shell');
      const globe=document.getElementById('open-world');
      if(shell&&globe&&shell.nextElementSibling!==globe)screen.insertBefore(shell,globe);
    }
    if(geo)screen.classList.add('premium-geo-active');
    else{
      screen.classList.add('premium-journey-active');
      screen.classList.remove('bokskogen-v10-active','bokskogen-v2-active','bokskogen-v3-active');
    }
    host.querySelector('.locked-journey-waiting-back').onclick=()=>backHome(geo);
    host.querySelector('.locked-journey-art-retry')?.addEventListener('click',()=>{
      assets.delete(subject);
      if(geo)renderGeoJourney();
      else renderSubjectJourney();
    });
  }
  // The NEW DOM image must itself decode before the warm approved-art cover is
  // removed. Preloading alone is not proof that WebKit painted the new element.
  function revealDecodedArtwork(host,subject,geo){
    const original=host.querySelector('.locked-journey-image');
    const guard=host.querySelector('.locked-journey-art-guard');
    if(!original||!guard)return;
    let done=false;
    const reveal=()=>{
      if(done||!original.isConnected||!guard.isConnected)return;
      if(original.naturalWidth!==941||original.naturalHeight!==1672)return;
      done=true;
      requestAnimationFrame(()=>{
        if(original.isConnected&&guard.isConnected)guard.remove();
      });
    };
    const afterLoad=()=>{
      if(typeof original.decode==='function')original.decode().then(reveal,reveal);
      else reveal();
    };
    original.addEventListener('load',afterLoad,{once:true});
    original.addEventListener('error',()=>{
      if(!original.isConnected)return;
      assets.delete(subject);
      renderWaiting(subject,geo,true);
    },{once:true});
    if(original.complete&&original.naturalWidth>0)afterLoad();
  }
  function statusFor(node,geo){return geo?geoJourneyNodeState(node):journeyNodeState(node)}
  function completed(node,geo){
    const st=statusFor(node,geo);
    return st==='passed'||st==='can-now'||st==='mastered';
  }
  function showCurrentIllustratedStop(host,geo){
    const screen=screenFor(geo),target=host.querySelector('.locked-journey-hotspot.state-current');
    if(!screen?.classList.contains('active')||!target)return;
    const viewport=window.innerHeight||document.documentElement.clientHeight||800;
    const box=target.getBoundingClientRect();
    // On iPad/landscape the uncropped portrait art may be taller than the
    // viewport. Enter near the next stop rather than hiding the fox far below.
    // On portrait phones, keep the painted heading in view whenever the
    // current mission already fits above the 48px bottom touch-safe zone.
    // Retain the existing centering for distant/landscape journey stops.
    const portraitPhone=window.innerWidth<700&&viewport>window.innerWidth;
    const topLimit=Math.max(48,viewport*.12);
    const bottomLimit=portraitPhone?viewport-48:viewport*.81;
    if(box.top>=topLimit&&box.bottom<=bottomLimit)return;
    const desired=viewport*.57;
    const scrollY=Math.max(0,window.scrollY+box.top+box.height*.5-desired);
    window.scrollTo({top:scrollY,behavior:'auto'});
  }
  function stage(subject,geo){
    const grade=journeyViewGrade(subject);
    const progress=geo?geoJourneyProgress(grade):journeyProgress(subject,grade);
    if(!progress.model.areas.length)return null;
    const recommended=geo?geoJourneyRecommendedNode(grade):journeyRecommendedNode(subject,grade);
    const firstOpen=journeyFirstOpenArea(progress.model,geo?geoJourneyAreaComplete:journeyAreaComplete);
    return {grade,progress,recommended,firstOpen,contract:contract.build(subject,progress.model,n=>statusFor(n,geo),recommended?.id)};
  }
  function placeLocked(place,model,firstOpen){
    const required=place.nodes.filter(n=>n.type==='skill'||n.type==='geo-skill'||n.type==='checkpoint');
    return required.length>0&&required.every(n=>{
      if(n.complete)return false;
      return model.areas.findIndex(a=>a.id===n.areaId)>firstOpen;
    });
  }
  function placeButton(subject,place,model,firstOpen){
    const box=contract.hotspot(subject,place.index);
    const locked=placeLocked(place,model,firstOpen);
    const state=place.complete?'complete':place.recommended?'current':locked?'future':'available';
    const style='left:'+box.left+';top:'+box.top+';width:'+box.width+';height:'+box.height;
    const progress=place.total?place.done+' av '+place.total+' oppdrag':'Besøk stedet';
    return '<button type="button" class="locked-journey-hotspot state-'+state+'" data-locked-place="'+place.index+'" style="'+style+'" aria-label="'+esc('Sted '+(place.index+1)+': '+place.title+'. '+progress+(locked?'. Fremtidig etappe':place.recommended?'. Neste oppdrag':''))+'">'+
      '<span class="locked-journey-hotspot-mark" aria-hidden="true">'+(place.complete?'✓':place.recommended?'✦':'')+'</span></button>';
  }
  // The five painted places must remain mapped to their original learning
  // nodes. Presentation can recommend, but NEVER unlock or complete a node.
  const CORE_MISSIONS=new Set(['skill','geo-skill','checkpoint']);
  let floatingBackObserver=null;
  function nextJourneyPlace(current,places,model,firstOpen){
    const ahead=places.filter(place=>place.index>current.index&&
      place.nodes.some(n=>CORE_MISSIONS.has(n.type)&&!n.complete&&
        model.areas.findIndex(area=>area.id===n.areaId)<=firstOpen)&&
      !placeLocked(place,model,firstOpen));
    return ahead.find(place=>place.recommended)||ahead[0]||null;
  }
  function journeyMissionSheet(place,nodes,stage){
    const core=nodes.filter(n=>CORE_MISSIONS.has(n.type));
    const pending=core.filter(n=>!n.complete&&!n.locked);
    const finished=place.total>0&&place.done===place.total;
    const next=finished&&!stage.progress.complete?
      nextJourneyPlace(place,stage.contract.places,stage.progress.model,stage.firstOpen):null;
    const lead=pending.find(n=>n.id===stage.recommended?.id)||pending[0]||null;
    const other=nodes.filter(n=>n!==lead);
    const subject=stage.progress.model.subject;
    const hasLab=subject==='math'&&place.index===2&&typeof window.openFractionLab==='function';
    const possiblePeek=!stage.progress.complete?nodes.find(n=>n.locked&&
      n.original?.type===(subject==='geography'?'geo-skill':'skill')&&
      stage.progress.model.areas.findIndex(a=>a.id===n.areaId)===stage.firstOpen+1):null;
    const canPeek=Boolean(possiblePeek&&typeof (subject==='geography'?
      startGeoWorldPreview:startJourneyWorldPreview)==='function');
    function row(n){
      const textLabel=n.locked?'Kommer senere':n.complete?'Spill igjen':
        n.type==='challenge'?'Frivillig utfordring':
        n.type==='review'?'Frivillig repetisjon':'Start oppdraget';
      const marker=n.locked?'🔒':n.complete?'★':'›';
      return '<button type="button" class="mission-activity'+(n.complete?' is-replay':'')+
        '" data-locked-node="'+escapeId(n.id)+'"'+(n.locked?' disabled':'')+'>'+
        '<span><strong>'+esc(n.title)+'</strong><small>'+esc(textLabel)+'</small></span>'+
        '<b aria-hidden="true">'+marker+'</b></button>';
    }
    const nextPrimary=next?
      '<button type="button" class="mission-primary mission-continue" data-locked-continue="'+next.index+
        '" aria-label="'+esc('Fortsett reisen til '+next.title)+'">'+
        '<span><strong>Fortsett reisen</strong><small>Videre til '+esc(next.title)+'</small></span>'+
        '<b aria-hidden="true">➜</b></button>':'';
    const leadPrimary=lead?
      '<button type="button" class="mission-primary" data-locked-node="'+escapeId(lead.id)+'">'+
        '<span><strong>'+esc(lead.title)+'</strong><small>Start oppdraget</small></span>'+
        '<b aria-hidden="true">➜</b></button>':'';
    const labPrimary=(hasLab&&!lead&&!next)?
      '<button type="button" class="mission-primary mission-lab" data-locked-existing="fraction-lab">'+
        '<span><strong>Utforsk Brøklaben</strong><small>Fri lek uten krav til progresjon</small></span>'+
        '<b aria-hidden="true">➜</b></button>':'';
    const chapterOne=Number(stage.progress.model.grade)===2;
    const fallbackPrimary=(!lead&&!next&&!hasLab)?
      '<button type="button" class="mission-primary mission-map" data-locked-map>'+
        '<span><strong>Tilbake til kartet</strong><small>'+
        esc(stage.progress.complete?(chapterOne?'Du kan utforske første eventyr igjen.':'Du kan utforske hele reisen igjen.'):
          'Se hvor eventyret fortsetter.')+
        '</small></span><b aria-hidden="true">➜</b></button>':'';
    const intro=stage.progress.complete&&finished?(chapterOne?'Første eventyr er fullført!':'Hele reisen er fullført!'):
      finished?'Du klarte oppdraget!':
      lead?(window.LARIA_SKOGSTROLL?.enabled?.()?'Skogstrollet er klart. Er du?':'Reven er klar. Er du?'):
      place.total===0?'Et nytt sted å utforske.':
      'Dette stedet venter på deg.';
    const support=stage.progress.complete&&finished?(chapterOne?'Alle hovedoppdrag i første eventyr er gjennomført. Du kan alltid spille igjen.':'Alle hovedoppdrag er gjennomført. Du kan alltid spille igjen.'):
      finished?(next?'Neste stopp venter på deg. Du kan også spille dette om igjen.':
        'Du kan utforske kartet eller spille favorittene dine igjen.'):
      lead?'Velg det du har lyst til å gjøre.':
      'Se deg rundt, eller prøv et frivillig oppdrag.';
    const reward=finished?
      '<div class="mission-complete" role="status"><span class="mission-earned-star" aria-hidden="true">★</span>'+
      '<span><strong>'+esc(intro)+'</strong><small>'+esc(support)+'</small></span></div>':'';
    const headline=finished?'Velkommen videre!':(place.role?.adventurePrompt||intro);
    const replay=other.filter(n=>!n.locked&&CORE_MISSIONS.has(n.type)&&n.complete);
    const extras=other.filter(n=>!n.locked&&!CORE_MISSIONS.has(n.type));
    const otherOpen=other.filter(n=>!n.locked&&CORE_MISSIONS.has(n.type)&&!n.complete);
    const locked=other.filter(n=>n.locked);
    const activityRows=[
      ...otherOpen.map(row),
      ...(hasLab&&!labPrimary?['<button type="button" class="mission-activity mission-lab" data-locked-existing="fraction-lab"><span><strong>Utforsk Brøklaben</strong><small>Fri lek uten krav til progresjon</small></span><b aria-hidden="true">›</b></button>']:[]),
      ...extras.map(row),
      ...replay.map(row),
      ...locked.map(row),
      ...(canPeek?['<button type="button" class="mission-activity mission-preview" data-locked-preview><span><strong>Ta en sniktitt</strong><small>Prøv en smakebit uten å endre reisen.</small></span><b aria-hidden="true">›</b></button>']:[])
    ];
    const secondary=activityRows.length?
      '<div class="mission-other"><h3>Spill og utforsk</h3>'+
      activityRows.join('')+'</div>':
      '<p class="locked-journey-no-missions">Du kan alltid besøke dette stedet igjen.</p>';
    const markup=
      '<header class="mission-sheet-head"><div class="mission-head-copy">'+
      '<small class="mission-place-label">STED '+(place.index+1)+' AV 5</small>'+
      '<h2>'+esc(place.title)+'</h2>'+
      '<p>'+esc(headline)+'</p></div>'+
      '<div class="mission-fox-stage" aria-hidden="true">'+
      '<i class="mission-fox-spark" aria-hidden="true">✦</i></div></header>'+
      reward+
      '<div class="locked-journey-missions">'+
      '<div class="mission-feature">'+(nextPrimary||leadPrimary||labPrimary||fallbackPrimary)+'</div>'+
      secondary+'</div>';
    return {markup,previewNode:possiblePeek,complete:finished,next};
  }
  function progressDots(progress){
    const states=contract.milestoneStates(progress.done,progress.total);
    return '<div class="locked-journey-milestones" role="progressbar" aria-label="Hovedoppdrag fullført" aria-valuemin="0" aria-valuemax="'+progress.total+'" aria-valuenow="'+progress.done+'">'+
      states.map((state,i)=>'<span class="locked-journey-milestone is-'+state+'" aria-hidden="true" style="--dot-x:'+(22.8+i*12.85)+'%"></span>').join('')+
      '</div>';
  }
  function gradeChoices(grade){
    return '<p>Velg klassetrinn</p><div class="locked-journey-grade-grid">'+
      Array.from({length:10},(_,i)=>i+1).map(n=>'<button type="button" data-locked-grade="'+n+'"'+(n===grade?' aria-current="true"':'')+'>'+n+'. klasse</button>').join('')+'</div>';
  }
  function renderLocked(subject,geo){
    const host=hostFor(geo),screen=screenFor(geo);
    if(!host||!screen)return false;
    const s=stage(subject,geo);
    if(!s)return false;
    const def=contract.get(subject),model=s.progress.model;
    const places=s.contract.places;
    host.className='journey-map locked-journey-map';
    delete host.dataset.journeyWaiting;
    delete host.dataset.journeyFailed;
    host.dataset.journeyRelease='journey-rc1';
    host.dataset.journeySubject=subject;
    host.dataset.journeyCoreStops=String(s.progress.total);
    host.dataset.lockedIllustration='2026-10-10';
    host.innerHTML='<section class="locked-journey-board" aria-label="'+esc(def.subjectLabel+' – '+def.title+', interaktivt eventyrkart')+'">'+
      '<img class="locked-journey-image" src="./'+esc(def.asset)+'" alt="" draggable="false" width="941" height="1672">'+
      foxFreeOverlayMarkup(subject)+
      liveProfileMarkup(s.progress,subject)+
      (places.length?(()=>{
        // A completed journey still has its personal fox at the last reached stop.
        const here=places.find(p=>p.recommended)||[...places].reverse().find(p=>p.done>0)||places[0];
        // Standing spot is a real painted step, not a floating avatar badge.
        // The reusable character is positioned by its feet. The original
        // painted generic fox still requires artwork retouch before publishing.
        const point=contract.foxFootAnchor(subject,here.index);
        const troll=!!window.LARIA_SKOGSTROLL?.enabled?.();
        return '<div class="locked-journey-traveler'+(troll?' laria-troll-host':'')+'"'+(troll?'':' data-avatar="'+selectedAvatar()+'"')+
          (troll?' data-laria-troll="'+window.LARIA_SKOGSTROLL.keyFor(subject)+'"':'')+
          ' data-laria-fox-stop="'+here.index+'" style="--fox-x:'+point.x+'%;--fox-y:'+point.y+'%" aria-label="'+
          (troll?window.LARIA_SKOGSTROLL.labelForSubject(subject)+' er med på reisen':'Din rev er med på reisen')+
          '"><img src="'+esc(selectedAvatarSource(subject))+'" alt=""><span class="locked-fox-label">'+
          (troll?'Skogstroll':'Min rev')+'</span></div>';
      })():'')+
      '<div class="locked-journey-hits">'+places.map(p=>placeButton(subject,p,model,s.firstOpen)).join('')+'</div>'+
      '<button type="button" class="locked-journey-back" aria-label="Tilbake til '+(window.LARIA_BASECAMP_RETURN_VIEW?.()==='travel'?'Reisen':window.LARIA_BASECAMP_RETURN_VIEW?.()==='explore'?'Utforsk':'Hjem')+'"></button>'+
      '<button type="button" class="locked-journey-options" aria-label="Velg klassetrinn"></button>'+
      progressDots(s.progress)+
      '<span class="locked-journey-progress-text">'+s.progress.done+' / '+s.progress.total+' oppdrag</span>'+ 
      artworkGuard(subject,false,true)+
      '</section><button type="button" class="locked-journey-floating-back" aria-label="Tilbake til reisen eller Hjem" hidden>'+ 
      '<span aria-hidden="true">←</span><span>Tilbake</span></button>'+ 
      '<div class="locked-journey-overlay" hidden><div class="locked-journey-dim"></div><section class="locked-journey-sheet" role="dialog" aria-modal="true" aria-label="Oppdragssted"></section></div>';
    screen.classList.add('locked-journey-active');
    setJourneyContext(subject);
    resetJourneyScroll();
    if(geo){
      screen.classList.add('premium-geo-active');
      const shell=document.getElementById('geo-journey-shell'),globe=document.getElementById('open-world');
      if(shell&&globe&&shell.nextElementSibling!==globe)screen.insertBefore(shell,globe);
    }else{
      screen.classList.add('premium-journey-active');
      screen.classList.remove('bokskogen-v10-active','bokskogen-v2-active','bokskogen-v3-active');
    }
    // The retired renderer used to populate grade controls as a side effect.
    // Since the approved painting now loads without that renderer, preserve
    // the SAME grade selector, chapter note and displayed grade explicitly.
    // This touches presentation only: profile grade and child progress stay put.
    const gradeLabel=document.getElementById(geo?'geo-journey-grade':'journey-grade-chip');
    if(gradeLabel)gradeLabel.textContent=GRADE_CONFIG[s.grade].label;
    renderJourneyGradeStrip(subject,geo?'geo-journey-grade-strip':'journey-grade-strip',
      geo?'geo-journey-grade-note':'journey-grade-note',s.grade);
    const finish=document.getElementById(geo?'geo-journey-finish':'journey-finish');
    if(finish)finish.hidden=true;
    revealDecodedArtwork(host,subject,geo);
    const overlay=host.querySelector('.locked-journey-overlay');
    const dialog=overlay.querySelector('.locked-journey-sheet');
    const lastFocus={element:null};
    const board=host.querySelector('.locked-journey-board');
    const traveler=board?.querySelector('.locked-journey-traveler');
    const hitLayer=board?.querySelector('.locked-journey-hits');
    // Move the EXISTING selected fox into the sheet, never clone the avatar.
    // Return the same node to its painted standing spot before clearing dialog.
    function restoreTraveler(){
      if(!traveler||!board||traveler.parentElement===board)return;
      if(hitLayer)board.insertBefore(traveler,hitLayer);
      else board.appendChild(traveler);
      window.LARIA_FOX_PRESENCE?.react?.('idle',traveler);
      window.LARIA_FOX_WARDROBE?.refresh?.();
    }
    function close(){
      restoreTraveler();
      overlay.hidden=true;
      dialog.replaceChildren();
      dialog.classList.remove('is-mission');
      if(lastFocus.element?.isConnected)lastFocus.element.focus({preventScroll:true});
    }
    function open(markup,origin,mode){
      restoreTraveler();
      lastFocus.element=origin||document.activeElement;
      dialog.classList.toggle('is-mission',mode==='mission');
      dialog.innerHTML='<button class="locked-sheet-close" type="button" aria-label="Lukk">×</button>'+markup;
      overlay.hidden=false;
      if(mode==='mission'&&traveler){
        const stage=dialog.querySelector('.mission-fox-stage');
        if(stage){
          stage.appendChild(traveler);
          window.LARIA_FOX_WARDROBE?.refresh?.();
          requestAnimationFrame(()=>{
            if(overlay.hidden||traveler.parentElement!==stage)return;
            // Preserve the walking reaction started by the tapped painted
            // landmark. Only a completed mission replaces it with celebration.
            if(dialog.querySelector('.mission-complete'))
              window.LARIA_FOX_PRESENCE?.react?.('celebrate',traveler);
          });
        }
      }
      dialog.querySelector('.locked-sheet-close').onclick=close;
      dialog.querySelector('.locked-sheet-close').focus({preventScroll:true});
    }
    overlay.querySelector('.locked-journey-dim').onclick=close;
    host.onkeydown=e=>{
      if(overlay.hidden)return;
      if(e.key==='Escape'){e.preventDefault();close();return}
      if(e.key!=='Tab')return;
      const buttons=[...dialog.querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length>0);
      if(!buttons.length)return;
      const first=buttons[0],last=buttons.at(-1),focused=document.activeElement;
      if(e.shiftKey&&(focused===first||!dialog.contains(focused))){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&(focused===last||!dialog.contains(focused))){e.preventDefault();first.focus()}
    };
    const nativeBack=host.querySelector('.locked-journey-back');
    const floatingBack=host.querySelector('.locked-journey-floating-back');
    nativeBack.onclick=()=>backHome(geo);
    floatingBack.onclick=()=>backHome(geo);
    // On tall illustrated journeys the painted top-left back control can be
    // hundreds of pixels above an iPad landscape viewport. Keep the original
    // hit target on the map, but show a separate touch-safe back action when
    // it is mostly out of view. No change to map art, node IDs or scroll.
    floatingBackObserver?.disconnect();
    floatingBackObserver=null;
    if(typeof IntersectionObserver==='function'){
      floatingBackObserver=new IntersectionObserver(entries=>{
        const entry=entries[0];
        if(!floatingBack.isConnected||!entry)return;
        floatingBack.hidden=!screen.classList.contains('active')||entry.intersectionRatio>=.5;
      },{threshold:[0,.5,1]});
      floatingBackObserver.observe(nativeBack);
    }else{
      // Unsupported observers must not strand a child in a long journey.
      floatingBack.hidden=false;
    }
    host.querySelector('.locked-journey-options').onclick=e=>{
      open('<h2>Reiseinnstillinger</h2>'+gradeChoices(s.grade),e.currentTarget);
      dialog.querySelectorAll('[data-locked-grade]').forEach(btn=>btn.onclick=()=>{
        close();setJourneyViewGrade(subject,Number(btn.dataset.lockedGrade));
      });
    };
    function launch(nodeId){
      close();
      if(geo)startGeoJourneyNode(nodeId,s.grade);
      else startJourneyNode(subject,nodeId,s.grade);
    }
    host.querySelectorAll('[data-locked-place]').forEach(hit=>hit.onclick=()=>{
      const place=places[Number(hit.dataset.lockedPlace)];
      const safeNodes=place.nodes.map(n=>{
        const original=model.nodes.find(x=>x.id===n.id);
        const areaIndex=model.areas.findIndex(a=>a.id===original?.areaId);
        const locked=areaIndex>s.firstOpen&&!completed(original,geo);
        return {...n,locked,original};
      });
      const menu=journeyMissionSheet(place,safeNodes,s);
      open(menu.markup,hit,'mission');
      dialog.querySelectorAll('[data-locked-node]').forEach(btn=>btn.onclick=()=>{
        const node=safeNodes.find(n=>n.id===btn.dataset.lockedNode);
        if(node&&!node.locked)launch(node.id);
      });
      dialog.querySelector('[data-locked-map]')?.addEventListener('click',close);
      dialog.querySelector('[data-locked-continue]')?.addEventListener('click',()=>{
        const next=menu.next;
        if(!next||placeLocked(next,model,s.firstOpen))return;
        close();
        const nextHit=host.querySelector('[data-locked-place="'+next.index+'"]');
        window.LARIA_FOX_PRESENCE?.travelTo?.(next.index);
        nextHit?.click();
      });
      dialog.querySelector('[data-locked-existing="fraction-lab"]')?.addEventListener('click',()=>{
        close();
        // Brøklaben is free exploration: no synthetic skill node or score.
        window.openFractionLab({returnToJourney:'math'});
      });
      dialog.querySelector('[data-locked-preview]')?.addEventListener('click',()=>{
        if(!menu.previewNode)return;
        close();
        // Preview never writes completion/mastery or unlocks the next area.
        if(geo)startGeoWorldPreview(menu.previewNode.areaId,s.grade);
        else startJourneyWorldPreview(subject,menu.previewNode.areaId,s.grade);
      });
    });
    requestAnimationFrame(()=>requestAnimationFrame(()=>showCurrentIllustratedStop(host,geo)));
    setTimeout(()=>showCurrentIllustratedStop(host,geo),180);
    return true;
  }
  function usesApprovedArt(subject){
    if(!ORIGINAL_SOURCE_IMAGES_VERIFIED&&window.LARIA_LOCKED_JOURNEY_QA_ART!==true)return false;
    return !!contract.get(subject)&&journeyViewGrade(subject)<=2;
  }
  renderSubjectJourney=function(){
    const screen=screenFor(false),subject=activeSubject;
    if(usesApprovedArt(subject)){
      if(ensureOriginalArt(subject)){
        if(renderLocked(subject,false))return;
      }else{
        // Pending/failed original art must NEVER reveal the older green map.
        renderWaiting(subject,false,['missing','invalid'].includes(assets.get(subject)?.status));
        return;
      }
    }
    // Other grades retain the established journey renderer unchanged.
    screen?.classList.remove('locked-journey-active','premium-journey-active');
    return previousSubject.apply(this,arguments);
  };
  renderGeoJourney=function(){
    const screen=screenFor(true),subject='geography';
    if(usesApprovedArt(subject)){
      if(ensureOriginalArt(subject)){
        if(renderLocked(subject,true))return;
      }else{
        renderWaiting(subject,true,['missing','invalid'].includes(assets.get(subject)?.status));
        return;
      }
    }
    screen?.classList.remove('locked-journey-active','premium-geo-active');
    return previousGeo.apply(this,arguments);
  };
  window.LARIA_LOCKED_JOURNEY_RUNTIME={
    assetStatus:subject=>assets.get(subject)?.status||'not-requested',
    active:()=>document.querySelector('.locked-journey-map')?.dataset.journeySubject||null
  };
})();
