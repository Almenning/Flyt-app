(()=>{'use strict';
const screen=document.getElementById('world-screen');
if(!screen)return;

function ensurePremiumGlobeShell(){
  if(!screen.querySelector('.premium-globe-header')){
    const header=document.createElement('div');
    header.className='premium-globe-header';
    header.setAttribute('aria-hidden','true');
    header.innerHTML='<div class="premium-globe-kicker">VERDEN OG MENNESKER</div><div class="premium-globe-title">Kloden</div><div class="premium-globe-subtitle" data-premium-globe-subtitle>Utforsk land, folk, dyr og spennende steder fra hele verden!</div><img class="premium-globe-fox" src="./lia-fox-explorer-home.webp" alt="">';
    screen.prepend(header);
  }
  if(!screen.querySelector('.premium-globe-ring')){
    const ring=document.createElement('div');ring.className='premium-globe-ring';ring.setAttribute('aria-hidden','true');screen.append(ring);
    const left=document.createElement('i');left.className='premium-globe-knob left';left.setAttribute('aria-hidden','true');screen.append(left);
    const right=document.createElement('i');right.className='premium-globe-knob right';right.setAttribute('aria-hidden','true');screen.append(right);
  }
  const back=document.getElementById('world-back');
  if(back){back.textContent='←';back.setAttribute('aria-label','Tilbake til Utforsk');}
  const explore=document.querySelector('[data-globe-mode="explore"]');
  const mine=document.querySelector('[data-globe-mode="mine"]');
  if(explore&&!explore.querySelector('.pg-mode-icon'))explore.innerHTML='<span class="pg-mode-icon" aria-hidden="true">◈</span>Utforsk';
  if(mine&&!mine.querySelector('.pg-mode-icon'))mine.innerHTML='<span class="pg-mode-icon" aria-hidden="true">🌐</span>Min verden';
}

function syncPremiumMode(mode){
  const next=mode==='mine'?'mine':'explore';
  screen.dataset.premiumGlobeMode=next;
  const sub=screen.querySelector('[data-premium-globe-subtitle]');
  if(sub)sub.textContent=next==='mine'
    ?'Min verden – utforsk landene du har lært om!'
    :'Utforsk land, folk, dyr og spennende steder fra hele verden!';
  const canvas=document.getElementById('globe-canvas');
  if(canvas)canvas.setAttribute('aria-label',next==='mine'?'Min verden på interaktiv klode':'Utforsk verden på interaktiv klode');
}

function projectPoint(lon,lat){
  const canvas=document.getElementById('globe-canvas');
  if(!canvas||!canvas._cssW||!canvas._cssH||typeof globeProject!=='function')return null;
  return globeProject(lon,lat,canvas._cssW,canvas._cssH);
}
function drawTree(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#6a4325';ctx.fillRect(-1.4,3,2.8,6);
  ctx.fillStyle='#386d42';
  ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(-6,2);ctx.lineTo(6,2);ctx.closePath();ctx.fill();
  ctx.fillStyle='#4f8c52';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(-5,5);ctx.lineTo(5,5);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawMountain(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#8f8f82';ctx.beginPath();ctx.moveTo(-9,7);ctx.lineTo(0,-10);ctx.lineTo(10,7);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f5f1df';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-3,-4);ctx.lineTo(0,-2);ctx.lineTo(3,-5);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawCloud(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='rgba(255,255,255,.78)';
  for(const c of [[-7,1,5],[-2,-2,6],[5,0,5],[0,3,8]]){ctx.beginPath();ctx.arc(c[0],c[1],c[2],0,Math.PI*2);ctx.fill()}
  ctx.restore();
}
function drawShip(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#7c4522';ctx.beginPath();ctx.moveTo(-9,3);ctx.lineTo(8,3);ctx.lineTo(5,8);ctx.lineTo(-6,8);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#5b3923';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,-11);ctx.stroke();
  ctx.fillStyle='#fff1c2';ctx.beginPath();ctx.moveTo(1,-10);ctx.lineTo(1,1);ctx.lineTo(8,-2);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawWhale(ctx,x,y,s=1){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#3f7aa2';ctx.beginPath();ctx.ellipse(0,0,9,4.5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(13,-5);ctx.lineTo(11,1);ctx.lineTo(13,5);ctx.closePath();ctx.fill();
  ctx.fillStyle='#d7edf4';ctx.beginPath();ctx.arc(-4,-1,1,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function decorateExploreGlobe(){
  if(globeMode!=='explore')return;
  const canvas=document.getElementById('globe-canvas');if(!canvas||!canvas._cssW||!canvas._cssH)return;
  const w=canvas._cssW,h=canvas._cssH,s=Math.min(w,h),dpr=canvas._dpr||1,ctx=canvas.getContext('2d');
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.beginPath();ctx.arc(w/2,h/2,s*.455,0,Math.PI*2);ctx.clip();
  const items=[
    ['tree',18,58,1.0],['tree',24,61,.8],['tree',93,55,1.0],['tree',101,51,.82],['tree',-100,49,.95],['tree',-58,-10,.9],
    ['mountain',72,36,1.0],['mountain',12,46,.75],['mountain',-108,39,.85],
    ['cloud',-12,42,1.0],['cloud',45,-4,.9],['cloud',-145,20,.75],
    ['ship',-24,16,.9],['whale',-31,-31,1.0]
  ];
  for(const [kind,lon,lat,scale] of items){
    const p=projectPoint(lon,lat);if(!p)continue;
    if(kind==='tree')drawTree(ctx,p[0],p[1],scale);
    else if(kind==='mountain')drawMountain(ctx,p[0],p[1],scale);
    else if(kind==='cloud')drawCloud(ctx,p[0],p[1],scale);
    else if(kind==='ship')drawShip(ctx,p[0],p[1],scale);
    else if(kind==='whale')drawWhale(ctx,p[0],p[1],scale);
  }
  ctx.restore();
}

ensurePremiumGlobeShell();

const baseDraw=window.drawGlobe;
if(typeof baseDraw==='function'){
  const premiumDraw=function(){baseDraw.apply(this,arguments);decorateExploreGlobe();};
  window.drawGlobe=premiumDraw;
  try{drawGlobe=premiumDraw}catch(_){}
}
const baseSet=window.setGlobeMode;
if(typeof baseSet==='function'){
  const premiumSet=function(mode){const r=baseSet.call(this,mode);syncPremiumMode(mode);requestAnimationFrame(()=>window.drawGlobe?.());return r;};
  window.setGlobeMode=premiumSet;
  try{setGlobeMode=premiumSet}catch(_){}
  document.querySelectorAll('[data-globe-mode]').forEach(b=>b.onclick=()=>premiumSet(b.dataset.globeMode));
}

syncPremiumMode(typeof globeMode==='string'?globeMode:'explore');

const obs=new MutationObserver(()=>{
  if(screen.classList.contains('active')){
    ensurePremiumGlobeShell();
    syncPremiumMode(typeof globeMode==='string'?globeMode:'explore');
    requestAnimationFrame(()=>window.drawGlobe?.());
  }
});
obs.observe(screen,{attributes:true,attributeFilter:['class']});

window.addEventListener('resize',()=>{if(screen.classList.contains('active'))requestAnimationFrame(()=>window.drawGlobe?.())});
})();