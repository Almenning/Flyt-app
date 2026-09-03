(()=>{
'use strict';

const VERSION='20260903-master1';
const BASE_CATEGORIES=['Barn','Kjøkken','Klesvask','Renhold','Stue & fellesområder','Bad','Soverom','Dyr','Hage & ute','Bil','Planlegging & admin'];
const DAY_LABELS=[['1','Man'],['2','Tir'],['3','Ons'],['4','Tor'],['5','Fre'],['6','Lør'],['7','Søn']];
const bridge=()=>window.FlytBridge;
const state=()=>bridge()?.getState?.()||null;
const save=s=>{bridge()?.setState?.(s);window.FlytSync?.queueSave?.()};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function customCategories(s){
  return [...new Set((s?.custom||[]).map(t=>String(t.cat||'').trim()).filter(c=>c&&c!=='Egendefinert'&&!BASE_CATEGORIES.includes(c)))].sort((a,b)=>a.localeCompare(b,'nb'));
}
function pointsForEffort(value){
  return Math.min(5,Math.max(1,Math.round(Number(value)||1)))*10;
}
function makeTask(name,cat,type='flex',freq=1,preferredDays=[],effortLevel=3){
  const selected=[...new Set((preferredDays||[]).map(Number).filter(n=>n>=1&&n<=7))].sort((a,b)=>a-b);
  const days=type==='daily'&&!selected.length?[1,2,3,4,5,6,7]:selected;
  const max=type==='daily'?7:31;
  const goal=type==='daily'&&days.length?days.length:Math.min(max,Math.max(1,Number(freq)||1));
  const effort=Math.min(5,Math.max(1,Math.round(Number(effortLevel)||1)));
  return{
    id:'custom_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    cat:cat||'Egendefinert',
    name:name.trim(),
    freq:goal,
    pts:pointsForEffort(effort),
    effortLevel:effort,
    type,
    kind:'house',
    ...(type==='daily'&&days.length?{preferredDays:days}:{})
  };
}
function addTask(name,cat,type,freq,preferredDays=[],effortLevel=3){
  const s=state();
  if(!s||!name?.trim())return;
  const x=makeTask(name,cat,type,freq,preferredDays,effortLevel);
  save({...s,custom:[...(s.custom||[]),x],tasks:[...(s.tasks||[]),{...x,owner:'Begge'}]});
  bridge()?.toast?.(`${x.name} er lagt til under ${x.cat} · ${x.pts} poeng`);
  window.FlytTasksUI?.openSetup?.(1);
}
async function waitModal(){
  if(window.FlytModal)return window.FlytModal;
  for(let i=0;i<30;i++){
    await new Promise(resolve=>setTimeout(resolve,50));
    if(window.FlytModal)return window.FlytModal;
  }
  return null;
}
async function taskForm({cat='Egendefinert',allowCategory=true}={}){
  const s=state(),modal=await waitModal();
  if(!s||!modal)return null;
  modal.close?.();
  const cats=[...BASE_CATEGORIES,...customCategories(s),'Egendefinert'];
  return new Promise(resolve=>{
    const el=document.createElement('div');
    el.id='flytGlobalModal';
    el.style.cssText='position:fixed;inset:0;z-index:260;background:#3a211b88;display:flex;align-items:center;justify-content:center;padding:18px';
    const categoryField=allowCategory?`
      <label class="label" for="flytCustomCategory">Kategori</label>
      <select id="flytCustomCategory" class="field">
        ${cats.map(c=>`<option value="${esc(c)}" ${c===cat?'selected':''}>${esc(c)}</option>`).join('')}
        <option value="__new__">+ Lag ny kategori</option>
      </select>
      <div id="flytNewCategoryWrap" style="display:none">
        <label class="label" for="flytNewCategory">Ny kategori</label>
        <input id="flytNewCategory" class="field" placeholder="F.eks. Hytte">
      </div>`:`<input id="flytCustomCategory" type="hidden" value="${esc(cat)}">`;
    const effortChoices=[1,2,3,4,5].map(level=>`
      <label data-effort-card="${level}" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 3px;border:1px solid #ead8d0;border-radius:12px;background:#fff;cursor:pointer">
        <input type="radio" name="flytCustomEffort" value="${level}" data-custom-effort="${level}" ${level===3?'checked':''} style="width:18px;height:18px;margin:0;accent-color:var(--accent)">
        <strong style="font-size:16px">${level}</strong>
        <span style="font-size:11px;color:var(--muted)">${level*10} p</span>
      </label>`).join('');
    el.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="flytCustomTitle" style="width:min(410px,100%);max-height:90dvh;overflow:auto;background:#fffaf7;border:1px solid #ead8d0;border-radius:26px;padding:22px;box-shadow:0 24px 70px #3b211b55">
      <div class="ey">Oppsett</div>
      <h2 id="flytCustomTitle" style="font:500 28px/1.12 Georgia;margin:10px 0 14px">Legg til gjøremål</h2>
      <label class="label" for="flytCustomTaskName">Navn på gjøremålet</label>
      <input id="flytCustomTaskName" class="field" autocomplete="off" placeholder="F.eks. Følge til barnehagen">
      ${categoryField}
      <fieldset style="border:0;padding:0;margin:12px 0 0">
        <legend class="label" style="padding:0">Innsatsnivå 1–5</legend>
        <div style="font-size:12px;color:var(--muted);margin:5px 0 8px">1 er en svært liten oppgave. 5 er en omfattende oppgave. Nivået kan endres senere.</div>
        <div id="flytCustomEffort" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${effortChoices}</div>
      </fieldset>
      <div id="flytCustomPoints" aria-live="polite" style="margin:10px 0 14px;padding:11px 12px;border-radius:13px;background:#f8d3c1;color:#7d3329;font-weight:850">Nivå 3 gir 30 poeng</div>
      <label class="label" for="flytCustomType">Rytme</label>
      <select id="flytCustomType" class="field">
        <option value="daily">Dager per uke</option>
        <option value="flex" selected>Ganger per uke</option>
        <option value="period">Ganger per måned</option>
      </select>
      <div id="flytCustomFreqWrap">
        <label id="flytCustomFreqLabel" class="label" for="flytCustomFreq">Ganger per uke</label>
        <input id="flytCustomFreq" class="field" type="number" min="1" max="31" value="1">
      </div>
      <div id="flytCustomDaysWrap" style="display:none;margin-top:10px">
        <span class="label">Faste dager</span>
        <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:6px">${DAY_LABELS.map(([n,l])=>`<label style="text-align:center;font-size:11px"><input type="checkbox" data-custom-day="${n}" style="display:block;margin:0 auto 4px;accent-color:var(--accent)">${l}</label>`).join('')}</div>
        <div class="taskmeta" style="margin-top:6px">Oppgaven legges automatisk i Dagens plan på dagene du velger.</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px">
        <button type="button" id="flytCustomCancel" class="secondary">Avbryt</button>
        <button type="button" id="flytCustomSave" class="primary">Legg til</button>
      </div>
    </div>`;
    document.body.appendChild(el);

    const name=el.querySelector('#flytCustomTaskName');
    const select=el.querySelector('#flytCustomCategory');
    const newWrap=el.querySelector('#flytNewCategoryWrap');
    const newCat=el.querySelector('#flytNewCategory');
    const type=el.querySelector('#flytCustomType');
    const freq=el.querySelector('#flytCustomFreq');
    const freqLabel=el.querySelector('#flytCustomFreqLabel');
    const daysWrap=el.querySelector('#flytCustomDaysWrap');
    const dayBoxes=[...el.querySelectorAll('[data-custom-day]')];
    const effortBoxes=[...el.querySelectorAll('[data-custom-effort]')];
    const pointPreview=el.querySelector('#flytCustomPoints');
    const done=value=>{el.remove();resolve(value)};
    const selectedDays=()=>dayBoxes.filter(box=>box.checked).map(box=>Number(box.dataset.customDay));
    const selectedEffort=()=>Number(effortBoxes.find(box=>box.checked)?.value||3);
    const syncEffort=()=>{
      const effort=selectedEffort();
      pointPreview.textContent=`Nivå ${effort} gir ${pointsForEffort(effort)} poeng`;
      el.querySelectorAll('[data-effort-card]').forEach(card=>{
        const active=Number(card.dataset.effortCard)===effort;
        card.style.borderColor=active?'var(--accent)':'#ead8d0';
        card.style.background=active?'#fff0e8':'#fff';
      });
    };
    const syncDays=()=>{
      const days=selectedDays();
      if(type.value==='daily'&&days.length){freq.value=String(days.length);freq.disabled=true}
      else freq.disabled=false;
    };
    const syncFreq=()=>{
      const daily=type.value==='daily';
      freqLabel.textContent=daily?'Dager per uke':type.value==='period'?'Ganger per måned':'Ganger per uke';
      freq.max=daily?'7':'31';
      daysWrap.style.display=daily?'block':'none';
      if(daily&&!selectedDays().length)dayBoxes.forEach(box=>box.checked=true);
      if(!daily)dayBoxes.forEach(box=>box.checked=false);
      freq.value=String(Math.min(Number(freq.max),Math.max(1,Number(freq.value)||1)));
      syncDays();
    };

    if(allowCategory)select.onchange=()=>{
      const isNew=select.value==='__new__';
      newWrap.style.display=isNew?'block':'none';
      if(isNew)setTimeout(()=>newCat.focus(),0);
    };
    type.onchange=syncFreq;
    dayBoxes.forEach(box=>box.onchange=syncDays);
    effortBoxes.forEach(box=>box.onchange=syncEffort);
    syncFreq();
    syncEffort();
    el.addEventListener('click',event=>{if(event.target===el)done(null)});
    el.querySelector('#flytCustomCancel').onclick=()=>done(null);
    el.querySelector('#flytCustomSave').onclick=()=>{
      const taskName=name.value.trim();
      const chosenCat=allowCategory?(select.value==='__new__'?newCat.value.trim():select.value):cat;
      const days=type.value==='daily'?selectedDays():[];
      if(!taskName){name.focus();name.style.borderColor='#e87961';return}
      if(!chosenCat){newCat?.focus();if(newCat)newCat.style.borderColor='#e87961';return}
      done({
        name:taskName,
        cat:chosenCat,
        effortLevel:selectedEffort(),
        type:type.value,
        freq:days.length?days.length:Math.min(type.value==='daily'?7:31,Math.max(1,Number(freq.value)||1)),
        preferredDays:days
      });
    };
    setTimeout(()=>name.focus(),30);
  });
}
async function addToCategory(cat){
  const data=await taskForm({cat,allowCategory:true});
  if(data)addTask(data.name,data.cat,data.type,data.freq,data.preferredDays,data.effortLevel);
}
async function openGeneral(){
  const data=await taskForm({allowCategory:true});
  if(!data)return false;
  addTask(data.name,data.cat,data.type,data.freq,data.preferredDays,data.effortLevel);
  return true;
}
function sectionTitle(section){return section?.querySelector(':scope > strong')?.textContent?.trim()||''}
function ensureCategorySection(body,cat,before){
  let section=[...body.querySelectorAll(':scope > .section')].find(node=>sectionTitle(node)===cat);
  if(section)return section;
  section=document.createElement('div');
  section.className='section';
  section.dataset.customCategorySection=cat;
  section.innerHTML=`<strong>${esc(cat)}</strong>`;
  body.insertBefore(section,before||null);
  return section;
}
function safeEscape(value){return window.CSS?.escape?CSS.escape(value):String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&')}
function addButton(section,cat){
  if(section.querySelector(`[data-add-task-category="${safeEscape(cat)}"]`))return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='secondary full';
  btn.dataset.addTaskCategory=cat;
  btn.style.marginTop='8px';
  btn.textContent='+ Legg til eget gjøremål';
  section.appendChild(btn);
}
function augment(){
  const body=document.querySelector('#setupBody');
  if(!body||document.querySelector('#setup')?.classList.contains('hidden'))return;
  const heading=body.querySelector('h1.title')?.textContent||'';
  if(!heading.includes('Hva gjør dere'))return;
  const s=state();
  if(!s)return;
  const sections=[...body.querySelectorAll(':scope > .section')];
  const generic=sections.find(node=>sectionTitle(node)==='Egendefinerte');
  const history=sections.find(node=>sectionTitle(node)==='Oppsettshistorikk');
  for(const cat of BASE_CATEGORIES){
    const section=sections.find(node=>sectionTitle(node)===cat);
    if(section)addButton(section,cat);
  }
  for(const cat of customCategories(s)){
    const section=ensureCategorySection(body,cat,generic||history);
    addButton(section,cat);
  }
  for(const task of (s.custom||[])){
    const node=body.querySelector(`[data-setup-task="${safeEscape(String(task.id))}"]`)?.closest('.template');
    if(!node)continue;
    const cat=String(task.cat||'Egendefinert').trim()||'Egendefinert';
    if(cat==='Egendefinert')continue;
    const section=ensureCategorySection(body,cat,generic||history);
    const firstButton=section.querySelector('button[data-expand-cat],button[data-collapse-cat],button[data-add-task-category]');
    if(firstButton)section.insertBefore(node,firstButton);
    else section.appendChild(node);
    addButton(section,cat);
  }
  if(generic){
    const old=generic.querySelector('#addCustomTask');
    if(old)old.textContent='+ Legg til eget gjøremål';
  }
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-add-task-category]');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  addToCategory(button.dataset.addTaskCategory);
},true);

const observer=new MutationObserver(()=>queueMicrotask(augment));
let tries=0;
const timer=setInterval(()=>{
  const body=document.querySelector('#setupBody');
  if(body){observer.observe(body,{childList:true,subtree:true});augment();clearInterval(timer)}
  else if(++tries>80)clearInterval(timer);
},100);

window.FlytCustomCategories={VERSION,addToCategory,augment,makeTask,openGeneral,pointsForEffort,version:VERSION};
})();
