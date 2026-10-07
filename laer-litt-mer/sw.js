const CACHE='laria-runtime-2026-10-07-perf1';
const APP_CACHE_PREFIXES=['laer-litt-mer-','laria-'];

// Keep install light. Runtime requests populate the cache as the child actually uses the app.
const SHELL=[
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(k=>k!==CACHE&&APP_CACHE_PREFIXES.some(p=>k.startsWith(p)))
          .map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .catch(()=>caches.match(req))
        .catch(()=>fetch('./index.html?offline=1',{cache:'no-store'}))
    );
    return;
  }

  const url=new URL(req.url);

  if(url.origin===self.location.origin){
    event.respondWith(
      caches.match(req).then(cached=>{
        const refresh=fetch(req)
          .then(res=>{
            if(res.ok){
              const copy=res.clone();
              event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)));
            }
            return res;
          })
          .catch(()=>cached);
        return cached||refresh;
      })
    );
    return;
  }

  if(url.hostname==='raw.githubusercontent.com'||url.hostname==='api.worldbank.org'){
    event.respondWith(
      caches.match(req).then(cached=>{
        const refresh=fetch(req)
          .then(res=>{
            if(res.ok){
              const copy=res.clone();
              event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)));
            }
            return res;
          })
          .catch(()=>cached);
        return cached||refresh;
      })
    );
  }
});
