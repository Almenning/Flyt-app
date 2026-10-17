/* Læria private chapter pilots: contextual, optional fox guidance.
 * Help is an invitation, never a gate, score or automatic answer reveal.
 * Uses the child's already selected fox artwork in each activity scene.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LARIA_CHAPTER_FOX_BUDDY=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const HINTS=Object.freeze({
   math:Object.freeze({
     formstien:'Tell hjørnene. Se også etter rette og runde sider.',
     monsterbekken:'Finn den minste rekken av figurer som gjentar seg.',
     speildammen:'Hver blå rute trenger en venn på samme rad, like langt fra streken.',
     tallbroen:'Se hvor mye tallene forandrer seg mellom hvert steg.',
     stjernelunden:'Se etter figurenes rytme eller hvordan tallene forandrer seg.'
   }),
   english:Object.freeze({
     hilsenkaia:'Lytt etter om vennen sier hei, spør hva du heter, eller sier ha det.',
     ordbrygga:'Finn ordet som forteller hvem eller hva setningen handler om.',
     setningsverkstedet:'Begynn med hvem som gjør noe. Hvilke engelske ord kan stå først?',
     samtalebaten:'Hva spør vennen om? Svar på akkurat det spørsmålet.',
     historiefyret:'Les én setning om gangen. Finn ordet som passer til spørsmålet.'
   }),
   geography:Object.freeze({
     kompassholmen:'Toppen av kompasset er nord. Finn deretter retningen båten trenger.',
     passbrygga:'Tenk på hvor landet ligger på den ekte kloden.',
     havpassasjen:'Se for deg hvilke verdensdeler havet ligger mellom.',
     naturoya:'Tenk på klimaet og hvordan naturen ser ut på stedet.',
     naturøya:'Tenk på klimaet og hvordan naturen ser ut på stedet.',
     reisefyret:'Prøv å koble landet eller stedet til riktig verdensdel.'
   })
 });
 const BASE=Object.freeze({
   math:'Prøv deg fram. Jeg har et lite hint om du ønsker det.',
   english:'Du kan lese, lytte og prøve. Jeg kan hjelpe litt.',
   geography:'Du styrer reisen. Jeg kan hjelpe hvis du spør.'
 });
 const CHEER=Object.freeze({
   math:'Du fant sammenhengen! Reven jubler med deg.',
   english:'Well done! Reven heier på de engelske ordene dine.',
   geography:'God kurs! Reven heier på reisen din.'
 });
 const RETRY=Object.freeze({
   math:'Bra at du prøvde! Se på mønsteret én gang til.',
   english:'Bra forsøk! Les eller lytt én gang til. Vi kan prøve igjen.',
   geography:'Spennende forsøk! Vi finner veien sammen.'
 });
 function assert(ok,message){if(!ok)throw Error('Læria rev: '+message)}
 function hintFor(subject,stageId,kind){
   assert(!!BASE[subject],'unknown subject');
   // The mirror can also occur in a mixed final stop.
   if(subject==='math'&&kind==='mirror')return HINTS.math.speildammen;
   const hint=HINTS[subject][stageId];
   assert(typeof hint==='string'&&hint.length>=25,'missing non-trivial hint '+subject+'/'+stageId);
   return hint;
 }
 function response({subject,stageId,kind,feedback=null,expanded=false}){
   assert(!!BASE[subject],'unknown subject');
   let text=BASE[subject],mood='ready';
   if(feedback&&feedback.correct===true){text=CHEER[subject];mood='celebrate'}
   else if(feedback&&feedback.correct===false){text=RETRY[subject];mood='encourage'}
   else if(expanded){text=hintFor(subject,stageId,kind);mood='hint'}
   return Object.freeze({text,mood,showHint:!feedback,expanded:!feedback&&!!expanded});
 }
 function validate(stages){
   for(const subject of Object.keys(BASE)){
     const expected=stages?.[subject]||Object.keys(HINTS[subject]);
     for(const stage of expected)hintFor(subject,stage,'choice');
   }
   return true;
 }
 validate();
 return Object.freeze({HINTS,hintFor,response,validate});
});