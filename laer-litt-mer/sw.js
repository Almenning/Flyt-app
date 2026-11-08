/* Læria PWA: network-first code, cache-first versioned art.
 * A child's installed iPad/iPhone app must not retain old JS/CSS after deployment.
 * Local storage, saved journeys and selected trolls are untouched. */
// Retain historical art release tokens for existing source-integrity contracts;
// the actual update policy below is now network-first for executable assets.
const CACHE='laria-stable-2026-10-12-pwa-network-first-20261108-globe36-pigment3-atlas-webkit-paint-v2-landscape-focus1-iphone-shortportrait1-ux-phase1-globe-ux-phase2-deepzoom32-smallphone-card-ipad-controls-phase3-fox5-final-polish4-noflash-phase4b-multmobile1-phase4c-wordhunt1-firstpaint1-wordhunt-bokskogen-premium1-balanced-directions1-completion-delight2-illustration-parity2-calm-scene1-desktop-firstfold1-magicalthemes1-premium-scenes3-mobiletopic1-firstlanding1-painted1-phase4d-fox-only1-geo-ordered2-bokskogen-stage2-ipad-mac-stage1-phasec-multiplication1-phasec2-firstfold1-task-stable-feedback-bilingual-voice1-journey-mission-premium1-iphone-c3-mission-compatible1-phase-d1-math44px1-floating-journey-back1-country-story-premium3-landmark-scenes1-popyear-outline1-discoveries1-wordhunt-foxhintshortcut1-gangemagi-finalfold7-name1-markedsbok1-approved2-magicbook1-wordhunt-premium-foxwords1-diorama2-superklode-release1-visible-fox-guidance2-mobile-motion-gm-livegroups1-superklode3-terrain1-continent3-relief3-atmosphere1-stories1-marker1-antarctica1-find-the-words-v1-equalcard-selectfirst-20261019-dragmatch1-paintedfindcard2-findwords-premium-garden2-tallvika1-eggenipa-touchback1-tallvika-v3-painted-next-unique1-eggenipa-direct-run4-norsk-wordhunt-recovery2-norsk-find-steps1-gangemagi-premium-20261023-release37-kinnaklova-identityguard2-readingstorybook1-v15kinnaklova2-no404draft1-ki-a11y1-storybookcss2-tallvika-main-sync1-kinnaklova-cleanart1-nordlys-troll1-tallvika-storesoster-approved1-integrated-world-navigation1-troll-portrait1-twopost-premium2-premium-beta-20261107-v1-tallvika-fjord-v2-kinnaklova-ipad-fullscene4-wordhunt-eager1-foxless-eggenipa1-visual-identity-unified4-kinnaklova-firstpaint';
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
