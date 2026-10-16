/* Læria: a two-chapter Norwegian storybook chooser.
 * Private until chapter-two art is accepted and child-facing release is approved.
 * Does not replace Bokskogen's original map, learning engine or progress records.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_NORWEGIAN_CHAPTER_CHOOSER=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const FULL_ID='norwegian:2:fortellingsdalen-2';
  const CHAPTERS=Object.freeze([
    Object.freeze({
      id:'bokskogen-1',number:1,title:'Bokskogen',
      subtitle:'Bokstaver, ord og små oppdrag',
      art:'./locked-journeys/bokskogen-locked-20261010.png',
      stateKey:'norwegian:2',
      published:true
    }),
    Object.freeze({
      id:'fortellingsdalen-2',number:2,title:'Fortellingsdalen',
      subtitle:'Brev, ledetråder og små mysterier',
      art:'./fortellingsdalen-map-preview.svg?v=20261016-c2map1',
      stateKey:FULL_ID,published:false
    })
  ]);
  const clamp=(v,max)=>Math.max(0,Math.min(max,Number.isFinite(Number(v))?Math.floor(Number(v)):0));
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  const completedStage=s=>!!obj(s).passedAt;
  function model(state,firstProgress,privatePreview){
    const journey=obj(obj(state).journey), legacyWin=!!obj(journey.gradeWins)['norwegian:2'];
    const first=obj(firstProgress);
    const firstTotal=Math.max(0,clamp(first.total,9999));
    const firstDone=clamp(first.done,firstTotal);
    const firstComplete=!!first.complete||legacyWin;
    const stored=obj(obj(journey.chapterProgress)[FULL_ID]),stages=obj(stored.stages);
    const secondDone=['brevhytta','eventyrbrua','sporstien','fortellermolla','stjernetoppen']
      .filter(id=>completedStage(stages[id])).length;
    const secondComplete=secondDone===5;
    // Do not strand an existing child if their first-chapter evidence is
    // unavailable after a migration or partial storage recovery.
    const earlierPlay=secondDone>0||!!stored.completedAt||!!stored.draft||
      Object.values(stages).some(entry=>clamp(obj(entry).attempts,99999)>0);
    const secondUnlocked=firstComplete||earlierPlay;
    const firstData=Object.freeze({
      ...CHAPTERS[0],done:firstComplete?firstTotal:firstDone,total:firstTotal,
      complete:firstComplete,available:true,locked:false,preview:false,
      status:firstComplete?'Spill igjen':firstDone?'Fortsett eventyret':'Start eventyret'
    });
    const secondAvailable=secondUnlocked&&privatePreview===true;
    const secondData=Object.freeze({
      ...CHAPTERS[1],done:secondDone,total:5,complete:secondComplete,
      available:secondAvailable,locked:!secondUnlocked,preview:true,
      status:secondComplete?'Spill igjen':secondDone?'Fortsett eventyret':'Utforsk dalen'
    });
    return Object.freeze({
      grade:2,subject:'norwegian',isPrivatePreview:privatePreview===true,
      completed: Number(firstComplete)+Number(secondComplete),
      chapters:Object.freeze([firstData,secondData])
    });
  }
  return Object.freeze({CHAPTERS,FULL_ID,model});
});
