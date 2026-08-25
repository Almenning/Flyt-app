(()=>{
'use strict';
const RELEASE='20260825-1930';
let installed=false;
function css(){if(document.querySelector('#flytBuyerPolish'))return;const s=document.createElement('style');s.id='flytBuyerPolish';s.textContent=`
#flytGlobalModal{z-index:300!important}
#statusAlertModal{z-index:320!important}
#quickAlertModal{z-index:330!important}
.toast{z-index:350!important}
button{-webkit-tap-highlight-color:transparent}
button:active{transform:scale(.985)}
button:disabled{opacity:.55;cursor:not-allowed}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.content,#flytSetupV2Body{overscroll-behavior:contain}
.top,.nav{-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
@media(max-width:600px){
 .top{gap:6px;padding-left:10px;padding-right:10px}
 .top>.pill,.top>div>.pill{font-size:12px!important;padding:8px 10px!important;min-height:40px!important;white-space:nowrap}
 .top>div{gap:5px!important}
 .content{padding-bottom:42px!important}
 .card{box-shadow:0 8px 22px #65351d0d}
}
@media(prefers-reduced-motion:reduce){button:active{transform:none}}
`;document.head.appendChild(s)}
function normalizeOverlays(root=document){const map=[['#flytGlobalModal','300'],['#statusAlertModal','320'],['#quickAlertModal','330']];for(const [sel,z] of map){root.querySelectorAll?.(sel).forEach(el=>el.style.zIndex=z)}document.querySelectorAll('.toast').forEach(el=>el.style.zIndex='350')}
function polishCopy(){document.querySelectorAll('#betaGate .sub').forEach(el=>{if(el.textContent.includes('antall ganger per uke, poeng, hvem som vanligvis gjør dem, timing'))el.textContent='Oppgaver, daglig/ukentlig/månedlig rytme, poeng, hvem som vanligvis gjør dem og hva som er viktig for dere.'})}
function ensureSetupAfterOnboarding(e){const b=e.target.closest?.('#reviewSetup,#continueSetup');if(!b)return;const start=b.id==='reviewSetup'?0:0;setTimeout(()=>{let tries=0;const t=setInterval(()=>{if(window.FlytSetupV2?.open){clearInterval(t);window.FlytSetupV2.open(start);if(b.id==='reviewSetup')window.FlytBridge?.toast?.('Se gjennom og juster oppsettet før dere starter');return}if(++tries>40)clearInterval(t)},50)},80)}
function registerSW(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register(`./sw.js?v=${RELEASE}`).catch(()=>{})}
function labelNav(){const labels={home:'Hjem',tasks:'Gjøre',seen:'Sett',rewards:'Fristelser',us:'Oss'};document.querySelectorAll('#nav button[data-view]').forEach(b=>{b.setAttribute('aria-label',labels[b.dataset.view]||b.dataset.view);if(b.classList.contains('on'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function install(){if(installed)return;installed=true;css();normalizeOverlays();polishCopy();labelNav();registerSW();document.addEventListener('click',ensureSetupAfterOnboarding,true);const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)normalizeOverlays(n);polishCopy();labelNav()});obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',()=>{normalizeOverlays();polishCopy();labelNav()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytBuyerPolish={install,version:RELEASE};
})();