/* Hjem v12: premium basecamp + real free-play Ordjakt. Presentation and entry points only; learning state remains owned by the app. Learning state is owned by the app. */
(()=>{'use strict';
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
 return './lia-fox-explorer-home.webp';
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
function travel(){const info=next();fromCamp=true;if(info.active){startSession();return}if(info.subject==='geography'){renderGeographyContinue();showScreen('geography')}else openSubject(info.subject);}
function activity(name){
 fromCamp=true;
 if(name==='globe'){if(typeof window.openGlobe==='function')window.openGlobe('explore');else{showScreen('world');requestAnimationFrame(()=>setGlobeMode('explore'));}}
 else if(name==='fraction')window.openFractionLab();
 else if(name==='multiply')window.openMultiplicationLab();
 // TODO: replace this entry with the dedicated free-play Ordjakt module when available.
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
function destination(action,label,description){return '<button class="bc12-place bc12-'+action+'" data-camp="'+action+'" aria-label="'+label+' – '+description+'"><span class="bc12-place-glow" aria-hidden="true"></span><span class="bc12-sign">'+label+'</span><span class="bc12-place-hint">'+description+'</span></button>';}
function markup(){return '<section class="bc12" data-release="basecamp-rc1" aria-label="Læria basecamp">'+
 '<div class="bc12-landscape" aria-hidden="true"></div><div class="bc12-sun" aria-hidden="true"></div>'+
 '<header class="bc12-heading"><div class="bc12-brand">Læria<span>✦</span></div><h1>Hvor skal vi dra i dag?</h1><p data-camp-intro>Et nytt eventyr venter på deg.</p></header>'+
 '<div class="bc12-explore-ribbon"><span aria-hidden="true">🧭</span>Lek & utforsk</div><div class="bc12-destinations" aria-label="Lek og utforsk">'+destination('globe','Kloden','Oppdag verden')+destination('fraction','Brøklab','Del og eksperimenter')+destination('words','Ordjakt','Inn i Bokskogen')+destination('multiply','Gangetabell','Lek med tall')+'</div>'+
 '<div class="bc12-journey-route" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="bc12-route-edge" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path><path class="bc12-route-main" pathLength="100" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path><path class="bc12-route-progress" pathLength="100" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path></svg><span class="bc12-route-bridge"></span></div>'+
 '<div class="bc12-you-are-here" aria-hidden="true"><i></i><span>Du er her</span></div>'+
 '<div class="bc12-next-beacon" aria-hidden="true"><i></i><span>Neste sted</span></div>'+
 '<div class="bc12-fox"><img src="./lia-fox-explorer-home.webp" alt="Reven med ryggsekk venter på stien" draggable="false"></div><div class="bc12-fox-call" data-camp-fox-call>Klar? Jeg viser vei!</div>'+
 '<button class="bc12-journey" data-camp="travel"><span>Fortsett reisen <b aria-hidden="true">→</b></span><small><em>Neste sted</em><strong data-camp-next>Bokskogen</strong><span data-camp-next-copy>Et nytt oppdrag venter.</span></small></button>'+
 '<button class="bc12-quest" data-camp="quest"><span class="bc12-wax" aria-hidden="true">✦</span><span>Et brev fra reven<small>Vil du bli med?</small></span></button>'+
 '<button class="bc12-treasure" data-camp="collection"><span>Samlingen min</span></button>'+
 '<i class="bc12-spark a" aria-hidden="true"></i><i class="bc12-spark b" aria-hidden="true"></i><i class="bc12-spark c" aria-hidden="true"></i>'+
 '<nav class="bc12-nav" aria-label="Læria hovedmeny">'+[['home','Hjem'],['travel','Reisen'],['explore','Utforsk'],['collection','Samlingen']].map(([a,t])=>'<button data-camp="'+a+'"><span aria-hidden="true">'+icons[a]+'</span>'+t+'</button>').join('')+'</nav></section>';
}
function render(){
 const screen=document.getElementById('home-screen');if(!screen)return;
 let host=screen.querySelector('.bc12');
 if(!host){screen.insertAdjacentHTML('afterbegin',markup());host=screen.querySelector('.bc12');
  host.addEventListener('click',e=>{const action=e.target.closest('[data-camp]')?.dataset.camp;if(!action)return;if(action==='home'||action==='explore')home(action);else if(action==='travel')travel();else if(action==='quest'||action==='collection')dialog(action);else activity(action)});
 }
 host.hidden=!young();if(!young())return;
 host.dataset.mode=mode;
 const profile=(typeof state!=='undefined'&&state?.profile)?state.profile:{};
 const playerName=typeof profile.name==='string'?profile.name.trim():'';
 const playerAvatar=profile.avatar==='girl'?'girl':'boy';
 const fox=host.querySelector('.bc12-fox');if(fox){fox.dataset.avatar=playerAvatar;fox.setAttribute('aria-label',playerAvatar==='girl'?'Din valgte revejente':'Din valgte revegutt');const img=fox.querySelector('img');if(img){img.src=selectedFoxSource(playerAvatar);img.alt='Læria-reven venter på stien'}}
 host.querySelector('h1').textContent=mode==='explore'?'Hva vil du leke med?':'Hvor skal vi dra i dag?';
 host.querySelector('[data-camp-intro]').textContent=mode==='explore'?'Velg et sted. Bli så lenge du vil.':(playerName?'Et nytt eventyr venter på deg, '+playerName+'.':'Et nytt eventyr venter på deg.');
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
 if(!document.getElementById('bc12-dialog')){const d=document.createElement('dialog');d.id='bc12-dialog';d.setAttribute('aria-labelledby','bc12-dialog-title');document.body.append(d);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()}});}
 // Capture only returns from activities entered through basecamp. Other routes keep their original behavior.
 document.addEventListener('click',e=>{if(!young()||!fromCamp)return;if(e.target.closest('#fraction-lab-back,#multiplication-lab-back,#world-back,#subject-back,#geography-back')){e.preventDefault();e.stopImmediatePropagation();fromCamp=false;home(mode)}},true);
 const prior=window.renderAll;window.renderAll=function(){const result=prior.apply(this,arguments);render();return result};render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
