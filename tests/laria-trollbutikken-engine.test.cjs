'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../laer-litt-mer/trollbutikken-engine-v1.js');
const step=(s,type,data={})=>E.apply(s,{type,...data});
function fill(s){
 for(const [id,n] of Object.entries(E.customer(s).order))for(let i=0;i<n;i++)s=step(s,'add',{id});
 return s;
}
function register(s){
 s=step(s,'basket');assert.equal(s.phase,'register');
 for(const id of Object.keys(s.basket))s=step(s,'scan',{id});
 return step(s,'pay',{kroner:E.total(s.basket)/100});
}
function exactChange(s){
 for(let rem=E.changeDue(s),i=E.coins.length-1;rem&&i>=0;i--){
   const coin=E.coins[i];
   while(rem>=coin){s=step(s,'coin',{coin});rem-=coin;}
 }
 assert.equal(E.changeTotal(s),E.changeDue(s));
 return step(s,'settle');
}
test('investor demo totals precisely 3500 øre and accepts alternative exact change',()=>{
 const ready=register(fill(step(E.fresh(),'start')));
 assert.equal(E.total(ready.basket),3500);
 assert.equal(E.changeDue(ready),1500);
 assert.equal(E.money(3500),'35 kr');
 assert.equal(E.money(1250),'12,50 kr');
 for(const take of [[1000,500],[500,500,500],Array(15).fill(100)]){
   const ds=take.reduce((s,coin)=>step(s,'coin',{coin}),ready);
   const receipt=step(ds,'settle');
   assert.equal(receipt.phase,'receipt');
   assert.equal(receipt.served,1);
   assert.equal(receipt.inventory.apple,E.catalog.apple.stock-3);
   assert.equal(step(receipt,'settle'),receipt);
 }
});
test('the cashier must set the price independently and can correct mistakes without losing goods',()=>{
 let s=step(fill(step(E.fresh(),'start')),'basket');
 assert.match(step(s,'pay',{kroner:35}).feedback,/ikke telt/);
 for(const id of Object.keys(s.basket))s=step(s,'scan',{id});
 for(const kroner of [undefined,'35',Infinity,3.5,'-35',1000]){
   assert.match(step(s,'pay',{kroner}).feedback,/hele kroner/);
 }
 for(const [kroner,feedback] of [[34,/lav/],[36,/høy/]]){
   const wrong=step(s,'pay',{kroner});
   assert.equal(wrong.phase,'register');assert.match(wrong.feedback,feedback);
   assert.deepEqual(wrong.basket,s.basket);assert.deepEqual(wrong.scanned,s.scanned);
   assert.equal(wrong.served,0);assert.equal(E.normalize(wrong).phase,'register');
 }
 assert.match(E.hint(s,1),/Legg så sammen/);
 assert.doesNotMatch(E.hint(s,3),/35 kr/);
 assert.equal(step(s,'pay',{kroner:35}).phase,'change');
});
test('invalid quantity, stock, empty basket and invalid coin preserve play state',()=>{
 let s=step(E.fresh(),'start');assert.match(step(s,'basket').feedback,/tom/);
 assert.equal(step(s,'add',{id:'__proto__'}),s);
 assert.equal(step(s,'remove',{id:'apple'}),s);
 for(let i=0;i<E.catalog.apple.stock;i++)s=step(s,'add',{id:'apple'});
 assert.match(step(s,'add',{id:'apple'}).feedback,/ikke flere/);
 assert.equal(step(s,'basket').phase,'pick');
 assert.equal(step(s,'remove',{id:'apple'}).basket.apple,E.catalog.apple.stock-1);
 let cash=register(fill(step(E.fresh(),'start')));
 assert.equal(step(cash,'coin',{coin:1}),cash);
 assert.match(step(cash,'settle').feedback,/lite/);
 cash=step(cash,'coin',{coin:2000});assert.match(step(cash,'settle').feedback,/mye/);
 assert.equal(E.changeTotal(step(cash,'uncoin',{index:0})),0);
});
test('hints progress from compare to concrete strategy without modifying the basket',()=>{
 let s=step(E.fresh(),'start');
 s=step(s,'hint');assert.match(s.feedback,/handlelappen/);
 s=step(s,'hint');assert.match(s.feedback,/På lappen: 3/);
 s=step(s,'hint');assert.match(s.feedback,/Legg i 3/);assert.deepEqual(s.basket,{});
});
test('500 successive complete shop days never exhaust stock or produce unpayable change; round trips retain progress',()=>{
 let s=E.fresh();
 for(let d=0;d<500;d++){
   s=step(s,'start');
   for(let i=0;i<3;i++){
     s=register(fill(s));
     assert.equal(s.phase,'change');assert.ok(E.changeDue(s)>=0);
     let r=E.normalize(JSON.parse(JSON.stringify(s)));
     assert.equal(r.phase,'change');assert.deepEqual(r.basket,s.basket);
     s=exactChange(r);assert.equal(s.phase,'receipt');
     assert.equal(E.normalize(JSON.parse(JSON.stringify(s))).phase,'receipt');
     s=step(s,'next');
   }
   assert.equal(s.days,d+1);assert.equal(s.served,(d+1)*3);
 }
});
test('three active character identities never duplicate companion and customer role',()=>{
 for(const helper of ['storesoster','lillesoster','lillebror'])
   for(const c of E.customers)assert.notEqual(E.role(helper,c.who),helper);
});
test('old, malformed or incompatible local shop state is safely ignored',()=>{
 for(const raw of [null,{}, {schema:1}, {...E.fresh(), phase:'pay'}, {...E.fresh(),receipts:['fake']}])
   assert.deepEqual(E.normalize(raw),E.fresh());
});
test('free shop lets children compare prices and correct selections without consuming mission stock',()=>{
 const cash=E.fresh();
 let tray={};
 tray=E.freeBasket(tray,{type:'add',id:'apple'});
 tray=E.freeBasket(tray,{type:'add',id:'bread'});
 assert.equal(E.total(tray),1500);assert.deepEqual(cash.basket,{});
 tray=E.freeBasket(tray,{type:'remove',id:'apple'});
 assert.equal(E.total(tray),1000);
 assert.equal(E.freeBasket(tray,{type:'remove',id:'apple'}),tray);
});

