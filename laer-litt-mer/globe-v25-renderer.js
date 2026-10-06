(()=>{'use strict';
const screen=document.getElementById('world-screen');if(!screen)return;screen.classList.add('globe-v27');
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

const compassSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15.8 8.2l-2.3 5.3-5.3 2.3 2.3-5.3 5.3-2.3z" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="#fff"/></svg>';
const globeSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/></svg>';
const bookSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.4c2.7-.7 5.2-.2 8 1.5v12c-2.8-1.7-5.3-2.2-8-1.5v-12zm16 0c-2.7-.7-5.2-.2-8 1.5v12c2.8-1.7 5.3-2.2 8-1.5v-12z" fill="currentColor"/><path d="M12 6.9v12" stroke="#fff" stroke-opacity=".55" stroke-width="1"/></svg>';

function ensurePremiumShell(){
  let header=screen.querySelector('.premium-globe-header');
  if(!header){
    header=document.createElement('div');
    header.className='premium-globe-header';
    header.setAttribute('aria-hidden','true');
    header.innerHTML='<div class="premium-globe-kicker">VERDEN OG MENNESKER</div><div class="premium-globe-title">Kloden</div><div class="premium-globe-subtitle" data-premium-globe-subtitle>Utforsk land, folk, dyr og spennende steder fra hele verden!</div><img class="premium-globe-fox" src="./lia-fox-explorer-home.webp" alt="">';
    screen.prepend(header);
  }

  const wrap=screen.querySelector('.globe-wrap');
  if(wrap){
    let ring=wrap.querySelector('.premium-globe-ring');
    if(!ring){ring=document.createElement('i');ring.className='premium-globe-ring';ring.setAttribute('aria-hidden','true');wrap.appendChild(ring)}
    for(const side of ['left','right']){
      let knob=wrap.querySelector('.premium-globe-knob.'+side);
      if(!knob){knob=document.createElement('i');knob.className='premium-globe-knob '+side;knob.setAttribute('aria-hidden','true');wrap.appendChild(knob)}
    }
  }

  const bar=document.getElementById('globe-mode');
  if(bar){
    let classic=bar.querySelector('[data-globe-mode="classic"]');
    if(!classic){
      classic=document.createElement('button');
      classic.type='button';
      classic.dataset.globeMode='classic';
      classic.setAttribute('aria-label','Åpne klassisk interaktiv klode');
      bar.appendChild(classic);
    }
    const explore=bar.querySelector('[data-globe-mode="explore"]');
    const mine=bar.querySelector('[data-globe-mode="mine"]');
    if(explore)explore.innerHTML='<span class="pg-mode-icon">'+compassSvg+'</span>Utforsk';
    if(mine)mine.innerHTML='<span class="pg-mode-icon">'+globeSvg+'</span>Min verden';
    classic.innerHTML='<span class="pg-mode-icon" aria-hidden="true">◎</span>Kloden';
  }

  const back=document.getElementById('world-back');
  if(back){back.textContent='←';back.setAttribute('aria-label','Tilbake til Utforsk')}
}

function syncPremiumChrome(mode){
  const next=mode==='classic'?'classic':(mode==='mine'?'mine':'explore');
  screen.dataset.premiumGlobeMode=next;
  screen.dataset.globeVersion='27';
  document.querySelectorAll('#globe-mode [data-globe-mode]').forEach(b=>b.classList.toggle('active',b.dataset.globeMode===next));
  document.getElementById('globe-legend')?.classList.toggle('show',next==='mine');

  const sub=screen.querySelector('[data-premium-globe-subtitle]');
  if(sub)sub.textContent=next==='mine'
    ?'Min verden – se landene du har oppdaget og lært om!'
    :next==='classic'
      ?'Den klassiske snurrbare kloden – dra, zoom og finn land.'
      :'Utforsk land, folk, dyr og spennende steder fra hele verden!';

  const canvas=document.getElementById('globe-canvas');
  if(canvas)canvas.setAttribute('aria-label',next==='mine'
    ?'Min verden på interaktiv klode'
    :next==='classic'
      ?'Klassisk interaktiv klode'
      :'Utforsk verden på interaktiv klode');
}

function enhanceSelectedCountryV24(id){
  const box=document.getElementById('globe-status');
  if(!box||!id||typeof countries==='undefined'||!countries[id])return;
  const c=countries[id];
  const st=typeof globeStatusInfo==='function'?globeStatusInfo(id):{key:'new',symbol:'–',label:'Ikke startet'};
  const meta=c.continent+(c.capitalDisplay?' · '+c.capitalDisplay:'')+' · trykk for å lære mer';

  box.classList.add('premium-country-selected');
  box.innerHTML='<div class="flag">'+c.flag+'</div>'+
    '<div class="globe-country-copy"><div class="globe-country-line"><strong>'+c.name+'</strong>'+
    '<span class="globe-status-badge '+st.key+'">'+st.symbol+' '+st.label+'</span></div>'+
    '<span class="globe-country-meta">'+meta+'</span></div>'+
    '<button type="button" class="premium-country-learn" aria-label="Lær mer om '+c.name+'">'+bookSvg+'<span>Lær mer</span></button>';
  box.style.cursor='pointer';
  box.onclick=()=>openDetail(id,'world');
  const btn=box.querySelector('.premium-country-learn');
  if(btn)btn.onclick=e=>{e.stopPropagation();openDetail(id,'world')};
}


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
function continentGradient(ctx,continent,w,h){
  const base=PALETTE[continent]||'#78A47B';
  const g=ctx.createLinearGradient(w*.24,h*.15,w*.77,h*.88);
  g.addColorStop(0,mix(base,'#FFF4D0',.28));
  g.addColorStop(.42,mix(base,'#FFF0C7',.08));
  g.addColorStop(.70,base);
  g.addColorStop(1,mix(base,'#365247',.19));
  return g;
}
function continentCountries(continent){
  return typeof WORLD_COUNTRIES==='undefined'?[]:WORLD_COUNTRIES.filter(c=>c.geometry&&c.continent===continent);
}
function paintContinents(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  const continents=[...new Set(WORLD_COUNTRIES.filter(c=>c.geometry).map(c=>c.continent))];

  for(const continent of continents){
    const members=continentCountries(continent);
    if(!members.length)continue;

    ctx.save();
    ctx.fillStyle=continentGradient(ctx,continent,w,h);
    ctx.strokeStyle=ctx.fillStyle;
    ctx.lineJoin='round';
    ctx.lineCap='round';
    ctx.lineWidth=Math.max(3.5,s*.007);
    ctx.shadowColor='rgba(22,54,49,.22)';
    ctx.shadowBlur=Math.max(3,s*.009);
    ctx.shadowOffsetY=Math.max(1,s*.0025);

    for(const c of members){
      ctx.beginPath();
      if(!addPath(ctx,c,w,h))continue;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  if(landClip(ctx,w,h)){
    const light=ctx.createRadialGradient(w*.36,h*.24,2,w*.48,h*.48,s*.46);
    light.addColorStop(0,'rgba(255,248,206,.22)');
    light.addColorStop(.52,'rgba(255,239,180,.05)');
    light.addColorStop(1,'rgba(42,69,54,.07)');
    ctx.fillStyle=light;
    ctx.fillRect(0,0,w,h);
  }
  ctx.restore();
}
function paintCountryBorders(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  const borderAlpha=globeZoom>2.5?.58:globeZoom>1.65?.38:.22;

  for(const c of WORLD_COUNTRIES){
    if(!c.geometry)continue;
    ctx.beginPath();
    if(!addPath(ctx,c,w,h))continue;
    const selected=c.id===globeSelected;

    if(selected){
      ctx.save();
      ctx.fillStyle='rgba(255,216,83,.68)';
      ctx.shadowColor='rgba(255,197,43,.28)';
      ctx.shadowBlur=Math.max(5,s*.010);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle='rgba(255,252,226,.98)';
      ctx.lineWidth=Math.max(1.6,s*.0028);
    }else{
      ctx.strokeStyle='rgba(255,250,229,'+borderAlpha+')';
      ctx.lineWidth=globeZoom>2.7?.9:Math.max(.4,s*.00082);
    }
    ctx.stroke();
  }
}
function landClip(ctx,w,h){
  if(typeof WORLD_COUNTRIES==='undefined')return false;ctx.beginPath();
  for(const c of WORLD_COUNTRIES)if(c.geometry)addPath(ctx,c,w,h);ctx.clip();return true;
}
function terrainPatch(ctx,w,h,s,t){
  const p=project(t[1],t[2],w,h);if(!p||p[2]<.08)return;
  const type=t[0],k=t[3]*clamp(p[2]+.20,.58,1.14);
  const r=s*(type==='desert'?.095:type==='snow'?.082:.090)*k;

  ctx.save();
  ctx.translate(p[0],p[1]);
  ctx.rotate(-.12);

  let c0='rgba(35,119,61,.30)',c1='rgba(35,119,61,.10)',blend='multiply';
  if(type==='desert'){c0='rgba(239,190,78,.40)';c1='rgba(214,151,49,.08)';blend='multiply'}
  if(type==='savanna'){c0='rgba(139,150,61,.28)';c1='rgba(120,126,49,.07)';blend='multiply'}
  if(type==='snow'){c0='rgba(255,255,244,.46)';c1='rgba(235,244,236,.10)';blend='screen'}

  ctx.globalCompositeOperation=blend;
  const g=ctx.createRadialGradient(-r*.14,-r*.12,1,0,0,r);
  g.addColorStop(0,c0);
  g.addColorStop(.62,c1);
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;
  ctx.scale(1,.58);
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.restore();

  /* Low-contrast surface marks. These are texture, not icons. */
  ctx.save();
  ctx.globalCompositeOperation=type==='snow'?'screen':'multiply';
  ctx.globalAlpha=clamp(.52-globeZoom*.055,.22,.44);

  const marks=[[-.62,-.14],[-.40,.25],[-.17,-.28],[.04,.18],[.28,-.12],[.51,.24],[.66,-.02],[-.02,.43]];
  for(let i=0;i<marks.length;i++){
    const dx=marks[i][0]*r*.68,dy=marks[i][1]*r*.42;
    const x=p[0]+dx,y=p[1]+dy,size=Math.max(1,s*.0029*k);

    if(type==='forest'){
      ctx.fillStyle=i%2?'rgba(27,93,47,.72)':'rgba(52,118,57,.66)';
      ctx.beginPath();
      ctx.moveTo(x,y-size*1.45);ctx.lineTo(x-size*.82,y+size*.80);ctx.lineTo(x+size*.82,y+size*.80);
      ctx.closePath();ctx.fill();
    }else if(type==='desert'){
      ctx.strokeStyle='rgba(150,100,35,.50)';
      ctx.lineWidth=Math.max(.65,size*.30);
      ctx.beginPath();ctx.arc(x,y,size*1.55,Math.PI*1.05,Math.PI*1.88);ctx.stroke();
    }else if(type==='savanna'){
      ctx.strokeStyle='rgba(79,101,42,.48)';
      ctx.lineWidth=Math.max(.65,size*.26);
      ctx.beginPath();ctx.moveTo(x,y+size);ctx.lineTo(x,y-size*.92);ctx.moveTo(x,y-.1);ctx.lineTo(x-size*.70,y-size*.58);ctx.moveTo(x,y-.1);ctx.lineTo(x+size*.70,y-size*.58);ctx.stroke();
    }else{
      ctx.fillStyle='rgba(255,255,250,.70)';
      ctx.beginPath();ctx.arc(x,y,size*.68,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}

function landRelief(ctx,w,h,s){
  const landTypes=new Set(['mountains','trees','jungle']);
  ctx.save();
  if(typeof WORLD_COUNTRIES!=='undefined')landClip(ctx,w,h);
  ctx.globalAlpha=clamp(.72-globeZoom*.08,.30,.58);
  ctx.globalCompositeOperation='multiply';

  const visible=[];
  for(const f of FEATURES){
    if(!landTypes.has(f[0]))continue;
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.10)continue;
    visible.push({f,p});
  }
  visible.sort((a,b)=>a.p[2]-b.p[2]);

  for(const {f,p} of visible){
    const base=clamp(s*.023,7,15);
    const k=base*f[3]*clamp(p[2]+.18,.62,1.08)*clamp(Math.pow(globeZoom,.07),1,1.10);
    const fn=draw[f[0]];
    if(fn)fn(ctx,p[0],p[1],k,!!f[4]);
  }
  ctx.restore();
}

function waterDetails(ctx,w,h,s){
  const waterTypes=new Set(['ship','whale','dolphin','island','cloud','plane']);
  ctx.save();
  ctx.globalAlpha=clamp(.92-globeZoom*.10,.38,.78);

  const visible=[];
  for(const f of FEATURES){
    if(!waterTypes.has(f[0]))continue;
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.10)continue;
    visible.push({f,p});
  }
  visible.sort((a,b)=>a.p[2]-b.p[2]);

  for(const {f,p} of visible){
    const base=clamp(s*.026,8,18);
    const k=base*f[3]*clamp(p[2]+.18,.62,1.10);
    const fn=draw[f[0]];
    if(fn)fn(ctx,p[0],p[1],k,!!f[4]);
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
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);

  ctx.save();
  ctx.beginPath();
  ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);
  ctx.clip();

  /* New map order:
     ocean -> continent surfaces -> terrain -> subtle borders -> integrated details.
     The old country-by-country tile renderer is gone from Utforsk/Min verden. */
  ocean(ctx,w,h,s);
  paintContinents(ctx,w,h,s);

  ctx.save();
  if(landClip(ctx,w,h))for(const t of TERRAIN)terrainPatch(ctx,w,h,s,t);
  ctx.restore();

  landRelief(ctx,w,h,s);
  paintCountryBorders(ctx,w,h,s);
  waterDetails(ctx,w,h,s);
  selectedHalo(ctx,w,h,s);

  if(typeof globeMode==='string'&&globeMode==='mine'&&typeof WORLD_COUNTRIES!=='undefined'&&typeof drawMasteryMarker==='function'){
    for(const c of WORLD_COUNTRIES)drawMasteryMarker(ctx,c,w,h);
  }

  let pulsing=false;
  try{if(typeof drawGlobePulse==='function')pulsing=drawGlobePulse(ctx,w,h)}catch(_){}
  finish(ctx,w,h,s);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);
  ctx.strokeStyle='rgba(246,254,255,.96)';
  ctx.lineWidth=Math.max(3.5,s*.007);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w/2-s*.10,h/2-s*.19,s*.33,3.84,5.18);
  ctx.strokeStyle='rgba(255,255,255,.24)';
  ctx.lineWidth=Math.max(1.6,s*.004);
  ctx.stroke();

  if(pulsing)requestAnimationFrame(()=>window.drawGlobe?.());
}
function install(){
  if(window.__lariaGlobeV25Installed||typeof window.drawGlobe!=='function'||typeof window.globeProject!=='function'||typeof window.setGlobeMode!=='function'||typeof window.selectGlobeCountry!=='function')return false;
  ensurePremiumShell();

  const baseDraw=window.drawGlobe;
  const baseSet=window.setGlobeMode;
  const baseSelect=window.selectGlobeCountry;
  window.__lariaGlobeClassicDraw=baseDraw;

  const routedDraw=function(){
    try{if(typeof globeMode==='string'&&globeMode==='classic')return baseDraw.apply(this,arguments)}catch(_){}
    return premiumDraw.apply(this,arguments);
  };

  const routedSelect=function(id){
    const result=baseSelect.call(this,id);
    enhanceSelectedCountryV24(id);
    return result;
  };

  const routedSet=function(mode){
    const next=mode==='classic'?'classic':(mode==='mine'?'mine':'explore');
    if(next==='classic'){
      try{globeMode='classic'}catch(_){}
      syncPremiumChrome(next);
      if(typeof globeSelected==='string'&&globeSelected)enhanceSelectedCountryV24(globeSelected);
      requestAnimationFrame(()=>{try{resizeGlobe()}catch(_){} requestAnimationFrame(routedDraw)});
      return;
    }
    const result=baseSet.call(this,next);
    syncPremiumChrome(next);
    if(typeof globeSelected==='string'&&globeSelected)enhanceSelectedCountryV24(globeSelected);
    requestAnimationFrame(routedDraw);
    return result;
  };

  window.drawGlobe=routedDraw;
  window.selectGlobeCountry=routedSelect;
  window.setGlobeMode=routedSet;
  try{drawGlobe=routedDraw}catch(_){}
  try{selectGlobeCountry=routedSelect}catch(_){}
  try{setGlobeMode=routedSet}catch(_){}

  document.querySelectorAll('#globe-mode [data-globe-mode]').forEach(btn=>{btn.onclick=()=>routedSet(btn.dataset.globeMode)});
  syncPremiumChrome(typeof globeMode==='string'?globeMode:'explore');

  window.__lariaGlobeV25Installed=true;
  screen.dataset.globeVersion='27';
  requestAnimationFrame(()=>{try{resizeGlobe();routedDraw()}catch(_){}});
  return true;
}
function seed(){
  try{
    ensurePremiumShell();
    if(!globeSelected&&typeof WORLD_COUNTRIES!=='undefined'&&typeof selectGlobeCountry==='function'){
      const c=WORLD_COUNTRIES.find(x=>x?.name==='Tsjad');if(c)selectGlobeCountry(c.id);
    }else if(typeof globeSelected==='string'&&globeSelected){
      enhanceSelectedCountryV24(globeSelected);
    }
    syncPremiumChrome(typeof globeMode==='string'?globeMode:'explore');
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