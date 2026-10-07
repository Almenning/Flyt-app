(function(){
'use strict';
if(window.LARIA_SAFE_CHALLENGE?.release==='challenge-rc1')return;

const RELEASE='challenge-rc1';
const PARAM='challenge';
const SUBJECT_LABELS={geography:'Geografi',norwegian:'Norsk',math:'Matte',english:'Engelsk'};
const ALLOWED_SUBJECTS=new Set(Object.keys(SUBJECT_LABELS));
const ALLOWED_TYPES=new Set(['flag','capital','country','continent','map','learning-choice','build-word','sentence-order','number-input','sequence-order']);
let currentPayload=null;
let incomingPayload=null;

function cleanText(value,max=500){
  return String(value??'').slice(0,max).replaceAll('<','‹').replaceAll('>','›').replaceAll('&','＆');
}
function cleanId(value,max=80){
  const s=String(value??'').slice(0,max);
  return /^[A-Za-z0-9:_-]+$/.test(s)?s:'';
}
function cloneSafeQuestion(source){
  if(!source||typeof source!=='object')return null;
  const type=cleanId(source.type,40);
  if(!ALLOWED_TYPES.has(type))return null;
  const q={type,practiceRepeat:true};
  if(source.subject!==undefined){
    const subject=cleanId(source.subject,24);
    if(!ALLOWED_SUBJECTS.has(subject)||subject==='geography')return null;
    q.subject=subject;
    q.skill=cleanId(source.skill,80)||'challenge';
    q.curriculum=cleanText(source.curriculum||'',40)||null;
  }else{
    q.k=cleanId(source.k,40);
    if(!q.k)return null;
  }
  q.prompt=cleanText(source.prompt,650);
  q.answer=cleanText(source.answer,180);
  if(!q.prompt||q.answer==='')return null;
  if(source.visual!==undefined)q.visual=cleanText(source.visual,80);
  if(source.passage!==undefined)q.passage=cleanText(source.passage,1200);
  if(source.mapRegion!==undefined)q.mapRegion=cleanText(source.mapRegion,80);
  if(Array.isArray(source.options)){
    q.options=source.options.slice(0,6).map(x=>cleanText(x,180));
    if(q.options.length<2||!q.options.includes(q.answer))return null;
  }
  if(Array.isArray(source.mapIds)){
    q.mapIds=source.mapIds.slice(0,180).map(x=>cleanId(x,40)).filter(Boolean);
    if(!q.mapIds.length)return null;
  }
  if(Array.isArray(source.letters)){
    q.letters=source.letters.slice(0,40).map((x,i)=>({l:cleanText(x?.l,4),id:Number.isFinite(Number(x?.id))?Number(x.id):i})).filter(x=>x.l);
    if(!q.letters.length)return null;
  }
  if(Array.isArray(source.words)){
    q.words=source.words.slice(0,30).map(x=>cleanText(x,120));
    if(q.words.length<2)return null;
  }
  if(Array.isArray(source.items)){
    q.items=source.items.slice(0,30).map(x=>cleanText(x,120));
    if(q.items.length<2)return null;
  }
  if(type==='learning-choice'&&!q.options)return null;
  if(type==='map'&&!q.mapIds)return null;
  if(type==='build-word'&&!q.letters)return null;
  if(type==='sentence-order'&&!q.words)return null;
  if(type==='sequence-order'&&!q.items)return null;
  return q;
}
function newId(){
  try{return 'lc-'+Array.from(crypto.getRandomValues(new Uint32Array(3))).map(x=>x.toString(36)).join('-')}
  catch(_){return 'lc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
}
function encodePayload(payload){
  const bytes=new TextEncoder().encode(JSON.stringify(payload));
  let bin='';for(const b of bytes)bin+=String.fromCharCode(b);
  return btoa(bin).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function decodePayload(encoded){
  if(typeof encoded!=='string'||!encoded||encoded.length>24000)return null;
  try{
    let b64=encoded.replaceAll('-','+').replaceAll('_','/');
    while(b64.length%4)b64+='=';
    const bin=atob(b64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch(_){return null}
}
function validatePayload(raw){
  if(!raw||raw.v!==1||!ALLOWED_SUBJECTS.has(raw.subject)||!Array.isArray(raw.questions)||raw.questions.length!==5)return null;
  const grade=Math.max(1,Math.min(10,Number(raw.grade)||0));if(!grade)return null;
  const questions=raw.questions.map(cloneSafeQuestion);
  if(questions.some(q=>!q))return null;
  const id=cleanId(raw.id,80);if(!id)return null;
  return {v:1,id,grade,subject:raw.subject,label:SUBJECT_LABELS[raw.subject],questions,createdAt:Number(raw.createdAt)||Date.now()};
}
function challengeUrl(payload){
  const u=new URL(location.href);
  u.hash='';
  u.search='';
  u.searchParams.set('app','laria');
  u.searchParams.set(PARAM,encodePayload(payload));
  return u.toString();
}
function ensureHistory(){
  if(!Array.isArray(state.challengeHistory))state.challengeHistory=[];
}
function saveHistory(item){
  ensureHistory();
  const i=state.challengeHistory.findIndex(x=>x&&x.id===item.id&&x.direction===item.direction);
  const next={...item,at:Number(item.at)||Date.now()};
  if(i>=0)state.challengeHistory[i]={...state.challengeHistory[i],...next};else state.challengeHistory.unshift(next);
  state.challengeHistory=state.challengeHistory.slice(0,20);
  saveState();
}
function buildQuestions(subject){
  let raw=[];
  if(subject==='geography'){
    if(typeof buildGradeMissionQuestions==='function')raw=buildGradeMissionQuestions();
  }else{
    if(typeof buildLearningQuestions==='function')raw=buildLearningQuestions(subject,null,true);
    if(raw.length<5&&typeof subjectPoolForGrade==='function'&&typeof topUpSessionQuestions==='function'){
      raw=topUpSessionQuestions(raw,subjectPoolForGrade(subject,currentGrade(),null),5);
    }
  }
  const safe=(raw||[]).map(cloneSafeQuestion).filter(Boolean).slice(0,5);
  if(safe.length!==5)return null;
  return safe;
}
function createPayload(subject){
  const questions=buildQuestions(subject);if(!questions)return null;
  const payload={v:1,id:newId(),grade:currentGrade(),subject,label:SUBJECT_LABELS[subject],questions,createdAt:Date.now()};
  currentPayload=payload;
  saveHistory({id:payload.id,direction:'sent',subject,grade:payload.grade,at:payload.createdAt});
  return payload;
}
function style(){
  if(document.getElementById('safe-challenge-style'))return;
  const el=document.createElement('style');el.id='safe-challenge-style';
  el.textContent=[
    '#safe-challenge-dialog{width:min(540px,calc(100% - 24px));max-height:min(88dvh,820px);overflow:auto;border:0;border-radius:30px;padding:0;background:#fffaf0;color:#24314b;box-shadow:0 28px 80px rgba(29,39,64,.3)}',
    '#safe-challenge-dialog::backdrop{background:rgba(28,37,56,.52);backdrop-filter:blur(5px)}',
    '.sc-shell{padding:24px}.sc-head{display:flex;gap:14px;align-items:flex-start}.sc-icon{width:58px;height:58px;border-radius:19px;background:#fff0bf;display:grid;place-items:center;font-size:30px;flex:0 0 auto}.sc-head-copy{flex:1}.sc-kicker{font-size:11px;letter-spacing:.11em;text-transform:uppercase;font-weight:950;color:#7b6cc4}.sc-shell h2{margin:5px 0 6px;font-size:27px}.sc-shell p{font-size:14px;line-height:1.5}.sc-close{border:0;background:#eeeafe;color:#5d55ac;border-radius:14px;width:44px;height:44px;font-size:22px;font-weight:900}',
    '.sc-safety{margin:16px 0;padding:12px 14px;border-radius:17px;background:#eaf8f0;color:#35634f;font-size:12px;font-weight:800}.sc-subjects{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin:15px 0}.sc-subject{min-height:50px;border:2px solid #e4e4ef;background:white;border-radius:17px;color:#24314b;font-weight:900}.sc-subject[aria-pressed="true"]{border-color:#7588ef;background:#eef1ff;color:#4257b5}',
    '.sc-link-wrap{display:grid;gap:8px;margin:14px 0}.sc-link{width:100%;border:2px solid #e5e3ef;border-radius:15px;padding:12px;background:#fff;color:#596078;font-size:12px}.sc-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.sc-primary,.sc-secondary{min-height:50px;border-radius:17px;font-weight:950}.sc-primary{border:0;background:#667ff4;color:white;box-shadow:0 5px 0 #4f63ca}.sc-secondary{border:2px solid #e2e3ed;background:#fff;color:#38445f}.sc-actions .wide{grid-column:1/-1}',
    '.sc-status{min-height:20px;margin:9px 0 0;color:#55715f;font-size:12px;font-weight:800}.sc-history{margin-top:18px;padding-top:15px;border-top:2px dashed #e7e3d8}.sc-history h3{font-size:15px;margin:0 0 8px}.sc-history-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;font-size:12px;color:#6c7390}.sc-history-row b{color:#38445f}',
    '.safe-challenge-entry{width:100%;margin:20px 0 8px;border:2px solid #fff;border-radius:25px;padding:18px;background:linear-gradient(145deg,#fff3c9,#f3efff);color:#24314b;text-align:left;box-shadow:0 8px 0 rgba(70,72,115,.06),0 14px 26px rgba(65,64,104,.08);display:flex;align-items:center;gap:14px}.safe-challenge-entry span:first-child{font-size:31px}.safe-challenge-entry strong{display:block;font-size:17px}.safe-challenge-entry small{display:block;color:#6c7390;margin-top:3px;font-weight:750}',
    '.bc12-nav.safe-has-challenge{grid-template-columns:repeat(5,1fr);left:9%;width:82%}.bc12-nav .safe-challenge-young{background:transparent;color:#f6e3c5;border:0;border-radius:15px;min-height:55px;font-size:12px;font-weight:750;display:flex;justify-content:center;align-items:center;gap:7px}.bc12-nav .safe-challenge-young span{font-size:28px;color:#f1cc97}',
    '@media(max-width:520px){.sc-shell{padding:19px}.sc-shell h2{font-size:23px}.sc-actions{grid-template-columns:1fr}.sc-actions .wide{grid-column:auto}.bc12-nav.safe-has-challenge{left:2%;width:96%;padding:4px}.bc12-nav.safe-has-challenge button{font-size:9px!important;gap:2px!important;min-height:50px!important}.bc12-nav.safe-has-challenge button span{font-size:22px!important}}'
  ].join('');
  document.head.appendChild(el);
}
function ensureDialog(){
  let d=document.getElementById('safe-challenge-dialog');if(d)return d;
  d=document.createElement('dialog');d.id='safe-challenge-dialog';d.dataset.release=RELEASE;
  d.innerHTML='<div class="sc-shell"><div class="sc-head"><div class="sc-icon" aria-hidden="true">⚡</div><div class="sc-head-copy"><div class="sc-kicker">Trygg utfordring</div><h2 id="sc-title">Utfordre noen</h2><p id="sc-copy"></p></div><button class="sc-close" id="sc-close" type="button" aria-label="Lukk">×</button></div><div class="sc-safety">Fem identiske spørsmål. Ingen chat, feed, kontaktliste eller søkbare profiler.</div><div class="sc-subjects" id="sc-subjects"></div><div id="sc-summary"></div><div class="sc-link-wrap" id="sc-link-wrap"><label for="sc-link" class="sc-kicker">Delingslenke</label><input class="sc-link" id="sc-link" readonly></div><div class="sc-actions"><button class="sc-primary wide" id="sc-share" type="button">Del utfordringen</button><button class="sc-secondary" id="sc-start" type="button">Prøv selv</button><button class="sc-secondary" id="sc-new" type="button">Ny runde</button></div><div class="sc-status" id="sc-status" aria-live="polite"></div><div class="sc-history" id="sc-history"></div></div>';
  document.body.appendChild(d);
  d.querySelector('#sc-close').onclick=()=>closeDialog();
  d.addEventListener('cancel',e=>{e.preventDefault();closeDialog()});
  d.addEventListener('click',e=>{if(e.target===d)closeDialog()});
  d.querySelector('#sc-share').onclick=shareCurrent;
  d.querySelector('#sc-start').onclick=()=>{if(currentPayload)startChallenge(currentPayload,currentPayload===incomingPayload?'received':'sent')};
  d.querySelector('#sc-new').onclick=()=>openCreate('geography',true);
  return d;
}
function openModal(d){
  try{if(!d.open)d.showModal()}catch(_){d.setAttribute('open','')}
}
function closeDialog(){const d=document.getElementById('safe-challenge-dialog');if(!d)return;try{d.close()}catch(_){d.removeAttribute('open')}}
function setStatus(text){const el=document.getElementById('sc-status');if(el)el.textContent=text||''}
function renderHistory(){
  const host=document.getElementById('sc-history');if(!host)return;
  ensureHistory();host.replaceChildren();
  const title=document.createElement('h3');title.textContent='På denne enheten';host.appendChild(title);
  const rows=state.challengeHistory.slice(0,4);
  if(!rows.length){const p=document.createElement('p');p.textContent='Ingen utfordringer ennå.';host.appendChild(p);return}
  rows.forEach(x=>{
    const row=document.createElement('div');row.className='sc-history-row';
    const left=document.createElement('span');left.textContent=(x.direction==='played'?'Spilt':'Laget')+' · '+(SUBJECT_LABELS[x.subject]||'Læring');
    const right=document.createElement('b');right.textContent=Number.isFinite(Number(x.score))?Number(x.score)+'/5':Number(x.grade)+'. trinn';
    row.append(left,right);host.appendChild(row);
  });
}
function renderSubjects(active){
  const host=document.getElementById('sc-subjects');host.replaceChildren();
  Object.entries(SUBJECT_LABELS).forEach(([id,label])=>{
    const b=document.createElement('button');b.type='button';b.className='sc-subject';b.dataset.subject=id;b.textContent=label;b.setAttribute('aria-pressed',id===active?'true':'false');
    b.onclick=()=>openCreate(id,true);host.appendChild(b);
  });
}
function fillPayload(payload,mode){
  const d=ensureDialog();currentPayload=payload;
  const incoming=mode==='incoming';
  document.getElementById('sc-title').textContent=incoming?'Du har fått en utfordring':'Utfordre noen';
  document.getElementById('sc-copy').textContent=incoming?'Dere får nøyaktig de samme fem spørsmålene. Resultatet lagres bare på denne enheten.':'Velg fag og del en direkte lenke. Mottakeren får nøyaktig de samme fem spørsmålene.';
  const subjects=document.getElementById('sc-subjects');subjects.hidden=incoming;
  if(!incoming)renderSubjects(payload.subject);
  const summary=document.getElementById('sc-summary');summary.textContent='';
  const box=document.createElement('div');box.className='sc-safety';box.textContent=(payload.label||SUBJECT_LABELS[payload.subject])+' · '+payload.grade+'. klasse · 5 spørsmål';summary.appendChild(box);
  const linkWrap=document.getElementById('sc-link-wrap');linkWrap.hidden=incoming;
  const share=document.getElementById('sc-share');share.hidden=incoming;
  const start=document.getElementById('sc-start');start.textContent=incoming?'Start 5 spørsmål':'Prøv selv';
  document.getElementById('sc-new').hidden=incoming;
  if(!incoming)document.getElementById('sc-link').value=challengeUrl(payload);
  setStatus(incoming?'Ingen melding eller kontaktinformasjon følger med utfordringen.':'');
  renderHistory();openModal(d);
}
function openCreate(subject='geography',forceNew=false){
  const id=ALLOWED_SUBJECTS.has(subject)?subject:'geography';
  if(!forceNew&&currentPayload&&currentPayload.subject===id&&currentPayload!==incomingPayload){fillPayload(currentPayload,'create');return}
  const payload=createPayload(id);
  if(!payload){toast('Fant ikke fem trygge spørsmål i dette faget akkurat nå. Prøv et annet fag.');return}
  incomingPayload=null;fillPayload(payload,'create');
}
function startChallenge(payload,direction){
  const valid=validatePayload(payload);if(!valid){setStatus('Denne utfordringen kan ikke åpnes.');return}
  currentPayload=valid;closeDialog();
  const qs=valid.questions.map(q=>({...q,practiceRepeat:true}));
  sessionScope={type:'challenge',subject:valid.subject==='geography'?'geography':valid.subject,label:'Utfordring · '+valid.label,grade:valid.grade,challengeId:valid.id,practiceOnly:true};
  sessionQuestions=qs;qIndex=0;sessionCorrect=0;sessionStrengthened=new Set();currentAnswered=null;
  state.activeSession={startedAt:Date.now()};persistActiveSession();
  saveHistory({id:valid.id,direction:direction==='received'?'played':'sent',subject:valid.subject,grade:valid.grade,at:Date.now()});
  showScreen('session');renderQuestion();
}
async function shareCurrent(){
  if(!currentPayload)return;
  const url=challengeUrl(currentPayload),shareData={title:'Læria-utfordring',text:'Fem spørsmål. Samme runde til begge.',url};
  try{
    if(navigator.share){await navigator.share(shareData);setStatus('Utfordringen er klar til å sendes.');return}
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setStatus('Lenken er kopiert.');return}
  }catch(err){if(err?.name==='AbortError')return}
  const input=document.getElementById('sc-link');input.focus();input.select();setStatus('Kopier lenken og send den direkte.');
}
function injectEntries(){
  const home=document.getElementById('home-screen');
  if(home&&!document.getElementById('safe-challenge-entry')){
    const entry=document.createElement('button');entry.type='button';entry.id='safe-challenge-entry';entry.className='safe-challenge-entry';
    entry.innerHTML='<span aria-hidden="true">⚡</span><span><strong>Utfordre noen</strong><small>5 like spørsmål · direkte deling · ingen chat</small></span>';
    entry.onclick=()=>incomingPayload?fillPayload(incomingPayload,'incoming'):openCreate('geography');
    const adult=document.getElementById('adult-entry');home.insertBefore(entry,adult||null);
  }
  const nav=document.querySelector('.bc12-nav');
  if(nav&&!nav.querySelector('.safe-challenge-young')){
    nav.classList.add('safe-has-challenge');
    const b=document.createElement('button');b.type='button';b.className='safe-challenge-young';b.setAttribute('aria-label','Utfordre noen med fem spørsmål');b.innerHTML='<span aria-hidden="true">⚡</span>Utfordre';
    b.onclick=e=>{e.preventDefault();incomingPayload?fillPayload(incomingPayload,'incoming'):openCreate('geography')};nav.appendChild(b);
  }
}
function parseIncoming(){
  const raw=new URL(location.href).searchParams.get(PARAM);if(!raw)return null;
  return validatePayload(decodePayload(raw));
}
function maybeOpenIncoming(){
  const payload=parseIncoming();if(!payload)return;
  incomingPayload=payload;currentPayload=payload;
  const seenKey='laria-challenge-opened-'+payload.id;
  const openWhenReady=()=>{
    const onboarding=document.getElementById('onboarding');
    if(onboarding?.classList.contains('show'))return false;
    injectEntries();
    if(!sessionStorage.getItem(seenKey)){sessionStorage.setItem(seenKey,'1');fillPayload(payload,'incoming')}
    return true;
  };
  if(openWhenReady())return;
  const observer=new MutationObserver(()=>{if(openWhenReady())observer.disconnect()});
  const onboarding=document.getElementById('onboarding');if(onboarding)observer.observe(onboarding,{attributes:true,attributeFilter:['class']});
}
function wrapCompletion(){
  if(typeof finishSession==='function'&&!finishSession.__safeChallengeWrapped){
    const base=finishSession;
    const wrapped=function(){
      const challenge=sessionScope?.type==='challenge'?{id:sessionScope.challengeId,subject:sessionScope.subject,grade:sessionScope.grade,score:sessionCorrect}:null;
      const result=base.apply(this,arguments);
      if(challenge){
        saveHistory({id:challenge.id,direction:'played',subject:challenge.subject,grade:challenge.grade,score:challenge.score,at:Date.now()});
        const copy=document.getElementById('complete-copy');if(copy)copy.textContent='Utfordringen er fullført. Denne runden var øving og endret ikke mestring eller dagens mål.';
        const learned=document.getElementById('complete-learned');if(learned)learned.textContent='–';
        const area=document.getElementById('complete-area');if(area)area.textContent='Utfordring · '+(SUBJECT_LABELS[challenge.subject]||'Læring');
        const next=document.getElementById('complete-next');if(next)next.textContent='Du fikk '+challenge.score+'/5. Den andre spilleren får de samme fem spørsmålene.';
        const title=document.getElementById('young-reward-title');if(title)title.textContent=challenge.score===5?'Full pott! ⚡':'Utfordring fullført! ⚡';
        const rc=document.getElementById('young-reward-copy');if(rc)rc.textContent='Resultatet ligger bare på denne enheten.';
        const home=document.getElementById('complete-home');if(home)home.textContent='Til Hjem';
      }
      return result;
    };
    wrapped.__safeChallengeWrapped=true;finishSession=wrapped;
  }
  const home=document.getElementById('complete-home');
  if(home&&!home.dataset.safeChallengeBound){
    home.dataset.safeChallengeBound='true';
    home.addEventListener('click',e=>{
      if(lastCompletedScope?.type!=='challenge')return;
      e.preventDefault();e.stopImmediatePropagation();setTab('home');
    },true);
  }
  const close=document.getElementById('close-session');
  if(close&&!close.dataset.safeChallengeBound){
    close.dataset.safeChallengeBound='true';
    close.addEventListener('click',e=>{
      if(sessionScope?.type!=='challenge')return;
      e.preventDefault();e.stopImmediatePropagation();state.activeSession=null;saveState();setTab('home');
    },true);
  }
}
function init(){
  style();ensureDialog();injectEntries();wrapCompletion();maybeOpenIncoming();
  const prior=window.renderAll;
  if(typeof prior==='function'&&!prior.__safeChallengeWrapped){
    const wrapped=function(){const r=prior.apply(this,arguments);injectEntries();return r};wrapped.__safeChallengeWrapped=true;window.renderAll=wrapped;
  }
  window.LARIA_SAFE_CHALLENGE={
    release:RELEASE,
    create:subject=>createPayload(subject),
    encode:payload=>encodePayload(validatePayload(payload)),
    decode:encoded=>validatePayload(decodePayload(encoded)),
    start:payload=>startChallenge(payload,'received'),
    open:()=>incomingPayload?fillPayload(incomingPayload,'incoming'):openCreate('geography'),
    get current(){return currentPayload}
  };
  document.documentElement.dataset.safeChallengeRelease=RELEASE;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();