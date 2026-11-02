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
  let cleanUrl='',cleanStatus='not-loaded',cleanFailure='';
  async function loadCleanPreviewArt(){
    if(typeof crypto==='undefined'||!crypto.subtle){cleanStatus='digest-unavailable';cleanFailure='WebCrypto subtle digest unavailable in current context';schedule();return;}
    try{
      const response=await fetch(CLEAN_ASSET,{cache:'no-store'});
      if(!response.ok)throw new Error('not uploaded');
      const bytes=await response.arrayBuffer();
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const actual=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
      if(actual!==CLEAN_HASH)throw new Error('candidate integrity mismatch');
      // The app CSP intentionally does not allow blob: image URLs. After the
      // exact same-origin file has passed SHA-256 verification, decode and use
      // that repository URL directly instead of creating a blocked blob URL.
      const image=new Image();image.src=CLEAN_ASSET;await image.decode();
      if(image.naturalWidth!==1127||image.naturalHeight!==681){
        throw new Error('unexpected candidate dimensions');
      }
      cleanUrl=CLEAN_ASSET;cleanStatus='verified-preview-only';cleanFailure='';schedule();
    }catch(error){
      cleanStatus='not-available'; // Original v15 painting and interactions stay safe.
      cleanFailure=(error&&error.name?error.name+': ':'')+(error&&error.message||'unknown clean-art failure');
      console.warn('[Læria Home v16] Clean derivative unavailable; locked original retained.',cleanFailure);
      schedule();
    }
  }
  const getHost=()=>document.querySelector('#home-screen .bc12');
  const inside=(host)=>host.classList.contains('bc15-locked-home')&&
    host.dataset.mode==='home'&&(!host.dataset.bc13View||host.dataset.bc13View==='home')&&
    !!document.querySelector('.grade-band-young');
  function remove(host){
    if(!host)return;
    host.classList.remove('bc16-left-signs-ready','bc16-clean-art-ready','bc16-portrait-ready');
    host.querySelector('.bc16-sign-nav')?.remove();
    host.querySelector('.bc16-portrait-deck')?.remove();
    if(host.dataset.bc16Stage!=='not-ready')host.dataset.bc16Stage='not-ready';
  }
  function coordinate(host,prop){
    const n=Number.parseFloat(getComputedStyle(host).getPropertyValue(prop));
    return Number.isFinite(n)?n:0;
  }
  function makeSignButton(host,key,label,world,portrait){
    const button=document.createElement('button');
    button.type='button';
    button.className='bc16-sign';
    button.dataset.bc16Subject=key;
    button.setAttribute('aria-label','Åpne '+label+', '+world);
    if(portrait){
      const icon=document.createElement('span');
      icon.className='bc16-sign-icon';
      icon.setAttribute('aria-hidden','true');
      const source=host.querySelector('.bc14-subject[data-camp="subject-'+key+'"] .bc14-emblem');
      if(source)icon.innerHTML=source.innerHTML;
      const copy=document.createElement('span');
      copy.className='bc16-sign-copy';
      const strong=document.createElement('strong');strong.textContent=label;
      const small=document.createElement('small');small.textContent=world;
      copy.append(strong,small);
      button.append(icon,copy);
    }else{
      const text=document.createElement('span');
      text.className='bc16-sign-sr-only';
      text.textContent=label;
      button.append(text);
    }
    button.addEventListener('click',()=>{
      if(!host.classList.contains('bc16-left-signs-ready')&&!host.classList.contains('bc16-portrait-ready'))return;
      host.querySelector('.bc14-subject[data-camp="subject-'+key+'"]')?.click();
    });
    return button;
  }
  function ensureSignNav(host,portrait){
    let nav=host.querySelector('.bc16-sign-nav');
    const wanted=portrait?'bc16-sign-nav-portrait':'bc16-sign-nav-wide';
    if(nav&&!nav.classList.contains(wanted)){nav.remove();nav=null;}
    if(!nav){
      nav=document.createElement('nav');
      nav.className='bc16-sign-nav '+wanted;
      nav.setAttribute('aria-label',portrait?'Velg fag fra treskiltene':'Velg fag fra treskiltene til venstre');
      for(const [key,label,world] of entries)nav.append(makeSignButton(host,key,label,world,portrait));
      host.append(nav);
    }
    return nav;
  }
  function mountPortraitPilot(host){
    const rect=host.getBoundingClientRect();
    if(rect.width<320||rect.height<620){
      remove(host);host.dataset.bc16Stage='portrait-space-not-ready';return false;
    }
    let deck=host.querySelector('.bc16-portrait-deck');
    if(!deck){
      deck=document.createElement('div');
      deck.className='bc16-portrait-deck';
      deck.setAttribute('aria-hidden','true');
      host.append(deck);
    }
    const tablet=rect.width>=700;
    const deckTop=rect.height*(tablet?.50:.535);
    const deckBottom=rect.height;
    for(const [key,val] of [['left',0],['top',deckTop],['width',rect.width],['height',Math.max(0,deckBottom-deckTop)]]){
      deck.style.setProperty(key,val.toFixed(2)+'px');
    }
    const nav=ensureSignNav(host,true);
    const navLeft=rect.width*(tablet?.075:.06);
    const navTop=rect.height*(tablet?.635:.605);
    const navWidth=Math.min(rect.width*(tablet?.79:.88),760);
    const navHeight=Math.min(rect.height*(tablet?.225:.22),300);
    for(const [key,val] of [['left',navLeft],['top',navTop],['width',navWidth],['height',navHeight]]){
      nav.style.setProperty(key,val.toFixed(2)+'px');
    }
    const journey=host.querySelector('.bc12-journey');
    if(journey){
      const jLeft=rect.width*(tablet?.075:.06);
      const jTop=rect.height*(tablet?.535:.515);
      const jWidth=Math.min(rect.width*(tablet?.63:.88),680);
      const jHeight=Math.min(rect.height*(tablet?.075:.075),96);
      for(const [key,val] of [['left',jLeft],['top',jTop],['width',jWidth],['height',jHeight]]){
        journey.style.setProperty(key,val.toFixed(2)+'px','important');
      }
      journey.style.setProperty('right','auto','important');
      journey.style.setProperty('bottom','auto','important');
    }
    host.classList.remove('bc16-left-signs-ready','bc16-clean-art-ready');
    host.classList.add('bc16-portrait-ready');
    host.dataset.bc16CleanArt='portrait-locked-master';
    host.dataset.bc16Stage='portrait-navigation-pilot';
    return true;
  }
  function relayout(){
    const host=getHost();
    if(!host||!inside(host)){remove(host);return;}
    const firstPreviewMount=!host.classList.contains('bc16-preview-enabled');
    host.classList.add('bc16-preview-enabled');
    // Basecamp v12 has a historical 720px minimum height on >700px widths.
    // A modern phone in landscape can therefore render a scene almost twice
    // the visible viewport height. V16 fixes only the opt-in preview and asks
    // v15 to remap its existing hit areas once after the height contract changes.
    if(firstPreviewMount&&matchMedia('(orientation:landscape) and (max-height:580px)').matches){
      requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
    }
    const left=coordinate(host,'--bc15-art-left');
    const top=coordinate(host,'--bc15-art-top');
    const width=coordinate(host,'--bc15-art-width');
    const height=coordinate(host,'--bc15-art-height');
    const portrait=matchMedia('(orientation:portrait)').matches;
    if(portrait){
      mountPortraitPilot(host);
      return;
    }
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
    const nav=ensureSignNav(host,false);
    const set=(prop,value)=>{
      const result=value.toFixed(2)+'px';
      if(nav.style.getPropertyValue(prop)!==result)nav.style.setProperty(prop,result);
    };
    set('left',area.left);set('top',area.top);
    set('width',area.width);set('height',area.height);
    host.classList.add('bc16-left-signs-ready');
    const subjectNames={norwegian:'Norsk',math:'Matte',english:'Engelsk',geography:'Geografi'};
    const subjectName=subjectNames[host.dataset.journeySubject]||'';
    // A cleaned board is not ready until the real journey subject is available.
    // This prevents a browser-speed race from ever painting a generic fallback
    // such as "Reisen" where live subject progress belongs.
    const cleanReady=Boolean(cleanUrl&&subjectName);
    if(cleanReady){
      // Reactivation of v15 can reset the background; reassert only when needed.
      const requested='url("'+cleanUrl+'")';
      if(host.style.getPropertyValue('--bc15-home-art')!==requested){
        host.style.setProperty('--bc15-home-art',requested);
      }
      host.classList.add('bc16-clean-art-ready');
    }else host.classList.remove('bc16-clean-art-ready');
    host.dataset.bc16CleanArt=cleanReady?'verified-preview-only':(cleanUrl?'journey-state-pending':cleanStatus);
    if(host.dataset.bc16Stage!=='navigation-pilot')host.dataset.bc16Stage='navigation-pilot';
    // The next journey remains a LIVE v12/v15 action. Never bake progress text
    // into artwork, or overwrite data-camp-next in the persisted learning model.
    const live=host.querySelector('.bc15-live-next');
    const journey=host.querySelector('.bc12-journey');
    if(live&&journey){
      live.id='bc16-live-journey-progress';
      if(journey.getAttribute('aria-describedby')!==live.id)journey.setAttribute('aria-describedby',live.id);
      if(cleanReady){
        // The DRAFT artwork contains a locally repaired natural wooden plank,
        // so this is actual live lettering on wood, never another pasted strip.
        const title=host.querySelector('[data-camp-next]')?.textContent?.trim()||'';
        const active=/pågående/i.test(host.querySelector('[data-camp-next-type]')?.textContent||'');
        const text=(active?'Pågående':'Neste')+' · '+subjectName+' · '+title;
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
    // v15 still owns the base live-copy component and may refresh it after renderAll.
    // Reassert the v16 subject copy in the same microtask so users never see a
    // one-frame fallback without the real subject name.
    const liveChanged=mutations.some(m=>{
      if(m.type!=='childList'&&m.type!=='characterData')return false;
      const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
      return !!el?.closest?.('.bc15-live-next');
    });
    if(liveChanged){relayout();return;}
    if(mutations.some(m=>m.type==='childList'||
       (m.type==='attributes'&&m.target?.classList?.contains('bc12'))))schedule();
  });
  observer.observe(document.documentElement,{
    subtree:true,childList:true,characterData:true,attributes:true,
    attributeFilter:['class','style','data-mode','data-bc13-view','data-journey-subject']
  });
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
  loadCleanPreviewArt();
  window.LARIA_HOME_V16_PREVIEW=Object.freeze({enabled:true,version:'navigation-pilot2',
    get cleanArtStatus(){return cleanStatus;},get cleanArtError(){return cleanFailure;}});
})();