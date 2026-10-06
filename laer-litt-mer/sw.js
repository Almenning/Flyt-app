const CACHE='laria-stable-2026-10-06-v3';
const APP_CACHE_PREFIXES=['laer-litt-mer-','laria-'];

const SHELL=[
  './manifest.webmanifest',
  './icon.svg',
  './profile-avatars.js?v=profile1',
  './norwegian-content.js',
  './fraction-lab.css?v=20261003-mobile2',
  './fraction-lab.js?v=20261003-mobile2',
  './multiplication-lab.css?v=20261003-table1',
  './multiplication-lab.js?v=20261003-table1',
  './bokskogen-world.css?v=atlas35',
  './bokskogen-world.js?v=atlas35',
  './journey-world-premium.css?v=map38',
  './journey-world-premium.js?v=atlas35',
  './world-atlas.css?v=fox-journey-1',
  './home-premium.css?v=young8',
  './home-basecamp-v12.css?v=basecamp12e',
  './home-basecamp-v12.js?v=basecamp12e',
  './word-hunt.css?v=wordhunt2',
  './word-hunt.js?v=wordhunt2',
  './laria-unified-v13.css?v=unified13',
  './laria-unified-v13.js?v=unified13',
  './laria-task-scene-v15.css?v=taskscene17',
  './laria-task-scene-v15.js?v=taskscene18',
  './laria-task-young-v18.css?v=young18',
  './globe-v24.css?v=globe28',
  './globe-v24-art.js?v=globe28',
  './globe-v25-renderer.js?v=globe28',
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
