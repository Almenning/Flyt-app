'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {dateKey,mondayKey,currentWeek,olderWeeks,events}=require('./history-ui.js');

function fixture(){
  return {
    user:'Person A',
    tasks:[
      {id:'dish',name:'Tømme oppvaskmaskin'},
      {id:'laundry',name:'Vaske klær'}
    ],
    custom:[],
    completions:[
      {taskId:'dish',date:'2026-08-25',by:'Person A'},
      {taskId:'dish',date:'2026-08-25',by:'Person B'},
      {taskId:'dish',date:'2026-08-19',by:'Person A'},
      {taskId:'laundry',date:'2026-08-18',by:'Person B'},
      {taskId:'removed',date:'2026-08-12',by:'Person A'}
    ],
    plannedTasks:[
      {id:'extra-now',title:'Hente pakke',done:true,doneBy:'Person A',doneAt:'2026-08-26T10:00:00+02:00'},
      {id:'extra-old',title:'Levere bilen',done:true,doneBy:'Person A',doneAt:'2026-08-20T10:00:00+02:00'},
      {id:'not-done',title:'Ikke utført',done:false,date:'2026-08-20'}
    ],
    work:[{title:'Annet bidrag',date:'2026-08-25',by:'Person A'}],
    rewards:[{title:'Annen fristelse',date:'2026-08-25',by:'Person A'}],
    status:{'Person A':{needs:['example']}}
  };
}

test('inneværende uke samler faste og ekstra gjøremål med aktørfordeling',()=>{
  const week=currentWeek(fixture(),new Date(2026,7,26,12));
  assert.equal(week.start,'2026-08-24');
  assert.equal(week.total,3);
  assert.deepEqual(week.rows.map(x=>[x.name,x.count]),[
    ['Tømme oppvaskmaskin',2],
    ['Hente pakke',1]
  ]);
  assert.deepEqual(week.rows[0].by,{'Person A':1,'Person B':1});
});

test('eldre historikk grupperes ukevis med nyeste uke først',()=>{
  const weeks=olderWeeks(fixture(),new Date(2026,7,26,12));
  assert.deepEqual(weeks.map(x=>[x.start,x.total]),[
    ['2026-08-17',3],
    ['2026-08-10',1]
  ]);
  assert.deepEqual(weeks[0].rows.map(x=>x.name).sort(),[
    'Levere bilen',
    'Tømme oppvaskmaskin',
    'Vaske klær'
  ]);
});

test('Mine filtrerer bort partnerens gjennomføringer uten å kreve parkobling',()=>{
  const weeks=olderWeeks(fixture(),new Date(2026,7,26,12),true);
  assert.equal(weeks[0].total,2);
  assert.deepEqual(weeks[0].rows.map(x=>x.name).sort(),[
    'Levere bilen',
    'Tømme oppvaskmaskin'
  ]);
});

test('historikken leser bare data fra Gjør',()=>{
  const all=events(fixture());
  assert.equal(all.some(x=>x.name==='Annet bidrag'),false);
  assert.equal(all.some(x=>x.name==='Annen fristelse'),false);
  assert.equal(all.length,7);
});

test('fjernede oppgaver beholdes som en nøytral historikkpost',()=>{
  const weeks=olderWeeks(fixture(),new Date(2026,7,26,12));
  assert.equal(weeks[1].rows[0].name,'Tidligere gjøremål');
  assert.equal(weeks[1].rows[0].count,1);
});

test('ukegrensene bruker lokal mandag og avviser ugyldige datoer',()=>{
  assert.equal(mondayKey('2026-10-25'),'2026-10-19');
  assert.equal(dateKey('2026-02-30'),null);
});
