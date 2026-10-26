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
