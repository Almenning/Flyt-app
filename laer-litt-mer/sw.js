const CACHE='laer-litt-mer-v22-living-world-2026-10-04';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./fraction-lab.css?v=20261003-mobile2','./fraction-lab.js?v=20261003-mobile2','./multiplication-lab.css?v=20261003-table1','./multiplication-lab.js?v=20261003-table1','./norwegian-content.js','./bokskogen-world.css?v=20261004-premium11','./bokskogen-world.js?v=20261004-world2','./bokskogen-verden.png?v=20261004-world1','./journey-world-premium.css?v=20261004-life1','./journey-world-premium.js?v=20261004-life1','./matte-verden.png?v=20261004-world1','./engelsk-verden.png?v=20261004-world1','./geografi-verden.png?v=20261004-world1'];

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
