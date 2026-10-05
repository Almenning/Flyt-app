
(()=>{
  'use strict';
  const screen=document.getElementById('world-screen');
  if(!screen)return;

  const PARTS=['./globe-v16-plate-0.txt?v=2','./globe-v16-plate-1.txt?v=2','./globe-v16-plate-2.txt?v=2'];

  function ensureStage(){
    let stage=screen.querySelector('.globe-v16-stage');
    if(!stage){
      stage=document.createElement('div');
      stage.className='globe-v16-stage';
      stage.setAttribute('aria-label','Kloden – utforsk verden');
      screen.prepend(stage);
    }

    const ids=['world-back','globe-mode','globe-legend'];
    for(const id of ids){
      const el=document.getElementById(id);
      if(el&&el.parentElement!==stage)stage.appendChild(el);
    }
    for(const sel of ['.globe-wrap','#globe-status','.globe-actions']){
      const el=screen.querySelector(sel);
      if(el&&el.parentElement!==stage)stage.appendChild(el);
    }

    if(!stage.querySelector('.globe-v16-titlecopy')){
      const copy=document.createElement('div');
      copy.className='globe-v16-titlecopy';
      copy.setAttribute('aria-hidden','true');
      copy.innerHTML='<div class="globe-v16-kicker">VERDEN OG MENNESKER</div><div class="globe-v16-title">Kloden</div><div class="globe-v16-subtitle">Utforsk land, folk, dyr og spennende steder fra hele verden!</div>';
      stage.appendChild(copy);
    }

    return stage;
  }

  async function loadApprovedPlate(stage){
    try{
      const parts=await Promise.all(PARTS.map(async url=>{
        const res=await fetch(url,{cache:'force-cache'});
        if(!res.ok)throw new Error('plate '+res.status);
        return (await res.text()).trim();
      }));
      const data='data:image/jpeg;base64,'+parts.join('');
      stage.style.backgroundImage='url("'+data+'")';
      screen.style.backgroundImage='url("'+data+'")';
      screen.dataset.globeV16Plate='ready';
    }catch(err){
      console.warn('Læria globe plate fallback',err);
      stage.style.backgroundImage="url('./geografi-verden.png?v=20261004-world1')";
      screen.style.backgroundImage="url('./geografi-verden.png?v=20261004-world1')";
      screen.dataset.globeV16Plate='fallback';
    }
  }

  function makeLive(){
    const stage=screen.querySelector('.globe-v16-stage');
    screen.classList.add('globe-v16-live');
    stage?.classList.add('globe-v16-live');
    try{ resizeGlobe(); drawGlobe(); }catch(_){}
  }

  function seedApprovedCountry(){
    if(screen.dataset.globeV16Seeded==='1')return;
    try{
      const list=(typeof WORLD_COUNTRIES!=='undefined'?WORLD_COUNTRIES:[]);
      const chad=list.find(c=>c&&c.name==='Tsjad');
      if(chad&&typeof selectGlobeCountry==='function'){
        globeLon=15;
        globeLat=18;
        globeZoom=1;
        selectGlobeCountry(chad.id);
        screen.dataset.globeV16Seeded='1';
      }
    }catch(_){}
  }

  function syncLayout(){
    const stage=ensureStage();
    requestAnimationFrame(()=>{
      try{resizeGlobe();drawGlobe()}catch(_){}
      if(screen.classList.contains('active'))seedApprovedCountry();
    });
    return stage;
  }

  const stage=syncLayout();
  // The globe itself must never depend on the decorative plate loading.
  screen.classList.add('globe-v16-live');
  stage.classList.add('globe-v16-live');
  loadApprovedPlate(stage);
  requestAnimationFrame(()=>{try{resizeGlobe();drawGlobe()}catch(_){}});

  const wrap=stage.querySelector('.globe-wrap');
  if(wrap){
    ['pointerdown','wheel','touchstart'].forEach(type=>wrap.addEventListener(type,makeLive,{passive:type!=='wheel'}));
  }
  ['globe-zoom-in','globe-zoom-out','random-country','reset-globe'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',makeLive,{capture:true});
  });

  stage.querySelectorAll('[data-globe-mode]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.dataset.globeMode==='mine')makeLive();
    },{capture:true});
  });

  const observer=new MutationObserver(()=>{
    if(!screen.classList.contains('active'))return;
    const s=syncLayout();
    if(screen.dataset.globeV16Plate==='ready'&&s&&!s.style.backgroundImage){
      loadApprovedPlate(s);
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class']});

  window.addEventListener('resize',()=>{
    if(screen.classList.contains('active'))requestAnimationFrame(()=>{try{resizeGlobe();drawGlobe()}catch(_){}});
  });
})();
