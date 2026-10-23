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
// Natural Earth Antarctica is intentionally excluded from shared country data.
const antarcticaGeo=window.LARIA_ANTARCTICA_GEOMETRY||null;
const antarcticaOutline=antarcticaGeo?{geometry:antarcticaGeo}:null;
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
/* Painterly, geographically anchored ecosystems.
   These are approximate biome corridors, not boundaries or scientific landcover
   datasets. The real country polygons are still the authority for every pixel.
   A continuous brush follows each geographic spine rather than stamping dots. */
const landscapeZones=[
  {name:'Canadian boreal',type:'forest',width:13,route:[[-127,54],[-117,55],[-105,55],[-93,55],[-81,52],[-66,51]]},
  {name:'Pacific temperate forests',type:'forest',width:9,route:[[-128,57],[-125,52],[-123,46],[-122,42]]},
  {name:'Amazonas rainforest',type:'rainforest',width:17,route:[[-73,-5],[-66,-4],[-61,-4],[-55,-4],[-49,-3]]},
  {name:'Atlantic rainforest',type:'rainforest',width:6,route:[[-48,-17],[-45,-22],[-43,-25]]},
  {name:'Congo rainforest',type:'rainforest',width:13,route:[[12,0],[19,-1],[26,0],[31,0]]},
  {name:'European woodlands',type:'forest',width:6,route:[[5,50],[12,51],[19,52],[27,54],[34,54]]},
  {name:'Scandinavian forests',type:'forest',width:9,route:[[7,59],[13,62],[21,65],[28,67]]},
  /* Europe is the first authored continent. These remain geographic
     corridors, so the extra character follows rotation and real coastlines. */
  {name:'Norwegian fjord forests',type:'forest',width:3.2,route:[[5.4,59.4],[6.4,61.1],[7.4,62.8],[10.0,64.7]]},
  {name:'Alpine valleys',type:'forest',width:3.4,route:[[6.1,45.8],[8.4,46.4],[10.7,46.6],[13.1,46.8]]},
  {name:'Mediterranean hills',type:'savanna',width:4.8,route:[[-1.0,42.5],[5.8,43.1],[11.2,42.0],[16.8,41.2],[21.8,40.7]]},
  {name:'Northern Asian taiga',type:'forest',width:12,route:[[38,60],[52,60],[67,60],[83,61],[100,59],[118,58],[136,55]]},
  {name:'Southeast Asian forests',type:'rainforest',width:11,route:[[94,23],[101,18],[105,13],[110,8],[115,3]]},
  {name:'Indonesian rainforest',type:'rainforest',width:7,route:[[99,1],[107,-1],[115,-2],[121,-2]]},
  {name:'Japan forests',type:'forest',width:4,route:[[135,34],[139,37],[142,41]]},
  {name:'Sahara dune seas',type:'desert',width:17,route:[[-14,24],[-5,24],[6,24],[17,23],[29,23],[37,23]]},
  {name:'Sahel grasslands',type:'savanna',width:10,route:[[-14,13],[-4,13],[10,13],[22,13],[34,12]]},
  {name:'Arabian desert',type:'desert',width:13,route:[[38,25],[44,24],[51,23],[55,23]]},
  {name:'Kalahari',type:'desert',width:9,route:[[17,-22],[22,-23],[25,-25]]},
  {name:'Australian outback',type:'desert',width:18,route:[[118,-23],[129,-24],[140,-25]]},
  {name:'Central Asian steppe',type:'savanna',width:11,route:[[47,44],[60,45],[73,45],[86,45],[99,46]]},
  {name:'Gobi desert',type:'desert',width:11,route:[[89,42],[98,42],[106,43],[113,44]]},
  {name:'Great Plains',type:'savanna',width:10,route:[[-104,45],[-101,40],[-100,34]]},
  {name:'South American grasslands',type:'savanna',width:10,route:[[-62,-30],[-60,-34],[-59,-37]]},
  {name:'Atacama',type:'desert',width:5,route:[[-69,-17],[-70,-23],[-70,-27]]},
  {name:'South African savanna',type:'savanna',width:10,route:[[22,-17],[28,-19],[30,-24]]},
  {name:'Greenland ice',type:'ice',width:22,route:[[-45,64],[-43,70],[-42,76],[-43,80]]},
  {name:'Canadian Arctic tundra',type:'tundra',width:10,route:[[-113,70],[-99,70],[-86,71],[-75,72]]},
  {name:'Arctic Siberia',type:'tundra',width:10,route:[[49,70],[64,70],[80,72],[98,72],[117,71],[136,70]]},
  {name:'North Australian tropics',type:'savanna',width:7,route:[[124,-15],[132,-15],[140,-17]]},
  {name:'Madagascar eastern forest',type:'forest',width:4,route:[[49,-14],[48,-18],[47,-22]]}
];
const ecosystemPalette={
  forest:['#296D51','#438A60','#8CB17B'],
  rainforest:['#1E704F','#298754','#79AD69'],
  desert:['#D9A45A','#F0C97E','#F9DEA0'],
  savanna:['#8D9C55','#B3B76C','#D7C989'],
  tundra:['#9FAF9D','#C0D1B9','#E6E5C9'],
  ice:['#E3F2EE','#F7FAEE','#FFFFFF']
};
/* Sampling longitude/latitude before projection ensures camera rotation,
   pinch zoom and country hit-testing all describe the same physical world. */
function smoothGeoStroke(ctx,route,w,h,s){
  ctx.beginPath();
  let continuous=false,painted=0,prior=null;
  for(let j=0;j<route.length-1;j++){
    const a=route[j],b=route[j+1];
    const subdivisions=Math.max(2,Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/1.25));
    for(let k=0;k<=subdivisions;k++){
      if(j>0&&k===0)continue;
      const t=k/subdivisions;
      const p=project(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,w,h);
      if(!p||p[2]<.10){continuous=false;prior=null;continue;}
      if(!continuous||prior&&Math.hypot(p[0]-prior[0],p[1]-prior[1])>s*.27){
        ctx.moveTo(p[0],p[1]);continuous=true;
      }else ctx.lineTo(p[0],p[1]);
      prior=p;painted++;
    }
  }
  return painted>=2;
}
function geoBrushWidth(zone,w,h,s){
  const center=zone.route[Math.floor(zone.route.length/2)];
  const a=project(center[0],center[1]-zone.width/2,w,h);
  const b=project(center[0],center[1]+zone.width/2,w,h);
  const ideal=a&&b?Math.hypot(a[0]-b[0],a[1]-b[1]):s*.455*globeZoom*zone.width*Math.PI/180;
  return clamp(ideal,s*.018,s*.46);
}

const landmarks=[
  /* level 1: continental landmarks */
  ['mountains',10,46,.78,1],['mountains',79,31,1.0,1],['mountains',-109,40,.86,1],['mountains',-70,-24,.90,1],
  ['trees',20,61,.72,1],['trees',55,58,.80,1],['trees',-103,52,.74,1],
  ['pyramids',30,27,.67,1],['ship',-29,24,.78,1],['whale',-27,-31,.82,1],
  /* level 2: geographic regions */
  ['elephant',28,-3,.70,2],['giraffe',23,-25,.68,2],['camel',11,24,.62,2],['jungle',-61,-5,.58,2],['jungle',23,0,.72,2],['village',16,50,.64,2],
  ['lighthouse',-9,38,.48,2],['lighthouse',-71,42,.46,2],['dolphin',112,-22,.55,2],
  /* level 3: named demonstration areas */
  ['mountains',8,61,.92,3],['trees',8,60,.72,3],['mountains',138.7,35.36,.90,3],['village',139,35,.58,3],['jungle',-61,-3,.67,3],['cloud',-2,24,.56,3],
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
  const g=ctx.createRadialGradient(w*.34,h*.22,2,w*.56,h*.60,s*.70);
  g.addColorStop(0,'#C9FAF0');g.addColorStop(.20,'#61D9D6');g.addColorStop(.54,'#1E92BA');g.addColorStop(1,'#0D4B7D');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  /* A transparent water glaze gives the sea a broad, curved volume before
     the geographic currents are added. It is clipped by discoveryDraw's
     sphere, so it cannot spill into the storyscape behind the globe. */
  const glaze=ctx.createLinearGradient(w*.16,h*.08,w*.84,h*.91);
  glaze.addColorStop(0,'rgba(244,255,238,.26)');
  glaze.addColorStop(.42,'rgba(89,214,210,.02)');
  glaze.addColorStop(1,'rgba(9,65,122,.30)');
  ctx.fillStyle=glaze;ctx.fillRect(0,0,w,h);
  /* Gentle currents retain a living ocean without turning the globe into a
     graticule. They are geographical paths, so they rotate with the world. */
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const [from,to,phase] of [[[-164,-37],[-78,-33],0],[[17,-29],[104,-25],1],[[111,18],[178,15],2],[[-150,37],[-76,41],3],[[-19,46],[54,43],4]]){
    const route=[];
    for(let i=0;i<=22;i++){const t=i/22;route.push([from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t+Math.sin(t*Math.PI*2+phase)*2.2]);}
    ctx.globalAlpha=.10;ctx.strokeStyle='#A5F0E2';ctx.lineWidth=Math.max(2.2,s*.0072);drawProjectedLine(ctx,route,w,h);ctx.stroke();
    ctx.globalAlpha=.27;ctx.strokeStyle='#E1FFFF';ctx.lineWidth=Math.max(.7,s*.00115);drawProjectedLine(ctx,route,w,h);ctx.stroke();
  }
  ctx.restore();
}
/* A globe should read as a globe before the child notices any individual
   biome. This screen-space light is deliberately not geography: it is the
   shared studio light around the rotating sphere. Geography still rotates
   beneath it and all land hit-testing remains untouched. */
