/* Hjem v11: presentation and entry points only. Learning state is owned by the app. */
(()=>{'use strict';
const PLACES={lyder:'Bokstavporten',ordbilder:'Lesestua',ordlek:'Rimdammen','ordstart-checkpoint':'Skogsporten',setningsrekkefolge:'Ordbrua',ordbetydning:'Ordhagen','setninger-checkpoint':'Ordhagen',detaljer:'Biblioteket',forsta:'Biblioteket',tenkvidere:'Biblioteket','lesedetektiv-checkpoint':'Biblioteket'};
const svg=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+paths+'</svg>';
const icons={home:svg('<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>'),travel:svg('<path d="m3 5 6-2 6 3 6-2v16l-6 2-6-3-6 2ZM9 3v16m6-13v16"/>'),explore:svg('<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>'),collection:svg('<path d="M5 9a7 7 0 0 1 14 0v12H5ZM9 3V1h6v2M8 14h8v5H8ZM5 10h14"/>')};
let mode='home',fromCamp=false,returnFocus=null;
const young=()=>currentGrade()<=2;
function next(){
 const active=state.activeSession?.scope;
 const candidate=active?.subject||state.lastActivity?.subject;
 const subject=['norwegian','math','english','geography'].includes(candidate)?candidate:'norwegian';
 const node=subject==='geography'?geoJourneyRecommendedNode(currentGrade()):journeyRecommendedNode(subject,currentGrade());
 return {subject,title:active?.label||(subject==='norwegian'?PLACES[node?.id]:null)||node?.title||'Bokskogen',active:!!active};
}
function home(view='home'){mode=view;setTab('home');render();}
function travel(){const info=next();fromCamp=true;if(info.active){startSession();return}if(info.subject==='geography'){renderGeographyContinue();showScreen('geography')}else openSubject(info.subject);}
function activity(name){
 fromCamp=true;
 if(name==='globe'){showScreen('world');requestAnimationFrame(()=>setGlobeMode('explore'));}
 else if(name==='fraction')window.openFractionLab();
 else if(name==='multiply')window.openMultiplicationLab();
 // TODO: replace this entry with the dedicated free-play Ordjakt module when available.
 else if(name==='words')openSubject('norwegian');
}
function closeDialog(){const d=document.getElementById('bc11-dialog');if(d?.open)d.close();returnFocus?.focus();}
function dialog(kind){
 const d=document.getElementById('bc11-dialog');returnFocus=document.activeElement;
 if(kind==='quest')d.innerHTML='<button class="bc11-close" aria-label="Lukk">×</button><span class="bc11-eyebrow">Et lite eventyr, hvis du vil</span><h2 id="bc11-dialog-title">Skal vi finne nye ord?</h2><p>Reven lurer på hvilke ord som skjuler seg i Bokskogen. Bli med, eller lek videre der du er.</p><button class="bc11-dialog-go" data-quest-go>Bli med reven →</button><button class="bc11-later">Kanskje senere</button>';
 else {
  const visited=Object.values(state.journey?.nodes||{}).filter(n=>n.passed||Number(n.attempts)>0).length;
  const trophies=Object.keys(state.journey?.gradeWins||{}).length;
  d.innerHTML='<button class="bc11-close" aria-label="Lukk">×</button><span class="bc11-eyebrow">Min eventyrsekk</span><h2 id="bc11-dialog-title">Samlingen din</h2><div class="bc11-shelf"><div><span aria-hidden="true">✦</span><strong>'+visited+'</strong><small>stopp besøkt</small></div><div><span aria-hidden="true">♜</span><strong>'+trophies+'</strong><small>trinn rundet</small></div></div><p>'+(visited?'Her tar du vare på sporene fra reisen din. Du kan alltid besøke stedene igjen.':'Ryggsekken er klar. Her samler vi sporene fra eventyrene dine.')+'</p><button class="bc11-dialog-go" data-dialog-home>Tilbake til basecamp</button>';
 }
 d.querySelector('.bc11-close').onclick=closeDialog;d.querySelector('.bc11-later')?.addEventListener('click',closeDialog);
 d.querySelector('[data-quest-go]')?.addEventListener('click',()=>{closeDialog();activity('words')});
 d.querySelector('[data-dialog-home]')?.addEventListener('click',()=>{closeDialog();home()});
 d.showModal();
}
function destination(action,label,description){return '<button class="bc11-place bc11-'+action+'" data-camp="'+action+'" aria-label="'+label+' – '+description+'"><span class="bc11-place-glow" aria-hidden="true"></span><span class="bc11-sign">'+label+'</span><span class="bc11-place-hint">'+description+'</span></button>';}
function markup(){return '<section class="bc11" aria-label="Læria basecamp">'+
 '<div class="bc11-landscape" aria-hidden="true"></div><div class="bc11-sun" aria-hidden="true"></div>'+
 '<header class="bc11-heading"><div class="bc11-brand">Læria<span>✦</span></div><h1>Hvor skal vi dra i dag?</h1><p data-camp-intro>Et nytt eventyr venter på deg.</p></header>'+
 '<div class="bc11-destinations" aria-label="Lek og utforsk">'+destination('globe','Kloden','Oppdag verden')+destination('fraction','Brøklab','Del og eksperimenter')+destination('words','Ordjakt','Inn i Bokskogen')+destination('multiply','Gangetabell','Lek med tall')+'</div>'+
 '<div class="bc11-fox"><img src="./lia-fox-explorer-home.webp" alt="Reven med ryggsekk venter på stien" draggable="false"></div>'+
 '<button class="bc11-journey" data-camp="travel"><span>Fortsett reisen <b aria-hidden="true">→</b></span><small>Neste: <strong data-camp-next>Bokskogen</strong></small></button>'+
 '<button class="bc11-quest" data-camp="quest"><span class="bc11-wax" aria-hidden="true">✦</span><span>Et brev fra reven<small>Vil du bli med?</small></span></button>'+
 '<button class="bc11-treasure" data-camp="collection"><span>Samlingen min</span></button>'+
 '<i class="bc11-spark a" aria-hidden="true"></i><i class="bc11-spark b" aria-hidden="true"></i><i class="bc11-spark c" aria-hidden="true"></i>'+
 '<nav class="bc11-nav" aria-label="Læria hovedmeny">'+[['home','Hjem'],['travel','Reisen'],['explore','Utforsk'],['collection','Samlingen']].map(([a,t])=>'<button data-camp="'+a+'"><span aria-hidden="true">'+icons[a]+'</span>'+t+'</button>').join('')+'</nav></section>';
}
function render(){
 const screen=document.getElementById('home-screen');if(!screen)return;
 let host=screen.querySelector('.bc11');
 if(!host){screen.insertAdjacentHTML('afterbegin',markup());host=screen.querySelector('.bc11');
  host.addEventListener('click',e=>{const action=e.target.closest('[data-camp]')?.dataset.camp;if(!action)return;if(action==='home'||action==='explore')home(action);else if(action==='travel')travel();else if(action==='quest'||action==='collection')dialog(action);else activity(action)});
 }
 host.hidden=!young();if(!young())return;
 host.dataset.mode=mode;
 host.querySelector('h1').textContent=mode==='explore'?'Hva vil du leke med?':'Hvor skal vi dra i dag?';
 host.querySelector('[data-camp-intro]').textContent=mode==='explore'?'Velg et sted. Bli så lenge du vil.':'Et nytt eventyr venter på deg.';
 host.querySelector('[data-camp-next]').textContent=next().title;
 host.querySelectorAll('.bc11-nav button').forEach(b=>{if(b.dataset.camp===mode)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
}
function init(){
 if(!document.getElementById('bc11-dialog')){const d=document.createElement('dialog');d.id='bc11-dialog';d.setAttribute('aria-labelledby','bc11-dialog-title');document.body.append(d);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()}});}
 // Capture only returns from activities entered through basecamp. Other routes keep their original behavior.
 document.addEventListener('click',e=>{if(!young()||!fromCamp)return;if(e.target.closest('#fraction-lab-back,#multiplication-lab-back,#world-back,#subject-back,#geography-back')){e.preventDefault();e.stopImmediatePropagation();fromCamp=false;home(mode)}},true);
 const prior=window.renderAll;window.renderAll=function(){const result=prior.apply(this,arguments);render();return result};render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
