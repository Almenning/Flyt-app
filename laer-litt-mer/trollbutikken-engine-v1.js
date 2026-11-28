/* Trollbutikken: deterministic, serializable game rules. All amounts are øre. */
(function(root,factory){
  const engine=factory();
  if(typeof module==='object'&&module.exports)module.exports=engine;
  else root.LARIA_TROLLBUTIKKEN_ENGINE=engine;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const catalog=Object.freeze(Object.fromEntries([
    ['apple','Eple','epler',500,12],['bread','Brød','brød',1000,8],
    ['berry','Jordbær','jordbær',300,14],['honey','Honning','glass honning',1200,5],
    ['carrot','Gulrot','gulrøtter',200,12],['milk','Melk','flasker melk',800,8]
  ].map(([id,label,plural,price,stock])=>[id,Object.freeze({id,label,plural,price,stock})])));
  const customers=[
    {id:'niste',who:'lillebror',title:'Niste til turen',order:{apple:3,bread:2},tender:5000,hello:'Kan du pakke niste til fjellturen min?'},
    {id:'kveldsmat',who:'lillesoster',title:'Kveldsmat ved fjorden',order:{milk:1,carrot:2,berry:2},tender:2000,hello:'Vi skal spise ute ved vannet. Kan du finne disse varene?'},
    {id:'hytta',who:'storesoster',title:'Besøk på hytta',order:{honey:1,bread:2,apple:1},tender:5000,hello:'Jeg skal besøke noen på hytta. Kan du hjelpe meg med det som står på lappen?'},
    {id:'enga',who:'lillesoster',title:'Piknik på enga',order:{apple:2,berry:2,bread:1},tender:5000,hello:'Jeg tar med et teppe på enga. Vil du pakke det vi skal spise?'},
    {id:'bakst',who:'storesoster',title:'Fersk bakst',order:{milk:2,honey:1},tender:5000,hello:'Brødet står i ovnen. Nå mangler vi litt melk og honning.'},
    {id:'aften',who:'lillebror',title:'Middag ute',order:{carrot:3,bread:1,apple:1},tender:5000,hello:'Jeg lovte å ta med noe til maten. Her er lappen min!'}
  ].map(c=>Object.freeze({...c,order:Object.freeze(c.order)}));
  const coins=Object.freeze([100,500,1000,2000]);
  const stock=()=>Object.fromEntries(Object.values(catalog).map(p=>[p.id,p.stock]));
  const total=basket=>Object.values(catalog).reduce((sum,p)=>sum+(basket[p.id]||0)*p.price,0);
  const money=amount=>Number.isSafeInteger(amount)&&amount>=0?
    (amount%100===0?String(amount/100):Math.floor(amount/100)+','+String(amount%100).padStart(2,'0'))+' kr':'–';
  const orderMatches=(order,basket)=>Object.keys(catalog).every(id=>(order[id]||0)===(basket[id]||0));
  const role=(choice,key)=>key===choice?(choice==='lillebror'?'lillesoster':'lillebror'):key;
  const within=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  const fresh=()=>({schema:1,phase:'welcome',day:0,index:0,inventory:stock(),basket:{},scanned:[],change:[],receipts:[],days:0,served:0,hints:0,feedback:''});
  const customersPerDay=3;
  const customerAt=(day,index)=>customers[(day*customersPerDay+index)%customers.length];
  const customer=s=>customerAt(s.day,s.index);
  const changeDue=s=>customer(s).tender-total(s.basket);
  const changeTotal=s=>s.change.reduce((a,b)=>a+b,0);
  const phases=['welcome','pick','register','change','receipt','closing'];
  const normalize=raw=>{
    if(!raw||raw.schema!==1||!phases.includes(raw.phase)||
      !within(raw.day,0,1000000)||!within(raw.index,0,2)||
      !within(raw.days,0,1000000)||!within(raw.served,0,3000000))return fresh();
    const s={...fresh(),phase:raw.phase,day:raw.day,index:raw.index,days:raw.days,served:raw.served};
    if(!raw.inventory||!raw.basket)return fresh();
    for(const p of Object.values(catalog)){
      if(!within(raw.inventory[p.id],0,p.stock)||!within(raw.basket[p.id]??0,0,p.stock))return fresh();
      if((raw.basket[p.id]||0)>raw.inventory[p.id]&&s.phase!=='receipt'&&s.phase!=='closing')return fresh();
      s.inventory[p.id]=raw.inventory[p.id];if(raw.basket[p.id])s.basket[p.id]=raw.basket[p.id];
    }
    if(!Array.isArray(raw.receipts)||raw.receipts.length>3||
      !raw.receipts.every((id,i)=>id===customerAt(s.day,i).id))return fresh();
    s.receipts=[...raw.receipts];
    const required=['receipt','closing'].includes(s.phase)?s.index+1:s.index;
    if(s.receipts.length!==required)return fresh();
    if(['register','change','receipt','closing'].includes(s.phase)&&!orderMatches(customer(s).order,s.basket))return fresh();
    s.scanned=Array.isArray(raw.scanned)?[...new Set(raw.scanned)].filter(id=>Object.hasOwn(s.basket,id)):[];
    s.change=Array.isArray(raw.change)?raw.change.slice(0,20).filter(n=>coins.includes(n)):[];
    if(['change','receipt','closing'].includes(s.phase)&&s.scanned.length!==Object.keys(s.basket).length)return fresh();
    if(['receipt','closing'].includes(s.phase)&&changeTotal(s)!==changeDue(s))return fresh();
    s.hints=within(raw.hints,0,5)?raw.hints:0;
    return s;
  };
  const miss=s=>Object.keys(catalog).find(id=>(s.basket[id]||0)!==(customer(s).order[id]||0));
  function hint(s,step=s.hints){
    if(s.phase==='pick'){
      const bad=miss(s);
      if(!bad)return 'Kurven stemmer med handlelappen. Prøv å gå til kassen!';
      const p=catalog[bad],want=customer(s).order[bad]||0,have=s.basket[bad]||0;
      if(step<2)return 'Se på '+p.plural+' på handlelappen. Hva ligger i kurven?';
      if(step===2)return 'På lappen: '+want+'. I kurven: '+have+'. Sammenlign tallene.';
      return have<want?'Legg i '+(want-have)+' til.':'Ta ut '+(have-want)+' fra kurven.';
    }
    if(s.phase==='register'){
      const lines=Object.entries(s.basket).map(([id,n])=>({n,price:catalog[id].price}));
      if(s.scanned.length!==lines.length)return 'Sjekk hvor mange du har av hver vare, og hva én koster. Trykk på linja når du har sett på den.';
      if(step<2)return 'Finn prisen for én type vare om gangen. Legg så sammen det du fant.';
      if(step===2)return 'Regn '+lines.map(({n,price})=>Array(n).fill(price/100).join(' + ')).map(sum=>'('+sum+')').join(' + ')+'.';
      return 'Varegruppene koster '+lines.map(({n,price})=>money(n*price)).join(' + ')+'. Hva blir det til sammen?';
    }
    if(s.phase==='change'){
      const due=changeDue(s),have=changeTotal(s);
      if(step<2)return 'Tenk fra prisen opp til det kunden betalte. Hvor mye mangler?';
      if(step===2)return money(total(s.basket))+' + vekslepenger = '+money(customer(s).tender)+'.';
      return have<due?'Det mangler '+money(due-have)+'. Prøv én eller flere mynter.':
        have>due?'Det er '+money(have-due)+' for mye. Ta bort en mynt og prøv igjen.':'Det stemmer. Nå kan du gi vekslepengene.';
    }
    return '';
  }
  function freeBasket(basket,action){
    if(!action||!Object.hasOwn(catalog,action.id)||!['add','remove'].includes(action.type))return basket;
    const p=catalog[action.id],next=(basket[p.id]||0)+(action.type==='add'?1:-1);
    if(!within(next,0,p.stock))return basket;
    const updated={...basket};
    if(next)updated[p.id]=next;else delete updated[p.id];
    return updated;
  }
  function apply(s,action){
    if(!action||typeof action.type!=='string')return s;
    const p=Object.hasOwn(catalog,action.id)?catalog[action.id]:null;
    const reply=feedback=>({...s,feedback});
    if(action.type==='start'&&(s.phase==='welcome'||s.phase==='closing')){
      if(s.phase==='closing'&&s.day===1000000)return s;
      return {...fresh(),phase:'pick',day:s.phase==='closing'?s.day+1:s.day,days:s.days,served:s.served};
    }
    if(action.type==='hint'&&['pick','register','change'].includes(s.phase)){
      const hints=Math.min(s.hints+1,5);return {...s,hints,feedback:hint(s,hints)};
    }
    if(s.phase==='pick'){
      if(p&&['add','remove'].includes(action.type)){
        const old=s.basket[p.id]||0,next=old+(action.type==='add'?1:-1);
        if(next<0)return s;
        if(next>s.inventory[p.id])return reply('Det er ikke flere '+p.plural+' på hyllen.');
        const basket={...s.basket};if(next)basket[p.id]=next;else delete basket[p.id];
        return {...s,basket,feedback:''};
      }
      if(action.type==='basket'){
        if(!orderMatches(customer(s).order,s.basket))
          return reply(Object.keys(s.basket).length?'Se over handlelappen en gang til. Du kan legge tilbake varer.':'Kurven er tom. Finn en vare på handlelappen og legg den i.');
        return {...s,phase:'register',feedback:'Handlelappen stemmer!',hints:0};
      }
    }
    if(s.phase==='register'){
      if(action.type==='scan'&&p&&s.basket[p.id]&&!s.scanned.includes(p.id))return {...s,scanned:[...s.scanned,p.id],feedback:''};
      if(action.type==='pay'){
        if(s.scanned.length!==Object.keys(s.basket).length)return reply('Noen varer er ikke telt i kassen ennå.');
        if(!within(action.kroner,0,999))return reply('Skriv hvor mange hele kroner kunden skal betale.');
        const entered=action.kroner*100,wanted=total(s.basket);
        if(entered!==wanted)return reply(entered<wanted?'Summen ble litt for lav. Har du tatt med alle varene?':'Summen ble litt for høy. Har du telt en vare mer enn én gang?');
        return {...s,phase:'change',hints:0,feedback:''};
      }
    }
    if(s.phase==='change'){
      if(action.type==='coin'&&coins.includes(action.coin)&&s.change.length<20)return {...s,change:[...s.change,action.coin],feedback:''};
      if(action.type==='uncoin'&&within(action.index,0,s.change.length-1))return {...s,change:s.change.filter((_,i)=>i!==action.index),feedback:''};
      if(action.type==='settle'){
        const diff=changeTotal(s)-changeDue(s);
        if(diff)return reply(diff>0?'Det ble litt for mye veksel. Du kan ta tilbake en mynt.':'Det er litt for lite veksel. Prøv å legge til en mynt.');
        const inventory={...s.inventory};
        for(const [id,n] of Object.entries(s.basket))inventory[id]-=n;
        return {...s,phase:'receipt',inventory,receipts:[...s.receipts,customer(s).id],served:Math.min(s.served+1,3000000),feedback:'Takk for handelen!',hints:0};
      }
    }
    if(s.phase==='receipt'&&action.type==='next'){
      if(s.index===customersPerDay-1)return {...s,phase:'closing',days:Math.min(s.days+1,1000000),feedback:''};
      return {...s,phase:'pick',index:s.index+1,basket:{},scanned:[],change:[],hints:0,feedback:''};
    }
    return s;
  }
  // Customer mode has its own save slot and authored choices. Count and money
  // checks work for any legal basket, never for a preferred answer pattern.
  const trips=Object.freeze([
    {id:'matpakken',title:'Matpakke ved brygga',scene:'Vi tar med niste til brygga. Du får velge mynter selv når vi kommer til kassa.',budget:3000,
     exact:{apple:2,bread:1,milk:1},wallet:{2000:1,500:1,100:5},seller:'lillesoster'},
    {id:'besok',title:'Besøk på fjellhytta',scene:'Velg minst tre forskjellige varer til dem på hytta. Du bestemmer hvilke.',budget:4000,
     minKinds:3,minCount:3,wallet:{2000:1,1000:1,500:1,100:5},seller:'storesoster'},
    {id:'kveldsmat',title:'Kveldsmat til to',scene:'Finn minst tre varer i alt, fra minst to ulike slag. Velg det du har lyst til.',budget:2500,
     minKinds:2,minCount:3,wallet:{1000:1,500:2,100:5},seller:'lillebror'}
  ].map(t=>Object.freeze({...t,wallet:Object.freeze(t.wallet),...(t.exact?{exact:Object.freeze(t.exact)}:{})})));
  const tripFresh=()=>({schema:1,phase:'pick',index:0,completed:0,basket:{},paid:[],feedback:'',hints:0});
  const tripAt=s=>trips[s.index];
  const paidTotal=s=>s.paid.reduce((sum,n)=>sum+n,0);
  const paidCount=(s,n)=>s.paid.filter(coin=>coin===n).length;
  const uniqueCount=basket=>Object.keys(catalog).filter(id=>basket[id]>0).length;
  const units=basket=>Object.keys(catalog).reduce((sum,id)=>sum+(basket[id]||0),0);
  function tripCheck(t,basket){
    if(!units(basket))return 'Kurven er tom. Legg i det du vil kjøpe.';
    if(total(basket)>t.budget)return 'Det koster mer enn du har. Ta ut noe, eller bytt til en rimeligere vare.';
    if(t.exact&&!orderMatches(t.exact,basket))return 'Se på handlelappen igjen. I denne turen skal det ligge akkurat det som står der.';
    if(t.minKinds&&uniqueCount(basket)<t.minKinds)return 'Du trenger flere forskjellige slags varer.';
    if(t.minCount&&units(basket)<t.minCount)return 'Du trenger flere varer i alt.';
    return '';
  }
  function normalizeTrip(raw){
    if(!raw||raw.schema!==1||!['pick','pay','done'].includes(raw.phase)||
      !within(raw.index,0,trips.length-1)||!within(raw.completed,0,1e6)||
      !raw.basket||!Array.isArray(raw.paid))return tripFresh();
    const s={...tripFresh(),phase:raw.phase,index:raw.index,completed:raw.completed};
    const trip=tripAt(s);
    for(const p of Object.values(catalog)){
      const n=raw.basket[p.id]??0;
      if(!within(n,0,p.stock))return tripFresh();
      if(n)s.basket[p.id]=n;
    }
    for(const coin of raw.paid){
      if(!Object.hasOwn(trip.wallet,coin)||!within(coin,100,2000)||paidCount(s,coin)>=trip.wallet[coin])return tripFresh();
      s.paid.push(coin);
    }
    if(s.phase==='pick'&&s.paid.length)return tripFresh();
    if(s.phase!=='pick'&&tripCheck(trip,s.basket))return tripFresh();
    if(s.phase==='done'&&(s.completed<1||paidTotal(s)<total(s.basket)))return tripFresh();
    s.hints=within(raw.hints,0,3)?raw.hints:0;
    return s;
  }
  function tripHint(s,step){
    const trip=tripAt(s),price=total(s.basket),given=paidTotal(s);
    if(s.phase==='pay'){
      if(given>=price)return 'Beløpet dekker varene. Du kan betale nå. Du får tilbake det som eventuelt blir til overs.';
      if(step<2)return 'Sammenlign kjøpesummen med myntene du har lagt fram.';
      return 'Det mangler '+money(price-given)+'. Se hvilke mynter du har igjen.';
    }
    if(price>trip.budget){
      if(step<2)return 'Se på beløpet i kurven og hvor mye du har med. Hvilket er størst?';
      return 'Kurven er '+money(price-trip.budget)+' over budsjettet. Finn en vare du kan ta ut eller bytte.';
    }
    if(trip.exact){
      const id=Object.keys(catalog).find(key=>(trip.exact[key]||0)!==(s.basket[key]||0));
      if(!id)return 'Handlelappen og kurven stemmer. Nå kan vi gå til kassa.';
      const need=trip.exact[id]||0,have=s.basket[id]||0;
      if(step<2)return 'Se på '+catalog[id].plural+'. Sjekk antallet i kurven mot handlelappen.';
      return 'På lappen: '+need+'. I kurven: '+have+'. '+(need>have?'Legg i ':'Ta ut ')+Math.abs(need-have)+' til.';
    }
    if(uniqueCount(s.basket)<trip.minKinds)return 'Velg '+(trip.minKinds-uniqueCount(s.basket))+' vareslag til. En vare du allerede har valgt, teller ikke som ny.';
    if(units(s.basket)<trip.minCount)return 'Vi trenger '+(trip.minCount-units(s.basket))+' vare til. Sjekk hvor mye penger som er igjen.';
    return 'Du har nok forskjellige varer, og beløpet er innenfor. Du kan gå til kassa.';
  }
  function applyTrip(s,action){
    if(!action||typeof action.type!=='string')return s;
    const trip=tripAt(s),reply=feedback=>({...s,feedback});
    if(action.type==='hint'&&s.phase!=='done'){
      const hints=Math.min(s.hints+1,3);
      return {...s,hints,feedback:tripHint(s,hints)};
    }
    if(s.phase==='pick'){
      if(['add','remove'].includes(action.type)){
        const basket=freeBasket(s.basket,action);
        return basket===s.basket?s:{...s,basket,feedback:''};
      }
      if(action.type==='trip-check'){
        const failure=tripCheck(trip,s.basket);
        return failure?reply(failure):{...s,phase:'pay',hints:0,feedback:'Kurven er innenfor budsjettet. Nå kan vi betale.'};
      }
    }
    if(s.phase==='pay'){
      if(action.type==='trip-edit')return {...s,phase:'pick',paid:[],hints:0,feedback:''};
      if(action.type==='coin'&&coins.includes(action.coin)&&Object.hasOwn(trip.wallet,action.coin)&&paidCount(s,action.coin)<trip.wallet[action.coin])
        return {...s,paid:[...s.paid,action.coin],feedback:''};
      if(action.type==='uncoin'&&within(action.index,0,s.paid.length-1))
        return {...s,paid:s.paid.filter((_,i)=>i!==action.index),feedback:''};
      if(action.type==='trip-pay'){
        if(paidTotal(s)<total(s.basket))return reply('Beløpet dekker ikke varene ennå. Prøv å legge fram flere mynter.');
        return {...s,phase:'done',completed:Math.min(s.completed+1,1e6),hints:0,feedback:'Du kjøpte det du trengte og holdt budsjettet!'};
      }
    }
    if(s.phase==='done'&&action.type==='trip-next')return {...tripFresh(),index:(s.index+1)%trips.length,completed:s.completed};
    return s;
  }
  const deliveries=Object.freeze([
    {id:'apples',title:'Eplene kom med båten',scene:'Fordel leveransen. Legg fire epler i hver av de tre kurvene.',
      item:'apple',supplier:'lillebror',source:'Leveransen',delivery:12,goal:4,initial:[0,0,0]},
    {id:'bread',title:'Fyll kveldshylla',scene:'Det ligger seks brød på hylla. Bruk leveransen til å fylle opp til ti.',
      item:'bread',supplier:'lillesoster',source:'Brødkassa',delivery:8,goal:10,initial:[6]}
  ].map(d=>Object.freeze({...d,initial:Object.freeze(d.initial)})));
  const warehouseFresh=(index=0)=>({schema:1,index,phase:'stock',completed:0,added:deliveries[index].initial.map(()=>0),hints:0,feedback:''});
  const deliveryAt=s=>deliveries[s.index];
  const warehouseRemaining=s=>deliveryAt(s).delivery-s.added.reduce((sum,n)=>sum+n,0);
  const warehouseAtGoal=s=>s.added.every((n,i)=>n+deliveryAt(s).initial[i]===deliveryAt(s).goal);
  function normalizeWarehouse(raw){
    if(!raw||raw.schema!==1||!within(raw.index,0,deliveries.length-1)||!within(raw.completed,0,1e6)||
       !['stock','done'].includes(raw.phase)||!Array.isArray(raw.added))return warehouseFresh();
    const s={...warehouseFresh(raw.index),phase:raw.phase,completed:raw.completed},m=deliveryAt(s);
    if(raw.added.length!==m.initial.length||!raw.added.every(n=>within(n,0,m.delivery)))return warehouseFresh();
    s.added=[...raw.added];
    if(warehouseRemaining(s)<0||(s.phase==='done'&&(!warehouseAtGoal(s)||!s.completed)))return warehouseFresh();
    s.hints=within(raw.hints,0,3)?raw.hints:0;
    return s;
  }
  function warehouseHint(s,step){
    const m=deliveryAt(s),i=s.added.findIndex((n,i)=>n+m.initial[i]!==m.goal);
    if(i<0)return 'Alt er på plass. Nå kan du sjekke leveransen.';
    const n=s.added[i]+m.initial[i],target=m.initial.length>1?'kurv '+(i+1):'hylla';
    if(step<2)return 'Se på '+target+'. Sammenlign antallet med det som skal være der.';
    return 'Det er '+n+' på '+target+'. Målet er '+m.goal+'. '+(n<m.goal?'Legg til ':'Ta tilbake ')+Math.abs(n-m.goal)+'.';
  }
  function applyWarehouse(s,action){
    if(!action||typeof action.type!=='string')return s;
    const m=deliveryAt(s),reply=feedback=>({...s,feedback});
    if(s.phase==='stock'){
      if(['stock-add','stock-remove'].includes(action.type)&&within(action.index,0,s.added.length-1)){
        const copy=[...s.added],i=action.index;
        if(action.type==='stock-add'&&warehouseRemaining(s)===0)
          return reply('Kassa er tom. Du kan flytte en vare tilbake og prøve på nytt.');
        if(action.type==='stock-remove'&&!copy[i])return s;
        copy[i]+=action.type==='stock-add'?1:-1;
        return {...s,added:copy,feedback:''};
      }
      if(action.type==='hint'){
        const hints=Math.min(s.hints+1,3);return {...s,hints,feedback:warehouseHint(s,hints)};
      }
      if(action.type==='stock-check')
        return warehouseAtGoal(s)?{...s,phase:'done',completed:Math.min(s.completed+1,1e6),feedback:''}:
          reply('Tell én plass om gangen. Det gjør ikke noe om du flytter noen varer tilbake.');
    }
    if(s.phase==='done'&&action.type==='stock-next')
      return {...warehouseFresh((s.index+1)%deliveries.length),completed:s.completed};
    return s;
  }
  return Object.freeze({catalog,customers:Object.freeze(customers),coins,total,money,stock,fresh,normalize,customer,changeDue,changeTotal,
    orderMatches,role,hint,freeBasket,apply,trips,tripFresh,tripAt,normalizeTrip,applyTrip,tripCheck,paidCount,paidTotal,uniqueCount,units,deliveries,warehouseFresh,deliveryAt,
    normalizeWarehouse,applyWarehouse,warehouseRemaining,warehouseAtGoal});
});
