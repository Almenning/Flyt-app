/* Læria premium beta: selected forest troll is the visible companion everywhere.
 * Legacy fox modules may still exist behind this layer during migration, but they
 * no longer own visible character art. Learning state and Grovanova Home are untouched.
 */
(function(root){
  'use strict';
  const doc=root.document;
  if(!doc)return;

  const TROLLS=Object.freeze({
    storesoster:Object.freeze({id:'storesoster',label:'Storesøster',src:'./assets/gangemagi-troll/storesoster.webp'}),
    lillesoster:Object.freeze({id:'lillesoster',label:'Lillesøster',src:'./assets/gangemagi-troll/lillesoster.webp'}),
    lillebror:Object.freeze({id:'lillebror',label:'Lillebror',src:'./assets/gangemagi-troll/lillebror.webp'})
  });
  const DEFAULT='storesoster';
  const IMAGE_SELECTORS=[
    '.locked-journey-profile > img',
    '.locked-journey-traveler > img',
    '.task-fox-companion > img',
    '.fr2-guide > img.fr2-fox',
    '.fr2-mastery-banner img.fr2-fox',
    '.fr4-scene-fox img.fr2-fox',
    '.mp-avatar > img',
    '.mp-mascot > img',
    '.mp-art-practice img',
    '.mp-pick-easy-intro > img',
    '.mp-pick-mentor > img',
    '.word-hunt-top > img.word-hunt-fox',
    '.premium-globe-header > img.premium-globe-fox'
  ].join(',');

  let queued=false;
  function profile(){
    try{
      if(typeof state!=='undefined'&&state?.profile)return state.profile;
    }catch(_){}
    try{return root.LARIA_TALLVIKA_BRIDGE?.state?.()?.profile||{};}catch(_){return {};}
  }
  function choice(){
    const id=profile()?.tallvikaTroll;
    return TROLLS[id]?id:DEFAULT;
  }
  function selected(){return TROLLS[choice()];}

  function cleanLegacy(parent,img){
    parent?.querySelectorAll?.(':scope > .laria-fox-wardrobe-placed,:scope > .laria-fox-wardrobe-art').forEach(el=>el.remove());
    parent?.classList?.remove('laria-fox-wardrobe-anchor');
    if(parent?.dataset){
      delete parent.dataset.lariaFoxMood;
      delete parent.dataset.lariaFoxSelected;
      parent.dataset.troll=choice();
      parent.classList.add('laria-troll-host');
    }
    if(img?.dataset){
      delete img.dataset.lariaWardrobeSignature;
      img.dataset.troll=choice();
    }
  }

  function syncImage(img){
    if(!img||!img.isConnected)return;
    // Locked Grovanova Home already contains the approved troll trio in its master art.
    // Never inject another character there.
    if(img.closest('#home-screen .bc15-locked-home'))return;
    const troll=selected();
    const parent=img.parentElement;
    cleanLegacy(parent,img);
    img.src=troll.src;
    img.removeAttribute('srcset');
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.classList.add('laria-premium-troll-art');
    img.style.removeProperty('visibility');
  }

  function syncLabels(){
    const troll=selected();
    doc.querySelectorAll('.locked-fox-label').forEach(el=>{
      el.textContent=troll.label;
      el.classList.add('laria-troll-label');
    });
    doc.querySelectorAll('[aria-label*="rev" i]').forEach(el=>{
      const value=el.getAttribute('aria-label');
      if(value)el.setAttribute('aria-label',value.replace(/reven|rev/gi,'trollet'));
    });
  }

  function sync(){
    queued=false;
    doc.querySelectorAll(IMAGE_SELECTORS).forEach(syncImage);
    syncLabels();
    doc.documentElement.dataset.lariaTroll=choice();
    doc.documentElement.style.setProperty('--laria-selected-troll','url("'+selected().src+'")');
  }
  function refresh(){
    if(queued)return;
    queued=true;
    (root.requestAnimationFrame||root.setTimeout)(sync);
  }

  function init(){
    refresh();
    new MutationObserver(changes=>{
      if(changes.some(change=>{
        if(change.type==='attributes')return change.target?.matches?.(IMAGE_SELECTORS);
        return Array.from(change.addedNodes||[]).some(node=>
          node.nodeType===1&&(node.matches?.(IMAGE_SELECTORS)||node.querySelector?.(IMAGE_SELECTORS))
        );
      }))refresh();
    }).observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class']});
    root.addEventListener('resize',refresh,{passive:true});
    doc.addEventListener('laria:troll-changed',refresh);
  }

  root.LARIA_TROLL=Object.freeze({
    ids:Object.freeze(Object.keys(TROLLS)),
    choice,
    selected,
    source:id=>(TROLLS[id]||TROLLS[DEFAULT]).src,
    label:id=>(TROLLS[id]||TROLLS[DEFAULT]).label,
    refresh
  });

  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(window);
