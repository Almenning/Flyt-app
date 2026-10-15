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
  // A small, real country silhouette from the geometry already used by the
  // atlas. Never synthesize a contour when a country has no reliable geometry.
  function outerRings(country){
    const geometry=country.geometry;
    const polygons=geometry?.type==='Polygon'?[geometry.coordinates]:
      geometry?.type==='MultiPolygon'?geometry.coordinates:[];
    return polygons.map(p=>p?.[0]).filter(r=>Array.isArray(r)&&r.length>=3&&
      r.every(x=>Array.isArray(x)&&Number.isFinite(Number(x[0]))&&Number.isFinite(Number(x[1]))));
  }
  function paintOutline(canvas,country){
    const rings=outerRings(country);if(!canvas||!rings.length)return;
    const points=rings.flat();
    const lon=points.map(p=>Number(p[0]));
    const lat=points.map(p=>Number(p[1]));
    const wrap=Math.max(...lon)-Math.min(...lon)>180;
    const xLon=p=>wrap&&Number(p[0])<0?Number(p[0])+360:Number(p[0]);
    const midLat=(Math.max(...lat)+Math.min(...lat))/2;
    const scaleLon=Math.max(.20,Math.cos(midLat*Math.PI/180));
    const x=points.map(p=>xLon(p)*scaleLon);
    const minX=Math.min(...x),maxX=Math.max(...x);
    const minY=Math.min(...lat),maxY=Math.max(...lat);
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(108,Math.round(rect.width||150));
    const h=Math.max(90,Math.round(rect.height||125));
    const dpr=Math.min(2,root.devicePixelRatio||1);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(160,122,72,.15)';ctx.lineWidth=1;
    for(let i=1;i<=3;i++){
      const gx=w*i/4,gy=h*i/4;
      ctx.beginPath();ctx.moveTo(gx,6);ctx.lineTo(gx,h-6);ctx.stroke();
      ctx.beginPath();ctx.moveTo(6,gy);ctx.lineTo(w-6,gy);ctx.stroke();
    }
    const spanX=Math.max(.001,maxX-minX),spanY=Math.max(.001,maxY-minY);
    const fit=Math.min((w-38)/spanX,(h-29)/spanY);
    const ox=(w-spanX*fit)/2,oy=(h-spanY*fit)/2;
    ctx.beginPath();
    for(const ring of rings){
      ring.forEach((p,i)=>{
        const px=ox+(xLon(p)*scaleLon-minX)*fit;
        const py=oy+(maxY-Number(p[1]))*fit;
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      });
      ctx.closePath();
    }
    ctx.shadowColor='rgba(108,74,39,.24)';ctx.shadowBlur=8;ctx.shadowOffsetY=4;
    ctx.fillStyle='#c99d5d';ctx.fill();
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.lineWidth=1.9;ctx.strokeStyle='#825b35';ctx.stroke();
  }
  function redraw(country){
    if(paintFrame)cancelAnimationFrame(paintFrame);
    paintFrame=requestAnimationFrame(()=>{
      paintFrame=0;
      const canvas=document.querySelector('#detail-screen.active .country-story-board canvas');
      if(canvas&&root.LARIA_GLOBE_COUNTRY_SCENE_V25?.paint)
        root.LARIA_GLOBE_COUNTRY_SCENE_V25.paint(canvas,country);
      paintOutline(document.querySelector('#detail-screen.active .country-story-outline'),country);
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
    const outline=outerRings(country).length?
      '<div class="country-story-map">'+
        '<div class="country-story-map-copy">'+
          '<span class="country-story-section-label">Et lite kartspor</span>'+
          '<strong>Landets omriss</strong>'+
          '<small>Kjenner du igjen formen?</small>'+
        '</div>'+
        '<canvas class="country-story-outline" aria-hidden="true"></canvas>'+
      '</div>':'';
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
            '<h2>Tre spennende spor</h2>'+
            '<p class="country-story-summary">Hvert land har noe å fortelle. Her er tre små oppdagelser fra '+esc(country.name)+'.</p>'+
          '</header>'+
          '<dl class="country-story-facts">'+
            fact('📍','Hovedstad',country.capitalDisplay||country.capital||'Ikke oppgitt')+
            fact('🌍','Verdensdel',country.continent||'Ikke oppgitt')+
            fact('✦','Innbyggere · ca.',population(country.population))+
          '</dl>'+
          note+
          outline+
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