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

assert.match(preview,/const forcedPreview=new URLSearchParams/, 'QA preview remains opt-in by URL');
assert.match(preview,/window\.LARIA_SET_GLOBE_VIEW=chooseView;/,'the view switch must be live');
assert.match(index,/id="globe-view-toggle"/,'accessible view buttons must be in the globe');
assert.match(preview,/window\.__lariaDiscoveryGlobePreview=false;/,
  'ordinary globe must remain the default');
assert.match(preview,/'Sør-Amerika':'#[0-9A-Fa-f]{6}'/,
  'Norwegian geography labels must retain UTF-8 encoding');
assert.doesNotMatch(preview,/SÃ¸r-Amerika/,'preview source has mojibake');
assert.doesNotMatch(preview,/window\.globeZoom\b/, 'zoom is lexically scoped; window.globeZoom generates NaN drawing coordinates');
assert.match(preview,/function paintReliefTrails\(/, 'geographic terrain trails must remain active');
assert.match(preview,/const landscapeZones=\[/,'ecosystems must use contiguous georeferenced corridors');
assert.match(preview,/const mountainChains=\[/,'landscape engine must have connected mountain chains');
assert.match(preview,/function paintWorldTerrain\(/,'continuous terrain paint field must remain active');
assert.match(preview,/terrainSamples\(mountainChains,4\.8\)/,'mountain samples must use geographic anchors');
assert.match(preview,/function smoothGeoStroke\(/,'all terrain corridors must share map projection');
assert.match(preview,/canvas\.dataset\.discoveryEcosystems=/,'QA must expose actual painted ecosystem count');
assert.match(preview,/canvas\.dataset\.discoveryRelief=/,'QA must expose actual painted mountain count');
assert.doesNotMatch(preview,/const geographicTextureZones=\[/,'no arbitrary map-filling icon rectangles');

assert.match(preview,/landClip\(ctx,w,h\)/, 'land-only illustration clipping must remain active');
assert.match(preview,/if\(!activated\|\|window\.drawGlobe!==discoveryDraw\)/, 'idle preview must not repaint on every interval tick');
for(const place of ['8,61','138,36','-61,-3'])assert.ok(preview.includes(place),'missing anchored demonstration area '+place);
const guard=renderer.indexOf('window.__lariaDiscoveryGlobePreview===true');
const canvas=renderer.indexOf("const canvas=document.getElementById('globe-canvas')",guard);
assert.ok(guard>=0&&canvas>guard,'legacy direct redraw must delegate before it paints');
const route=renderer.indexOf('const routedDraw=function(){');
const routedGuard=renderer.indexOf('window.__lariaDiscoveryGlobePreview===true',route);
const classic=renderer.indexOf("if(typeof globeMode==='string'&&globeMode==='classic')",route);
assert.ok(route>=0&&routedGuard>route&&classic>routedGuard,
  'classic router must delegate the preview before its captured legacy drawing closure');
assert.doesNotMatch(renderer,/Ã[\\u0080-\\u00bf]/,
  'the shared renderer must retain valid UTF-8, not transport-corrupted text');
const atlas=index.indexOf('atlas-perspective-v1.js');
const discovery=index.indexOf('discovery-globe-phase1.js');
assert.ok(atlas>=0&&discovery>atlas,'preview must load after the existing atlas renderer');
assert.match(index,/discovery-globe-view-v1\.css/,'switch styling must be loaded');
assert.match(index,/data-globe-view="simple"/,'simple view switch missing');
assert.match(index,/data-globe-view="discover"/,'discovery view switch missing');
assert.match(preview,/screen\.dataset\.mapPerspective==='globe'/,'switch cannot take over the atlas map');
console.log('PASS dual globe static isolation and controls');
