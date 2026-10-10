/* Hjem v12: premium basecamp + real free-play Ordjakt. Presentation and entry points only; learning state remains owned by the app. Learning state is owned by the app. */
(()=>{'use strict';
window.LARIA_BASECAMP_DIAG={loaded:true,init:false,render:false,error:null};
const PLACES={lyder:'Bokstavporten',ordbilder:'Lesestua',ordlek:'Rimdammen','ordstart-checkpoint':'Skogsporten',setningsrekkefolge:'Ordbrua',ordbetydning:'Ordhagen','setninger-checkpoint':'Ordhagen',detaljer:'Biblioteket',forsta:'Biblioteket',tenkvidere:'Biblioteket','lesedetektiv-checkpoint':'Biblioteket'};
const svg=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+paths+'</svg>';
const icons={home:svg('<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>'),travel:svg('<path d="m3 5 6-2 6 3 6-2v16l-6 2-6-3-6 2ZM9 3v16m6-13v16"/>'),explore:svg('<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>'),collection:svg('<path d="M5 9a7 7 0 0 1 14 0v12H5ZM9 3V1h6v2M8 14h8v5H8ZM5 10h14"/>')};
let mode='home',fromCamp=false,returnFocus=null;
const QUESTS=[
 {action:'words',eyebrow:'Et lite eventyr, hvis du vil',title:'Ord har gjemt seg i Bokskogen',copy:'Reven har sett ord mellom bokstavene. Hvor mange klarer du å finne?',button:'Start Ordjakt →'},
 {action:'globe',eyebrow:'Et lite eventyr, hvis du vil',title:'Finn et nytt sted på Kloden',copy:'Reven lurer på om du kan oppdage et land du ikke har besøkt før.',button:'Åpne Kloden →'},
 {action:'fraction',eyebrow:'Et lite eventyr, hvis du vil',title:'Kan du dele noe rettferdig?',copy:'Gå inn i Brøklab og bygg en brøk på din egen måte.',button:'Til Brøklab →'},
 {action:'multiply',eyebrow:'Et lite eventyr, hvis du vil',title:'Finn et mønster i tallene',copy:'Lek med gangetabellen og se om du oppdager et mønster reven ikke har sett.',button:'Lek med tall →'}
];
function dailyQuest(){const d=new Date(),seed=d.getFullYear()*400+d.getMonth()*31+d.getDate()+Number(currentGrade()||0);return QUESTS[seed%QUESTS.length]}
function wordHuntRounds(){try{return Number(JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}').rounds||0)}catch(_){return 0}}
const young=()=>currentGrade()<=2;
function selectedFoxSource(which){
 // Profile portraits are intentionally not used as scene art: some include a baked rectangular background.
 // Keep the saved avatar choice, but render the dedicated transparent/in-world explorer mascot in Basecamp.
 return './lia-fox-explorer.webp';
}
function activitySubject(scope,last){
 if(scope?.subject==='geography'||String(scope?.type||'').startsWith('geo')||['country','collection','world','grade','geography-theme'].includes(scope?.type))return 'geography';
 if(['norwegian','math','english'].includes(scope?.subject))return scope.subject;
 if(last?.subject==='geography'||String(last?.kind||'').startsWith('geo'))return 'geography';
 if(['norwegian','math','english'].includes(last?.subject))return last.subject;
 return 'norwegian';
}
function next(){
 const active=state.activeSession?.scope;
 const subject=activitySubject(active,state.lastActivity);
 const grade=Number(active?.journeyGrade||active?.grade||state.lastActivity?.grade||currentGrade());
 const progress=subject==='geography'?geoJourneyProgress(grade):journeyProgress(subject,grade);
 const node=subject==='geography'?geoJourneyRecommendedNode(grade):journeyRecommendedNode(subject,grade);
 return {subject,grade,title:active?.label||(subject==='norwegian'?PLACES[node?.id]:null)||node?.title||'Bokskogen',active:!!active,pct:Number(progress?.pct||0),complete:!!progress?.complete};
}
       
function journeyCopy(info){
 if(info?.active)return 'Du har allerede startet. Reisen fortsetter der du slapp.';
 if(info?.subject==='geography')return 'Et nytt sted i verden venter.';
 if(info?.subject==='math')return 'Tall, mønstre og neste utfordring venter.';
 if(info?.subject==='english')return 'Nye ord og et nytt oppdrag venter.';
 return 'Bokskogen har et nytt oppdrag til deg.';
}
function home(view='home'){mode=view;setTab('home');render();}
window.LARIA_MARK_BASECAMP_ORIGIN=()=>{fromCamp=true};
window.LARIA_RETURN_TO_BASECAMP=()=>{
 if(!young()||!fromCamp)return false;
 fromCamp=false;home(mode);return true;
};
function travel(){
 const info=next();fromCamp=true;
 if(info.active){startSession();return}
 if(info.complete){
  if(info.subject==='geography'){renderGeographyContinue();showScreen('geography')}
  else openSubject(info.subject);
  return;
 }
 if(info.subject==='geography'){
  const node=geoJourneyRecommendedNode(info.grade);
  if(node){startGeoJourneyNode(node.id,info.grade);return}
  renderGeographyContinue();showScreen('geography');return;
 }
 const node=journeyRecommendedNode(info.subject,info.grade);
 if(node){startJourneyNode(info.subject,node.id,info.grade);return}
 openSubject(info.subject);
}
function activity(name){
 fromCamp=true;
 if(name==='globe'){if(typeof window.openGlobe==='function')window.openGlobe('classic');else{showScreen('world');requestAnimationFrame(()=>setGlobeMode('classic'));}}
 else if(name==='fraction')window.openFractionLab();
 else if(name==='multiply')window.openMultiplicationLab();
 else if(name==='words'){if(typeof window.openWordHunt==='function')window.openWordHunt();else openSubject('norwegian');}
}
function closeDialog(){const d=document.getElementById('bc12-dialog');if(d?.open)d.close();returnFocus?.focus();}
function dialog(kind){
 const d=document.getElementById('bc12-dialog');returnFocus=document.activeElement;
 if(kind==='quest'){const q=dailyQuest();d.dataset.questAction=q.action;d.innerHTML='<button class="bc12-close" aria-label="Lukk">×</button><span class="bc12-eyebrow">'+q.eyebrow+'</span><h2 id="bc12-dialog-title">'+q.title+'</h2><p>'+q.copy+'</p><button class="bc12-dialog-go" data-quest-go>'+q.button+'</button><button class="bc12-later">Kanskje senere</button>';}
 else {
  const visited=Object.values(state.journey?.nodes||{}).filter(n=>n.passed||Number(n.attempts)>0).length;
  const trophies=Object.keys(state.journey?.gradeWins||{}).length,wordRounds=wordHuntRounds();
  d.innerHTML='<button class="bc12-close" aria-label="Lukk">×</button><span class="bc12-eyebrow">Min eventyrsekk</span><h2 id="bc12-dialog-title">Samlingen din</h2><div class="bc12-shelf"><div><span aria-hidden="true">✦</span><strong>'+visited+'</strong><small>steder besøkt</small></div><div><span aria-hidden="true">🔤</span><strong>'+wordRounds+'</strong><small>ordjakter</small></div><div><span aria-hidden="true">♜</span><strong>'+trophies+'</strong><small>eventyr fullført</small></div></div><p>'+(visited||wordRounds?'Her ligger sporene etter det du har utforsket. Ingenting forsvinner fordi du blir flinkere.':'Ryggsekken er klar. Her samler vi sporene fra eventyrene dine.')+'</p><button class="bc12-dialog-go" data-dialog-home>Tilbake til basecamp</button>';
 }
 d.querySelector('.bc12-close').onclick=closeDialog;d.querySelector('.bc12-later')?.addEventListener('click',closeDialog);
 d.querySelector('[data-quest-go]')?.addEventListener('click',()=>{const action=d.dataset.questAction||'words';closeDialog();activity(action)});
 d.querySelector('[data-dialog-home]')?.addEventListener('click',()=>{closeDialog();home()});
 d.showModal();
}
const SUBJECT_ART={"norwegian":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><path d=\"M29 15Q18 9 7 13v31q12-4 22 3 10-7 23-3V13Q40 9 29 15Z\" fill=\"#f8e5b7\" stroke=\"#704c2e\" stroke-width=\"3\"/><path d=\"M29 15v32M12 20q8-2 13 1m-13 6q8-2 13 1m10-7q6-3 12-1m-12 8q6-3 12-1\" stroke=\"#9e7147\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M7 45q12-4 22 3 10-7 23-3\" stroke=\"#d2a970\" stroke-width=\"3\" fill=\"none\"/></svg>","math":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><rect x=\"8\" y=\"25\" width=\"25\" height=\"25\" rx=\"5\" fill=\"#f7c06e\" stroke=\"#9f6239\" stroke-width=\"3\"/><path d=\"M8 29l12-8 13 5v24H8Z\" fill=\"#e7aa5e\" stroke=\"#9f6239\" stroke-width=\"2\"/><text x=\"20\" y=\"44\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"900\" fill=\"#754122\">2</text><rect x=\"32\" y=\"10\" width=\"21\" height=\"29\" rx=\"4\" fill=\"#a5d4bf\" stroke=\"#4a8778\" stroke-width=\"3\"/><text x=\"42.5\" y=\"31\" text-anchor=\"middle\" font-size=\"17\" font-weight=\"900\" fill=\"#376453\">3</text></svg>","english":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><path d=\"M8 10h44v30H32L22 50v-10H8Z\" fill=\"#fff1c9\" stroke=\"#895b3d\" stroke-width=\"3\" stroke-linejoin=\"round\"/><text x=\"30\" y=\"31\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"900\" fill=\"#547f91\">Hi!</text><path d=\"M37 8l13 7\" stroke=\"#d48569\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>","geography":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><circle cx=\"30\" cy=\"28\" r=\"21\" fill=\"#82cee0\" stroke=\"#497b82\" stroke-width=\"3\"/><path d=\"M17 11l8 5 1 8 7 4-5 11-7 6-2-14-10-9Zm23 1-6 8 8 7-2 9 7 2 3-16Z\" fill=\"#88b98b\" stroke=\"#598d74\" stroke-width=\"1\"/><path d=\"M8 49h44M30 50v5\" stroke=\"#97683e\" stroke-width=\"4\" stroke-linecap=\"round\"/><ellipse cx=\"30\" cy=\"28\" rx=\"10\" ry=\"21\" stroke=\"#fff4d4\" stroke-width=\"1.3\" opacity=\".55\" fill=\"none\"/></svg>"};

/* Four small, original illustrations. The large chapter art is loaded only
   after the child actually chooses a subject, never on Home's critical path. */
const SUBJECT_SCENES={
 norwegian:'<g transform="translate(20 24)"><path d="M8 99L18 30 35 10 56 29 63 99Z" fill="#528663" stroke="#3f6f59" stroke-width="3"/><path d="M0 72L16 15 34 72Z" fill="#3d775b"/><path d="M15 65L35 3 58 65Z" fill="#80a977"/><path d="M14 41L35 3 48 32" stroke="#c4d59b" stroke-width="3" fill="none"/><path d="M83 100V50L121 20 157 48V100Z" fill="#eac592" stroke="#936440" stroke-width="3"/><path d="M73 52L120 6 169 52Z" fill="#b7664f" stroke="#8f4d3a" stroke-width="3"/><path d="M110 99V66Q121 53 132 66V99Z" fill="#825f4d"/><rect x="90" y="56" width="15" height="19" rx="3" fill="#9ed6d2" stroke="#a1774e" stroke-width="2"/><rect x="139" y="56" width="14" height="19" rx="3" fill="#9ed6d2" stroke="#a1774e" stroke-width="2"/><path d="M-10 103Q80 73 180 106" stroke="#edd7a3" stroke-width="15" fill="none"/><g fill="#fff4ba"><circle cx="72" cy="79" r="3"/><circle cx="169" cy="87" r="3"/></g></g>',
 math:'<g transform="translate(23 35)"><path d="M0 89L33 38 68 89Z" fill="#7eaa8b"/><path d="M58 93V23L110 5 158 25V93Z" fill="#b47f50" stroke="#865839" stroke-width="3"/><path d="M58 26L110 5 158 25 110 43Z" fill="#ebc189" stroke="#96653b" stroke-width="2"/><path d="M110 43V93" stroke="#895d3a" stroke-width="3"/><g fill="#eed49b" stroke="#986942" stroke-width="2"><rect x="67" y="49" width="34" height="31" rx="5"/><rect x="116" y="49" width="34" height="31" rx="5"/></g><g fill="#58786d" font-size="25" font-weight="1000" text-anchor="middle"><text x="84" y="73">2</text><text x="133" y="73">4</text></g><g transform="translate(187 67)"><circle r="27" fill="#a57848" stroke="#65482f" stroke-width="5"/><circle r="17" fill="#d8b679" stroke="#8a663d" stroke-width="3"/><path d="M-25 0H25M0-25V25M-18-18L18 18M-18 18L18-18" stroke="#735239" stroke-width="4"/><circle r="5" fill="#f3da9e"/></g></g>',
 english:'<g transform="translate(17 22)"><rect x="5" y="54" width="54" height="59" rx="3" fill="#f5d5aa" stroke="#ad7c61" stroke-width="2"/><path d="M0 55L31 17 65 55Z" fill="#b67e83" stroke="#815b66" stroke-width="3"/><path d="M24 113V81H40V113" fill="#7c686e"/><rect x="9" y="69" width="12" height="16" fill="#a2d9cf"/><g transform="translate(77 2)"><rect x="0" y="53" width="75" height="88" rx="3" fill="#edc799" stroke="#986a51" stroke-width="3"/><path d="M-9 55L38 7 87 55Z" fill="#a66c62" stroke="#80534b" stroke-width="3"/><path d="M28 141V91Q37 79 47 91V141" fill="#7a777c"/><rect x="9" y="73" width="14" height="20" fill="#9acdd8"/><rect x="54" y="73" width="14" height="20" fill="#9acdd8"/><path d="M38 7V-8" stroke="#8f6558" stroke-width="2"/><path d="M39-8h31v16H39Z" fill="#83b1c5"/></g><g transform="translate(176 43)"><path d="M0 70V20L23 1 50 20V70Z" fill="#f5d8ac"/><path d="M-4 20L23-5 54 20Z" fill="#8494b2"/><rect x="18" y="40" width="14" height="30" fill="#9b7c77"/></g><path d="M0 122Q128 100 260 120" stroke="#ebd3a2" stroke-width="10" fill="none"/></g>',
 geography:'<g><path d="M0 111L59 21 116 111Z" fill="#8ba1ad" stroke="#638796" stroke-width="3"/><path d="M44 46L59 21 76 48 64 42 59 56Z" fill="#f9f4e4"/><path d="M72 113L151 6 228 113Z" fill="#6f929e" stroke="#587a87" stroke-width="3"/><path d="M136 27L151 6 168 32 156 25 150 42Z" fill="#faf7ea"/><path d="M170 115L240 32 286 115Z" fill="#9eb3b8"/><path d="M0 117Q90 97 160 119T280 112V145H0Z" fill="#6caa93"/><g transform="translate(172 50)"><rect x="28" y="50" width="49" height="50" rx="4" fill="#dab783" stroke="#876344" stroke-width="3"/><path d="M22 52L52 18 84 52Z" fill="#a66d52" stroke="#795039" stroke-width="3"/><circle cx="52" cy="12" r="26" fill="#78c0cf" stroke="#e7d4a3" stroke-width="5"/><path d="M42-9L58-5 61 7 48 12 42 23 30 14 32-1Z" fill="#80b691"/><ellipse cx="52" cy="12" rx="11" ry="26" stroke="#d8efe0" stroke-width="1.5" fill="none"/><path d="M52-14V38M26 12H78" stroke="#d6ece1" stroke-width="1.5"/></g></g>'
};
function subjectScene(subject){
 const colors={
 norwegian:['#b6e2d8','#80b7a2','#3c785e'],
 math:['#f5dfaa','#bebc81','#8faa7b'],
 english:['#d3d8e8','#a6a7c3','#88a9a6'],
 geography:['#bde7ef','#85bec4','#6ca2a2']
 }[subject]||['#c9dfd6','#a5c5ad','#78a18d'];
 const id='bc14-'+subject;
 return '<svg viewBox="0 0 280 145" preserveAspectRatio="xMidYMid slice" role="presentation" focusable="false" aria-hidden="true">'+
 '<defs><linearGradient id="'+id+'-sky" x2="0" y2="1"><stop stop-color="'+colors[0]+'"/><stop offset="1" stop-color="#f4edc8"/></linearGradient><linearGradient id="'+id+'-grass" x2="0" y2="1"><stop stop-color="'+colors[1]+'"/><stop offset="1" stop-color="'+colors[2]+'"/></linearGradient></defs>'+
 '<rect width="280" height="145" fill="url(#'+id+'-sky)"/><circle cx="230" cy="26" r="23" fill="#fff0b6" opacity=".83"/>'+
 '<path d="M0 102L59 40 97 75 146 24 213 96 257 47 280 90V145H0Z" fill="#f9f2de" opacity=".76"/>'+
 '<path d="M0 110Q57 73 114 102T280 95V145H0Z" fill="'+colors[1]+'"/>'+
 '<path d="M0 131Q55 97 111 123T280 115V145H0Z" fill="url(#'+id+'-grass)"/>'+
 (SUBJECT_SCENES[subject]||'')+'</svg>';
}
function subjectHomeCard(subject,label,world){
 return '<button type="button" class="bc14-subject bc14-'+subject+'" data-camp="subject-'+subject+'" aria-label="Åpne '+label+', '+world+'">'+
 '<span class="bc14-subject-scene" aria-hidden="true">'+subjectScene(subject)+'<img loading="lazy" decoding="async" fetchpriority="low" src="./home-'+subject+'-v14.webp?v=20261010-scene1" alt=""><span class="bc14-vignette"></span><span class="bc14-emblem">'+SUBJECT_ART[subject]+'</span></span>'+
 '<span class="bc14-subject-copy"><strong>'+label+'</strong><small>'+world+'</small><span class="bc14-entry">Utforsk <b aria-hidden="true">›</b></span></span></button>';
}
function homeSubjects(){return '<div class="bc14-subjects" role="group" aria-label="Velg et fag">'+
 subjectHomeCard('norwegian','Norsk','Bokskogen')+
 subjectHomeCard('math','Matte','Tallenga')+
 subjectHomeCard('english','Engelsk','Ordlandsbyen')+
 subjectHomeCard('geography','Geografi','Nordlysleiren')+'</div>';}
function openHomeSubject(subject){
 if(!['norwegian','math','english','geography'].includes(subject))return;
 fromCamp=true;
 if(subject==='geography'){
  if(typeof renderGeographyContinue==='function')renderGeographyContinue();
  showScreen('geography');
 }else if(typeof openSubject==='function')openSubject(subject);
}
function destination(action,label,description){return '<button class="bc12-place bc12-'+action+'" data-camp="'+action+'" aria-label="'+label+' – '+description+'"><span class="bc12-place-glow" aria-hidden="true"></span><span class="bc12-sign">'+label+'</span><span class="bc12-place-hint">'+description+'</span></button>';}
function markup(){return '<section class="bc12" data-release="basecamp-rc1" aria-label="Læria basecamp">'+
 '<div class="bc12-landscape" aria-hidden="true"></div><div class="bc12-sun" aria-hidden="true"></div>'+
 '<header class="bc12-heading"><div class="bc12-brand">Læria<span>✦</span></div><h1>Hvor skal vi dra i dag?</h1><p data-camp-intro>Et nytt eventyr venter på deg.</p></header>'+
  '<button class="bc12-adult-entry" type="button" data-camp-adult aria-label="Hold inne for voksenområdet">🔒 For voksne</button>'+

 '<div class="bc12-explore-ribbon"><span aria-hidden="true">🧭</span>Lek & utforsk</div>'+homeSubjects()+'<div class="bc12-destinations" aria-label="Lek og utforsk">'+destination('globe','Kloden','Oppdag verden')+destination('fraction','Brøklab','Del og eksperimenter')+destination('words','Ordjakt','Inn i Bokskogen')+destination('multiply','Gangetabell','Lek med tall')+'</div>'+
 '<div class="bc12-journey-route" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="bc12-route-edge" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path><path class="bc12-route-main" pathLength="100" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path><path class="bc12-route-progress" pathLength="100" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path></svg><span class="bc12-route-bridge"></span></div>'+
 '<div class="bc12-you-are-here" aria-hidden="true"><i></i><span>Du er her</span></div>'+
 '<div class="bc12-next-beacon" aria-hidden="true"><i></i><span>Neste sted</span></div>'+
 '<div class="bc12-fox"><img src="./lia-fox-explorer-home.webp" alt="Reven med ryggsekk venter på stien" draggable="false"></div><div class="bc12-fox-call" data-camp-fox-call>Klar? Jeg viser vei!</div>'+
 '<button class="bc12-journey" data-camp="travel"><span>Fortsett reisen <b aria-hidden="true">→</b></span><small><em>Neste sted</em><strong data-camp-next>Bokskogen</strong><span data-camp-next-copy>Et nytt oppdrag venter.</span></small></button>'+
 '<button type="button" class="bc14-free" data-camp="open-explore"><span class="bc14-free-icon" aria-hidden="true">✧</span><span><strong>Utforsk og lek</strong><small>Prøv det du liker</small></span><b aria-hidden="true">›</b></button>'+ '<button class="bc12-quest" data-camp="quest"><span class="bc12-wax" aria-hidden="true">✦</span><span>Et brev fra reven<small>Vil du bli med?</small></span></button>'+
 '<button class="bc12-treasure" data-camp="collection"><span>Samlingen min</span></button>'+
 '<i class="bc12-spark a" aria-hidden="true"></i><i class="bc12-spark b" aria-hidden="true"></i><i class="bc12-spark c" aria-hidden="true"></i>'+
 '<nav class="bc12-nav" aria-label="Læria hovedmeny">'+[['home','Hjem'],['travel','Reisen'],['explore','Utforsk'],['collection','Samlingen']].map(([a,t])=>'<button data-camp="'+a+'"><span aria-hidden="true">'+icons[a]+'</span>'+t+'</button>').join('')+'</nav></section>';
}
function runCampAction(action){
 if(!action)return;
 if(action==='home'||action==='explore')home(action);
 else if(action==='travel')travel();
 else if(action.startsWith('subject-'))openHomeSubject(action.slice(8));
 else if(action==='open-explore'){
  const explore= document.querySelector('.bc12-nav [data-camp="explore"]');
  if(explore)explore.click();else home('explore');
 }
 else if(action==='quest'||action==='collection')dialog(action);
 else activity(action);
}
function bindCampControls(host){
 if(!host||host.dataset.controlsBound==='true')return;
 host.dataset.controlsBound='true';
 host.querySelectorAll('[data-camp]').forEach(control=>{
  control.addEventListener('click',e=>{
   e.preventDefault();
   runCampAction(control.dataset.camp);
  });
 });
  const adult=host.querySelector('[data-camp-adult]');
 if(adult){
  let holdTimer=null;
  const reset=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null}adult.classList.remove('holding');adult.textContent='🔒 For voksne'};
  adult.addEventListener('pointerdown',e=>{
   e.preventDefault();
   if(holdTimer)return;
   adult.classList.add('holding');adult.textContent='🔓 Fortsett å holde …';
   holdTimer=setTimeout(()=>{holdTimer=null;adult.classList.remove('holding');adult.textContent='🔒 For voksne';window.LARIA_OPEN_ADULT?window.LARIA_OPEN_ADULT():document.getElementById('adult-entry')?.click()},1500);
  });
  ['pointerup','pointerleave','pointercancel'].forEach(type=>adult.addEventListener(type,reset));
 }

}
function render(){
 window.LARIA_BASECAMP_DIAG.render=true;
 const screen=document.getElementById('home-screen');if(!screen)return;
 let host=screen.querySelector('.bc12');
 if(!host){screen.insertAdjacentHTML('afterbegin',markup());host=screen.querySelector('.bc12');}
 bindCampControls(host);
 host.hidden=!young();if(!young())return;
 host.dataset.mode=mode;
 const profile=(typeof state!=='undefined'&&state?.profile)?state.profile:{};
 const playerName=typeof profile.name==='string'?profile.name.trim():'';
 const playerAvatar=profile.avatar==='girl'?'girl':'boy';
 const fox=host.querySelector('.bc12-fox');if(fox){fox.dataset.avatar=playerAvatar;fox.setAttribute('aria-label',playerAvatar==='girl'?'Din valgte revejente':'Din valgte revegutt');const img=fox.querySelector('img');if(img){img.src=selectedFoxSource(playerAvatar);img.alt='Læria-reven venter på stien'}}
 host.querySelector('h1').textContent=mode==='explore'?'Hva vil du leke med?':(playerName?'Hei, '+playerName+'!':'Hei, eventyrer!');
 host.querySelector('[data-camp-intro]').textContent=mode==='explore'?'Velg et sted. Bli så lenge du vil.':'Hva har du lyst til å gjøre i dag?';
 const foxCall=host.querySelector('[data-camp-fox-call]');if(foxCall)foxCall.textContent=mode==='explore'?'Velg noe du liker!':(playerName?'Klar, '+playerName+'? Jeg viser vei!':'Klar? Jeg viser vei!');
 const trip=next(),journeyButton=host.querySelector('.bc12-journey');
 host.dataset.journeySubject=trip.subject||'norwegian';
 host.dataset.journeyComplete=trip.complete?'true':'false';
 host.style.setProperty('--bc12-progress',String(Math.max(0,Math.min(100,trip.pct||0))));
 host.querySelector('[data-camp-next]').textContent=trip.title;
 host.querySelector('[data-camp-next-copy]').textContent=(trip.complete?'Reisen er fullført. Du kan besøke stedene igjen.':journeyCopy(trip));
 if(journeyButton)journeyButton.setAttribute('aria-label',(trip.complete?'Besøk reisen igjen. ':'Fortsett reisen. Neste sted: ')+trip.title+'. '+(trip.complete?'Reisen er fullført, og stedene er fortsatt åpne.':journeyCopy(trip)));
 host.querySelectorAll('.bc12-nav button').forEach(b=>{if(b.dataset.camp===mode)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
}
function init(){
 window.LARIA_BASECAMP_DIAG.init=true;
 if(!document.getElementById('bc12-dialog')){const d=document.createElement('dialog');d.id='bc12-dialog';d.setAttribute('aria-labelledby','bc12-dialog-title');document.body.append(d);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()}});}
 // Capture only returns from activities entered through basecamp. Other routes keep their original behavior.
 // Bind the concrete back controls directly. Safari/WebKit has proven less reliable with delegated closest() touch routes.
 ['fraction-lab-back','multiplication-lab-back','world-back','subject-back','geography-back'].forEach(id=>{
  const back=document.getElementById(id);if(!back||back.dataset.bc12ReturnBound==='true')return;
  back.dataset.bc12ReturnBound='true';
  back.addEventListener('click',e=>{
   if(!young()||!fromCamp)return;
   e.preventDefault();e.stopImmediatePropagation();fromCamp=false;home(mode);
  },true);
 });
 const prior=window.renderAll;window.renderAll=function(){const result=prior.apply(this,arguments);render();return result};render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


// Prompt 16: load the isolated safe five-question challenge after Home is interactive.
(function loadSafeChallenge(){
 if(document.querySelector('script[data-laria-safe-challenge]'))return;
 const script=document.createElement('script');
 script.src='./safe-challenge.js?v=20261007-p17rc1';
 script.async=true;
 script.dataset.lariaSafeChallenge='challenge-rc1';
 document.head.appendChild(script);
})();
