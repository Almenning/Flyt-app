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
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">'+paths[id]+'</svg>'}
 function navigate(target,current){
  if(target===current){
   root.document.querySelector('.screen.active .laria-reference-layout-v1 .laria-scene-navigation .laria-wayfinder:not([disabled])')?.focus({preventScroll:true});
   return;
  }
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
  if(!root.matchMedia('(min-width:768px) and (min-height:650px)').matches)return false;
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
   if(button&&nav.contains(button))navigate(button.dataset.lariaRefSubject,subject);
  });
  const plaque=root.document.createElement('div');
  plaque.className='laria-reference-place';
  plaque.setAttribute('role','heading');
  plaque.setAttribute('aria-level','2');
  plaque.setAttribute('aria-label',names[subject]+', '+places[subject]);
  plaque.innerHTML='<span>Velkommen til</span><strong>'+safe(names[subject])+'</strong><small>'+safe(places[subject])+'</small>';
  scene.appendChild(nav);scene.appendChild(plaque);
  scene.classList.add('laria-reference-layout-v1');
  scene.dataset.lariaReferenceLayout='v1';
  scene.dataset.lariaReferenceArt='original-preserved';
  return true;
 }
 root.LARIA_REFERENCE_LAYOUT=Object.freeze({enabled,mount,artBlocked:['home','english']});
})(window);
