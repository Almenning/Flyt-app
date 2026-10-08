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
  assert.match(index,/globe32-geo1/);
  assert.match(sw,/globe32-geo1/);
});

test('visible globe land uses authoritative geographic boundaries, not a decorative image',()=>{
  const renderer=read('laer-litt-mer/globe-v25-renderer.js');
  const active=renderer.slice(renderer.indexOf('function premiumDraw(){'),renderer.indexOf('function install(){'));
  assert.match(active,/__LARIA_GLOBE_RENDER_SOURCE='country-geometry'/);
  assert.match(active,/paintContinents\(ctx,w,h,s\)/);
  assert.match(active,/paintStoryBiomes\(ctx,w,h,s\)/);
  assert.doesNotMatch(active,/drawIllustratedAtlas\(ctx,w,h,s\)/);
});
