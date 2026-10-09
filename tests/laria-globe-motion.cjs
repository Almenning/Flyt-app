const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=p=>fs.readFileSync(p,'utf8');

test('globe pixels and touch geography share real country geometry under zoom',()=>{
  const renderer=read('laer-litt-mer/globe-v25-renderer.js');
  const index=read('laer-litt-mer/index.html');
  assert.match(renderer,/__LARIA_GLOBE_RENDER_SOURCE='country-geometry'/);
  assert.match(index,/const r=Math\.min\(w,h\)\*\.455\*globeZoom/,'country projection must zoom geometrically');
  assert.match(index,/function globeInverse\(x,y\)/,'selection must invert the same globe projection');
  assert.doesNotMatch(renderer,/globe-map-art-v2-equirect\.png/,'non-georeferenced mockup must never load');
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
  assert.match(index,/globe36-locked-env1/);
  assert.match(sw,/globe36-locked-env1/);
});

test('visible globe land uses authoritative geographic boundaries, not a decorative image',()=>{
  const renderer=read('laer-litt-mer/globe-v25-renderer.js');
  const active=renderer.slice(renderer.indexOf('function premiumDraw(){'),renderer.indexOf('function install(){'));
  assert.match(active,/__LARIA_GLOBE_RENDER_SOURCE='country-geometry'/);
  assert.match(active,/paintContinents\(ctx,w,h,s\)/);
  assert.match(active,/paintStoryBiomes\(ctx,w,h,s\)/);
  assert.doesNotMatch(active,/drawIllustratedAtlas\(ctx,w,h,s\)/);
});

test('locked Læria environment uses cohesive responsive artwork without stretching',()=>{
  const css=read('laer-litt-mer/globe-v24.css');
  const active=css.slice(css.indexOf('/* v36 unified storybook landscape:'));
  assert.ok(active.length>450,'unified scene styles missing');
  for(const view of ['landscape','tablet','mobile']){
    const filename='laer-litt-mer/globe-storyscape-v36-'+view+'.webp';
    const bytes=fs.readFileSync(filename);
    assert.ok(bytes.length>30000,view+' environment artwork must be a real detailed image');
    assert.equal(bytes.toString('ascii',0,4),'RIFF',view+' image must be valid WebP RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP',view+' image must contain WebP payload');
    assert.ok(active.includes('globe-storyscape-v36-'+view+'.webp'),view+' image must be used in CSS');
  }
  assert.match(active,/background-size:cover!important/,'scene must preserve aspect ratio via cover');
  assert.doesNotMatch(active,/background-size:100%\\s+100%/,'do not stretch landscape to fit screen');
  assert.ok(css.includes('--g24-globe:min(94vw,48dvh)'),'preserve proportional mobile sphere size');
});
