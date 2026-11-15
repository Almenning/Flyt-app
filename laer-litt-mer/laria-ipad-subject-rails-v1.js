/* Læria premium iPad v1: ONE two-post oak rail across Norsk, Matte and
 * Geografi. Only a presentation adapter, never alters learning routes.
 * The published Kinnaklova implementation remains unchanged.
 */
(function(){
 'use strict';
 const query='(min-width:768px) and (min-height:700px) and (any-pointer:coarse)';
 const enabled=()=>window.matchMedia(query).matches;
 const subjects=Object.freeze({
  norwegian:{title:'Norsk',place:'Eggenipa',scene:'.eg-hero',button:'.eg-scene-hit',
   name:'data-eg',items:[['words','Ordjakt'],['find','Finn ordene'],['reading','Lesekroken']]},
  math:{title:'Matte',place:'Tallvika',scene:'.tv-scene',button:'.tv-hotspot',
   name:'data-tv',items:[['multiply','Gangemagi'],['fraction','Brøklab'],['table','Gangetabellen']]},
  geography:{title:'Geografi',place:'Nordlysleiren',scene:'.gv-scene',button:'.gv-sign',
   name:'data-gv',items:[['journey','Geografireisen'],['globe','Kloden'],['country','Land og flagg']]}
 });
 const icons=Object.freeze({
  words:'<path d="M4 20l6-16 6 16M6 15h8M19 5v15M16 9h6"/>',
  find:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 9h6M8 12h4"/>',
  reading:'<path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1zM12 6v14"/>',
  multiply:'<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>',
  fraction:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9h9M4 20 12 12"/>',
  table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
  journey:'<path d="m3 17 5-5 4 4 9-11M15 5h6v6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a16 16 0 0 1 0 18M12 3a16 16 0 0 0 0 18"/>',
  country:'<path d="M5 21V4m0 1c5-5 8 3 15-1v12c-7 4-10-4-15 1"/>'
 });
 const trolls=Object.freeze({
  storesoster:{name:'Storesøster',asset:'./assets/gangemagi-troll/storesoster.webp'},
  lillesoster:{name:'Lillesøster',asset:'./assets/gangemagi-troll/lillesoster.webp'},
  lillebror:{name:'Lillebror',asset:'./assets/gangemagi-troll/lillebror.webp'}
 });
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const selected=()=>{
  const id=window.LARIA_TALLVIKA_BRIDGE?.state?.()?.profile?.tallvikaTroll;
  return trolls[id]?id:'storesoster';
 };
 function chooser(){
  if(!enabled()||document.querySelector('.laria-ipad-chooser'))return;
  const dialog=document.createElement('dialog');
  dialog.className='laria-ipad-chooser';
  dialog.setAttribute('aria-label','Velg ditt skogstroll');
  dialog.innerHTML='<div class="laria-ipad-chooser-body"><h2>Velg skogstroll</h2>'+
   '<div class="laria-ipad-chooser-choices">'+Object.entries(trolls).map(([id,item])=>
     '<button type="button" data-laria-ipad-troll="'+id+'" aria-pressed="'+(selected()===id)+'">'+
     '<img alt="" src="'+item.asset+'"><strong>'+escape(item.name)+'</strong></button>').join('')+
   '</div><button type="button" class="laria-ipad-chooser-close">Lukk</button></div>';
  dialog.addEventListener('click',event=>{
   if(event.target===dialog||event.target.closest('.laria-ipad-chooser-close')){
    dialog.close();return;
   }
   const button=event.target.closest('[data-laria-ipad-troll]');
   if(!button)return;
   const id=button.dataset.lariaIpadTroll;
   if(!trolls[id])return;
   const bridge=window.LARIA_TALLVIKA_BRIDGE,state=bridge?.state?.();
   if(!state)return;
   state.profile={...state.profile,tallvikaTroll:id};
   bridge.save?.();
   document.querySelectorAll('.laria-ipad-actor').forEach(actor=>{
    actor.dataset.troll=id;
    const img=actor.querySelector('img');
    if(img)img.src=trolls[id].asset;
    actor.setAttribute('aria-label','Bytt skogstroll. Valgt: '+trolls[id].name);
   });
   document.dispatchEvent(new CustomEvent('laria:troll-changed',{detail:{id}}));
   dialog.close();
  });
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  document.body.appendChild(dialog);
  dialog.showModal();
 }
 function actor(stage){
  // Only one actor, independent of the painting, driven by saved child choice.
  stage.querySelectorAll('.laria-ipad-actor').forEach(el=>el.remove());
  stage.querySelector('.gv-troll')?.remove();
  const id=selected();
  const button=document.createElement('button');
  button.type='button';
  button.className='laria-ipad-actor laria-troll-actor';
  button.dataset.troll=id;
  button.setAttribute('aria-label','Bytt skogstroll. Valgt: '+trolls[id].name);
  button.innerHTML='<img draggable="false" alt="" src="'+trolls[id].asset+'">';
  button.addEventListener('click',chooser);
  stage.append(button);
 }
 function mount(root,subject){
  const cfg=subjects[subject];
  if(!enabled()||!root||!cfg)return false;
  const stage=root.querySelector(cfg.scene);
  if(!stage)return false;
  if(stage.dataset.lariaIpadRail==='ready')return true;
  const buttons=cfg.items.map(([id])=>stage.querySelector(cfg.button+'['+cfg.name+'="'+id+'"]'));
  if(buttons.some(b=>!b))return false;
  const nav=document.createElement('nav');
  nav.className='laria-scene-navigation laria-ipad-left-rail';
  nav.setAttribute('aria-label','Aktiviteter i '+cfg.title);
  nav.dataset.lariaComponent='sign-rail';
  buttons[0].parentElement.insertBefore(nav,buttons[0]);
  buttons.forEach((button,index)=>{
   const [id,label]=cfg.items[index];
   button.classList.add('laria-wayfinder','laria-ipad-sign');
   button.setAttribute('aria-label','Åpne '+label);
   button.dataset.lariaComponent='sign';
   button.innerHTML='<span class="laria-reference-activity-icon" aria-hidden="true">'+
     '<svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
     icons[id]+'</svg></span><span class="laria-ipad-sign-label">'+escape(label)+'</span>';
   nav.append(button);
  });
  const brand=document.createElement('div');
  brand.className='laria-ipad-brand';
  brand.setAttribute('role','img');
  brand.setAttribute('aria-label','Læria');
  stage.append(brand);
  const heading=document.createElement('div');
  heading.className='laria-ipad-heading';
  heading.setAttribute('role','heading');
  heading.setAttribute('aria-level','2');
  heading.innerHTML='<strong>'+escape(cfg.title)+'</strong><small>'+escape(cfg.place)+'</small>';
  stage.append(heading);
  if(subject==='math'){
   const next=root.querySelector('.tv-next button[data-tv="next"]:not(:disabled)');
   if(next){next.classList.add('laria-ipad-next');next.textContent='Neste eventyr';stage.append(next);}
  }
  actor(stage);
  stage.classList.add('laria-ipad-stage','laria-scene-shell');
  stage.dataset.lariaIpadRail='ready';
  root.dataset.lariaIpadRail=subject;
  return true;
 }
 window.LARIA_IPAD_RAILS=Object.freeze({enabled,mount});
})();
