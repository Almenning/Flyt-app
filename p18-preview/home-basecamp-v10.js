(()=>{'use strict';
const PLACE_NAME={lyder:'Bokstavporten',ordbilder:'Lesestua',ordlek:'Rimdammen','ordstart-checkpoint':'Skogsporten',setningsrekkefolge:'Ordbrua',ordbetydning:'Ordhagen','setninger-checkpoint':'Ordhagen',detaljer:'Biblioteket',forsta:'Biblioteket',tenkvidere:'Biblioteket','lesedetektiv-checkpoint':'Biblioteket'};
function young(){try{return currentGrade()<=2}catch(_){return false}}
function subjectNow(){const a=state?.activeSession?.scope?.subject;if(a)return a;const l=state?.lastActivity?.subject;return ['norwegian','math','english','geography'].includes(l)?l:'norwegian'}
function nextJourney(){const subject=subjectNow();if(state?.activeSession?.scope)return {subject,title:state.activeSession.scope.label||'Oppdraget ditt',active:true};try{const n=subject==='geography'?geoJourneyRecommendedNode(currentGrade()):journeyRecommendedNode(subject,currentGrade());const title=subject==='norwegian'?(PLACE_NAME[n?.id]||n?.title||'Bokskogen'):(n?.title||({math:'Tallriket',english:'Ordlandsbyen',geography:'Oppdagelsesriket'}[subject]));return {subject,title,active:false}}catch(_){return {subject:'norwegian',title:'Bokskogen',active:false}}}
function travel(){const info=nextJourney();if(state?.activeSession){startSession();return}if(info.subject==='geography'){showScreen('geography');return}openSubject(info.subject||'norwegian')}
function globe(){showScreen('world');requestAnimationFrame(()=>{try{globeMode='explore';setGlobeMode('explore')}catch(_){}})}
function fraction(){if(typeof window.openFractionLab==='function')window.openFractionLab();else openSubject('math')}
function multiply(){if(typeof window.openMultiplicationLab==='function')window.openMultiplicationLab();else openSubject('math')}
function words(){openSubject('norwegian')}
function quest(){try{const r=recommendedStarter();if(r&&typeof r.action==='function'){r.action();return}}catch(_){}travel()}
function collection(){try{setTab('progress')}catch(_){}}
function pulse(){const h=document.querySelector('.laria-basecamp-v10');if(!h)return;h.classList.remove('bc10-pulse');void h.offsetWidth;h.classList.add('bc10-pulse');h.querySelector('.bc10-place.globe')?.focus({preventScroll:true})}
function markup(){return '<section class="laria-basecamp-v10" aria-label="Læria basecamp">'+
 '<div class="bc10-canopy" aria-hidden="true"></div><div class="bc10-glow" aria-hidden="true"></div><i class="bc10-firefly f1"></i><i class="bc10-firefly f2"></i><i class="bc10-firefly f3"></i><i class="bc10-firefly f4"></i>'+
 '<div class="bc10-logo">Læria<i>✦</i></div>'+
 '<div class="bc10-title"><small>Hei 👋</small><h1>Hvor skal vi dra i dag?</h1><p>Reven er klar! Fortsett eventyret, eller utforsk noe du har lyst til.</p><span class="bc10-grade" data-bc10-grade>2. klasse ✨</span></div>'+
 '<button class="bc10-journey" type="button" data-bc10-action="travel"><span class="main-plank">FORTSETT REISEN <b>→</b></span><span class="next-plank">Neste:<strong data-bc10-next>Et nytt sted</strong></span></button>'+
 '<svg class="bc10-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M5 83 C25 64,38 80,50 56 S76 35,96 16"></path><circle cx="16" cy="73" r="3.3"></circle><circle cx="46" cy="60" r="3.3"></circle><circle cx="72" cy="39" r="3.3"></circle></svg>'+
 '<div class="bc10-fox"><img src="./lia-fox-explorer.webp?v=fox1" alt="Reven med ryggsekk er klar for eventyr" draggable="false"></div><div class="bc10-speech">Kom, vi skal videre!</div>'+
 '<div class="bc10-explore-label">🧭 Lek & utforsk</div>'+
 place('globe','🌍','Kloden','globe')+place('fraction','🍕','Brøklab','fraction')+place('words','🔤','Ordjakt','words')+place('multiply','✖️','Gangetabell','multiply')+
 '<i class="bc10-lantern l1"></i><i class="bc10-lantern l2"></i><i class="bc10-lantern l3"></i>'+
 '<button class="bc10-quest" type="button" data-bc10-action="quest"><strong>Reven har et oppdrag!</strong><span>En frivillig utfordring venter på deg.</span></button>'+
 '<button class="bc10-collection" type="button" data-bc10-action="collection"><strong>Samlingen</strong><span>Stjerner, funn og steder du har oppdaget.</span></button>'+
 '<nav class="bc10-nav" aria-label="Læria hovedmeny"><button class="active" type="button" data-bc10-action="home"><span>🏠</span>Hjem</button><button type="button" data-bc10-action="travel"><span>🗺️</span>Reisen</button><button type="button" data-bc10-action="explore"><span>🧭</span>Utforsk</button><button type="button" data-bc10-action="collection"><span>🎒</span>Samlingen</button></nav></section>'}
function place(cls,icon,label,action){return '<button class="bc10-place '+cls+'" type="button" data-bc10-action="'+action+'" aria-label="'+label+'"><span class="island"></span><span class="badge">'+icon+'</span><span class="sign">'+label+'</span></button>'}
function bind(host){const actions={home:()=>{},travel,globe,fraction,multiply,words,quest,collection,explore:pulse};host.querySelectorAll('[data-bc10-action]').forEach(b=>b.addEventListener('click',()=>actions[b.dataset.bc10Action]?.()))}
function render(){const screen=document.getElementById('home-screen');if(!screen)return;screen.querySelector('.laria-basecamp-v9')?.remove();let host=screen.querySelector('.laria-basecamp-v10');if(!host){screen.insertAdjacentHTML('afterbegin',markup());host=screen.querySelector('.laria-basecamp-v10');bind(host)}host.hidden=!young();if(!young())return;const info=nextJourney();const n=host.querySelector('[data-bc10-next]');if(n)n.textContent=info.active?'Fortsett '+info.title:info.title;const g=host.querySelector('[data-bc10-grade]');if(g){try{g.textContent=GRADE_CONFIG[currentGrade()].label+' ✨'}catch(_){}}}
const prev=window.renderAll;if(typeof prev==='function')window.renderAll=function(){const r=prev.apply(this,arguments);render();return r};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();