(()=>{'use strict';
const screen=document.getElementById('world-screen');if(!screen)return;
const bar=document.getElementById('globe-mode');if(!bar)return;

const classicIcon='<span class="pg-mode-icon" aria-hidden="true">◎</span>';
function ensureClassicButton(){
  let btn=bar.querySelector('[data-globe-mode="classic"]');
  if(!btn){
    btn=document.createElement('button');
    btn.type='button';
    btn.dataset.globeMode='classic';
    btn.innerHTML=classicIcon+'Kloden';
    btn.setAttribute('aria-label','Åpne den klassiske interaktive kloden');
    bar.appendChild(btn);
  }
  return btn;
}
ensureClassicButton();

const inheritedSet=window.setGlobeMode;
function syncChrome(mode){
  const next=mode==='classic'?'classic':(mode==='mine'?'mine':'explore');
  screen.dataset.premiumGlobeMode=next;
  bar.querySelectorAll('[data-globe-mode]').forEach(b=>b.classList.toggle('active',b.dataset.globeMode===next));
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
function classicEmptyStatus(){
  const box=document.getElementById('globe-status');if(!box)return;
  box.classList.remove('premium-country-selected');
  box.style.cursor='default';box.onclick=null;
  box.innerHTML='<div class="flag">🌍</div><div class="globe-country-copy"><div class="globe-country-line"><strong>Kloden</strong></div><span>Dra for å snurre · trykk på et land for å lære mer.</span></div>';
}
function setMode(mode){
  const next=mode==='classic'?'classic':(mode==='mine'?'mine':'explore');
  if(next!=='classic'){
    const result=typeof inheritedSet==='function'?inheritedSet.call(this,next):undefined;
    syncChrome(next);
    requestAnimationFrame(()=>window.drawGlobe?.());
    return result;
  }
  try{globeMode='classic'}catch(_){}
  syncChrome('classic');
  try{
    if(typeof globeSelected==='string'&&globeSelected&&typeof selectGlobeCountry==='function')selectGlobeCountry(globeSelected);
    else classicEmptyStatus();
  }catch(_){classicEmptyStatus()}
  requestAnimationFrame(()=>{
    try{if(typeof resizeGlobe==='function')resizeGlobe()}catch(_){}
    requestAnimationFrame(()=>window.drawGlobe?.());
  });
}
window.setGlobeMode=setMode;
try{setGlobeMode=setMode}catch(_){}

function bind(){
  ensureClassicButton();
  bar.querySelectorAll('[data-globe-mode]').forEach(btn=>{btn.onclick=()=>setMode(btn.dataset.globeMode)});
}
bind();

const obs=new MutationObserver(()=>{
  if(!screen.classList.contains('active'))return;
  bind();
  let current='explore';
  try{current=typeof globeMode==='string'?globeMode:'explore'}catch(_){}
  syncChrome(current);
  requestAnimationFrame(()=>window.drawGlobe?.());
});
obs.observe(screen,{attributes:true,attributeFilter:['class']});
})();