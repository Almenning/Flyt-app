const CACHE='laria-stable-2026-10-12-globe36-pigment3-atlas-webkit-paint-v2-landscape-focus1-iphone-shortportrait1-ux-phase1-globe-ux-phase2-deepzoom32-smallphone-card-ipad-controls-phase3-fox5-final-polish4-noflash-phase4b-multmobile1-phase4c-wordhunt1-firstpaint1-wordhunt-bokskogen-premium1-balanced-directions1-completion-delight2-illustration-parity2-calm-scene1-desktop-firstfold1-magicalthemes1-premium-scenes3-mobiletopic1-firstlanding1-painted1-phase4d-fox-only1-geo-ordered2-bokskogen-stage2-ipad-mac-stage1-phasec-multiplication1-phasec2-firstfold1-task-stable-feedback-bilingual-voice1-journey-mission-premium1-iphone-c3-mission-compatible1-phase-d1-math44px1-floating-journey-back1-country-story-premium3-landmark-scenes1-popyear-outline1-discoveries1-wordhunt-foxhintshortcut1-gangemagi-finalfold7-name1-markedsbok1-approved2-magicbook1-wordhunt-premium-foxwords1-diorama2-superklode-release1-visible-fox-guidance2-mobile-motion-gm-livegroups1-superklode3-terrain1-continent3-relief3-atmosphere1-stories1-marker1-antarctica1-find-the-words-v1-equalcard-selectfirst-20261019-dragmatch1-paintedfindcard2-findwords-premium-garden2-tallvika1-eggenipa-touchback1-tallvika-v3-painted-next-unique1-gangemagi-premium-20261023-release37';
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