const tripStep=(s,type,details={})=>E.applyTrip(s,{type,...details});
const fillTrip=(s,basket)=>Object.entries(basket).reduce((result,[id,n])=>{
 for(let i=0;i<n;i++)result=tripStep(result,'add',{id});
 return result;
},s);
test('first shopping trip distinguishes over-budget and incorrect shopping list and allows correction',()=>{
 let s=fillTrip(E.tripFresh(),{apple:2,bread:1,milk:1,honey:1});
 assert.match(tripStep(s,'trip-check').feedback,/mer enn du har/);
 assert.match(tripStep(tripStep(s,'hint'),'hint').feedback,/10 kr over/);
 s=tripStep(s,'remove',{id:'honey'});s=tripStep(s,'remove',{id:'milk'});
 assert.match(tripStep(s,'trip-check').feedback,/akkurat/);
 s=tripStep(s,'add',{id:'milk'});
 assert.equal(tripStep(s,'trip-check').phase,'pay');
 assert.equal(E.total(s.basket),2800);
});
test('shopping payment respects wallet stock, never creates budget, and distinguishes change from remaining budget',()=>{
 let s=tripStep(fillTrip(E.tripFresh(),{apple:2,bread:1,milk:1}),'trip-check');
 s=tripStep(s,'coin',{coin:2000});
 assert.equal(tripStep(s,'coin',{coin:2000}),s);
 s=tripStep(s,'coin',{coin:500});
 assert.match(tripStep(s,'trip-pay').feedback,/dekker ikke/);
 assert.equal(tripStep(s,'coin',{coin:1000}),s);
 assert.equal(tripStep(s,'trip-edit').phase,'pick');
 assert.deepEqual(tripStep(s,'trip-edit').paid,[]);
 s=E.normalizeTrip(JSON.parse(JSON.stringify(s)));assert.equal(E.paidTotal(s),2500);
 for(let i=0;i<5;i++)s=tripStep(s,'coin',{coin:100});
 assert.equal(tripStep(s,'coin',{coin:100}),s);
 assert.equal(E.paidTotal(s),3000);
 s=tripStep(s,'uncoin',{index:0});assert.equal(E.paidTotal(s),1000);
 s=tripStep(s,'coin',{coin:2000});
 s=tripStep(s,'trip-pay');assert.equal(s.completed,1);assert.equal(s.phase,'done');
 assert.equal(E.paidTotal(s)-E.total(s.basket),200);
 assert.equal(E.tripAt(s).budget-E.total(s.basket),200);
 assert.equal(tripStep(s,'trip-pay'),s);
 assert.equal(tripStep(s,'trip-next').index,1);
 assert.equal(E.normalizeTrip(s).completed,1);
 assert.deepEqual(E.normalizeTrip({...s,paid:[2000,2000]}),E.tripFresh());
});
test('all allowed open-budget baskets are accepted, with no preferred goods or coin selection',()=>{
 const items=Object.values(E.catalog);
 for(let index=1;index<E.trips.length;index++){
  const t=E.trips[index];let valid=0,invalid=0;const samples=[];
  function walk(ix,basket,remaining){
   if(ix===items.length){
    const kinds=Object.values(basket).length,quantity=Object.values(basket).reduce((x,y)=>x+y,0);
    const expected=kinds>=t.minKinds&&quantity>=t.minCount;
    assert.equal(!E.tripCheck(t,basket),expected);
    if(expected){valid++;if(samples.length<40)samples.push(basket);}
    else invalid++;
    return;
   }
   const p=items[ix];for(let n=0;n<=Math.min(p.stock,Math.floor(remaining/p.price));n++)
     walk(ix+1,n?{...basket,[p.id]:n}:basket,remaining-n*p.price);
  }
  walk(0,{},t.budget);assert.ok(valid>80&&invalid>0);
  for(const basket of samples){
   let s=tripStep({...E.tripFresh(),index,basket},'trip-check');
   assert.equal(s.phase,'pay');
   for(const [coin,n] of Object.entries(t.wallet))for(let i=0;i<n;i++)s=tripStep(s,'coin',{coin:Number(coin)});
   assert.equal(E.paidTotal(s),t.budget);
   assert.equal(tripStep(s,'trip-pay').phase,'done');
  }
 }
});

