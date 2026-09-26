(()=>{
'use strict';
// Sync owns hydration and its durable draft. Never copy raw server state over it.
const ready=()=>window.FlytSync?.isReady?.()===true;
function inspect(){
  document.querySelector('#flytHydrationGuard')?.remove();
  return ready();
}
async function hydrate(){return inspect()}
window.FlytStartupHydration={hydrate,isHydrated:ready,version:'20260926-session-safety1'};
window.addEventListener('flyt:session-reset',inspect);
window.addEventListener('pageshow',inspect);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inspect,{once:true});else inspect();
})();
