(()=>{
'use strict';
const VERSION='20260831-1200';
const DAY_MS=86400000;
const ARCHIVE_MS=90*DAY_MS;
const RECENT_MS=3*DAY_MS;
const CONTRIBUTION_GRACE_MS=DAY_MS;
const THANKS=['Takk, det hjalp ❤️','Det gjorde dagen lettere'];
const TYPE_LABEL={need:'Behov',wish:'Ønske',practical:'Praktisk'};
const $=selector=>document.querySelector(selector);
const bridge=()=>window.FlytBridge;
const couple=()=>window.FlytCoupleCore;
let painting=false,requestModalOpen=false,actionMenuOpen=false,archiveOpen=false,flowModalOpen=false,pruneQueued=false;

if(!window.FlytStatusAlert?.version?.startsWith?.('20260830-1945')&&!document.querySelector('script[data-flyt-status-alert-1945]')){
  const script=document.createElement('script');
  script.src='./status-alert-ui.js?v=20260830-1945';
  script.defer=true;
  script.dataset.flytStatusAlert1945='1';
  document.head.appendChild(script);
}
function state(){return bridge()?.getState?.()||null}
function save(next){bridge()?.setState?.(next);window.FlytSync?.queueSave?.()}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function stamp(value){
  if(value==null)return 0;
  if(typeof value==='number')return value;
  const number=Number(value);
  if(Number.isFinite(number)&&number>0)return number;
  const date=new Date(value).getTime();
  return Number.isFinite(date)?date:0;
}
function partnerName(s){
  const context=window.FlytSync?.getContext?.(),member=context?.members?.find(item=>String(item.id)!==String(context?.user_id));
  return member?.display_name||Object.keys(s?.points||{}).find(name=>name!==s?.user)||'partneren din';
}
function allRequests(s){return Array.isArray(s?.seenRequests)?s.seenRequests:[]}
function manualWork(s){return (Array.isArray(s?.work)?s.work:[]).filter(item=>item?.source==='manual')}
function requestState(request){
  if(couple()?.requestState)return couple().requestState(request);
  if(request?.deleted)return'withdrawn';
  if(request?.done)return'completed';
  if(request?.declinedAt)return'declined';
  if(request?.counter?.status==='pending')return'countered';
  if(request?.acceptedBy)return'accepted';
  return'pending';
}
function requestActive(request){return !!request&&['pending','countered','accepted'].includes(requestState(request))}
function requestArchiveAt(request){return stamp(request?.doneAt||request?.declinedAt||request?.deletedAt||request?.createdAt||request?.id)}
function contributionArchived(work,now=Date.now()){return !!work?.seen&&now-stamp(work.seenAt||work.createdAt||work.id)>=CONTRIBUTION_GRACE_MS}
function activeRequests(s){return allRequests(s).filter(requestActive).sort((a,b)=>stamp(b.createdAt||b.id)-stamp(a.createdAt||a.id))}
function activeContributions(s){const now=Date.now();return manualWork(s).filter(item=>!contributionArchived(item,now)).sort((a,b)=>stamp(b.createdAt||b.id)-stamp(a.createdAt||a.id))}
function recentRequests(s){const cutoff=Date.now()-RECENT_MS;return allRequests(s).filter(request=>requestState(request)==='completed'&&requestArchiveAt(request)>=cutoff).sort((a,b)=>requestArchiveAt(b)-requestArchiveAt(a))}
function archivedEntries(s,excluded=new Set()){
  const now=Date.now(),requests=allRequests(s).filter(request=>!requestActive(request)&&!excluded.has(String(request.id))).map(item=>({kind:'request',item,at:requestArchiveAt(item)})),work=manualWork(s).filter(item=>contributionArchived(item,now)).map(item=>({kind:'work',item,at:stamp(item.seenAt||item.createdAt||item.id)}));
  return [...requests,...work].sort((a,b)=>b.at-a.at);
}
function pruneState(s){
  const cutoff=Date.now()-ARCHIVE_MS,seenRequests=allRequests(s).filter(request=>requestActive(request)||requestArchiveAt(request)>=cutoff),work=(Array.isArray(s?.work)?s.work:[]).filter(item=>item?.source!=='manual'||!contributionArchived(item)||stamp(item.seenAt||item.createdAt||item.id)>=cutoff);
  if(seenRequests.length===allRequests(s).length&&work.length===(s.work||[]).length)return null;
  return {...s,seenRequests,work};
}
function queuePrune(){if(pruneQueued)return;pruneQueued=true;queueMicrotask(()=>{pruneQueued=false;const current=state(),next=current&&pruneState(current);if(next)save(next)})}

function statusLabel(request,s){
  const status=requestState(request),mine=request.by===s.user;
  if(status==='pending')return mine?'Venter på svar':'Ny';
  if(status==='countered')return mine?'Motforslag mottatt':'Motforslag sendt';
  if(status==='accepted')return request.source==='initiative'?`${request.acceptedBy||request.by} tar den`:`Tatt av ${request.acceptedBy||partnerName(s)}`;
  if(status==='completed')return'Utført ✓';
  if(status==='declined')return'Passet ikke';
  if(status==='withdrawn')return request.source==='initiative'?'Avsluttet':'Trukket tilbake';
  return status;
}
function requestTag(request){if(request.source==='initiative')return'Initiativ';if(request.taskId!=null)return'Forespørsel';return TYPE_LABEL[request.type]||'Behov'}
function replyMarkup(request){
  const replies=Array.isArray(request.replies)?request.replies.slice(-3):[];
  if(!replies.length)return'';
  return `<div style="margin-top:11px;display:grid;gap:7px">${replies.map(reply=>`<div style="padding:9px 11px;border-radius:13px;background:#fff7f2;border:1px solid #f0ddd3"><div class="taskmeta" style="margin:0 0 3px">${esc(reply.by)}</div><div style="line-height:1.4">${esc(reply.text)}</div></div>`).join('')}</div>`;
}
function counterMarkup(request){
  if(!request.counter||request.counter.status!=='pending')return'';
  return `<div style="margin-top:12px;padding:12px 13px;border-radius:15px;background:#fff4ec;border:1px solid #efcfc2"><div class="ey">Motforslag fra ${esc(request.counter.by)}</div><strong style="display:block;margin-top:5px">${esc(request.counter.taskName)}</strong>${request.counter.text?`<p style="margin:7px 0 0;line-height:1.4">${esc(request.counter.text)}</p>`:''}</div>`;
}
function appreciationMarkup(s,request){
  if(request.appreciationText){
    const unseen=request.appreciationBy!==s.user&&!(request.appreciationSeenBy||[]).includes(s.user);
    return `<div style="margin-top:12px;padding:12px 13px;border-radius:15px;background:#f8eee9;border:1px solid #ecd4ca"><div class="ey">Et lite takk fra ${esc(request.appreciationBy||'partneren')}</div><strong style="display:block;margin-top:5px;font-size:16px">${esc(request.appreciationText)}</strong>${unseen?`<button type="button" class="small" data-thanks-seen="${esc(request.id)}" style="margin-top:9px">Takk mottatt</button>`:''}</div>`;
  }
  if(!couple()?.canThank?.(request,s.user))return'';
  return `<div style="margin-top:12px;padding:12px 13px;border-radius:15px;background:#fff7f2;border:1px solid #efddd4"><strong>Send et lite takk?</strong><p class="sub" style="font-size:13px;margin:4px 0 10px">Frivillig og kort. Ingen vurdering, bare anerkjennelse.</p><div style="display:flex;gap:7px;flex-wrap:wrap"><button type="button" class="small" data-request-thanks="${esc(request.id)}|0">${THANKS[0]}</button><button type="button" class="small" data-request-thanks="${esc(request.id)}|1">${THANKS[1]}</button><button type="button" class="small" data-request-thanks-custom="${esc(request.id)}">Skriv selv</button></div></div>`;
}
function requestActions(s,request,{archived=false}={}){
  if(archived)return'';
  const mine=request.by===s.user,status=requestState(request),initiative=request.source==='initiative',linked=request.taskId!=null,buttons=[];
  if(initiative){
    if(mine&&status==='accepted')buttons.push(`<button type="button" class="primary grow" data-request-done="${esc(request.id)}">Utført</button>`);
    if(!mine&&!request.seen)buttons.push(`<button type="button" class="secondary grow" data-request-seen="${esc(request.id)}">Jeg så det</button>`);
  }else if(linked){
    if(mine&&status==='countered'){
      buttons.push(`<button type="button" class="primary grow" data-counter-accept="${esc(request.id)}">Godta byttet</button>`);
      buttons.push(`<button type="button" class="secondary grow" data-counter-keep="${esc(request.id)}">Behold opprinnelig</button>`);
    }else if(!mine&&status==='pending'){
      buttons.push(`<button type="button" class="primary grow" data-request-accept="${esc(request.id)}">Jeg tar den</button>`);
      buttons.push(`<button type="button" class="secondary" data-request-counter="${esc(request.id)}">Foreslå annet</button>`);
      buttons.push(`<button type="button" class="small" data-request-decline="${esc(request.id)}">Passer ikke</button>`);
      buttons.push(`<button type="button" class="small" data-request-reply="${esc(request.id)}">Svar</button>`);
    }else if(!mine&&status==='accepted'&&request.acceptedBy===s.user){
      buttons.push(`<button type="button" class="primary grow" data-request-done="${esc(request.id)}">Utført</button>`);
      buttons.push(`<button type="button" class="small" data-request-reply="${esc(request.id)}">Svar</button>`);
    }else if(requestActive(request)&&Array.isArray(request.replies)&&request.replies.length){
      buttons.push(`<button type="button" class="small" data-request-reply="${esc(request.id)}">Svar kort</button>`);
    }
  }else if(!mine){
    if(!request.seen)buttons.push(`<button type="button" class="small" data-request-seen="${esc(request.id)}">Sett</button>`);
    buttons.push(`<button type="button" class="secondary grow" data-request-reply="${esc(request.id)}">Svar</button>`);
    buttons.push(`<button type="button" class="primary grow" data-request-done="${esc(request.id)}">Ordnet</button>`);
  }
  return buttons.length?`<div class="row" style="margin-top:12px;flex-wrap:wrap">${buttons.join('')}</div>`:'';
}
function requestCard(s,request,{archived=false}={}){
  const mine=request.by===s.user,initiative=request.source==='initiative',menu=mine?`<button type="button" class="small" data-item-menu="request|${esc(request.id)}" aria-label="Flere valg">•••</button>`:'',headline=initiative?`${request.by} tar ${request.taskName||request.text}`:request.text;
  return `<div class="card" data-seen-request-card="${esc(request.id)}" style="${initiative?'border-color:#e0dac6;background:linear-gradient(145deg,#fffef9,#f8f5e9)':''}"><div class="row" style="align-items:flex-start"><div class="grow"><div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap"><span class="tag">${esc(requestTag(request))}</span><span class="tag" style="${requestState(request)==='completed'?'background:#edf1e5;color:#607644':''}">${esc(statusLabel(request,s))}</span></div><strong style="display:block;margin-top:9px;font-size:17px;line-height:1.38">${esc(headline)}</strong>${request.taskName&&!initiative?`<div class="taskmeta" style="margin-top:6px">Knyttet til: ${esc(request.taskName)}</div>`:''}<div class="taskmeta" style="margin-top:5px">${initiative?`Synlig initiativ fra ${esc(request.by)}`:`Fra ${esc(request.by||'')}`}</div></div>${menu}</div>${counterMarkup(request)}${replyMarkup(request)}${requestActions(s,request,{archived})}${appreciationMarkup(s,request)}</div>`;
}
function contributionCard(s,work,{archived=false}={}){
  const mine=work.by===s.user,menu=mine?`<button type="button" class="small" data-item-menu="work|${esc(work.id)}" aria-label="Flere valg">•••</button>`:'';
  return `<div class="card row"><div class="grow"><strong>${esc(work.title)}</strong><div class="taskmeta">${esc(work.by||'')}${archived?' · Arkivert etter at det ble sett':''}</div></div>${archived?'<span class="tag">Sett ✓</span>':mine?(work.seen?'<span class="tag">Sett ✓</span>':'<span class="taskmeta">Ikke sett ennå</span>'):(work.seen?'<span class="tag">Sett ✓</span>':`<button type="button" class="small" data-seen-ack="${esc(work.id)}">Jeg så det</button>`)}${menu}</div>`;
}
function monthKey(at){const date=new Date(at||Date.now());return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`}
function monthLabel(key){const [year,month]=key.split('-').map(Number),date=new Date(year,month-1,1);return new Intl.DateTimeFormat('nb-NO',{month:'long',year:'numeric'}).format(date).replace(/^./,char=>char.toUpperCase())}
function archiveMarkup(s,excluded){
  const entries=archivedEntries(s,excluded);
  if(!entries.length)return `<div class="section"><button type="button" class="secondary full" data-archive-toggle="1">Arkiv</button></div>`;
  const groups=new Map();
  for(const entry of entries){const key=monthKey(entry.at);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(entry)}
  const body=[...groups.entries()].map(([key,list])=>`<div class="section" style="margin-top:16px"><div class="ey">${esc(monthLabel(key))}</div>${list.map(entry=>entry.kind==='request'?requestCard(s,entry.item,{archived:true}):contributionCard(s,entry.item,{archived:true})).join('')}</div>`).join('');
  return `<div class="section"><button type="button" class="secondary full" data-archive-toggle="1">${archiveOpen?'Skjul':'Vis'} arkiv (${entries.length})</button>${archiveOpen?`<p class="sub" style="margin:10px 2px 0">Ferdige ting ligger her i opptil 90 dager. Deretter slettes detaljene automatisk.</p>${body}`:''}</div>`;
}
function render(){
  const s=state(),content=$('#content');
  if(!s||!content||s.view!=='seen')return;
  painting=true;
  const active=activeRequests(s),recent=recentRequests(s),contributions=activeContributions(s),excluded=new Set(recent.map(request=>String(request.id))),partner=partnerName(s);
  content.dataset.flytOwner='seen-active-archive';
  content.innerHTML=`<div class="ey">Sett</div><h1 class="title">Gjør det enkelt å si og svare</h1><p class="sub">Konkrete forespørsler, tydelige svar og små initiativ – uten at Flyt prøver å analysere forholdet deres.</p>${recent.length?`<div class="section"><div class="ey">Nylig mellom dere</div><p class="sub">Utførte avtaler blir liggende her noen dager, slik at et lite takk ikke forsvinner i farten.</p>${recent.map(request=>requestCard(s,request,{archived:true})).join('')}</div>`:''}<div class="section"><div class="ey">Forespørsler og initiativ</div><p class="sub">${esc(partner)} kan ta oppgaven, foreslå en annen, si at det ikke passer eller svare kort. Når en oppgave er tatt, blir den synlig som en liten avtale.</p>${active.length?active.map(request=>requestCard(s,request)).join(''):'<div class="card"><strong>Ingenting venter på svar</strong><p class="sub">Vær konkret før den andre må gjette. Det er ofte nok.</p></div>'}<button type="button" id="seenAddRequest" class="primary full">+ Legg inn behov eller ønske</button></div><div class="section"><div class="ey">Det som ellers ikke blir sett</div><p class="sub">Planlegging og andre bidrag som lett går ubemerket hen. Dette er anerkjennelse, ikke et regnskap over hvem som er best.</p>${contributions.length?contributions.map(work=>contributionCard(s,work)).join(''):'<div class="card"><strong>Ingenting som venter på anerkjennelse</strong><p class="sub">Legg bare inn noe som faktisk kan være lett å overse.</p></div>'}<button type="button" id="seenAdd" class="secondary full">+ Legg til bidrag</button></div>${archiveMarkup(s,excluded)}`;
  document.querySelectorAll('#nav button').forEach(button=>button.classList.toggle('on',button.dataset.view==='seen'));
  painting=false;
  queuePrune();
  window.FlytSeenRequestAlert?.updateBadge?.();
}

function closeRequestModal(){requestModalOpen=false;$('#seenRequestModal')?.remove()}
function openRequestModal(){
  if(requestModalOpen)return;
  const s=state();if(!s)return;
  requestModalOpen=true;
  let type='need';
  const element=document.createElement('div');
  element.id='seenRequestModal';
  element.style.cssText='position:fixed;inset:0;z-index:170;background:#3a211b88;display:flex;align-items:center;justify-content:center;padding:22px';
  element.innerHTML=`<div role="dialog" aria-modal="true" style="width:min(390px,100%);background:#fffaf7;border:1px solid #ead8d0;border-radius:26px;padding:22px;box-shadow:0 24px 70px #3b211b55"><div class="ey">Sett</div><h2 style="font:500 28px/1.12 Georgia;margin:10px 0 8px">Hva vil du gjøre tydelig?</h2><p class="sub" style="margin-top:0">Skriv et konkret behov eller ønske, ikke en test den andre må bestå.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0"><button type="button" class="primary" data-request-type="need">Behov</button><button type="button" class="secondary" data-request-type="wish">Ønske</button><button type="button" class="secondary" data-request-type="practical">Praktisk</button></div><label class="label" for="seenRequestText">Hva trenger eller ønsker du?</label><textarea id="seenRequestText" rows="4" maxlength="600" placeholder="F.eks. Jeg trenger at du tar leggingen i kveld" style="width:100%;resize:vertical;min-height:110px;border:1px solid #ead8d0;border-radius:15px;background:#fff;padding:12px 14px;font:inherit;color:inherit;outline:none;margin-top:6px"></textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button type="button" id="seenRequestCancel" class="secondary">Avbryt</button><button type="button" id="seenRequestSave" class="primary">Legg inn</button></div></div>`;
  document.body.appendChild(element);
  const buttons=[...element.querySelectorAll('[data-request-type]')],text=element.querySelector('#seenRequestText'),paintTypes=()=>buttons.forEach(button=>button.className=button.dataset.requestType===type?'primary':'secondary');
  buttons.forEach(button=>button.onclick=()=>{type=button.dataset.requestType;paintTypes()});
  element.querySelector('#seenRequestCancel').onclick=closeRequestModal;
  element.addEventListener('click',event=>{if(event.target===element)closeRequestModal()});
  element.querySelector('#seenRequestSave').onclick=()=>{
    const value=text.value.trim(),fresh=state();
    if(!value){text.focus();text.style.borderColor='#e87961';return}
    if(!fresh)return;
    const now=Date.now(),item={id:`req_${now}`,kind:'message',type,text:value,by:fresh.user,createdAt:now,responseState:'pending',seen:false,seenBy:null,seenAt:null,done:false,doneBy:null,doneAt:null,deleted:false,deletedAt:null,replies:[]};
    save({...fresh,seenRequests:[item,...allRequests(fresh)]});
    closeRequestModal();queueMicrotask(render);bridge()?.toast?.(`${TYPE_LABEL[type]||'Behov'} delt`);
  };
  setTimeout(()=>text.focus(),40);
}

function closeFlowModal(){flowModalOpen=false;$('#seenFlowModal')?.remove()}
function openCounterModal(id){
  if(flowModalOpen)return;
  const s=state(),request=allRequests(s).find(item=>String(item.id)===String(id));
  if(!s||!request||request.by===s.user||requestState(request)!=='pending')return;
  const fromNudges=window.FlytNudgeUI?.core?.remainingTasks?.(s,new Date())||[],fallback=(s.tasks||[]).filter(task=>task?.kind==='house'),tasks=(fromNudges.length?fromNudges:fallback).filter(task=>String(task.id)!==String(request.taskId));
  if(!tasks.length){bridge()?.toast?.('Ingen andre åpne gjøremål å foreslå');return}
  flowModalOpen=true;
  const element=document.createElement('div');
  element.id='seenFlowModal';
  element.style.cssText='position:fixed;inset:0;z-index:345;background:#3a211b99;display:flex;align-items:center;justify-content:center;padding:20px';
  element.innerHTML=`<div role="dialog" aria-modal="true" style="width:min(410px,100%);background:#fffaf7;border:1px solid var(--line);border-radius:27px;padding:22px;box-shadow:0 28px 80px #3b211b55"><div class="ey">Motforslag</div><h2 style="font:500 28px/1.12 Georgia;margin:9px 0 7px">Kan du ta noe annet?</h2><p class="sub" style="margin-top:0">Foreslå ett konkret gjøremål. Den opprinnelige forespørselen blir stående til ${esc(request.by)} svarer.</p><label class="label" for="seenCounterTask">Annet gjøremål</label><select id="seenCounterTask" class="field">${tasks.map(task=>`<option value="${esc(task.id)}">${esc(task.name)}</option>`).join('')}</select><label class="label" for="seenCounterText">Kort beskjed (valgfritt)</label><input id="seenCounterText" class="field" maxlength="220" placeholder="F.eks. Jeg rekker denne bedre i dag"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button type="button" class="secondary" data-flow-cancel="1">Avbryt</button><button type="button" class="primary" data-flow-counter-send="${esc(id)}">Send motforslag</button></div></div>`;
  document.body.appendChild(element);
  element.addEventListener('click',event=>{if(event.target===element)closeFlowModal()});
}

function updateRequest(id,mutator){
  const s=state();if(!s)return null;
  const requests=allRequests(s).map(item=>({...item})),index=requests.findIndex(item=>String(item.id)===String(id));
  if(index<0)return null;
  const before=requests[index],next=mutator(before,s);
  if(!next||next===before)return null;
  requests[index]=next;save({...s,seenRequests:requests});queueMicrotask(render);return next;
}
function markRequestSeen(id){updateRequest(id,(request,s)=>request.by===s.user||!requestActive(request)?request:(couple()?.markSeen?.(request,s.user)||{...request,seen:true,seenBy:s.user,seenAt:request.seenAt||new Date().toISOString()}))}
function acceptRequest(id){const result=updateRequest(id,(request,s)=>couple()?.acceptRequest?.(request,s.user)||request);if(result&&requestState(result)==='accepted')bridge()?.toast?.(`${result.taskName||'Gjøremålet'} er ditt`)}
async function declineRequest(id){
  const s=state(),request=allRequests(s).find(item=>String(item.id)===String(id));if(!s||!request||request.by===s.user)return;
  const yes=window.FlytModal?.confirm?await window.FlytModal.confirm({ey:'Svar på forespørsel',title:'Passer det ikke denne gangen?',text:'Forespørselen avsluttes tydelig for dere begge. Ingen nye påminnelser sendes.',ok:'Det passer ikke'}):false;
  if(!yes)return;updateRequest(id,(item,current)=>couple()?.declineRequest?.(item,current.user)||item);bridge()?.toast?.('Svaret er sendt');
}
async function replyToRequest(id){
  const s=state(),request=allRequests(s).find(item=>String(item.id)===String(id));if(!s||!request||!requestActive(request))return;
  const text=window.FlytModal?.prompt?await window.FlytModal.prompt({ey:'Kort svar',title:'Svar i samme kontekst',text:'Hold det kort og konkret. Flyt er ikke ment som en generell chat.',label:'Svar',placeholder:'F.eks. Jeg rekker det etter middag',ok:'Send svar'}):null;
  if(!text?.trim())return;updateRequest(id,(item,current)=>couple()?.replyToRequest?.(item,current.user,text)||item);bridge()?.toast?.('Svaret er sendt');
}
function sendCounter(id){
  const taskId=$('#seenCounterTask')?.value,text=$('#seenCounterText')?.value.trim(),s=state(),task=(s?.tasks||[]).find(item=>String(item.id)===String(taskId));if(!s||!task)return;
  const result=updateRequest(id,(request,current)=>couple()?.counterRequest?.(request,current.user,task,text)||request);
  if(result&&requestState(result)==='countered'){closeFlowModal();bridge()?.toast?.('Motforslaget er sendt')}
}
function acceptCounter(id){const result=updateRequest(id,(request,s)=>couple()?.acceptCounter?.(request,s.user)||request);if(result&&requestState(result)==='accepted')bridge()?.toast?.(`${result.taskName} er avtalt`)}
function keepOriginal(id){const result=updateRequest(id,(request,s)=>couple()?.keepOriginalRequest?.(request,s.user)||request);if(result&&requestState(result)==='pending')bridge()?.toast?.('Den opprinnelige forespørselen står')}
function localDate(){const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function finishRequest(id){
  const s=state(),requests=allRequests(s).map(item=>({...item})),index=requests.findIndex(item=>String(item.id)===String(id));if(!s||index<0)return;
  const before=requests[index],after=couple()?.completeRequest?.(before,s.user)||before;if(after===before||requestState(after)!=='completed')return;
  requests[index]=after;
  let next={...s,seenRequests:requests},registered=false,task=(s.tasks||[]).find(item=>String(item.id)===String(after.taskId));
  if(task){
    const day=localDate(),already=task.type==='daily'&&(s.completions||[]).some(completion=>completion.date===day&&String(completion.taskId)===String(task.id));
    if(!already){
      const now=Date.now(),points={...(s.points||{})},personalPoints=Number(task.pts||0),housePoints=task.kind==='house'?personalPoints:Math.round(personalPoints*.2),completion={id:now,taskId:task.id,date:day,by:s.user,kind:task.kind,housePts:housePoints,registeredAt:after.doneAt,taskSnapshot:{name:task.name,cat:task.cat,pts:task.pts,type:task.type,kind:task.kind}};
      points[s.user]=(points[s.user]||0)+personalPoints;requests[index]={...after,completionId:now};next={...next,seenRequests:requests,points,completions:[...(s.completions||[]),completion]};registered=true;
    }
  }
  save(next);queueMicrotask(render);bridge()?.toast?.(registered?`${task.name} registrert · +${task.pts||0} poeng`:'Flyttet til nylig');
}
function sendThanks(id,text){const result=updateRequest(id,(request,s)=>couple()?.addThanks?.(request,s.user,text)||request);if(result?.appreciationText){bridge()?.toast?.('Takket er sendt');window.FlytSeenRequestAlert?.checkAlerts?.()}}
async function sendCustomThanks(id){const text=window.FlytModal?.prompt?await window.FlytModal.prompt({ey:'Et lite takk',title:'Hva vil du si?',text:'Kort og ekte er mer enn nok.',label:'Takk',placeholder:'F.eks. Takk, det ga meg litt pusterom ❤️',ok:'Send'}):null;if(text?.trim())sendThanks(id,text)}
function markThanksSeen(id){updateRequest(id,(request,s)=>couple()?.markThanksSeen?.(request,s.user)||request)}

function closeActionMenu(){actionMenuOpen=false;$('#seenItemMenu')?.remove()}
function openActionMenu(kind,id){
  if(actionMenuOpen)closeActionMenu();
  const s=state();if(!s)return;
  const item=kind==='request'?allRequests(s).find(entry=>String(entry.id)===String(id)):manualWork(s).find(entry=>String(entry.id)===String(id));if(!item||item.by!==s.user)return;
  const request=kind==='request',active=request&&requestActive(item),canWithdraw=request&&(couple()?.canWithdrawRequest?.(item,s.user)??(active&&!item.acceptedBy)),initiative=request&&item.source==='initiative'&&active,canDelete=!request||(couple()?.canDeleteRequest?.(item,s.user)??!active);
  actionMenuOpen=true;
  const element=document.createElement('div');element.id='seenItemMenu';element.style.cssText='position:fixed;inset:0;z-index:350;background:#3a211b66;display:flex;align-items:flex-end;justify-content:center;padding:14px';
  const locked=request&&active&&!canWithdraw&&!initiative;
  element.innerHTML=`<div role="dialog" aria-modal="true" style="width:min(420px,100%);background:#fffaf7;border:1px solid var(--line);border-radius:24px;padding:12px;box-shadow:0 24px 70px #3b211b44">${canWithdraw?'<button type="button" class="secondary full" data-menu-withdraw="1" style="margin-bottom:8px">Trekk tilbake</button>':''}${initiative?'<button type="button" class="secondary full" data-menu-cancel-initiative="1" style="margin-bottom:8px">Avslutt initiativ</button>':''}${locked?'<p class="sub" style="margin:8px 10px 14px">Forespørselen kan ikke forsvinne stille etter et svar eller motforslag.</p>':''}${canDelete?'<button type="button" class="secondary full" data-menu-delete="1" style="color:#a43c32">Slett permanent</button>':''}<button type="button" class="small full" data-menu-close="1" style="margin-top:10px;min-height:42px">Lukk</button></div>`;
  document.body.appendChild(element);
  element.addEventListener('click',async event=>{if(event.target===element||event.target.closest('[data-menu-close]')){closeActionMenu();return}if(event.target.closest('[data-menu-withdraw]')){closeActionMenu();await withdrawRequest(id);return}if(event.target.closest('[data-menu-cancel-initiative]')){closeActionMenu();await cancelInitiative(id);return}if(event.target.closest('[data-menu-delete]')){closeActionMenu();await deleteItem(kind,id)}});
}
async function withdrawRequest(id){
  const s=state(),request=allRequests(s).find(item=>String(item.id)===String(id));
  if(!s||!request||!(couple()?.canWithdrawRequest?.(request,s.user)??(request.by===s.user&&requestActive(request)&&!request.acceptedBy))){bridge()?.toast?.('Forespørselen har fått svar og kan ikke trekkes stille tilbake');return}
  const yes=window.FlytModal?.confirm?await window.FlytModal.confirm({ey:'Sett',title:'Trekke tilbake?',text:'Partneren vil se at forespørselen ble trukket tilbake.',ok:'Trekk tilbake'}):false;if(!yes)return;
  updateRequest(id,item=>({...item,deleted:true,deletedAt:new Date().toISOString(),deletedBy:s.user,responseState:'withdrawn'}));bridge()?.toast?.('Flyttet til arkiv');
}
async function cancelInitiative(id){
  const s=state(),request=allRequests(s).find(item=>String(item.id)===String(id));if(!s||!request||request.by!==s.user||request.source!=='initiative'||!requestActive(request))return;
  const yes=window.FlytModal?.confirm?await window.FlytModal.confirm({ey:'Initiativ',title:'Avslutte initiativet?',text:'Det forsvinner ikke stille. Partneren vil se at initiativet ble avsluttet.',ok:'Avslutt'}):false;if(!yes)return;
  updateRequest(id,item=>({...item,deleted:true,deletedAt:new Date().toISOString(),deletedBy:s.user,responseState:'withdrawn'}));bridge()?.toast?.('Initiativet er avsluttet');
}
async function deleteItem(kind,id){
  const s=state();if(!s)return;
  const item=kind==='request'?allRequests(s).find(entry=>String(entry.id)===String(id)):manualWork(s).find(entry=>String(entry.id)===String(id));if(!item||item.by!==s.user)return;
  if(kind==='request'&&!(couple()?.canDeleteRequest?.(item,s.user)??!requestActive(item))){bridge()?.toast?.('Aktive avtaler kan ikke slettes permanent');return}
  const yes=window.FlytModal?.confirm?await window.FlytModal.confirm({ey:'Sett',title:'Slette permanent?',text:'Dette fjernes for begge og kan ikke angres.',ok:'Slett'}):false;if(!yes)return;
  if(kind==='request')save({...s,seenRequests:allRequests(s).filter(entry=>String(entry.id)!==String(id))});else save({...s,work:(s.work||[]).filter(entry=>String(entry.id)!==String(id))});
  queueMicrotask(render);bridge()?.toast?.('Slettet');
}

document.addEventListener('click',async event=>{
  const target=event.target,match=selector=>target.closest?.(selector),stop=()=>{event.preventDefault();event.stopImmediatePropagation()};
  const flowCancel=match('[data-flow-cancel]');if(flowCancel){stop();closeFlowModal();return}
  const counterSend=match('[data-flow-counter-send]');if(counterSend){stop();sendCounter(counterSend.dataset.flowCounterSend);return}
  const nav=match('#nav button[data-view="seen"]');if(nav){stop();const s=state();if(s){const requests=allRequests(s).map(request=>couple()?.markRequestUpdatesSeen?.(request,s.user)||request);save({...s,seenRequests:requests,view:'seen'});queueMicrotask(render)}return}
  if(state()?.view!=='seen')return;
  const archive=match('[data-archive-toggle]');if(archive){stop();archiveOpen=!archiveOpen;render();return}
  const menu=match('[data-item-menu]');if(menu){stop();const [kind,id]=String(menu.dataset.itemMenu).split('|');openActionMenu(kind,id);return}
  const addRequest=match('#seenAddRequest');if(addRequest){stop();openRequestModal();return}
  const accept=match('[data-request-accept]');if(accept){stop();acceptRequest(accept.dataset.requestAccept);return}
  const done=match('[data-request-done]');if(done){stop();finishRequest(done.dataset.requestDone);return}
  const seen=match('[data-request-seen]');if(seen){stop();markRequestSeen(seen.dataset.requestSeen);return}
  const counter=match('[data-request-counter]');if(counter){stop();openCounterModal(counter.dataset.requestCounter);return}
  const decline=match('[data-request-decline]');if(decline){stop();await declineRequest(decline.dataset.requestDecline);return}
  const reply=match('[data-request-reply]');if(reply){stop();await replyToRequest(reply.dataset.requestReply);return}
  const acceptSwap=match('[data-counter-accept]');if(acceptSwap){stop();acceptCounter(acceptSwap.dataset.counterAccept);return}
  const keep=match('[data-counter-keep]');if(keep){stop();keepOriginal(keep.dataset.counterKeep);return}
  const thank=match('[data-request-thanks]');if(thank){stop();const [id,index]=String(thank.dataset.requestThanks).split('|');sendThanks(id,THANKS[Number(index)]||THANKS[0]);return}
  const customThank=match('[data-request-thanks-custom]');if(customThank){stop();await sendCustomThanks(customThank.dataset.requestThanksCustom);return}
  const thanksSeen=match('[data-thanks-seen]');if(thanksSeen){stop();markThanksSeen(thanksSeen.dataset.thanksSeen);return}
  const acknowledgement=match('[data-seen-ack]');if(acknowledgement){stop();const s=state(),work=(s.work||[]).map(item=>({...item})),item=work.find(entry=>String(entry.id)===String(acknowledgement.dataset.seenAck)&&entry.source==='manual');if(item&&item.by!==s.user){item.seen=true;item.seenAt=item.seenAt||new Date().toISOString();save({...s,work});queueMicrotask(render)}return}
  const add=match('#seenAdd');if(add){stop();const title=window.FlytModal?await window.FlytModal.prompt({ey:'Sett',title:'Legg til bidrag',text:'Registrer noe som ellers lett kunne gått ubemerket hen.',label:'Hva gjorde du?',placeholder:'F.eks. ordnet avtalen med tannlegen',ok:'Legg til'}):null;if(!title?.trim())return;const s=state(),now=Date.now(),work=[{id:now,title:title.trim(),by:s.user,seen:false,source:'manual',createdAt:now},...(s.work||[])];save({...s,work});queueMicrotask(render);bridge()?.toast?.('Bidraget er lagt i Sett')}
},true);

const observer=new MutationObserver(()=>{if(painting||requestModalOpen||actionMenuOpen||flowModalOpen)return;const s=state(),content=$('#content');if(s?.view==='seen'&&content?.dataset.flytOwner!=='seen-active-archive')queueMicrotask(render)});
let observed=false,tries=0;
const timer=setInterval(()=>{const content=$('#content');if(content&&!observed){observer.observe(content,{childList:true,subtree:true});observed=true}const s=state();if(s?.view==='seen'&&content?.dataset.flytOwner!=='seen-active-archive')render();if(observed&&++tries>80)clearInterval(timer)},100);

window.FlytSeenUI={render,openRequestModal,requestActive,version:VERSION};
})();
