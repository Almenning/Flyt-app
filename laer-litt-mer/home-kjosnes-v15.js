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
// Owner-locked v16 painted iPad scenes. Preserve original Home sources.
const IPAD_V16_MANIFEST='./assets/home-v15/laria-grovanova-v16-manifest.json';
let activeV16Blob='';
function clearV16Blob(){if(activeV16Blob){URL.revokeObjectURL(activeV16Blob);activeV16Blob='';}}
function isUnitRect(v){return Array.isArray(v)&&v.length===4&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1)&&v[2]>0&&v[3]>0&&v[0]+v[2]<=1&&v[1]+v[3]<=1;}
async function approvedV16(){
 if(!isIpadHome())return null;
 try{
  const res=await fetch(IPAD_V16_MANIFEST,{cache:'no-store'});
  if(!res.ok)return null;
  const meta=await res.json(),item=meta?.[isPortrait()?'portrait':'landscape'];
  if(meta.status!=='approved-preview'||!item)return null;
  if(typeof item.source!=='string'||!/^\.\/assets\/home-v15\/[a-z0-9-]+\.webp$/i.test(item.source)||!/^[0-9a-f]{64}$/.test(item.sha256))return null;
  if(item.width!==2048||item.height!==(isPortrait()?2732:1536))return null;
  if(!item.ui||!['greeting','subjects','reise','continue','nav','adult'].every(k=>isUnitRect(item.ui[k])))return null;
  if(!Array.isArray(item.ui.signBoards)||item.ui.signBoards.length!==4||!item.ui.signBoards.every(isUnitRect))return null;
  return item;
 }catch(_){return null;}
}
async function decodeV16Verified(item){
 const res=await fetch(item.source,{cache:'no-store'});
 if(!res.ok||!globalThis.crypto?.subtle)throw Error('v16-unavailable');
 const bytes=await res.arrayBuffer();
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(hash!==item.sha256)throw Error('v16-sha-mismatch');
 const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
 try{
  const image=await decoded(url);
  if(image.width!==item.width||image.height!==item.height)throw Error('v16-dimensions-mismatch');
  return {image,url};
 }catch(e){URL.revokeObjectURL(url);throw e;}
}
let activeMasterSrc='';
let activationEpoch=0;

