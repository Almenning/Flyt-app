(()=>{
'use strict';

const VERSION='20260902-1800';
const RECENT_MS=14*86400000;
const INVITATION_PRESETS=[
  ['🛋','Sofa og noe godt','Sofa og noe godt i kveld?'],
  ['🌿','En liten tur','En liten tur sammen senere?'],
  ['♥','Tid tett sammen','Litt tid tett sammen i kveld?'],
  ['☕','En kaffe sammen','Skal vi ta en kaffe sammen, bare oss to?'],
  ['🎬','Filmkveld','Skal vi se en film sammen i kveld?'],
  ['🌙','Etter legging','Litt tid sammen etter legging?']
];
const $=selector=>document.querySelector(selector);
const bridge=()=>window.FlytBridge;
const core=()=>window.FlytCoupleCore;
let painting=false,composerOpen=false,lastAlerted=new Set();

function state(){return bridge()?.getState?.()||null}
function save(next){bridge()?.setState?.(next);window.FlytSync?.queueSave?.()}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function partnerName(s){const context=window.FlytSync?.getContext?.(),member=context?.members?.find(item=>String(item.id)!==String(context?.user_id));return member?.display_name||Object.keys(s?.points||{}).find(name=>name!==s?.user)||'partneren din'}
function items(s){return Array.isArray(s?.coupleInvitations)?s.coupleInvitations:[]}
function status(item){return core()?.invitationState?.(item)||(!item?.response?'pending':item.response.kind==='yes'?'accepted':item.response.kind==='later'?'later':item.response.kind==='counter'?'countered':'declined')}
function active(item){return core()?.invitationActive?.(item)??['pending','countered'].includes(status(item))}
function visibleItems(s){const cutoff=Date.now()-RECENT_MS;return items(s).filter(item=>!item.deleted&&(active(item)||Number(item.createdAt||0)>=cutoff)).sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0))}
function statusLabel(item,s){
  const value=status(item),mine=item.by===s.user;
  if(value==='pending')return mine?'Venter på svar':'Ny invitasjon';
  if(value==='accepted')return'Gjerne ❤️';
  if(value==='later')return'Litt senere';
  if(value==='countered')return mine?'Nytt forslag':'Forslag sendt';
  if(value==='declined')return'Ikke i kveld';
  return'Trukket tilbake';
}
function update(id,mutator){
  const s=state();if(!s)return null;
  const all=items(s).map(item=>({...item})),index=all.findIndex(item=>String(item.id)===String(id));if(index<0)return null;
  const before=all[index],next=mutator(before,s);if(!next||next===before)return null;
  all[index]=next;save({...s,coupleInvitations:all});queueMicrotask(augment);return next;
}
function responseMarkup(item){
  const answer=item.finalResponse||item.response;if(!answer)return'';
  if(answer.kind==='counter')return `<div style="margin-top:12px;padding:11px 12px;border:1px solid #eed8cf;border-radius:14px;background:#fff8f4"><div class="ey">Foreslår noe annet</div><strong style="display:block;margin-top:5px">${esc(answer.text)}</strong></div>`;
  if(item.finalResponse?.text)return `<div style="margin-top:12px;padding:11px 12px;border:1px solid #dfe6d2;border-radius:14px;background:#fbfdf8"><div class="ey">Dere landet på</div><strong style="display:block;margin-top:5px">${esc(item.finalResponse.text)}</strong></div>`;
  return'';
}
function cardMarkup(s,item){
  const mine=item.by===s.user,value=status(item),buttons=[];
  if(!mine&&value==='pending'){
    buttons.push(`<button type="button" class="primary" data-invite-answer="${esc(item.id)}|yes">Gjerne</button>`);
    buttons.push(`<button type="button" class="secondary" data-invite-answer="${esc(item.id)}|later">Litt senere</button>`);
    buttons.push(`<button type="button" class="secondary" data-invite-counter="${esc(item.id)}">Foreslå noe annet</button>`);
    buttons.push(`<button type="button" class="small" data-invite-answer="${esc(item.id)}|no">Ikke i kveld</button>`);
  }else if(mine&&value==='pending'){
    buttons.push(`<button type="button" class="small" data-invite-withdraw="${esc(item.id)}">Trekk tilbake</button>`);
  }else if(mine&&value==='countered'){
    buttons.push(`<button type="button" class="primary grow" data-invite-accept-counter="${esc(item.id)}">Det passer</button>`);
    buttons.push(`<button type="button" class="secondary grow" data-invite-finish-later="${esc(item.id)}">La oss ta det senere</button>`);
  }
  return `<div class="card" style="border-color:#e7d2c8;background:linear-gradient(145deg,#fffdfa,#fff4ee)"><div class="row" style="align-items:flex-start"><div class="grow"><div class="ey">${mine?'Fra deg':`Fra ${esc(item.by)}`}</div><strong style="display:block;font:600 19px/1.35 Georgia;margin-top:6px">${esc(item.text)}</strong></div><span class="tag" style="${value==='accepted'?'background:#edf1e5;color:#607644':''}">${esc(statusLabel(item,s))}</span></div>${responseMarkup(item)}${buttons.length?`<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:13px">${buttons.join('')}</div>`:''}</div>`;
}
function sectionMarkup(s){
  const list=visibleItems(s);
  return `<section id="coupleInvitationSection" class="section" style="margin:14px 0 22px;padding:16px;border:1px solid #e7cfc4;border-radius:22px;background:linear-gradient(145deg,#fffaf6,#ffede4)"><div class="row" style="align-items:flex-start"><div class="grow"><div class="ey">Invitasjoner</div><h2 style="font:500 24px/1.15 Georgia;margin:5px 0 4px">Tid sammen</h2></div><button type="button" class="small" id="coupleInvitationOpen">+ Inviter</button></div>${list.length?`<div style="margin-top:13px">${list.map(item=>cardMarkup(s,item)).join('')}</div>`:''}</section>`;
}
function ensureStyles(){
  if($('#coupleInvitationStyles'))return;
  const style=document.createElement('style');style.id='coupleInvitationStyles';style.textContent='#coupleInvitationModal,#coupleInvitationAlert{position:fixed;inset:0;z-index:360;background:#3a211b99;display:flex;align-items:center;justify-content:center;padding:20px}.coupleInvitationDialog{width:min(410px,100%);max-height:90dvh;overflow:auto;background:#fffaf7;border:1px solid var(--line);border-radius:27px;padding:22px;box-shadow:0 28px 80px #3b211b55}.invitationPresets{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.invitationPreset{border:1px solid transparent;transition:background .16s,border-color .16s,box-shadow .16s,transform .16s}.invitationPreset:active{transform:scale(.97)}.invitationPreset[aria-pressed="true"]{border-color:var(--accent);background:#fff0e8;box-shadow:0 0 0 2px #e8796122}.invitationPreset[aria-pressed="true"]:after{content:" ✓"}';document.head.appendChild(style);
}
function presetMarkup(attribute,selected){return `<div class="invitationPresets" aria-label="Forslag til invitasjon">${INVITATION_PRESETS.map(([icon,label,text])=>`<button type="button" class="small invitationPreset" ${attribute}="${esc(text)}" aria-pressed="${text===selected?'true':'false'}">${icon} ${esc(label)}</button>`).join('')}</div>`}
function syncPresetSelection(scope,selector,value){scope?.querySelectorAll?.(selector).forEach(button=>button.setAttribute('aria-pressed',button.dataset.invitePreset===value?'true':'false'))}
function augment(){
  if(painting)return;
  const s=state(),mount=$('#ossInvitationMount');if(!s||!mount||s.view!=='us')return;
  ensureStyles();painting=true;
  try{
    const html=sectionMarkup(s);
    if(mount.innerHTML!==html)mount.innerHTML=html;
    updateBadge();
  }finally{painting=false}
}
function closeComposer(){composerOpen=false;$('#coupleInvitationModal')?.remove()}
function openComposer({prefill='Sofa og noe godt i kveld?'}={}){
  if(composerOpen)return;
  const s=state();if(!s)return;
  ensureStyles();composerOpen=true;
  const element=document.createElement('div');element.id='coupleInvitationModal';
  element.innerHTML=`<div class="coupleInvitationDialog" role="dialog" aria-modal="true"><div class="ey">♥ Tid for oss</div><h2 style="font:500 28px/1.12 Georgia;margin:9px 0 7px">Send en liten invitasjon</h2><p class="sub" style="margin-top:0">Foreslå noe konkret til ${esc(partnerName(s))}. Velg et forslag eller skriv ditt eget.</p>${presetMarkup('data-invite-preset',prefill)}<label class="label" for="coupleInvitationText">Invitasjon</label><input id="coupleInvitationText" class="field" maxlength="240" autocomplete="off" value="${esc(prefill)}"><label style="display:flex;align-items:flex-start;gap:11px;margin:14px 0 0;padding:12px 13px;border:1px solid var(--line);border-radius:15px;background:#fff"><input id="coupleInvitationNotify" type="checkbox" checked style="margin-top:3px;accent-color:var(--accent)"><span><strong style="display:block">Varsle ${esc(partnerName(s))}</strong><span class="taskmeta">Uten varsel ligger invitasjonen fortsatt her.</span></span></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button type="button" class="secondary" data-invite-cancel="1">Avbryt</button><button type="button" class="primary" data-invite-send="1">Send</button></div></div>`;
  document.body.appendChild(element);element.addEventListener('click',event=>{if(event.target===element)closeComposer()});setTimeout(()=>$('#coupleInvitationText')?.select(),40);
}
function sendInvitation(){
  const s=state(),text=$('#coupleInvitationText')?.value.trim(),notifyPartner=!!$('#coupleInvitationNotify')?.checked;if(!s||!text){$('#coupleInvitationText')?.focus();return}
  const now=Date.now(),item=core()?.makeInvitation?.({state:s,text,notifyPartner,now})||{id:`invite_${now}`,text,by:s.user,createdAt:now,notifyPartner,seenBy:[s.user],response:null,deleted:false};
  save({...s,coupleInvitations:[item,...items(s)]});closeComposer();bridge()?.toast?.(notifyPartner?'Invitasjonen er sendt':'Invitasjonen er lagt inn uten varsel');checkAlerts();
}
async function counterInvitation(id){
  const text=window.FlytModal?.prompt?await window.FlytModal.prompt({ey:'Tid for oss',title:'Foreslå noe annet',text:'Hold forslaget lite og konkret.',label:'Forslag',placeholder:'F.eks. En liten tur i stedet?',ok:'Send forslag'}):null;if(!text?.trim())return;
  const result=update(id,(item,s)=>core()?.respondInvitation?.(item,s.user,'counter',text)||item);if(result&&status(result)==='countered')bridge()?.toast?.('Forslaget er sendt');
}
function answerInvitation(id,kind){
  const result=update(id,(item,s)=>core()?.respondInvitation?.(item,s.user,kind,'')||item);if(!result)return;
  const labels={yes:'Svaret er sendt ❤️',later:'Svaret «Litt senere» er sendt',no:'Svaret «Ikke i kveld» er sendt'};bridge()?.toast?.(labels[kind]||'Svaret er sendt');$('#coupleInvitationAlert')?.remove();updateBadge();
}
function acceptCounter(id){const result=update(id,(item,s)=>core()?.acceptInvitationCounter?.(item,s.user)||item);if(result&&status(result)==='accepted')bridge()?.toast?.('Det nye forslaget er avtalt ❤️')}
function finishLater(id){
  const result=update(id,(item,s)=>item.by===s.user&&status(item)==='countered'?{...item,finalResponse:{kind:'later',by:s.user,createdAt:Date.now(),createdAtIso:new Date().toISOString()}}:item);
  if(result)bridge()?.toast?.('Dere tar det senere');
}
async function withdraw(id){
  const s=state(),item=items(s).find(entry=>String(entry.id)===String(id));if(!s||!item||item.by!==s.user||status(item)!=='pending')return;
  const yes=window.FlytModal?.confirm?await window.FlytModal.confirm({ey:'Tid for oss',title:'Trekke tilbake invitasjonen?',text:'Partneren vil se at den ble trukket tilbake.',ok:'Trekk tilbake'}):false;if(!yes)return;
  update(id,entry=>({...entry,deleted:true,deletedAt:new Date().toISOString(),deletedBy:s.user}));bridge()?.toast?.('Invitasjonen er trukket tilbake');
}
function unread(s,item){return item.by!==s.user&&status(item)==='pending'&&item.notifyPartner!==false&&!(item.seenBy||[]).includes(s.user)}
function updateBadge(){
  const s=state(),nav=document.querySelector('#nav button[data-view="us"]');if(!s||!nav)return;
  const count=items(s).filter(item=>unread(s,item)).length;nav.style.position='relative';let badge=nav.querySelector('[data-couple-invite-badge]');if(!count){badge?.remove();return}if(!badge){badge=document.createElement('span');badge.dataset.coupleInviteBadge='1';badge.style.cssText='position:absolute;top:5px;right:calc(50% - 22px);min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#c85745;color:white;font-size:10px;font-weight:900;line-height:17px;text-align:center;box-shadow:0 0 0 2px #fffaf7';nav.appendChild(badge)}badge.textContent=count>9?'9+':String(count);
}
function modalBlocked(){return !!document.querySelector('#coupleInvitationAlert,#coupleInvitationModal,#seenRequestAlertModal,#seenThanksAlertModal,#quickAlertModal,#statusAlertModal,#flytGlobalModal,#seenFlowModal,#quickTemptationModal,#flytAppMenu')}
function showAlert(item){
  const s=state();if(!s||!unread(s,item)||lastAlerted.has(String(item.id))||modalBlocked())return false;lastAlerted.add(String(item.id));ensureStyles();
  const element=document.createElement('div');element.id='coupleInvitationAlert';element.innerHTML=`<div class="coupleInvitationDialog" role="dialog" aria-modal="true"><div class="ey">♥ Tid for oss</div><h2 style="font:500 28px/1.12 Georgia;margin:9px 0 7px">En liten invitasjon fra ${esc(item.by)}</h2><div class="card hero" style="margin:15px 0"><strong style="font-size:19px;line-height:1.45">${esc(item.text)}</strong></div><p class="sub">Du kan svare kort. «Ikke i kveld» er et helt svar – Flyt følger ikke opp med flere dytt.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px"><button type="button" class="primary" data-invite-answer="${esc(item.id)}|yes">Gjerne</button><button type="button" class="secondary" data-invite-answer="${esc(item.id)}|later">Litt senere</button><button type="button" class="secondary" data-invite-counter="${esc(item.id)}">Foreslå annet</button><button type="button" class="small" data-invite-answer="${esc(item.id)}|no">Ikke i kveld</button></div></div>`;document.body.appendChild(element);return true;
}
function checkAlerts(){const s=state();if(!s){updateBadge();return}updateBadge();if(modalBlocked())return;for(const item of items(s).sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0))){if(showAlert(item))break}}

