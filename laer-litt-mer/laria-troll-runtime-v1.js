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
  // Motion remains opt-in. The manifest registers actual reviewed files;
  // absent or invalid clips leave the original character and CSS available.
  const MOTION_REVIEW=new URLSearchParams(root.location.search).get('laria-troll-motion')==='1';
  const MOTION_ROOT='./assets/trollactor-motion/storesoster/';
  const MOTION_IDENTITY_SHA='b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89';
  const MOTION_KINDS=new Set(['idle','wave','think','hint','celebrate','support']);
  const MOOD_ALIASES=Object.freeze({help:'hint',encourage:'support'});
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
    '.bc15-v16-troll > img',
    '.dashboard-mascot[data-laria-legacy-troll] > img',
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
    '.gm-book-fox-art > img',
    '.journey-player-v4 > img',
    '.journey-player-v5 > img'
  ].join(',');
  // Profile pictures and menu thumbnails are deliberately absent. A loop
  // belongs to one visible scene companion, never every copy of the artwork.
  const MAIN_ACTORS=[
    '.bc15-v16-troll','.bc12-fox','.dashboard-mascot[data-laria-legacy-troll]',
    '.tv-actor-touch','.eg-companion-actor','.ki-companion-actor','.gv-troll',
    '.task-fox-companion','.gm-fox-art','.gm-book-fox-art',
    '.locked-journey-traveler','.fr2-guide','.fr4-scene-fox','.mp-mascot',
    '.mp-pick-mentor','.word-hunt-top','.premium-globe-header'
  ].join(',');

  const timers=new WeakMap();
  const motionRuns=new Map();
  const motionAssets=new Map();
  const reducedMotion=root.matchMedia?.('(prefers-reduced-motion: reduce)');
  const greeted=new WeakSet();
  const idlePaused=new WeakSet();
  let queued=false,lifecycleQueued=false,pageSuspended=false;
  let manifestRequest=null,manifestClips=null,idleUnavailable=false;

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
    return el?.closest?.('.laria-troll-host,.locked-journey-traveler,.task-fox-companion,.fr2-guide,.fr2-mastery-banner,.fr4-scene-fox,.mp-avatar,.mp-mascot,.mp-art-practice,.mp-pick-easy-intro,.mp-pick-mentor,.word-hunt-top,.premium-globe-header,.journey-player-v4,.journey-player-v5')||null;
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
  function motionAllowed(){
    return MOTION_REVIEW&&choice()==='storesoster'&&!reducedMotion?.matches&&
      !doc.hidden&&!pageSuspended&&!!root.fetch&&!!root.URL?.createObjectURL&&
      !!root.crypto?.subtle&&!!root.Blob;
  }
  function visibleHost(host){
    if(!host?.isConnected||doc.hidden||pageSuspended)return false;
    if(host.getClientRects&&host.getClientRects().length===0)return false;
    if(host.closest?.('[hidden],[inert]'))return false;
    const screen=host.closest?.('.screen');
    if(screen&&!screen.classList.contains('active'))return false;
    for(let node=host;node&&node!==doc;node=node.parentElement){
      const style=root.getComputedStyle?.(node);
      if(style&&(style.display==='none'||style.visibility==='hidden'||
        style.visibility==='collapse'||style.opacity==='0'))return false;
    }
    return true;
  }
  function readManifest(value){
    if(value?.version!==1||value.status!=='review-only'||value.identity!=='storesoster'||
      value.identity_sha256!==MOTION_IDENTITY_SHA||!value.clips||typeof value.clips!=='object'){
      throw new Error('Invalid troll motion manifest');
    }
    const clips={};
    for(const kind of MOTION_KINDS){
      const entry=value.clips[kind];
      // Validate each entry separately: a missing unfinished state must never
      // disable the existing, independently verified wave.
      if(!entry||!/^[-a-z0-9]+\.webp$/.test(entry.filename)||
        !/^[a-f0-9]{64}$/.test(entry.sha256)||
        !Number.isInteger(entry.duration_ms)||entry.duration_ms<100||entry.duration_ms>30000||
        !Number.isInteger(entry.bytes)||entry.bytes<1||entry.bytes>20*1024*1024||
        !Number.isInteger(entry.width)||entry.width<1||entry.width>2048||
        !Number.isInteger(entry.height)||entry.height<1||entry.height>2048||
        entry.loop_count!==(kind==='idle'?0:1))continue;
      clips[kind]=Object.freeze({...entry,src:MOTION_ROOT+entry.filename});
    }
    return Object.freeze(clips);
  }
  function motionManifest(){
    if(!manifestRequest){
      const request=root.fetch(MOTION_ROOT+'manifest.json',{cache:'no-cache'})
        .then(response=>{
          if(!response.ok)throw new Error('Troll motion manifest unavailable');
          return response.json();
        }).then(value=>{
          const clips=readManifest(value);
          if(manifestRequest===request){
            manifestClips=clips;
            if(!clips.idle)idleUnavailable=true;
          }
          return clips;
        }).catch(error=>{
          if(manifestRequest===request)manifestRequest=null;
          throw error;
        });
      manifestRequest=request;
    }
    return manifestRequest;
  }
  function clearMotion(host){
    if(!host)return;
    const run=motionRuns.get(host);
    motionRuns.delete(host);
    if(run)root.clearTimeout(run.loadingTimer);
    delete host.dataset.lariaTrollSequence;
    delete host.dataset.lariaTrollLoading;
    const img=host.querySelector?.(':scope > img.laria-premium-troll-art');
    if(img&&img.getAttribute('src')!==selected().src)img.setAttribute('src',selected().src);
    if(run?.url)root.URL.revokeObjectURL(run.url);
  }
  function finishMood(host,resumeIdle=true){
    root.clearTimeout(timers.get(host));
    timers.delete(host);
    clearMotion(host);
    host.dataset.lariaTrollMood='idle';
    clearSpeech(host);
    if(resumeIdle)scheduleLifecycle();
  }
  function motionKey(sequence){return sequence.src+'|'+sequence.sha256+'|'+sequence.bytes;}
  function motionBlob(sequence){
    const key=motionKey(sequence);
    if(!motionAssets.has(key)){
      const request=root.fetch(sequence.src).then(async response=>{
        if(!response.ok)throw new Error('Troll motion unavailable');
        const bytes=await response.arrayBuffer();
        if(bytes.byteLength!==sequence.bytes)throw new Error('Troll motion size mismatch');
        const digest=await root.crypto.subtle.digest('SHA-256',bytes);
        const hash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
        if(hash!==sequence.sha256)throw new Error('Troll motion hash mismatch');
        return new root.Blob([bytes],{type:'image/webp'});
      }).catch(error=>{
        if(motionAssets.get(key)===request)motionAssets.delete(key);
        throw error;
      });
      motionAssets.set(key,request);
    }
    return motionAssets.get(key);
  }
  function currentMotion(host,run){
    return motionRuns.get(host)===run&&run.id===choice()&&
      motionAllowed()&&visibleHost(host);
  }
  function cssDuration(kind,options){
    const requested=Number(options?.duration);
    return Number.isFinite(requested)&&requested>0?requested:(MOOD_MS[kind]||1200);
  }
  function cssFallback(host,run){
    if(motionRuns.get(host)!==run)return;
    clearMotion(host);
    if(run.kind!=='idle')timers.set(host,root.setTimeout(()=>finishMood(host),run.fallbackDuration));
  }
  function failMotion(host,run){
    if(motionRuns.get(host)!==run)return;
    if(run.sequence){
      const key=motionKey(run.sequence);
      if(motionAssets.get(key)===run.assetRequest)motionAssets.delete(key);
    }else if(manifestRequest===run.manifestRequest)manifestRequest=null;
    if(run.clipKind==='idle')idleUnavailable=true;
    // A failure leaves V1 on screen. Observer refreshes must not turn an
    // unavailable loop into repeated downloads; another explicit action may retry.
    idlePaused.add(host);
    finishMood(host,false);
  }
  async function loadMotion(host,run){
    try{
      run.manifestRequest=motionManifest();
      const clips=await run.manifestRequest;
      if(!currentMotion(host,run))return;
      run.sequence=clips[run.clipKind];
      if(!run.sequence){cssFallback(host,run);return;}
      run.assetRequest=motionBlob(run.sequence);
      const blob=await run.assetRequest;
      if(!currentMotion(host,run))return;
      // A fresh blob URL gives every play its own animation timeline, while
      // the encoded bytes are fetched only once. Keep V1 visible until decode.
      run.url=root.URL.createObjectURL(blob);
      const next=run.original.cloneNode(false);
      next.removeAttribute('srcset');
      next.dataset.troll=run.id;
      next.decoding='async';
      await new Promise((resolve,reject)=>{
        next.onload=resolve;
        next.onerror=reject;
        next.src=run.url;
      });
      if(next.decode)await next.decode();
      next.onload=null;
      next.onerror=null;
      if(next.naturalWidth!==run.sequence.width||next.naturalHeight!==run.sequence.height){
        throw new Error('Troll motion dimensions mismatch');
      }
      if(!currentMotion(host,run))return;
      const visible=host.querySelector(':scope > img.laria-premium-troll-art');
      if(!visible)return;
      root.clearTimeout(run.loadingTimer);
      delete host.dataset.lariaTrollLoading;
      host.dataset.lariaTrollSequence=run.clipKind;
      host.dataset.troll=run.id;
      visible.replaceWith(next);
      // Legacy callers supply short CSS mood durations. A decoded clip owns
      // its full duration; a later reaction can still cancel it immediately.
      if(run.sequence.loop_count!==0){
        timers.set(host,root.setTimeout(()=>finishMood(host),run.sequence.duration_ms));
      }
    }catch(_){
      failMotion(host,run);
    }finally{
      if(motionRuns.get(host)===run&&!currentMotion(host,run))finishMood(host,false);
    }
  }
  function playMotion(host,kind,options={}){
    const clipKind=kind==='curious'?'think':kind;
    const img=host?.querySelector?.(':scope > img.laria-premium-troll-art');
    if(!motionAllowed()||!MOTION_KINDS.has(clipKind)||!img||!visibleHost(host))return false;
    if(manifestClips&&!manifestClips[clipKind])return false;
    if(clipKind==='idle'&&(idleUnavailable||idlePaused.has(host)||host!==idleHost()))return false;
    const run={id:choice(),kind,clipKind,sequence:null,original:img,url:null,
      fallbackDuration:cssDuration(kind,options)};
    motionRuns.set(host,run);
    host.dataset.lariaTrollLoading=clipKind;
    run.loadingTimer=root.setTimeout(()=>{
      failMotion(host,run);
    },10000);
    void loadMotion(host,run);
    return true;
  }
  function stopMotions(){
    for(const host of motionRuns.keys())finishMood(host,false);
  }
  function idleHost(){
    const hosts=Array.from(doc.querySelectorAll(MAIN_ACTORS)).filter(host=>
      visibleHost(host)&&host.querySelector(':scope > img.laria-premium-troll-art'));
    return hosts.find(host=>{
      const run=motionRuns.get(host);
      return run&&run.clipKind!=='idle';
    })||hosts[0]||null;
  }
  function reconcileMotions(){
    lifecycleQueued=false;
    const active=motionAllowed()?idleHost():null;
    for(const [host,run] of motionRuns){
      if(!currentMotion(host,run)||(run.clipKind==='idle'&&host!==active))finishMood(host,false);
    }
    if(active&&!motionRuns.has(active)&&!timers.has(active)&&
      (!active.dataset.lariaTrollMood||active.dataset.lariaTrollMood==='idle')){
      playMotion(active,'idle');
    }
  }
  function scheduleLifecycle(){
    if(lifecycleQueued)return;
    lifecycleQueued=true;
    (root.requestAnimationFrame||root.setTimeout)(reconcileMotions);
  }
  function mood(host,kind='idle',opts={}){
    kind=MOOD_ALIASES[kind]||kind;
    if(!host||!MOODS.has(kind))return false;
    root.clearTimeout(timers.get(host));
    timers.delete(host);
    clearMotion(host);
    idlePaused.delete(host);
    const playing=playMotion(host,kind,opts);
    host.dataset.lariaTrollMood=kind;
    if(opts.say!==false){
      const text=typeof opts.say==='string'?opts.say:line(kind);
      if(text)speech(host,text);
    }
    if(kind!=='idle'&&!playing){
      timers.set(host,root.setTimeout(()=>finishMood(host),cssDuration(kind,opts)));
    }else if(kind==='idle')clearSpeech(host);
    scheduleLifecycle();
    return true;
  }

  function cleanLegacy(parent,img){
    parent?.querySelectorAll?.(':scope > .laria-fox-wardrobe-placed,:scope > .laria-fox-wardrobe-art').forEach(el=>el.remove());
    parent?.classList?.remove('laria-fox-wardrobe-anchor');
    if(parent?.dataset){
      delete parent.dataset.lariaFoxMood;
      delete parent.dataset.lariaFoxSelected;
      if(parent.dataset.troll!==choice())parent.dataset.troll=choice();
      if(!parent.classList.contains('laria-troll-host'))parent.classList.add('laria-troll-host');
      if(!parent.classList.contains('laria-troll-actor'))parent.classList.add('laria-troll-actor');
      if(!parent.dataset.lariaTrollMood)parent.dataset.lariaTrollMood='idle';
    }
    if(img?.dataset){
      delete img.dataset.lariaWardrobeSignature;
      if(img.dataset.troll!==choice())img.dataset.troll=choice();
    }
  }

  function syncImage(img){
    if(!img||!img.isConnected)return;
    const troll=selected(),parent=img.parentElement;
    // The review sequence temporarily owns src. MutationObserver still sees
    // that assignment, but must not immediately replace the animation with V1.
    if(parent?.dataset?.lariaTrollSequence){
      const run=motionRuns.get(parent);
      if(run&&currentMotion(parent,run))return;
      finishMood(parent);
    }
    // The Home master is byte-locked. Change the separate DOM companion only,
    // never paint or overwrite anything into the original landscape.
    if(img.closest('#home-screen .bc15-locked-home')){
      if(img.getAttribute('src')!==troll.src)img.setAttribute('src',troll.src);
      img.dataset.troll=troll.id;
      return;
    }
    cleanLegacy(parent,img);
    // Reassigning an already identical src triggers the MutationObserver again
    // in WebKit. Avoid unbounded redraws and unnecessary WebP decodes on iPad.
    if(img.getAttribute('src')!==troll.src)img.setAttribute('src',troll.src);
    img.removeAttribute('srcset');
    img.alt='';
    img.setAttribute('aria-hidden','true');
    if(!img.classList.contains('laria-premium-troll-art'))img.classList.add('laria-premium-troll-art');
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
      if(el.textContent!==troll.label)el.textContent=troll.label;
      el.classList.add('laria-troll-label');
    });
    doc.querySelectorAll('[aria-label*="rev" i]').forEach(el=>{
      const value=el.getAttribute('aria-label');
      // Replace only the retired character words. A raw /rev/ match also
      // corrupts ordinary labels such as "Dyrevenner" in Ordjakt.
      if(value)el.setAttribute('aria-label',value.replace(/\b(?:reven|rev)\b/gi,'trollet'));
    });
  }

  function sync(){
    queued=false;
    doc.querySelectorAll(IMAGE_SELECTORS).forEach(syncImage);
    syncLabels();
    if(doc.documentElement.dataset.lariaTroll!==choice())doc.documentElement.dataset.lariaTroll=choice();
    const artUrl='url("'+selected().src+'")';
    if(doc.documentElement.style.getPropertyValue('--laria-selected-troll')!==artUrl)
      doc.documentElement.style.setProperty('--laria-selected-troll',artUrl);
    syncLegacyHomeCopy();
    scheduleLifecycle();
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
      const retiredHomeActor=event.target.closest?.('#home-screen .dashboard-mascot[data-laria-legacy-troll]');
      if(retiredHomeActor){
        mood(retiredHomeActor,'curious',{say:'Skal vi utforske sammen?'});
        return;
      }
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
        if(change.type==='attributes')return ['src','class'].includes(change.attributeName)&&change.target?.matches?.(IMAGE_SELECTORS);
        return Array.from(change.addedNodes||[]).some(node=>
          node.nodeType===1&&(node.matches?.(IMAGE_SELECTORS)||node.querySelector?.(IMAGE_SELECTORS))
        );
      }))refresh();
      if(changes.some(change=>{
        if(change.type==='childList')return change.removedNodes?.length||Array.from(change.addedNodes||[]).some(node=>
          node.nodeType===1&&(node.matches?.(MAIN_ACTORS)||node.querySelector?.(MAIN_ACTORS)));
        return change.attributeName!=='src'&&(change.target?.matches?.('.screen,'+MAIN_ACTORS)||
          change.target?.querySelector?.(MAIN_ACTORS)||
          Array.from(motionRuns.keys()).some(host=>change.target===host||change.target?.contains?.(host)));
      }))scheduleLifecycle();
    }).observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class','style','hidden','inert']});
    root.addEventListener('resize',refresh,{passive:true});
    doc.addEventListener('laria:troll-changed',()=>{stopMotions();refresh();});
    const onMotionPreference=()=>{
      if(reducedMotion?.matches)stopMotions();
      else scheduleLifecycle();
    };
    if(reducedMotion?.addEventListener)reducedMotion.addEventListener('change',onMotionPreference);
    else reducedMotion?.addListener?.(onMotionPreference);
    doc.addEventListener('visibilitychange',()=>{
      if(doc.hidden)stopMotions();
      else scheduleLifecycle();
    });
    root.addEventListener('pagehide',()=>{pageSuspended=true;stopMotions();});
    root.addEventListener('pageshow',()=>{pageSuspended=false;scheduleLifecycle();});
  }

  root.LARIA_TROLL_ACTOR=Object.freeze({
    ids:Object.freeze(Object.keys(TROLLS)),
    choice,selected,
    source:id=>(TROLLS[id]||TROLLS[DEFAULT]).src,
    label:id=>(TROLLS[id]||TROLLS[DEFAULT]).label,
    persistChoice,openChooser,refresh,mood,
    motionReviewEnabled:()=>MOTION_REVIEW
  });
  root.LARIA_TROLL=root.LARIA_TROLL_ACTOR;

  // Technical lab only. Loading it dynamically avoids changing the production
  // component tree, artwork, selection or saved progress for ordinary users.
  if(new URLSearchParams(root.location.search).get('trollactor2-prototype')==='1'){
    const css=doc.createElement('link');css.rel='stylesheet';css.href='./trollactor2-prototype.css?v=20261120-prototype1';doc.head.appendChild(css);
    const script=doc.createElement('script');script.src='./trollactor2-prototype.js?v=20261120-prototype1';script.defer=true;doc.head.appendChild(script);
  }
  // The production layer engine ships inert until an approved, verified art pack
  // is explicitly connected. It never replaces the locked V1 character by itself.
  if(new URLSearchParams(root.location.search).get('trollactor2-layered')==='1'){
    const css=doc.createElement('link');css.rel='stylesheet';css.href='./trollactor2-layered.css?v=20261120-layered1';doc.head.appendChild(css);
    const script=doc.createElement('script');script.src='./trollactor2-layered.js?v=20261120-layered1';script.defer=true;doc.head.appendChild(script);
  }

  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(window);
