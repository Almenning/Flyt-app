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
    host.classList.remove('bc16-left-signs-ready','bc16-clean-art-ready','bc16-portrait-ready','bc16-small-landscape-ready','bc16-tablet-landscape-cap-ready','bc16-tablet-cover-ready');
    host.querySelector('.bc16-sign-nav')?.remove();
    host.querySelector('.bc16-portrait-deck')?.remove();
    host.querySelector('.bc16-portrait-ui')?.remove();
    host.querySelector('.bc16-small-landscape-art')?.remove();
    host.querySelector('.bc16-small-landscape-ui')?.remove();
    host.querySelector('.bc16-tablet-landscape-cap')?.remove();
    host.querySelector('.bc16-tablet-landscape-art')?.remove();
    host.querySelector('.bc16-tablet-nav-cover')?.remove();
    host.querySelector('.bc16-tablet-ui')?.remove();
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
    const artLeft=coordinate(host,'--bc15-art-left');
    const artTop=coordinate(host,'--bc15-art-top');
    const artWidth=coordinate(host,'--bc15-art-width');
    const artHeight=coordinate(host,'--bc15-art-height');
    const legacyCopy=host.querySelector('.bc15-live-copy');
    let portraitUi=host.querySelector('.bc16-portrait-ui');
    if(!portraitUi){
      portraitUi=document.createElement('div');
      portraitUi.className='bc16-portrait-ui';
      portraitUi.setAttribute('aria-hidden','true');
      const copy=document.createElement('div');
      copy.className='bc16-portrait-copy';
      const greeting=document.createElement('strong');
      greeting.className='bc16-portrait-greeting';
      const intro=document.createElement('span');
      intro.className='bc16-portrait-intro';
      copy.append(greeting,intro);
      portraitUi.append(copy);
      host.append(portraitUi);
    }
    const greetingText=legacyCopy?.querySelector('.bc15-live-greeting')?.textContent?.trim()||'Hei!';
    const introText=legacyCopy?.querySelector('.bc15-live-intro')?.textContent?.trim()||'Klar for et nytt eventyr?';
    portraitUi.querySelector('.bc16-portrait-greeting').textContent=greetingText;
    portraitUi.querySelector('.bc16-portrait-intro').textContent=introText;
    if(legacyCopy)legacyCopy.style.setProperty('display','none','important');
    // The baked greeting occupies only the compact text block in the locked
    // phone master. Keep the live replacement on that exact region so the
    // mountain and sun stay visible instead of being covered by a giant sky patch.
    const pLeft=Math.max(0,artLeft+artWidth*.072);
    const pTop=Math.max(0,artTop+artHeight*.148);
    const pWidth=Math.min(rect.width-pLeft,artWidth*.565);
    const pHeight=Math.min(rect.height-pTop,artHeight*.105);
    const portraitCopy=portraitUi.querySelector('.bc16-portrait-copy');
    for(const [key,val] of [['left',pLeft],['top',pTop],['width',pWidth],['height',pHeight]]){
      portraitCopy.style.setProperty(key,val.toFixed(2)+'px','important');
    }
    const navLeft=rect.width*(tablet?.075:.06);
    const navWidth=Math.min(rect.width*(tablet?.79:.88),760);
    const bottomNav=host.querySelector('.bc12-nav');
    const bottomNavTop=bottomNav?bottomNav.getBoundingClientRect().top-rect.top:rect.height*.91;
    const safeGap=Math.max(9,rect.height*.012);
    // Phone geometry is anchored to the real bottom navigation instead of a
    // percentage guess. Four 44px targets + row gaps always fit with clearance.
    const navHeight=tablet?Math.min(rect.height*.225,300):Math.min(Math.max(198,rect.height*.22),220);
    const navTop=tablet?rect.height*.635:Math.max(rect.height*.50,bottomNavTop-navHeight-safeGap);
    for(const [key,val] of [['left',navLeft],['top',navTop],['width',navWidth],['height',navHeight]]){
      nav.style.setProperty(key,val.toFixed(2)+'px');
    }
    const journey=host.querySelector('.bc12-journey');
    if(journey){
      const jLeft=rect.width*(tablet?.075:.06);
      const jWidth=Math.min(rect.width*(tablet?.63:.88),680);
      const jHeight=Math.min(rect.height*(tablet?.075:.075),96);
      const jTop=tablet?rect.height*.535:Math.max(rect.height*.405,navTop-jHeight-safeGap*1.35);
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
  function mountTabletLandscapePilot(host){
    const rect=host.getBoundingClientRect();
    const subjectNames={norwegian:'Norsk',math:'Matte',english:'Engelsk',geography:'Geografi'};
    const subjectName=subjectNames[host.dataset.journeySubject]||'';
    if(!cleanUrl||!subjectName){
      remove(host);
      host.dataset.bc16CleanArt=cleanUrl?'journey-state-pending':cleanStatus;
      host.dataset.bc16Stage='tablet-landscape-art-pending';
      return false;
    }
    const scale=rect.height/681;
    const displayWidth=1127*scale;
    const displayHeight=rect.height;
    const artLeft=-(30*scale);
    let scene=host.querySelector('.bc16-tablet-landscape-art');
    if(!scene){
      scene=document.createElement('img');
      scene.className='bc16-tablet-landscape-art';
      scene.alt='';
      scene.setAttribute('aria-hidden','true');
      scene.decoding='async';
      scene.draggable=false;
      host.prepend(scene);
    }
    if(scene.getAttribute('src')!==cleanUrl)scene.src=cleanUrl;
    for(const [key,val] of [['left',artLeft],['top',0],['width',displayWidth],['height',displayHeight]]){
      scene.style.setProperty(key,val.toFixed(2)+'px');
    }
    host.style.setProperty('--bc15-home-art','url("'+cleanUrl+'")');
    host.style.setProperty('--bc15-art-left',artLeft.toFixed(2)+'px');
    host.style.setProperty('--bc15-art-top','0px');
    host.style.setProperty('--bc15-art-width',displayWidth.toFixed(2)+'px');
    host.style.setProperty('--bc15-art-height',displayHeight.toFixed(2)+'px');
    const nav=ensureSignNav(host,false);
    const area={
      left:artLeft+displayWidth*.037,
      top:displayHeight*.292,
      width:displayWidth*.164,
      height:displayHeight*.329
    };
    for(const [key,val] of [['left',area.left],['top',area.top],['width',area.width],['height',area.height]]){
      nav.style.setProperty(key,val.toFixed(2)+'px');
    }
    let cover=host.querySelector('.bc16-tablet-nav-cover');
    if(!cover){
      cover=document.createElement('div');
      cover.className='bc16-tablet-nav-cover';
      cover.setAttribute('aria-hidden','true');
      host.append(cover);
    }
    // Clone a clean patch of sky from the SAME locked illustration over the
    // baked top-nav tail. This removes the obsolete painted labels without
    // introducing a flat blue panel or regenerating any artwork.
    const skySourceX=610,skySourceY=10;
    // Keep the verified same-image sky clone as the provenance layer, then
    // tint it into a deliberate dark canopy behind the real semantic nav. This
    // hides the obsolete baked nav without presenting a pale repair patch.
    cover.style.setProperty('background-image',
      'radial-gradient(ellipse 105% 92% at 100% 0%,rgba(38,58,31,.94) 0%,rgba(54,68,36,.90) 43%,rgba(82,61,30,.78) 68%,rgba(82,61,30,0) 100%),'+
      'radial-gradient(ellipse 54% 82% at 18% 8%,rgba(24,48,28,.72) 0%,rgba(24,48,28,0) 100%),'+
      'url("'+cleanUrl+'")','important');
    cover.style.setProperty('background-size',
      '100% 100%,100% 100%,'+displayWidth.toFixed(2)+'px '+displayHeight.toFixed(2)+'px','important');
    cover.style.setProperty('background-position',
      '0 0,0 0,'+(-skySourceX*scale).toFixed(2)+'px '+(-skySourceY*scale).toFixed(2)+'px','important');
    cover.style.setProperty('background-repeat','no-repeat,no-repeat,no-repeat','important');
    cover.style.setProperty('background-color','transparent','important');
    const mainNav=host.querySelector('.bc12-nav');
    if(mainNav){
      for(const [key,val] of [['left',rect.width*.70],['top',rect.height*.018],['width',rect.width*.285],['height',rect.height*.13]]){
        mainNav.style.setProperty(key,val.toFixed(2)+'px','important');
      }
      mainNav.style.setProperty('right','auto','important');
      mainNav.style.setProperty('bottom','auto','important');
    }
    const liveCopy=host.querySelector('.bc15-live-copy');
    let tabletUi=host.querySelector('.bc16-tablet-ui');
    if(!tabletUi){
      tabletUi=document.createElement('div');
      tabletUi.className='bc16-tablet-ui';
      tabletUi.setAttribute('aria-hidden','true');
      const copy=document.createElement('div');
      copy.className='bc16-tablet-copy';
      const greeting=document.createElement('strong');
      greeting.className='bc16-tablet-greeting';
      const intro=document.createElement('span');
      intro.className='bc16-tablet-intro';
      copy.append(greeting,intro);
      tabletUi.append(copy);
      host.append(tabletUi);
    }
    for(const [key,val] of [
      ['position','absolute'],['inset','0'],['display','block'],['visibility','visible'],
      ['opacity','1'],['z-index','28'],['pointer-events','none']
    ])tabletUi.style.setProperty(key,val,'important');
    if(liveCopy)liveCopy.style.setProperty('display','none','important');
    const greetingText=liveCopy?.querySelector('.bc15-live-greeting')?.textContent?.trim()||'Hei!';
    const introText=liveCopy?.querySelector('.bc15-live-intro')?.textContent?.trim()||'Klar for et nytt eventyr?';
    tabletUi.querySelector('.bc16-tablet-greeting').textContent=greetingText;
    tabletUi.querySelector('.bc16-tablet-intro').textContent=introText;
    const tabletCopy=tabletUi.querySelector('.bc16-tablet-copy');
    for(const [key,val] of [['left',Math.max(140,artLeft+displayWidth*.112)],['top',displayHeight*.185],['width',Math.min(345,displayWidth*.205)],['height',Math.max(108,displayHeight*.108)]]){
      tabletCopy.style.setProperty(key,val.toFixed(2)+'px','important');
    }
    for(const [key,val] of [
      ['position','absolute'],['display','flex'],['visibility','visible'],['opacity','1'],
      ['z-index','2'],['pointer-events','none']
    ])tabletCopy.style.setProperty(key,val,'important');
    const journey=host.querySelector('.bc12-journey');
    if(journey){
      for(const [key,val] of [['left',Math.max(0,artLeft+displayWidth*.028)],['top',displayHeight*.747],['width',displayWidth*.304],['height',displayHeight*.161]]){
        journey.style.setProperty(key,val.toFixed(2)+'px','important');
      }
      journey.style.setProperty('right','auto','important');
      journey.style.setProperty('bottom','auto','important');
    }
    const live=host.querySelector('.bc15-live-next');
    if(live&&journey){
      live.id='bc16-live-journey-progress';
      if(journey.getAttribute('aria-describedby')!==live.id)journey.setAttribute('aria-describedby',live.id);
      const title=host.querySelector('[data-camp-next]')?.textContent?.trim()||'';
      const active=/pågående/i.test(host.querySelector('[data-camp-next-type]')?.textContent||'');
      const text=(active?'Pågående':'Neste')+' · '+subjectName+' · '+title;
      if(live.textContent!==text)live.textContent=text;
      for(const [key,val] of [['left',Math.max(145,artLeft+displayWidth*.120)],['top',displayHeight*.852],['width',displayWidth*.190],['height',displayHeight*.036]]){
        live.style.setProperty(key,val.toFixed(2)+'px','important');
      }
    }
    host.querySelector('.bc16-tablet-landscape-cap')?.remove();
    host.classList.remove('bc16-portrait-ready','bc16-small-landscape-ready','bc16-tablet-landscape-cap-ready');
    host.classList.add('bc16-left-signs-ready','bc16-clean-art-ready','bc16-tablet-cover-ready');
    host.dataset.bc16CleanArt='verified-preview-only';
    host.dataset.bc16Stage='navigation-pilot';
    return true;
  }
  function updateWideLandscapeCap(host,top){
    const rect=host.getBoundingClientRect();
    const tabletLandscape=rect.width/Math.max(1,rect.height)<=1.50&&top>24;
    let cap=host.querySelector('.bc16-tablet-landscape-cap');
    if(!tabletLandscape){
      cap?.remove();
      host.classList.remove('bc16-tablet-landscape-cap-ready');
      return;
    }
    if(!cap){
      cap=document.createElement('div');
      cap.className='bc16-tablet-landscape-cap';
      cap.setAttribute('aria-hidden','true');
      host.append(cap);
    }
    cap.style.setProperty('height',(top+34).toFixed(2)+'px');
    host.classList.add('bc16-tablet-landscape-cap-ready');
  }
  function mountSmallLandscapePilot(host){
    const rect=host.getBoundingClientRect();
    const subjectNames={norwegian:'Norsk',math:'Matte',english:'Engelsk',geography:'Geografi'};
    const subjectName=subjectNames[host.dataset.journeySubject]||'';
    if(!cleanUrl||!subjectName){
      remove(host);
      host.dataset.bc16CleanArt=cleanUrl?'journey-state-pending':cleanStatus;
      host.dataset.bc16Stage='small-landscape-art-pending';
      return false;
    }
    const displayWidth=rect.width;
    const displayHeight=displayWidth*(681/1127);
    host.style.setProperty('--bc15-home-art','url("'+cleanUrl+'")');
    let scene=host.querySelector('.bc16-small-landscape-art');
    if(!scene){
      scene=document.createElement('img');
      scene.className='bc16-small-landscape-art';
      scene.alt='';
      scene.setAttribute('aria-hidden','true');
      scene.decoding='async';
      scene.draggable=false;
      host.prepend(scene);
    }
    if(scene.getAttribute('src')!==cleanUrl)scene.src=cleanUrl;
    host.style.setProperty('--bc15-art-left','0px');
    host.style.setProperty('--bc15-art-top','0px');
    host.style.setProperty('--bc15-art-width',displayWidth.toFixed(2)+'px');
    host.style.setProperty('--bc15-art-height',displayHeight.toFixed(2)+'px');
    const nav=ensureSignNav(host,false);
    const area={
      left:displayWidth*.037,
      top:displayHeight*.285,
      width:Math.max(150,displayWidth*.17),
      height:Math.max(184,displayHeight*.36)
    };
    const set=(prop,value)=>{
      const result=value.toFixed(2)+'px';
      if(nav.style.getPropertyValue(prop)!==result)nav.style.setProperty(prop,result);
    };
    set('left',area.left);set('top',area.top);set('width',area.width);set('height',area.height);
    host.classList.remove('bc16-portrait-ready');
    host.classList.add('bc16-left-signs-ready','bc16-clean-art-ready','bc16-small-landscape-ready');
    host.dataset.bc16CleanArt='verified-preview-only';
    host.dataset.bc16Stage='navigation-pilot';
    const live=host.querySelector('.bc15-live-next');
    const journey=host.querySelector('.bc12-journey');
    const title=host.querySelector('[data-camp-next]')?.textContent?.trim()||'';
    const active=/pågående/i.test(host.querySelector('[data-camp-next-type]')?.textContent||'');
    const progressText=(active?'Pågående':'Neste')+' · '+subjectName+' · '+title;
    if(live&&journey){
      live.id='bc16-live-journey-progress';
      if(journey.getAttribute('aria-describedby')!==live.id)journey.setAttribute('aria-describedby',live.id);
      if(live.textContent!==progressText)live.textContent=progressText;
    }
    let ui=host.querySelector('.bc16-small-landscape-ui');
    if(!ui){
      ui=document.createElement('div');
      ui.className='bc16-small-landscape-ui';
      ui.setAttribute('aria-hidden','true');
      ui.inert=true;
      const copy=document.createElement('div');
      copy.className='bc16-small-copy';
      const greeting=document.createElement('strong');
      greeting.className='bc16-small-greeting';
      const intro=document.createElement('span');
      intro.className='bc16-small-intro';
      copy.append(greeting,intro);
      const journeyVisual=document.createElement('div');
      journeyVisual.className='bc16-small-journey-visual';
      const journeyTitle=document.createElement('strong');
      journeyTitle.className='bc16-small-journey-title';
      journeyTitle.textContent='Fortsett reisen';
      const journeyMeta=document.createElement('span');
      journeyMeta.className='bc16-small-journey-meta';
      journeyVisual.append(journeyTitle,journeyMeta);
      ui.append(copy,journeyVisual);
      host.append(ui);
    }
    for(const [key,val] of [
      ['position','absolute'],['inset','0'],['display','block'],['visibility','visible'],
      ['opacity','1'],['z-index','2147483000'],['pointer-events','none'],
      ['transform','translateZ(0)'],['-webkit-transform','translateZ(0)']
    ])ui.style.setProperty(key,val,'important');
    const legacyCopy=host.querySelector('.bc15-live-copy');
    if(legacyCopy)legacyCopy.style.setProperty('display','none','important');
    if(live)live.style.setProperty('display','none','important');
    const greetingText=host.querySelector('.bc15-live-greeting')?.textContent?.trim()||'Hei!';
    const introText=host.querySelector('.bc15-live-intro')?.textContent?.trim()||'Klar for et nytt eventyr?';
    ui.querySelector('.bc16-small-greeting').textContent=greetingText;
    ui.querySelector('.bc16-small-intro').textContent=introText;
    ui.querySelector('.bc16-small-journey-meta').textContent=progressText;
    const jLeft=Math.max(area.left+area.width+16,rect.width*.215);
    const jWidth=Math.min(270,Math.max(235,rect.width*.31));
    const jHeight=Math.min(58,Math.max(50,rect.height*.14));
    const jTop=rect.height-jHeight-Math.max(10,rect.height*.025);
    if(journey){
      for(const [key,val] of [['left',jLeft],['top',jTop],['width',jWidth],['height',jHeight]]){
        journey.style.setProperty(key,val.toFixed(2)+'px','important');
      }
      journey.style.setProperty('right','auto','important');
      journey.style.setProperty('bottom','auto','important');
    }
    const journeyVisual=ui.querySelector('.bc16-small-journey-visual');
    for(const [key,val] of [['left',jLeft],['top',jTop],['width',jWidth],['height',jHeight]]){
      journeyVisual.style.setProperty(key,val.toFixed(2)+'px','important');
    }
    for(const [key,val] of [
      ['position','absolute'],['display','flex'],['visibility','visible'],['opacity','1'],
      ['z-index','2'],['pointer-events','none'],['transform','translateZ(0)']
    ])journeyVisual.style.setProperty(key,val,'important');
    const copy=ui.querySelector('.bc16-small-copy');
    for(const [key,val] of [['left',rect.width*.12],['top',rect.height*.205],['width',rect.width*.30],['height',rect.height*.17]]){
      copy.style.setProperty(key,val.toFixed(2)+'px','important');
    }
    for(const [key,val] of [
      ['position','absolute'],['display','flex'],['visibility','visible'],['opacity','1'],
      ['z-index','2'],['pointer-events','none'],['transform','translateZ(0)']
    ])copy.style.setProperty(key,val,'important');
    if(journey){
      journey.style.setProperty('opacity','.001','important');
      journey.style.setProperty('background','transparent','important');
      journey.style.setProperty('border','0','important');
      journey.style.setProperty('box-shadow','none','important');
      for(const child of journey.children)child.style.setProperty('visibility','hidden','important');
    }
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
    const smallLandscape=matchMedia('(orientation:landscape) and (max-height:580px)').matches;
    if(smallLandscape){
      mountSmallLandscapePilot(host);
      return;
    }
    const tabletLandscape=host.getBoundingClientRect().height>580&&
      host.getBoundingClientRect().width/Math.max(1,host.getBoundingClientRect().height)<=1.50;
    if(tabletLandscape){
      mountTabletLandscapePilot(host);
      return;
    }
    // On the approved v15 LANDSCAPE master the four real wooden boards already
    // exist on the left. The portrait original contains no such boards.
    // Never pretend invisible buttons over the trolls are an approved phone UI.
    updateWideLandscapeCap(host,top);
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
       (m.type==='attributes'&&(
         m.target?.classList?.contains('bc12')||
         m.target?.id==='home-screen'
       ))))schedule();
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