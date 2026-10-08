/* Læria · Brøklaben premium. The approved illustrated workshop is built with real,
   responsive controls. The original fraction lab and graded subject data stay intact. */
(()=>{
'use strict';
const ROOT='fraction-lab-root',STORE='laria_fraction_premium_v1';
const DENOMS=[2,3,4,5,6,8,10,12];
const PRESETS=[[1,2],[1,3],[1,4],[2,3],[3,4],[3,6],[5,8]];
const EQ=[
 {a:[1,2],b:[2,4]}, {a:[2,3],b:[4,6]}, {a:[3,4],b:[6,8]},
 {a:[1,3],b:[2,6]}, {a:[2,5],b:[4,10]}, {a:[3,4],b:[2,3]},
 {a:[1,2],b:[3,6]}, {a:[1,4],b:[2,8]}
];
const SORT=[
 [[3,4],[1,4],[1,2]],
 [[5,6],[1,3],[2,3]],
 [[4,5],[1,5],[3,5]],
 [[7,8],[3,8],[1,2]],
 [[3,4],[1,8],[5,8]]
];
const CONVERSIONS=[[1,2],[1,4],[3,4],[2,5],[1,5],[1,10],[1,3],[2,3],[5,8]];
const titles={explore:'Utforsk brøker',build:'Bygg en brøk',equal:'Like mye?',sort:'Sorter brøker',convert:'Brøk, prosent og desimal',mastery:'Min mestring'};
const faces={explore:'Brøker finnes overalt! Trykk på delene og se hva som skjer.',build:'Sett inn en bit. Du bestemmer hvor mye du vil bygge.',equal:'To forskjellige brøker kan vise akkurat like mye!',sort:'Sammenlign hvor stor del som er fargelagt.',convert:'Samme mengde kan skrives på tre måter.',mastery:'Det du har utforsket, kan du alltid utforske igjen.'};
const u={page:'home',explore:{n:3,d:4,mode:'circle'},build:{n:3,d:4,notice:''},equal:0,equalGuess:null,sortIndex:0,sortOrder:[0,1,2],sortResult:'',sortSelected:null,convert:0,showConvertExtra:false};
let svgId=0,drag=null,lastDragUntil=0;
const read=()=>{try{const o=JSON.parse(localStorage.getItem(STORE)||'{}');return {
  explored:o.explored&&typeof o.explored==='object'?o.explored:{},
  built:o.built&&typeof o.built==='object'?o.built:{},
  equal:o.equal&&typeof o.equal==='object'?o.equal:{},
  sorted:o.sorted&&typeof o.sorted==='object'?o.sorted:{},
  converted:o.converted&&typeof o.converted==='object'?o.converted:{},
  actions:Number(o.actions)||0,updated:Number(o.updated)||0
 }}catch(_){return {explored:{},built:{},equal:{},sorted:{},converted:{},actions:0,updated:0}}};
const progress=read();
const fox='<img src="./lia-fox-explorer-home.webp" alt="" class="fr2-fox" loading="lazy">';
const key=(n,d)=>n+'/'+d;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,Number(x)||0));
const equal=(a,b)=>a[0]*b[1]===b[0]*a[1];
const greater=(a,b)=>a[0]*b[1]>b[0]*a[1];
const pair=(o)=>[o.n,o.d];
const frac=(n,d)=>'<span class="fr2-fraction" role="img" aria-label="'+n+' av '+d+'"><b>'+n+'</b><i aria-hidden="true"></i><b>'+d+'</b></span>';
const number=(n,max=3)=>new Intl.NumberFormat('nb-NO',{maximumFractionDigits:max}).format(n);
function formatValue(n,d){
 let x=d;while(x%2===0)x/=2;while(x%5===0)x/=5;const exact=x===1;
 const v=n/d,p=v*100;
 return {dec:(exact?'':'≈ ')+number(v,exact?4:3)+(exact?'':'…'),pct:(exact?'':'≈ ')+number(p,exact?2:1)+' %',exact};
}
function mark(kind,item){
 if(!progress[kind]||progress[kind][item])return;
 progress[kind][item]=Date.now();progress.actions++;progress.updated=Date.now();
 try{localStorage.setItem(STORE,JSON.stringify(progress))}catch(_){}
}
function grade(){try{return typeof currentGrade==='function'?Number(currentGrade())||2:2}catch(_){return 2}}
const cta=(action,text,className='',extra='')=>'<button type="button" class="'+className+'" data-fr-action="'+action+'" '+extra+'>'+text+'</button>';
function fractionSvg(n,d,kind='large',canTap=false){
 const id=++svgId,den=Math.max(1,d),val=Math.max(0,Math.min(n,den)),r=83,c=100;
 let slices='';
 for(let i=0;i<den;i++){
  const a0=-Math.PI/2+2*Math.PI*i/den,a1=-Math.PI/2+2*Math.PI*(i+1)/den;
  const x0=c+r*Math.cos(a0),y0=c+r*Math.sin(a0),x1=c+r*Math.cos(a1),y1=c+r*Math.sin(a1);
  const p=den===1?'M 100 17 A 83 83 0 1 1 99.99 17 Z':'M 100 100 L '+x0.toFixed(3)+' '+y0.toFixed(3)+' A '+r+' '+r+' 0 '+(2*Math.PI/den>Math.PI?1:0)+' 1 '+x1.toFixed(3)+' '+y1.toFixed(3)+' Z';
  const attr=canTap?' data-fr-action="piece" data-piece="'+i+'" role="button" tabindex="0" aria-label="Del '+(i+1)+' av '+den+'"':'';
  slices+='<path d="'+p+'" fill="url(#fr2-'+(i<val?'berry':'pastry')+id+')" stroke="#9C6A48" stroke-width="3.5" stroke-linejoin="round" '+attr+'/>';
 }
 const sprinkles='<circle cx="80" cy="53" r="3" fill="#F5B08B" opacity=".8"/><circle cx="111" cy="65" r="2.5" fill="#F6B987" opacity=".75"/><circle cx="84" cy="142" r="2.5" fill="#F7BE96" opacity=".65"/>';
 return '<svg class="fr2-pie fr2-pie-'+kind+(canTap?' fr2-pie-interactive':'')+'" viewBox="0 0 200 200" role="img" aria-label="'+val+' av '+den+' like deler er fylt" xmlns="http://www.w3.org/2000/svg">'
 +'<defs><radialGradient id="fr2-berry'+id+'" cx="28%" cy="23%"><stop stop-color="#F5A18C"/><stop offset=".48" stop-color="#DD6450"/><stop offset="1" stop-color="#A94138"/></radialGradient><radialGradient id="fr2-pastry'+id+'" cx="25%" cy="20%"><stop stop-color="#FFF7E7"/><stop offset=".67" stop-color="#F4DFC0"/><stop offset="1" stop-color="#D6B889"/></radialGradient><linearGradient id="fr2-crust'+id+'" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#F8D18B"/><stop offset="1" stop-color="#B47543"/></linearGradient></defs>'
 +'<ellipse cx="102" cy="182" rx="88" ry="13" fill="#6B4A32" opacity=".16"/><circle cx="100" cy="98" r="94" fill="url(#fr2-crust'+id+')" stroke="#915B36" stroke-width="4"/><circle cx="100" cy="100" r="86" fill="#FAE8C7"/>'+slices+sprinkles+'</svg>';
}
function barSvg(n,d){
 let cells='';for(let i=0;i<d;i++){const x=12+i*276/d;cells+='<rect x="'+(x+2).toFixed(2)+'" y="30" width="'+(276/d-4).toFixed(2)+'" height="75" rx="7" fill="'+(i<n?'#D86B55':'#FBECD6')+'" stroke="#BD946C" stroke-width="2"/>'}
 return '<svg viewBox="0 0 300 136" class="fr2-bar" role="img" aria-label="'+n+' av '+d+' deler av en stripe"><rect x="5" y="22" width="290" height="91" rx="19" fill="#E3B989" stroke="#AF7E4F" stroke-width="5"/>'+cells+'</svg>';
}
function gridSvg(n,d){
 const cols=Math.ceil(Math.sqrt(d)),rows=Math.ceil(d/cols);let s='<div class="fr2-block-grid" style="--fr2-cols:'+cols+'">';
 for(let i=0;i<d;i++)s+='<span class="'+(i<n?'filled':'')+'"></span>';
 return s+'</div>';
}
function glassSvg(n,d){
 const v=Math.max(0,Math.min(1,n/d));
 return '<svg viewBox="0 0 230 220" class="fr2-glass" role="img" aria-label="Målebeger fylt '+number(v*100)+' prosent"><defs><clipPath id="fr2-glass-clip"><path d="M50 28H175L160 203H66Z"/></clipPath><linearGradient id="fr2-liquid" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#EAC17D"/><stop offset="1" stop-color="#CA6E51"/></linearGradient></defs><path d="M50 28H175L160 203H66Z" fill="#F9F1E8BF" stroke="#709EB2" stroke-width="7" stroke-linejoin="round"/><rect x="50" y="'+(203-v*175)+'" width="125" height="'+(v*175)+'" fill="url(#fr2-liquid)" clip-path="url(#fr2-glass-clip)"/><path d="M175 49C220 49 218 105 173 113" stroke="#709EB2" stroke-width="12" fill="none" stroke-linecap="round"/>'+[0,.25,.5,.75,1].map(t=>'<path d="M148 '+(202-t*173)+'H164" stroke="#5B8090" stroke-width="4"/>').join('')+'</svg>';
}
function presentation(n,d,kind='circle',interactive=false){
 return kind==='bar'?barSvg(n,d):kind==='grid'?gridSvg(n,d):kind==='glass'?glassSvg(n,d):fractionSvg(n,d,'large',interactive);
}
function mascot(message,small=false){return '<div class="fr2-guide'+(small?' compact':'')+'">'+fox+'<div class="fr2-fox-speech">'+message+'<span class="fr2-guide-heart" aria-hidden="true">♥</span></div></div>'}
function topBar(){return '<header class="fr2-top">'+cta('back','‹','fr2-back','id="fraction-lab-back" aria-label="Tilbake"')+'<div class="fr2-brand">Læria<small>✦</small></div><div class="fr2-charm"><span aria-hidden="true">🍰</span> Brøklaben</div></header>'}
function sign(text,sub){return '<div class="fr2-sign"><h1>'+text+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</div>'}
function screenTabs(){
 const items=[['home','⌂','Hjem'],['explore','◔','Utforsk'],['build','▧','Bygg'],['mastery','★','Mestring']];
 return '<nav class="fr2-nav" aria-label="Brøklab"><div class="fr2-nav-row">'+items.map(([p,i,label])=>cta('go','<span aria-hidden="true">'+i+'</span><small>'+label+'</small>','fr2-nav-item '+(u.page===p?'active':''),'data-page="'+p+'" '+(u.page===p?'aria-current="page"':''))).join('')+'</div></nav>';
}
function miniArt(type){
 if(type==='explore')return '<div class="fr2-mini-pie">'+fractionSvg(1,2,'mini')+'</div>';
 if(type==='build')return '<div class="fr2-mini-stack">'+fractionSvg(3,4,'mini')+'<span class="fr2-mini-piece">◕</span></div>';
 if(type==='equal')return '<div class="fr2-mini-equal">'+fractionSvg(1,2,'mini')+'<b>=</b>'+fractionSvg(2,4,'mini')+'</div>';
 if(type==='sort')return '<div class="fr2-mini-sorting"><span>¼</span><span>½</span><span>¾</span></div>';
 if(type==='convert')return '<div class="fr2-mini-convert">½ <b>=</b> 50 %<small>= 0,5</small></div>';
 return '<div class="fr2-mini-mastery"><span>★</span><b>✦ ✦ ✦</b></div>';
}
function card(type,subtitle){
 return cta('go','<div class="fr2-card-art">'+miniArt(type)+'</div><strong>'+titles[type]+'</strong><small>'+subtitle+'</small><span class="fr2-card-arrow" aria-hidden="true">›</span>','fr2-home-card fr2-card-'+type,'data-page="'+type+'"');
}
function home(){
 return '<section class="fr2-home">'+sign('Brøklaben','Utforsk, bygg og lek med brøker!')+'<div class="fr2-intro"><span>✦ Et lite verksted for store oppdagelser ✦</span></div>'
 +'<div class="fr2-home-grid">'
 +card('explore','Se brøker i forskjellige former')
 +card('build','Sett sammen deler selv')
 +card('equal','Oppdag brøker som er like store')
 +card('sort','Fra minst til størst')
 +card('convert','Samme mengde, tre skrivemåter')
 +card('mastery','Se oppdagelsene dine')
 +'</div>'+mascot('Brøker finnes overalt! Skal vi utforske sammen?')+'</section>';
}
function adjustField(field){
 const unit=field==='d'?'Nevner':'Teller';
 const explanation=field==='d'?'Hvor mange like deler?':'Hvor mange deler fylles?';
 const val=u[u.page][field],min=field==='d'?2:0,max=field==='d'?12:u[u.page].d;
 return '<div class="fr2-adjust"><div class="fr2-adjust-heading"><b>'+unit+'</b><small>'+explanation+'</small></div><div class="fr2-adjust-row">'+cta('adjust','−','fr2-adjust-btn minus','data-field="'+field+'" data-step="-1" aria-label="Mindre '+unit.toLowerCase()+'" '+(val<=min?'disabled':''))+'<strong>'+val+'</strong>'+cta('adjust','+','fr2-adjust-btn plus','data-field="'+field+'" data-step="1" aria-label="Større '+unit.toLowerCase()+'" '+(val>=max?'disabled':''))+'</div></div>';
}
function commonFractions(){
 return '<div class="fr2-presets" aria-label="Vanlige brøker">'+PRESETS.map(([n,d])=>cta('preset',frac(n,d),'fr2-preset '+(u.explore.n===n&&u.explore.d===d?'selected':''),'data-n="'+n+'" data-d="'+d+'" aria-label="Vis '+n+' av '+d+' deler"')).join('')+'</div>';
}
function explore(){
 const x=u.explore;
 const modes=[['circle','◕','Sirkel'],['bar','▰','Stripe'],['grid','▦','Rutenett'],['glass','♧','Målebeger']];
 return '<section class="fr2-explore">'+sign('Utforsk brøker','Se, bygg og oppdag brøker på flere måter!')
 +'<div class="fr2-views" role="group" aria-label="Velg brøkvisning">'+modes.map(([k,ico,label])=>cta('view','<span aria-hidden="true">'+ico+'</span><b>'+label+'</b>','fr2-view '+(x.mode===k?'active':''),'data-view="'+k+'" aria-pressed="'+(x.mode===k)+'"')).join('')+'</div>'
 +'<div class="fr2-stage fr2-explore-stage"><div class="fr2-stage-main"><div class="fr2-main-illustration">'+presentation(x.n,x.d,x.mode,x.mode==='circle')+'</div><div class="fr2-main-value">'+frac(x.n,x.d)+'<small>'+x.n+' av '+x.d+' like deler er farget.</small></div></div></div>'
 +'<div class="fr2-controls">'+adjustField('n')+adjustField('d')+'</div><div class="fr2-soft-section"><strong>Vanlige brøker</strong>'+commonFractions()+'</div>'
 +mascot(x.n===x.d?'Nå er hele figuren fylt!':x.n===0?'En helhet har '+x.d+' like deler. Trykk på pluss for å fylle dem.':'Se! Telleren viser hvor mange deler vi har valgt.',true)+'</section>';
}
function build(){
 const x=u.build;
 return '<section class="fr2-build">'+sign('Bygg en brøk','Flytt på bitene og lag din egen brøk.')
 +'<div class="fr2-build-workshop"><div class="fr2-wood-tray"><span class="fr2-tray-title">Brøkbiter</span><div class="fr2-spare-pieces">'+Array.from({length:Math.min(x.d,8)},(_,i)=>cta('add','<span aria-hidden="true">◕</span>','fr2-spare '+(i===0?'point':'') ,'data-fr-pick="1" aria-label="Legg til én del"')).join('')+'</div><small>Trykk på en bit, eller dra den inn</small></div>'
 +'<div class="fr2-build-target" data-fr-drop="1"><div class="fr2-fabric">'+fractionSvg(x.n,x.d,'builder',true)+'</div><p>Trykk på delene for å fylle eller fjerne dem.</p></div></div>'
 +'<div class="fr2-controls">'+adjustField('d')+adjustField('n')+'</div>'
 +'<div class="fr2-result"><span>Du har bygget</span>'+frac(x.n,x.d)+'<small>'+x.n+' av '+x.d+' like deler.</small></div>'
 +'<div class="fr2-actions">'+cta('reset','Tøm brettet','fr2-secondary')+cta('next-build','Bygg noe nytt ›','fr2-primary')+'</div>'
 +mascot(x.notice||(x.n===x.d?'Du har laget en hel!':x.n===0?'Velg en bit fra kassen for å begynne.':'Flott! Du har bygget '+x.n+' av '+x.d+' deler.'),true)+'</section>';
}
function eqCurrent(){return EQ[u.equal%EQ.length]}
function equalScreen(){
 const q=eqCurrent(),l=q.a,r=q.b,isEqual=equal(l,r),answered=u.equalGuess!==null;
 return '<section class="fr2-equal">'+sign('Like mye?','Forskjellige brøker kan vise like mye.')
 +'<div class="fr2-trail"><span>Oppdagelse '+(u.equal%EQ.length+1)+' av '+EQ.length+'</span><div class="fr2-trail-nodes">'+Array.from({length:EQ.length},(_,i)=>'<i class="'+(i<=u.equal%EQ.length?'on':'')+'"></i>').join('')+'</div></div>'
 +'<div class="fr2-scale-stage"><div class="fr2-scale"><div class="fr2-scale-beam"></div><div class="fr2-scale-sides"><div class="fr2-scale-plate"><div class="fr2-scale-label">'+frac(l[0],l[1])+'</div>'+fractionSvg(l[0],l[1],'compare')+'</div><div class="fr2-scale-mid"><b>?</b></div><div class="fr2-scale-plate"><div class="fr2-scale-label">'+frac(r[0],r[1])+'</div>'+fractionSvg(r[0],r[1],'compare')+'</div></div><div class="fr2-scale-base">◆</div></div></div>'
 +'<div class="fr2-comparison"><h2>Viser de like mye?</h2><div class="fr2-choice-pair">'+cta('guess','Ja, like mye','fr2-answer '+(u.equalGuess==='equal'?(isEqual?'right':'incorrect'):''),'data-guess="equal" aria-pressed="'+(u.equalGuess==='equal')+'"')+cta('guess','Nei, forskjellige','fr2-answer '+(u.equalGuess==='different'?(!isEqual?'right':'incorrect'):''),'data-guess="different" aria-pressed="'+(u.equalGuess==='different')+'"')+'</div>'
 +'<div class="fr2-feedback" aria-live="polite">'+(answered?(isEqual===(u.equalGuess==='equal')?'Du fant det! '+l[0]+'/'+l[1]+(isEqual?' = ':' ≠ ')+r[0]+'/'+r[1]+'.':(isEqual?'Se etter hvor mye som er fylt. Begge viser samme mengde.':'Tell hvor mye som er fylt i hver. De viser forskjellig mengde.')):'Se på figurene før du velger.')+'</div></div>'
 +cta('next-equal','Prøv et nytt eksempel ›','fr2-primary fr2-full')+mascot(answered?'Når vi sammenligner mengder, oppdager vi nye sammenhenger!':'Se hvor mye av hver kake som er fylt. Er det like mye?',true)+'</section>';
}
function sortCurrent(){return SORT[u.sortIndex%SORT.length]}
function sorted(){const q=sortCurrent();return u.sortOrder.every((n,i,arr)=>i===0||!greater(q[arr[i-1]],q[n]))}
function sorting(){
 const q=sortCurrent();
 return '<section class="fr2-sort">'+sign('Sorter brøker','Legg brøkene fra minst til størst.')
 +'<div class="fr2-sort-help"><span aria-hidden="true">🧺</span> Sammenlign de fargelagte delene. Flytt med pilene, eller dra brikken.</div>'
 +'<div class="fr2-sort-stage"><div class="fr2-sort-board"><div class="fr2-sort-order"><span>MINST</span><span>STØRST</span></div><div class="fr2-sort-cards">'+u.sortOrder.map((index,pos)=>'<div class="fr2-sort-card" data-fr-sort="'+pos+'" tabindex="0" aria-label="Brøk '+q[index][0]+' av '+q[index][1]+' i posisjon '+(pos+1)+'"><div class="fr2-sort-graphic">'+fractionSvg(q[index][0],q[index][1],'sort')+'</div>'+frac(q[index][0],q[index][1])+'<div class="fr2-sort-move">'+cta('sort-shift','←','fr2-sort-arrow','data-position="'+pos+'" data-direction="-1" aria-label="Flytt til venstre" '+(pos===0?'disabled':''))+cta('sort-shift','→','fr2-sort-arrow','data-position="'+pos+'" data-direction="1" aria-label="Flytt til høyre" '+(pos===u.sortOrder.length-1?'disabled':''))+'</div></div>').join('')+'</div></div></div>'
 +cta('sort-check','Sjekk rekkefølgen','fr2-primary fr2-full')+'<div class="fr2-feedback '+(u.sortResult==='win'?'good':'')+'" aria-live="polite">'+(u.sortResult==='win'?'Du sorterte riktig! Mindre deler først, større til slutt.':u.sortResult==='try'?'Ikke helt ennå. Se hvor mye av hver figur som er fylt.':'Ta den tiden du trenger.')+'</div>'
 +cta('sort-next','Nye brøker ›','fr2-secondary fr2-full')+mascot(u.sortResult==='win'?'Du har fått øye på størrelsene!':'Du kan prøve så mange ganger du vil.',true)+'</section>';
}
function convert(){
 const [n,d]=CONVERSIONS[u.convert%CONVERSIONS.length],fmt=formatValue(n,d);
 return '<section class="fr2-convert">'+sign('Brøk, prosent og desimal','Samme del – tre måter å skrive det på!')
 +'<div class="fr2-convert-focus"><span class="fr2-wood-tag">Se på denne:</span><div class="fr2-convert-figure">'+fractionSvg(n,d,'large')+'<p>'+n+' av '+d+' like deler er fargelagt.</p></div>'
 +'<div class="fr2-conversion-row"><div><small>Brøk</small>'+frac(n,d)+'</div><span>=</span><div><small>Prosent</small><strong>'+fmt.pct+'</strong></div><span>=</span><div><small>Desimal</small><strong>'+fmt.dec+'</strong></div></div>'
 +(!fmt.exact?'<p class="fr2-approx-note">≈ betyr omtrent. Denne desimalen fortsetter videre.</p>':'')+'</div>'
 +'<div class="fr2-soft-section"><strong>Flere eksempler</strong><div class="fr2-example-row">'+CONVERSIONS.map(([a,b],i)=>cta('convert-example',frac(a,b)+'<small>'+formatValue(a,b).pct+'</small>','fr2-example '+(u.convert===i?'selected':''),'data-example="'+i+'" aria-label="Vis '+a+' av '+b+' som prosent og desimal"')).join('')+'</div></div>'
 +cta('next-convert','Neste eksempel ›','fr2-primary fr2-full')+mascot('Samme mengde kan skrives som brøk, prosent og desimaltall.',true)+'</section>';
}
function mastery(){
 const tags=[
  ['explored','Utforsket','◔'],['built','Bygget','◕'],['equal','Funnet like mye','⚖'],['sorted','Sortert','▤'],['converted','Prosent og desimal','%']
 ];
 const counts=tags.map(([k])=>Object.keys(progress[k]||{}).length);
 const discoveries=counts.reduce((a,b)=>a+b,0);
 const next=!counts[0]?'explore':!counts[1]?'build':!counts[2]?'equal':!counts[3]?'sort':!counts[4]?'convert':'explore';
 return '<section class="fr2-mastery">'+sign('Min mestring','Her er det du har oppdaget i Brøklaben!')
 +'<div class="fr2-mastery-banner">'+fox+'<div><small>Dine brøkeeventyr</small><strong>'+discoveries+' oppdagelser</strong><p>Hver oppdagelse teller. Du kan alltid utforske noe på nytt.</p></div><span class="fr2-award-star" aria-hidden="true">★</span></div>'
 +'<h2 class="fr2-section-title">Dette har du prøvd</h2><div class="fr2-master-grid">'+tags.map(([k,title,icon],i)=>cta('go','<span class="fr2-master-icon" aria-hidden="true">'+icon+'</span><strong>'+title+'</strong><small>'+(counts[i]===0?'En oppdagelse venter':counts[i]+' oppdagelser')+'</small>','fr2-master-tile','data-page="'+(k==='explored'?'explore':k==='built'?'build':k==='equal'?'equal':k==='sorted'?'sort':'convert')+'"')).join('')+'</div>'
 +'<div class="fr2-next-suggestion"><span aria-hidden="true">🗺️</span><div><small>Prøv dette neste</small><strong>'+titles[next]+'</strong><p>Alle aktivitetene er åpne, også dem du kjenner godt.</p></div>'+cta('go','›','fr2-next-arrow','data-page="'+next+'" aria-label="Åpne '+titles[next]+'"')+'</div>'+mascot('Nysgjerrighet er superkraften din!')+'</section>';
}
function render(){
 const root=document.getElementById(ROOT);if(!root)return;svgId=0;
 const content=u.page==='home'?home():u.page==='explore'?explore():u.page==='build'?build():u.page==='equal'?equalScreen():u.page==='sort'?sorting():u.page==='convert'?convert():mastery();
 root.innerHTML='<div class="fr2-shell '+(grade()<=2?'fr2-young':grade()<=4?'fr2-middle':'fr2-older')+'"><div class="fr2-world-art" aria-hidden="true"></div><div class="fr2-content">'+topBar()+content+screenTabs()+'</div></div>';
}
function enter(next){
 if(!Object.prototype.hasOwnProperty.call(titles,next)&&next!=='home')return;
 u.page=next;
 if(next==='build')u.build.notice='';
 if(next==='equal')u.equalGuess=null;
 if(next==='sort')u.sortResult='';
 render();
 try{document.getElementById(ROOT)?.scrollIntoView({block:'start',behavior:'instant'})}catch(_){}
}
function adjust(field,step){
 const o=u.page==='build'?u.build:u.explore;
 if(field==='d'){o.d=clamp(o.d+step,2,12);o.n=clamp(o.n,0,o.d);}
 else{o.n=clamp(o.n+step,0,o.d)}
 if(u.page==='explore')mark('explored',key(o.n,o.d));
 if(u.page==='build'&&o.n>0)mark('built',key(o.n,o.d));
 u.build.notice='';render();
}
function setPiece(index){
 const o=u.page==='build'?u.build:u.explore;
 o.n=index<o.n?index:index+1;
 if(u.page==='build'&&o.n>0)mark('built',key(o.n,o.d));
 if(u.page==='explore')mark('explored',key(o.n,o.d));
 u.build.notice='';render();
}
function moveSort(from,to){to=clamp(to,0,u.sortOrder.length-1);if(from===to)return;const moved=u.sortOrder.splice(from,1)[0];u.sortOrder.splice(to,0,moved);u.sortResult='';render();}
function nextSort(){u.sortIndex=(u.sortIndex+1)%SORT.length;u.sortOrder=[2,0,1];u.sortResult='';render();}
function actionHandler(e){
 const root=document.getElementById(ROOT),btn=e.target.closest('[data-fr-action]');if(!btn||!root||!root.contains(btn))return;
 const a=btn.dataset.frAction;
 // Ignore only the synthetic tap from a dragged piece, never block unrelated controls.
 if(Date.now()<lastDragUntil&&a==='add')return;
 if(a==='back'){if(u.page!=='home'){enter('home');return;}try{if(typeof window.LARIA_RETURN_TO_BASECAMP==='function'&&window.LARIA_RETURN_TO_BASECAMP())return}catch(_){}try{openSubject('math')}catch(_){}return;}
 if(a==='go'){enter(btn.dataset.page);return;}
 if(a==='view'){u.explore.mode=btn.dataset.view;mark('explored',key(u.explore.n,u.explore.d));render();return;}
 if(a==='preset'){u.explore.n=Number(btn.dataset.n);u.explore.d=Number(btn.dataset.d);mark('explored',key(u.explore.n,u.explore.d));render();return;}
 if(a==='adjust'){adjust(btn.dataset.field,Number(btn.dataset.step));return;}
 if(a==='piece'){setPiece(Number(btn.dataset.piece));return;}
 if(a==='add'){if(u.build.n<u.build.d){u.build.n++;mark('built',key(u.build.n,u.build.d));u.build.notice='Du la til én del!';}else{u.build.notice='Alle delene er allerede fylt!';}render();return;}
 if(a==='reset'){u.build.n=0;u.build.notice='Nå kan du bygge helt på nytt.';render();return;}
 if(a==='next-build'){u.build.d=DENOMS[(DENOMS.indexOf(u.build.d)+1)%DENOMS.length];u.build.n=0;u.build.notice='Prøv å bygge en ny brøk!';render();return;}
 if(a==='guess'){u.equalGuess=btn.dataset.guess;const q=eqCurrent(),correct=equal(q.a,q.b)===(u.equalGuess==='equal');if(correct)mark('equal',key(q.a[0],q.a[1])+'='+key(q.b[0],q.b[1]));render();return;}
 if(a==='next-equal'){u.equal=(u.equal+1)%EQ.length;u.equalGuess=null;render();return;}
 if(a==='sort-shift'){moveSort(Number(btn.dataset.position),Number(btn.dataset.position)+Number(btn.dataset.direction));return;}
 if(a==='sort-check'){u.sortResult=sorted()?'win':'try';if(u.sortResult==='win')mark('sorted','set-'+u.sortIndex);render();return;}
 if(a==='sort-next'){nextSort();return;}
 if(a==='convert-example'){u.convert=Number(btn.dataset.example);const q=CONVERSIONS[u.convert];mark('converted',key(q[0],q[1]));render();return;}
 if(a==='next-convert'){u.convert=(u.convert+1)%CONVERSIONS.length;const q=CONVERSIONS[u.convert];mark('converted',key(q[0],q[1]));render();return;}
}
function keyHandler(e){
 const t=e.target.closest('[data-fr-action="piece"]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setPiece(Number(t.dataset.piece))}
}
function clearDrag(){
 if(drag?.ghost)drag.ghost.remove();
 drag=null;
 document.querySelectorAll('.fr2-drag-over').forEach(x=>x.classList.remove('fr2-drag-over'));
}
function pointerDown(e){
 // Leave the accessible arrow buttons clickable; capture only a deliberate card drag.
 if(e.target.closest('.fr2-sort-arrow'))return;
 const btn=e.target.closest('.fr2-spare[data-fr-pick],.fr2-sort-card[data-fr-sort]');
 if(!btn||e.pointerType==='mouse'&&e.button!==0)return;
 drag={type:btn.hasAttribute('data-fr-pick')?'build':'sort',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,from:Number(btn.dataset.frSort),moved:false,ghost:null};
 try{btn.setPointerCapture(e.pointerId)}catch(_){}
}
function pointerMove(e){
 if(!drag||drag.pointer!==e.pointerId)return;
 const dist=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY);
 if(dist<9&&!drag.moved)return;
 if(!drag.moved){drag.moved=true;drag.ghost=document.createElement('div');drag.ghost.className='fr2-drag-ghost';drag.ghost.textContent=drag.type==='sort'?'◕':'◔';document.body.appendChild(drag.ghost);}
 if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px'}
 const el=document.elementFromPoint(e.clientX,e.clientY)?.closest(drag.type==='build'?'.fr2-build-target':'.fr2-sort-card');
 document.querySelectorAll('.fr2-drag-over').forEach(x=>x.classList.remove('fr2-drag-over'));
 if(el)el.classList.add('fr2-drag-over');
 e.preventDefault();
}
function pointerUp(e){
 if(!drag||drag.pointer!==e.pointerId)return;
 const moved=drag.moved,type=drag.type,from=drag.from;
 let target=null;if(moved)target=document.elementFromPoint(e.clientX,e.clientY)?.closest(type==='build'?'.fr2-build-target':'.fr2-sort-card');
 clearDrag();
 if(moved){lastDragUntil=Date.now()+350;if(type==='build'&&target&&u.build.n<u.build.d){u.build.n++;u.build.notice='Brikken er på plass!';mark('built',key(u.build.n,u.build.d));render();}else if(type==='sort'&&target){moveSort(from,Number(target.dataset.frSort))}}
}
window.openFractionLab=function(){
 document.getElementById('fraction-lab-screen')?.setAttribute('data-explore-release','explore-rc1');
 u.page='home';render();try{showScreen('fraction-lab')}catch(_){}
};
const root=document.getElementById(ROOT);
if(root&&!root.dataset.fr2Bound){root.addEventListener('click',actionHandler);root.addEventListener('keydown',keyHandler);root.addEventListener('pointerdown',pointerDown);root.addEventListener('pointermove',pointerMove);root.addEventListener('pointerup',pointerUp);root.addEventListener('pointercancel',clearDrag);root.dataset.fr2Bound='1'}
const entry=document.getElementById('open-fraction-lab');if(entry)entry.onclick=window.openFractionLab;
window.LARIA_FRACTION_PREMIUM={version:'workshop-v1',open:window.openFractionLab,progress:()=>JSON.parse(JSON.stringify(progress)),snapshot:()=>JSON.parse(JSON.stringify(u)),compare:equal,format:formatValue};
})();