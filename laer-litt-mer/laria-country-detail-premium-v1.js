/* Læria country story. Visual presentation only: source country data and
 * the existing startCountryPractice(), status and return routing remain authoritative. */
(function(root){
  'use strict';
  const byId=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const TONES={
    'Afrika':'savanna','Europa':'green','Asia':'warm',
    'Nord-Amerika':'north','Sør-Amerika':'tropic','Oseania':'tropic'
  };
  const DEFAULT_TAGS={
    'Afrika':'Store landskap og variert natur',
    'Europa':'Byer, fjell og mange landskap',
    'Asia':'Store kontraster i natur og byliv',
    'Nord-Amerika':'Fjell, skog og store byområder',
    'Sør-Amerika':'Regnskog, fjell og lange kystlinjer',
    'Oseania':'Øyer, kyst og særegen natur'
  };
  let paintFrame=0,lastCountry=null,lastId=null;
  function sceneFor(country){
    const source=root.LARIA_GLOBE_COUNTRY_SCENE_V25?.describe?.(country);
    return {
      tone:source?.tone||TONES[country.continent]||'green',
      tag:source?.tag||DEFAULT_TAGS[country.continent]||'Et sted å oppdage'
    };
  }
  function population(value){
    const n=Number(value);
    if(!Number.isFinite(n)||n<=0)return 'Ikke oppgitt';
    try{return new Intl.NumberFormat('nb-NO',{notation:'compact',maximumFractionDigits:1}).format(n)}
    catch(_){return String(Math.round(n))}
  }
  function fact(icon,title,value){
    return '<div class="country-story-fact"><dt>'+
      '<span class="country-story-icon" aria-hidden="true">'+icon+'</span>'+
      esc(title)+'</dt><dd>'+esc(value)+'</dd></div>';
  }
  function redraw(country){
    if(paintFrame)cancelAnimationFrame(paintFrame);
    paintFrame=requestAnimationFrame(()=>{
      paintFrame=0;
      const canvas=document.querySelector('#detail-screen.active .country-story-board canvas');
      if(!canvas||!root.LARIA_GLOBE_COUNTRY_SCENE_V25?.paint)return;
      root.LARIA_GLOBE_COUNTRY_SCENE_V25.paint(canvas,country);
    });
  }
  function render(id,country,statusLabel){
    const target=byId('detail-content');
    if(!target||!country)return false;
    lastCountry=country;lastId=id;
    const scene=sceneFor(country);
    const avatar=root.LARIA_FOX?.choice?.()||'boy';
    const foxSrc=root.LARIA_FOX?.worldSource?.(avatar)||'';
    const foxMarkup=foxSrc?
      '<img class="country-story-fox" src="'+esc(foxSrc)+'" alt="" aria-hidden="true" draggable="false" decoding="async">':'';
    const note=country.note?
      '<p class="country-story-note">'+esc(country.note)+'</p>':'';
    target.innerHTML=
      '<article class="country-story'+(country.name.length>18?' is-long-name':'')+'" data-country-detail="'+esc(id)+
      '" data-tone="'+esc(scene.tone)+'" aria-label="'+esc('Oppdag '+country.name)+'">'+
        '<div class="country-story-board">'+
          '<canvas aria-hidden="true"></canvas>'+
          '<div class="country-story-topline">'+
            '<span class="country-story-kicker">✦ Lærias verdensreise</span>'+
            '<span class="country-story-status">'+esc(statusLabel)+'</span>'+
          '</div>'+
          '<div class="country-story-title">'+
            '<span class="country-story-flag" role="img" aria-label="'+esc('Flagget til '+country.name)+'">'+
              esc(country.flag||'🌍')+'</span>'+
            '<h1>'+esc(country.name)+'</h1>'+
            '<p class="country-story-tagline">'+esc(scene.tag)+'</p>'+
          '</div>'+
          foxMarkup+
        '</div>'+
        '<div class="country-story-main">'+
          '<header>'+
            '<span class="country-story-section-label">Oppdag landet</span>'+
            '<h2>Tre ting å lære</h2>'+
            '<p class="country-story-summary">Se hva du finner ut om '+esc(country.name)+
              '. Her er noen fakta du kan ta med deg videre.</p>'+
          '</header>'+
          '<dl class="country-story-facts">'+
            fact('📍','Hovedstad',country.capitalDisplay||country.capital||'Ikke oppgitt')+
            fact('🌍','Verdensdel',country.continent||'Ikke oppgitt')+
            fact('✦','Innbyggere · ca.',population(country.population))+
          '</dl>'+
          note+
          '<div class="country-story-bottom">'+
            '<button type="button" class="country-story-practice" data-country-story-practice="'+esc(id)+'">'+
              '<span aria-hidden="true">✦</span> Øv på '+esc(country.name)+
              ' <span aria-hidden="true">›</span></button>'+
            '<span class="country-story-action-note">Du bestemmer selv om du vil øve eller utforske videre.</span>'+
          '</div>'+
        '</div>'+
      '</article>';
    const button=target.querySelector('[data-country-story-practice]');
    button?.addEventListener('click',()=>{
      if(typeof root.startCountryPractice==='function')root.startCountryPractice(id);
    });
    redraw(country);
    return true;
  }
  root.addEventListener('resize',()=>{
    if(!byId('detail-screen')?.classList.contains('active'))return;
    const id=document.querySelector('#detail-screen.active [data-country-detail]')?.dataset.countryDetail;
    // Caller owns the country database; repaint the last-scene only without
    // re-rendering markup or touching status/progress.
    if(lastCountry&&id===lastId)redraw(lastCountry);
  },{passive:true});
  root.LARIA_COUNTRY_DETAIL_PREMIUM=Object.freeze({render});
})(window);