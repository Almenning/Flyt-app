/* Læria navigation v13: a clear separation between journeys and free exploration. */
(()=>{'use strict';
const SUBJECTS=[
 ['norwegian','Norsk','Bokskogen','Les, bygg ord og oppdag historier','📖'],
 ['math','Matte','Tallenga','Tall, mønstre og oppdrag','✦'],
 ['english','Engelsk','Ordlandsbyen','Ord, setninger og nye oppdagelser','💬'],
 ['geography','Geografi','Nordlysleiren','Land, flagg og kart','🧭']
];
const EXPLORE=[
 ['globe','Kloden','Snurr og oppdag land','🌍'],
 ['words','Ordjakt','Finn ord i Bokskogen','🔤'],
 ['fraction','Brøklab','Del og bygg brøker','◒'],
 ['multiply','Gangetabell','Utforsk tallmønstre','✕']
];
let panelMode='home';
function host(){return document.querySelector('#home-screen .bc12')}
function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pct(subject){
 try{const grade=currentGrade();return Math.max(0,Math.min(100,Number((subject==='geography'?geoJourneyProgress(grade):journeyProgress(subject,grade)).pct)||0))}catch(_){return 0}
}
function panelMarkup(mode){
 const journey=mode==='travel';
 const cards=journey?SUBJECTS.map(([key,name,world,description,icon])=>({action:key,title:name,subtitle:world,description,icon,progress:pct(key)})):
 EXPLORE.map(([action,title,description,icon])=>({action,title,subtitle:'Fri utforsking',description,icon}));
 return '<div class="bc13-panel-head"><span class="bc13-kicker">'+(journey?'LÆRINGSREISENE':'LEK OG UTFORSK')+'</span><h2 id="bc13-panel-title">'+(journey?'Velg en verden':'Hva vil du utforske?')+'</h2><p>'+(journey?'Fire fag. Fire eventyrverdener. Reis videre når du vil.':'Du kan leke, undersøke og prøve igjen så ofte du vil.')+'</p></div>'+
 '<div class="bc13-card-grid">'+cards.map(card=>'<button type="button" class="bc13-card" data-bc13-action="'+escapeText(card.action)+'"><span class="bc13-card-icon" aria-hidden="true">'+card.icon+'</span><span class="bc13-card-copy"><strong>'+escapeText(card.title)+'</strong><span class="bc13-card-world">'+escapeText(card.subtitle)+'</span><small>'+escapeText(card.description)+'</small>'+(journey?'<span class="bc13-progress" aria-label="'+card.progress+' prosent fullført"><i style="width:'+card.progress+'%"></i></span>':'')+'</span><span class="bc13-chevron" aria-hidden="true">›</span></button>').join('')+'</div>'+
 '<p class="bc13-footnote">'+(journey?'Du kan alltid besøke et sted på nytt.':'Det du liker å gjøre, er alltid tilgjengelig.')+'</p>';
}
function activate(mode){
 const root=host();if(!root)return;
 panelMode=mode;
 let panel=root.querySelector('.bc13-panel');
 if(!panel){panel=document.createElement('section');panel.className='bc13-panel';panel.setAttribute('aria-labelledby','bc13-panel-title');root.appendChild(panel);}
 if(mode==='home'){panel.hidden=true;root.dataset.bc13View='home';}
 else{panel.hidden=false;panel.innerHTML=panelMarkup(mode);root.dataset.bc13View=mode;}
 root.querySelectorAll('.bc12-nav button').forEach(button=>{
   if(button.dataset.camp===mode)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
 });
}
function openSubjectJourney(subject){
 if(subject==='geography'){if(typeof renderGeographyContinue==='function')renderGeographyContinue();showScreen('geography');}
 else if(typeof openSubject==='function')openSubject(subject);
}
function clickAction(action){
 if(SUBJECTS.some(x=>x[0]===action)){window.LARIA_MARK_BASECAMP_ORIGIN?.();openSubjectJourney(action);return;}
 const target=host()?.querySelector('.bc12-place[data-camp="'+action+'"]');
 if(target){target.click();return;}
}
function bind(){
 const root=host();if(!root||root.dataset.bc13Bound==='true')return;
 root.dataset.bc13Bound='true';
 root.addEventListener('click',event=>{
   const nav=event.target.closest?.('.bc12-nav [data-camp]');
   if(nav&&['travel','explore','home'].includes(nav.dataset.camp)){
     event.preventDefault();event.stopImmediatePropagation();
     if(nav.dataset.camp==='home'){if(typeof setTab==='function')setTab('home');activate('home')}
     else activate(nav.dataset.camp);
     return;
   }
   const chosen=event.target.closest?.('[data-bc13-action]');
   if(chosen&&root.contains(chosen)){
     event.preventDefault();event.stopImmediatePropagation();clickAction(chosen.dataset.bc13Action);
   }
 },true);
 root.querySelector('.bc12-journey')?.insertAdjacentHTML('afterend','<button type="button" class="bc13-choose-journey" data-bc13-open-journeys>Velg fag og reisekart <span aria-hidden="true">›</span></button>');
 root.addEventListener('click',event=>{
   if(event.target.closest?.('[data-bc13-open-journeys]')){event.preventDefault();activate('travel')}
 },true);
}
function init(){
 if(typeof window.renderAll!=='function')return;
 const previous=window.renderAll;
 window.renderAll=function(){const result=previous.apply(this,arguments);bind();const root=host();if(root&&root.dataset.bc13View!=='home'&&panelMode!=='home')activate(panelMode);return result};
 bind();activate('home');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
