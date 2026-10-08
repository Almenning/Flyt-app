(()=>{'use strict';
/* Geographic, painted atlas. All coastlines come from WORLD_COUNTRIES,
   never from an unregistered world illustration. Coordinates are EPSG:4326
   equirectangular so the globe's orthographic inverse samples the same earth. */
const WIDTH=2048,HEIGHT=1024;
const PALETTE={
  'Europa':'#78aa69','Asia':'#8fad71','Afrika':'#b7a66d',
  'Nord-Amerika':'#79a869','Sør-Amerika':'#63a466','Oseania':'#93a76e'
};
const BIOMES=[
  ['forest',-111,53,23,17],['forest',-88,49,18,16],['forest',-61,-5,24,19],
  ['forest',-70,-13,16,14],['forest',16,57,28,16],['forest',75,61,51,20],
  ['forest',106,50,24,18],['forest',105,16,18,16],['forest',21,0,17,12],
  ['forest',135,35,14,10],
  ['desert',10,25,37,16],['desert',43,23,17,13],['desert',64,40,19,11],
  ['desert',76,29,10,9],['desert',134,-24,20,16],['desert',-110,32,10,9],
  ['savanna',20,5,26,12],['savanna',26,-17,20,14],['savanna',-57,-19,18,12],
  ['savanna',80,20,13,13],['savanna',108,41,16,9],
  ['snow',-42,72,21,16],['snow',19,71,16,13],['snow',95,72,40,13],
  ['snow',-110,69,28,12],['mountain',83,30,22,7],['mountain',-72,-21,8,35],
  ['mountain',-113,42,11,25],['mountain',10,45,11,8]
];
const BIOME_COLORS={
  forest:['rgba(39,113,62,.70)','rgba(56,138,66,.36)','rgba(70,151,79,0)'],
  desert:['rgba(244,197,84,.95)','rgba(224,174,84,.64)','rgba(206,160,67,0)'],
  savanna:['rgba(203,179,77,.67)','rgba(174,164,79,.27)','rgba(174,164,79,0)'],
  snow:['rgba(250,253,246,.96)','rgba(219,238,232,.63)','rgba(205,225,227,0)'],
  mountain:['rgba(175,164,136,.58)','rgba(152,157,133,.29)','rgba(152,157,133,0)']
};
function randFactory(seed){
  let x=seed>>>0;
  return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296};
}
function geoPoint(lon,lat,w=WIDTH,h=HEIGHT){
  const norm=((Number(lon)+180)%360+360)%360;
  return [norm/360*w,(90-Number(lat))/180*h];
}
function polygons(g){
  if(!g)return [];
  return g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
}
/* Unwrap each polygon ring continuously; repeat across the dateline seam.
   Even-odd fill preserves lake holes and prevents trans-ocean triangles. */
function traceRing(ctx,ring,w,h,shift){
  if(!ring||ring.length<3)return;
  let last=Number(ring[0][0]);
  const move=x=>((x+180+shift)/360*w);
  const y=lat=>(90-lat)/180*h;
  ctx.moveTo(move(last),y(Number(ring[0][1])));
  for(let i=1;i<ring.length;i++){
    let lon=Number(ring[i][0]);
    while(lon-last>180)lon-=360;
    while(lon-last< -180)lon+=360;
    ctx.lineTo(move(lon),y(Number(ring[i][1])));
    last=lon;
  }
  ctx.closePath();
}
function paintGeometry(ctx,geometry,w,h,paint,stroke){
  for(const poly of polygons(geometry)){
    for(const shift of [-360,0,360]){
      ctx.beginPath();
      for(const ring of poly)traceRing(ctx,ring,w,h,shift);
      if(paint)ctx.fill('evenodd');
      if(stroke)ctx.stroke();
    }
  }
}
function paintBiome(ctx,type,lon,lat,lonRadius,latRadius,w,h){
  const [centerX,centerY]=geoPoint(lon,lat,w,h);
  const rx=Math.max(3,lonRadius*w/360),ry=Math.max(3,latRadius*h/180);
  const colors=BIOME_COLORS[type];
  for(const shift of [-w,0,w]){
    ctx.save();ctx.translate(centerX+shift,centerY);ctx.scale(rx,ry);
    const g=ctx.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,colors[0]);g.addColorStop(.55,colors[1]);g.addColorStop(1,colors[2]);
    ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
}
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function build(countries){
  if(!Array.isArray(countries)||countries.filter(c=>c&&c.geometry).length<130)
    throw new Error('Geographic globe atlas requires actual country polygons.');
  const w=WIDTH,h=HEIGHT,rng=randFactory(0x1a91a);
  const canvas=makeCanvas(w,h),ctx=canvas.getContext('2d',{willReadFrequently:true});
  const sea=ctx.createLinearGradient(0,0,0,h);
  sea.addColorStop(0,'#087caf');sea.addColorStop(.32,'#16add1');
  sea.addColorStop(.60,'#13a9cb');sea.addColorStop(1,'#0872a7');
  ctx.fillStyle=sea;ctx.fillRect(0,0,w,h);
  /* Fine ocean variation adds watercolor texture without bogus coastlines. */
  for(let i=0;i<3400;i++){
    const x=rng()*w,y=rng()*h,sz=2+rng()*11;
    ctx.fillStyle=i%5===0?'rgba(229,255,249,.09)':'rgba(7,91,148,.045)';
    ctx.beginPath();ctx.ellipse(x,y,sz*1.6,Math.max(.5,sz*.14),-.12,0,Math.PI*2);ctx.fill();
  }

  const mask=makeCanvas(w,h),mc=mask.getContext('2d',{willReadFrequently:true});
  mc.fillStyle='#fff';
  const land=makeCanvas(w,h),lc=land.getContext('2d',{willReadFrequently:true});
  let geometryCount=0;
  for(const c of countries){
    if(!c||!c.geometry)continue;
    ++geometryCount;
    paintGeometry(mc,c.geometry,w,h,true,false);
    lc.fillStyle=PALETTE[c.continent]||'#83a773';
    paintGeometry(lc,c.geometry,w,h,true,false);
  }

  /* Watercolor biomes are laid over geographically accurate land pixels only. */
  lc.save();lc.globalCompositeOperation='source-atop';
  for(const b of BIOMES)paintBiome(lc,...b,w,h);
  const alpha=mc.getImageData(0,0,w,h).data;
  for(let i=0;i<17000;i++){
    const x=(rng()*w)|0,y=(rng()*h)|0;
    if(alpha[(y*w+x)*4+3]<180)continue;
    const size=.6+rng()*2.7;
    lc.fillStyle=i%7===0?'rgba(255,249,189,.24)':i%3===0?'rgba(34,86,47,.18)':'rgba(47,104,56,.11)';
    lc.beginPath();lc.ellipse(x,y,size*(1+rng()*2),size*.60,(rng()-.5)*.5,0,Math.PI*2);lc.fill();
  }
  lc.restore();
  ctx.save();
  ctx.shadowColor='rgba(18,69,58,.36)';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
  ctx.drawImage(land,0,0);ctx.restore();

  /* Thin coastline follows real polygons, not the painting beneath them. */
  ctx.lineWidth=1.15;ctx.strokeStyle='rgba(249,235,175,.61)';
  for(const c of countries)if(c&&c.geometry)paintGeometry(ctx,c.geometry,w,h,false,true);

  /* Details are placed at their own real coordinates; never screen-fixed. */
  const art=window.LariaGlobeArtV24;
  if(art&&art.draw&&Array.isArray(art.FEATURES)){
    for(const detail of art.FEATURES){
      const [name,lon,lat,scale,flip]=detail;
      const fn=art.draw[name];if(typeof fn!=='function')continue;
      const [x,y]=geoPoint(lon,lat,w,h);
      const k=Math.max(10,Math.min(39,26*(Number(scale)||1)));
      for(const shift of [-w,0,w])fn(ctx,x+shift,y,k,!!flip);
    }
  }
  const pixels=ctx.getImageData(0,0,w,h).data;
  const isLandAt=(lon,lat)=>{
    const [x,y]=geoPoint(lon,lat,w,h);
    const px=Math.max(0,Math.min(w-1,Math.floor(x)));
    const py=Math.max(0,Math.min(h-1,Math.floor(y)));
    return alpha[(py*w+px)*4+3]>127;
  };
  const sampleAt=(lon,lat)=>{
    const [x,y]=geoPoint(lon,lat,w,h),i=4*((Math.max(0,Math.min(h-1,Math.floor(y)))*w)+Math.max(0,Math.min(w-1,Math.floor(x))));
    return [pixels[i],pixels[i+1],pixels[i+2],pixels[i+3]];
  };
  return {pixels,width:w,height:h,geometryCount,isLandAt,sampleAt,projection:'EPSG:4326'};
}
window.LariaGeographicAtlasV1={build,geoPoint};
})();