document.addEventListener('click',async event=>{
  const target=event.target,match=selector=>target.closest?.(selector),stop=()=>{event.preventDefault();event.stopImmediatePropagation()};
  const open=match('#coupleInvitationOpen');if(open){stop();openComposer();return}
  const cancel=match('[data-invite-cancel]');if(cancel){stop();closeComposer();return}
  const preset=match('[data-invite-preset]');if(preset){stop();const input=$('#coupleInvitationText');if(input){input.value=preset.dataset.invitePreset;syncPresetSelection($('#coupleInvitationModal'),'[data-invite-preset]',input.value);input.focus()}return}
  const send=match('[data-invite-send]');if(send){stop();sendInvitation();return}
  const answer=match('[data-invite-answer]');if(answer){stop();const [id,kind]=String(answer.dataset.inviteAnswer).split('|');answerInvitation(id,kind);return}
  const counter=match('[data-invite-counter]');if(counter){stop();$('#coupleInvitationAlert')?.remove();await counterInvitation(counter.dataset.inviteCounter);return}
  const accept=match('[data-invite-accept-counter]');if(accept){stop();acceptCounter(accept.dataset.inviteAcceptCounter);return}
  const later=match('[data-invite-finish-later]');if(later){stop();finishLater(later.dataset.inviteFinishLater);return}
  const withdrawButton=match('[data-invite-withdraw]');if(withdrawButton){stop();await withdraw(withdrawButton.dataset.inviteWithdraw);return}
},true);
document.addEventListener('input',event=>{if(event.target?.id==='coupleInvitationText')syncPresetSelection($('#coupleInvitationModal'),'[data-invite-preset]',event.target.value)});

const observer=new MutationObserver(()=>{if(!painting)queueMicrotask(augment)});
window.addEventListener('DOMContentLoaded',()=>{const content=$('#content');if(content)observer.observe(content,{childList:true,subtree:true});augment();checkAlerts()});
window.addEventListener('pageshow',()=>{augment();checkAlerts()});
setInterval(()=>{augment();checkAlerts()},1400);

window.FlytCoupleInvitations={augment,openComposer,checkAlerts,updateBadge,version:VERSION};
})();
