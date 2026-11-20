'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..','laer-litt-mer');const js=fs.readFileSync(path.join(root,'trollactor2-prototype.js'),'utf8');const css=fs.readFileSync(path.join(root,'trollactor2-prototype.css'),'utf8');const layered=fs.readFileSync(path.join(root,'trollactor2-layered.js'),'utf8');const layeredCss=fs.readFileSync(path.join(root,'trollactor2-layered.css'),'utf8');
test('TrollActor 2 prototype is isolated and preserves Storesøster source art',()=>{
 assert.match(js,/trollactor2-prototype=1/);assert.match(js,/storesoster\.webp/);assert.match(js,/data-ta2-test-only/);
 assert.doesNotMatch(js,/persistChoice|localStorage|saveState/);assert.match(js,/\['idle','wave','think','help','celebrate','encourage'\]/);
 assert.match(js,/ta2-face-slot.*hidden/);assert.match(js,/ta2-arm-slot.*hidden/);assert.match(css,/prefers-reduced-motion/);
});
test('layered engine requires a complete approved Storesøster asset pack',()=>{
 assert.match(layered,/identity==='storesoster'/);assert.match(layered,/requiredAssets:REQUIRED/);assert.match(layered,/validPack/);
 assert.match(layered,/assets\/trollactor2\/storesoster-v2/);assert.match(layeredCss,/prefers-reduced-motion/);
 assert.match(layered,/\['idle','wave','think','help','celebrate','encourage'\]/);
 assert.doesNotMatch(layered,/localStorage|persistChoice|saveState/);
});
