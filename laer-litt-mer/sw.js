const CACHE='laria-globe-v14-2026-10-05';
const APP_CACHE_PREFIXES=['laer-litt-mer-','laria-'];
const SHELL=['./manifest.webmanifest','./icon.svg','./word-hunt.css?v=wordhunt2','./word-hunt.js?v=wordhunt2','./home-basecamp-v12.css?v=basecamp12','./home-basecamp-v12.js?v=basecamp12','./laria-unified-v13.css?v=unified13','./laria-unified-v13.js?v=unified13','./globe-premium-v14.css?v=globe14','./globe-premium-v14.js?v=globe14','./basecamp-v11.webp','./basecamp-v11-mobile.webp','./lia-fox-explorer.webp?v=fox1','./fraction-lab.css?v=20261003-mobile2','./fraction-lab.js?v=20261003-mobile2','./multiplication-lab.css?v=20261003-table1','./multiplication-lab.js?v=20261003-table1','./norwegian-content.js','./bokskogen-world.css?v=20261004-modular15','./bokskogen-world.js?v=20261004-world6','./journey-world-premium.css?v=20261004-travel4','./journey-world-premium.js?v=20261004-travel5','./matte-verden.png?v=20261004-world1','./engelsk-verden.png?v=20261004-world1','./geografi-verden.png?v=20261004-world1'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...SHELL,'./lia-fox-explorer-home.webp'])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&APP_CACHE_PREFIXES.some(p=>k.startsWith(p))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>fetch('./index.html?offline=1',{cache:'no-store'})));
    return;
  }
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    event.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}
      return res;
    }).catch(()=>caches.match(req)));
    return;
  }
  if(url.hostname==='raw.githubusercontent.com'||url.hostname==='api.worldbank.org'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));return res;}).catch(()=>caches.match(req)));
  }
});
