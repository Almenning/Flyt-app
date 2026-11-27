/* Trollbutikken: scene UI, mechanics and stage-specific TrollActor roles. */
(function(){
  'use strict';
  const E=window.LARIA_TROLLBUTIKKEN_ENGINE,screen=document.getElementById('trollbutikken-screen');
  if(!E||!screen)return;
  const override=new URLSearchParams(location.search).get('lariaTrollbutikk');
  if(override==='0')return;
  // The first published content is authored for second grade. Use Tallvika's
  // current view grade; choosing another view never changes the child profile.
  const releaseGrades=new Set([2]);
  const available=()=>override==='1'||releaseGrades.has(Number(window.LARIA_TALLVIKA_BRIDGE?.journeyViewGrade?.('math')));
  const KEY='laria-trollbutikken-v1';
  const TRIP_KEY='laria-trollbutikken-customer-v1';
  const WAREHOUSE_KEY='laria-trollbutikken-warehouse-v1';
  const roles={storesoster:'Storesøster',lillesoster:'Lillesøster',lillebror:'Lillebror'};
  const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function art(id){
    return Object.hasOwn(E.catalog,id)?'<img src="./assets/trollbutikken/'+id+'.webp" alt="" draggable="false">':'';
  }
  const actor=()=>window.LARIA_TROLL_ACTOR;
  const companion=()=>actor()?.choice?.()||'storesoster';
  function load(){try{return E.normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){return E.fresh();}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
  function loadTrip(){try{return E.normalizeTrip(JSON.parse(localStorage.getItem(TRIP_KEY)||'null'));}catch(_){return E.tripFresh();}}
  function saveTrip(){try{localStorage.setItem(TRIP_KEY,JSON.stringify(trip));}catch(_){}}
  function loadWarehouse(){try{return E.normalizeWarehouse(JSON.parse(localStorage.getItem(WAREHOUSE_KEY)||'null'));}catch(_){return E.warehouseFresh();}}
  function saveWarehouse(){try{localStorage.setItem(WAREHOUSE_KEY,JSON.stringify(warehouse));}catch(_){}}
  let state=load(),free=null,tripOpen=false,trip=loadTrip(),warehouseOpen=false,warehouse=loadWarehouse(),suppressClickUntil=0,drag=null,speech=null,priceDraft='';
  const surface=document.createElement('div');
  const announcement=document.createElement('p');
  announcement.className='tb-sr';
  announcement.setAttribute('role','status');
  announcement.setAttribute('aria-live','polite');
  announcement.setAttribute('aria-atomic','true');
  screen.append(surface,announcement);

  function avatar(id,kind){
    const src=actor()?.source?.(id)||'./assets/gangemagi-troll/'+id+'.webp';
    return '<div class="tb-actor laria-troll-actor" data-tb-actor="'+kind+'" data-troll="'+id+'" data-laria-troll-mood="idle">'+
     '<img src="'+esc(src)+'" alt="" draggable="false"></div>';
  }
  const products=()=>Object.values(E.catalog);
  const countLabel=(p,n)=>n===1?({milk:'flaske melk',honey:'glass honning'}[p.id]||p.label.toLowerCase()):p.plural;
  const button=(type,copy,extra='',cls='')=>'<button type="button" class="tb-button '+cls+'" data-tb-action="'+type+'" '+extra+'>'+copy+'</button>';
  const money=E.money;
  const phaseLabels={pick:'Plukk varer',register:'Tell i kassen',change:'Gi tilbake veksel',receipt:'Kvittering'};
  const tripLabels={pick:'På handletur',pay:'Betal for varene',done:'Handleturen er ferdig'};
  const activeBasket=()=>tripOpen?trip.basket:free||state.basket;
  function shelf(){
    const goods=products();
    const rows=[goods.slice(0,3),goods.slice(3)].map(row=>'<div class="tb-shelfRow">'+row.map(p=>{
      const left=(free||tripOpen?p.stock:state.inventory[p.id])-(activeBasket()[p.id]||0);
      return button('add','<span class="tb-goods"><span class="tb-merchPast">'+art(p.id)+'</span>'+art(p.id)+'</span>'+
        '<span class="tb-priceTag"><b>'+p.label+'</b><small>'+(left?money(p.price):'Tom hylle')+'</small></span>',
        'data-tb-id="'+p.id+'" aria-label="'+p.label+', '+money(p.price)+' per stykk. '+(left?'Legg én i kurven.':'Tom hylle.')+'" '+(!left?'disabled':''),'tb-product');
    }).join('')+'</div>').join('');
    return '<section class="tb-wood tb-shelf" aria-label="Varehyller"><header class="tb-shelfHeader"><h2>Velg fra hylla</h2>'+
      '<p>Trykk på en vare, eller dra den til kurven.</p></header><div class="tb-product-grid">'+rows+'</div></section>';
  }
  function basket(){
    const current=activeBasket(),units=E.units(current);
    const contents=products().filter(p=>current[p.id]);
    const items=contents.map(p=>{
      const n=current[p.id];
      return '<li class="tb-basketLine">'+art(p.id)+'<span class="tb-basketItemName">'+n+' '+countLabel(p,n)+'</span>'+
        button('remove','<span aria-hidden="true">−</span>',
          'data-tb-id="'+p.id+'" aria-label="Ta ut én: '+p.label+'"','tb-remove')+'</li>';
    }).join('');
    // Give each kind a visible spot before painting extra copies in the basket.
    const visibleGoods=contents.map(p=>p.id).concat(contents.flatMap(p=>Array(Math.min(7,current[p.id]-1)).fill(p.id))).slice(0,8);
    return '<section class="tb-basket" data-tb-drop="basket" aria-labelledby="tb-basket-heading"><div class="tb-basketVessel" aria-hidden="true"><img alt="" src="./gangemagi-basket-locked-illustration.svg">'+
      '<div class="tb-basketContents">'+visibleGoods.map(id=>'<span>'+art(id)+'</span>').join('')+'</div></div>'+
      '<div class="tb-basketWork"><header class="tb-basketHead"><h2 id="tb-basket-heading">Kurven din</h2><span>'+units+' '+(units===1?'vare':'varer')+'</span></header>'+
      (items?'<ul class="tb-basketItems" role="list">'+items+'</ul>':'<p class="tb-basketEmpty">Ingen varer i kurven ennå.</p>')+
      '<footer class="tb-basketFooter">'+(free||tripOpen?'<p class="tb-sum">I kurven <strong>'+money(E.total(current))+'</strong></p>':'')+
      (!free?button(tripOpen?'trip-check':'basket','Gå til kassen ›','','tb-primary'):'')+'</footer></div></section>';
  }
  function order(c,id){
    return '<section class="tb-paper tb-order"><div class="tb-orderTop">'+avatar(id,'customer')+
      '<div class="tb-customerWords"><small>'+roles[id]+' · KUNDE '+(state.index+1)+' AV 3</small><h2>'+c.title+'</h2><p>'+c.hello+'</p></div></div>'+
      '<div class="tb-orderSlip"><b class="tb-slipTitle">Handlelapp</b>'+
      '<ul aria-label="Handlelapp">'+Object.entries(c.order).map(([key,n])=>{
        const p=E.catalog[key];
        return '<li>'+art(key)+'<span><b>'+n+'</b> '+(n===1?p.label.toLowerCase():p.plural)+'</span></li>';
      }).join('')+'</ul></div></section>';
  }
  function counterHelp(id){
    return '<aside class="tb-counterHelp" aria-label="Hjelp fra '+roles[id]+'">'+avatar(id,'helper')+
      '<p id="tb-helper-copy">'+esc(state.feedback||helperCopy(id))+'</p>'+
      button('hint','Hint','aria-label="Få et hint fra '+roles[id]+'" aria-describedby="tb-helper-copy"','tb-secondary')+
      (localVoice()?button('listen','Les opp','aria-describedby="tb-helper-copy"','tb-secondary'):'')+'</aside>';
  }
  // Redrawn as a cabinet shell: no painted keys behind the real DOM keys.
  function brassCrown(){
    return '<svg class="tb-brassCrown" viewBox="0 0 300 75" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
      '<defs><linearGradient id="tb-brass-rim" x2=".2" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#fff1a7"/><stop offset=".28" stop-color="#c58339"/><stop offset=".50" stop-color="#945023"/><stop offset=".73" stop-color="#e8ad5e"/><stop offset="1" stop-color="#5a2b16"/></linearGradient>'+
      '<linearGradient id="tb-brass-body" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a05f38"/><stop offset=".48" stop-color="#593223"/><stop offset="1" stop-color="#30170f"/></linearGradient>'+
      '<pattern id="tb-brass-hatch" width="9" height="4" patternUnits="userSpaceOnUse"><path d="M0 3H9M1 1h3M5 2h3" stroke="#eeb572" stroke-width=".36" opacity=".42"/></pattern>'+
      '<path id="tb-brass-casting" d="M4 74V61Q26 60 37 44Q49 27 66 25Q91 25 107 9Q112 4 129 4H171Q188 4 193 9Q210 25 234 25Q252 27 263 44Q274 60 296 61V74Z"/></defs>'+
      '<use href="#tb-brass-casting" fill="url(#tb-brass-body)" stroke="#402317" stroke-width="8"/>'+
      '<use href="#tb-brass-casting" fill="url(#tb-brass-hatch)" stroke="url(#tb-brass-rim)" stroke-width="5"/>'+
      '<path d="M16 68Q34 66 48 47Q58 33 76 34Q95 34 111 17Q115 13 130 13H170Q185 13 189 17Q205 34 224 34Q242 33 252 47Q266 66 284 68" fill="none" stroke="#e7ad63" stroke-opacity=".65" stroke-width="1.4"/>'+
      '<path d="M38 62q17-3 21-12q3-8 13-8q8 0 9 7q0 6-7 6q-4-1-3-4M262 62q-17-3-21-12q-3-8-13-8q-8 0-9 7q0 6 7 6q4-1 3-4" fill="none" stroke="#cb8f4a" stroke-width="2.1" stroke-linecap="round"/>'+
      '<path d="M88 60l6-5 6 5-6 5zM212 60l-6-5-6 5 6 5z" fill="#d49a52"/>'+
      '<circle cx="26" cy="67" r="2.5" fill="#f1b966"/><circle cx="274" cy="67" r="2.5" fill="#f1b966"/></svg>';
  }
  function cashier(c,id,chosen,isChange){
    const title=phaseLabels[state.phase];
    const changeMessage=state.feedback||'';
    const speech=isChange?(/for mye/i.test(changeMessage)?'Oi, det ble litt for mange mynter.':/for lite/i.test(changeMessage)?'Jeg tror det mangler litt.':'Her er '+money(c.tender)+'. Har du veksel?'):'Hva blir det til sammen?';
    const lines=Object.entries(state.basket).map(([key,n])=>{
      const p=E.catalog[key],done=state.scanned.includes(key);
      return button('scan','<span>'+art(key)+'<b>'+n+' '+countLabel(p,n)+'</b></span><span>'+money(p.price)+' per stk.</span><strong aria-hidden="true">'+(done?'✓':'')+'</strong>',
        'data-tb-id="'+key+'" aria-pressed="'+done+'" aria-label="'+(done?'Sjekket: ':'Sjekk: ')+n+' '+countLabel(p,n)+' til '+money(p.price)+' stykket"','tb-scan');
    }).join('');
    const display=priceDraft?priceDraft+' kr':'— kr';
    const keypad=['1','2','3','4','5','6','7','8','9','del','0'].map(key=>
      button('keypad','<span class="tb-keycap" aria-hidden="true">'+(key==='del'?'⌫':key)+'</span>','data-tb-key="'+key+'" aria-label="'+(key==='del'?'Slett siste siffer':'Tast '+key)+'"','tb-key')).join('');
    const register='<div class="tb-counterRegister"><div class="tb-counterSlip"><h2>På handlelappen</h2><div class="tb-lineItems">'+lines+'</div></div>'+
      '<form class="tb-cashMachine" data-tb-price-form><div class="tb-brassHead">'+brassCrown()+
      '<div class="tb-brassDisplay"><p data-tb-price-display aria-hidden="true">'+display+'</p>'+
      '<label class="tb-sr" for="tb-price">Varene koster, hele kroner</label><input class="tb-machineValue" id="tb-price" name="price" type="text" inputmode="none" pattern="[0-9]*" maxlength="3" autocomplete="off" value="'+priceDraft+'"></div></div>'+
      '<div class="tb-machineKeys" role="group" aria-label="Taster på kassaapparatet">'+keypad+'<button type="submit" data-tb-price-confirm aria-label="Ta betalt" class="tb-button tb-key tb-machineEnter"><span class="tb-keycap" aria-hidden="true">OK</span></button></div>'+
      '<div class="tb-machineDrawer" aria-hidden="true"><i></i><span></span><i></i></div><div class="tb-machineCrank" aria-hidden="true"><i></i></div></form></div>';
    const changeView='<div class="tb-counterChange"><div class="tb-counterTender"><div class="tb-counterTotal"><span>Varene koster</span><strong>'+money(E.total(state.basket))+'</strong></div>'+
      '<div class="tb-banknote" aria-label="Kunden la '+money(c.tender)+' på disken"><span aria-hidden="true">❧</span><strong>'+money(c.tender)+'</strong><small>FRA '+roles[id]+'</small></div></div>'+
      '<div class="tb-cashDrawer"><b>Mynter i kassa</b><div class="tb-wallet tb-coinDrawer" role="group" aria-label="Mynter i kassa">'+E.coins.map(n=>
        button('coin',coinFace(n),'data-tb-coin="'+n+'" aria-label="Legg til '+money(n)+'"','tb-coinButton')).join('')+'</div></div>'+
      '<div class="tb-handOff">'+coinTray(state.change,false,id)+
      button('settle','Gi veksel ›','','tb-primary')+'</div></div>';
    return '<section class="tb-counterWorld '+(isChange?'tb-sceneCoins':'tb-sceneTill')+'"><div class="tb-counterCustomer">'+avatar(id,'customer')+
      '<div class="tb-counterBubble"><small>'+roles[id]+' · '+(state.index+1)+' av 3</small><p>'+esc(speech)+'</p></div></div>'+
      '<div class="tb-counterBench"><h1 tabindex="-1" data-tb-focus>'+title+'</h1>'+(isChange?changeView:register)+counterHelp(chosen)+'</div></section>';
  }
  const coinFace=n=>'<span class="tb-coin tb-coin-'+n+'">'+n/100+'<small>kr</small></span>';
  function coinTray(coins,customer,recipient){
    const label=recipient?'Veksel til '+roles[recipient]:customer?'Mynter du har lagt fram':'Mynter på disken';
    return '<div class="tb-cashtray" data-tb-drop="cash" role="group" aria-label="'+label+'">'+
      '<b class="tb-trayLabel" aria-hidden="true">'+(recipient?'Til '+roles[recipient]:'På disken')+'</b>'+
      '<div class="tb-trayCoins">'+(coins.length?coins.map((n,i)=>
        button('uncoin',coinFace(n),'data-tb-index="'+i+'" aria-label="'+(customer?'Ta tilbake ':'Ta bort ')+money(n)+'"','tb-coinButton')).join(''):'<span>Legg mynter her</span>')+'</div></div>';
  }
  function receipt(c,id){
    return '<section class="tb-paper tb-register tb-receipt"><p class="tb-eyebrow">TROLLBUTIKKEN · KVITTERING</p><h2>Takk for handelen, sier '+roles[id]+'!</h2>'+
      '<ul>'+Object.entries(state.basket).map(([key,n])=>'<li><span>'+n+' '+countLabel(E.catalog[key],n)+'</span><strong>'+money(n*E.catalog[key].price)+'</strong></li>').join('')+'</ul>'+
      '<div class="tb-ledger"><p>Til sammen <strong>'+money(E.total(state.basket))+'</strong></p><p>Betalt <strong>'+money(c.tender)+'</strong></p><p>Vekslepenger <strong>'+money(E.changeDue(state))+'</strong></p></div>'+
      '<p>'+money(E.total(state.basket))+' + '+money(E.changeDue(state))+' = '+money(c.tender)+'.</p>'+
      button('next',state.index===2?'Steng for kvelden':'Ta imot neste kunde ›','','tb-primary')+'</section>';
  }
  function counterReceipt(c,id){
    return '<section class="tb-counterWorld tb-counterDone"><div class="tb-counterCustomer">'+avatar(id,'customer')+
      '<div class="tb-counterBubble"><small>'+roles[id]+' · '+(state.index+1)+' av 3</small><p>Takk! Da tar jeg med posen.</p></div></div>'+
      '<div class="tb-counterBench"><h1 tabindex="-1" data-tb-focus>Kvittering</h1><div class="tb-receiptScene">'+receipt(c,id)+
      '<div class="tb-packedBag" aria-hidden="true"><span>❧</span></div></div></div></section>';
  }
  function tripList(t){
    const price=E.total(trip.basket),left=t.budget-price;
    const content=t.exact?Object.entries(t.exact).map(([id,n])=>{
      const ok=trip.basket[id]===n;
      return '<li>'+art(id)+'<span><b>'+n+'</b> '+countLabel(E.catalog[id],n)+'</span>'+(ok?'<small class="tb-trip-check">✓ Antallet passer</small>':'')+'</li>';
    }).join(''):'<li><span><b>'+E.uniqueCount(trip.basket)+' / '+t.minKinds+'</b> ulike vareslag</span></li>'+
      '<li><span><b>'+E.units(trip.basket)+' / '+t.minCount+'</b> varer i alt</span></li>';
    return '<section class="tb-paper tb-order tb-tripCard"><p class="tb-eyebrow">HANDLELAPP · TUR '+(trip.index+1)+' AV '+E.trips.length+'</p>'+
      '<h2>'+t.title+'</h2><p>'+t.scene+'</p><ul aria-label="Handlelapp">'+content+'</ul>'+
      '<div class="tb-tripLedger"><p>Budsjett <strong>'+money(t.budget)+'</strong></p>'+
      '<p>Pris i kurven <strong>'+money(price)+'</strong></p><p class="'+(left<0?'tb-tripOver':'')+'">'+(left<0?'Over budsjett':'Igjen')+' <strong>'+money(Math.abs(left))+'</strong></p></div></section>';
  }
  function tripBuy(t,shopkeeper){
    const price=E.total(trip.basket);
    return '<section class="tb-paper tb-register"><div class="tb-shopkeeper">'+avatar(shopkeeper,'seller')+'<div>'+
      '<p class="tb-eyebrow">'+roles[shopkeeper]+' · I KASSA</p><h2>Dine lekepenger</h2>'+
      '<p>Legg fram nok mynter til å betale. Kassatrollet gir tilbake det som blir til overs.</p></div></div>'+
      '<div class="tb-ledger"><p>Varene koster <strong>'+money(price)+'</strong></p><p>I lommeboka <strong>'+money(t.budget-E.paidTotal(trip))+'</strong></p></div>'+
      '<p class="tb-moneyDirection">Dra eller trykk på en mynt fra lommeboka.</p>'+
      '<div class="tb-wallet tb-coinDrawer" role="group" aria-label="Dine mynter">'+E.coins.filter(n=>Object.hasOwn(t.wallet,n)).map(n=>{
        const left=t.wallet[n]-E.paidCount(trip,n);
        return button('coin',coinFace(n)+'<small class="tb-coin-stock">'+left+' igjen</small>',
          'data-tb-coin="'+n+'" '+(left?'':'disabled ')+'aria-label="Legg til '+money(n)+'. '+left+' igjen."','tb-coinButton');
      }).join('')+'</div>'+
      coinTray(trip.paid,true)+
      '<p class="tb-sum">Du har lagt fram <strong>'+money(E.paidTotal(trip))+'</strong></p>'+
      '<div class="tb-lineActions">'+button('trip-pay','Betal med lekepengene ›','','tb-primary')+
      button('trip-edit','Endre kurven','','tb-secondary')+'</div></section>';
  }
  function tripReceipt(t,shopkeeper){
    const price=E.total(trip.basket),paid=E.paidTotal(trip),back=paid-price;
    return '<section class="tb-paper tb-register tb-receipt"><div class="tb-shopkeeper">'+avatar(shopkeeper,'seller')+'<div><p class="tb-eyebrow">'+roles[shopkeeper]+' · I KASSA</p>'+
      '<h2>Du holdt budsjettet!</h2></div></div>'+
      '<ul>'+Object.entries(trip.basket).map(([id,n])=>'<li><span>'+n+' '+countLabel(E.catalog[id],n)+'</span><strong>'+money(n*E.catalog[id].price)+'</strong></li>').join('')+'</ul>'+
      '<div class="tb-ledger"><p>Varene kostet <strong>'+money(price)+'</strong></p><p>Du la fram <strong>'+money(paid)+'</strong></p>'+
      '<p>Du fikk tilbake <strong>'+money(back)+'</strong></p><p>Igjen av budsjettet <strong>'+money(t.budget-price)+'</strong></p></div>'+
      '<p>'+money(t.budget)+' − '+money(price)+' = '+money(t.budget-price)+' igjen.</p>'+
      button('trip-next','Ny handletur ›','','tb-primary')+'</section>';
  }
  function tripView(chosen){
    const t=E.tripAt(trip),shopkeeper=E.role(chosen,t.seller);
    return '<div class="tb-statusline"><h1 tabindex="-1" data-tb-focus>'+tripLabels[trip.phase]+'</h1><span>KUNDE · LEKEPENGER</span></div>'+
      '<div class="tb-counter"><div class="tb-left">'+tripList(t)+helper(chosen)+'</div><div class="tb-mainPlay">'+
      (trip.phase==='pick'?shelf()+basket():trip.phase==='pay'?tripBuy(t,shopkeeper):tripReceipt(t,shopkeeper))+'</div></div>';
  }
  function goodsRow(d,count,base=0){
    const goods=Array.from({length:count},(_,i)=>'<span class="'+(i<base?'tb-already-stock':'')+'">'+art(d.item)+'</span>').join('');
    return '<div class="tb-goodsRow" aria-hidden="true">'+(goods||'<small>Tom</small>')+'</div>';
  }
  function warehouseView(chosen){
    const d=E.deliveryAt(warehouse),supplier=E.role(chosen,d.supplier),left=E.warehouseRemaining(warehouse),p=E.catalog[d.item];
    const done=warehouse.phase==='done',multiple=d.initial.length>1;
    const destinations=d.initial.map((before,i)=>{
      const place=multiple?'Kurv '+(i+1):'Kveldshylla';
      return '<section class="tb-paper tb-stockBin"><div class="tb-sectionHead">'+(multiple?'<img alt="" src="./gangemagi-basket-locked-illustration.svg">':'')+
        '<h2>'+place+'</h2></div><p><strong>'+(before+warehouse.added[i])+'</strong> av '+d.goal+' '+p.plural+'</p>'+
        goodsRow(d,before+warehouse.added[i],before)+(done?'':'<div class="tb-lineActions">'+
          button('stock-add','+ Legg i','data-tb-index="'+i+'" aria-label="Legg én vare i '+place+'" '+(left?'':'disabled '),'tb-secondary')+
          button('stock-remove','− Ta ut','data-tb-index="'+i+'" aria-label="Ta én vare ut av '+place+'" '+(warehouse.added[i]?'':'disabled '),'tb-secondary')+'</div>')+'</section>';
    }).join('');
    return '<div class="tb-statusline"><h1 tabindex="-1" data-tb-focus>'+(done?'Leveransen er på plass':'Hjelp på lageret')+'</h1><span>LAGER · '+(warehouse.index+1)+' AV '+E.deliveries.length+'</span></div>'+
      '<div class="tb-counter"><div class="tb-left"><section class="tb-paper tb-order"><div class="tb-shopkeeper">'+avatar(supplier,'supplier')+
      '<div><p class="tb-eyebrow">'+roles[supplier]+' · MED LEVERANSEN</p><h2>'+d.title+'</h2><p>'+d.scene+'</p></div></div></section>'+helper(chosen)+'</div>'+
      '<div class="tb-mainPlay"><section class="tb-wood tb-stockSource"><h2>'+d.source+'</h2><p><strong>'+left+'</strong> '+p.plural+' igjen i kassa</p>'+goodsRow(d,left)+'</section>'+
      '<div class="tb-stockBins" data-tb-width="'+d.initial.length+'">'+destinations+'</div><section class="tb-paper tb-stockAction">'+
      (done?'<p>'+(multiple?'Fire epler i hver av de tre kurvene er tolv epler.':'Seks brød på hylla + fire fra kassa = ti. Fire er igjen i kassa.')+'</p>':
       '<p>'+(multiple?'Du kan flytte eplene mellom kassa og kurvene til det er like mange i hver.':'Du trenger ikke bruke alle brødene. Det som blir til overs, kan ligge i kassa.')+'</p>')+
      button(done?'stock-next':'stock-check',done?'Neste levering ›':'Sjekk leveransen ›','','tb-primary')+'</section></div></div>';
  }
  function helperCopy(id){
    if(warehouseOpen){
      if(warehouse.feedback)return warehouse.feedback;
      if(warehouse.phase==='done')return 'Takk for hjelpen! Nå blir det lett å finne varene.';
      return E.deliveryAt(warehouse).initial.length>1?'Prøv en kurv av gangen. Du kan ta ut et eple igjen hvis det blir for mange.':'Tell videre fra det som allerede er på hylla.';
    }
    if(tripOpen){
      if(trip.phase==='done')return 'Se på kvitteringen. Veksel er det du fikk tilbake, mens resten av budsjettet er alt du har igjen.';
      if(trip.feedback)return trip.feedback;
      if(trip.phase==='pay')return 'Se hva varene koster. Ta de myntene du trenger fra lommeboka.';
      return id==='lillebror'?'Vi kan prøve én vare om gangen og holde øye med prisen.':'Vi finner varene på lappen sammen. Hold øye med pengene vi har med.';
    }
    if(free)return 'Prøv å legge til eller ta ut en vare. Hvordan endrer prisen seg? Det finnes ingen fasit her.';
    if(state.feedback)return state.feedback;
    if(state.phase==='pick')return state.index===0?'Se på handlelappen. Legg én ting om gangen i kurven.':'Her kommer neste bestilling. Jeg passer kassa mens du plukker.';
    if(state.phase==='register')return 'Hva koster alle varene sammen? Skriv summen på kassa. Jeg kan hjelpe hvis du står fast.';
    if(state.phase==='change')return 'Vi kan telle fra prisen opp til det kunden ga.';
    if(state.phase==='receipt')return 'Fint samarbeid! Kvitteringen viser hvordan pengene henger sammen.';
    return 'Bli med bak disken. Vi har plass til tre kunder i dag!';
  }
  function helper(id){
    const hintable=warehouseOpen?warehouse.phase!=='done':tripOpen?trip.phase!=='done':!free&&['pick','register','change'].includes(state.phase);
    return '<aside class="tb-helper" aria-label="Butikkhjelper">'+avatar(id,'helper')+'<div><p class="tb-eyebrow">'+roles[id]+' · DIN HJELPER</p>'+
      '<p id="tb-helper-copy">'+esc(helperCopy(id))+'</p></div><div class="tb-helper-controls">'+
      (hintable?button('hint','Få et hint','aria-describedby="tb-helper-copy"','tb-secondary'):'')+
      (localVoice()?button('listen','Les opp','aria-describedby="tb-helper-copy"','tb-secondary'):'')+'</div></aside>';
  }
  function focusScene(){screen.querySelector('[data-tb-focus]')?.focus({preventScroll:true});}
  function render(restore){
    if(!screen.classList.contains('active'))return;
    const chosen=companion(),c=E.customer(state),id=E.role(chosen,c.who);
    const introductory=['welcome','closing'].includes(state.phase);
    const mode=warehouseOpen?'warehouse':tripOpen?'trip':free?'free':introductory?'entry':'owner';
    const stagePhase=warehouseOpen?warehouse.phase:tripOpen?trip.phase:free?'pick':state.phase;
    const atCash=mode==='owner'&&['register','change','receipt'].includes(stagePhase);
    const core=atCash?(stagePhase==='receipt'?counterReceipt(c,id):cashier(c,id,chosen,stagePhase==='change')):warehouseOpen?warehouseView(chosen):tripOpen?tripView(chosen):free?
      '<div class="tb-statusline"><h1 tabindex="-1" data-tb-focus>Fri butikk</h1><span>INGEN HANDLELAPP</span></div>'+
      '<div class="tb-counter"><div class="tb-left">'+helper(chosen)+'</div><div class="tb-mainPlay">'+shelf()+basket()+'</div></div>':
      introductory?
      '<div class="tb-entry"><section class="tb-start"><p class="tb-eyebrow">TALLVIKA · DEN LILLE LANDHANDELEN</p>'+
      '<h1 tabindex="-1" data-tb-focus>'+ (state.phase==='welcome'?'Velkommen til Trollbutikken':'Butikkdagen er ferdig') +'</h1>'+
      '<p>'+(state.phase==='welcome'?'Kundene kommer snart. Finn varene, bruk kassa og hjelp trollene med vekslepenger.':
      'Du hjalp tre kunder i dag. Du kan stenge butikken nå eller åpne en ny dag.')+'</p>'+
      (state.phase==='closing'?'<p class="tb-tally">'+state.days+' fullført'+(state.days===1?' butikkdag':'e butikkdager')+' · '+state.served+' kunder hjulpet</p>':'')+
      button('start',state.phase==='welcome'?'Åpne butikken ›':'Åpne en ny butikkdag ›','','tb-primary')+
      '<div class="tb-lineActions">'+button('trip','Gå på handletur','','tb-secondary')+
      button('warehouse','Hjelp på lageret','','tb-secondary')+button('free','Prøv fri butikk','','tb-secondary')+'</div></section>'+helper(chosen)+'</div>':
      '<div class="tb-statusline"><h1 tabindex="-1" data-tb-focus>'+phaseLabels[state.phase]+'</h1><div class="tb-statusActions"><span>Kunde '+(state.index+1)+' av 3</span>'+
      button('trip','Handletur','aria-label="Sett butikkdagen på pause og gå på handletur"','tb-secondary')+
      button('warehouse','Lager','aria-label="Sett butikkdagen på pause og hjelp på lageret"','tb-secondary')+'</div></div>'+
      '<div class="tb-counter"><div class="tb-left">'+order(c,id)+helper(chosen)+'</div><div class="tb-mainPlay">'+
      (state.phase==='pick'?shelf()+basket():receipt(c,id))+'</div></div>';
    const roomShelf=(!atCash&&(mode==='entry'||mode==='owner'&&stagePhase!=='pick'))?
      '<div class="tb-merchBackdrop" aria-hidden="true"><div>'+['apple','bread','honey','carrot','milk'].map(id=>'<span>'+art(id)+'</span>').join('')+'</div></div>':'';
    surface.innerHTML='<div class="tb-room" data-tb-mode="'+mode+'" data-tb-phase="'+stagePhase+'">'+roomShelf+'<header class="tb-top">'+(free||tripOpen||warehouseOpen?button('resume','‹ Butikkdagen','id="trollbutikken-back" aria-label="Tilbake til butikkdagen"','tb-back'):
      button('back','‹ Tallvika','id="trollbutikken-back" aria-label="Tilbake til Tallvika"','tb-back'))+
      '<div class="tb-brand">Trollbutikken<small>LANDHANDELEN I TALLVIKA</small></div><span class="tb-marker">LEKEPENGER</span></header>'+core+'</div>';
    if(restore){
      const current=[...screen.querySelectorAll('button[data-tb-action]')].find(btn=>
        btn.dataset.tbAction===restore.action&&btn.dataset.tbId===restore.id&&btn.dataset.tbCoin===restore.coin&&btn.dataset.tbIndex===restore.index&&!btn.disabled);
      (current||screen.querySelector('[data-tb-action="hint"]')||screen.querySelector('[data-tb-focus]'))?.focus({preventScroll:true});
    }
  }
  function mood(kind,who='helper'){
    actor()?.mood?.(screen.querySelector('[data-tb-actor="'+who+'"]'),kind,{say:false,duration:1100});
  }
  function stopTalk(){
    if(!speech)return;
    try{window.speechSynthesis.cancel();}catch(_){}
    speech=null;
  }
  function localVoice(){
    if(window.LARIA_TALLVIKA_BRIDGE?.state?.()?.preferences?.sound===false||!window.SpeechSynthesisUtterance)return null;
    return window.speechSynthesis?.getVoices()?.find(v=>v.localService&&/^(nb|nn|no)(-|_|$)/i.test(v.lang))||null;
  }
  function listen(){
    const voice=localVoice(),synth=window.speechSynthesis;
    if(!voice||!synth)return;
    stopTalk();
    const utterance=new SpeechSynthesisUtterance(helperCopy(companion()));
    utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.93;
    utterance.onend=utterance.onerror=()=>{if(speech===utterance)speech=null;};
    speech=utterance;
    try{synth.speak(utterance);mood('think');}catch(_){speech=null;}
  }
  function restoreButton(action,keyboard){
    return keyboard?{action:action.type,id:action.id,coin:action.coin&&String(action.coin),
      index:action.index!==undefined?String(action.index):undefined}:null;
  }
  function perform(action,keyboard){
    if(warehouseOpen){
      const before=warehouse.phase,next=E.applyWarehouse(warehouse,action);
      if(next===warehouse)return;
      const scroll=screen.scrollTop;warehouse=next;saveWarehouse();stopTalk();
      render(before===warehouse.phase?restoreButton(action,keyboard):null);
      if(before!==warehouse.phase){screen.scrollTop=0;focusScene();}else screen.scrollTop=scroll;
      announcement.textContent=warehouse.feedback||
        (warehouse.phase==='done'?'Leveransen er på plass.':E.warehouseRemaining(warehouse)+' varer igjen i kassa.');
      if(action.type==='hint')mood('hint');
      else if(warehouse.phase==='done'&&before!=='done'){mood('celebrate');mood('wave','supplier');}
      else if(warehouse.feedback)mood('support');
      return;
    }
    if(tripOpen){
      const before=trip.phase,next=E.applyTrip(trip,action);
      if(next===trip)return;
      const scroll=screen.scrollTop;trip=next;saveTrip();stopTalk();
      render(before===trip.phase?restoreButton(action,keyboard):null);
      if(before!==trip.phase){screen.scrollTop=0;focusScene();}else screen.scrollTop=scroll;
      const p=E.catalog[action.id];
      announcement.textContent=trip.feedback||(p?
        (trip.basket[p.id]||0)+' '+countLabel(p,trip.basket[p.id]||0)+' i kurven. Pris '+money(E.total(trip.basket))+'.':
        ['coin','uncoin'].includes(action.type)?money(E.paidTotal(trip))+' lagt fram.':tripLabels[trip.phase]);
      if(action.type==='hint')mood('hint');
      else if(trip.phase==='done'&&before!=='done'){mood('celebrate');mood('wave','seller');}
      else if(trip.phase==='pay'&&before!=='pay')mood('wave','seller');
      else if(trip.feedback&&before===trip.phase)mood('support');
      return;
    }
    if(free){
      const next=E.freeBasket(free,action);
      if(next!==free){
        const scroll=screen.scrollTop;free=next;stopTalk();
        render(keyboard?{action:action.type,id:action.id}:null);
        screen.scrollTop=scroll;
        const p=E.catalog[action.id];
        announcement.textContent=(free[p.id]||0)+' '+countLabel(p,free[p.id]||0)+' i kurven. Totalt '+money(E.total(free))+'.';
      }
      return;
    }
    const before=state.phase,next=E.apply(state,action);
    if(next===state)return;
    state=next;save();stopTalk();
    if(before!==state.phase)priceDraft='';
    const oldScroll=screen.scrollTop;
    render(before===state.phase?restoreButton(action,keyboard):null);
    if(before!==state.phase){screen.scrollTop=0;focusScene();}
    else screen.scrollTop=oldScroll;
    const p=E.catalog[action.id];
    announcement.textContent=state.feedback||
      (p&&['add','remove'].includes(action.type)?(state.basket[p.id]||0)+' '+countLabel(p,state.basket[p.id]||0)+' i kurven.':
      ['coin','uncoin'].includes(action.type)?state.change.length+' mynter på disken.':
      before!==state.phase?phaseLabels[state.phase]||'Butikkdagen er ferdig.':'');

    if(action.type==='hint')mood('hint');
    else if(state.phase==='receipt'&&before!=='receipt'){mood('celebrate');mood('wave','customer');}
    else if(state.phase==='pick'&&before!=='pick')mood('wave','customer');
    else if(state.feedback){mood('support');if(action.type==='settle'&&state.phase==='change')mood('support','customer');}
  }
  screen.addEventListener('input',ev=>{
    if(ev.target.id!=='tb-price')return;
    if(/^[0-9]{0,3}$/.test(ev.target.value))priceDraft=ev.target.value;
    else ev.target.value=priceDraft;
    const display=screen.querySelector('[data-tb-price-display]');
    if(display)display.textContent=priceDraft?priceDraft+' kr':'— kr';
  });
  screen.addEventListener('submit',ev=>{
    if(!ev.target.matches('[data-tb-price-form]'))return;
    ev.preventDefault();
    const stayAt=screen.scrollTop;
    perform({type:'pay',kroner:priceDraft?Number(priceDraft):undefined},false);
    if(state.phase==='register'){
      screen.querySelector('[data-tb-price-confirm]')?.focus({preventScroll:true});
      screen.scrollTop=stayAt;
    }
  });
  screen.addEventListener('click',ev=>{
    const b=ev.target.closest('button[data-tb-action]');if(!b)return;
    const {tbAction,tbId,tbCoin,tbIndex}=b.dataset;
    if(['add','coin','uncoin'].includes(tbAction)&&Date.now()<suppressClickUntil&&ev.detail!==0)return;
    if(tbAction==='keypad'){
      const key=b.dataset.tbKey,input=screen.querySelector('#tb-price');
      if(state.phase!=='register'||!input||!/^([0-9]|del)$/.test(key))return;
      input.value=key==='del'?priceDraft.slice(0,-1):(priceDraft+key).slice(0,3);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        const cap=b.querySelector('.tb-keycap');
        cap?.animate?.([{transform:'translateY(3px)'},{transform:'translateY(0)'}],
          {duration:130,easing:'cubic-bezier(.18,.7,.24,1)'});
      }
      announcement.textContent=priceDraft?priceDraft+' kroner på kassa.':'Kassa er tom.';
      return;
    }
    if(tbAction==='back'){back();return;}
    if(['free','trip','warehouse','resume'].includes(tbAction)){
      free=tbAction==='free'?{}:null;tripOpen=tbAction==='trip';warehouseOpen=tbAction==='warehouse';
      stopTalk();cancelDrag();render();screen.scrollTop=0;focusScene();
      if(tripOpen||warehouseOpen)mood('wave');
      return;
    }
    if(tbAction==='listen'){listen();return;}
    perform({type:tbAction,id:tbId,coin:tbCoin?Number(tbCoin):undefined,index:tbIndex!==undefined?Number(tbIndex):undefined},ev.detail===0);
  });
  function cancelDrag(){
    drag?.ghost?.remove();drag=null;
    screen.querySelector('.tb-over')?.classList.remove('tb-over');
  }
  function dropAt(ev,kind){
    return document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-tb-drop="'+kind+'"]');
  }
  screen.addEventListener('pointerdown',ev=>{
    const b=ev.target.closest(':is([data-tb-action="add"],[data-tb-action="coin"]):not([disabled])');
    if(!ev.isPrimary||ev.button!==0)return;
    suppressClickUntil=0;
    if(!b)return;
    const {tbAction:type,tbId:id,tbCoin}=b.dataset;
    drag={action:{type,id,coin:Number(tbCoin)},kind:type==='coin'?'cash':'basket',
      pointer:ev.pointerId,x:ev.clientX,y:ev.clientY};
  });
  window.addEventListener('pointermove',ev=>{
    if(!drag||drag.pointer!==ev.pointerId)return;
    if(!drag.ghost&&Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)>10){
      drag.ghost=document.createElement('div');drag.ghost.className='tb-ghost';
      drag.ghost.setAttribute('aria-hidden','true');
      drag.ghost.innerHTML=drag.kind==='cash'?coinFace(drag.action.coin):art(drag.action.id);
      screen.append(drag.ghost);
    }
    if(drag.ghost){
      drag.ghost.style.left=ev.clientX+'px';drag.ghost.style.top=ev.clientY+'px';
      screen.querySelector('[data-tb-drop="'+drag.kind+'"]')?.classList.toggle('tb-over',!!dropAt(ev,drag.kind));
    }
  });
  window.addEventListener('pointerup',ev=>{
    if(!drag||drag.pointer!==ev.pointerId)return;
    const {action,kind,ghost}=drag,drop=ghost&&dropAt(ev,kind);
    cancelDrag();
    if(ghost)suppressClickUntil=Date.now()+275;
    if(drop)perform(action,false);
  });
  window.addEventListener('pointercancel',cancelDrag);
  function back(){
    stopTalk();cancelDrag();
    window.openSubject?.('math');
    requestAnimationFrame(()=>document.querySelector('#tallvika-world [data-tv="shop"]')?.focus({preventScroll:true}));
  }
  new MutationObserver(()=>{if(!screen.classList.contains('active')){stopTalk();cancelDrag();}}).observe(screen,{attributes:true,attributeFilter:['class']});
  window.LARIA_TROLLBUTIKKEN=Object.freeze({get enabled(){return available();},open(){
    if(!available())return false;
    state=load();priceDraft='';free=null;trip=loadTrip();tripOpen=false;warehouse=loadWarehouse();warehouseOpen=false;
    window.showScreen('trollbutikken');render();screen.scrollTop=0;focusScene();
    mood('wave');
    return true;
  }});
})();
