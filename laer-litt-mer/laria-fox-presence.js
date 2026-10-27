/* Læria: one selected, equipped fox is a living companion.
 * Presentation only: this layer never writes learning, mastery or rewards.
 * Depends on the existing LARIA_FOX and LARIA_FOX_WARDROBE systems.
 */
(function(root){
  'use strict';
  const doc=root.document;
  if(!doc)return;
  const VALID=new Set(['idle','greet','walking','celebrate','support','curious']);
  const durations={greet:930,walking:1150,celebrate:1050,support:850,curious:900};
  const activeTimers=new WeakMap(),seen=new WeakSet();
  let pending=false;

  function activeHost(){
    if(doc.querySelector('#session-screen.active.task-scene'))
      return doc.querySelector('#session-screen.active .task-fox-companion');
    const map=doc.querySelector('.screen.active .locked-journey-map');
    if(map)return map.querySelector('.locked-journey-traveler');
    if(doc.querySelector('#home-screen.active'))
      return doc.querySelector('#home-screen.active .bc12-fox');
    return null;
  }
  function artworkFor(host){
    return host?.querySelector(':scope > .laria-fox-wardrobe-art')||
      host?.querySelector(':scope > .laria-fox-wardrobe-placed')||null;
  }
  function react(kind='greet',host=activeHost()){
    if(!host||host.dataset?.troll||!VALID.has(kind))return false;
    root.clearTimeout(activeTimers.get(host));
    host.dataset.lariaFoxMood='idle';
    const art=artworkFor(host);
    if(art)art.dataset.lariaFoxMood='idle';
    // Restart the same animation on consecutive attempts without duplicating a fox.
    void host.offsetWidth;
    host.dataset.lariaFoxMood=kind;
    if(art)art.dataset.lariaFoxMood=kind;
    if(kind!=='idle'){
      activeTimers.set(host,root.setTimeout(()=>{
        if(!host.isConnected)return;
        host.dataset.lariaFoxMood='idle';
        const current=artworkFor(host);
        if(current)current.dataset.lariaFoxMood='idle';
      },durations[kind]||1000));
    }
    return true;
  }

  function travelTo(index){
    const map=doc.querySelector('.screen.active .locked-journey-map');
    if(!map||!Number.isInteger(Number(index)))return false;
    const stops=map.querySelectorAll('.locked-journey-hotspot');
    const stop=stops[Number(index)],fox=map.querySelector('.locked-journey-traveler');
    if(!stop||!fox)return false;
    // Move onto physical stepping stones, grounding at the feet rather
    // than hovering beside the interactive destination sign.
    const point=root.LARIA_LOCKED_JOURNEYS?.foxFootAnchor?.(
      map.dataset.journeySubject,Number(index));
    if(!point)return false;
    fox.style.setProperty('--fox-x',point.x+'%');
    fox.style.setProperty('--fox-y',point.y+'%');
    if(fox.dataset.troll){
      fox.dataset.lariaTrollStop=String(index);
      return true;
    }
    fox.dataset.lariaFoxStop=String(index);
    fox.dataset.lariaFoxSelected=String(root.LARIA_FOX?.choice?.()||'boy');
    react('walking',fox);
    return true;
  }

  function afterAnswer(){
    const screen=doc.querySelector('#session-screen.active.task-scene');
    if(!screen)return;
    const feedback=screen.querySelector('#feedback');
    if(!feedback||root.getComputedStyle(feedback).display==='none')return;
    react(feedback.classList.contains('bad')?'support':'celebrate');
  }

  function refresh(){
    pending=false;
    const host=activeHost();
    if(!host||!host.isConnected)return;
    const avatar=root.LARIA_FOX?.choice?.()||'boy';
    host.dataset.lariaFoxSelected=avatar;
    if(!host.hasAttribute('data-laria-fox-mood'))host.dataset.lariaFoxMood='idle';
    // The original DOM image and outfit rig are the SAME chosen avatar.
    // Never add a separate fallback mascot on top.
    root.LARIA_FOX_WARDROBE?.refresh?.();
    if(!seen.has(host)){
      seen.add(host);
      if(host.closest('#home-screen'))react('greet',host);
      else if(host.closest('#session-screen'))react('curious',host);
    }
  }
  function scheduleRefresh(){
    if(pending)return;
    pending=true;
    root.requestAnimationFrame(refresh);
  }
  function init(){
    // Session answers can be taps, drags or keyboard interactions. Observe
    // the existing feedback once, rather than reimplementing grading here.
    const session=doc.getElementById('session-screen');
    let lastFeedback='';
    if(session)new MutationObserver(()=>{
      const box=session.querySelector('#feedback');
      if(!session.classList.contains('active')||!box||root.getComputedStyle(box).display==='none'){
        lastFeedback='';return;
      }
      const heading=session.querySelector('#session-count')?.textContent||'';
      const message=box.textContent?.trim()||'';
      const signature=heading+'|'+box.className+'|'+message;
      if(!message||signature===lastFeedback)return;
      lastFeedback=signature;
      afterAnswer();
    }).observe(session,{attributes:true,attributeFilter:['class','style'],childList:true,subtree:true});
    doc.addEventListener('click',e=>{
      const hotspot=e.target.closest?.('.screen.active .locked-journey-hotspot[data-locked-place]');
      if(hotspot){
        travelTo(Number(hotspot.dataset.lockedPlace));
        return;
      }
      const answer=e.target.closest?.('#session-screen.active .task-interaction button, #session-screen.active .answers button, #session-screen.active .task-interaction [role="button"], #session-screen.active .answer');
      if(answer)root.requestAnimationFrame(afterAnswer);
    },true);
    doc.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){
        const answer=e.target.closest?.('#session-screen.active .task-interaction [role="button"]');
        if(answer)root.requestAnimationFrame(afterAnswer);
      }
    },true);
    new MutationObserver(changes=>{
      if(changes.some(m=>
        (m.type==='attributes'&&m.attributeName==='class'&&m.target.matches?.('.screen'))||
        (m.type==='childList'&&Array.from(m.addedNodes).some(n=>
          n.nodeType===1&&(n.matches?.('.bc12-fox,.locked-journey-traveler,.task-fox-companion')||
          n.querySelector?.('.bc12-fox,.locked-journey-traveler,.task-fox-companion'))))
      ))scheduleRefresh();
    }).observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    scheduleRefresh();
  }
  root.LARIA_FOX_PRESENCE=Object.freeze({
    refresh:scheduleRefresh,react,travelTo,
    activeAvatar:()=>root.LARIA_FOX?.choice?.()||'boy'
  });
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(window);