function paintSphereAtmosphere(ctx,w,h,s){
  ctx.save();
  const light=ctx.createRadialGradient(w*.34,h*.24,s*.04,w*.50,h*.51,s*.49);
  light.addColorStop(0,'rgba(255,255,226,.18)');
  light.addColorStop(.54,'rgba(255,255,236,.02)');
  light.addColorStop(.82,'rgba(13,73,82,.05)');
  light.addColorStop(1,'rgba(5,43,66,.24)');
  ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
  const rim=ctx.createRadialGradient(w*.50,h*.50,s*.405,w*.50,h*.50,s*.462);
  rim.addColorStop(0,'rgba(255,255,255,0)');
  rim.addColorStop(.76,'rgba(229,255,244,.05)');
  rim.addColorStop(1,'rgba(238,255,238,.30)');
  ctx.fillStyle=rim;ctx.fillRect(0,0,w,h);
  ctx.restore();
}
function paintLandBase(ctx,w,h,s){
  // Countries are separate geographic hit targets, but the child should see
  // ONE living continent. A per-country shadow made every nation look like a
  // raised puzzle tile. Fill all authoritative polygons as a single shape,
  // apply one soft shoreline shadow, then let the existing borders overlay.
  ctx.save();
  ctx.beginPath();let joined=false;
  for(const c of land())if(c.geometry)joined=path(ctx,c,w,h)||joined;
  if(!joined){ctx.restore();return;}
  const base='#7EA373';
  const g=ctx.createLinearGradient(w*.22,h*.10,w*.80,h*.90);
  g.addColorStop(0,mix(base,'#FFF0BE',.40));
  g.addColorStop(.46,base);
  g.addColorStop(1,mix(base,'#173F39',.34));
  ctx.fillStyle=g;
  ctx.shadowColor='rgba(20,48,42,.34)';
  ctx.shadowBlur=Math.max(4,s*.013);
  ctx.shadowOffsetY=Math.max(1.5,s*.004);
  ctx.fill();
  ctx.restore();
  ctx.save();if(!landClip(ctx,w,h)){ctx.restore();return;}
  const sun=ctx.createRadialGradient(w*.33,h*.22,0,w*.50,h*.50,s*.52);
  sun.addColorStop(0,'rgba(255,245,196,.44)');
  sun.addColorStop(.58,'rgba(255,238,181,.05)');
  sun.addColorStop(1,'rgba(24,69,55,.18)');
  ctx.fillStyle=sun;ctx.fillRect(0,0,w,h);ctx.restore();
}
/* A real Antarctic coastline is painted only by Oppdag. Land polygons and
   clickable countries in the existing Enkel/Atlas engines are never changed.
   Ice pigment is illustrative; coast contours are from Natural Earth 1:110m. */
function paintAntarcticIce(ctx,w,h,s){
  if(!antarcticaOutline||globeLat>26)return 0;
  ctx.save();
  ctx.beginPath();
  if(!path(ctx,antarcticaOutline,w,h)){ctx.restore();return 0;}
  /* Antarctica needs the same readable depth as every other continent.
     Keep the true Natural Earth outline, but let blue-green shelf shadow and
     warm snow-light define a large ice mass at continent scale. */
  const ice=ctx.createRadialGradient(w*.38,h*.24,s*.03,w*.55,h*.55,s*.68);
  ice.addColorStop(0,'#FFFDF0');ice.addColorStop(.31,'#EDF5EC');
  ice.addColorStop(.63,'#CBE3DF');ice.addColorStop(.83,'#9DC8CF');
  ice.addColorStop(1,'#639EAE');
  ctx.fillStyle=ice;ctx.fill();
  ctx.clip();
  /* Broad ice facets make the continent read as a sculpted ice mass rather
     than as thin striped bands. Every point is longitude/latitude anchored,
     and the real Natural Earth outline above remains the final clip. */
  const iceFacets=[
    {shade:'rgba(71,143,163,.32)',light:'rgba(225,246,237,.36)',points:[[-166,-76],[-131,-78],[-105,-83],[-140,-86],[-175,-82]]},
    {shade:'rgba(94,163,179,.28)',light:'rgba(242,251,241,.42)',points:[[-87,-68],[-53,-71],[-39,-80],[-69,-86],[-101,-80]]},
    {shade:'rgba(84,151,171,.30)',light:'rgba(236,249,239,.38)',points:[[-24,-72],[21,-73],[45,-81],[10,-87],[-25,-82]]},
    {shade:'rgba(70,139,160,.31)',light:'rgba(232,248,239,.37)',points:[[49,-69],[95,-71],[124,-79],[91,-85],[53,-80]]},
    {shade:'rgba(97,169,181,.27)',light:'rgba(248,253,244,.44)',points:[[119,-70],[158,-72],[177,-80],[149,-85],[113,-80]]}
  ];
  for(const facet of iceFacets){
    const projected=[];
    for(const [lon,lat] of facet.points){const p=project(lon,lat,w,h);if(p&&p[2]>.06)projected.push(p);}
    if(projected.length<3)continue;
    ctx.save();ctx.beginPath();ctx.moveTo(projected[0][0],projected[0][1]);
    for(let i=1;i<projected.length;i++)ctx.lineTo(projected[i][0],projected[i][1]);
    ctx.closePath();ctx.fillStyle=facet.shade;ctx.fill();
    ctx.strokeStyle=facet.light;ctx.lineWidth=Math.max(.7,s*.0021);ctx.stroke();ctx.restore();
  }
  ctx.restore();
  ctx.save();ctx.beginPath();path(ctx,antarcticaOutline,w,h);
  ctx.strokeStyle='rgba(248,253,241,.81)';ctx.lineWidth=Math.max(.9,s*.002);ctx.stroke();
  ctx.restore();
  return 1;
}
const colorAlpha=(hex,a)=>{
  const n=parseInt(hex.slice(1),16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+clamp(a,0,1).toFixed(3)+')';
};
/* Radially blended earth pigments avoid artificial continent-length stripes.
   Soft overlapping washes imitate illustrative terrain without changing
   authoritative land/sea boundaries. */
function paintBiomes(ctx,w,h,s,moving){
  if(moving)return 0;
  ctx.save();if(!landClip(ctx,w,h)){ctx.restore();return 0;}
  let painted=0;
  for(let z=0;z<landscapeZones.length;z++){
    const zone=landscapeZones[z],colors=ecosystemPalette[zone.type];
    const size=geoBrushWidth(zone,w,h,s)*.98;
    let touched=false;
    for(let j=0;j<zone.route.length-1;j++){
      const a=zone.route[j],b=zone.route[j+1];
      const parts=Math.max(1,Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/4.5));
      for(let i=0;i<=parts;i++){
        if(j>0&&i===0)continue;
        const mixT=i/parts,seed=z*743+j*71+i*13;
        const lon=a[0]+(b[0]-a[0])*mixT+(geoNoise(seed+2)-.5)*zone.width*.15;
        const lat=a[1]+(b[1]-a[1])*mixT+(geoNoise(seed+5)-.5)*zone.width*.15;
        const p=project(lon,lat,w,h);if(!p||p[2]<.12)continue;
        const radius=size*(.78+geoNoise(seed+8)*.45);
        if(p[0]<-radius||p[0]>w+radius||p[1]<-radius||p[1]>h+radius)continue;
        const opacity=zone.type==='rainforest'?.59:zone.type==='forest'?.46:zone.type==='desert'?.55:zone.type==='savanna'?.43:zone.type==='ice'?.48:.38;
        ctx.save();ctx.translate(p[0],p[1]);ctx.rotate((geoNoise(seed+11)-.5)*.55);ctx.scale(1,.72);
        const g=ctx.createRadialGradient(-radius*.16,-radius*.16,radius*.02,0,0,radius);
        g.addColorStop(0,colorAlpha(colors[0],opacity*.90));
        g.addColorStop(.36,colorAlpha(colors[1],opacity*.65));
        g.addColorStop(.72,colorAlpha(colors[2],opacity*.22));
        g.addColorStop(1,colorAlpha(colors[2],0));
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
        ctx.restore();touched=true;
      }
    }
    if(touched)painted++;
  }
  ctx.restore();return painted;
}


/* Continent-scale material masses. The detailed terrain field below gives
   local texture, but a seven-year-old should also read the big geography at a
   glance: Sahara, rainforest and major mountain belts. These are broad,
   land-clipped strokes along the same longitude/latitude corridors already
   used by the renderer. They are not screen-space icons. */
function paintContinentMasses(ctx,w,h,s,level,moving){
  if(moving||level!==1)return 0;
  ctx.save();if(!landClip(ctx,w,h)){ctx.restore();return 0;}
  let painted=0;
  for(const zone of landscapeZones){
    if(!smoothGeoStroke(ctx,zone.route,w,h,s))continue;
    const width=clamp(geoBrushWidth(zone,w,h,s)*.88,s*.022,s*.28);
    const tone=zone.type==='rainforest'?'rgba(7,67,38,.30)':
      zone.type==='forest'?'rgba(27,78,45,.23)':
      zone.type==='desert'?'rgba(225,151,50,.28)':
      zone.type==='savanna'?'rgba(157,144,62,.18)':
      zone.type==='tundra'?'rgba(139,171,158,.18)':
      'rgba(229,245,236,.24)';
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle=tone;ctx.lineWidth=width;
    ctx.shadowColor=zone.type==='desert'?'rgba(120,77,29,.13)':'rgba(17,58,42,.14)';
    ctx.shadowBlur=Math.max(3,s*.010);ctx.stroke();
    if(smoothGeoStroke(ctx,zone.route,w,h,s)){
      ctx.strokeStyle=zone.type==='desert'?'rgba(255,222,142,.20)':
        zone.type==='rainforest'?'rgba(131,190,103,.13)':
        'rgba(230,231,174,.11)';
      ctx.lineWidth=Math.max(1.2,width*.29);ctx.shadowBlur=0;ctx.stroke();
    }
    ctx.restore();painted++;
  }
  /* Major ranges get one broad shaded shoulder plus a narrow sunlit crest.
     This reads as relief from normal viewing distance without becoming a row
     of mountain symbols. */
  for(const chain of mountainChains){
    if(!continentCrestChains.has(chain.name))continue;
    const zone={route:chain.route,width:Math.max(2.2,chain.width*2.5)};
    const shoulder=clamp(geoBrushWidth(zone,w,h,s),s*.021,s*.075);
    if(!smoothGeoStroke(ctx,chain.route,w,h,s))continue;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle=chain.snow?'rgba(39,67,62,.28)':'rgba(87,69,44,.25)';
    ctx.lineWidth=shoulder;ctx.shadowColor='rgba(23,43,37,.20)';
    ctx.shadowBlur=Math.max(3,s*.009);ctx.stroke();
    if(smoothGeoStroke(ctx,chain.route,w,h,s)){
      ctx.strokeStyle=chain.snow?'rgba(242,242,211,.42)':'rgba(236,197,124,.32)';
      ctx.lineWidth=Math.max(1.3,shoulder*.24);ctx.shadowBlur=0;ctx.stroke();
    }
    ctx.restore();painted++;
  }
  ctx.restore();return painted;
}

