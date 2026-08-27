(()=>{
'use strict';
const RELEASE='20260827-2358';
let installed=false;
function css(){if(document.querySelector('#flytBuyerPolish'))return;const s=document.createElement('style');s.id='flytBuyerPolish';s.textContent=`
#flytGlobalModal,#seenRequestModal,#flytDialog,#quickTemptationModal,#ossNotifyModal,#betaPanel{z-index:300!important}
#statusAlertModal{z-index:320!important}
#quickAlertModal{z-index:330!important}
#syncModal{z-index:280!important}
#flytAccountPanel{z-index:410!important}
#flytConsentGate{z-index:520!important}
#betaGate #chooseLocal,#betaGate #chooseLocal+.sub{display:none!important}
.toast{z-index:350!important}
button{-webkit-tap-highlight-color:transparent}
button:active{transform:scale(.985)}
button:disabled{opacity:.55;cursor:not-allowed}
#switchUser:disabled{opacity:1;cursor:default}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.content,#flytSetupV2Body{overscroll-behavior:contain}
.top,.nav{-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.top{box-shadow:0 5px 18px #5c30200a}
.nav{box-shadow:0 -6px 20px #5c30200a}
.nav button{border-radius:13px;transition:background .16s ease,color .16s ease,transform .12s ease}
.nav button.on{background:#fff0e8}
.nav b{line-height:1.05}
#flytAppMenu{position:fixed;inset:0;z-index:285;background:#3a211b77;display:flex;align-items:flex-end;justify-content:center;touch-action:manipulation}
#flytAppMenu .flytMenuSheet{width:100%;max-height:86dvh;overflow:auto;padding:18px 15px max(18px,env(safe-area-inset-bottom));border-radius:26px 26px 0 0;background:#fffaf7;box-shadow:0 -20px 60px #4d291f33;pointer-events:auto;-webkit-overflow-scrolling:touch}
#flytAppMenu .flytMenuAction{width:100%;display:flex;align-items:center;gap:12px;text-align:left;margin-top:8px;touch-action:manipulation}
#flytAppMenu .flytMenuIcon{width:30px;text-align:center;font-size:18px}
@media(max-width:600px){
 .top{gap:7px;padding-left:10px;padding-right:10px;align-items:center;overflow:hidden!important}
 .top>#switchUser{min-width:0;max-width:calc(100% - 58px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px!important;padding:8px 11px!important;min-height:40px!important}
 .top>div{margin-left:auto;flex:0 0 auto;gap:5px!important}
 .top>div>#betaHelpBtn,.top>div>#syncBtn,.top>div>#setupBtn,.top>div>#setupBtnV2,.top>div>#lock{display:none!important}
 #flytMoreBtn{display:inline-flex!important;align-items:center;justify-content:center;width:44px;min-width:44px;min-height:40px!important;padding:7px!important;font-size:20px!important;line-height:1;touch-action:manipulation}
 .content{padding-bottom:42px!important}
 .card{box-shadow:0 8px 22px #65351d0d}
 #content[data-flyt-owner="home"]>p.sub:first-of-type{min-height:4.35em}
}
@media(min-width:601px){#flytMoreBtn{display:none!important}#flytAppMenu{align-items:center}#flytAppMenu .flytMenuSheet{width:390px;border-radius:26px;max-height:760px}}
@media(prefers-reduced-motion:reduce){button:active{transform:none}.nav button{transition:none}}
`;document.head.appendChild(s)}
function normalizeOverlays(root=document){const map=[['#flytGlobalModal','300'],['#seenRequestModal','300'],['#flytDialog','300'],['#quickTemptationModal','300'],['#ossNotifyModal','300'],['#betaPanel','300'],['#syncModal','280'],['#statusAlertModal','320'],['#quickAlertModal','330'],['#flytAccountPanel','410'],['#flytConsentGate','520']];for(const [sel,z] of map){if(root.matches?.(sel))root.style.zIndex=z;root.querySelectorAll?.(sel).forEach(el=>el.style.zIndex=z)}document.querySelectorAll('.toast').forEach(el=>el.style.zIndex='350')}
function polishCopy(){document.querySelectorAll('#betaGate .ey').forEach(el=>{if(el.textContent.trim()==='Gratis privat beta')el.textContent='Privat beta'});document.querySelectorAll('#betaGate .sub').forEach(el=>{if(el.textContent.includes('antall ganger per uke, poeng, hvem som vanligvis gjør dem, timing'))el.textContent='Oppgaver, daglig/ukentlig/månedlig rytme, poeng, hvem som vanligvis gjør dem og hva som er viktig for dere.'});document.querySelectorAll('#content .sub').forEach(el=>{if(el.textContent.includes('hint, masing eller ren tankelesing'))el.textContent='Her kan dere gjøre behov, ønsker og usynlige bidrag tydelige før de blir til hint, misforståelser eller masing.'});const p=document.querySelector('#betaPassword[autocomplete="new-password"]');if(p){p.minLength=10;p.placeholder='Passord, minst 10 tegn'}}
function registerSW(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register(`./sw.js?v=${RELEASE}`).catch(()=>{})}
function labelNav(){const labels={home:'Hjem',tasks:'Gjøre',seen:'Sett',rewards:'Fristelser',us:'Oss'};document.querySelectorAll('#nav button[data-view]').forEach(b=>{b.setAttribute('aria-label',labels[b.dataset.view]||b.dataset.view);if(b.classList.contains('on'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function ensureMoreButton(){const actions=document.querySelector('.top > div');if(!actions||document.querySelector('#flytMoreBtn'))return;const b=document.createElement('button');b.id='flytMoreBtn';b.type='button';b.className='pill';b.textContent='•••';b.setAttribute('aria-label','Mer');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');actions.appendChild(b)}
function closeMenu(){document.querySelector('#flytAppMenu')?.remove();const b=document.querySelector('#flytMoreBtn');if(b)b.setAttribute('aria-expanded','false')}
function openMenu(){closeMenu();document.activeElement?.blur?.();const ctx=window.FlytSync?.getContext?.(),members=ctx?.members||[],connected=members.length>1,me=window.FlytSync?.myName?.()||window.FlytBridge?.getState?.()?.user||'Meg',partner=members.find(m=>m.display_name&&m.display_name!==me)?.display_name;const el=document.createElement('div');el.id='flytAppMenu';el.innerHTML=`<div class="flytMenuSheet" role="dialog" aria-modal="true" aria-label="Flyt-meny"><div class="row"><div class="grow"><div class="ey">Flyt for to</div><h2 style="font:500 26px/1.1 Georgia;margin:5px 0 3px">${connected&&partner?`${me} + ${partner}`:me}</h2><div class="taskmeta">${connected?'Partner koblet':'Koble partner for delt Flyt'}</div></div><button type="button" id="flytMenuClose" class="pill">Lukk</button></div><div style="margin-top:15px"><button type="button" class="secondary flytMenuAction" data-flyt-menu="connection"><span class="flytMenuIcon">${connected?'✓':'↗'}</span><span><strong>${connected?'Tilkobling':'Inviter partner'}</strong><span class="taskmeta" style="display:block">${connected?'Synkronisering og par-kobling':'Del husholdningen med partneren din'}</span></span></button><button type="button" class="secondary flytMenuAction" data-flyt-menu="setup"><span class="flytMenuIcon">⚙</span><span><strong>Rediger oppsett</strong><span class="taskmeta" style="display:block">Gjøremål, rytme, poeng og ansvar</span></span></button><button type="button" class="secondary flytMenuAction" data-flyt-menu="feedback"><span class="flytMenuIcon">✎</span><span><strong>Tilbakemelding</strong><span class="taskmeta" style="display:block">Privat beta og feilrapportering</span></span></button><button type="button" class="secondary flytMenuAction" data-flyt-menu="account"><span class="flytMenuIcon">◯</span><span><strong>Konto og personvern</strong><span class="taskmeta" style="display:block">Personvern, lokale data og sletting</span></span></button><button type="button" class="secondary flytMenuAction" data-flyt-menu="logout"><span class="flytMenuIcon">↪</span><span><strong>Logg ut</strong></span></button></div></div>`;el.addEventListener('click',e=>{if(e.target===el){e.preventDefault();e.stopPropagation();closeMenu()}});document.body.appendChild(el);const more=document.querySelector('#flytMoreBtn');if(more)more.setAttribute('aria-expanded','true');el.querySelector('#flytMenuClose').onclick=e=>{e.preventDefault();e.stopPropagation();closeMenu()}}
function openSetupFromMenu(){const open=()=>{if(!window.FlytSetupV2?.open)return false;window.FlytSetupV2.open(1);return true};if(open())return;let tries=0;const timer=setInterval(()=>{tries++;if(open()){clearInterval(timer);return}if(tries>=40){clearInterval(timer);window.FlytBridge?.toast?.('Oppsettet kunne ikke åpnes. Last inn appen på nytt.')}},50)}
function signupGuard(e){const b=e.target.closest?.('#betaSignup');if(!b)return;const p=document.querySelector('#betaPassword'),status=document.querySelector('#betaStatus');if((p?.value||'').length>=10)return;e.preventDefault();e.stopImmediatePropagation();if(status){status.textContent='Velg et passord med minst 10 tegn.';status.style.color='#a63c31'}}
function menuAction(e){const more=e.target.closest?.('#flytMoreBtn');if(more){e.preventDefault();e.stopImmediatePropagation();openMenu();return}const b=e.target.closest?.('[data-flyt-menu]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const action=b.dataset.flytMenu;closeMenu();if(action==='connection'){document.querySelector('#syncBtn')?.click();return}if(action==='setup'){openSetupFromMenu();return}if(action==='feedback'){window.FlytBetaUI?.open?.();return}if(action==='account'){window.FlytAccountUI?.open?.();return}if(action==='logout'){document.querySelector('#lock')?.click()}}
function keyboard(e){if(e.key==='Escape'&&document.querySelector('#flytAppMenu')){e.preventDefault();closeMenu()}}
function install(){if(installed)return;installed=true;css();normalizeOverlays();polishCopy();labelNav();ensureMoreButton();registerSW();document.addEventListener('click',signupGuard,true);document.addEventListener('click',menuAction,true);document.addEventListener('keydown',keyboard,true);const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)normalizeOverlays(n);polishCopy();labelNav();ensureMoreButton()});obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',()=>{closeMenu();normalizeOverlays();polishCopy();labelNav();ensureMoreButton()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytBuyerPolish={install,openMenu,closeMenu,version:RELEASE};
})();