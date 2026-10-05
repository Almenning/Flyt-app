
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
    let press=null;
    wrap.addEventListener('pointerdown',e=>{
      press={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    },{capture:true});
    wrap.addEventListener('pointermove',e=>{
      if(!press||press.id!==e.pointerId)return;
      const d=Math.hypot(e.clientX-press.x,e.clientY-press.y);
      if(d>9&&!press.moved){
        press.moved=true;
        makeLive();
      }
    },{capture:true});
    wrap.addEventListener('pointerup',e=>{
      if(!press||press.id!==e.pointerId)return;
      const moved=press.moved;
      press=null;
      if(!moved){
        // A tap selects a country without throwing away the approved premium globe.
        requestAnimationFrame(()=>screen.classList.add('globe-v20-selected'));
      }
    },{capture:true});
    wrap.addEventListener('pointercancel',()=>{press=null},{capture:true});
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
      const project=(lon,lat)=>typeof globeProject==='function'?globeProject(lon,lat,w,h):null;
      const mode=(typeof globeMode==='string'?globeMode:'explore');
      const zoom=(typeof globeZoom==='number'?globeZoom:1);
      const selected=(typeof globeSelected==='string'?globeSelected:null);
      const palette={
        'Europa':'#527BEA',
        'Asia':'#F0BB3F',
        'Afrika':'#F07C59',
        'Nord-Amerika':'#55B96A',
        'Sør-Amerika':'#35A964',
        'Oseania':'#8A75DF'
      };
      const mix=(a,b,t)=>{
        const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);
        const ar=(pa>>16)&255,ag=(pa>>8)&255,ab=pa&255,br=(pb>>16)&255,bg=(pb>>8)&255,bb=pb&255;
        const n=(x,y)=>Math.round(x+(y-x)*t);
        return '#'+[n(ar,br),n(ag,bg),n(ab,bb)].map(v=>v.toString(16).padStart(2,'0')).join('');
      };
      const countryColor=country=>{
        let base=palette[country.continent]||'#8DBB87';
        if(mode!=='mine')return base;
        try{
          const st=typeof countryStatus==='function'?countryStatus(country.id):'new';
          if(st==='mastered')return base;
          if(st==='known')return mix(base,'#FFF8DD',.16);
          if(st==='learning')return mix(base,'#F5EFE1',.38);
          if(st==='seen')return mix(base,'#F5F0E8',.55);
          return mix(base,'#EDEBE4',.68);
        }catch(_){return base}
      };

      ctx.save();
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.clip();

      /* Rich turquoise ocean. This deliberately covers the legacy flat renderer. */
      const ocean=ctx.createRadialGradient(w/2-s*.22,h/2-s*.28,s*.03,w/2+s*.02,h/2+s*.04,s*.62);
      ocean.addColorStop(0,'#56D5F2');
      ocean.addColorStop(.42,'#18B8E4');
      ocean.addColorStop(.78,'#0799CC');
      ocean.addColorStop(1,'#087EAF');
      ctx.fillStyle=ocean;ctx.fillRect(0,0,w,h);

      /* Subtle latitude/longitude glass-grid, closer to the approved illustrated globe. */
      ctx.strokeStyle='rgba(224,250,255,.24)';
      ctx.lineWidth=Math.max(.65,s*.00135);
      if(typeof drawProjectedLine==='function'){
        for(const lat of [-60,-30,0,30,60]){
          ctx.beginPath();const pts=[];for(let lon=-180;lon<=180;lon+=4)pts.push([lon,lat]);
          drawProjectedLine(ctx,pts,w,h);ctx.stroke();
        }
        for(let lon=-180;lon<180;lon+=30){
          ctx.beginPath();const pts=[];for(let lat=-85;lat<=85;lat+=4)pts.push([lon,lat]);
          drawProjectedLine(ctx,pts,w,h);ctx.stroke();
        }
      }

      /* Premium land pass: stronger colour, cream borders, slight relief shadow. */
      if(typeof WORLD_COUNTRIES!=='undefined'&&typeof geometryPolygons==='function'&&typeof drawProjectedLine==='function'){
        for(const country of WORLD_COUNTRIES){
          if(!country.geometry)continue;
          ctx.beginPath();
          for(const poly of geometryPolygons(country.geometry)){
            for(const ring of poly)drawProjectedLine(ctx,ring,w,h);
          }
          ctx.save();
          ctx.shadowColor='rgba(35,67,62,.22)';
          ctx.shadowBlur=Math.max(1,s*.004);
          ctx.shadowOffsetY=Math.max(.5,s*.0015);
          ctx.fillStyle=country.id===selected?'#FFD45C':countryColor(country);
          ctx.fill();
          ctx.restore();
          ctx.strokeStyle='rgba(255,247,219,.90)';
          ctx.lineWidth=zoom>2?1.25:Math.max(.8,s*.0016);
          ctx.stroke();
        }

        /* Small island/city-country dots remain tappable and visible. */
        for(const country of WORLD_COUNTRIES){
          let tiny=false;
          try{tiny=typeof isTinyCountry==='function'&&isTinyCountry(country)}catch(_){}
          if(!tiny&&country.id!==selected)continue;
          const p=project(country.lon,country.lat);if(!p)continue;
          ctx.beginPath();
          ctx.arc(p[0],p[1],country.id===selected?Math.max(5,s*.009):Math.max(2.4,s*.0044),0,Math.PI*2);
          ctx.fillStyle=country.id===selected?'#FFD45C':'#FFF1A8';ctx.fill();
          ctx.strokeStyle='rgba(87,76,52,.32)';ctx.lineWidth=1;ctx.stroke();
        }
      }

      /* Storybook surface details follow the actual rotation. */
      function tree(x,y,z=1){
        const q=project(x,y);if(!q||q[2]<.08)return;
        const k=Math.max(8,s*.026)*z*Math.max(.7,Math.min(1.15,q[2]+.2));
        ctx.save();ctx.translate(q[0],q[1]);ctx.globalAlpha=.92;
        ctx.fillStyle='#75502D';ctx.fillRect(-k*.08,k*.05,k*.16,k*.42);
        for(const [yy,ww,col] of [[-.46,.70,'#286E43'],[-.20,.92,'#2E824B'],[.05,1.06,'#3B9554']]){
          ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,k*(yy-.35));ctx.lineTo(-k*ww*.46,k*(yy+.27));ctx.lineTo(k*ww*.46,k*(yy+.27));ctx.closePath();ctx.fill();
        }
        ctx.restore();
      }
      function mountain(x,y,z=1){
        const q=project(x,y);if(!q||q[2]<.08)return;
        const k=Math.max(10,s*.031)*z*Math.max(.72,Math.min(1.16,q[2]+.22));
        ctx.save();ctx.translate(q[0],q[1]);ctx.globalAlpha=.92;
        ctx.fillStyle='#879296';ctx.beginPath();ctx.moveTo(0,-k*.65);ctx.lineTo(-k*.72,k*.5);ctx.lineTo(k*.72,k*.5);ctx.closePath();ctx.fill();
        ctx.fillStyle='#FFF8EA';ctx.beginPath();ctx.moveTo(0,-k*.65);ctx.lineTo(-k*.23,-k*.22);ctx.lineTo(-k*.02,-k*.31);ctx.lineTo(k*.19,-k*.11);ctx.lineTo(k*.35,-k*.04);ctx.closePath();ctx.fill();
        ctx.restore();
      }
      function cloud(x,y,z=1){
        const q=project(x,y);if(!q||q[2]<.08)return;
        const k=Math.max(7,s*.019)*z*Math.max(.7,Math.min(1.12,q[2]+.18));
        ctx.save();ctx.translate(q[0],q[1]);ctx.globalAlpha=.72;ctx.fillStyle='#F7FDFF';
        for(const [cx,cy,r] of [[-0.34,.07,.34],[-.06,-.18,.42],[.28,-.02,.35],[.04,.17,.50]]){ctx.beginPath();ctx.arc(k*cx,k*cy,k*r,0,Math.PI*2);ctx.fill()}
        ctx.restore();
      }
      function ship(x,y,z=1,flip=false){
        const q=project(x,y);if(!q||q[2]<.08)return;
        const k=Math.max(9,s*.028)*z*Math.max(.72,Math.min(1.12,q[2]+.18));
        ctx.save();ctx.translate(q[0],q[1]);if(flip)ctx.scale(-1,1);ctx.globalAlpha=.95;
        ctx.fillStyle='#7E4A27';ctx.beginPath();ctx.moveTo(-k*.55,k*.25);ctx.lineTo(k*.56,k*.25);ctx.lineTo(k*.34,k*.49);ctx.lineTo(-k*.38,k*.49);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#61401F';ctx.lineWidth=Math.max(1,k*.07);ctx.beginPath();ctx.moveTo(0,-k*.58);ctx.lineTo(0,k*.25);ctx.stroke();
        ctx.fillStyle='#FFF2C6';ctx.beginPath();ctx.moveTo(-k*.05,-k*.52);ctx.lineTo(-k*.05,k*.08);ctx.lineTo(-k*.48,k*.04);ctx.closePath();ctx.fill();
        ctx.fillStyle='#F4C563';ctx.beginPath();ctx.moveTo(k*.06,-k*.38);ctx.lineTo(k*.06,k*.10);ctx.lineTo(k*.40,k*.08);ctx.closePath();ctx.fill();
        ctx.restore();
      }
      function whale(x,y,z=1){
        const q=project(x,y);if(!q||q[2]<.08)return;
        const k=Math.max(10,s*.030)*z*Math.max(.72,Math.min(1.12,q[2]+.18));
        ctx.save();ctx.translate(q[0],q[1]);ctx.globalAlpha=.88;ctx.fillStyle='#226C9E';
        ctx.beginPath();ctx.ellipse(0,0,k*.62,k*.27,-.12,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(k*.52,-k*.05);ctx.lineTo(k*.92,-k*.30);ctx.lineTo(k*.78,k*.02);ctx.lineTo(k*.96,k*.24);ctx.lineTo(k*.52,k*.09);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.38)';ctx.beginPath();ctx.ellipse(-k*.18,-k*.10,k*.22,k*.06,-.15,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
      if(mode==='explore'&&zoom<2.15){
        const fade=Math.max(.28,1-(zoom-1)*.38);ctx.save();ctx.globalAlpha=fade;
        [
          [18,61,1.05],[24,55,.78],[31,8,.82],[38,8,.70],[52,57,.85],[67,55,.78],[92,57,.96],[101,51,.80],
          [-98,49,.88],[-58,-10,.82],[12,-4,.72],[28,-19,.70]
        ].forEach(v=>tree(...v));
        [[72,36,1.1],[82,30,.78],[45,43,.86],[92,39,.82],[-108,39,.78]].forEach(v=>mountain(...v));
        [[-10,45,1.1],[44,-4,.92],[-145,20,.78],[10,-30,.85]].forEach(v=>cloud(...v));
        ship(-28,24,1.05,false);ship(70,-18,.88,true);whale(-27,-31,1.08);
        ctx.restore();
      }

      /* Mastery markers belong above the illustrated terrain. */
      if(typeof WORLD_COUNTRIES!=='undefined'&&typeof drawMasteryMarker==='function'){
        for(const country of WORLD_COUNTRIES)drawMasteryMarker(ctx,country,w,h);
      }
      let pulsing=false;
      try{if(typeof drawGlobePulse==='function')pulsing=drawGlobePulse(ctx,w,h)}catch(_){}

      /* Glass highlight, atmospheric edge and a slightly darker lower rim for depth. */
      const light=ctx.createRadialGradient(w/2-s*.20,h/2-s*.27,s*.015,w/2-s*.08,h/2-s*.12,s*.55);
      light.addColorStop(0,'rgba(255,255,255,.27)');
      light.addColorStop(.38,'rgba(255,255,255,.08)');
      light.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
      const vignette=ctx.createRadialGradient(w/2,h/2,s*.23,w/2,h/2,s*.47);
      vignette.addColorStop(.70,'rgba(3,55,72,0)');
      vignette.addColorStop(1,'rgba(4,55,71,.22)');
      ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
      ctx.restore();

      /* polished globe glass edge */
      ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);
      ctx.strokeStyle='rgba(244,254,255,.98)';ctx.lineWidth=Math.max(4,s*.008);ctx.stroke();
      ctx.beginPath();ctx.arc(w/2-s*.10,h/2-s*.18,s*.33,3.82,5.18);
      ctx.strokeStyle='rgba(255,255,255,.30)';ctx.lineWidth=Math.max(2,s*.005);ctx.stroke();
      ctx.restore();
      if(pulsing)requestAnimationFrame(()=>window.drawGlobe?.());
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
