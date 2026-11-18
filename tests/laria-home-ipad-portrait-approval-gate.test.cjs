'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const script=fs.readFileSync(path.join(root,'laer-litt-mer/home-kjosnes-v15.js'),'utf8');
const css=fs.readFileSync(path.join(root,'laer-litt-mer/home-kjosnes-v15.css'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'laer-litt-mer/assets/home-v15/grovanova-ipad-portrait-master.json'),'utf8'));

test('unapproved Grovanova iPad portrait art cannot replace the locked fallback',()=>{
 assert.equal(manifest.status,'awaiting-visual-approval');
 assert.equal(manifest.source,null);
 assert.equal(manifest.sha256,null);
 assert.match(script,/IPAD_PORTRAIT_MANIFEST/);
 assert.match(script,/candidate\.status==='approved'/);
 assert.match(script,/candidate\.width>=2048&&candidate\.height>=2732/);
 assert.match(script,/const originalMaster=portrait\?PHONE_MASTER:TABLET_MASTER/);
 assert.match(script,/image=await decoded\(originalMaster\)/);
 assert.match(script,/approvedMaster=null;\s+try\{image=await decoded\(cleanMaster\);cleanLoaded=true;\}/);
 assert.match(script,/catch\(_\)\{image=await decoded\(originalMaster\);\}/);

});

test('an approved portrait master must supply separate UI safe areas',()=>{
 assert.match(script,/ui\.signBoards\.length===4/);
 assert.match(script,/\['logo','subjects','journey','nav','adult','liveCopy'\]/);
 assert.match(script,/value\[2\]>0&&value\[3\]>0&&value\[0\]\+value\[2\]<=1&&value\[1\]\+value\[3\]<=1/);
 assert.match(script,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(script,/portrait-art-sha-mismatch/);
 assert.match(script,/approvedPortrait\.ui\.ambient\.sun/);
 assert.match(script,/mapControlsToArtwork\(host,image\.width,image\.height,portrait,approvedMaster\)/);
 assert.match(script,/if\(approvedMaster\)host\.dataset\.bc15CardArt='owner-approved-ui-free'/);
 assert.match(css,/data-bc15-master="ipad-portrait-approved"/);
 assert.match(css,/bc15-approved-logo/);
 assert.match(css,/\[data-bc15-master="ipad-portrait-approved"\] \.bc12-journey\{[^}]*opacity:1!important/);
});


test('Læria CSP displays SHA-verified local portrait Blob images but never permits Blob scripts',()=>{
 const html=fs.readFileSync(path.join(root,'laer-litt-mer/index.html'),'utf8');
 const tag=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
 assert.ok(tag,'Læria must retain an explicit CSP');
 const directives=Object.fromEntries(tag[1].split(';').map(s=>s.trim()).filter(Boolean).map(s=>{
  const [name,...values]=s.split(/\s+/);return [name,values];
 }));
 assert.ok(directives['img-src']?.includes('blob:'),'verified Blob URL must be displayable in img-src');
 assert.ok(!directives['script-src']?.includes('blob:'),'Blob executable scripts must remain blocked');
 assert.ok(!directives['default-src']?.includes('blob:'),'do not permit Blob URLs for unrelated resources');
});

test('orientation changes and stale async loads cannot swap in old portrait art',()=>{
 assert.match(script,/let nextPortraitObjectUrl='';/);
 assert.match(script,/if\(epoch!==activationEpoch\|\|!host\.isConnected/);
 assert.match(script,/!host\.closest\('#home-screen\.active'\)\|\|portrait!==isPortrait\(\)/);
 assert.match(script,/if\(nextPortraitObjectUrl\)URL\.revokeObjectURL\(nextPortraitObjectUrl\)/);
 assert.match(script,/activePortraitObjectUrl=nextPortraitObjectUrl/);
});

test('new portrait art may cover iPad only inside locked source-safe crop margins',()=>{
 assert.match(script,/const approvedCover=!!approvedPortrait&&sideCrop<=\.08&&verticalCrop<=\.05/);
 assert.match(script,/const scale=approvedCover\?coverScale:/);
 assert.match(script,/host\.dataset\.bc15Fit=approvedCover\?'approved-cover':/);
 assert.match(script,/top:approvedCover\?\(rect\.height-artHeight\)\/2:/);
});
