/* Læria Premium 3.0, phase 2B – opt-in visual candidate only.
 * This switch changes presentation, never illustration pixels, navigation
 * handlers, progress, or character art. Safe default: unchanged application.
 */
(()=>{
  'use strict';
  const enabled=new URLSearchParams(location.search).get('lariaSigns2b')==='1';
  if(!enabled)return;
  document.documentElement.setAttribute('data-laria-signs-2b','preview');
  window.LARIA_SIGNS_2B=Object.freeze({
    version:'2b-preview-1',
    mode:'preview',
    needsVisualApproval:true
  });
})();
