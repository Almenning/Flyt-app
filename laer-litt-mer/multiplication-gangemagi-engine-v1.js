/* Læria · Gangemagi in Tallenga. Independent, original multiplication state engine.
 * Pure logic for browser and Node. No personal data or network calls. */
(function(root,factory){
  const engine=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=engine;
  if(root)root.LARIA_GANGEMAGI_ENGINE=engine;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const MAX_GROUPS=5,MAX_EACH=10;
  const MISSIONS=Object.freeze([
    {id:'meadow-3-3',groups:3,each:3,heading:'Jordbærmarkedet',text:'Kan du fylle 3 kurver med 3 jordbær i hver?',celebrate:'Tre kurver, tre i hver! Markedet er åpent.'},
    {id:'meadow-2-5',groups:2,each:5,heading:'To fulle kurver',text:'Pakk 2 kurver med 5 jordbær i hver.',celebrate:'To flotte kurver! Reven er klar for marked.'},
    {id:'meadow-4-2',groups:4,each:2,heading:'Til skogsvennene',text:'Fire venner ønsker 2 jordbær hver. Fyll 4 kurver!',celebrate:'Alle fire vennene får like mye.'},
    {id:'meadow-3-4',groups:3,each:4,heading:'En stor markedsdag',text:'Lag 3 kurver med 4 jordbær i hver.',celebrate:'Du fant tolv jordbær, fordelt helt likt!'},
    {id:'meadow-5-2',groups:5,each:2,heading:'Fem små leveranser',text:'Fyll 5 kurver med 2 jordbær i hver.',celebrate:'Fem kurver er klare for levering!'},
    {id:'meadow-3-6',groups:3,each:6,heading:'Bærtoget',text:'Pakk 3 kurver med 6 jordbær til bærtoget.',celebrate:'Bærtoget er lastet og klar for avgang!'},
    {id:'meadow-4-4',groups:4,each:4,heading:'Blomsterfesten',text:'Lag 4 like kurver med 4 jordbær i hver.',celebrate:'Nå kan blomsterfesten begynne!'},
    {id:'meadow-2-10',groups:2,each:10,heading:'Den store høstingen',text:'Kan du pakke 2 kurver med 10 jordbær i hver?',celebrate:'En hel høstkurvfest!'}
  ]);
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(v))?Math.trunc(Number(v)):min));
  const validIds=new Set(MISSIONS.map(m=>m.id));
  function initial(){
    return {version:1,mode:'mission',mission:0,groups:3,each:3,counts:[0,0,0],wins:[]};
  }
  function normalize(input){
    const s=input&&typeof input==='object'?input:{};
    const mission=clamp(s.mission,0,MISSIONS.length-1);
    const mode=s.mode==='free'?'free':'mission';
    const spec=MISSIONS[mission];
    const groups=mode==='mission'?spec.groups:clamp(s.groups,1,MAX_GROUPS);
    const each=mode==='mission'?spec.each:clamp(s.each,1,MAX_EACH);
    const raw=Array.isArray(s.counts)?s.counts:[];
    const counts=Array.from({length:groups},(_,i)=>clamp(raw[i]??0,0,each));
    const wins=[...new Set(Array.isArray(s.wins)?s.wins.filter(x=>validIds.has(x)):[])];
    return {version:1,mode,mission,groups,each,counts,wins};
  }
  function total(s){return normalize(s).counts.reduce((sum,n)=>sum+n,0);}
  function target(s){const st=normalize(s);return st.groups*st.each;}
  function filled(s){const st=normalize(s);return st.counts.every(n=>n===st.each);}
  function equalGroups(s){
    const st=normalize(s);
    return st.counts.length>0 && st.counts[0]>0 && st.counts.every(n=>n===st.counts[0]);
  }
  function equation(s){
    const st=normalize(s),sum=st.counts.reduce((a,b)=>a+b,0);
    const addition=st.counts.join(' + ')+' = '+sum;
    const isEqual=st.counts[0]>0&&st.counts.every(n=>n===st.counts[0]);
    return {addition,multiplication:isEqual?st.groups+' × '+st.counts[0]+' = '+sum:null,
      target:st.groups+' × '+st.each+' = '+st.groups*st.each,total:sum,complete:st.counts.every(n=>n===st.each)};
  }
  function nextState(source,action){
    const st=normalize(source),a=action&&typeof action==='object'?action:{};
    const prevComplete=filled(st);
    if(a.type==='add'||a.type==='remove'){
      const i=Number(a.group);
      if(!Number.isInteger(i)||i<0||i>=st.groups)return st;
      const delta=a.type==='add'?1:-1;
      st.counts[i]=clamp(st.counts[i]+delta,0,st.each);
    }else if(a.type==='reset'){
      st.counts=Array(st.groups).fill(0);
    }else if(a.type==='mission'){
      if(!Number.isInteger(a.index)||a.index<0||a.index>=MISSIONS.length)return st;
      st.mode='mission';st.mission=a.index;
      const spec=MISSIONS[st.mission];st.groups=spec.groups;st.each=spec.each;
      st.counts=Array(st.groups).fill(0);
    }else if(a.type==='next'){
      // Chapter eight concludes the adventure; replay is the child's choice.
      if(st.mission===MISSIONS.length-1)return st;
      st.mode='mission';st.mission=st.mission+1;
      const spec=MISSIONS[st.mission];st.groups=spec.groups;st.each=spec.each;
      st.counts=Array(st.groups).fill(0);
    }else if(a.type==='mode'){
      if(a.mode!=='free'&&a.mode!=='mission')return st;
      st.mode=a.mode;
      if(st.mode==='mission'){
        const spec=MISSIONS[st.mission];st.groups=spec.groups;st.each=spec.each;
      }
      st.counts=Array(st.groups).fill(0);
    }else if(a.type==='groups'&&st.mode==='free'){
      st.groups=clamp(a.value,1,MAX_GROUPS);
      st.counts=Array.from({length:st.groups},(_,i)=>clamp(st.counts[i]??0,0,st.each));
    }else if(a.type==='each'&&st.mode==='free'){
      st.each=clamp(a.value,1,MAX_EACH);
      st.counts=st.counts.map(n=>clamp(n,0,st.each));
    }
    if(st.mode==='mission'&&!prevComplete&&filled(st)){
      const id=MISSIONS[st.mission].id;
      if(!st.wins.includes(id))st.wins.push(id);
    }
    return st;
  }
  return Object.freeze({MAX_GROUPS,MAX_EACH,MISSIONS,initial,normalize,total,target,
    filled,equalGroups,equation,apply:nextState});
});