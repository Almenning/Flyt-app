(()=>{
'use strict';
const SUPABASE_URL='https://uopzveejnztbovncqbpq.supabase.co';
const SUPABASE_KEY='sb_publishable_uK6xd8TJhN2MY10qHSQ2GQ_7hSIr2gv';
const APP_URL='https://almenning.github.io/Flyt-app/';
const RESET_URL='https://almenning.github.io/Flyt-app/reset.html';
const INVITE_WEB_URL='https://almenning.github.io/Flyt-app/invite.html';
const INVITE_SCHEME='hverdagsoss:';
const LOCAL_MODE_KEY='flyt_local_mode_v1';
const SYNC_VERSION='20260926-session-safety1';
const STARTER_TASK_IDS=['dish_fill','dish_empty','kitchen','dinner','laundry_start','laundry_hang','laundry_fold','trash'];
const STARTER_TASKS=(window.FlytTaskLanguage?.catalog||[]).filter(task=>STARTER_TASK_IDS.includes(task.id));
if(!window.supabase){
  const fail=()=>{
    document.querySelector('.app')?.classList.add('hidden');
    document.querySelector('#setup')?.classList.add('hidden');
    document.querySelector('#flytSetupV2')?.classList.add('hidden');
    const login=document.querySelector('#login');
    if(login){login.classList.remove('hidden');login.setAttribute('aria-hidden','false');login.innerHTML='<div class="loginbox"><div class="logo">HverdagsOss</div><div class="ey" style="margin-top:10px">For hverdagen dere deler</div><h1 style="font:500 30px Georgia;margin:18px 0 6px">Vi fikk ikke startet innloggingen</h1><p class="sub">Prøv på nytt. Ingen data er slettet.</p><button class="primary full" onclick="location.reload()">Prøv igjen</button><p class="sub" style="font-size:12px">Hvis dette skjer i Messenger eller en annen innebygd nettleser, åpne lenken i Safari eller Chrome.</p></div>'}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fail,{once:true});else fail();
  console.error('Flyt: Supabase-biblioteket mangler');
  return
}
const capacitor=window.Capacitor;
const nativeRuntime=window.FlytPlatform?.isNative===true||!!(capacitor&&(typeof capacitor.isNativePlatform==='function'?capacitor.isNativePlatform():capacitor.getPlatform?.()!=='web'));
const authOptions={persistSession:true,autoRefreshToken:true,detectSessionInUrl:true};
if(nativeRuntime){
  if(!window.FlytPlatform?.secureAuthStorage){
    const fail=()=>{document.querySelector('.app')?.classList.add('hidden');const login=document.querySelector('#login');if(login){login.classList.remove('hidden');login.setAttribute('aria-hidden','false');login.innerHTML='<div class="loginbox"><div class="logo">HverdagsOss</div><h1 style="font:500 30px Georgia;margin:18px 0 6px">Sikker innlogging kunne ikke startes</h1><p class="sub">Lukk appen og prøv igjen. Ingen data er slettet.</p></div>'}};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fail,{once:true});else fail();
    console.error('HverdagsOss: native secure auth storage unavailable');
    return
  }
  authOptions.storage=window.FlytPlatform.secureAuthStorage;
}else if(window.FlytPlatform?.webAuthStorage){authOptions.storage=window.FlytPlatform.webAuthStorage;}
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:authOptions});
let ctx=null,pollTimer=null,saveTimer=null,applying=false,dirty=false,saving=false,hydrated=false,authName='',syncError=false,lastSavedAt=0,nativeLifecycleInstalled=false,nativeDeepLinksInstalled=false,appActive=true,bootstrapPromise=null,foregroundSyncPromise=null,pendingInviteCode='';
let serverRevision=0,serverState={},clientBaseState=null;
const journal=window.FlytSyncJournal;
const AUTH_BLOCK_KEY='hverdagsoss:auth-blocked:v1';
let epoch=0,activeUserId=null,sessionBlocked=false,logoutPromise=null,cleanupPromise=null;
let pullPromise=null,pushPromise=null,loginPending=false,pendingWrite=null,durableError=false,deferredRender=false;
const requests=new Set();
try{sessionBlocked=localStorage.getItem(AUTH_BLOCK_KEY)==='1'}catch(e){sessionBlocked=true}
let instanceId='';
function clientInstanceId(){
  if(instanceId)return instanceId;
  try{instanceId=localStorage.getItem('hverdagsoss:sync-instance:v1')||crypto.randomUUID();localStorage.setItem('hverdagsoss:sync-instance:v1',instanceId)}catch(error){instanceId=crypto.randomUUID()}
  return instanceId;
}
function staleError(){return Object.assign(new Error('STALE_SESSION'),{code:'STALE_SESSION'})}
function scopeNow(){return{epoch,userId:activeUserId,householdId:ctx?.household?.id||null}}
function scopeValid(scope){return !sessionBlocked&&scope.epoch===epoch&&scope.userId===activeUserId}
function assertScope(scope){if(!scopeValid(scope))throw staleError()}
function assertHousehold(scope){assertScope(scope);if(scope.householdId!==(ctx?.household?.id||null))throw staleError()}
function invalidateWork(){
  epoch++;clearTimeout(saveTimer);stopPolling();
  for(const controller of requests)controller.abort();requests.clear();
  bootstrapPromise=null;foregroundSyncPromise=null;pullPromise=null;pushPromise=null;saving=false;
}
function laterForScope(fn,delay=0){const scope=scopeNow();return setTimeout(()=>{if(scopeValid(scope))fn()},delay)}
async function withTimeout(work,label='SYNC_TIMEOUT',milliseconds=15000,onTimeout=()=>{}){
  let timer;try{return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>{onTimeout();reject(new Error(label))},milliseconds)})])}finally{clearTimeout(timer)}
}
async function rpcAt(scope,name,args){
  assertScope(scope);const controller=new AbortController();requests.add(controller);
  try{
    let request=sb.rpc(name,args);if(request?.abortSignal)request=request.abortSignal(controller.signal);
    const result=await withTimeout(request,'SYNC_TIMEOUT',15000,()=>controller.abort());
    assertScope(scope);return result;
  }catch(error){assertScope(scope);throw error}finally{requests.delete(controller)}
}
function consentKey(){return JSON.stringify([ctx?.consent?.privacy_version||null,ctx?.consent?.sensitive_version||null,ctx?.consent?.sensitive_current===true])}
function saveJournal(){
  if(!activeUserId||!ctx?.household?.id||sessionBlocked)return false;
  try{
    if(!journal)throw new Error('OUTBOX_UNAVAILABLE');
    if(dirty||pendingWrite)journal.write(localStorage,activeUserId,ctx.household.id,clientBaseState||serverState,sharedState(),pendingWrite,consentKey());
    else journal.remove(localStorage,activeUserId,ctx.household.id);
    durableError=false;return true;
  }catch(error){durableError=true;return false}
}
function installSharedState(shared){
  const local=bridge()?.getState?.()||{},busy=uiBusy();
  applying=true;try{bridge()?.setState?.({...local,...shared,user:myName(),view:local.view||'home'},{render:!busy});deferredRender=busy}finally{applying=false}
}
function restoreJournal(){
  if(!journal)throw new Error('OUTBOX_UNAVAILABLE');
  const record=journal.read(localStorage,activeUserId,ctx.household.id);
  if(!record)return false;
  // Never restore drafts from an earlier consent state after withdrawal.
  if(record.consent!==consentKey()){journal.remove(localStorage,activeUserId,ctx.household.id);return false}
  if(record.pending&&!journal.acknowledged(record,serverState)){
    installSharedState(record.local);clientBaseState=cloneShared(record.base);pendingWrite=record.pending;
  }else{
    installSharedState(journal.recover(record,serverState,mergeShared));clientBaseState=cloneShared(serverState);pendingWrite=null;
  }
  dirty=!!pendingWrite||!sameShared(sharedState(),serverState);saveJournal();return true;
}
function lockSession(){
  sessionBlocked=true;invalidateWork();
  let locked=true;
  try{localStorage.setItem(AUTH_BLOCK_KEY,'1');window.FlytPlatform?.lockAuthStorage?.()}catch(e){locked=false}
  return locked;
}
function resetPrivateSession(){
  ctx=null;activeUserId=null;authName='';dirty=false;syncError=false;hydrated=false;pendingWrite=null;deferredRender=false;resetRevisionState();
  const cleared=clearPrivateLocalData();
  applying=true;try{bridge()?.setState?.(cleanStarterState('Meg'))}finally{applying=false}
  $('#syncModal')?.classList.add('hidden');
  for(const id of ['flytAccountPanel','flytSensitiveConsent','flytConsentGate','goalSheetLayer','fristelseCatalogLayer','fristelseTaskCatalogLayer','pointPickerLayer','deadlinePickerLayer','seenRecognitionAlert'])$('#'+id)?.remove();
  window.dispatchEvent?.(new CustomEvent('flyt:session-reset'));
  return cleared;
}
// A fresh document also removes private caches held by independent UI modules.
function reloadAfterIdentityReset(){if(typeof location.reload==='function')location.reload()}
function showLogoutFailure(){
  showGate(shell('<h1>Utloggingen er ikke fullført</h1><p class="sub" role="alert">Appen er låst, men vi kunne ikke bekrefte at alle lokale innloggingsdata ble slettet. Prøv igjen før du bytter konto.</p><button id="retryLogout" class="primary full">Prøv utlogging igjen</button>'));
  $('#retryLogout')?.addEventListener('click',()=>logout());
}
function cleanupAuth(){
  if(cleanupPromise)return cleanupPromise;
  const work=(async()=>{
    let ok=true;
    try{const result=await sb.auth.signOut({scope:'local'});if(result?.error)ok=false}catch(error){ok=false}
    // This runs even if the SDK rejects instead of returning {error}.
    try{
      if(window.FlytPlatform?.isNative)await window.FlytPlatform.clearSecureAuthStorage();
      for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i)||'';if(key.startsWith('sb-uopzveejnztbovncqbpq-'))localStorage.removeItem(key)}
    }catch(error){ok=false}
    return ok;
  })();
  cleanupPromise=work;work.finally(()=>{if(cleanupPromise===work)cleanupPromise=null});return work;
}
async function prepareLogin(){
  if(logoutPromise)await logoutPromise;
  if(sessionBlocked){
    let ok=false;try{ok=await withTimeout(cleanupAuth(),'LOGOUT_TIMEOUT',10000)}catch(e){}
    if(!ok){showLogoutFailure();return false}
  }
  invalidateWork();if(!resetPrivateSession()){showLogoutFailure();return false}
  try{window.FlytPlatform?.unlockAuthStorage?.();localStorage.removeItem(AUTH_BLOCK_KEY)}catch(e){showLogoutFailure();return false}
  sessionBlocked=false;return true;
}

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bridge=()=>window.FlytBridge;
function annotateActorIds(value,userId,displayName){
  if(Array.isArray(value))return value.map(item=>annotateActorIds(item,userId,displayName));
  if(!value||typeof value!=='object')return value;
  const next={};for(const [key,item] of Object.entries(value))next[key]=annotateActorIds(item,userId,displayName);
  if(!next.actorUserId&&['by','from','sender','createdBy','offeredBy','claimedBy'].some(key=>next[key]===displayName))next.actorUserId=userId;
  return next;
}
function sharedState(){const s=structuredClone(bridge()?.getState?.()||{});delete s.user;delete s.view;const userId=ctx?.user_id,name=myName();if(userId){s.memberIds={...(s.memberIds||{}),[userId]:name};return annotateActorIds(s,userId,name)}return s}
function cloneShared(value){return structuredClone(value||{})}
function mergeShared(base,local,remote){return window.FlytSyncMerge?.mergeSharedState?.(base||{},local||{},remote||{})||cloneShared(local||remote||{})}
function cleanStarterState(name){const who=String(name||'Meg').trim()||'Meg';return{version:5,taskCatalogVersion:window.FlytTaskLanguage?.CATALOG_VERSION||0,user:who,view:'home',setupDone:false,areas:{home:true,children:true,mental:true,training:true,closeness:true},trainingFor:{[who]:true},categoryRelevant:{},tasks:STARTER_TASKS.map(t=>({...t,owner:'Begge'})),custom:[],completions:[],plannedTasks:[],dayPlans:{},taskClaims:[],points:{[who]:0},status:{[who]:{energy:'med',capacity:'med',stress:'med',needs:[]}},work:[],seenRequests:[],recognitions:[],seenSuggestionPreferences:{},goals:[],rewardOffers:[],rewardPurchases:[],rewards:[],rewardRedemptions:[],quickTemptations:[],coupleInvitations:[],coupleJourney:{firstWinStartedAt:null,firstWinSeenBy:[]},nudgePreferences:{},setupHistory:[]}}
function stableValue(v){if(Array.isArray(v))return v.map(stableValue);if(v&&typeof v==='object'){const out={};for(const k of Object.keys(v).sort())if(v[k]!==undefined)out[k]=stableValue(v[k]);return out}return v}
function sameShared(a,b){try{return JSON.stringify(stableValue(a||{}))===JSON.stringify(stableValue(b||{}))}catch(e){return false}}
function isEditing(){const a=document.activeElement;if(!a)return false;return !!a.matches?.('input,textarea,select,[contenteditable="true"]')&&!a.disabled}
function isReordering(){return document.querySelector('#content')?.dataset?.flytReorderActive==='1'}
function uiBusy(){return isEditing()||isReordering()}
function resetRevisionState(){serverRevision=0;serverState={};clientBaseState=null}
function ensureBetaUi(){
  $('#login')?.classList.add('hidden');
  $('#setup')?.classList.add('hidden');
  $('#flytSetupV2')?.classList.add('hidden');
  if(!$('#betaGate')){const g=document.createElement('div');g.id='betaGate';g.className='login';g.innerHTML='<div class="loginbox" id="betaGateBox"><div class="logo">HverdagsOss</div><div class="ey" style="margin-top:10px">For hverdagen dere deler</div><p class="sub" style="margin-top:20px">Gjør appen klar…</p></div>';document.body.appendChild(g)}
  document.querySelector('.app')?.classList.add('hidden');
}
function showGate(html){hydrated=false;ensureBetaUi();$('#betaGateBox').innerHTML=html;const labels={betaName:'Fornavn',betaEmail:'E-post',betaPassword:'Passord',houseName:'Navn på husholdningen',joinCode:'Invitasjonskode'};for(const[id,label]of Object.entries(labels)){const input=document.querySelector(`#${id}`);if(input&&!input.getAttribute('aria-label'))input.setAttribute('aria-label',label)}$('#betaGate').classList.remove('hidden');document.querySelector('.app')?.classList.add('hidden')}
function showApp(){ensureBetaUi();$('#betaGate').classList.add('hidden');document.querySelector('.app')?.classList.remove('hidden');updateChrome();const s=bridge()?.getState?.();if(s&&hydrated){applying=true;try{bridge().setState({...s,user:myName(),view:s.view||'home'})}finally{applying=false}}}
function isSummaryReady(){const app=document.querySelector('.app'),gate=$('#betaGate');return hydrated===true&&!!ctx?.user_id&&!!ctx?.household?.id&&!!app&&!app.classList.contains('hidden')&&(!gate||gate.classList.contains('hidden'))}
function status(msg,bad=false){const e=$('#betaStatus');if(e){e.textContent=msg||'';e.style.color=bad?'#a63c31':'var(--muted)'}}
function shell(inner){return `<div class="logo">HverdagsOss</div><div class="ey" style="margin-top:10px">For hverdagen dere deler</div>${inner}`}
function localModeEnabled(){try{return localStorage.getItem(LOCAL_MODE_KEY)==='1'}catch(e){return false}}
function setLocalMode(enabled){try{enabled?localStorage.setItem(LOCAL_MODE_KEY,'1'):localStorage.removeItem(LOCAL_MODE_KEY)}catch(e){}}
function clearPrivateLocalData(){
  let cleared=true;
  try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i)||'';if(key.startsWith('hverdagsoss:outbox:v1:')||key==='flyt_state_v5'||key.startsWith('flyt_state_v6:')||key.startsWith('hverdagsoss:private-tasks:')||key.startsWith('flyt.summarySeen.')||key.startsWith('flyt:daily-checkin-')||key.startsWith('flyt_local_mode_v1'))localStorage.removeItem(key)}}catch(error){cleared=false}
  try{for(let i=sessionStorage.length-1;i>=0;i--){const key=sessionStorage.key(i)||'';if(key.startsWith('flyt:')||key.startsWith('hverdagsoss:')||key.includes('uopzveejnztbovncqbpq'))sessionStorage.removeItem(key)}}catch(error){cleared=false}
  try{window.FlytLocalData?.clearPrivateState?.()}catch(error){cleared=false}
  return cleared;
}
async function logout(message=''){
  if(logoutPromise)return logoutPromise;
  const hadUnsaved=dirty||saving,locked=lockSession(),cleared=resetPrivateSession();
  showGate(shell('<p class="sub" role="status">Logger ut og rydder denne enheten…</p>'));
  const work=(async()=>{
    let ok=false;try{ok=await withTimeout(cleanupAuth(),'LOGOUT_TIMEOUT',10000)}catch(error){}
    if(!ok||!locked||!cleared){showLogoutFailure();return false}
    authChoice(message||'Du er logget ut på denne enheten.');
    if(hadUnsaved&&$('#betaStatus'))$('#betaStatus').textContent='Ulagrede lokale endringer ble fjernet ved utlogging.';
    pendingInviteCode='';reloadAfterIdentityReset();return true;
  })();
  logoutPromise=work;try{return await work}finally{if(logoutPromise===work)logoutPromise=null}
}
function showLocalApp(){hydrated=false;ctx=null;dirty=false;resetRevisionState();clearTimeout(saveTimer);clearInterval(pollTimer);ensureBetaUi();$('#betaGate').classList.add('hidden');document.querySelector('.app')?.classList.remove('hidden');const s=bridge()?.getState?.(),names=Object.keys(s?.status||{}),partner=names.find(name=>name!==s?.user);const sw=$('#switchUser');if(sw){sw.textContent=partner?`${s.user} + ${partner} ▾`:(s?.user||'Lokal modus');sw.disabled=false}const syn=$('#syncBtn');if(syn){syn.textContent='Logg inn for synk';syn.onclick=()=>{setLocalMode(false);authChoice()}}const lock=$('#lock');if(lock){lock.textContent='Lås';lock.onclick=()=>{setLocalMode(false);authChoice()}}if(s)bridge()?.setState?.({...s,view:s.view||'home'})}
function authChoice(message=''){hydrated=false;showGate(shell(`${message?`<p id="betaStatus" class="sub" role="status" aria-live="polite">${esc(message)}</p><button id="retryBootstrap" class="secondary full" style="margin-top:10px">Prøv igjen</button>`:''}<h1 style="font:500 32px/1.08 Georgia;margin:18px 0 8px">Mer flyt. Mer oss.</h1><p class="sub">Se hva som må gjøres, ta mer initiativ og legg merke til hverandres bidrag — med mindre koordinering.</p><button id="chooseSignin" class="primary full" style="margin-top:14px">Logg inn</button><button id="chooseSignup" class="secondary full" style="margin-top:10px">Opprett konto</button><p class="sub" style="font-size:12px;margin-top:16px">Start med din konto. Du kan koble til partneren nå eller senere.</p>`));$('#retryBootstrap')?.addEventListener('click',bootstrap);$('#chooseSignin').onclick=()=>{setLocalMode(false);loginScreen()};$('#chooseSignup').onclick=()=>{setLocalMode(false);signupScreen()}}
function loginScreen(message=''){showGate(shell(`<h1 style="font:500 30px Georgia;margin:18px 0 6px">Logg inn</h1><p class="sub">Velkommen tilbake.</p><input id="betaEmail" class="field" type="email" autocomplete="email" placeholder="E-post"><input id="betaPassword" class="field" type="password" autocomplete="current-password" placeholder="Passord"><button id="betaSignin" class="primary full" style="margin-top:6px">Logg inn</button><button id="betaForgot" class="secondary full" style="margin-top:10px">Glemt passord?</button><button id="backAuth" class="secondary full" style="margin-top:10px">Tilbake</button><p id="betaStatus" class="sub" style="min-height:42px">${esc(message)}</p>`));$('#betaSignin').onclick=signin;$('#betaForgot').onclick=forgotPassword;$('#backAuth').onclick=authChoice}
function signupScreen(message=''){showGate(shell(`<h1 style="font:500 30px Georgia;margin:18px 0 6px">Opprett konto</h1><p class="sub">Start for deg selv. Partneren kan kobles til når det passer.</p><input id="betaName" class="field" placeholder="Fornavn"><input id="betaEmail" class="field" type="email" autocomplete="email" placeholder="E-post"><input id="betaPassword" class="field" type="password" minlength="10" autocomplete="new-password" placeholder="Passord, minst 10 tegn"><button id="betaSignup" class="primary full" style="margin-top:6px">Opprett konto</button><button id="backAuth" class="secondary full" style="margin-top:10px">Tilbake</button><p id="betaStatus" class="sub" style="min-height:42px">${esc(message)}</p>`));$('#betaSignup').onclick=signup;$('#backAuth').onclick=authChoice}
async function forgotPassword(){const email=$('#betaEmail').value.trim();if(!email){status('Skriv inn e-postadressen din først.',true);return}status('Sender lenke for nytt passord…');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:RESET_URL});if(error){status(error.message,true);return}status('Vi har sendt en lenke for å lage nytt passord. Sjekk innboksen og søppelpost.')}
async function signup(){
  if(loginPending)return;
  const name=$('#betaName').value.trim(),email=$('#betaEmail').value.trim(),password=$('#betaPassword').value;
  if(!name){status('Skriv inn fornavnet ditt.',true);return}
  if(!email||password.length<10){status('Skriv inn gyldig e-post og minst 10 tegn i passordet.',true);return}
  loginPending=true;
  try{
    if(!await prepareLogin())return;const scope=scopeNow();status('Oppretter konto…');
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:APP_URL}});assertScope(scope);
    if(error){status(error.message,true);return}
    authName=name;
    if(data.session){activeUserId=data.session.user.id;await rpcAt(scopeNow(),'set_my_display_name',{p_name:name});await bootstrap();return}
    signupScreen('Kontoen er opprettet. Bekreft e-posten, gå tilbake hit og logg inn.');
  }catch(error){if(!sessionBlocked)status('Kunne ikke opprette konto. Prøv igjen.',true)}finally{loginPending=false}
}
async function signin(){
  if(loginPending)return;
  const email=$('#betaEmail').value.trim(),password=$('#betaPassword').value;
  if(!email||!password){status('Skriv inn e-post og passord.',true);return}
  loginPending=true;
  try{
    if(!await prepareLogin())return;const scope=scopeNow();status('Logger inn…');
    const {data,error}=await sb.auth.signInWithPassword({email,password});assertScope(scope);
    if(error){status(error.message,true);return}
    activeUserId=data.user.id;authName=sessionDisplayName(data.session||{user:data.user});await bootstrap();
  }catch(error){if(!sessionBlocked)status('Kunne ikke logge inn. Prøv igjen.',true)}finally{loginPending=false}
}
function householdScreen(message=''){
  const invited=!!pendingInviteCode;
  showGate(shell(`<div class="ey" style="margin-top:16px">Husholdning</div><h2 style="margin:8px 0">${invited?'Du er invitert':'Hvordan vil du starte?'}</h2><p class="sub">${invited?'Invitasjonskoden er fylt ut. Bekreft for å koble dere sammen.':'Opprett en husholdning hvis du er først ute, eller bruk partnerens kode.'}</p><div class="card ${invited?'':'hero'}"><strong>Jeg starter en husholdning</strong><p class="sub">Du får en kode som partneren kan bruke når det passer.</p><input id="houseName" class="field" placeholder="Navn på husholdningen, f.eks. Hjemme hos oss"><button id="createHouse" class="${invited?'secondary':'primary'} full">Opprett husholdning</button></div><div class="card ${invited?'hero':''}"><strong>Jeg har en invitasjonskode</strong><p class="sub">Skriv inn koden fra partneren din.</p><input id="joinCode" class="field" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="Invitasjonskode"><button id="joinHouse" class="${invited?'primary':'secondary'} full">Bli med i husholdning</button></div><button id="betaSignout" class="secondary full">Logg ut</button><p id="betaStatus" class="sub">${esc(message)}</p>`));
  const join=$('#joinCode');if(join&&pendingInviteCode)join.value=pendingInviteCode;
  $('#createHouse').onclick=()=>createHouse().catch(()=>{});$('#joinHouse').onclick=()=>joinHouse().catch(()=>{});$('#betaSignout').onclick=()=>logout()
}
async function createHouse(){const scope=scopeNow();status('Oppretter husholdning…');hydrated=false;const {data,error}=await guardedRpc('create_household',{p_name:$('#houseName').value.trim()||'Vårt hjem'});if(error){status(error.message,true);return}await loadContext(scope);assertScope(scope);const starter=cleanStarterState(myName());applying=true;try{bridge()?.setState?.(starter)}finally{applying=false}try{const saved=await persistRevisionState(sharedState(),serverState,serverRevision);assertScope(scope);serverState=cloneShared(saved.state);serverRevision=saved.revision;clientBaseState=cloneShared(saved.state);ctx={...ctx,state:cloneShared(saved.state),revision:saved.revision}}catch(saveError){console.error('HverdagsOss initial save failed:',saveError);status('Husholdningen ble opprettet, men startoppsettet kunne ikke lagres. Prøv igjen.',true);return}hydrated=true;inviteScreen(ctx?.household?.invite_code||data?.[0]?.invite_code||'',ctx?.household?.invite_expires_at,'setup')}
function formatInviteExpiry(value){const date=new Date(value||0);if(!Number.isFinite(date.getTime()))return'';return new Intl.DateTimeFormat('nb-NO',{dateStyle:'medium',timeStyle:'short'}).format(date)}
function normalizeInviteCode(value){const code=String(value||'').trim().toUpperCase().replace(/[^A-F0-9]/g,'');return /^[A-F0-9]{8,12}$/.test(code)?code:''}
function invitationWebUrl(code){const normalized=normalizeInviteCode(code);return normalized?`${INVITE_WEB_URL}?code=${encodeURIComponent(normalized)}`:''}
function inviteCodeFromUrl(rawUrl){
  try{
    const url=new URL(String(rawUrl||''),APP_URL);
    if(url.protocol===INVITE_SCHEME&&url.hostname==='invite')return normalizeInviteCode(url.pathname.split('/').filter(Boolean)[0]||url.searchParams.get('code'));
    if((url.protocol==='https:'||url.protocol==='http:')&&url.hostname==='almenning.github.io'&&url.pathname.startsWith('/Flyt-app/'))return normalizeInviteCode(url.searchParams.get('invite')||url.searchParams.get('code'));
  }catch(e){}
  return''
}
function stripInviteFromBrowserUrl(){
  if(window.FlytPlatform?.isNative)return;
  try{const url=new URL(location.href);if(!url.searchParams.has('invite')&&!url.searchParams.has('code'))return;url.searchParams.delete('invite');url.searchParams.delete('code');history.replaceState(history.state,'',url.pathname+(url.search||'')+(url.hash||''))}catch(e){}
}
function routePendingInvite(message=''){
  if(sessionBlocked)return false;
  if(!pendingInviteCode)return false;
  if(ctx?.household){pendingInviteCode='';bridge()?.toast?.('Denne kontoen er allerede koblet til en husholdning');return true}
  if(ctx?.user_id){householdScreen(message||'Invitasjonskoden er fylt ut.');return true}
  authChoice(message||'Invitasjonen er klar. Logg inn eller opprett konto for å fortsette.');return true
}
function handleIncomingInviteUrl(rawUrl,{stripBrowser=false}={}){
  const code=inviteCodeFromUrl(rawUrl);if(!code)return false;
  pendingInviteCode=code;
  if(stripBrowser)stripInviteFromBrowserUrl();
  if(document.readyState!=='loading')routePendingInvite();
  return true
}
async function installNativeDeepLinks(){
  if(nativeDeepLinksInstalled||!window.FlytPlatform?.isNative)return false;
  nativeDeepLinksInstalled=true;
  try{
    await window.FlytPlatform.addUrlOpenListener?.(event=>handleIncomingInviteUrl(event?.url));
    const launchUrl=await window.FlytPlatform.getLaunchUrl?.();
    if(launchUrl)handleIncomingInviteUrl(launchUrl);
    return true
  }catch(e){console.warn('HverdagsOss native deep link unavailable:',e);return false}
}
async function copyInviteText(value){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true}const area=document.createElement('textarea');area.value=value;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand?.('copy')===true;area.remove();return ok}
async function shareInviteLink(code){
  const link=invitationWebUrl(code);if(!link)return false;
  try{
    if(navigator.share){await navigator.share({title:'HverdagsOss',text:'Bli med meg i HverdagsOss.',url:link});return true}
  }catch(e){if(e?.name==='AbortError')return false}
  try{if(await copyInviteText(link)){status('Invitasjonslenken er kopiert.');return true}}catch(e){}
  status('Kunne ikke dele lenken. Kopier invitasjonskoden i stedet.',true);return false
}
function inviteScreen(code,expiresAt=ctx?.household?.invite_expires_at,after='app'){
  const expiry=formatInviteExpiry(expiresAt),expired=expiresAt&&new Date(expiresAt).getTime()<=Date.now(),normalized=normalizeInviteCode(code),shown=expired?'Utløpt':normalized||'Ingen aktiv kode',shareAction=!expired&&normalized?'<button id="shareInvite" class="secondary full">Del invitasjonslenke</button>':'';
  showGate(shell(`<div class="ey" style="margin-top:16px">Inviter partner</div><h2 style="margin:8px 0">Del lenken når det passer</h2><p class="sub">Partneren åpner lenken eller bruker koden for å bli med. Du kan starte alene nå.</p><div class="card hero" style="text-align:center"><div class="ey">Invitasjonskode</div><div style="font-size:30px;font-weight:900;letter-spacing:.1em;margin:10px 0;overflow-wrap:anywhere">${esc(shown)}</div>${expiry?`<div class="taskmeta">${expired?'Utløpt':'Gyldig til'} ${esc(expiry)}</div>`:''}</div>${shareAction}<button id="rotateInvite" class="secondary full" style="margin-top:10px">Lag ny invitasjonskode</button><button id="continueSetup" class="primary full" style="margin-top:10px">Fortsett uten partner</button><p id="betaStatus" class="sub">Lenken og koden kan brukes én gang og utløper automatisk etter sju dager.</p>`));
  $('#shareInvite')?.addEventListener('click',()=>shareInviteLink(normalized));
  $('#rotateInvite').onclick=()=>rotateInviteCode(after).catch(()=>{});$('#continueSetup').onclick=()=>{hydrated=true;if(after==='setup')openHouseSetup(false);else showApp()}
}
async function rotateInviteCode(after='app'){const scope=scopeNow();const button=$('#rotateInvite');if(button)button.disabled=true;status('Lager ny kode…');const {data,error}=await guardedRpc('rotate_household_invite',{});if(error){status('Kunne ikke lage ny kode akkurat nå.',true);bridge()?.toast?.('Kunne ikke lage ny kode akkurat nå');if(button)button.disabled=false;return null}await loadContext(scope);assertScope(scope);const result=Array.isArray(data)?data[0]:data,code=result?.invite_code||ctx?.household?.invite_code,expires=result?.expires_at||ctx?.household?.invite_expires_at;inviteScreen(code,expires,after);return{invite_code:code,expires_at:expires}}
async function joinHouse(){const scope=scopeNow();const code=normalizeInviteCode($('#joinCode').value);if(!code){status('Skriv inn invitasjonskoden.',true);return}status('Kobler til…');hydrated=false;const {data,error}=await guardedRpc('join_household_v2',{p_code:code});if(error){status('Kunne ikke koble til akkurat nå.',true);return}if(!data?.ok){hydrated=false;const message=data?.error==='rate_limited'?'For mange forsøk. Vent litt før du prøver igjen.':data?.error==='already_member'?'Kontoen er allerede koblet til en husholdning.':'Koden er ugyldig eller har utløpt.';status(message,true);return}pendingInviteCode='';await loadContext(scope);assertScope(scope);applyRemote();hydrated=true;reviewPartnerSetup()}
function reviewPartnerSetup(){const p=partnerMember();const s=ctx?.state||{};const tasks=Array.isArray(s.tasks)?s.tasks:[];showGate(shell(`<div class="ey" style="margin-top:16px">Dere er koblet</div><h2 style="margin:8px 0">Klart til å starte sammen</h2><p class="sub">${esc(p?.display_name||'Partneren din')} har satt opp husholdningen. Se raskt gjennom det som er valgt.</p><div class="card hero"><strong>${esc(ctx?.household?.name||'Vårt hjem')}</strong><p class="sub">${tasks.length} valgte gjøremål</p></div><p class="sub">Dere kan endre gjøremål og områder senere.</p><button id="reviewSetup" class="primary full">Se oppsett og start</button>`));$('#reviewSetup').onclick=()=>{hydrated=true;openHouseSetup(true)}}
function openHouseSetup(joiner){showApp();let tries=0;const open=()=>{if(window.FlytSetupV2?.open){window.FlytSetupV2.open(1);if(joiner)bridge()?.toast?.('Se gjennom og juster oppsettet før dere starter');return true}const b=$('#setupBtnV2,#setupBtn');if(b){b.click();if(joiner)bridge()?.toast?.('Se gjennom og juster oppsettet før dere starter');return true}return false};if(open())return;const timer=setInterval(()=>{if(open()||++tries>40)clearInterval(timer)},50)}
function rememberServerContext(){serverRevision=Math.max(0,Number(ctx?.revision)||0);serverState=cloneShared(ctx?.state||{})}
async function guardedRpc(name,args){return rpcAt(scopeNow(),name,args)}
async function loadContext(scope=scopeNow()){
  const {data:initial,error}=await rpcAt(scope,'get_my_flyt_context');if(error)throw error;
  let data=initial;
  if(!data?.user_id||data.user_id!==activeUserId)throw Object.assign(new Error('CONTEXT_IDENTITY_MISMATCH'),{code:'CONTEXT_IDENTITY_MISMATCH'});
  if(!data.members?.find(member=>member.id===data.user_id)?.display_name&&authName){
    const named=await rpcAt(scope,'set_my_display_name',{p_name:authName});
    if(!named.error){const retry=await rpcAt(scope,'get_my_flyt_context');if(!retry.error)data=retry.data}
  }
  assertScope(scope);
  if(data?.user_id!==activeUserId)throw staleError();
  const previous=ctx?.household?.id,next=data?.household?.id;
  if(previous&&previous!==next){
    invalidateWork();clearPrivateLocalData();dirty=false;pendingWrite=null;hydrated=false;resetRevisionState();
    ctx=data;rememberServerContext();installSharedState(cleanStarterState(myName()));
    if(data.requires_consent)window.FlytAccountUI?.checkConsent?.();else if(!next)householdScreen('Partnerkoblingen er avsluttet.');
    else laterForScope(()=>bootstrap());
    reloadAfterIdentityReset();throw staleError();
  }
  if(previous&&next===previous&&Number(data.revision)<serverRevision)data={...data,state:serverState,revision:serverRevision};
  ctx=data;rememberServerContext();return ctx;
}
function myMember(){return ctx?.members?.find(m=>m.id===ctx?.user_id)||null}function myName(){return String(myMember()?.display_name||authName||'Meg').trim()||'Meg'}function partnerMember(){return ctx?.members?.find(m=>m.id!==ctx?.user_id)||null}
function syncInfo(){if(durableError)return{label:'Ikke lagret',detail:'Kunne ikke lagre lokalt. Hold appen åpen og koble til nett før du avslutter.'};if(!ctx?.household)return{label:'Inviter',detail:'Inviter partneren din for delt hverdag.'};if(saving)return{label:'Lagrer…',detail:'Endringene lagres nå.'};if(syncError)return{label:navigator.onLine===false?'Venter på nett':'Ikke lagret',detail:navigator.onLine===false?'Endringene er trygt beholdt på denne enheten til dere er på nett igjen.':'Endringene kunne ikke lagres. Trykk for å prøve igjen.'};if(dirty)return{label:navigator.onLine===false?'Venter på nett':'Lagrer…',detail:navigator.onLine===false?'Endringene er trygt beholdt på denne enheten til dere er på nett igjen.':'Endringene venter på å bli lagret.'};return{label:'Lagret',detail:lastSavedAt?'Endringene er synkronisert.':'Koblet til partneren din.'}}
function updateSyncButton(){const syn=$('#syncBtn'),p=partnerMember();if(!syn)return;const info=syncInfo();syn.textContent=p?info.label:'Inviter';syn.title=p?info.detail:'Inviter partneren din';syn.setAttribute('aria-label',p?`${info.label}. ${info.detail}`:'Inviter partneren din');syn.onclick=()=>p?connectionSheet():inviteScreen(ctx?.household?.invite_code||'',ctx?.household?.invite_expires_at)}
function updateChrome(){const me=myMember(),p=partnerMember(),sw=$('#switchUser');if(sw){sw.textContent=p?`${myName()} + ${p.display_name}`:myName();sw.disabled=true}updateSyncButton();const lock=$('#lock');if(lock){lock.textContent='Logg ut';lock.onclick=()=>logout()}}
function ensureSheet(){if($('#syncModal'))return;const el=document.createElement('div');el.id='syncModal';el.className='syncModal hidden';el.style.zIndex='280';el.innerHTML='<div class="syncSheet" role="dialog" aria-modal="true" aria-labelledby="syncTitle"><div class="row"><div class="grow"><div class="ey">Par-kobling</div><h2 id="syncTitle" style="margin:4px 0">HverdagsOss sammen</h2></div><button id="syncClose" class="pill">Lukk</button></div><div id="syncBody" style="margin-top:16px"></div></div>';document.body.appendChild(el);$('#syncClose').onclick=()=>el.classList.add('hidden')}
function connectionSheet(){ensureSheet();const p=partnerMember(),info=syncInfo(),retry=syncError?'<button id="syncRetry" class="primary full" style="margin-top:10px">Prøv igjen</button>':'';$('#syncBody').innerHTML=`<div class="card hero"><strong>Dere er koblet</strong><p class="sub">${esc(myName())} og ${esc(p?.display_name||'partner')} deler ${esc(ctx?.household?.name||'samme husholdning')}.</p></div><div class="card"><div class="ey">Synkronisering</div><strong>${esc(info.label)}</strong><p class="sub" style="margin:6px 0 0">${esc(info.detail)}</p></div>${retry}<button id="syncNow" class="secondary full" style="margin-top:10px">Synkroniser nå</button><button id="syncAccount" class="secondary full" style="margin-top:10px">Administrer partnerkobling</button>`;$('#syncRetry')?.addEventListener('click',retrySave);$('#syncNow').onclick=async()=>{if(dirty)await retrySave();if(!dirty&&await pull(true)){bridge()?.toast?.('HverdagsOss er oppdatert')}else if(dirty){bridge()?.toast?.('Endringene må lagres før appen kan synkroniseres')}connectionSheet()};$('#syncAccount').onclick=()=>{$('#syncModal')?.classList.add('hidden');window.FlytAccountUI?.open?.()};$('#syncModal').classList.remove('hidden')}
function forgetSharedState(){invalidateWork();clearPrivateLocalData();dirty=false;pendingWrite=null;syncError=false;hydrated=false;resetRevisionState();applying=true;try{bridge()?.setState?.(cleanStarterState(myName()))}finally{applying=false}}
function handleDisconnected(message='Partnerkoblingen er avsluttet. Dere deler ikke lenger data.'){forgetSharedState();ctx={...(ctx||{}),household:null,members:[],state:{},revision:0};$('#syncModal')?.classList.add('hidden');householdScreen(message);reloadAfterIdentityReset()}
function restoreActiveModule(view){if(view==='home'&&window.FlytHomeUI?.render){window.FlytHomeUI.render();return}if((view==='seen'||view==='us')&&window.FlytSeenUI?.render){window.FlytSeenUI.render({resetScroll:false});return}if(view==='tasks'&&window.FlytRecurrenceUI?.render){window.FlytRecurrenceUI.render({resetScroll:false});return}if(view==='tasks'&&window.FlytTasksUI?.render){window.FlytTasksUI.render();return}if(view==='rewards')window.FlytRewardsUI?.render?.({resetScroll:false})}
function applyRemote(){
  if(sessionBlocked||!activeUserId||!ctx?.household||!serverState||!Object.keys(serverState).length||!bridge()||uiBusy())return false;
  const local=bridge().getState(),localShared=sharedState(),view=local.view||'home';
  const target=clientBaseState===null||!dirty?cloneShared(serverState):mergeShared(clientBaseState,localShared,serverState);
  if(sameShared(target,localShared)){clientBaseState=cloneShared(serverState);return true}
  const merged={...local,...target,user:myName(),view},normalized=window.FlytTaskLanguage?.normalizeState?.(merged)||merged,normalizedShared=cloneShared(normalized);delete normalizedShared.user;delete normalizedShared.view;
  const migrated=!sameShared(target,normalizedShared);
  applying=true;
  try{bridge().setState(normalized);clientBaseState=cloneShared(serverState);laterForScope(()=>restoreActiveModule(view));if(migrated)laterForScope(queueSave);return true}catch(e){console.error('Flyt remote state ignored:',e);return false}finally{applying=false}
}
async function pull(force=false){
  if(sessionBlocked||!ctx?.household||!hydrated||dirty||saving||pendingWrite)return false;
  if(pullPromise)return pullPromise;
  const scope=scopeNow();
  const work=(async()=>{try{await loadContext(scope);assertHousehold(scope);applyRemote();updateChrome();return true}catch(e){return false}})();
  pullPromise=work;try{return await work}finally{if(pullPromise===work)pullPromise=null}
}
async function persistRevisionState(state,base=serverState,revision=serverRevision,scope=scopeNow(),receipt=null){
  const saver=window.FlytSyncMerge?.saveWithRevision;
  if(typeof saver!=='function')throw new Error('SYNC_MERGE_UNAVAILABLE');
  return saver({base,state,revision,maxAttempts:5,save:async(candidate,expectedRevision)=>{
    assertHousehold(scope);
    const {data,error}=await rpcAt(scope,'save_my_flyt_state_v2',{p_data:candidate,p_expected_revision:expectedRevision});
    assertHousehold(scope);if(error)throw error;
    if(receipt&&data?.conflict&&data.state?._syncReceipts?.[receipt.clientId]===receipt.id)return{ok:true,state:data.state,revision:data.revision};
    return data;
  }});
}
async function push(){
  if(pushPromise)return pushPromise;
  if(sessionBlocked||applying||!ctx?.household||!hydrated||navigator.onLine===false)return false;
  const scope=scopeNow();
  const work=(async()=>{
    if(pullPromise)await pullPromise;assertHousehold(scope);
    if(!dirty&&!pendingWrite)return true;
    const priorConsent=consentKey();await loadContext(scope);assertHousehold(scope);
    if(priorConsent!==consentKey()){pendingWrite=null;dirty=false;saveJournal();clientBaseState=null;applyRemote();return false}
    if(!pendingWrite){
      const local=sharedState(),base=cloneShared(clientBaseState||serverState),candidate=mergeShared(base,local,serverState);
      const clientId=clientInstanceId(),id=crypto.randomUUID();
      candidate._syncReceipts={...(candidate._syncReceipts||{}),[clientId]:id};
      pendingWrite={id,clientId,local:cloneShared(local),state:candidate,base:cloneShared(serverState),revision:serverRevision};
    }
    const write=structuredClone(pendingWrite);
    saving=true;syncError=false;saveJournal();updateChrome();
    try{
      const saved=await persistRevisionState(write.state,write.base,write.revision,scope,write);assertHousehold(scope);
      // Rebase only edits made after this exact write began. A lost response is not a new write.
      const current=sharedState(),next=mergeShared(write.local,current,saved.state);
      serverState=cloneShared(saved.state);serverRevision=saved.revision;ctx={...ctx,state:cloneShared(serverState),revision:serverRevision};
      pendingWrite=null;clientBaseState=cloneShared(serverState);installSharedState(next);
      dirty=!sameShared(sharedState(),serverState);lastSavedAt=Date.now();saveJournal();
      if(dirty)laterForScope(queueSave);return true;
    }catch(error){
      if(!scopeValid(scope))return false;
      dirty=true;syncError=true;saveJournal();return false;
    }finally{if(scopeValid(scope)){saving=false;updateChrome()}}
  })();
  pushPromise=work;try{return await work}catch(error){return false}finally{if(pushPromise===work)pushPromise=null}
}
async function retrySave(){clearTimeout(saveTimer);if(pushPromise)return pushPromise;if(!dirty&&!pendingWrite){syncError=false;updateChrome();return true}return push()}
function queueSave(){
  if(sessionBlocked||applying||!ctx?.household||!hydrated)return;
  dirty=true;syncError=false;saveJournal();updateChrome();clearTimeout(saveTimer);saveTimer=laterForScope(push,650);
}
function stopPolling(){clearInterval(pollTimer);pollTimer=null}
function startPolling(){
  stopPolling();if(sessionBlocked||!hydrated||!ctx?.household||(window.FlytPlatform?.isNative&&appActive===false))return;
  const scope=scopeNow();pollTimer=setInterval(()=>{if(scopeValid(scope)&&navigator.onLine!==false){if(dirty||pendingWrite)void retrySave();else void pull(false)}},5000);
}
function reconcileWhenSafe(){if(hydrated&&!dirty&&!saving&&!uiBusy()){applyRemote();if(deferredRender){deferredRender=false;restoreActiveModule(bridge()?.getState?.()?.view)}}}

