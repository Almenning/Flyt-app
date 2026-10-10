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

/* Each destination is a small, self-contained storybook place on the same physical map. 
   No heavy image downloads, and scene artwork has no effect on saved learning state. */
function sceneMarkup(action){
 const palettes={
   norwegian:['#c7e9d8','#89bfa6','#4f9277'],
   math:['#e9dbaa','#c5bf89','#80a77c'],
   english:['#e4dcf0','#acb5dc','#83a6aa'],
   geography:['#bddfe9','#8ac0c8','#6ca5a6'],
   globe:['#b8e1ee','#77b9d2','#5f9aa4'],
   words:['#d5e6c7','#9fc49c','#619578'],
   fraction:['#e9d2a9','#d1b686','#bba371'],
   multiply:['#e8d6a5','#ccbd83','#8ca77d']
 };
 const p=palettes[action]||palettes.norwegian;
 const marks={
  norwegian:'<g transform="translate(24 29)"><path d="M0 59L16 9 34 59Z" fill="#447b58"/><path d="M9 42L23 0 44 42Z" fill="#72a478"/><path d="M27 61L47 15 67 61Z" fill="#3c785b"/></g><g transform="translate(103 17)"><path d="M0 54L31 28 64 54V95H0Z" fill="#e5ba76" stroke="#855b39" stroke-width="2"/><path d="M-7 53L31 14 71 53Z" fill="#b95f44" stroke="#7c4d37" stroke-width="3"/><path d="M24 95V64Q31 53 40 64V95" fill="#785b3c"/><rect x="8" y="60" width="12" height="14" rx="2" fill="#9ed2cf"/><rect x="45" y="60" width="12" height="14" rx="2" fill="#9ed2cf"/><path d="M14 62V71M51 62V71" stroke="#fff4dc" stroke-width="1.4"/></g><g transform="translate(178 27)"><path d="M0 65L13 17 30 65Z" fill="#518564"/><path d="M7 46L21 2 39 46Z" fill="#71a77b"/></g><path d="M86 99Q116 82 146 104" fill="none" stroke="#eacb9d" stroke-width="7" stroke-linecap="round"/>',
  math:'<g transform="translate(24 30)"><path d="M0 66L0 20 28 8 53 19 53 66Z" fill="#d7a45c" stroke="#896441" stroke-width="2.5"/><path d="M0 20L28 8 53 19 26 31Z" fill="#f9d99a"/><path d="M26 31V66" stroke="#a47545" stroke-width="2"/><text x="26" y="55" font-size="25" font-weight="900" text-anchor="middle" fill="#684d37">2</text></g><g transform="translate(89 15)"><path d="M0 81V24L27 9 59 25V81Z" fill="#a6bd88" stroke="#648060" stroke-width="3"/><path d="M-4 25L27 9 63 25 30 43Z" fill="#e3deaa"/><path d="M30 43V81" stroke="#799676" stroke-width="2"/><text x="29" y="68" font-size="29" font-weight="900" text-anchor="middle" fill="#4a6559">×</text></g><g transform="translate(162 35)"><path d="M0 61V20L26 8 52 21V61Z" fill="#c68f5b" stroke="#99653d" stroke-width="2.5"/><path d="M0 20L26 8 52 21 26 34Z" fill="#f6cd8d"/><path d="M26 34V61" stroke="#9d6839" stroke-width="2"/><text x="26" y="54" font-size="24" font-weight="900" text-anchor="middle" fill="#fff2cd">3</text></g><path d="M0 104Q42 94 72 102T160 103" stroke="#e8d6ae" stroke-width="8" fill="none"/>',
  english:'<g transform="translate(21 31)"><rect x="2" y="28" width="48" height="49" rx="4" fill="#ffe4b9" stroke="#967254" stroke-width="2"/><path d="M-5 31L25 5 57 31Z" fill="#ad7187" stroke="#85617f" stroke-width="2"/><path d="M19 77V51H33V77" fill="#796a70"/><rect x="7" y="39" width="10" height="12" fill="#96c9ce"/></g><g transform="translate(91 12)"><rect x="0" y="35" width="65" height="64" rx="4" fill="#f5dab0" stroke="#94745d" stroke-width="2.2"/><path d="M-7 37L31 4 72 37Z" fill="#ac6e64" stroke="#845757" stroke-width="2.6"/><rect x="24" y="57" width="17" height="42" rx="3" fill="#6c7c7f"/><rect x="7" y="53" width="11" height="15" fill="#b0d8da"/><rect x="47" y="53" width="10" height="15" fill="#b0d8da"/></g><g transform="translate(167 31)"><rect x="0" y="25" width="51" height="54" rx="3" fill="#e8c69a"/><path d="M-6 28L24 3 57 28Z" fill="#788eab"/><rect x="18" y="45" width="14" height="34" fill="#817364"/></g><path d="M26 107Q113 78 195 108" stroke="#ecddb2" stroke-width="9" fill="none"/><g fill="#fffaf1" stroke="#789eae" stroke-width="1.3"><path d="M140 7Q164-4 184 8Q197 20 180 31L166 37 170 28Q149 31 140 17Z"/></g><text x="163" y="21" font-size="14" text-anchor="middle" font-weight="900" fill="#5f8090">Hi!</text>',
  geography:'<path d="M12 90L66 10 123 90Z" fill="#8aa1a2" stroke="#698a8e" stroke-width="3"/><path d="M58 23L66 10 82 32 71 29 67 36Z" fill="#fdf8df"/><path d="M80 95L137 22 188 95Z" fill="#75969a" stroke="#557f86" stroke-width="3"/><path d="M128 34L137 22 151 42 141 40 137 48Z" fill="#f3f6ef"/><path d="M159 92L198 42 236 92Z" fill="#95adb0"/><path d="M0 102Q49 86 98 99T240 99V110H0Z" fill="#6ca69a"/><g transform="translate(146 36)"><circle cx="29" cy="29" r="27" fill="#f6e0a7" stroke="#91683c" stroke-width="5"/><path d="M29 7L35 27 51 29 32 35 29 51 24 34 8 29 25 24Z" fill="#c36947" stroke="#87563b" stroke-width="1.2"/><circle cx="29" cy="29" r="4" fill="#fff7da"/></g>',
  globe:'<g transform="translate(76 2)"><circle cx="59" cy="57" r="51" fill="#168fb9" stroke="#e8d9a7" stroke-width="6"/><circle cx="59" cy="57" r="42" fill="#45bbd0" opacity=".48"/><path d="M39 12Q16 28 35 45L28 60 40 66 46 94 61 97 68 78 65 62 84 50 73 38 79 21Z" fill="#7fbb83" stroke="#5e9976" stroke-width="1.5"/><path d="M83 64L105 61 98 80 85 91 73 91Z" fill="#edba65"/><path d="M14 50Q61 63 109 48M25 26Q60 42 93 26M29 85Q60 73 90 85" fill="none" stroke="#d4f3dd" stroke-width="1.4" opacity=".6"/></g><path d="M26 92Q43 81 63 84M183 81Q205 77 222 88" fill="none" stroke="#fff1cb" stroke-width="5" stroke-linecap="round"/>',
  words:'<g transform="translate(14 30)"><path d="M0 67L20 0 42 67Z" fill="#4a8969"/><path d="M15 67L39 10 60 67Z" fill="#70a57a"/></g><g transform="translate(80 27)"><path d="M0 65L45 52 84 65V88H0Z" fill="#a87545"/><path d="M0 65L45 48 84 65" fill="none" stroke="#d8aa72" stroke-width="7"/><g font-size="28" font-weight="900" font-family="system-ui,sans-serif" text-anchor="middle"><rect x="9" y="17" width="35" height="39" rx="5" fill="#f9e6b6" stroke="#9b6b42" stroke-width="3"/><text x="27" y="46" fill="#608c7b">A</text><rect x="42" y="27" width="36" height="39" rx="5" fill="#f4d6a2" stroke="#9b6b42" stroke-width="3"/><text x="60" y="55" fill="#a26b49">B</text></g></g><path d="M187 92L201 24 220 92Z" fill="#4c8069"/>',
  fraction:'<g transform="translate(115 54)"><ellipse rx="71" ry="42" cy="32" fill="#966440" opacity=".26"/><ellipse rx="69" ry="48" cy="7" fill="#c99455" stroke="#885f3b" stroke-width="6"/><circle cy="3" r="45" fill="#f4d9a3" stroke="#fff0ce" stroke-width="5"/><path d="M0 3V-42A45 45 0 0 1 45 3Z" fill="#8bb5a6" stroke="#fff7d9" stroke-width="3"/><path d="M0 3H45A45 45 0 0 1 0 48Z" fill="#e6ab76" stroke="#fff7d9" stroke-width="3"/><path d="M0 3V48A45 45 0 0 1 -45 3Z" fill="#d6ce84" stroke="#fff7d9" stroke-width="3"/><path d="M0 3H-45A45 45 0 0 1 0 -42Z" fill="#d39b87" stroke="#fff7d9" stroke-width="3"/><circle cy="3" r="5" fill="#fff2db"/></g>',
  multiply:'<g transform="translate(59 14)"><path d="M0 90L58 103 128 90 67 78Z" fill="#74583e" opacity=".26"/><rect x="0" y="0" width="128" height="89" rx="9" fill="#987044" stroke="#6c4d34" stroke-width="4"/><g fill="#f3d696" stroke="#ac8351" stroke-width="2"><rect x="10" y="8" width="30" height="22" rx="4"/><rect x="49" y="8" width="30" height="22" rx="4"/><rect x="88" y="8" width="30" height="22" rx="4"/><rect x="10" y="35" width="30" height="22" rx="4"/><rect x="49" y="35" width="30" height="22" rx="4"/><rect x="88" y="35" width="30" height="22" rx="4"/><rect x="10" y="62" width="30" height="20" rx="4"/><rect x="49" y="62" width="30" height="20" rx="4"/><rect x="88" y="62" width="30" height="20" rx="4"/></g><g fill="#5a7168" font-size="17" font-weight="900" text-anchor="middle"><text x="25" y="26">2</text><text x="64" y="26">4</text><text x="103" y="26">6</text><text x="25" y="53">3</text><text x="64" y="53">6</text><text x="103" y="53">9</text><text x="25" y="79">4</text><text x="64" y="79">8</text><text x="103" y="79">12</text></g></g>'
 };
 const ground='<path d="M0 80Q55 46 102 72T240 58V110H0Z" fill="'+p[1]+'"/><path d="M0 91Q67 80 117 96T240 89V110H0Z" fill="'+p[2]+'"/><path d="M0 103Q70 89 135 105T240 104V110H0Z" fill="rgba(33,81,67,.19)"/>';
 return '<span class="bc13-scene" aria-hidden="true"><svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice" focusable="false" role="presentation"><rect width="240" height="110" fill="'+p[0]+'"/><circle cx="200" cy="19" r="17" fill="#fff4be" opacity=".72"/><path d="M-5 47Q24 32 58 43T123 41T242 37" fill="none" stroke="#fff8de" stroke-width="9" stroke-linecap="round" opacity=".30"/>'+ground+(marks[action]||'')+'</svg></span>';
}

