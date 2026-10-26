const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),js=read('tallvika.js'),css=read('tallvika.css');
assert.match(html,/tallvika\.css\?v=20261026-storesoster-approved1/);
assert.match(html,/tallvika\.js\?v=20261026-storesoster-approved1/);
assert.match(html,/math:Object\.freeze\(\{title:'Tallvika'\}\)/);
assert.match(js,/storesoster/);assert.match(js,/lillesoster/);assert.match(js,/lillebror/);
assert.match(js,/tallvikaTroll/);
assert.match(js,/storesoster-inworld-approved-20261026\.webp/);
assert.match(css,/tv-companion__ground/);
assert.match(js,/openMultiplicationLab/);assert.match(js,/openFractionLab/);
assert.match(css,/tallvika-master-laast-20261025\.png/);
for(const name of ['assets/tallvika/tallvika-master-laast-20261025.png','assets/gangemagi-troll/storesoster.webp','assets/gangemagi-troll/lillesoster.webp','assets/gangemagi-troll/lillebror.webp']){
  assert.ok(fs.statSync(path.join(root,name)).size>50_000,`${name} must be an original-quality local asset`);
}
assert.ok(fs.statSync(path.join(root,'assets/tallvika/storesoster-inworld-approved-20261026.webp')).size>50_000,'Storesøster in-world treatment must be local and substantial');

const {createHash}=require('node:crypto');
const sha256=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
assert.equal(sha256('assets/tallvika/storesoster-inworld-approved-20261026.webp'),
 '80ae8a1ea0b43ebc2d8c0b12fb0e5cd588bce1882fd9d52819d3ac7ef4d85e67',
 'the actual pixel-lossless user-approved painterly artwork must be used unchanged');
const originalTrollSha={
 storesoster:'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89',
 lillesoster:'ee3f14e95407c8f673ee78c8ea3afc1b782e6f2975929ce6f77b867de29db425',
 lillebror:'7f1d9eeb293361ebb6507d024013d744d106978b72bbe4d71e2096816d9fdd11'
};
for(const [id,hash] of Object.entries(originalTrollSha)){
 assert.equal(sha256('assets/gangemagi-troll/'+id+'.webp'),hash,id+' original changed unexpectedly');
}
assert.match(js,/approved-painterly-20261026/);
assert.doesNotMatch(css,/brightness\(\.985\) saturate\(\.95\)/);
console.log('Tallvika contract passed');
