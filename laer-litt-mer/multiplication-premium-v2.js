/* Læria gangetabellen · illustrated premium experience v2 · 2026-10-08 */
(()=>{
'use strict';
const ROOT='multiplication-lab-root',KEY='laria_mult_premium_v1',MAX=10;
const foxSrc='./lia-fox-explorer-home.webp';
let illustrationTheme='auto';
const ILLUSTRATION_THEMES=['strawberry','bun','mushroom','apple'];
function currentIllustrationTheme(){return illustrationTheme==='auto'?ILLUSTRATION_THEMES[stateBox.idx % ILLUSTRATION_THEMES.length]:illustrationTheme}
const stateBox={page:'home',tab:5,active:'table',a:4,b:3,row:4,col:6,showMore:false,showHints:false,mask:false,options:[],optionsFor:-1,round:[],idx:0,answer:null,wrongOnce:false,feedback:'',firstTry:0,totalCorrect:0,earned:0,roundType:'mixed',showSummary:false};
function fromStorage(){try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');return {tries:s.tries&&typeof s.tries==='object'?s.tries:{},sessions:Number(s.sessions)||0,days:s.days&&typeof s.days==='object'?s.days:{},stars:Number(s.stars)||0,draft:s.draft||null}}catch(_){return {tries:{},sessions:0,days:{},stars:0,draft:null}}}
const saved=fromStorage();
const d=(n)=>Math.max(1,Math.min(MAX,Number(n)||1));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(_){}
 try{if(typeof state!=='undefined'&&typeof saveState==='function'){state.multiplicationLab=state.multiplicationLab||{completed:{}};state.multiplicationLab.premium={sessions:saved.sessions,stars:saved.stars};saveState();}}catch(_){}
}
function grade(){try{return typeof currentGrade==='function'?Number(currentGrade())||2:2}catch(_){return 2}}
function shuffled(a){const result=a.slice();for(let i=result.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result}
function localDate(t=Date.now()){const date=new Date(t);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
function streak(){let count=0,time=new Date();if(!saved.days[localDate(time)])time.setDate(time.getDate()-1);for(let i=0;i<365;i++){const k=localDate(time);if(!saved.days[k])break;count++;time.setDate(time.getDate()-1)}return count}
function tryRecord(a,b){const item=saved.tries[a+'x'+b]||{right:0,wrong:0};return {right:Number(item.right)||0,wrong:Number(item.wrong)||0,last:Number(item.last)||0}}
function tableProgress(n){let known=0,practiced=0,total=0;for(let i=1;i<=MAX;i++){const r=tryRecord(n,i),swapped=tryRecord(i,n);const good=Math.max(r.right,swapped.right);if(good>0)practiced++;if(good>=2&&((r.right+swapped.right)/(r.right+r.wrong+swapped.right+swapped.wrong||1))>=.67)known++;total+=r.right+swapped.right}return {known,practiced,total,mastered:known>=10}}
function suggested(){const preferred=grade()<=2?[2,5,10,3,4,6,7,8,9,1]:grade()<=4?[2,3,4,5,6,7,8,9,10,1]:[3,4,6,7,8,9,2,5,10,1];const incomplete=preferred.find(n=>!tableProgress(n).mastered);return incomplete||preferred[0]}
function evidence(a,b){const r=tryRecord(a,b);return r.right-r.wrong*1.5+(r.last?0.1:0)}
function createQuestions(n){
 const firstFactors=grade()<=2?[2,5,10]:grade()<=4?[2,3,4,5,6,7,8,9,10]:[2,3,4,5,6,7,8,9,10];const seconds=MAX;
 const candidates=(n===null?firstFactors.flatMap(a=>Array.from({length:seconds},(_,j)=>({a,b:j+1}))):Array.from({length:MAX},(_,j)=>({a:n,b:j+1})));
 const randomized=shuffled(candidates);
 randomized.sort((x,y)=>evidence(x.a,x.b)-evidence(y.a,y.b));
 return randomized.slice(0,8).map(q=>({a:q.a,b:q.b}));
}
function answerOptions(a,b){const exact=a*b,items=new Set([exact]);for(const delta of shuffled([a,b,1,2,3,5,Math.abs(a-b)||4])){if(items.size===4)break;if(exact+delta<=MAX*MAX)items.add(exact+delta);if(items.size<4&&exact-delta>=1)items.add(exact-delta)}for(let n=1;items.size<4;n++){const alt=exact-n>=1?exact-n:exact+n<=MAX*MAX?exact+n:Math.max(1,n);items.add(alt)};return shuffled(Array.from(items).slice(0,4))}
function currentQ(){return stateBox.round[stateBox.idx]||null}
function writeDraft(){saved.draft=stateBox.page==='practice'&&stateBox.round.length?{questions:stateBox.round,index:stateBox.idx,firstTry:stateBox.firstTry,correct:stateBox.totalCorrect,earned:stateBox.earned,mode:stateBox.roundType,table:stateBox.tab,answer:stateBox.answer,wrongOnce:stateBox.wrongOnce,hint:stateBox.showHints,feedback:stateBox.feedback,options:stateBox.options,optionsFor:stateBox.optionsFor}:null;persist()}
function begin(table=null,restore=false){
 if(restore){const draft=saved.draft;if(!draft||!Array.isArray(draft.questions)||draft.questions.length!==8||!draft.questions.every(q=>Number.isInteger(q.a)&&Number.isInteger(q.b)&&q.a>=1&&q.a<=MAX&&q.b>=1&&q.b<=MAX)){saved.draft=null;persist();return begin(null)}stateBox.round=draft.questions;stateBox.idx=Math.min(7,Math.max(0,Number(draft.index)||0));stateBox.firstTry=draft.firstTry||0;stateBox.totalCorrect=draft.correct||0;stateBox.earned=draft.earned||0;stateBox.roundType=draft.mode||'mixed';stateBox.tab=d(draft.table||5);stateBox.answer=draft.answer===null?null:Number(draft.answer);stateBox.wrongOnce=Boolean(draft.wrongOnce);stateBox.showHints=Boolean(draft.hint);stateBox.feedback=String(draft.feedback||'');stateBox.options=Array.isArray(draft.options)?draft.options:[];stateBox.optionsFor=Number.isInteger(draft.optionsFor)?draft.optionsFor:-1;}
 else{stateBox.roundType=table===null?'mixed':'table';stateBox.tab=table===null?suggested():d(table);stateBox.round=createQuestions(table===null?null:d(table));stateBox.idx=0;stateBox.firstTry=0;stateBox.totalCorrect=0;stateBox.earned=0;}
 if(!restore){stateBox.optionsFor=-1;stateBox.options=[];stateBox.answer=null;stateBox.wrongOnce=false;stateBox.showHints=false;stateBox.feedback='';}stateBox.showSummary=false;stateBox.page='practice';writeDraft();render();
}
function beginNext(){const q=currentQ();if(!q||stateBox.answer!==q.a*q.b)return;stateBox.idx++;stateBox.answer=null;stateBox.wrongOnce=false;stateBox.showHints=false;stateBox.feedback='';stateBox.optionsFor=-1;stateBox.options=[];if(stateBox.idx>=8){saved.sessions++;saved.days[localDate()]=true;stateBox.page='complete';saved.draft=null;persist();}else{writeDraft()}render();scrollTop()}
function chooseAnswer(v){
 const q=currentQ();if(!q||stateBox.answer===q.a*q.b)return;
 const actual=q.a*q.b,key=q.a+'x'+q.b;
 const rec=tryRecord(q.a,q.b);stateBox.answer=v;
 if(v===actual){rec.right++;rec.last=Date.now();stateBox.totalCorrect++;saved.stars++;stateBox.earned++;if(!stateBox.wrongOnce)stateBox.firstTry++;stateBox.feedback='Helt riktig! '+q.a+' × '+q.b+' = '+actual;try{if(typeof playSuccessTone==='function')playSuccessTone();}catch(_){}
 }else{rec.wrong++;rec.last=Date.now();stateBox.wrongOnce=true;stateBox.showHints=true;stateBox.feedback='Prøv igjen. Se på gruppene og tell sammen.';}
 saved.tries[key]=rec;writeDraft();render();
}
function speak(){const q=currentQ();if(!q)return;try{if(typeof speechSynthesis==='undefined')return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('Hva blir '+q.a+' ganger '+q.b+'?');u.lang='nb-NO';u.rate=.86;speechSynthesis.speak(u);}catch(_){}}
function scrollTop(){try{const r=document.getElementById(ROOT);r?.scrollIntoView({block:'start',behavior:'instant'});}catch(_){}}
function tag(content,classes=''){return '<span class="'+classes+'">'+content+'</span>'}
function btn(action,text,classes='',extra=''){return '<button type="button" class="'+classes+'" data-mp-action="'+action+'" '+extra+'>'+text+'</button>'}
function symbolArt(){
 return '<svg class="mp-island" viewBox="0 0 240 140" fill="none" aria-hidden="true"><defs><linearGradient id="mpIslandLand" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#B9D387"/><stop offset="1" stop-color="#548C68"/></linearGradient><linearGradient id="mpIslandWater" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#A0E3EA"/><stop offset="1" stop-color="#579DBD"/></linearGradient></defs><ellipse cx="118" cy="119" rx="106" ry="19" fill="#5c8796" opacity=".17"/><path d="M14 94Q60 115 109 93Q176 70 222 92L209 121Q147 146 29 116Z" fill="url(#mpIslandWater)"/><path d="M22 91Q51 50 106 55Q164 37 222 90Q175 123 96 113Q49 118 22 91Z" fill="url(#mpIslandLand)" stroke="#55865D" stroke-width="3"/><path d="M53 89Q110 66 171 86" stroke="#F5E2A5" stroke-width="9" stroke-linecap="round" stroke-dasharray="11 10"/><path d="M114 57V21" stroke="#8B5A35" stroke-width="4"/><path d="M118 20L150 31L118 39Z" fill="#E77853"/><path d="M48 83L61 38L74 83Z" fill="#4B9764"/><path d="M41 70L61 29L80 70Z" fill="#65A46D"/><path d="M178 96L191 43L205 96Z" fill="#4F8D60"/><path d="M170 78L191 30L214 78Z" fill="#6CA878"/><rect x="89" y="72" width="31" height="26" rx="4" fill="#AB7448" stroke="#70462D" stroke-width="3"/><rect x="94" y="64" width="27" height="18" rx="2" fill="#DCA56B" stroke="#8D5937" stroke-width="3"/><path d="M93 82H116" stroke="#79502F" stroke-width="4"/><circle cx="106" cy="78" r="5" fill="#F7C85D"/></svg>';
}
function mascot(message,small=false){return '<div class="mp-mascot '+(small?'mp-mascot-small':'')+'"><img src="'+foxSrc+'" alt="" loading="lazy"><div class="mp-bubble">'+message+'<span class="mp-heart" aria-hidden="true">♥</span></div></div>'}
function top(){return '<header class="mp-top"><div class="mp-top-left">'+btn('back','‹','mp-back','id="multiplication-lab-back" aria-label="Tilbake"')+'<span class="mp-brand">Læria<span class="mp-brand-star">✦</span></span></div><div class="mp-top-right"><span class="mp-avatar" aria-hidden="true">🦊</span><span class="mp-star-count" aria-label="'+saved.stars+' stjerner">★ <b>'+saved.stars+'</b></span></div></header>'}
function heading(t,s){return '<div class="mp-heading"><h1>'+t+'</h1><p>'+s+'</p></div>'}
function travel(progressCount=0,total=8){let circles='';for(let i=0;i<total;i++)circles+='<span class="mp-travel-node '+(i<progressCount?'done':'')+'">'+(i<progressCount?'★':'')+'</span>';return '<div class="mp-travel"><div class="mp-travel-scene" aria-hidden="true">🌲 ⛰️</div><div class="mp-travel-main"><span>'+(stateBox.page==='practice'?'Oppgave '+(stateBox.idx+1)+' av 8':'Din læringsreise')+'</span><div class="mp-travel-nodes">'+circles+'</div></div><div class="mp-travel-treasure" aria-hidden="true">🗝️</div></div>'}
function menuCard(page,titleText,subtitle,art){return btn('go','<span class="mp-menu-copy"><strong>'+titleText+'</strong><small>'+subtitle+'</small></span><span class="mp-menu-art mp-art-'+page+'">'+art+'</span><span class="mp-arrow" aria-hidden="true">›</span>','mp-menu-card mp-menu-'+page,'data-page="'+page+'"')}
function home(){
 const cont=saved.draft&&Array.isArray(saved.draft.questions)&&saved.draft.questions.length===8&&saved.draft.questions.every(q=>q.a>=1&&q.a<=MAX&&q.b>=1&&q.b<=MAX);
 return '<section class="mp-home-screen">'+travel(Math.min(saved.sessions,8))+heading('Gangetabellen','Små tall. Store eventyr!')+'<p class="mp-intro">Øv, utforsk og bli trygg på gangetabellen.</p>'
 +'<div class="mp-menu-stack">'
 +menuCard('practice','Øv på gangetabellen','Svar på åtte spørsmål og finn nye mønstre.','<img src="'+foxSrc+'" alt="" loading="lazy"><span class="mp-math-plaque">3 × 4<br>= ?</span>')
 +menuCard('choose','Velg en gangetabell','Øv akkurat på den tabellen du ønsker.','<span class="mp-number-art"><i>2</i><i>5</i><i>3</i><i>4</i><i>6</i><i>10</i></span>')
 +menuCard('explore','Utforsk og lek','Se gangetabellen 1–10 og oppdag sammenhenger.',symbolArt())
 +'</div>'+(cont?btn('resume','▶ Fortsett øvingen der du var','mp-resume'):'')+mascot('Du klarer dette! Hver gang du øver, blir du litt tryggere.')+'</section>';
}
function dots(n,filled){let s='<span class="mp-master-dots" aria-label="'+filled+' av '+n+' mål oppnådd">';for(let i=0;i<n;i++)s+='<i class="'+(i<filled?'filled':'')+'"></i>';return s+'</span>'}
function tableCard(n){const p=tableProgress(n);return btn('start','<span class="mp-tile-symbol '+(n%2?'wood':'stone')+'">'+n+'</span><strong>'+n+'-gangen</strong>'+dots(3,Math.round(p.known/4))+'<small>'+(p.mastered?'★ Mestret':p.known?Math.round(100*p.known/MAX)+' % trygg':'Velg meg')+'</small>','mp-table-choice '+(n===suggested()?'recommended':'')+' '+(p.mastered?'mastered':''),'data-table="'+n+'" aria-label="Øv på '+n+'-gangen"')}
function choose(){
 return '<section class="mp-choose-screen">'+travel(Math.min(saved.sessions,8))+heading('Velg en gangetabell','Velg den tabellen du vil øve på i dag.')+'<div class="mp-table-choice-grid">'+[2,3,4,5,6,7,8,9,10,1].map(tableCard).join('')+'</div>'
 +'<div class="mp-pick-recommended"><span aria-hidden="true">🏅</span><div><small>Anbefalt i dag</small><strong>'+suggested()+'-gangen</strong><p>Du kan velge fritt, også noe du allerede kan!</p></div>'+btn('start','›','mp-round-arrow','data-table="'+suggested()+'" aria-label="Øv på anbefalt tabell"')+'</div>'+mascot('Hvilken gangetabell vil du øve på i dag?')+'</section>';
}
function apples(a,b){
  if(window.LARIA_MULT_ILLUSTRATED_V3)return window.LARIA_MULT_ILLUSTRATED_V3.render(a,b,currentIllustrationTheme());
 let groups='<div class="mp-apples" role="img" aria-label="'+a+' grupper med '+b+' epler i hver">';
 for(let g=0;g<a;g++){groups+='<div class="mp-apple-basket" aria-label="Gruppe '+(g+1)+'"><span class="mp-basket-number">'+(g+1)+'</span><div class="mp-apple-fruits">';
 for(let v=0;v<b;v++)groups+='<i class="mp-apple" aria-hidden="true"></i>';
 groups+='</div></div>';}return groups+'</div>';
}
function practice(){
 const q=currentQ();if(!q)return complete();
 if(stateBox.optionsFor!==stateBox.idx){stateBox.options=answerOptions(q.a,q.b);stateBox.optionsFor=stateBox.idx}
 const solved=stateBox.answer===q.a*q.b;
 const expression=q.a+' × '+q.b;
 const repetition=Array.from({length:q.a},()=>q.b).join(' + ')+' = '+(q.a*q.b);
 return '<section class="mp-practice-screen">'+travel(stateBox.idx,8)+heading('Øv på gangetabellen','Finn svaret, ett lite steg om gangen.')
 +'<article class="mp-task-scene"><div class="mp-task-wood"><span class="mp-task-pretitle">Hvor mange blir det?</span><h2>'+expression+' <span>?</span></h2><p>'+q.a+' grupper med '+q.b+' i hver</p></div>'
 +'<div class="mp-task-apples">'+(window.LARIA_MULT_ILLUSTRATED_V3?window.LARIA_MULT_ILLUSTRATED_V3.picker(currentIllustrationTheme()):'')+apples(q.a,q.b)+'</div></article>'
 +'<div class="mp-answer-head"><span>Velg riktig svar</span>'+btn('read','🔊 Les opp','mp-read')+'</div>'
 +'<div class="mp-answer-grid">'+stateBox.options.map((v,i)=>btn('answer',String(v),'mp-answer mp-answer-'+i+' '+(stateBox.answer===v?(solved?'correct':'incorrect'):''),'data-value="'+v+'" '+(solved?'disabled':'')+' aria-label="Svar '+v+'"')).join('')+'</div>'
 +btn('hint','💡 '+(stateBox.showHints?'Skjul forklaringen':'Vis meg hvordan'),'mp-hint-toggle','aria-expanded="'+stateBox.showHints+'"')
 +(stateBox.showHints?'<div class="mp-explain"><b>Se på gruppene:</b><p>'+q.a+' like grupper med '+q.b+' i hver.</p><strong>'+repetition+'</strong></div>':'')
 +'<div class="mp-answer-feedback '+(solved?'success':stateBox.feedback?'try':'')+'" role="status" aria-live="polite">'+(stateBox.feedback||'Trykk på et av tallene.')+'</div>'
 +(solved?btn('next',stateBox.idx===7?'Se resultatet ›':'Neste oppgave ›','mp-next'):'')
 +mascot(solved?'Bra! Du fant svaret.':stateBox.feedback?'Prøv igjen. Du kan bruke forklaringen.':'Vi finner svaret sammen!',true)+'</section>';
}
function exploreTabs(){
 const modes=[['table','▦','Tabellen'],['groups','🍓','Grupper'],['array','▥','Rutenett'],['line','↝','Tallinje'],['swap','⇄','Bytt plass'],['patterns','✳','Mønstre']];
 return '<div class="mp-explore-tabs" role="group" aria-label="Velg hvordan du vil utforske gange">'+modes.map(([id,icon,label])=>btn('mode','<span aria-hidden="true">'+icon+'</span><strong>'+label+'</strong>','mp-explore-tab '+(stateBox.active===id?'selected':''),'data-mode="'+id+'" aria-pressed="'+(stateBox.active===id)+'"')).join('')+'</div>';
}
function smallArray(a,b){return '<div class="mp-mini-array" style="--mp-cols:'+b+'">'+Array.from({length:a*b},()=>'<i></i>').join('')+'</div>'}
function numberLine(a,b){
 let html='<div class="mp-line-scroll" role="img" aria-label="'+a+' hopp på '+b+', ender på '+(a*b)+'"><div class="mp-line-points" style="--mp-n:'+(a+1)+'">';
 for(let i=0;i<=a;i++)html+='<span class="mp-line-stop">'+(i*b)+'</span>'+(i<a?'<span class="mp-line-jump" aria-hidden="true">↷</span>':'');
 return html+'</div></div>';
}
function patterns(a){
 return '<div class="mp-pattern-grid">'+Array.from({length:MAX},(_,i)=>'<div><small>'+a+' × '+(i+1)+'</small><strong>'+(a*(i+1))+'</strong></div>').join('')+'</div>';
}
function factorPairs(v){const pairs=[];for(let a=1;a<=MAX;a++){let b=v/a;if(Number.isInteger(b)&&b<=MAX)pairs.push([a,b])}return pairs}
function exploreTable(){
 const a=stateBox.row,b=stateBox.col,product=a*b;
 let html='<div class="mp-table-instruction">Trykk på et tall. Sveip sidelengs for å se flere kolonner.</div><div class="mp-table-viewport" role="region" aria-label="Interaktiv 10 ganger 10-tabell" tabindex="0"><table class="mp-times-grid"><thead><tr><th class="corner">×</th>';
 for(let c=1;c<=MAX;c++)html+='<th class="'+(c===b?'axis':'')+'">'+c+'</th>';
 html+='</tr></thead><tbody>';
 for(let r=1;r<=MAX;r++){html+='<tr><th scope="row" class="'+(r===a?'axis':'')+'">'+r+'</th>';for(let c=1;c<=MAX;c++)html+='<td>'+btn('cell',String(r*c),'mp-grid-cell '+(r===a&&c===b?'selected':r===a?'row':c===b?'col':r*c===product?'same':''),'data-row="'+r+'" data-col="'+c+'" aria-label="'+r+' ganger '+c+' er '+(r*c)+'"')+'</td>';html+='</tr>';}
 html+='</tbody></table></div><div class="mp-table-inspector"><div class="mp-inspector-equation"><b>'+a+' × '+b+' = '+product+'</b><strong>'+b+' × '+a+' = '+product+'</strong><p>Samme svar når vi bytter plass på tallene.</p></div><div class="mp-factor-title">Andre måter å lage '+product+' på</div><div class="mp-pair-buttons">'+factorPairs(product).map(([x,y])=>btn('pair',x+' × '+y,'mp-pair '+(x===a&&y===b?'selected':''),'data-row="'+x+'" data-col="'+y+'"')).join('')+'</div></div>';
 return html;
}
function explorer(){
 const mode=stateBox.active,a=stateBox.a,b=stateBox.b;
 let stage='';
 if(mode==='groups'){stage='<div class="mp-wood-sign">'+a+' grupper med '+b+'</div>'+(window.LARIA_MULT_ILLUSTRATED_V3?window.LARIA_MULT_ILLUSTRATED_V3.picker(currentIllustrationTheme()):'')+apples(a,b)}
 if(mode==='array'){stage='<div class="mp-wood-sign">'+a+' rader med '+b+'</div><div class="mp-array-panel">'+smallArray(a,b)+'</div>'}
 if(mode==='line'){stage='<div class="mp-wood-sign">'+a+' hopp på '+b+'</div>'+numberLine(a,b)}
 if(mode==='swap'){stage='<div class="mp-wood-sign">Samme antall, snudd!</div><div class="mp-swap-pair">'+smallArray(a,b)+smallArray(b,a)+'</div><strong class="mp-swap-label">'+a+' × '+b+' = '+b+' × '+a+'</strong>'}
 if(mode==='patterns'){stage='<div class="mp-wood-sign">Oppdag '+a+'-gangen</div>'+patterns(a)}
 if(mode==='table'){stage=exploreTable()}
 return '<section class="mp-explore-screen">'+heading('Utforsk og lek',mode==='table'?'Gangetabellen fra 1 til 10. Trykk på et tall og utforsk!':'Prøv deg fram og oppdag hvordan gange virker.')+exploreTabs()
 +'<div class="mp-explore-world '+(mode==='table'?'table-mode':'')+'">'+stage+'</div>'
 +(mode==='table'?'':'<div class="mp-factor-controls"><div><label>Antall grupper</label><div class="mp-factor-adjust">'+btn('factor','−','','data-factor="a" data-step="-1" aria-label="Færre grupper"')+'<strong>'+a+'</strong>'+btn('factor','+','','data-factor="a" data-step="1" aria-label="Flere grupper"')+'</div></div><div><label>I hver gruppe</label><div class="mp-factor-adjust">'+btn('factor','−','','data-factor="b" data-step="-1" aria-label="Færre i hver gruppe"')+'<strong>'+b+'</strong>'+btn('factor','+','','data-factor="b" data-step="1" aria-label="Flere i hver gruppe"')+'</div></div></div><div class="mp-math-result"><span>'+a+' × '+b+'</span><span> = </span><b>'+(a*b)+'</b></div>')
 +mascot(mode==='table'?'Trykk på et felt. Se hva som skjer når tallene bytter plass.':'Når vi samler like grupper, ser vi lettere hva gange betyr.',true)+'</section>';
}
function completed(){return '<span class="mp-medal">★</span>'}
function mastery(){
 const covered=Array.from({length:MAX},(_,i)=>tableProgress(i+1)).filter(x=>x.mastered).length;
 let awards='<div class="mp-award-grid">';
 for(const n of [2,3,5,6,4,7,8,9,10,1]){const p=tableProgress(n);awards+=btn('start','<span class="mp-badge-round '+(p.mastered?'done':p.practiced?'started':'not-started')+'">'+n+(p.mastered?completed():'')+'</span><strong>'+n+'-gangen</strong><small>'+(p.mastered?'Mestret':p.practiced?p.known+' av '+MAX+' trygg':'Ikke startet')+'</small>','mp-award','data-table="'+n+'"');}awards+='</div>';
 return '<section class="mp-mastery-screen">'+heading('Min mestring','Hver økt tar deg videre på læringsreisen!')+travel(Math.min(saved.sessions,8))
 +'<div class="mp-mastery-highlights"><div class="mp-info-tile"><span aria-hidden="true">🗓️</span><div><strong>Dagens økt</strong><small>'+(saved.days[localDate()]?'Du har øvd i dag!':'En liten økt er nok.')+'</small></div><span class="mp-highlight-value">🔥 '+streak()+'</span></div><div class="mp-info-tile achieved"><span aria-hidden="true">🏅</span><div><strong>'+covered+' gangetabeller mestret</strong><small>Mestring betyr trygghet, ikke hastverk.</small></div></div><div class="mp-info-tile next"><span aria-hidden="true">🌟</span><div><strong>Neste mål: '+suggested()+'-gangen</strong><small>Du kan alltid øve på noe du allerede kan.</small></div>'+btn('start','›','mp-round-arrow','data-table="'+suggested()+'" aria-label="Øv på neste mål"')+'</div></div>'
 +'<div class="mp-award-heading"><h2>Dine gangetabeller</h2><p>Alle er åpne, også dem du har mestret.</p></div>'+awards
 +'<div class="mp-rewards"><div><strong>Belønninger</strong><p>Du har samlet '+saved.stars+' stjerner ved å øve.</p></div><span class="mp-reward-chest" aria-hidden="true">🎁</span></div>'
 +mascot('Du blir sterkere for hver økt!',true)+'</section>';
}
function complete(){
 return '<section class="mp-complete-screen">'+heading('Bra jobbet!','Du fullførte en øvingsrunde.')+'<div class="mp-complete-medal"><span>🏆</span><strong>'+stateBox.firstTry+' av 8</strong><small>riktige på første forsøk</small><p>+'+stateBox.earned+' stjerner</p></div>'
 +btn('again','Øv en gang til ›','mp-next')
 +btn('go','Velg en annen gangetabell','mp-secondary','data-page="choose"')
 +mascot('Det er alltid lov å øve på det samme igjen!')+'</section>';
}
function navigation(){
 const links=[['home','⌂','Oversikt'],['choose','×','Tabeller'],['explore','✦','Utforsk'],['mastery','♕','Min mestring']];
 return '<nav class="mp-nav" aria-label="Gangetabellens sider">'+links.map(([page,icon,label])=>btn('go','<span aria-hidden="true">'+icon+'</span><small>'+label+'</small>','mp-nav-link '+(stateBox.page===page?'active':''),'data-page="'+page+'" '+(stateBox.page===page?'aria-current="page"':''))).join('')+'</nav>';
}
function render(){
 const root=document.getElementById(ROOT);if(!root)return;
 const region=root.querySelector('.mp-table-viewport');
 const scroll=region?{left:region.scrollLeft,top:region.scrollTop}:null;
 let screen=stateBox.page==='home'?home():stateBox.page==='choose'?choose():stateBox.page==='practice'?practice():stateBox.page==='explore'?explorer():stateBox.page==='mastery'?mastery():complete();
 root.innerHTML='<main class="mp-shell '+(grade()<=2?'mp-young':grade()<=4?'mp-middle':grade()<=7?'mp-older':'mp-teen')+'"><div class="mp-scenery" aria-hidden="true"></div><div class="mp-main">'+top()+screen+navigation()+'</div></main>';
 if(scroll){const current=root.querySelector('.mp-table-viewport');if(current){current.scrollLeft=scroll.left;current.scrollTop=scroll.top}}
}
function onClick(event){
 const root=document.getElementById(ROOT),target=event.target.closest('button[data-mp-action]');if(!target||!root?.contains(target))return;
 const action=target.dataset.mpAction,page=target.dataset.page,n=Number(target.dataset.table);
 if(action==='go'){if(page==='practice')return begin();if(page==='explore')stateBox.active='table';stateBox.page=page;render();scrollTop();return}
 if(action==='back'){if(stateBox.page==='home'){try{if(typeof window.LARIA_RETURN_TO_BASECAMP==='function'&&window.LARIA_RETURN_TO_BASECAMP())return}catch(_){}try{openSubject('math')}catch(_){}return}stateBox.page='home';render();scrollTop();return}
 if(action==='resume')return begin(null,true);
 if(action==='start')return begin(n);
 if(action==='more'){stateBox.showMore=!stateBox.showMore;render();return}
 if(action==='answer')return chooseAnswer(Number(target.dataset.value));
 if(action==='next')return beginNext();
 if(action==='again')return begin(stateBox.roundType==='table'?stateBox.tab:null);
 if(action==='hint'){stateBox.showHints=!stateBox.showHints;render();return}
 if(action==='read')return speak();
 if(action==='mode'){stateBox.active=target.dataset.mode;render();return}
  if(action==='theme'){if(window.LARIA_MULT_ILLUSTRATED_V3?.themes.includes(target.dataset.theme)){illustrationTheme=target.dataset.theme;render()}return}
 if(action==='factor'){const key=target.dataset.factor;stateBox[key]=d(stateBox[key]+Number(target.dataset.step));render();return}
 if(action==='cell'||action==='pair'){stateBox.row=Number(target.dataset.row);stateBox.col=Number(target.dataset.col);render();return}
}
const root=document.getElementById(ROOT);if(root&&!root.dataset.mpV2Bound){root.addEventListener('click',onClick);root.dataset.mpV2Bound='true'}
window.openMultiplicationLab=function(){
 document.getElementById('multiplication-lab-screen')?.setAttribute('data-explore-release','explore-rc1');
 stateBox.page='home';stateBox.showHints=false;stateBox.showSummary=false;render();
 try{showScreen('multiplication-lab')}catch(_){}
};
window.LARIA_MULT_PREMIUM={version:'illustrated-v2',open:window.openMultiplicationLab,stats:()=>JSON.parse(JSON.stringify(saved)),snapshot:()=>({page:stateBox.page,mode:stateBox.active,theme:currentIllustrationTheme(),a:stateBox.a,b:stateBox.b,row:stateBox.row,col:stateBox.col,round:stateBox.round.map(q=>Object.assign({},q)),index:stateBox.idx,firstTry:stateBox.firstTry,answer:stateBox.answer})};
const entry=document.getElementById('open-multiplication-lab');if(entry)entry.onclick=window.openMultiplicationLab;
})();