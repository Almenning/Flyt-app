'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');

test('child completion language talks about adventures, not completed grades',()=>{
  for(const forbidden of [
    'Trinnet fullført 🏆',
    'Trinnet er rundet',
    'Du rundet trinnet!',
    'Alle verdener på trinnet er fullført',
    'Kjerneløpet er rundet',
    'Klassetrinnene dine',
    'rundet i Læria'
  ])assert.equal(html.includes(forbidden),false,'stale child-facing completion copy: '+forbidden);

  assert.match(html,/Tallenga/);
  assert.match(html,/Bokskogen/);
  assert.match(html,/Ordlandsbyen/);
  assert.match(html,/Nordlysleiren/);
  assert.match(html,/Fire første eventyr/);
  assert.match(html,/Eventyret fullført 🏆/);
  assert.match(html,/Eventyret er rundet/);
});

test('legacy grade completion data stays compatible while UI gets adventure completion',()=>{
  assert.match(html,/result\.gradeCompleted=\{subject,grade\}/);
  assert.match(html,/result\.gradeCompleted=\{subject:'geography',grade\}/);
  assert.match(html,/result\.adventureCompleted=\{subject,grade,name:journeyAdventureName\(subject\)\}/);
  assert.match(html,/result\.adventureCompleted=\{subject:'geography',grade,name:journeyAdventureName\('geography'\)\}/);
  assert.match(html,/state\.journey\.gradeWins\[winKey\]=\{at:Date\.now\(\)\}/);
  assert.match(html,/const completedAdventure=result\.adventureCompleted\?\.name\|\|null/);
});

test('child progress card hides grade history and keeps grade detail for the parent area',()=>{
  assert.match(html,/id="grade-round-history-title" hidden/);
  assert.match(html,/id="grade-round-history" hidden aria-hidden="true"/);
  assert.match(html,/id="grade-round-eyebrow">Eventyrreiser</);
  assert.match(html,/id="grade-round-title">Fire første eventyr</);
  assert.match(html,/id="adult-grade" aria-label="Klassetrinn"/);
  assert.match(html,/Foreldreoversikt/);
});

test('finishing an adventure no longer offers next school grade as the reward',()=>{
  assert.equal(html.includes('id="journey-next-grade"'),false);
  assert.equal(html.includes("document.getElementById('journey-next-grade')"),false);
  assert.match(html,/Repeter eventyret/);
  assert.match(html,/journeyAdventureName\(activeSubject\)\+' er rundet/);
});
