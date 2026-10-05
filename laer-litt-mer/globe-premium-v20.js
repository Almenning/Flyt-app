
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

  /* Premium live rendering: keep the real geography engine, but give it the
     illustrated depth and explorer details from the approved composition. */
  function installPremiumRenderer(){
    if(window.__lariaGlobeV20Renderer)return true;
    if(typeof window.drawGlobe!=='function' || typeof window.globeProject!=='function')return false;

    const baseDraw=window.drawGlobe;
    function drawTree(ctx,x,y,s,alpha){
      ctx.save();ctx.globalAlpha=alpha;
      ctx.fillStyle='#7a4f2c';ctx.fillRect(x-s*.10,y-s*.10,s*.20,s*.46);
      ctx.fillStyle='#2f7f4a';
      for(const [dy,wid] of [[-.48,.72],[-.23,.92],[.02,1.08]]){
        ctx.beginPath();ctx.moveTo(x,y+s*dy-s*.42);ctx.lineTo(x-s*wid*.48,y+s*dy+s*.28);ctx.lineTo(x+s*wid*.48,y+s*dy+s*.28);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }
    function drawMountain(ctx,x,y,s,alpha){
      ctx.save();ctx.globalAlpha=alpha;
      ctx.beginPath();ctx.moveTo(x,y-s*.65);ctx.lineTo(x-s*.72,y+s*.48);ctx.lineTo(x+s*.72,y+s*.48);ctx.closePath();
      ctx.fillStyle='#8e9aa0';ctx.fill();
      ctx.beginPath();ctx.moveTo(x,y-s*.65);ctx.lineTo(x-s*.26,y-s*.23);ctx.lineTo(x-s*.02,y-s*.31);ctx.lineTo(x+s*.18,y-s*.13);ctx.lineTo(x+s*.36,y-s*.06);ctx.closePath();
      ctx.fillStyle='rgba(255,255,255,.93)';ctx.fill();
      ctx.restore();
    }
    function drawBoat(ctx,x,y,s,alpha,flip){
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(flip)ctx.scale(-1,1);
      ctx.fillStyle='#8a4c24';
      ctx.beginPath();ctx.moveTo(-s*.55,s*.26);ctx.lineTo(s*.56,s*.26);ctx.lineTo(s*.35,s*.48);ctx.lineTo(-s*.37,s*.48);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#6c421f';ctx.lineWidth=Math.max(1,s*.08);ctx.beginPath();ctx.moveTo(0,-s*.55);ctx.lineTo(0,s*.27);ctx.stroke();
      ctx.fillStyle='#fff3d2';ctx.beginPath();ctx.moveTo(-s*.05,-s*.5);ctx.lineTo(-s*.05,s*.08);ctx.lineTo(-s*.5,s*.03);ctx.closePath();ctx.fill();
      ctx.fillStyle='#f2c267';ctx.beginPath();ctx.moveTo(s*.06,-s*.36);ctx.lineTo(s*.06,s*.10);ctx.lineTo(s*.42,s*.08);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    function drawWhale(ctx,x,y,s,alpha){
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);
      ctx.fillStyle='#24699d';ctx.beginPath();ctx.ellipse(0,0,s*.62,s*.27,-.12,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(s*.52,-s*.05);ctx.lineTo(s*.92,-s*.30);ctx.lineTo(s*.78,.02);ctx.lineTo(s*.96,s*.24);ctx.lineTo(s*.52,s*.09);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-s*.18,-s*.10,s*.22,s*.06,-.15,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    /* v15 already draws the explorer details (trees, mountains, clouds, ship and whale).
       v20 only adds glass/depth so the live state stays rich without becoming cluttered. */
    const features=[];

    function premiumOverlay(){
      const canvas=document.getElementById('globe-canvas');
      if(!canvas||!canvas._cssW||!canvas._cssH)return;
      const w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h),dpr=canvas._dpr||1,ctx=canvas.getContext('2d');
      ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.clip();

      /* soft storybook light and dimensional edge */
      let shine=ctx.createRadialGradient(w/2-s*.20,h/2-s*.27,s*.02,w/2-s*.08,h/2-s*.12,s*.54);
      shine.addColorStop(0,'rgba(255,255,255,.22)');
      shine.addColorStop(.42,'rgba(255,255,255,.055)');
      shine.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=shine;ctx.fillRect(0,0,w,h);
      let edge=ctx.createRadialGradient(w/2,h/2,s*.25,w/2,h/2,s*.47);
      edge.addColorStop(.72,'rgba(7,70,92,0)');
      edge.addColorStop(1,'rgba(8,62,79,.14)');
      ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);

      const z=(typeof globeZoom==='number'?globeZoom:1);
      if(z<2.15){
        const base=Math.max(7,Math.min(13,s*.024))*(1+Math.max(0,z-1)*.10);
        const alpha=Math.max(.34,1-(z-1)*.38);
        for(const f of features){
          const p=window.globeProject(f[1],f[2],w,h);
          if(!p||p[2]<.12)continue;
          const scale=base*(f[3]||1)*Math.max(.68,Math.min(1.12,p[2]+.18));
          if(f[0]==='tree')drawTree(ctx,p[0],p[1],scale,alpha*.84);
          else if(f[0]==='mountain')drawMountain(ctx,p[0],p[1],scale,alpha*.82);
          else if(f[0]==='boat')drawBoat(ctx,p[0],p[1],scale,alpha*.88,!!f[4]);
          else if(f[0]==='whale')drawWhale(ctx,p[0],p[1],scale,alpha*.78);
        }
      }
      ctx.restore();

      /* polished glass rim */
      ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,.96)';ctx.lineWidth=Math.max(3,s*.009);ctx.stroke();
      ctx.beginPath();ctx.arc(w/2-s*.11,h/2-s*.18,s*.33,3.85,5.15);
      ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=Math.max(2,s*.006);ctx.stroke();
      ctx.restore();
    }

    const premiumDraw=function(){
      baseDraw.apply(this,arguments);
      try{premiumOverlay()}catch(_){}
    };
    window.drawGlobe=premiumDraw;
    try{drawGlobe=premiumDraw}catch(_){}
    window.__lariaGlobeV20Renderer=true;
    return true;
  }

  if(!installPremiumRenderer()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(installPremiumRenderer()||tries>40)clearInterval(timer);
    },100);
  }else{
    redraw();
  }

})();
