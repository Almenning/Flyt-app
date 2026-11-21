'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const app=path.join(__dirname,'../laer-litt-mer');
const renderer=fs.readFileSync(path.join(app,'globe-v25-renderer.js'),'utf8');
const entrypoints=renderer.slice(renderer.indexOf('function premiumDraw(){'),renderer.lastIndexOf('})();'));
assert.ok(entrypoints.startsWith('function premiumDraw(){')&&entrypoints.includes('function install(){'));
const resize=fs.readFileSync(path.join(app,'index.html'),'utf8').split('\n').find(line=>line.startsWith('function resizeGlobe(){'));
assert.ok(resize,'exercise the actual shared bitmap sizing function');

// Run the real paint entrypoints, installation, seeding and activation wiring.
// Fine-grained geography helpers are stubbed: these tests concern whether the
// main canvas is allocated/painted, not the existing country artwork itself.
function harness(){
  let active=false,boot;
  const frames=[],mutations=[],resizes=[],events=new Map();
  const calls={allocations:[],paint:[],classic:[],preview:[],selections:[],chrome:[],enhanced:[],shell:0};
  const buttons=['explore','mine','classic'].map(globeMode=>({dataset:{globeMode}}));
  const frame={};
  const screen={dataset:{mapPerspective:'globe'},classList:{contains:name=>name==='active'&&active},
    querySelector:selector=>selector==='.globe-wrap'?frame:null};
  const ctx={};
  for(const name of ['setTransform','clearRect','save','beginPath','arc','clip','restore','stroke'])
    ctx[name]=(...args)=>calls.paint.push({name,args});
  const canvas={
    getBoundingClientRect:()=>active?{width:367,height:367}:{width:0,height:0},
    getContext:type=>{assert.equal(type,'2d');return ctx;}
  };
  for(const dimension of ['width','height'])Object.defineProperty(canvas,dimension,{
    set(value){calls.allocations.push({dimension,value});},get(){return 0;}
  });
  const context={screen,document:{
    getElementById:id=>id==='globe-canvas'?canvas:id==='world-screen'?screen:null,
    querySelectorAll:selector=>selector==='#globe-mode [data-globe-mode]'?buttons:[]
  },innerWidth:1024,innerHeight:1366,devicePixelRatio:1,
  globeMode:'explore',globeSelected:null,selectionPulse:null,TERRAIN:[],WORLD_COUNTRIES:[{id:'TD',name:'Tsjad'}],
  ensurePremiumShell:()=>calls.shell++,
  syncPremiumChrome:mode=>calls.chrome.push(mode),
  enhanceSelectedCountryV24:id=>calls.enhanced.push(id),
  globeProject:()=>null,
  drawGlobe:function(...args){calls.classic.push({receiver:this,args});return 'classic-result';},
  setGlobeMode:function(mode){context.globeMode=mode;return 'mode-'+mode;},
  selectGlobeCountry:function(id){calls.selections.push(id);context.globeSelected=id;return 'selected-'+id;},
  requestAnimationFrame:callback=>{frames.push(callback);return frames.length;},
  setInterval:callback=>{boot=callback;return 1;},clearInterval:()=>{},
  addEventListener:(name,callback)=>events.set(name,callback),
  MutationObserver:class{constructor(callback){mutations.push(callback);}observe(){}},
  ResizeObserver:class{constructor(callback){resizes.push(callback);}observe(){}},
  landClip:()=>false,selectedHalo:()=>false,drawGlobePulse:()=>false};
  for(const name of ['ocean','paintLandDepth','paintContinents','paintCountryVariation','paintAtlasTexture',
    'paintStoryBiomes','landRelief','paintMasteryOverlay','paintPolarLand','paintCountryBorders',
    'waterDetails','discoveryDetails','finish'])context[name]=()=>{};
  context.window=context;
  const originalDraw=context.drawGlobe;
  vm.runInNewContext("'use strict';\n"+resize+'\n'+entrypoints,context);
  const flush=()=>{
    for(let turns=0;frames.length;turns++){
      assert.ok(turns<10,'painting must settle without an unbounded animation loop');
      frames.splice(0).forEach(callback=>callback(0));
    }
  };
  return {context,calls,canvas,buttons,originalDraw,boot:()=>boot(),flush,
    activate:()=>{active=true;mutations.forEach(callback=>callback([]));},
    hide:()=>{active=false;},resize:()=>resizes.forEach(callback=>callback([]))};
}