let panelMode='home';
function host(){return document.querySelector('#home-screen .bc12')}
function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pct(subject){
 try{const grade=currentGrade();return Math.max(0,Math.min(100,Number((subject==='geography'?geoJourneyProgress(grade):journeyProgress(subject,grade)).pct)||0))}catch(_){return 0}
}
function panelMarkup(mode){
 const journey=mode==='travel';
 const cards=journey
  ?SUBJECTS.map(([key,name,world,description,icon])=>({action:key,title:name,subtitle:world,description,icon,progress:pct(key)}))
  :EXPLORE.map(([action,title,description,icon])=>({action,title,subtitle:'Fri utforsking',description,icon}));
 const trail='<svg class="bc13-map-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M25 25Q48 5 70 27T75 73Q52 98 26 75" fill="none" stroke="#977045" stroke-width="1.1" stroke-dasharray="2 3" opacity=".65"/><path d="M25 25Q48 5 70 27T75 73Q52 98 26 75" fill="none" stroke="#fff5d8" stroke-width=".3" stroke-dasharray="2 3"/></svg>';
 return '<button type="button" class="bc13-close" data-bc13-action="home" aria-label="Tilbake til Hjem">←<span>Hjem</span></button>'+
 '<div class="bc13-panel-head"><span class="bc13-kicker">'+(journey?'LÆRINGSREISENE':'FRI UTFORSKING')+'</span><h2 id="bc13-panel-title">'+(journey?'Velg en eventyrverden':'Hva vil du utforske?')+'</h2><p>'+(journey?'Fire verdener å besøke. Du velger veien.':'Lek, oppdag og prøv igjen så ofte du vil.')+'</p></div>'+
 '<div class="bc13-card-grid">'+trail+cards.map(card=>'<button type="button" class="bc13-card" data-bc13-action="'+escapeText(card.action)+'" aria-label="'+escapeText(card.title)+'. '+escapeText(card.subtitle)+'. '+escapeText(card.description)+'">'+sceneMarkup(card.action)+'<span class="bc13-card-copy"><strong>'+escapeText(card.title)+'</strong><span class="bc13-card-world">'+escapeText(card.subtitle)+'</span><small>'+escapeText(card.description)+'</small>'+(journey?'<span class="bc13-progress" aria-label="'+card.progress+' prosent fullført"><i style="width:'+card.progress+'%"></i></span>':'')+'<span class="bc13-chevron" aria-hidden="true">›</span></span></button>').join('')+'</div>'+
 '<p class="bc13-footnote">'+(journey?'Du kan alltid besøke favorittstedene dine igjen.':'Alt er åpent, også det du allerede mestrer.')+'</p>';
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
 if(action==='home'){activate('home');return;}
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
}
function init(){
 if(typeof window.renderAll!=='function')return;
 const previous=window.renderAll;
 window.renderAll=function(){const result=previous.apply(this,arguments);bind();const root=host();if(root&&root.dataset.bc13View!=='home'&&panelMode!=='home')activate(panelMode);return result};
 bind();activate('home');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
