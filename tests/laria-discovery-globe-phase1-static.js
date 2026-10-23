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
const polarSource=read('laer-litt-mer/discovery-antarctica-geography-v1.js');
assert.match(polarSource,/Natural Earth 1:110m/,'Antarctic coastline must have documented public-domain provenance');
const polarGeometry=JSON.parse(polarSource.split('window.LARIA_ANTARCTICA_GEOMETRY=')[1].trim().replace(/;$/, ''));
assert.equal(polarGeometry.type,'MultiPolygon','Antarctica must use real vector polygons');
assert.ok(polarGeometry.coordinates.length>=8,'polar dataset lost its geographic islands and mainland');
const polarPoints=polarGeometry.coordinates.flat(2);
assert.ok(polarPoints.every(p=>p.length===2&&p[1]<=-63&&p[1]>=-90),
  'polar vertices must stay within the documented Antarctic latitude band');
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
assert.match(preview,/const type=event.type,trusted=event.isTrusted;/,'only real child taps may auto-scroll the discovery screen');
assert.match(preview,/type==='pointerup'&&trusted&&globeSelected/,'the selected country must be confirmed after globe input');
assert.match(preview,/const settleAfterPointer=\(\)=>\{[\s\S]*settleFrames\+\+<2[\s\S]*requestAnimationFrame\(settleAfterPointer\)/,'the tap callback must tolerate shared pointer cleanup arriving one or two frames later');
assert.match(preview,/const discoveryContinentStops=\[/,'Oppdag must define grounded continent destinations');
assert.match(preview,/const discoveryContinentStories=\{/,'each continent needs optional guided places');
assert.match(preview,/function paintAntarcticIce\(/,'Antarctic geography must be visible on the new globe');
assert.match(preview,/canvas\.dataset\.discoveryAntarcticLand=/,'polar rendering needs independent QA evidence');
assert.match(preview,/if\(antarcticaOutline&&globeLat<=-61\)/,'south-polar rotation cannot be mislabeled as Oseania');
assert.match(preview,/function showContinentDiscovery\(/,'continent action must reveal a meaningful new place');
assert.match(preview,/function paintDiscoveryLocation\(/,'named discoveries must have a visible projected map location');
assert.match(preview,/const p=project\(lon,lat,w,h\)/,'the discovery highlight must use the real globe projection');
assert.match(preview,/canvas\.dataset\.discoveryLocationCount=/,'QA must expose whether the selected place has a visible marker');
assert.match(preview,/activeDiscoveryLocation=null;/,'landmark highlights must be removable');
assert.match(preview,/const discoveryContinentVisits=new Map\(\)/,'visiting a favourite place again must remain possible');
assert.match(preview,/function discoveryTrailHtml\(/,
  'each continent invitation must show its small optional discovery trail');
assert.match(preview,/box\.dataset\.discoveryStoryStep=String\(completed\)/,
  'QA must expose the completed optional discovery step');
assert.match(preview,/finished\?'Se stedene igjen':'Neste sted'/,
  'a completed mini-journey must invite free replay rather than stop the child');
for(const name of ['Europa','Afrika','Asia','Nord-Amerika','Sør-Amerika','Oseania','Antarktis'])
  assert.ok(preview.includes("'"+name+"':{"),'missing curated place story for '+name);
for(const place of ['Alpene','Sahara','Himalaya','Rocky Mountains','Andesfjellene','Korallrevet'])
  assert.ok(preview.includes("title:'"+place+"'"),'missing geographic discovery: '+place);
for(const name of ['Europa','Afrika','Asia','Nord-Amerika','Sør-Amerika','Oseania','Antarktis'])
  assert.ok(preview.includes("name:'"+name+"'"),'missing continent destination: '+name);
assert.match(preview,/dataset\.discoveryContinent=stop\.name/,'the visible invitation must identify its continent');
assert.match(preview,/renderDiscoveryWelcome\(\)/,'rotation must update the selected continent invitation');
assert.match(preview,/countries\[globeSelected\]\?\.name==='Tsjad'/,'Oppdag must identify the legacy showcase by canonical country data');
assert.match(preview,/let simpleViewState=null/,'the original simple camera and card must be restored after Oppdag');
assert.match(preview,/let simpleViewRestored=false/,'Atlas transitions must not repeatedly repaint the saved globe');
assert.match(preview,/simpleViewState&&\(!simpleViewRestored\|\|desiredView==='simple'\)/,
  'restoration must happen once per Atlas detour, but still complete on explicit Enkel selection');
assert.match(preview,/function selectedFoxSource\(/,'the invitation must use the child’s actual selected fox source');
assert.match(preview,/function enhanceDiscoveryCountryCard\(/,'the selected-country card must receive the discovery companion');
assert.match(preview,/box\.classList\.add\('premium-country-selected'\)/,
  'the selected discovery card must activate its reserved iPad flag/copy layout');
assert.match(preview,/function discoveryCompanionText\(/,'the fox reaction must be place-aware, not generic decoration');
assert.match(preview,/new MutationObserver\(\(\)=>\{/,'the discovery companion must react after the shared country card updates');
assert.match(index,/id="globe-view-toggle"/,'accessible view buttons must be in the globe');
assert.match(index,/const DISCOVERY_CONTINENT_ZOOM_MAX=1\.72;/,'shared zoom input must know the isolated Oppdag cap');
assert.match(index,/window\.__lariaDiscoveryGlobePreview===true/,'the limited zoom may only apply to Oppdag');
assert.match(index,/function activeGlobeZoomMax\(/,'wheel, pinch and buttons must share the same zoom limit');
assert.match(index,/discovery-antarctica-geography-v1\.js/,'Antarctica data must load independently and before Oppdag');
const viewCss=read('laer-litt-mer/discovery-globe-view-v1.css');
assert.match(viewCss,/laria-discovery-fox-found/,'a discovered place should have a subtle fox reaction');
assert.match(viewCss,/prefers-reduced-motion:reduce/,'the reaction must respect reduced-motion accessibility');
assert.match(viewCss,/discovery-continent-intro/,'Oppdag’s continent invitation needs scoped presentation styling');
assert.match(viewCss,/discovery-place-trail/,'the continent invitation needs visible journey progress');
assert.match(viewCss,/\[data-discovery-globe="painted-atlas-v1"\]\s*\{\s*background-image:/,
  'Oppdag atmospheric layer must draw on the actual scene, not dead pseudo-elements');
assert.match(viewCss,/globe-storyscape-v36-mobile\.webp/,'portrait must keep the approved storyscape artwork');
assert.match(viewCss,/globe-storyscape-v36-tablet\.webp/,'iPad portrait must keep its original artwork');
assert.match(viewCss,/premium-globe-header::before[\s\S]*globe-storyscape-v36-landscape\.webp/,
  'Oppdag header must use clean storyscape art, never an old UI screenshot crop');
assert.doesNotMatch(viewCss,/\[data-discovery-globe="painted-atlas-v1"\]::before/,
  'do not reintroduce a hidden pseudo-element as the atmospheric layer');
assert.match(viewCss,/\.premium-globe-guide\{display:none!important\}/,'Oppdag must not show the generic fox beside the selected fox');
assert.match(viewCss,/discovery-country-companion/,'selected countries need a compact companion treatment');
assert.match(preview,/window\.__lariaDiscoveryGlobePreview=false;/,
  'ordinary globe must remain the default');
assert.match(preview,/'Sør-Amerika':'#[0-9A-Fa-f]{6}'/,
  'Norwegian geography labels must retain UTF-8 encoding');
assert.doesNotMatch(preview,/SÃ¸r-Amerika/,'preview source has mojibake');
assert.doesNotMatch(preview,/window\.globeZoom\b/, 'zoom is lexically scoped; window.globeZoom generates NaN drawing coordinates');
assert.match(preview,/function paintReliefTrails\(/, 'geographic terrain trails must remain active');
assert.doesNotMatch(preview,/function paintChainReliefRibbon\(/,
  'do not reintroduce the rejected highway-like continent crest ribbons');
assert.match(preview,/const forestShade=grove\*42\*biomeReach/,'forest canopy needs locally shaded geographic material');
assert.match(preview,/const sand=\(dunes\*\.66\+ridges\*\.34\)\*51\*biomeReach/,
  'desert pigments must follow geographic noise rather than decorative stamps');

assert.match(preview,/const landscapeZones=\[/,'ecosystems must use contiguous georeferenced corridors');
for(const zone of ['Norwegian fjord forests','Alpine valleys','Mediterranean hills'])
  assert.ok(preview.includes(zone),'Europe needs its authored geographic corridor: '+zone);
assert.match(preview,/const mountainChains=\[/,'landscape engine must have connected mountain chains');
assert.match(preview,/const continentCrestChains=new Set\(\[/,'continent-defining mountains must appear at overview zoom');
for(const chain of ['Scandes','Alps','Atlas','Rockies','Andes','Himalaya','Japanese Alps','Australian ranges','Drakensberg','Southern Alps NZ'])
  assert.ok(preview.includes("'"+chain+"'"),'missing continent-defining ridge: '+chain);
assert.match(preview,/const continentRiverNames=new Set\(\[/,'major rivers must be visible at continent zoom');
for(const name of ['Amazonas','Nile','Mississippi','Yangtze'])
  assert.ok(preview.includes("'"+name+"'"),'missing world-level river: '+name);
assert.match(preview,/canvas\.dataset\.discoveryContinentCrests=/,'QA needs verified overview ridge counts');
assert.match(preview,/canvas\.dataset\.discoveryContinentRivers=/,'QA needs verified overview river counts');
assert.match(preview,/function paintWorldTerrain\(/,'continuous terrain paint field must remain active');
assert.match(preview,/function paintLandBase\([^{]*\)\s*\{[\s\S]*?let joined=false/,
  'all country land polygons must form one shared continental base');
assert.match(preview,/for\(const c of land\(\)\)if\(c\.geometry\)joined=path\(ctx,c,w,h\)\|\|joined/,
  'single landscape fill must use the original country geometry without per-country tiles');
assert.doesNotMatch(preview,/if\(path\(ctx,c,w,h\)\)\{ctx\.fillStyle=g;ctx\.fill\(\);\}/,
  'per-country drop shadows must not return to the illustrated continents');

assert.match(preview,/const stoneWeight=clamp\(mountainReach/,'major mountains need continuous rock shading, not only hairline strokes');
assert.match(preview,/const snowFacet=clamp\(/,'high-elevation regions need snow facets');
assert.match(preview,/const pixels=level===1\?clamp\(Math.round\(s\*\.33\),128,205\)/,
  'iPad overviews must sample terrain at a higher resolution than small phones');
assert.match(preview,/dataset\.discoveryTerrainPixels=/,'QA must expose actual terrain resolution');
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
assert.match(preview,/function ocean\([^{]*\)\{[\s\S]*?Gentle currents retain a living ocean/,
  'overview water must use illustrated currents rather than a cartographic latitude grid');
assert.match(preview,/const glaze=ctx\.createLinearGradient/,
  'the discovery ocean needs a broad light-to-depth glaze beneath its currents');
assert.match(preview,/function paintSphereAtmosphere\(/,
  'Oppdag needs a dedicated spherical light pass so the globe reads above the storyscape');
assert.match(preview,/dataset\.discoveryMaterialPass='continent-premium-v2'/,
  'QA must expose the strengthened premium continent material pass');
assert.match(preview,/ctx\.lineWidth=Math\.max\(2\.2,s\*\.0072\)/,
  'ocean currents need a broad translucent undercurrent, not only hairlines');
assert.doesNotMatch(preview,/for\(const lat of \[-60,-30,0,30,60\]\)/,
  'the illustrated globe must not regress to a graticule at world scale');
assert.match(preview,/const iceFacets=\[/,
  'Antarctica must use broad geographic ice facets instead of striped shadow bands');
assert.doesNotMatch(preview,/const iceRoutes=\[/,
  'the rejected thin Antarctic shadow bands must not return');
assert.match(preview,/if\(leafy&&level===1&&smoothGeoStroke\(ctx,zone\.route,w,h,s\)\)/,
  'overview forests must begin as connected geographic canopy corridors');
assert.match(preview,/const perZone=leafy\?\(level===1\?38/,
  'overview canopy detail must support the connected mass instead of becoming a dot field');
assert.match(preview,/function paintBorders\(ctx,w,h,s,level\)/,
  'border rendering must explicitly know the current discovery zoom level');
assert.match(preview,/if\(!selected&&level===1\)continue/,
  'continent overview must not be dominated by internal political borders');
assert.match(preview,/function paintSmallCountries\(ctx,w,h,s,level\)/,
  'tiny-country markers need the same overview discipline as borders');
assert.match(preview,/if\(level===1&&c\.id!==globeSelected\)continue/,
  'overview must not turn every small country into a map-dot marker');

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
