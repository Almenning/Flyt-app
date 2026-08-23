(()=>{
'use strict';
const $=s=>document.querySelector(s);
const bridge=()=>window.FlytBridge;
let mode='day';
function monday(){const d=new Date(),x=new Date(d),day=(x.getDay()+6)%7;x.setHours(0,0,0,0);x.setDate(x.getDate()-day);return x}
function today(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function dayIndex(){return ((new Date().getDay()+6)%7)+1}
function dayName(){return new Intl.DateTimeFormat('nb-NO',{weekday:'long'}).format(new Date()).replace(/^./,c=>c.toUpperCase())}
function greeting(){const h=new Date().getHours();if(h<10)return 'God morgen';if(h<17)return 'God dag';return 'God kveld'}
function weekComps(s){const m=monday();return (s.completions||[]).filter(c=>new Date(c.date)>=m)}
function todayComps(s){const d=today();return (s.completions||[]).filter(c=>c.date===d)}
function dueToday(t){if(t.type!=='daily'||t.kind!=='house')return false;const f=Math.max(0,Number(t.freq||0));return dayIndex()<=Math.min(7,f)}
function totalWeekly(s){return (s.tasks||[]).filter(t=>t.kind==='house').reduce((a,t)=>a+Number(t.freq||0)*Number(t.pts||0),0)}
function doneWeekly(s){return weekComps(s).filter(c=>c.kind==='house').reduce((a,c)=>a+Number(c.housePts||0),0)}
function dailyGoal(s){return (s.tasks||[]).filter(dueToday).reduce((a,t)=>a+Number(t.pts||0),0)}
function doneToday(s){const due=new Set((s.tasks||[]).filter(dueToday).map(t=>t.id));return todayComps(s).filter(c=>c.kind==='house'&&due.has(c.taskId)).reduce((a,c)=>a+Number(c.housePts||0),0)}
function dayPct(s){const g=dailyGoal(s);return g?Math.min(100,Math.round(doneToday(s)/g*100)):100}
function weekPct(s){const g=totalWeekly(s);return g?Math.round(doneWeekly(s)/g*700):0}
function tabs(){return `<div class="segments" style="margin:14px 0 18px"><button type="button" data-homeui-mode="day" class="${mode==='day'?'on':''}">Dag · ${dayName()}</button><button type="button" data-homeui-mode="week" class="${mode==='week'?'on':''}">Uke</button></div>`}
function render(){const s=bridge()?.getState?.(),c=$('#content');if(!s||!c)return;const name=s.user||'Meg',dp=dayPct(s),wp=weekPct(s),goal=dailyGoal(s),done=doneToday(s),weekly=totalWeekly(s),wdone=doneWeekly(s),day=((new Date().getDay()+6)%7)+1,expected=day*100,delta=wp-expected;c.dataset.flytOwner='home';if(mode==='day'){c.innerHTML=`<div class="ey">Husholdningsmotor</div><h1 class="title">${greeting()}, ${name}</h1><p class="sub">I dag skal kjennes som en dag, ikke som en syvendedel av en uke.</p>${tabs()}<div class="card hero"><div class="row"><div class="grow"><strong>${dayName()}</strong><p>${dp>=100?'Dagens faste gjøremål er i mål.':'Dere er '+dp+'% gjennom dagens faste gjøremål.'}</p></div><span class="tag">${dp}%</span></div><div class="progress"><i style="width:${Math.min(100,dp)}%"></i></div></div><div class="stat"><div><b>${dp}%</b><span>I dag</span></div><div><b>${done}</b><span>dagspoeng</span></div><div><b>${goal}</b><span>dagens mål</span></div></div><div class="card"><strong>${dp>=100?'Dagen er tatt.':'Mer initiativ. Mindre masing.'}</strong><p class="sub">${dp>=100?'Alt som var dagsbundet er gjort. Fleksible ukeoppgaver kan fortsatt tas hvis dere har driv.':'Ta noe før det blir spurt om. Det gir både personlig poeng og flyt i huset.'}</p></div>`}else{c.innerHTML=`<div class="ey">Husholdningsmotor</div><h1 class="title">${greeting()}, ${name}</h1><p class="sub">Her ser dere hele ukerytmen, uten at den får lov til å definere om mandagen føltes bra.</p>${tabs()}<div class="card hero"><div class="row"><div class="grow"><strong>Ukebanken</strong><p>${delta>=0?`Dere ligger ${delta}% foran ukerytmen.`:`Dere ligger ${Math.abs(delta)}% bak ukerytmen.`}</p></div><span class="tag">${wp}/700%</span></div><div class="progress"><i style="width:${Math.min(100,wp/7)}%"></i></div></div><div class="stat"><div><b>${wp}%</b><span>Uken</span></div><div><b>${wdone}</b><span>gjort</span></div><div><b>${weekly}</b><span>ukepoeng</span></div></div><div class="card"><strong>Ukemålet er retning, ikke dom.</strong><p class="sub">Fleksible oppgaver kan tas når det passer. Dagsvisningen forteller om dagens faktiske belastning.</p></div>`}document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.view==='home'));c.scrollTop=0}
document.addEventListener('click',e=>{const nav=e.target.closest('#nav button[data-view="home"]');if(nav){e.preventDefault();e.stopImmediatePropagation();const s=bridge()?.getState?.();if(s&&s.view!=='home')bridge().setState({...s,view:'home'});render();return}const tab=e.target.closest('[data-homeui-mode]');if(tab){e.preventDefault();e.stopImmediatePropagation();mode=tab.dataset.homeuiMode==='week'?'week':'day';render()}},true);
window.FlytHomeUI={render};
})();
