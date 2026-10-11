'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..','laer-litt-mer');
const file=name=>fs.readFileSync(path.join(root,name),'utf8');
const sandbox={window:{LARIA_PROFILE_AVATARS:{boy:'boy-art',girl:'girl-art'}}};
vm.runInNewContext(file('laria-fox-identity.js'),sandbox);
const api=sandbox.window.LARIA_FOX;
assert.equal(api.source('girl'),'girl-art');
assert.equal(api.source('boy'),'boy-art');
assert.equal(api.source('unknown'),'boy-art');
assert.equal(api.label('girl'),'Revejente');
assert.equal(api.label('boy'),'Revegutt');
for(const name of ['home-basecamp-v12.js','journey-world-premium.js','laria-task-scene-v15.js']){
 const source=file(name);
 assert.match(source,/LARIA_FOX\.source/,'missing shared identity in '+name);
 assert.doesNotMatch(source,/return '\.\/lia-fox-explorer\.webp';/,'static companion in '+name);
}
const journey=file('locked-journey-renderer.js');
assert.match(journey,/locked-journey-traveler/);
assert.match(journey,/selectedAvatarSource\(\)/);
const index=file('index.html');
assert.match(index,/profile-avatars\.js[^\n]+[\s\S]*laria-fox-identity\.js/);
assert.match(index,/laria-fox-identity\.css/);
console.log('Selected fox identity wiring passed');
