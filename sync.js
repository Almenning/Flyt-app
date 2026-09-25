(()=>{
'use strict';
const SUPABASE_URL='https://uopzveejnztbovncqbpq.supabase.co';
const SUPABASE_KEY='sb_publishable_uK6xd8TJhN2MY10qHSQ2GQ_7hSIr2gv';
const APP_URL='https://almenning.github.io/Flyt-app/';
const RESET_URL='https://almenning.github.io/Flyt-app/reset.html';
const LOCAL_MODE_KEY='flyt_local_mode_v1';
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
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let ctx=null,pollTimer=null,saveTimer=null,applying=false,dirty=false,saving=false,hydrated=false,authName='',syncError=false,lastSavedAt=0;
let serverRevision=0,serverState={},clientBaseState=null;
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
  try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i)||'';if(key==='flyt_state_v5'||key.startsWith('flyt_state_v6:')||key.startsWith('hverdagsoss:private-tasks:')||key.startsWith('flyt.summarySeen.')||key.startsWith('flyt:daily-checkin-')||key.startsWith('flyt_local_mode_v1'))localStorage.removeItem(key)}}catch(error){}
  try{for(let i=sessionStorage.length-1;i>=0;i--){const key=sessionStorage.key(i)||'';if(key.startsWith('flyt:')||key.startsWith('hverdagsoss:')||key.includes('uopzveejnztbovncqbpq'))sessionStorage.removeItem(key)}}catch(error){}
  window.FlytLocalData?.clearPrivateState?.();
}
async function logout(message=''){
  const hadUnsaved=dirty||saving;
  clearTimeout(saveTimer);clearInterval(pollTimer);
  clearPrivateLocalData();
  ctx=null;authName='';dirty=false;saving=false;syncError=false;hydrated=false;resetRevisionState();
  applying=true;try{bridge()?.setState?.(cleanStarterState('Meg'))}finally{applying=false}
  const {error}=await sb.auth.signOut({scope:'local'});
  authChoice(error?'Du er logget ut på denne enheten.':'Du er logget ut på denne enheten.');
  if(hadUnsaved)$('#betaStatus')&&( $('#betaStatus').textContent='Lokale endringer som ikke var synkronisert ble fjernet for å beskytte personvernet.');
  return !error;
}
function showLocalApp(){hydrated=false;ctx=null;dirty=false;resetRevisionState();clearTimeout(saveTimer);clearInterval(pollTimer);ensureBetaUi();$('#betaGate').classList.add('hidden');document.querySelector('.app')?.classList.remove('hidden');const s=bridge()?.getState?.(),names=Object.keys(s?.status||{}),partner=names.find(name=>name!==s?.user);const sw=$('#switchUser');if(sw){sw.textContent=partner?`${s.user} + ${partner} ▾`:(s?.user||'Lokal modus');sw.disabled=false}const syn=$('#syncBtn');if(syn){syn.textContent='Logg inn for synk';syn.onclick=()=>{setLocalMode(false);authChoice()}}const lock=$('#lock');if(lock){lock.textContent='Lås';lock.onclick=()=>{setLocalMode(false);authChoice()}}if(s)bridge()?.setState?.({...s,view:s.view||'home'})}
function authChoice(message=''){hydrated=false;showGate(shell(`${message?`<p id="betaStatus" class="sub" role="status" aria-live="polite">${esc(message)}</p><button id="retryBootstrap" class="secondary full" style="margin-top:10px">Prøv igjen</button>`:''}<h1 style="font:500 32px/1.08 Georgia;margin:18px 0 8px">Mer flyt. Mer oss.</h1><p class="sub">Se hva som må gjøres, ta mer initiativ og legg merke til hverandres bidrag — med mindre koordinering.</p><button id="chooseSignin" class="primary full" style="margin-top:14px">Logg inn</button><button id="chooseSignup" class="secondary full" style="margin-top:10px">Opprett konto</button><p class="sub" style="font-size:12px;margin-top:16px">Start med din konto. Du kan koble til partneren nå eller senere.</p>`));$('#retryBootstrap')?.addEventListener('click',bootstrap);$('#chooseSignin').onclick=()=>{setLocalMode(false);loginScreen()};$('#chooseSignup').onclick=()=>{setLocalMode(false);signupScreen()}}
function loginScreen(message=''){showGate(shell(`<h1 style="font:500 30px Georgia;margin:18px 0 6px">Logg inn</h1><p class="sub">Velkommen tilbake.</p><input id="betaEmail" class="field" type="email" autocomplete="email" placeholder="E-post"><input id="betaPassword" class="field" type="password" autocomplete="current-password" placeholder="Passord"><button id="betaSignin" class="primary full" style="margin-top:6px">Logg inn</button><button id="betaForgot" class="secondary full" style="margin-top:10px">Glemt passord?</button><button id="backAuth" class="secondary full" style="margin-top:10px">Tilbake</button><p id="betaStatus" class="sub" style="min-height:42px">${esc(message)}</p>`));$('#betaSignin').onclick=signin;$('#betaForgot').onclick=forgotPassword;$('#backAuth').onclick=authChoice}
function signupScreen(message=''){showGate(shell(`<h1 style="font:500 30px Georgia;margin:18px 0 6px">Opprett konto</h1><p class="sub">Start for deg selv. Partneren kan kobles til når det passer.</p><input id="betaName" class="field" placeholder="Fornavn"><input id="betaEmail" class="field" type="email" autocomplete="email" placeholder="E-post"><input id="betaPassword" class="field" type="password" minlength="10" autocomplete="new-password" placeholder="Passord, minst 10 tegn"><button id="betaSignup" class="primary full" style="margin-top:6px">Opprett konto</button><button id="backAuth" class="secondary full" style="margin-top:10px">Tilbake</button><p id="betaStatus" class="sub" style="min-height:42px">${esc(message)}</p>`));$('#betaSignup').onclick=signup;$('#backAuth').onclick=authChoice}
async function forgotPassword(){const email=$('#betaEmail').value.trim();if(!email){status('Skriv inn e-postadressen din først.',true);return}status('Sender lenke for nytt passord…');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:RESET_URL});if(error){status(error.message,true);return}status('Vi har sendt en lenke for å lage nytt passord. Sjekk innboksen og søppelpost.')}
async function signup(){const name=$('#betaName').value.trim(),email=$('#betaEmail').value.trim(),password=$('#betaPassword').value;if(!name){status('Skriv inn fornavnet ditt.',true);return}if(!email||password.length<10){status('Skriv inn gyldig e-post og minst 10 tegn i passordet.',true);return}status('Oppretter konto…');authName=name;const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:APP_URL}});if(error){status(error.message,true);return}if(data.session){await sb.rpc('set_my_display_name',{p_name:name});await bootstrap();return}signupScreen('Kontoen er opprettet. Bekreft e-posten, gå tilbake hit og logg inn.')}
async function signin(){const email=$('#betaEmail').value.trim(),password=$('#betaPassword').value;if(!email||!password){status('Skriv inn e-post og passord.',true);return}status('Logger inn…');const {data,error}=await sb.auth.signInWithPassword({email,password});if(error){status(error.message,true);return}authName=String(data?.user?.user_metadata?.display_name||data?.user?.user_metadata?.name||'').trim();await bootstrap()}
function householdScreen(message=''){showGate(shell(`<div class="ey" style="margin-top:16px">Husholdning</div><h2 style="margin:8px 0">Hvordan vil du starte?</h2><p class="sub">Opprett en husholdning hvis du er først ute, eller bruk partnerens kode.</p><div class="card hero"><strong>Jeg starter en husholdning</strong><p class="sub">Du får en kode som partneren kan bruke når det passer.</p><input id="houseName" class="field" placeholder="Navn på husholdningen, f.eks. Hjemme hos oss"><button id="createHouse" class="primary full">Opprett husholdning</button></div><div class="card"><strong>Jeg har en invitasjonskode</strong><p class="sub">Skriv inn koden fra partneren din.</p><input id="joinCode" class="field" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="Invitasjonskode"><button id="joinHouse" class="secondary full">Bli med i husholdning</button></div><button id="betaSignout" class="secondary full">Logg ut</button><p id="betaStatus" class="sub">${esc(message)}</p>`));$('#createHouse').onclick=createHouse;$('#joinHouse').onclick=joinHouse;$('#betaSignout').onclick=()=>logout()}
async function createHouse(){status('Oppretter husholdning…');hydrated=false;const {data,error}=await sb.rpc('create_household',{p_name:$('#houseName').value.trim()||'Vårt hjem'});if(error){status(error.message,true);return}await loadContext();const starter=cleanStarterState(myName());applying=true;try{bridge()?.setState?.(starter)}finally{applying=false}try{const saved=await persistRevisionState(sharedState(),serverState,serverRevision);serverState=cloneShared(saved.state);serverRevision=saved.revision;clientBaseState=cloneShared(saved.state);ctx={...ctx,state:cloneShared(saved.state),revision:saved.revision}}catch(saveError){console.error('HverdagsOss initial save failed:',saveError);status('Husholdningen ble opprettet, men startoppsettet kunne ikke lagres. Prøv igjen.',true);return}hydrated=true;inviteScreen(ctx?.household?.invite_code||data?.[0]?.invite_code||'',ctx?.household?.invite_expires_at,'setup')}
function formatInviteExpiry(value){const date=new Date(value||0);if(!Number.isFinite(date.getTime()))return'';return new Intl.DateTimeFormat('nb-NO',{dateStyle:'medium',timeStyle:'short'}).format(date)}
function inviteScreen(code,expiresAt=ctx?.household?.invite_expires_at,after='app'){const expiry=formatInviteExpiry(expiresAt),expired=expiresAt&&new Date(expiresAt).getTime()<=Date.now(),shown=expired?'Utløpt':code||'Ingen aktiv kode';showGate(shell(`<div class="ey" style="margin-top:16px">Inviter partner</div><h2 style="margin:8px 0">Del koden når det passer</h2><p class="sub">Partneren bruker koden for å bli med. Du kan starte alene nå.</p><div class="card hero" style="text-align:center"><div class="ey">Invitasjonskode</div><div style="font-size:30px;font-weight:900;letter-spacing:.1em;margin:10px 0;overflow-wrap:anywhere">${esc(shown)}</div>${expiry?`<div class="taskmeta">${expired?'Utløpt':'Gyldig til'} ${esc(expiry)}</div>`:''}</div><button id="rotateInvite" class="secondary full">Lag ny invitasjonskode</button><button id="continueSetup" class="primary full" style="margin-top:10px">Fortsett uten partner</button><p id="betaStatus" class="sub">Koden kan brukes én gang og utløper automatisk etter sju dager.</p>`));$('#rotateInvite').onclick=()=>rotateInviteCode(after);$('#continueSetup').onclick=()=>{hydrated=true;if(after==='setup')openHouseSetup(false);else showApp()}}
async function rotateInviteCode(after='app'){const button=$('#rotateInvite');if(button)button.disabled=true;status('Lager ny kode…');const {data,error}=await sb.rpc('rotate_household_invite',{});if(error){status('Kunne ikke lage ny kode akkurat nå.',true);bridge()?.toast?.('Kunne ikke lage ny kode akkurat nå');if(button)button.disabled=false;return null}await loadContext();const result=Array.isArray(data)?data[0]:data,code=result?.invite_code||ctx?.household?.invite_code,expires=result?.expires_at||ctx?.household?.invite_expires_at;inviteScreen(code,expires,after);return{invite_code:code,expires_at:expires}}
async function joinHouse(){const code=$('#joinCode').value.trim().toUpperCase().replace(/[^A-F0-9]/g,'');if(code.length<8){status('Skriv inn invitasjonskoden.',true);return}status('Kobler til…');hydrated=false;const {data,error}=await sb.rpc('join_household_v2',{p_code:code});if(error){status('Kunne ikke koble til akkurat nå.',true);return}if(!data?.ok){hydrated=false;const message=data?.error==='rate_limited'?'For mange forsøk. Vent litt før du prøver igjen.':data?.error==='already_member'?'Kontoen er allerede koblet til en husholdning.':'Koden er ugyldig eller har utløpt.';status(message,true);return}await loadContext();applyRemote();hydrated=true;reviewPartnerSetup()}
function reviewPartnerSetup(){const p=partnerMember();const s=ctx?.state||{};const tasks=Array.isArray(s.tasks)?s.tasks:[];showGate(shell(`<div class="ey" style="margin-top:16px">Dere er koblet</div><h2 style="margin:8px 0">Klart til å starte sammen</h2><p class="sub">${esc(p?.display_name||'Partneren din')} har satt opp husholdningen. Se raskt gjennom det som er valgt.</p><div class="card hero"><strong>${esc(ctx?.household?.name||'Vårt hjem')}</strong><p class="sub">${tasks.length} valgte gjøremål</p></div><p class="sub">Dere kan endre gjøremål og områder senere.</p><button id="reviewSetup" class="primary full">Se oppsett og start</button>`));$('#reviewSetup').onclick=()=>{hydrated=true;openHouseSetup(true)}}
function openHouseSetup(joiner){showApp();let tries=0;const open=()=>{if(window.FlytSetupV2?.open){window.FlytSetupV2.open(1);if(joiner)bridge()?.toast?.('Se gjennom og juster oppsettet før dere starter');return true}const b=$('#setupBtnV2,#setupBtn');if(b){b.click();if(joiner)bridge()?.toast?.('Se gjennom og juster oppsettet før dere starter');return true}return false};if(open())return;const timer=setInterval(()=>{if(open()||++tries>40)clearInterval(timer)},50)}
function rememberServerContext(){serverRevision=Math.max(0,Number(ctx?.revision)||0);serverState=cloneShared(ctx?.state||{})}
async function loadContext(){const {data,error}=await sb.rpc('get_my_flyt_context');if(error)throw error;ctx=data;if(!myMember()?.display_name&&authName){try{await sb.rpc('set_my_display_name',{p_name:authName});const retry=await sb.rpc('get_my_flyt_context');if(!retry.error)ctx=retry.data}catch(e){}}rememberServerContext();return ctx}
function myMember(){return ctx?.members?.find(m=>m.id===ctx?.user_id)||null}function myName(){return String(myMember()?.display_name||authName||'Meg').trim()||'Meg'}function partnerMember(){return ctx?.members?.find(m=>m.id!==ctx?.user_id)||null}
function syncInfo(){if(!ctx?.household)return{label:'Inviter',detail:'Inviter partneren din for delt hverdag.'};if(saving)return{label:'Lagrer…',detail:'Endringene lagres nå.'};if(syncError)return{label:navigator.onLine===false?'Venter på nett':'Ikke lagret',detail:navigator.onLine===false?'Endringene er trygt beholdt på denne enheten til dere er på nett igjen.':'Endringene kunne ikke lagres. Trykk for å prøve igjen.'};if(dirty)return{label:navigator.onLine===false?'Venter på nett':'Lagrer…',detail:navigator.onLine===false?'Endringene er trygt beholdt på denne enheten til dere er på nett igjen.':'Endringene venter på å bli lagret.'};return{label:'Lagret',detail:lastSavedAt?'Endringene er synkronisert.':'Koblet til partneren din.'}}
function updateSyncButton(){const syn=$('#syncBtn'),p=partnerMember();if(!syn)return;const info=syncInfo();syn.textContent=p?info.label:'Inviter';syn.title=p?info.detail:'Inviter partneren din';syn.setAttribute('aria-label',p?`${info.label}. ${info.detail}`:'Inviter partneren din');syn.onclick=()=>p?connectionSheet():inviteScreen(ctx?.household?.invite_code||'',ctx?.household?.invite_expires_at)}
function updateChrome(){const me=myMember(),p=partnerMember(),sw=$('#switchUser');if(sw){sw.textContent=p?`${myName()} + ${p.display_name}`:myName();sw.disabled=true}updateSyncButton();const lock=$('#lock');if(lock){lock.textContent='Logg ut';lock.onclick=()=>logout()}}
function ensureSheet(){if($('#syncModal'))return;const el=document.createElement('div');el.id='syncModal';el.className='syncModal hidden';el.style.zIndex='280';el.innerHTML='<div class="syncSheet" role="dialog" aria-modal="true" aria-labelledby="syncTitle"><div class="row"><div class="grow"><div class="ey">Par-kobling</div><h2 id="syncTitle" style="margin:4px 0">HverdagsOss sammen</h2></div><button id="syncClose" class="pill">Lukk</button></div><div id="syncBody" style="margin-top:16px"></div></div>';document.body.appendChild(el);$('#syncClose').onclick=()=>el.classList.add('hidden')}
function connectionSheet(){ensureSheet();const p=partnerMember(),info=syncInfo(),retry=syncError?'<button id="syncRetry" class="primary full" style="margin-top:10px">Prøv igjen</button>':'';$('#syncBody').innerHTML=`<div class="card hero"><strong>Dere er koblet</strong><p class="sub">${esc(myName())} og ${esc(p?.display_name||'partner')} deler ${esc(ctx?.household?.name||'samme husholdning')}.</p></div><div class="card"><div class="ey">Synkronisering</div><strong>${esc(info.label)}</strong><p class="sub" style="margin:6px 0 0">${esc(info.detail)}</p></div>${retry}<button id="syncNow" class="secondary full" style="margin-top:10px">Synkroniser nå</button><button id="syncAccount" class="secondary full" style="margin-top:10px">Administrer partnerkobling</button>`;$('#syncRetry')?.addEventListener('click',retrySave);$('#syncNow').onclick=async()=>{if(dirty)await retrySave();if(!dirty&&await pull(true)){bridge()?.toast?.('HverdagsOss er oppdatert')}else if(dirty){bridge()?.toast?.('Endringene må lagres før appen kan synkroniseres')}connectionSheet()};$('#syncAccount').onclick=()=>{$('#syncModal')?.classList.add('hidden');window.FlytAccountUI?.open?.()};$('#syncModal').classList.remove('hidden')}
function forgetSharedState(){clearPrivateLocalData();clearTimeout(saveTimer);clearInterval(pollTimer);dirty=false;saving=false;syncError=false;hydrated=false;resetRevisionState();applying=true;try{bridge()?.setState?.(cleanStarterState(myName()))}finally{applying=false}}
function handleDisconnected(message='Partnerkoblingen er avsluttet. Dere deler ikke lenger data.'){forgetSharedState();ctx={...(ctx||{}),household:null,members:[],state:{},revision:0};$('#syncModal')?.classList.add('hidden');householdScreen(message)}
function restoreActiveModule(view){if(view==='home'&&window.FlytHomeUI?.render){window.FlytHomeUI.render();return}if((view==='seen'||view==='us')&&window.FlytSeenUI?.render){window.FlytSeenUI.render({resetScroll:false});return}if(view==='tasks'&&window.FlytRecurrenceUI?.render){window.FlytRecurrenceUI.render({resetScroll:false});return}if(view==='tasks'&&window.FlytTasksUI?.render){window.FlytTasksUI.render()}}
function applyRemote(){
  if(!serverState||!Object.keys(serverState).length||!bridge()||uiBusy())return false;
  const local=bridge().getState(),localShared=sharedState(),view=local.view||'home';
  const target=clientBaseState===null||!dirty?cloneShared(serverState):mergeShared(clientBaseState,localShared,serverState);
  if(sameShared(target,localShared)){clientBaseState=cloneShared(serverState);return true}
  const merged={...local,...target,user:myName(),view},normalized=window.FlytTaskLanguage?.normalizeState?.(merged)||merged,normalizedShared=cloneShared(normalized);delete normalizedShared.user;delete normalizedShared.view;
  const migrated=!sameShared(target,normalizedShared);
  applying=true;
  try{bridge().setState(normalized);clientBaseState=cloneShared(serverState);setTimeout(()=>restoreActiveModule(view),0);if(migrated)setTimeout(queueSave,0);return true}catch(e){console.error('Flyt remote state ignored:',e);return false}finally{applying=false}
}
async function pull(force=false){if(!ctx?.household||!hydrated)return false;if((dirty||saving)&&!force)return false;const previousHouseholdId=ctx.household.id;try{await loadContext();if(previousHouseholdId&&!ctx?.household){handleDisconnected();return true}applyRemote();updateChrome();return true}catch(e){return false}}
async function persistRevisionState(state,base=serverState,revision=serverRevision){
  const saver=window.FlytSyncMerge?.saveWithRevision;
  if(typeof saver!=='function')throw new Error('SYNC_MERGE_UNAVAILABLE');
  return saver({base,state,revision,maxAttempts:5,save:async(candidate,expectedRevision)=>{
    const {data,error}=await sb.rpc('save_my_flyt_state_v2',{p_data:candidate,p_expected_revision:expectedRevision});
    if(error)throw error;
    return data;
  }});
}
async function push(){
  if(applying||!ctx?.household||!hydrated||saving)return false;
  const startLocal=sharedState(),base=cloneShared(clientBaseState===null?serverState:clientBaseState),candidate=mergeShared(base,startLocal,serverState),startRevision=serverRevision;
  saving=true;syncError=false;updateChrome();
  try{
    const saved=await persistRevisionState(candidate,serverState,startRevision);
    serverState=cloneShared(saved.state);serverRevision=saved.revision;ctx={...ctx,state:cloneShared(saved.state),revision:saved.revision};lastSavedAt=Date.now();
    const changedWhileSaving=!sameShared(sharedState(),startLocal);
    dirty=changedWhileSaving;
    if(!uiBusy()){
      if(changedWhileSaving)dirty=true;
      applyRemote();
    }else if(sameShared(saved.state,startLocal))clientBaseState=cloneShared(saved.state);
    if(changedWhileSaving)setTimeout(queueSave,0);
    return true;
  }catch(e){
    const previousHouseholdId=ctx?.household?.id;
    try{await loadContext();if(previousHouseholdId&&!ctx?.household){handleDisconnected();return false}}catch(contextError){}
    console.error('HverdagsOss save failed:',e);dirty=true;syncError=true;return false
  }finally{saving=false;updateChrome()}
}
async function retrySave(){clearTimeout(saveTimer);if(!dirty){syncError=false;updateChrome();return true}return push()}
function queueSave(){if(applying||!ctx?.household||!hydrated)return;dirty=true;syncError=false;updateChrome();clearTimeout(saveTimer);saveTimer=setTimeout(push,650)}
function startPolling(){clearInterval(pollTimer);pollTimer=setInterval(()=>pull(false),5000)}
function reconcileWhenSafe(){if(hydrated&&!dirty&&!saving&&!uiBusy())applyRemote()}
const AUTH_BOOTSTRAP_TIMEOUT_MS=10000;
async function getSessionWithTimeout(){let timeoutId;try{return await Promise.race([sb.auth.getSession(),new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(new Error('AUTH_BOOTSTRAP_TIMEOUT')),AUTH_BOOTSTRAP_TIMEOUT_MS)})])}finally{clearTimeout(timeoutId)}}
async function bootstrap(){hydrated=false;clearTimeout(saveTimer);dirty=false;resetRevisionState();ensureBetaUi();let session=null;try{const r=await getSessionWithTimeout();session=r.data.session;authName=String(session?.user?.user_metadata?.display_name||session?.user?.user_metadata?.name||authName||'').trim()}catch(e){if(localModeEnabled())showLocalApp();else authChoice(e?.message==='AUTH_BOOTSTRAP_TIMEOUT'?'Innloggingen tok for lang tid. Prøv igjen.':'Kunne ikke hente kontoen. Prøv igjen.');return}if(!session){if(localModeEnabled())showLocalApp();else authChoice();return}setLocalMode(false);try{await loadContext()}catch(e){loginScreen('Kunne ikke hente kontoen. Logg inn på nytt.');return}if(ctx?.requires_consent){window.FlytAccountUI?.checkConsent?.();return}if(!ctx?.household){householdScreen();return}try{applyRemote()}catch(e){console.error('Flyt startup sync ignored:',e)}hydrated=true;showApp();startPolling();window.FlytAccountUI?.checkConsent?.()}
window.FlytSync={queueSave,pull,retrySave,bootstrap,logout,clearPrivateLocalData,showLogin:(message='')=>authChoice(message),myName,rpc:(name,args)=>sb.rpc(name,args),getContext:()=>ctx,isReady:()=>hydrated,isSummaryReady,openConnection:connectionSheet,rotateInviteCode,handleDisconnected};
ensureBetaUi();
window.addEventListener('DOMContentLoaded',bootstrap);
window.addEventListener('offline',updateChrome);
window.addEventListener('online',async()=>{if(dirty)await retrySave();if(!dirty)await pull(true);updateChrome()});
document.addEventListener('focusout',()=>setTimeout(reconcileWhenSafe,0),true);
document.addEventListener('pointerup',()=>setTimeout(reconcileWhenSafe,0),true);
})();
