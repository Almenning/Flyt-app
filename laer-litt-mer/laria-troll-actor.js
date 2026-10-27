/* Læria TrollActor core v1.
 * Owns selected forest-troll identity and semantic reaction states.
 * The current assets are intentionally flat fallbacks. Do not fake 2D rigging
 * by bouncing the whole image; real articulated motion plugs in here later.
 */
(function(){
  'use strict';
  const KEY='laerlittmer-v2';
  const IDS=Object.freeze(['storesoster','lillesoster','lillebror']);
  const STATES=Object.freeze(['idle','wave','think','hint','celebrate']);
  const META=Object.freeze({
    storesoster:Object.freeze({name:'Storesøster',source:'./assets/tallvika/storesoster-inworld-approved-20261026.webp'}),
    lillesoster:Object.freeze({name:'Lillesøster',source:'./assets/gangemagi-troll/lillesoster.webp'}),
    lillebror:Object.freeze({name:'Lillebror',source:'./assets/gangemagi-troll/lillebror.webp'})
  });
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function choice(){
    try{
      const id=JSON.parse(localStorage.getItem(KEY)||'null')?.profile?.tallvikaTroll;
      return IDS.includes(id)?id:'storesoster';
    }catch(_){return 'storesoster'}
  }
  function meta(id=choice()){return META[IDS.includes(id)?id:'storesoster']}
  function normalizeState(value){return STATES.includes(value)?value:'idle'}
  function stateForMood(mood){
    if(mood==='celebrate')return 'celebrate';
    if(mood==='help')return 'hint';
    if(mood==='think')return 'think';
    if(mood==='cheer')return 'wave';
    return 'idle';
  }
  function render(options={}){
    const id=IDS.includes(options.id)?options.id:choice();
    const state=normalizeState(options.state);
    const m=meta(id);
    return '<span class="laria-troll-actor" data-troll-id="'+id+'" data-troll-state="'+state+'" data-troll-rig="flat-fallback" aria-label="'+esc(m.name)+'">'+
      '<img class="laria-troll-actor__flat" src="'+esc(m.source)+'" alt="" aria-hidden="true">'+
      '</span>';
  }
  function setState(target,state){
    if(!target)return;
    const next=normalizeState(state);
    target.dataset.trollState=next;
    target.dispatchEvent(new CustomEvent('laria:troll-state',{bubbles:true,detail:{state:next,id:target.dataset.trollId||choice()}}));
  }
  window.LARIA_TROLL_ACTOR=Object.freeze({
    version:'core-v1',
    ids:IDS,
    states:STATES,
    choice,
    meta,
    render,
    setState,
    stateForMood
  });
})();