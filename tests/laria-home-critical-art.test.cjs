'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/home-basecamp-v12.js'),'utf8');
test('Visible subject artwork is requested eagerly without competing high-priority downloads',()=>{
 const tag=source.match(/<img[^>]+src="\.\/home-[^>]+>/)?.[0];
 assert(tag,'The four subject cards must keep their existing image template');
 assert.match(tag,/loading="eager"/);
 assert.match(tag,/decoding="async"/);
 assert.doesNotMatch(tag,/fetchpriority="(?:low|high)"/);
 assert.match(tag,/-v14\.webp\?v=20261010-scene1/);
});
test('Preloaded Home script and runtime script use the same new asset revision',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
 const urls=[...html.matchAll(/(?:href|src)="\.\/(home-basecamp-v12\.js\?v=[^"]+)"/g)].map(m=>m[1]);
 assert.equal(urls.length,2);
 assert.equal(urls[0],urls[1]);
 assert.match(urls[0],/home-art-ready1$/);
 const sw=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/sw.js'),'utf8');
 assert.match(sw.split('\n')[0],/home-art-ready1/);
});
