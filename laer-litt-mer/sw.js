const CACHE='laria-stable-2026-10-09-globe36-pigment3-plukk-closeup7c-atlas-story2-globe-v37-subject-home-v14-math-tap2-decimal1';
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
        if(cached)return cached;
        return fetch(req).then(async res=>{
          if(res.ok){
            const cache=await caches.open(CACHE);
            await cache.put(req,res.clone());
          }
          return res;
        });
      })
    );
    return;
  }

  if(url.hostname==='raw.githubusercontent.com'||url.hostname==='api.worldbank.org'){
    event.respondWith(
      fetch(req)
        .then(async res=>{
          if(res.ok){
            const cache=await caches.open(CACHE);
            await cache.put(req,res.clone());
          }
          return res;
        })
        .catch(()=>caches.match(req))
    );
  }
});
