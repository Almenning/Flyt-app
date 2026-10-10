'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('subject-first Home uses four direct chapter entrances and one journey',()=>{
 const js=read('home-basecamp-v12.js'),css=read('home-subjects-v14.css'),html=read('index.html');
 assert.match(html,/home-subjects-v14\.css\?v=/);
 for(const subject of ['norwegian','math','english','geography']){
  assert.match(js,new RegExp("subjectHomeCard\\('"+subject+"'"));
 }
 assert.match(js,/function openHomeSubject\(subject\)/);
 assert.match(js,/fromCamp=true;[\s\S]*?showScreen\('geography'\)/);
 assert.match(js,/data-camp="open-explore"/);
 assert.match(js,/function subjectScene\(subject\)/);
 assert.doesNotMatch(js,/src="\.\/(?:matte|engelsk|geografi)-verden\.png"/);
 assert.match(css,/\.bc14-subjects/);
 assert.match(css,/@media\(max-width:700px\) and \(orientation:portrait\)/);
 assert.match(css,/@media\(min-width:701px\) and \(orientation:portrait\)/);
 assert.doesNotThrow(()=>new (require('node:vm').Script)(js));
});
