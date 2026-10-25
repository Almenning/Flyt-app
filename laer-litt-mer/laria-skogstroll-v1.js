/* Læria skogstroll v1: one immutable identity source for existing child scenes.
   No profile migration, no writes to learning state or persisted avatar IDs.
   Keep existing fox identity for older grades until those screens are redesigned. */
(function(root){
  'use strict';
  const artwork=Object.freeze({
    storesoster:'./assets/skogstroll/storesoster.webp',
    lillesoster:'./assets/skogstroll/lillesoster.webp',
    lillebror:'./assets/skogstroll/lillebror.webp'
  });
  const names=Object.freeze({
    storesoster:'storesøster',
    lillesoster:'lillesøster',
    lillebror:'lillebror'
  });
  const subjects=Object.freeze({
    norwegian:'storesoster',
    math:'lillebror',
    english:'lillesoster',
    geography:'storesoster'
  });
  function enabled(){
    const doc=root.document;
    if(doc?.querySelector('.grade-band-young'))return true;
    const grade=Number(root.currentGrade?.());
    return Number.isFinite(grade)&&grade>=1&&grade<=2;
  }
  function keyFor(subject){
    return subjects[String(subject||'').toLowerCase()]||'storesoster';
  }
  // The two distinct Norwegian word games should not always reuse the same
  // companion. Assignments are stable and never written to the child profile.
  const activities=Object.freeze({
    wordHunt:'storesoster',
    findTheWords:'lillesoster'
  });
  function source(key){return artwork[key]||artwork.storesoster;}
  function sourceForSubject(subject){return source(keyFor(subject));}
  function labelForSubject(subject){return 'Skogstrollet '+names[keyFor(subject)];}
  function keyForActivity(activity){return activities[String(activity||'')]||'storesoster';}
  function sourceForActivity(activity){return source(keyForActivity(activity));}
  function labelForActivity(activity){return 'Skogstrollet '+names[keyForActivity(activity)];}
  root.LARIA_SKOGSTROLL=Object.freeze({
    enabled,keyFor,source,sourceForSubject,labelForSubject,
    keyForActivity,sourceForActivity,labelForActivity,subjects,activities,artwork
  });
})(window);
