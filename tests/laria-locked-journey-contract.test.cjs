'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const journey=require('../laer-litt-mer/locked-journey-contract.js');
const models={
 norwegian:[['lyder','ordbilder','ordlek','ordstart-checkpoint'],['setningsrekkefolge','ordbetydning','setninger-checkpoint'],['detaljer','forsta','tenkvidere','lesedetektiv-checkpoint']],
 math:[['count','add','math-checkpoint'],['forms','fractions','shape-checkpoint']],
 english:[['words','listen','start-checkpoint'],['speak','grammar','finish-checkpoint']],
 geography:[['geo-nordic','geo-checkpoint'],['geo-europe','geo-world','geo-finish']]
};
for(const subject of journey.SUBJECTS){
 test(subject+': maps all existing IDs to five places without mutation',()=>{
  const ids=models[subject].flat();
  const model={areas:models[subject].map((row,i)=>({nodes:row.map((id,j)=>({id,areaId:'area'+i,type:id.includes('checkpoint')||id==='geo-finish'?'checkpoint':subject==='geography'?'geo-skill':'skill',title:id}))}))};
  model.nodes=model.areas.flatMap(a=>a.nodes);
  const before=JSON.stringify(model);
  const result=journey.build(subject,model,n=>n.id===ids[0]?'can-now':'new',ids[1]);
  assert.equal(result.places.length,5);
  assert.deepEqual(result.originalIds,ids);
  assert.deepEqual(result.places.flatMap(p=>p.nodes.map(n=>n.id)).sort(),[...ids].sort());
  assert.equal(result.places.reduce((n,p)=>n+p.done,0),1);
  assert.equal(result.places.filter(p=>p.recommended).length,1);
  assert.equal(JSON.stringify(model),before);
  assert.equal(journey.get(subject).places.length,5);
 });
}
test('extras stay attached without creating IDs',()=>{
 const nodes=[{id:'a',areaId:'first',type:'skill'},{id:'b',areaId:'first',type:'checkpoint'},{id:'rev',areaId:'first',type:'review'}];
 const model={areas:[{id:'first',nodes}],nodes};
 const built=journey.build('norwegian',model,()=>'new','a');
 assert.deepEqual(built.places.flatMap(p=>p.nodes.map(n=>n.id)).sort(),['a','b','rev']);
});
test('uncropped proportional points respect original geometry',()=>{
 const p=journey.imagePoint([25,60],{width:941,height:1672});
 assert.ok(Math.abs(p.left-235.25)<1e-9);
 assert.ok(Math.abs(p.top-1003.2)<1e-9);
});
