'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Prompt 18 commerce contract is native-verified and parent controlled',()=>{
  const html=read('laer-litt-mer/index.html');
  const commerce=read('laer-litt-mer/commerce-v18.js');
  const swift=read('laria-native/LariaStorePlugin.swift.template');
  const bridge=read('laria-native/LariaBridgeViewController.swift.template');
  const workflow=read('.github/workflows/laria-ios-build.yml');
  const brand=read('laria-native/prepare-brand.swift');
  const nativeConfig=JSON.parse(read('laria-native/capacitor.config.json'));

  assert.equal(nativeConfig.appId,'no.adspire.laria');
  assert.equal(nativeConfig.appName,'Læria');

  assert.match(html,/commerce-v18\.js\?v=20261007-p18rc1/);
  assert.match(html,/id="commerce-screen"/);
  assert.match(html,/id="open-commerce"/);
  assert.match(html,/id="commerce-restore"/);
  assert.match(html,/id="terms-screen"/);
  assert.match(html,/Vilkår og personvern/);
  assert.match(html,/Gjenopprett kjøp/);

  for(const fn of ['startSession','startGeoJourneyNode','startJourneyNode','startLearningSession']){
    const start=html.indexOf('function '+fn+'(');
    assert.ok(start>=0,'missing '+fn);
    const body=html.slice(start,start+900);
    assert.match(body,/LARIA_COMMERCE_V18\?\.requirePremium/,'missing premium guard in '+fn);
  }

  assert.match(commerce,/no\.adspire\.laria\.monthly/);
  assert.match(commerce,/no\.adspire\.laria\.yearly/);
  assert.match(commerce,/Plugins\?\.LariaStore/);
  assert.match(commerce,/function requirePremium/);
  assert.match(commerce,/if\(!p\)return true/,'web preview must not charge or lock');
  assert.doesNotMatch(commerce,/localStorage|sessionStorage/,'entitlement must not be trusted from web storage');

  assert.match(swift,/import StoreKit/);
  assert.match(swift,/Transaction\.currentEntitlements/);
  assert.match(swift,/case \.verified/);
  assert.match(swift,/await transaction\.finish\(\)/);
  assert.match(swift,/try await AppStore\.sync\(\)/);
  assert.match(swift,/no\.adspire\.laria\.monthly/);
  assert.match(swift,/no\.adspire\.laria\.yearly/);
  assert.match(bridge,/registerPluginInstance\(LariaStorePlugin\(\)\)/);

  assert.match(workflow,/Install Læria native branding/);
  assert.match(workflow,/swift prepare-brand\.swift/);
  assert.match(workflow,/Verify Læria native branding/);
  assert.match(brand,/AppIcon-512@2x\.png/);
  assert.match(brand,/splash-2732x2732\.png/);
  assert.match(brand,/string: "Læria"/);
  assert.match(workflow,/Install StoreKit 2 bridge/);
  assert.match(workflow,/node prepare-storekit\.mjs/);
  assert.match(workflow,/Build Læria simulator target/);
});


// Dynamic contract checks for pre-launch preview vs real StoreKit failure.
function loadCommerce(plugin){
  const events=[];
  const context={
    console,
    CustomEvent:class CustomEvent{
      constructor(type,init={}){this.type=type;this.detail=init.detail}
    },
    window:{
      Capacitor:plugin?{Plugins:{LariaStore:plugin}}:undefined,
      dispatchEvent:event=>events.push(event)
    }
  };
  vm.runInNewContext(read('laer-litt-mer/commerce-v18.js'),context,{filename:'commerce-v18.js'});
  return {api:context.window.LARIA_COMMERCE_V18,events};
}

test('web/PWA remains an open QA preview without the native StoreKit plugin',()=>{
  const {api}=loadCommerce(null);
  assert.equal(api.requirePremium('learning'),true);
  assert.equal(api.snapshot().native,false);
});

test('successful empty App Store catalogue keeps pre-launch native preview open',async()=>{
  const plugin={
    getProducts:async()=>({products:[],active:false,activeProductIds:[]}),
    getEntitlement:async()=>({active:false,activeProductIds:[]})
  };
  const {api}=loadCommerce(plugin);
  const status=await api.refresh();
  assert.equal(status.native,true);
  assert.equal(status.storeReady,false);
  assert.equal(status.error,null);
  assert.equal(api.requirePremium('learning'),true);
});

test('StoreKit catalogue error fails closed for a non-subscriber',async()=>{
  const plugin={
    getProducts:async()=>{throw new Error('store offline')},
    getEntitlement:async()=>({active:false,activeProductIds:[]})
  };
  const {api,events}=loadCommerce(plugin);
  const status=await api.refresh();
  assert.equal(status.storeReady,false);
  assert.equal(status.active,false);
  assert.match(status.error,/store offline/);
  assert.equal(api.requirePremium('learning'),false);
  assert.equal(events.at(-1).type,'laria-premium-required');
  assert.equal(events.at(-1).detail.reason,'store-unavailable');
});

test('verified subscriber stays premium when product catalogue is unavailable',async()=>{
  const monthly='no.adspire.laria.monthly';
  const plugin={
    getProducts:async()=>{throw new Error('store offline')},
    getEntitlement:async()=>({active:true,activeProductIds:[monthly]})
  };
  const {api}=loadCommerce(plugin);
  const status=await api.refresh();
  assert.equal(status.storeReady,false);
  assert.equal(status.active,true);
  assert.deepEqual([...status.activeProductIds],[monthly]);
  assert.match(status.error,/store offline/);
  assert.equal(api.requirePremium('learning'),true);
});

test('available App Store products still require entitlement when inactive',async()=>{
  const monthly='no.adspire.laria.monthly';
  const plugin={
    getProducts:async()=>({products:[{id:monthly,displayName:'Måned',displayPrice:'49 kr'}],active:false,activeProductIds:[]}),
    getEntitlement:async()=>({active:false,activeProductIds:[]})
  };
  const {api,events}=loadCommerce(plugin);
  const status=await api.refresh();
  assert.equal(status.storeReady,true);
  assert.equal(status.active,false);
  assert.equal(api.requirePremium('learning'),false);
  assert.equal(events.at(-1).detail.reason,'subscription');
});
