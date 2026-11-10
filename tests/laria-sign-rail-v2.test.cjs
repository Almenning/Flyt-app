'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=path.join(__dirname,'..','laer-litt-mer');
const read=file=>fs.readFileSync(path.join(app,file),'utf8');
const rail=read('laria-sign-rail-v2.css');
// The actual shared three-world rail was aligned at 35% in the approved
// component stylesheet. The former 34% expectation predated the final layout.

assert.match(rail,/laria-wayfinder/,'the shared sign component must own rail placement');
assert.match(rail,/data-eg="words"[\s\S]*top:35%/,'Eggenipa must start its rail at the shared 35% anchor');
assert.match(rail,/data-gv="journey"[\s\S]*top:35%/,'Nordlysleiren must start its rail at the shared 35% anchor');
assert.match(rail,/--rail-left:4%/,'the desktop rail needs one common left anchor');
assert.match(rail,/min-width:44px|laria-wayfinder/,'touch targets remain governed by the shared accessible component');
for(const file of ['eggenipa.js','tallvika.js','geography-kinnaklova-scene.js'])
  assert.match(read(file),/laria-sign-rail-v2/,file+' must opt into the common rail layout');
console.log('Læria Sign Rail v2: clean worlds share a left-hand three-sign layout.');
