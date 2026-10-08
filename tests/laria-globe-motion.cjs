const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=p=>fs.readFileSync(p,'utf8');

test('premium globe atlas shares the same zoomed orthographic radius as country geometry',()=>{
  const renderer=read('laer-litt-mer/globe-v25-renderer.js');
  assert.match(renderer,/const r=s\*\.455\*zoom/,'illustrated atlas must scale with globeZoom');
  assert.doesNotMatch(renderer,/const r=s\*\.46,cx=/,'legacy unzoomed atlas radius must stay removed');
  assert.match(renderer,/__LARIA_GLOBE_ATLAS_STATE/,'atlas projection state must stay observable for QA');
});

test('globe pinch keeps a geographic anchor and hands back to one-finger drag',()=>{
  const index=read('laer-litt-mer/index.html');
  for(const token of ['function pointerMidpoint()','function keepGlobeAnchor(','function resumeGlobeDragFromRemainingPointer()']){
    assert.ok(index.includes(token),token+' missing');
  }
  assert.match(index,/anchor:local\?globeInverse\(local\.x,local\.y\):null/,'pinch must capture the geographic point between the fingers');
  assert.match(index,/keepGlobeAnchor\(globePinch\.anchor,local\.x,local\.y\)/,'pinch must preserve the captured geographic anchor');
  assert.match(index,/if\(globePointers\.size===1\)resumeGlobeDragFromRemainingPointer\(\)/,'one-finger rotation must resume after pinch');
});

test('globe motion release rotates Safari cache keys',()=>{
  const index=read('laer-litt-mer/index.html');
  const sw=read('laer-litt-mer/sw.js');
  assert.match(index,/globe32-geoatlas1/);
  assert.match(sw,/globe32-geoatlas1/);
});

test('illustrated globe source is built from real country polygons, not an unrelated image',()=>{
  const index=read('laer-litt-mer/index.html');
  const renderer=read('laer-litt-mer/globe-v25-renderer.js');
  const atlas=read('laer-litt-mer/globe-geographic-atlas-v1.js');
  assert.match(index,/globe-geographic-atlas-v1\.js/,'geographic atlas module missing');
  assert.match(renderer,/LariaGeographicAtlasV1\?\.build\(WORLD_COUNTRIES\)/,'renderer must build atlas from actual geometry');
  assert.doesNotMatch(renderer,/illustratedAtlas\.src/,'unregistered atlas image must not be used');
  assert.match(atlas,/paintGeometry\(lc,c\.geometry/,'land pixels must come from true country polygons');
  assert.match(atlas,/EPSG:4326/,'map pixel coordinates must be geographic');
});
