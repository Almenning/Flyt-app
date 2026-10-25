'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'laer-litt-mer/index.html'),'utf8');
const locked=fs.readFileSync(path.join(root,'laer-litt-mer/locked-journey-renderer.js'),'utf8');
const premium=fs.readFileSync(path.join(root,'laer-litt-mer/journey-world-premium.js'),'utf8');

test('grade-2 chapter completion keeps legacy progress signals for compatibility',()=>{
  assert.match(html,/const GRADE2_FIRST_JOURNEYS=Object\.freeze/);
  assert.match(html,/Bokskogen/);
  assert.match(html,/Tallenga/);
  assert.match(html,/Ordlandsbyen/);
  assert.match(html,/Nordlysleiren/);
  assert.match(html,/state\.journey\.gradeWins\[winKey\]=\{at:Date\.now\(\)\}/);
  assert.match(html,/result\.gradeCompleted=\{subject,grade\}/);
  assert.match(html,/result\.gradeCompleted=\{subject:'geography',grade\}/);
  assert.match(html,/result\.chapterCompleted=chapter/);
});

test('grade-2 completion copy is explicitly adventure-level, not grade-level',()=>{
  assert.match(html,/Fire første eventyr fullført/);
  assert.match(html,/Første eventyr rundet/);
  assert.match(html,/Første eventyr i '\+chapter\.title\+' er fullført/);
  assert.match(html,/Første ekspedisjon i '\+chapter\.title\+' er fullført/);
  assert.match(html,/chapterDone\?'🏆 Du har fullført det første eventyret i /);
  assert.match(html,/chapterDone\?'Første eventyr er ferdig\./);
});

test('locked and alternate journey renderers disambiguate grade-2 completion',()=>{
  assert.match(locked,/chapterOne=Number\(stage\.progress\.model\.grade\)===2/);
  assert.match(locked,/Første eventyr er fullført!/);
  assert.match(locked,/Alle hovedoppdrag i første eventyr er gjennomført/);
  assert.match(premium,/g===2\?' · eventyr 1 🏆'/);
});

test('changed renderers are cache-busted in the live app',()=>{
  assert.match(html,/journey-world-premium\.js\?v=20261016-chapter1-completion1/);
  assert.match(html,/locked-journey-renderer\.js\?v=20261024-skogstroll-walk1/);
});
