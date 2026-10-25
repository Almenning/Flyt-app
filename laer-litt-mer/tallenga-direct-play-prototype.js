/* Tallenga direct-play prototype. Presentation only; no learning state writes. */
(()=>{'use strict';
 const params=new URLSearchParams(location.search);
 const enabled=params.get('tallenga')==='prototype';
 const screen=document.getElementById('subject-screen');
 if(!screen||!enabled)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function progress(){
  try{const grade=typeof journeyViewGrade==='function'?journeyViewGrade('math'):currentGrade();
   const p=journeyProgress('math',grade),n=journeyRecommendedNode('math',grade);
   return {grade,p,n,active:state?.activeSession?.scope?.subject==='math'};
  }catch(_){return {grade:2,p:null,n:null,active:false}}
 }
 function host(){return document.getElementById('tallenga-direct-play')}
 function build(){
  if(screen.dataset.subject!=='math'||!screen.classList.contains('active'))return;
  const data=progress(),p=data.p,n=data.n;
  const name=typeof state?.profile?.name==='string'?state.profile.name.trim():''; 
  const upcoming=data.active?'Fortsett der du slapp':p?.complete?'Et nytt eventyr venter':n?.title||'Prøv et nytt oppdrag';
  const description=data.active?'Du har allerede begynt på et oppdrag.':p?.complete?'Første kapittel er fullført. Favorittene dine er fortsatt åpne.':n?'En kort utfordring du kan prøve når du vil.':'Utforsk Tallenga i ditt eget tempo.';
  let el=host();
  if(!el){el=document.createElement('section');el.id='tallenga-direct-play';el.className='tlp';el.setAttribute('aria-label','Tallenga, Matte og lek');screen.insertBefore(el,screen.firstChild);}
  el.innerHTML=`<div class="tlp-scene">
   <div class="tlp-top"><button type="button" class="tlp-back" data-tlp="back" aria-label="Tilbake til Hjem">‹ <span>Hjem</span></button><span class="tlp-logo">LÆRIA · MATTE</span><button type="button" class="tlp-original" data-tlp="original">Vis gammelt kart</button></div>
   <div class="tlp-intro"><span class="tlp-eyebrow">VELKOMMEN TIL TALLENGA</span><h1>${name?'Hei, '+esc(name)+'!':'Velkommen!'}</h1><p>Hva har du lyst til å leke med i dag?</p></div>
   <div class="tlp-troll" aria-label="De tre skogstrollene følger deg i Tallenga"><img src="./assets/home-v15/laria-troll-trio-v3.webp" alt="De tre skogstrollene" /></div>
   <div class="tlp-landscape-caption">Tallenga <span>✦</span> Der tall blir eventyr</div>
  </div>
  <div class="tlp-content"><header class="tlp-choose"><div><span class="tlp-eyebrow">VELG EN LEK</span><h2>Finn noe morsomt å gjøre</h2></div><p>Alle lekene er åpne. Du bestemmer selv.</p></header>
  <div class="tlp-games">
   <button class="tlp-game tlp-gangemagi" type="button" data-tlp="multiply"><span class="tlp-game-art"><img src="./assets/cards/utforsk/multiply-premium.webp" alt="" /></span><span class="tlp-game-copy"><strong>Gangemagi</strong><small>Plukk, pakk og oppdag gange</small><span class="tlp-cta">La oss leke <b>›</b></span></span></button>
   <button class="tlp-game tlp-fraction" type="button" data-tlp="fraction"><span class="tlp-game-art"><img src="./assets/cards/utforsk/fraction-premium.webp" alt="" /></span><span class="tlp-game-copy"><strong>Brøklab</strong><small>Del opp, bygg og prøv selv</small><span class="tlp-cta">Prøv brøker <b>›</b></span></span></button>
   <button class="tlp-game tlp-table" type="button" data-tlp="table"><span class="tlp-game-art"><img src="./home-math-v14.webp" alt="" /></span><span class="tlp-game-copy"><strong>Gangetabellen</strong><small>Utforsk tall og mønstre</small><span class="tlp-cta">Se mønstrene <b>›</b></span></span></button>
  </div>
  <section class="tlp-next" aria-label="Valgfritt neste eventyr"><div class="tlp-next-symbol" aria-hidden="true">✧</div><div class="tlp-next-copy"><span class="tlp-eyebrow">ET EVENTYR NÅR DU VIL</span><h2>${esc(upcoming)}</h2><p>${esc(description)}</p></div><button type="button" data-tlp="next">Fortsett eventyret <span aria-hidden="true">›</span></button></section>
  <p class="tlp-note">Du kan spille favorittene dine så mange ganger du vil.</p>
  </div>`;
  screen.classList.add('tlp-active');
 }
 function back(){
  if(typeof window.LARIA_RETURN_TO_BASECAMP==='function'&&window.LARIA_RETURN_TO_BASECAMP())return;
  if(typeof setTab==='function')setTab('home');else showScreen('home');
 }
 function original(){screen.classList.remove('tlp-active');screen.dataset.tlpOriginal='true';screen.querySelector('#subject-back')?.focus({preventScroll:true});}
 function table(){
  if(typeof window.openMultiplicationLab!=='function')return;
  window.openMultiplicationLab();
  // Classic learning table is the existing mathematics laboratory; do not
  // fabricate a separate engine or write to progress.
  const table=document.querySelector('#multiplication-lab-root [data-mult-variant="table"]');
  if(table)table.click();
 }
 function next(){
  if(typeof startSession==='function'&&state?.activeSession?.scope?.subject==='math'){startSession();return;}
  const {p,n,grade}=progress();
  if(p?.complete){if(typeof startJourneyChallenge==='function')startJourneyChallenge('math');return;}
  if(n&&typeof startJourneyNode==='function')startJourneyNode('math',n.id,grade);
 }
 screen.addEventListener('click',e=>{
  const button=e.target.closest('[data-tlp]');if(!button||!screen.contains(button))return;
  e.preventDefault();
  const a=button.dataset.tlp;
  if(a==='back')back();
  else if(a==='original')original();
  else if(a==='multiply')window.openMultiplicationLab?.();
  else if(a==='fraction')window.openFractionLab?.();
  else if(a==='table')table();
  else if(a==='next')next();
 });
 const previous=window.openSubject;
 if(typeof previous!=='function')return;
 window.openSubject=function(subject,...args){
  const result=previous.call(this,subject,...args);
  if(subject==='math'&&enabled){screen.dataset.tlpOriginal='false';build();}
  else{screen.classList.remove('tlp-active');screen.dataset.tlpOriginal='false';}
  return result;
 };
 // Existing labs return to the subject with showScreen('subject') rather than
 // calling openSubject. Preserve the prototype and rebuild progress on return.
 const oldShow=window.showScreen;
 if(typeof oldShow==='function')window.showScreen=function(name,...args){
  const result=oldShow.call(this,name,...args);
  if(name==='subject'&&screen.dataset.subject==='math'&&screen.dataset.tlpOriginal!=='true')build();
  return result;
 };
 window.LARIA_TALLENGA_PROTOTYPE={enabled:true,render:build};
})();