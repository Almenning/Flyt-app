const CACHE='laer-litt-mer-v7-young-game-2026-10-03';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./fraction-lab.css?v=20261003-mobile2','./fraction-lab.js?v=20261003-mobile2','./multiplication-lab.css','./multiplication-lab.js','./norwegian-content.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{
      const copy=res.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));return res;})));
    return;
  }
  if(url.hostname==='raw.githubusercontent.com'||url.hostname==='api.worldbank.org'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));return res;}).catch(()=>caches.match(req)));
  }
});