/* Owner opt-in only. No app state, third-party TTS or automatic speech. */
export const PROFILES=Object.freeze([
  Object.freeze({id:'storesoster',name:'Storesøster',line:'Bra jobbet! Du klarte det.',pitch:.90,rate:.85}),
  Object.freeze({id:'lillesoster',name:'Lillesøster',line:'Wow, se på deg! Dette var flott!',pitch:1.25,rate:1}),
  Object.freeze({id:'lillebror',name:'Lillebror',line:'Hehe, jeg heier på deg!',pitch:1.15,rate:1.05})
]);

export function localNorwegianVoice(voices){
  const rank={nb:0,no:1,nn:2};
  return Array.from(voices||[])
    .filter(v=>v?.localService===true&&Object.hasOwn(rank,lang(v)))
    .sort((a,b)=>rank[lang(a)]-rank[lang(b)]||
      Number(/[-_]NO$/i.test(b.lang))-Number(/[-_]NO$/i.test(a.lang)))[0]||null;
}
function lang(voice){return String(voice?.lang||'').toLowerCase().split(/[-_]/,1)[0]}
const WAITING='Velg et troll for å høre en kort testreplikk.';
const NO_VOICE='Ingen lokal norsk stemme er tilgjengelig ennå. Kontroller stemmene på enheten og trykk igjen.';
const UNAVAILABLE='Talesyntese er ikke tilgjengelig i denne nettleseren.';

export function createAudition({synth,Utterance,onStatus,timer=setTimeout,cancelTimer=clearTimeout}){
  let active=null,watchdog,enabled=true;
  const say=(message)=>onStatus(message,!!active,enabled);
  const available=()=>!!(typeof synth?.speak==='function'&&typeof synth?.cancel==='function'&&typeof Utterance==='function');
  const ready=()=>say(available()?WAITING:UNAVAILABLE);

  // Release is used before the normal app interrupts/restarts its own speech.
  // It intentionally never calls global cancel(); that might clear a lesson.
  function release(message=WAITING){
    cancelTimer(watchdog);
    watchdog=undefined;
    active=null;
    say(message);
  }
  function stop(message='Stemmetesten er stoppet.'){
    const owned=!!active;
    release(message);
    if(owned)try{synth.cancel()}catch(_){}
  }
  function setEnabled(value){
    enabled=!!value;
    if(enabled)ready();
    else stop('Stemmetesten er slått av.');
  }
  function play(profile){
    if(!enabled){say('Slå på stemmetesten for å lytte.');return false}
    if(!available()){say(UNAVAILABLE);return false}
    try{
      if(active){say('Lytt ferdig, eller trykk «Stopp».');return false}
      if(synth.speaking||synth.pending||synth.paused){say('Vent til annen opplesning er ferdig.');return false}
      const voice=localNorwegianVoice(synth.getVoices?.());
      if(!voice){say(NO_VOICE);return false}
      const u=new Utterance(profile.line);
      u.lang=voice.lang.replaceAll('_','-');
      u.voice=voice;
      u.pitch=profile.pitch;
      u.rate=profile.rate;
      active=u;
      say('Starter '+profile.name.toLowerCase()+' …');
      u.onstart=()=>{if(active===u)say('Spiller '+profile.name.toLowerCase()+' …')};
      u.onend=()=>{if(active===u)release('Ferdig. Du kan lytte igjen.')};
      u.onerror=()=>{if(active===u)release('Kunne ikke spille av. Sjekk lyd og norsk stemme på enheten.')};
      watchdog=timer(()=>{if(active===u)stop('Avspillingen svarte ikke. Du kan prøve igjen.')},10000);
      // Stay inside the original tap/click for Safari/iOS user activation.
      synth.speak(u);
      return true;
    }catch(_){release('Stemmetesten kunne ikke startes.');return false}
  }
  return Object.freeze({play,stop,release,ready,setEnabled,available});
}

const STYLES=`
#laria-troll-voice-launcher{position:fixed;z-index:70;inset-inline-end:max(12px,env(safe-area-inset-right));top:calc(env(safe-area-inset-top) + 64px);max-width:calc(100vw - 24px)}
#laria-troll-voice-launcher,#laria-troll-voice-test button{min-height:44px;min-width:44px;padding:8px 12px;border:1px solid #86613f;border-radius:10px;background:#f5e3c3;color:#372416;font:700 .94rem/1.25 system-ui,sans-serif;cursor:pointer}
#laria-troll-voice-launcher:focus-visible,#laria-troll-voice-test :is(button,input):focus-visible{outline:3px solid #16471c;outline-offset:2px}
#laria-troll-voice-test:not([open]),#laria-troll-voice-launcher[hidden]{display:none!important}
#laria-troll-voice-test{box-sizing:border-box;max-width:min(28rem,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:18px;background:#fff6e5;color:#402d21;border:1px solid #86613f;border-radius:16px;font:1rem/1.4 system-ui,sans-serif}
#laria-troll-voice-test::backdrop{background:#271a14aa}
#laria-troll-voice-test h2{font-size:1.2rem;margin:0 0 6px}
#laria-troll-voice-test p{margin:7px 0}
#laria-troll-voice-test .ltv-options{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}
#laria-troll-voice-test .ltv-preference{display:flex;align-items:center;gap:8px;min-height:44px}
#laria-troll-voice-test .ltv-preference input{width:20px;height:20px;flex:none;accent-color:#5c4028}
#laria-troll-voice-test button:disabled{color:#62584e;background:#e5dfd3;cursor:default}
`;

