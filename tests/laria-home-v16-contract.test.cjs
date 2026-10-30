'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const crypto=require('node:crypto');
const base=path.resolve(__dirname,'..','laer-litt-mer');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('index.html'),css=read('home-v16-preview.css'),js=read('home-v16-preview.js');
new vm.Script(js);
assert.match(html,/home-kjosnes-v15\.js\?v=/);
assert.match(html,/home-v16-preview\.js\?v=/);
assert.match(html,/home-v16-preview\.css\?v=/);
assert(html.indexOf('home-kjosnes-v15.js')<html.indexOf('home-v16-preview.js'),'V15 must initialise before V16 preview');
assert.match(js,/laria-home-v16-preview/,'No unapproved default rollout');
assert.match(js,/bc15-locked-home/,'V16 must depend on verified original art');
assert.match(js,/bc14-subject\[data-camp="subject-/,'Preserve the real v12 route handlers');
assert.match(js,/portrait-art-required/,'Never fake the missing portrait wooden signs');
assert.match(js,/requestAnimationFrame/,'Align signs to the actual rendered original');
assert.match(css,/\.bc16-left-signs-ready \.bc14-subjects/,'Old bottom hit zones must be disabled');
assert.match(css,/visibility:hidden!important;pointer-events:none!important/);
for(const part of ['Norsk','Matte','Engelsk','Geografi'])assert(js.includes(part),'Missing Home subject '+part);
for(const [name,bytes,sha] of [
  ['kjosnes-home-tablet.webp',459450,'246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5'],
  ['kjosnes-home-phone.webp',52882,'0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7']
]){
 const file=fs.readFileSync(path.join(base,'assets/home-v15',name));
 assert.equal(file.length,bytes,'Locked Home art size changed');
 assert.equal(crypto.createHash('sha256').update(file).digest('hex'),sha,'Locked Home art SHA changed');
}
console.log('Home v16 gated left-sign navigation contract and immutable masters passed');
