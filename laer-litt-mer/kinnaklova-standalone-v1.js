/* Læria: Kinnaklova-only premium adapter for the published main app.
 * No other subject, journal, history or HverdagsOss file is touched.
 * The clean artwork is independently SHA-verified by kinnaklova.js.
 */
(function(){
 'use strict';
 const characters=Object.freeze({
  storesoster:{name:'Storesøster',src:'./assets/gangemagi-troll/storesoster.webp'},
  lillesoster:{name:'Lillesøster',src:'./assets/gangemagi-troll/lillesoster.webp'},
  lillebror:{name:'Lillebror',src:'./assets/gangemagi-troll/lillebror.webp'}
 });
 const icons={
  words:'<path d="M4 20l6-16 6 16M6 15h8M19 5v15M16 9h6"/>',
  sentences:'<path d="M3 5h18v12H9l-5 4v-4H3zM7 9h10M7 13h7"/>',
  'word-games':'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 9h6M8 12h4"/>',
  reading:'<path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1zM12 6v14"/>'
 };
 const order=['words','sentences','reading'];
 const labels={words:'Words',sentences:'Sentences',reading:'Reading','word-games':'Ordlek'};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function enhance(world){
  if(!world||world.dataset.kiPremiumArt!=='approved')return false;
  const stage=world.querySelector('.ki-stage');
  if(!stage)return false;
  if(stage.dataset.lariaReferenceLayout==='v1')return true;
  const liveOrder=stage.hasAttribute('data-ki-word-games-enabled')?[...order,'word-games']:order;
  const signs=liveOrder.map(id=>stage.querySelector('.ki-painted-hit[data-ki="'+id+'"]'));
  if(signs.some(el=>!el))return false;
  const nav=document.createElement('nav');
  nav.className='laria-scene-navigation';
  nav.dataset.lariaComponent='sign-rail';
  nav.setAttribute('aria-label','Velg eventyr i Engelsk');
  nav.id='laria-reference-activities-english';
  signs[0].parentElement.insertBefore(nav,signs[0]);
  signs.forEach((button,i)=>{
   button.classList.add('laria-wayfinder','laria-scene-sign');
   button.dataset.lariaComponent='sign';
   button.setAttribute('aria-label','Åpne '+labels[liveOrder[i]]+' ved Kinnaklova');
   const icon=document.createElement('span');
   icon.className='laria-reference-activity-icon';
   icon.setAttribute('aria-hidden','true');
   icon.innerHTML='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+icons[liveOrder[i]]+'</svg>';
   button.prepend(icon);
   nav.appendChild(button);
  });
  const title=document.createElement('div');
  title.className='laria-reference-heading';
  title.setAttribute('role','heading');
  title.setAttribute('aria-level','2');
  title.innerHTML='<strong>Engelsk</strong><small>Kinnaklova</small>';
  stage.appendChild(title);
  stage.classList.add('laria-reference-layout-v1','laria-scene-shell','laria-scene-english');
  stage.dataset.lariaReferenceLayout='v1';
  stage.dataset.lariaReferenceMode='activities';
  stage.dataset.lariaArtworkUi='separate';
  world.dataset.kiUnifiedLeftRail='ready';
  return true;
 }
 function mood(actor,value,options){
  if(!actor)return;
  actor.dataset.lariaTrollMood=value;
  const stage=actor.closest('.ki-stage');
  if(stage){
   stage.querySelectorAll('.ki-live-speech').forEach(el=>el.remove());
   if(options&&typeof options.say==='string'&&options.say){
    const bubble=document.createElement('p');
    bubble.className='ki-live-speech';
    bubble.textContent=options.say;
    bubble.setAttribute('role','status');
    stage.appendChild(bubble);
    setTimeout(()=>bubble.remove(),3300);
   }
  }
  setTimeout(()=>{if(actor.isConnected)actor.dataset.lariaTrollMood='idle';},Math.max(600,Number(options?.duration)||1150));
 }
 function chooser(){
  const world=document.querySelector('#kinnaklova-world[data-ki-art="ready"]');
  if(!world||world.querySelector('.ki-troll-chooser'))return;
  const wrap=document.createElement('div');
  wrap.className='ki-troll-chooser';
  wrap.setAttribute('role','dialog');
  wrap.setAttribute('aria-modal','true');
  wrap.setAttribute('aria-label','Velg ditt skogstroll');
  const choices=Object.entries(characters).map(([id,c])=>
   '<button type="button" data-kinn-choose="'+id+'"><img alt="" src="'+c.src+'"><strong>'+esc(c.name)+'</strong></button>').join('');
  wrap.innerHTML='<div class="ki-troll-chooser-panel"><h2>Velg skogstroll</h2><div class="ki-troll-choices">'+choices+'</div><button type="button" class="ki-troll-close">Lukk</button></div>';
  world.appendChild(wrap);
  wrap.querySelector('.ki-troll-close').addEventListener('click',()=>wrap.remove());
  wrap.addEventListener('click',e=>{
   if(e.target===wrap){wrap.remove();return}
   const picked=e.target.closest('[data-kinn-choose]');
   if(!picked)return;
   const selected=picked.dataset.kinnChoose;
   if(!characters[selected])return;
   const app=window.LARIA_TALLVIKA_BRIDGE,state=app?.state?.();
   if(!state)return;
   state.profile={...state.profile,tallvikaTroll:selected};
   app.save?.();
   wrap.remove();
   document.dispatchEvent(new CustomEvent('laria:troll-changed',{detail:{id:selected}}));
  });
  wrap.querySelector('[data-kinn-choose]')?.focus();
 }
 // The full TrollActor runtime belongs to PR #243. On the deployed main
 // branch, use a scoped, interactive selected troll instead of a dead sticker.
 if(!window.LARIA_TROLL_ACTOR){
  window.LARIA_TROLL_ACTOR=Object.freeze({
   source:id=>characters[id]?.src||characters.storesoster.src,
   mood,openChooser:chooser
  });
 }
 window.LARIA_KINN_PREMIUM=Object.freeze({enhance});
})();