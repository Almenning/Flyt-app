/* Læria: Plukk og tell · illustrated, accessible 2.5D play in ten open worlds. */
(function(){
'use strict';
const E=window.LARIA_MULT_PICK_ENGINE;if(!E)return;
const KEY='laria-mult-pick-play-v1';
let state=E.initial(),past=[],future=[],redraw=()=>{},drag=null,suppressUntil=0;
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v?.version===1)state=E.normalize(v)}catch(_){}
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
function go(type,data={},record=true){
 const next=E.apply(state,{type,...data});if(next===state)return false;
 if(record){past.push(E.normalize(state));if(past.length>90)past.shift();future=[]}
 state=next;save();return true;
}
function back(){if(!past.length)return false;future.push(E.normalize(state));state=past.pop();save();return true}
function forward(){if(!future.length)return false;past.push(E.normalize(state));state=future.pop();save();return true}
function w(){return E.WORLDS.find(x=>x.id===state.world)||E.WORLDS[0]}
function sprite(theme,index){
 if(['strawberry','bun','mushroom','apple'].includes(theme)&&window.LARIA_MULT_ILLUSTRATED_V3?.sprite)return window.LARIA_MULT_ILLUSTRATED_V3.sprite(theme,index);
 const sid='mpPick'+theme+index,color=['#db4d4a','#e3ad43','#468bc0','#945fbc','#89b866'][index%5],grad='url(#'+sid+')';
 let d='';
 if(theme==='treasure')d='<path d="M7 23L19 8H46L57 23L32 56Z" fill="'+grad+'" stroke="#976d39" stroke-width="2"/><path d="M7 23H57M19 8L24 23L32 56L41 23L46 8" stroke="#fff5d6" stroke-width="2" fill="none"/>';
 else if(theme==='train')d='<rect x="8" y="18" width="48" height="37" rx="8" fill="'+grad+'" stroke="#714d31" stroke-width="2.5"/><path d="M22 19V10Q32 4 43 10V19M21 22V52M44 22V52" stroke="#e6c38a" stroke-width="4" fill="none"/><circle cx="18" cy="56" r="3" fill="#54493c"/><circle cx="47" cy="56" r="3" fill="#54493c"/>';
 else if(theme==='beach')d='<path d="M8 44Q3 25 20 15Q33 3 48 16Q62 29 55 45Q33 57 8 44Z" fill="'+grad+'" stroke="#a97771" stroke-width="2"/><path d="M32 15V51M32 15Q17 30 20 50M32 15Q45 29 45 50M32 15Q8 26 11 39M32 15Q56 27 54 40" stroke="#fff4de" stroke-width="2.8" fill="none"/>';
 else if(theme==='farm')d='<ellipse cx="32" cy="33" rx="23" ry="27" fill="'+grad+'" stroke="#ab936d" stroke-width="2"/><path d="M17 34Q18 19 28 13" stroke="#fff8e0" stroke-width="5" stroke-linecap="round" fill="none"/>';
 else if(theme==='aquarium')d='<path d="M16 31L3 17V46Z" fill="'+color+'" stroke="#a4773f" stroke-width="2"/><ellipse cx="38" cy="31" rx="23" ry="17" fill="'+grad+'" stroke="#a4773f" stroke-width="2"/><path d="M29 18L45 6L49 20M29 44L45 56L49 43" fill="'+grad+'" stroke="#b47c43" stroke-width="2"/><circle cx="49" cy="29" r="4" fill="white"/><circle cx="50" cy="29" r="2" fill="#333"/>';
 else d='<path d="M32 53Q12 43 14 25Q15 5 32 5Q51 5 50 25Q50 43 32 53Z" fill="'+grad+'" stroke="#ab5e59" stroke-width="2"/><path d="M32 54L29 58H35Z" fill="#a6754c"/><path d="M32 59Q24 62 32 64" stroke="#795f4b" stroke-width="1.7" fill="none"/><path d="M23 19Q18 30 23 37" stroke="#fff5e0" stroke-width="5" stroke-linecap="round" fill="none"/>';
 return '<svg class="mp-pick-sprite" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><radialGradient id="'+sid+'" cx="30%" cy="18%" r="90%"><stop stop-color="#fff3ce"/><stop offset=".38" stop-color="'+color+'"/><stop offset="1" stop-color="#875348"/></radialGradient></defs><ellipse cx="31" cy="59" rx="21" ry="3" fill="#493425" opacity=".15"/>'+d+'</svg>';
}
function landscape(){
 const kind=w().scene;
 const colors={garden:['#b4dfdf','#91bf8a','#688f64'],orchard:['#c5e4c6','#91bc82','#638659'],farm:['#d3e8ce','#bdc88c','#7c9b66'],forest:['#b6ccae','#809c74','#426a58'],bakery:['#e9c8ab','#bb906d','#956a50'],treasure:['#9b9d99','#997761','#66574d'],train:['#b1e1e3','#a8c390','#6a9879'],beach:['#b5e6ec','#87c6cf','#f0dcaa'],aquarium:['#7ac8da','#4599b4','#276f91'],park:['#bfe3eb','#acd1ad','#6b9a75']}[kind];
 let extra='';
 if(['garden','orchard','farm','forest'].includes(kind))extra='<g fill="#5c9264"><circle cx="75" cy="137" r="78"/><circle cx="870" cy="122" r="88"/></g><path d="M70 300V125M875 302V118" stroke="#79583c" stroke-width="27"/><path d="M610 240V142H752V240" fill="#f2d8ae" stroke="#a76e56" stroke-width="7"/><path d="M592 144L680 67L770 144Z" fill="#c77a5c"/><rect x="673" y="186" width="28" height="53" fill="#906949"/>';
 if(kind==='bakery')extra='<rect x="0" y="55" width="960" height="238" fill="#b88968" opacity=".6"/><path d="M0 108H960M0 168H960M0 226H960" stroke="#fff2d8" stroke-width="5" opacity=".65"/><path d="M102 250V110Q165 48 231 110V250" fill="#795544" stroke="#ead1a7" stroke-width="13"/><path d="M122 249V117Q168 81 207 117V249" fill="#ffdda4"/><rect y="276" width="960" height="44" fill="#bd8b63"/>';
 if(kind==='train')extra='<path d="M0 282H960" stroke="#765e50" stroke-width="11"/><path d="M0 262H960" stroke="#c09b67" stroke-width="19" stroke-dasharray="36 10"/><path d="M65 243V136H230V243" fill="#f2daa9" stroke="#b38566" stroke-width="8"/><path d="M51 138L149 67L247 138Z" fill="#c67155"/><circle cx="823" cy="178" r="48" fill="#f9ebca" stroke="#a27d5c" stroke-width="10"/><path d="M823 177V145M823 177L848 188" stroke="#705845" stroke-width="5"/>';
 if(kind==='beach')extra='<path d="M0 162Q240 152 380 165Q680 152 960 160V247H0Z" fill="#6bb8c6"/><path d="M0 194Q210 174 400 191Q690 176 960 188" stroke="#e5fdf2" stroke-width="8" fill="none"/><path d="M0 243Q230 210 430 248Q750 223 960 245V320H0Z" fill="#ead7ab"/><path d="M801 163V61H867V163" fill="#ffeedb" stroke="#c27962" stroke-width="5"/><path d="M791 62L833 19L879 62Z" fill="#c87958"/>';
 if(kind==='treasure')extra='<rect width="960" height="320" fill="#5c5652" opacity=".28"/><path d="M73 320V149Q480 -62 889 149V320" stroke="#d3b393" stroke-width="35" fill="none"/><path d="M0 255H960" stroke="#bca487" stroke-width="25" stroke-dasharray="55 6"/><g fill="#ffe7a4"><circle cx="175" cy="119" r="13"/><circle cx="801" cy="119" r="13"/></g>';
 if(kind==='aquarium')extra='<rect width="960" height="320" fill="#207a9a" opacity=".4"/><path d="M0 290Q210 253 390 288Q630 242 960 286V320H0Z" fill="#668f7d"/><path d="M50 320Q10 192 90 155M129 320Q187 213 120 169M845 320Q792 190 869 151M901 320Q961 200 907 147" fill="none" stroke="#529a7c" stroke-width="14"/><g stroke="#eafefa" fill="none" opacity=".55"><circle cx="219" cy="106" r="14"/><circle cx="238" cy="45" r="9"/><circle cx="732" cy="65" r="18"/></g>';
 if(kind==='park')extra='<circle cx="795" cy="159" r="92" stroke="#e9d29b" stroke-width="10" fill="none"/><path d="M795 68V252M704 159H887M729 94L863 227M729 225L863 94" stroke="#e2bc9c" stroke-width="7"/><path d="M715 289L795 152L876 289" fill="none" stroke="#bb8660" stroke-width="11"/><path d="M43 276L169 99L288 276Z" fill="#f4d59e" stroke="#bc7e6a" stroke-width="7"/>';
 return '<svg class="mp-pick-landscape" viewBox="0 0 960 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="mpPickSky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+colors[0]+'"/><stop offset="1" stop-color="#fff7e7"/></linearGradient><linearGradient id="mpPickSoil" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+colors[1]+'"/><stop offset="1" stop-color="'+colors[2]+'"/></linearGradient></defs><rect width="960" height="320" fill="url(#mpPickSky)"/><circle cx="777" cy="55" r="35" fill="#fff0b6" opacity=".75"/><path d="M0 191Q143 89 299 178Q433 94 590 177Q793 85 960 177V320H0Z" fill="'+colors[1]+'" opacity=".54"/><path d="M0 236Q220 174 387 222Q600 175 960 218V320H0Z" fill="url(#mpPickSoil)"/>'+extra+'<g fill="#fff9e9" opacity=".72"><circle cx="151" cy="58" r="15"/><circle cx="174" cy="61" r="19"/><circle cx="613" cy="42" r="13"/><circle cx="632" cy="42" r="17"/></g></svg>';
}
function worlds(){
 return '<div class="mp-pick-world-chooser"><div class="mp-pick-labelrow"><b>Velg eventyrverden</b><small>Alle er åpne</small></div><div class="mp-pick-world-strip" role="group" aria-label="Velg eventyrverden">'+E.WORLDS.map((t,i)=>'<button type="button" data-mp-action="pick-play" data-pick-action="world" data-world="'+t.id+'" class="mp-pick-world-btn'+(state.world===t.id?' selected':'')+'" aria-pressed="'+(state.world===t.id)+'"><span class="mp-pick-world-emoji" aria-hidden="true">'+sprite(t.id,700+i)+'</span><span>'+t.name+'</span></button>').join('')+'</div></div>';
}
function groups(){
 const picked=w(),moving=state.moveMode;
 return '<div class="mp-pick-group-grid" style="--pick-n:'+state.counts.length+'">'+state.counts.map((count,group)=>{
  const items=state.itemIds[group].map((token,i)=>'<button type="button" data-mp-action="pick-play" data-pick-action="'+(moving?'selectMove':'take')+'" data-group="'+group+'" data-token="'+token+'" class="mp-pick-object" aria-label="'+(moving?'Velg for å flytte':'Plukk')+' '+esc(picked.unit)+' '+(i+1)+' fra kurv '+(group+1)+'">'+sprite(picked.id,token)+'</button>').join('');
  const gridColumns=count>=9?5:count>=5?3:count>=3?2:Math.max(1,count);
  return '<div class="mp-pick-vessel" data-group="'+group+'" role="group" aria-label="Kurv '+(group+1)+': '+count+' '+esc(picked.object)+'"><span class="mp-pick-handle" aria-hidden="true"></span><span class="mp-pick-linen" aria-hidden="true"></span><div class="mp-pick-objects" style="--pick-cols:'+gridColumns+'">'+items+'</div><span class="mp-pick-front" aria-hidden="true"></span><span class="mp-pick-number">'+count+'</span><div class="mp-pick-vessel-actions">'+(moving?'<button type="button" data-mp-action="pick-play" data-pick-action="moveTarget" data-group="'+group+'" '+(state.moveFrom===null||state.moveFrom===group||count>=E.MAX_EACH?'disabled':'')+'>Hit ↘</button>':
  '<button type="button" data-mp-action="pick-play" data-pick-action="take" data-group="'+group+'" '+(!count?'disabled':'')+' aria-label="Plukk én fra kurv '+(group+1)+'">− 1</button><button type="button" data-mp-action="pick-play" data-pick-action="return" data-group="'+group+'" '+(!state.collected||count>=E.MAX_EACH?'disabled':'')+' aria-label="Legg én tilbake i kurv '+(group+1)+'">+ 1</button>')+'</div><button type="button" class="mp-pick-empty" data-mp-action="pick-play" data-pick-action="empty" data-group="'+group+'" '+(!count?'disabled':'')+' aria-label="Tøm hele kurv '+(group+1)+'">Tøm kurv</button></div>';
 }).join('')+'</div>';
}
function missions(){
 return '<div class="mp-pick-mission-panel"><div class="mp-pick-mentor"><img src="./lia-fox-explorer-home.webp" alt="" loading="lazy" aria-hidden="true"><span>'+ (state.success?'Du fant en løsning! Du kan alltid utforske mer.':'Prøv gjerne flere måter. Du bestemmer tempoet!')+'</span></div><div class="mp-pick-labelrow"><b>Små oppdrag</b><small>Ingen tidtaking eller feilstraff</small></div><div class="mp-pick-mission-grid" role="group" aria-label="Velg oppdrag">'+E.MISSIONS.map((m,i)=>'<button type="button" data-mp-action="pick-play" data-pick-action="mission" data-id="'+m.id+'" class="mp-pick-mission'+(state.mission===m.id?' selected':'')+'" aria-pressed="'+(state.mission===m.id)+'"><span aria-hidden="true">'+['✦','✧','★','✳'][i]+'</span>'+m.title+'</button>').join('')+'</div>'+
 (state.mission?'<div class="mp-pick-mission-detail"><div><b>'+esc(E.MISSIONS.find(x=>x.id===state.mission).title)+'</b><p>'+esc(E.MISSIONS.find(x=>x.id===state.mission).prompt)+'</p>'+(state.mission==='twoWays'?'<small>Oppdaget: '+state.found.length+' av 2 måter</small>':'')+'</div><button type="button" data-mp-action="pick-play" data-pick-action="check" class="mp-pick-check">Sjekk</button></div>':'')+'</div>';
}
function representations(){
 const views=[['groups','Grupper'],['rows','Rader'],['numberline','Tallinje'],['circle','Sirkel']];
 const mode=E.VIEWS.includes(state.view)?state.view:'groups',total=E.total(state);
 let illustration='';
 if(mode==='rows'){
  illustration='<div class="mp-pick-rows">'+state.counts.map((n,g)=>'<div class="mp-pick-row"><span>Gruppe '+(g+1)+'</span><div class="mp-pick-row-dots" aria-label="'+n+' gjenstander">'+Array.from({length:n},()=>'<i class="mp-pick-mini-dot" aria-hidden="true"></i>').join('')+'</div><strong>'+n+'</strong></div>').join('')+'</div>';
 }else if(mode==='circle'){
  illustration='<div class="mp-pick-circles">'+state.counts.map((n,g)=>'<div class="mp-pick-circle-card"><strong>Gruppe '+(g+1)+'</strong><div class="mp-pick-circle" aria-label="'+n+' i sirkel">'+(n?Array.from({length:n},(_,i)=>{const angle=2*Math.PI*i/n-Math.PI/2;return '<i class="mp-pick-circle-dot" style="left:'+(50+36*Math.cos(angle)).toFixed(2)+'%;top:'+(50+36*Math.sin(angle)).toFixed(2)+'%" aria-hidden="true"></i>';}).join(''):'<span class="mp-pick-circle-empty">Tom</span>')+'</div><span>'+n+' i gruppen</span></div>').join('')+'</div>';
 }else if(mode==='numberline'){
  let accumulated=0;
  const segments=state.counts.map((n,g)=>{
   const start=30+540*accumulated/Math.max(1,total);accumulated+=n;
   const end=30+540*accumulated/Math.max(1,total),mid=(start+end)/2;
   return n?'<path d="M'+start.toFixed(1)+' 100 Q'+mid.toFixed(1)+' '+(24-5*(g%2))+' '+end.toFixed(1)+' 100" stroke="'+['#a76542','#66875a','#d99d52','#628b96','#9270a4'][g%5]+'" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M'+(end-7).toFixed(1)+' 90L'+end.toFixed(1)+' 100L'+(end-10).toFixed(1)+' 104" stroke="#765b42" stroke-width="3" stroke-linecap="round" fill="none"/><text x="'+mid.toFixed(1)+'" y="'+(36-5*(g%2))+'" text-anchor="middle" fill="#5e4031" font-weight="900" font-size="20">+'+n+'</text>':
    '<text x="'+start.toFixed(1)+'" y="81" text-anchor="middle" fill="#836856" font-size="13">+0</text>';
  }).join('');
  illustration='<svg class="mp-pick-numberline" role="img" aria-label="Tallinje fra 0 til '+total+' med hopp på '+state.counts.join(', ')+'" viewBox="0 0 600 143"><path d="M20 100H586" stroke="#594e41" stroke-width="3" fill="none"/><path d="M586 100l-13-7v14z" fill="#594e41"/>'+segments+'<path d="M30 93V107M570 93V107" stroke="#594e41" stroke-width="3"/><text x="30" y="131" text-anchor="middle" font-size="20" font-weight="900" fill="#4f3428">0</text><text x="570" y="131" text-anchor="middle" font-size="20" font-weight="900" fill="#4f3428">'+total+'</text></svg>';
 }else{
  illustration='<div class="mp-pick-group-summary">'+state.counts.map((n,g)=>'<div class="mp-pick-summary-tile"><span aria-hidden="true">'+sprite(w().id,900+g)+'</span><b>Gruppe '+(g+1)+'</b><strong>'+n+'</strong></div>').join('')+'</div>';
 }
 return '<div class="mp-pick-representations"><div class="mp-pick-labelrow"><b>Se tallene på flere måter</b><small>Samme mengde, ulik visning</small></div><div class="mp-pick-view-switch" role="group" aria-label="Vis på ulike måter">'+views.map(([id,label])=>'<button type="button" data-mp-action="pick-play" data-pick-action="view" data-view="'+id+'" aria-pressed="'+(mode===id)+'" class="'+(mode===id?'selected':'')+'">'+label+'</button>').join('')+'</div><div class="mp-pick-visualization" data-math-view="'+mode+'">'+illustration+'</div></div>';
}
function render(){
 const eq=E.equation(state),picked=w(),sum=E.total(state);
 return '<section class="mp-pick-screen" data-pick-world="'+picked.id+'" data-pick-scene="'+picked.scene+'"><header class="mp-pick-heading"><span class="mp-pick-kicker">LÆRIA · UTFORSK OG LEK</span><h2>Plukk og tell</h2><p>Her er det du som styrer! Plukk, flytt og oppdag sammenhenger.</p></header>'+
 worlds()+
 '<div class="mp-pick-stage"><div class="mp-pick-stage-landscape" aria-hidden="true">'+landscape()+'</div><div class="mp-pick-stage-inner"><div class="mp-pick-wood-sign" aria-live="polite"><span>Hva skjer med regnestykket?</span><strong class="mp-pick-equation">'+esc(eq.main)+'</strong><small>'+esc(eq.detail)+'</small></div>'+
 groups()+
 '<div class="mp-pick-collection"><span class="mp-pick-collection-art" aria-hidden="true">'+(state.pool.length?state.pool.slice(-9).map(token=>sprite(picked.id,token)).join(''):'<span class="mp-pick-blank-icon">✧</span>')+'</span><div><strong>Samlekurven</strong><small>Her havner alt du plukker</small></div><b class="mp-pick-collected">'+state.collected+'</b></div></div></div>'+
 '<div class="mp-pick-main-actions"><button type="button" data-mp-action="pick-play" data-pick-action="takeEach" '+(sum===0?'disabled':'')+'>− Én fra hver</button><button type="button" data-mp-action="pick-play" data-pick-action="moveMode" aria-pressed="'+state.moveMode+'" class="'+(state.moveMode?'selected':'')+'">'+(state.moveMode?'Avslutt flytting':'⇄ Flytt mellom')+'</button><button type="button" data-mp-action="pick-play" data-pick-action="newGroup" '+(state.counts.length>=E.MAX_GROUPS?'disabled':'')+'>+ Ny kurv</button></div>'+
 representations()+
 '<div class="mp-pick-secondary-actions"><button type="button" data-mp-action="pick-play" data-pick-action="undo" '+(!past.length?'disabled':'')+'>↶ Angre</button><button type="button" data-mp-action="pick-play" data-pick-action="redo" '+(!future.length?'disabled':'')+'>↷ Gjør om</button><button type="button" data-mp-action="pick-play" data-pick-action="read">🔊 Les opp</button><button type="button" data-mp-action="pick-play" data-pick-action="reset">Start på nytt</button></div>'+
 '<div class="mp-pick-feedback'+(state.success?' success':'')+'" role="status" aria-live="polite">'+esc(state.message||'Trykk på en gjenstand eller på − 1 under en kurv.')+'</div>'+
 '<div class="mp-pick-explanation">'+(state.moveMode?(state.moveFrom===null?'Trykk på en gjenstand. Velg deretter kurven den skal flyttes til.':'Nå kan du trykke «Hit» i en annen kurv.'):(eq.equal?'Like grupper! Derfor kan vi bruke et gangestykke.':'Ulike grupper! Se hvordan vi kan regne med minus eller pluss.'))+'</div>'+
 missions()+'<p class="mp-pick-no-lockout">Det er alltid lov å utforske videre, også når du kan svaret.</p></section>';
}
function dispatch(target){
 if(Date.now()<suppressUntil)return true;
 const type=target?.dataset?.pickAction||'',index=Number(target?.dataset?.group),token=target?.dataset?.token===undefined?null:Number(target.dataset.token);
 let changed=false;
 if(type==='view')changed=go('view',{view:target.dataset.view},false);
 elseif(type==='world')changed=go('world',{world:target.dataset.world});
 else if(type==='mission')changed=go('mission',{id:target.dataset.id});
 else if(type==='selectMove'||(type==='take'&&state.moveMode))changed=go('selectMove',{group:index,token},false);
 else if(type==='moveTarget'){if(state.moveFrom!==null)changed=go('move',{group:state.moveFrom,to:index,token:state.moveToken});}
 else if(['take','return','empty'].includes(type))changed=go(type,{group:index,token});
 else if(['takeEach','newGroup','check'].includes(type))changed=go(type);
 else if(type==='moveMode')changed=go(type,{},false);
 else if(type==='undo')changed=back();
 else if(type==='redo')changed=forward();
 else if(type==='reset'){past.push(E.normalize(state));if(past.length>90)past.shift();future=[];state={...E.initial(),world:state.world};save();changed=true}
 else if(type==='read'){
  try{if(window.speechSynthesis){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(E.equation(state).main.replaceAll('×',' ganger ').replaceAll('−',' minus ').replaceAll('=',' er lik '));u.lang='nb-NO';u.rate=.85;window.speechSynthesis.speak(u)}}catch(_){}
  return true;
 }
 if(changed){redraw();return true}
 return Boolean(type);
}
function mount(root,callback){
 redraw=callback;
 if(!root||root.dataset.mpPickPointerBound)return;
 root.dataset.mpPickPointerBound='true';
 root.addEventListener('pointerdown',event=>{
  const el=event.target.closest('.mp-pick-object');
  if(el&&root.contains(el))drag={id:event.pointerId,x:event.clientX,y:event.clientY,from:Number(el.dataset.group),token:Number(el.dataset.token)};
 },{passive:true});
 root.addEventListener('pointerup',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const start=drag;drag=null;
  if(Math.hypot(event.clientX-start.x,event.clientY-start.y)<20)return;
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.mp-pick-vessel');
  if(!target||!root.contains(target))return;
  const to=Number(target.dataset.group);
  if(go('move',{group:start.from,to,token:start.token})){suppressUntil=Date.now()+450;redraw();}
 });
 root.addEventListener('pointercancel',()=>{drag=null});
}
window.LARIA_MULT_PICK_PLAY={render,dispatch,mount,snapshot:()=>({...E.normalize(state),total:E.total(state),equation:E.equation(state),past:past.length,future:future.length}),reset:()=>{state=E.initial();past=[];future=[];save();redraw()}};

})();