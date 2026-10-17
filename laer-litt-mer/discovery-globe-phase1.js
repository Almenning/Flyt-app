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
  rainforest:[20,88,57],forest:[49,110,76],desert:[228,177,101],
  savanna:[166,158,85],tundra:[156,181,165],ice:[225,243,232]
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
    const pixels=level===1?128:level===2?172:208;
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
        const tint=bp?terrainTint[bp.kind]:null;
        // The base polygon's established light and colour always remain
        // visible. High relief shifts shadows, but never recolours borders.
        const leafy=bp&&(bp.kind==='rainforest'||bp.kind==='forest');
        const base=shade+mountainCut*85-mountainReach*28;
        const neutral=[118+base*.64,161+base*.75,115+base*.49];
        const alpha=clamp(.17+biomeReach*.56+mountainReach*.18,.17,.79);
        const mixT=clamp(biomeReach*.94,0,.96);
        let red=neutral[0],green=neutral[1],blue=neutral[2];
        if(tint){
          red=red*(1-mixT)+tint[0]*mixT;
          green=green*(1-mixT)+tint[1]*mixT;
          blue=blue*(1-mixT)+tint[2]*mixT;
          if(leafy){
            const crown=canopy*(level===3?92:level===2?77:52)*biomeReach;
            red+=crown*.52;
            green+=crown*.76;
            blue+=crown*.48;
          }
        }
        if(mountainReach>.06){
          const light=mountainCut*48;
          red+=light+mountainReach*10;
          green+=light+mountainReach*9;
          blue+=light+mountainReach*8;
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
    if(canvas)canvas.dataset.discoveryTerrainMs=String(Math.round(terrainFieldCache.ms));
    ctx.restore();return 1;
  }
  ctx.restore();return 0;
}

