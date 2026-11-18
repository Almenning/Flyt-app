/* Læria Hjem v15 — locked Kjøsnesfjorden / Grovanova masters.
   Approved artwork is stored as immutable WebP assets. The mountain is never regenerated. */
(function(){
'use strict';

const TABLET_MASTER='./assets/home-v15/kjosnes-home-tablet.webp?v=20261024-premium2';
const PHONE_MASTER='./assets/home-v15/kjosnes-home-phone.webp?v=20261024-locked1';
// Separate iPad-only previews. The two original SHA-locked masters above
// remain intact and continue to serve as the safe fallback.
const CLEAN_TABLET_MASTER='./assets/home-v15/kjosnes-home-tablet-no-bottom-cards-no-next-stop.webp?v=20261115-journey-wood-clean1';
const CLEAN_PHONE_MASTER='./assets/home-v15/kjosnes-home-phone-no-bottom-cards-no-next-stop.webp?v=20261115-journey-wood-clean1';
// Deliberately inactive hand-off point for the future UI-FREE Grovanova
// portrait master. It is not a source of art and it is not enabled merely by
// adding a file: visual approval, an immutable checksum, final dimensions and
// per-master UI safe areas must all be recorded first. Until then iPad portrait
// keeps the approved locked-phone fallback above.
//
// See docs/LARIA-HJEM-IPAD-PORTRAIT-ART-BRIEF-2026-11-18.md before changing
// this registry. Do not use AI concept imagery here.
const IPAD_PORTRAIT_MANIFEST='./assets/home-v15/grovanova-ipad-portrait-master.json';
// An independent approval gate for the owner's separately approved 4:3 artwork.
const IPAD_LANDSCAPE_MANIFEST='./assets/home-v15/grovanova-ipad-landscape-master.json';
let activeMasterSrc='';
let activePortraitObjectUrl='';
let activationEpoch=0;

function isPhone(){return matchMedia('(max-width:700px) and (orientation:portrait)').matches}
function isShortPhoneLandscape(){return matchMedia('(min-width:600px) and (max-width:1050px) and (max-height:580px) and (orientation:landscape)').matches}
function isPortrait(){return matchMedia('(orientation:portrait)').matches}
function isIpadHome(){return matchMedia('(min-width:768px) and (max-width:1366px) and (min-height:650px)').matches}

function isUnitRect(value){
 return Array.isArray(value)&&value.length===4&&value.every(n=>typeof n==='number'&&n>=0&&n<=1)&&
   value[2]>0&&value[3]>0&&value[0]+value[2]<=1&&value[1]+value[3]<=1;
}
async function approvedIpadPortraitMaster(){
 if(!isIpadHome()||!isPortrait())return null;
 let candidate;
 try{
  const response=await fetch(IPAD_PORTRAIT_MANIFEST,{cache:'no-store'});
  if(!response.ok)throw Error('portrait-manifest-missing');
  candidate=await response.json();
 }catch(_){return null;}
 const ui=candidate.ui;
 const validUi=ui&&['logo','subjects','journey','nav','adult','liveCopy'].every(key=>isUnitRect(ui[key]))&&
   ['sun','water','journeyGlow'].every(key=>isUnitRect(ui.ambient?.[key]))&&
   Array.isArray(ui.signBoards)&&ui.signBoards.length===4&&ui.signBoards.every(isUnitRect);
 const validSource=typeof candidate.source==='string'&&candidate.source.startsWith('./assets/home-v15/')&&
   /^[a-f0-9]{64}$/i.test(candidate.sha256||'')&&candidate.width>=2048&&candidate.height>=2732;
 return candidate.status==='approved'&&validSource&&validUi?candidate:null;
}

// Neither an absent file nor owner approval of a concept activates landscape.
// The exact exported pixels, SHA and UI anchors must be reviewed in a real app.
async function approvedIpadLandscapeMaster(){
 if(!isIpadHome()||isPortrait())return null;
 let candidate;
 try{
  const response=await fetch(IPAD_LANDSCAPE_MANIFEST,{cache:'no-store'});
  if(!response.ok)throw Error('landscape-manifest-missing');
  candidate=await response.json();
 }catch(_){return null;}
 const ui=candidate?.ui;
 const validUi=ui&&['logo','subjects','journey','nav','adult','liveCopy'].every(key=>isUnitRect(ui[key]))&&
   ['sun','water','journeyGlow'].every(key=>isUnitRect(ui.ambient?.[key]))&&
   Array.isArray(ui.signBoards)&&ui.signBoards.length===4&&ui.signBoards.every(isUnitRect);
 const validSource=typeof candidate?.source==='string'&&candidate.source.startsWith('./assets/home-v15/')&&
   /^[a-f0-9]{64}$/i.test(candidate.sha256||'')&&candidate.width>=2048&&candidate.height>=1536;
 return candidate.status==='approved'&&validSource&&validUi?candidate:null;
}

function hex(bytes){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
async function verifiedPortraitDecoded(candidate){
 const response=await fetch(candidate.source,{cache:'no-store'});
 if(!response.ok||!globalThis.crypto?.subtle)throw Error('portrait-art-unavailable');
 const bytes=await response.arrayBuffer();
 const digest=hex(await globalThis.crypto.subtle.digest('SHA-256',bytes));
 if(digest!==candidate.sha256)throw Error('portrait-art-sha-mismatch');
 // Keep the verified response's image MIME type, including test-only SVG fixtures.
 // Blob URLs with no content type cannot reliably decode SVG in WebKit.
 const contentType=(response.headers.get('content-type')||'image/webp').split(';',1)[0].trim();
 const objectUrl=URL.createObjectURL(new Blob([bytes],{type:contentType}));
 try{
  const image=await decoded(objectUrl);
  if(image.width!==candidate.width||image.height!==candidate.height)
   throw Error('portrait-art-dimensions-mismatch');
  return {image,objectUrl};
 }catch(error){URL.revokeObjectURL(objectUrl);throw error;}
}
function clearPortraitObjectUrl(){
 if(activePortraitObjectUrl){URL.revokeObjectURL(activePortraitObjectUrl);activePortraitObjectUrl='';}
}
function syncApprovedPortraitLogo(host,portraitMaster,box,viewport){
 let logo=host.querySelector('.bc15-approved-logo');
 if(!portraitMaster){logo?.remove();return;}
 if(!logo){
  logo=document.createElement('img');logo.className='bc15-approved-logo';
  logo.alt='Læria';logo.src='./assets/ui/laria-logo-from-grovanova.svg';
  host.appendChild(logo);
 }
 place(logo,box,portraitMaster.ui.logo,viewport);
}

// Mine troll uses the ONE shared interactive selection of original
// TrollActor characters; the former static art gallery is not navigation.
function openTrollDialog(){
 const open=window.LARIA_TROLL_ACTOR?.openChooser;
 if(typeof open==='function'){open();return true;}
 return false;
}

function decoded(src){
 return new Promise((resolve,reject)=>{
   const img=new Image();
   img.onload=()=>resolve({src,width:img.naturalWidth,height:img.naturalHeight});
   img.onerror=()=>reject(new Error('Could not decode Læria Home master'));
   img.src=src;
 });
}

function ensureAmbient(host){
 let ambient=host.querySelector('.bc15-ambient');
 if(ambient)return ambient;
 ambient=document.createElement('div');
 ambient.className='bc15-ambient';
 ambient.setAttribute('aria-hidden','true');
 ambient.innerHTML='<span class="bc15-sun-glow"></span>'+
   '<span class="bc15-water-glints"></span>'+
   '<span class="bc15-journey-glow"></span>';
 host.appendChild(ambient);
 return ambient;
}

// Decorative wooden rowboats live in their own non-interactive layer.
// Their positions are relative to the decoded, immutable Grovanova source,
// not the viewport. Rotating the iPad remaps them with the same art box as
// the real Læria controls. They are never baked into the locked master.
function syncHomeBoats(host,box,viewport,portrait){
 // Fail closed when a future approved UI-free portrait master takes over.
 // Old phone-art water coordinates are NOT valid on that new illustration.
 // Require independently reviewed water anchors before enabling boats there.
 if(!isIpadHome()||host.dataset.bc15CardArt==='owner-approved-ui-free'){
  host.querySelector('.bc15-boats')?.remove();
  return;
 }
 let layer=host.querySelector('.bc15-boats');
 if(!layer){
  layer=document.createElement('div');
  layer.className='bc15-boats';
  layer.setAttribute('aria-hidden','true');
  for(const name of ['near','far']){
   const boat=document.createElement('span');
   boat.className='bc15-boat bc15-boat-'+name;
   boat.dataset.bc15Boat=name;
   layer.appendChild(boat);
  }
  host.appendChild(layer);
 }
 layer.dataset.bc15Orientation=portrait?'portrait':'landscape';
 // Both boats remain on open water and clear of the painted sailboat,
 // left subject signs, journey board, greeting and top navigation.
 const boxes=portrait?
  [[.60,.505,.100,.027],[.755,.455,.050,.015]]:
  [[.570,.633,.074,.033],[.625,.551,.035,.017]];
 [...layer.children].forEach((boat,index)=>place(boat,box,boxes[index],viewport));
}

function place(el,box,part,viewport){
 if(!el)return;
 const [x,y,w,h]=part;
 const rawLeft=box.left+box.width*x;
 const rawTop=box.top+box.height*y;
 const rawWidth=box.width*w;
 const rawHeight=box.height*h;
 const width=Math.min(rawWidth,viewport.width);
 const height=Math.min(rawHeight,viewport.height);
 const left=Math.min(Math.max(0,rawLeft),Math.max(0,viewport.width-width));
 const top=Math.min(Math.max(0,rawTop),Math.max(0,viewport.height-height));
 el.style.setProperty('left',left+'px','important');
 el.style.setProperty('top',top+'px','important');
 el.style.setProperty('width',width+'px','important');
 el.style.setProperty('height',height+'px','important');
 el.style.setProperty('right','auto','important');
 el.style.setProperty('bottom','auto','important');
}

// The four light arrow signs on the approved Grovanova LANDSCAPE master
// are painted artwork. Add only invisible and accessible hit areas, and
// forward clicks to existing subject buttons to preserve app navigation.
const HOME_SIGN_SUBJECTS=[['norwegian','Norsk'],['math','Matte'],['english','Engelsk'],['geography','Geografi']];
const HOME_SIGN_ICONS=Object.freeze({
 norwegian:'<path d="M12 6c-3-2-7-2-10-1v14c4-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-4-1-7-1-10 1M12 6v14"/>',
 math:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 8h10M8 13h4M10 11v4M15 13h3M15 17h3"/>',
 english:'<path d="M4 5h16v12h-8l-5 4v-4H4z"/><path d="m8 13 2-5 2 5m-3-2h2M15 8h2v5h-2"/>',
 geography:'<path d="m2 20 8-12 4 5 3-4 5 11zM7 13l3-5 3 4"/>'
});
function ensureHomeSignHits(host){
 let nav=host.querySelector('.bc15-subject-signs');
 if(nav)return nav;
 nav=document.createElement('nav');
 nav.className='bc15-subject-signs';
 nav.setAttribute('aria-label','Velg fag fra de venstrestilte treskiltene');
 for(const [id,label] of HOME_SIGN_SUBJECTS){
  const button=document.createElement('button');
  button.type='button';
  button.className='bc15-painted-subject';
  button.dataset.bc15Subject=id;
  button.setAttribute('aria-label','Åpne '+label+' fra treskiltet');
  button.innerHTML='<span class="bc15-sign-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">'+HOME_SIGN_ICONS[id]+'</svg></span>'+
    '<span class="bc15-sign-name">'+label+'</span>';
  button.addEventListener('click',event=>{
   event.preventDefault();
   if(!host.classList.contains('bc15-locked-home'))return;
   if(host.dataset.bc15Master!=='landscape'&&!isIpadHome()&&!host.classList.contains('bc15-phone-fagmenu'))return;
   // Reuse Basecamp's existing subject route, including geography return state.
   if(typeof window.LARIA_HOME_OPEN_SUBJECT==='function')window.LARIA_HOME_OPEN_SUBJECT(id);
   else host.querySelector('.bc14-subject[data-camp="subject-'+id+'"]')?.click();
  });
  nav.appendChild(button);
 }
 host.appendChild(nav);
 return nav;
}

function mapControlsToArtwork(host,imgW,imgH,portrait,approvedPortrait){
 const rect=host.getBoundingClientRect();
 const artAspect=imgW/imgH;
 const viewportAspect=rect.width/rect.height;
 const heightScale=rect.height/imgH;
 const maxWidthScale=(rect.width*(portrait?1:1.06))/imgW;
 // The historical painted masters MUST remain uncropped. Only a separately
 // approved UI-free portrait may use restrained cover, within the artwork
 // brief's protected 8% side / 5% top safe zones. This fills 820x1180 and
 // 1024x1366 iPads without stretching, duplicated mountains or CSS filler.
 const coverScale=Math.max(rect.width/imgW,heightScale);
 const coverW=imgW*coverScale;
 const coverH=imgH*coverScale;
 const sideCrop=Math.max(0,(coverW-rect.width)/(2*coverW));
 const verticalCrop=Math.max(0,(coverH-rect.height)/(2*coverH));
 const approvedCover=!!approvedPortrait&&sideCrop<=.08&&verticalCrop<=.05;
 const scale=approvedCover?coverScale:
   artAspect>viewportAspect?Math.min(heightScale,maxWidthScale):heightScale;
 const phonePortrait=portrait&&rect.width<=700;
 const artWidth=imgW*scale;
 const artHeight=imgH*scale;
 const spareY=Math.max(0,rect.height-artHeight);
 const box={
   width:artWidth,
   height:artHeight,
   left:(rect.width-artWidth)/2,
   // Phones keep the whole master and split spare height between sky and the
   // cream navigation continuation. Other layouts preserve the locked bottom alignment.
   top:approvedCover?(rect.height-artHeight)/2:
       phonePortrait?spareY*.30:rect.height-artHeight
 };
 host.dataset.bc15Fit=approvedCover?'approved-cover':
   artAspect>viewportAspect?'safe-width':'safe-height';
 // A dedicated scenic-only strip fills top letterboxing in landscape iPad.
 // No art cropping, duplicated controls, or changed locked image pixels.
 host.classList.toggle('bc15-landscape-bleed',
   !portrait&&isIpadHome()&&box.top>18);

 const tabletPortrait=portrait&&rect.width>700;
 const lockedPortraitLayout={
   subjects:[.044,.728,.912,.135],
   journey:[.052,.620,.896,.098],
   nav:[.025,.900,.95,.092],
   adult:[.855,.030,.105,.070],
   liveCopy:tabletPortrait?[.03,.138,.62,.105]:[.00,.138,.62,.105]
 };
 const layout=approvedPortrait?approvedPortrait.ui:portrait?lockedPortraitLayout:{
   subjects:[.353,.692,.611,.242],
   journey:[.028,.747,.304,.161],
   nav:[.711,.023,.272,.135],
   adult:[.025,.020,.205,.155],
   // Compact landscape artwork contains an old painted greeting under
   // the logo. Put the ONE live greeting over it, without touching the
   // logo above or the first painted oak sign below.
   liveCopy:rect.height<=580&&rect.width<=1050?
     [.115,.178,.43,.125]:
     rect.height<600?[.105,.19,.315,.175]:[.105,.18,.315,.11]
 };
 const viewport={width:rect.width,height:rect.height};
 // Map four separately tappable signboards onto the APPROVED master.
 // Coordinates are relative to the underlying image, not fixed pixels.
 const signs=ensureHomeSignHits(host);
 const liveIpadPortrait=isIpadHome()&&(portrait||!!approvedPortrait);
 const livePhonePortrait=isPhone()&&portrait&&host.dataset.bc15CardArt==='clean-candidate';
 // Short landscape phones use the SAME clean, card-free master and painted
 // left oak signs as iPad landscape, without introducing a second menu.
 const cleanPhoneLandscape=!portrait&&isShortPhoneLandscape()&&
   host.dataset.bc15CardArt==='clean-candidate';
 const livePortrait=liveIpadPortrait||livePhonePortrait;
 host.classList.toggle('bc15-ipad-fagmenu',isIpadHome());
 host.classList.toggle('bc15-phone-fagmenu',livePhonePortrait||cleanPhoneLandscape);
 signs.hidden=portrait&&!livePortrait;
 signs.dataset.bc15Presentation=livePortrait?'live':'painted';
 if(!portrait&&!approvedPortrait){
  const signBoxes=[
   [.012,.314,.170,.074], // Norsk
   [.012,.394,.170,.074], // Matte
   [.012,.473,.170,.074], // Engelsk
   [.012,.552,.170,.074]  // Geografi
  ];
  signs.querySelectorAll('.bc15-painted-subject').forEach((button,index)=>{
   place(button,box,signBoxes[index],viewport);
  });
 }
 if(livePortrait){
  // The approved iPad rail is unchanged. Phones have no side gutter, so
  // four shared oak boards sit together in the card-free meadow instead.
  const phoneBoardPx=Math.max(44,Math.min(50,box.height*.065));
  const phoneGapPx=Math.max(4,Math.min(10,box.height*.012));
  const phoneRow0=.725;
  const phoneRow1=phoneRow0+(phoneBoardPx+phoneGapPx)/box.height;
  const phoneHeight=phoneBoardPx/box.height;
  const signBoxes=approvedPortrait?approvedPortrait.ui.signBoards:livePhonePortrait?[
   [.050,phoneRow0,.425,phoneHeight], // Norsk
   [.525,phoneRow0,.425,phoneHeight], // Matte
   [.050,phoneRow1,.425,phoneHeight], // Engelsk
   [.525,phoneRow1,.425,phoneHeight] // Geografi
  ]:[
   [-.135,.260,.245,.068], // Norsk
   [-.135,.332,.245,.068], // Matte
   [-.135,.404,.245,.068], // Engelsk
   [-.135,.476,.245,.068]  // Geografi
  ];
  const buttons=[...signs.querySelectorAll('.bc15-painted-subject')];
  buttons.forEach((button,index)=>place(button,box,signBoxes[index],viewport));
  const boxes=buttons.map(button=>({
   left:parseFloat(button.style.left)||0,top:parseFloat(button.style.top)||0,
   width:parseFloat(button.style.width)||0,height:parseFloat(button.style.height)||0
  }));
  const left=Math.min(...boxes.map(b=>b.left));
  const top=Math.min(...boxes.map(b=>b.top));
  const right=Math.max(...boxes.map(b=>b.left+b.width));
  const bottom=Math.max(...boxes.map(b=>b.top+b.height));
  if(approvedPortrait){
   for(const p of ['--bc15-post-left','--bc15-post-top','--bc15-post-width','--bc15-post-height'])signs.style.removeProperty(p);
  }else{
   signs.style.setProperty('--bc15-post-left',left+'px');
   signs.style.setProperty('--bc15-post-top',(top+8)+'px');
   signs.style.setProperty('--bc15-post-width',(right-left)+'px');
   signs.style.setProperty('--bc15-post-height',Math.max(0,bottom-top+(livePhonePortrait?1:45))+'px');
  }
 }else{
  for(const p of ['--bc15-post-left','--bc15-post-top','--bc15-post-width','--bc15-post-height'])
   signs.style.removeProperty(p);
 }
 place(host.querySelector('.bc14-subjects'),box,layout.subjects,viewport);
 place(host.querySelector('.bc12-journey'),box,layout.journey,viewport);
 place(host.querySelector('.bc12-nav'),box,layout.nav,viewport);
 place(host.querySelector('.bc12-adult-entry'),box,layout.adult,viewport);
 place(host.querySelector('.bc15-live-copy'),box,layout.liveCopy,viewport);
 const ambient=ensureAmbient(host);
 const ambientLayout=approvedPortrait?{
   sun:approvedPortrait.ui.ambient.sun,
   water:approvedPortrait.ui.ambient.water,
   journey:approvedPortrait.ui.ambient.journeyGlow
  }:portrait?{
   sun:[.69,.19,.24,.18],
   water:[.48,.43,.48,.25],
   journey:[.76,.612,.20,.112]
 }:{
   sun:[.54,.18,.16,.16],
   water:[.53,.42,.34,.24],
   journey:[.267,.754,.065,.145]
 };
 place(ambient.querySelector('.bc15-sun-glow'),box,ambientLayout.sun,viewport);
 place(ambient.querySelector('.bc15-water-glints'),box,ambientLayout.water,viewport);
 place(ambient.querySelector('.bc15-journey-glow'),box,ambientLayout.journey,viewport);
 syncHomeBoats(host,box,viewport,portrait);
 host.style.setProperty('--bc15-art-left',box.left+'px');
 host.style.setProperty('--bc15-art-top',box.top+'px');
 host.style.setProperty('--bc15-art-width',box.width+'px');
 host.style.setProperty('--bc15-art-height',box.height+'px');
 return box;
}

function syncLiveCopy(host){
 let live=host.querySelector('.bc15-live-copy');
 if(!live){
   live=document.createElement('div');
   live.className='bc15-live-copy';
   live.innerHTML='<div class="bc15-live-greeting"></div><div class="bc15-live-intro"></div>';
   host.appendChild(live);
 }
 const title=host.querySelector('.bc12-heading h1')?.textContent?.trim()||'Hei, eventyrer!';
 const intro='Klar for et nytt eventyr?';
 live.querySelector('.bc15-live-greeting').textContent=title;
 live.querySelector('.bc15-live-intro').textContent=intro;
 live.querySelector('.bc15-live-intro').setAttribute('aria-hidden','true');
 live.setAttribute('aria-label',title+' '+intro);

 // The "Fortsett reisen" title and wood sign are part of the locked art.
 // Remove the artificial sticker rather than trying to match its colors.
 // Progress is still available to screen readers on the actual journey button.
 host.querySelector('.bc15-live-next')?.remove();
 const place=host.querySelector('[data-camp-next]')?.textContent?.trim()||'Bokskogen';
 const rawType=host.querySelector('[data-camp-next-type]')?.textContent?.trim()||'Neste stopp';
 const type=/pågående/i.test(rawType)?'Pågående':'Neste stopp';
 host.querySelector('.bc12-journey')?.setAttribute('aria-label',
   'Fortsett reisen. '+type+': '+place);
}

function clearMappedControls(host){
 host.querySelector('.bc15-boats')?.remove();
 clearPortraitObjectUrl();
 host.querySelector('.bc15-approved-logo')?.remove();
 ['.bc14-subjects','.bc12-journey','.bc12-nav','.bc12-adult-entry',
   '.bc15-sun-glow','.bc15-water-glints','.bc15-journey-glow'].forEach(sel=>{
   const el=host.querySelector(sel);if(!el)return;
   ['left','top','width','height','right','bottom'].forEach(p=>el.style.removeProperty(p));
 });
 host.querySelectorAll('.bc15-painted-subject').forEach(button=>{
  ['left','top','width','height','right','bottom'].forEach(prop=>button.style.removeProperty(prop));
 });
 host.style.removeProperty('background-size');
 host.style.removeProperty('background-position');
 ['--bc15-art-left','--bc15-art-top','--bc15-art-width','--bc15-art-height'].forEach(p=>host.style.removeProperty(p));
}

async function activate(){
 const epoch=++activationEpoch;
 const host=document.querySelector('#home-screen .bc12');
 if(!host)return false;
 // Never measure a hidden Basecamp. A child may rotate the phone while
 // visiting a subject; a hidden Home has zero dimensions and would poison
 // all later subject hitboxes. Re-map when Home actually becomes active.
 if(!host.closest('#home-screen.active'))return false;
 // Historic landscape can load perfectly, yet its painted characters and
 // activity cards disqualify it as the CLEAN November premium master.
 // A successful decode is not art approval. Preserve original Home until
 // the replacement passes independent pixel + visual review.
 host.dataset.bc15PremiumArt='blocked'; // candidate art is not owner-signoff
 host.dataset.bc15CardArt='locked-original';
 host.querySelector('.bc14-subjects')?.removeAttribute('aria-hidden');
 if(host.querySelector('.bc14-subjects'))host.querySelector('.bc14-subjects').inert=false;
 host.classList.remove('bc15-ipad-fagmenu','bc15-phone-fagmenu','bc15-landscape-bleed');
 const youngBand=!!document.querySelector('.grade-band-young');
 if(!youngBand){
   host.classList.remove('bc15-capable','bc15-locked-home','bc15-pending','bc15-fallback');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.querySelector('.bc15-subject-signs')?.remove();
   host.dataset.bc15Asset='ineligible';
   host.querySelectorAll('.bc15-live-copy,.bc15-ambient').forEach(el=>el.remove());
   return false;
 }
 host.classList.add('bc15-capable');
 const detachedView=host.dataset.bc13View && host.dataset.bc13View!=='home';
 if((host.dataset.mode && host.dataset.mode!=='home') || detachedView){
   host.classList.remove('bc15-locked-home','bc15-pending');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.querySelector('.bc15-subject-signs')?.remove();
   host.dataset.bc15Asset='inactive';
   host.querySelectorAll('.bc15-live-copy,.bc15-live-next,.bc15-ambient').forEach(el=>el.remove());
   return false;
 }
 const portrait=isPortrait();
 let portraitMaster=await approvedIpadPortraitMaster();
 let landscapeMaster=await approvedIpadLandscapeMaster();
 let approvedMaster=portraitMaster||landscapeMaster;
 // A previous fetch must not mutate Home after a rerender, orientation
 // change or navigation away while the approval manifest was loading.
 if(epoch!==activationEpoch||!host.isConnected||
    host!==document.querySelector('#home-screen .bc12')||
    !host.closest('#home-screen.active')||portrait!==isPortrait())return false;
 const originalMaster=portrait?PHONE_MASTER:TABLET_MASTER;
 const cleanMaster=portrait?CLEAN_PHONE_MASTER:CLEAN_TABLET_MASTER;
 const wantsClean=isIpadHome()||isPhone()||isShortPhoneLandscape();
 host.classList.add('bc15-pending');
 host.dataset.bc15Asset='loading';
 try{
   // If the clean candidate cannot decode, retain the fully functional
   // locked original. Never turn a missing asset into an empty Home stage.
   let cleanLoaded=false;
   let image;
   let nextPortraitObjectUrl='';
   if(approvedMaster){
    try{
     const verified=await verifiedPortraitDecoded(approvedMaster);
     image=verified.image;
     // Do not own/revoke a Blob URL until this activation wins the race.
     nextPortraitObjectUrl=verified.objectUrl;
     cleanLoaded=true;
    }catch(_){
     // A damaged, missing or wrongly exported future master is never allowed
     // to blank Home. Fall back to the same locked source used today.
     approvedMaster=null;
     try{image=await decoded(cleanMaster);cleanLoaded=true;}
     catch(_){image=await decoded(originalMaster);}

    }
   }else if(wantsClean){
    try{image=await decoded(cleanMaster);cleanLoaded=true;}
    catch(_){image=await decoded(originalMaster);}
   }else image=await decoded(originalMaster);
   if(epoch!==activationEpoch || !host.isConnected ||
      host!==document.querySelector('#home-screen .bc12') ||
      !host.closest('#home-screen.active')||portrait!==isPortrait()){
     if(nextPortraitObjectUrl)URL.revokeObjectURL(nextPortraitObjectUrl);
     return false;
   }
   activeMasterSrc=image.src;
   host.style.setProperty('--bc15-home-art','url("'+image.src+'")');
   clearPortraitObjectUrl();
   activePortraitObjectUrl=nextPortraitObjectUrl;
   host.classList.add('bc15-locked-home');
   host.classList.remove('bc15-pending','bc15-fallback');
   host.dataset.bc15Asset=approvedMaster?(portrait?'ipad-portrait-approved':'ipad-landscape-approved'):portrait?'phone-ready':'tablet-ready';
   host.dataset.bc15Master=approvedMaster?(portrait?'ipad-portrait-approved':'ipad-landscape-approved'):portrait?'portrait':'landscape';
   host.dataset.bc15CardArt=cleanLoaded?'clean-candidate':'locked-original';
   if(approvedMaster)host.dataset.bc15CardArt='owner-approved-ui-free';
   const oldRow=host.querySelector('.bc14-subjects');
   if(oldRow){
    oldRow.inert=cleanLoaded;
    if(cleanLoaded)oldRow.setAttribute('aria-hidden','true');
    else oldRow.removeAttribute('aria-hidden');
   }
   syncLiveCopy(host);
   const artBox=mapControlsToArtwork(host,image.width,image.height,portrait,approvedMaster);
   syncApprovedPortraitLogo(host,approvedMaster,artBox,{width:host.clientWidth,height:host.clientHeight});

   const trollNav=host.querySelector('.bc12-nav [data-camp="wardrobe"]');
   if(trollNav){
     trollNav.setAttribute('aria-label','Mine troll');
     [...trollNav.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>{node.nodeValue='Mine troll';});
     if(trollNav.dataset.bc15TrollBound!=='true'){
       trollNav.dataset.bc15TrollBound='true';
       trollNav.addEventListener('click',e=>{
         if(!host.classList.contains('bc15-locked-home'))return;
         e.preventDefault();
         e.stopImmediatePropagation();
         openTrollDialog();
       },true);
     }
   }
   const adult=host.querySelector('[data-camp-adult]');
   if(adult)adult.setAttribute('aria-label','Hold inne for voksenområdet');
   return true;
 }catch(err){
   if(epoch!==activationEpoch)return false;
   host.classList.remove('bc15-locked-home','bc15-pending');
   host.classList.add('bc15-fallback');
   host.style.removeProperty('--bc15-home-art');
   clearMappedControls(host);
   host.querySelector('.bc15-subject-signs')?.remove();
   host.dataset.bc15Asset='missing';
   host.querySelectorAll('.bc15-live-copy,.bc15-live-next,.bc15-ambient').forEach(el=>el.remove());
   console.warn('[Læria Home v15] Locked master not activated.',err);
   return false;
 }
}

let liveSyncQueued=false;
function queueLiveSync(host){
 if(liveSyncQueued)return;
 liveSyncQueued=true;
 requestAnimationFrame(()=>{
   liveSyncQueued=false;
   if(host?.classList.contains('bc15-locked-home'))syncLiveCopy(host);
 });
}
function schedule(){requestAnimationFrame(()=>activate())}
if(typeof window.renderAll==='function'&&!window.__LARIA_HOME_V15_RENDERALL_WRAPPED){
 const priorRenderAll=window.renderAll;
 window.renderAll=function(){
   const result=priorRenderAll.apply(this,arguments);
   const host=document.querySelector('#home-screen .bc12');
   if(host?.classList.contains('bc15-locked-home'))queueLiveSync(host);
   return result;
 };
 window.__LARIA_HOME_V15_RENDERALL_WRAPPED=true;
}
let homeScreenObserver=null;
function watchHomeActivation(){
 if(homeScreenObserver)return;
 const screen=document.getElementById('home-screen');
 if(!screen)return;
 homeScreenObserver=new MutationObserver(()=>{
   if(screen.classList.contains('active'))schedule();
 });
 homeScreenObserver.observe(screen,{attributes:true,attributeFilter:['class']});
}
document.addEventListener('DOMContentLoaded',()=>{watchHomeActivation();schedule();},{once:true});
const observer=new MutationObserver(mutations=>{
 const host=document.querySelector('#home-screen .bc12');
 if(!host)return;
 watchHomeActivation();
 const firstMount=host.dataset.bc15Observed!=='true';
 const stateChanged=mutations.some(m=>m.type==='attributes'&&m.target===host&&(m.attributeName==='data-mode'||m.attributeName==='data-bc13-view'));
 const contentChanged=mutations.some(m=>{
   if(m.type!=='childList'&&m.type!=='characterData')return false;
   const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
   return !el?.closest?.('.bc15-live-copy');
 });
 if(firstMount)host.dataset.bc15Observed='true';
 if(firstMount||stateChanged)activate();
 else if(contentChanged)queueLiveSync(host);
});
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-mode','data-bc13-view']});
const portraitMq=matchMedia('(orientation:portrait)');
portraitMq.addEventListener?.('change',activate);
let resizeTimer=0;
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(activate,80)},{passive:true});
})();
