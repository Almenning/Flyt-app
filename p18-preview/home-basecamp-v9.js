(()=>{'use strict';
const PLACE_NAME={
  lyder:'Bokstavporten',ordbilder:'Lesestua',ordlek:'Rimdammen',
  'ordstart-checkpoint':'Skogsporten',setningsrekkefolge:'Ordbrua',
  ordbetydning:'Ordhagen','setninger-checkpoint':'Ordhagen',
  detaljer:'Biblioteket',forsta:'Biblioteket',tenkvidere:'Biblioteket','lesedetektiv-checkpoint':'Biblioteket'
};
function young(){try{return currentGrade()<=2}catch(_){return false}}
function journeySubject(){
  const active=state?.activeSession?.scope?.subject;
  if(active)return active==='geography'?'geography':active;
  const last=state?.lastActivity?.subject;
  return ['norwegian','math','english','geography'].includes(last)?last:'norwegian';
}
function nextJourney(){
  const subject=journeySubject();
  if(state?.activeSession?.scope){
    return {subject,title:state.activeSession.scope.label||'Oppdraget ditt',active:true};
  }
  try{
    const node=subject==='geography'?geoJourneyRecommendedNode(currentGrade()):journeyRecommendedNode(subject,currentGrade());
    const title=subject==='norwegian'?(PLACE_NAME[node?.id]||node?.title||'Bokskogen'):(node?.title||({math:'Tallriket',english:'Ordlandsbyen',geography:'Oppdagelsesriket'}[subject]));
    return {subject,title,active:false};
  }catch(_){return {subject:'norwegian',title:'Bokskogen',active:false}}
}
function travel(){
  const info=nextJourney();
  if(state?.activeSession){startSession();return}
  if(info.subject==='geography'){showScreen('geography');return}
  openSubject(info.subject||'norwegian');
}
function globe(){
  showScreen('world');
  requestAnimationFrame(()=>{try{globeMode='explore';setGlobeMode('explore')}catch(_){}});
}
function fraction(){if(typeof window.openFractionLab==='function')window.openFractionLab();else{openSubject('math')}}
function multiply(){if(typeof window.openMultiplicationLab==='function')window.openMultiplicationLab();else{openSubject('math')}}
function words(){openSubject('norwegian')}
function quest(){
  try{const r=recommendedStarter();if(r&&typeof r.action==='function'){r.action();return}}catch(_){}
  travel();
}
function collection(){try{setTab('progress')}catch(_){}}
function pulseExplore(){
  const host=document.querySelector('.laria-basecamp-v9');if(!host)return;
  host.classList.remove('bc-v9-pulse');void host.offsetWidth;host.classList.add('bc-v9-pulse');
  host.querySelector('.bc-v9-dest.globe')?.focus({preventScroll:true});
}
function markup(){
  return '<section class="laria-basecamp-v9" aria-label="Læria basecamp">'+
    '<div class="bc-v9-logo">Læria<i>✦</i></div>'+
    '<div class="bc-v9-title"><small>Hei 👋</small><h1>Hvor skal vi dra i dag?</h1><p>Reven er klar! Fortsett reisen, eller bli værende og lek med noe du liker.</p></div>'+
    '<button class="bc-v9-travel" type="button" data-bc-action="travel" aria-label="Fortsett reisen"><span class="plank">FORTSETT REISEN <b>→</b></span><span class="next">Neste:<strong data-bc-next>Et nytt sted</strong></span></button>'+
    '<img class="bc-v9-fox" src="./lia-fox-explorer.webp?v=fox1" alt="Reven med ryggsekk peker videre på reisen" draggable="false">'+
    '<div class="bc-v9-explore-label"><span>🧭</span>Lek & utforsk</div>'+
    '<button class="bc-v9-dest globe" type="button" data-bc-action="globe"><span class="dest-icon">🌍</span><span class="dest-sign">Kloden</span></button>'+
    '<button class="bc-v9-dest fraction" type="button" data-bc-action="fraction"><span class="dest-icon">🍕</span><span class="dest-sign">Brøklab</span></button>'+
    '<button class="bc-v9-dest words" type="button" data-bc-action="words"><span class="dest-icon">🔤</span><span class="dest-sign">Ordjakt</span></button>'+
    '<button class="bc-v9-dest multiply" type="button" data-bc-action="multiply"><span class="dest-icon">✖️</span><span class="dest-sign">Gangetabell</span></button>'+
    '<button class="bc-v9-quest" type="button" data-bc-action="quest"><strong>Reven har et oppdrag!</strong><span>En liten frivillig utfordring venter.</span></button>'+
    '<button class="bc-v9-collection" type="button" data-bc-action="collection"><strong>Samlingen</strong><span>Se stjerner, funn og steder.</span></button>'+
    '<nav class="bc-v9-nav" aria-label="Læria hovedmeny">'+
      '<button type="button" class="active" data-bc-action="home"><span>🏠</span>Hjem</button>'+
      '<button type="button" data-bc-action="travel"><span>🗺️</span>Reisen</button>'+
      '<button type="button" data-bc-action="explore"><span>🧭</span>Utforsk</button>'+
      '<button type="button" data-bc-action="collection"><span>🎒</span>Samlingen</button>'+
    '</nav>'+
  '</section>';
}
function bind(host){
  const actions={home:()=>{},travel,globe,fraction,multiply,words,quest,collection,explore:pulseExplore};
  host.querySelectorAll('[data-bc-action]').forEach(b=>b.addEventListener('click',()=>actions[b.dataset.bcAction]?.()));
}
function render(){
  const screen=document.getElementById('home-screen');if(!screen)return;
  let host=screen.querySelector('.laria-basecamp-v9');
  if(!host){screen.insertAdjacentHTML('afterbegin',markup());host=screen.querySelector('.laria-basecamp-v9');bind(host)}
  host.hidden=!young();
  if(!young())return;
  const info=nextJourney();
  const next=host.querySelector('[data-bc-next]');if(next)next.textContent=info.active?'Fortsett '+info.title:info.title;
  const travelBtn=host.querySelector('[data-bc-action="travel"]');
  if(travelBtn)travelBtn.setAttribute('aria-label',(info.active?'Fortsett ':'Neste sted: ')+info.title);
}
const previous=window.renderAll;
if(typeof previous==='function')window.renderAll=function(){const result=previous.apply(this,arguments);render();return result};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
const obs=new MutationObserver(()=>{if(document.getElementById('home-screen')?.classList.contains('active'))render()});
const app=document.querySelector('.app');if(app)obs.observe(app,{attributes:true,attributeFilter:['class']});
})();