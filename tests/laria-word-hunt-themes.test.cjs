'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const themes=require('../laer-litt-mer/word-hunt-themes.js');
test('five child-friendly topics keep the existing mixed option',()=>{
  assert.deepEqual(themes.PACKS.map(t=>t.id),['mixed','animals','magic','food','world']);
  for(const pack of themes.PACKS){
    assert.ok(pack.title&&pack.description&&pack.icon,pack.id);
    for(const [level,max] of [['easy',6],['hard',7]]){
      const words=pack[level];
      assert.ok(words.length>=12,pack.id+' '+level+' needs enough words to avoid repetitive rounds');
      assert.equal(words.length,new Set(words).size,pack.id+' '+level+' has repeated words');
      for(const word of words){
        assert.match(word,/^[A-ZÆØÅ]+$/,pack.id+' contains a non-Norwegian alphabet symbol in '+word);
        assert.ok(word.length>=2&&word.length<=max,pack.id+' invalid '+level+' word '+word);
      }
    }
  }
});
test('old Ordjakt rounds remain and count as mixed play in the magic book',()=>{
  const old=themes.normalizeProgress({rounds:7});
  assert.equal(old.rounds,7);
  assert.equal(old.theme,'mixed');
  assert.equal(old.themeRounds.mixed,7);
  assert.equal(old.themeRounds.animals,0);
});
test('saved topics and sticker counts survive reload without altering lifetime totals',()=>{
  const input={rounds:9,theme:'animals',themeRounds:{mixed:3,animals:6}};
  const old=JSON.stringify(input);
  const stored=themes.normalizeProgress(input);
  assert.equal(stored.rounds,9);
  assert.equal(stored.theme,'animals');
  assert.equal(stored.themeRounds.animals,6);
  assert.equal(themes.normalizeProgress(stored).themeRounds.animals,6);
  assert.equal(JSON.stringify(input),old);
});
test('unknown topics and invalid progress are safely discarded',()=>{
  const safe=themes.normalizeProgress({rounds:-4,theme:'invented',themeRounds:{magic:-2,world:'bad'}});
  assert.equal(safe.theme,'mixed');
  assert.equal(safe.rounds,0);
  assert.equal(safe.themeRounds.magic,0);
  assert.equal(safe.themeRounds.world,0);
  assert.equal(themes.get('invented').id,'mixed');
});
test('each premium themed illustration is a locally bundled layered scene',()=>{
  const fs=require('node:fs');
  const path=require('node:path');
  for(const theme of themes.PACKS){
    const asset=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/word-hunt-theme-'+theme.id+'.svg'),'utf8');
    assert.match(asset,/viewBox="0 0 360 250"/,theme.id);
    assert.match(asset,/id="sunHalo"/,theme.id);
    assert.match(asset,/id="lift"/,theme.id);
    assert.match(asset,/url\(#lift\)/,theme.id);
    assert.ok(!/https?:\/\//.test(asset.replace('http://www.w3.org/2000/svg','')),'No external assets inside '+theme.id);
  }
});
test('the magical moments are short optional responses, not random rewards',()=>{
  const owl=themes.reaction('UGLE');
  assert.equal(owl.icon,'🦉');
  assert.match(owl.message,/ugle/i);
  assert.equal(themes.reaction('KATALOG'),null);
  assert.equal(themes.PACKS.some(t=>/streak|kjøp|reklame|skjermtid/i.test(JSON.stringify(t))),false);
});