/* Læria: one premium, illustrated collection across the four worlds.
 * One authoritative source per reward. No duplicate unlock logic, purchases or streak pressure.
 * The old local progress formats are read, never migrated or overwritten.
 */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_MAGICAL_BOOK=api;
})(typeof window==='object'?window:null,function(root){
  'use strict';
  const VERSION=1;
  const KEY='laria-magical-book-scene-v1';
  const PAGES=Object.freeze([
    {id:'treasures',label:'Mine skatter',icon:'✦'},
    {id:'words',label:'Bokskogen',icon:'❀'},
    {id:'berries',label:'Tallenga',icon:'✿'},
    {id:'place',label:'Mitt eventyrsted',icon:'⌂'}
  ]);
  const REALMS=Object.freeze({
    norwegian:{name:'Bokskogen',caption:'Norsk'},
    math:{name:'Tallenga',caption:'Matte'},
    english:{name:'Ordlandsbyen',caption:'Engelsk'},
    geography:{name:'Nordlysleiren',caption:'Geografi'}
  });
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const safeId=value=>typeof value==='string'&&/^[a-z0-9-]{2,60}$/.test(value)?value:'';
  function normalizePlace(raw,allowed){
    const valid=new Set((Array.isArray(allowed)?allowed:[]).filter(item=>item&&item.owned).map(item=>item.id));
    const source=asObject(raw);
    const ids=Array.isArray(source.spots)?source.spots:[];
    const used=new Set();
    const spots=Array.from({length:3},(_,i)=>{
      const id=safeId(ids[i]);
      if(!id||!valid.has(id)||used.has(id))return null;
      used.add(id);return id;
    });
    return {version:VERSION,spots};
  }
  function placeItem(scene,slot,id,available){
    const safe=normalizePlace(scene,available),n=Number(slot),item=safeId(id);
    if(!Number.isInteger(n)||n<0||n>2)return safe;
    if(!available.some(x=>x.id===item&&x.owned))return safe;
    const spots=[...safe.spots];
    // Moving a keepsake moves it, never creates duplicate items.
    const prev=spots.indexOf(item);
    if(prev!==-1)spots[prev]=null;
    spots[n]=item;
    return normalizePlace({spots},available);
  }
  function readPlace(available){
    try{return normalizePlace(JSON.parse(root.localStorage.getItem(KEY)||'null'),available)}
    catch(_){return normalizePlace(null,available)}
  }
  function savePlace(scene){try{root.localStorage.setItem(KEY,JSON.stringify(scene))}catch(_){}}
  const uniqueIds=items=>new Set(items.map(x=>x.id)).size===items.length;
  function normalizeInput(raw){
    const x=asObject(raw);
    const treasures=(Array.isArray(x.treasures)?x.treasures:[])
      .filter(item=>item&&item.realm&&REALMS[item.realm]&&typeof item.title==='string')
      .map(item=>({...item,id:safeId(item.id),owned:item.owned===true})).filter(item=>item.id);
    const words=(Array.isArray(x.wordPacks)?x.wordPacks:[])
      .filter(item=>item&&safeId(item.id)&&typeof item.title==='string')
      .map(item=>({...item,id:safeId(item.id),owned:Number(x.themeRounds?.[item.id])>0}));
    const missions=(Array.isArray(x.missions)?x.missions:[])
      .filter(item=>item&&safeId(item.id)&&typeof item.heading==='string'&&Number.isInteger(item.groups)&&Number.isInteger(item.each))
      .map((item,i)=>({...item,index:i,earned:(Array.isArray(x.wins)?x.wins:[]).includes(item.id)}));
    return {
      treasures:uniqueIds(treasures)?treasures:treasures.filter((item,i)=>treasures.findIndex(y=>y.id===item.id)===i),
      words:uniqueIds(words)?words:words.filter((item,i)=>words.findIndex(y=>y.id===item.id)===i),
      missions:missions.slice(0,8),
      avatar:x.avatar==='girl'?'girl':'boy',
      foxMarkup:typeof x.foxMarkup==='string'?x.foxMarkup:'',
      wordRounds:Math.max(0,Math.floor(Number(x.wordRounds)||0)),
      placesVisited:Math.max(0,Math.floor(Number(x.placesVisited)||0)),
      trophies:Math.max(0,Math.floor(Number(x.trophies)||0))
    };
  }
  function worldCard(item,index){
    const owned=item.owned,realm=REALMS[item.realm];
    return '<article class="bc12-memory lmc-keepsake '+(owned?'is-found':'is-hidden')+'" data-collectible-id="'+escapeHtml(item.id)+'" data-owned="'+owned+'" aria-label="'+escapeHtml(owned?'Funnet: '+item.title:'Uoppdaget minne')+'">'+
      '<div class="lmc-keepsake-scene lmc-scene-'+item.realm+'"><span class="lmc-scene-glow" aria-hidden="true"></span>'+ 
      '<span class="bc12-memory-symbol" aria-hidden="true">'+iconForRealm(item.realm)+'</span></div>'+
      '<span class="lmc-keepsake-kicker">'+escapeHtml(realm.name)+'</span>'+
      '<strong>'+escapeHtml(owned?item.title:'Et mysterium venter')+'</strong>'+
      '<small>'+escapeHtml(owned?item.description:'Utforsk denne verdenen for å finne minnet.')+'</small>'+
      '<span class="bc12-memory-status">'+(owned?'✦ Funnet':'✧ Ikke funnet ennå')+'</span></article>';
  }
  function iconForRealm(realm){
    const c={
      norwegian:'<svg viewBox="0 0 64 64"><path d="M10 52Q18 14 51 9Q53 31 10 52Z" fill="#f4d8a2" stroke="#966739" stroke-width="3"/><path d="M11 53 44 19M28 33l-4-15m4 17 16 1" stroke="#bd884f" stroke-width="2" fill="none"/></svg>',
      math:'<svg viewBox="0 0 64 64"><path d="M32 5 54 22 49 45 32 59 13 45 10 22Z" fill="#83c6b7" stroke="#517a67" stroke-width="3"/><path d="M32 5 28 30 32 59M10 22l18 8 26-8M13 45l15-15 21 15" fill="none" stroke="#fff4c5" stroke-width="2.5"/></svg>',
      english:'<svg viewBox="0 0 64 64"><circle cx="22" cy="20" r="13" fill="#ecd28e" stroke="#aa713f" stroke-width="3"/><circle cx="22" cy="20" r="5" fill="#fff6d9"/><path d="M31 28 56 53l-6 6-8-8-6 5-5-6 4-5-13-11" fill="#e0b86d" stroke="#a57942" stroke-width="2.5"/></svg>',
      geography:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#e7c793" stroke="#986d43" stroke-width="3"/><circle cx="32" cy="32" r="20" fill="#a4d4c8" stroke="#678c83" stroke-width="2"/><path d="m20 44 9-17 17-12-10 21-16 8Z" fill="#dca86d" stroke="#8c5e39" stroke-width="2"/><path d="m29 27 17-12-10 21" fill="#fff3cd"/></svg>'
    };return c[realm]||'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="#e8dcb7"/></svg>';
  }
  function wordCard(item){
    const art='<img alt="" loading="lazy" decoding="async" src="./assets/word-hunt/themes/'+item.id+'.webp?v=20261017-painted1">';
    return '<div class="bc12-wordhunt-sticker lmc-sticker '+(item.owned?'is-earned':'is-locked')+'" data-word-theme="'+item.id+'" data-owned="'+item.owned+'" aria-label="'+escapeHtml(item.title)+(item.owned?', klistremerke funnet':', klistremerke ikke funnet')+'">'+
      '<span class="bc12-wordhunt-sticker-art">'+art+'</span><strong>'+escapeHtml(item.title)+'</strong>'+ 
      '<small>'+(item.owned?'✦ Funnet':'✧ Venter på deg')+'</small></div>';
  }
  function missionCard(item){
    return '<button type="button" data-lmc-mission="'+item.index+'" class="lmc-mission '+(item.earned?'is-earned':'is-undiscovered')+'" aria-label="Spill '+escapeHtml(item.heading)+'. '+item.groups+' kurver med '+item.each+' jordbær i hver.'+(item.earned?' Blomst samlet.':'')+'">'+
      '<span class="lmc-mission-scene lmc-mission-scene-'+item.index+'" aria-hidden="true"></span>'+ 
      '<span class="lmc-mission-flower" aria-hidden="true">'+(item.earned?'✿':'✧')+'</span>'+ 
      '<span class="lmc-mission-number">EVENTYR '+(item.index+1)+'</span>'+ 
      '<strong>'+escapeHtml(item.heading)+'</strong><small>'+item.groups+' kurver med '+item.each+' i hver</small></button>';
  }
  function treasuresSpread(data){
    const found=data.treasures.filter(x=>x.owned).length;
    const wordGot=data.words.filter(x=>x.owned).length;
    const blossoms=data.missions.filter(x=>x.earned).length;
    return '<div class="lmc-spread" data-book-spread="treasures">'+
      '<section class="lmc-page lmc-page-left" aria-label="Skatter fra fire verdener">'+
        '<header class="lmc-page-head"><span class="lmc-page-ornament">❧</span><div><small>FØRSTE OPPSLAG</small><h3>Skatter fra fire verdener</h3></div></header>'+ 
        '<div class="bc12-memory-intro"><b>'+found+' av '+data.treasures.length+' minner funnet</b><span>Det du oppdager, får bli med videre.</span></div>'+ 
        '<div class="bc12-memory-grid lmc-world-grid">'+data.treasures.map(worldCard).join('')+'</div>'+ 
        '<div class="lmc-page-foot">✦ Bokskogen · Tallenga · Ordlandsbyen · Nordlysleiren</div>'+ 
      '</section>'+ 
      '<section class="lmc-page lmc-page-right" aria-label="Magiske funn og favoritter">'+
        '<header class="lmc-page-head"><span class="lmc-page-ornament">✿</span><div><small>MINNEBOK</small><h3>Små funn, store eventyr</h3></div></header>'+ 
        '<p class="lmc-page-lead">Her samler du det du finner på reisen. Du kan leke favorittene dine så ofte du vil.</p>'+ 
        '<div class="lmc-summary-panels">'+
          '<button type="button" class="lmc-feature lmc-feature-words" data-book-page="words"><span class="lmc-feature-art" aria-hidden="true"><img src="./assets/word-hunt/themes/animals.webp" alt=""></span><span><small>BOKSKOGEN</small><strong>Ordjakts klistremerker</strong><em>'+wordGot+' av '+data.words.length+' funnet</em></span><span class="lmc-feature-arrow" aria-hidden="true">›</span></button>'+ 
          '<button type="button" class="lmc-feature lmc-feature-berries" data-book-page="berries"><span class="lmc-feature-art" aria-hidden="true"></span><span><small>TALLENGA</small><strong>Magiske markedsblomster</strong><em>'+blossoms+' av '+data.missions.length+' samlet</em></span><span class="lmc-feature-arrow" aria-hidden="true">›</span></button>'+ 
          '<button type="button" class="lmc-feature lmc-feature-place" data-book-page="place"><span class="lmc-feature-art" aria-hidden="true">✦</span><span><small>DITT EGET STED</small><strong>Mitt eventyrsted</strong><em>Plasser de skattene du har funnet</em></span><span class="lmc-feature-arrow" aria-hidden="true">›</span></button>'+ 
        '</div>'+ 
        '<div class="lmc-note"><span aria-hidden="true">✧</span><span>Reven din er med på hvert eventyr. Flere magiske venner og funn får sine egne sider senere.</span></div>'+ 
      '</section></div>';
  }
  function wordsSpread(data){
    const n=data.words.filter(x=>x.owned).length;
    return '<div class="lmc-spread" data-book-spread="words">'+
      '<section class="lmc-page lmc-page-left"><header class="lmc-page-head"><span class="lmc-page-ornament">❧</span><div><small>BOKSKOGEN</small><h3>Ordjakts klistremerker</h3></div></header>'+ 
      '<p class="lmc-page-lead">Hvert tema har sitt eget minne. Finn alle ordene i én runde for å samle et klistremerke.</p>'+ 
      '<div class="bc12-wordhunt-collection"><div class="bc12-wordhunt-stickers-heading"><strong>Mine ordtemaer</strong><span>'+n+' av '+data.words.length+' funnet</span></div>'+ 
      '<div class="bc12-wordhunt-stickers lmc-words-grid">'+data.words.map(wordCard).join('')+'</div></div></section>'+ 
      '<section class="lmc-page lmc-page-right lmc-book-forest"><div class="lmc-reading-window"><span>✦ ET BREV FRA REVEN ✦</span><h3>Ordene gjemmer historier</h3>'+ 
      '<p>Jeg har hørt at nye ord gjemmer seg mellom trærne. Skal vi utforske dem sammen?</p>'+ 
      '<div class="lmc-feature-forest-art" aria-hidden="true"><img src="./assets/word-hunt/themes/magic.webp" alt=""></div>'+ 
      '<button type="button" class="lmc-primary" data-lmc-action="wordhunt">Lek i Ordjakt <span aria-hidden="true">›</span></button></div></section></div>';
  }
  function berriesSpread(data){
    const n=data.missions.filter(x=>x.earned).length;
    const cards=data.missions.map(missionCard);
    return '<div class="lmc-spread" data-book-spread="berries">'+
      '<section class="lmc-page lmc-page-left"><header class="lmc-page-head"><span class="lmc-page-ornament">✿</span><div><small>TALLENGA</small><h3>Markedsblomstene</h3></div></header>'+ 
      '<p class="lmc-page-lead">Velg det oppdraget du vil leke. Blomster du har funnet, blir i boken.</p>'+ 
      '<div class="lmc-flower-count"><span>✿</span><strong>'+n+' av '+data.missions.length+'</strong><small>blomster samlet</small></div>'+ 
      '<div class="lmc-mission-grid">'+cards.slice(0,4).join('')+'</div></section>'+ 
      '<section class="lmc-page lmc-page-right"><header class="lmc-page-head"><span class="lmc-page-ornament">✿</span><div><small>TALLENGA</small><h3>Flere små eventyr</h3></div></header>'+ 
      '<div class="lmc-mission-grid lmc-mission-grid-right">'+cards.slice(4).join('')+'</div>'+ 
      '<p class="lmc-note">Trykk på et eventyr for å gå direkte til kurvene. Du mister aldri blomstene dine.</p></section></div>';
  }
  function placeSpread(data,scene){
    const items=data.treasures.filter(x=>x.owned);
    const selected=items.map(x=>x.id);
    return '<div class="lmc-spread" data-book-spread="place">'+
      '<section class="lmc-page lmc-page-left"><header class="lmc-page-head"><span class="lmc-page-ornament">⌂</span><div><small>MITT EGET STED</small><h3>Mitt eventyrsted</h3></div></header>'+ 
      '<p class="lmc-page-lead">Bygg din egen lille skattehylle av ting du allerede har oppdaget.</p>'+ 
      '<div class="lmc-place-scene" aria-label="Skattehyllen din med tre plasser">'+
       '<div class="lmc-place-sky" aria-hidden="true"></div><div class="lmc-place-hill" aria-hidden="true"></div>'+ 
       '<div class="lmc-place-arch" aria-hidden="true">✧</div>'+ 
       '<div class="lmc-display-shelf">'+scene.spots.map((id,i)=>{
         const item=items.find(x=>x.id===id);
         return '<button type="button" class="lmc-display-slot" data-lmc-slot="'+i+'" aria-pressed="'+(i===0)+'" aria-label="Plass '+(i+1)+': '+escapeHtml(item?item.title:'Tom plass')+'">'+
           '<span aria-hidden="true">'+(item?iconForRealm(item.realm):'✧')+'</span><small>'+(item?escapeHtml(item.title):'Tom plass')+'</small></button>';
       }).join('')+'</div></div></section>'+ 
      '<section class="lmc-page lmc-page-right"><header class="lmc-page-head"><span class="lmc-page-ornament">❧</span><div><small>DU BESTEMMER</small><h3>Hva vil du stille ut?</h3></div></header>'+ 
       '<p class="lmc-page-lead">Trykk først på en plass i hyllen, så på skatten du vil sette der. Valget lagres til neste gang.</p>'+ 
       '<div class="lmc-scene-choices">'+items.map(x=>'<button type="button" class="lmc-scene-choice" data-lmc-place-id="'+x.id+'"><span aria-hidden="true">'+iconForRealm(x.realm)+'</span><strong>'+escapeHtml(x.title)+'</strong><small>'+escapeHtml(REALMS[x.realm].name)+'</small></button>').join('')+'</div>'+ 
       (items.length?'':'<p class="lmc-note">Besøk et sted i Læria først, så får du en skatt å stille ut.</p>')+
       '<button type="button" class="lmc-small-reset" data-lmc-action="clear-scene">Rydd hyllen</button></section></div>';
  }
  function spread(page,data,scene){
    if(page==='words')return wordsSpread(data);
    if(page==='berries')return berriesSpread(data);
    if(page==='place')return placeSpread(data,scene);
    return treasuresSpread(data);
  }
  function makeShell(data){
    const found=data.treasures.filter(x=>x.owned).length;
    return '<div class="lmc-shell" data-lmc-version="2">'+
      '<div class="lmc-trim" aria-hidden="true"></div><div class="lmc-paper" aria-hidden="true"></div>'+ 
      '<button type="button" class="bc12-close lmc-close" aria-label="Tilbake til Læria"><span aria-hidden="true">‹</span> Tilbake til Læria</button>'+ 
      '<header class="lmc-cover"><div class="lmc-fox" aria-hidden="true">'+data.foxMarkup+'</div>'+ 
        '<div class="lmc-cover-copy"><span class="lmc-kicker">✦ EVENTYRBOK FRA LÆRIA ✦</span><h2 id="bc12-dialog-title">Lærias magiske samlebok</h2>'+ 
        '<p>Dette er historien om alt du har oppdaget. Jeg blir med deg!</p></div>'+ 
        '<div class="lmc-cover-counter"><span aria-hidden="true">✦</span><strong>'+found+' / '+data.treasures.length+'</strong><small>fagminner</small></div></header>'+ 
      '<nav class="lmc-tabs" aria-label="Bla i samleboken">'+PAGES.map((p,i)=>'<button type="button" data-book-page="'+p.id+'" '+(i===0?'aria-current="page"':'')+'><span aria-hidden="true">'+p.icon+'</span>'+p.label+'</button>').join('')+'</nav>'+ 
      '<div class="lmc-content" aria-live="off"></div>'+ 
      '<footer class="lmc-footer"><span class="lmc-footer-copy">✦ Oppdagelser du gjør, blir med videre</span><div class="lmc-page-arrows"><button type="button" data-lmc-action="previous">‹ Forrige</button><span class="lmc-page-number">1 av '+PAGES.length+'</span><button type="button" data-lmc-action="next">Neste ›</button></div><button type="button" data-wardrobe-open>Min rev ›</button></footer>'+ 
      '</div>';
  }
  function open(host,raw,actions={}){
    const data=normalizeInput(raw);
    let page='treasures',chosenSlot=0,scene=readPlace(data.treasures);
    host.innerHTML=makeShell(data);
    const wrapper=host.querySelector('.lmc-shell');
    if(!wrapper)return;
    const content=wrapper.querySelector('.lmc-content');
    function render(){
      content.innerHTML=spread(page,data,scene);
      wrapper.querySelectorAll('[data-book-page]').forEach(el=>{
        if(el.dataset.bookPage===page)el.setAttribute('aria-current','page');
        else el.removeAttribute('aria-current');
      });
      wrapper.querySelector('.lmc-page-number').textContent=(PAGES.findIndex(p=>p.id===page)+1)+' av '+PAGES.length;
      wrapper.querySelector('[data-lmc-action="previous"]').disabled=page===PAGES[0].id;
      wrapper.querySelector('[data-lmc-action="next"]').disabled=page===PAGES[PAGES.length-1].id;
      wrapper.querySelectorAll('[data-lmc-slot]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.lmcSlot)===chosenSlot)));
    }
    wrapper.addEventListener('click',event=>{
      const el=event.target.closest('button');
      if(!el||!wrapper.contains(el))return;
      if(el.dataset.bookPage){
        page=PAGES.some(p=>p.id===el.dataset.bookPage)?el.dataset.bookPage:page;
        render();wrapper.querySelector('.lmc-content')?.scrollIntoView({block:'nearest',behavior:'instant'});
        return;
      }
      if(el.dataset.lmcAction==='next'||el.dataset.lmcAction==='previous'){
        const offset=el.dataset.lmcAction==='next'?1:-1;
        page=PAGES[Math.max(0,Math.min(PAGES.length-1,PAGES.findIndex(p=>p.id===page)+offset))].id;
        render();return;
      }
      if(el.dataset.lmcAction==='wordhunt'){actions.openWords?.();return;}
      if(el.dataset.lmcMission!=null){
        const index=Number(el.dataset.lmcMission);
        if(Number.isInteger(index)&&data.missions.some(x=>x.index===index))actions.openMission?.(index);
        return;
      }
      if(el.dataset.lmcSlot!=null){chosenSlot=Number(el.dataset.lmcSlot);render();return;}
      if(el.dataset.lmcPlaceId){
        scene=placeItem(scene,chosenSlot,el.dataset.lmcPlaceId,data.treasures);
        savePlace(scene);render();return;
      }
      if(el.dataset.lmcAction==='clear-scene'){
        scene=normalizePlace(null,data.treasures);savePlace(scene);render();return;
      }
    });
    render();
  }
  return Object.freeze({VERSION,KEY,PAGES,REALMS,normalizePlace,placeItem,normalizeInput,open});
});