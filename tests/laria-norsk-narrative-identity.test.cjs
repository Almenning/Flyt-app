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
  vm.runInNewContext(source,ctx,{timeout:2000});
  const themes=ctx.window.LARIA_WORD_HUNT_THEMES;
  const declared=source.match(/const data=([\\s\\S]*?);\\n  const PACKS=/);
  assert.ok(declared,'Missing source word bank');
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