function paintBorders(ctx,w,h,s){
  for(const c of land()){
    if(!c.geometry)continue;ctx.beginPath();if(!path(ctx,c,w,h))continue;
    const selected=c.id===globeSelected;
    if(selected){ctx.save();ctx.fillStyle='rgba(255,224,137,.13)';ctx.shadowColor='rgba(255,188,36,.22)';ctx.shadowBlur=Math.max(8,s*.014);ctx.fill();ctx.restore();}
    ctx.strokeStyle=selected?'rgba(255,253,225,.98)':`rgba(255,250,226,${globeZoom>2.4?.48:.29})`;ctx.lineWidth=selected?Math.max(1.7,s*.003):Math.max(.55,s*.0011);ctx.stroke();
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
const riverWays=[
  {name:'Amazonas',route:[[-72,-4],[-68,-4.1],[-64,-3.6],[-61,-3.4],[-58,-3],[-55,-2.8],[-52,-2],[-49.5,-1.3]]},
  {name:'Nile',route:[[31,30.5],[31.3,26],[32.1,21],[33,17],[32.4,12],[31.8,8]]},
  {name:'Mississippi',route:[[-93.3,47.1],[-92.7,43.3],[-91.1,39],[-90.1,34.5],[-90.2,30.1]]},
  {name:'Danube',route:[[8.2,48],[12.5,48.4],[16.8,48.1],[20.6,45.5],[25.6,44.3],[29.6,45.2]]},
  {name:'Yangtze',route:[[97,33.3],[102,30.7],[107,29.8],[112,30.2],[117,30.9],[121,31.1]]}
];
function paintMountainCrests(ctx,chain,w,h,s,level,width){
  if(level<2)return 0;
  let drawn=0;
  for(let j=0;j<chain.route.length-1;j++){
    const a=chain.route[j],b=chain.route[j+1];
    const steps=Math.max(2,Math.round(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/(level===2?2.8:1.9)));
    for(let k=0;k<steps;k++){
      const t=(k+.42)/steps,lon=a[0]+(b[0]-a[0])*t,lat=a[1]+(b[1]-a[1])*t;
      const p=project(lon,lat,w,h);if(!p||p[2]<.2)continue;
      const seed=Math.abs(Math.sin((j*31+k*7+lat)*1.23));
      const height=clamp(Math.max(width*(.42+seed*.22),s*(level===2?.0085:.012)),s*.007,s*.024)*(level===3?1.08:.95);
      const x=p[0],y=p[1];
      ctx.save();
      ctx.fillStyle='rgba(37,85,74,.40)';
      ctx.beginPath();ctx.moveTo(x-height*.98,y+height*.48);
      ctx.lineTo(x,y-height*.97);ctx.lineTo(x+height*.95,y+height*.55);
      ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(165,186,153,.86)';
      ctx.beginPath();ctx.moveTo(x-height*.94,y+height*.48);
      ctx.lineTo(x,y-height*.94);ctx.lineTo(x-height*.12,y+height*.46);
      ctx.closePath();ctx.fill();
      if(chain.snow){
        ctx.fillStyle='rgba(255,253,233,.89)';ctx.beginPath();
        ctx.moveTo(x,y-height*.95);ctx.lineTo(x-height*.25,y-height*.41);
        ctx.lineTo(x-height*.07,y-height*.51);ctx.lineTo(x+height*.15,y-height*.43);
        ctx.closePath();ctx.fill();
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
  let count=0;
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
    count+=1+paintMountainCrests(ctx,chain,w,h,s,level,radius*.72);
  }
  if(level>=2)for(const river of riverWays){
    if(!smoothGeoStroke(ctx,river.route,w,h,s))continue;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const k=s*.0022*clamp(Math.pow(globeZoom,.14),1,1.25);
    ctx.strokeStyle='rgba(26,110,132,.46)';ctx.lineWidth=Math.max(1,k*2.1);ctx.stroke();
    ctx.strokeStyle='rgba(172,232,219,.73)';ctx.lineWidth=Math.max(.68,k*.88);ctx.stroke();
    ctx.restore();count++;
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
  if(moving||level===1)return 0;
  let drawn=0;
  /* Small overlapping canopy crowns create one coherent forest, not a few
     giant decorative trees. Density is tied to geographic forest corridors. */
  for(let z=0;z<landscapeZones.length;z++){
    const zone=landscapeZones[z],segments=zone.route.length-1;
    const leafy=zone.type==='rainforest'||zone.type==='forest';
    const perZone=leafy?(level===2?33:82):(level===2?18:43);
    for(let i=0;i<perZone;i++){
      const t=geoNoise(z*109+i*29+9)*segments;
      const j=Math.min(segments-1,Math.floor(t)),f=t-j;
      const a=zone.route[j],b=zone.route[j+1];
      const lon=a[0]+(b[0]-a[0])*f+(geoNoise(z*307+i*17+1)-.5)*zone.width*.80;
      const lat=a[1]+(b[1]-a[1])*f+(geoNoise(z*127+i*43+4)-.5)*zone.width*.80;
      const p=project(lon,lat,w,h);if(!p||p[2]<.18)continue;
      const k=s*(leafy?(level===2?.0078:.0105):(level===2?.005:.0075))*
        clamp(Math.pow(globeZoom,.13),1,1.27)*
        clamp(p[2]+.21,.55,1.1)*(0.67+geoNoise(i*7+z*19)*.49);
      if(p[0]<-k*3||p[0]>w+k*3||p[1]<-k*3||p[1]>h+k*3)continue;
      ctx.save();ctx.translate(p[0],p[1]);ctx.lineCap='round';ctx.lineJoin='round';
      if(leafy){
        const tropical=zone.type==='rainforest';
        ctx.fillStyle=tropical?'rgba(23,77,56,.31)':'rgba(39,87,58,.26)';
        ctx.beginPath();ctx.ellipse(0,k*.40,k*1.38,k*.60,.12,0,Math.PI*2);ctx.fill();
        for(const [dx,dy,scale] of [[-.65,.08,.77],[.50,.04,.82],[-.12,-.35,.98],[.35,-.38,.61]]){
          const x=k*dx,y=k*dy,r=k*scale;
          ctx.fillStyle=tropical?'rgba(31,103,65,.75)':'rgba(56,111,69,.73)';
          ctx.beginPath();ctx.ellipse(x,y,r*.71,r*.72,-.16,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=tropical?'rgba(112,179,94,.67)':'rgba(165,194,115,.61)';
          ctx.beginPath();ctx.ellipse(x-r*.22,y-r*.23,r*.38,r*.28,-.26,0,Math.PI*2);ctx.fill();
        }
      }else if(zone.type==='desert'){
        ctx.fillStyle='rgba(242,207,136,.28)';
        ctx.beginPath();ctx.ellipse(0,k*.42,k*1.14,k*.36,0,0,Math.PI*2);ctx.fill();
        for(let t=0;t<3;t++){
          ctx.strokeStyle=t===1?'rgba(254,239,174,.75)':'rgba(163,109,52,.42)';
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
  const level=globeZoom<1.7?1:globeZoom<2.8?2:3;
  /* Pointer ownership is the reliable signal while a drag is active. */
  const moving=window.__lariaGlobeInteracting===true&&typeof globePointers!=='undefined'&&globePointers.size>0;
  ocean(ctx,w,h,s);paintLandBase(ctx,w,h,s);
  const biomeCount=paintBiomes(ctx,w,h,s,moving);
  const fieldCount=paintWorldTerrain(ctx,w,h,s,level,moving);
  /* A moving globe uses its base map without the expensive land clip for
     stationary-only detail. This saves an entire geometry pass per frame. */
  ctx.save();const validLand=!moving&&landClip(ctx,w,h);
  const textureCount=validLand?paintGeographicTexture(ctx,w,h,s,level,moving):0;
  const reliefCount=validLand?paintReliefTrails(ctx,w,h,s,level,moving):0;
  const terrainCount=validLand?paintTerrainMarks(ctx,w,h,s,level,moving):0;
  const landmarkCount=validLand?paintLandmarks(ctx,w,h,s,level,moving,false):0;
  ctx.restore();
  const seaCount=paintLandmarks(ctx,w,h,s,level,moving,true);
  paintBorders(ctx,w,h,s);paintSmallCountries(ctx,w,h,s);
  if(typeof drawGlobePulse==='function')drawGlobePulse(ctx,w,h);
  ctx.restore();
  screen.dataset.discoveryGlobeLevel=String(level);screen.dataset.discoveryGlobe='landscapes-v2';
  canvas.dataset.discoveryRenderer='live';canvas.dataset.discoveryTerrainField=String(fieldCount);canvas.dataset.discoveryEcosystems=String(biomeCount);canvas.dataset.discoveryRelief=String(reliefCount);canvas.dataset.discoveryTexture=String(textureCount);canvas.dataset.discoveryLandmarks=String(landmarkCount+terrainCount+reliefCount+textureCount+seaCount+biomeCount+fieldCount);canvas.dataset.discoveryMoving=String(moving);
  canvas.dataset.discoveryPaintCount=String(Number(canvas.dataset.discoveryPaintCount||0)+1);
  // v25 can still seed the old Tsjad showcase after selecting Oppdag.
  // Reconcile after the card update has completed, not inside its draw call.
  if(globeSelected)scheduleVisibleCountryReconciliation();
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
  if(typeof window.drawGlobe==='function')window.drawGlobe();
  return true;
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
  if(!window.__lariaGlobeV25Installed||typeof window.resizeGlobe!=='function'||!document.getElementById('globe-canvas'))
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
    /* The premium shell originally described only the simple globe even when
       Oppdag was selected. Keep guidance in step with the active drawing mode. */
    const subtitle=screen.querySelector('[data-premium-globe-subtitle]');
    if(inClassic&&subtitle){
      const expected=enabled
        ?'Oppdag fjell, skoger, elver og ørkener på kloden.'
        :'Den klassiske snurrbare kloden – dra, zoom og finn land.';
      if(subtitle.textContent!==expected)subtitle.textContent=expected;
    }
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
  const canvas=document.getElementById('globe-canvas');
  if(canvas){
    // The input owner already updates the rotation before these passive events.
    // Do not clear selection for a tap: only a completed drag or zoom can
    // move an old choice off the globe's current visible surface.
    const afterDrag=()=>{
      if(typeof globePointers!=='undefined'&&globePointers.size>0)return;
      if(typeof globeMove==='number'&&globeMove>=8)
        requestAnimationFrame(clearOffscreenDiscoverySelection);
    };
    canvas.addEventListener('pointerup',afterDrag,{passive:true});
    canvas.addEventListener('pointercancel',afterDrag,{passive:true});
    canvas.addEventListener('wheel',()=>requestAnimationFrame(clearOffscreenDiscoverySelection),{passive:true});
  }
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
