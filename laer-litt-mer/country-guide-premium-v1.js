/* Læria: premium country guide. Presentation only; existing state and practice stay authoritative. */
(function(){
  'use strict';

  const INSIGHTS = {
    egypt: ['Elven som gir liv', 'Nilen renner gjennom Egypt. Langs elven har mennesker dyrket mat i tusenvis av år.'],
    tsjad: ['Fra ørken til savanne', 'Nord i Tsjad ligger Sahara. Sørover blir landskapet gradvis grønnere.'],
    norge: ['Fjordenes land', 'Mange norske fjorder ble formet da store isbreer gravde seg gjennom fjellene.'],
    japan: ['Et land av øyer', 'Japan består av tusenvis av øyer, og mange av dem har høye fjell og vulkaner.'],
    brasil: ['Den store regnskogen', 'Mye av Amazonas-regnskogen ligger i Brasil. Der lever svært mange ulike planter og dyr.'],
    australia: ['Et helt spesielt dyreliv', 'Kenguruer og koalaer lever naturlig i Australia. Landet har også store ørkenområder.'],
    island: ['Ild og is', 'Island har både isbreer og aktive vulkaner. Noen steder kommer varmt vann opp fra bakken.'],
    kenya: ['Dyr på savannen', 'I Kenya lever blant annet elefanter og sjiraffer i store naturområder.'],
    india: ['Mellom hav og høye fjell', 'India strekker seg fra Indiahavet i sør mot Himalaya i nord.'],
    kina: ['Et land med store kontraster', 'Kina har høye fjell, store elver og noen av verdens største byer.'],
    frankrike: ['Byer og fjell', 'Frankrike har kyst mot Atlanterhavet og Middelhavet, og deler av Alpene ligger i landet.'],
    usa: ['Fra hav til hav', 'USA strekker seg fra Atlanterhavet til Stillehavet og har mange ulike landskap.'],
    canada: ['Innsjøer og skoger', 'Canada er kjent for store skogområder og svært mange innsjøer.'],
    peru: ['Høyt oppe i Andesfjellene', 'I Peru ligger deler av Andesfjellene og den historiske byen Machu Picchu.']
  };

  const normalized = value => String(value || '').toLocaleLowerCase('nb')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');

  function element(tag, className, textValue){
    const node = document.createElement(tag);
    if(className)node.className=className;
    if(textValue!==undefined)node.textContent=String(textValue);
    return node;
  }

  function fact(icon, label, value){
    const card=element('div','laria-country-fact');
    card.append(element('span','laria-country-fact-icon',icon));
    const copy=element('div','laria-country-fact-copy');
    copy.append(element('span','laria-country-fact-label',label),
      element('strong','laria-country-fact-value',value));
    card.append(copy);
    return card;
  }

  function paintArt(canvas, country){
    if(!canvas.isConnected)return;
    const painter=window.LARIA_GLOBE_COUNTRY_SCENE;
    try {
      if(painter && typeof painter.paint==='function'){
        painter.paint(canvas,country);
        canvas.dataset.painted='true';
      } else {
        // Safe warm panorama when the optional globe art module has not loaded.
        const b=canvas.getBoundingClientRect();
        const width=Math.max(160,Math.round(b.width));
        const height=Math.max(120,Math.round(b.height));
        const ratio=Math.min(2,window.devicePixelRatio||1);
        canvas.width=Math.round(width*ratio);
        canvas.height=Math.round(height*ratio);
        const ctx=canvas.getContext('2d');
        ctx.scale(ratio,ratio);
        const g=ctx.createLinearGradient(0,0,0,height);
        g.addColorStop(0,'#acdfe4');g.addColorStop(0.56,'#e5d29a');g.addColorStop(1,'#83a982');
        ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
        ctx.fillStyle='#f6e4a3';ctx.beginPath();ctx.arc(width*.78,height*.24,30,0,Math.PI*2);ctx.fill();
        canvas.dataset.painted='fallback';
      }
    } catch(_){canvas.dataset.painted='error';}
  }

  function render(data){
    const target=document.getElementById('detail-content');
    const country=data && data.country;
    const id=data && data.id;
    if(!target || !country || !id)return false;

    const guide=element('article','laria-country-guide');
    guide.dataset.countryId=String(id);
    const hero=element('section','laria-country-guide-hero');
    hero.setAttribute('aria-label','Oppdag '+country.name);
    const canvas=element('canvas','laria-country-guide-scene');
    canvas.setAttribute('aria-hidden','true');
    hero.append(canvas);

    const top=element('div','laria-country-guide-hero-top');
    const category=element('span','laria-country-guide-kicker','LÆRIAS VERDENSATLAS');
    const status=element('span','laria-country-guide-status',data.label || 'Ikke startet');
    top.append(category,status);
    hero.append(top);

    const heroCopy=element('div','laria-country-guide-hero-copy');
    const flag=element('span','laria-country-guide-flag',country.flag || '🌍');
    flag.setAttribute('role','img');
    flag.setAttribute('aria-label','Flagget til '+country.name);
    heroCopy.append(flag,element('h1','laria-country-guide-title',country.name));
    const scene=window.LARIA_GLOBE_COUNTRY_SCENE;
    const scenery=scene && typeof scene.description==='function' ? scene.description(country) : '';
    heroCopy.append(element('p','laria-country-guide-subtitle',
      scenery || ('Oppdag '+country.name+' på kartet')));
    hero.append(heroCopy);
    guide.append(hero);

    const main=element('div','laria-country-guide-main');
    const facts=element('section','laria-country-guide-facts');
    facts.setAttribute('aria-label','Fakta om '+country.name);
    facts.append(element('h2','laria-country-guide-section-title','Bli kjent med landet'));
    const factGrid=element('div','laria-country-guide-fact-grid');
    if(country.capital)factGrid.append(fact('📍','Hovedstad',country.capital));
    factGrid.append(fact('🌍','Verdensdel',country.continent || 'Ikke oppgitt'));
    factGrid.append(fact('👥','Innbyggere · anslag',data.populationText || 'Ikke oppgitt'));
    facts.append(factGrid);

    const aside=element('aside','laria-country-guide-insight');
    const intro=element('div','laria-country-guide-insight-copy');
    const key=normalized(country.name);
    const curated=INSIGHTS[key];
    const note=typeof country.note==='string' && country.note.trim() ? country.note.trim() : '';
    const title=curated ? curated[0] : note ? 'Visste du dette?' : 'Finn landet på kloden';
    const info=note || (curated ? curated[1] :
      country.name+' ligger i '+(country.continent || 'verden')+
      '. Se om du klarer å finne landet igjen på kloden.');
    intro.append(element('span','laria-country-guide-story-kicker','✦ OPPDAG MER'));
    intro.append(element('h2','laria-country-guide-insight-title',title));
    intro.append(element('p','laria-country-guide-insight-text',info));
    aside.append(intro);

    const fox=window.LARIA_FOX;
    const avatar=fox && typeof fox.choice==='function' ? fox.choice() : null;
    const foxSrc=fox && typeof fox.worldSource==='function' ? fox.worldSource(avatar) : '';
    if(foxSrc){
      const image=element('img','laria-country-guide-fox');
      image.src=foxSrc;image.alt='';image.decoding='async';
      image.setAttribute('aria-hidden','true');
      aside.append(image);
    }

    const action=element('button','laria-country-guide-practice','Øv på '+country.name+'  →');
    action.type='button';
    action.addEventListener('click',()=>window.startCountryPractice?.(id));
    const next=element('div','laria-country-guide-action');
    next.append(action,element('p','laria-country-guide-footnote',
      'Befolkningstall er avrundede anslag og kan endre seg over tid.'));
    aside.append(next);
    main.append(facts,aside);
    guide.append(main);
    target.replaceChildren(guide);
    requestAnimationFrame(()=>paintArt(canvas,country));
    return true;
  }

  // When an iPad is rotated, repaint the same panorama at the new CSS size.
  let pending=false;
  window.addEventListener('resize',()=>{
    if(pending || !document.getElementById('detail-screen')?.classList.contains('active'))return;
    pending=true;
    requestAnimationFrame(()=>{
      pending=false;
      const canvas=document.querySelector('#detail-screen.active .laria-country-guide-scene');
      const id=document.querySelector('#detail-screen.active .laria-country-guide')?.dataset.countryId;
      const record=(typeof countries!=='undefined' && id)?countries[id]:null;
      if(canvas && record)paintArt(canvas,record);
    });
  },{passive:true});

  window.LARIA_COUNTRY_GUIDE_V1=Object.freeze({render});
})();