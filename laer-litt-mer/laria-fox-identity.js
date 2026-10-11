/* Shared identity for Læria's selected fox. Profile is the single source of truth. */
(function(root){
  'use strict';
  function choice(){
    try{return typeof state!=='undefined'&&state?.profile?.avatar==='girl'?'girl':'boy';}
    catch(_){return 'boy';}
  }
  function source(which){
    const id=which==='girl'?'girl':'boy';
    return root.LARIA_PROFILE_AVATARS?.[id]||'./lia-fox-explorer-home.webp';
  }
  function label(which){return (which==='girl'?'Revejente':'Revegutt');}
  root.LARIA_FOX=Object.freeze({choice,source,label});
})(window);
