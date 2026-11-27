/* Læria Home v16: 2026-11-19 owner-approved, pixel-locked illustrated Home.
 * Images contain the exact visible UI the owner approved. Interactive,
 * keyboard-accessible controls are real DOM hit targets; do not re-render
 * a second logo/sign/nav on top of these painted elements.
 * No troll is painted into the scene. No child progress is changed here. */
(function(){
'use strict';
const MANIFEST='./assets/home-v16/laria-grovanova-v16-approved.json';
const MAC_WINGS=[
 {source:'./assets/home-v16/mac-wide/grovanova-left.webp',width:290,height:887,
  sha256:'a01cde5fe0c17d066535f2aade20b7c5fca2844f65a2ae8c18f3ddb3bea6f740'},
 {source:'./assets/home-v16/mac-wide/grovanova-right.webp',width:284,height:887,
  sha256:'8ffcfbbf91551de35e4bd17d3331b3ca580491613adb040974b7e894a5a3c4ea'}
];
const SUBJECTS=[['norwegian','Norsk','Bokskogen'],['math','Matte','Tallvika'],['english','Engelsk','Ordlandsbyen'],['geography','Geografi','Nordlysleiren']];
let activeUrl='';
let cachedManifest=null;
let manifestPromise=null;
let macWingsPromise=null;

// A Mac/desktop browser has no touch digitizer. This discriminates it from
// iPads with large viewports (and iPads connected to a trackpad), preserving
// the owner's existing iPad cover composition pixel for pixel.
function supportsDesktop(){
 return matchMedia('(min-width:1024px) and (min-height:650px)').matches &&
   (navigator.maxTouchPoints||0)===0 &&
   !('ontouchstart' in window) &&
   matchMedia('(hover:hover) and (pointer:fine)').matches;
}
function supportsPhone(){
 return matchMedia(
  '(max-width:600px) and (orientation:portrait), (min-width:540px) and (max-width:1050px) and (max-height:580px) and (orientation:landscape)'
 ).matches;
}
function phoneBox(host,image,portrait){
 const r=host.getBoundingClientRect();
 if(!portrait)return artBox(host,image.width,image.height,true);
 // Enlarge only by a single linear scale. Keep all four illustrated boards
 // and both journey buttons in frame; the footer is reframed separately.
 const width=Math.min(r.width*1.27,r.height*.75);
 const height=width*image.height/image.width;
 return {left:0,top:0,width,height,viewW:r.width,viewH:r.height};
}
function phoneTarget(el,box,part,railTop){
 if(!el)return;
 const [x,y,w,h]=part;
 const cx=box.left+box.width*(x+w/2),cy=box.top+box.height*(y+h/2);
 let width=Math.max(44,box.width*w),height=Math.max(44,box.height*h);
 let top=cy-height/2;
 // Disjoint vertical partition in the shortest view, while retaining every
 // painted button's center and giving each sign a 44px tap area.
 if(Number.isFinite(railTop)){top=railTop;height=44;}
 const left=Math.min(box.viewW-width,Math.max(0,cx-width/2));
 place(el,{left,top:Math.max(0,Math.min(box.viewH-height,top)),width,height},[0,0,1,1]);
}
function phoneFooter(host,box,ui){
 const nav=host.querySelector('.bc12-nav');
 if(!nav)return;
 const [x,y,w,h]=ui.nav;
 const width=Math.min(box.viewW-12,480),height=Math.max(48,Math.min(62,width*.135));
 const scaledW=width/w,scaledH=height/h;
 const top=box.viewH-height-10;
 place(nav,{left:(box.viewW-width)/2,top,width,height},[0,0,1,1]);
 host.style.setProperty('--bc15-phone-nav-size',scaledW+'px '+scaledH+'px');
 host.style.setProperty('--bc15-phone-nav-position',(-x*scaledW)+'px '+(-y*scaledH)+'px');
 const end=box.top+box.height*.861;
 host.style.setProperty('--bc15-phone-art-end',end+'px');
 // Sample an unpainted piece of the locked foreground garden. The scene
 // and its non-stretched core are not re-rendered or edited.
 const fillW=box.viewW/.216,fillH=fillW*2732/2048;
 host.style.setProperty('--bc15-phone-fill-top',(end-34)+'px');
 host.style.setProperty('--bc15-phone-fill-size',fillW+'px '+fillH+'px');
 host.style.setProperty('--bc15-phone-fill-position',(-.784*fillW)+'px '+(-.744*fillH)+'px');
}
function unitRect(r){
 return Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&
 r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&r[0]+r[2]<=1&&r[1]+r[3]<=1;
}
function approved(variant,orientation){
 if(!variant||typeof variant!=='object')return false;
 if(variant.source!=='./assets/home-v16/laria-grovanova-v16-'+orientation+'.webp')return false;
 if(!/^[a-f0-9]{64}$/i.test(variant.sha256||''))return false;
 if(variant.width!==2048||variant.height!==(orientation==='portrait'?2732:1536))return false;
 if(!variant.ui||!['reisen','journey','nav','greeting','adult'].every(k=>unitRect(variant.ui[k])))return false;
 return Array.isArray(variant.ui.signBoards)&&variant.ui.signBoards.length===4&&variant.ui.signBoards.every(unitRect);
}
async function metadata(){
 if(!manifestPromise){
  manifestPromise=fetch(MANIFEST,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
 }
 const m=await manifestPromise;
 if(!m||m.status!=='approved'||m.presentation!=='painted-visual-dom-actions')return null;
 cachedManifest=m;
 return m;
}
async function verifiedImage(v,signal){
 if(!crypto?.subtle)return null;
 const response=await fetch(v.source,{cache:'no-store',signal});
 if(!response.ok)throw Error('v16 image missing');
 const bytes=await response.arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
  x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==v.sha256)throw Error('v16 image SHA mismatch');
 const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
 try{
  const image=await new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('v16 decode error'));img.src=url;
  });
  if(image.naturalWidth!==v.width||image.naturalHeight!==v.height)
   throw Error('v16 pixel dimensions mismatch');
  return {url,width:image.naturalWidth,height:image.naturalHeight};
 }catch(e){URL.revokeObjectURL(url);throw e;}
}
function verifiedMacWings(){
 if(!macWingsPromise){
  // Verify both images before enabling the overlay. A slow or missing wing
  // must not keep the approved center from opening.
  const controller=new AbortController();
  let timer;
  const timeout=new Promise(resolve=>{
   timer=setTimeout(()=>{controller.abort();resolve(null);},1800);
  });
  const decode=Promise.allSettled(MAC_WINGS.map(v=>verifiedImage(v,controller.signal)))
   .then(results=>{
    const verified=results.map(r=>r.status==='fulfilled'?r.value:null);
    if(!controller.signal.aborted&&verified.every(Boolean))return verified.map(image=>image.url);
    verified.forEach(image=>{if(image)URL.revokeObjectURL(image.url);});
    return null;
   });
  macWingsPromise=Promise.race([decode,timeout]).then(urls=>{
   clearTimeout(timer);
   if(!urls)macWingsPromise=null;
   return urls;
  });
 }
 return macWingsPromise;
}
function wantsMacWide(host,desktop,portrait,params){
 const frame=host.closest('#home-screen')?.getBoundingClientRect();
 const ratio=frame?frame.width/frame.height:0;
 return desktop&&!portrait&&ratio>4/3&&ratio<=2&&params.get('lariaMacWide')!=='0';
}
function setMacWide(host,urls){
 for(const [i,side] of ['left','right'].entries()){
  if(urls)host.style.setProperty('--bc15-mac-wing-'+side,'url("'+urls[i]+'")');
  else host.style.removeProperty('--bc15-mac-wing-'+side);
 }
 host.toggleAttribute('data-bc15-v16-mac-wide',!!urls);
}
function artBox(host,imgW,imgH,desktop){
 const r=host.getBoundingClientRect();
 // Desktop "contain" preserves every painted pixel and keeps all live hit
 // regions aligned. iPad remains EXACTLY the already approved "cover" fit.
 const scale=desktop?Math.min(r.width/imgW,r.height/imgH):
   Math.max(r.width/imgW,r.height/imgH);
 const width=imgW*scale,height=imgH*scale;
 return {left:(r.width-width)/2,top:(r.height-height)/2,width,height,viewW:r.width,viewH:r.height};
}
function place(el,box,part){
 if(!el)return;
 const [x,y,w,h]=part;
 const left=box.left+box.width*x,top=box.top+box.height*y;
 const width=box.width*w,height=box.height*h;
 for(const [prop,value] of Object.entries({left,top,width,height}))
  el.style.setProperty(prop,value+'px','important');
 el.style.setProperty('right','auto','important');
 el.style.setProperty('bottom','auto','important');
}
function ensureSigns(host){
 let nav=host.querySelector('.bc15-v16-signs');
 if(nav)return nav;
 nav=document.createElement('nav');
 nav.className='bc15-v16-signs';
 nav.setAttribute('aria-label','Velg fagreise');
 SUBJECTS.forEach(([id,label,world])=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='bc15-v16-sign';
  button.dataset.bc15Subject=id;
  button.setAttribute('aria-label','Åpne '+label+' – '+world);
  button.addEventListener('click',()=>{
   if(typeof window.LARIA_HOME_OPEN_SUBJECT==='function')window.LARIA_HOME_OPEN_SUBJECT(id);
   else host.querySelector('.bc14-subject[data-camp="subject-'+id+'"]')?.click();
  });
  nav.appendChild(button);
 });
 host.appendChild(nav);
 return nav;
}
function openJourneyOverview(host){
 let dlg=document.getElementById('bc15-v16-journey-dialog');
 if(!dlg){
  dlg=document.createElement('dialog');
  dlg.id='bc15-v16-journey-dialog';
  dlg.className='bc15-v16-dialog';
  dlg.setAttribute('aria-label','Reisen – velg fagreise');
  const close=document.createElement('button');
  close.type='button';
  close.className='bc15-v16-dialog-close';
  close.setAttribute('aria-label','Lukk reiseoversikten');
  close.textContent='×';
  close.addEventListener('click',()=>dlg.close());
  const heading=document.createElement('h2');heading.textContent='Reisen';
  const intro=document.createElement('p');intro.textContent='Hvor vil du dra?';
  const choices=document.createElement('div');choices.className='bc15-v16-journey-choices';
  for(const [id,label,world] of SUBJECTS){
   const b=document.createElement('button');b.type='button';
   b.textContent=label+' · '+world;
   b.addEventListener('click',()=>{
    dlg.close();
    if(typeof window.LARIA_HOME_OPEN_SUBJECT==='function')window.LARIA_HOME_OPEN_SUBJECT(id);
    else host.querySelector('.bc14-subject[data-camp="subject-'+id+'"]')?.click();
   });
   choices.appendChild(b);
  }
  dlg.append(close,heading,intro,choices);
  document.body.appendChild(dlg);
 }
 if(!dlg.open)dlg.showModal();
}
function ensureReisen(host){
 let b=host.querySelector('.bc15-v16-reisen');
 if(b)return b;
 b=document.createElement('button');
 b.type='button';b.className='bc15-v16-reisen';
 b.setAttribute('aria-label','Reisen – velg fagreise');
 b.addEventListener('click',()=>openJourneyOverview(host));
 host.appendChild(b);
 return b;
}
function ensureGreeting(host){
 let block=host.querySelector('.bc15-v16-greeting');
 if(block)return block;
 block=document.createElement('div');block.className='bc15-v16-greeting';
 const heading=document.createElement('strong');heading.className='bc15-v16-greeting-name';
 const intro=document.createElement('span');intro.textContent='Klar for et nytt eventyr?';
 block.append(heading,intro);
 host.appendChild(block);
 return block;
}
function syncGreeting(host){
 const name=host.querySelector('.bc12-heading h1')?.textContent?.trim()||'Hei, eventyrer!';
 const label=host.querySelector('.bc15-v16-greeting-name');
 if(label){
  label.textContent=name;
  label.parentElement.toggleAttribute('data-long-greeting',Array.from(name).length>19);
 }
}

