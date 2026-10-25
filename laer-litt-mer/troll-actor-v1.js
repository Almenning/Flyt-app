/* Læria TrollActor v1
 *
 * A small, local 2D puppet layer built only from crops of an approved source
 * image. It deliberately has no network dependency, generated replacement
 * artwork or canvas loop. The static source image remains in the DOM as a
 * reserve if the rig cannot be enhanced.
 */
(function(root){
  'use strict';
  const moods=new Set(['idle','wave','think','hint','celebrate','support']);
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  function render(options){
    const opt=options||{};
    const id=esc(opt.id||'troll');
    const name=esc(opt.name||'Skogstroll');
    const src=esc(opt.src||'');
    const mood=moods.has(opt.mood)?opt.mood:'idle';
    if(!src)return '';
    return '<span class="troll-actor" style="--troll-source:url(\''+src+'\')" data-troll-actor="'+id+'" data-troll-mood="'+mood+'" data-troll-rig="source-bones-v2" role="img" aria-label="'+name+'">'+
      '<img class="troll-actor__fallback" src="'+src+'" alt="" aria-hidden="true">'+
      '<span class="troll-actor__rig" aria-hidden="true">'+
        '<span class="troll-actor__part troll-actor__legs"></span>'+
        '<span class="troll-actor__body-rig">'+
          '<span class="troll-actor__part troll-actor__torso"></span>'+
          '<span class="troll-actor__part troll-actor__arm troll-actor__arm--left"></span>'+
          '<span class="troll-actor__part troll-actor__arm troll-actor__arm--right"></span>'+
          '<span class="troll-actor__head-rig">'+
            '<span class="troll-actor__part troll-actor__head"></span>'+
            '<span class="troll-actor__part troll-actor__hair"></span>'+
            '<span class="troll-actor__blink"><i></i><i></i></span>'+
          '</span>'+
        '</span>'+
        '<span class="troll-actor__sparkles"><i></i><i></i><i></i></span>'+
      '</span></span>';
  }

  function setMood(host,mood){
    if(!host||!moods.has(mood))return false;
    // Re-applying a state must restart its one-shot gesture as well as work
    // after a Gangemagi DOM redraw.
    host.dataset.trollMood='idle';
    void host.offsetWidth;
    host.dataset.trollMood=mood;
    return true;
  }

  root.LARIA_TROLL_ACTOR=Object.freeze({render,setMood,moods:Object.freeze([...moods])});
})(window);
