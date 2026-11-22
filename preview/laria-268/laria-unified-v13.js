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
})();