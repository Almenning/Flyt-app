const CACHE='laria-prompt8-2026-10-06-v6';
const APP_CACHE_PREFIXES=['laer-litt-mer-','laria-'];

const SHELL=[
  // Core data
  './manifest.webmanifest',
  './icon.svg',
  './profile-avatars.js?v=20261006-assets1',
  './norwegian-content.js?v=20261006-assets1',
  // Labs
  './laria-foundation-v1.css?v=20261006-p8foundation1',
  './fraction-lab.css?v=20261006-assets1',
  './fraction-lab.js?v=20261006-assets1',
  './multiplication-lab.css?v=20261006-assets1',
  './multiplication-lab.js?v=20261006-assets1',
  // Journey / Bokskogen
  './bokskogen-world.css?v=20261006-assets1',
  './bokskogen-world.js?v=20261006-profileqa1',
  './journey-world-premium.css?v=20261006-p8foundation1',
  './journey-world-premium.js?v=20261006-p8foundation1ssets1',
  './world-atlas.css?v=20261006-assets1',
  // Home
  './home-premium.css?v=20261006-p8foundation1',
  './home-basecamp-v12.css?v=20261006-p8foundation1',
  './home-basecamp-v12.js?v=20261006-prompt7',
  // Free play
  './word-hunt.css?v=20261006-assets1',
  './word-hunt.js?v=20261006-assets1',
  // Shared UI + task scene
  './laria-unified-v13.css?v=20261006-assets1',
  './laria-unified-v13.js?v=20261006-assets1',
  './laria-task-scene-v15.css?v=20261006-p8foundation1',
  './laria-task-scene-v15.js?v=20261006-assets1',
  './laria-task-young-v18.css?v=20261006-assets1',
  // Kloden
  './globe-v24.css?v=20261006-p8foundation1',
  './globe-v24-art.js?v=20261006-assets1',
  './globe-v25-renderer.js?v=20261006-profileqa1',
  './basecamp-v11.webp?v=basecamp12d',
  './basecamp-v11-mobile.webp?v=basecamp12d',
  './bokskogen-atlas32.webp?v=atlas32',
  './lia-fox-explorer-home.webp',
  './lia-fox-explorer.webp?v=fox1',
  './globe-v20-approved.webp?v=2'
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
        .catch(()=>fetch('./index.html?offline=1',{cache:'no-store'}))
    );
    return;
  }

  const url=new URL(req.url);

  if(url.origin===self.location.origin){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>{
          if(res.ok){
            const copy=res.clone();
            caches.open(CACHE).then(cache=>cache.put(req,copy));
          }
          return res;
        })
        .catch(()=>caches.match(req))
    );
    return;
  }

  if(url.hostname==='raw.githubusercontent.com'||url.hostname==='api.worldbank.org'){
    event.respondWith(
      fetch(req)
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy));
          return res;
        })
        .catch(()=>caches.match(req))
    );
  }
});
