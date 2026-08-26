(()=>{
'use strict';
let installed=false,hydrated=false,hydrating=false,originalQueue=null,watcher=null;
const standalone=()=>window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true;
const bridge=()=>window.FlytBridge;
const sync=()=>window.FlytSync;
const appVisible=()=>{const a=document.querySelector('.app'),g=document.querySelector('#betaGate');return !!a&&!a.classList.contains('hidden')&&(!g||g.classList.contains('hidden'))};
function overlay(){let el=document.querySelector('#flytHydrationGuard');if(el)return el;el=document.createElement('div');el.id='flytHydrationGuard';el.style.cssText='position:fixed;inset:0;z-index:390;background:#fff7f1;display:flex;align-items:center;justify-content:center;padding:24px;color:var(--ink)';el.innerHTML='<div style="text-align:center;max-width:320px"><div class="logo">fl<b>y</b>t</div><div class="ey" style="margin-top:14px">Synkroniserer</div><h2 style="font:500 27px/1.15 Georgia;margin:10px 0 8px">Henter deres Flyt</h2><p class="sub">Oppsett, gjennomføringer og poeng hentes før appen åpnes.</p></div>';document.body.appendChild(el);return el}
function removeOverlay(){document.querySelector('#flytHydrationGuard')?.remove()}
function remoteState(){const c=sync()?.getContext?.();return c?.household&&c?.state&&Object.keys(c.state).length?c.state:null}
function applyRemoteDirect(){const remote=remoteState(),b=bridge();if(!remote||!b?.getState||!b?.setState)return false;const local=b.getState()||{},name=sync()?.myName?.()||local.user||'Meg',view=local.view||'home';b.setState({...local,...structuredClone(remote),user:name,view});return true}
async function hydrate(){if(hydrating||hydrated||!appVisible())return false;hydrating=true;if(standalone())overlay();try{for(let i=0;i<40;i++){if(!appVisible())return false;const s=sync(),ctx=s?.getContext?.();if(ctx?.household){try{await s.pull?.(true)}catch(e){}if(applyRemoteDirect()){hydrated=true;return true}}await new Promise(r=>setTimeout(r,125))}return false}finally{hydrating=false;if(hydrated||!appVisible())removeOverlay()}}
function protectQueue(){const s=sync();if(!s?.queueSave||s.__hydrationProtected)return;originalQueue=s.queueSave.bind(s);s.queueSave=(...args)=>{if(!hydrated)return;return originalQueue(...args)};s.__hydrationProtected=true}
function inspect(){protectQueue();if(appVisible()&&!hydrated)hydrate();if(!appVisible()){hydrated=false;removeOverlay()}}
function install(){if(installed)return;installed=true;protectQueue();inspect();watcher=new MutationObserver(()=>queueMicrotask(inspect));watcher.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});window.addEventListener('pageshow',()=>{hydrated=false;setTimeout(inspect,0)});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(inspect,0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.FlytStartupHydration={hydrate,version:'20260826-0746'};
})();