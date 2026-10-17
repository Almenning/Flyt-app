(()=>{'use strict';
/*
 * Independent geographic paint layer for Enkel | Oppdag.
 * ?discovery-globe-preview=1 still selects the QA preview without a user tap.
 *
 * It does not own input, land data, progress, country selection or the base
 * renderer.  It only uses their proven orthographic projection and replaces
 * the paint pass for the isolated preview.  Every non-ocean coordinate below
 * is longitude/latitude, never a screen position.
 */
const forcedPreview=new URLSearchParams(location.search).has('discovery-globe-preview');
const screen=document.getElementById('world-screen');
const art=window.LariaGlobeArtV24;
if(!screen||!art||typeof window.drawGlobe!=='function'||typeof window.globeProject!=='function'){
  window.__lariaDiscoveryStartupError='Missing prerequisite: '+JSON.stringify({
    screen:!!screen,art:!!art,draw:typeof window.drawGlobe,projection:typeof window.globeProject
  });return;
}
window.__lariaDiscoveryGlobePreview=false;

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
  ['mountains',8,61,.92,3],['trees',8,60,.72,3],['mountains',138.7,35.36,.90,3],['village',139,35,.58,3],['jungle',-61,-3,.96,3],['cloud',-2,24,.56,3],
  ['sakura',139.7,35.7,.75,3],['sakura',135.8,35.1,.68,3],
  ['fjord',6.9,61.3,.75,3],['fjord',7.4,62.5,.62,3],['fjord',13.2,66.4,.48,3],
  ['jungle',-54,-5,.65,3],['wetlands',-56.8,-18.2,.62,3]
];
/* Large, hand-drawn terrain silhouettes form the readable first layer. They
   deliberately use the same lon/lat anchoring as the finer art above, but
   remain legible on a small iPhone globe. */
const terrainMarks=[
  ['ridge',10,46,1.00,1],['ridge',79,31,1.18,1],['ridge',-109,40,1.02,1],['ridge',-70,-24,1.10,1],
  ['forest',55,58,.92,1],['forest',-103,52,.84,1],['dunes',17,25,1.16,1],
  ['ridge',8,61,1.00,3],['ridge',138,36,.94,3],['forest',-61,-3,1.02,3],
  ['ridge',-116,46,.73,1],['ridge',-73,-10,.72,1],['ridge',-70,-35,.72,1],
  ['ridge',88,29,.78,1],['ridge',-4,32,.54,2],['ridge',43,42,.58,2],
  ['ridge',60,59,.61,2],['ridge',29,-29,.58,2],['ridge',148,-30,.57,2],
  ['forest',-62,-5,.88,1],['forest',23,-1,.69,1],['forest',105,17,.69,1],
  ['forest',-116,57,.70,1],['forest',92,59,.79,1],['forest',-55,-9,.62,2],
  ['forest',-67,-9,.64,2],['forest',112,2,.67,2],['forest',126,46,.62,2],
  ['dunes',-4,24,.75,1],['dunes',35,24,.76,1],['dunes',133,-24,.82,1],
  ['dunes',46,23,.63,2],['dunes',104,42,.62,2],
  ['ridge',10,47,.42,3],['ridge',6,62,.41,3],['ridge',12,64,.42,3],
  ['ridge',78,32,.44,3],['ridge',84,29,.45,3],['ridge',-72,-16,.45,3],
  ['forest',-60,-7,.45,3],['forest',-54,-4,.46,3],['forest',139,37,.40,3],
  ['dunes',4,22,.47,3],['dunes',11,24,.47,3],
  ['ridge',12,65,.58,2],['ridge',15.4,67.4,.57,2],['ridge',18.4,69.1,.52,3],
  ['forest',11,61,.49,2],['forest',-64,-5,.52,2],['forest',-56,-5,.49,2],
  ['forest',-45,-23,.56,3],['forest',-52,-9,.52,3]
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
    if(selected){ctx.save();ctx.fillStyle='rgba(255,224,137,.13)';ctx.shadowColor='rgba(255,188,36,.22)';ctx.shadowBlur=Math.max(8,s*.014);ctx.fill();ctx.restore();}
    ctx.strokeStyle=selected?'rgba(255,253,225,.98)':`rgba(255,250,226,${globeZoom>2.4?.48:.29})`;ctx.lineWidth=selected?Math.max(1.7,s*.003):Math.max(.55,s*.0011);ctx.stroke();
  }
}
/* Every geographic trail is a sequence of longitude/latitude anchors. */
const reliefTrails=[
 ['ridge',1,[[-124,51],[-119,47],[-115,43],[-110,39],[-106,35]]],
 ['ridge',1,[[-78,3],[-76,-5],[-73,-13],[-70,-23],[-70,-32],[-72,-42]]],
 ['ridge',1,[[73,35],[79,32],[85,29],[91,28],[98,29]]],
 ['dunes',1,[[-15,24],[-8,25],[0,25],[10,24],[20,23],[30,23]]],
 ['ridge',2,[[5,47],[9,46],[13,47]]],
 ['ridge',2,[[6,59],[9,63],[14,67]]],
 ['ridge',2,[[139,35],[140,38],[142,41]]],
 ['dunes',2,[[120,-23],[129,-24],[136,-24],[142,-25]]],
 ['river',2,[[-72,-4],[-68,-4.1],[-64,-3.5],[-60,-3.1],[-56.5,-2.6],[-53.5,-2.4],[-50,-1.8]]],
 ['river',2,[[31,30],[31,25],[32,20],[33,14],[32,8]]]
];
function paintReliefTrails(ctx,w,h,s,level,moving){
 if(moving)return 0;let count=0;
 for(const [kind,minLevel,coords] of reliefTrails){
   if(level<minLevel)continue;
   ctx.beginPath();let started=false,visible=0;
   for(const [lon,lat] of coords){
     const p=project(lon,lat,w,h);
     if(!p||p[2]<.12){started=false;continue;}
     if(!started){ctx.moveTo(p[0],p[1]);started=true;}else ctx.lineTo(p[0],p[1]);
     visible++;
   }
   if(visible<2)continue;
   const width=s*(kind==='ridge'?.017:kind==='river'?.008:.025);
   ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=width*1.9;
   ctx.strokeStyle=kind==='ridge'?'rgba(54,83,70,.23)':kind==='river'?'rgba(33,116,146,.40)':kind==='dunes'?'rgba(206,144,62,.22)':'rgba(27,100,57,.20)';ctx.stroke();
   ctx.lineWidth=width;
   ctx.strokeStyle=kind==='ridge'?'rgba(221,223,177,.75)':kind==='river'?'rgba(127,212,216,.85)':kind==='dunes'?'rgba(252,216,134,.74)':'rgba(44,131,77,.64)';ctx.stroke();ctx.restore();count++;
 }
 return count;
}
/* Painterly vector silhouettes. All positions are already projected from
   longitude/latitude, and the caller clips them to real land geometry. */

