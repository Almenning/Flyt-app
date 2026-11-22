/* Locked Sign Design V1: reusable DOM treatment for the approved sign master.
 * The original button nodes, handlers and labels are retained. */
(()=>{'use strict';
 const paths={
  words:'<path d="M4 5h16v12H9l-5 4v-4H4zM8 10h8M8 14h5"/>',sentences:'<path d="M3 5h18v12H9l-5 4v-4H3zM7 9h10M7 13h7"/>',
  reading:'<path d="M12 6C9 4 5 4 2 5v14c4-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-4-1-7-1-10 1M12 6v14"/>',
  multiply:'<path d="M5 5 19 19M19 5 5 19"/><circle cx="12" cy="12" r="10"/>',fraction:'<circle cx="12" cy="12" r="10"/><path d="M12 2v10h10M5 19l7-7"/>',
  table:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  journey:'<path d="m4 20 8-16 8 16-8-4-8 4z"/><circle cx="12" cy="12" r="2"/>',globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c6 5 6 15 0 20M12 2c-6 5-6 15 0 20"/>',
  country:'<path d="M5 22V2m0 2c6-3 8 3 15 0v12c-7 3-9-3-15 0"/>',norwegian:'<path d="M12 6C9 4 5 4 2 5v14c4-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-4-1-7-1-10 1M12 6v14"/>',
  math:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 8h10M8 13h4M10 11v4M15 13h3M15 17h3"/>',
  english:'<path d="M3 6h18v12H3zM3 10h18M9 6v12"/>',geography:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c6 5 6 15 0 20M12 2c-6 5-6 15 0 20"/>'
 };
 const actionFor=button=>button.dataset.ki||button.dataset.tv||button.dataset.eg||button.dataset.gv||button.dataset.bc15Subject||'';
 const surfaceFor=button=>button.matches('.eg-scene-hit')?button.querySelector(':scope > span:not(.laria-wooden-sign-medallion)')||button:button;
 const labelFor=button=>button.querySelector('.tv-sign-label,.ki-plank-name')?.textContent?.trim()||button.textContent.trim();
 const iconFor=key=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(paths[key]||paths.globe)+'</svg>';
 function mount(rail,subject,options={}){
  if(!rail||rail.dataset.lariaWoodenSign==='v1')return;
  rail.dataset.lariaWoodenSign='v1';rail.classList.add('laria-wooden-sign-rail');
  // The three activities share one rail. Tallvika's Next adventure is secondary.
  rail.querySelectorAll('button.laria-wayfinder').forEach(button=>{
   const action=actionFor(button),surface=surfaceFor(button),label=labelFor(button);
   if(options.only&& !options.only.includes(action))return;
   button.classList.add('laria-wooden-sign');surface.classList.add('laria-wooden-sign-surface');
   if(options.sourceDerived&&action==='words'){
    button.classList.add('laria-words-sign-source-candidate');
    // Kinnaklova still ships a legacy, !important arrow background rule for
    // its three original hotspots.  The review candidate is an explicit
    // component layer, so bind its approved raster directly to this one
    // button; it cannot be restyled back into that retired arrow.
    button.style.setProperty('background',
      'url("./assets/ui/words-sign-candidate/words-plank-source-derived-v2.png") center/100% 100% no-repeat','important');
    // The legacy hotspot also fixes a narrow arrow geometry with !important.
    // Keep the candidate on its source artwork's natural 1395:366 plank
    // proportion instead of stretching the hand-drawn edges into that arrow.
    button.style.setProperty('width','clamp(268px,30vw,410px)','important');
    button.style.setProperty('height','auto','important');
    button.style.setProperty('min-height','70px','important');
    button.style.setProperty('aspect-ratio','1395 / 366','important');
   }
   button.dataset.lariaWoodenSign='v1';button.dataset.lariaSignAction=action;
   // Remove only the retired decorative icon, not the button or label.
   // Otherwise two icons overlap and clip the first letters of Tallvika.
   surface.querySelector('.laria-reference-activity-icon')?.remove();
   surface.querySelector('.tv-sign-icon')?.remove();
   if(!surface.querySelector('.laria-wooden-sign-medallion')){
    const medal=document.createElement('span');medal.className='laria-wooden-sign-medallion';
    medal.setAttribute('aria-hidden','true');medal.innerHTML=iconFor(action||subject);surface.prepend(medal);
   }
   if(options.sourceDerived&&action==='words'&&!button.querySelector('.laria-words-sign-posts')){
    const posts=document.createElement('span');posts.className='laria-words-sign-posts';
    posts.setAttribute('aria-hidden','true');button.append(posts);
   }
   if(label)button.setAttribute('data-laria-sign-label',label);
  });
 }
 window.LariaWoodenSign=Object.freeze({version:'v1',mount});
})();
