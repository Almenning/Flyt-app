'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync(require('node:path').join(__dirname,'../laer-litt-mer/laria-task-scene-v15.js'),'utf8');
const lookup={
  no:{name:'Norge',capital:'Oslo',continent:'Europa'},
  se:{name:'Sverige',capital:'Stockholm',continent:'Europa'},
  lu:{name:'Luxembourg',capital:'Luxembourg (by)',continent:'Europa'},
  na:{name:'Namibia',capital:'',continent:'Afrika'}
};
const clue=vm.runInNewContext(source.slice(source.indexOf('  function landFlagHint(q)'),source.indexOf('  function bindInteraction(q,wrap)'))+'\nlandFlagHint',{countries:lookup});

test('flag hints describe the hidden country instead of telling the child how to read the flag',()=>{
  assert.match(clue({k:'no',type:'flag'}),/fjordene.*lang kyst/);
  assert.equal(clue({k:'se',type:'flag'}),'Hovedstaden i dette landet heter Stockholm.');
  for(const k of Object.keys(lookup)){
    const hint=clue({k,type:'flag'});
    assert.ok(!hint.includes(lookup[k].name));
    assert.doesNotMatch(hint,/flagg|fargene|mønsteret/i);
  }
});

test('a missing capital or a capital that gives away the answer uses a neutral location clue',()=>{
  assert.equal(clue({k:'lu',type:'flag'}),'Dette landet ligger i Europa.');
  assert.equal(clue({k:'na',type:'flag'}),'Dette landet ligger i Afrika.');
  assert.equal(clue({k:'zz',type:'flag'}),'Tenk på hvor i verden landet ligger.');
  assert.match(clue({k:'no',type:'map'}),/formen på landene/);
});
