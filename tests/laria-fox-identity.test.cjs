'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..','laer-litt-mer');
const file=name=>fs.readFileSync(path.join(root,name),'utf8');

// The retired fox identity API remains only as migration compatibility for
// persisted profiles and old modules. It must not own child-visible character art.
const styles={};
const element={dataset:{},style:{setProperty:(name,value)=>{styles[name]=value;}}};
const sandbox={state:{profile:{avatar:'girl'}},window:{
 document:{documentElement:element},
 LARIA_PROFILE_AVATARS:{boy:'boy-art',girl:'girl-art'}
}};
vm.runInNewContext(file('laria-fox-identity.js'),sandbox);
const legacy=sandbox.window.LARIA_FOX;
assert.equal(legacy.source('girl'),'girl-art');
assert.equal(legacy.source('boy'),'boy-art');
legacy.syncDecorations();
assert.equal(element.dataset.lariaFoxAvatar,'girl');

// Premium beta must be explicitly troll-first.
const index=file('index.html');
const runtime=file('laria-troll-runtime-v1.js');
const trollCss=file('laria-troll-runtime-v1.css');
assert.match(index,/<html lang="nb" data-laria-character-system="troll">/);
assert.match(index,/laria-troll-runtime-v1\.js/);
assert.match(index,/laria-troll-runtime-v1\.css/);
assert.match(runtime,/tallvikaTroll/);
assert.match(runtime,/storesoster/);
assert.match(runtime,/lillesoster/);
assert.match(runtime,/lillebror/);
assert.match(trollCss,/data-laria-character-system="troll"/);

// Core child-visible surfaces source the selected TrollActor directly.
const fraction=file('fraction-premium-v2.js');
assert.match(fraction,/LARIA_TROLL_ACTOR/,'Brøklab must use TrollActor');
assert.doesNotMatch(fraction,/Trykk på reven for/,'Brøklab exposes retired fox copy');

const globe=file('globe-v25-renderer.js');
assert.match(globe,/LARIA_TROLL_ACTOR/,'Kloden must use TrollActor');
assert.doesNotMatch(globe,/lia-fox-explorer-home\.webp/,'Kloden still has a fox fallback');
assert.match(globe,/Trollet ditt er med på Kloden/);

const home=file('home-basecamp-v12.js');
assert.match(home,/LARIA_TROLL_ACTOR\?\.openChooser/,'Basecamp must route character choice to Mine troll');
assert.match(home,/Mine troll/);
assert.doesNotMatch(home,/Et brev fra reven/);

const journey=file('locked-journey-renderer.js');
assert.match(journey,/TROLL_COMPANIONS/);
assert.match(journey,/data-troll=/);
assert.doesNotMatch(journey,/aria-label="Din rev er med på reisen"/);

const wardrobe=file('laria-fox-wardrobe.js');
assert.match(wardrobe,/lariaCharacterSystem==='troll'/,'retired wardrobe must be inert in troll mode');

// Active core/preview files may retain fox class names as compatibility hooks,
// but no child-facing fox wording or generic fox fallback may return.
for(const name of [
 'index.html','home-basecamp-v12.js','locked-journey-renderer.js',
 'fraction-premium-v2.js','globe-v25-renderer.js',
 'english-sentence-harbor-preview-v1.js',
 'geography-continent-voyage-preview-v1.js',
 'math-pattern-haven-preview-v1.js','fortellingsdalen-preview-v1.js'
]){
 const src=file(name);
 assert.doesNotMatch(src,/Revegutt|Revejente|REVEN VENTER HER|REVENS [A-ZÆØÅ]|Et brev fra reven|Trykk på reven for|Få hint fra reven|Skjul hint fra reven|lia-fox-explorer-home\.webp/,
   name+' reintroduced child-visible fox legacy');
}

console.log('Troll-first identity compatibility wiring passed');
