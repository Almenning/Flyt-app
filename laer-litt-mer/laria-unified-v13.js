(()=>{'use strict';
/* Læria unified visual helpers v13. Functionality stays owned by the existing app. */
function ensureThemeArtifacts(){
  const subjectBanner=document.querySelector('#subject-screen .subject-page-banner');
  if(subjectBanner)subjectBanner.classList.add('laria-unified-banner');
  const geo=document.querySelector('#geography-screen .geography-banner');
  if(geo)geo.classList.add('laria-unified-banner');
  const progress=document.querySelector('#progress-screen .progress-page-banner');
  if(progress)progress.classList.add('laria-unified-banner');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureThemeArtifacts,{once:true});
else ensureThemeArtifacts();
// Observe navigation without replacing app handlers or rebuilding interactive content.
const worldScreens=new Set(['complete-screen','progress-screen','continent-screen','detail-screen','fraction-lab-screen','multiplication-lab-screen']);
function syncWorldSurface(){
  const active=document.querySelector('.screen.active');
  document.body.classList.toggle('laria-world-surface',worldScreens.has(active?.id));
  if(active?.id==='complete-screen'){
    active.dataset.sceneSubject=(typeof sessionScope!=='undefined'&&sessionScope?.subject)||'geography';
  }
}
const navigationObserver=new MutationObserver(syncWorldSurface);
document.querySelectorAll('.screen').forEach(el=>navigationObserver.observe(el,{attributes:true,attributeFilter:['class']}));
syncWorldSurface();
})();
