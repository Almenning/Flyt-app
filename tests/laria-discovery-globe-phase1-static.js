'use strict';

/* Fast contract check for the isolated phase-1 preview. This deliberately
   needs no browser so it can protect the separation when WebKit is unavailable
   in a local development environment. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const preview=read('laer-litt-mer/discovery-globe-phase1.js');
const renderer=read('laer-litt-mer/globe-v25-renderer.js');
const index=read('laer-litt-mer/index.html');

assert.match(preview,/if\(!new URLSearchParams\(location\.search\)\.has\('discovery-globe-preview'\)\)return;/,
  'preview must remain explicitly opt-in');
assert.match(preview,/window\.__lariaDiscoveryGlobePreview=true;/,
  'preview must declare its isolated runtime state');
assert.match(preview,/'Sør-Amerika':'#[0-9A-Fa-f]{6}'/,
  'Norwegian geography labels must retain UTF-8 encoding');
assert.doesNotMatch(preview,/SÃ¸r-Amerika/,'preview source has mojibake');
assert.match(preview,/function paintReliefTrails\(/, 'geographic terrain trails must remain active');
assert.match(preview,/landClip\(ctx,w,h\)/, 'land-only illustration clipping must remain active');
assert.match(preview,/if\(!activated\|\|window\.drawGlobe!==discoveryDraw\)/, 'idle preview must not repaint on every interval tick');
for(const place of ['8,61','138,36','-61,-3'])assert.ok(preview.includes(place),'missing anchored demonstration area '+place);
const guard=renderer.indexOf('window.__lariaDiscoveryGlobePreview===true');
const canvas=renderer.indexOf("const canvas=document.getElementById('globe-canvas')",guard);
assert.ok(guard>=0&&canvas>guard,'legacy direct redraw must delegate before it paints');
assert.doesNotMatch(renderer,/Ã[\\u0080-\\u00bf]/,
  'the shared renderer must retain valid UTF-8, not transport-corrupted text');
const atlas=index.indexOf('atlas-perspective-v1.js');
const discovery=index.indexOf('discovery-globe-phase1.js');
assert.ok(atlas>=0&&discovery>atlas,'preview must load after the existing atlas renderer');
console.log('PASS discovery globe static isolation contract');
