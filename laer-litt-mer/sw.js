const CACHE='laria-shared-scenes-v21-2026-10-05';
const APP_CACHE_PREFIXES=['laer-litt-mer-','laria-'];
const SHELL=['./task-house-v21.webp','./task-cat-v21.webp','./task-dog-v21.webp','./task-apple-v21.webp','./task-tree-v21.webp','./task-book-v21.webp','./task-sun-v21.webp','./task-ball-v21.webp','./task-fish-v21.webp','./task-mouse-v21.webp','./task-car-v21.webp','./task-cheese-v21.webp','./task-icecream-v21.webp','./task-boat-v21.webp','./task-hat-v21.webp','./task-shoe-v21.webp','./task-train-v21.webp','./task-cow-v21.webp','./task-lamb-v21.webp','./task-cup-v21.webp','./task-bed-v21.webp','./task-apples-v21.webp','./task-moon-v21.webp','./task-flower-v21.webp','./fredoka-v21.ttf','./bokskogen-verden.png','./profile-avatars.js?v=profile1','./manifest.webmanifest','./icon.svg','./word-hunt.css?v=wordhunt2','./word-hunt.js?v=wordhunt2','./home-basecamp-v12.css?v=basecamp12','./home-basecamp-v12.js?v=basecamp12','./laria-unified-v13.css?v=unified21','./laria-unified-v13.js?v=unified21','./laria-task-scene-v14.css?v=taskscene21','./laria-task-scene-v14.js?v=taskscene21','./globe-premium-v15.css?v=globe15','./globe-premium-v15.js?v=globe15','./globe-premium-v20.css?v=globe20b','./globe-premium-v20.js?v=globe20b','./globe-v20-approved.webp?v=1','./basecamp-v11.webp','./basecamp-v11-mobile.webp','./lia-fox-explorer.webp?v=fox1','./fraction-lab.css?v=20261003-mobile2','./fraction-lab.js?v=20261003-mobile2','./multiplication-lab.css?v=20261003-table1','./multiplication-lab.js?v=20261003-table1','./norwegian-content.js','./bokskogen-world.css?v=atlas35','./bokskogen-world.js?v=atlas35','./journey-world-premium.css?v=map38','./journey-world-premium.js?v=atlas35','./matte-verden.png?v=20261004-world1','./engelsk-verden.png?v=20261004-world1','./geografi-verden.png?v=20261004-world1']

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
