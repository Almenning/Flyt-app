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

test('locked Læria environment frames the globe with responsive illustrated nature',()=>{
  const css=read('laer-litt-mer/globe-v24.css');
  const active=css.slice(css.indexOf('/* Locked atlas environment v33:'));
  assert.ok(active.length>900,'v33 visual scene contract not present');
  for(const view of ['landscape','tablet','mobile']){
    assert.match(active,new RegExp('globe-locked-environment-v36-'+view+'\\.svg'),'missing '+view+' artwork');
    const svg=read('laer-litt-mer/globe-locked-environment-v36-'+view+'.svg');
    assert.match(svg,/viewBox=/,'scene '+view+' is not responsive vector artwork');
    assert.match(svg,/preserveAspectRatio="xMidYMid slice"/,view+' must CROP without stretching the source');
    const expected={landscape:[1440,900],tablet:[850,1180],mobile:[450,960]}[view];
    assert.ok(svg.includes('viewBox="0 0 '+expected[0]+' '+expected[1]+'"'),view+' must keep a correct source aspect ratio');
    for(const token of ['id="sky"','id="range"','id="pine"','id="water"','id="woods"','id="approvedLeft"','id="approvedRight"'])
      assert.ok(svg.includes(token),view+' lacks '+token);
    assert.ok(svg.includes('<image href="data:image/webp;base64,'),'reference scenery must remain self-contained and avoid remote assets');
    assert.ok(!svg.includes('<foreignObject')&&!svg.includes('<canvas'),'scenery must never embed a second interactive map');
  }
  assert.match(active,/background-size:cover!important/,'scenery must scale without distortion and crop if necessary');
  assert.match(active,/globe-locked-environment-v36-landscape\\.svg/,'latest illustrated release must be active');
  assert.doesNotMatch(active,/background-size:100%\\s+100%/,'scene may not be stretched to fill arbitrary aspect ratios');
  assert.doesNotMatch(active,/basecamp-v11/,'globe environment must not reuse fantasy village artwork');
  assert.match(active,/--g24-globe:min\(94vw,48dvh\)/,'phone globe must dominate usable width');
});
