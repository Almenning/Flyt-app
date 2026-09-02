((root)=>{
'use strict';

const VERSION='20260902-1800';
const CATALOG_VERSION=3;
const ALL_DAYS=Object.freeze([1,2,3,4,5,6,7]);
const WEEKDAYS=Object.freeze([1,2,3,4,5]);
const TASK_CATALOG=Object.freeze([
  {id:'kids_wakeup',cat:'Barn',name:'Morgenansvar med barna',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house',defaultSelected:true},
  {id:'kids_get_ready',cat:'Barn',name:'Levering i barnehage eller skole',freq:5,preferredDays:WEEKDAYS,pts:30,type:'daily',kind:'house',defaultSelected:true},
  {id:'lunch',cat:'Barn',name:'Lage matpakker',freq:5,preferredDays:WEEKDAYS,pts:10,type:'daily',kind:'house',defaultSelected:true},
  {id:'bag',cat:'Barn',name:'Pakke sekker og utstyr',freq:5,preferredDays:WEEKDAYS,pts:10,type:'daily',kind:'house',defaultSelected:true},
  {id:'bedkids',cat:'Barn',name:'Kveldsstell og legging',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house',defaultSelected:true},
  {id:'school',cat:'Barn',name:'Skole- og barnehagekommunikasjon',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'homework',cat:'Barn',name:'Lekser',freq:5,pts:10,type:'flex',kind:'house'},
  {id:'kids_clothes_school',cat:'Barn',name:'Skifte klær til barnehage eller skole',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'kids_clothes_buy',cat:'Barn',name:'Kjøpe nye klær til barna',freq:1,pts:20,type:'period',kind:'house'},
  {id:'kids_clothes_sort',cat:'Barn',name:'Sortere klær barna har vokst ut av',freq:1,pts:30,type:'period',kind:'house'},

  {id:'dish_fill',cat:'Kjøkken',name:'Sette inn i oppvaskmaskinen',freq:7,preferredDays:ALL_DAYS,pts:10,type:'daily',kind:'house'},
  {id:'dish_empty',cat:'Kjøkken',name:'Tømme oppvaskmaskinen',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house',defaultSelected:true},
  {id:'kitchen',cat:'Kjøkken',name:'Rydde kjøkkenet etter middag',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house',defaultSelected:true},
  {id:'kitchen_after_meal',cat:'Kjøkken',name:'Rydde spisebordet',freq:4,pts:10,type:'flex',kind:'house'},
  {id:'counter',cat:'Kjøkken',name:'Tørke kjøkkenbenken',freq:7,preferredDays:ALL_DAYS,pts:10,type:'daily',kind:'house'},
  {id:'dinner',cat:'Kjøkken',name:'Lage middag',freq:7,preferredDays:ALL_DAYS,pts:30,type:'daily',kind:'house',defaultSelected:true},
  {id:'meal_other',cat:'Kjøkken',name:'Lage frokost eller kveldsmat',freq:4,pts:20,type:'flex',kind:'house'},
  {id:'fridge_clean',cat:'Kjøkken',name:'Vaske kjøleskapet',freq:1,pts:40,type:'period',kind:'house'},
  {id:'dishwasher_clean',cat:'Kjøkken',name:'Rense oppvaskmaskinen',freq:1,pts:30,type:'period',kind:'house'},
  {id:'oven_clean',cat:'Kjøkken',name:'Vaske stekeovnen',freq:1,pts:40,type:'period',kind:'house'},

  {id:'laundry_start',cat:'Klesvask',name:'Sette på en vaskemaskin',freq:3,pts:20,type:'flex',kind:'house',defaultSelected:true},
  {id:'laundry_hang',cat:'Klesvask',name:'Henge opp klær',freq:3,pts:30,type:'flex',kind:'house',defaultSelected:true},
  {id:'laundry_fold',cat:'Klesvask',name:'Brette og legge på plass klær',freq:3,pts:40,type:'flex',kind:'house',defaultSelected:true},
  {id:'vacuum',cat:'Renhold',name:'Støvsuge',freq:2,pts:20,type:'flex',kind:'house'},
  {id:'floors',cat:'Renhold',name:'Vaske gulv',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'dust',cat:'Renhold',name:'Tørke støv',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'living',cat:'Stue',name:'Rydde stue og oppholdsrom',freq:3,pts:10,type:'flex',kind:'house',defaultSelected:true},
  {id:'hallway',cat:'Stue',name:'Rydde gangen',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'sofa_tidy',cat:'Stue',name:'Rydde sofaområdet',freq:2,pts:10,type:'flex',kind:'house'},

  {id:'bath_toilet',cat:'Bad',name:'Vaske toalettet',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'bath_sink',cat:'Bad',name:'Vaske servant og speil',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'bath_shower',cat:'Bad',name:'Vaske badekar eller dusj',freq:1,pts:50,type:'flex',kind:'house'},
  {id:'bath_floor',cat:'Bad',name:'Vaske badegulvet',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'bath_tidy',cat:'Bad',name:'Rydde badet',freq:3,pts:20,type:'flex',kind:'house',defaultSelected:true},
  {id:'bath_drain',cat:'Bad',name:'Rense sluk',freq:1,pts:40,type:'period',kind:'house'},

  {id:'bed',cat:'Soverom',name:'Bytte sengetøy',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'kids_bedding',cat:'Soverom',name:'Bytte sengetøy på barnas senger',freq:1,pts:30,type:'flex',kind:'house'},

  {id:'pet_food',cat:'Dyr',name:'Gi mat og friskt vann',freq:7,preferredDays:ALL_DAYS,pts:10,type:'daily',kind:'house'},
  {id:'pet_walk',cat:'Dyr',name:'Lufte hund',freq:7,preferredDays:ALL_DAYS,pts:30,type:'daily',kind:'house'},
  {id:'pet_litter',cat:'Dyr',name:'Rense kattekasse',freq:7,preferredDays:ALL_DAYS,pts:30,type:'daily',kind:'house'},
  {id:'pet_groom',cat:'Dyr',name:'Stell og børsting',freq:2,pts:30,type:'flex',kind:'house'},
  {id:'pet_home_clean',cat:'Dyr',name:'Rengjøre bur, akvarium eller dyreområde',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'pet_supplies',cat:'Dyr',name:'Kjøpe dyremat og utstyr',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'pet_vet',cat:'Dyr',name:'Veterinær, vaksiner og avtaler',freq:1,pts:30,type:'period',kind:'house'},
  {id:'pet_meds',cat:'Dyr',name:'Gi medisiner eller behandling',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house'},

  {id:'garden_mow',cat:'Hage & ute',name:'Klippe gress',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_tidy',cat:'Hage & ute',name:'Rydde uteområdet',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_snow',cat:'Hage & ute',name:'Måke snø eller strø',freq:1,pts:40,type:'flex',kind:'house'},

  {id:'car_wash',cat:'Bil',name:'Vaske bilen utvendig',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'car_fuel',cat:'Bil',name:'Fylle drivstoff eller lade',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'car_service',cat:'Bil',name:'Bestille service eller EU-kontroll',freq:1,pts:20,type:'period',kind:'house'},
  {id:'car_tires',cat:'Bil',name:'Skifte eller følge opp dekk',freq:1,pts:40,type:'period',kind:'house'},

  {id:'shop',cat:'Innkjøp',name:'Handle mat',freq:2,pts:20,type:'flex',kind:'house',defaultSelected:true},
  {id:'shopping_household',cat:'Innkjøp',name:'Fylle på husholdningsvarer',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'shopping_returns',cat:'Innkjøp',name:'Returnere varer eller pakker',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'trash',cat:'Vedlikehold',name:'Ta ut søppel og sortere avfall',freq:2,pts:10,type:'flex',kind:'house',defaultSelected:true},
  {id:'windows',cat:'Vedlikehold',name:'Vaske vinduer',freq:1,pts:50,type:'period',kind:'house'},
  {id:'laundry_machine_clean',cat:'Vedlikehold',name:'Rense vaskemaskin eller tørketrommel',freq:1,pts:20,type:'period',kind:'house'},
  {id:'maintenance_smoke',cat:'Vedlikehold',name:'Sjekke røykvarslere',freq:1,pts:30,type:'period',kind:'house'},
  {id:'maintenance_service',cat:'Vedlikehold',name:'Bestille håndverker eller service',freq:1,pts:20,type:'period',kind:'house'},

  {id:'admin',cat:'Planlegging & admin',name:'Avtaler, lege og tannlege',freq:1,pts:20,type:'period',kind:'house'},
  {id:'gifts',cat:'Planlegging & admin',name:'Gaver og bursdager',freq:1,pts:30,type:'period',kind:'house'},
  {id:'weekly_menu',cat:'Planlegging & admin',name:'Lage ukemeny',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'weekly_plan',cat:'Planlegging & admin',name:'Planlegge uken',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'train',cat:'Personlig investering',name:'Trening',freq:3,pts:10,type:'flex',kind:'personal',defaultSelected:true}
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
  ['Stå opp med barna','Morgenansvar med barna'],
  ['Gjøre barna klare for barnehage eller skole','Levering i barnehage eller skole'],
  ['Tømme/pakke barnas sekk','Pakke sekker og utstyr'],
  ['Pakke sekk til barna','Pakke sekker og utstyr'],
  ['Barnas sekker og utstyr','Pakke sekker og utstyr'],
  ['Legging','Kveldsstell og legging'],
  ['Rydde kjøkkenet','Rydde kjøkkenet etter middag'],
  ['Rydde etter måltid','Rydde spisebordet'],
  ['Vaske kjøkkenbenken','Tørke kjøkkenbenken'],
  ['Lage frokost, lunsj eller kveldsmat','Lage frokost eller kveldsmat'],
  ['Brette klær','Brette og legge på plass klær'],
  ['Rydde stuen','Rydde stue og oppholdsrom'],
  ['Søppel og pant','Ta ut søppel og sortere avfall'],
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
  if(catalogTask&&task?.customizedFields?.includes?.('name'))return cleanName(task.name);
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
function customizedFields(task){
  return [...new Set((Array.isArray(task?.customizedFields)?task.customizedFields:[]).map(String).filter(Boolean))];
}
function normalizeKnownTask(task,applyCatalog){
  if(!task||typeof task!=='object')return task;
  const base=TASK_BY_ID.get(String(task.id));
  if(!base)return{...task,name:canonicalName(task)};
  const custom=customizedFields(task),isCustom=field=>custom.includes(field);
  const next={...task,id:base.id,kind:base.kind};
  if(applyCatalog&&!isCustom('name'))next.name=base.name;
  else next.name=cleanName(next.name||base.name);
  if(applyCatalog&&!isCustom('cat'))next.cat=base.cat;
  else next.cat=cleanName(next.cat||base.cat);
  if(applyCatalog&&!isCustom('pts')&&!isCustom('effortLevel'))next.pts=base.pts;
  if(!Number.isFinite(Number(next.freq))||Number(next.freq)<1)next.freq=base.freq;
  if(!['daily','flex','period'].includes(next.type))next.type=base.type;
  const days=preferredDays(next);
  if(days.length)next.preferredDays=days;
  else if(next.type==='daily'&&Array.isArray(base.preferredDays)){
    next.preferredDays=[...base.preferredDays];
    next.freq=next.preferredDays.length;
  }
  else delete next.preferredDays;
  if(custom.length)next.customizedFields=custom;
  else delete next.customizedFields;
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
  const catalogIdByName=new Map();
  for(const base of TASK_CATALOG)catalogIdByName.set(cleanName(base.name).toLocaleLowerCase('nb'),base.id);
  for(const [oldName,newName] of LEGACY_NAME_ALIASES){
    const id=catalogIdByName.get(cleanName(newName).toLocaleLowerCase('nb'));
    if(id)catalogIdByName.set(cleanName(oldName).toLocaleLowerCase('nb'),id);
  }
  for(const task of Array.isArray(tasks)?tasks:[]){
    const candidates=expandLegacy?expandLegacyTask(task):null;
    for(const raw of candidates||[task]){
      const semanticId=expandLegacy&&!TASK_BY_ID.has(String(raw?.id))?catalogIdByName.get(cleanName(raw?.name).toLocaleLowerCase('nb')):null;
      const candidate=semanticId?{...raw,id:semanticId}:raw;
      const next=normalizeKnownTask(candidate,applyCatalog),index=out.findIndex(item=>String(item?.id)===String(next?.id));
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
  if(value.categoryRelevant&&typeof value.categoryRelevant==='object'){
    next.categoryRelevant={...value.categoryRelevant};
    if(Object.prototype.hasOwnProperty.call(value.categoryRelevant,'Vask & klær')){
      next.categoryRelevant.Klesvask=value.categoryRelevant['Vask & klær'];
      next.categoryRelevant.Renhold=value.categoryRelevant['Vask & klær'];
      delete next.categoryRelevant['Vask & klær'];
    }
  }
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