/* Deterministic small-scale texture: geographical sampling, not screen-fixed
   noise. The existing land clip protects coastlines. Increasing density with
   zoom makes the scene reveal something new without zooming a static bitmap. */
const geographicTextureZones=[
 ['forest',-109,56,34,14,18],['forest',-85,45,17,12,10],
 ['forest',16,62,22,10,16],['forest',82,59,56,14,24],
 ['forest',-62,-5,26,15,26],['forest',22,0,18,13,15],
 ['forest',104,14,22,13,15],['forest',135,36,8,6,10],
 ['dune',13,24,42,13,25],['dune',47,24,20,10,10],
 ['dune',135,-24,26,14,15],['dune',104,42,19,10,7],
 ['rock',-113,43,13,19,12],['rock',-72,-22,9,31,13],
 ['rock',86,31,20,7,15],['rock',10,46,9,3,7],
 ['rock',10,64,11,13,14],['rock',139,37,7,7,10]
];
const geoNoise=n=>{const x=Math.sin(n*78.233+19.192)*43758.5453;return x-Math.floor(x);};
function paintGeographicTexture(ctx,w,h,s,level,moving){
 if(moving)return 0;
 let painted=0;
 for(let z=0;z<geographicTextureZones.length;z++){
   const [kind,centerLon,centerLat,lonSpan,latSpan,total]=geographicTextureZones[z];
   const density=level===1?.22:level===2?.54:1;
   for(let i=0;i<Math.ceil(total*density);i++){
     const lon=centerLon+(geoNoise(z*271+i*17+1)-.5)*lonSpan;
     const lat=centerLat+(geoNoise(z*319+i*19+4)-.5)*latSpan;
     const p=project(lon,lat,w,h);
     if(!p||p[2]<.18)continue;
     const k=s*.0055*clamp(.68+p[2]*.42,.68,1.10)*(level===3?1.15:1);
     ctx.save();ctx.translate(p[0],p[1]);ctx.lineCap='round';
     if(kind==='forest'){
       ctx.fillStyle='rgba(25,98,55,.48)';
       ctx.beginPath();ctx.ellipse(-k*.45,k*.17,k*.44,k*.65,-.3,0,Math.PI*2);
       ctx.ellipse(k*.37,-k*.10,k*.49,k*.78,.28,0,Math.PI*2);ctx.fill();
       ctx.strokeStyle='rgba(211,239,167,.38)';ctx.lineWidth=Math.max(.5,k*.23);
       ctx.beginPath();ctx.moveTo(-k*.48,-k*.38);ctx.lineTo(-k*.51,k*.20);ctx.stroke();
     }else if(kind==='dune'){
       ctx.strokeStyle='rgba(255,242,184,.69)';ctx.lineWidth=Math.max(.65,k*.38);
       ctx.beginPath();ctx.moveTo(-k*1.06,k*.34);ctx.quadraticCurveTo(0,-k*.79,k*1.13,k*.24);ctx.stroke();
       ctx.strokeStyle='rgba(180,109,46,.39)';ctx.lineWidth=Math.max(.55,k*.22);
       ctx.beginPath();ctx.moveTo(-k*.50,k*.42);ctx.lineTo(k*.70,k*.59);ctx.stroke();
     }else{
       ctx.fillStyle='rgba(248,248,222,.65)';ctx.beginPath();
       ctx.moveTo(0,-k*.92);ctx.lineTo(-k*.75,k*.48);ctx.lineTo(k*.72,k*.48);ctx.closePath();ctx.fill();
       ctx.strokeStyle='rgba(54,95,79,.45)';ctx.lineWidth=Math.max(.5,k*.23);
       ctx.beginPath();ctx.moveTo(0,-k*.93);ctx.lineTo(k*.18,k*.30);ctx.stroke();
     }
     ctx.restore();painted++;
   }
 }
 return painted;
}

