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

test('the four approved images have five non-overlapping tap regions in 941x1672 geometry',()=>{
 for(const subject of journey.SUBJECTS){
  const def=journey.get(subject);
  assert.deepEqual(def.dimensions,journey.DIMENSIONS);
  assert.equal(def.hitRects.length,5);
  assert.equal(def.places.length,5);
  assert.ok(def.asset.includes('-locked-20261010.png'));
  const rects=def.hitRects;
  for(const [index,rect] of rects.entries()){
   const [x,y,w,h]=rect;
   assert.ok(x>=0&&y>=0&&w>0&&h>0);
   assert.ok(x+w<=941&&y+h<=1672,subject+' landmark '+index+' outside original PNG');
   const scaled=journey.hotspot(subject,index);
   for(const value of Object.values(scaled))assert.ok(value.endsWith('%')&&Number.isFinite(Number(value.slice(0,-1))));
  }
  for(let i=0;i<rects.length;i++)for(let k=i+1;k<rects.length;k++){
   const [ax,ay,aw,ah]=rects[i],[bx,by,bw,bh]=rects[k];
   assert.ok(ax+aw<=bx||bx+bw<=ax||ay+ah<=by||by+bh<=ay,subject+' landmarks overlap '+i+' '+k);
  }
  assert.equal(journey.matchesOriginalSize(subject,941,1672),true);
  assert.equal(journey.matchesOriginalSize(subject,1122,1402),false);
  assert.equal(journey.matchesOriginalSize(subject,941,1650),false);
 }
});
test('original node IDs and completion are stable over repeat mapping',()=>{
 const nodes=[{id:'old-1',areaId:'a',type:'skill',title:'One'},{id:'old-2',areaId:'a',type:'checkpoint',title:'Trophy'}];
 const model={areas:[{id:'a',nodes}],nodes};
 const states={ 'old-1':'can-now','old-2':'passed' };
 const first=journey.build('norwegian',model,n=>states[n.id],'old-2');
 const second=journey.build('norwegian',model,n=>states[n.id],'old-2');
 assert.deepEqual(first,second);
 assert.deepEqual(first.originalIds,['old-1','old-2']);
 assert.equal(first.places.reduce((n,p)=>n+p.done,0),2);
 assert.equal(first.places.reduce((n,p)=>n+p.total,0),2);
});

test('grades with four core missions still reach the fifth painted destination',()=>{
 const nodes=[
  {id:'first',areaId:'a',type:'skill'},
  {id:'second',areaId:'a',type:'checkpoint'},
  {id:'third',areaId:'b',type:'skill'},
  {id:'last',areaId:'b',type:'checkpoint'}
 ];
 const model={areas:[{id:'a',nodes:nodes.slice(0,2)},{id:'b',nodes:nodes.slice(2)}],nodes};
 const places=journey.build('math',model,()=>'new','third').places;
 assert.equal(places[0].nodes[0].id,'first');
 assert.equal(places[4].nodes[0].id,'last');
 assert.equal(places[2].total,0,'vacant places may not fabricate activities');
 assert.equal(places.reduce((total,p)=>total+p.total,0),4);
 assert.deepEqual(places.flatMap(p=>p.nodes.map(n=>n.id)),['first','second','third','last']);
});
