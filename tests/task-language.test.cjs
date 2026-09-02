const assert=require('node:assert/strict');
const language=require('../task-language.js');

const oldState={
  tasks:[
    {id:'dish_empty',name:'Tømme oppvaskmaskin',owner:'Tore',freq:7,pts:20,type:'daily'},
    {id:'dish_fill',name:'Fylle oppvaskmaskin',owner:'Jannicke',freq:7,pts:20,type:'daily'},
    {id:'laundry',name:'Vaske/brette klær',owner:'Tore',freq:3,pts:45,type:'flex'},
    {id:'bath',name:'Vaske bad',owner:'Jannicke',freq:1,pts:70,type:'flex'},
    {id:'bag',name:'Pakke sekk til barna',freq:5,pts:15,type:'daily'}
  ],
  completions:[
    {taskId:'dish_fill',taskName:'Fylle oppvaskmaskin'},
    {taskId:'laundry',taskName:'Vaske/brette klær'}
  ],
  seenRequests:[
    {
      source:'nudge',
      taskId:'dish_fill',
      taskName:'Fylle oppvaskmaskin',
      text:'Jeg har behov for litt avlastning i dag. Hadde satt stor pris på om du tok fylle oppvaskmaskin. Det ville gjort dagen litt lettere for meg ❤️'
    },
    {
      source:'manual',
      taskId:'custom',
      taskName:'Vanne planter',
      text:'Kan du vanne plantene?'
    }
  ],
  setupHistory:[{tasks:[{id:'dish_fill',name:'Fylle oppvaskmaskin',pts:20}],custom:[]}],
  work:[{title:'Vaske/brette klær'}]
};

const next=language.normalizeState(oldState);
const byId=Object.fromEntries(next.tasks.map(task=>[task.id,task]));

assert.equal(language.catalog.length,65,'katalogen skal inneholde alle utfylte og nye oppgaver');
assert.equal(new Set(language.catalog.map(task=>task.id)).size,65,'tekniske ID-er skal være unike');
assert.ok(language.catalog.every(task=>[10,20,30,40,50].includes(task.pts)),'alle katalogpoeng skal følge femtrinnsskalaen');

const catalogById=Object.fromEntries(language.catalog.map(task=>[task.id,task]));
const originalAppIds=[
  'dish_empty','dish_fill','kitchen','counter','dinner','fridge_clean','dishwasher_clean','oven_clean',
  'lunch','bag','bedkids','school','homework','kids_clothes_school','kids_clothes_buy','kids_clothes_sort',
  'vacuum','floors','dust','living','hallway','sofa_tidy','bath_tidy','bath_drain','bed','kids_bedding',
  'pet_food','pet_walk','pet_litter','pet_groom','pet_home_clean','pet_supplies','pet_vet','pet_meds',
  'garden_mow','garden_tidy','garden_snow','car_wash','car_fuel','car_service','car_tires','shop',
  'shopping_household','shopping_returns','trash','windows','laundry_machine_clean','maintenance_smoke',
  'maintenance_service','admin','gifts','weekly_menu','weekly_plan','train'
];
assert.deepEqual(
  originalAppIds.filter(id=>!catalogById[id]),
  [],
  'den opprinnelige appkatalogen skal beholdes, også når Excel-arket brukes til verdsetting'
);
assert.ok(['laundry_start','laundry_hang','laundry_fold'].every(id=>catalogById[id]),'samlet klesvask skal være erstattet av de tre godkjente deloppgavene');
assert.ok(['bath_toilet','bath_sink','bath_shower','bath_floor'].every(id=>catalogById[id]),'samlet badvask skal være erstattet av de fire godkjente deloppgavene');
assert.deepEqual(
  [catalogById.kids_wakeup.cat,catalogById.kids_wakeup.name,catalogById.kids_wakeup.pts],
  ['Barn','Stå opp med barna',20]
);
assert.deepEqual(
  [catalogById.kids_get_ready.cat,catalogById.kids_get_ready.name,catalogById.kids_get_ready.pts],
  ['Barn','Gjøre barna klare for barnehage eller skole',30]
);
assert.equal(catalogById.laundry_start.name,'Sette på en vaskemaskin');
assert.equal(catalogById.laundry_hang.name,'Henge opp klær');
assert.equal(catalogById.laundry_fold.name,'Brette klær');
assert.equal(catalogById.bath_shower.name,'Vaske badekar eller dusj');
assert.equal(catalogById.car_wash.name,'Vaske bilen utvendig');

assert.deepEqual(
  next.tasks.map(task=>task.id),
  ['dish_empty','dish_fill','laundry_start','laundry_hang','laundry_fold','bath_toilet','bath_sink','bath_shower','bath_floor','bag']
);
assert.equal(byId.dish_empty.name,'Tømme oppvaskmaskinen');
assert.equal(byId.dish_fill.name,'Sette inn i oppvaskmaskinen');
assert.equal(byId.dish_fill.pts,10);
assert.equal(byId.laundry_start.pts,20);
assert.equal(byId.laundry_hang.pts,30);
assert.equal(byId.laundry_fold.pts,40);
assert.equal(byId.bath_toilet.pts,40);
assert.equal(byId.bath_sink.pts,30);
assert.equal(byId.bath_shower.pts,50);
assert.equal(byId.bath_floor.pts,40);
assert.equal(byId.bag.pts,10);
assert.equal(next.taskCatalogVersion,language.CATALOG_VERSION);

assert.equal(next.completions[0].taskId,'dish_fill');
assert.equal(next.completions[0].taskName,'Sette inn i oppvaskmaskinen');
assert.equal(next.completions[1].taskId,'laundry','historisk samlet fullføring skal ikke bli telt tre ganger');
assert.equal(next.completions[1].taskName,'Klesvask (tidligere samlet)');
assert.equal(next.seenRequests[0].taskName,'Sette inn i oppvaskmaskinen');
assert.equal(next.seenRequests[0].text,'Jeg har behov for litt avlastning i dag. Jeg hadde satt stor pris på om du kunne ta deg av oppgaven «Sette inn i oppvaskmaskinen». Det ville gjort dagen litt lettere for meg ❤️');
assert.equal(next.seenRequests[1].text,'Kan du vanne plantene?','brukerskrevet tekst skal ikke omskrives');
assert.equal(next.setupHistory[0].tasks[0].name,'Sette inn i oppvaskmaskinen');
assert.equal(next.setupHistory[0].tasks[0].pts,10);
assert.equal(next.work[0].title,'Klesvask (tidligere samlet)');

const customized=language.normalizeState({
  taskCatalogVersion:language.CATALOG_VERSION,
  tasks:[{id:'dinner',name:'Middag',cat:'Annet',freq:2,pts:45,type:'flex',kind:'house'}]
});
assert.equal(customized.tasks[0].name,'Lage middag');
assert.equal(customized.tasks[0].cat,'Kjøkken');
assert.equal(customized.tasks[0].pts,45,'egne poengvalg etter migreringen skal beholdes');
assert.equal(customized.tasks[0].freq,2,'egen rytme skal beholdes');

console.log('ok - oppgavekatalog, poeng og migrering');
