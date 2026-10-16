'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
const renderer=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/locked-journey-renderer.js'),'utf8');

test('child-facing journey completion never claims a grade is finished',()=>{
  const forbidden=[
    'Trinnet fullført',
    'Trinnet er rundet',
    'rundet trinnet',
    'rundet kjerneløpet',
    'kjerneløp',
    'Kjerneløpet',
    'Ekspedisjonen er fullført',
    'Ekspedisjonen er rundet',
    'rundet i Læria',
    'Alle verdener på trinnet',
    'fullført i geografi! 🏆'
  ];
  for(const phrase of forbidden)assert.equal(html.includes(phrase),false,'forbidden child-facing completion claim: '+phrase);
  assert.equal(html.includes('result.gradeCompleted'),false,'legacy gradeCompleted result semantics remain');
});

test('chapter completion uses adventure metadata and keeps compatibility storage',()=>{
  assert.match(html,/function journeyChapterMeta\(subject,grade=currentGrade\(\)\)/);
  assert.match(html,/result\.journeyCompleted=\{subject,grade,chapterId:chapter\.id,chapter:chapter\.chapter,title:chapter\.title\}/);
  assert.match(html,/state\.journey\.gradeWins\[winKey\]=\{at:Date\.now\(\)\}/,
    'compatibility completion storage must remain intact');
  assert.match(html,/Første eventyrrunde fullført/);
  assert.match(html,/Fire første eventyr/);
  assert.match(html,/Eventyret fullført 🏆/);
  assert.equal(html.includes('id="journey-next-grade"'),false,'journey finale must not promote the next school grade');
});

test('child progress no longer renders the 1-10 grade history dashboard',()=>{
  assert.match(html,/id="grade-round-history" hidden aria-hidden="true"/);
  assert.match(html,/if\(history\)\{history\.hidden=true;history\.innerHTML='';history\.setAttribute\('aria-hidden','true'\)\}/);
});

test('locked journey finale clearly refers to this adventure',()=>{
  assert.match(renderer,/Dette eventyret er fullført/);
  assert.equal(renderer.includes('Hele reisen er fullført'),false);
  assert.match(html,/locked-journey-renderer\.js\?v=20261016-chapter-completion1/);
});
