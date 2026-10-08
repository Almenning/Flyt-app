(()=>{'use strict';
const screen=document.getElementById('world-screen');if(!screen)return;screen.classList.add('globe-v22');
const ART=window.LariaGlobeArtV22;if(!ART)return;
const {clamp,TERRAIN,FEATURES,draw}=ART;
const PALETTE={'Europa':'#4778DB','Asia':'#E7B340','Afrika':'#EA7758','Nord-Amerika':'#4EAA67','Sør-Amerika':'#3F9F67','Oseania':'#8876CB'};
const mix=(a,b,t)=>{const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),m=(x,y)=>Math.round(x+(y-x)*t);return '#'+[m((pa>>16)&255,(pb>>16)&255),m((pa>>8)&255,(pb>>8)&255),m(pa&255,pb&255)].map(v=>v.toString(16).padStart(2,'0')).join('')};
const project=(lon,lat,w,h)=>typeof globeProject==='function'?globeProject(lon,lat,w,h):null;
function addPath(ctx,c,w,h){if(!c.geometry||typeof geometryPolygons!=='function'||typeof drawProjectedLine!=='function')return false;for(const poly of geometryPolygons(c.geometry))for(const ring of poly)drawProjectedLine(ctx,ring,w,h);return true}
function countryBase(c){let base=PALETTE[c.continent]||'#78A47B';if(typeof globeMode==='string'&&globeMode==='mine'&&typeof countryStatus==='function'){const st=countryStatus(c.id);if(st==='new')base=mix(base,'#EEE9DC',.60);else if(st==='seen')base=mix(base,'#E8E3D5',.43);else if(st==='learning')base=mix(base,'#F1E6C9',.27);else if(st==='known')base=mix(base,'#FFF3D1',.10)}return base}
function ocean(ctx,w,h,s){
  const g=ctx.createRadialGradient(w/2-s*.20,h/2-s*.25,s*.02,w/2+s*.06,h/2+s*.08,s*.62);g.addColorStop(0,'#72E2F4');g.addColorStop(.30,'#21C6E8');g.addColorStop(.68,'#069ECC');g.addColorStop(1,'#087BA8');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(226,252,255,.22)';ctx.lineWidth=Math.max(.6,s*.00135);
  if(typeof drawProjectedLine==='function'){for(const lat of [-60,-30,0,30,60]){ctx.beginPath();const pts=[];for(let lon=-180;lon<=180;lon+=4)pts.push([lon,lat]);drawProjectedLine(ctx,pts,w,h);ctx.stroke()}for(let lon=-180;lon<180;lon+=30){ctx.beginPath();const pts=[];for(let lat=-85;lat<=85;lat+=4)pts.push([lon,lat]);drawProjectedLine(ctx,pts,w,h);ctx.stroke()}}
}
function countries(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  for(const c of WORLD_COUNTRIES){if(!c.geometry)continue;ctx.beginPath();if(!addPath(ctx,c,w,h))continue;const base=countryBase(c),selected=c.id===globeSelected,g=ctx.createLinearGradient(w*.30,h*.18,w*.70,h*.84);if(selected){g.addColorStop(0,'#FFE991');g.addColorStop(.5,'#FFD45C');g.addColorStop(1,'#E6B23B')}else{g.addColorStop(0,mix(base,'#FFF3CC',.18));g.addColorStop(.54,base);g.addColorStop(1,mix(base,'#425E4D',.13))}ctx.save();ctx.shadowColor='rgba(30,62,56,.22)';ctx.shadowBlur=Math.max(1.5,s*.004);ctx.shadowOffsetY=Math.max(.5,s*.0016);ctx.fillStyle=g;ctx.fill();ctx.restore();ctx.strokeStyle='rgba(255,246,215,.92)';ctx.lineWidth=globeZoom>2?1.15:Math.max(.82,s*.00155);ctx.stroke()}
  for(const c of WORLD_COUNTRIES){let tiny=false;try{tiny=typeof isTinyCountry==='function'&&isTinyCountry(c)}catch(_){}if(!tiny&&c.id!==globeSelected)continue;const p=project(c.lon,c.lat,w,h);if(!p)continue;const rr=c.id===globeSelected?Math.max(5.5,s*.010):Math.max(2.2,s*.0041);ctx.beginPath();ctx.arc(p[0],p[1],rr,0,Math.PI*2);ctx.fillStyle=c.id===globeSelected?'#FFD45C':'#FFF3A9';ctx.fill();ctx.strokeStyle='rgba(91,72,42,.28)';ctx.lineWidth=1;ctx.stroke()}
}
function landClip(ctx,w,h){if(typeof WORLD_COUNTRIES==='undefined')return false;ctx.beginPath();for(const c of WORLD_COUNTRIES)if(c.geometry)addPath(ctx,c,w,h);ctx.clip();return true}
function patch(ctx,w,h,s,t){
  const p=project(t[1],t[2],w,h);if(!p||p[2]<.08)return;const k=t[3]*clamp(p[2]+.20,.58,1.14);ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(-.16);let color='rgba(31,119,62,.25)',rad=.07;if(t[0]==='desert'){color='rgba(250,203,93,.31)';rad=.075}else if(t[0]==='savanna'){color='rgba(143,151,57,.20)';rad=.064}else if(t[0]==='snow'){color='rgba(255,255,245,.34)';rad=.066}const g=ctx.createRadialGradient(0,0,1,0,0,s*rad*k);g.addColorStop(0,color);g.addColorStop(1,color.replace(/\.[0-9]+\)$/,'0)'));ctx.fillStyle=g;ctx.scale(1,.58);ctx.beginPath();ctx.arc(0,0,s*rad*k,0,Math.PI*2);ctx.fill();ctx.restore()
}
function features(ctx,w,h,s){
  const alpha=clamp(1.48-globeZoom*.30,.20,1);if(alpha<=.22)return;ctx.save();ctx.globalAlpha=alpha;
  for(const f of FEATURES){const p=project(f[1],f[2],w,h);if(!p||p[2]<.08)continue;const k=Math.max(8,s*.025)*f[3]*clamp(p[2]+.19,.58,1.14)*clamp(Math.pow(globeZoom,.16),1,1.28);const fn=draw[f[0]];if(fn)fn(ctx,p[0],p[1],k,!!f[4])}
  ctx.restore();
}
function finish(ctx,w,h,s){
  const shine=ctx.createRadialGradient(w/2-s*.20,h/2-s*.28,s*.01,w/2-s*.05,h/2-s*.10,s*.56);shine.addColorStop(0,'rgba(255,255,255,.30)');shine.addColorStop(.30,'rgba(255,255,255,.09)');shine.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=shine;ctx.fillRect(0,0,w,h);
  const edge=ctx.createRadialGradient(w/2,h/2,s*.26,w/2,h/2,s*.47);edge.addColorStop(.70,'rgba(0,55,75,0)');edge.addColorStop(1,'rgba(0,48,69,.24)');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
}
function premiumDraw(){
  const canvas=document.getElementById('globe-canvas');if(!canvas)return;if(!canvas._cssW||!canvas._cssH){try{resizeGlobe()}catch(_){}}if(!canvas._cssW||!canvas._cssH)return;
  const w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h),dpr=canvas._dpr||1,ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.clip();
  ocean(ctx,w,h,s);countries(ctx,w,h,s);ctx.save();if(landClip(ctx,w,h))for(const t of TERRAIN)patch(ctx,w,h,s,t);ctx.restore();features(ctx,w,h,s);
  if(typeof WORLD_COUNTRIES!=='undefined'&&typeof drawMasteryMarker==='function')for(const c of WORLD_COUNTRIES)drawMasteryMarker(ctx,c,w,h);
  let pulsing=false;try{if(typeof drawGlobePulse==='function')pulsing=drawGlobePulse(ctx,w,h)}catch(_){}finish(ctx,w,h,s);ctx.restore();
  ctx.beginPath();ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);ctx.strokeStyle='rgba(245,254,255,.98)';ctx.lineWidth=Math.max(4,s*.008);ctx.stroke();
  ctx.beginPath();ctx.arc(w/2-s*.10,h/2-s*.19,s*.33,3.84,5.18);ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=Math.max(2,s*.005);ctx.stroke();
  if(pulsing)requestAnimationFrame(()=>window.drawGlobe?.());
}
function install(){if(window.__lariaGlobeV22Installed||typeof window.drawGlobe!=='function'||typeof window.globeProject!=='function')return false;const baseDraw=window.drawGlobe;window.__lariaGlobeClassicDraw=baseDraw;const routedDraw=function(){try{if(typeof globeMode==='string'&&globeMode==='classic')return baseDraw.apply(this,arguments)}catch(_){}return premiumDraw.apply(this,arguments)};window.drawGlobe=routedDraw;try{drawGlobe=routedDraw}catch(_){}window.__lariaGlobeV22Installed=true;screen.dataset.globeVersion='23';requestAnimationFrame(()=>{try{resizeGlobe();routedDraw()}catch(_){}});return true}
function seed(){try{if(!globeSelected&&typeof WORLD_COUNTRIES!=='undefined'&&typeof selectGlobeCountry==='function'){const c=WORLD_COUNTRIES.find(x=>x?.name==='Tsjad');if(c)selectGlobeCountry(c.id)}}catch(_){}}
let tries=0;const boot=setInterval(()=>{tries++;if(install()){clearInterval(boot);seed()}else if(tries>80)clearInterval(boot)},50);
new MutationObserver(()=>{if(screen.classList.contains('active')){install();seed();requestAnimationFrame(()=>{try{resizeGlobe();premiumDraw()}catch(_){}})}}).observe(screen,{attributes:true,attributeFilter:['class']});
window.addEventListener('resize',()=>{if(screen.classList.contains('active'))requestAnimationFrame(()=>{try{resizeGlobe();premiumDraw()}catch(_){}})});
})();