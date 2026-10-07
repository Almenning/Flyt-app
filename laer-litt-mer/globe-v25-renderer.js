(()=>{'use strict';
const screen=document.getElementById('world-screen');if(!screen)return;screen.classList.add('globe-v30');
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

const COUNTRY_SCENES={
  'tsjad':{tone:'desert',features:[['camel',.50,.63,.40],['trees',.18,.56,.26]],tag:'Sahel, savanne og store landskap'},
  'norge':{tone:'north',features:[['mountains',.68,.46,.45],['trees',.25,.60,.30],['village',.48,.65,.23]],tag:'Fjorder, fjell og nordlig natur'},
  'egypt':{tone:'desert',features:[['pyramids',.63,.58,.42],['camel',.28,.66,.30]],tag:'Nilen, ørken og pyramider'},
  'japan':{tone:'green',features:[['mountains',.65,.42,.40],['village',.40,.65,.25],['trees',.18,.61,.24]],tag:'Øyer, fjell og levende bykultur'},
  'brasil':{tone:'tropic',features:[['jungle',.58,.55,.40],['trees',.24,.63,.28]],tag:'Amazonas, regnskog og enorme landskap'},
  'australia':{tone:'desert',features:[['mountains',.66,.54,.30],['trees',.24,.64,.25],['island',.46,.72,.24]],tag:'Kyst, ørken og unik natur'},
  'island':{tone:'north',features:[['mountains',.60,.46,.43],['lighthouse',.22,.64,.27]],tag:'Vulkaner, is og dramatisk natur'},
  'kenya':{tone:'savanna',features:[['giraffe',.66,.58,.32],['elephant',.34,.65,.30],['trees',.17,.55,.25]],tag:'Savanne, høyland og rikt dyreliv'},
  'sør-afrika':{tone:'savanna',features:[['giraffe',.66,.58,.30],['mountains',.36,.49,.32],['trees',.18,.64,.25]],tag:'Fjell, kyst og store naturområder'},
  'india':{tone:'warm',features:[['mountains',.72,.40,.38],['village',.42,.64,.24],['trees',.18,.62,.23]],tag:'Himalaya, storbyer og mangfold'},
  'kina':{tone:'green',features:[['mountains',.70,.43,.40],['village',.40,.64,.24],['trees',.18,.61,.24]],tag:'Fjell, elver og store byområder'},
  'frankrike':{tone:'green',features:[['village',.53,.61,.28],['mountains',.76,.47,.28],['trees',.20,.64,.23]],tag:'Byer, landskap og kultur'},
  'usa':{tone:'warm',features:[['mountains',.65,.47,.38],['trees',.22,.62,.27],['lighthouse',.86,.62,.18]],tag:'Store landskap, kyst og storbyer'},
  'canada':{tone:'north',features:[['mountains',.68,.44,.42],['trees',.26,.61,.30]],tag:'Skog, innsjøer og fjell'},
  'peru':{tone:'warm',features:[['mountains',.65,.43,.44],['village',.30,.66,.22]],tag:'Andesfjellene og gamle kultursteder'}
};
const CONTINENT_SCENES={
  'Afrika':{tone:'savanna',features:[['elephant',.62,.62,.30],['giraffe',.36,.59,.28],['trees',.16,.58,.24]],tag:'Store landskap og variert natur'},
  'Europa':{tone:'green',features:[['village',.52,.63,.27],['mountains',.73,.45,.32],['trees',.18,.62,.24]],tag:'Byer, fjell og mange landskap'},
  'Asia':{tone:'warm',features:[['mountains',.70,.44,.38],['village',.43,.64,.24],['trees',.18,.60,.24]],tag:'Store kontraster i natur og byliv'},
  'Nord-Amerika':{tone:'north',features:[['mountains',.68,.44,.39],['trees',.25,.61,.29]],tag:'Fjell, skog og store byområder'},
  'Sør-Amerika':{tone:'tropic',features:[['jungle',.58,.56,.40],['mountains',.74,.45,.30]],tag:'Regnskog, fjell og lange kystlinjer'},
  'Oseania':{tone:'tropic',features:[['island',.58,.67,.31],['trees',.25,.60,.28]],tag:'Øyer, kyst og særegen natur'}
};
function countryKey(name=''){
  return String(name).toLocaleLowerCase('nb').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9æøå-]+/g,'-').replace(/^-|-$/g,'');
}
function sceneForCountry(c){
  const key=countryKey(c?.name);
  return COUNTRY_SCENES[key]||CONTINENT_SCENES[c?.continent]||{tone:'green',features:[['mountains',.68,.45,.34],['trees',.22,.62,.26]],tag:'Oppdag landskapet og kulturen'};
}
function paintCountryScene(canvas,c){
  if(!canvas||!c)return;
  const rect=canvas.getBoundingClientRect();
  const w=Math.max(160,Math.round(rect.width||300)),h=Math.max(76,Math.round(rect.height||110)),dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const cfg=sceneForCountry(c);
  const tones={
    desert:['#FFE4A8','#E7B75D','#B97835'],
    savanna:['#FFE7A7','#CDBD64','#78934B'],
    north:['#DDF3F5','#8FC5CE','#4F7A73'],
    tropic:['#DDF7D0','#69B77D','#2F7B57'],
    warm:['#FFE7B8','#D7B36A','#6F9A62'],
    green:['#E3F2C9','#8FC278','#48765D']
  };
  const t=tones[cfg.tone]||tones.green;
  let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,t[0]);g.addColorStop(.58,t[1]);g.addColorStop(1,t[2]);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,244,194,.78)';ctx.beginPath();ctx.arc(w*.82,h*.22,Math.max(10,h*.11),0,Math.PI*2);ctx.fill();
  ctx.fillStyle=cfg.tone==='north'?'rgba(121,182,202,.72)':'rgba(97,148,99,.78)';
  ctx.beginPath();ctx.moveTo(0,h*.72);ctx.quadraticCurveTo(w*.24,h*.55,w*.46,h*.70);ctx.quadraticCurveTo(w*.69,h*.84,w,h*.61);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
  if(['desert','savanna','warm'].includes(cfg.tone)){
    ctx.fillStyle='rgba(220,170,84,.74)';ctx.beginPath();ctx.moveTo(0,h*.78);ctx.quadraticCurveTo(w*.30,h*.68,w*.55,h*.80);ctx.quadraticCurveTo(w*.77,h*.88,w,h*.72);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
  }
  for(const f of cfg.features||[]){
    const fn=draw[f[0]];if(!fn)continue;
    fn(ctx,w*f[1],h*f[2],Math.min(w,h)*f[3],!!f[4]);
  }
  const wash=ctx.createLinearGradient(0,0,w,0);wash.addColorStop(0,'rgba(255,250,230,.20)');wash.addColorStop(.55,'rgba(255,250,230,0)');wash.addColorStop(1,'rgba(40,70,55,.06)');ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
}

