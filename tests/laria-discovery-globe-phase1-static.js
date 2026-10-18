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
assert.ok(index.startsWith('<!doctype html>'), 'the complete app shell must start at its doctype');
assert.doesNotMatch(index,/Warning: truncated output|tokens truncated/,'transport truncation must never become app source');
assert.ok(index.includes('function openGlobe(')&&index.includes('function showScreen(')&&index.includes('</html>'), 'the complete app runtime must survive uploads');

assert.match(preview,/const forcedPreview=new URLSearchParams/, 'QA preview remains opt-in by URL');
assert.match(preview,/window\.LARIA_SET_GLOBE_VIEW=chooseView;/,'the view switch must be live');
assert.match(preview,/const continentZoomCap=1\.72;/,'Oppdag must declare its continent-scale zoom cap');
assert.match(preview,/screen\.dataset\.discoveryZoom='continent-v1'/,'Oppdag must expose its intentional continent zoom mode');
assert.match(preview,/knip for kontinentnivå/,'child-facing zoom guidance must explain the discovery scope');
assert.match(preview,/function renderDiscoveryWelcome\(/,'Oppdag must present a continent invitation before a country is chosen');
assert.match(preview,/function discoveryContinentForCamera\(/,'the invitation must follow the globe camera');
assert.match(preview,/function scrollShortDiscovery\(/,'the small-phone flow must reveal the country card');
assert.match(preview,/event\.isTrusted&&globeSelected/,'only real child taps may auto-scroll the discovery screen');
assert.match(preview,/const discoveryContinentStops=\[/,'Oppdag must define grounded continent destinations');
for(const name of ['Europa','Afrika','Asia','Nord-Amerika','Sør-Amerika','Oseania'])
  assert.ok(preview.includes("name:'"+name+"'"),'missing continent destination: '+name);
assert.match(preview,/dataset\.discoveryContinent=stop\.name/,'the visible invitation must identify its continent');
assert.match(preview,/renderDiscoveryWelcome\(\)/,'rotation must update the selected continent invitation');
assert.match(preview,/countries\[globeSelected\]\?\.name==='Tsjad'/,'Oppdag must identify the legacy showcase by canonical country data');
assert.match(preview,/let simpleViewState=null/,'the original simple camera and card must be restored after Oppdag');
assert.match(preview,/function selectedFoxSource\(/,'the invitation must use the child’s actual selected fox source');
assert.match(preview,/function enhanceDiscoveryCountryCard\(/,'the selected-country card must receive the discovery companion');
assert.match(preview,/function discoveryCompanionText\(/,'the fox reaction must be place-aware, not generic decoration');
assert.match(preview,/new MutationObserver\(\(\)=>\{/,'the discovery companion must react after the shared country card updates');
assert.match(index,/id="globe-view-toggle"/,'accessible view buttons must be in the globe');
assert.match(index,/const DISCOVERY_CONTINENT_ZOOM_MAX=1\.72;/,'shared zoom input must know the isolated Oppdag cap');
assert.match(index,/window\.__lariaDiscoveryGlobePreview===true/,'the limited zoom may only apply to Oppdag');
assert.match(index,/function activeGlobeZoomMax\(/,'wheel, pinch and buttons must share the same zoom limit');
const viewCss=read('laer-litt-mer/discovery-globe-view-v1.css');
assert.match(viewCss,/discovery-continent-intro/,'Oppdag’s continent invitation needs scoped presentation styling');
assert.match(viewCss,/\.premium-globe-guide\{display:none!important\}/,'Oppdag must not show the generic fox beside the selected fox');
assert.match(viewCss,/discovery-country-companion/,'selected countries need a compact companion treatment');
assert.match(preview,/window\.__lariaDiscoveryGlobePreview=false;/,
  'ordinary globe must remain the default');
assert.match(preview,/'Sør-Amerika':'#[0-9A-Fa-f]{6}'/,
  'Norwegian geography labels must retain UTF-8 encoding');
assert.doesNotMatch(preview,/SÃ¸r-Amerika/,'preview source has mojibake');
assert.doesNotMatch(preview,/window\.globeZoom\b/, 'zoom is lexically scoped; window.globeZoom generates NaN drawing coordinates');
assert.match(preview,/function paintReliefTrails\(/, 'geographic terrain trails must remain active');
assert.match(preview,/const landscapeZones=\[/,'ecosystems must use contiguous georeferenced corridors');
for(const zone of ['Norwegian fjord forests','Alpine valleys','Mediterranean hills'])
  assert.ok(preview.includes(zone),'Europe needs its authored geographic corridor: '+zone);
assert.match(preview,/const mountainChains=\[/,'landscape engine must have connected mountain chains');
assert.match(preview,/const europeHero=chain\.name==='Scandes'\|\|chain\.name==='Alps';/,'Europe needs a sparse continent-scale ridge silhouette');
assert.match(preview,/function paintWorldTerrain\(/,'continuous terrain paint field must remain active');
assert.match(preview,/function paintGeographicTexture\(/,'geographic canopy and dune material must remain active');
assert.doesNotMatch(preview,/function paintGeographicTexture\([^)]*\)\s*\{\s*if\(moving\|\|level===1\)/,
  'the continent-first globe must not lose all illustrated material at world zoom');
assert.match(preview,/function terrainLatitudeIndex\(/,'terrain must index nearby geographical anchors for iPad performance');
assert.match(preview,/terrainLatitudeIndex\(terrainSamples\(landscapeZones,6\),19\)/,'biome index must include complete search radius');
assert.match(preview,/terrainLatitudeIndex\(terrainSamples\(mountainChains,4\.8\),6\)/,'mountain index must include complete search radius');
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
assert.match(preview,/screen\.dataset\.discoveryGlobe='painted-atlas-v1'/,
  'Oppdag must expose the integrated painted-atlas renderer revision');
assert.match(preview,/const terrainCount=0;/,
  'large terrain stamp clusters must not return as a substitute for landscape');
assert.match(preview,/const landmarkCount=0;/,
  'landmark icons must not compete with the terrain material');
assert.doesNotMatch(preview,/const biomeCount=paintBiomes\(/,
  'separate biome washes must not sit on top of the integrated material pass');
console.log('PASS dual globe static isolation and controls');
