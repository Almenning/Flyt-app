/* Læria: reference coordinates for the ORIGINAL, locked 10 October 2026 PNGs.
 * Every image is exactly 941 x 1672 px. Pixel rectangles are on the image, never
 * on an invented, reflowed or cropped map. Do NOT substitute October 4 worlds.
 * Only original journeyModel/geoJourneyModel owns learning, IDs and progress.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_LOCKED_JOURNEYS=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DIMENSIONS=Object.freeze({width:941,height:1672});
  function definition(title,subjectLabel,asset,places,hitRects){
    return Object.freeze({
      title,subjectLabel,asset,
      dimensions:DIMENSIONS,
      places:Object.freeze(places),
      // x, y, width, height in the EXACT source PNG, not viewport pixels.
      hitRects:Object.freeze(hitRects.map(rect=>Object.freeze(rect)))
    });
  }
  const DEFINITIONS=Object.freeze({
    norwegian:definition('Bokskogen','Norsk','locked-journeys/bokskogen-locked-20261010.png',
      ['Leselyset','Ordverkstedet','Historiehytta','Setningsbroen','Fortellingstårnet'],
      [[64,1238,280,79],[471,1029,289,72],[604,802,270,74],[531,563,275,68],[636,371,283,72]]),
    math:definition('Tallenga','Matte','locked-journeys/tallenga-locked-20261010.png',
      ['Tallverkstedet','Formfabrikken','Brøklaben','Målebroen','Problemtårnet'],
      [[119,1309,328,86],[532,1126,312,81],[623,820,274,80],[456,564,250,73],[633,382,275,78]]),
    english:definition('Ordlandsbyen','Engelsk','locked-journeys/ordlandsbyen-locked-20261010.png',
      ['Startplassen','Ordhandelen','Grammatikkhuset','Snakkekaféen','Fortellingsslottet'],
      [[71,1323,341,88],[522,1154,315,81],[581,914,332,80],[529,641,317,84],[641,346,274,79]]),
    geography:definition('Nordlysleiren','Geografi','locked-journeys/nordlysleiren-locked-20261010.png',
      ['Basecamp','Kartkroken','Utforskertårnet','Naturstien','Observatoriet'],
      [[83,1315,340,99],[593,1088,289,80],[595,839,325,85],[576,542,267,75],[654,306,260,83]])
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
    assert(typeof readState==='function','missing original progress reader');
    const core=model.areas.flatMap(a=>(a.nodes||[]).filter(n=>CORE_TYPES.has(n.type)));
    const extras=model.areas.flatMap(a=>(a.nodes||[]).filter(n=>EXTRA_TYPES.has(n.type)));
    const allIds=new Set(model.nodes.map(n=>n.id));
    assert(allIds.size===model.nodes.length,'duplicate original node ids');
    assert(core.length>0,'no original core missions');
    const buckets=Array.from({length:5},()=>[]);
    // Distribute existing core missions from the FIRST painted place to the
    // LAST one, even when a grade has fewer than five core missions. A vacant
    // intermediate place is an exploration landmark, NEVER a synthetic task.
    // In-order node IDs and the original journey / area sequence do not change.
    const paintedIndex=i=>core.length===1?0:Math.round(i*4/(core.length-1));
    core.forEach((n,i)=>buckets[paintedIndex(i)].push(n));
    extras.forEach(n=>{
      const index=core.findIndex(x=>x.areaId===n.areaId);
      buckets[index<0?4:paintedIndex(index)].push(n);
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
    return Object.freeze({left:clamp(point[0],0,100)/100*box.width,
      top:clamp(point[1],0,100)/100*box.height});
  }
  function hotspot(subject,index){
    const def=DEFINITIONS[subject];
    assert(def&&Number.isInteger(index)&&index>=0&&index<5,'invalid original artwork hotspot');
    const [x,y,width,height]=def.hitRects[index];
    const pct=(n,whole)=>String(Number((n/whole*100).toFixed(5)))+'%';
    return Object.freeze({left:pct(x,DIMENSIONS.width),top:pct(y,DIMENSIONS.height),
      width:pct(width,DIMENSIONS.width),height:pct(height,DIMENSIONS.height)});
  }
  function matchesOriginalSize(subject,width,height){
    return !!DEFINITIONS[subject]&&width===DIMENSIONS.width&&height===DIMENSIONS.height;
  }
  // Four painted markers track QUARTILES of the ORIGINAL core missions.
  // Five illustrated places do not necessarily mean five available lessons.
  function milestoneStates(done,total){
    const max=Math.max(0,Number(total)||0),value=Math.min(max,Math.max(0,Number(done)||0));
    const filled=max>0?Math.min(4,Math.floor(value*4/max+1e-9)):0;
    return Object.freeze(Array.from({length:4},(_,i)=>i<filled?'done':
      max>0&&value<max&&i===filled?'current':'new'));
  }
  function get(subject){return DEFINITIONS[subject]||null}
  return Object.freeze({DEFINITIONS,DIMENSIONS,SUBJECTS,build,imagePoint,hotspot,milestoneStates,matchesOriginalSize,get});
});
