'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..','laer-litt-mer');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Prompt 17 keeps the iOS safe-area contract',()=>{
  const html=read('index.html');
  const basecamp=read('home-basecamp-v12.css');
  const challenge=read('safe-challenge.js');

  assert.match(html,/name="viewport"[^>]*viewport-fit=cover/,'viewport-fit=cover is required for iOS safe-area layout');
  assert.match(basecamp,/\.bc12-heading\{[^}]*safe-area-inset-top/,'Basecamp heading must respect the top safe area');
  assert.match(basecamp,/\.bc12-nav\{[^}]*safe-area-inset-bottom/,'Basecamp navigation must respect the bottom safe area');
  assert.match(basecamp,/@media\(max-width:700px\)[\s\S]*?\.bc12-nav\{[^}]*safe-area-inset-bottom/,'mobile Basecamp must not override the bottom safe area');
  assert.match(challenge,/safe-challenge-young[^']*safe-area-inset-right/,'young challenge control must respect the right safe area');
  assert.match(challenge,/safe-challenge-young[^']*safe-area-inset-top/,'young challenge control must respect the top safe area');
  assert.match(html,/#world-screen\.active #world-back\{[^}]*safe-area-inset-left[^}]*safe-area-inset-top/,'immersive Globe back control must remain notch-safe');
});

test('Prompt 17 keeps parent touch controls at least 44px high',()=>{
  const html=read('index.html');
  assert.match(html,/\.adult-entry\{[^}]*min-height:44px/,'adult long-press target must stay at least 44px high');
  assert.match(html,/\.adult-grade-select\{[^}]*min-height:44px/,'adult grade selector must stay at least 44px high');
});