function terrainSilhouette(ctx,type,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';
  ctx.shadowColor='rgba(26,50,38,.28)';ctx.shadowBlur=Math.max(2,k*.16);ctx.shadowOffsetY=Math.max(1,k*.07);
  if(type==='ridge'){
    ctx.fillStyle='rgba(75,119,98,.50)';
    ctx.beginPath();ctx.ellipse(0,k*.40,k*.95,k*.21,0,0,Math.PI*2);ctx.fill();
    for(const [dx,dy,scale,dark,light] of [
      [-.47,.16,.70,'#527A72','#96B7A1'],
      [.43,.19,.66,'#54796C','#8EAB91'],
      [0,-.07,.96,'#456C67','#91AEA2']
    ]){
      const m=k*scale;
      ctx.save();ctx.translate(k*dx,k*dy);
      const g=ctx.createLinearGradient(-m*.40,-m*.77,m*.51,m*.55);
      g.addColorStop(0,light);g.addColorStop(.50,dark);g.addColorStop(1,'#315952');
      ctx.fillStyle=g;ctx.beginPath();
      ctx.moveTo(-m*.71,m*.56);ctx.quadraticCurveTo(-m*.37,-m*.26,0,-m*.82);
      ctx.quadraticCurveTo(m*.28,-m*.28,m*.72,m*.56);ctx.closePath();ctx.fill();
      ctx.fillStyle='#FBF8DF';ctx.beginPath();
      ctx.moveTo(0,-m*.82);ctx.lineTo(-m*.31,-m*.30);ctx.lineTo(-m*.12,-m*.42);
      ctx.lineTo(m*.07,-m*.30);ctx.lineTo(m*.24,-m*.40);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(38,76,65,.28)';ctx.lineWidth=Math.max(.6,m*.027);
      ctx.beginPath();ctx.moveTo(m*.04,-m*.22);ctx.lineTo(m*.33,m*.36);ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle='rgba(50,111,74,.66)';
    ctx.beginPath();ctx.ellipse(-k*.45,k*.52,k*.28,k*.12,0,0,Math.PI*2);
    ctx.ellipse(k*.45,k*.52,k*.34,k*.13,0,0,Math.PI*2);ctx.fill();
  }else if(type==='forest'){
    ctx.fillStyle='rgba(28,106,56,.27)';
    ctx.beginPath();ctx.ellipse(0,k*.44,k*1.04,k*.24,0,0,Math.PI*2);ctx.fill();
    for(const [dx,dy,scale,tone] of [[-.53,.17,.73,'#286A49'],[.45,.12,.70,'#4F9760'],[-.05,-.07,1,'#377D53']]){
      const m=k*scale,cx=k*dx,cy=k*dy;
      ctx.fillStyle='#785D3D';ctx.fillRect(cx-m*.06,cy+m*.16,m*.12,m*.47);
      const canopy=ctx.createLinearGradient(cx-m*.36,cy-m*.83,cx+m*.32,cy+m*.33);
      canopy.addColorStop(0,'#9BBB74');canopy.addColorStop(.35,tone);canopy.addColorStop(1,'#225C40');
      ctx.fillStyle=canopy;ctx.beginPath();ctx.moveTo(cx,cy-m*.87);
      ctx.bezierCurveTo(cx-m*.24,cy-m*.58,cx-m*.38,cy-m*.05,cx-m*.45,cy+m*.18);
      ctx.quadraticCurveTo(cx,cy+m*.38,cx+m*.45,cy+m*.18);
      ctx.bezierCurveTo(cx+m*.37,cy-m*.05,cx+m*.23,cy-m*.58,cx,cy-m*.87);ctx.fill();
      ctx.strokeStyle='rgba(230,251,182,.55)';ctx.lineWidth=Math.max(.7,m*.042);
      ctx.beginPath();ctx.moveTo(cx-m*.07,cy-m*.58);
      ctx.quadraticCurveTo(cx-m*.21,cy-m*.22,cx-m*.26,cy+m*.10);ctx.stroke();
    }
  }else if(type==='dunes'){
    ctx.fillStyle='rgba(187,116,45,.18)';
    ctx.beginPath();ctx.ellipse(0,k*.34,k*1.06,k*.29,0,0,Math.PI*2);ctx.fill();
    for(const [dx,dy,scale] of [[-.36,.16,.62],[.38,.18,.67],[0,-.12,1]]){
      const m=k*scale,cx=k*dx,cy=k*dy;
      const sand=ctx.createLinearGradient(cx-m*.30,cy-m*.39,cx+m*.36,cy+m*.48);
      sand.addColorStop(0,'#FFF0B9');sand.addColorStop(.5,'#EFC47D');sand.addColorStop(1,'#CC9350');
      ctx.fillStyle=sand;ctx.beginPath();ctx.moveTo(cx-m*.81,cy+m*.51);
      ctx.quadraticCurveTo(cx-m*.28,cy-m*.72,cx+m*.24,cy-m*.26);
      ctx.quadraticCurveTo(cx+m*.65,cy-m*.06,cx+m*.83,cy+m*.50);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(255,250,196,.82)';ctx.lineWidth=Math.max(.8,m*.05);
      ctx.beginPath();ctx.moveTo(cx-m*.55,cy+m*.10);
      ctx.quadraticCurveTo(cx-m*.15,cy-m*.45,cx+m*.21,cy-m*.25);ctx.stroke();
    }
  }
  ctx.restore();
}
function paintCloseupDiscovery(ctx,kind,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';
  if(kind==='sakura'){
    /* Two flowering trees, not the generic pine used in boreal regions. */
    for(const [dx,scale] of [[-.22,.72],[.30,.92]]){
      ctx.save();ctx.translate(k*dx,0);ctx.scale(scale,scale);
      ctx.strokeStyle='#83624D';ctx.lineWidth=Math.max(1,k*.13);ctx.beginPath();
      ctx.moveTo(0,k*.43);ctx.lineTo(0,-k*.13);ctx.lineTo(-k*.30,-k*.40);
      ctx.moveTo(0,-k*.15);ctx.lineTo(k*.36,-k*.53);ctx.stroke();
      for(const [cx,cy,r] of [[-.33,-.38,.31],[0,-.58,.39],[.34,-.45,.32],[.09,-.26,.32]]){
        const g=ctx.createRadialGradient(k*cx-k*r*.17,k*cy-k*r*.15,0,k*cx,k*cy,k*r);
        g.addColorStop(0,'#FFF7EE');g.addColorStop(.40,'#F7BBD0');g.addColorStop(1,'#D880A8');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(k*cx,k*cy,k*r,0,Math.PI*2);ctx.fill();
      }ctx.restore();
    }
  }else if(kind==='wetlands'){
    ctx.fillStyle='rgba(74,167,151,.38)';ctx.beginPath();ctx.ellipse(0,k*.10,k*.74,k*.32,-.14,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(192,237,207,.82)';ctx.lineWidth=Math.max(.8,k*.085);
    for(const y of [-.08,.16]){ctx.beginPath();ctx.moveTo(-k*.60,k*y);ctx.quadraticCurveTo(0,k*(y-.17),k*.54,k*y);ctx.stroke();}
    ctx.strokeStyle='#427D50';ctx.lineWidth=Math.max(.9,k*.10);
    for(const x of [-.50,.45]){ctx.beginPath();ctx.moveTo(k*x,k*.13);ctx.lineTo(k*(x-.10),-k*.44);ctx.stroke();}
  }else if(kind==='fjord'){
    /* Narrow water and steep banks all remain within the real land clip. */
    ctx.strokeStyle='rgba(32,104,126,.38)';ctx.lineWidth=Math.max(1,k*.38);
    ctx.beginPath();ctx.moveTo(-k*.57,-k*.60);ctx.bezierCurveTo(k*.20,-k*.38,-k*.24,k*.23,k*.48,k*.50);ctx.stroke();
    ctx.strokeStyle='#7FD7D6';ctx.lineWidth=Math.max(1,k*.23);ctx.stroke();
    ctx.strokeStyle='rgba(250,249,222,.78)';ctx.lineWidth=Math.max(.75,k*.055);
    ctx.beginPath();ctx.moveTo(-k*.65,-k*.52);ctx.quadraticCurveTo(k*.01,-k*.20,-k*.07,k*.08);ctx.stroke();
    ctx.fillStyle='rgba(74,115,89,.62)';ctx.beginPath();ctx.moveTo(k*.1,-k*.33);ctx.lineTo(k*.36,-k*.74);ctx.lineTo(k*.56,-k*.23);ctx.closePath();ctx.fill();
  }ctx.restore();
}

function paintTerrainMarks(ctx,w,h,s,level,moving){
  if(moving)return 0;let painted=0;
  for(const [type,lon,lat,scale,minLevel] of terrainMarks){
    if(level<minLevel)continue;const p=project(lon,lat,w,h);if(!p||p[2]<.16)continue;
    const k=s*.044*scale*clamp(.70+p[2]*.42,.72,1.14)*clamp(Math.pow(globeZoom,.12),1,1.26);
    terrainSilhouette(ctx,type,p[0],p[1],k);painted++;
  }
  return painted;
}
function paintLandmarks(ctx,w,h,s,level,moving,waterOnly=false){
  if(moving)return 0;
  let painted=0;
  for(const [kind,lon,lat,scale,minLevel] of landmarks){
    if(level<minLevel)continue;const water=['ship','whale','dolphin','cloud'].includes(kind);if(water!==waterOnly)continue;
    const p=project(lon,lat,w,h);if(!p||p[2]<.18)continue;
    const fn=draw[kind],terrainKind=kind==='mountains'?'ridge':kind==='trees'?'forest':null,closeup=['sakura','fjord','wetlands'].includes(kind);
    if(!fn&&!terrainKind&&!closeup)continue;const k=s*.036*scale*clamp(.60+p[2]*.46,.64,1.06)*clamp(Math.pow(globeZoom,.16),1,1.30);
    ctx.save();ctx.globalAlpha=level===minLevel?1:.92;
    if(closeup)paintCloseupDiscovery(ctx,kind,p[0],p[1],k*1.65);
    else if(terrainKind)terrainSilhouette(ctx,terrainKind,p[0],p[1],k*1.80);
    else fn(ctx,p[0],p[1],k,false);
    ctx.restore();painted++;
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
  /* A moving globe uses its base map without the expensive land clip for
     stationary-only detail. This saves an entire geometry pass per frame. */
  ctx.save();const validLand=!moving&&landClip(ctx,w,h);
  const reliefCount=validLand?paintReliefTrails(ctx,w,h,s,level,moving):0;
  const textureCount=validLand?paintGeographicTexture(ctx,w,h,s,level,moving):0;
  const terrainCount=validLand?paintTerrainMarks(ctx,w,h,s,level,moving):0;
  const landmarkCount=validLand?paintLandmarks(ctx,w,h,s,level,moving,false):0;
  ctx.restore();
  const seaCount=paintLandmarks(ctx,w,h,s,level,moving,true);
  paintBorders(ctx,w,h,s);paintSmallCountries(ctx,w,h,s);
  if(typeof drawGlobePulse==='function')drawGlobePulse(ctx,w,h);
  ctx.restore();
  screen.dataset.discoveryGlobeLevel=String(level);screen.dataset.discoveryGlobe='phase1';
  canvas.dataset.discoveryRenderer='live';canvas.dataset.discoveryLandmarks=String(landmarkCount+terrainCount+reliefCount+textureCount+seaCount);canvas.dataset.discoveryMoving=String(moving);
  canvas.dataset.discoveryPaintCount=String(Number(canvas.dataset.discoveryPaintCount||0)+1);
}

window.LARIA_DISCOVERY_GLOBE_DRAW=discoveryDraw;
const preferenceKey='laria-globe-view-v1';
let desiredView='simple';
try{if(localStorage.getItem(preferenceKey)==='discover')desiredView='discover'}catch(_){}
if(forcedPreview)desiredView='discover';
const controls=[...document.querySelectorAll('#globe-view-toggle [data-globe-view]')];
function syncButtons(){
  screen.dataset.globeView=desiredView;
  for(const btn of controls){
    const active=btn.dataset.globeView===desiredView;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  }
}
const wait=()=>{
  if(typeof window.resizeGlobe!=='function'||!document.getElementById('globe-canvas'))
    return requestAnimationFrame(wait);
  const baseDraw=window.drawGlobe;
  window.__lariaDiscoveryGlobeBaseDraw=baseDraw;
  let activated=false;
  const restore=()=>{
    if(window.drawGlobe===discoveryDraw){
      window.drawGlobe=baseDraw;
      try{drawGlobe=baseDraw}catch(_){}
    }
  };
  const activate=()=>{
    const classic=document.querySelector('#globe-mode [data-globe-mode="classic"]');
    const inClassic=screen.classList.contains('active')&&screen.dataset.mapPerspective==='globe'&&
      (!classic||classic.classList.contains('active'));
    const enabled=inClassic&&desiredView==='discover';
    window.__lariaDiscoveryGlobePreview=enabled;
    if(!enabled){
      const needsRestore=window.drawGlobe===discoveryDraw;
      if(needsRestore)restore();
      if(desiredView==='simple'){
        delete screen.dataset.discoveryGlobe;
        delete screen.dataset.discoveryGlobeLevel;
      }
      if(activated&&inClassic&&needsRestore){
        try{window.resizeGlobe();window.drawGlobe?.()}catch(error){
          window.__lariaDiscoveryGlobeLastError=String(error?.stack||error);
        }
      }
      activated=false;
      return;
    }
    if(!activated||window.drawGlobe!==discoveryDraw){
      window.drawGlobe=discoveryDraw;
      try{drawGlobe=discoveryDraw}catch(_){}
      try{window.resizeGlobe();discoveryDraw();activated=true}
      catch(error){
        window.__lariaDiscoveryGlobeLastError=String(error?.stack||error);
        desiredView='simple';
        window.__lariaDiscoveryGlobePreview=false;
        restore();syncButtons();
        try{window.drawGlobe?.()}catch(_){}
      }
    }
  };
  const chooseView=view=>{
    if(view!=='simple'&&view!=='discover')return;
    desiredView=view;
    try{localStorage.setItem(preferenceKey,view)}catch(_){}
    syncButtons();
    activate();
  };
  window.LARIA_SET_GLOBE_VIEW=chooseView;
  controls.forEach(btn=>btn.addEventListener('click',()=>chooseView(btn.dataset.globeView)));
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('#globe-mode [data-globe-mode]'))
      requestAnimationFrame(()=>requestAnimationFrame(activate));
  },true);
  new MutationObserver(()=>requestAnimationFrame(activate)).observe(screen,{
    attributes:true,attributeFilter:['class','data-map-perspective']
  });
  syncButtons();
  activate();
  requestAnimationFrame(()=>requestAnimationFrame(activate));
  setTimeout(activate,180);
  // Does not repaint while idle; only restores the active painter after a
  // late atlas router reassignment.
  setInterval(activate,240);
};
wait();
})();
