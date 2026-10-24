'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..','laer-litt-mer');
const file=name=>fs.readFileSync(path.join(root,name),'utf8');
const styles={};
const element={dataset:{},style:{setProperty:(name,value)=>{styles[name]=value;}}};
const sandbox={state:{profile:{avatar:'girl'}},window:{
 document:{documentElement:element},
 LARIA_PROFILE_AVATARS:{boy:'boy-art',girl:'girl-art'}
}};
vm.runInNewContext(file('laria-fox-identity.js'),sandbox);
const api=sandbox.window.LARIA_FOX;
assert.equal(api.source('girl'),'girl-art');
assert.equal(api.source('boy'),'boy-art');
assert.equal(api.source('unknown'),'boy-art');
assert.equal(api.label('girl'),'Revejente');
assert.equal(api.label('boy'),'Revegutt');
api.syncDecorations();
assert.equal(element.dataset.lariaFoxAvatar,'girl');
assert.equal(styles['--laria-fox-background'],'url("girl-art")');
sandbox.state.profile.avatar='boy';
api.syncDecorations();
assert.equal(element.dataset.lariaFoxAvatar,'boy');
assert.equal(styles['--laria-fox-background'],'url("boy-art")');
const decorativeCss=file('laria-unified-v13.css');
assert.doesNotMatch(decorativeCss,/url\('\.\/lia-fox-explorer-home\.webp'\)/);
assert.match(decorativeCss,/var\(--laria-fox-background\)/);

for(const name of ['home-basecamp-v12.js','journey-world-premium.js','laria-task-scene-v15.js']){
 const source=file(name);
 assert.match(source,/LARIA_FOX\.source/,'missing shared identity in '+name);
 assert.doesNotMatch(source,/return '\.\/lia-fox-explorer\.webp';/,'static companion in '+name);
}
const fraction=file('fraction-premium-v2.js');
assert.match(fraction,/LARIA_FOX\.worldSource/,'Brøklab must start with the chosen full-body fox, not a portrait flash');
assert.doesNotMatch(fraction,/src="\.\/lia-fox-explorer-home\.webp"/,'generic picture survives in Brøklab');
assert.match(api.worldSource('girl'),/girl-braids-blue-dress-v1\.webp/);
assert.match(api.worldSource('boy'),/boy-adventurer-green-vest-v1\.webp/);
for(const name of ['multiplication-premium-v2.js','multiplication-pick-play-v1.js','word-hunt.js']){
 const src=file(name);
 assert.match(src,/LARIA_FOX\.source/,'nonpersonal fox in '+name);
 assert.doesNotMatch(src,/src="\.\/lia-fox-explorer-home\.webp"/,'generic picture survives in '+name);
}
const globe=file('globe-v25-renderer.js');
assert.match(globe,/guide\.src='\.\/lia-fox-explorer-home\.webp'/);
const home=file('home-basecamp-v12.js');
assert.doesNotMatch(home,/src="\.\/lia-fox-explorer-home\.webp"/);
const journey=file('locked-journey-renderer.js');
assert.match(journey,/locked-journey-traveler/);
assert.match(journey,/selectedAvatarSource\(subject\)/);
assert.match(journey,/LARIA_SKOGSTROLL\.sourceForSubject/,'young journeys should display fixed approved trolls');
const index=file('index.html');
assert.match(index,/profile-avatars\.js[^\n]+[\s\S]*laria-fox-identity\.js/);
assert.ok(index.includes('laria-fox-identity.css'));
assert.ok(index.includes('LARIA_FOX.syncDecorations()'));
console.log('Selected fox identity wiring passed');
