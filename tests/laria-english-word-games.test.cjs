'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {KEY,VERSION,WORDS,PICTURE,GRIDS,clean,line,locate,answer}=require('../laer-litt-mer/english-word-games-v1.js');

test('both English word puzzles are solvable in either selection direction, without alternate positions',()=>{
 for(const grid of GRIDS){
  assert.equal(grid.rows.length,5);
  assert.ok(grid.rows.every(row=>/^[A-Z]{5}$/.test(row)));
  for(const word of grid.words){
   assert.ok(WORDS[word]?.nb);
   const path=locate(grid,word);
   assert.equal(path.length,word.length);
   assert.equal(answer(grid,path[0],path.at(-1)),word);
   assert.equal(answer(grid,path.at(-1),path[0]),word);
   const matches=new Set();
   for(let y=0;y<5;y++)for(let x=0;x<5;x++)for(let ey=0;ey<5;ey++)for(let ex=0;ex<5;ex++){
    if(answer(grid,[y,x],[ey,ex])===word)matches.add([[y,x],[ey,ex]].sort().join(':'));
   }
   assert.equal(matches.size,1,word);
  }
 }
 assert.deepEqual(line([0,0],[2,2]),[]);
 assert.deepEqual(line([4,4],[5,4]),[]);
});
test('picture targets are English clue pairs in the unchanged approved art geometry',()=>{
 const ids=PICTURE.flat();
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ids){
  assert.match(id,/^[a-z]+$/);
  const item=WORDS[id], [x,y,w,h]=item.box;
  assert.notEqual(item.nb,id);
  assert.ok(item.where&&!item.where.includes(id));
  assert.ok([x,y,w,h].every(v=>v>0)&&x+w<=100&&y+h<=100);
 }
});
test('English rounds persist under their own versioned key and validate saved answers independently',()=>{
 assert.equal(KEY,'laria-english-word-games-v1');
 const sanitized=clean({version:VERSION,picture:{round:1,found:['mountain','mountain','church','cat'],completed:4},grid:{round:1,found:['sea','bird'],completed:-1}});
 assert.deepEqual(sanitized,{picture:{round:1,found:['mountain'],completed:4},grid:{round:1,found:['sea'],completed:0}});
 assert.deepEqual(clean({version:999,picture:{round:1,found:['mountain']}}),clean(null));
});
test('Kinn activities respect the existing verified art and only admit the explicitly advertised fourth route',()=>{
 const f=name=>fs.readFileSync(require('node:path').join(__dirname,'../laer-litt-mer',name),'utf8');
 assert.match(f('laria-scene-ui-v1.js'),/data-ki-word-games-enabled[\s\S]{0,80}words,sentences,reading,word-games/);
 assert.match(f('english-word-games-v1.js'),/if\(!win\.LARIA_KINNAKLOVA\?\.ready\(\)/);
 assert.match(f('english-word-games-v1.js'),/utterance\.lang=voice\?\.lang[^\n]+en-GB/);
 assert.match(f('index.html'),/english-word-games-v1\.js[^\n]+\n<script src="\.\/kinnaklova\.js/);
});