/* Continuous world-space terrain shading. Sampling uses globeInverse, so the
   canvas pixels are coloured from actual longitude/latitude and cannot drift
   when the child rotates or zooms the globe. This is painterly illustrative
   relief, NOT satellite imagery or elevation/biome boundary data. */
const terrainDegree=Math.PI/180;
const terrainSamples=(features,step)=>features.flatMap((feature,z)=>{
  const pts=[];
  const points=feature.route;
  for(let k=0;k<points.length-1;k++){
    const a=points[k],b=points[k+1];
    const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));
    for(let j=0;j<count;j++){
      const t=j/count;
      pts.push({lon:a[0]+(b[0]-a[0])*t,lat:a[1]+(b[1]-a[1])*t,width:feature.width,kind:feature.type||'ridge',snow:feature.snow||false,group:z});
    }
  }
  if(points.length)pts.push({lon:points[points.length-1][0],lat:points[points.length-1][1],width:feature.width,kind:feature.type||'ridge',snow:feature.snow||false,group:z});
  return pts;
});
let terrainBiomeAnchors=null;
let terrainRidgeAnchors=null;
const terrainTint={
  rainforest:[13,78,43],forest:[37,96,58],desert:[236,174,79],
  savanna:[171,158,73],tundra:[151,180,164],ice:[229,246,235]
};
function terrainHash(x,y,salt){
  let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(salt,1442695041))|0;
  n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;
  return (n>>>0)/4294967295;
}
function terrainNoise(lon,lat,scale,seed){
  const x=lon*scale+381.9,y=lat*scale+213.4;
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=terrainHash(ix,iy,seed),b=terrainHash(ix+1,iy,seed);
  const d=terrainHash(ix,iy+1,seed),e=terrainHash(ix+1,iy+1,seed);
  return ((a+(b-a)*sx)+(d+(e-d)*sx-a-(b-a)*sx)*sy);
}
/* An iPad terrain frame contains tens of thousands of pixel samples.
   Group geographic anchors by latitude once so each pixel scans only nearby
   candidates. The bands deliberately overlap by the full search radius and
   preserve original anchor order: the final pixels stay identical to a full
   search, including across zoom levels and the 180-degree longitude seam. */
function terrainLatitudeIndex(samples,limit){
  const bands=Array.from({length:180},(_,row)=>{
    const south=row-90;
    return samples.filter(p=>p.lat>=south-limit&&p.lat<=south+1+limit);
  });
  return {bands};
}
function nearestTerrain(lon,lat,index,limit){
  // Latitude bands are a superset of all potentially relevant samples.
  // Distance and wrapped-longitude checks below remain the source of truth.
  const samples=Array.isArray(index)?index:index.bands[clamp(Math.floor(lat+90),0,179)];
  let found=null,best=limit*limit;
  const xscale=Math.max(.28,Math.cos(lat*terrainDegree));
  for(const p of samples){
    const dy=lat-p.lat;
    if(Math.abs(dy)>=limit)continue;
    const dx=((((lon-p.lon)+540)%360)-180)*xscale;
    if(Math.abs(dx)>=limit)continue;
    const distance=dx*dx+dy*dy;
    if(distance<best){best=distance;found=p;}
  }
  return {point:found,distance:found?Math.sqrt(best):Infinity};
}
let terrainFieldCache=null;
function paintWorldTerrain(ctx,w,h,s,level,moving){
  if(moving||typeof globeInverse!=='function')return 0;
  if(!terrainBiomeAnchors)terrainBiomeAnchors=terrainLatitudeIndex(terrainSamples(landscapeZones,6),19);
  if(!terrainRidgeAnchors)terrainRidgeAnchors=terrainLatitudeIndex(terrainSamples(mountainChains,4.8),6);
  const key=[Math.round(globeLon*200)/200,Math.round(globeLat*200)/200,
    Math.round(globeZoom*200)/200,Math.round(s),level].join('|');
  if(!terrainFieldCache||terrainFieldCache.key!==key){
    // Sharpen large iPad overviews without paying for extra pixels on phones.
    const pixels=level===1?clamp(Math.round(s*.33),128,205):level===2?172:208;
    const startedAt=performance.now();
    const surface=document.createElement('canvas');
    surface.width=pixels;surface.height=pixels;
    const off=surface.getContext('2d');
    if(!off)return 0;
    const img=off.createImageData(pixels,pixels),data=img.data;
    const startX=(w-s)/2,startY=(h-s)/2;
    for(let py=0;py<pixels;py++){
      const sy=startY+(py+.5)/pixels*s;
      for(let px=0;px<pixels;px++){
        const sx=startX+(px+.5)/pixels*s;
        const nx=(sx-w/2)/s,ny=(sy-h/2)/s;
        if(nx*nx+ny*ny>.46*.46)continue;
        const loc=globeInverse(sx,sy);
        if(!loc||!Number.isFinite(loc.lon)||!Number.isFinite(loc.lat))continue;
        const lon=loc.lon,lat=loc.lat;
        const biome=nearestTerrain(lon,lat,terrainBiomeAnchors,19);
        const ridge=nearestTerrain(lon,lat,terrainRidgeAnchors,6);
        const bp=biome.point,rp=ridge.point;
        const warmth=terrainNoise(lon,lat,.18,2)-.5;
        const fine=terrainNoise(lon,lat,level===1?.48:.96,7)-.5;
        const micro=terrainNoise(lon,lat,level===3?2.8:1.6,11)-.5;
        // Painterly canopy/chiaroscuro: broad masses plus leaf-size facets.
        const canopy=terrainNoise(lon,lat,level===1?1.1:level===2?3.5:7.5,29)-.5;
        const shade=(warmth*.33+fine*.26+micro*.16+canopy*.25)*145;
        const biomeReach=bp?Math.max(0,1-biome.distance/Math.max(1.7,bp.width*.69)):0;
        const mountainReach=rp?Math.max(0,1-ridge.distance/Math.max(1,rp.width*1.35)):0;
        const mountainCut=Math.max(0,(terrainNoise(lon,lat,1.15,23)-.34)*mountainReach);
        /* A fixed north-west light gives the geographic noise a coherent
           painted slope.  It is derived in longitude/latitude space, so a
           ridge keeps its light and shadow as the child turns the globe. */
        const reliefScale=level===1?1.34:2.38;
        const reliefLon=terrainNoise(lon+.34,lat,reliefScale,73)-terrainNoise(lon-.34,lat,reliefScale,73);
        const reliefLat=terrainNoise(lon,lat+.28,reliefScale,73)-terrainNoise(lon,lat-.28,reliefScale,73);
        const reliefLight=(reliefLon*.62-reliefLat*.78)*mountainReach;
        const tint=bp?terrainTint[bp.kind]:null;
        // The base polygon's established light and colour always remain
        // visible. High relief shifts shadows, but never recolours borders.
        const leafy=bp&&(bp.kind==='rainforest'||bp.kind==='forest');
        const base=shade+mountainCut*85-mountainReach*32+reliefLight*94;
        const neutral=[118+base*.64,161+base*.75,115+base*.49];
        const alpha=clamp(.36+biomeReach*.70+mountainReach*.52,.34,.98);
        const mixT=clamp(biomeReach*1.29,0,.99);
        let red=neutral[0],green=neutral[1],blue=neutral[2];
        if(tint){
          red=red*(1-mixT)+tint[0]*mixT;
          green=green*(1-mixT)+tint[1]*mixT;
          blue=blue*(1-mixT)+tint[2]*mixT;
          if(leafy){
            // Overlapping sunlit crowns and shaded canopy are continuous
            // land material in geographic space, not repeated tree symbols.
            const crown=canopy*(level===3?92:level===2?81:67)*biomeReach;
            const grove=terrainNoise(lon-.23,lat+.19,level===1?2.2:4.4,43)-.5;
            const forestShade=grove*42*biomeReach;
            red+=crown*.48+forestShade*.80;
            green+=crown*.80+forestShade*.92;
            blue+=crown*.43+forestShade*.49;
          }else if(bp.kind==='desert'){
            // Soft, angled dunes use geographic pigment variation, not a
            // dotted icon pattern. The warm ochre remains land-clipped.
            const dunes=terrainNoise(lon+.35,lat-.27,level===1?1.1:2.1,59)-.5;
            const ridges=terrainNoise(lon,lat,level===1?2.1:3.7,61)-.5;
            const sand=(dunes*.66+ridges*.34)*51*biomeReach;
            red+=sand*.83;green+=sand*.61;blue+=sand*.30;
          }
        }
        if(mountainReach>.06&&rp){
          /* Rock and snow belong to a continuous corridor around each
             georeferenced mountain spine. Spatial noise forms lit/shaded
             facets; these are material pigments, not peak-shaped stamps. */
          const facets=terrainNoise(lon,lat,level===1?1.6:3.1,73)-.5;
          const ridgeLight=terrainNoise(lon+.42,lat-.24,level===1?2.1:4.2,79)-.5;
          const stone=rp.snow?[165,171,160]:[157,135,107];
          const stoneWeight=clamp(mountainReach*(.62+facets*.68),0,.76);
          const shade=mountainReach*(facets*53+ridgeLight*41)+reliefLight*52;
          red=red*(1-stoneWeight)+stone[0]*stoneWeight+shade;
          green=green*(1-stoneWeight)+stone[1]*stoneWeight+shade*.91;
          blue=blue*(1-stoneWeight)+stone[2]*stoneWeight+shade*.73;
          if(rp.snow){
            const snowFacet=clamp((terrainNoise(lon,lat,level===1?2.5:5.2,31)-.29)*2.1,0,1);
            const snow=mountainReach*snowFacet*(.56+Math.max(0,reliefLight)*.42);
            red=red*(1-snow)+247*snow;
            green=green*(1-snow)+244*snow;
            blue=blue*(1-snow)+223*snow;
          }
        }
        const k=(py*pixels+px)*4;
        data[k]=clamp(red,0,255);
        data[k+1]=clamp(green,0,255);
        data[k+2]=clamp(blue,0,255);
        data[k+3]=Math.round(alpha*255);
      }
    }
    off.putImageData(img,0,0);
    terrainFieldCache={key,surface,ms:performance.now()-startedAt};
  }
  ctx.save();
  if(landClip(ctx,w,h)){
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(terrainFieldCache.surface,(w-s)/2,(h-s)/2,s,s);
    const canvas=document.getElementById('globe-canvas');
    if(canvas){
      canvas.dataset.discoveryTerrainMs=String(Math.round(terrainFieldCache.ms));
      canvas.dataset.discoveryTerrainPixels=String(terrainFieldCache.surface.width);
    }
    ctx.restore();return 1;
  }
  ctx.restore();return 0;
}

