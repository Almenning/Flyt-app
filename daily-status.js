((root)=>{
'use strict';

const VERSION='20260902-1200';
const LEVEL_LABEL={low:'Lite å gå på',med:'Som vanlig',high:'Godt med overskudd'};
const SHORT_LEVEL_LABEL={low:'Lite',med:'Som vanlig',high:'Godt'};
const NEEDS=[
  ['relief','Avlastning'],
  ['initiative','Initiativ'],
  ['quiet','Ro'],
  ['alone','Alenetid'],
  ['closeness','Nærhet'],
  ['sex','Intimitet']
];

function stamp(value){
  const result=typeof value==='number'?value:new Date(value||0).getTime();
  return Number.isFinite(result)?result:0;
}
function dateKey(value=new Date()){
  const date=value instanceof Date?new Date(value):new Date(value);
  if(Number.isNaN(date.getTime()))return'';
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}
function updatedAt(status,kind='daily'){
  if(!status)return null;
  if(kind==='relationship')return status.relationship_updated_at||status.updated_at||null;
  return status.daily_updated_at||status.updated_at||null;
}
function isFresh(status,{kind='daily',now=Date.now()}={}){
  const at=stamp(updatedAt(status,kind));
  return !!at&&at<=now+5*60*1000&&dateKey(new Date(at))===dateKey(new Date(now));
}
function current(status,options){return isFresh(status,options)?status:null}
function capacityLabel(value,{short=false}={}){return (short?SHORT_LEVEL_LABEL:LEVEL_LABEL)[value]||''}
function needLabel(value){return NEEDS.find(([key])=>key===value)?.[1]||String(value||'')}
function validCapacity(value){return ['low','med','high'].includes(value)}
function cleanNeeds(values){
  const allowed=new Set(NEEDS.map(([key])=>key));
  return [...new Set((Array.isArray(values)?values:[]).map(String).filter(value=>allowed.has(value)))];
}
function fallbackLegacyFields(status,capacity){
  const value=validCapacity(capacity)?capacity:'med';
  return {
    energy:status?.energy||value,
    capacity:value,
    closeness:status?.closeness||'med',
    desire:status?.desire||'med',
    stress:status?.stress||(value==='low'?'high':value==='high'?'low':'med')
  };
}

const api={VERSION,LEVEL_LABEL,SHORT_LEVEL_LABEL,NEEDS,stamp,dateKey,updatedAt,isFresh,current,capacityLabel,needLabel,validCapacity,cleanNeeds,fallbackLegacyFields};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.FlytDailyStatus=api;
})(typeof globalThis!=='undefined'?globalThis:this);
