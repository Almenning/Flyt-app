/* Læria Premium Beta — TrollActor v1
 * One selected forest troll is the living companion across journeys, tasks and free play.
 * Legacy fox classes remain only as migration anchors. Grovanova Home is never modified.
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
  const MOODS=new Set(['idle','wave','walking','think','hint','celebrate','support','curious']);
  const MOOD_MS=Object.freeze({wave:1050,walking:1000,think:1250,hint:1800,celebrate:1250,support:1500,curious:1100});
  const LINES=Object.freeze({
    wave:['Hei! Jeg blir med.','Klar for neste?'],
    think:['Hmm … la oss se.','Jeg tenker sammen med deg.'],
    hint:['Se etter et lite spor.','Prøv én ting om gangen.'],
    celebrate:['Der satt den!','Yes! Du fant det!','Det klarte du!'],
    support:['Godt forsøk. Vi prøver igjen.','Nesten. Jeg er med deg.'],
    curious:['Hva tror du skjer her?','Skal vi undersøke?']
  });
  const IMAGE_SELECTORS=[
    '.bc12-fox > img',
    '.top .avatar.profile-fox-avatar > img',
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
    '.premium-globe-header > img.premium-globe-fox',
    '.fd-chapter-fox > img',
    '.mh-story-fox > img',
    '.country-story-fox',
    '.gm-fox-art > img',
    '.gm-book-fox-art > img'
  ].join(',');

  const timers=new WeakMap();
  const greeted=new WeakSet();
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
  function persistChoice(id){
    if(!TROLLS[id])return false;
    let saved=false;
    try{
      if(typeof state!=='undefined'&&state?.profile){
        state.profile={...state.profile,tallvikaTroll:id};
        if(typeof saveState==='function')saveState();
        saved=true;
      }
    }catch(_){}
    try{
      const bridge=root.LARIA_TALLVIKA_BRIDGE;
      const s=bridge?.state?.();
      if(s?.profile){
        s.profile={...s.profile,tallvikaTroll:id};
        bridge.save?.();
        saved=true;
      }
    }catch(_){}
    doc.dispatchEvent(new CustomEvent('laria:troll-changed',{detail:{id}}));
    refresh();
    return saved;
  }
  function ensureChooser(){
    let d=doc.getElementById('laria-premium-troll-dialog');
    if(d)return d;
    d=doc.createElement('dialog');
    d.id='laria-premium-troll-dialog';
    d.className='laria-premium-troll-dialog';
    d.innerHTML='<button type="button" class="laria-troll-dialog-close" aria-label="Lukk">×</button>'+
      '<span class="laria-troll-dialog-eyebrow">Lærias eventyrvenner</span>'+
      '<h2>Mine troll</h2>'+
      '<p class="laria-troll-dialog-lead">Velg hvem som skal bli med deg gjennom Læria.</p>'+
      '<div class="laria-troll-choices" role="group" aria-label="Velg troll"></div>'+
      '<p class="laria-troll-dialog-note">Valget følger deg i reiser, oppgaver og lek.</p>';
    doc.body.appendChild(d);
    d.querySelector('.laria-troll-dialog-close').addEventListener('click',()=>d.close());
    d.addEventListener('click',e=>{if(e.target===d)d.close();});
    return d;
  }
  function openChooser(){
    const d=ensureChooser(),active=choice();
    const choices=d.querySelector('.laria-troll-choices');
    choices.innerHTML=Object.values(TROLLS).map(t=>
      '<button type="button" class="laria-troll-choice" data-troll-choice="'+t.id+'" aria-pressed="'+(t.id===active?'true':'false')+'">'+
      '<img src="'+t.src+'" alt="" aria-hidden="true"><strong>'+t.label+'</strong>'+
      '<span>'+(t.id===active?'Valgt':'Velg')+'</span></button>'
    ).join('');
    choices.querySelectorAll('[data-troll-choice]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.trollChoice;
      persistChoice(id);
      choices.querySelectorAll('[data-troll-choice]').forEach(b=>{
        const on=b.dataset.trollChoice===id;
        b.setAttribute('aria-pressed',on?'true':'false');
        b.querySelector('span').textContent=on?'Valgt':'Velg';
      });
      root.setTimeout(()=>d.close(),260);
    }));
    if(!d.open)d.showModal();
  }
  function line(kind){
    const lines=LINES[kind]||[];
    return lines.length?lines[Math.floor(Math.random()*lines.length)]:'';
  }
  function hostFor(el){
    return el?.closest?.('.laria-troll-host,.locked-journey-traveler,.task-fox-companion,.fr2-guide,.fr2-mastery-banner,.fr4-scene-fox,.mp-avatar,.mp-mascot,.mp-art-practice,.mp-pick-easy-intro,.mp-pick-mentor,.word-hunt-top,.premium-globe-header')||null;
  }
  function speech(host,text){
    if(!host||!text||host.closest('#home-screen .bc15-locked-home'))return;
    let bubble=host.querySelector(':scope > .laria-troll-speech');
    if(!bubble){
      bubble=doc.createElement('div');
      bubble.className='laria-troll-speech';
      bubble.setAttribute('role','status');
      bubble.setAttribute('aria-live','polite');
      host.appendChild(bubble);
    }
    bubble.textContent=text;
    bubble.dataset.show='true';
  }
  function clearSpeech(host){
    const bubble=host?.querySelector?.(':scope > .laria-troll-speech');
    if(bubble)delete bubble.dataset.show;
  }
  function mood(host,kind='idle',opts={}){
    if(!host||!MOODS.has(kind))return false;
    root.clearTimeout(timers.get(host));
    host.dataset.lariaTrollMood=kind;
    if(opts.say!==false){
      const text=typeof opts.say==='string'?opts.say:line(kind);
      if(text)speech(host,text);
    }
    if(kind!=='idle'){
      timers.set(host,root.setTimeout(()=>{
        if(!host.isConnected)return;
        host.dataset.lariaTrollMood='idle';
        clearSpeech(host);
      },Number(opts.duration)||MOOD_MS[kind]||1200));
    }else clearSpeech(host);
    return true;
  }

  function cleanLegacy(parent,img){
    parent?.querySelectorAll?.(':scope > .laria-fox-wardrobe-placed,:scope > .laria-fox-wardrobe-art').forEach(el=>el.remove());
    parent?.classList?.remove('laria-fox-wardrobe-anchor');
    if(parent?.dataset){
      delete parent.dataset.lariaFoxMood;
      delete parent.dataset.lariaFoxSelected;
      parent.dataset.troll=choice();
      parent.classList.add('laria-troll-host','laria-troll-actor');
      if(!parent.dataset.lariaTrollMood)parent.dataset.lariaTrollMood='idle';
    }
    if(img?.dataset){
      delete img.dataset.lariaWardrobeSignature;
      img.dataset.troll=choice();
    }
  }

  function syncImage(img){
    if(!img||!img.isConnected)return;
    if(img.closest('#home-screen .bc15-locked-home'))return;
    const troll=selected(),parent=img.parentElement;
    cleanLegacy(parent,img);
    img.src=troll.src;
    img.removeAttribute('srcset');
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.classList.add('laria-premium-troll-art');
    // Legacy fox styles still contain !important visibility guards. Once this
    // node has become TrollActor art, runtime ownership is explicit.
    img.style.setProperty('visibility','visible','important');
    img.style.setProperty('display','block','important');
    if(parent&&!greeted.has(parent)&&parent.closest('.screen.active')){
      greeted.add(parent);
      root.setTimeout(()=>{
        // A late welcome must never replace a task-specific reaction or speech.
        if(parent.isConnected&&(!parent.dataset.lariaTrollMood||parent.dataset.lariaTrollMood==='idle')){
          mood(parent,'wave',{duration:1200});
        }
      },120);
    }
  }

  function syncLegacyHomeCopy(){
    doc.querySelectorAll('#home-screen .bc12:not(.bc15-locked-home)').forEach(home=>{
      const nav=home.querySelector('.bc12-nav [data-camp="wardrobe"]');
      if(nav){
        nav.setAttribute('aria-label','Mine troll');
        [...nav.childNodes].filter(n=>n.nodeType===3).forEach(n=>{n.nodeValue='Mine troll';});
      }
      const call=home.querySelector('[data-camp-fox-call]');
      if(call){call.textContent='Mine troll · Se trollet ditt ›';call.setAttribute('aria-label','Åpne Mine troll');}
      const quest=home.querySelector('.bc12-quest > span:nth-child(2)');
      if(quest)quest.innerHTML=(quest.innerHTML||'').replace(/reven/gi,'trollet');
      const img=home.querySelector('.bc12-fox > img');
      if(img)img.alt='Det valgte trollet ditt venter på stien';
    });
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
    syncLegacyHomeCopy();
  }
  function refresh(){
    if(queued)return;
    queued=true;
    (root.requestAnimationFrame||root.setTimeout)(sync);
  }

  function afterAnswer(){
    const screen=doc.querySelector('#session-screen.active');
    const feedback=screen?.querySelector('#feedback');
    if(!feedback||root.getComputedStyle(feedback).display==='none')return;
    const host=screen.querySelector('.task-fox-companion.laria-troll-host');
    if(!host)return;
    mood(host,feedback.classList.contains('bad')?'support':'celebrate');
  }

  function bindInteractions(){
    doc.addEventListener('click',event=>{
      const trollEntry=event.target.closest?.('#home-screen .bc12:not(.bc15-locked-home) [data-camp="wardrobe"],#home-screen .bc12:not(.bc15-locked-home) [data-camp-fox-call]');
      if(trollEntry){
        event.preventDefault();
        event.stopImmediatePropagation();
        openChooser();
        return;
      }
      const hotspot=event.target.closest?.('.locked-journey-hotspot,[data-locked-place]');
      if(hotspot){
        const host=hotspot.closest('.locked-journey-map,.locked-journey-board')?.querySelector('.locked-journey-traveler.laria-troll-host');
        if(host)mood(host,'walking',{say:false});
        return;
      }
      const hint=event.target.closest?.('[data-hint],[data-action="hint"],.hint-button,.task-hint,.show-hint');
      if(hint){
        const host=doc.querySelector('#session-screen.active .task-fox-companion.laria-troll-host');
        if(host)mood(host,'hint');
        return;
      }
      const answer=event.target.closest?.('#session-screen.active .task-interaction button,#session-screen.active .answers button,#session-screen.active .answer,#session-screen.active [role="button"]');
      if(answer)root.setTimeout(afterAnswer,90);
    },true);

    const session=doc.getElementById('session-screen');
    if(session){
      let last='';
      new MutationObserver(()=>{
        const feedback=session.querySelector('#feedback');
        if(!session.classList.contains('active')||!feedback||root.getComputedStyle(feedback).display==='none'){last='';return;}
        const sig=(feedback.className||'')+'|'+(feedback.textContent||'').trim();
        if(sig&&sig!==last){last=sig;afterAnswer();}
      }).observe(session,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
    }
  }

  function init(){
    refresh();
    bindInteractions();
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

  root.LARIA_TROLL_ACTOR=Object.freeze({
    ids:Object.freeze(Object.keys(TROLLS)),
    choice,selected,
    source:id=>(TROLLS[id]||TROLLS[DEFAULT]).src,
    label:id=>(TROLLS[id]||TROLLS[DEFAULT]).label,
    persistChoice,openChooser,refresh,mood
  });
  root.LARIA_TROLL=root.LARIA_TROLL_ACTOR;

  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(window);
