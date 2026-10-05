(()=>{'use strict';
const screen=document.getElementById('world-screen');if(!screen)return;screen.classList.add('globe-v24');
const ART=window.LariaGlobeArtV24;if(!ART)return;
const {clamp,TERRAIN,FEATURES,draw}=ART;

const PALETTE={
  'Europa':'#5B86D9','Asia':'#E1B247','Afrika':'#E57A59',
  'Nord-Amerika':'#58A86B','Sør-Amerika':'#4DA567','Oseania':'#8A7AC9'
};
const mix=(a,b,t)=>{
  const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),m=(x,y)=>Math.round(x+(y-x)*t);
  return '#'+[m((pa>>16)&255,(pb>>16)&255),m((pa>>8)&255,(pb>>8)&255),m(pa&255,pb&255)].map(v=>v.toString(16).padStart(2,'0')).join('');
};
const project=(lon,lat,w,h)=>typeof globeProject==='function'?globeProject(lon,lat,w,h):null;

function addPath(ctx,c,w,h){
  if(!c.geometry||typeof geometryPolygons!=='function'||typeof drawProjectedLine!=='function')return false;
  for(const poly of geometryPolygons(c.geometry))for(const ring of poly)drawProjectedLine(ctx,ring,w,h);
  return true;
}
function countryBase(c){
  let base=PALETTE[c.continent]||'#78A47B';
  if(typeof globeMode==='string'&&globeMode==='mine'&&typeof countryStatus==='function'){
    const st=countryStatus(c.id);
    if(st==='new')base=mix(base,'#EEE9DC',.60);
    else if(st==='seen')base=mix(base,'#E8E3D5',.43);
    else if(st==='learning')base=mix(base,'#F1E6C9',.27);
    else if(st==='known')base=mix(base,'#FFF3D1',.10);
  }
  return base;
}
function ocean(ctx,w,h,s){
  const g=ctx.createRadialGradient(w/2-s*.20,h/2-s*.27,s*.02,w/2+s*.08,h/2+s*.10,s*.64);
  g.addColorStop(0,'#8DEAF5');g.addColorStop(.28,'#31CBE8');g.addColorStop(.67,'#079FCC');g.addColorStop(1,'#0879A6');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

  if(typeof drawProjectedLine==='function'){
    ctx.strokeStyle='rgba(226,252,255,.20)';ctx.lineWidth=Math.max(.6,s*.0012);
    for(const lat of [-60,-30,0,30,60]){
      ctx.beginPath();const pts=[];for(let lon=-180;lon<=180;lon+=4)pts.push([lon,lat]);drawProjectedLine(ctx,pts,w,h);ctx.stroke();
    }
    for(let lon=-180;lon<180;lon+=30){
      ctx.beginPath();const pts=[];for(let lat=-85;lat<=85;lat+=4)pts.push([lon,lat]);drawProjectedLine(ctx,pts,w,h);ctx.stroke();
    }
  }

  /* soft storybook waves */
  ctx.save();ctx.strokeStyle='rgba(238,253,255,.23)';ctx.lineWidth=Math.max(1,s*.0018);ctx.lineCap='round';
  const waves=[[.24,.29,.05],[.72,.34,.04],[.22,.67,.035],[.76,.72,.05],[.51,.81,.03]];
  for(const [ax,ay,ar] of waves){
    ctx.beginPath();ctx.arc(w*ax,h*ay,s*ar,Math.PI*.10,Math.PI*.78);ctx.stroke();
  }
  ctx.restore();
}
function countries(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  for(const c of WORLD_COUNTRIES){
    if(!c.geometry)continue;ctx.beginPath();if(!addPath(ctx,c,w,h))continue;
    const base=countryBase(c),selected=c.id===globeSelected;
    const g=ctx.createLinearGradient(w*.28,h*.16,w*.72,h*.86);
    if(selected){g.addColorStop(0,'#FFF1A8');g.addColorStop(.46,'#FFD965');g.addColorStop(1,'#E6AD32')}
    else{g.addColorStop(0,mix(base,'#FFF0C7',.22));g.addColorStop(.52,base);g.addColorStop(1,mix(base,'#3D5A4B',.16))}
    ctx.save();
    ctx.shadowColor=selected?'rgba(255,205,66,.48)':'rgba(31,61,54,.24)';
    ctx.shadowBlur=selected?Math.max(7,s*.014):Math.max(1.8,s*.0045);
    ctx.shadowOffsetY=Math.max(.5,s*.0017);ctx.fillStyle=g;ctx.fill();ctx.restore();

    /* top rim gives countries a tiny diorama lift */
    ctx.strokeStyle=selected?'rgba(255,248,211,.99)':'rgba(255,247,219,.93)';
    ctx.lineWidth=selected?Math.max(1.8,s*.0032):(globeZoom>2?1.15:Math.max(.85,s*.0016));ctx.stroke();
  }

  for(const c of WORLD_COUNTRIES){
    let tiny=false;try{tiny=typeof isTinyCountry==='function'&&isTinyCountry(c)}catch(_){}
    if(!tiny&&c.id!==globeSelected)continue;
    const p=project(c.lon,c.lat,w,h);if(!p||p[2]<.04)continue;
    const rr=c.id===globeSelected?Math.max(6,s*.0105):Math.max(2.3,s*.0042);
    ctx.beginPath();ctx.arc(p[0],p[1],rr,0,Math.PI*2);
    ctx.fillStyle=c.id===globeSelected?'#FFD759':'#FFF2A5';ctx.fill();
    ctx.strokeStyle='rgba(91,72,42,.28)';ctx.lineWidth=1;ctx.stroke();
  }
}
function landClip(ctx,w,h){
  if(typeof WORLD_COUNTRIES==='undefined')return false;ctx.beginPath();
  for(const c of WORLD_COUNTRIES)if(c.geometry)addPath(ctx,c,w,h);ctx.clip();return true;
}
function terrainPatch(ctx,w,h,s,t){
  const p=project(t[1],t[2],w,h);if(!p||p[2]<.08)return;
  const type=t[0],k=t[3]*clamp(p[2]+.20,.58,1.14),r=s*(type==='desert'?.082:type==='snow'?.072:.075)*k;
  ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(-.14);
  let center='rgba(39,127,67,.32)',edge='rgba(39,127,67,0)';
  if(type==='desert'){center='rgba(248,204,93,.38)';edge='rgba(248,204,93,0)'}
  if(type==='savanna'){center='rgba(150,158,67,.26)';edge='rgba(150,158,67,0)'}
  if(type==='snow'){center='rgba(255,255,244,.45)';edge='rgba(255,255,244,0)'}
  const g=ctx.createRadialGradient(0,0,1,0,0,r);g.addColorStop(0,center);g.addColorStop(1,edge);
  ctx.fillStyle=g;ctx.scale(1,.60);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();

  /* micro texture makes the continents feel illustrated rather than flat */
  ctx.save();ctx.globalAlpha=clamp(.72-globeZoom*.08,.30,.62);
  const marks=[[-.55,-.10],[-.26,.26],[.02,-.24],[.31,.18],[.58,-.03],[-.05,.44]];
  for(let i=0;i<marks.length;i++){
    const dx=marks[i][0]*r*.68,dy=marks[i][1]*r*.48,x=p[0]+dx,y=p[1]+dy,size=Math.max(1.2,s*.0035*k);
    if(type==='forest'){
      ctx.fillStyle=i%2?'rgba(31,103,54,.62)':'rgba(53,132,65,.62)';
      ctx.beginPath();ctx.moveTo(x,y-size*1.6);ctx.lineTo(x-size,y+size);ctx.lineTo(x+size,y+size);ctx.closePath();ctx.fill();
    }else if(type==='desert'){
      ctx.strokeStyle='rgba(167,117,42,.43)';ctx.lineWidth=Math.max(.7,size*.35);ctx.beginPath();ctx.arc(x,y,size*1.5,Math.PI*1.05,Math.PI*1.9);ctx.stroke();
    }else if(type==='savanna'){
      ctx.strokeStyle='rgba(92,111,46,.45)';ctx.lineWidth=Math.max(.7,size*.30);ctx.beginPath();ctx.moveTo(x,y+size);ctx.lineTo(x,y-size);ctx.moveTo(x,y);ctx.lineTo(x-size*.8,y-size*.7);ctx.moveTo(x,y);ctx.lineTo(x+size*.8,y-size*.7);ctx.stroke();
    }else{
      ctx.fillStyle='rgba(255,255,248,.58)';ctx.beginPath();ctx.arc(x,y,size*.72,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}
function features(ctx,w,h,s){
  const alpha=clamp(1.34-globeZoom*.18,.42,.98);ctx.save();ctx.globalAlpha=alpha;
  const visible=[];
  for(const f of FEATURES){
    const p=project(f[1],f[2],w,h);if(!p||p[2]<.07)continue;visible.push({f,p});
  }
  visible.sort((a,b)=>a.p[2]-b.p[2]);
  for(const {f,p} of visible){
    const base=clamp(s*.041,13,27);
    const k=base*f[3]*clamp(p[2]+.18,.60,1.15)*clamp(Math.pow(globeZoom,.12),1,1.22);
    const fn=draw[f[0]];if(fn)fn(ctx,p[0],p[1],k,!!f[4]);
  }
  ctx.restore();
}
function selectedHalo(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined'||!globeSelected)return;
  const c=WORLD_COUNTRIES.find(x=>x.id===globeSelected);if(!c)return;
  const p=project(c.lon,c.lat,w,h);if(!p||p[2]<.08)return;
  const r=Math.max(18,s*.034);
  const g=ctx.createRadialGradient(p[0],p[1],2,p[0],p[1],r*1.6);
  g.addColorStop(0,'rgba(255,237,129,.34)');g.addColorStop(.58,'rgba(255,211,69,.14)');g.addColorStop(1,'rgba(255,211,69,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],r*1.6,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,244,191,.82)';ctx.lineWidth=Math.max(1.3,s*.0024);ctx.beginPath();ctx.arc(p[0],p[1],r*.72,0,Math.PI*2);ctx.stroke();

  const sparks=[[-.95,-.70,.20],[.88,-.44,.15],[.74,.78,.12]];
  ctx.fillStyle='#FFE278';
  for(const [dx,dy,sc] of sparks){
    const x=p[0]+r*dx,y=p[1]+r*dy,q=r*sc;ctx.beginPath();
    ctx.moveTo(x,y-q);ctx.lineTo(x+q*.28,y-q*.28);ctx.lineTo(x+q,y);ctx.lineTo(x+q*.28,y+q*.28);
    ctx.lineTo(x,y+q);ctx.lineTo(x-q*.28,y+q*.28);ctx.lineTo(x-q,y);ctx.lineTo(x-q*.28,y-q*.28);ctx.closePath();ctx.fill();
  }
}
function finish(ctx,w,h,s){
  const shine=ctx.createRadialGradient(w/2-s*.21,h/2-s*.29,s*.01,w/2-s*.05,h/2-s*.10,s*.57);
  shine.addColorStop(0,'rgba(255,255,255,.34)');shine.addColorStop(.30,'rgba(255,255,255,.10)');shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;ctx.fillRect(0,0,w,h);
  const edge=ctx.createRadialGradient(w/2,h/2,s*.26,w/2,h/2,s*.47);
  edge.addColorStop(.68,'rgba(0,55,75,0)');edge.addColorStop(1,'rgba(0,45,66,.27)');
  ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
}
function premiumDraw(){
  const canvas=document.getElementById('globe-canvas');if(!canvas)return;
  if(!canvas._cssW||!canvas._cssH){try{resizeGlobe()}catch(_){}}
  if(!canvas._cssW||!canvas._cssH)return;
  const w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h),dpr=canvas._dpr||1,ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.clip();
  ocean(ctx,w,h,s);countries(ctx,w,h,s);
  ctx.save();if(landClip(ctx,w,h))for(const t of TERRAIN)terrainPatch(ctx,w,h,s,t);ctx.restore();
  features(ctx,w,h,s);selectedHalo(ctx,w,h,s);
  if(typeof WORLD_COUNTRIES!=='undefined'&&typeof drawMasteryMarker==='function')for(const c of WORLD_COUNTRIES)drawMasteryMarker(ctx,c,w,h);
  let pulsing=false;try{if(typeof drawGlobePulse==='function')pulsing=drawGlobePulse(ctx,w,h)}catch(_){}
  finish(ctx,w,h,s);ctx.restore();

  ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.strokeStyle='rgba(246,254,255,.98)';ctx.lineWidth=Math.max(4,s*.008);ctx.stroke();
  ctx.beginPath();ctx.arc(w/2-s*.10,h/2-s*.19,s*.33,3.84,5.18);ctx.strokeStyle='rgba(255,255,255,.30)';ctx.lineWidth=Math.max(2,s*.005);ctx.stroke();
  if(pulsing)requestAnimationFrame(()=>window.drawGlobe?.());
}
function install(){
  if(window.__lariaGlobeV24Installed||typeof window.drawGlobe!=='function'||typeof window.globeProject!=='function')return false;
  const baseDraw=window.drawGlobe;window.__lariaGlobeClassicDraw=baseDraw;
  const routedDraw=function(){
    try{if(typeof globeMode==='string'&&globeMode==='classic')return baseDraw.apply(this,arguments)}catch(_){}
    return premiumDraw.apply(this,arguments);
  };
  window.drawGlobe=routedDraw;try{drawGlobe=routedDraw}catch(_){}
  window.__lariaGlobeV24Installed=true;screen.dataset.globeVersion='24';
  requestAnimationFrame(()=>{try{resizeGlobe();routedDraw()}catch(_){}});
  return true;
}
function seed(){
  try{
    if(!globeSelected&&typeof WORLD_COUNTRIES!=='undefined'&&typeof selectGlobeCountry==='function'){
      const c=WORLD_COUNTRIES.find(x=>x?.name==='Tsjad');if(c)selectGlobeCountry(c.id);
    }
  }catch(_){}
}
let tries=0;const boot=setInterval(()=>{tries++;if(install()){clearInterval(boot);seed()}else if(tries>80)clearInterval(boot)},50);
new MutationObserver(()=>{
  if(screen.classList.contains('active')){
    install();seed();requestAnimationFrame(()=>{try{resizeGlobe();premiumDraw()}catch(_){}});
  }
}).observe(screen,{attributes:true,attributeFilter:['class']});
window.addEventListener('resize',()=>{if(screen.classList.contains('active'))requestAnimationFrame(()=>{try{resizeGlobe();premiumDraw()}catch(_){}})});
})();