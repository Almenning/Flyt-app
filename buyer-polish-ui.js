(()=>{
'use strict';
const RELEASE='20260825-2007';
let installed=false;
function css(){if(document.querySelector('#flytBuyerPolish'))return;const s=document.createElement('style');s.id='flytBuyerPolish';s.textContent=`
#flytGlobalModal{z-index:300!important}
#statusAlertModal{z-index:320!important}
#quickAlertModal{z-index:330!important}
.toast{z-index:350!important}
button{-webkit-tap-highlight-color:transparent}
button:active{transform:scale(.985)}
button:disabled{opacity:.55;cursor:not-allowed}
#switchUser:disabled{opacity:1;cursor:default}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.content,#flytSetupV2Body{overscroll-behavior:contain}
.top,.nav{-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
#flytAppMenu{position:fixed;inset:0;z-index:285;background:#3a211b77;display:flex;align-items:flex-end;justify-content:center}
#flytAppMenu .flytMenuSheet{width:100%;max-height:86dvh;overflow:auto;padding:18px 15px max(18px,env(safe-area-inset-bottom));border-radius:26px 26px 0 0;background:#fffaf7;box-shadow:0 -20px 60px #4d291f33}
#flytAppMenu .flytMenuAction{width:100%;display:flex;align-items:center;gap:12px;text-align:left;margin-top:8px}
#flytAppMenu .flytMenuIcon{width:30px;text-align:center;font-size:18px}
@media(max-width:600px){
 .top{gap:7px;padding-left:10px;padding-right:10px;align-items:center}
 .top>#switchUser{min-width:0;max-width:calc(100% - 58px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px!important;padding:8px 11px!important;min-height:40px!important}
 .top>div{margin-left:auto;flex:0 0 auto;gap:5px!important}
 .top>div>#betaHelpBtn,.top>div>#syncBtn,.top>div>#setupBtn,.top>div>#setupBtnV2,.top>div>#lock{display:none!important}
 #flytMoreBtn{display:inline-flex!important;align-items:center;justify-content:center;width:44px;min-width:44px;min-height:40px!important;padding:7px!important;font-size:20px!important;line-height:1}
 .content{padding-bottom:42px!important}
 .card{box-shadow:0 8px 22px #65351d0d}
}
@media(min-width:601px){#flytMoreBtn{display:none!important}#flytAppMenu{align-items:center}#flytAppMenu .flytMenuSheet{width:390px;border-radius:26px;max-height:760px}}
@media(prefers-reduced-motion:reduce){button:active{transform:none}}
`;document.head.appendChild(s)}
function normalizeOverlays(root=document){const map=[['#flytGlobalModal','300'],['#statusAlertModal','320'],['#quickAlertModal','330']];for(const [sel,z] of map){if(root.matches?.(sel))root.style.zIndex=z;root.querySelectorAll?.(sel).forEach(el=>el.style.zIndex=z)}document.querySelectorAll('.toast').forEach(el=>el.style.zIndex='350')}
function polishCopy(){document.querySelectorAll('#betaGate .ey').forEach(el=>{if(el.textContent.trim()==='Gratis privat beta')el.textContent='Privat beta'});document.querySelectorAll('#betaGate .sub').forEach(el=>{if(el.textContent.includes('antall ganger per uke, poeng, hvem som vanligvis gjør dem, timing'))el.textContent='Oppgaver, daglig/ukentlig/månedlig rytme, poeng, hvem som vanligvis gjør dem og hva som er viktig for dere.'})}
function ensureSetupAfterOnboarding(e){const b=e.target.closest?.('#reviewSetup,#continueSetup');if(!b)return;setTimeout(()=>{let tries=0;const t=setInterval(()=>{if(window.FlytSetupV2?.open){clearInterval(t);window.FlytSetupV2.open(0);if(b.id==='reviewSetup')window.FlytBridge?.toast?.('Se gjennom og juster oppsettet før dere starter');return}if(++tries>40)clearInterval(t)},50)},80)}
function registerSW(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register(`./sw.js?v=${RELEASE}`).catch(()=>{})}
function labelNav(){const labels={home:'Hjem',tasks:'Gjøre',seen:'Sett',rewards:'Fristelser',us:'Oss'};document.querySelectorAll('#nav button[data-view]').forEach(b=>{b.setAttribute('aria-label',labels[b.dataset.view]||b.dataset.view);if(b.classList.contains('on'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function ensureMoreButton(){const actions=document.querySelector('.top > div');if(!actions||document.querySelector('#flytMoreBtn'))return;const b=document.createElement('button');b.id='flytMoreBtn';b.type='button';b.className='pill';b.textContent='•••';b.setAttribute('aria-label','Meny');b.setAttribute('aria-haspopup','dialog');actions.appendChild(b)}
function closeMenu(){document.querySelector('#flytAppMenu')?.remove()}
function openMenu(){closeMenu();const ctx=window.FlytSync?.getContext?.(),members=ctx?.members||[],connected=members.length>1,me=window.FlytSync?.myName?.()||window.FlytBridge?.getState?.()?.user||'Meg',partner=members.find(m=>m.display_name&&m.display_name!==me)?.display_name;const el=document.createElement('div');el.id='flytAppMenu';el.innerHTML=`<div class="flytMenuSheet" role="dialog" aria-modal="true" aria-label="Flyt-meny"><div class="row"><div class="grow"><div class="ey">Flyt for to</div><h2 style="font:500 26px/1.1 Georgia;margin:5px 0 3px">${connected&&partner?`${me} + ${partner}`:me}</h2><div class="taskmeta">${connected?'Partner koblet':'Koble partner for delt Flyt'}</div></div><button type="button" id="flytMenuClose" class="pill">Lukk</button></div><div style="margin-top:15px"><button type="button" class="secondary flytMenuAction" data-flyt-menu="connection"><span class="flytMenuIcon">${connected?'✓':'↗'}</span><span><strong>${connected?'Tilkobling':'Inviter partner'}</strong><span class="taskmeta" style="display:block">${connected?'Synkronisering og par-kobling':'Del husholdningen med partneren din'}</span></span></button><button type="button" class="secondary flytMenuAction" data-flyt-menu="setup"><span class="flytMenuIcon">⚙</span><span><strong>Rediger oppsett</strong><span class="taskmeta" style="display:block">Gjøremål, rytme, poeng og ansvar</span></span></button><button type="button" class="secondary flytMenuAction" data-flyt-menu="feedback"><span class="flytMenuIcon">✎</span><span><strong>Tilbakemelding</strong><span class="taskmeta" style="display:block">Privat beta og feilrapportering</span></span></button><button type="button" class="secondary flytMenuAction" data-flyt-menu="logout"><span class="flytMenuIcon">↪</span><span><strong>Logg ut</strong></span></button></div></div>`;el.addEventListener('click',e=>{if(e.target===el)closeMenu()});document.body.appendChild(el);el.querySelector('#flytMenuClose').onclick=closeMenu;requestAnimationFrame(()=>el.querySelector('#flytMenuClose')?.focus({preventScroll:true}))}
function menuAction(e){const more=e.target.closest?.('#flytMoreBtn');if(more){e.preventDefault();openMenu();return}const b=e.target.closest?.('[data-flyt-menu]');if(!b)return;const action=b.dataset.flytMenu;closeMenu();if(action==='connection'){document.querySelector('#syncBtn')?.click();return}if(action==='setup'){if(window.FlytSetupV2?.open)window.FlytSetupV2.open(0);else document.querySelector('#setupBtnV2,#setupBtn')?.click();return}if(action==='feedback'){window.FlytBetaUI?.open?.();return}if(action==='logout'){document.querySelector('#lock')?.click()}}
function install(){if(installed)return;installed=true;css();normalizeOverlays();polishCopy();labelNav();ensureMoreButton();registerSW();document.addEventListener('click',ensureSetupAfterOnboarding,true);document.addEventListener('click',menuAction,true);const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)normalizeOverlays(n);polishCopy();labelNav();ensureMoreButton()});obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',()=>{normalizeOverlays();polishCopy();labelNav();ensureMoreButton()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytBuyerPolish={install,openMenu,closeMenu,version:RELEASE};
})();