test('hidden globe installation seeds and wires controls without allocating or painting its canvas',()=>{
  const h=harness();h.boot();
  assert.equal(h.context.__lariaGlobeV25Installed,true);
  assert.equal(h.context.__lariaGlobeClassicDraw,h.originalDraw);
  assert.equal(h.context.globeSelected,'TD');
  assert.deepEqual(h.calls.selections,['TD']);
  assert.ok(h.calls.shell>=1);
  assert.ok(h.buttons.every(button=>typeof button.onclick==='function'));
  h.flush();h.resize();h.flush();
  assert.deepEqual(h.calls.allocations,[],'a hidden canvas must not allocate the 1024×1366 viewport fallback');
  assert.deepEqual(h.calls.paint,[]);
  assert.deepEqual(h.calls.classic,[]);
});

test('hidden premium, classic and isolated preview entrypoints do not paint',()=>{
  const h=harness();h.boot();h.flush();
  h.context.premiumDraw();h.context.drawGlobe();
  h.context.globeMode='classic';h.context.drawGlobe();
  h.context.__lariaDiscoveryGlobePreview=true;
  h.context.LARIA_DISCOVERY_GLOBE_DRAW=()=>h.calls.preview.push('draw');
  h.context.premiumDraw();h.context.drawGlobe();h.flush();
  assert.deepEqual(h.calls.allocations,[]);
  assert.deepEqual(h.calls.paint,[]);
  assert.deepEqual(h.calls.classic,[]);
  assert.deepEqual(h.calls.preview,[]);
});

test('activating a previously hidden globe still sizes and paints premium, classic and isolated preview modes',()=>{
  const h=harness();h.boot();h.flush();h.activate();h.flush();
  assert.equal(h.canvas._cssW,367);assert.equal(h.canvas._cssH,367);
  assert.ok(h.calls.allocations.length>0);
  assert.ok(h.calls.allocations.every(allocation=>allocation.value===367));
  assert.ok(h.calls.paint.some(call=>call.name==='clearRect'));
  assert.equal(h.context.__LARIA_GLOBE_RENDER_SOURCE,'country-geometry');
  assert.deepEqual(h.calls.selections,['TD'],'activation keeps the already seeded selection');
  h.buttons.find(button=>button.dataset.globeMode==='classic').onclick();h.flush();
  assert.equal(h.context.globeMode,'classic');
  assert.ok(h.calls.classic.length>0);
  const receiver={},argument={id:'forwarded'};
  assert.equal(h.context.drawGlobe.call(receiver,argument),'classic-result');
  assert.equal(h.calls.classic.at(-1).receiver,receiver);
  assert.deepEqual(h.calls.classic.at(-1).args,[argument]);
  h.context.__lariaDiscoveryGlobePreview=true;
  const previewResult={kind:'preview'};
  h.context.LARIA_DISCOVERY_GLOBE_DRAW=()=>{h.calls.preview.push('draw');return previewResult;};
  assert.equal(h.context.drawGlobe(),previewResult);
  assert.equal(h.context.premiumDraw(),previewResult);
  assert.equal(h.calls.preview.length,2);
  h.hide();const before={allocations:h.calls.allocations.length,paint:h.calls.paint.length,preview:h.calls.preview.length};
  h.context.drawGlobe();h.context.premiumDraw();h.resize();h.flush();
  assert.deepEqual({allocations:h.calls.allocations.length,paint:h.calls.paint.length,preview:h.calls.preview.length},before);
});