const stockStep=(s,type,index)=>E.applyWarehouse(s,{type,index});
test('warehouse groups the exact delivery, allows uneven baskets and correction, and checks each group',()=>{
 let s=E.warehouseFresh();
 for(const [index,n] of [5,3,4].entries())for(let i=0;i<n;i++)s=stockStep(s,'stock-add',index);
 assert.equal(E.warehouseRemaining(s),0);assert.equal(stockStep(s,'stock-check').phase,'stock');
 assert.match(stockStep(s,'stock-add',1).feedback,/tom/);
 s=stockStep(s,'stock-remove',0);s=stockStep(s,'stock-add',1);
 assert.deepEqual(s.added,[4,4,4]);
 s=stockStep(s,'stock-check');assert.equal(s.phase,'done');assert.equal(s.completed,1);
 assert.equal(stockStep(s,'stock-check'),s);
});
test('restock shelf preserves six starting loaves and leaves four excess in the crate',()=>{
 let s=E.warehouseFresh(1);
 assert.equal(stockStep(s,'stock-remove',0),s);
 for(let i=0;i<4;i++)s=stockStep(s,'stock-add',0);
 assert.equal(E.warehouseRemaining(s),4);
 assert.deepEqual(E.normalizeWarehouse(JSON.parse(JSON.stringify(s))).added,[4]);
 assert.equal(stockStep(s,'stock-check').phase,'done');
 assert.deepEqual(E.normalizeWarehouse({...s,added:[9]}),E.warehouseFresh());
});
