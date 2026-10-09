/* Læria Atlas Perspective v1.
 * A truthful, pan-and-zoom geographical map using the same country polygons,
 * IDs and persistent progress as the existing globe. Classic globe untouched. */
(()=>{'use strict';
const screen=document.getElementById('world-screen');
const wrap=screen?.querySelector('.globe-wrap');
if(!screen||!wrap)return;
const RAD=Math.PI/180, MAX_ZOOM=11, MIN_ZOOM=1;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const limitLon=n=>((n+540)%360)-180;
const REGIONS=[
 {id:'world',label:'Hele verden',lon:12,lat:10,zoom:1.10},
 {id:'norden',label:'Norden',lon:15,lat:63,zoom:6.2},
 {id:'europe',label:'Europa',lon:15,lat:52,zoom:4.0},
 {id:'africa',label:'Afrika',lon:19,lat:1,zoom:3.0},
 {id:'asia',label:'Asia',lon:95,lat:37,zoom:2.25},
 {id:'north-america',label:'Nord-Amerika',lon:-104,lat:44,zoom:2.9},
 {id:'south-america',label:'Sør-Amerika',lon:-60,lat:-20,zoom:3.1},
 {id:'oceania',label:'Oseania',lon:151,lat:-24,zoom:3.1}
];
const CONTINENT_TINT={
 'Europa':'#528ACA','Asia':'#DDB457','Afrika':'#DD926C',
 'Nord-Amerika':'#6BA984','Sør-Amerika':'#5FAF84','Oseania':'#A293C6'
};
const map={lon:18,lat:15,zoom:3.5,region:'africa',mode:'explore'};
let canvas,ctx,nav,caption,installed=false,renderPending=false,layoutPending=false;
let dragDistance=0,hadMulti=false,pinch=null,silentSelection=false,modeSwitching=false,gesture=false;
const pointers=new Map();
const geometry=()=>typeof WORLD_COUNTRIES!=='undefined'?WORLD_COUNTRIES:[];
const isAtlas=()=>screen.classList.contains('active')&&screen.classList.contains('atlas-perspective-on');
function size(){const w=canvas?.clientWidth||360,h=canvas?.clientHeight||320;return {w,h,scale:Math.min(w/350,h/185)*map.zoom}}
function screenPoint(lon,lat,g=size()){
 const d=limitLon(lon-map.lon);
 return {x:g.w/2+d*g.scale,y:g.h/2+(map.lat-lat)*g.scale};
}
function geoAt(x,y,g=size()){
 return {lon:limitLon(map.lon+(x-g.w/2)/g.scale),lat:clamp(map.lat-(y-g.h/2)/g.scale,-85,85)};
}
/* All relief and story details are anchored in geographic coordinates. */
const atlasMix=(a,b,t)=>{
 const aa=parseInt(a.slice(1),16),bb=parseInt(b.slice(1),16);
 const lerp=(x,y)=>Math.round(x+(y-x)*t);
 return '#'+[16,8,0].map(shift=>lerp((aa>>shift)&255,(bb>>shift)&255).toString(16).padStart(2,'0')).join('');
};
function paintStoryAtlas(g,list){
 const art=window.LariaGlobeArtV24;
 if(!art||map.zoom<1.6)return;
 if(!gesture&&map.zoom>2){
  ctx.save();ctx.beginPath();
  for(const c of list)if(c.geometry)makePath(c,g);
  ctx.clip('evenodd');
  const biomeColors={forest:'#398451',desert:'#F9D495',savanna:'#BDB66D',snow:'#F5FFFF'};
  for(const t of art.TERRAIN||[]){
   const p=screenPoint(t[1],t[2],g),type=t[0];
   if(p.x<-180||p.x>g.w+180||p.y<-130||p.y>g.h+130)continue;
   const rad=clamp(g.scale*9*t[3],18,145);
   const gradient=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rad);
   gradient.addColorStop(0,atlasMix(biomeColors[type]||'#C5D69D','#FFFFFF',.20)+'99');
   gradient.addColorStop(.48,(biomeColors[type]||'#C5D69D')+'55');
   gradient.addColorStop(1,(biomeColors[type]||'#C5D69D')+'00');
   ctx.beginPath();ctx.ellipse(p.x,p.y,rad,rad*.79,0,0,Math.PI*2);
   ctx.fillStyle=gradient;ctx.fill();
  }
  ctx.restore();
 }
 /* Keep illustrational landmarks tied to their true geographic coordinates. */
 if(map.zoom<2.5)return;
 const kbase=clamp(19+map.zoom*2.2,23,42)*(g.w>700?1.12:1);
 for(const f of art.FEATURES||[]){
  const fn=art.draw?.[f[0]];if(typeof fn!=='function')continue;
  const p=screenPoint(f[1],f[2],g);
  if(p.x<13||p.x>g.w-20||p.y<65||p.y>g.h-20)continue;
  const k=kbase*f[3];
  ctx.save();ctx.globalAlpha=map.zoom<3.2?.76:.91;
  fn(ctx,p.x,p.y,k,f[4]);ctx.restore();
 }
}
function paintMapLabels(g,list,selected){
 if(map.zoom<3.3)return;
 const font=g.w>650?13:11;
 ctx.save();ctx.font='750 '+font+'px system-ui,-apple-system,sans-serif';
 ctx.textBaseline='middle';ctx.textAlign='center';
 const used=[];
 const sorted=list.filter(c=>c.geometry&&Number.isFinite(c.lon)&&Number.isFinite(c.lat)&&c.id!==selected)
  .sort((a,b)=>(typeof geometrySpan==='function'?geometrySpan(b)-geometrySpan(a):0));
 for(const c of sorted){
  if(typeof geometrySpan==='function'&&geometrySpan(c)<7.5)continue;
  const p=screenPoint(c.lon,c.lat,g);
  if(p.x<24||p.x>g.w-63||p.y<78||p.y>g.h-31)continue;
  const text=String(c.name||'');if(!text||text.length>16)continue;
  const width=ctx.measureText(text).width+13;
  if(used.some(r=>Math.abs(r.x-p.x)<(r.w+width)/2+7&&Math.abs(r.y-p.y)<23))continue;
  used.push({x:p.x,y:p.y,w:width});
  ctx.strokeStyle='rgba(255,251,231,.87)';ctx.lineWidth=3.5;ctx.lineJoin='round';
  ctx.strokeText(text,p.x,p.y);ctx.fillStyle='rgba(47,68,75,.91)';ctx.fillText(text,p.x,p.y);
  if(used.length>=17)break;
 }
 ctx.restore();
}
function colorFor(c){
 let fill=CONTINENT_TINT[c.continent]||'#ADC6A0';
 if(map.mode==='mine'&&typeof countryStatus==='function'){
  const st=countryStatus(c.id);
  if(st==='mastered')fill='#E9C66E';
  else if(st==='known')fill='#8CBC9A';
  else if(st==='learning')fill='#E9BE89';
  else if(st==='seen')fill='#C8CEC5';
  else fill='#E1DFD0';
 }
 return fill;
}
function makePath(country,g){
 const geo=country?._detailGeometry||country?.geometry;
 if(!geo||typeof geometryPolygons!=='function')return false;
 let used=false;
 for(const polygon of geometryPolygons(geo)){
  for(const ring of polygon){
   if(!ring||ring.length<3)continue;
   const step=gesture?Math.max(1,Math.floor(ring.length/350)):Math.max(1,Math.floor(ring.length/1000));
   let lastLon=null,first=null,prevX=null,started=false;
   const points=[];
   for(let i=0;i<ring.length;i+=step)points.push(ring[i]);
   if(step>1)points.push(ring[ring.length-1]);
   for(const pt of points){
    if(!pt||!Number.isFinite(pt[0])||!Number.isFinite(pt[1]))continue;
    const lon=lastLon===null?pt[0]:pt[0]+360*Math.round((lastLon-pt[0])/360);
    if(lastLon===null){
     const initialX=g.w/2+limitLon(lon-map.lon)*g.scale;
     const correction=Math.round((initialX-(g.w/2+(lon-map.lon)*g.scale))/(360*g.scale));
     const delta=correction*360;
     lastLon=lon+delta;first={x:g.w/2+(lastLon-map.lon)*g.scale,y:g.h/2+(map.lat-pt[1])*g.scale};
     ctx.moveTo(first.x,first.y);prevX=first.x;started=true;used=true;
    }else{
     lastLon=lon;
     const x=g.w/2+(lon-map.lon)*g.scale, y=g.h/2+(map.lat-pt[1])*g.scale;
     if(Math.abs(x-prevX)>g.w+360*g.scale*.2){started=false;ctx.moveTo(x,y)}else ctx.lineTo(x,y);
     prevX=x;used=true;
    }
   }
   if(started)ctx.closePath();
  }
 }
 return used;
}
function draw(){
 if(!isAtlas()||!canvas)return;
 const g=size(),dpr=Math.min(2,window.devicePixelRatio||1);
 if(canvas.width!==Math.round(g.w*dpr)||canvas.height!==Math.round(g.h*dpr)){
  canvas.width=Math.round(g.w*dpr);canvas.height=Math.round(g.h*dpr);
 }
 ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,g.w,g.h);
 const sea=ctx.createLinearGradient(0,0,0,g.h);
 sea.addColorStop(0,'#C4EDF0');sea.addColorStop(.54,'#91CDD9');sea.addColorStop(1,'#5CA7BC');
 ctx.fillStyle=sea;ctx.fillRect(0,0,g.w,g.h);
 /* Restrained painted sea glints. Longitude positions move with the map. */
 ctx.save();ctx.lineWidth=1.9;ctx.strokeStyle='rgba(247,255,248,.29)';
 for(const pos of [[-28,23],[-33,-27],[57,-24],[125,-26],[-117,23],[-140,-38],[42,35],[161,1]]){
  const p=screenPoint(pos[0],pos[1],g),r=clamp(g.scale*8,18,45);
  if(p.x<0||p.x>g.w||p.y<0||p.y>g.h)continue;
  ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.26,-.08,.08*Math.PI,.88*Math.PI);ctx.stroke();
  ctx.beginPath();ctx.ellipse(p.x+r*.20,p.y+r*.32,r*.57,r*.14,.04,.14*Math.PI,.76*Math.PI);ctx.stroke();
 }
 ctx.restore();
 ctx.save();
 ctx.beginPath();ctx.rect(0,0,g.w,g.h);ctx.clip();
 ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=1;
 for(let lat=-75;lat<=75;lat+=15){
  const y=screenPoint(map.lon,lat,g).y;
  if(y>-20&&y<g.h+20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(g.w,y);ctx.stroke()}
 }
 for(let lon=-180;lon<=180;lon+=20){
  const x=screenPoint(lon,map.lat,g).x;
  if(x>=0&&x<=g.w){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,g.h);ctx.stroke()}
 }
 const list=geometry();
 const selected=typeof globeSelected!=='undefined'?globeSelected:null;
 for(const country of list){
  if(!country?.geometry)continue;
  ctx.beginPath();
  if(!makePath(country,g))continue;
  const base=colorFor(country);
  const land=ctx.createLinearGradient(g.w*.18,g.h*.08,g.w*.76,g.h*.92);
  land.addColorStop(0,atlasMix(base,'#FFF6D9',.19));
  land.addColorStop(.52,base);
  land.addColorStop(1,atlasMix(base,'#426B68',.13));
  ctx.fillStyle=land;ctx.fill('evenodd');
  ctx.strokeStyle='rgba(255,252,236,.72)';
  ctx.lineWidth=clamp(g.scale*.075,.52,1.6);
  ctx.stroke();
 }
 paintStoryAtlas(g,list);
 paintMapLabels(g,list,selected);
 for(const c of list){
  const hasTiny=typeof isTinyCountry==='function'?isTinyCountry(c):!c.geometry;
  if(!hasTiny||map.zoom<2.5||!Number.isFinite(c.lon)||!Number.isFinite(c.lat))continue;
  const p=screenPoint(c.lon,c.lat,g);
  if(p.x<5||p.x>g.w-5||p.y<5||p.y>g.h-5)continue;
  ctx.beginPath();ctx.arc(p.x,p.y,Math.min(5.1,2.5+map.zoom*.18),0,2*Math.PI);
  ctx.fillStyle='#FFF5D8';ctx.fill();ctx.strokeStyle='#597F84';ctx.lineWidth=1;ctx.stroke();
 }
 if(selected&&typeof countries!=='undefined'&&countries[selected]){
  const c=countries[selected];
  ctx.beginPath();if(makePath(c,g)){
   ctx.fillStyle='rgba(255,203,84,.87)';ctx.fill('evenodd');
   ctx.strokeStyle='#FFFDF1';ctx.lineWidth=2.6;ctx.stroke();
  }
  if(Number.isFinite(c.lon)&&Number.isFinite(c.lat)){
   const p=screenPoint(c.lon,c.lat,g);
   if(p.x>=0&&p.y>=0&&p.x<=g.w&&p.y<=g.h){
    ctx.beginPath();ctx.arc(p.x,p.y,6.5,0,2*Math.PI);
    ctx.fillStyle='#F8C653';ctx.fill();ctx.strokeStyle='#FFFFFF';ctx.lineWidth=2.5;ctx.stroke();
   }
  }
 }
 ctx.restore();
 canvas.dataset.renderSource='country-geometry';
 canvas.dataset.mapReady='true';
}
function queueDraw(){
 if(renderPending)return;
 renderPending=true;requestAnimationFrame(()=>{renderPending=false;draw()});
}
function layout(){
 if(!isAtlas())return;
 const modeRect=document.getElementById('globe-mode')?.getBoundingClientRect();
 const cardRect=document.getElementById('globe-status')?.getBoundingClientRect();
 const vw=window.innerWidth,vh=window.innerHeight;
 const modeBottom=modeRect?.bottom||185;
 screen.style.setProperty('--atlas-legend-top',(modeBottom+9)+'px');
 const legend=document.getElementById('globe-legend');
 const legendRect=map.mode==='mine'&&legend?.classList.contains('show')?legend.getBoundingClientRect():null;
 const top=Math.max(110,modeBottom+14,legendRect?.height?legendRect.bottom+11:0);
 const bottom=Math.min(vh-104,(cardRect?.top||vh-164)-14);
 const h=Math.max(185,bottom-top);
 const w=Math.min(vw-24,vw>=1100?1080:vw>=700?850:vw-24);
 screen.style.setProperty('--atlas-top',top+'px');
 screen.style.setProperty('--atlas-height',h+'px');
 screen.style.setProperty('--atlas-width',w+'px');
 queueDraw();
}
function queueLayout(){
 if(layoutPending)return;layoutPending=true;
 requestAnimationFrame(()=>{layoutPending=false;layout()});
}
function zoomTo(next,x,y){
 const g=size(),px=Number.isFinite(x)?x:g.w/2,py=Number.isFinite(y)?y:g.h/2;
 const anchor=geoAt(px,py,g);
 map.zoom=clamp(next,MIN_ZOOM,MAX_ZOOM);
 const updated=size();
 map.lon=limitLon(anchor.lon-(px-updated.w/2)/updated.scale);
 map.lat=clamp(anchor.lat+(py-updated.h/2)/updated.scale,-74,74);
 queueDraw();
}
function goRegion(id){
 const r=REGIONS.find(x=>x.id===id);if(!r)return;
 Object.assign(map,{lon:r.lon,lat:r.lat,zoom:r.zoom,region:r.id});
 nav?.querySelectorAll('button').forEach(b=>{const active=b.dataset.atlasRegion===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 queueDraw();
}
function focus(id){
 const c=typeof countries!=='undefined'?countries[id]:null;
 if(!c||!Number.isFinite(c.lon)||!Number.isFinite(c.lat))return;
 map.lon=limitLon(c.lon);map.lat=clamp(c.lat,-74,74);
 map.zoom=clamp(typeof countryFocusZoom==='function'?countryFocusZoom(c)*1.55:5.2,2.8,8.7);
 map.region='';
 nav?.querySelectorAll('button').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});
 queueDraw();
}
function local(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
function distance(){const a=[...pointers.values()];return a.length<2?0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}
function midpoint(){const a=[...pointers.values()];return {x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}}
function pickAt(p){
 const ll=geoAt(p.x,p.y);
 const hits=geometry().filter(c=>{
  if(!c.geometry||typeof pointInCountry!=='function')return false;
  const geo=c._detailGeometry||c.geometry;
  return pointInCountry({...c,geometry:geo},ll.lon,ll.lat);
 });
 let country=hits.length?hits[0]:null;
 if(!country&&map.zoom>=2.4){
  let nearest=null,dist=Infinity;
  for(const c of geometry()){
   if(!Number.isFinite(c.lon)||!Number.isFinite(c.lat))continue;
   if(typeof isTinyCountry==='function'&&!isTinyCountry(c))continue;
   const q=screenPoint(c.lon,c.lat),d=Math.hypot(q.x-p.x,q.y-p.y);
   if(d<dist){dist=d;nearest=c}
  }
  if(dist<=20)country=nearest;
 }
 if(country&&typeof window.selectGlobeCountry==='function'){
  silentSelection=true;
  try{window.selectGlobeCountry(country.id)}finally{silentSelection=false}
  queueDraw();
 }
}
function wireGestures(){
 canvas.addEventListener('pointerdown',e=>{
  e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=local(e);
  pointers.set(e.pointerId,p);dragDistance=0;gesture=true;
  if(pointers.size===2){
   hadMulti=true;
   const mid=midpoint();pinch={distance:distance(),zoom:map.zoom,anchor:geoAt(mid.x,mid.y)};
  }else if(pointers.size===1){hadMulti=false;pinch=null}
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  const last=pointers.get(e.pointerId),p=local(e);
  pointers.set(e.pointerId,p);
  if(pointers.size>=2&&pinch){
   const mid=midpoint();
   map.zoom=clamp(pinch.zoom*distance()/Math.max(10,pinch.distance),MIN_ZOOM,MAX_ZOOM);
   const g=size();
   map.lon=limitLon(pinch.anchor.lon-(mid.x-g.w/2)/g.scale);
   map.lat=clamp(pinch.anchor.lat+(mid.y-g.h/2)/g.scale,-74,74);
   dragDistance=999;queueDraw();return;
  }
  if(pointers.size!==1)return;
  const g=size(),dx=p.x-last.x,dy=p.y-last.y;
  map.lon=limitLon(map.lon-dx/g.scale);map.lat=clamp(map.lat+dy/g.scale,-74,74);
  dragDistance+=Math.hypot(dx,dy);queueDraw();
 },{passive:true});
 const end=e=>{
  if(!pointers.has(e.pointerId))return;
  const p=local(e),tap=pointers.size===1&&!hadMulti&&dragDistance<8;
  pointers.delete(e.pointerId);
  if(pointers.size<2)pinch=null;
  if(pointers.size===1)hadMulti=true;
  if(!pointers.size){gesture=false;hadMulti=false}
  if(tap)pickAt(p);
  queueDraw();
 };
 canvas.addEventListener('pointerup',end);
 canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pinch=null;gesture=false;hadMulti=true;queueDraw()});
 canvas.addEventListener('wheel',e=>{if(!isAtlas())return;e.preventDefault();const p=local(e);zoomTo(map.zoom*(e.deltaY<0?1.14:1/1.14),p.x,p.y)},{passive:false});
}
function sync(mode){
 map.mode=mode==='mine'?'mine':'explore';
 const atlas=mode!=='classic';
 screen.classList.toggle('atlas-perspective-on',atlas);
 screen.dataset.mapPerspective=atlas?'atlas':'globe';
 if(nav)nav.hidden=!atlas;
 if(caption)caption.hidden=!atlas;
 const heading=screen.querySelector('.premium-globe-title');
 if(heading)heading.textContent=atlas?'Kartet':'Kloden';
 const hint=screen.querySelector('.globe-hint');
 if(hint)hint.textContent=atlas?'Dra i kartet · knip for zoom · trykk på et land':'Dra for å snurre · knip for zoom';
 if(atlas){queueLayout();if(screen.classList.contains('active')&&typeof loadQualityData==='function'&&!window.__lariaAtlasDetailsRequested){
  // Heavy Natural Earth / World Bank enrichment must not delay Home -> Atlas.
  window.__lariaAtlasDetailsRequested=true;
  setTimeout(()=>{
   if(!screen.classList.contains('active'))return;
   Promise.resolve().then(()=>loadQualityData()).then(queueDraw).catch(()=>{});
  },3500);
 }}
}
function install(){
 if(installed||!window.__lariaGlobeV25Installed||typeof window.setGlobeMode!=='function')return false;
 installed=true;
 canvas=document.createElement('canvas');
 canvas.id='atlas-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Interaktivt verdensatlas. Dra, zoom og trykk på et land.');
 canvas.dataset.mapReady='false';
 wrap.insertBefore(canvas,wrap.firstChild);
 nav=document.createElement('div');nav.className='atlas-region-nav';nav.setAttribute('role','group');nav.setAttribute('aria-label','Velg område på kartet');
 nav.innerHTML=REGIONS.map(r=>'<button type="button" data-atlas-region="'+r.id+'" aria-pressed="'+(r.id===map.region)+'" class="'+(r.id===map.region?'active':'')+'">'+r.label+'</button>').join('');
 wrap.appendChild(nav);
 caption=document.createElement('div');caption.className='atlas-caption';caption.textContent='LÆRIAS VERDENSATLAS · UTFORSK I DITT TEMPO';wrap.appendChild(caption);
 nav.addEventListener('click',e=>{const b=e.target.closest('button[data-atlas-region]');if(b)goRegion(b.dataset.atlasRegion)});
 wireGestures();
 const previousMode=window.setGlobeMode;
 const routedMode=function(mode){modeSwitching=true;let result;try{result=previousMode.apply(this,arguments)}finally{modeSwitching=false}sync(mode);return result};
 window.setGlobeMode=routedMode;
 try{setGlobeMode=routedMode}catch(_){}
 document.querySelectorAll('#globe-mode [data-globe-mode]').forEach(btn=>{btn.onclick=()=>routedMode(btn.dataset.globeMode)});
 const previousSelect=window.selectGlobeCountry;
 const routedSelect=function(id){const result=previousSelect.apply(this,arguments);if(!silentSelection&&!modeSwitching&&isAtlas())focus(id);if(isAtlas()){queueLayout();queueDraw()}return result};
 window.selectGlobeCountry=routedSelect;
 try{selectGlobeCountry=routedSelect}catch(_){}
 const zin=document.getElementById('globe-zoom-in'),zout=document.getElementById('globe-zoom-out'),reset=document.getElementById('reset-globe');
 if(zin){const old=zin.onclick;zin.onclick=function(){if(isAtlas())zoomTo(map.zoom*1.34);else old?.apply(this,arguments)}}
 if(zout){const old=zout.onclick;zout.onclick=function(){if(isAtlas())zoomTo(map.zoom/1.34);else old?.apply(this,arguments)}}
 if(reset){const old=reset.onclick;reset.onclick=function(){if(isAtlas()){goRegion('africa');return}return old?.apply(this,arguments)}}
 window.addEventListener('resize',queueLayout);
 window.addEventListener('orientationchange',queueLayout);
 if(typeof ResizeObserver!=='undefined'){
  const ro=new ResizeObserver(queueLayout);
  const card=document.getElementById('globe-status'),mode=document.getElementById('globe-mode');
  if(card)ro.observe(card);if(mode)ro.observe(mode);
 }
 const observer=new MutationObserver(()=>{if(screen.classList.contains('active')){sync(typeof globeMode==='string'?globeMode:'explore')}});
 observer.observe(screen,{attributes:true,attributeFilter:['class']});
 window.LARIA_ATLAS_PERSPECTIVE={
  snapshot:()=>({...map,active:isAtlas(),source:canvas.dataset.renderSource||null}),
  project:(lon,lat)=>screenPoint(lon,lat),inverse:(x,y)=>geoAt(x,y),
  region:goRegion,zoom:zoomTo
 };
 sync(typeof globeMode==='string'?globeMode:'explore');
 queueLayout();
 return true;
}
let tries=0;
const timer=setInterval(()=>{tries++;if(install()||tries>=160)clearInterval(timer)},35);
})();
