'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../laer-litt-mer/word-hunt-themes.js'),'utf8');
test('Ordjakt reactions do not revive retired fox or Bokskogen narrator',()=>{
  const ctx={window:{}};
  vm.runInNewContext(source,ctx,{timeout:2000});
  const themes=ctx.window.LARIA_WORD_HUNT_THEMES;
  for(const [word,theme] of [['REV','animals'],['NORGE','world'],['JAPAN','world'],['SOL','mixed'],['KART','world']]){
    const reaction=themes.reaction(word,theme);
    assert.ok(reaction,'Missing word reaction: '+word);
    assert.doesNotMatch(reaction.message,/reven|bokskogen/i);
  }
  assert.equal(themes.PACKS.length,5,'Word-theme packs must stay unchanged');
});

test('All curated theme words fit their board without silently disappearing',()=>{
  const ctx={window:{}};
  // Inspect the source bank before PACKS filters words by board size.
  // Otherwise a typo longer than the grid disappears silently and passes QA.
  const instrumented=source.replace('  const PACKS=Object.freeze(',
    '  window.__LARIA_RAW_WORD_PACKS=data;\n  const PACKS=Object.freeze(');
  assert.notEqual(instrumented,source,'Raw word-bank inspection hook missing');
  vm.runInNewContext(instrumented,ctx,{timeout:2000});
  const themes=ctx.window.LARIA_WORD_HUNT_THEMES;
  const raw=ctx.window.__LARIA_RAW_WORD_PACKS;
  assert.equal(raw.length,themes.PACKS.length);
  for(let i=0;i<raw.length;i++){
    for(const level of ['easy','hard']){
      assert.deepEqual(Array.from(raw[i][level]),Array.from(themes.PACKS[i][level]),
        raw[i].id+'/'+level+' silently loses invalid or oversized words');
    }
  }
  for(const pack of themes.PACKS){
    for(const [level,size] of [['easy',6],['hard',7]]){
      const words=pack[level];
      assert.ok(words.length>=10,pack.id+'/'+level+' has too few words');
      assert.equal(new Set(words).size,words.length,pack.id+'/'+level+' has duplicate words');
      for(const word of words){
        assert.match(word,/^[A-ZÆØÅ]+$/,pack.id+'/'+level+' contains invalid letters');
        assert.ok(word.length>=2&&word.length<=size,pack.id+'/'+level+' contains an impossible word: '+word);
      }
    }
  }
  for(const [word,theme] of [['FROSKER','animals'],['MATBOKS','food'],['SPINAT','food']]){
    assert.ok(themes.get(theme).hard.includes(word),word+' must remain playable');
  }
});

test('Ordjakt rejects saved boards missing target words rather than trapping a child',()=>{
  const hunt=fs.readFileSync(path.resolve(__dirname,'../laer-litt-mer/word-hunt.js'),'utf8');
  assert.match(hunt,/const containsWord=word=>/);
  assert.match(hunt,/data\.words\.every\(containsWord\)/);
  assert.match(hunt,/throw Error\('Saved puzzle has missing answers'\)/);
  assert.match(hunt,/localStorage\.removeItem\(ROUND_KEY\)/,
    'Invalid saved puzzle must be discarded for a new playable round');
});

test('Ordjakt storage writes fail safely in restrictive Safari environments',()=>{
  const hunt=fs.readFileSync(path.resolve(__dirname,'../laer-litt-mer/word-hunt.js'),'utf8');
  for(const name of ['saveTheme','saveRound']){
    const start=hunt.indexOf('function '+name+'()');
    const end=hunt.indexOf('\nfunction ',start+1);
    assert.ok(start>=0,'Missing '+name);
    const body=hunt.slice(start,end<0?undefined:end);
    assert.match(body,/try\s*\{/,'Missing protected storage write in '+name);
    assert.match(body,/catch\s*\(_\)/,'Missing storage failure fallback in '+name);
  }
});
