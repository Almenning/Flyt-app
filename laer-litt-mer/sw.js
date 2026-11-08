/* Læria PWA: network-first code, cache-first versioned art.
 * A child's installed iPad/iPhone app must not retain old JS/CSS after deployment.
 * Local storage, saved journeys and selected trolls are untouched. */
const CACHE='laria-premium-20261108-network-first1';
const APP_CACHE_PREFIXES=['laer-litt-mer-','laria-'];
const SHELL=['./manifest.webmanifest','./icon.svg'];
const FRESH_CODE=/\.(?:js|css|html|json|webmanifest)$/i;

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&APP_CACHE_PREFIXES.some(p=>k.startsWith(p))).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
async function keepFresh(req,response){
  if(response?.ok){
    const cache=await caches.open(CACHE);
    await cache.put(req,response.clone());
  }
  return response;
}
async function networkFirst(req){
  try{
    return await keepFresh(req,await fetch(req,{cache:'no-store'}));
  }catch(err){
    const cached=await caches.match(req);
    if(cached)return cached;
    throw err;
  }
}
async function cacheFirst(req){
  const cached=await caches.match(req);
  if(cached)return cached;
  return keepFresh(req,await fetch(req));
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    event.respondWith(
      networkFirst(req).catch(async()=>{
        const fallback=await caches.match('./index.html');
        if(fallback)return fallback;
        return fetch('./index.html?offline=1',{cache:'no-store'});
      })
    );
    return;
  }
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    // Version query strings are useful but insufficient: legacy clients may
    // have cached an old resource under the SAME ?v= URL. Always revalidate
    // code against the network, then fall back to the last good offline copy.
    event.respondWith(FRESH_CODE.test(url.pathname)?networkFirst(req):cacheFirst(req));
    return;
  }
  if(url.hostname==='raw.githubusercontent.com'||url.hostname==='api.worldbank.org'){
    event.respondWith(networkFirst(req));
  }
});
