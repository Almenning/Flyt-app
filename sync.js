(()=>{
'use strict';
const SUPABASE_URL='https://uopzveejnztbovncqbpq.supabase.co';
const SUPABASE_KEY='sb_publishable_uK6xd8TJhN2MY10qHSQ2GQ_7hSIr2gv';
const HOUSE_KEY='flyt_household_token_v1';
const REV_KEY='flyt_household_revision_v1';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let householdToken=localStorage.getItem(HOUSE_KEY)||'';
let revision=Number(localStorage.getItem(REV_KEY)||0);
let saveTimer=null,pollTimer=null,applyingRemote=false;

function bridge(){return window.FlytBridge}
function currentLocal(){return bridge()?.getState?.()||null}
function sharedState(){
  const s=structuredClone(currentLocal()||{});
  delete s.user; delete s.view;
  return s;
}
function applyShared(remote){
  if(!remote||!bridge()) return;
  const local=currentLocal()||{};
  applyingRemote=true;
  bridge().setState({...local,...remote,user:local.user||'Tore',view:local.view||'home'});
  applyingRemote=false;
}
async function invoke(body){
  const {data,error}=await sb.functions.invoke('flyt-sync',{body});
  if(error) throw error;
  return data;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showToast(t){bridge()?.toast?.(t)}
function ensureUi(){
  if(document.getElementById('syncModal')) return;
  const el=document.createElement('div');
  el.id='syncModal';
  el.className='syncModal hidden';
  el.innerHTML=`<div class="syncSheet"><div class="row"><div class="grow"><div class="ey">Par-kobling</div><h2 style="margin:4px 0 0">Synkroniser Flyt</h2></div><button id="syncClose" class="pill">Lukk</button></div><div id="syncBody" style="margin-top:16px"></div></div>`;
  document.body.appendChild(el);
  document.getElementById('syncClose').onclick=()=>el.classList.add('hidden');
  document.getElementById('syncBtn')?.addEventListener('click',()=>openSync());
}
function authForm(msg=''){
  return `<div class="card"><strong>1. Konto</strong><p class="sub">Begge trenger hver sin konto for å få tilgang til samme husholdning.</p>${msg?`<p class="sub">${esc(msg)}</p>`:''}<input id="syncEmail" class="field" type="email" placeholder="E-post"><input id="syncPassword" class="field" type="password" minlength="6" placeholder="Passord, minst 6 tegn"><div class="grid2"><button id="syncSignup" class="secondary">Opprett konto</button><button id="syncSignin" class="primary">Logg inn</button></div></div>`
}
async function renderSync(message=''){
  ensureUi(); const body=document.getElementById('syncBody');
  const {data:{session}}=await sb.auth.getSession();
  if(!session){body.innerHTML=authForm(message);bindAuth();return}
  if(!householdToken){
    body.innerHTML=`<div class="card"><strong>Innlogget</strong><p class="sub">${esc(session.user.email||'Konto klar')}</p></div><div class="card"><strong>Opprett husholdning</strong><p class="sub">Gjør dette på den første telefonen. Du får en seks-sifret kode til partneren.</p><button id="createHouse" class="primary full">Opprett husholdning fra denne Flyt-en</button></div><div class="card"><strong>Koble til partner</strong><p class="sub">Bruk koden som vises på den andre telefonen.</p><input id="joinCode" class="field" inputmode="numeric" maxlength="6" placeholder="6-sifret kode"><button id="joinHouse" class="secondary full">Koble til</button></div><button id="syncSignout" class="secondary full">Logg ut</button>${message?`<p class="sub">${esc(message)}</p>`:''}`;
    document.getElementById('createHouse').onclick=createHouse;
    document.getElementById('joinHouse').onclick=joinHouse;
    document.getElementById('syncSignout').onclick=async()=>{await sb.auth.signOut();householdToken='';localStorage.removeItem(HOUSE_KEY);renderSync()};
    return;
  }
  body.innerHTML=`<div class="card hero"><strong>Flyt er koblet</strong><p class="sub">Endringer på én telefon synkroniseres med den andre.</p><div class="tag">Husholdning aktiv</div></div><div class="card"><strong>Status</strong><p class="sub" id="syncStatus">Sjekker partner…</p><button id="syncNow" class="secondary full">Synkroniser nå</button></div><button id="syncSignout" class="secondary full">Logg ut av konto</button>${message?`<p class="sub">${esc(message)}</p>`:''}`;
  document.getElementById('syncNow').onclick=()=>pull(true);
  document.getElementById('syncSignout').onclick=async()=>{await sb.auth.signOut();renderSync('Du er logget ut. Husholdningskoblingen ligger fortsatt på enheten.')};
  pull(false);
}
function bindAuth(){
  document.getElementById('syncSignup').onclick=async()=>{
    const email=document.getElementById('syncEmail').value.trim(),password=document.getElementById('syncPassword').value;
    const {data,error}=await sb.auth.signUp({email,password});
    if(error){renderSync(error.message);return}
    if(data.session) renderSync('Konto opprettet og innlogget.'); else renderSync('Konto opprettet. Bekreft e-posten hvis Supabase ber om det, og logg deretter inn.');
  };
  document.getElementById('syncSignin').onclick=async()=>{
    const email=document.getElementById('syncEmail').value.trim(),password=document.getElementById('syncPassword').value;
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error){renderSync(error.message);return} renderSync('Innlogging vellykket.');
  };
}
async function createHouse(){
  try{
    const data=await invoke({action:'create',state:sharedState()});
    householdToken=data.householdToken;revision=Number(data.revision||0);
    localStorage.setItem(HOUSE_KEY,householdToken);localStorage.setItem(REV_KEY,String(revision));
    document.getElementById('syncBody').innerHTML=`<div class="card hero"><div class="ey">Koblingskode</div><div style="font-size:42px;font-weight:900;letter-spacing:.12em;margin:8px 0">${esc(data.joinCode)}</div><p class="sub">Åpne Flyt på partnerens telefon, logg inn med partnerens egen konto og skriv inn denne koden. Koden varer i 24 timer.</p><button id="doneCode" class="primary full">Ferdig</button></div>`;
    document.getElementById('doneCode').onclick=()=>renderSync(); startPolling();
  }catch(e){renderSync('Kunne ikke opprette husholdning: '+(e.message||e))}
}
async function joinHouse(){
  const joinCode=document.getElementById('joinCode').value.replace(/\D/g,'').slice(0,6);
  try{
    const data=await invoke({action:'join',joinCode});
    householdToken=data.householdToken;revision=Number(data.revision||0);
    localStorage.setItem(HOUSE_KEY,householdToken);localStorage.setItem(REV_KEY,String(revision));
    applyShared(data.state); showToast('Dere er koblet sammen'); renderSync('Par-koblingen er aktiv.'); startPolling();
  }catch(e){renderSync('Kunne ikke koble til: '+(e.message||e))}
}
async function pull(show=false){
  if(!householdToken) return;
  try{
    const data=await invoke({action:'get',householdToken});
    if(Number(data.revision)>revision){revision=Number(data.revision);localStorage.setItem(REV_KEY,String(revision));applyShared(data.state);if(show)showToast('Flyt er oppdatert')}
    const s=document.getElementById('syncStatus');if(s)s.textContent=data.partnerJoined?'Partner er koblet til · synk aktiv':'Venter på at partner kobler seg til';
  }catch(e){if(show)showToast('Synk feilet')}
}
async function push(){
  if(!householdToken||applyingRemote) return;
  try{
    const data=await invoke({action:'save',householdToken,state:sharedState(),baseRevision:revision});
    revision=Number(data.revision);localStorage.setItem(REV_KEY,String(revision));
  }catch(e){await pull(false)}
}
function queueSave(){if(!householdToken||applyingRemote)return;clearTimeout(saveTimer);saveTimer=setTimeout(push,700)}
function startPolling(){clearInterval(pollTimer);if(householdToken)pollTimer=setInterval(()=>pull(false),5000)}
async function openSync(){ensureUi();document.getElementById('syncModal').classList.remove('hidden');await renderSync()}
window.FlytSync={queueSave,openSync,pull};
window.addEventListener('DOMContentLoaded',()=>{ensureUi();startPolling()});
})();