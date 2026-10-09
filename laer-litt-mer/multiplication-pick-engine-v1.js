/* Læria · Plukk og tell v1 · locked multiplication/play mathematics.
   Pure model, shared by Safari UI and Node regression tests. No grading. */
(function(scope){
'use strict';
const MAX_GROUPS=5, MAX_EACH=12;
const VIEWS=['groups','rows','numberline','circle'];
const SCENARIOS=[{id:'2x3',counts:[3,3]},{id:'3x2',counts:[2,2,2]},{id:'3x3',counts:[3,3,3]},{id:'3x4',counts:[4,4,4]}];
const WORLDS=[
 {id:'strawberry',name:'Jordbærhagen',object:'jordbær',unit:'jordbær',scene:'garden',emoji:'🍓'},
 {id:'bun',name:'Eventyrbakeriet',object:'boller',unit:'bolle',scene:'bakery',emoji:'🥐'},
 {id:'mushroom',name:'Soppskogen',object:'sopper',unit:'sopp',scene:'forest',emoji:'🍄'},
 {id:'apple',name:'Frukthagen',object:'epler',unit:'eple',scene:'orchard',emoji:'🍎'},
 {id:'treasure',name:'Skattekammeret',object:'skatter',unit:'edelsten',scene:'treasure',emoji:'💎'},
 {id:'train',name:'Eventyrtoget',object:'kofferter',unit:'koffert',scene:'train',emoji:'🚂'},
 {id:'beach',name:'Strandekspedisjonen',object:'skjell',unit:'skjell',scene:'beach',emoji:'🐚'},
 {id:'farm',name:'Gårdstunet',object:'egg',unit:'egg',scene:'farm',emoji:'🥚'},
 {id:'aquarium',name:'Akvariet',object:'fisker',unit:'fisk',scene:'aquarium',emoji:'🐟'},
 {id:'balloon',name:'Ballongparken',object:'ballonger',unit:'ballong',scene:'park',emoji:'🎈'}
];
const MISSIONS=[
 {id:'twentyfour',title:'Finn 24',prompt:'Kan du få akkurat 24 igjen?',initial:[10,10,10]},
 {id:'equal',title:'Like grupper',prompt:'To er plukket fra midten. Gjør kurvene like igjen!',initial:[10,8,10],collected:2},
 {id:'empty',title:'Tøm én gruppe',prompt:'Kan du lage 2 × 10 ved å tømme én kurv?',initial:[10,10,10]},
 {id:'twoWays',title:'To måter å lage 18',prompt:'Vis 18 som to forskjellige gangestykker. Flytt mellom kurver!',initial:[6,6,6]}
];
const limit=(x,lo,hi)=>Math.min(hi,Math.max(lo,Math.trunc(Number(x)||0)));
const worldExists=id=>WORLDS.some(w=>w.id===id);
const missionExists=id=>MISSIONS.some(m=>m.id===id);
function makeTokens(counts){let id=0;return counts.map(n=>Array.from({length:n},()=>id++));}
function initial(){
 const counts=[10,10,10];
 return {version:1,scenario:null,view:'groups',world:'strawberry',counts,itemIds:makeTokens(counts),pool:[],nextId:30,collected:0,mission:null,found:[],success:false,message:'Plukk et jordbær for å starte!',moved:false,moveFrom:null,moveToken:null,moveMode:false};
}
function normalize(source){
 const s=source&&typeof source==='object'?source:{};
 const counts=Array.isArray(s.counts)?s.counts.slice(0,MAX_GROUPS).map(x=>limit(x,0,MAX_EACH)):[10,10,10];
 if(!counts.length)counts.push(10);
 const collected=limit(s.collected,0,MAX_GROUPS*MAX_EACH+40);
 const ids=Array.isArray(s.itemIds)?s.itemIds:[],rawPool=Array.isArray(s.pool)?s.pool:[];
 const used=new Set();let seq=0;
 const reserve=(candidate)=>{
  const number=typeof candidate==='number'?candidate:NaN;
  if(Number.isSafeInteger(number)&&number>=0&&!used.has(number)){
   used.add(number);seq=Math.max(seq,number+1);return number;
  }
  while(used.has(seq))seq++;
  const next=seq++;used.add(next);return next;
 };
 const itemIds=counts.map((n,g)=>Array.from({length:n},(_,j)=>reserve(Array.isArray(ids[g])?ids[g][j]:undefined)));
 const pool=Array.from({length:collected},(_,j)=>reserve(rawPool[j]));
 const moveFrom=Number.isInteger(s.moveFrom)&&s.moveFrom>=0&&s.moveFrom<counts.length?s.moveFrom:null;
 const moveToken=moveFrom!==null&&Number.isSafeInteger(s.moveToken)&&itemIds[moveFrom].includes(s.moveToken)?s.moveToken:null;
 const nextId=Math.max(seq,Number.isSafeInteger(s.nextId)?s.nextId:0);
 return {...initial(),scenario:SCENARIOS.some(x=>x.id===s.scenario)?s.scenario:null,view:VIEWS.includes(s.view)?s.view:'groups',world:worldExists(s.world)?s.world:'strawberry',counts,itemIds,pool,nextId,collected,
 mission:missionExists(s.mission)?s.mission:null,
 found:Array.isArray(s.found)?s.found.filter(x=>typeof x==='string').slice(0,3):[],
 success:Boolean(s.success),message:String(s.message||'').slice(0,180),moved:Boolean(s.moved),
 moveFrom,moveToken,moveMode:Boolean(s.moveMode)};
}
const total=s=>s.counts.reduce((sum,n)=>sum+n,0);
function equal(s){
 const nonzero=s.counts.filter(n=>n>0);
 return nonzero.length>0&&nonzero.every(n=>n===nonzero[0])?{groups:nonzero.length,each:nonzero[0]}:null;
}
function equation(s){
 const sum=total(s),e=equal(s);
 if(e)return {main:e.groups+' × '+e.each+' = '+sum,detail:e.groups+' like grupper med '+e.each+' i hver',equal:true};
 if(sum===0)return {main:'0',detail:'Alle gruppene er tomme.',equal:false};
 const added=s.counts.join(' + ')+' = '+sum;
 if(s.counts.length===3&&s.counts.every(n=>n<=10)&&sum+s.collected===30&&s.collected>0&&!s.moved)
  return {main:'3 × 10 − '+s.collected+' = '+sum,detail:added+' · Ulike grupper kan legges sammen.',equal:false};
 return {main:added,detail:'Gruppene er ulike. Vi kan legge sammen det som ligger i hver.',equal:false};
}
function missionInfo(s){
 if(!s.mission)return null;
 const m=MISSIONS.find(x=>x.id===s.mission);
 return {...m};
}
function evaluate(s){
 if(!s.mission)return {correct:false,message:'Velg et oppdrag, eller utforsk videre i ditt eget tempo.'};
 const sum=total(s),pair=equal(s);
 if(s.mission==='twentyfour')return {correct:sum===24,message:sum===24?'Du fant akkurat 24! Flott utforsket.':'Du har '+sum+'. Prøv å finne 24.'};
 if(s.mission==='equal')return {correct:Boolean(pair&&s.counts.every(n=>n===pair.each)),message:pair&&s.counts.every(n=>n===pair.each)?'Alle kurvene har like mange. Du klarte det!':'Se på antallet i hver kurv. Kan du gjøre dem like?'};
 if(s.mission==='empty')return {correct:Boolean(pair&&pair.groups===2&&pair.each===10&&s.counts.includes(0)),message:pair&&pair.groups===2&&pair.each===10&&s.counts.includes(0)?'To grupper med ti! Det blir 20.':'Prøv å få én tom kurv og ti i hver av de to andre.'};
 if(s.mission==='twoWays'){
  if(sum!==18||!pair)return {correct:false,message:'Finn en oppstilling med like grupper som gir 18.'};
  const key=pair.groups+'x'+pair.each;
  if(s.found.includes(key))return {correct:false,message:'Du har allerede funnet '+pair.groups+' × '+pair.each+'. Prøv en annen oppstilling!'};
  return {correct:true,key,message:s.found.length?'Du fant en annen måte å lage 18!':'Første måte funnet! Kan du vise 18 på en ny måte?'};
 }
 return {correct:false,message:'Prøv igjen.'};
}
function apply(source,action){
 const s=normalize(source);
 let next={...s,counts:s.counts.slice(),itemIds:s.itemIds.map(group=>group.slice()),pool:s.pool.slice(),found:s.found.slice(),message:''};
 const index=Number(action?.group),to=Number(action?.to),valid=i=>Number.isInteger(i)&&i>=0&&i<next.counts.length;
 const type=String(action?.type||''),token=Number.isSafeInteger(action?.token)?action.token:null;
 const position=(group)=>token===null?next.itemIds[group].length-1:next.itemIds[group].indexOf(token);
 const extract=(group)=>{const i=position(group);return i<0?null:next.itemIds[group].splice(i,1)[0];};
 if(type==='scenario'){
  const scene=SCENARIOS.find(x=>x.id===action.id);if(!scene)return s;
  const counts=scene.counts.slice();next={...next,scenario:scene.id,counts,itemIds:makeTokens(counts),nextId:counts.reduce((a,b)=>a+b,0),pool:[],collected:0,mission:null,found:[],success:false,moved:false,moveFrom:null,moveToken:null,moveMode:false,view:'groups',message:'Trykk på en ting i kurven.'};
 }else if(type==='view'){
  if(!VIEWS.includes(action.view)||action.view===s.view)return s;
  next.view=action.view;next.message='Se de samme tallene på en ny måte.';
 }else if(type==='world'){
  if(!worldExists(action.world)||action.world===s.world)return s;
  next.world=action.world;next.message='Velkommen til '+WORLDS.find(w=>w.id===action.world).name+'!';
 }else if(type==='take'){
  if(!valid(index)||next.counts[index]===0)return s;
  const picked=extract(index);if(picked===null)return s;
  next.pool.push(picked);next.counts[index]--;next.collected++;
  next.message='Én plukket. Se hva som skjer med tallene!';
 }else if(type==='return'){
  if(!valid(index)||next.collected<1||next.counts[index]>=MAX_EACH)return s;
  const picked=next.pool.pop();
  next.itemIds[index].push(Number.isSafeInteger(picked)?picked:next.nextId++);
  next.counts[index]++;next.collected--;next.message='Én lagt tilbake.';
 }else if(type==='takeEach'){
  const active=next.counts.map((n,i)=>n>0?i:-1).filter(i=>i>=0);
  if(!active.length)return s;
  active.forEach(i=>{next.pool.push(next.itemIds[i].pop());next.counts[i]--;});
  next.collected+=active.length;next.message='Én plukket fra hver kurv.';
 }else if(type==='empty'){
  if(!valid(index)||next.counts[index]===0)return s;
  next.pool.push(...next.itemIds[index]);next.itemIds[index]=[];
  next.collected+=next.counts[index];next.counts[index]=0;
  next.message='Du tømte en kurv. Hva skjedde med gangestykket?';
 }else if(type==='move'){
  if(!valid(index)||!valid(to)||index===to||next.counts[index]===0||next.counts[to]>=MAX_EACH)return s;
  const selected=token===null?next.moveToken:token;
  const pos=selected===null?next.itemIds[index].length-1:next.itemIds[index].indexOf(selected);
  if(pos<0)return s;
  const [moved]=next.itemIds[index].splice(pos,1);
  next.itemIds[to].push(moved);
  next.counts[index]--;next.counts[to]++;next.moved=true;
  next.message='Du flyttet én. Totalsummen er den samme!';
  next.moveFrom=null;next.moveToken=null;next.moveMode=false;
 }else if(type==='newGroup'){
  if(next.counts.length>=MAX_GROUPS)return s;
  next.counts.push(0);next.itemIds.push([]);next.message='Ny tom kurv! Legg noe oppi.';
 }else if(type==='removeGroup'){
  if(!valid(index)||next.counts.length<=1)return s;
  next.pool.push(...next.itemIds[index]);next.itemIds.splice(index,1);
  next.collected+=next.counts[index];next.counts.splice(index,1);
  next.moveFrom=null;next.moveToken=null;
  next.message='Kurven er borte. Innholdet ligger i samlekurven.';
 }else if(type==='moveMode'){
  next.moveMode=!s.moveMode;next.moveFrom=null;next.moveToken=null;
  next.message=next.moveMode?'Velg en gjenstand. Trykk deretter på kurven du vil flytte den til.':'Du kan plukke igjen.';
 }else if(type==='selectMove'){
  if(!valid(index)||!s.moveMode||next.counts[index]<1)return s;
  const target=token===null?next.itemIds[index].at(-1):token;
  if(!next.itemIds[index].includes(target))return s;
  next.moveFrom=index;next.moveToken=target;next.message='Velg en annen kurv for å flytte denne gjenstanden.';
 }else if(type==='mission'){
  const m=MISSIONS.find(x=>x.id===action.id);if(!m)return s;
  next={...next,mission:m.id,counts:m.initial.slice(),itemIds:makeTokens(m.initial),pool:[],
   nextId:m.initial.reduce((sum,n)=>sum+n,0),collected:m.collected||0,
   found:[],success:false,moved:false,moveFrom:null,moveToken:null,moveMode:false,message:m.prompt};
 }else if(type==='check'){
  const result=evaluate(s);next.message=result.message;
  if(result.correct){
   if(s.mission==='twoWays'){
    next.found=[...s.found,result.key];next.success=next.found.length>=2;
   }else next.success=true;
  }
 }else if(type==='reset')return initial();
 else return s;
 if(['take','return','takeEach','empty','move','newGroup','removeGroup'].includes(type))next.success=false;
 return normalize(next);
}
const API={initial,normalize,total,equal,equation,evaluate,apply,WORLDS,MISSIONS,VIEWS,SCENARIOS,MAX_GROUPS,MAX_EACH};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(scope)scope.LARIA_MULT_PICK_ENGINE=API;
})(typeof window!=='undefined'?window:null);
