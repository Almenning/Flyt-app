/* Læria gangetabell, premium child-first experience. No globe or journey overrides. */
(()=>{
'use strict';
const N=12,K='laria_mult_premium_v1';
const ui={page:'home',table:5,round:[],at:0,selected:null,hint:false,feedback:'',a:4,b:3,explore:'groups',focus:0,gridA:4,gridB:6,seed:0};
const store=()=>{
 try {const raw=JSON.parse(localStorage.getItem(K)||'{}');return {tries:raw.tries||{},sessions:raw.sessions||0,days:raw.days||{},stars:raw.stars||0};}catch(_){return {tries:{},sessions:0,days:{},stars:0};}
};
const save=s=>{try{localStorage.setItem(K,JSON.stringify(s));}catch(_){}};
const stats=store();
const icon='<img class="mp-fox" src="./lia-fox-explorer.webp" alt="Læria-reven">';
const tabs=[['home','Oversikt'],['practice','Øv'],['choose','Tabeller'],['explore','Utforsk'],['mastery','Mestring']];
const clamp=x=>Math.max(1,Math.min(12,Number(x)||1));
const row=(k,label,detail,emoji)=>'<button type="button" class="mp-menu-card mp-'+k+'" data-mp-go="'+k+'"'+(k==='explore'?' data-mult-mode="free"':'')><span class="mp-menu-icon" aria-hidden="true">'+emoji+'</span><span class="mp-menu-copy"><strong>'+label+'</strong><small>'+detail+'</small></span><span class="mp-chevron" aria-hidden="true">›</span></button>';
const title=(heading,sub='')=>'<header class="mp-heading"><h1>'+heading+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</header>';
const fox=(message)=>'<div class="mp-guide">'+icon+'<span>'+message+'</span></div>';
const getTotal=n=>{const arr=Object.entries(stats.tries).filter(([k])=>k.split('x').some(v=>Number(v)===n));return arr.reduce((a,[,v])=>a+v.right,0)};
function rec(){return [2,3,4,5,6,7,8,9,10,11,12,1].sort((a,b)=>getTotal(a)-getTotal(b))[0]}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function questions(n=null){
 const factors=n?[...Array(12)].map((_,i)=>[n,i+1]):[2,3,4,5,6,7,8,9,10,11,12].flatMap(x=>[2,3,4,5,6,7,8,9,10].map(y=>[x,y]));
 const ranked=shuffle(factors).sort((x,y)=>{const sx=stats.tries[x.join('x')]||{right:0,wrong:0},sy=stats.tries[y.join('x')]||{right:0,wrong:0};return (sx.right-sx.wrong*2)-(sy.right-sy.wrong*2)});
 return ranked.slice(0,8).map(([a,b])=>({a,b}));
}
function start(n=null){ui.table=n||rec();ui.round=questions(n);ui.at=0;ui.selected=null;ui.hint=false;ui.feedback='';ui.firstRight=0;ui.hadWrong=false;ui.opts=null;ui.optsFor=null;ui.page='practice';render()}
function choices(a,b){
 const correct=a*b;const unique=new Set([correct]);const offsets=[a,b,1,2,3,Math.max(1,a-b)];
 for(const d of offsets){if(unique.size>=4)break;if(correct+d<=144)unique.add(correct+d);if(unique.size<4&&correct-d>0)unique.add(correct-d)}
 for(let i=1;unique.size<4;i++)unique.add(correct+i);
 return shuffle([...unique].slice(0,4));
}
function dots(a,b){
 let s='<div class="mp-baskets" aria-label="'+a+' grupper med '+b+' i hver">';
 for(let j=0;j<a;j++){s+='<div class="mp-basket" aria-label="Gruppe '+(j+1)+'">';
 for(let i=0;i<b;i++)s+='<i aria-hidden="true"></i>';s+='</div>';}
 return s+'</div>';
}
function progress(i,total){return '<div class="mp-progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+i+'"><div style="width:'+(100*i/total)+'%"></div></div>'}
function home(){return title('Gangetabellen','Små tall. Store eventyr!')+'<div class="mp-trail">✦ Din læringsreise '+progress(Math.min(stats.sessions,8),8)+'</div><div class="mp-menu">'+row('practice','Øv på gangetabellen','Spill en kort runde med 8 spørsmål','🦊')+row('choose','Velg en gangetabell','Øv på akkurat den du liker','🔢')+row('explore','Utforsk og lek','Bygg, flytt og oppdag','🌳')+'</div>'+fox('Hver gang du øver, blir du litt tryggere!')}
function chooser(){return title('Velg en gangetabell','Du bestemmer hva du vil øve på.')+'<div class="mp-choice-grid">'+Array.from({length:12},(_,i)=>{const n=i+1,score=getTotal(n);return '<button type="button" class="mp-choice '+(n===rec()?'recommended':'')+'" data-mp-start="'+n+'"><b>'+n+'</b><span>'+n+'-gangen</span><small>'+(score>=12?'★ Mestret':score?'✦ '+score+' riktige':'Prøv meg')+'</small></button>'}).join('')+'</div><div class="mp-note">✨ Anbefalt å øve på: '+rec()+'-gangen</div>'+fox('Alle gangetabellene er åpne. Velg fritt!')}
function practice(){
 if(ui.at>=ui.round.length)return finished();
 const q=ui.round[ui.at],product=q.a*q.b;
 const opts=choices(q.a,q.b);
 if(!ui.opts||ui.optsFor!==ui.at){ui.opts=opts;ui.optsFor=ui.at}
 return title('Øv på gangetabellen','Oppgave '+(ui.at+1)+' av '+ui.round.length)+progress(ui.at,ui.round.length)
 +'<article class="mp-question"><h2>Hva blir '+q.a+' × '+q.b+'?</h2><p>'+q.a+' grupper med '+q.b+' i hver</p>'+(ui.hint?dots(q.a,q.b):'<div class="mp-question-art" aria-hidden="true">✦ &nbsp; ✿ &nbsp; ✦</div>')+'</article>'
 +'<div class="mp-answers">'+ui.opts.map(v=>'<button type="button" class="mp-answer '+(ui.selected===v?(v===product?'correct':'wrong'):'')+'" '+(ui.selected===product?'disabled':'')+' data-mp-answer="'+v+'">'+v+'</button>').join('')+'</div>'
 +'<button class="mp-hint" data-mp-hint="1" type="button">💡 '+(ui.hint?'Skjul hjelp':'Vis meg hvordan')+'</button>'
 +'<div class="mp-feedback" aria-live="polite">'+ui.feedback+'</div>'
 +(ui.selected===product?'<button type="button" class="mp-primary" data-mp-next="1">'+(ui.at===7?'Se hvordan det gikk':'Neste oppgave →')+'</button>':'')
 +fox(ui.selected===product?'Du klarte det!':ui.feedback?'Se på gruppene og prøv igjen.':'Du kan bruke hjelp når du vil!')}
function finished(){
 const summary=ui.lastScore||0;
 return title('Bra jobbet!','Du fullførte åtte oppgaver.')+'<div class="mp-finish">🏆<strong>'+summary+' av 8</strong><span>riktige på første forsøk</span></div>'+row('practice','Øv en gang til','Repetisjon gjør deg tryggere','⭐')+row('choose','Velg en annen tabell','Alle er tilgjengelige','🔢')+fox('Det er alltid lov å øve på det samme igjen!')}
function explore(){
 const names=[['groups','Grupper'],['array','Rutenett'],['line','Tallinje'],['swap','Bytt plass'],['pattern','Mønstre'],['table','Tabellen']];
 let stage='';
 if(ui.explore==='table'){
 stage='<div class="mp-table-scroll"><table class="mp-table"><thead><tr><th>×</th>'+Array.from({length:N},(_,i)=>'<th>'+ (i+1)+'</th>').join('')+'</tr></thead><tbody>'+Array.from({length:N},(_,i)=>'<tr><th>'+(i+1)+'</th>'+Array.from({length:N},(_,j)=>'<td><button type="button" class="'+(ui.gridA===i+1&&ui.gridB===j+1?'chosen':'')+'" data-mp-cell="'+(i+1)+','+(j+1)+'">'+(i+1)*(j+1)+'</button></td>').join('')+'</tr>').join('')+'</tbody></table></div><div class="mp-note">'+ui.gridA+' × '+ui.gridB+' = '+(ui.gridA*ui.gridB)+' · '+ui.gridB+' × '+ui.gridA+' = '+(ui.gridA*ui.gridB)+'</div>';
 }else if(ui.explore==='line'){
 stage='<div class="mp-line">'+Array.from({length:ui.a+1},(_,i)=>'<span>'+(i*ui.b)+'</span>').join('<i>→</i>')+'</div>';
 }else if(ui.explore==='swap'){
 stage=dots(Math.min(ui.a,8),Math.min(ui.b,8))+'<p class="mp-formula">'+ui.a+' × '+ui.b+' = '+ui.b+' × '+ui.a+' = '+(ui.a*ui.b)+'</p>';
 }else if(ui.explore==='pattern'){
 stage='<p class="mp-formula">'+Array.from({length:12},(_,i)=>ui.a*(i+1)).join(' · ')+'</p>';
 }else if(ui.explore==='array'){
 stage='<div class="mp-array" style="--mp-cols:'+ui.b+'">'+Array.from({length:ui.a*ui.b},()=>'<i></i>').join('')+'</div>';
 }else stage=dots(ui.a,ui.b);
 return title('Utforsk og lek','Prøv deg fram. Her finnes ingen feil.')+'<div class="mp-mode-row">'+names.map(([k,v])=>'<button type="button" class="'+(ui.explore===k?'selected':'')+'" data-mp-explore="'+k+'">'+v+'</button>').join('')+'</div><div class="mp-playground">'+stage+'</div>'+(ui.explore!=='table'?'<div class="mp-controls"><label>Antall grupper<div><button data-mp-factor="a,-1">−</button><strong>'+ui.a+'</strong><button data-mp-factor="a,1">+</button></div></label><label>I hver gruppe<div><button data-mp-factor="b,-1">−</button><strong>'+ui.b+'</strong><button data-mp-factor="b,1">+</button></div></label></div><div class="mp-formula">'+ui.a+' × '+ui.b+' = '+(ui.a*ui.b)+'</div>':'')+fox('Når vi samler like grupper, blir gange lettere å forstå.')}
function mastery(){
 return title('Min mestring','Alt du øver på, teller.')+'<div class="mp-mastery-hero">🏅 <strong>'+stats.sessions+' økter</strong><span>Stjerner: '+stats.stars+'</span></div><h2 class="mp-subheading">Dine gangetabeller</h2><div class="mp-choice-grid">'+Array.from({length:12},(_,i)=>{const n=i+1,c=getTotal(n);return '<button class="mp-choice" data-mp-start="'+n+'"><b>'+n+'</b><span>'+n+'-gangen</span><small>'+(c>=12?'★ Godt øvd':c?c+' riktige':'Ikke startet')+'</small></button>'}).join('')+'</div>'+fox('Mestring åpner muligheter. Den stenger aldri noe!')}
function render(){
 const root=document.getElementById('multiplication-lab-root');if(!root)return;
 root.innerHTML='<section class="mp-shell"><div class="mp-top"><button type="button" id="multiplication-lab-back" class="mp-back" data-mp-back="1" aria-label="Tilbake">←</button><strong>Læria <span>✦</span></strong><span class="mp-stats">⭐ '+stats.stars+'</span></div>'+(ui.page==='home'?home():ui.page==='choose'?chooser():ui.page==='practice'?practice():ui.page==='explore'?explore():ui.page==='mastery'?mastery():finished())+'<nav class="mp-nav" aria-label="Gangetabell"><button data-mp-go="home" '+(ui.page==='home'?'aria-current="page"':'')+'>Hjem</button><button data-mp-go="choose" '+(ui.page==='choose'?'aria-current="page"':'')+'>Tabeller</button><button data-mp-go="explore" '+(ui.page==='explore'?'aria-current="page"':'')+'>Utforsk</button><button data-mp-go="mastery" '+(ui.page==='mastery'?'aria-current="page"':'')+'>Mestring</button></nav></section>';
 root.querySelectorAll('[data-mp-go]').forEach(b=>b.onclick=()=>{ui.page=b.dataset.mpGo;if(ui.page==='practice')start();else render()});
 root.querySelectorAll('[data-mp-start]').forEach(b=>b.onclick=()=>start(Number(b.dataset.mpStart)));
 root.querySelectorAll('[data-mp-explore]').forEach(b=>b.onclick=()=>{ui.explore=b.dataset.mpExplore;render()});
 root.querySelectorAll('[data-mp-factor]').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.mpFactor.split(',');ui[k]=clamp(ui[k]+Number(d));render()});
 root.querySelectorAll('[data-mp-cell]').forEach(b=>b.onclick=()=>{[ui.gridA,ui.gridB]=b.dataset.mpCell.split(',').map(Number);render()});
 root.querySelectorAll('[data-mp-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.mpAnswer)));
 root.querySelector('[data-mp-hint]')?.addEventListener('click',()=>{ui.hint=!ui.hint;render()});
 root.querySelector('[data-mp-next]')?.addEventListener('click',next);
 root.querySelector('[data-mp-back]')?.addEventListener('click',()=>{if(ui.page!=='home'){ui.page='home';render()}else if(typeof window.LARIA_RETURN_TO_BASECAMP==='function'&&window.LARIA_RETURN_TO_BASECAMP()){}else openSubject('math')});
}
function answer(n){
 const q=ui.round[ui.at],correct=q.a*q.b;if(ui.selected===correct)return;
 const key=q.a+'x'+q.b,item=stats.tries[key]||{right:0,wrong:0};
 if(n===correct){item.right++;ui.feedback='Riktig! '+q.a+' × '+q.b+' = '+correct+'.';ui.firstRight=(ui.firstRight||0)+Number(!ui.hadWrong);stats.stars++;save(stats);try{if(typeof playSuccessTone==='function')playSuccessTone()}catch(_){}}else{item.wrong++;ui.hadWrong=true;ui.feedback='Prøv igjen. Du kan se '+q.a+' grupper med '+q.b+' i hver.'}
 stats.tries[key]=item;ui.selected=n;save(stats);render();
}
function next(){
 if(ui.selected!==ui.round[ui.at].a*ui.round[ui.at].b)return;
 ui.at++;ui.selected=null;ui.hint=false;ui.feedback='';ui.hadWrong=false;ui.opts=null;ui.optsFor=null;
 if(ui.at===ui.round.length){stats.sessions++;stats.days[new Date().toISOString().slice(0,10)]=true;save(stats);ui.lastScore=ui.firstRight||0;ui.firstRight=0;ui.page='complete'}
 render();
}
window.openMultiplicationLab=function(){
 document.getElementById('multiplication-lab-screen')?.setAttribute('data-explore-release','explore-rc1');
 const grade=typeof currentGrade==='function'?currentGrade():2;ui.page='home';ui.table=grade<=2?2:rec();ui.at=0;ui.firstRight=0;ui.hadWrong=false;ui.opts=null;ui.optsFor=null;render();showScreen('multiplication-lab');
};
window.LARIA_MULT_PREMIUM={open:window.openMultiplicationLab,stats:()=>JSON.parse(JSON.stringify(stats))};
const entry=document.getElementById('open-multiplication-lab');if(entry)entry.onclick=window.openMultiplicationLab;
})();