/* Læria: shared, presentation-only contract for the five locked illustrated places.
 * NO new node ids, learning sessions, storage keys or progression writes.
 * Source of truth for learning content remains journeyModel / geoJourneyModel.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_LOCKED_JOURNEYS=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DEFINITIONS=Object.freeze({
    norwegian:Object.freeze({title:'Bokskogen',subjectLabel:'Norsk',asset:'bokskogen-locked-20261010.png',
      places:Object.freeze(['Leselyset','Ordverkstedet','Historiehytta','Setningsbroen','Fortellingstårnet'])}),
    math:Object.freeze({title:'Tallenga',subjectLabel:'Matte',asset:'tallenga-locked-20261010.png',
      places:Object.freeze(['Tallverkstedet','Formfabrikken','Brøklaben','Målebroen','Problemtårnet'])}),
    english:Object.freeze({title:'Ordlandsbyen',subjectLabel:'Engelsk',asset:'ordlandsbyen-locked-20261010.png',
      places:Object.freeze(['Startplassen','Ordhandelen','Grammatikkhuset','Snakkekaféen','Fortellingsslottet'])}),
    geography:Object.freeze({title:'Nordlysleiren',subjectLabel:'Geografi',asset:'nordlysleiren-locked-20261010.png',
      places:Object.freeze(['Basecamp','Kartkroken','Utforskertårnet','Naturstien','Observatoriet'])})
  });
  const SUBJECTS=Object.freeze(Object.keys(DEFINITIONS));
  const CORE_TYPES=new Set(['skill','geo-skill','checkpoint']);
  const EXTRA_TYPES=new Set(['review','challenge']);
  function assert(condition,message){if(!condition)throw new Error('Læria locked journey: '+message)}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function build(subject,model,readState,recommendedId){
    const def=DEFINITIONS[subject];
    assert(def,'unknown subject '+subject);
    assert(model&&Array.isArray(model.areas)&&Array.isArray(model.nodes),'missing original journey model');
    assert(typeof readState==='function','missing existing progression reader');
    const core=model.areas.flatMap(a=>(a.nodes||[]).filter(n=>CORE_TYPES.has(n.type)));
    const extras=model.areas.flatMap(a=>(a.nodes||[]).filter(n=>EXTRA_TYPES.has(n.type)));
    const allIds=new Set(model.nodes.map(n=>n.id));
    assert(allIds.size===model.nodes.length,'duplicate original node ids');
    assert(core.length>0,'no original core missions');
    const buckets=Array.from({length:5},()=>[]);
    // Stable in-order partitioning. Every real mission remains attached to exactly
    // one visual landmark; the original sequence is not re-identified or rewritten.
    core.forEach((n,i)=>buckets[Math.min(4,Math.floor(i*5/core.length))].push(n));
    extras.forEach(n=>{
      const index=core.findIndex(x=>x.areaId===n.areaId);
      buckets[index<0?4:Math.min(4,Math.floor(index*5/core.length))].push(n);
    });
    const assigned=new Set();
    const places=def.places.map((title,index)=>{
      const nodes=buckets[index].map(node=>{
        assert(allIds.has(node.id)&&!assigned.has(node.id),'unrecognized or duplicated node '+node.id);
        assigned.add(node.id);
        const status=String(readState(node)||'new');
        return Object.freeze({id:node.id,type:node.type,areaId:node.areaId,title:node.title,status,
          complete:status==='passed'||status==='can-now'||status==='mastered'});
      });
      const required=nodes.filter(n=>CORE_TYPES.has(n.type));
      const done=required.filter(n=>n.complete).length;
      return Object.freeze({index,title,nodes:Object.freeze(nodes),done,total:required.length,
        complete:required.length>0&&required.every(n=>n.complete),
        recommended:nodes.some(n=>n.id===recommendedId)});
    });
    assert(assigned.size===core.length+extras.length,'a previously available node disappeared');
    return Object.freeze({subject,title:def.title,asset:def.asset,places:Object.freeze(places),
      originalIds:Object.freeze(model.nodes.map(n=>n.id))});
  }
  function imagePoint(point,box){
    assert(point&&box&&box.width>0&&box.height>0,'invalid map/image geometry');
    // All landmark positions are relative to the *full un-cropped image*, not to
    // the screen viewport. This retains the exact painted perspective.
    return Object.freeze({left:clamp(point[0],0,100)/100*box.width,
      top:clamp(point[1],0,100)/100*box.height});
  }
  function get(subject){return DEFINITIONS[subject]||null}
  return Object.freeze({DEFINITIONS,SUBJECTS,build,imagePoint,get});
});
