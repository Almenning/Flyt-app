(()=>{'use strict';
/*
 * Oppdagelsesglobusen, fase 1.  It is deliberately opt-in while its visual
 * contract is being reviewed: ?discovery-globe-preview=1.
 *
 * It does not own input, land data, progress, country selection or the base
 * renderer.  It only uses their proven orthographic projection and replaces
 * the paint pass for the isolated preview.  Every non-ocean coordinate below
 * is longitude/latitude, never a screen position.
 */
if(!new URLSearchParams(location.search).has('discovery-globe-preview'))return;
const screen=document.getElementById('world-screen');
const art=window.LariaGlobeArtV24;
if(!screen||!art||typeof window.drawGlobe!=='function'||typeof window.globeProject!=='function')return;
window.__lariaDiscoveryGlobePreview=true;

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const project=(lon,lat,w,h)=>window.globeProject(lon,lat,w,h);
const land=()=>typeof WORLD_COUNTRIES==='undefined'?[]:WORLD_COUNTRIES;
const path=(ctx,c,w,h)=>{
  if(!c?.geometry||typeof geometryPolygons!=='function'||typeof drawProjectedLine!=='function')return false;
  for(const poly of geometryPolygons(c.geometry))for(const ring of poly)drawProjectedLine(ctx,ring,w,h);
  return true;
};
const mix=(a,b,t)=>{
  const p=x=>parseInt(x.slice(1),16),aa=p(a),bb=p(b),m=(x,y)=>Math.round(x+(y-x)*t);
  return '#'+[m(aa>>16,bb>>16),m((aa>>8)&255,(bb>>8)&255),m(aa&255,bb&255)].map(x=>(x&255).toString(16).padStart(2,'0')).join('');
};
const continent={
  'Europa':'#7FB18B','Asia':'#BBAE70','Afrika':'#D7A16A',
  'Nord-Amerika':'#87B78D','Sør-Amerika':'#59AB80','Oseania':'#A6BA82'
};
/* Broad natural regions are deliberately sparse. The land clip is the source
   of truth, so a painterly wash cannot escape across a border or coast. */
const biomes=[
  ['ice',-42,72,.17],['ice',18,69,.11],['ice',88,68,.16],['ice',-110,68,.13],
  ['forest',-111,55,.16],['forest',-84,51,.12],['forest',-62,-5,.18],['forest',-71,-12,.13],
  ['forest',12,55,.12],['forest',52,59,.16],['forest',87,59,.17],['forest',111,55,.14],['forest',23,0,.13],['forest',104,17,.13],
  ['desert',-7,25,.19],['desert',16,25,.23],['desert',35,25,.20],['desert',51,25,.14],['desert',68,38,.10],['desert',79,27,.10],['desert',134,-24,.16],
  ['savanna',11,8,.14],['savanna',28,-5,.17],['savanna',25,-22,.15],['savanna',-58,-18,.10]
];
const landmarks=[
  /* level 1: continental landmarks */
  ['mountains',10,46,.78,1],['mountains',79,31,1.0,1],['mountains',-109,40,.86,1],['mountains',-70,-24,.90,1],
  ['trees',20,61,.72,1],['trees',55,58,.80,1],['trees',-103,52,.74,1],
  ['pyramids',30,27,.67,1],['ship',-29,24,.78,1],['whale',-27,-31,.82,1],
  /* level 2: geographic regions */
  ['elephant',28,-3,.70,2],['giraffe',23,-25,.68,2],['camel',11,24,.62,2],['jungle',-61,-5,.85,2],['jungle',23,0,.72,2],['village',16,50,.64,2],
  ['lighthouse',-9,38,.48,2],['lighthouse',-71,42,.46,2],['dolphin',112,-22,.55,2],
  /* level 3: named demonstration areas */
  ['mountains',8,61,.92,3],['trees',8,60,.72,3],['mountains',138,36,.76,3],['village',139,35,.58,3],['jungle',-61,-3,.96,3],['cloud',-2,24,.56,3]
];
/* Large, hand-drawn terrain silhouettes form the readable first layer. They
   deliberately use the same lon/lat anchoring as the finer art above, but
   remain legible on a small iPhone globe. */
const terrainMarks=[
  ['ridge',10,46,1.00,1],['ridge',79,31,1.18,1],['ridge',-109,40,1.02,1],['ridge',-70,-24,1.10,1],
  ['forest',55,58,.92,1],['forest',-103,52,.84,1],['dunes',17,25,1.16,1],
  ['ridge',8,61,1.22,3],['ridge',138,36,1.04,3],['forest',-61,-3,1.18,3]
];
const draw=art.draw;

function landClip(ctx,w,h){
  ctx.beginPath();let any=false;
  for(const c of land())if(c.geometry){any=path(ctx,c,w,h)||any;}
  if(any)ctx.clip();
  return any;
}
function ocean(ctx,w,h,s){
  const g=ctx.createRadialGradient(w*.35,h*.24,2,w*.54,h*.57,s*.68);
  g.addColorStop(0,'#B9F3F0');g.addColorStop(.22,'#57D3D8');g.addColorStop(.55,'#218FBD');g.addColorStop(1,'#135B91');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.globalAlpha=.38;ctx.strokeStyle='#E1FFFF';ctx.lineWidth=Math.max(.7,s*.0013);
  for(const lat of [-60,-30,0,30,60]){ctx.beginPath();const a=[];for(let lon=-180;lon<=180;lon+=4)a.push([lon,lat]);drawProjectedLine(ctx,a,w,h);ctx.stroke();}
  ctx.restore();
}
function paintLandBase(ctx,w,h,s){
  for(const c of land()){
    if(!c.geometry)continue;const base=continent[c.continent]||'#73986B';
    const g=ctx.createLinearGradient(w*.25,h*.12,w*.78,h*.88);
    g.addColorStop(0,mix(base,'#FFF7D8',.30));g.addColorStop(.50,base);g.addColorStop(1,mix(base,'#264E47',.25));
    ctx.save();ctx.shadowColor='rgba(29,54,48,.30)';ctx.shadowBlur=Math.max(3,s*.009);ctx.shadowOffsetY=Math.max(1,s*.003);
    ctx.beginPath();if(path(ctx,c,w,h)){ctx.fillStyle=g;ctx.fill();}ctx.restore();
  }
  ctx.save();if(!landClip(ctx,w,h)){ctx.restore();return;}
  const sun=ctx.createRadialGradient(w*.33,h*.22,0,w*.50,h*.50,s*.52);sun.addColorStop(0,'rgba(255,249,211,.34)');sun.addColorStop(.62,'rgba(255,244,194,.04)');sun.addColorStop(1,'rgba(38,81,57,.12)');ctx.fillStyle=sun;ctx.fillRect(0,0,w,h);ctx.restore();
}
function paintBiomes(ctx,w,h,s){
  ctx.save();if(!landClip(ctx,w,h)){ctx.restore();return;}
  for(const [type,lon,lat,size] of biomes){
    const p=project(lon,lat,w,h);if(!p||p[2]<.10)continue;const r=s*size*clamp(.56+p[2]*.52,.60,1.08);
    const colors=type==='desert'?['rgba(249,196,88,.70)','rgba(204,135,50,.12)']:type==='ice'?['rgba(255,255,252,.88)','rgba(213,240,243,.10)']:type==='savanna'?['rgba(192,172,78,.54)','rgba(109,116,43,.11)']:['rgba(33,129,73,.60)','rgba(31,91,53,.12)'];
    const g=ctx.createRadialGradient(p[0]-r*.18,p[1]-r*.12,1,p[0],p[1],r);g.addColorStop(0,colors[0]);g.addColorStop(.58,colors[1]);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p[0],p[1],r,r*.62,-.10,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function paintBorders(ctx,w,h,s){
  for(const c of land()){
    if(!c.geometry)continue;ctx.beginPath();if(!path(ctx,c,w,h))continue;
    const selected=c.id===globeSelected;
    if(selected){ctx.save();ctx.fillStyle='rgba(255,215,91,.72)';ctx.shadowColor='rgba(255,188,36,.46)';ctx.shadowBlur=Math.max(8,s*.014);ctx.fill();ctx.restore();}
    ctx.strokeStyle=selected?'rgba(255,253,225,.98)':`rgba(255,250,226,${globeZoom>2.4?.48:.29})`;ctx.lineWidth=selected?Math.max(1.7,s*.003):Math.max(.55,s*.0011);ctx.stroke();
  }
}
function terrainSilhouette(ctx,type,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.shadowColor='rgba(29,59,57,.25)';ctx.shadowBlur=Math.max(2,k*.18);ctx.shadowOffsetY=Math.max(1,k*.08);
  if(type==='ridge'){
    for(const [dx,dy,scale,tone] of [[-.48,.16,.72,'#7B8D83'],[0,-.06,1,'#73877E'],[.52,.18,.67,'#68857C']]){
      const m=k*scale;ctx.save();ctx.translate(k*dx,k*dy);ctx.fillStyle=tone;ctx.beginPath();ctx.moveTo(0,-m*.78);ctx.lineTo(-m*.72,m*.55);ctx.lineTo(m*.72,m*.55);ctx.closePath();ctx.fill();ctx.fillStyle='#FFF7D9';ctx.beginPath();ctx.moveTo(0,-m*.78);ctx.lineTo(-m*.28,-m*.22);ctx.lineTo(-m*.05,-m*.31);ctx.lineTo(m*.26,-m*.05);ctx.closePath();ctx.fill();ctx.restore();
    }
  }else if(type==='forest'){
    for(const [dx,dy,scale,tone] of [[-.45,.14,.72,'#296B48'],[.04,-.10,1,'#367D4C'],[.52,.16,.64,'#4F9658']]){const m=k*scale;ctx.fillStyle=tone;ctx.beginPath();ctx.moveTo(k*dx,-m*.78);ctx.lineTo(k*(dx-.42*scale),m*.50);ctx.lineTo(k*(dx+.42*scale),m*.50);ctx.closePath();ctx.fill();ctx.fillStyle='#805635';ctx.fillRect(k*dx-m*.06,m*.46,m*.12,m*.28)}
  }else{
    ctx.strokeStyle='#CE8E3A';ctx.lineWidth=Math.max(1.2,k*.12);ctx.lineCap='round';for(const off of [-.34,.08,.46]){ctx.beginPath();ctx.arc(k*off,k*.18,k*.48,Math.PI*1.06,Math.PI*1.92);ctx.stroke()}
  }
  ctx.restore();
}
function paintTerrainMarks(ctx,w,h,s,level,moving){
  if(moving)return 0;let painted=0;
  for(const [type,lon,lat,scale,minLevel] of terrainMarks){
    if(level<minLevel)continue;const p=project(lon,lat,w,h);if(!p||p[2]<.16)continue;
    const k=s*.058*scale*clamp(.70+p[2]*.42,.72,1.14)*clamp(Math.pow(globeZoom,.12),1,1.26);
    terrainSilhouette(ctx,type,p[0],p[1],k);painted++;
  }
  return painted;
}
function paintLandmarks(ctx,w,h,s,level,moving){
  if(moving)return 0;
  let painted=0;
  for(const [kind,lon,lat,scale,minLevel] of landmarks){
    if(level<minLevel)continue;const p=project(lon,lat,w,h);if(!p||p[2]<.18)continue;
    const fn=draw[kind];if(!fn)continue;const k=s*.036*scale*clamp(.60+p[2]*.46,.64,1.06)*clamp(Math.pow(window.globeZoom,.16),1,1.30);
    ctx.save();ctx.globalAlpha=level===minLevel?1:.92;fn(ctx,p[0],p[1],k,false);ctx.restore();painted++;
  }
  return painted;
}
function paintSmallCountries(ctx,w,h,s){
  if(typeof isTinyCountry!=='function')return;
  for(const c of land()){
    if(!isTinyCountry(c)&&c.id!==globeSelected)continue;const p=project(c.lon,c.lat,w,h);if(!p)continue;const r=c.id===globeSelected?Math.max(5.3,s*.010):Math.max(2.1,s*.0038);ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fillStyle=c.id===globeSelected?'#FFD65E':'#FFF3A8';ctx.fill();ctx.strokeStyle='rgba(83,63,35,.38)';ctx.lineWidth=1;ctx.stroke();
  }
}
function discoveryDraw(){
  const canvas=document.getElementById('globe-canvas');if(!canvas?._cssW||!canvas?._cssH)return;
  const w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h),dpr=canvas._dpr||1,ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.clip();
  ocean(ctx,w,h,s);paintLandBase(ctx,w,h,s);paintBiomes(ctx,w,h,s);
  const level=globeZoom<1.7?1:globeZoom<2.8?2:3;
  /* A stale interaction flag must never suppress the settled illustration
     layer. Pointer ownership is the reliable signal while a drag is active. */
  const moving=window.__lariaGlobeInteracting===true&&typeof globePointers!=='undefined'&&globePointers.size>0;
  const terrainCount=paintTerrainMarks(ctx,w,h,s,level,moving);
  const landmarkCount=paintLandmarks(ctx,w,h,s,level,moving);paintBorders(ctx,w,h,s);paintSmallCountries(ctx,w,h,s);
  if(typeof drawGlobePulse==='function')drawGlobePulse(ctx,w,h);
  ctx.restore();
  screen.dataset.discoveryGlobeLevel=String(level);screen.dataset.discoveryGlobe='phase1';
  canvas.dataset.discoveryRenderer='live';canvas.dataset.discoveryLandmarks=String(landmarkCount+terrainCount);canvas.dataset.discoveryMoving=String(moving);
}
window.LARIA_DISCOVERY_GLOBE_DRAW=discoveryDraw;
const wait=()=>{
  if(typeof window.resizeGlobe!=='function'||!document.getElementById('globe-canvas'))return requestAnimationFrame(wait);
  window.__lariaDiscoveryGlobeBaseDraw=window.drawGlobe;
  /* atlas-perspective is allowed to keep owning its own non-globe views. On
     the isolated classic preview, however, it can reassign drawGlobe during
     its delayed mode transition. Reassert only after that child action. */
  let activated=false;
  const activate=()=>{
    if(!screen.classList.contains('active')){activated=false;return;}
    const classic=document.querySelector('#globe-mode [data-globe-mode="classic"]');
    if(classic&&!classic.classList.contains('active'))return;
    /* Repaint only on a real mode change, not during idle polling. */
    if(!activated||window.drawGlobe!==discoveryDraw){
      window.drawGlobe=discoveryDraw;try{drawGlobe=discoveryDraw}catch(_){}
      try{window.resizeGlobe();discoveryDraw();activated=true}catch(_){}
    }
  };
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('#globe-mode [data-globe-mode="classic"]')){
      requestAnimationFrame(()=>requestAnimationFrame(activate));
    }
  },true);
  new MutationObserver(()=>requestAnimationFrame(activate)).observe(screen,{attributes:true,attributeFilter:['class']});
  activate();
  requestAnimationFrame(()=>requestAnimationFrame(activate));
  setTimeout(activate,180);
  /* Detect late atlas reassignment without repeatedly painting while idle. */
  setInterval(activate,240);
};
wait();
})();
