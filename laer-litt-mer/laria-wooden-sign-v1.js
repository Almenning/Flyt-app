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
  const englishGroup=options.illustratedGroup===true&&subject==='english';
  if(englishGroup){
   rail.classList.add('laria-english-group-rail');
   rail.dataset.lariaEnglishGroup='review-v1';
  }
  // The three activities share one rail. Tallvika's Next adventure is secondary.
  rail.querySelectorAll('button.laria-wayfinder').forEach(button=>{
   const action=actionFor(button),surface=surfaceFor(button),label=labelFor(button);
   const reviewV3=!!(options.sourceDerived&&options.sourceVariant===3&&action==='words');
   const originalSourceReview=!!(options.sourceDerived&&(options.sourceVariant===4||options.sourceVariant===5)&&action==='words');
   const roundSourceReview=originalSourceReview&&options.sourceVariant===5;
   if(options.only&& !options.only.includes(action))return;
   button.classList.add('laria-wooden-sign');surface.classList.add('laria-wooden-sign-surface');
   if(options.sourceDerived&&action==='words'){
    button.classList.add('laria-words-sign-source-candidate');
    if(reviewV3)button.classList.add('laria-words-sign-art-v3');
    if(originalSourceReview)button.classList.add('laria-words-sign-original-source');
    if(roundSourceReview)button.classList.add('laria-words-sign-original-english-round');
    button.dataset.lariaWordsArt=originalSourceReview?'source-loading':reviewV3?'v3':'v2';
    // Kinnaklova still ships a legacy, !important arrow background rule for
    // its three original hotspots.  The review candidate is an explicit
    // component layer, so bind its approved raster directly to this one
    // button; it cannot be restyled back into that retired arrow.
    button.style.setProperty('background',
      originalSourceReview?'none':'url("./assets/ui/words-sign-candidate/'+(reviewV3?'words-plank-illustrated-v3-REVIEW.webp':'words-plank-source-derived-v2.png')+'") center/100% 100% no-repeat','important');
    // The legacy hotspot also fixes a narrow arrow geometry with !important.
    // Keep the candidate on its source artwork's natural 1395:366 plank
    // proportion instead of stretching the hand-drawn edges into that arrow.
    button.style.setProperty('width','clamp(310px,32vw,390px)','important');
    button.style.setProperty('height','auto','important');
    button.style.setProperty('min-height','78px','important');
    button.style.setProperty('aspect-ratio',originalSourceReview?'306 / 97':reviewV3?'1100 / 292':'1395 / 366','important');
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
   if(options.sourceDerived&&action==='words'){
    // The legacy Kinnaklova stylesheet has high-specificity !important
    // font-size AND max-width rules. They silently shrank this illustrated
    // medal to 36px and the real Words label to 17.92px. Apply the pilot
    // proportions only to the existing Words DOM layers.
    const labelNode=button.querySelector(':scope > .ki-plank-name');
    const medalNode=button.querySelector(':scope > .laria-wooden-sign-medallion');
    if(labelNode){
     labelNode.style.setProperty('font-size','clamp(28px,3vw,38px)','important');
     labelNode.style.setProperty('font-weight','900','important');
     labelNode.style.setProperty('line-height','1','important');
     labelNode.style.setProperty('left','42%','important');
     labelNode.style.setProperty('right','7%','important');
     labelNode.style.setProperty('width','auto','important');
    }
    if(medalNode){
     medalNode.style.setProperty('width','21.5%','important');
     medalNode.style.setProperty('height','auto','important');
     medalNode.style.setProperty('min-width','0','important');
     medalNode.style.setProperty('max-width','none','important');
     medalNode.style.setProperty('min-height','0','important');
     medalNode.style.setProperty('max-height','none','important');
     medalNode.style.setProperty('aspect-ratio','1','important');
     medalNode.style.setProperty('left','16.3%','important');
     // This SVG belongs to the retired CSS icon family. It visibly painted
     // a white speech bubble over the locked source's illustrated ABC medal.
     const oldSvg=medalNode.querySelector('svg');
     if(oldSvg)oldSvg.style.setProperty('display','none','important');
     medalNode.style.setProperty('background','url("./assets/ui/words-sign-candidate/'+(reviewV3?'words-abc-medallion-v3-REVIEW.png':'words-medallion-v2.png')+'") center/contain no-repeat','important');
     medalNode.style.setProperty('border','0','important');
     medalNode.style.setProperty('box-shadow','none','important');
    }
   }
   if(englishGroup&&['words','sentences','reading'].includes(action)){
    // Three REAL English action buttons, one illustrated plank family.
    // Two supporting posts belong to the RAIL (its ::before image), never
    // an individual button. The locked Kinnaklova image is left alone.
    const boardAsset='./assets/ui/words-sign-candidate/words-plank-illustrated-v3-REVIEW.webp';
    const badges={
     words:'words-abc-medallion-v3-REVIEW.png',
     sentences:'sentences-medallion-english-group-v1-REVIEW.png',
     reading:'reading-medallion-english-group-v1-REVIEW.png'
    };
    button.classList.add('laria-english-group-board');
    button.dataset.lariaEnglishSign='review-v1';
    button.style.setProperty('background','url("'+boardAsset+'") center/100% 100% no-repeat','important');
    button.style.setProperty('width','100%','important');
    button.style.setProperty('height','auto','important');
    button.style.setProperty('min-height','76px','important');
    button.style.setProperty('aspect-ratio','1100 / 292','important');
    button.style.setProperty('padding','0','important');
    button.style.setProperty('border','0','important');
    button.style.setProperty('box-shadow','none','important');
    button.style.setProperty('filter','drop-shadow(0 5px 4px #21140777)','important');
    const name=button.querySelector(':scope > .ki-plank-name');
    const medal=button.querySelector(':scope > .laria-wooden-sign-medallion');
    if(name){
     name.style.setProperty('position','absolute','important');
     name.style.setProperty('left','41%','important');
     name.style.setProperty('right','5%','important');
     name.style.setProperty('top','50%','important');
     name.style.setProperty('width','auto','important');
     name.style.setProperty('transform','translateY(-54%)','important');
     name.style.setProperty('font','900 clamp(22px,2.6vw,32px)/1 Georgia,"Times New Roman",serif','important');
     name.style.setProperty('letter-spacing','-.025em','important');
     name.style.setProperty('color','#2d180d','important');
     name.style.setProperty('text-shadow','0 1px 0 #ffe4ad,1px 2px 1px #6c381d55','important');
     name.style.setProperty('text-align','center','important');
     name.style.setProperty('white-space','nowrap','important');
    }
    if(medal){
     medal.style.setProperty('position','absolute','important');
     medal.style.setProperty('display','block','important');
     medal.style.setProperty('left','16%','important');
     medal.style.setProperty('top','50%','important');
     medal.style.setProperty('width','22%','important');
     medal.style.setProperty('height','auto','important');
     medal.style.setProperty('aspect-ratio','1','important');
     medal.style.setProperty('min-width','0','important');
     medal.style.setProperty('max-width','none','important');
     medal.style.setProperty('min-height','0','important');
     medal.style.setProperty('max-height','none','important');
     medal.style.setProperty('transform','translateY(-50%)','important');
     medal.style.setProperty('background',
       'url("./assets/ui/words-sign-candidate/'+badges[action]+'") center/contain no-repeat','important');
     medal.style.setProperty('border','0','important');
     medal.style.setProperty('border-radius','0','important');
     medal.style.setProperty('box-shadow','none','important');
     medal.querySelector('svg')?.style.setProperty('display','none','important');
    }
   }
   if(options.sourceDerived&&action==='words'&&!button.querySelector('.laria-words-sign-posts')){
    const posts=document.createElement('span');posts.className='laria-words-sign-posts';
    posts.setAttribute('aria-hidden','true');button.append(posts);
   }
   if(originalSourceReview){
    const sourceArt=roundSourceReview?window.LariaSourceExactSignV2:window.LariaSourceExactSignV1;
    if(!sourceArt){
     button.dataset.lariaSourceArt='blocked';
     button.dataset.lariaSourceError='Source-pixel module not loaded';
    }else{
     // Asynchronous SHA-verified original, never an unverified artistic
     // replacement. The preview remains opt-in, its failure stays isolated.
     sourceArt.apply(button).catch(()=>{});
    }
   }
   if(label)button.setAttribute('data-laria-sign-label',label);
  });
 }
 window.LariaWoodenSign=Object.freeze({version:'v1',mount});
})();