function syncTroll(host){
 const actor=host?.querySelector('.bc15-v16-troll');
 if(!actor)return;
 const companion=window.LARIA_TROLL_ACTOR;
 const id=companion?.choice?.()||'storesoster';
 const src=companion?.source?.(id)||'./assets/gangemagi-troll/storesoster.webp';
 const label=companion?.label?.(id)||'Storesøster';
 const img=actor.querySelector('img');
 actor.dataset.troll=id;
 actor.setAttribute('aria-label',label+' er med deg. Trykk for å si hei.');
 if(img&&img.getAttribute('src')!==src)img.setAttribute('src',src);
 if(img)img.dataset.troll=id;
}
function ensureTroll(host){
 let actor=host.querySelector('.bc15-v16-troll');
 if(!actor){
  // One living DOM character, never baked into the owner's locked artwork.
  actor=document.createElement('button');
  actor.type='button';
  actor.className='bc15-v16-troll laria-troll-host laria-troll-actor';
  actor.dataset.lariaTrollMood='idle';
  const img=document.createElement('img');
  img.className='laria-premium-troll-art';
  img.alt='';
  img.loading='eager';
  img.decoding='async';
  img.setAttribute('aria-hidden','true');
  actor.appendChild(img);
  actor.addEventListener('click',()=>window.LARIA_TROLL_ACTOR?.mood?.(actor,'wave',{say:false}));
  host.appendChild(actor);
 }
 syncTroll(host);
 return actor;
}
function reset(host){
 host?.classList.remove('bc15-v16-locked');
 host?.removeAttribute('data-bc15-v16-orientation');
 host?.removeAttribute('data-bc15-v16-device');
 if(host)setMacWide(host,null);
 host?.querySelectorAll('.bc15-v16-signs,.bc15-v16-reisen,.bc15-v16-greeting,.bc15-v16-troll')
  .forEach(node=>node.remove());
 const dialog=document.getElementById('bc15-v16-journey-dialog');
 if(dialog?.open)dialog.close();
 if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl='';}
}
async function activate(host,{portrait,isCurrent}){
 // Isolated legacy-renderer tests only. Never set by the app itself.
 if(window.__LARIA_QA_SKIP_V16===true)return false;
 // This owner-approved scene is the DEFAULT iPad Home once this PR is
 // explicitly merged. It remains completely absent from production until then.
 // ?lariaV16=0 is an opt-out for legacy-regression QA, not a requirement
 // children must discover to see their approved Home. Failure still falls back
 // to the unmodified SHA-locked v15 master.
 const params=new URLSearchParams(location.search);
 if(params.get('lariaV16')==='0')return false;
 const desktop=supportsDesktop();
 const phone=supportsPhone();
 const ipad=window.matchMedia('(min-width:768px) and (max-width:1366px) and (min-height:650px)').matches;
 if(!host||!(ipad||desktop||phone))return false;
 const device=desktop?'desktop':phone?'phone':'ipad';
 const orientation=portrait?'portrait':'landscape';
 const m=await metadata();
 const v=m?.variants?.[orientation];
 if(!approved(v,orientation)||!isCurrent())return false;
 const phoneWide=phone&&!portrait;
 const wideRequest=phoneWide||wantsMacWide(host,desktop,portrait,params)?verifiedMacWings():null;
 let image;
 try{image=await verifiedImage(v);}catch(error){console.warn('[Læria Home v16] Approved art failed integrity; retaining locked fallback.',error);return false;}
 const wings=wideRequest?await wideRequest:null;
 if(!image)return false;
 if(!isCurrent()){URL.revokeObjectURL(image.url);return false;}
 // Every replacement and its layout changes together, after verified decode.
 const old=activeUrl;
 activeUrl=image.url;
 host.style.setProperty('--bc15-home-art','url("'+image.url+'")');
 host.classList.add('bc15-locked-home','bc15-capable','bc15-v16-locked');
 host.classList.remove('bc15-pending','bc15-fallback','bc15-landscape-bleed','bc15-ipad-fagmenu','bc15-phone-fagmenu');
 host.dataset.bc15Asset=device+'-v16-'+orientation;
 host.dataset.bc15Master=device+'-v16-'+orientation;
 host.dataset.bc15CardArt='owner-approved-v16-painted';
 host.dataset.bc15PremiumArt='owner-approved-layout';
 host.dataset.bc15Fit=desktop?'approved-contain':'approved-cover';
 host.dataset.bc15V16Orientation=orientation;
 host.dataset.bc15V16Device=device;
 const oldSubjectRow=host.querySelector('.bc14-subjects');
 if(oldSubjectRow){oldSubjectRow.inert=true;oldSubjectRow.setAttribute('aria-hidden','true');}
 host.querySelector('.bc15-subject-signs')?.setAttribute('hidden','');
 host.querySelector('.bc15-approved-logo')?.remove();
 host.querySelector('.bc15-boats')?.remove();
 // Approved side art changes only the surrounding stage. The center and
 // every painted hitbox remain in the original coordinate space.
 setMacWide(host,wings&&(phoneWide||wantsMacWide(host,desktop,portrait,params))?wings:null);
 const box=phone?phoneBox(host,image,portrait):artBox(host,image.width,image.height,desktop);
 if(phoneWide)host.style.setProperty('--bc15-phone-wing-width',Math.max(0,box.left)+'px');
 host.style.setProperty('--bc15-art-left',box.left+'px');
 host.style.setProperty('--bc15-art-top',box.top+'px');
 host.style.setProperty('--bc15-art-width',box.width+'px');
 host.style.setProperty('--bc15-art-height',box.height+'px');
 const viewport={width:box.viewW,height:box.viewH};
 const signs=ensureSigns(host);
 const first=v.ui.signBoards[0],last=v.ui.signBoards[3];
 const roomBetween=box.height*(last[1]+last[3]/2-first[1]-first[3]/2);
 const stride=Math.max(44,roomBetween/3);
 const railTop=Math.max(4,box.top+box.height*(first[1]+first[3]/2)-22-(stride*3-roomBetween)/2);
 [...signs.querySelectorAll('button')].forEach((b,index)=>phone?phoneTarget(b,box,v.ui.signBoards[index],railTop+index*stride):place(b,box,v.ui.signBoards[index]));
 const reisen=ensureReisen(host);
 if(phone)phoneTarget(reisen,box,v.ui.reisen);else place(reisen,box,v.ui.reisen);
 const journey=host.querySelector('.bc12-journey');
 if(phone)phoneTarget(journey,box,v.ui.journey);else place(journey,box,v.ui.journey);
 const nav=host.querySelector('.bc12-nav');
 if(phone&&portrait)phoneFooter(host,box,v.ui);else place(nav,box,v.ui.nav);
 const adult=host.querySelector('.bc12-adult-entry');
 // The adult hold entry is not painted. Keep it genuinely circular and
 // at least 44px, completely inside EVERY iPad crop including 820x1180.
 if(adult){
  if(desktop){
   // Keep adult access on the same visible image instead of in a side band.
   place(adult,box,v.ui.adult);
   adult.style.setProperty('width',Math.max(46,box.width*v.ui.adult[2])+'px','important');
   adult.style.setProperty('height',Math.max(46,box.height*v.ui.adult[3])+'px','important');
  }else{
   const edge=16,size=46;
   for(const [name,value] of Object.entries({
     left:Math.max(edge,box.viewW-edge-size),top:edge,width:size,height:size
   }))adult.style.setProperty(name,value+'px','important');
   adult.style.setProperty('right','auto','important');
   adult.style.setProperty('bottom','auto','important');
  }
 }
 const greeting=ensureGreeting(host);
 place(greeting,box,v.ui.greeting);
 syncGreeting(host);
 const troll=ensureTroll(host);
 if(desktop||phone){
  // Troll is a separate live DOM actor. Anchor it to the visible scene
  // above the illustrated footer, not to the desktop browser window.
  const [x,ground]=phone&&portrait?[.574,.628]:portrait?[.745,.82]:[.765,.79];
  const anchorX=box.left+box.width*x;
  const anchorY=box.top+box.height*ground;
  troll.style.setProperty('left',anchorX+'px','important');
  troll.style.setProperty('top','calc('+anchorY+'px - var(--laria-front-troll-height))','important');
 }
 if(old&&old!==activeUrl)URL.revokeObjectURL(old);
 return true;
}
document.addEventListener('laria:troll-changed',()=>{
 const home=document.querySelector('#home-screen .bc12.bc15-v16-locked');
 if(home)syncTroll(home);
});
window.LARIA_HOME_V16={activate,deactivate:reset,supportsDesktop,supportsPhone,syncGreeting,readOnlyManifest:()=>cachedManifest};
})();