export function mount(root=window){
  const doc=root.document;
  const flagged=()=>new URLSearchParams(root.location.search).get('lariaTrollVoiceTest')==='1';
  if(!flagged()||doc.getElementById('laria-troll-voice-test'))return;
  const home=doc.getElementById('home-screen'),onboarding=doc.getElementById('onboarding');
  if(!home)return;
  const dialog=doc.createElement('dialog');
  if(typeof dialog.showModal!=='function')return;
  dialog.id='laria-troll-voice-test';
  dialog.setAttribute('aria-labelledby','laria-voice-title');
  dialog.innerHTML=`<h2 id="laria-voice-title">Test trollstemmer</h2>
    <p>Midlertidig test, ikke en del av vanlig Læria. Bruker bare en lokal norsk stemme.</p>
    <label class="ltv-preference"><input type="checkbox" checked autofocus> Stemmetest på</label>
    <div class="ltv-options"></div>
    <p role="status" aria-live="polite"></p>
    <button type="button" data-voice-stop disabled>Stopp</button>
    <button type="button" data-voice-close>Lukk</button>`;
  const status=dialog.querySelector('[role=status]'),controls=dialog.querySelector('.ltv-options');
  const stop=dialog.querySelector('[data-voice-stop]'),close=dialog.querySelector('[data-voice-close]');
  const launcher=doc.createElement('button');
  launcher.type='button';
  launcher.id='laria-troll-voice-launcher';
  launcher.setAttribute('aria-haspopup','dialog');
  launcher.textContent='Test trollstemmer';
  launcher.hidden=true;
  const style=doc.createElement('style');
  style.textContent=STYLES;
  doc.head.append(style);
  doc.body.append(launcher,dialog);

  const audition=createAudition({synth:root.speechSynthesis,Utterance:root.SpeechSynthesisUtterance,
    onStatus:(message,playing,enabled)=>{
      status.textContent=message;
      stop.disabled=!playing;
      for(const button of controls.children)button.disabled=!enabled;
    }});
  // Called only by the existing app's stopSpeech(), prior to its global cancel.
  root.LARIA_TROLL_VOICE_AUDITION=Object.freeze({release:()=>audition.release()});

  const eligible=()=>{
    const host=home.querySelector('.bc12');
    return flagged()&&home.classList.contains('active')&&!onboarding?.classList.contains('show')&&
      (!host?.dataset.mode||host.dataset.mode==='home')&&(!host?.dataset.bc13View||host.dataset.bc13View==='home');
  };
  function dismiss(){
    audition.stop();
    if(dialog.open)dialog.close();
  }
  function sync(){
    const visible=eligible();
    if(!visible&&dialog.open)dismiss();
    launcher.hidden=!visible;
  }
  for(const profile of PROFILES){
    const button=doc.createElement('button');
    button.type='button';
    button.dataset.trollVoiceTest=profile.id;
    button.textContent=profile.name;
    button.addEventListener('click',()=>{if(dialog.open&&eligible())audition.play(profile)});
    controls.append(button);
  }
  launcher.addEventListener('click',()=>{
    if(!eligible()||dialog.open)return;
    if(!dialog.querySelector('input').checked)audition.setEnabled(false);
    else audition.ready();
    dialog.showModal();
  });
  close.addEventListener('click',dismiss);
  stop.addEventListener('click',()=>audition.stop());
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss()});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const items=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
    const first=items[0],last=items.at(-1);
    if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first?.focus()}
  });
  dialog.addEventListener('close',()=>audition.stop());
  dialog.querySelector('input').addEventListener('change',event=>audition.setEnabled(event.target.checked));
  const observer=new root.MutationObserver(sync);
  observer.observe(home,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-mode','data-bc13-view']});
  if(onboarding)observer.observe(onboarding,{attributes:true,attributeFilter:['class']});
  root.addEventListener('popstate',sync);
  root.addEventListener('pagehide',dismiss);
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)dismiss()});
  sync();
}
