/* TrollActor 2.0 layered runtime.
 * Disabled by default. It only mounts when a verified Storesøster v2 layer pack
 * is supplied by the caller; the locked V1 art remains the production fallback. */
(function(root){
 'use strict';
 const STATES=Object.freeze(['idle','wave','think','help','celebrate','encourage']);
 const REQUIRED=Object.freeze(['bodyLegs','headHair','armLeft','armRight','eyesOpen','eyesBlink','browsNeutral','mouthNeutral','mouthSmile','mouthOpen','headbandFlower','shadow']);
 function validPack(pack){
  return !!pack&&pack.identity==='storesoster'&&REQUIRED.every(key=>typeof pack.assets?.[key]==='string'&&pack.assets[key].startsWith('./assets/trollactor2/storesoster-v2/'));
 }
 function renderLayer(className,src){return '<img class="ta2-layer '+className+'" src="'+src+'" alt="">';}
 function mount(target,pack,initial='idle'){
  if(!target||!validPack(pack)||!STATES.includes(initial))return null;
  const a=pack.assets;
  target.replaceChildren();target.className='ta2-layered';target.dataset.ta2State=initial;target.dataset.ta2Identity=pack.identity;
  target.setAttribute('role','img');target.setAttribute('aria-label','Storesøster, Lærias eventyrvenn');
  target.innerHTML='<span class="ta2-shadow">'+renderLayer('ta2-shadow-image',a.shadow)+'</span>'+
   '<span class="ta2-body">'+renderLayer('ta2-body-image',a.bodyLegs)+'</span>'+
   '<span class="ta2-arm ta2-arm-left">'+renderLayer('ta2-arm-image',a.armLeft)+'</span>'+
   '<span class="ta2-arm ta2-arm-right">'+renderLayer('ta2-arm-image',a.armRight)+'</span>'+
   '<span class="ta2-head">'+renderLayer('ta2-head-image',a.headHair)+renderLayer('ta2-headband-image',a.headbandFlower)+
   '<span class="ta2-face">'+renderLayer('ta2-eyes-open',a.eyesOpen)+renderLayer('ta2-eyes-blink',a.eyesBlink)+renderLayer('ta2-brows-neutral',a.browsNeutral)+renderLayer('ta2-mouth-neutral',a.mouthNeutral)+renderLayer('ta2-mouth-smile',a.mouthSmile)+renderLayer('ta2-mouth-open',a.mouthOpen)+'</span></span>';
  const play=state=>{if(!STATES.includes(state))return false;target.dataset.ta2State=state;return true;};
  return Object.freeze({identity:pack.identity,states:STATES,play});
 }
 root.LARIA_TROLLACTOR2_LAYERED=Object.freeze({states:STATES,requiredAssets:REQUIRED,validPack,mount});
})(window);
