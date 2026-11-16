'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
test('premium home does not reveal document overscroll while independent lessons can scroll',()=>{
 const css=read('laer-litt-mer/laria-viewport-premium-v1.css');
 const index=read('laer-litt-mer/index.html');
 assert.match(css,/html:has\(\.grade-band-young #home-screen\.active \.bc12\)/);
 assert.match(css,/\.grade-band-young\.app:has\(#home-screen\.active \.bc12\)/);
 assert.match(css,/height:100dvh!important/);
 assert.match(css,/overflow:hidden!important/);
 assert.match(css,/overscroll-behavior:none/);
 assert.match(css,/touch-action:pan-x/);
 assert.doesNotMatch(css,/body\s*\{[^}]*overflow:hidden/s,'Do not freeze lesson/document scrolling globally');
 assert.match(index,/laria-viewport-premium-v1\.css/);
});
test('iPad portrait uses one original scene and a matching scenic surround',()=>{
 const css=read('laer-litt-mer/laria-viewport-premium-v1.css');
 const js=read('laer-litt-mer/home-kjosnes-v15.js');
 assert.match(css,/orientation:portrait/);
 assert.match(css,/bc15-ipad-fagmenu::before/);
 assert.match(css,/bc15-subject-signs\[data-bc15-presentation="live"\]/);
 assert.doesNotMatch(css,/background-image:\s*url\(/,'Do not duplicate the painted Home source');
 assert.match(js,/const PHONE_MASTER=/);
 assert.match(js,/CLEAN_PHONE_MASTER=/);
});
