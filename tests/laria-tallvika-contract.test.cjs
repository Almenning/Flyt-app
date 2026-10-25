const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),js=read('tallvika.js'),css=read('tallvika.css');
assert.match(html,/tallvika\.css\?v=20261025-production[\w-]+/);
assert.match(html,/tallvika\.js\?v=20261025-production[\w-]+/);
assert.match(html,/math:Object\.freeze\(\{title:'Tallvika'\}\)/);
assert.match(js,/storesoster/);assert.match(js,/lillesoster/);assert.match(js,/lillebror/);
assert.match(js,/tallvikaTroll/);
assert.match(js,/openMultiplicationLab/);assert.match(js,/openFractionLab/);
assert.match(css,/tallvika-master-laast-20261025\.png/);
for(const name of ['assets/tallvika/tallvika-master-laast-20261025.png','assets/gangemagi-troll/storesoster.webp','assets/gangemagi-troll/lillesoster.webp','assets/gangemagi-troll/lillebror.webp']){
  assert.ok(fs.statSync(path.join(root,name)).size>50_000,`${name} must be an original-quality local asset`);
}
console.log('Tallvika contract passed');
