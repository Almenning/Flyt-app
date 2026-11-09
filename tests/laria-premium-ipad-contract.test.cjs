'use strict';
/**
 * Non-visual safety rail for Læria's LOCKED iPad-first design contract.
 * Real WebKit/Chromium screenshots still require explicit visual approval:
 * source-only tests cannot certify a premium product.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const locked=read('docs/LARIA-LOCKED-VISUAL-IDENTITY-2026-11-07.md');
const html=read('laer-litt-mer/index.html');
const rail=read('laer-litt-mer/laria-sign-rail-v2.css');
const visual=read('laer-litt-mer/laria-visual-identity-v1.css');
const worlds=[
  ['Norsk','laer-litt-mer/eggenipa.js'],
  ['Matte','laer-litt-mer/tallvika.js'],
  ['Geografi','laer-litt-mer/geography-kinnaklova-scene.js']
];
for(const phrase of [
  'Grovanova er den visuelle fasiten',
  'Ett presentasjonslag',
  'Skill ren illustrasjon fra interaktive elementer',
  'Godkjenningsport: iPad Premium',
  'iPad liggende først',
  'iPad stående deretter',
  'Ingen merge/publisering',
  'ingen videre iPhone-/PC-design',
  'TrollActor',
  'to-stolpede',
  'motstridende gamle CSS-regler'
])assert.ok(locked.includes(phrase),'Missing locked contract phrase: '+phrase);
assert.ok(html.toLowerCase().startsWith('<!doctype html>'),'Doctype missing or index corrupted');
assert.ok(html.includes('laria-visual-identity-v1.css')&&html.includes('laria-sign-rail-v2.css'),
  'The approved visual identity and single sign rail must be loaded');
assert.ok(html.indexOf('laria-visual-identity-v1.css')<html.lastIndexOf('laria-sign-rail-v2.css'),
  'The common rail owns placement; the common visual identity owns appearance');
for(const [name,file] of worlds)
  assert.match(read(file),/laria-sign-rail-v2/,name+' must opt into the common rail');
for(const selector of [
  '#eggenipa-world .eg-hero.laria-sign-rail-v2',
  '#tallvika-world .tv-scene.laria-sign-rail-v2',
  '#laria-geography-world .gv-scene.laria-sign-rail-v2'
])assert.ok(rail.includes(selector),'Missing shared place-aware rail: '+selector);
assert.match(visual,/laria-light-arrow-sign\.svg/,'Shared sign asset must stay canonical');
const originalBrand=read('laer-litt-mer/assets/ui/laria-logo-from-grovanova.svg');
const carvedOak=read('laer-litt-mer/assets/ui/laria-light-arrow-sign.svg');
assert.match(originalBrand,/original logo fra låst Grovanova-illustrasjon/,
 'Shared logo must derive from byte-locked Grovanova master, not generic lettering');
assert.match(visual,/laria-logo-from-grovanova\.svg/,
 'Norsk, Matte and Geografi must reuse original Læria wordmark');
assert.match(carvedOak,/håndskåret treskilt/,
 'All three subject worlds must use the same carved wood sign family');

assert.match(visual,/laria-home-round\.svg/,'Shared round Home button must stay canonical');
const kinnaklova=read('laer-litt-mer/kinnaklova.js');
assert.match(kinnaklova,/APPROVED_ART_SHA256/,'Kinnaklova clean artwork must preserve its integrity gate');
assert.match(kinnaklova,/laria-troll-actor/,'Kinnaklova must use live selected TrollActor');
assert.match(read('laer-litt-mer/tallvika.js'),/laria-troll-actor/,'Tallvika must use live selected TrollActor');
const homeJs=read('laer-litt-mer/home-basecamp-v12.js');
assert.match(homeJs,/return trolls\[id\]\|\|trolls\.storesoster;/,
  'New children must see approved Storesøster, not a retired fox fallback');
assert.doesNotMatch(homeJs,/return trolls\[id\]\|\|window\.LARIA_FOX\.source/,
  'Never expose a fox in Home when the child has not chosen a troll');
assert.ok(fs.statSync(path.join(root,'laer-litt-mer/assets/tallvika/laria-tallvika-premium-locked-20261027.png')).size===3503795,
  'Do not replace original locked Tallvika artwork');
// Legacy journey and multiplication visual adapters must never flash a fox
// when the shared TrollActor loads after a deferred feature script.
const journey=read('laer-litt-mer/journey-world-premium.js');
const multiplication=read('laer-litt-mer/multiplication-premium-v2.js');
assert.doesNotMatch(journey,/LARIA_FOX\.source|revejente|revegutt/,
  'Journey must not render or announce retired foxes');
assert.match(journey,/assets\/gangemagi-troll\//,
  'Journey must fall back only to the approved original TrollActor assets');
assert.doesNotMatch(multiplication,/LARIA_FOX\.source/,
  'Gangetabellen must not flash a retired fox before TrollActor starts');
assert.match(multiplication,/assets\/gangemagi-troll\//,
  'Gangetabellen must use the approved original troll assets');

// A legacy profile may still exist, but no active lesson may flash a fox
// before the live TrollActor module finishes initializing.
for(const file of [
  'laer-litt-mer/multiplication-pick-play-v1.js',
  'laer-litt-mer/globe-preview-v32-renderer.js',
  'laer-litt-mer/laria-task-scene-v15.js'
]){
 const code=read(file);
 assert.doesNotMatch(code,/LARIA_FOX\.source|lia-fox-explorer-home\.webp|revejente|revegutt/,
   file+' still exposes a retired fox source or child-facing label');
 assert.match(code,/assets\/gangemagi-troll\//,file+' must default to approved original trolls');
}

// Every *active* route must use approved TrollActor figures even before
// the global runtime has loaded. Historical fox profile data is untouched.
for(const path of [
 'laer-litt-mer/discovery-globe-phase1.js',
 'laer-litt-mer/norwegian-chapter-picker-v1.js',
 'laer-litt-mer/bokskogen-world.js'
]){
 const script=read(path);
 assert.doesNotMatch(script,/lia-fox-explorer-home\.webp/,
  path+' still falls back to a retired fox image');
 assert.match(script,/assets\/gangemagi-troll\//,
  path+' must use only one of the three original locked trolls');
}

console.log('PASS Læria locked premium iPad-first safety contract (NOT visual approval).');
