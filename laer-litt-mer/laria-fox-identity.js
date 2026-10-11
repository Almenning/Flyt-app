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
  function syncDecorations(){
    const id=choice();
    const doc=root.document;
    if(!doc?.documentElement||doc.documentElement.dataset.lariaFoxAvatar===id)return;
    doc.documentElement.style.setProperty('--laria-fox-background','url("'+source(id)+'")');
    doc.documentElement.dataset.lariaFoxAvatar=id;
  }
  function worldSource(which){
    // Keep the portrait-based selection and its persisted ID unchanged.
    // Each chosen fox gets their own transparent full-body art layer, not a
    // replacement for her original onboarding portrait.
    return which==='girl'?'./assets/fox/girl-braids-blue-dress-v1.webp':'./assets/fox/boy-adventurer-green-vest-v1.webp';
  }
  root.LARIA_FOX=Object.freeze({choice,source,worldSource,label,syncDecorations});
})(window);
