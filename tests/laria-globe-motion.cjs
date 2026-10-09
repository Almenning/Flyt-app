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
  assert.match(index,/globe36-pigment3/);
  assert.match(sw,/globe36-pigment3/);
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

test('approved globe v36 continent palette is geographical and vibrant',()=>{
  const renderer=read('laer-litt-mer/globe-v25-renderer.js');
  for(const pair of ["'Europa':'#316FE0'","'Asia':'#E6B544'","'Afrika':'#E87455'","'Nord-Amerika':'#4DAD60'","'Sør-Amerika':'#319F58'"]){
    assert.ok(renderer.includes(pair),'missing locked globe continent palette '+pair);
  }
  assert.match(renderer,/__LARIA_GLOBE_RENDER_SOURCE='country-geometry'/,'v36 palette must not restore misregistered mock-up');
});

test('globe surface detail stays georeferenced during rotation and zoom',()=>{
  const renderer=read('laer-litt-mer/globe-v25-renderer.js');
  const ocean=renderer.slice(renderer.indexOf('function ocean('),renderer.indexOf('function continentGradient('));
  assert.match(ocean,/const p=project\(lon,lat,w,h\)/,
    'ocean highlights must follow globe projection instead of sticking to screen');
  assert.doesNotMatch(ocean,/ctx\.arc\(w\*ax,h\*ay/,
    'painted water highlights may not stay fixed as the globe rotates');
  assert.match(renderer,/paintContinents\(ctx,w,h,s\)/,
    'geographic country fill must remain the active visual surface');
  assert.match(renderer,/if\(!moving\)paintLandDepth\(ctx,w,h,s\)/,
    'expensive depth pass must stay outside active gesture frames');
  assert.match(renderer,/__LARIA_GLOBE_RENDER_SOURCE='country-geometry'/);
  const active=renderer.slice(renderer.indexOf('function premiumDraw(){'),renderer.indexOf('function install(){'));
  assert.match(active,/waterDetails\(ctx,w,h,s\);\s*discoveryDetails\(ctx,w,h,s\);/,
    'illustrated landmarks must remain geographically anchored throughout pointer movement');
  assert.doesNotMatch(active,/if\(!moving\)\{\s*waterDetails/,
    'decorative geography must not vanish while the globe rotates');
});
