'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','laer-litt-mer');
const file=name=>fs.readFileSync(path.join(root,name),'utf8');

const index=file('index.html');
const runtime=file('laria-troll-runtime-v1.js');
const css=file('laria-troll-runtime-v1.css');
const home=file('home-kjosnes-v15.js');

assert.match(index,/laria-troll-runtime-v1\.css/,'Premium beta TrollActor CSS must be loaded');
assert.match(index,/laria-troll-runtime-v1\.js/,'Premium beta TrollActor runtime must be loaded');
assert.match(runtime,/const MOODS=new Set\(\['idle','wave','walking','think','hint','celebrate','support','curious'\]\)/,
  'TrollActor reaction vocabulary changed');
assert.match(runtime,/profile\(\)\?\.tallvikaTroll/,'Selected troll must come from the persisted profile');
assert.match(runtime,/\.bc12-fox > img/,'Legacy Home fox must migrate outside locked Grovanova');
assert.match(runtime,/if\(img\.closest\('#home-screen \.bc15-locked-home'\)\)return;/,
  'Locked Grovanova must be explicitly protected from injected companions');
assert.match(runtime,/laria-troll-speech/,'Living companion must own contextual speech');
assert.match(runtime,/feedback\.classList\.contains\('bad'\)\?'support':'celebrate'/,
  'Task feedback must drive TrollActor reactions');
assert.match(css,/@media\(orientation:landscape\) and \(max-height:500px\)/,
  'Short landscape needs an explicit TrollActor layout');
assert.match(css,/@media\(orientation:portrait\) and \(max-width:430px\)/,
  'Small portrait needs an explicit TrollActor layout');
assert.match(css,/\.laria-troll-actor::after/,'TrollActor must be grounded with a scene shadow');
assert.match(css,/animation:laria-troll-idle/,'TrollActor must have subtle idle life');
assert.match(css,/prefers-reduced-motion/,'TrollActor must respect reduced-motion');
assert.match(home,/kjosnes-home-tablet\.webp/,'Grovanova tablet master must remain intact');
assert.match(home,/kjosnes-home-phone\.webp/,'Grovanova phone master must remain intact');

for(const id of ['storesoster','lillesoster','lillebror']){
  const asset=path.join(root,'assets','gangemagi-troll',id+'.webp');
  assert.ok(fs.statSync(asset).size>10_000,id+' premium troll asset missing or suspiciously small');
}
console.log('Læria premium beta TrollActor contract passed');
