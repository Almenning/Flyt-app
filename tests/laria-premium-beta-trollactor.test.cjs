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
const wardrobe=file('laria-fox-wardrobe.js');
const fraction=file('fraction-premium-v2.js');
const basecamp=file('home-basecamp-v12.js');
const journey=file('locked-journey-renderer.js');
const taskScene=file('laria-task-scene-v15.js');
const multiplication=file('multiplication-premium-v2.js');
const pickPlay=file('multiplication-pick-play-v1.js');
const chapterPicker=file('norwegian-chapter-picker-v1.js');
const patternHaven=file('math-pattern-haven-preview-v1.js');
const countryDetail=file('laria-country-detail-premium-v1.js');

assert.match(index,/laria-troll-runtime-v1\.css/,'Premium beta TrollActor CSS must be loaded');
assert.match(index,/laria-troll-runtime-v1\.js/,'Premium beta TrollActor runtime must be loaded');
assert.match(index,/<html lang="nb" data-laria-character-system="troll">/,'Premium beta must boot in troll-first character mode');
assert.match(wardrobe,/lariaCharacterSystem==='troll'/,'Legacy fox wardrobe must be inert in troll-first mode');
assert.match(css,/data-laria-character-system="troll"/,'Troll CSS must suppress legacy first-paint fox art');
assert.match(index,/data-troll-picker/,'Onboarding must use the premium troll picker');
for(const id of ['storesoster','lillesoster','lillebror']){
  assert.match(index,new RegExp('data-troll="'+id+'"'),'Onboarding missing '+id);
}
assert.doesNotMatch(index,/Velg reven din|aria-label="Velg rev"|>Revegutt<|>Revejente<|Reven er klar!/,
  'Visible fox-era onboarding copy returned');
assert.match(index,/tallvikaTroll:selectedTroll/,'Onboarding must persist the same troll identity used in-world');
assert.match(runtime,/\.top \.avatar\.profile-fox-avatar > img/,'Visible header cameo must migrate to the selected troll');
assert.match(runtime,/const MOODS=new Set\(\['idle','wave','walking','think','hint','celebrate','support','curious'\]\)/,
  'TrollActor reaction vocabulary changed');
assert.match(runtime,/profile\(\)\?\.tallvikaTroll/,'Selected troll must come from the persisted profile');
assert.match(runtime,/\.bc12-fox > img/,'Legacy Home fox must migrate outside locked Grovanova');
assert.match(runtime,/if\(img\.closest\('#home-screen \.bc15-locked-home'\)\)return;/,
  'Locked Grovanova must be explicitly protected from injected companions');
assert.match(runtime,/laria-troll-speech/,'Living companion must own contextual speech');
assert.match(runtime,/Mine troll/,'Legacy Min rev entry must migrate to Mine troll');
assert.match(runtime,/\\b\(\?:reven\|rev\)\\b/,'Troll migration may only replace whole legacy fox words');
assert.match(runtime,/laria-premium-troll-dialog/,'Premium troll chooser must replace the old fox wardrobe');
assert.match(runtime,/feedback\.classList\.contains\('bad'\)\?'support':'celebrate'/,
  'Task feedback must drive TrollActor reactions');
assert.match(css,/@media\(orientation:landscape\) and \(max-height:500px\)/,
  'Short landscape needs an explicit TrollActor layout');
assert.match(css,/@media\(orientation:portrait\) and \(max-width:430px\)/,
  'Small portrait needs an explicit TrollActor layout');
assert.match(css,/\.laria-troll-actor::after/,'TrollActor must be grounded with a scene shadow');
assert.match(css,/animation:laria-troll-idle/,'TrollActor must have subtle idle life');
assert.match(css,/prefers-reduced-motion/,'TrollActor must respect reduced-motion');
assert.match(journey,/every journey starts with the selected troll in the DOM/,'Journeys must render the selected troll natively');
assert.match(journey,/Trollet ditt er klart\. Er du\?/,'Journey mission copy must be troll-first');
assert.match(basecamp,/kind==='wardrobe'&&window\.LARIA_TROLL_ACTOR\?\.openChooser/,'Legacy Basecamp wardrobe must route to Mine troll');
assert.match(basecamp,/Et brev fra trollet/,'Legacy Basecamp visible quest copy must be troll-first');
assert.match(fraction,/window\.LARIA_TROLL_ACTOR/,'Broklab must source its helper from TrollActor');
assert.doesNotMatch(fraction,/Trykk på reven for/,'Broklab must not expose fox-era help copy');
for(const [name,source] of Object.entries({taskScene,multiplication,pickPlay,chapterPicker,patternHaven,countryDetail})){
  assert.match(source,/LARIA_TROLL_ACTOR/,
    name+' must request the selected TrollActor at render time, not wait for a legacy fox swap');
}
assert.match(runtime,/\.country-story-fox/,'Country stories must be included in TrollActor migration');
assert.match(runtime,/\.fd-chapter-fox > img/,'Norwegian chapter picker must be included in TrollActor migration');
assert.match(runtime,/\.mh-story-fox > img/,'Math preview companion must be included in TrollActor migration');
assert.match(home,/kjosnes-home-tablet\.webp/,'Grovanova tablet master must remain intact');
assert.match(home,/kjosnes-home-phone\.webp/,'Grovanova phone master must remain intact');

for(const id of ['storesoster','lillesoster','lillebror']){
  const asset=path.join(root,'assets','gangemagi-troll',id+'.webp');
  assert.ok(fs.statSync(asset).size>10_000,id+' premium troll asset missing or suspiciously small');
}
console.log('Læria premium beta TrollActor contract passed');
