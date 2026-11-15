'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const home='laer-litt-mer/assets/home-v15/';
test('iPad Home removes four bottom cards without changing locked original art',()=>{
 for(const [file,expected] of [
  ['kjosnes-home-tablet.webp','246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5'],
  ['kjosnes-home-phone.webp','0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7'],
  ['kjosnes-home-tablet-no-bottom-cards.webp','36c16faef72eca77889350a6c093e36fd3769c287a852aedc13f98b0e6ec9fd1'],
  ['kjosnes-home-phone-no-bottom-cards.webp','e04e2167d6c8f4aa28e18133a3bab16d9f0a29b058085e432acd8507d4cc0b53']
 ])assert.equal(sha(home+file),expected,'Original or clean iPad artwork bytes changed: '+file);
 const script=read('laer-litt-mer/home-kjosnes-v15.js');
 const css=read('laer-litt-mer/laria-home-ipad-rail-v1.css');
 const index=read('laer-litt-mer/index.html');
 const basecamp=read('laer-litt-mer/home-basecamp-v12.js');
 assert.match(script,/CLEAN_TABLET_MASTER/);
 assert.match(script,/CLEAN_PHONE_MASTER/);
 assert.match(script,/dataset\.bc15CardArt=cleanLoaded/);
 assert.match(script,/oldRow\.inert=cleanLoaded/);
 assert.match(script,/window\.LARIA_HOME_OPEN_SUBJECT/);
 assert.match(basecamp,/window\.LARIA_HOME_OPEN_SUBJECT=openHomeSubject/);
 assert.match(css,/laria-grovanova-signposts\.svg/);
 assert.match(css,/data-bc15-card-art="clean-candidate"/);
 assert.match(css,/\.bc14-subjects\{display:none!important/);
 assert.match(index,/laria-home-ipad-rail-v1\.css/);
});
