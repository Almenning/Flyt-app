const CACHE='flyt-v5';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./manifest.webmanifest'])).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match('./index.html')).then(r=>r||Response.error()));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});