(function(){
  'use strict';

  const PRODUCT_IDS=['no.adspire.laria.monthly','no.adspire.laria.yearly'];
  const state={
    checked:false,
    storeReady:false,
    active:false,
    activeProductIds:[],
    products:[],
    error:null
  };

  function plugin(){
    return window.Capacitor?.Plugins?.LariaStore||null;
  }
  function snapshot(){
    return {
      checked:state.checked,
      storeReady:state.storeReady,
      active:state.active,
      activeProductIds:[...state.activeProductIds],
      products:state.products.map(p=>({...p})),
      error:state.error,
      native:!!plugin()
    };
  }
  function apply(result={}){
    state.checked=true;
    state.products=Array.isArray(result.products)?result.products:[...state.products];
    state.storeReady=state.products.length>0;
    state.active=!!result.active;
    state.activeProductIds=Array.isArray(result.activeProductIds)?result.activeProductIds:[];
    state.error=null;
    window.dispatchEvent(new CustomEvent('laria-commerce-changed',{detail:snapshot()}));
    return snapshot();
  }
  async function refresh(){
    const p=plugin();
    if(!p){
      state.checked=true;
      state.storeReady=false;
      state.active=false;
      state.products=[];
      state.error=null;
      return snapshot();
    }
    try{
      return apply(await p.getProducts());
    }catch(error){
      state.checked=true;
      state.storeReady=false;
      state.active=false;
      state.products=[];
      state.error=String(error?.message||error||'App Store er ikke tilgjengelig.');
      return snapshot();
    }
  }
  async function refreshEntitlement(){
    const p=plugin();
    if(!p)return refresh();
    try{
      const result=await p.getEntitlement();
      state.checked=true;
      state.active=!!result.active;
      state.activeProductIds=Array.isArray(result.activeProductIds)?result.activeProductIds:[];
      state.error=null;
      window.dispatchEvent(new CustomEvent('laria-commerce-changed',{detail:snapshot()}));
      return snapshot();
    }catch(error){
      state.error=String(error?.message||error||'Kunne ikke kontrollere abonnementet.');
      return snapshot();
    }
  }
  async function purchase(productId){
    if(!PRODUCT_IDS.includes(productId))throw new Error('Ugyldig abonnement.');
    const p=plugin();
    if(!p)throw new Error('Kjøp er bare tilgjengelig i Læria-appen fra App Store.');
    const result=await p.purchase({productId});
    if(result?.status==='purchased')await refresh();
    else await refreshEntitlement();
    return {...result,state:snapshot()};
  }
  async function restore(){
    const p=plugin();
    if(!p)throw new Error('Gjenoppretting er bare tilgjengelig i Læria-appen fra App Store.');
    const result=await p.restore();
    await refresh();
    return {...result,state:snapshot()};
  }
  function requirePremium(feature='learning'){
    const p=plugin();
    if(!p)return true; // Web/PWA is the QA/preview surface and never charges.
    if(!state.checked){
      window.dispatchEvent(new CustomEvent('laria-premium-required',{detail:{feature,reason:'checking'}}));
      refresh();
      return false;
    }
    if(!state.storeReady)return true; // Products are not live in App Store Connect yet: preview remains usable.
    if(state.active)return true;
    window.dispatchEvent(new CustomEvent('laria-premium-required',{detail:{feature,reason:'subscription'}}));
    return false;
  }

  window.LARIA_COMMERCE_V18={
    version:'p18rc1',
    productIds:[...PRODUCT_IDS],
    snapshot,
    refresh,
    refreshEntitlement,
    purchase,
    restore,
    requirePremium,
    isPremium:()=>state.active
  };
})();