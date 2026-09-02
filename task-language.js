((root)=>{
'use strict';

const VERSION='20260901-2200';
const CATALOG_VERSION=2;
const TASK_CATALOG=Object.freeze([
  {id:'kids_wakeup',cat:'Barn',name:'Stå opp med barna',freq:7,pts:20,type:'daily',kind:'house'},
  {id:'kids_get_ready',cat:'Barn',name:'Gjøre barna klare for barnehage eller skole',freq:5,pts:30,type:'daily',kind:'house'},
  {id:'lunch',cat:'Barn',name:'Lage matpakker',freq:5,pts:10,type:'daily',kind:'house'},
  {id:'bag',cat:'Barn',name:'Barnas sekker og utstyr',freq:5,pts:10,type:'daily',kind:'house'},
  {id:'bedkids',cat:'Barn',name:'Legging',freq:7,pts:20,type:'daily',kind:'house'},
  {id:'school',cat:'Barn',name:'Skole- og barnehagekommunikasjon',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'homework',cat:'Barn',name:'Lekser',freq:5,pts:10,type:'flex',kind:'house'},
  {id:'kids_clothes_school',cat:'Barn',name:'Skifte klær til barnehage eller skole',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'kids_clothes_buy',cat:'Barn',name:'Kjøpe nye klær til barna',freq:1,pts:20,type:'period',kind:'house'},
  {id:'kids_clothes_sort',cat:'Barn',name:'Sortere klær barna har vokst ut av',freq:1,pts:30,type:'period',kind:'house'},

  {id:'dish_fill',cat:'Kjøkken',name:'Sette inn i oppvaskmaskinen',freq:7,pts:10,type:'daily',kind:'house'},
  {id:'dish_empty',cat:'Kjøkken',name:'Tømme oppvaskmaskinen',freq:7,pts:20,type:'daily',kind:'house'},
  {id:'kitchen',cat:'Kjøkken',name:'Rydde kjøkkenet',freq:7,pts:20,type:'daily',kind:'house'},
  {id:'kitchen_after_meal',cat:'Kjøkken',name:'Rydde etter måltid',freq:7,pts:10,type:'flex',kind:'house'},
  {id:'counter',cat:'Kjøkken',name:'Vaske kjøkkenbenken',freq:7,pts:10,type:'daily',kind:'house'},
  {id:'dinner',cat:'Kjøkken',name:'Lage middag',freq:5,pts:30,type:'daily',kind:'house'},
  {id:'meal_other',cat:'Kjøkken',name:'Lage frokost, lunsj eller kveldsmat',freq:7,pts:20,type:'flex',kind:'house'},
  {id:'fridge_clean',cat:'Kjøkken',name:'Vaske kjøleskapet',freq:1,pts:40,type:'period',kind:'house'},
  {id:'dishwasher_clean',cat:'Kjøkken',name:'Rense oppvaskmaskinen',freq:1,pts:30,type:'period',kind:'house'},
  {id:'oven_clean',cat:'Kjøkken',name:'Vaske stekeovnen',freq:1,pts:40,type:'period',kind:'house'},

  {id:'laundry_start',cat:'Vask & klær',name:'Sette på en vaskemaskin',freq:3,pts:20,type:'flex',kind:'house'},
  {id:'laundry_hang',cat:'Vask & klær',name:'Henge opp klær',freq:3,pts:30,type:'flex',kind:'house'},
  {id:'laundry_fold',cat:'Vask & klær',name:'Brette klær',freq:3,pts:40,type:'flex',kind:'house'},
  {id:'vacuum',cat:'Vask & klær',name:'Støvsuge',freq:2,pts:20,type:'flex',kind:'house'},
  {id:'floors',cat:'Vask & klær',name:'Vaske gulv',freq:2,pts:40,type:'flex',kind:'house'},
  {id:'dust',cat:'Vask & klær',name:'Tørke støv',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'living',cat:'Stue',name:'Rydde stuen',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'hallway',cat:'Stue',name:'Rydde gangen',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'sofa_tidy',cat:'Stue',name:'Rydde sofa og oppholdsrom',freq:5,pts:10,type:'daily',kind:'house'},

  {id:'bath_toilet',cat:'Bad',name:'Vaske toalettet',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'bath_sink',cat:'Bad',name:'Vaske servant og speil',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'bath_shower',cat:'Bad',name:'Vaske badekar eller dusj',freq:1,pts:50,type:'flex',kind:'house'},
  {id:'bath_floor',cat:'Bad',name:'Vaske badegulvet',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'bath_tidy',cat:'Bad',name:'Rydde badet',freq:3,pts:20,type:'flex',kind:'house'},
  {id:'bath_drain',cat:'Bad',name:'Rense sluk',freq:1,pts:40,type:'period',kind:'house'},

  {id:'bed',cat:'Soverom',name:'Bytte sengetøy',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'kids_bedding',cat:'Soverom',name:'Bytte sengetøy på barnas senger',freq:1,pts:30,type:'flex',kind:'house'},

  {id:'pet_food',cat:'Dyr',name:'Gi mat og friskt vann',freq:7,pts:10,type:'daily',kind:'house'},
  {id:'pet_walk',cat:'Dyr',name:'Lufte hund',freq:7,pts:30,type:'daily',kind:'house'},
  {id:'pet_litter',cat:'Dyr',name:'Rense kattekasse',freq:7,pts:30,type:'daily',kind:'house'},
  {id:'pet_groom',cat:'Dyr',name:'Stell og børsting',freq:2,pts:30,type:'flex',kind:'house'},
  {id:'pet_home_clean',cat:'Dyr',name:'Rengjøre bur, akvarium eller dyreområde',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'pet_supplies',cat:'Dyr',name:'Kjøpe dyremat og utstyr',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'pet_vet',cat:'Dyr',name:'Veterinær, vaksiner og avtaler',freq:1,pts:30,type:'period',kind:'house'},
  {id:'pet_meds',cat:'Dyr',name:'Gi medisiner eller behandling',freq:7,pts:20,type:'daily',kind:'house'},

  {id:'garden_mow',cat:'Hage & ute',name:'Klippe gress',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_tidy',cat:'Hage & ute',name:'Rydde uteområdet',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_snow',cat:'Hage & ute',name:'Måke snø eller strø',freq:1,pts:40,type:'flex',kind:'house'},

  {id:'car_wash',cat:'Bil',name:'Vaske bilen utvendig',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'car_fuel',cat:'Bil',name:'Fylle drivstoff eller lade',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'car_service',cat:'Bil',name:'Bestille service eller EU-kontroll',freq:1,pts:20,type:'period',kind:'house'},
  {id:'car_tires',cat:'Bil',name:'Skifte eller følge opp dekk',freq:1,pts:40,type:'period',kind:'house'},

  {id:'shop',cat:'Innkjøp',name:'Handle mat',freq:2,pts:20,type:'flex',kind:'house'},
  {id:'shopping_household',cat:'Innkjøp',name:'Fylle på husholdningsvarer',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'shopping_returns',cat:'Innkjøp',name:'Returnere varer eller pakker',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'trash',cat:'Vedlikehold',name:'Søppel og pant',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'windows',cat:'Vedlikehold',name:'Vaske vinduer',freq:1,pts:50,type:'period',kind:'house'},
  {id:'laundry_machine_clean',cat:'Vedlikehold',name:'Rense vaskemaskin eller tørketrommel',freq:1,pts:20,type:'period',kind:'house'},
  {id:'maintenance_smoke',cat:'Vedlikehold',name:'Sjekke røykvarslere',freq:1,pts:30,type:'period',kind:'house'},
  {id:'maintenance_service',cat:'Vedlikehold',name:'Bestille håndverker eller service',freq:1,pts:20,type:'period',kind:'house'},

  {id:'admin',cat:'Planlegging & admin',name:'Avtaler, lege og tannlege',freq:1,pts:20,type:'period',kind:'house'},
  {id:'gifts',cat:'Planlegging & admin',name:'Gaver og bursdager',freq:1,pts:30,type:'period',kind:'house'},
  {id:'weekly_menu',cat:'Planlegging & admin',name:'Lage ukemeny',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'weekly_plan',cat:'Planlegging & admin',name:'Planlegge uken',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'train',cat:'Personlig investering',name:'Trening',freq:3,pts:10,type:'flex',kind:'personal'}
].map(task=>Object.freeze(task)));

const TASK_BY_ID=new Map(TASK_CATALOG.map(task=>[String(task.id),task]));
const LEGACY_SPLITS=Object.freeze({
  laundry:['laundry_start','laundry_hang','laundry_fold'],
  bath:['bath_toilet','bath_sink','bath_shower','bath_floor']
});
const LEGACY_NAME_ALIASES=new Map([
  ['Fylle oppvaskmaskin','Sette inn i oppvaskmaskinen'],
  ['Fylle oppvaskmaskinen','Sette inn i oppvaskmaskinen'],
  ['Tømme oppvaskmaskin','Tømme oppvaskmaskinen'],
  ['Tømme/pakke barnas sekk','Barnas sekker og utstyr'],
  ['Pakke sekk til barna','Barnas sekker og utstyr'],
  ['Vaske klær','Klesvask (tidligere samlet)'],
  ['Vaske/brette klær','Klesvask (tidligere samlet)'],
  ['Klesvask','Klesvask (tidligere samlet)'],
  ['Vaske bad','Vaske bad (tidligere samlet)']
]);

function cleanName(value){
  return String(value||'denne oppgaven').trim().replace(/\s+/g,' ')||'denne oppgaven';
}
function canonicalId(value){return value}
function canonicalName(taskOrName,id){
  const task=taskOrName&&typeof taskOrName==='object'?taskOrName:null;
  const taskId=String(task?.id??id??'');
  const catalogTask=TASK_BY_ID.get(taskId);
  if(catalogTask)return catalogTask.name;
  if(taskId==='laundry')return'Klesvask (tidligere samlet)';
  if(taskId==='bath')return'Vaske bad (tidligere samlet)';
  const name=cleanName(task?.name??taskOrName);
  return LEGACY_NAME_ALIASES.get(name)||name;
}
function taskReference(taskOrName){return `oppgaven «${canonicalName(taskOrName)}»`}
function initiativeText(taskOrName){return `Jeg tar ansvar for ${taskReference(taskOrName)} i dag.`}

function preferredDays(task){
  return [...new Set((task?.preferredDays||[]).map(Number).filter(day=>day>=1&&day<=7))].sort((a,b)=>a-b);
}
function normalizeKnownTask(task,applyCatalog){
  if(!task||typeof task!=='object')return task;
  const base=TASK_BY_ID.get(String(task.id));
  if(!base)return{...task,name:canonicalName(task)};
  const next={...task,id:base.id,cat:base.cat,name:base.name,kind:base.kind};
  if(applyCatalog)next.pts=base.pts;
  if(!Number.isFinite(Number(next.freq))||Number(next.freq)<1)next.freq=base.freq;
  if(!['daily','flex','period'].includes(next.type))next.type=base.type;
  const days=preferredDays(next);
  if(days.length)next.preferredDays=days;
  else delete next.preferredDays;
  return next;
}
function expandLegacyTask(task){
  const ids=LEGACY_SPLITS[String(task?.id)];
  if(!ids)return null;
  return ids.map(id=>{
    const base=TASK_BY_ID.get(id);
    return {...base,owner:task.owner||'Begge'};
  });
}
function mergeTask(existing,incoming){
  const days=[...new Set([...preferredDays(existing),...preferredDays(incoming)])].sort((a,b)=>a-b);
  const next={...existing,...incoming};
  if(days.length)next.preferredDays=days;
  else delete next.preferredDays;
  return next;
}
function normalizeTasks(tasks,{applyCatalog=true,expandLegacy=true}={}){
  const out=[];
  for(const task of Array.isArray(tasks)?tasks:[]){
    const candidates=expandLegacy?expandLegacyTask(task):null;
    for(const raw of candidates||[task]){
      const next=normalizeKnownTask(raw,applyCatalog),index=out.findIndex(item=>String(item?.id)===String(next?.id));
      if(index>=0)out[index]=mergeTask(out[index],next);
      else out.push(next);
    }
  }
  return out;
}
function normalizeGeneratedText(request,name){
  const text=String(request?.text||'');
  if(request?.source==='initiative')return initiativeText(name);
  if(request?.source!=='nudge')return text;
  const ref=taskReference(name);
  return text
    .replace(/\. Hadde satt stor pris på om du tok [^.]+\./,`. Jeg hadde satt stor pris på om du kunne ta deg av ${ref}.`)
    .replace(/\. Kan du ta [^?]+\?/,`. Kan du ta deg av ${ref}?`)
    .replace(/\. Hvis du har mulighet, hadde jeg satt pris på om du tok [^.]+\./,`. Hvis du har mulighet, hadde jeg satt pris på om du kunne ta deg av ${ref}.`);
}
function normalizeLinkedItem(item){
  if(!item||typeof item!=='object')return item;
  const next={...item},known=TASK_BY_ID.has(String(item.taskId))||LEGACY_SPLITS[String(item.taskId)]||cleanName(item.taskName)!=='denne oppgaven',name=canonicalName(item.taskName||'',item.taskId);
  if(known)next.taskName=name;
  if(item.text)next.text=normalizeGeneratedText(item,name);
  if(item.counter?.taskName){
    const counter={...item.counter};
    counter.taskName=canonicalName(counter.taskName,counter.taskId);
    next.counter=counter;
  }
  return next;
}
function normalizeCompletion(item){
  if(!item||typeof item!=='object')return item;
  const known=TASK_BY_ID.has(String(item.taskId))||LEGACY_SPLITS[String(item.taskId)]||cleanName(item.taskName)!=='denne oppgaven';
  return known?{...item,taskName:canonicalName(item.taskName||'',item.taskId)}:{...item};
}
function normalizeTitledItem(item){
  if(!item||typeof item!=='object')return item;
  const next={...item};
  if(item.title)next.title=canonicalName(item.title,item.taskId);
  return next;
}
function normalizeState(value){
  if(!value||typeof value!=='object')return value;
  const next={...value},applyCatalog=Number(value.taskCatalogVersion||0)<CATALOG_VERSION;
  if(Array.isArray(value.tasks))next.tasks=normalizeTasks(value.tasks,{applyCatalog,expandLegacy:true});
  if(Array.isArray(value.custom))next.custom=normalizeTasks(value.custom,{applyCatalog:false,expandLegacy:false});
  if(Array.isArray(value.completions))next.completions=value.completions.map(normalizeCompletion);
  if(Array.isArray(value.seenRequests))next.seenRequests=value.seenRequests.map(normalizeLinkedItem);
  if(Array.isArray(value.work))next.work=value.work.map(normalizeTitledItem);
  if(Array.isArray(value.plannedTasks))next.plannedTasks=value.plannedTasks.map(normalizeTitledItem);
  if(Array.isArray(value.setupHistory))next.setupHistory=value.setupHistory.map(snapshot=>snapshot&&typeof snapshot==='object'?{
    ...snapshot,
    tasks:normalizeTasks(snapshot.tasks,{applyCatalog:true,expandLegacy:true}),
    custom:normalizeTasks(snapshot.custom,{applyCatalog:false,expandLegacy:false})
  }:snapshot);
  next.taskCatalogVersion=CATALOG_VERSION;
  return next;
}

const api={CATALOG_VERSION,TASK_CATALOG,VERSION,canonicalId,canonicalName,catalog:TASK_CATALOG,initiativeText,normalizeState,normalizeTasks,taskReference};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root){
  root.FlytTaskLanguage=api;
  const bridge=root.FlytBridge,state=bridge?.getState?.();
  if(state)bridge.setState(normalizeState(state));
}
})(typeof window!=='undefined'?window:globalThis);
