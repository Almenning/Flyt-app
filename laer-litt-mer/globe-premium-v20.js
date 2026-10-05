
(()=>{
  'use strict';
  const screen=document.getElementById('world-screen');
  if(!screen)return;

  let seeded=false;

  function redraw(){
    requestAnimationFrame(()=>{
      try{ if(typeof resizeGlobe==='function') resizeGlobe(); }catch(_){}
      requestAnimationFrame(()=>{
        try{ if(typeof drawGlobe==='function') drawGlobe(); }catch(_){}
      });
    });
  }

  function makeLive(){
    if(!screen.classList.contains('globe-v20-live')){
      screen.classList.add('globe-v20-live');
      redraw();
    }
  }

  function seedPreview(){
    if(seeded)return;
    seeded=true;
    try{
      if(typeof globeLon!=='undefined')globeLon=15;
      if(typeof globeLat!=='undefined')globeLat=18;
      if(typeof globeZoom!=='undefined')globeZoom=1;
      if(typeof setGlobeMode==='function')setGlobeMode('explore');
      if(typeof countries!=='undefined'&&countries.td&&typeof selectGlobeCountry==='function'){
        selectGlobeCountry('td');
      }
    }catch(_){}
    redraw();
  }

  function activate(){
    if(!screen.classList.contains('active'))return;
    seedPreview();
    redraw();
  }

  const wrap=screen.querySelector('.globe-wrap');
  if(wrap){
    wrap.addEventListener('pointerdown',makeLive,{capture:true});
    wrap.addEventListener('touchstart',makeLive,{capture:true,passive:true});
    wrap.addEventListener('wheel',makeLive,{capture:true,passive:true});
  }

  ['globe-zoom-in','globe-zoom-out','random-country','reset-globe'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',makeLive,{capture:true});
  });

  screen.querySelectorAll('[data-globe-mode]').forEach(btn=>{
    btn.addEventListener('click',makeLive,{capture:true});
  });

  const status=document.getElementById('globe-status');
  if(status){
    status.addEventListener('click',()=>{
      // Keep the approved preview intact when opening the initial Tsjad card.
      // Any map interaction will switch the page to the live state.
    },{capture:true});
  }

  const obs=new MutationObserver(()=>{
    if(screen.classList.contains('active'))activate();
  });
  obs.observe(screen,{attributes:true,attributeFilter:['class']});

  window.addEventListener('resize',()=>{
    if(screen.classList.contains('active'))redraw();
  });

  activate();
})();
