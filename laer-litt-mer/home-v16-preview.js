/* Læria Home v16 – guarded sign-navigation implementation on the LOCKED v15 art.
   No image bytes, mountain silhouettes, user state or learning routes are changed.
   Preview is opt-in until the baked-in bottom cards are removed from a separately
   verified, approved derived image (the originals must remain immutable). */
(()=>{
  'use strict';
  const enabled=new URLSearchParams(location.search).get('laria-home-v16-preview')==='1';
  if(!enabled)return;
  const entries=[
    ['norwegian','Norsk','Bokskogen'],
    ['math','Matte','Tallvika'],
    ['english','Engelsk','Ordlandsbyen'],
    ['geography','Geografi','Nordlysleiren']
  ];
  let pending=false;
  // Optional artwork handoff. This derived image is NOT an approved original.
  // It is deliberately absent until the reviewed file is separately transferred
  // into the draft PR. Until then, all formats retain the real v15 background.
  const CLEAN_ASSET='./assets/home-v16/kjosnes-home-desktop-clean-DRAFT.webp';
  const CLEAN_HASH='4efcf7783cd83e46a22cc1c51269039a309b8ba1400ee6eab6e478657e129ee0';
  let cleanUrl='',cleanStatus='not-loaded';
  async function loadCleanPreviewArt(){
    if(!crypto?.subtle){cleanStatus='digest-unavailable';return;}
    try{
      const response=await fetch(CLEAN_ASSET,{cache:'no-store'});
      if(!response.ok)throw new Error('not uploaded');
      const bytes=await response.arrayBuffer();
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const actual=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
      if(actual!==CLEAN_HASH)throw new Error('candidate integrity mismatch');
      const url=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
      const image=new Image();image.src=url;await image.decode();
      if(image.naturalWidth!==1127||image.naturalHeight!==681){
        URL.revokeObjectURL(url);throw new Error('unexpected candidate dimensions');
      }
      cleanUrl=url;cleanStatus='verified-preview-only';schedule();
    }catch(error){
      cleanStatus='not-available'; // Original v15 painting and interactions stay safe.
      if(/integrity|dimensions/.test(error.message))console.warn('[Læria Home v16] Rejected unexpected derived painting',error);
    }
  }
  const getHost=()=>document.querySelector('#home-screen .bc12');
  const inside=(host)=>host.classList.contains('bc15-locked-home')&&
    host.dataset.mode==='home'&&(!host.dataset.bc13View||host.dataset.bc13View==='home')&&
    !!document.querySelector('.grade-band-young');
  function remove(host){
    if(!host)return;
    host.classList.remove('bc16-left-signs-ready','bc16-clean-art-ready');
    host.querySelector('.bc16-sign-nav')?.remove();
    if(host.dataset.bc16Stage!=='not-ready')host.dataset.bc16Stage='not-ready';
  }
  function coordinate(host,prop){
    const n=Number.parseFloat(getComputedStyle(host).getPropertyValue(prop));
    return Number.isFinite(n)?n:0;
  }
  function relayout(){
    const host=getHost();
    if(!host||!inside(host)){remove(host);return;}
    const left=coordinate(host,'--bc15-art-left');
    const top=coordinate(host,'--bc15-art-top');
    const width=coordinate(host,'--bc15-art-width');
    const height=coordinate(host,'--bc15-art-height');
    const portrait=matchMedia('(orientation:portrait)').matches;
    // On the approved v15 LANDSCAPE master the four real wooden boards already
    // exist on the left. The portrait original contains no such boards.
    // Never pretend invisible buttons over the trolls are an approved phone UI.
    const enough=(!portrait)&&width>=950&&height>=600;
    if(!enough){
      remove(host);
      host.dataset.bc16Stage=portrait?'portrait-art-required':'small-landscape-art-required';
      return;
    }
    // The v15 master signpost occupies this measured rectangle.
    // New independent semantic buttons point to the EXISTING action handlers.
    const area={
      left:left+width*.037,
      top:top+height*.292,
      width:width*.164,
      height:height*.329
    };
    const hostRect=host.getBoundingClientRect();
    if(area.left<0||area.left+area.width>hostRect.width+1||
       area.top<0||area.top+area.height>hostRect.height+1||
       area.width<140||area.height/4<44){
      remove(host);
      host.dataset.bc16Stage='sign-geometry-not-ready';
      return;
    }
    let nav=host.querySelector('.bc16-sign-nav');
    if(!nav){
      nav=document.createElement('nav');
      nav.className='bc16-sign-nav';
      nav.setAttribute('aria-label','Velg fag fra treskiltene til venstre');
      for(const [key,label,world] of entries){
        const button=document.createElement('button');
        button.type='button';
        button.className='bc16-sign';
        button.dataset.bc16Subject=key;
        button.setAttribute('aria-label','Åpne '+label+', '+world);
        const text=document.createElement('span');
        text.className='bc16-sign-sr-only';
        text.textContent=label;
        button.append(text);
        button.addEventListener('click',()=>{
          if(!host.classList.contains('bc16-left-signs-ready'))return;
          // Reuse the v12-v15 action, no new routing or storage schema.
          host.querySelector('.bc14-subject[data-camp="subject-'+key+'"]')?.click();
        });
        nav.append(button);
      }
      host.append(nav);
    }
    const set=(prop,value)=>{
      const result=value.toFixed(2)+'px';
      if(nav.style.getPropertyValue(prop)!==result)nav.style.setProperty(prop,result);
    };
    set('left',area.left);set('top',area.top);
    set('width',area.width);set('height',area.height);
    host.classList.add('bc16-left-signs-ready');
    if(cleanUrl){
      // Reactivation of v15 can reset the background; reassert only when needed.
      const requested='url("'+cleanUrl+'")';
      if(host.style.getPropertyValue('--bc15-home-art')!==requested){
        host.style.setProperty('--bc15-home-art',requested);
      }
      host.classList.add('bc16-clean-art-ready');
    }else host.classList.remove('bc16-clean-art-ready');
    host.dataset.bc16CleanArt=cleanUrl?'verified-preview-only':cleanStatus;
    if(host.dataset.bc16Stage!=='navigation-pilot')host.dataset.bc16Stage='navigation-pilot';
    // The next journey remains a LIVE v12/v15 action. Never bake progress text
    // into artwork, or overwrite data-camp-next in the persisted learning model.
    const live=host.querySelector('.bc15-live-next');
    const journey=host.querySelector('.bc12-journey');
    if(live&&journey){
      live.id='bc16-live-journey-progress';
      if(journey.getAttribute('aria-describedby')!==live.id)journey.setAttribute('aria-describedby',live.id);
      if(cleanUrl){
        // The DRAFT artwork contains a locally repaired natural wooden plank,
        // so this is actual live lettering on wood, never another pasted strip.
        const name={norwegian:'Norsk',math:'Matte',english:'Engelsk',geography:'Geografi'}[host.dataset.journeySubject]||'Reisen';
        const title=host.querySelector('[data-camp-next]')?.textContent?.trim()||'';
        const active=/pågående/i.test(host.querySelector('[data-camp-next-type]')?.textContent||'');
        const text=(active?'Pågående':'Neste')+' · '+name+' · '+title;
        if(live.textContent!==text)live.textContent=text;
        const rect=[.122,.831,.195,.042];
        const [x,y,w,h]=rect;
        for(const [key,val] of [['left',left+width*x],['top',top+height*y],['width',width*w],['height',height*h]]){
          const value=val.toFixed(2)+'px';
          if(live.style.getPropertyValue(key)!==value)live.style.setProperty(key,value,'important');
        }
      }
    }
  }
  function schedule(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;relayout();});
  }
  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='childList'||
       (m.type==='attributes'&&m.target?.classList?.contains('bc12'))))schedule();
  });
  observer.observe(document.documentElement,{
    subtree:true,childList:true,attributes:true,
    attributeFilter:['class','style','data-mode','data-bc13-view']
  });
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
  loadCleanPreviewArt();
  window.LARIA_HOME_V16_PREVIEW=Object.freeze({enabled:true,version:'navigation-pilot2',
    get cleanArtStatus(){return cleanStatus;}});
})();