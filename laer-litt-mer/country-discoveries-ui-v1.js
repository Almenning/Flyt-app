/* Country reading presentation. No quiz, geography, profile or progress writes.
 * Uses the same browser speech service as the existing task reader. */
(function(root){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const storyFor=id=>root.LARIA_COUNTRY_DISCOVERIES?.get(id)||null;
  const speaker='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12-1c2 2 2 6 0 8m3-11c4 4 4 10 0 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let run=0,active=null,currentUtterance=null;
  function supported(){
    try{return !!root.speechSynthesis&&typeof root.SpeechSynthesisUtterance==='function'}catch(_){return false}
  }
  function intro(id,country){
    const story=storyFor(id),ready=!!story;
    const title=ready?'Tre små oppdagelser':'Kort om '+country.name;
    const summary=story?.teaser||'Her kan du se flagget, hovedstaden og hvor landet ligger. Flere fortellinger om landet kommer senere.';
    return '<header class="country-discovery-heading">'+
      '<span class="country-story-section-label">Oppdag landet</span>'+
      '<h2>'+esc(title)+'</h2><p class="country-story-summary">'+esc(summary)+'</p>'+
      '</header>'+
      (ready?'<div class="country-reading-tools">'+
        '<button type="button" class="country-read-aloud" aria-pressed="false" aria-describedby="country-reading-status">'+speaker+'<span>Les opp</span></button>'+
        '<span id="country-reading-status" class="country-reading-status" role="status" aria-live="polite"></span>'+
      '</div><div class="country-discoveries" data-country-discoveries="'+esc(id)+'">'+
        story.discoveries.map((d,i)=>'<section class="country-discovery" aria-labelledby="country-discovery-title-'+i+'">'+
          '<span class="country-discovery-category">'+esc(d.category)+'</span>'+
          '<h3 id="country-discovery-title-'+i+'">'+esc(d.title)+'</h3><p>'+esc(d.text)+'</p></section>').join('')+
      '</div><h3 class="country-basic-heading">Kort om landet</h3>':'');
  }
  function safeLink(reference){
    try{
      const url=new URL(reference.url);
      if(url.protocol!=='https:'||url.username||url.password)return '';
      return '<a href="'+esc(url.href)+'" target="_blank" rel="noopener noreferrer">'+esc(reference.title)+'</a>';
    }catch(_){return ''}
  }
  function sources(id,country){
    const story=storyFor(id),refs=story?story.discoveries.map(d=>d.source):[];
    const unique=[...new Map(refs.map(r=>[r.url,r])).values()];
    let populationNote='Innbyggertallet er et eldre anslag uten kjent kildeår.';
    if(country.populationYear===2024){
      const code=String(country.a3||'').replace(/[^A-Z]/g,'');
      populationNote='Innbyggere: Verdensbanken, 2024. Avrundet i visningen.';
      unique.push({title:'Verdensbanken: befolkning i '+country.name,
        url:'https://data.worldbank.org/indicator/SP.POP.TOTL?locations='+encodeURIComponent(code)});
    }else if(Number.isInteger(country.populationYear)){
      populationNote='Innbyggertallet gjelder '+country.populationYear+'. Avrundet i visningen.';
    }
    if(!Number.isFinite(Number(country.population))||Number(country.population)<=0)
      populationNote='Vi har ikke et befolkningstall for dette landet.';
    return '<details class="country-discovery-sources"><summary>Kilder og årstall · for voksne</summary>'+
      (story?'<p>Landtekst kontrollert '+esc(story.reviewed)+'. Teksten er skrevet for barn med kildene under som faktagrunnlag.</p>':'')+
      '<p>'+esc(populationNote)+'</p>'+
      (unique.length?'<ul>'+unique.map(ref=>'<li>'+safeLink(ref)+'</li>').join('')+'</ul>':'')+'</details>';
  }
  function resetVisual(context,message=''){
    if(!context)return;
    context.button.classList.remove('is-speaking');
    context.button.setAttribute('aria-pressed','false');
    context.button.querySelector('span').textContent='Les opp';
    context.host.querySelector('.country-story')?.classList.remove('is-reading');
    context.host.querySelectorAll('.country-discovery.is-reading').forEach(el=>el.classList.remove('is-reading'));
    context.status.textContent=message;
  }
  // Never call global stopSpeech() from here: that function calls this hook.
  function stopReading(){
    run++;
    const previous=active;
    active=null;
    if(currentUtterance){currentUtterance.onend=null;currentUtterance.onerror=null;currentUtterance=null;}
    if(previous){try{root.speechSynthesis.cancel()}catch(_){}resetVisual(previous);}
  }
  function mount(host,id){
    stopReading();
    const story=storyFor(id),article=host.querySelector('.country-story');
    article?.classList.toggle('has-discoveries',!!story);
    if(article)article.dataset.countryContent=story?'ready':'missing';
    const button=host.querySelector('.country-read-aloud');
    if(!button||!story)return;
    const status=host.querySelector('.country-reading-status');
    if(!supported()){
      button.disabled=true;
      status.textContent='Opplesning er ikke tilgjengelig på denne enheten.';
      return;
    }
    button.addEventListener('click',()=>{
      if(active?.button===button){stopReading();return;}
      // Cancel both an earlier country and a task reader before taking ownership.
      if(typeof root.stopSpeech==='function')root.stopSpeech();
      else stopReading();
      const token=++run,context={button,status,host};
      active=context;
      status.textContent='';
      button.classList.add('is-speaking');button.setAttribute('aria-pressed','true');
      button.querySelector('span').textContent='Stopp';
      article.classList.add('is-reading');
      const chunks=story.discoveries.map(d=>d.title+'. '+d.text);
      let index=0;
      function next(){
        if(token!==run||active!==context||!article.isConnected)return;
        if(index>=chunks.length){stopReading();return;}
        host.querySelectorAll('.country-discovery').forEach((el,i)=>el.classList.toggle('is-reading',i===index));
        const u=new root.SpeechSynthesisUtterance(chunks[index++]);
        currentUtterance=u;
        u.lang='nb-NO';u.rate=.88;u.pitch=1;
        try{
          const voices=root.speechSynthesis.getVoices?.()||[];
          const voice=voices.find(v=>/^nb(-|$)/i.test(v.lang))||voices.find(v=>/^no(-|$)/i.test(v.lang));
          if(voice)u.voice=voice;
          u.onend=next;
          u.onerror=()=>{
            if(token!==run)return;
            stopReading();
            resetVisual(context,'Opplesningen stoppet. Trykk Les opp for å prøve igjen.');
          };
          root.speechSynthesis.speak(u);
        }catch(_){
          stopReading();resetVisual(context,'Opplesning er ikke tilgjengelig akkurat nå.');
        }
      }
      next();
    });
  }
  // Practice switches directly to a session. Cancel before its click handler,
  // so a country narration cannot overlap the next task's own speech.
  root.document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-country-story-practice]'))stopReading();
  },true);
  root.addEventListener('pagehide',stopReading);
  root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)stopReading()});
  root.LARIA_COUNTRY_DISCOVERY_UI=Object.freeze({intro,sources,mount,stopReading});
})(window);