const AUTH_BOOTSTRAP_TIMEOUT_MS=10000;
async function getSessionWithTimeout(){let timeoutId;try{const result=await Promise.race([sb.auth.getSession(),new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(new Error('AUTH_BOOTSTRAP_TIMEOUT')),AUTH_BOOTSTRAP_TIMEOUT_MS)})]);if(result?.error)throw result.error;return result}finally{clearTimeout(timeoutId)}}
function sessionDisplayName(session){return String(session?.user?.user_metadata?.display_name||session?.user?.user_metadata?.name||authName||'').trim()}
function handleSessionLost(message='Økten er utløpt. Logg inn på nytt.'){
  lockSession();resetPrivateSession();authChoice(message);reloadAfterIdentityReset();
}
async function bootstrap(){
  if(sessionBlocked){if(logoutPromise)return false;authChoice('Logg inn for å fortsette.');return false}
  if(bootstrapPromise)return bootstrapPromise;
  if(dirty)saveJournal();invalidateWork();
  const initialScope=scopeNow();
  const work=(async()=>{
    hydrated=false;ensureBetaUi();let session;
    try{const result=await getSessionWithTimeout();assertScope(initialScope);session=result?.data?.session}
    catch(e){if(scopeValid(initialScope))authChoice(e?.message==='AUTH_BOOTSTRAP_TIMEOUT'?'Innloggingen tok for lang tid. Prøv igjen.':'Kunne ikke hente kontoen. Prøv igjen.');return false}
    if(!session){if(activeUserId)handleSessionLost();else if(localModeEnabled())showLocalApp();else authChoice(pendingInviteCode?'Invitasjonen er klar. Logg inn eller opprett konto for å fortsette.':'');return false}
    if(activeUserId&&activeUserId!==session.user.id){resetPrivateSession()}
    activeUserId=session.user.id;authName=sessionDisplayName(session);const scope=scopeNow();
    setLocalMode(false);
    try{await loadContext(scope);assertScope(scope)}catch(e){if(scopeValid(scope))authChoice('Kunne ikke hente husholdningen. Lagrede endringer beholdes til nettet er tilbake. Prøv igjen.');return false}
    if(ctx?.requires_consent){window.FlytAccountUI?.checkConsent?.();return true}
    if(!ctx?.household){dirty=false;pendingWrite=null;householdScreen(pendingInviteCode?'Invitasjonskoden er fylt ut.':'');return true}
    dirty=false;pendingWrite=null;clientBaseState=null;
    try{if(!restoreJournal())applyRemote()}catch(e){durableError=true;authChoice('Kunne ikke gjenopprette lokale endringer. De er ikke slettet. Prøv igjen eller kontakt support.');return false}
    assertScope(scope);hydrated=true;showApp();startPolling();window.FlytAccountUI?.checkConsent?.();
    if(dirty&&navigator.onLine!==false)laterForScope(()=>retrySave());return true;
  })();
  bootstrapPromise=work;try{return await work}finally{if(bootstrapPromise===work)bootstrapPromise=null}
}
async function resumeAfterForeground(){
  if(sessionBlocked||appActive===false)return false;
  if(bootstrapPromise)return bootstrapPromise;
  if(foregroundSyncPromise)return foregroundSyncPromise;
  const scope=scopeNow();
  const work=(async()=>{
    sb.auth.startAutoRefresh?.();let session;
    try{const result=await getSessionWithTimeout();assertScope(scope);session=result?.data?.session}
    catch(error){if(scopeValid(scope)){syncError=true;updateChrome();startPolling()}return false}
    if(!session){if(localModeEnabled()){showLocalApp();return true}handleSessionLost();return false}
    if(activeUserId&&activeUserId!==session.user.id){invalidateWork();resetPrivateSession();if(typeof location.reload==='function'){reloadAfterIdentityReset();return false}return bootstrap()}
    authName=sessionDisplayName(session);
    if(!hydrated||!ctx?.household)return bootstrap();
    if(dirty||pendingWrite||saving){const saved=await retrySave();if(!scopeValid(scope)||!saved||dirty){if(scopeValid(scope))startPolling();return false}}
    assertScope(scope);const ok=await pull(true);if(scopeValid(scope)){updateChrome();startPolling()}return ok;
  })();
  foregroundSyncPromise=work;try{return await work}finally{if(foregroundSyncPromise===work)foregroundSyncPromise=null}
}
async function handleNativeAppStateChange(state){
  appActive=state?.isActive!==false;
  if(!appActive){stopPolling();sb.auth.stopAutoRefresh?.();if(dirty&&!saving&&navigator.onLine!==false)void retrySave();return}
  await resumeAfterForeground();
}
async function installNativeLifecycle(){
  if(nativeLifecycleInstalled||!window.FlytPlatform?.isNative)return false;
  nativeLifecycleInstalled=true;
  try{
    const initial=await window.FlytPlatform.getAppState?.();
    appActive=initial?.isActive!==false;
    if(appActive&&!sessionBlocked)sb.auth.startAutoRefresh?.();else sb.auth.stopAutoRefresh?.();
    await window.FlytPlatform.addAppStateListener?.(handleNativeAppStateChange);
    return true
  }catch(e){console.warn('HverdagsOss native lifecycle unavailable:',e);appActive=true;return false}
}
window.FlytSync={version:SYNC_VERSION,queueSave,pull,retrySave,bootstrap,resumeAfterForeground,logout,clearPrivateLocalData,showLogin:(message='')=>authChoice(message),myName,rpc:async(name,args)=>{try{return await guardedRpc(name,args)}catch(error){return{data:null,error}}},getContext:()=>ctx,isReady:()=>hydrated&&!sessionBlocked,isSummaryReady,openConnection:connectionSheet,rotateInviteCode,handleDisconnected};
sb.auth.onAuthStateChange?.((event,session)=>{
  if(sessionBlocked||loginPending)return;
  if(event==='SIGNED_OUT'){handleSessionLost();return}
  if(activeUserId&&session?.user?.id&&session.user.id!==activeUserId){
    invalidateWork();resetPrivateSession();if(typeof location.reload==='function')reloadAfterIdentityReset();else laterForScope(()=>bootstrap());
  }
});
window.addEventListener('storage',event=>{if(event.key===AUTH_BLOCK_KEY&&event.newValue==='1')handleSessionLost('Du er logget ut i en annen fane.');});
ensureBetaUi();
handleIncomingInviteUrl(location.href,{stripBrowser:true});
installNativeLifecycle();
installNativeDeepLinks();
window.addEventListener('DOMContentLoaded',bootstrap);
window.addEventListener('offline',updateChrome);
window.addEventListener('online',()=>{if(!sessionBlocked&&appActive)void resumeAfterForeground()});
document.addEventListener('focusout',()=>setTimeout(reconcileWhenSafe,0),true);
document.addEventListener('pointerup',()=>setTimeout(reconcileWhenSafe,0),true);
})();
