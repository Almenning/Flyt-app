'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Prompt 18 commerce contract is native-verified and parent controlled',()=>{
  const html=read('laer-litt-mer/index.html');
  const commerce=read('laer-litt-mer/commerce-v18.js');
  const swift=read('laria-native/LariaStorePlugin.swift.template');
  const bridge=read('laria-native/LariaBridgeViewController.swift.template');
  const workflow=read('.github/workflows/laria-ios-build.yml');
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

  assert.match(workflow,/Install StoreKit 2 bridge/);
  assert.match(workflow,/node prepare-storekit\.mjs/);
  assert.match(workflow,/Build Læria simulator target/);
});
