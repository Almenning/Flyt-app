(()=>{'use strict';
/* Læria unified visual helpers v13. Functionality stays owned by the existing app. */
function profileAvatar(){
  try{return (typeof state!=='undefined'&&state?.profile?.avatar==='girl')?'girl':'boy'}catch(_){return 'boy'}
}
function syncProfileTravelers(root=document){
  const avatar=profileAvatar();
  root.querySelectorAll?.('.bok-v13-traveler').forEach(el=>{
    el.classList.add('premium-traveler');
    el.dataset.avatar=avatar;
    el.removeAttribute('aria-hidden');
    el.setAttribute('aria-label',avatar==='girl'?'Din valgte revejente':'Din valgte revegutt');
  });
}
function ensureThemeArtifacts(){
  const subjectBanner=document.querySelector('#subject-screen .subject-page-banner');
  if(subjectBanner)subjectBanner.classList.add('laria-unified-banner');
  const geo=document.querySelector('#geography-screen .geography-banner');
  if(geo)geo.classList.add('laria-unified-banner');
  const progress=document.querySelector('#progress-screen .progress-page-banner');
  if(progress)progress.classList.add('laria-unified-banner');
  syncProfileTravelers(document);
}
function init(){
  ensureThemeArtifacts();
  const subject=document.getElementById('subject-screen');
  if(subject)new MutationObserver(()=>syncProfileTravelers(subject)).observe(subject,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();