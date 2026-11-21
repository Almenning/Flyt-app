'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const index=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/index.html'),'utf8');
const start=index.indexOf('function drawGlobe(){'),end=index.indexOf('\nfunction globeInverse(',start);
assert.ok(start>0&&end>start,'test the actual classic renderer');
const geometry=index.split('\n').find(line=>line.startsWith('function geometryPolygons('));
assert.ok(geometry);

function render({canvasPresent=true,width=367,height=367,countries=[]}={}){
  const paint=[],assignments=[];
  let pathHasCountry=false,source;
  const rings=new Set(countries.flatMap(country=>{
    const g=country.geometry;
    return g?.type==='Polygon'?g.coordinates.flatMap(ring=>[ring]):
      g?.type==='MultiPolygon'?g.coordinates.flatMap(polygon=>polygon):[];
  }));
  const ctx={
    setTransform(){},clearRect(){},save(){},restore(){},arc(){},clip(){},fillRect(){},
    createRadialGradient:()=>({addColorStop(){}}),
    beginPath(){pathHasCountry=false;},
    fill(){if(pathHasCountry)paint.push({method:'fill',source});},
    stroke(){if(pathHasCountry)paint.push({method:'stroke',source});}
  };
  const canvas={_cssW:width,_cssH:height,_dpr:1,getContext:()=>ctx};
  const context={document:{getElementById:()=>canvasPresent?canvas:null},
    WORLD_COUNTRIES:countries,globeZoom:1,globeSelected:null,
    drawProjectedLine:(_ctx,coords)=>{if(rings.has(coords)&&coords.length>=3)pathHasCountry=true;},
    globeCountryColor:()=>'#316FE0',isTinyCountry:()=>false,globeProject:()=>null,
    drawMasteryMarker(){},drawGlobePulse:()=>false,requestAnimationFrame:()=>assert.fail('no pulse is active')};
  context.window=context;
  Object.defineProperty(context,'__LARIA_GLOBE_RENDER_SOURCE',{
    get:()=>source,set:value=>{source=value;assignments.push({value,paintCount:paint.length});}
  });
  vm.runInNewContext(geometry+'\n'+index.slice(start,end),context);
  context.drawGlobe();
  return {source,paint,assignments};
}

test('classic renderer does not claim a geometry frame without a canvas or usable dimensions',()=>{
  for(const options of [{canvasPresent:false},{width:0},{height:0}]){
    const actual=render(options);
    assert.equal(actual.source,undefined);assert.deepEqual(actual.assignments,[]);assert.deepEqual(actual.paint,[]);
  }
});

test('classic renderer does not claim a geometry frame for absent or empty country polygons',()=>{
  for(const countries of [[],[{id:'empty'}],
    [{id:'empty',geometry:{type:'Polygon',coordinates:[]}}],
    [{id:'empty',geometry:{type:'Polygon',coordinates:[[]]}}],
    [{id:'empty',geometry:{type:'MultiPolygon',coordinates:[]}}]]){
    const actual=render({countries});
    assert.equal(actual.source,undefined);assert.deepEqual(actual.assignments,[]);assert.deepEqual(actual.paint,[]);
  }
});

test('classic renderer records country geometry only after its actual polygon fill and stroke',()=>{
  const countries=[{id:'triangle',geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[0,1],[0,0]]]}}];
  const actual=render({countries});
  assert.deepEqual(actual.paint,[{method:'fill',source:undefined},{method:'stroke',source:undefined}]);
  assert.equal(actual.source,'country-geometry');
  assert.deepEqual(actual.assignments,[{value:'country-geometry',paintCount:2}]);
});
