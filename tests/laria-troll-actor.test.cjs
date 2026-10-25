'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const actorSource=fs.readFileSync(path.join(root,'laer-litt-mer/troll-actor-v1.js'),'utf8');
const actorCss=fs.readFileSync(path.join(root,'laer-litt-mer/troll-actor-v1.css'),'utf8');
const game=fs.readFileSync(path.join(root,'laer-litt-mer/multiplication-gangemagi-v1.js'),'utf8');
const html=fs.readFileSync(path.join(root,'laer-litt-mer/index.html'),'utf8');
function actorApi(){const sandbox={window:{}};vm.runInNewContext(actorSource,sandbox,{filename:'troll-actor-v1.js'});return sandbox.window.LARIA_TROLL_ACTOR;}
test('TrollActor exposes the six pilot reactions and keeps an exact static reserve',()=>{
 const actor=actorApi();
 assert.deepEqual([...actor.moods],['idle','wave','think','hint','celebrate','support']);
 const markup=actor.render({id:'storesoster',name:'Storesøster',src:'./assets/gangemagi-troll/storesoster.webp',mood:'idle'});
 assert.match(markup,/class="troll-actor__fallback" src="\.\/assets\/gangemagi-troll\/storesoster\.webp"/);
 assert.match(markup,/data-troll-rig="crop-v1"/);
 assert.doesNotMatch(markup,/https?:\/\//,'the character layer may not fetch remote or generated art');
 assert.equal((markup.match(/<img /g)||[]).length,1,'one original image is retained as the static reserve');
});
test('pilot uses only the locked Storesøster image and maps real Gangemagi events to reactions',()=>{
 assert.match(game,/LARIA_TROLL_ACTOR\.render\(\{id:t\.id,name:t\.name,src:t\.src,mood:guideMood\}\)/);
 assert.match(game,/setGuideMood\('wave',1450\)/,'opening greeting');
 assert.match(game,/setGuideMood\('think'\)/,'hint begins with thinking');
 assert.match(game,/setGuideMood\('hint',1200\)/,'hint continues into guidance');
 assert.match(game,/setGuideMood\('celebrate',1400\)/,'completion celebration');
 assert.match(game,/setGuideMood\('support',900\)/,'full basket response is supportive');
 assert.doesNotMatch(actorSource,/imagegen|openai|fetch\(/i,'no regenerated character or remote animation path');
});
test('rig uses composited source crops, respects reduced motion, and is loaded before Gangemagi',()=>{
 assert.match(actorCss,/background:var\(--troll-source\) center bottom \/ contain no-repeat/);
 assert.match(actorCss,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(actorCss,/\.troll-actor__fallback\{opacity:1\}/);
 const actorIndex=html.indexOf('troll-actor-v1.js');
 const gameIndex=html.indexOf('multiplication-gangemagi-v1.js');
 assert.ok(actorIndex>0&&actorIndex<gameIndex,'TrollActor runtime must load before Gangemagi consumes it');
});
