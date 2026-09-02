const CACHE='flyt-v12';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./manifest.webmanifest'])).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('./index.html')).then(r=>r||Response.error()));
    return;
  }
  const url=new URL(req.url);
  if(url.origin===self.location.origin&&(url.pathname.endsWith('.js')||url.pathname.endsWith('.html')||url.pathname.endsWith('.webmanifest'))){
    e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
    return;
  }
  e.respondWith(fetch(req).catch(()=>caches.match(req)));
});
