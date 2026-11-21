/* TrollActor 2.0 technical prototype.
 * Deliberately isolated behind ?trollactor2-prototype=1. It reuses the locked
 * Storesøster WebP unchanged and proves lifecycle/state wiring only; it does
 * not claim to animate limbs or facial features before approved layer art exists. */
(function(root){
 'use strict';
 const query=new URLSearchParams(root.location.search);
 const enabled=query.get('trollactor2-prototype')==='1';
 const STATES=Object.freeze(['idle','wave','think','help','celebrate','encourage']);
 const PILOT=Object.freeze({id:'storesoster',src:'./assets/gangemagi-troll/storesoster.webp'});
 function mount(target,initial='idle'){
  if(!target||!STATES.includes(initial))return null;
  target.replaceChildren();
  target.className='ta2-prototype';target.dataset.ta2State=initial;target.dataset.ta2Identity=PILOT.id;
  target.setAttribute('aria-label','TrollActor 2.0 teknisk prototype: Storesøster');
  target.innerHTML='<div class="ta2-stage" aria-hidden="true">'+
   '<span class="ta2-shadow"></span><img class="ta2-body" src="'+PILOT.src+'" alt="">'+
   '<span class="ta2-face-slot" hidden></span><span class="ta2-arm-slot" hidden></span></div>'+
   '<div class="ta2-controls" role="group" aria-label="Test animasjonstilstander">'+
   STATES.map(state=>'<button type="button" data-ta2-state="'+state+'">'+state+'</button>').join('')+'</div>';
  const play=state=>{if(!STATES.includes(state))return false;target.dataset.ta2State=state;return true;};
  target.querySelectorAll('[data-ta2-state]').forEach(button=>button.addEventListener('click',()=>play(button.dataset.ta2State)));
  return Object.freeze({identity:PILOT.id,states:STATES,play});
 }
 function init(){
  if(!enabled)return;
  const host=root.document.createElement('aside');host.id='trollactor2-prototype';
  host.setAttribute('data-ta2-test-only','true');root.document.body.appendChild(host);
  root.LARIA_TROLLACTOR2_PROTOTYPE=mount(host);
 }
 root.LARIA_TROLLACTOR2_PROTOTYPE=Object.freeze({enabled,states:STATES,mount});
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