function paintBorders(ctx,w,h,s,level){
  for(const c of land()){
    if(!c.geometry)continue;ctx.beginPath();if(!path(ctx,c,w,h))continue;
    const selected=c.id===globeSelected;
    if(selected){ctx.save();ctx.fillStyle='rgba(255,224,137,.13)';ctx.shadowColor='rgba(255,188,36,.22)';ctx.shadowBlur=Math.max(8,s*.014);ctx.fill();ctx.restore();}
    /* Countries remain authoritative for touch and selection, but their
       borders must not turn the first view into a political wall map. At
       continent level only the selected country gets an outline; borders
       progressively return as the child zooms toward a place. */
    if(!selected&&level===1)continue;
    const alpha=level===2?.15:.46;
    ctx.strokeStyle=selected?'rgba(255,253,225,.98)':`rgba(255,250,226,${alpha})`;
    ctx.lineWidth=selected?Math.max(1.7,s*.003):Math.max(.55,s*(level===2?.00082:.0011));ctx.stroke();
  }
}
/* Real-world mountain corridors in approximate geographic order.
   No isolated screen-space mountain stamps in this paint pass. Each chain
   is projected point-by-point through the exact globe geometry. */
const mountainChains=[
 {name:'Scandes',width:1.9,snow:true,route:[[5.4,59.8],[7.1,61.6],[8.5,63.5],[12.2,65.6],[16.6,68.0],[19.5,69.6]]},
 {name:'Alps',width:2.3,snow:true,route:[[5.6,45.7],[7.8,46.2],[10.3,46.6],[12.9,47.0],[15.9,46.8]]},
 {name:'Pyrenees',width:1.5,snow:true,route:[[-1.9,43.0],[.2,42.8],[2.9,42.6]]},
 {name:'Carpathians',width:1.8,snow:true,route:[[17.1,48.8],[19.5,49.2],[22.7,48.8],[25.0,47.5]]},
 {name:'Atlas',width:2.6,snow:false,route:[[-10,30.7],[-7,31.2],[-4.5,32.1],[0.3,34.1],[6.3,35.1]]},
 {name:'Caucasus',width:1.7,snow:true,route:[[40.8,43.3],[43.7,43.1],[46.5,42.8]]},
 {name:'Urals',width:1.6,snow:false,route:[[58.6,52.8],[59.9,57],[61.2,61],[65.2,67]]},
 {name:'Rockies',width:3.2,snow:true,route:[[-124.0,51.2],[-119.1,47.3],[-115.2,43.3],[-110,39.3],[-106.4,35.0]]},
 {name:'Andes',width:2.9,snow:true,route:[[-76.0,8],[-76.3,1],[-75.7,-5],[-73.5,-11],[-70.8,-18],[-69.1,-26],[-70.4,-33],[-72.1,-41],[-73.0,-50]]},
 {name:'Himalaya',width:3.1,snow:true,route:[[73.2,35],[78.1,32.6],[82.0,30.1],[87.0,28.4],[92.8,28.3],[98.1,28.5]]},
 {name:'Kunlun',width:2.3,snow:true,route:[[79,36.5],[84,36.2],[91,35.9],[97,35.5]]},
 {name:'Tian Shan',width:2.1,snow:true,route:[[70.3,41.5],[76.7,42.3],[82.6,43.3]]},
 {name:'Japanese Alps',width:1.1,snow:true,route:[[136.1,35.0],[137.5,36.2],[139.2,37.7],[140.3,39.5]]},
 {name:'Australian ranges',width:1.8,snow:false,route:[[145.9,-18.2],[148.7,-25.1],[150,-31],[148.1,-36.1]]},
 {name:'Drakensberg',width:1.7,snow:false,route:[[29.1,-28.6],[29.8,-30.5],[29.4,-32.3]]},
 {name:'Southern Alps NZ',width:1.2,snow:true,route:[[168.2,-44.8],[169.5,-43.6],[171.3,-42.6]]},
 {name:'Ethiopian Highlands',width:2.4,snow:false,route:[[37.6,7.1],[38.6,10.6],[39.6,13.4]]},
 {name:'Appalachians',width:2,snow:false,route:[[-84.3,34],[-82.8,37],[-79,40],[-75.6,43.5]]}
];
// A continent-first globe must have recognisable relief beyond Europe.
// These are real coordinate paths, not fixed icons pasted on the screen.
const continentCrestChains=new Set([
  'Scandes','Alps','Atlas','Rockies','Andes','Himalaya',
  'Japanese Alps','Australian ranges','Drakensberg','Southern Alps NZ'
]);
const continentRiverNames=new Set(['Amazonas','Nile','Mississippi','Yangtze']);
const riverWays=[
  {name:'Amazonas',route:[[-72,-4],[-68,-4.1],[-64,-3.6],[-61,-3.4],[-58,-3],[-55,-2.8],[-52,-2],[-49.5,-1.3]]},
  {name:'Nile',route:[[31,30.5],[31.3,26],[32.1,21],[33,17],[32.4,12],[31.8,8]]},
  {name:'Mississippi',route:[[-93.3,47.1],[-92.7,43.3],[-91.1,39],[-90.1,34.5],[-90.2,30.1]]},
  {name:'Danube',route:[[8.2,48],[12.5,48.4],[16.8,48.1],[20.6,45.5],[25.6,44.3],[29.6,45.2]]},
  {name:'Yangtze',route:[[97,33.3],[102,30.7],[107,29.8],[112,30.2],[117,30.9],[121,31.1]]}
];
function paintMountainCrests(ctx,chain,w,h,s,level,width){
  /* A few continent-defining mountain ranges stay legible at overview
     scale. Smaller ranges still wait until regional zoom; no icon stamps. */
  const continentHero=continentCrestChains.has(chain.name);
  if(level<2&&!continentHero)return 0;
  if(level===1){
    /* One broad, continuous ridge reads as geography at continent scale.
       The old per-segment chevrons made the Andes look like a pasted row of
       tiny mountain symbols, even though their positions were correct. */
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(!smoothGeoStroke(ctx,chain.route,w,h,s)){ctx.restore();return 0;}
    ctx.strokeStyle=chain.snow?'rgba(42,78,70,.44)':'rgba(94,76,51,.39)';
    ctx.lineWidth=Math.max(3.0,width*.76);ctx.stroke();
    if(!smoothGeoStroke(ctx,chain.route,w,h,s)){ctx.restore();return 0;}
    ctx.strokeStyle=chain.snow?'rgba(226,239,212,.45)':'rgba(235,204,137,.39)';
    ctx.lineWidth=Math.max(1.2,width*.32);ctx.stroke();
    if(chain.snow&&smoothGeoStroke(ctx,chain.route,w,h,s)){
      ctx.strokeStyle='rgba(255,253,235,.48)';ctx.lineWidth=Math.max(.72,width*.105);ctx.stroke();
    }
    ctx.restore();return 1;
  }
  let drawn=0;
  for(let j=0;j<chain.route.length-1;j++){
    const a=chain.route[j],b=chain.route[j+1];
    const spacing=level===1?1.85:(level===2?2.8:1.9);
    const steps=Math.max(2,Math.round(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/spacing));
    for(let k=0;k<steps;k++){
      const t=(k+.42)/steps,lon=a[0]+(b[0]-a[0])*t,lat=a[1]+(b[1]-a[1])*t;
      const p=project(lon,lat,w,h);if(!p||p[2]<.2)continue;
      const seed=Math.abs(Math.sin((j*31+k*7+lat)*1.23));
      const height=clamp(Math.max(width*(.42+seed*.22),s*(level===1?.009:level===2?.0085:.012)),s*.006,s*.024)*(level===3?1.08:level===1?.98:.95);
      const x=p[0],y=p[1];
      ctx.save();
      /* Do not place a row of little mountain icons on the map.  A pair of
         irregular light/shadow contour strokes makes one continuous ridge
         when the samples overlap along the real geographic chain. */
      ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle=level===1?'rgba(40,71,65,.49)':'rgba(43,79,68,.42)';ctx.lineWidth=Math.max(.8,height*.36);
      ctx.beginPath();ctx.moveTo(x-height*.72,y+height*.35);
      ctx.quadraticCurveTo(x-height*.18,y-height*.74,x+height*.68,y+height*.26);ctx.stroke();
      ctx.strokeStyle=level===1?'rgba(224,234,206,.77)':'rgba(210,224,193,.68)';ctx.lineWidth=Math.max(.6,height*.15);
      ctx.beginPath();ctx.moveTo(x-height*.62,y+height*.16);
      ctx.quadraticCurveTo(x-height*.13,y-height*.63,x+height*.50,y+height*.08);ctx.stroke();
      if(chain.snow){
        ctx.strokeStyle='rgba(255,253,233,.72)';ctx.lineWidth=Math.max(.55,height*.11);
        ctx.beginPath();ctx.moveTo(x-height*.15,y-height*.47);ctx.quadraticCurveTo(x,y-height*.72,x+height*.17,y-height*.43);ctx.stroke();
      }else{
        ctx.strokeStyle='rgba(230,219,163,.58)';ctx.lineWidth=Math.max(.6,height*.11);
        ctx.beginPath();ctx.moveTo(x-height*.16,y-height*.52);ctx.lineTo(x-height*.45,y+height*.15);ctx.stroke();
      }
      ctx.restore();drawn++;
    }
  }
  return drawn;
}
function paintReliefTrails(ctx,w,h,s,level,moving){
  if(moving)return 0;
  let count=0,continentCrests=0,continentRivers=0;
  for(let c=0;c<mountainChains.length;c++){
    const chain=mountainChains[c],zone={route:chain.route,width:chain.width};
    const radius=clamp(geoBrushWidth(zone,w,h,s)*1.12,s*.008,s*.12);
    let visible=false;
    for(let j=0;j<chain.route.length-1;j++){
      const a=chain.route[j],b=chain.route[j+1];
      const countSegments=Math.max(1,Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/3.5));
      for(let i=0;i<=countSegments;i++){
        if(j>0&&i===0)continue;
        const t=i/countSegments,lon=a[0]+(b[0]-a[0])*t,lat=a[1]+(b[1]-a[1])*t;
        const p=project(lon,lat,w,h);if(!p||p[2]<.10)continue;
        if(p[0]<-radius||p[0]>w+radius||p[1]<-radius||p[1]>h+radius)continue;
        const seed=c*79+j*13+i*19,r=radius*(.77+geoNoise(seed+21)*.41);
        ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(-.32);ctx.scale(1,.72);
        const g=ctx.createRadialGradient(-r*.18,-r*.22,r*.01,0,0,r);
        g.addColorStop(0,'rgba(57,93,79,.40)');
        g.addColorStop(.38,'rgba(104,138,113,.31)');
        g.addColorStop(.68,chain.snow?'rgba(208,220,192,.17)':'rgba(183,159,112,.13)');
        g.addColorStop(1,'rgba(81,106,78,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
        ctx.restore();visible=true;
      }
    }
    if(!visible)continue;
    // Fine sunlight on geographic crest, not an outlined highway.
    if(smoothGeoStroke(ctx,chain.route,w,h,s)){
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle=chain.snow?'rgba(241,247,222,.23)':'rgba(231,211,156,.21)';
      ctx.lineWidth=Math.max(.60,s*.0015);ctx.stroke();ctx.restore();
    }
    const crests=paintMountainCrests(ctx,chain,w,h,s,level,radius*.72);
    if(level===1&&continentCrestChains.has(chain.name))continentCrests+=crests;
    count+=1+crests;
  }
  for(const river of riverWays){
    if(level===1&&!continentRiverNames.has(river.name))continue;
    if(!smoothGeoStroke(ctx,river.route,w,h,s))continue;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const k=s*(level===1?.0016:.0022)*clamp(Math.pow(globeZoom,.14),1,1.25);
    ctx.strokeStyle=level===1?'rgba(24,100,117,.42)':'rgba(26,110,132,.46)';ctx.lineWidth=Math.max(1,k*2.1);ctx.stroke();
    ctx.strokeStyle=level===1?'rgba(169,224,217,.65)':'rgba(172,232,219,.73)';
    ctx.lineWidth=Math.max(.68,k*.88);ctx.stroke();
    ctx.restore();count++;if(level===1)continentRivers++;
  }
  const canvas=document.getElementById('globe-canvas');
  if(canvas){
    canvas.dataset.discoveryContinentCrests=String(continentCrests);
    canvas.dataset.discoveryContinentRivers=String(continentRivers);
  }
  return count;
}

