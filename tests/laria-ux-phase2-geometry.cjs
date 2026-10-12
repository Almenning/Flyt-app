'use strict';
/* Static contract for UX sprint phase 2. Browser tests verify interaction; this
   guard prevents a future stylesheet or service-worker edit from silently
   dropping the wide iPad/iPhone geometry that protects the learning surface. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const css=read('globe-ux-phase2.css');
const atlas=read('atlas-perspective-v1.js');
const html=read('index.html');
const sw=read('sw.js');

assert.match(css,/data-geo-layout="tablet-landscape"/,'iPad landscape needs its own layout contract');
assert.match(css,/--g24-globe:\s*min\(76dvh, 55vw, 680px\)/,'iPad landscape globe must be substantially larger');
assert.match(css,/data-geo-layout="phone-landscape"/,'landscape iPhone needs its own layout contract');
assert.match(css,/orientation: portrait\) and \(min-width: 700px\)/,'iPad portrait must gain space without changing iPhone portrait');
assert.match(atlas,/function refreshGeoLayout\(\)/,'mode transitions must classify the current viewport');
assert.match(atlas,/screen\.dataset\.geoLayout=next/,'classic globe and atlas must share the same viewport classification');
assert.match(atlas,/--atlas-left/,'atlas geometry must own its left map column');
assert.match(atlas,/MAX_ZOOM=32, MIN_ZOOM=1/,'atlas must allow significantly closer map exploration');
assert.ok(html.indexOf('atlas-perspective-v1.css')<html.indexOf('globe-ux-phase2.css'),'phase 2 geometry must load after atlas base styles');
assert.match(sw,/globe-ux-phase2/,'PWA cache must refresh when geography geometry changes');
console.log('ok - ux phase 2 geography geometry contract');