function selectedProfileAvatar(){
  try{return (typeof state!=='undefined'&&state?.profile?.avatar==='girl')?'girl':'boy'}catch(_){return 'boy'}
}
function selectedProfileFox(){
  const avatar=selectedProfileAvatar();
  try{
    const src=window.LARIA_PROFILE_AVATARS?.[avatar];
    if(typeof src==='string'&&src.startsWith('data:image/'))return src;
  }catch(_){}
  return './lia-fox-explorer-home.webp';
}

function ensurePremiumShell(){
  let header=screen.querySelector('.premium-globe-header');
  if(!header){
    header=document.createElement('div');
    header.className='premium-globe-header';
    header.setAttribute('aria-hidden','true');
    header.innerHTML='<div class="premium-globe-kicker">VERDEN OG MENNESKER</div><div class="premium-globe-title">Kloden</div><div class="premium-globe-subtitle" data-premium-globe-subtitle>Utforsk land, folk, dyr og spennende steder fra hele verden!</div><img class="premium-globe-fox" src="'+selectedProfileFox()+'" alt="">';
    screen.prepend(header);
  }

  const avatar=selectedProfileAvatar();
  header.dataset.avatar=avatar;
  const fox=screen.querySelector('.premium-globe-fox');if(fox){fox.src=selectedProfileFox();fox.dataset.avatar=avatar;fox.setAttribute('aria-label',avatar==='girl'?'Din valgte revejente':'Din valgte revegutt')}
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
  screen.dataset.globeVersion='30';
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
  const scene=sceneForCountry(c);
  const capital=c.capitalDisplay||c.capital||'–';

  box.classList.add('premium-country-selected');
  box.innerHTML=
    '<div class="flag">'+c.flag+'</div>'+
    '<div class="globe-country-copy">'+
      '<div class="globe-country-line"><strong>'+c.name+'</strong><span class="globe-status-badge '+st.key+'">'+st.symbol+' '+st.label+'</span></div>'+
      '<div class="premium-country-facts"><span>🌍 '+c.continent+'</span><span>📍 '+capital+'</span></div>'+
      '<span class="globe-country-tagline">✨ '+scene.tag+'</span>'+
    '</div>'+
    '<button type="button" class="premium-country-learn" aria-label="Lær mer om '+c.name+'">'+bookSvg+'<span>Lær mer</span><b>›</b></button>';

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
function paintMasteryOverlay(ctx,w,h,s){
  let mode='explore';try{mode=typeof globeMode==='string'?globeMode:'explore'}catch(_){}
  if(mode!=='mine'||typeof WORLD_COUNTRIES==='undefined'||typeof countryStatus!=='function')return;
  const fills={
    mastered:'rgba(255,214,90,.25)',
    known:'rgba(91,181,125,.20)',
    learning:'rgba(246,190,75,.18)',
    seen:'rgba(180,202,210,.18)',
    new:'rgba(244,238,221,.16)'
  };
  for(const country of WORLD_COUNTRIES){
    if(!country.geometry)continue;
    const status=countryStatus(country.id),fill=fills[status]||fills.new;
    ctx.beginPath();if(!addPath(ctx,country,w,h))continue;
    ctx.save();ctx.fillStyle=fill;ctx.fill();
    if(status==='mastered'){
      ctx.shadowColor='rgba(255,210,64,.28)';ctx.shadowBlur=Math.max(3,s*.006);
      ctx.strokeStyle='rgba(255,242,185,.72)';ctx.lineWidth=Math.max(.8,s*.0015);ctx.stroke();
    }
    ctx.restore();
  }
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
  ctx.globalAlpha=clamp(.66-globeZoom*.060,.28,.54);

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

const LAND_COMPOSITION=[
  ['mountains',10,46,1.18],      // Alpene
  ['mountains',79,31,1.48],      // Himalaya
  ['mountains',91,37,.74],       // Tibet / Sentral-Asia
  ['mountains',39,8,.58],        // Øst-Afrika
  ['trees',18,61,.82],           // Skandinavia
  ['trees',54,58,.76],           // Vest-Russland
  ['trees',97,57,.63],           // Sibir
  ['trees',33,-4,.46],           // Øst-Afrika
  ['trees',24,-25,.38],          // Sør-Afrika
  ['jungle',-61,-5,.72],         // Amazonas
  ['jungle',23,0,.54],           // Kongo
  ['jungle',104,16,.48]          // Sørøst-Asia
];

const WATER_COMPOSITION=[
  ['ship',-29,24,.94,0],         // Atlanteren
  ['ship',70,-15,.82,1],         // Indiahavet
  ['ship',145,-9,.64,1],         // Stillehavet
  ['whale',-27,-31,.92,0],       // Sør-Atlanteren
  ['whale',150,-31,.64,0],       // Sør-Stillehavet
  ['dolphin',-119,18,.60,0],
  ['dolphin',112,-22,.56,0],
  ['island',73,5,.64,0],         // Maldivene-området
  ['island',151,-18,.54,0],
  ['cloud',-8,44,.60,0],         // Vest-Europa
  ['cloud',43,-5,.52,0],
  ['cloud',-145,18,.46,0]
];

function landRelief(ctx,w,h,s){
  ctx.save();
  if(typeof WORLD_COUNTRIES!=='undefined')landClip(ctx,w,h);
  ctx.globalAlpha=clamp(.78-globeZoom*.075,.34,.64);
  ctx.globalCompositeOperation='multiply';

  const visible=[];
  for(const f of LAND_COMPOSITION){
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.12)continue;
    visible.push({f,p});
  }
  visible.sort((a,b)=>a.p[2]-b.p[2]);

  for(const {f,p} of visible){
    const type=f[0];
    const typeScale=type==='mountains'?1.32:type==='trees'?.88:.80;
    const mobileBoost=s<520?1.24:s<760?1.10:1,base=clamp(s*.034,11,24);
    const k=base*mobileBoost*f[3]*typeScale*clamp(p[2]+.18,.64,1.10)*clamp(Math.pow(globeZoom,.045),1,1.07);
    const fn=draw[type];
    if(fn)fn(ctx,p[0],p[1],k,!!f[4]);
  }
  ctx.restore();
}

function waterDetails(ctx,w,h,s){
  ctx.save();
  ctx.globalAlpha=clamp(.90-globeZoom*.09,.40,.76);

  const visible=[];
  for(const f of WATER_COMPOSITION){
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.12)continue;
    visible.push({f,p});
  }
  visible.sort((a,b)=>a.p[2]-b.p[2]);

  for(const {f,p} of visible){
    const type=f[0];
    const typeScale=type==='ship'?1.02:type==='whale'?.92:type==='cloud'?.78:.88;
    const mobileBoost=s<520?1.22:s<760?1.10:1,base=clamp(s*.032,10,23);
    const k=base*mobileBoost*f[3]*typeScale*clamp(p[2]+.18,.64,1.08);
    const fn=draw[type];
    if(fn)fn(ctx,p[0],p[1],k,!!f[4]);
  }
  ctx.restore();
}
const DISCOVERY_COMPOSITION=[
  ['village',16,50,.86],['village',33,56,.62],['village',77,28,.70],
  ['pyramids',30,27,.84],['camel',11,24,.72],
  ['elephant',28,-3,.86],['giraffe',23,-25,.82],
  ['lighthouse',-9,38,.66],['lighthouse',-71,42,.58],
  ['dolphin',-119,18,.72],['dolphin',112,-22,.66],
  ['island',73,5,.58],['plane',7,-1,.54]
];