/* Painterly vector silhouettes. All positions are already projected from
   longitude/latitude, and the caller clips them to real land geometry. */

/* Fine detail belongs to biome regions, not random screen tiles.
   The close view reveals leaf masses, rock contours and dune hatching as
   children zoom closer; all samples are deterministic geographic points. */
const geoNoise=n=>{const x=Math.sin(n*78.233+19.192)*43758.5453;return x-Math.floor(x);};
function paintGeographicTexture(ctx,w,h,s,level,moving){
  // At continent scale the world needs recognisable natural material, not
  // only a blurred colour field. Use fewer, gently blended geographic flecks.
  if(moving)return 0;
  let drawn=0;
  /* Small overlapping canopy crowns create one coherent forest, not a few
     giant decorative trees. Density is tied to geographic forest corridors. */
  for(let z=0;z<landscapeZones.length;z++){
    const zone=landscapeZones[z],segments=zone.route.length-1;
    const leafy=zone.type==='rainforest'||zone.type==='forest';
    /* Overview forests are painted as connected canopy corridors first.
       The finer crown flecks beneath merely keep the mass alive; they never
       need to carry the shape of a continent by themselves. */
    if(leafy&&level===1&&smoothGeoStroke(ctx,zone.route,w,h,s)){
      const canopyWidth=clamp(geoBrushWidth(zone,w,h,s)*.92,s*.018,s*.26);
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle=zone.type==='rainforest'?'rgba(14,82,47,.43)':'rgba(32,86,51,.38)';
      ctx.lineWidth=canopyWidth*1.06;ctx.stroke();
      if(smoothGeoStroke(ctx,zone.route,w,h,s)){
        ctx.strokeStyle=zone.type==='rainforest'?'rgba(148,204,111,.27)':'rgba(205,220,136,.24)';
        ctx.lineWidth=Math.max(1.2,canopyWidth*.40);ctx.stroke();
      }
      ctx.restore();drawn++;
    }
    /* At overview, use many overlapping small washes rather than a few
       oversized clumps. The rainforest then reads as one painted canopy
       and the Sahara as sand material, never as stamped map symbols. */
    const perZone=leafy?(level===1?38:level===2?104:156):
      (level===1?30:level===2?42:62);
    for(let i=0;i<perZone;i++){
      const t=geoNoise(z*109+i*29+9)*segments;
      const j=Math.min(segments-1,Math.floor(t)),f=t-j;
      const a=zone.route[j],b=zone.route[j+1];
      const lon=a[0]+(b[0]-a[0])*f+(geoNoise(z*307+i*17+1)-.5)*zone.width*.80;
      const lat=a[1]+(b[1]-a[1])*f+(geoNoise(z*127+i*43+4)-.5)*zone.width*.80;
      const p=project(lon,lat,w,h);if(!p||p[2]<.18)continue;
      /* At continent scale these must read as broad natural material on an
         actual globe, not disappear into a uniformly coloured country.
         The marks still overlap and stay land-clipped; only their visual
         footprint is raised enough to survive the iPad overview. */
      const k=s*(leafy?(level===1?.00545:level===2?.0053:.0037):
        (level===1?.0057:level===2?.0059:.0052))*
        clamp(Math.pow(globeZoom,.13),1,1.27)*
        clamp(p[2]+.21,.55,1.1)*(0.67+geoNoise(i*7+z*19)*.49);
      if(p[0]<-k*3||p[0]>w+k*3||p[1]<-k*3||p[1]>h+k*3)continue;
      ctx.save();ctx.translate(p[0],p[1]);ctx.lineCap='round';ctx.lineJoin='round';
      if(leafy){
        const tropical=zone.type==='rainforest';
        /* Irregular canopy flecks overlap into a forest mass.  They have no
           trunks, silhouettes or fixed spacing, so they cannot read as icons. */
        for(const [dx,dy,scale] of [[-.58,.09,.72],[.42,.02,.84],[-.09,-.31,.93],[.31,-.35,.56],[-.34,-.41,.48]]){
          const x=k*dx,y=k*dy,r=k*scale;
          ctx.fillStyle=tropical?'rgba(20,83,52,.47)':'rgba(42,91,57,.44)';
          ctx.beginPath();ctx.ellipse(x,y,r*.71,r*.72,-.16,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=tropical?'rgba(132,190,104,.34)':'rgba(188,208,129,.32)';
          ctx.beginPath();ctx.ellipse(x-r*.22,y-r*.23,r*.38,r*.28,-.26,0,Math.PI*2);ctx.fill();
        }
      }else if(zone.type==='desert'){
        ctx.fillStyle='rgba(242,207,136,.31)';
        ctx.beginPath();ctx.ellipse(0,k*.42,k*1.14,k*.36,0,0,Math.PI*2);ctx.fill();
        for(let t=0;t<3;t++){
          ctx.strokeStyle=t===1?'rgba(254,239,174,.71)':'rgba(163,109,52,.43)';
          ctx.lineWidth=Math.max(.55,k*.16);
          ctx.beginPath();ctx.moveTo(-k*1.06,k*(t*.29-.30));
          ctx.quadraticCurveTo(-k*.05,k*(t*.29-.90),k*1.07,k*(t*.29-.20));ctx.stroke();
        }
      }else if(zone.type==='savanna'){
        ctx.strokeStyle='rgba(89,100,48,.56)';ctx.lineWidth=Math.max(.6,k*.17);
        for(let t=0;t<3;t++){
          const dx=(t-1)*k*.46;ctx.beginPath();ctx.moveTo(dx,k*.47);
          ctx.quadraticCurveTo(dx-k*.18,-k*.18,dx-k*.27,-k*.59);ctx.stroke();
        }
        ctx.fillStyle='rgba(234,218,138,.52)';
        ctx.beginPath();ctx.ellipse(0,k*.43,k*.98,k*.18,0,0,Math.PI*2);ctx.fill();
      }else{
        ctx.fillStyle=zone.type==='ice'?'rgba(251,254,246,.76)':'rgba(231,234,199,.46)';
        ctx.beginPath();ctx.moveTo(-k*.9,k*.38);ctx.lineTo(-k*.1,-k*.66);
        ctx.lineTo(k*.65,k*.18);ctx.lineTo(k*.95,k*.32);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(105,155,144,.39)';ctx.lineWidth=Math.max(.5,k*.15);
        ctx.beginPath();ctx.moveTo(-k*.12,-k*.39);ctx.lineTo(k*.40,k*.21);ctx.stroke();
      }
      ctx.restore();drawn++;
    }
  }
  return drawn;
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
function paintSmallCountries(ctx,w,h,s,level){
  if(typeof isTinyCountry!=='function')return;
  for(const c of land()){
    if(level===1&&c.id!==globeSelected)continue;
    if(!isTinyCountry(c)&&c.id!==globeSelected)continue;const p=project(c.lon,c.lat,w,h);if(!p)continue;const r=c.id===globeSelected?Math.max(5.3,s*.010):Math.max(2.1,s*.0038);ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fillStyle=c.id===globeSelected?'#FFD65E':'#FFF3A8';ctx.fill();ctx.strokeStyle='rgba(83,63,35,.38)';ctx.lineWidth=1;ctx.stroke();
  }
}
function discoveryDraw(){
  if(globeSelected)activeDiscoveryLocation=null;
  const canvas=document.getElementById('globe-canvas');if(!canvas?._cssW||!canvas?._cssH)return;
  const w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h),dpr=canvas._dpr||1,ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.clip();
  const level=globeZoom<1.7?1:globeZoom<2.8?2:3;
  /* Pointer ownership is the reliable signal while a drag is active. */
  const moving=window.__lariaGlobeInteracting===true&&typeof globePointers!=='undefined'&&globePointers.size>0;
  ocean(ctx,w,h,s);paintLandBase(ctx,w,h,s);
  /* Material pass replaces separate biome washes: the land reads as one painted surface. */
  const biomeCount=0;
  const fieldCount=paintWorldTerrain(ctx,w,h,s,level,moving);
  const macroCount=paintContinentMasses(ctx,w,h,s,level,moving);
  /* A moving globe uses its base map without the expensive land clip for
     stationary-only detail. This saves an entire geometry pass per frame. */
  ctx.save();const validLand=!moving&&landClip(ctx,w,h);
  const textureCount=validLand?paintGeographicTexture(ctx,w,h,s,level,moving):0;
  const reliefCount=validLand?paintReliefTrails(ctx,w,h,s,level,moving):0;
  /* No landmark stamps on land: mountains and forests must belong to the terrain itself. */
  const terrainCount=0;
  const landmarkCount=0;
  ctx.restore();
  const polarCount=paintAntarcticIce(ctx,w,h,s);
  const seaCount=paintLandmarks(ctx,w,h,s,level,moving,true);
  paintBorders(ctx,w,h,s,level);
  paintSphereAtmosphere(ctx,w,h,s);
  paintSmallCountries(ctx,w,h,s,level);
  const discoveryLocationCount=paintDiscoveryLocation(ctx,w,h,s,moving);
  if(typeof drawGlobePulse==='function')drawGlobePulse(ctx,w,h);
  ctx.restore();
  screen.dataset.discoveryGlobeLevel=String(level);screen.dataset.discoveryGlobe='painted-atlas-v1';
  canvas.dataset.discoveryRenderer='live';canvas.dataset.discoveryTerrainField=String(fieldCount);canvas.dataset.discoveryMacroRelief=String(macroCount);canvas.dataset.discoveryEcosystems=String(biomeCount);canvas.dataset.discoveryRelief=String(reliefCount);canvas.dataset.discoveryTexture=String(textureCount);canvas.dataset.discoveryLandmarks=String(landmarkCount+terrainCount+reliefCount+textureCount+seaCount+biomeCount+fieldCount);canvas.dataset.discoveryMoving=String(moving);
  canvas.dataset.discoveryLocationCount=String(discoveryLocationCount);
  canvas.dataset.discoveryLocationName=discoveryLocationCount?activeDiscoveryLocation.title:'';
  canvas.dataset.discoveryAntarcticLand=String(polarCount);
  canvas.dataset.discoveryMaterialPass='continent-premium-v3';
  canvas.dataset.discoveryPaintCount=String(Number(canvas.dataset.discoveryPaintCount||0)+1);
  // v25 can still seed the old Tsjad showcase after selecting Oppdag.
  // Reconcile after the card update has completed, not inside its draw call.
  /* A completed repaint must never leave a country card for land that is
     behind the horizon. This is especially important on a wide iPad, where
     the legacy renderer can repaint before its pointer reconciliation runs.
     Clear synchronously after the finished drawing; keep the next-frame pass
     only for a still-visible country that is being moved by live input. */
  if(globeSelected&&window.__lariaGlobeInteracting!==true){
    clearOffscreenDiscoverySelection();
    if(globeSelected)scheduleVisibleCountryReconciliation();
  }else if(globeSelected)scheduleVisibleCountryReconciliation();
}
let pendingCountryReconciliation=false;
function scheduleVisibleCountryReconciliation(){
  if(pendingCountryReconciliation)return;
  pendingCountryReconciliation=true;
  requestAnimationFrame(()=>{
    pendingCountryReconciliation=false;
    clearOffscreenDiscoverySelection();
  });
}

/* The status card should describe a country the child can actually see.
   The ordinary globe intentionally keeps its existing selection semantics. */
function clearOffscreenDiscoverySelection(){
  if(window.__lariaDiscoveryGlobePreview!==true||typeof globeSelected!=='string'||!globeSelected)return false;
  const selected=typeof countries==='undefined'?null:countries[globeSelected];
  const canvas=document.getElementById('globe-canvas');
  const w=canvas?._cssW||0,h=canvas?._cssH||0;
  if(!selected||!w||!h||!Number.isFinite(selected.lon)||!Number.isFinite(selected.lat))return false;
  const p=project(selected.lon,selected.lat,w,h),radius=Math.min(w,h)*.455;
  if(p&&p[2]>.05&&Math.hypot(p[0]-w/2,p[1]-h/2)<=radius*.975)return false;
  // Large countries can still intersect the visible globe while their
  // geographic label anchor lies behind the horizon (Russia, Canada, USA).
  // Check the real polygon's projected vertices before clearing the card.
  if(selected.geometry&&typeof geometryPolygons==='function'){
    const r2=(radius*.975)**2;
    for(const polygon of geometryPolygons(selected.geometry))
      for(const ring of polygon)
        for(let k=0;k<ring.length;k+=Math.max(1,Math.floor(ring.length/150))){
          const v=ring[k];if(!Array.isArray(v)||v.length<2)continue;
          const q=project(v[0],v[1],w,h);
          if(q&&q[2]>.05&&(q[0]-w/2)**2+(q[1]-h/2)**2<=r2)
            return false;
        }
  }
  globeSelected=null;
  const box=document.getElementById('globe-status');
  if(box){
    box.classList.remove('premium-country-selected');
    box.innerHTML='<div class="flag" aria-hidden="true">🧭</div>'+
      '<div class="globe-country-copy"><div class="globe-country-line">'+
      '<strong>Hva vil du oppdage?</strong></div>'+
      '<span>Snurr på kloden og trykk på et land du vil utforske.</span></div>';
    box.onclick=null;box.style.cursor='default';
  }
  renderDiscoveryWelcome();
  if(typeof window.drawGlobe==='function')window.drawGlobe();
  return true;
}

window.LARIA_DISCOVERY_GLOBE_DRAW=discoveryDraw;
const preferenceKey='laria-globe-view-v1';
let desiredView='simple';
try{if(localStorage.getItem(preferenceKey)==='discover')desiredView='discover'}catch(_){}
if(forcedPreview)desiredView='discover';
const controls=[...document.querySelectorAll('#globe-view-toggle [data-globe-view]')];
const continentZoomCap=1.72;
/* Discovery begins at continent scale. The geographic center of the globe,
   not an arbitrary UI carousel, determines which story invitation is visible.
   The underlying country map remains the authoritative hit target. */
const discoveryContinentStops=[
  {name:'Europa',lon:13,lat:53,zoom:1.38,teaser:'Fjorder, fjell og mange land å oppdage.'},
  {name:'Afrika',lon:19,lat:3,zoom:1.28,teaser:'Sahara, savanner og grønne regnskoger.'},
  {name:'Asia',lon:104,lat:38,zoom:1.30,teaser:'Høye fjell, store skoger og spennende øyer.'},
  {name:'Nord-Amerika',lon:-105,lat:43,zoom:1.30,teaser:'Store skoger, høye fjell og lange elver.'},
  {name:'Sør-Amerika',lon:-62,lat:-14,zoom:1.30,teaser:'Amazonas, Andesfjellene og grønn regnskog.'},
  {name:'Oseania',lon:135,lat:-25,zoom:1.30,teaser:'Australia, store hav og mange øyer.'},
  {name:'Antarktis',lon:0,lat:-82,zoom:1.28,teaser:'Is, forskere og mange pingviner.'}
];
/* Child-directed discoveries at real longitude/latitude. A tap reveals a
   fresh, optional place to explore, never a mandatory quiz or progression
   gate. Antarktis uses its own public-domain coastlines, not a country or
   shared-map record. */
const discoveryContinentStories={
 'Europa':{
   intro:'I Europa finner du fjorder, fjell, skoger og store hav.',
   places:[
     {title:'Alpene',text:'Disse fjellene strekker seg gjennom flere land.',lon:11,lat:47},
     {title:'Norske fjorder',text:'Isbreer har gravd ut mange av fjordene i Norge.',lon:11,lat:64},
     {title:'Donau',text:'Donau renner gjennom flere land i Europa.',lon:22,lat:46}
   ]
 },
 'Afrika':{
   intro:'Afrika har både ørken, savanne og frodig regnskog.',
   places:[
     {title:'Sahara',text:'Sahara er verdens største varme ørken.',lon:13,lat:23},
     {title:'Nilen',text:'Denne elven renner nordover gjennom Afrika.',lon:31,lat:22},
     {title:'Kongos regnskog',text:'Her finnes en av verdens største regnskoger.',lon:23,lat:-4}
   ]
 },
 'Asia':{
   intro:'Asia er verdens største verdensdel.',
   places:[
     {title:'Himalaya',text:'I Himalaya ligger verdens høyeste fjell.',lon:87,lat:29},
     {title:'Gobiørkenen',text:'Gobi er en stor ørken der vintrene kan være kalde.',lon:104,lat:41},
     {title:'Japan',text:'Japan består av mange øyer øst i Asia.',lon:138,lat:36}
   ]
 },
 'Nord-Amerika':{
   intro:'Her finner du både fjellkjeder, skoger og store sjøer.',
   places:[
     {title:'Rocky Mountains',text:'Denne fjellkjeden strekker seg langt mot nord.',lon:-112,lat:42},
     {title:'De store sjøene',text:'Disse innsjøene ligger mellom USA og Canada.',lon:-86,lat:43},
     {title:'Mississippi',text:'En av Nord-Amerikas store elver renner mot sør.',lon:-91,lat:34}
   ]
 },
 'Sør-Amerika':{
   intro:'Andesfjellene ligger vest for regnskogen i Amazonas.',
   places:[
     {title:'Andesfjellene',text:'En lang fjellkjede følger vestkanten av kontinentet.',lon:-70,lat:-19},
     {title:'Amazonas',text:'Amazonas er en av verdens mest vannrike elver.',lon:-60,lat:-4},
     {title:'Patagonia',text:'Helt i sør finner du fjell, vind og isbreer.',lon:-71,lat:-46}
   ]
 },
 'Oseania':{
   intro:'Her er det store hav, korallrev og mange øyer.',
   places:[
     {title:'Korallrevet',text:'Great Barrier Reef ligger utenfor Australia.',lon:146,lat:-19},
     {title:'Australias indre',text:'Store deler av det indre Australia er tørre.',lon:134,lat:-25},
     {title:'New Zealand',text:'Her finnes høye fjell og store isbreer.',lon:170,lat:-42}
   ]
 },
 'Antarktis':{
   intro:'Det isdekte kontinentet er et sted mennesker reiser for å forske.',
   places:[
     {title:'Antarktishalvøya',text:'Halvøya strekker seg nordover mot Sør-Amerika.',lon:-64,lat:-68},
     {title:'Rossisen',text:'En enorm isplattform flyter på havet ved Antarktis.',lon:173,lat:-81},
     {title:'Sørpolen',text:'Ved Sørpolen er det vinter i et halvt år.',lon:0,lat:-90}
   ]
 }
};
const discoveryContinentVisits=new Map();
let activeDiscoveryLocation=null;
function discoveryTrailHtml(total,completed,current){
  const safeTotal=Math.max(1,Number(total)||1);
  const safeCompleted=Math.min(safeTotal,Math.max(0,Number(completed)||0));
  const safeCurrent=Math.min(safeTotal,Math.max(1,Number(current)||1));
  return '<div class="discovery-place-trail" role="group" aria-label="'+safeCompleted+' av '+safeTotal+' steder oppdaget">'+
    '<span class="discovery-place-trail-label">'+safeCompleted+' av '+safeTotal+' steder</span>'+
    '<span class="discovery-place-dots" aria-hidden="true">'+
      Array.from({length:safeTotal},(_,index)=>'<i class="'+(index<safeCompleted?'is-found':index===safeCurrent-1?'is-next':'')+'"></i>').join('')+
    '</span></div>';
}
function paintDiscoveryLocation(ctx,w,h,s,moving){
  if(moving||!activeDiscoveryLocation)return 0;
  const {lon,lat}=activeDiscoveryLocation;
  const p=project(lon,lat,w,h);
  if(!p||p[2]<.10)return 0;
  const r=clamp(s*.014,4.5,9);
  // A single location highlight indicates what the child is discovering.
  // It never changes the original country hit testing or land geometry.
  ctx.save();
  ctx.shadowColor='rgba(255,224,120,.72)';
  ctx.shadowBlur=r*2;
  ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);
  ctx.fillStyle='#D9913C';ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle='#FFF7D5';ctx.lineWidth=Math.max(1.4,r*.30);ctx.stroke();
  ctx.beginPath();ctx.arc(p[0],p[1],r*.32,0,Math.PI*2);
  ctx.fillStyle='#FFFDF0';ctx.fill();
  ctx.restore();
  return 1;
}
function showContinentDiscovery(stop,box,button){
  if(window.__lariaDiscoveryGlobePreview!==true||globeSelected)return;
  const story=discoveryContinentStories[stop.name];
  if(!story)return;
  const visits=discoveryContinentVisits.get(stop.name)||0;
  const placeIndex=visits%story.places.length;
  const place=story.places[placeIndex];
  const target=place;
  activeDiscoveryLocation={
    continent:stop.name,title:place.title,lon:place.lon,lat:place.lat
  };
  globeLon=target.lon;globeLat=target.lat;
  if(typeof setGlobeZoom==='function')setGlobeZoom(place?1.44:stop.zoom);
  else window.drawGlobe?.();
  discoveryContinentVisits.set(stop.name,visits+1);
  const copy=box.querySelector('.discovery-intro-copy');
  if(!copy)return;
  const completed=Math.min(story.places.length,visits+1);
  const finished=completed===story.places.length;
  copy.querySelector('.discovery-intro-kicker').textContent=finished?'TRE STEDER OPPDAGET':'ET STED Å OPPDAGE';
  copy.querySelector('strong').textContent=place.title;
  copy.querySelector('.discovery-intro-teaser').textContent=finished
    ?place.text+' Nå har du sett tre steder i '+stop.name+'.'
    :place.text;
  const trail=copy.querySelector('.discovery-place-trail');
  if(trail)trail.outerHTML=discoveryTrailHtml(story.places.length,completed,Math.min(story.places.length,placeIndex+2));
  button.textContent=finished?'Se stedene igjen':'Neste sted';
  box.dataset.discoveryStoryStep=String(completed);
  const fox=box.querySelector('.discovery-intro-fox');
  if(fox){
    fox.classList.remove('discovery-fox-reacting');
    requestAnimationFrame(()=>fox.classList.add('discovery-fox-reacting'));
  }
  // On the shortest phones the child should still be able to see and turn
  // the geographic globe; nothing is automatically marked completed.
  scrollShortDiscovery(false);
}
function discoveryContinentForCamera(){
  // Antarctica is land, not the nearest inhabited continent. Without this
  // polar rule, rotating south misleadingly labels its ice as Oseania.
  if(antarcticaOutline&&globeLat<=-61)
    return discoveryContinentStops[discoveryContinentStops.length-1];
  const rad=Math.PI/180,latitude=globeLat*rad;
  let closest=discoveryContinentStops[0],best=-2;
  for(const stop of discoveryContinentStops){
    const targetLat=stop.lat*rad;
    const proximity=Math.sin(latitude)*Math.sin(targetLat)+
      Math.cos(latitude)*Math.cos(targetLat)*Math.cos((globeLon-stop.lon)*rad);
    if(proximity>best){best=proximity;closest=stop;}
  }
  return closest;
}
const copyNodes={
  hero:screen.querySelector('.hero-copy'),
  hint:screen.querySelector('.globe-hint')
};
for(const node of Object.values(copyNodes))if(node)node.dataset.simpleCopy=node.textContent;
function selectedFoxSource(){
  try{
    const avatar=state?.profile?.avatar==='girl'?'girl':'boy';
    const source=window.LARIA_PROFILE_AVATARS?.[avatar];
    if(typeof source==='string'&&source)return source;
  }catch(_){}
  return './lia-fox-explorer-home.webp';
}
function scrollShortDiscovery(toCard){
  // On a short iPhone the existing globe shell scrolls to preserve the size
  // and touch precision of the map. Screen geometry, not unreliable browser
  // orientation media matches, determines whether this is that layout.
  const compact=window.__lariaDiscoveryGlobePreview===true&&
    screen.clientWidth<=350&&screen.clientHeight<=700&&
    screen.clientHeight>=screen.clientWidth;
  const maxScroll=Math.max(0,screen.scrollHeight-screen.clientHeight);
  screen.dataset.discoveryScrollAttempt=String(compact)+'/'+Math.round(maxScroll);
  if(!compact||maxScroll<=8)return;
  // Set the scroll position immediately: on WebKit a smooth call scheduled
  // into an offscreen canvas repaint may never advance before the card loads.
  screen.scrollTop=toCard?maxScroll:0;
  if(toCard)requestAnimationFrame(()=>{
    // Selected-country card may gain its personal fox after first layout.
    if(window.__lariaDiscoveryGlobePreview===true&&globeSelected)
      screen.scrollTop=Math.max(0,screen.scrollHeight-screen.clientHeight);
  });
}
function renderDiscoveryWelcome(){
  if(window.__lariaDiscoveryGlobePreview!==true||globeSelected)return false;
  const box=document.getElementById('globe-status');if(!box)return false;
  const stop=discoveryContinentForCamera();
  if(activeDiscoveryLocation&&activeDiscoveryLocation.continent!==stop.name)
    activeDiscoveryLocation=null;
  // Idle checks must not rebuild the portrait or steal keyboard focus.
  if(box.classList.contains('discovery-continent-intro')&&
     box.dataset.discoveryContinent===stop.name&&box.querySelector('.discovery-intro-copy'))
    return false;
  box.className='globe-status discovery-continent-intro';
  box.dataset.discoveryContinent=stop.name;
  delete box.dataset.discoveryCountryId;
  delete box.dataset.discoveryStoryStep;
  box.innerHTML='<div class="discovery-intro-copy">'+
    '<span class="discovery-intro-kicker">VERDENSDEL</span>'+
    '<strong>'+stop.name+' venter</strong>'+
    '<span class="discovery-intro-teaser" aria-live="polite">'+stop.teaser+'</span>'+
    discoveryTrailHtml(discoveryContinentStories[stop.name]?.places.length||3,0,1)+
    '<button type="button" class="discovery-continent-button">Se '+stop.name+'</button></div>'+
    '<img class="discovery-intro-fox" src="'+selectedFoxSource()+'" alt="Din rev er med på oppdagelsen">';
  box.style.cursor='default';box.onclick=null;
  const button=box.querySelector('.discovery-continent-button');
  if(button)button.onclick=()=>showContinentDiscovery(stop,box,button);
  return true;
}
function discoveryCompanionText(country){
  const name=String(country?.name||'');
  if(name==='Norge')return 'Se fjordene og de lange fjellryggene!';
  if(name==='Frankrike'||name==='Italia'||name==='Sveits'||name==='Østerrike')return 'Her er Alpene like ved. Skal vi se nærmere?';
  if(name==='Spania'||name==='Hellas')return 'Her møter grønne åser det varme havet.';
  return 'Dette stedet vil jeg gjerne oppdage sammen med deg!';
}
function enhanceDiscoveryCountryCard(){
  if(window.__lariaDiscoveryGlobePreview!==true||!globeSelected||typeof countries==='undefined')return false;
  const country=countries[globeSelected],box=document.getElementById('globe-status');
  if(!country||!box)return false;
  const copy=box.querySelector('.globe-country-copy');if(!copy)return false;
  box.classList.remove('discovery-continent-intro');
  /* The shared country card owns the click target. Mark the selected
     discovery state so its reserved iPad flag/copy grid is actually active. */
  box.classList.add('premium-country-selected');
  delete box.dataset.discoveryContinent;
  delete box.dataset.discoveryStoryStep;
  if(copy.querySelector('.discovery-country-companion'))return false;
  const companion=document.createElement('div');
  companion.className='discovery-country-companion';
  companion.innerHTML='<img src="'+selectedFoxSource()+'" alt="Din rev">'+
    '<span>'+discoveryCompanionText(country)+'</span>';
  copy.appendChild(companion);
  box.dataset.discoveryCountryId=country.id;
  return true;
}
function syncButtons(){
  screen.dataset.globeView=desiredView;
  for(const btn of controls){
    const active=btn.dataset.globeView===desiredView;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  }
}
const wait=()=>{
  if(!window.__lariaGlobeV25Installed||typeof window.resizeGlobe!=='function'||!document.getElementById('globe-canvas'))
    return requestAnimationFrame(wait);
  const baseDraw=window.drawGlobe;
  window.__lariaDiscoveryGlobeBaseDraw=baseDraw;
  let activated=false;
  let simpleViewState=null;
  let simpleViewRestored=false;
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
    /* The premium shell originally described only the simple globe even when
       Oppdag was selected. Keep guidance in step with the active drawing mode. */
    const subtitle=screen.querySelector('[data-premium-globe-subtitle]');
    if(inClassic&&subtitle){
      const expected=enabled
        ?'Oppdag fjell, skoger, elver og ørkener på kloden.'
        :'Den klassiske snurrbare kloden – dra, zoom og finn land.';
      if(subtitle.textContent!==expected)subtitle.textContent=expected;
    }
    if(enabled&&!simpleViewState){
      const status=document.getElementById('globe-status');
      simpleViewState={lon:globeLon,lat:globeLat,zoom:globeZoom,country:globeSelected,
        status:status?{html:status.innerHTML,className:status.className,
          onclick:status.onclick,cursor:status.style.cursor}:null};
    }
    if(enabled)simpleViewRestored=false;
    window.__lariaDiscoveryGlobePreview=enabled;
    if(copyNodes.hero)copyNodes.hero.textContent=enabled
      ?'Velg en verdensdel, snurr på kloden og finn et land du vil oppdage.'
      :copyNodes.hero.dataset.simpleCopy;
    if(copyNodes.hint)copyNodes.hint.textContent=enabled
      ?'Dra for å snurre · knip for kontinentnivå'
      :copyNodes.hint.dataset.simpleCopy;
    if(!enabled){
      activeDiscoveryLocation=null;
      const displayCanvas=document.getElementById('globe-canvas');
      if(displayCanvas){
        displayCanvas.dataset.discoveryLocationCount='0';
        delete displayCanvas.dataset.discoveryLocationName;
      }
      const needsRestore=window.drawGlobe===discoveryDraw;
      if(needsRestore)restore();
      if(simpleViewState&&(!simpleViewRestored||desiredView==='simple')){
        const saved=simpleViewState;
        // Atlas is a temporary detour, not an explicit choice of Enkel.
        // Keep the original simple camera and country snapshot until the
        // child actually chooses Enkel; Atlas may seed a legacy showcase.
        if(desiredView==='simple')simpleViewState=null;
        globeLon=saved.lon;globeLat=saved.lat;globeSelected=saved.country;
        const status=document.getElementById('globe-status');
        if(status&&saved.status){
          status.className=saved.status.className;status.innerHTML=saved.status.html;
          status.onclick=saved.status.onclick;status.style.cursor=saved.status.cursor;
          delete status.dataset.discoveryCountryId;
          delete status.dataset.discoveryStoryStep;
        }
        setGlobeZoom(saved.zoom);
        simpleViewRestored=true;
      }
      // The child can leave Oppdag for Atlas without changing the saved
      // discover preference. Never let an inactive discovery paint marker
      // recolour the existing map or any other globe perspective.
      delete screen.dataset.discoveryGlobe;
      delete screen.dataset.discoveryGlobeLevel;
      delete screen.dataset.discoveryZoom;
      if(activated&&inClassic&&needsRestore){
        try{window.resizeGlobe();window.drawGlobe?.()}catch(error){
          window.__lariaDiscoveryGlobeLastError=String(error?.stack||error);
        }
      }
      activated=false;
      return;
    }
    if(!activated||window.drawGlobe!==discoveryDraw){
      /* Do not leave a close-up inherited from Enkel behind when the child
         enters Oppdag. The cap is enforced by the shared input owner too. */
      screen.dataset.discoveryZoom='continent-v1';
      /* The legacy shell seeds Tsjad as a generic showcase. Oppdag opens at
         its intentional Europe starting point instead; this is transient UI
         selection only, never the child's saved country progress. */
      if(!activated&&(!globeSelected||countries[globeSelected]?.name==='Tsjad')){
        globeSelected=null;globeLon=13;globeLat=53;
      }
      if(typeof setGlobeZoom==='function'&&globeZoom>continentZoomCap)
        setGlobeZoom(continentZoomCap);
      window.drawGlobe=discoveryDraw;
      try{drawGlobe=discoveryDraw}catch(_){}
      try{window.resizeGlobe();discoveryDraw();renderDiscoveryWelcome();enhanceDiscoveryCountryCard();activated=true}
      catch(error){
        window.__lariaDiscoveryGlobeLastError=String(error?.stack||error);
        desiredView='simple';
        window.__lariaDiscoveryGlobePreview=false;
        restore();syncButtons();
        try{window.drawGlobe?.()}catch(_){}
      }
    }
    // Recover the discovery invitation if the shared map-mode UI has
    // replaced its card. Do not churn the DOM during a drag or idle repaint.
    if(enabled&&!globeSelected&&window.__lariaGlobeInteracting!==true)
      renderDiscoveryWelcome();
  };
  const chooseView=view=>{
    if(view!=='simple'&&view!=='discover')return;
    desiredView=view;
    try{localStorage.setItem(preferenceKey,view)}catch(_){}
    syncButtons();
    activate();
  };
  window.LARIA_SET_GLOBE_VIEW=chooseView;
  const canvas=document.getElementById('globe-canvas');
  let trustedCountryRevealPending=false;
  if(canvas){
    // The input owner already updates the rotation before these passive events.
    // Do not clear selection for a tap: only a completed drag or zoom can
    // move an old choice off the globe's current visible surface.
    const afterDrag=event=>{
      // This plugin's pointerup listener can be installed *before* the shared
      // input owner's listener. Observe selection only on the next animation
      // frame, after the input owner has picked the country and removed its
      // pointer. Do not duplicate or intercept the original hit-test.
      const type=event.type,trusted=event.isTrusted;
      if(type==='pointercancel')trustedCountryRevealPending=false;
      else if(type==='pointerup'&&trusted)trustedCountryRevealPending=true;
      let settleFrames=0;
      const settleAfterPointer=()=>{
        if(typeof globePointers!=='undefined'&&globePointers.size>0){
          if(settleFrames++<2)requestAnimationFrame(settleAfterPointer);
          return;
        }
        if(typeof globeMove==='number'&&globeMove>=8){
          trustedCountryRevealPending=false;
          clearOffscreenDiscoverySelection();
          renderDiscoveryWelcome();
        }else if(type==='pointerup'&&trusted&&globeSelected){
          trustedCountryRevealPending=false;
          scrollShortDiscovery(true);
        }
      };
      requestAnimationFrame(settleAfterPointer);
    };
    canvas.addEventListener('pointerup',afterDrag,{passive:true});
    canvas.addEventListener('pointercancel',afterDrag,{passive:true});
    canvas.addEventListener('wheel',()=>requestAnimationFrame(()=>{clearOffscreenDiscoverySelection();renderDiscoveryWelcome();}),{passive:true});
  }
  const status=document.getElementById('globe-status');
  if(status){
    let pendingCompanion=false;
    // A selected-country card can be taller than the welcome invitation.
    // Place the portrait selector above its measured edge, not at a fixed
    // offset that would leave the lower part of the buttons covered.
    const syncSelectorPosition=()=>{
      if(window.__lariaDiscoveryGlobePreview!==true)return;
      const bottom=Math.ceil(screen.getBoundingClientRect().bottom-status.getBoundingClientRect().top+12);
      screen.style.setProperty('--discovery-selector-bottom',bottom+'px');
    };
    if(typeof ResizeObserver==='function'){
      const cardSize=new ResizeObserver(syncSelectorPosition);
      cardSize.observe(status);cardSize.observe(screen);
    }
    new MutationObserver(()=>{
      if(pendingCompanion)return;
      pendingCompanion=true;
      requestAnimationFrame(()=>{
        pendingCompanion=false;
        enhanceDiscoveryCountryCard();
        syncSelectorPosition();
        /* WebKit may finish the shared country-card mutation before this
           passive plugin sees the pointer registry clear. The mutation is
           therefore the reliable final signal that a trusted tap produced a
           real country selection. Programmatic selections never set the flag. */
        if(trustedCountryRevealPending&&window.__lariaDiscoveryGlobePreview===true&&globeSelected){
          trustedCountryRevealPending=false;
          scrollShortDiscovery(true);
        }
      });
    }).observe(status,{childList:true,subtree:true});
  }
  controls.forEach(btn=>btn.addEventListener('click',()=>chooseView(btn.dataset.globeView)));
  document.getElementById('reset-globe')?.addEventListener('click',()=>
    requestAnimationFrame(renderDiscoveryWelcome));
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
