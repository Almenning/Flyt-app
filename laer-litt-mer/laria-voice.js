/* Læria voice router: profile-selected character speech, no embedded API secrets.
 * Until a licensed voice endpoint is configured, local OS voices are used.
 * No child text or profile data is transmitted by this default implementation.
 */
(function(root){
  'use strict';
  let generation=0,activeAudio=null,activeUrl=null;
  const voices=Object.freeze({
    girl:Object.freeze({name:'Mia Starset',locale:'nb-NO',pitch:1.09,rate:.90}),
    boy:Object.freeze({name:'Magnus',locale:'nb-NO',pitch:.94,rate:.92})
  });
  function profile(){
    const value=root.LARIA_FOX?.choice?.();
    return value==='girl'?'girl':'boy';
  }
  function canSpeak(){
    return !!(root.speechSynthesis&&root.SpeechSynthesisUtterance);
  }
  function stop(){
    generation++;
    if(activeAudio){activeAudio.pause();activeAudio.removeAttribute('src');activeAudio=null;}
    if(activeUrl){root.URL?.revokeObjectURL?.(activeUrl);activeUrl=null;}
    try{root.speechSynthesis?.cancel();}catch(_){}
  }
  function selectVoice(locale,avatar){
    const list=root.speechSynthesis?.getVoices?.()||[];
    const language=locale.startsWith('en')?'en':'no';
    const compatible=list.filter(v=>language==='en'?/^en/i.test(v.lang):/^(nb|nn|no)/i.test(v.lang));
    const desired=voices[avatar].name.toLowerCase();
    // Prefer a matching installed voice if available, otherwise Norwegian system TTS.
    return compatible.find(v=>v.name.toLowerCase().includes(desired))||
      compatible.find(v=>/^(nb-NO|en-GB)$/i.test(v.lang))||compatible[0]||null;
  }
  function local(text,opts={},token){
    if(!canSpeak())return false;
    const id=profile(),info=voices[id];
    const utterance=new root.SpeechSynthesisUtterance(text);
    utterance.lang=opts.language==='en'?'en-GB':'nb-NO';
    utterance.rate=opts.rate||info.rate;
    utterance.pitch=opts.language==='en'?1:info.pitch;
    const voice=selectVoice(utterance.lang,id);
    if(voice)utterance.voice=voice;
    utterance.onend=()=>{if(token===generation)opts.onEnd?.();};
    utterance.onerror=()=>{if(token===generation)opts.onEnd?.();};
    root.speechSynthesis.speak(utterance);
    return true;
  }
  function speak(text,opts={}){
    if(typeof text!=='string'||!text.trim())return false;
    stop();
    const token=generation;
    const body=text.trim();
    // Optional self-hosted endpoint: must be same-origin and enabled by deployment.
    // The endpoint chooses a licensed character voice server-side, never via browser key.
    const endpoint=root.LARIA_VOICE_ENDPOINT;
    if(typeof endpoint==='string'&&endpoint.startsWith('/')&&!endpoint.startsWith('//')&&root.fetch){
      root.fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text:body,character:profile(),language:opts.language==='en'?'en':'no'})})
        .then(r=>{if(!r.ok)throw Error('voice unavailable');return r.blob();})
        .then(blob=>{
          if(token!==generation)return;
          if(!/^audio\//i.test(blob.type))throw Error('Not audio');
          const url=root.URL.createObjectURL(blob);
          activeUrl=url;
          const audio=new root.Audio(url);
          activeAudio=audio;
          audio.onended=()=>{if(token===generation){stop();opts.onEnd?.();}};
          audio.onerror=()=>{if(token===generation){stop();local(body,opts,generation);}};
          audio.play().catch(()=>{if(token===generation){stop();local(body,opts,generation);}});
        }).catch(()=>{if(token===generation)local(body,opts,token);});
      return true;
    }
    return local(body,opts,token);
  }
  root.LARIA_VOICE=Object.freeze({profile,voices,canSpeak,stop,speak,
    readQuestion:(text,language,onEnd)=>speak(text,{language,onEnd}),
    greeting:()=>speak('Hei! Klar for et nytt eventyr?')});
  root.addEventListener?.('pagehide',stop);
})(window);
