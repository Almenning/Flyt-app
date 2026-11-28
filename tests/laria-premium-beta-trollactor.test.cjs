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
// The retired dashboard cannot embed its own fox or decorative animal cameos.
assert.doesNotMatch(index,/dashboard-mascot premium-fox|<svg class="story-character story-(?:fox|lion)"/,
  'Legacy Home still contains a hard-coded animal illustration');
assert.match(index,/data-laria-legacy-troll="dashboard"/,'Legacy dashboard companion must be a separate actor');
assert.match(runtime,/\.dashboard-mascot\[data-laria-legacy-troll\] > img/,
  'Retired dashboard image must use the persisted troll identity');

// Retired journey-map markers must render the stored, original forest troll.
assert.ok(!index.includes('function journeyFoxSvg()'),
  'Retired hard-coded fox drawing is still used by a journey map');
assert.ok(index.includes('function journeyTrollMarkup()'),
  'Journey markers must use an original forest troll');
assert.ok(index.includes("['storesoster','lillesoster','lillebror'].includes(saved)"),
  'Journey marker must validate saved character on first paint');
const journeyMarkerSource=index.match(/function journeyTrollMarkup\(\)\{([\s\S]*?)\n\}/)?.[1];
assert.match(journeyMarkerSource,/assets\/troll-b\/gangemagi-troll\//,
  'Journey first paint must use the approved Troll B package, not the retired art');
for(const variant of ['v4','v5']){
  assert.ok(index.includes('journey-player-'+variant+' laria-troll-host laria-troll-actor'),
    variant+' must be a separate living TrollActor');
  assert.ok(runtime.includes('.journey-player-'+variant+' > img'),
    variant+' must update when the chosen troll changes');
}
assert.ok(css.includes('journey-player-v5).laria-troll-host > img.laria-premium-troll-art'),
  'Journey markers must use the shared TrollActor image rules');

assert.match(runtime,/if\(img\.closest\('#home-screen \.bc15-locked-home'\)\)/,
  'Locked Grovanova must have an explicit DOM-only companion branch');
assert.match(runtime,/if\(img\.getAttribute\('src'\)!==troll\.src\)img\.setAttribute\('src',troll\.src\);/,
  'Grovanova companion may update only its separate DOM image');
assert.match(css,/#home-screen \.bc15-locked-home \.laria-troll-host\{display:none!important\}/,
  'Locked Grovanova must never receive a second overlaid actor before clean art approval');
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
const kinnaklova=file('kinnaklova.js');
const refLayout=file('laria-reference-layout-v1.js');
const kinnStyle=file('laria-kinnaklova-unified-v1.css');
assert.match(kinnaklova,/const LOCKED_ART='\.\/assets\/kinnaklova\/kinnaklova-scene-clean-approved-20261026\.webp'/,
 'English must retain the exact locked Kinnaklova landscape');
assert.match(kinnaklova,/const UI_FREE_ART_TECHNICALLY_VERIFIED=true/,
 'The separately published source-faithful UI-free Kinn artwork must remain technically verified');
assert.match(kinnaklova,/const UI_FREE_ART_SHA256='7878237645c369fde210830ded37704bc0dfeb1f6d78b86782a47f41e80b7f8d'/,
 'Do not invent an approved checksum for a nonexistent cleaned source');
assert.match(kinnaklova,/PREMIUM_CLEAN_ART_APPROVED\?UI_FREE_ART:LOCKED_ART/,
 'Unapproved English must keep its original landscape');
assert.match(refLayout,/english:'Kinnaklova'/,
 'Engelsk must share the same reference heading as Norsk and Matte');
assert.match(refLayout,/english:\{words:'words',sentences:'sentences',reading:'reading','word-games':'words'\}/,
 'Engelsk must keep original destinations and add the live Word Games route');
assert.match(refLayout,/scene\.closest\('#kinnaklova-world'\)\?\.dataset\.kiPremiumArt!=='approved'/,
 'Kinnaklova cannot gain duplicate signs while its painting contains signs');
assert.match(kinnStyle,/--ref-menu-width:/,
 'Engelsk must use the same left rail dimensions');
assert.match(kinnStyle,/laria-grovanova-signposts\.svg/,
 'Engelsk must use the same two continuous posts');

assert.match(home,/kjosnes-home-phone\.webp/,'Grovanova phone master must remain intact');

for(const id of ['storesoster','lillesoster','lillebror']){
  const asset=path.join(root,'assets','gangemagi-troll',id+'.webp');
  assert.ok(fs.statSync(asset).size>10_000,id+' premium troll asset missing or suspiciously small');
}
// The four subject entrances must not bake a character into a painting.
// Norsk, Engelsk and Geografi now expose one independently tappable original TrollActor.
for(const [world,fileName,action] of [
  ['Bokskogen','eggenipa.js','eg'],
  ['Kinnaklova','kinnaklova.js','ki'],
  ['Nordlysleiren','geography-kinnaklova-scene.js','gv']
]){
  const source=file(fileName);
  assert.match(source,new RegExp('data-'+action+'="troll"'),
    world+' must provide a tappable selected character');
  assert.match(source,/LARIA_TROLL_ACTOR\?\.mood/,
    world+' must actually react to the tap');
  assert.match(source,/laria-troll-host laria-troll-actor/,
    world+' must use the shared actor system');
}
const eggenipa=file('eggenipa.js');
assert.equal((eggenipa.match(/data-eg="home"/g)||[]).length,1,
  'Bokskogen cannot show duplicate Home controls');
for(const styleName of ['eggenipa.css','kinnaklova.css','geography-kinnaklova-scene.css']){
  const style=file(styleName);
  assert.match(style,/touch-action:manipulation/,
    styleName+' must preserve touch interactions on companion');
  assert.match(style,/:focus-visible/,
    styleName+' must show keyboard focus on companion');
}
console.log('Læria premium beta TrollActor contract passed');
