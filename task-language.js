((root)=>{
'use strict';

const VERSION='20260903-master1';
const CATALOG_VERSION=4;
const ALL_DAYS=Object.freeze([1,2,3,4,5,6,7]);
const WEEKDAYS=Object.freeze([1,2,3,4,5]);
const TASK_CATALOG=Object.freeze([
  {id:'kids_wakeup',cat:'Barn',name:'Morgenansvar med barna',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house'},
  {id:'kids_get_ready',cat:'Barn',name:'Gjøre barna klare for barnehage/skole',freq:5,preferredDays:WEEKDAYS,pts:30,type:'daily',kind:'house'},
  {id:'lunch',cat:'Barn',name:'Lage matpakker',freq:5,preferredDays:WEEKDAYS,pts:10,type:'daily',kind:'house'},
  {id:'bag',cat:'Barn',name:'Pakke sekker og utstyr',freq:5,preferredDays:WEEKDAYS,pts:10,type:'daily',kind:'house'},
  {id:'kids_dropoff',cat:'Barn',name:'Levere i barnehage/skole',freq:5,preferredDays:WEEKDAYS,pts:20,type:'daily',kind:'house'},
  {id:'kids_pickup',cat:'Barn',name:'Hente i barnehage/skole',freq:5,preferredDays:WEEKDAYS,pts:20,type:'daily',kind:'house'},
  {id:'bedkids',cat:'Barn',name:'Kveldsstell og legging',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house'},
  {id:'kids_bath',cat:'Barn',name:'Bading/dusjing av barna',freq:2,pts:20,type:'flex',kind:'house'},
  {id:'school',cat:'Barn',name:'Følge opp barnehage/skole',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'homework',cat:'Barn',name:'Følge opp lekser/skolearbeid',freq:5,pts:10,type:'flex',kind:'house'},
  {id:'kids_clothes_school',cat:'Barn',name:'Følge opp skiftetøy og klær i barnehage/skole',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'kids_activity_dropoff',cat:'Barn',name:'Kjøre til fritidsaktiviteter',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'kids_activity_pickup',cat:'Barn',name:'Hente fra fritidsaktiviteter',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'kids_dates',cat:'Barn',name:'Holde oversikt over barnas bursdager og avtaler',freq:1,pts:10,type:'flex',kind:'house'},

  {id:'dish_fill',cat:'Kjøkken',name:'Sette inn i oppvaskmaskinen',freq:7,preferredDays:ALL_DAYS,pts:10,type:'daily',kind:'house',defaultSelected:true},
  {id:'dish_empty',cat:'Kjøkken',name:'Tømme oppvaskmaskinen',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house',defaultSelected:true},
  {id:'dish_hand',cat:'Kjøkken',name:'Vaske opp for hånd',freq:2,pts:10,type:'flex',kind:'house'},
  {id:'kitchen',cat:'Kjøkken',name:'Rydde kjøkkenet etter måltid',freq:7,preferredDays:ALL_DAYS,pts:20,type:'daily',kind:'house',defaultSelected:true},
  {id:'counter',cat:'Kjøkken',name:'Tørke av kjøkkenbenken',freq:7,preferredDays:ALL_DAYS,pts:10,type:'daily',kind:'house'},
  {id:'dinner',cat:'Kjøkken',name:'Lage middag',freq:5,preferredDays:WEEKDAYS,pts:30,type:'daily',kind:'house',defaultSelected:true},
  {id:'meal_other',cat:'Kjøkken',name:'Lage frokost eller kveldsmat',freq:7,pts:20,type:'flex',kind:'house'},
  {id:'shop',cat:'Kjøkken',name:'Handle mat',freq:2,pts:20,type:'flex',kind:'house'},
  {id:'trash',cat:'Kjøkken',name:'Ta ut søppel og sortere avfall',freq:2,pts:10,type:'flex',kind:'house',defaultSelected:true},
  {id:'fridge_clear',cat:'Kjøkken',name:'Rydde og kaste gammel mat i kjøleskapet',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'fridge_clean',cat:'Kjøkken',name:'Rengjøre kjøleskapet',freq:1,pts:40,type:'period',kind:'house'},
  {id:'hob_clean',cat:'Kjøkken',name:'Rengjøre platetopp/komfyr',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'oven_clean',cat:'Kjøkken',name:'Rengjøre stekeovnen',freq:1,pts:40,type:'period',kind:'house'},
  {id:'microwave_clean',cat:'Kjøkken',name:'Rengjøre mikrobølgeovn',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'dishwasher_clean',cat:'Kjøkken',name:'Rense oppvaskmaskinen',freq:1,pts:30,type:'period',kind:'house'},

  {id:'laundry_whole',cat:'Klesvask',name:'Klesvask, hele løpet',freq:3,pts:40,type:'flex',kind:'house'},
  {id:'laundry_sort',cat:'Klesvask',name:'Sortere klesvask',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'laundry_start',cat:'Klesvask',name:'Sette på vaskemaskinen',freq:3,pts:20,type:'flex',kind:'house',defaultSelected:true},
  {id:'laundry_hang',cat:'Klesvask',name:'Henge opp klær',freq:3,pts:30,type:'flex',kind:'house',defaultSelected:true},
  {id:'laundry_dryer',cat:'Klesvask',name:'Tørke klær i tørketrommel',freq:3,pts:20,type:'flex',kind:'house'},
  {id:'laundry_fold',cat:'Klesvask',name:'Brette klær',freq:3,pts:40,type:'flex',kind:'house',defaultSelected:true},
  {id:'laundry_put_away',cat:'Klesvask',name:'Legge klær på plass',freq:3,pts:20,type:'flex',kind:'house'},
  {id:'laundry_stain',cat:'Klesvask',name:'Flekkbehandle klær',freq:1,pts:10,type:'flex',kind:'house'},
  {id:'laundry_iron',cat:'Klesvask',name:'Stryke eller dampe klær',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'vacuum',cat:'Renhold',name:'Støvsuge',freq:2,pts:20,type:'flex',kind:'house'},
  {id:'floors',cat:'Renhold',name:'Vaske gulv',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'dust',cat:'Renhold',name:'Tørke støv',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'clean_doors_trim',cat:'Renhold',name:'Vaske dører, karmer og lister',freq:1,pts:30,type:'period',kind:'house'},
  {id:'clean_window_sills',cat:'Renhold',name:'Vaske vinduskarmer',freq:1,pts:20,type:'period',kind:'house'},
  {id:'vacuum_furniture',cat:'Renhold',name:'Støvsuge sofa og møbler',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'clean_stairs',cat:'Renhold',name:'Rengjøre trapper',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'clean_entry',cat:'Renhold',name:'Rengjøre entré/gang',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'deep_clean',cat:'Renhold',name:'Hovedrengjøring',freq:1,pts:50,type:'period',kind:'house'},

  {id:'living',cat:'Stue & fellesområder',name:'Rydde stue og oppholdsrom',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'hallway',cat:'Stue & fellesområder',name:'Rydde gang/entré',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'common_toys',cat:'Stue & fellesområder',name:'Rydde leker og ting i fellesrom',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'outerwear_tidy',cat:'Stue & fellesområder',name:'Holde orden på sko og yttertøy',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'dining_area_tidy',cat:'Stue & fellesområder',name:'Rydde spiseplass/spisebord',freq:3,pts:10,type:'flex',kind:'house'},

  {id:'bath_toilet',cat:'Bad',name:'Vaske toalettet',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'bath_sink',cat:'Bad',name:'Vaske servant og speil',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'bath_shower',cat:'Bad',name:'Vaske dusj/badekar',freq:1,pts:50,type:'flex',kind:'house'},
  {id:'bath_floor',cat:'Bad',name:'Vaske badegulvet',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'bath_tidy',cat:'Bad',name:'Rydde badet',freq:3,pts:20,type:'flex',kind:'house'},
  {id:'bath_towels',cat:'Bad',name:'Skifte håndklær',freq:1,pts:10,type:'flex',kind:'house'},
  {id:'bath_supplies',cat:'Bad',name:'Fylle på toalettpapir og hygieneartikler',freq:1,pts:10,type:'flex',kind:'house'},
  {id:'bath_drain',cat:'Bad',name:'Rense sluk',freq:1,pts:40,type:'period',kind:'house'},

  {id:'bed_make',cat:'Soverom',name:'Re opp sengen',freq:7,preferredDays:ALL_DAYS,pts:10,type:'daily',kind:'house'},
  {id:'bedroom_tidy',cat:'Soverom',name:'Rydde soverommet',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'bed',cat:'Soverom',name:'Bytte sengetøy',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'kids_bedding',cat:'Soverom',name:'Bytte sengetøy på barnas senger',freq:1,pts:30,type:'flex',kind:'house'},

  {id:'pet_food',cat:'Dyr',name:'Gi mat og friskt vann',freq:7,preferredDays:ALL_DAYS,pts:10,type:'daily',kind:'house'},
  {id:'pet_walk',cat:'Dyr',name:'Lufte hund',freq:7,preferredDays:ALL_DAYS,pts:30,type:'daily',kind:'house'},
  {id:'pet_litter',cat:'Dyr',name:'Rense kattekasse',freq:7,preferredDays:ALL_DAYS,pts:30,type:'daily',kind:'house'},
  {id:'pet_groom',cat:'Dyr',name:'Stell og børsting',freq:2,pts:30,type:'flex',kind:'house'},
  {id:'pet_nails',cat:'Dyr',name:'Klippe klør',freq:1,pts:20,type:'period',kind:'house'},
  {id:'pet_bath',cat:'Dyr',name:'Bade/vaske dyret',freq:1,pts:30,type:'period',kind:'house'},
  {id:'pet_home_clean',cat:'Dyr',name:'Rengjøre bur, akvarium eller dyreområde',freq:1,pts:30,type:'flex',kind:'house'},
  {id:'pet_supplies',cat:'Dyr',name:'Kjøpe dyremat og utstyr',freq:1,pts:20,type:'flex',kind:'house'},

  {id:'garden_mow',cat:'Hage & ute',name:'Klippe plen',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_tidy',cat:'Hage & ute',name:'Rydde uteområdet',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_snow',cat:'Hage & ute',name:'Måke snø / strø',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'garden_leaves',cat:'Hage & ute',name:'Rake løv',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_weed',cat:'Hage & ute',name:'Luke ugress',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'garden_water',cat:'Hage & ute',name:'Vanne uteplanter',freq:3,pts:10,type:'flex',kind:'house'},
  {id:'garden_patio',cat:'Hage & ute',name:'Rengjøre terrasse/uteplass',freq:1,pts:30,type:'period',kind:'house'},

  {id:'car_fuel',cat:'Bil',name:'Fylle drivstoff / lade',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'car_wash',cat:'Bil',name:'Vaske bilen utvendig',freq:1,pts:40,type:'flex',kind:'house'},
  {id:'car_interior',cat:'Bil',name:'Rydde og rengjøre bilen innvendig',freq:1,pts:30,type:'flex',kind:'house'},

  {id:'weekly_plan',cat:'Planlegging & admin',name:'Planlegge uken',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'weekly_menu',cat:'Planlegging & admin',name:'Lage ukemeny',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'family_calendar',cat:'Planlegging & admin',name:'Holde familiekalenderen oppdatert',freq:1,pts:20,type:'flex',kind:'house'},
  {id:'gifts',cat:'Planlegging & admin',name:'Gaver og bursdager',freq:1,pts:30,type:'period',kind:'house'},
  {id:'bills',cat:'Planlegging & admin',name:'Betale regninger',freq:1,pts:20,type:'period',kind:'house'}
].map(task=>Object.freeze(task)));

const TASK_BY_ID=new Map(TASK_CATALOG.map(task=>[String(task.id),task]));
const RETIRED_STANDARD_IDS=new Set([
  'kids_clothes_buy','kids_clothes_sort','kitchen_after_meal','sofa_tidy','pet_vet','pet_meds',
  'car_service','car_tires','shopping_household','shopping_returns','windows','laundry_machine_clean',
  'maintenance_smoke','maintenance_service','admin','train'
]);
const LEGACY_SPLITS=Object.freeze({
  laundry:['laundry_start','laundry_hang','laundry_fold'],
  bath:['bath_toilet','bath_sink','bath_shower','bath_floor']
});
const LEGACY_NAME_ALIASES=new Map([
  ['Fylle oppvaskmaskin','Sette inn i oppvaskmaskinen'],
  ['Fylle oppvaskmaskinen','Sette inn i oppvaskmaskinen'],
  ['Tømme oppvaskmaskin','Tømme oppvaskmaskinen'],
  ['Stå opp med barna','Morgenansvar med barna'],
  ['Gjøre barna klare for barnehage eller skole','Gjøre barna klare for barnehage/skole'],
  ['Tømme/pakke barnas sekk','Pakke sekker og utstyr'],
  ['Pakke sekk til barna','Pakke sekker og utstyr'],
  ['Barnas sekker og utstyr','Pakke sekker og utstyr'],
  ['Legging','Kveldsstell og legging'],
  ['Rydde kjøkkenet','Rydde kjøkkenet etter måltid'],
  ['Rydde kjøkkenet etter middag','Rydde kjøkkenet etter måltid'],
  ['Rydde etter måltid','Rydde kjøkkenet etter måltid'],
  ['Vaske kjøkkenbenken','Tørke av kjøkkenbenken'],
  ['Tørke kjøkkenbenken','Tørke av kjøkkenbenken'],
  ['Lage frokost, lunsj eller kveldsmat','Lage frokost eller kveldsmat'],
  ['Sette på en vaskemaskin','Sette på vaskemaskinen'],
  ['Brette og legge på plass klær','Brette klær'],
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
function normalizeKnownTask(task,applyCatalog,applyPoints=applyCatalog){
  if(!task||typeof task!=='object')return task;
  const base=TASK_BY_ID.get(String(task.id));
  if(!base){
    const next={...task,name:canonicalName(task)};
    if(applyCatalog&&RETIRED_STANDARD_IDS.has(String(task.id))&&!customizedFields(task).includes('cat'))next.cat='Egendefinert';
    return next;
  }
  const custom=customizedFields(task),isCustom=field=>custom.includes(field);
  const next={...task,id:base.id,kind:base.kind};
  if(!isCustom('name'))next.name=base.name;
  else next.name=cleanName(next.name||base.name);
  if(!isCustom('cat'))next.cat=base.cat;
  else next.cat=cleanName(next.cat||base.cat);
  if(applyPoints&&!isCustom('pts')&&!isCustom('effortLevel'))next.pts=base.pts;
  if(!Number.isFinite(Number(next.freq))||Number(next.freq)<1)next.freq=base.freq;
  if(!['daily','flex','period'].includes(next.type))next.type=base.type;
  if(applyCatalog&&!preferredDays(next).length&&preferredDays(base).length)next.preferredDays=preferredDays(base);
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
function normalizeTasks(tasks,{applyCatalog=true,applyPoints=applyCatalog,expandLegacy=true}={}){
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
      const next=normalizeKnownTask(candidate,applyCatalog,applyPoints),index=out.findIndex(item=>String(item?.id)===String(next?.id));
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
  const next={...value},catalogVersion=Number(value.taskCatalogVersion||0),applyCatalog=catalogVersion<CATALOG_VERSION,applyPoints=catalogVersion<2;
  if(value.categoryRelevant&&typeof value.categoryRelevant==='object'){
    next.categoryRelevant={...value.categoryRelevant};
    if(Object.prototype.hasOwnProperty.call(value.categoryRelevant,'Vask & klær')){
      next.categoryRelevant.Klesvask=value.categoryRelevant['Vask & klær'];
      next.categoryRelevant.Renhold=value.categoryRelevant['Vask & klær'];
      delete next.categoryRelevant['Vask & klær'];
    }
    if(Object.prototype.hasOwnProperty.call(next.categoryRelevant,'Stue')){
      next.categoryRelevant['Stue & fellesområder']=next.categoryRelevant.Stue;
      delete next.categoryRelevant.Stue;
    }
    delete next.categoryRelevant.Innkjøp;
    delete next.categoryRelevant.Vedlikehold;
    delete next.categoryRelevant['Personlig investering'];
  }
  if(Array.isArray(value.tasks))next.tasks=normalizeTasks(value.tasks,{applyCatalog,applyPoints,expandLegacy:true});
  if(Array.isArray(value.custom))next.custom=normalizeTasks(value.custom,{applyCatalog:false,expandLegacy:false});
  if(value.taskOverrides&&typeof value.taskOverrides==='object'){
    next.taskOverrides=Object.fromEntries(Object.entries(value.taskOverrides).map(([id,task])=>[id,normalizeKnownTask({...task,id:task?.id??id},applyCatalog,applyPoints)]));
  }
  if(Array.isArray(value.completions))next.completions=value.completions.map(normalizeCompletion);
  if(Array.isArray(value.seenRequests))next.seenRequests=value.seenRequests.map(normalizeLinkedItem);
  if(Array.isArray(value.work))next.work=value.work.map(normalizeTitledItem);
  if(Array.isArray(value.plannedTasks))next.plannedTasks=value.plannedTasks.map(normalizeTitledItem);
  if(Array.isArray(value.setupHistory))next.setupHistory=value.setupHistory.map(snapshot=>snapshot&&typeof snapshot==='object'?{
    ...snapshot,
    tasks:normalizeTasks(snapshot.tasks,{applyCatalog:true,applyPoints,expandLegacy:true}),
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
