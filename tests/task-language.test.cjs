const assert=require('node:assert/strict');
const language=require('../task-language.js');

const MASTER={
  'Barn':['Morgenansvar med barna','Gjøre barna klare for barnehage/skole','Lage matpakker','Pakke sekker og utstyr','Levere i barnehage/skole','Hente i barnehage/skole','Kveldsstell og legging','Bading/dusjing av barna','Følge opp barnehage/skole','Følge opp lekser/skolearbeid','Følge opp skiftetøy og klær i barnehage/skole','Kjøre til fritidsaktiviteter','Hente fra fritidsaktiviteter','Holde oversikt over barnas bursdager og avtaler'],
  'Kjøkken':['Sette inn i oppvaskmaskinen','Tømme oppvaskmaskinen','Vaske opp for hånd','Rydde kjøkkenet etter måltid','Tørke av kjøkkenbenken','Lage middag','Lage frokost eller kveldsmat','Handle mat','Ta ut søppel og sortere avfall','Rydde og kaste gammel mat i kjøleskapet','Rengjøre kjøleskapet','Rengjøre platetopp/komfyr','Rengjøre stekeovnen','Rengjøre mikrobølgeovn','Rense oppvaskmaskinen'],
  'Klesvask':['Klesvask, hele løpet','Sortere klesvask','Sette på vaskemaskinen','Henge opp klær','Tørke klær i tørketrommel','Brette klær','Legge klær på plass','Flekkbehandle klær','Stryke eller dampe klær'],
  'Renhold':['Støvsuge','Vaske gulv','Tørke støv','Vaske dører, karmer og lister','Vaske vinduskarmer','Støvsuge sofa og møbler','Rengjøre trapper','Rengjøre entré/gang','Hovedrengjøring'],
  'Stue & fellesområder':['Rydde stue og oppholdsrom','Rydde gang/entré','Rydde leker og ting i fellesrom','Holde orden på sko og yttertøy','Rydde spiseplass/spisebord'],
  'Bad':['Vaske toalettet','Vaske servant og speil','Vaske dusj/badekar','Vaske badegulvet','Rydde badet','Skifte håndklær','Fylle på toalettpapir og hygieneartikler','Rense sluk'],
  'Soverom':['Re opp sengen','Rydde soverommet','Bytte sengetøy','Bytte sengetøy på barnas senger'],
  'Dyr':['Gi mat og friskt vann','Lufte hund','Rense kattekasse','Stell og børsting','Klippe klør','Bade/vaske dyret','Rengjøre bur, akvarium eller dyreområde','Kjøpe dyremat og utstyr'],
  'Hage & ute':['Klippe plen','Rydde uteområdet','Måke snø / strø','Rake løv','Luke ugress','Vanne uteplanter','Rengjøre terrasse/uteplass'],
  'Bil':['Fylle drivstoff / lade','Vaske bilen utvendig','Rydde og rengjøre bilen innvendig'],
  'Planlegging & admin':['Planlegge uken','Lage ukemeny','Holde familiekalenderen oppdatert','Gaver og bursdager','Betale regninger']
};

const actual={};
for(const task of language.catalog)(actual[task.cat]??=[]).push(task.name);
assert.deepEqual(actual,MASTER,'standardkatalogen skal være identisk med den låste masterlisten');
assert.equal(language.catalog.length,87);
assert.equal(new Set(language.catalog.map(task=>task.id)).size,87,'tekniske ID-er skal være unike');
assert.ok(language.catalog.every(task=>[10,20,30,40,50].includes(task.pts)),'poengverdier skal følge eksisterende skala');
assert.ok(language.catalog.every(task=>['daily','flex','period'].includes(task.type)),'eksisterende periodelogikk skal brukes');
assert.deepEqual([...new Set(language.catalog.map(task=>task.cat))],Object.keys(MASTER));
for(const removed of ['Innkjøp','Vedlikehold','Personlig investering'])assert.ok(!actual[removed],`${removed} skal ikke være standardkategori`);
for(const removed of ['Trening','Rengjøre under møbler','Holde oversikt over fritidsaktiviteter','Følge opp utstyr til aktiviteter'])assert.ok(!language.catalog.some(task=>task.name===removed),`${removed} skal ikke ligge i standardkatalogen`);

const migrated=language.normalizeState({
  taskCatalogVersion:3,
  categoryRelevant:{Stue:true,Innkjøp:true,Vedlikehold:true,'Personlig investering':true},
  taskOverrides:{living:{id:'living',cat:'Stue',name:'Rydde stue og oppholdsrom',freq:3,pts:10,type:'flex'}},
  tasks:[
    {id:'shop',cat:'Innkjøp',name:'Handle mat',owner:'Tore',freq:2,pts:20,type:'flex'},
    {id:'trash',cat:'Vedlikehold',name:'Ta ut søppel og sortere avfall',owner:'Maria',freq:2,pts:10,type:'flex'},
    {id:'living',cat:'Stue',name:'Rydde stue og oppholdsrom',owner:'Begge',freq:3,pts:10,type:'flex'},
    {id:'train',cat:'Personlig investering',name:'Trening',owner:'Tore',freq:3,pts:10,type:'flex'}
  ],
  completions:[{taskId:'train',taskName:'Trening',date:'2026-09-01',by:'Tore'}]
});
const migratedById=Object.fromEntries(migrated.tasks.map(task=>[task.id,task]));
assert.equal(migratedById.shop.cat,'Kjøkken');
assert.equal(migratedById.trash.cat,'Kjøkken');
assert.equal(migratedById.living.cat,'Stue & fellesområder');
assert.equal(migratedById.train.cat,'Egendefinert','utgått aktiv standardoppgave skal bevares som egendefinert');
assert.equal(migrated.completions[0].taskName,'Trening','historikk skal bevares');
assert.equal(migrated.categoryRelevant['Stue & fellesområder'],true);
assert.equal(migrated.taskOverrides.living.cat,'Stue & fellesområder');
assert.ok(!('Stue' in migrated.categoryRelevant));
assert.ok(!('Innkjøp' in migrated.categoryRelevant));
assert.ok(!('Vedlikehold' in migrated.categoryRelevant));
assert.ok(!('Personlig investering' in migrated.categoryRelevant));

const legacyLaundry=language.normalizeState({taskCatalogVersion:0,tasks:[{id:'laundry',name:'Klesvask',owner:'Tore',freq:3,pts:40,type:'flex'}]});
assert.deepEqual(legacyLaundry.tasks.map(task=>task.id),['laundry_start','laundry_hang','laundry_fold'],'gammel samlet oppgave skal fortsatt migreres uten å endre historiske fullføringer');
assert.ok(!language.catalog.find(task=>task.id==='laundry_whole').defaultSelected,'hele løpet og deloppgavene skal ikke velges automatisk sammen');

const customized=language.normalizeState({taskCatalogVersion:language.CATALOG_VERSION,tasks:[{id:'dinner',name:'Middag',cat:'Annet',customizedFields:['name','cat'],freq:2,pts:45,type:'flex',kind:'house'}]});
assert.equal(customized.tasks[0].name,'Middag');
assert.equal(customized.tasks[0].cat,'Annet');
assert.equal(customized.tasks[0].freq,2,'egen rytme skal beholdes');
assert.equal(customized.tasks[0].pts,45,'egne poengvalg skal beholdes');

console.log('ok - låst masterkatalog og tapsfri migrering');
