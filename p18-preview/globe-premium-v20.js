
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
    makeLive();
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
        'Europa':'#557FD9',
        'Asia':'#E5B13F',
        'Afrika':'#E87959',
        'Nord-Amerika':'#53AE67',
        'Sør-Amerika':'#3DA567',
        'Oseania':'#8372CC'
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

      /* Illustrated land pass: warm light from upper left, subtle coast relief, cream borders. */
      if(typeof WORLD_COUNTRIES!=='undefined'&&typeof geometryPolygons==='function'&&typeof drawProjectedLine==='function'){
        const makeLandGradient=(base,selectedLand)=>{
          const g=ctx.createLinearGradient(w*.28,h*.18,w*.72,h*.83);
          if(selectedLand){
            g.addColorStop(0,'#FFE985');g.addColorStop(.55,'#FFD45C');g.addColorStop(1,'#E8B83C');
          }else{
            g.addColorStop(0,mix(base,'#FFF4D2',.16));
            g.addColorStop(.52,base);
            g.addColorStop(1,mix(base,'#56634D',.12));
          }
          return g;
        };
        for(const country of WORLD_COUNTRIES){
          if(!country.geometry)continue;
          ctx.beginPath();
          for(const poly of geometryPolygons(country.geometry)){
            for(const ring of poly)drawProjectedLine(ctx,ring,w,h);
          }
          const base=countryColor(country);
          ctx.save();
          ctx.shadowColor='rgba(25,61,58,.26)';
          ctx.shadowBlur=Math.max(1.5,s*.005);
          ctx.shadowOffsetY=Math.max(.7,s*.0021);
          ctx.fillStyle=makeLandGradient(base,country.id===selected);
          ctx.fill();
          ctx.restore();

          /* warm inner rim */
          ctx.strokeStyle='rgba(255,246,214,.94)';
          ctx.lineWidth=zoom>2?1.15:Math.max(.9,s*.00175);
          ctx.stroke();
        }

        /* Tiny countries and islands stay legible and tactile. */
        for(const country of WORLD_COUNTRIES){
          let tiny=false;
          try{tiny=typeof isTinyCountry==='function'&&isTinyCountry(country)}catch(_){}
          if(!tiny&&country.id!==selected)continue;
          const p=project(country.lon,country.lat);if(!p)continue;
          const rr=country.id===selected?Math.max(5.5,s*.010):Math.max(2.2,s*.0042);
          const dot=ctx.createRadialGradient(p[0]-rr*.25,p[1]-rr*.25,1,p[0],p[1],rr);
          dot.addColorStop(0,country.id===selected?'#FFF0A0':'#FFF6C3');
          dot.addColorStop(1,country.id===selected?'#F1C23F':'#F2D776');
          ctx.beginPath();ctx.arc(p[0],p[1],rr,0,Math.PI*2);ctx.fillStyle=dot;ctx.fill();
          ctx.strokeStyle='rgba(105,84,45,.28)';ctx.lineWidth=1;ctx.stroke();
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
      function terrainPatch(lon,lat,rx,ry,color,alpha=.16){
        const q=project(lon,lat);if(!q||q[2]<.10)return;
        const k=Math.max(.62,Math.min(1.15,q[2]+.18));
        ctx.save();ctx.translate(q[0],q[1]);ctx.scale(1,.62);
        const g=ctx.createRadialGradient(0,0,1,0,0,s*rx*k);
        g.addColorStop(0,color.replace('ALPHA',String(alpha)));
        g.addColorStop(1,color.replace('ALPHA','0'));
        ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,s*rx*k,s*ry*k,0,0,Math.PI*2);ctx.fill();ctx.restore();
      }
      if(mode==='explore'&&zoom<2.25){
        const fade=Math.max(.26,1-(zoom-1)*.34);ctx.save();ctx.globalAlpha=fade;

        /* soft forest/alpine washes behind the icons */
        terrainPatch(42,57,.075,.052,'rgba(32,112,65,ALPHA)',.18);
        terrainPatch(82,55,.090,.055,'rgba(46,119,65,ALPHA)',.15);
        terrainPatch(20,8,.055,.042,'rgba(37,117,64,ALPHA)',.12);
        terrainPatch(10,46,.042,.030,'rgba(118,126,116,ALPHA)',.12);
        terrainPatch(82,29,.070,.035,'rgba(132,138,136,ALPHA)',.13);
        terrainPatch(-105,46,.070,.046,'rgba(42,118,69,ALPHA)',.14);

        [
          [18,62,1.05],[23,58,.78],[28,55,.72],[31,8,.82],[38,8,.70],[34,-3,.66],
          [52,57,.86],[61,55,.72],[70,57,.72],[92,57,.96],[101,51,.80],[82,23,.62],
          [-98,49,.88],[-111,44,.72],[-58,-10,.82],[-63,-18,.66],[-50,-23,.62],
          [12,-4,.72],[28,-19,.70],[36,-4,.62]
        ].forEach(v=>tree(...v));

        [
          [9,46,.78],[45,43,.78],[72,36,.92],[80,31,.92],[87,29,1.02],[92,39,.76],
          [-108,39,.78],[-72,-33,.76],[-70,-20,.72],[39,9,.66]
        ].forEach(v=>mountain(...v));

        [
          [-10,45,1.05],[44,-4,.88],[-145,20,.76],[10,-30,.82],[105,-16,.70],[-42,-3,.72]
        ].forEach(v=>cloud(...v));

        ship(-28,24,1.02,false);
        ship(70,-18,.86,true);
        ship(118,8,.72,true);
        whale(-27,-31,1.08);
        whale(146,-28,.72);
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
