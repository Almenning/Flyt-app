/* Læria Home v16: 2026-11-19 owner-approved, pixel-locked illustrated Home.
 * Images contain the exact visible UI the owner approved. Interactive,
 * keyboard-accessible controls are real DOM hit targets; do not re-render
 * a second logo/sign/nav on top of these painted elements.
 * No troll is painted into the scene. No child progress is changed here. */
(function(){
'use strict';
const MANIFEST='./assets/home-v16/laria-grovanova-v16-approved.json';
const SUBJECTS=[['norwegian','Norsk','Bokskogen'],['math','Matte','Tallvika'],['english','Engelsk','Ordlandsbyen'],['geography','Geografi','Nordlysleiren']];
let activeUrl='';
let cachedManifest=null;
let manifestPromise=null;

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
async function verifiedImage(v){
 if(!crypto?.subtle)return null;
 const response=await fetch(v.source,{cache:'no-store'});
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
function coverBox(host,imgW,imgH,portrait){
 const r=host.getBoundingClientRect();
 const scale=Math.max(r.width/imgW,r.height/imgH);
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
 if(label)label.textContent=name;
}
function reset(host){
 host?.classList.remove('bc15-v16-locked');
 host?.removeAttribute('data-bc15-v16-orientation');
 host?.querySelectorAll('.bc15-v16-signs,.bc15-v16-reisen,.bc15-v16-greeting')
  .forEach(node=>node.remove());
 const dialog=document.getElementById('bc15-v16-journey-dialog');
 if(dialog?.open)dialog.close();
 if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl='';}
}
async function activate(host,{portrait,isCurrent}){
 // Isolated legacy-renderer tests only. Never set by the app itself.
 if(window.__LARIA_QA_SKIP_V16===true)return false;
 // Separate owner-approved PR preview. Old Home remains the production baseline
 // until exact-device QA and explicit merge/publication permission are complete.
 if(new URLSearchParams(location.search).get('lariaV16')!=='1')return false;
 if(!host||!window.matchMedia('(min-width:768px) and (max-width:1366px) and (min-height:650px)').matches)return false;
 const orientation=portrait?'portrait':'landscape';
 const m=await metadata();
 const v=m?.variants?.[orientation];
 if(!approved(v,orientation)||!isCurrent())return false;
 let image;
 try{image=await verifiedImage(v);}catch(error){console.warn('[Læria Home v16] Approved art failed integrity; retaining locked fallback.',error);return false;}
 if(!isCurrent()){URL.revokeObjectURL(image.url);return false;}
 // Every replacement and its layout changes together, after verified decode.
 const old=activeUrl;
 activeUrl=image.url;
 host.style.setProperty('--bc15-home-art','url("'+image.url+'")');
 host.classList.add('bc15-locked-home','bc15-capable','bc15-v16-locked');
 host.classList.remove('bc15-pending','bc15-fallback','bc15-landscape-bleed','bc15-ipad-fagmenu','bc15-phone-fagmenu');
 host.dataset.bc15Asset='ipad-v16-'+orientation;
 host.dataset.bc15Master='ipad-v16-'+orientation;
 host.dataset.bc15CardArt='owner-approved-v16-painted';
 host.dataset.bc15PremiumArt='owner-approved-layout';
 host.dataset.bc15Fit='approved-cover';
 host.dataset.bc15V16Orientation=orientation;
 const oldSubjectRow=host.querySelector('.bc14-subjects');
 if(oldSubjectRow){oldSubjectRow.inert=true;oldSubjectRow.setAttribute('aria-hidden','true');}
 host.querySelector('.bc15-subject-signs')?.setAttribute('hidden','');
 host.querySelector('.bc15-approved-logo')?.remove();
 host.querySelector('.bc15-boats')?.remove();
 const box=coverBox(host,image.width,image.height,portrait);
 host.style.setProperty('--bc15-art-left',box.left+'px');
 host.style.setProperty('--bc15-art-top',box.top+'px');
 host.style.setProperty('--bc15-art-width',box.width+'px');
 host.style.setProperty('--bc15-art-height',box.height+'px');
 const viewport={width:box.viewW,height:box.viewH};
 const signs=ensureSigns(host);
 [...signs.querySelectorAll('button')].forEach((b,index)=>place(b,box,v.ui.signBoards[index]));
 place(ensureReisen(host),box,v.ui.reisen);
 const journey=host.querySelector('.bc12-journey');
 place(journey,box,v.ui.journey);
 const nav=host.querySelector('.bc12-nav');
 place(nav,box,v.ui.nav);
 place(host.querySelector('.bc12-adult-entry'),box,v.ui.adult);
 const greeting=ensureGreeting(host);
 place(greeting,box,v.ui.greeting);
 syncGreeting(host);
 if(old&&old!==activeUrl)URL.revokeObjectURL(old);
 return true;
}
window.LARIA_HOME_V16={activate,deactivate:reset,syncGreeting,readOnlyManifest:()=>cachedManifest};
})();