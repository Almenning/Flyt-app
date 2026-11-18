'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const script=read('laer-litt-mer/home-kjosnes-v15.js');
const style=read('laer-litt-mer/home-kjosnes-v15.css');
const svg=read('laer-litt-mer/assets/ui/laria-grovanova-rowboat.svg');

test('Grovanova boats are only separate, non-interactive assets, never painted into locked art',()=>{
 assert.match(svg,/<svg\b[^>]*viewBox="0 0 208 90"/);
 assert.match(svg,/<path\b/);
 assert.doesNotMatch(svg,/<(?:script|foreignObject|image)\b|\bhref\s*=/i);
 assert.match(script,/function syncHomeBoats\(host,box,viewport,portrait\)/);
 assert.match(script,/if\(!isIpadHome\(\)\|\|host\.dataset\.bc15CardArt==='owner-approved-ui-free'\)/,
   'boats must be removed if either approved UI-free iPad master takes over');
 assert.match(script,/layer\.setAttribute\('aria-hidden','true'\)/);
 assert.match(script,/for\(const name of \['near','far'\]\)/);
 assert.match(script,/syncHomeBoats\(host,box,viewport,portrait\)/);
 assert.match(style,/\.bc15-boats\s*\{[\s\S]*?pointer-events:none!important/);
 assert.match(style,/\.bc15-boat\s*\{[\s\S]*?laria-grovanova-rowboat\.svg/);
 assert.match(style,/\.bc15-boat\s*\{[\s\S]*?pointer-events:none!important/);
 assert.doesNotMatch(style,/kjosnes-home-(?:phone|tablet)\.webp[^\n]*boat/);
});

test('Home map cleans rowboats when scene changes and anchors them to artwork geometry',()=>{
 assert.match(script,/host\.querySelector\('\.bc15-boats'\)\?\.remove\(\)/);
 assert.match(script,/const boxes=portrait\?[\s\S]*?\]\s*:\s*\[/);
 assert.match(script,/\[\.\.\.layer\.children\]\.forEach\(\(boat,index\)=>place\(boat,box,boxes\[index\],viewport\)\)/);
 // No accidental additional UI destinations or hardcoded names are introduced.
 assert.doesNotMatch(svg,/Reisen|Utforsk|Oppdrag|Troll|Læria|Geografi|Norsk/);
});