function isPhone(){return matchMedia('(max-width:700px) and (orientation:portrait)').matches}
function isShortPhoneLandscape(){return matchMedia('(min-width:600px) and (max-width:1050px) and (max-height:580px) and (orientation:landscape)').matches}
function isPortrait(){return matchMedia('(orientation:portrait)').matches}
function isIpadHome(){return matchMedia('(min-width:768px) and (max-width:1366px) and (min-height:650px)').matches}

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
 if(!isIpadHome()||host.dataset.bc15Master==='ipad-portrait-approved'){
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

function mapV16Home(host,imgW,imgH,entry){
 const bounds=host.getBoundingClientRect(),viewport={width:bounds.width,height:bounds.height};
 const ratio=Math.max(bounds.width/imgW,bounds.height/imgH);
 const box={left:(bounds.width-imgW*ratio)/2,top:(bounds.height-imgH*ratio)/2,width:imgW*ratio,height:imgH*ratio};
 const ui=entry.ui;
 const signNav=ensureHomeSignHits(host);
 signNav.hidden=false;
 signNav.dataset.bc15Presentation='v16-painted';
 signNav.querySelectorAll('button').forEach((b,i)=>place(b,box,ui.signBoards[i],viewport));
 place(host.querySelector('.bc12-journey'),box,ui.continue,viewport);
 const nav=host.querySelector('.bc12-nav');
 place(nav,box,ui.nav,viewport);
 const travel=nav?.querySelector('[data-camp="travel"]');
 if(travel){travel.hidden=true;travel.tabIndex=-1;travel.setAttribute('aria-hidden','true');}
 place(host.querySelector('.bc12-adult-entry'),box,ui.adult,viewport);
 place(host.querySelector('.bc15-live-copy'),box,ui.greeting,viewport);
 let reisen=host.querySelector('.bc16-reisen');
 if(!reisen){
  reisen=document.createElement('button');reisen.type='button';
  reisen.className='bc16-reisen';reisen.setAttribute('aria-label','Reisen. Velg fagreise');
  reisen.addEventListener('click',()=>{
   let dialog=document.getElementById('bc16-journey-picker');
   if(!dialog){
    dialog=document.createElement('dialog');dialog.id='bc16-journey-picker';
    dialog.setAttribute('aria-label','Velg fagreise');
    dialog.innerHTML='<h2>Reisen</h2><p>Velg en fagreise</p>'+
      [['norwegian','Norsk'],['math','Matte'],['english','Engelsk'],['geography','Geografi']].map(([id,label])=>
      '<button type="button" data-bc16-subject="'+id+'">'+label+'</button>').join('')+
      '<button type="button" data-bc16-close>Lukk</button>';
    dialog.addEventListener('click',event=>{
     const id=event.target.closest('[data-bc16-subject]')?.dataset.bc16Subject;
     if(id){dialog.close();window.LARIA_HOME_OPEN_SUBJECT?.(id);}
     if(event.target.closest('[data-bc16-close]'))dialog.close();
    });
    document.body.appendChild(dialog);
   }
   dialog.showModal();
  });
  host.appendChild(reisen);
 }
 place(reisen,box,ui.reise,viewport);
 host.querySelector('.bc15-boats')?.remove();
 host.querySelector('.bc15-ambient')?.remove();
 host.classList.remove('bc15-ipad-fagmenu','bc15-landscape-bleed');
 for(const [name,value] of [['left',box.left],['top',box.top],['width',box.width],['height',box.height]])
  host.style.setProperty('--bc15-art-'+name,value+'px');
 host.dataset.bc15Fit='v16-full-bleed-cover';
 return box;
}

function mapControlsToArtwork(host,imgW,imgH,portrait){
 if(host.dataset.bc15Design==='locked-v16')return mapV16Home(host,imgW,imgH,host.__bc16);
 const rect=host.getBoundingClientRect();
 const artAspect=imgW/imgH;
 const viewportAspect=rect.width/rect.height;
 const heightScale=rect.height/imgH;
 const maxWidthScale=(rect.width*(portrait?1:1.06))/imgW;
 // Preserve the locked mountain shape. Portrait must never crop the left/right
 // edges because the four subject cards and bottom navigation are part of the artwork.
 // Landscape may use at most 3% crop on each side; scenic fill absorbs spare space.
 const scale=artAspect>viewportAspect?Math.min(heightScale,maxWidthScale):heightScale;
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
   top:phonePortrait?spareY*.30:rect.height-artHeight
 };
 host.dataset.bc15Fit=artAspect>viewportAspect?'safe-width':'safe-height';
 // A dedicated scenic-only strip fills top letterboxing in landscape iPad.
 // No art cropping, duplicated controls, or changed locked image pixels.
 host.classList.toggle('bc15-landscape-bleed',
   !portrait&&isIpadHome()&&box.top>18);

 const tabletPortrait=portrait&&rect.width>700;
 const layout=portrait?{
   subjects:[.044,.728,.912,.135],
   journey:[.052,.620,.896,.098],
   nav:[.025,.900,.95,.092],
   adult:[.855,.030,.105,.070],
   liveCopy:tabletPortrait?[.03,.138,.62,.105]:[.00,.138,.62,.105]
 }:{
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
 const liveIpadPortrait=isIpadHome()&&portrait;
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
 if(!portrait){
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
  const signBoxes=livePhonePortrait?[
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
  signs.style.setProperty('--bc15-post-left',left+'px');
  signs.style.setProperty('--bc15-post-top',(top+8)+'px');
  signs.style.setProperty('--bc15-post-width',(right-left)+'px');
  signs.style.setProperty('--bc15-post-height',Math.max(0,bottom-top+(livePhonePortrait?1:45))+'px');
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
 const ambientLayout=portrait?{
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
 host.querySelector('.bc16-reisen')?.remove();
 host.querySelector('.bc15-boats')?.remove();
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
   host.querySelectorAll('.bc15-live-copy,.bc15-ambient,.bc15-boats').forEach(el=>el.remove());
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
   host.querySelectorAll('.bc15-live-copy,.bc15-live-next,.bc15-ambient,.bc15-boats').forEach(el=>el.remove());
   return false;
 }
 const portrait=isPortrait();
 const v16=await approvedV16();
 if(epoch!==activationEpoch||!host.isConnected||!host.closest('#home-screen.active')||portrait!==isPortrait())return false;
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
   let newBlob='';
   let v16active=null;
   if(v16){
    try{
     const verified=await decodeV16Verified(v16);
     image=verified.image;newBlob=verified.url;v16active=v16;cleanLoaded=true;
    }catch(_){ /* Fail closed to existing locked Home */ }
   }
   if(!image&&wantsClean){
    try{image=await decoded(cleanMaster);cleanLoaded=true;}
    catch(_){image=await decoded(originalMaster);}
   }else if(!image)image=await decoded(originalMaster);
   if(epoch!==activationEpoch || !host.isConnected ||
      host!==document.querySelector('#home-screen .bc12') || portrait!==isPortrait()){
     if(newBlob)URL.revokeObjectURL(newBlob);return false;
   }
   clearV16Blob();activeV16Blob=newBlob;
   activeMasterSrc=image.src;
   host.style.setProperty('--bc15-home-art','url("'+image.src+'")');
   host.classList.add('bc15-locked-home');
   host.classList.remove('bc15-pending','bc15-fallback');
   host.dataset.bc15Asset=v16active?'v16-'+(portrait?'portrait':'landscape')+'-approved':portrait?'phone-ready':'tablet-ready';
   host.dataset.bc15Master=v16active?'v16-'+(portrait?'portrait':'landscape'):portrait?'portrait':'landscape';
   host.dataset.bc15CardArt=v16active?'approved-painted-ui':cleanLoaded?'clean-candidate':'locked-original';
   if(v16active){host.dataset.bc15Design='locked-v16';host.__bc16=v16active;}
   else{delete host.dataset.bc15Design;delete host.__bc16;host.querySelector('.bc16-reisen')?.remove();}
   const oldRow=host.querySelector('.bc14-subjects');
   if(oldRow){
    oldRow.inert=cleanLoaded;
    if(cleanLoaded)oldRow.setAttribute('aria-hidden','true');
    else oldRow.removeAttribute('aria-hidden');
   }
   syncLiveCopy(host);
   mapControlsToArtwork(host,image.width,image.height,portrait);

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
   clearV16Blob();delete host.dataset.bc15Design;delete host.__bc16;
   host.dataset.bc15Asset='missing';
   host.querySelectorAll('.bc15-live-copy,.bc15-live-next,.bc15-ambient,.bc15-boats').forEach(el=>el.remove());
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
