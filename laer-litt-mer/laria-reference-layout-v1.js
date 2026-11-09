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
  geography:'<path d="m2 20 8-12 4 5 3-4 5 11zM7 13l3-5 3 4"/>'
 };
 const valid=Object.keys(names);
 const greetings=Object.freeze({norwegian:'Vil du finne ord eller lese et eventyr?',geography:'Skal vi oppdage verden sammen?'});
 const greeted=new Set();
 // In-memory only: a finished exercise should return to the same left rail
 // even when the subject scene is re-rendered. Never write child progress.
 const preferredRail=new Map();
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">'+paths[id]+'</svg>'}
 // Only ONE navigation rail may be visible. The large right plaque is a
 // location label and the doorway to the SAME left-hand activity rail.
 function setMode(scene,mode,focus=false){
  if(!scene?.isConnected)return;
  const activities=scene.querySelector('nav.laria-scene-navigation[data-laria-component="sign-rail"]');
  const subjects=scene.querySelector('nav.laria-reference-subject-nav');
  const plaque=scene.querySelector('button.laria-reference-place');
  if(!activities||!subjects||!plaque)return;
  const activityMode=mode==='activities';
  scene.dataset.lariaReferenceMode=activityMode?'activities':'subjects';
  if(scene.dataset.lariaReferenceSubject)
   preferredRail.set(scene.dataset.lariaReferenceSubject,scene.dataset.lariaReferenceMode);
  activities.inert=!activityMode;
  subjects.inert=activityMode;
  activities.setAttribute('aria-hidden',String(!activityMode));
  subjects.setAttribute('aria-hidden',String(activityMode));
  plaque.setAttribute('aria-expanded',String(activityMode));
  plaque.setAttribute('aria-label',(activityMode?'Vis fagmenyen fra ':'Vis aktiviteter i ')+scene.dataset.lariaReferenceSubject);
  const prompt=plaque.querySelector('.laria-reference-place-action');
  if(prompt)prompt.textContent=activityMode?'Tilbake til fagene ‹':'Utforsk eventyrene ›';
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
  const iphone=root.matchMedia('(max-width:767px) and (min-width:320px) and (min-height:600px) and (orientation:portrait)').matches;
  if(!ipad&&!iphone)return false;
  const rail=scene.querySelector('nav.laria-scene-navigation[data-laria-component="sign-rail"]');
  if(!rail||rail.querySelectorAll('.laria-wayfinder').length!==3)return false;
  const home=scene.querySelector('[data-laria-component="home"]');
  if(home){
   home.dataset.lariaReferenceHidden='true';
   home.setAttribute('aria-hidden','true');
   home.setAttribute('tabindex','-1');
  }
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
  const plaque=root.document.createElement('button');
  plaque.type='button';
  plaque.className='laria-reference-place';
  plaque.dataset.lariaRefOpenActivities='1';
  plaque.setAttribute('aria-controls','laria-reference-activities-'+subject);
  plaque.innerHTML='<span class="laria-reference-place-kicker" aria-hidden="true">'+icon(subject)+'</span>'+
    '<strong>'+safe(names[subject])+'</strong><small>'+safe(places[subject])+'</small>'+
    '<em class="laria-reference-place-action">Utforsk ›</em>';
  plaque.addEventListener('click',()=>setMode(scene,
    scene.dataset.lariaReferenceMode==='subjects'?'activities':'subjects',true));
  // Reuse, never clone, the three REAL activity buttons. They become the
  // left-hand signs only when the child explicitly opens this subject.
  rail.id='laria-reference-activities-'+subject;
  rail.setAttribute('aria-label','Velg eventyr i '+names[subject]);
  const back=root.document.createElement('button');
  back.type='button';
  back.className='laria-reference-activities-back laria-reference-subject-sign';
  back.dataset.lariaRefBackToSubjects='1';
  back.setAttribute('aria-label','Tilbake til fagene');
  back.innerHTML=icon('home')+'<span>Fagene</span>';
  back.addEventListener('click',()=>setMode(scene,'subjects',true));
  rail.insertBefore(back,rail.firstChild);
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
  scene.appendChild(nav);scene.appendChild(plaque);scene.appendChild(adult);
  scene.classList.add('laria-reference-layout-v1');
  scene.dataset.lariaReferenceLayout='v1';
  scene.dataset.lariaReferenceArt='original-preserved';
  scene.dataset.lariaReferenceSubject=names[subject];
  setMode(scene,preferredRail.get(names[subject])||'subjects');
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
 root.LARIA_REFERENCE_LAYOUT=Object.freeze({enabled,mount,artBlocked:['home','english']});
})(window);
