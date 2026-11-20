'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..','laer-litt-mer');const js=fs.readFileSync(path.join(root,'trollactor2-prototype.js'),'utf8');const css=fs.readFileSync(path.join(root,'trollactor2-prototype.css'),'utf8');const layered=fs.readFileSync(path.join(root,'trollactor2-layered.js'),'utf8');const layeredCss=fs.readFileSync(path.join(root,'trollactor2-layered.css'),'utf8');
test('TrollActor 2 prototype is isolated and preserves Storesøster source art',()=>{
 assert.match(js,/trollactor2-prototype=1/);assert.match(js,/storesoster\.webp/);assert.match(js,/data-ta2-test-only/);
 assert.doesNotMatch(js,/persistChoice|localStorage|saveState/);assert.match(js,/\['idle','wave','think','help','celebrate','encourage'\]/);
 assert.match(js,/ta2-face-slot.*hidden/);assert.match(js,/ta2-arm-slot.*hidden/);assert.match(css,/prefers-reduced-motion/);
});
test('layered engine requires a complete approved Storesøster asset pack',()=>{
 assert.match(layered,/identity==='storesoster'/);assert.match(layered,/requiredAssets:REQUIRED/);assert.match(layered,/validPack/);
 assert.match(layered,/ownerApproved===true/);assert.match(layered,/storesoster-v2-layer-pack-1/);
 assert.match(layered,/assets\/trollactor2\/storesoster-v2\/approved/);assert.match(layeredCss,/prefers-reduced-motion/);
 assert.match(layered,/\['idle','wave','think','help','celebrate','encourage'\]/);
 assert.doesNotMatch(layered,/localStorage|persistChoice|saveState/);
});
test('candidate art can never replace the locked V1 production character',()=>{
 const runtime=fs.readFileSync(path.join(root,'laria-troll-runtime-v1.js'),'utf8');
 assert.match(runtime,/gangemagi-troll\/storesoster\.webp/);
 assert.doesNotMatch(runtime,/assets\/trollactor2\/storesoster-v2\//);
 assert.equal(fs.existsSync(path.join(root,'assets','trollactor2','storesoster-v2','approved')),false,
   'an owner-approved runtime layer pack has not been delivered yet');
});


test('Storesøster source-exact master uses the locked V1 bytes and stays outside runtime',()=>{
 const crypto=require('node:crypto');
 const source=fs.readFileSync(path.join(root,'assets','gangemagi-troll','storesoster.webp'));
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),
  'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89',
  'locked V1 original bytes changed');
 const script=fs.readFileSync(path.join(__dirname,'..','scripts','laria-storesoster-source-exact-master.py'),'utf8');
 assert.match(script,/SOURCE_GIT_SHA1 = 'a8fba47e272e2856bd78b92fb262146506e828ed'/);
 assert.match(script,/SOURCE_SHA256 = 'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'/);
 assert.match(script,/Image\.Resampling\.NEAREST/);
 assert.match(script,/recovered\.tobytes\(\) != image\.tobytes\(\)/);
 assert.match(script,/'ownerApproved': False, 'readyForRuntime': False/);
 assert.doesNotMatch(script,/os\.system\(|subprocess\.|git push|ownerApproved': True/);
});

test('source-based Storesøster arm study preserves locked neutral pose and cannot pass art gate',()=>{
 const script=fs.readFileSync(path.join(__dirname,'..','scripts','laria-storesoster-v1-arm-source-study.py'),'utf8');
 assert.match(script,/LOCKED_SHA256 = 'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'/);
 assert.match(script,/LOCKED_BLOB = 'a8fba47e272e2856bd78b92fb262146506e828ed'/);
 assert.match(script,/if reconstructed\.tobytes\(\) != src\.tobytes\(\)/,
   'neutral image must reconstruct exactly from disjoint source layers');
 assert.match(script,/ImageChops\.multiply\(left, right\)/,
   'candidate masks must not own the same source pixels');
 assert.match(script,/'complete_second_arm':False/);
 assert.match(script,/'head_and_face_separated':False/);
 assert.match(script,/'underpainted_occluded_anatomy':False/);
 assert.match(script,/'ownerApproved':False,'readyForRuntime':False/);
 assert.match(script,/'artGate':'BLOCKED'/);
 assert.doesNotMatch(script,/assets\/trollactor2\/storesoster-v2\/approved\//);
});


test('source-based V1 shoulder underpaint is diagnostic only and blocks runtime use',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const experiment=fs.readFileSync(path.join(__dirname,'..','scripts','laria-storesoster-v1-underpaint-experiment.py'),'utf8');
 assert.match(experiment,/SOURCE_SHA = 'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'/);
 assert.match(experiment,/if hashlib\.sha256\(data\)\.hexdigest\(\) != SOURCE_SHA:/);
 assert.match(experiment,/if results\[0\]\.tobytes\(\) != original\.tobytes\(\):/);
 assert.match(experiment,/cv2\.INPAINT_TELEA/);
 assert.match(experiment,/cv2\.INPAINT_NS/);
 assert.match(experiment,/'ownerApproved': False, 'readyForRuntime': False/);
 assert.match(experiment,/'underlyingAnatomyArtistApproved': False/);
 assert.match(experiment,/'artGate': 'BLOCKED'/);
 assert.doesNotMatch(experiment,/assets\/trollactor2\/storesoster-v2\/approved\//);
 assert.doesNotMatch(experiment,/['"]ownerApproved['"]\s*:\s*True/);
});