function discoveryDetails(ctx,w,h,s){
  let mode='explore';try{mode=typeof globeMode==='string'?globeMode:'explore'}catch(_){}
  if(mode!=='explore')return;
  ctx.save();
  ctx.globalAlpha=clamp(1.08-globeZoom*.095,.58,.98);
  const visible=[];
  for(const f of DISCOVERY_COMPOSITION){
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.12)continue;
    visible.push({f,p});
  }
  visible.sort((a,b)=>a.p[2]-b.p[2]);
  for(const {f,p} of visible){
    const type=f[0],mobileBoost=s<520?1.30:s<760?1.14:1,base=clamp(s*.044,15,30);
    const k=base*mobileBoost*f[3]*clamp(p[2]+.20,.64,1.12)*clamp(Math.pow(globeZoom,.06),1,1.10);
    const fn=draw[type];if(fn)fn(ctx,p[0],p[1],k,!!f[4]);
  }
  ctx.restore();
}

let selectionPulse={id:null,until:0};
function selectedHalo(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined'||!globeSelected)return false;
  const c=WORLD_COUNTRIES.find(x=>x.id===globeSelected);if(!c)return;
  const p=project(c.lon,c.lat,w,h);if(!p||p[2]<.08)return false;
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
  const active=selectionPulse.id===globeSelected&&Date.now()<selectionPulse.until;
  if(active){
    const phase=1-(selectionPulse.until-Date.now())/850,pr=r*(.74+phase*.72),alpha=Math.max(0,.48-phase*.48);
    ctx.beginPath();ctx.arc(p[0],p[1],pr,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,226,119,'+alpha.toFixed(3)+')';
    ctx.lineWidth=Math.max(1.4,s*.0027);ctx.stroke();
  }
  return active;
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
  const moving=window.__lariaGlobeInteracting===true;
  ocean(ctx,w,h,s);
  paintContinents(ctx,w,h,s);

  if(!moving){
    ctx.save();
    if(landClip(ctx,w,h))for(const t of TERRAIN)terrainPatch(ctx,w,h,s,t);
    ctx.restore();

    landRelief(ctx,w,h,s);
    paintMasteryOverlay(ctx,w,h,s);
  }

  paintCountryBorders(ctx,w,h,s);

  let selectionAnimating=false;
  if(!moving){
    waterDetails(ctx,w,h,s);
    discoveryDetails(ctx,w,h,s);
    selectionAnimating=selectedHalo(ctx,w,h,s);

    if(typeof globeMode==='string'&&globeMode==='mine'&&typeof WORLD_COUNTRIES!=='undefined'&&typeof drawMasteryMarker==='function'){
      for(const c of WORLD_COUNTRIES)drawMasteryMarker(ctx,c,w,h);
    }
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

  if(pulsing||selectionAnimating)requestAnimationFrame(()=>window.drawGlobe?.());
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
    const previous=typeof globeSelected==='string'?globeSelected:null;
    const result=baseSelect.call(this,id);
    if(id&&id!==previous)selectionPulse={id,until:Date.now()+850};
    enhanceSelectedCountryV24(id);
    requestAnimationFrame(routedDraw);
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
  screen.dataset.globeVersion='30';
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