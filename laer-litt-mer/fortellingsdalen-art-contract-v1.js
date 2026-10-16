/* Læria / Fortellingsdalen: single source of truth for portrait art geometry.
 * Keep publicApproved=false until an ORIGINAL premium map is visually accepted.
 * The five markers and the child's selected fox are separate DOM overlays.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_FORTELLINGSDALEN_ART=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DIMENSIONS=Object.freeze({width:941,height:1672});
  const ASSET=Object.freeze({
    src:'./fortellingsdalen-map-candidate-v2.svg?v=20261016-c2map2',
    status:'prototype',publicApproved:false,
    alt:'Illustrert dal med hytte, bro, sporsti, mølle og stjernetopp.'
  });
  const STOPS=Object.freeze({
    brevhytta:Object.freeze({
      id:'brevhytta',marker:Object.freeze({x:23,y:83}),
      foxFoot:Object.freeze({x:45,y:91,scale:1})
    }),
    eventyrbrua:Object.freeze({
      id:'eventyrbrua',marker:Object.freeze({x:67,y:68}),
      foxFoot:Object.freeze({x:43,y:78,scale:.84})
    }),
    sporstien:Object.freeze({
      id:'sporstien',marker:Object.freeze({x:28,y:50}),
      foxFoot:Object.freeze({x:46,y:61,scale:.71})
    }),
    fortellermolla:Object.freeze({
      id:'fortellermolla',marker:Object.freeze({x:72,y:34}),
      foxFoot:Object.freeze({x:55,y:45,scale:.58})
    }),
    stjernetoppen:Object.freeze({
      id:'stjernetoppen',marker:Object.freeze({x:57,y:17}),
      foxFoot:Object.freeze({x:46,y:29,scale:.46})
    })
  });
  const ORDER=Object.freeze(Object.keys(STOPS));
  function stop(id){return STOPS[String(id)]||null}
  function pct(n){return (Number(n)||0)+'%'}
  function markerStyle(id){
    const p=stop(id)?.marker;
    if(!p)throw new Error('Fortellingsdalen: unknown map stop '+id);
    return '--fd-x:'+pct(p.x)+';--fd-y:'+pct(p.y)+';';
  }
  function foxStyle(id){
    const point=(stop(id)||STOPS.brevhytta).foxFoot;
    return '--fd-fox-x:'+pct(point.x)+';--fd-fox-y:'+pct(point.y)+';--fd-fox-scale:'+point.scale+';';
  }
  function assertContract(){
    if(ORDER.length!==5)throw new Error('Exactly five learning places required');
    if(DIMENSIONS.width!==941||DIMENSIONS.height!==1672)throw new Error('Portrait canvas changed');
    const unique=new Set();
    for(const id of ORDER){
      if(unique.has(id))throw new Error('Duplicate stop '+id);
      unique.add(id);
      const {marker,foxFoot}=STOPS[id];
      for(const point of [marker,foxFoot]){
        if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||
           point.x<5||point.x>95||point.y<5||point.y>95)
          throw new Error('Map anchor outside safe painting '+id);
      }
      if(!(foxFoot.scale>0&&foxFoot.scale<=1))throw new Error('Invalid depth scale '+id);
    }
    if(ASSET.publicApproved||ASSET.status!=='prototype')
      throw new Error('Never publish draft art as premium without approval');
    return true;
  }
  assertContract();
  return Object.freeze({DIMENSIONS,ASSET,STOPS,ORDER,stop,markerStyle,foxStyle,assertContract});
});
