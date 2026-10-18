'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'..','laer-litt-mer','sw.js'),'utf8');
const current=code.match(/const CACHE='([^']+)'/)[1];
const bankUrl='https://example.test/laer-litt-mer/country-discoveries-v1.js?v=20261015-discoveries1';
function fixture(){
 const events={},stores=new Map(),calls=[];let claimed=0,offline=false,status=200;
 const key=req=>typeof req==='string'?req:req.url;
 const caches={
   keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),
   match:async req=>{for(const store of stores.values()){if(store.has(key(req)))return store.get(key(req)).clone();}},
   open:async name=>{
     if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
     return {put:async(req,res)=>store.set(key(req),res),addAll:async()=>{}};
   }
 };
 const self={location:{origin:'https://example.test'},clients:{claim:async()=>{claimed++;}},skipWaiting:async()=>{},addEventListener:(name,fn)=>{events[name]=fn;}};
 const fetch=async(req,options)=>{calls.push({url:key(req),cache:options?.cache});if(offline)throw Error('offline');return new Response('fresh-country-bank',{status});};
 vm.runInNewContext(code,{self,caches,fetch,URL});
 return {calls,stores,claimed:()=>claimed,
   offline:()=>{offline=true;},status:value=>{status=value;},
   seed(name,url,text){if(!stores.has(name))stores.set(name,new Map());stores.get(name).set(url,new Response(text));},
   async activate(){let work;events.activate({waitUntil:p=>{work=p;}});await work;},
   request(url=bankUrl,method='GET'){let response;events.fetch({request:{url,method,mode:'cors'},respondWith:p=>{response=p;}});return response;}
 };
}
test('New release removes old app cache without touching unrelated caches',async()=>{
 assert(current.endsWith('-discoveries1-europe2'));
 const f=fixture();f.seed('laria-old',bankUrl,'old');f.seed('another-app',bankUrl,'unrelated');
 await f.activate();assert(!f.stores.has('laria-old'));assert(f.stores.has('another-app'));assert.equal(f.claimed(),1);
});
test('First editorial request after activation revalidates HTTP cache and stores the response',async()=>{
 const f=fixture();f.seed('laria-previous',bankUrl,'24-country-version');await f.activate();
 assert.equal(await (await f.request()).text(),'fresh-country-bank');
 assert.deepEqual(f.calls,[{url:bankUrl,cache:'no-cache'}]);assert(f.stores.get(current).has(bankUrl));
});
test('A cached editorial bank still works offline without another network request',async()=>{
 const f=fixture();await f.request();f.offline();
 assert.equal(await (await f.request()).text(),'fresh-country-bank');assert.equal(f.calls.length,1);
});
test('Unrelated assets keep the original fetch policy and writes are not intercepted',async()=>{
 const f=fixture();const art='https://example.test/laer-litt-mer/fox.webp';
 await f.request(art);assert.equal(f.calls[0].cache,undefined);
 assert.equal(f.request(bankUrl,'POST'),undefined);assert.equal(f.calls.length,1);
});
test('Failed editorial responses never poison the cache',async()=>{
 const f=fixture();f.status(503);const response=await f.request();assert.equal(response.status,503);assert(!f.stores.has(current));
 f.offline();await assert.rejects(f.request(),/offline/);assert(!f.stores.has(current));
});
