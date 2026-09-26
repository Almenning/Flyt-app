const CACHE='flyt-v84';
const NETWORK_TIMEOUT_MS=5000;
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./index.html','./manifest.webmanifest','./vendor/supabase-2.116.0.js','./sync-merge.js','./sync.js'])).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET')return;
  const network=()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('NETWORK_TIMEOUT')),NETWORK_TIMEOUT_MS);fetch(req,{cache:'no-store'}).then(response=>{clearTimeout(timer);resolve(response)},error=>{clearTimeout(timer);reject(error)})});
  if(req.mode==='navigate'){
    e.respondWith(network().then(response=>{if(response?.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',response.clone()));return response}).catch(()=>caches.match('./index.html')).then(response=>response||Response.error()));
    return;
  }
  if(url.origin===self.location.origin&&(url.pathname.endsWith('.js')||url.pathname.endsWith('.html')||url.pathname.endsWith('.webmanifest'))){
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(cached=>cached||network().then(response=>{if(response?.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone()));return response})).catch(()=>caches.match(req,{ignoreSearch:true})).then(response=>response||Response.error()));
    return;
  }
  e.respondWith(fetch(req).catch(()=>caches.match(req)));
});
