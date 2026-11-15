/* Læria Premium: user-approved reference layout for iPad review.
 * The original paintings and progress are immutable. Clean scenes only.
 * Preview requires ?lariaReferenceLayout=1 until visual approval.
 */
(function(root){
 'use strict';
 const enabled=new URLSearchParams(root.location.search).get('lariaReferenceLayout')==='1';
 const names={home:'Hjem',norwegian:'Norsk',math:'Matte',english:'Engelsk',geography:'Geografi'};
 const places={norwegian:'Eggenipa',math:'Tallvika',geography:'Nordlysleiren'};
 const paths={
  home:'<path d="m3 12 9-8 9 8M6 10v11h12V10M10 21v-6h4v6"/>',
  norwegian:'<path d="M12 6c-3-2-7-2-10-1v14c4-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-4-1-7-1-10 1M12 6v14"/>',
  math:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 8h10M8 13h4M10 11v4M15 13h3M15 17h3"/>',
  english:'<path d="M4 5h16v12h-8l-5 4v-4H4z"/><path d="m8 13 2-5 2 5m-3-2h2M15 8h2v5h-2"/>',
  geography:'<path d="m2 20 8-12 4 5 3-4 5 11zM7 13l3-5 3 4"/>',
  words:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 9h6M8 12h4"/>',
  find:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M8 10h4M10 8v4"/>',
  reading:'<path d="M12 6C9 4 5 4 2 5v14c4-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-4-1-7-1-10 1M12 6v14"/>',
  multiply:'<path d="M5 5 19 19M19 5 5 19"/><circle cx="12" cy="12" r="10"/>',
  fraction:'<circle cx="12" cy="12" r="10"/><path d="M12 2v10h10M5 19l7-7"/>',
  table:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  journey:'<path d="m4 20 8-16 8 16-8-4-8 4z"/><circle cx="12" cy="12" r="2"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c6 5 6 15 0 20M12 2c-6 5-6 15 0 20"/>',
  country:'<path d="M5 22V2m0 2c6-3 8 3 15 0v12c-7 3-9-3-15 0"/>'
 };
 const valid=Object.keys(names);
 const greetings=Object.freeze({norwegian:'Vil du finne ord eller lese et eventyr?',geography:'Skal vi oppdage verden sammen?'});
 const greeted=new Set();
 // In-memory only: a finished exercise should return to the same left rail
 // even when the subject scene is re-rendered. Never write child progress.
 const preferredRail=new Map();
 // Remove keyboard listeners on responsive unmount to avoid duplicate Escape actions.
 const escapeHandlers=new WeakMap();
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">'+paths[id]+'</svg>'}
 // Only ONE left sign rail may be visible. The plain heading replaces the
 // rejected wooden place plaque and toggles the SAME left-hand rails.
 function setMode(scene,mode,focus=false){
  if(!scene?.isConnected)return;
  const activities=scene.querySelector('nav.laria-scene-navigation[data-laria-component="sign-rail"]');
  const subjects=scene.querySelector('nav.laria-reference-subject-nav');
  const heading=scene.querySelector('button.laria-reference-heading');
  if(!activities||!subjects||!heading)return;
  const activityMode=mode==='activities';
  scene.dataset.lariaReferenceMode=activityMode?'activities':'subjects';
  if(scene.dataset.lariaReferenceSubject)
   preferredRail.set(scene.dataset.lariaReferenceSubject,scene.dataset.lariaReferenceMode);
  activities.inert=!activityMode;
  subjects.inert=activityMode;
  activities.setAttribute('aria-hidden',String(!activityMode));
  subjects.setAttribute('aria-hidden',String(activityMode));
  heading.setAttribute('aria-expanded',String(!activityMode));
  heading.setAttribute('aria-label',(activityMode?'Bytt fag fra ':'Vis aktiviteter i ')+scene.dataset.lariaReferenceSubject);
  heading.setAttribute('title',activityMode?'Velg et annet fag':'Vis aktivitetene');
  if(focus){
   const next=activityMode?
    activities.querySelector('.laria-wayfinder:not([disabled])'):
    subjects.querySelector('.is-current');
   next?.focus({preventScroll:true});
  }
 }
 function navigate(target,current,scene){
  if(target===current){setMode(scene,'activities',true);return;}
  // A full subject switch is a NEW visit, unlike a return from an exercise.
  // Clear only in-memory presentation mode; never child learning progress.
  preferredRail.delete(names[current]);
  preferredRail.delete(names[target]);
  if(target==='home'){
   if(root.LARIA_RETURN_TO_BASECAMP?.()===true)return;
   root.document.querySelector('#bottom-nav [data-tab="home"]')?.click();
   return;
  }
  // Reuse the actual Home controls: they already handle Geography's distinct
  // screen, route origin and saved child state without a new navigation engine.
  const home=root.document.querySelector('#home-screen .bc14-subject[data-camp="subject-'+target+'"]');
  if(home){home.click();return}
  if(target==='geography')root.showScreen?.('geography');
  else root.openSubject?.(target);
 }
 function mount(scene,subject){
  if(!enabled||!places[subject]||!scene||scene.dataset.lariaReferenceLayout)return false;
  // The same DOM components now support iPhone portrait, with a dedicated
  // compact arrangement that preserves one left rail and the original art.
  const ipad=root.matchMedia('(min-width:768px) and (min-height:650px)').matches;
  const iphonePortrait=root.matchMedia('(max-width:767px) and (min-width:320px) and (min-height:600px) and (orientation:portrait)').matches;
  const iphoneLandscape=root.matchMedia('(min-width:740px) and (max-width:1050px) and (min-height:320px) and (max-height:600px) and (orientation:landscape)').matches;
  if(!ipad&&!iphonePortrait&&!iphoneLandscape)return false;
  const rail=scene.querySelector('nav.laria-scene-navigation[data-laria-component="sign-rail"]');
  if(!rail||rail.querySelectorAll('.laria-wayfinder').length!==3)return false;
  // Preserve the real round Home action and its original click handler.
  // It is not a second wooden sign rail.
  const nav=root.document.createElement('nav');
  nav.className='laria-reference-subject-nav';
  nav.dataset.lariaComponent='subject-switcher';
  nav.setAttribute('aria-label','Velg fag eller gå hjem');
  nav.innerHTML=valid.map(id=>
   '<button type="button" class="laria-reference-subject-sign'+(id===subject?' is-current':'')+
   '" data-laria-ref-subject="'+id+'" aria-label="'+safe(id==='home'?'Gå til Hjem':'Åpne '+names[id])+'"'+
   (id===subject?' aria-current="page"':'')+'>'+icon(id)+'<span>'+safe(names[id])+'</span></button>'
  ).join('');
  nav.addEventListener('click',event=>{
   const button=event.target.closest('[data-laria-ref-subject]');
   if(button&&nav.contains(button))navigate(button.dataset.lariaRefSubject,subject,scene);
  });
  // Text-only heading below the unchanged Læria logo, not a new illustration.
  // The original selected troll remains an independent live TrollActor.
  const heading=root.document.createElement('button');
  heading.type='button';
  heading.className='laria-reference-heading';
  heading.dataset.lariaRefOpenActivities='1';
  heading.setAttribute('aria-controls','laria-reference-activities-'+subject);
  heading.innerHTML='<strong>'+safe(names[subject])+'</strong><small>'+safe(places[subject])+'</small>';
  heading.addEventListener('click',()=>setMode(scene,
    scene.dataset.lariaReferenceMode==='subjects'?'activities':'subjects',true));
  // Reuse, never clone, the three REAL activity buttons. They become the
  // left-hand signs only when the child explicitly opens this subject.
  rail.id='laria-reference-activities-'+subject;
  rail.setAttribute('aria-label','Velg eventyr i '+names[subject]);
  // Only three actual activity signs appear in the approved scene.
  // Tapping the heading switches to five-subject navigation.
  // Keep the original live buttons and handlers. Add presentation-only
  // icons from the SAME pictogram family used by the five Home-style signs.
  const activitiesByWorld={
   norwegian:{words:'words',find:'find',reading:'reading'},
   math:{multiply:'multiply',fraction:'fraction',table:'table'},
   geography:{journey:'journey',globe:'globe',country:'country'}
  };
  for(const button of rail.querySelectorAll('.laria-wayfinder')){
   const action=button.dataset.eg||button.dataset.tv||button.dataset.gv;
   const iconId=activitiesByWorld[subject]?.[action];
   const surface=button.matches('.eg-scene-hit')?button.querySelector(':scope > span'):button;
   if(!iconId||!surface||surface.querySelector('.laria-reference-activity-icon'))continue;
   const mark=root.document.createElement('span');
   mark.className='laria-reference-activity-icon';
   mark.setAttribute('aria-hidden','true');
   mark.innerHTML=icon(iconId);
   surface.prepend(mark);
  }
  // Tallvika's existing Next adventure button is not allowed to float on the
  // right as a second navigation sign. Move the real node, retaining its
  // original data-tv action and delegated child click handler.
  if(subject==='math'){
   const next=scene.querySelector('button.tv-next-sign[data-tv="next"]');
   if(next){
    next.classList.add('laria-reference-next');
    rail.appendChild(next);
   }
  }
  // Existing "Mine troll" stays the actual profile control; only its
  // presentation changes. Adult settings use the same 1.5-second deliberate
  // press as the pre-existing Home adult gate, never an unrestricted click.
  const adult=root.document.createElement('button');
  adult.type='button';
  adult.className='laria-reference-settings';
  adult.dataset.lariaRefSettings='1';
  adult.setAttribute('aria-label','Hold inne for foreldreinnstillinger');
  adult.setAttribute('title','Hold inne for foreldreinnstillinger');
  adult.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+
   '<path d="M10 2.5h4l.8 2.4 2 1.2 2.5-.5 2 3.5-1.8 1.9v2l1.8 1.9-2 3.5-2.5-.5-2 1.2-.8 2.4h-4l-.8-2.4-2-1.2-2.5.5-2-3.5L4.5 13v-2L2.7 9.1l2-3.5 2.5.5 2-1.2z"/><circle cx="12" cy="12" r="3"/></svg>';
  let timer=null;
  function cancelHold(){
   if(timer!==null){root.clearTimeout(timer);timer=null;}
   adult.removeAttribute('data-laria-holding');
  }
  function beginHold(){
   cancelHold();
   if(!scene.isConnected||!scene.closest('.screen.active'))return;
   adult.dataset.lariaHolding='true';
   timer=root.setTimeout(()=>{
    timer=null;adult.removeAttribute('data-laria-holding');
    if(scene.isConnected&&scene.closest('.screen.active'))
      root.LARIA_OPEN_ADULT?.();
   },1500);
  }
  adult.addEventListener('pointerdown',event=>{
   if(event.pointerType==='mouse'&&event.button!==0)return;
   beginHold();
  });
  for(const name of ['pointerup','pointercancel','pointerleave','blur'])
   adult.addEventListener(name,cancelHold);
  adult.addEventListener('keydown',event=>{
   if((event.key==='Enter'||event.key===' ')&&!event.repeat){
    event.preventDefault();beginHold();
   }
  });
  adult.addEventListener('keyup',event=>{
   if(event.key==='Enter'||event.key===' '){
    event.preventDefault();cancelHold();
   }
  });
  scene.appendChild(nav);scene.appendChild(heading);scene.appendChild(adult);
  scene.classList.add('laria-reference-layout-v1');
  scene.dataset.lariaReferenceLayout='v1';
  scene.dataset.lariaReferenceArt='original-preserved';
  scene.dataset.lariaReferenceSubject=names[subject];
  setMode(scene,preferredRail.get(names[subject])||'activities');
  // External iPad keyboards: Escape returns from activities to the same
  // subject sign rail. Restrict it to menu controls, not the live troll,
  // settings or an activity that owns its own keyboard behavior.
  const handleEscape=event=>{
   if(event.key!=='Escape'||event.defaultPrevented||
      scene.dataset.lariaReferenceMode!=='activities'||
      !scene.closest('.screen.active'))return;
   if(!event.target.closest?.('nav.laria-scene-navigation, button.laria-reference-heading'))return;
   event.preventDefault();
   event.stopPropagation();
   setMode(scene,'subjects',true);
  };
  escapeHandlers.set(scene,handleEscape);
  scene.addEventListener('keydown',handleEscape);
  // A single short contextual greeting makes the approved character feel
  // present. The existing scene-owned idle/wave callback runs first; defer
  // this prompt two frames so it is not immediately cancelled. Mathematics
  // already has a native speech bubble and must not get a second one.
  const greeting=greetings[subject];
  if(greeting&&!greeted.has(subject)){
   greeted.add(subject);
   root.requestAnimationFrame(()=>root.requestAnimationFrame(()=>{
    const actor=scene.querySelector('[data-laria-component="troll"]');
    if(scene.isConnected&&scene.closest('.screen.active')&&actor)
     root.LARIA_TROLL_ACTOR?.mood?.(actor,'wave',{say:greeting,duration:2800});
   }));
  }
  return true;
 }
 // Common iPhone landscape sizes now reuse the real live single-rail
 // controls. Tiny unsupported viewports safely restore the original scene,
 // never displaying unstyled reference buttons.
 function eligible(){
  return root.matchMedia('(min-width:768px) and (min-height:650px)').matches||
   root.matchMedia('(max-width:767px) and (min-width:320px) and (min-height:600px) and (orientation:portrait)').matches||
   root.matchMedia('(min-width:740px) and (max-width:1050px) and (min-height:320px) and (max-height:600px) and (orientation:landscape)').matches;
 }
 function unmount(scene){
  if(!scene?.classList.contains('laria-reference-layout-v1'))return;
  const handleEscape=escapeHandlers.get(scene);
  if(handleEscape){
   scene.removeEventListener('keydown',handleEscape);
   escapeHandlers.delete(scene);
  }
  const rail=scene.querySelector('nav.laria-scene-navigation[data-laria-component="sign-rail"]');
  if(rail){
   rail.inert=false;
   rail.removeAttribute('aria-hidden');
   // Unmount restores each original learning button without decoration.
   rail.querySelectorAll('.laria-reference-activity-icon').forEach(el=>el.remove());
   // The original Tallvika button belongs to the original scene outside the
   // adapted left rail. Keep its delegated data-tv route and enabled status.
   const next=rail.querySelector('.tv-next-sign.laria-reference-next');
   if(next){next.classList.remove('laria-reference-next');scene.appendChild(next);}
  }
  scene.querySelector(':scope > nav.laria-reference-subject-nav')?.remove();
  scene.querySelector(':scope > button.laria-reference-heading')?.remove();
  scene.querySelector(':scope > button.laria-reference-settings')?.remove();
  preferredRail.delete(scene.dataset.lariaReferenceSubject);
  scene.classList.remove('laria-reference-layout-v1');
  delete scene.dataset.lariaReferenceLayout;
  delete scene.dataset.lariaReferenceArt;
  delete scene.dataset.lariaReferenceSubject;
  delete scene.dataset.lariaReferenceMode;
 }
 function refresh(){
  if(!enabled)return;
  for(const [selector,subject] of [
   ['#eggenipa-world .eg-hero.laria-scene-shell','norwegian'],
   ['#tallvika-world .tv-scene.laria-scene-shell','math'],
   ['#laria-geography-world .gv-scene.laria-scene-shell','geography']]){
   const scene=root.document.querySelector(selector);
   if(!scene)continue;
   if(eligible())mount(scene,subject);
   else unmount(scene);
  }
 }
 if(enabled){
  let queued=false;
  const scheduleRefresh=()=>{
   if(queued)return;
   queued=true;
   root.requestAnimationFrame(()=>{queued=false;refresh();});
  };
  root.addEventListener('resize',scheduleRefresh,{passive:true});
  root.matchMedia('(orientation:portrait)').addEventListener?.('change',scheduleRefresh);
 }

 root.LARIA_REFERENCE_LAYOUT=Object.freeze({enabled,mount,artBlocked:['home','english']});
})(window);
