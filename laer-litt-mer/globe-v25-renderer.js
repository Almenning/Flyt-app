(()=>{'use strict';
const screen=document.getElementById('world-screen');if(!screen)return;screen.classList.add('globe-v30');
const ART=window.LariaGlobeArtV24;if(!ART)return;
const {clamp,TERRAIN,FEATURES,draw}=ART;

/* v37: geography-first, deliberately quiet at overview scale.
   All illustrated marks use longitude/latitude and the same live projection
   as country selection; no screen-space globe texture or map replacement. */
const v37Fade=(from,to)=>{
  const t=clamp((globeZoom-from)/(to-from),0,1);
  return t*t*(3-2*t);
};
const v37Level=()=>globeZoom<1.38?'oversikt':globeZoom<2.35?'mellomzoom':'nærzoom';
let v37Frame=null;
function v37Pick(items,limit,gap){
  const chosen=[];
  for(const item of items.sort((a,b)=>b.p[2]-a.p[2])){
    if(chosen.some(other=>Math.hypot(other.p[0]-item.p[0],other.p[1]-item.p[1])<gap))continue;
    chosen.push(item);if(chosen.length>=limit)break;
  }
  return chosen.sort((a,b)=>a.p[2]-b.p[2]);
}
function v37Record(kind,f,p){
  if(!v37Frame)return;
  v37Frame[kind].push({type:f[0],lon:f[1],lat:f[2],x:p[0],y:p[1]});
}

/* v36 locked reference palette: ocean cyan, Europe blue, Africa coral,
   Asia sun-gold and the Americas verdant green. Geography stays authoritative. */
const PALETTE={
  'Europa':'#316FE0','Asia':'#E6B544','Afrika':'#E87455',
  'Nord-Amerika':'#4DAD60','Sør-Amerika':'#319F58','Oseania':'#6DB15E'
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
  let guide=screen.querySelector('.premium-globe-guide');
  if(!guide){
    guide=document.createElement('img');
    guide.className='premium-globe-guide';
    guide.src='./lia-fox-explorer-home.webp';
    guide.alt='';
    guide.setAttribute('aria-hidden','true');
    screen.appendChild(guide);
  }
  guide.dataset.profileAvatar=avatar;
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
      '<div class="premium-country-facts"><span>🌍 '+c.continent+'</span><span>📍 '+capital+'</span><span class="globe-country-tagline">✨ '+scene.tag+'</span></div>'+
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

/* Geography owns the visible surface and land selection. The old painted
   equirectangular mockup was not georeferenced, so loading it was both misleading
   and an unnecessary multi-megabyte decode on Safari. */
function ocean(ctx,w,h,s){
  const g=ctx.createRadialGradient(w/2-s*.19,h/2-s*.26,s*.02,w/2+s*.06,h/2+s*.09,s*.63);
  g.addColorStop(0,'#55D9EE');
  g.addColorStop(.22,'#14B9DE');
  g.addColorStop(.54,'#058FC5');
  g.addColorStop(.82,'#056AA2');
  g.addColorStop(1,'#034A7E');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

  const aqua=ctx.createRadialGradient(w*.34,h*.28,0,w*.40,h*.33,s*.28);
  aqua.addColorStop(0,'rgba(225,255,255,.32)');
  aqua.addColorStop(.55,'rgba(185,249,255,.08)');
  aqua.addColorStop(1,'rgba(185,249,255,0)');
  ctx.fillStyle=aqua;ctx.fillRect(0,0,w,h);

  if(typeof drawProjectedLine==='function'){
    ctx.strokeStyle='rgba(226,252,255,.18)';ctx.lineWidth=Math.max(.65,s*.00115);
    for(const lat of [-60,-30,0,30,60]){
      ctx.beginPath();const pts=[];for(let lon=-180;lon<=180;lon+=4)pts.push([lon,lat]);drawProjectedLine(ctx,pts,w,h);ctx.stroke();
    }
    for(let lon=-180;lon<180;lon+=30){
      ctx.beginPath();const pts=[];for(let lat=-85;lat<=85;lat+=4)pts.push([lon,lat]);drawProjectedLine(ctx,pts,w,h);ctx.stroke();
    }
  }

  /* v37: Sea glints are placed in geographic coordinates so they rotate
     together with the coastline instead of remaining stuck to the viewport. */
  const waves=[
    [-52,38,.033],[-36,8,.039],[-35,-40,.035],[-17,-14,.027],
    [59,-24,.039],[83,-34,.032],[149,20,.036],[175,-8,.033],
    [-142,-27,.038],[-102,6,.029],[-163,49,.033]
  ];
  ctx.save();
  ctx.strokeStyle='rgba(237,252,255,.34)';
  ctx.lineWidth=Math.max(.9,s*.0020);
  ctx.lineCap='round';
  for(const [lon,lat,radius] of waves){
    const p=project(lon,lat,w,h);
    if(!p||p[2]<.18)continue;
    const r=s*radius*clamp(.58+p[2]*.42,.62,1.0);
    ctx.globalAlpha=clamp(.42+p[2]*.54,.42,.94);
    ctx.beginPath();
    ctx.ellipse(p[0],p[1],r,r*.34,-.16,Math.PI*.08,Math.PI*.86);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(p[0]+r*.25,p[1]+r*.36,r*.62,r*.21,-.12,Math.PI*.20,Math.PI*.78);
    ctx.stroke();
  }
  ctx.restore();
}
function continentGradient(ctx,continent,w,h){
  const base=PALETTE[continent]||'#6F9554';
  const g=ctx.createLinearGradient(w*.24,h*.14,w*.80,h*.91);
  g.addColorStop(0,mix(base,'#FFF9DF',.15));
  g.addColorStop(.38,mix(base,'#FFFFFF',.055));
  g.addColorStop(.72,base);
  g.addColorStop(1,mix(base,'#20394D',.17));
  return g;
}
function continentCountries(continent){
  return typeof WORLD_COUNTRIES==='undefined'?[]:WORLD_COUNTRIES.filter(c=>c.geometry&&c.continent===continent);
}
function countryTint(c){
  const base=PALETTE[c?.continent]||'#78A47B',key=String(c?.id||c?.name||'');
  let hash=0;for(let i=0;i<key.length;i++)hash=(hash*33+key.charCodeAt(i))>>>0;
  const band=hash%5;
  if(band===0)return mix(base,'#FFF2C9',.12);
  if(band===1)return mix(base,'#FFFFFF',.075);
  if(band===2)return mix(base,'#29463D',.055);
  if(band===3)return mix(base,'#F7D789',.055);
  return base;
}
function paintCountryVariation(ctx,w,h){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  ctx.save();ctx.globalAlpha=.028;
  for(const c of WORLD_COUNTRIES){
    if(!c.geometry)continue;
    ctx.beginPath();if(!addPath(ctx,c,w,h))continue;
    ctx.fillStyle=countryTint(c);ctx.fill();
  }
  ctx.restore();
}
function paintLandDepth(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  ctx.save();
  ctx.translate(s*.009,s*.012);
  ctx.fillStyle='rgba(55,43,30,.29)';
  ctx.shadowColor='rgba(17,34,31,.36)';
  ctx.shadowBlur=Math.max(5,s*.013);
  ctx.shadowOffsetY=Math.max(3,s*.006);
  for(const c of WORLD_COUNTRIES){
    if(!c.geometry)continue;
    ctx.beginPath();if(addPath(ctx,c,w,h))ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-s*.0025,-s*.0035);
  ctx.strokeStyle='rgba(255,250,218,.42)';
  ctx.lineWidth=Math.max(1.35,s*.00255);
  for(const c of WORLD_COUNTRIES){
    if(!c.geometry)continue;
    ctx.beginPath();if(addPath(ctx,c,w,h))ctx.stroke();
  }
  ctx.restore();
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
    ctx.lineWidth=Math.max(4.2,s*.0082);
    ctx.shadowColor='rgba(22,48,42,.30)';
    ctx.shadowBlur=Math.max(4,s*.011);
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
    light.addColorStop(0,'rgba(255,250,218,.30)');
    light.addColorStop(.52,'rgba(255,242,190,.075)');
    light.addColorStop(1,'rgba(32,58,48,.10)');
    ctx.fillStyle=light;
    ctx.fillRect(0,0,w,h);
  }
  ctx.restore();
}
const STORY_BIOMES=[
  ['forest',-111,55,.145],['forest',-83,49,.115],['forest',-63,-5,.165],['forest',-72,-12,.125],
  ['forest',8,54,.110],['forest',24,60,.125],['forest',52,59,.145],['forest',82,60,.155],['forest',112,56,.135],
  ['forest',24,1,.105],['forest',104,17,.115],['forest',118,-3,.100],
  ['desert',-6,25,.175],['desert',14,25,.220],['desert',34,25,.195],['desert',52,26,.135],
  ['desert',69,38,.100],['desert',79,27,.090],['desert',134,-24,.145],
  ['savanna',10,8,.130],['savanna',27,-5,.155],['savanna',25,-22,.145],['savanna',-58,-18,.100],
  ['savanna',74,43,.115],['savanna',100,43,.125],
  ['snow',-42,72,.150],['snow',18,69,.100],['snow',91,69,.125],['snow',-112,68,.105]
];
function paintStoryBiomes(ctx,w,h,s){
  const alpha=v37Fade(1.16,2.25)*.53;
  if(alpha<.015)return;
  ctx.save();
  if(!landClip(ctx,w,h)){ctx.restore();return}
  ctx.globalAlpha=alpha;
  for(const b of STORY_BIOMES){
    const p=project(b[1],b[2],w,h);if(!p||p[2]<.10)continue;
    const perspective=clamp(.60+p[2]*.48,.62,1.07);
    const r=s*b[3]*perspective;
    let colors=['rgba(34,132,59,.48)','rgba(27,88,45,.075)'];
    if(b[0]==='desert')colors=['rgba(247,190,62,.53)','rgba(207,126,37,.08)'];
    if(b[0]==='savanna')colors=['rgba(170,158,62,.41)','rgba(108,112,45,.08)'];
    if(b[0]==='snow')colors=['rgba(255,255,250,.85)','rgba(215,239,240,.10)'];
    const g=ctx.createRadialGradient(p[0]-r*.13,p[1]-r*.12,1,p[0],p[1],r);
    g.addColorStop(0,colors[0]);g.addColorStop(.58,colors[1]);g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function atlasDabColor(lon,lat,n){
  /* The pigment follows each region's palette instead of washing European blue
     and African coral with the same green texture. Coordinates are geographic. */
  if(lon>-19&&lon<44&&lat>35&&lat<73)
    return n%3===0?'rgba(52,93,195,.19)':'rgba(231,242,255,.17)';
  if(lon>-19&&lon<54&&lat>-37&&lat<=35){
    if(lat>13)return n%3===0?'rgba(237,152,70,.17)':'rgba(245,209,110,.13)';
    return n%3===0?'rgba(190,91,60,.17)':'rgba(253,201,145,.12)';
  }
  if(lon>43&&lon<180&&lat>-12)
    return n%3===0?'rgba(174,118,50,.17)':'rgba(247,222,137,.14)';
  if(Math.abs(lat)>65)
    return n%3===0?'rgba(249,254,249,.20)':'rgba(193,232,218,.12)';
  if(lat<15)
    return n%4===0?'rgba(24,107,54,.18)':'rgba(47,145,68,.13)';
  return n%3===0?'rgba(27,107,53,.16)':'rgba(193,215,108,.10)';
}
function paintAtlasTexture(ctx,w,h,s){
  ctx.save();
  if(!landClip(ctx,w,h)){ctx.restore();return}
  ctx.globalAlpha=.25+v37Fade(1.23,2.5)*.33;
  ctx.globalCompositeOperation='multiply';
  let n=0;
  for(let lat=-70;lat<=70;lat+=10){
    for(let lon=-180;lon<180;lon+=15){
      n++;
      const jx=Math.sin((lon+lat*3)*.73)*3.2,jy=Math.cos((lon*2-lat)*.47)*2.4;
      const p=project(lon+jx,lat+jy,w,h);if(!p||p[2]<.12)continue;
      const q=(Math.sin(n*12.9898)*43758.5453)%1;
      const r=s*(.0052+Math.abs(q)*.0038)*clamp(.70+p[2]*.36,.72,1.04);
      ctx.fillStyle=atlasDabColor(lon,lat,n);
      ctx.beginPath();ctx.ellipse(p[0],p[1],r*1.65,r*.68,(n%7-3)*.10,0,Math.PI*2);ctx.fill();
    }
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

function paintPolarLand(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  for(const c of WORLD_COUNTRIES){
    const key=countryKey(c?.name||'');
    if(key!=='gronland'&&key!=='grønland'&&key!=='greenland')continue;
    ctx.beginPath();if(!addPath(ctx,c,w,h))continue;
    const g=ctx.createLinearGradient(w*.38,h*.10,w*.58,h*.42);
    g.addColorStop(0,'#FFFFFF');g.addColorStop(.55,'#EAF8FA');g.addColorStop(1,'#CBE5E8');
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.96)';ctx.lineWidth=Math.max(1.2,s*.0022);ctx.stroke();
  }
}
function paintCountryBorders(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined')return;
  const borderAlpha=globeZoom>2.5?.48:globeZoom>1.65?.34:.22;

  for(const c of WORLD_COUNTRIES){
    if(!c.geometry)continue;
    ctx.beginPath();
    if(!addPath(ctx,c,w,h))continue;
    const selected=c.id===globeSelected;

    if(selected){
      ctx.save();
      ctx.fillStyle='rgba(255,213,83,.88)';
      ctx.shadowColor='rgba(255,184,35,.40)';
      ctx.shadowBlur=Math.max(7,s*.014);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle='rgba(255,252,226,.98)';
      ctx.lineWidth=Math.max(1.6,s*.0028);
    }else{
      ctx.strokeStyle='rgba(255,252,235,'+borderAlpha+')';
      ctx.lineWidth=globeZoom>2.7?.90:Math.max(.48,s*.00082);
    }
    ctx.stroke();
  }
}
function landClip(ctx,w,h){
  if(typeof WORLD_COUNTRIES==='undefined')return false;ctx.beginPath();
  for(const c of WORLD_COUNTRIES)if(c.geometry)addPath(ctx,c,w,h);ctx.clip();return true;
}
function terrainPatch(ctx,w,h,s,t){
  const opacity=v37Fade(1.47,2.85);
  if(opacity<.018)return;
  const p=project(t[1],t[2],w,h);if(!p||p[2]<.08)return;
  const type=t[0],k=t[3]*clamp(p[2]+.20,.58,1.14);
  const r=s*(type==='desert'?.095:type==='snow'?.082:.090)*k;

  ctx.save();
  ctx.translate(p[0],p[1]);
  ctx.rotate(-.12);

  let c0='rgba(38,137,61,.46)',c1='rgba(32,112,55,.13)',blend='multiply';
  if(type==='desert'){c0='rgba(244,183,63,.43)';c1='rgba(210,130,42,.09)';blend='multiply'}
  if(type==='savanna'){c0='rgba(151,157,63,.42)';c1='rgba(110,122,49,.10)';blend='multiply'}
  if(type==='snow'){c0='rgba(255,255,247,.72)';c1='rgba(225,242,239,.14)';blend='screen'}

  ctx.globalCompositeOperation=blend;
  ctx.globalAlpha=opacity*.60;
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
  ctx.globalAlpha=opacity*.62;

  const marks=[
    [-.72,-.18],[-.58,.20],[-.46,-.36],[-.34,.38],[-.18,-.20],[-.08,.16],
    [.05,-.38],[.16,.34],[.29,-.12],[.40,.25],[.52,-.32],[.61,.14],[.72,-.02],
    [.02,.49],[-.50,.02]
  ];
  for(let i=0;i<marks.length;i++){
    const mp=project(t[1]+marks[i][0]*8.2*t[3],t[2]+marks[i][1]*5.6*t[3],w,h);
    if(!mp||mp[2]<.10)continue;
    const x=mp[0],y=mp[1],size=Math.max(1.35,s*.0037*k);

    if(type==='forest'){
      ctx.fillStyle=i%3===0?'rgba(24,86,43,.88)':i%2?'rgba(37,111,51,.82)':'rgba(66,133,58,.78)';
      ctx.beginPath();
      ctx.moveTo(x,y-size*1.58);ctx.lineTo(x-size*.86,y+size*.78);ctx.lineTo(x+size*.86,y+size*.78);
      ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(94,70,42,.62)';ctx.fillRect(x-size*.09,y+size*.60,size*.18,size*.56);
    }else if(type==='desert'){
      ctx.strokeStyle=i%2?'rgba(155,98,33,.64)':'rgba(196,128,39,.60)';
      ctx.lineWidth=Math.max(.75,size*.28);
      ctx.beginPath();ctx.arc(x-size*.18,y,size*1.45,Math.PI*1.08,Math.PI*1.88);ctx.stroke();
      ctx.beginPath();ctx.arc(x+size*.45,y+size*.22,size*.92,Math.PI*1.04,Math.PI*1.82);ctx.stroke();
    }else if(type==='savanna'){
      ctx.strokeStyle='rgba(84,92,39,.68)';
      ctx.lineWidth=Math.max(.75,size*.24);
      ctx.beginPath();ctx.moveTo(x,y+size*.95);ctx.lineTo(x,y-size*.40);ctx.stroke();
      ctx.fillStyle='rgba(96,123,45,.72)';
      ctx.beginPath();ctx.ellipse(x,y-size*.48,size*.92,size*.34,0,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle='rgba(255,255,250,.70)';
      ctx.beginPath();ctx.arc(x,y,size*.68,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}

const LAND_COMPOSITION=[
  // North America
  ['mountains',-121,47,.58],['mountains',-114,42,.54],['mountains',-107,37,.50],
  ['trees',-124,53,.48],['trees',-115,56,.46],['trees',-104,52,.43],['trees',-92,50,.42],['trees',-80,48,.38],
  // South America
  ['mountains',-76,5,.46],['mountains',-73,-8,.56],['mountains',-71,-18,.58],['mountains',-70,-29,.54],['mountains',-70,-39,.48],
  ['jungle',-70,0,.48],['jungle',-63,-4,.56],['jungle',-57,-8,.50],['trees',-52,-15,.38],
  // Europe and Mediterranean
  ['mountains',-4,43,.38],['mountains',10,46,.54],['mountains',22,44,.38],['mountains',44,42,.40],
  ['trees',-4,54,.34],['trees',7,55,.36],['trees',18,59,.43],['trees',28,57,.38],['trees',39,56,.36],
  // Africa
  ['mountains',-6,32,.34],['mountains',11,34,.32],['mountains',38,9,.42],['mountains',35,-4,.34],
  ['trees',-5,8,.30],['trees',8,5,.32],['jungle',20,2,.40],['jungle',27,-3,.36],
  ['trees',31,-14,.32],['trees',25,-24,.30],['trees',18,-31,.28],
  // Asia
  ['mountains',54,35,.34],['mountains',67,34,.40],['mountains',76,31,.62],['mountains',84,31,.66],['mountains',92,34,.48],
  ['mountains',104,36,.34],['mountains',138,36,.30],
  ['trees',49,55,.38],['trees',61,58,.40],['trees',75,58,.42],['trees',90,59,.44],['trees',105,57,.40],['trees',119,53,.35],
  ['trees',76,22,.32],['trees',92,23,.31],['jungle',103,18,.38],['jungle',111,11,.36],['jungle',119,1,.34],
  // Oceania
  ['mountains',147,-37,.32],['trees',145,-28,.30],['trees',151,-35,.28],['jungle',121,-4,.32]
];

const WATER_COMPOSITION=[
  ['ship',-34,28,1.02,0],['ship',66,-18,.86,1],['ship',147,-8,.72,1],
  ['whale',-28,-32,1.02,0],['whale',151,-31,.72,0],
  ['dolphin',-117,17,.64,0],['dolphin',111,-21,.62,0],
  ['island',73,5,.68,0],['island',151,-18,.60,0],['island',-155,20,.52,0],
  ['cloud',-15,46,.72,0],['cloud',37,4,.60,0],['cloud',83,50,.54,0],
  ['cloud',-145,18,.54,0],['cloud',118,-19,.50,0],['cloud',-48,-37,.50,0]
];

function landRelief(ctx,w,h,s,moving=false){
  const alpha=v37Fade(1.22,2.16)*(moving?.44:.88);
  if(alpha<.018)return;
  const visible=[];
  for(const f of LAND_COMPOSITION){
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.14||p[0]<12||p[0]>w-12||p[1]<12||p[1]>h-12)continue;
    visible.push({f,p});
  }
  const mobile=s<520,maxCount=Math.min(mobile?12:23,Math.floor((mobile?3:6)+globeZoom*(mobile?2.2:3.6)));
  const chosen=v37Pick(visible,maxCount,mobile?39:43);
  ctx.save();
  if(typeof WORLD_COUNTRIES!=='undefined')landClip(ctx,w,h);
  ctx.globalAlpha=alpha;
  for(const {f,p} of chosen){
    const type=f[0],fn=draw[type];if(!fn)continue;
    const base=clamp(s*.042,14,31);
    const k=base*f[3]*(type==='mountains'?1.30:1.07)*clamp(p[2]+.20,.69,1.07)
      *clamp(1+.12*Math.log2(Math.max(1,globeZoom)),1,1.23);
    fn(ctx,p[0],p[1],k,!!f[4]);
    v37Record('land',f,p);
  }
  ctx.restore();
}

function waterDetails(ctx,w,h,s,moving=false){
  const alpha=v37Fade(1.44,2.80)*(moving?.48:.78);
  if(alpha<.018)return;
  const visible=[];
  for(const f of WATER_COMPOSITION){
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.16||p[0]<16||p[0]>w-16||p[1]<14||p[1]>h-14)continue;
    visible.push({f,p});
  }
  const mobile=s<520;
  const selected=v37Pick(visible,Math.min(mobile?5:10,Math.floor((mobile?2:4)+globeZoom*1.65)),mobile?50:60);
  ctx.save();
  ctx.globalAlpha=alpha;
  for(const {f,p} of selected){
    const fn=draw[f[0]];if(!fn)continue;
    const k=clamp(s*.041,14,30)*f[3]*clamp(p[2]+.20,.69,1.07)*1.04;
    fn(ctx,p[0],p[1],k,!!f[4]);
    v37Record('water',f,p);
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

function discoveryDetails(ctx,w,h,s,moving=false){
  const mode=typeof globeMode==='string'?globeMode:'explore';
  if(mode!=='explore')return;
  const alpha=v37Fade(1.92,3.14)*(moving?.42:.94);
  if(alpha<.018)return;
  const visible=[];
  for(const f of DISCOVERY_COMPOSITION){
    const p=project(f[1],f[2],w,h);
    if(!p||p[2]<.17||p[0]<18||p[0]>w-18||p[1]<18||p[1]>h-18)continue;
    visible.push({f,p});
  }
  const mobile=s<520;
  const selected=v37Pick(visible,Math.min(mobile?5:10,Math.floor((mobile?1:3)+globeZoom*1.35)),mobile?52:66);
  ctx.save();ctx.globalAlpha=alpha;
  for(const {f,p} of selected){
    const fn=draw[f[0]];if(!fn)continue;
    const k=clamp(s*.050,19,40)*f[3]*clamp(p[2]+.20,.69,1.09)
      *clamp(1+.13*Math.log2(Math.max(1,globeZoom)),1,1.25);
    fn(ctx,p[0],p[1],k,!!f[4]);
    v37Record('discovery',f,p);
  }
  ctx.restore();
}

let selectionPulse={id:null,until:0};
function selectedHalo(ctx,w,h,s){
  if(typeof WORLD_COUNTRIES==='undefined'||!globeSelected)return false;
  const c=WORLD_COUNTRIES.find(x=>x.id===globeSelected);if(!c)return false;
  const p=project(c.lon,c.lat,w,h);if(!p||p[2]<.08)return false;
  const active=selectionPulse.id===globeSelected&&Date.now()<selectionPulse.until;
  if(active){
    const phase=1-(selectionPulse.until-Date.now())/650;
    const r=Math.max(12,s*.023)*(1+phase*.46),alpha=Math.max(0,.30-phase*.30);
    ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,239,160,'+alpha.toFixed(3)+')';
    ctx.lineWidth=Math.max(1.1,s*.0018);ctx.stroke();
  }
  return active;
}
function finish(ctx,w,h,s){
  const shine=ctx.createRadialGradient(w/2-s*.22,h/2-s*.29,s*.01,w/2-s*.06,h/2-s*.09,s*.55);
  shine.addColorStop(0,'rgba(255,255,255,.40)');
  shine.addColorStop(.22,'rgba(255,255,255,.14)');
  shine.addColorStop(.56,'rgba(255,255,255,.035)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;ctx.fillRect(0,0,w,h);

  const edge=ctx.createRadialGradient(w/2-s*.035,h/2-s*.025,s*.27,w/2,h/2,s*.47);
  edge.addColorStop(.58,'rgba(0,54,80,0)');
  edge.addColorStop(.82,'rgba(0,49,75,.10)');
  edge.addColorStop(1,'rgba(0,31,57,.48)');
  ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);

  const lowerGlow=ctx.createLinearGradient(0,h*.54,0,h);
  lowerGlow.addColorStop(0,'rgba(255,255,255,0)');
  lowerGlow.addColorStop(1,'rgba(0,55,85,.14)');
  ctx.fillStyle=lowerGlow;ctx.fillRect(0,0,w,h);
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

  /* Geography is authoritative: every visible land pixel is drawn inside
     its real country geometry. Never substitute the painted equirectangular
     concept image: its coastline is not geographically registered. */
  const moving=window.__lariaGlobeInteracting===true;
  window.__LARIA_GLOBE_RENDER_SOURCE='country-geometry';
  v37Frame={version:37,zoom:globeZoom,level:v37Level(),moving,
    mediumAlpha:v37Fade(1.22,2.16),nearAlpha:v37Fade(1.92,3.14),
    land:[],water:[],discovery:[],renderSource:'country-geometry'};
  window.__LARIA_GLOBE_V37_FRAME=v37Frame;
  ocean(ctx,w,h,s);
  if(!moving)paintLandDepth(ctx,w,h,s);
  paintContinents(ctx,w,h,s);
  paintCountryVariation(ctx,w,h);
  if(!moving){
    paintAtlasTexture(ctx,w,h,s);
    paintStoryBiomes(ctx,w,h,s);
    ctx.save();
    if(globeZoom>1.40&&landClip(ctx,w,h))for(const t of TERRAIN)terrainPatch(ctx,w,h,s,t);
    ctx.restore();
    paintMasteryOverlay(ctx,w,h,s);
  }
  /* LOD detail stays geographically attached during drag, but with a
     lower moving-frame draw budget and no expensive texture passes. */
  landRelief(ctx,w,h,s,moving);

  paintPolarLand(ctx,w,h,s);
  paintCountryBorders(ctx,w,h,s);

  let selectionAnimating=false;
  /* Keep inexpensive georeferenced ships, clouds and discovery markers
     present during one-finger rotation and pinch. Only the costly polygon
     clipping / watercolor texture passes are paused while moving. */
  waterDetails(ctx,w,h,s,moving);
  discoveryDetails(ctx,w,h,s,moving);
  if(!moving)selectionAnimating=selectedHalo(ctx,w,h,s);
  if(!moving&&typeof globeMode==='string'&&globeMode==='mine'&&typeof WORLD_COUNTRIES!=='undefined'&&typeof drawMasteryMarker==='function'){
    for(const c of WORLD_COUNTRIES)drawMasteryMarker(ctx,c,w,h);
  }

  let pulsing=false;
  try{if(typeof drawGlobePulse==='function')pulsing=drawGlobePulse(ctx,w,h)}catch(_){}
  finish(ctx,w,h,s);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(w/2,h/2,s*.46,0,Math.PI*2);
  ctx.strokeStyle='rgba(248,255,255,.99)';
  ctx.lineWidth=Math.max(4.2,s*.0082);
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
