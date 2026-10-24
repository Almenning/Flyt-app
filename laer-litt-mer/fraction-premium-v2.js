/* Læria · Brøklaben premium. The approved illustrated workshop is built with real,
   responsive controls. The original fraction lab and graded subject data stay intact. */
(()=>{
'use strict';
const ROOT='fraction-lab-root',STORE='laria_fraction_premium_v1';
const DENOMS=[2,3,4,5,6,8,10,12];
const PRESETS=[[1,2],[1,3],[1,4],[2,3],[3,4],[3,6],[5,8]];
// Mix equal and unequal quantities, so guessing only "yes" cannot work.
const EQ=[
 {a:[1,2],b:[2,4]}, {a:[1,2],b:[1,4]},
 {a:[1,3],b:[2,6]}, {a:[1,3],b:[2,3]},
 {a:[3,4],b:[1,2]}, {a:[2,3],b:[4,6]},
 {a:[1,4],b:[2,8]}, {a:[2,5],b:[1,2]},
 {a:[3,4],b:[6,8]}, {a:[1,3],b:[2,5]},
 {a:[3,4],b:[2,3]}, {a:[2,5],b:[4,10]},
 {a:[5,8],b:[3,4]}, {a:[1,2],b:[3,6]},
 {a:[2,4],b:[5,10]}, {a:[3,8],b:[1,2]}
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
const sharedCake={n:1,d:4,filled:[0],notice:'',mode:'circle'};
// Both views manipulate one tangible cake; changing the view never resets its fraction.
const u={page:'build',explore:sharedCake,build:sharedCake,equal:0,equalGuess:null,sortIndex:0,sortOrder:[0,1,2],sortResult:'',sortSelected:null,convert:0,showConvertExtra:false,showEquivalents:false,halfQuest:false,halfQuestWon:false,troll:'storesoster',lastChanged:-1};
let svgId=0,drag=null,lastDragUntil=0;
let returnToLockedJourney=false; // navigation-only context; not persisted
let returnToMathSubject=false; // nested route, UI only
const dragDiagnostics={pointerDown:0,pointerMove:0,pointerUp:0,nativeStart:0,nativeOver:0,nativeDrop:0};
const read=()=>{try{const o=JSON.parse(localStorage.getItem(STORE)||'{}');return {
  explored:o.explored&&typeof o.explored==='object'?o.explored:{},
  built:o.built&&typeof o.built==='object'?o.built:{},
  equal:o.equal&&typeof o.equal==='object'?o.equal:{},
  sorted:o.sorted&&typeof o.sorted==='object'?o.sorted:{},
  converted:o.converted&&typeof o.converted==='object'?o.converted:{},
  actions:Number(o.actions)||0,updated:Number(o.updated)||0
 }}catch(_){return {explored:{},built:{},equal:{},sorted:{},converted:{},actions:0,updated:0}}};
const progress=read();
const fox=()=>'<img src="'+window.LARIA_FOX.worldSource(window.LARIA_FOX.choice())+'" alt="" class="fr2-fox" loading="eager" decoding="async">';
const key=(n,d)=>n+'/'+d;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,Number(x)||0));
const equal=(a,b)=>a[0]*b[1]===b[0]*a[1];
const greater=(a,b)=>a[0]*b[1]>b[0]*a[1];
const pair=(o)=>[o.n,o.d];
const frac=(n,d)=>'<span class="fr2-fraction" role="img" aria-label="'+n+' av '+d+'"><b>'+n+'</b><i aria-hidden="true"></i><b>'+d+'</b></span>';
const number=(n,max=3)=>new Intl.NumberFormat('nb-NO',{maximumFractionDigits:max}).format(n);
function formatValue(n,d){
 // Reduce before checking if the decimal terminates.
 // 3/6 = 1/2, 0/3 = 0 and 3/3 = 1 are exact values.
 let a=Math.abs(n),b=Math.abs(d);
 while(b){const remainder=a%b;a=b;b=remainder;}
 let reducedDenominator=d/(a||1);
 while(reducedDenominator%2===0)reducedDenominator/=2;
 while(reducedDenominator%5===0)reducedDenominator/=5;
 const exact=reducedDenominator===1,v=n/d,p=v*100;
 return {dec:(exact?'':'≈ ')+number(v,exact?4:3)+(exact?'':'…'),
         pct:(exact?'':'≈ ')+number(p,exact?2:1)+' %',exact};
}
function mark(kind,item){
 if(!progress[kind]||progress[kind][item])return;
 progress[kind][item]=Date.now();progress.actions++;progress.updated=Date.now();
 try{localStorage.setItem(STORE,JSON.stringify(progress))}catch(_){}
}
function grade(){try{return typeof currentGrade==='function'?Number(currentGrade())||2:2}catch(_){return 2}}
const cta=(action,text,className='',extra='')=>'<button type="button" class="'+className+'" data-fr-action="'+action+'" '+extra+'>'+text+'</button>';
function fractionSvg(n,d,kind='large',canTap=false,selected=null){
 const id=++svgId,den=Math.max(1,d),val=Math.max(0,Math.min(n,den)),r=83,c=100;
 let slices='';
 for(let i=0;i<den;i++){
  const a0=-Math.PI/2+2*Math.PI*i/den,a1=-Math.PI/2+2*Math.PI*(i+1)/den;
  const x0=c+r*Math.cos(a0),y0=c+r*Math.sin(a0),x1=c+r*Math.cos(a1),y1=c+r*Math.sin(a1);
  const p=den===1?'M 100 17 A 83 83 0 1 1 99.99 17 Z':'M 100 100 L '+x0.toFixed(3)+' '+y0.toFixed(3)+' A '+r+' '+r+' 0 '+(2*Math.PI/den>Math.PI?1:0)+' 1 '+x1.toFixed(3)+' '+y1.toFixed(3)+' Z';
  const chosen=Array.isArray(selected)?selected.includes(i):i<val;
  const attr=canTap?' class="fr8-pie-piece'+(u.lastChanged===i?' fr8-pie-new':'')+'" data-fr-action="piece" data-piece="'+i+'" role="button" tabindex="0" aria-pressed="'+chosen+'" aria-label="'+(chosen?'Fjern':'Fyll')+' del '+(i+1)+' av '+den+'"':'';
  slices+='<path d="'+p+'" fill="url(#fr2-'+(chosen?'berry':'pastry')+id+')" stroke="#9C6A48" stroke-width="3.5" stroke-linejoin="round" '+attr+'/>';
 }
 const sprinkles='<g pointer-events="none"><circle cx="80" cy="53" r="3" fill="#F5B08B" opacity=".8"/><circle cx="111" cy="65" r="2.5" fill="#F6B987" opacity=".75"/><circle cx="84" cy="142" r="2.5" fill="#F7BE96" opacity=".65"/><circle cx="100" cy="100" r="89" fill="none" stroke="#FFE6B9" stroke-width="8" stroke-dasharray="8 4"/><circle cx="100" cy="100" r="83" fill="none" stroke="#A66D44" stroke-width="2" opacity=".7"/></g>';
 return '<svg class="fr2-pie fr2-pie-'+kind+(canTap?' fr2-pie-interactive':'')+'" viewBox="0 0 200 200" role="img" aria-label="'+val+' av '+den+' like deler er fylt" xmlns="http://www.w3.org/2000/svg">'
 +'<defs><radialGradient id="fr2-berry'+id+'" cx="28%" cy="23%"><stop stop-color="#F5A18C"/><stop offset=".48" stop-color="#DD6450"/><stop offset="1" stop-color="#A94138"/></radialGradient><radialGradient id="fr2-pastry'+id+'" cx="25%" cy="20%"><stop stop-color="#FFF7E7"/><stop offset=".67" stop-color="#F4DFC0"/><stop offset="1" stop-color="#D6B889"/></radialGradient><linearGradient id="fr2-crust'+id+'" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#F8D18B"/><stop offset="1" stop-color="#B47543"/></linearGradient></defs>'
 +'<ellipse cx="102" cy="182" rx="88" ry="13" fill="#6B4A32" opacity=".16"/><circle cx="100" cy="98" r="94" fill="url(#fr2-crust'+id+')" stroke="#915B36" stroke-width="4"/><circle cx="100" cy="100" r="86" fill="#FAE8C7"/>'+slices+sprinkles+'</svg>';
}
function barSvg(n,d,selected=null){
  const filled=Array.isArray(selected)?selected:Array.from({length:n},(_,i)=>i);
  let cells='';
  for(let i=0;i<d;i++){
    const x=12+i*276/d,on=filled.includes(i);
    cells+='<rect x="'+(x+2).toFixed(2)+'" y="30" width="'+(276/d-4).toFixed(2)+'" height="75" rx="7" fill="'+(on?'#D86B55':'#FBECD6')+'" stroke="#BD946C" stroke-width="2" data-fr-action="piece" data-piece="'+i+'" role="button" tabindex="0" aria-pressed="'+on+'" aria-label="'+(on?'Fjern':'Fyll')+' del '+(i+1)+' av '+d+'"/>';
  }
  return '<svg viewBox="0 0 300 136" class="fr2-bar fr6-interactive-view" role="group" aria-label="Stripe delt i '+d+' like deler"><rect x="5" y="22" width="290" height="91" rx="19" fill="#E3B989" stroke="#AF7E4F" stroke-width="5"/>'+cells+'</svg>';
}
function gridSvg(n,d,selected=null){
  const filled=Array.isArray(selected)?selected:Array.from({length:n},(_,i)=>i),cols=Math.ceil(Math.sqrt(d));
  let out='<div class="fr2-block-grid fr6-interactive-view" style="--fr2-cols:'+cols+'" role="group" aria-label="Rutenett med '+d+' like deler">';
  for(let i=0;i<d;i++){
    const on=filled.includes(i);
    out+='<span class="'+(on?'filled':'')+'" data-fr-action="piece" data-piece="'+i+'" role="button" tabindex="0" aria-pressed="'+on+'" aria-label="'+(on?'Fjern':'Fyll')+' del '+(i+1)+' av '+d+'"></span>';
  }
  return out+'</div>';
}
function glassSvg(n,d){
  const v=Math.max(0,Math.min(1,n/d));
  return '<svg viewBox="0 0 230 220" class="fr2-glass fr6-interactive-view" role="slider" data-fr-action="glass-fill" tabindex="0" aria-valuemin="0" aria-valuemax="'+d+'" aria-valuenow="'+n+'" aria-label="Målebeger. '+n+' av '+d+' deler. Trykk for å endre nivået.">'
    +'<defs><clipPath id="fr2-glass-clip"><path d="M50 28H175L160 203H66Z"/></clipPath><linearGradient id="fr2-liquid" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#EAC17D"/><stop offset="1" stop-color="#CA6E51"/></linearGradient></defs>'
    +'<path d="M50 28H175L160 203H66Z" fill="#F9F1E8BF" stroke="#709EB2" stroke-width="7" stroke-linejoin="round"/>'
    +'<rect x="50" y="'+(203-v*175)+'" width="125" height="'+(v*175)+'" fill="url(#fr2-liquid)" clip-path="url(#fr2-glass-clip)"/>'
    +'<path d="M175 49C220 49 218 105 173 113" stroke="#709EB2" stroke-width="12" fill="none" stroke-linecap="round"/>'
    +[0,.25,.5,.75,1].map(t=>'<path d="M148 '+(202-t*173)+'H164" stroke="#5B8090" stroke-width="4"/>').join('')
    +'<rect x="50" y="28" width="125" height="175" fill="transparent" aria-hidden="true"/></svg>';
}
function presentation(n,d,kind='circle',interactive=false,selected=null){
  return kind==='bar'?barSvg(n,d,selected):kind==='grid'?gridSvg(n,d,selected):kind==='glass'?glassSvg(n,d):fractionSvg(n,d,'large',interactive,selected);
}

const FR8_TROLLS=[
  {id:'storesoster',label:'Storesøster'},
  {id:'lillesoster',label:'Lillesøster'},
  {id:'lillebror',label:'Lillebror'}
];
function fr8Troll(){
  const character=FR8_TROLLS.find(x=>x.id===u.troll)||FR8_TROLLS[0];
  return '<img class="fr8-troll" src="./assets/fraction-trolls/'+character.id+'.webp" width="142" height="214" alt="" draggable="false" decoding="async" aria-hidden="true">';
}
function fr8Landscape(){
  // Real, independent presentation layers. Cake/objects remain actual DOM actions.
  return '<div class="fr8-landscape" aria-hidden="true">'
    +'<div class="fr8-sky"></div><div class="fr8-sun"></div>'
    +'<div class="fr8-cloud fr8-cloud-a"></div><div class="fr8-cloud fr8-cloud-b"></div>'
    +'<svg class="fr8-skala" viewBox="0 0 1000 290" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
    +'<defs><linearGradient id="fr8-rock" x1="0" y1="0" x2="0.3" y2="1"><stop stop-color="#798e96"/><stop offset=".68" stop-color="#677b81"/><stop offset="1" stop-color="#425d63"/></linearGradient><linearGradient id="fr8-snow" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffcf1"/><stop offset="1" stop-color="#c8dfde"/></linearGradient></defs>'
    +'<path d="M-15 192 40 145 94 166 181 104 247 165 325 84 386 150 463 104 545 168 618 125 704 180 800 112 892 167 1007 112 1020 292H-15Z" fill="#9eb8c0" opacity=".65"/>'
    +'<path d="M-30 175 50 150 105 130 182 108 245 120 310 99 351 117 405 155 480 142 536 180 654 144 732 182 812 174 908 200 1025 185 1030 290H-30Z" fill="url(#fr8-rock)"/>'
    +'<path d="M-30 176 70 145 135 128 188 104 250 120 309 99 353 117 410 159 352 151 314 137 280 149 245 139 192 145 143 153 115 172 36 178Z" fill="url(#fr8-snow)"/>'
    +'<path d="M350 160 400 177 430 214 517 187 554 201 600 175 662 197 738 182 817 203 905 196 1013 216 1014 292H350Z" fill="#497575" opacity=".66"/>'
    +'<g transform="translate(173 63)"><ellipse cx="34" cy="94" rx="42" ry="8" fill="#375460" opacity=".22"/><path d="M4 23 L31 0 57 23Z" fill="#384650"/><path d="M10 22 H51 V88 Q30 100 10 88Z" fill="#bab2a0" stroke="#817b72" stroke-width="3"/><path d="M18 28V90M31 25V93M44 28V90" stroke="#918a7b" stroke-width="2" opacity=".4"/><path d="M24 64H35V92H24Z" fill="#895045"/><path d="M17 39h6v11h-6ZM39 39h6v11h-6Z" fill="#43565d"/></g>'
    +'</svg>'
    +'<div class="fr8-fjord"></div><div class="fr8-rail"></div>'
    +'</div>';
}
function mascot(message,small=false){return '<div class="fr2-guide'+(small?' compact':'')+'">'+fox()+'<div class="fr2-fox-speech">'+message+'<span class="fr2-guide-heart" aria-hidden="true">♥</span></div></div>'}
function topBar(){const n=Object.entries(progress).filter(([k])=>['explored','built','equal','sorted','converted'].includes(k)).reduce((sum,[,v])=>sum+Object.keys(v||{}).length,0);return '<header class="fr2-top fr4-top">'+cta('back','‹','fr2-back','id="fraction-lab-back" aria-label="Tilbake"')+'<div class="fr2-brand">Læria<small>✦</small></div><div class="fr2-charm fr4-earned" aria-label="'+n+' oppdagelser i Brøklaben"><span aria-hidden="true">★</span><b>'+n+'</b></div><div class="fr4-top-token" aria-hidden="true">'+cardIllustration('explore')+'</div></header>'}
function sign(text,sub){return '<div class="fr2-sign"><span class="fr2-sign-decoration" aria-hidden="true">'+cardIllustration('build')+'</span><h1>'+text+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</div>'}
function screenTabs(){
  const items=[['build','◕','Kaken'],['home','✦','Flere leker'],['mastery','★','Oppdagelser']];
  return '<nav class="fr2-nav fr6-nav" aria-label="Brøklab"><div class="fr2-nav-row">'+items.map(([p,i,label])=>cta('go','<span aria-hidden="true">'+i+'</span><small>'+label+'</small>','fr2-nav-item '+(u.page===p?'active':''),'data-page="'+p+'" '+(u.page===p?'aria-current="page"':''))).join('')+'</div></nav>';
}

/* Six bespoke workshop illustrations replace generic fraction glyphs. These are
   artwork only: interactive labels and hit targets stay live HTML controls. */
function cardIllustration(type){
 const grad='<defs><linearGradient id="f3Wood" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#F4CEA0"/><stop offset=".53" stop-color="#C68B52"/><stop offset="1" stop-color="#8C5631"/></linearGradient><radialGradient id="f3Apple" cx=".25" cy=".2"><stop stop-color="#FFA995"/><stop offset=".4" stop-color="#E35C4B"/><stop offset="1" stop-color="#A5302A"/></radialGradient><linearGradient id="f3Pastry" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#FFF0C9"/><stop offset="1" stop-color="#E6B978"/></linearGradient><linearGradient id="f3Blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9BCFE4"/><stop offset="1" stop-color="#4388AE"/></linearGradient><linearGradient id="f3Leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#B7CE78"/><stop offset="1" stop-color="#4F8D55"/></linearGradient><filter id="f3Shadow"><feGaussianBlur stdDeviation="4"/></filter></defs>';
 const leaf='<path d="M0 0Q11-29 35-22Q27-3 0 0Z" fill="url(#f3Leaf)" stroke="#4B8049" stroke-width="2"/><path d="M0 0L34-21" stroke="#D5E1A9" stroke-width="2"/>';
 let p='';
 if(type==='explore'){
  p='<ellipse cx="122" cy="126" rx="102" ry="15" fill="#8B5F3D" opacity=".22" filter="url(#f3Shadow)"/>'
   +'<path d="M33 103Q73 119 123 110L199 113L194 126Q119 143 39 123Z" fill="url(#f3Wood)" stroke="#956136" stroke-width="3"/>'
   +'<path d="M53 71Q43 47 58 36Q75 22 96 37Q113 22 135 34Q157 51 146 90Q128 124 108 113Q91 119 68 107Z" fill="url(#f3Apple)" stroke="#9D3E30" stroke-width="4"/>'
   +'<path d="M97 35Q82 14 66 16Q74 37 97 35Z" fill="#6E9F53" stroke="#46804B" stroke-width="3"/>'
   +'<path d="M96 35Q100 13 114 8" stroke="#7B5935" stroke-width="5" fill="none" stroke-linecap="round"/>'
   +'<path d="M94 41Q105 39 116 46Q131 69 117 101Q106 114 93 105Z" fill="url(#f3Pastry)" stroke="#C99367" stroke-width="3"/>'
   +'<path d="M108 68l4 7m-12 8 7 5" stroke="#9C734D" stroke-width="3" stroke-linecap="round"/>'
   +'<g transform="translate(130 73) rotate(17)"><path d="M0 0L37-12Q58 7 54 42L10 34Z" fill="url(#f3Pastry)" stroke="#B58454" stroke-width="3"/><path d="M50-1Q64 24 53 41" stroke="#D35F4A" stroke-width="10" fill="none" stroke-linecap="round"/></g>'
   +'<circle cx="60" cy="49" r="5" fill="#FFF8DE" opacity=".65"/>';
 }
 if(type==='build'){
  p='<ellipse cx="117" cy="126" rx="93" ry="12" fill="#765236" opacity=".24" filter="url(#f3Shadow)"/>'
   +'<path d="M35 103Q110 87 209 108L198 131Q117 147 39 129Z" fill="url(#f3Wood)" stroke="#8D5D36" stroke-width="3"/>'
   +'<path d="M121 69L123 17A52 52 0 0 1 176 68Z" fill="url(#f3Apple)" stroke="#A85040" stroke-width="5" transform="translate(0 -10) rotate(2 121 69)"/>'
   +'<path d="M121 69L177 72A54 54 0 0 1 123 122Z" fill="#F3C553" stroke="#B78834" stroke-width="5" transform="translate(11 1) rotate(1 121 69)"/>'
   +'<path d="M121 69L121 120A51 51 0 0 1 67 70Z" fill="url(#f3Blue)" stroke="#4882A3" stroke-width="5" transform="translate(0 9) rotate(-2 121 69)"/>'
   +'<path d="M121 69L70 68A50 50 0 0 1 121 16Z" fill="#7FAF6B" stroke="#507E48" stroke-width="5" transform="translate(-10 -2) rotate(-2 121 69)"/>'
   +'<path d="M81 40Q96 19 114 18M149 39Q165 45 173 57" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".65"/>'
   +'<path d="M27 36l6-17m3 18 15-9M211 35l-4-13" stroke="#F2B454" stroke-width="5" stroke-linecap="round"/>';
 }
 if(type==='equal'){
  p='<ellipse cx="119" cy="128" rx="95" ry="14" fill="#987253" opacity=".2" filter="url(#f3Shadow)"/>'
   +'<path d="M113 111L99 131H141L127 111V43H113Z" fill="url(#f3Wood)" stroke="#82502D" stroke-width="3"/>'
   +'<path d="M54 42L187 42" stroke="#85532C" stroke-width="9" stroke-linecap="round"/>'
   +'<path d="M54 39L187 39" stroke="#F1BB75" stroke-width="4" stroke-linecap="round"/>'
   +'<circle cx="121" cy="41" r="10" fill="#F5C671" stroke="#915B31" stroke-width="4"/>'
   +'<path d="M58 46V89m-32 0 30-43m58 43-56-43M183 46V89m-31 0 31-43m29 43-29-43" stroke="#A77F50" stroke-width="3"/>'
   +'<path d="M22 87Q57 111 117 87Q111 127 70 124Q30 124 22 87Z" fill="url(#f3Wood)" stroke="#895936" stroke-width="3"/>'
   +'<path d="M145 87Q183 111 219 87Q213 127 181 124Q155 124 145 87Z" fill="url(#f3Wood)" stroke="#895936" stroke-width="3"/>'
   +'<circle cx="70" cy="87" r="28" fill="#F2D19B" stroke="#A66C40" stroke-width="5"/><path d="M70 59A28 28 0 0 1 70 115Z" fill="url(#f3Apple)"/>'
   +'<circle cx="181" cy="87" r="28" fill="#F2D19B" stroke="#A66C40" stroke-width="5"/><path d="M181 59A28 28 0 0 1 181 115Z" fill="url(#f3Apple)"/><path d="M153 87H209M181 59V115" stroke="#A16B45" stroke-width="3"/>';
 }
 if(type==='sort'){
  p='<ellipse cx="121" cy="125" rx="100" ry="13" fill="#74502C" opacity=".2" filter="url(#f3Shadow)"/>'
   +'<path d="M44 84Q34 111 61 126H181Q207 107 201 84Z" fill="url(#f3Wood)" stroke="#89532D" stroke-width="5"/>'
   +Array.from({length:5},(_,i)=>'<path d="M'+(60+i*30)+' 85Q'+(50+i*30)+' 110 '+(60+i*30)+' 125" stroke="#F2C48A" stroke-width="5" fill="none"/>').join('')
   +'<path d="M38 78Q115 109 203 78" fill="none" stroke="#8E522D" stroke-width="13" stroke-linecap="round"/>'
   +'<path d="M56 76Q115 97 186 76" fill="none" stroke="#E7B679" stroke-width="7" stroke-linecap="round"/>'
   +'<path d="M58 78L68 40Q92 27 105 69Z" fill="#F6C258" stroke="#B17A32" stroke-width="4"/>'
   +'<path d="M102 75L109 27Q142 28 146 71Z" fill="url(#f3Apple)" stroke="#A65A43" stroke-width="4"/>'
   +'<path d="M144 77L151 45Q176 31 193 74Z" fill="url(#f3Blue)" stroke="#477E9F" stroke-width="4"/>'
   +'<g transform="translate(38 14) rotate(-12)"><rect width="43" height="49" rx="7" fill="#F7EAD2" stroke="#BA8958" stroke-width="4"/><text x="22" y="33" font-size="24" font-weight="bold" text-anchor="middle" fill="#6E3F31">½</text></g>'
   +'<g transform="translate(164 9) rotate(11)"><rect width="45" height="51" rx="7" fill="#F7EAD2" stroke="#BA8958" stroke-width="4"/><text x="23" y="35" font-size="25" font-weight="bold" text-anchor="middle" fill="#6E3F31">¼</text></g>';
 }
 if(type==='convert'){
  p='<ellipse cx="119" cy="124" rx="94" ry="13" fill="#7E573C" opacity=".22" filter="url(#f3Shadow)"/>'
   +'<path d="M29 95Q98 84 207 94L196 127Q112 140 32 123Z" fill="url(#f3Wood)" stroke="#9F693B" stroke-width="4"/>'
   +'<g transform="translate(23 30) rotate(-7 37 45)"><rect x="0" y="0" width="67" height="81" rx="10" fill="url(#f3Pastry)" stroke="#BE8B55" stroke-width="4"/><text x="34" y="34" text-anchor="middle" font-size="31" font-weight="bold" fill="#74402C">1</text><path d="M14 43H53" stroke="#74402C" stroke-width="4"/><text x="34" y="70" text-anchor="middle" font-size="31" font-weight="bold" fill="#74402C">2</text></g>'
   +'<g transform="translate(92 21) rotate(2 42 49)"><rect x="0" y="0" width="87" height="90" rx="12" fill="#F5CE7E" stroke="#C39543" stroke-width="4"/><text x="43" y="56" text-anchor="middle" font-size="30" font-weight="bold" fill="#7D4F30">50%</text></g>'
   +'<g transform="translate(175 37) rotate(9 19 35)"><rect width="57" height="73" rx="9" fill="#C8E0EB" stroke="#7A9BB0" stroke-width="4"/><text x="28" y="48" text-anchor="middle" font-size="23" font-weight="bold" fill="#3A667C">0,5</text></g>'
   +'<path d="M77 18l7-14m90 10 14-10" stroke="#E6B34E" stroke-width="5" stroke-linecap="round"/>';
 }
 if(type==='mastery'){
  p='<ellipse cx="116" cy="128" rx="104" ry="13" fill="#74502C" opacity=".2" filter="url(#f3Shadow)"/>'
   +'<path d="M22 110Q48 88 68 92Q98 49 132 73Q166 30 205 93L215 126Q124 145 21 126Z" fill="#81A46A" stroke="#587C55" stroke-width="3"/>'
   +'<path d="M41 121Q65 101 90 115Q115 90 133 103Q162 75 193 111" fill="none" stroke="#F4DAA1" stroke-width="11" stroke-dasharray="18 11" stroke-linecap="round"/>'
   +'<path d="M112 74L130 15" stroke="#866040" stroke-width="5"/><path d="M130 15L180 26 131 48Z" fill="#DC6F53" stroke="#A04A38" stroke-width="3"/>'
   +'<path d="M62 106L78 61L94 106Z" fill="#467F55"/><path d="M54 89L78 47L103 89Z" fill="#71A35D"/>'
   +'<path d="M163 106L178 62L193 106Z" fill="#43805A"/><path d="M157 89L178 43L200 89Z" fill="#74A764"/>'
   +'<path d="M115 75v41h35V80l-15-13Z" fill="#BB8659" stroke="#8B5D39" stroke-width="3"/><path d="M109 80l20-25 25 27Z" fill="#F0B46B" stroke="#966239" stroke-width="3"/>'
   +'<path d="M128 115V93h13v22" fill="#7D543E"/><path d="M33 24l5-15 5 15 16 1-13 9 5 15-13-10-12 10 4-15-13-9Z" fill="#F8CB63" stroke="#C99844" stroke-width="2"/>';
 }
 return '<svg class="fr2-illustration fr2-illustration-'+type+'" viewBox="0 0 240 150" role="presentation" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">'+grad+p+'</svg>';
}
function loosePieceSvg(denominator,slot){
  const d=clamp(Number(denominator)||4,2,12),index=clamp(Number(slot)||0,0,d-1);
  const cx=57,cy=61,r=44,arc=Math.PI*2/d,a0=-Math.PI/2+index*arc,a1=a0+arc;
  const point=t=>({x:cx+r*Math.cos(t),y:cy+r*Math.sin(t)});
  const p0=point(a0),p1=point(a1),sector=[{x:cx,y:cy},p0,p1];
  for(let k=-4;k<=8;k++){
    const angle=k*Math.PI/2;
    if(angle>a0+1e-7&&angle<a1-1e-7)sector.push(point(angle));
  }
  // Crop each cake wedge to its real silhouette. The earlier full-circle
  // viewBox made the loose pieces tiny red specks on a child's iPhone.
  const minX=Math.min(...sector.map(p=>p.x)),maxX=Math.max(...sector.map(p=>p.x));
  const minY=Math.min(...sector.map(p=>p.y)),maxY=Math.max(...sector.map(p=>p.y));
  const pad=10,side=Math.max(maxX-minX,maxY-minY)+pad*2;
  const left=(minX+maxX-side)/2,top=(minY+maxY-side)/2,id='fr2Loose'+d+'-'+index;
  const n=x=>x.toFixed(2);
  const outline='M '+cx+' '+cy+' L '+n(p0.x)+' '+n(p0.y)+' A '+r+' '+r+' 0 0 1 '+n(p1.x)+' '+n(p1.y)+' Z';
  return '<svg class="fr2-loose-piece" viewBox="'+n(left)+' '+n(top)+' '+n(side)+' '+n(side)+'" aria-hidden="true" focusable="false">'
    +'<defs><radialGradient id="'+id+'" cx="28%" cy="20%"><stop stop-color="#F8BE99"/><stop offset=".5" stop-color="#DC6B54"/><stop offset="1" stop-color="#A64039"/></radialGradient></defs>'
    +'<path d="'+outline+'" transform="translate(2 3)" fill="#B27D44" opacity=".28"/>'
    +'<path d="'+outline+'" fill="url(#'+id+')" stroke="#DAA36A" stroke-width="4" stroke-linejoin="round"/>'
    +'<path d="M'+cx+' '+cy+'L'+n(p0.x)+' '+n(p0.y)+'" stroke="#F9D6AA" stroke-width="2.5" opacity=".8"/></svg>';
}

function miniArt(type){return cardIllustration(type)}
function card(type,subtitle){
 return cta('go','<div class="fr2-card-art">'+miniArt(type)+'</div><strong>'+titles[type]+'</strong><small>'+subtitle+'</small><span class="fr2-card-arrow" aria-hidden="true">›</span>','fr2-home-card fr2-card-'+type,'data-page="'+type+'"');
}
function home(){
  return '<section class="fr2-home fr4-home fr6-more">'+sign('Flere leker','Du kan også prøve noe helt annet!')
    +'<div class="fr2-intro"><span>✦ Du kan alltid gå tilbake til kaken ✦</span></div>'
    +'<div class="fr2-home-grid">'
    +card('explore','Se den samme brøken på nye måter')
    +card('equal','Oppdag når forskjellige brøker er like')
    +card('sort','Finn den minste og største')
    +card('convert','Prøv prosent og desimaltall')
    +card('mastery','Se hva du har utforsket')
    +'</div><div class="fr4-home-foreground" aria-hidden="true"></div>'
    +mascot('Det er du som bestemmer hva vi skal leke med!',true)+'</section>';
}

function adjustField(field){
  const count=field==='n',plain=count?'Fylte deler':'Like deler',term=count?'Teller':'Nevner';
  const val=u.build[field],min=count?0:2,max=count?u.build.d:12;
  return '<div class="fr2-adjust fr6-adjust fr6-adjust-'+field+'" data-field="'+field+'"><div class="fr2-adjust-heading"><b>'+plain+'</b><small>'+term+'</small></div>'
    +'<div class="fr2-adjust-row">'+cta('adjust','−','fr2-adjust-btn minus','data-field="'+field+'" data-step="-1" aria-label="Færre '+plain.toLowerCase()+'" '+(val<=min?'disabled':''))+'<strong>'+val+'</strong>'
    +cta('adjust','+','fr2-adjust-btn plus','data-field="'+field+'" data-step="1" aria-label="Flere '+plain.toLowerCase()+'" '+(val>=max?'disabled':''))+'</div></div>';
}

function commonFractions(){
 return '<div class="fr2-presets fr4-presets" aria-label="Vanlige brøker">'+PRESETS.map(([n,d])=>cta('preset',
 '<span class="fr4-preset-pie">'+fractionSvg(n,d,'preset')+'</span>'+frac(n,d),
 'fr2-preset '+(u.explore.n===n&&u.explore.d===d?'selected':''),
 'data-n="'+n+'" data-d="'+d+'" aria-label="Vis '+n+' av '+d+' deler"')).join('')+'</div>';
}
function viewIllustration(view){
 const frame='<svg viewBox="0 0 64 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
 const end='</svg>';
 if(view==='circle')return frame+'<circle cx="31" cy="25" r="20" fill="#FAE4BF" stroke="#A77B4C" stroke-width="3"/><path d="M31 25V5A20 20 0 0 1 51 25Z" fill="#DD6A59" stroke="#A45144" stroke-width="2"/><path d="M31 25H11A20 20 0 0 0 31 45Z" fill="#E8B54E" stroke="#A77B4C" stroke-width="2"/><path d="M31 25V45A20 20 0 0 0 51 25Z" fill="#E18E45" stroke="#A77B4C" stroke-width="2"/><path d="M11 25H51M31 5V45" stroke="#FFF5DF" stroke-width="2"/>'+end;
 if(view==='bar')return frame+'<rect x="4" y="12" width="56" height="29" rx="6" fill="#F7E6CB" stroke="#936F56" stroke-width="3"/><rect x="7" y="15" width="25" height="23" rx="3" fill="#D46A57"/><path d="M32 14V39M45 14V39" stroke="#A37D5E" stroke-width="2"/>'+end;
 if(view==='grid')return frame+Array.from({length:16},(_,i)=>'<rect x="'+(6+(i%4)*13)+'" y="'+(2+Math.floor(i/4)*12)+'" width="11" height="10" rx="2" fill="'+(i<7?'#D6795C':'#FFF5E1')+'" stroke="#947258" stroke-width="1.5"/>').join('')+end;
 return frame+'<path d="M15 7H46L42 45H19Z" fill="#E4F0F2" stroke="#688F9C" stroke-width="3"/><path d="M20 26H43L42 45H23Z" fill="#78B8CC"/><path d="M45 15Q62 15 57 31Q55 38 43 36" fill="none" stroke="#688F9C" stroke-width="5"/><path d="M34 9V43" stroke="#91B5B8" stroke-width="1.5"/>'+end;
}
function explore(){
  const x=u.build,modes=[['circle','Kake'],['bar','Stripe'],['grid','Ruter'],['glass','Målebeger']];
  const caption=x.n===0?'Ingen deler er fylt.':x.n===x.d?'Alt er fylt. En hel!':x.n+' av '+x.d+' like deler er fylt.';
  const speech=x.n===0?'Trykk på en del!':x.n===x.d?'Det er en hel!':x.n+' av '+x.d+' deler.';
  return '<section class="fr2-explore fr4-explore fr5-explore fr6-explore">'+labIntro('Se på nye måter','Den samme brøken, flere former!')
    +'<div class="fr2-stage fr2-explore-stage fr4-explore-stage fr5-explore-stage"><div class="fr2-stage-main fr4-stage-main"><div class="fr2-main-illustration">'+presentation(x.n,x.d,x.mode,true,x.filled)+'</div><div class="fr2-main-value">'+frac(x.n,x.d)+'</div></div>'
    +'<div class="fr4-scene-fox fr5-scene-fox" data-fr-action="fox-help" role="button" tabindex="0" aria-label="Trykk på reven for hjelp og opplesning">'+fox()+'</div><div class="fr4-scene-speech" role="status" aria-live="polite">'+speech+'<span aria-hidden="true">♥</span></div>'
    +'<div class="fr4-stage-caption">'+caption+'</div></div>'
    +'<div class="fr2-controls fr4-controls fr5-controls fr6-controls">'+adjustField('n')+adjustField('d')+'</div>'
    +'<div class="fr2-views fr4-views fr5-view-picker" role="group" aria-label="Velg brøkvisning">'+modes.map(([k,label])=>cta('view','<span class="fr4-mode-art">'+viewIllustration(k)+'</span><b>'+label+'</b>','fr2-view '+(x.mode===k?'active':''),'data-view="'+k+'" aria-pressed="'+(x.mode===k)+'"')).join('')+'</div>'
    +'<div class="fr2-soft-section fr4-common"><strong>Prøv disse brøkene</strong>'+commonFractions()+'</div></section>';
}

function labIntro(title,subtitle){
 return '<div class="fr5-lab-intro"><h1>'+title+'</h1><p>'+subtitle+'</p></div>';
}
function foxHint(){
 const x=u.page==='build'?u.build:u.explore;
 if(x.n===0)return 'Du har null av '+x.d+' deler. Trykk på kaken eller på en løs bit for å fylle én del.';
 if(x.n===x.d)return 'Alle '+x.d+' delene er fylt. Det er én hel!';
 if(x.d%2===0&&x.n===x.d/2)return 'Du har bygget en halv! '+x.n+' av '+x.d+' er like mye som 1 av 2.';
 return 'Du har '+x.n+' av '+x.d+' like deler. Telleren er '+x.n+', antallet fargelagte deler. Nevneren er '+x.d+', antallet like deler.';
}
function foxSpeak(){
 // Help is visible even when speech synthesis or Norwegian voices are absent.
 const x=u.page==='build'?u.build:u.explore,help=foxHint();
 const bubble=document.querySelector('#'+ROOT+' '+(u.page==='build'?'.fr5-fox-bubble':'.fr4-scene-speech'));
 if(bubble){
  bubble.textContent=u.page==='build'?(x.n===x.d?'Du har én hel!':x.n===0?'Trykk på et stykke!':x.d%2===0&&x.n*2===x.d?'Det er en halv!':'Du har fylt '+x.n+' av '+x.d+'!'):help;
  bubble.classList.add('fr5-help-open');
  bubble.setAttribute('role','status');
 }
 // Speak only after a deliberate tap, never while changing individual pieces.
 try{
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
  window.speechSynthesis.cancel();
  const utterance=new window.SpeechSynthesisUtterance(help);
  utterance.lang='nb-NO';utterance.rate=.88;
  window.speechSynthesis.speak(utterance);
 }catch(_){}
}

// The cake, numeric fraction and both equivalent forms share one source of truth.
function fractionEquivalents(n,d){
 const fmt=formatValue(n,d);
 return '<div class="fr7-equivalent-tiles" role="group" aria-label="Samme mengde som '+n+' av '+d+'">'
  +'<div class="fr7-equivalent-tile"><span>Desimaltall</span><strong>'+fmt.dec+'</strong></div>'
  +'<div class="fr7-equivalent-tile"><span>Prosent</span><strong>'+fmt.pct+'</strong></div></div>'
  +(!fmt.exact?'<small class="fr7-approx-note">≈ betyr omtrent. Desimaltallet fortsetter videre.</small>':'');
}
function build(){
  const x=u.build,half=x.d%2===0&&x.n*2===x.d;
  const questStatus=u.halfQuest?(half?'Du fant en halv! '+x.n+'/'+x.d+' = 1/2. Vil du leke videre?':'Kan du lage en halv kake? Fyll like mye som halvparten.'):'Utforsk kaken fritt, eller prøv en liten utfordring.';
  const status=x.n===0?'Trykk på et stykke!':x.n===x.d?'Du har én hel!':half?'Det er en halv!':x.n+' av '+x.d+'!';
  // A tray wedge represents one exact empty sector, not an infinite generic supply.
  const remaining=Array.from({length:x.d},(_,i)=>i).filter(i=>!x.filled.includes(i));
  return '<section class="fr2-build fr4-build fr5-build fr6-workshop fr8-scene" data-fr8-quest="'+(u.halfQuest?'active':'free')+'" data-fr8-found="'+(u.halfQuest&&half?'true':'false')+'">'+labIntro('Brøklaben',u.halfQuest?'Kan du lage en halv kake?':'Trykk på et kakestykke og se hva som skjer!')
   +'<div class="fr2-build-workshop fr4-build-stage fr5-build-stage fr6-stage">'+fr8Landscape()
   +'<div class="fr2-build-target fr5-build-target" data-fr-drop="1"><div class="fr4-build-woodhead">Kaken din</div><div class="fr2-fabric">'+fractionSvg(x.n,x.d,'builder',true,x.filled)+'</div><p>Trykk på et stykke for å fylle eller tømme det.</p></div>'
   +'<div class="fr5-build-aside"><div class="fr5-live-result fr6-result" role="status" aria-live="polite" aria-atomic="true"><span>Du har fylt</span>'+frac(x.n,x.d)+'<small>'+x.n+' av '+x.d+' like deler</small></div>'
   +'<div class="fr7-tablet-equivalents"><div class="fr7-values-heading">Samme mengde som</div>'+fractionEquivalents(x.n,x.d)+'</div>'
   +'<div class="fr2-guide fr5-fox-mentor fr8-companion"><button type="button" class="fr8-speak" data-fr-action="fox-help" aria-label="Trykk på trollet for frivillig hjelp og opplesning">'+fr8Troll()+'<span class="fr5-fox-bubble">'+status+' <span aria-hidden="true">🔊</span></span></button>'+cta('cycle-troll','↻','fr8-cycle-troll','aria-label="Bytt til neste troll"')+'</div></div>'
   +'<div class="fr2-wood-tray fr5-piece-tray fr6-piece-tray"><span class="fr2-tray-title">Løse biter</span>'
   +'<div class="fr2-spare-pieces">'+(remaining.length?remaining.map(i=>cta('add',loosePieceSvg(x.d,i),'fr2-spare','data-fr-pick="1" data-piece-index="'+i+'" aria-label="Legg kakestykke '+(i+1)+' av '+x.d+' i kaken"')).join(''):'<span class="fr6-empty-tray">Alle bitene er i kaken!</span>')+'</div>'
   +'<small>Trykk eller dra en bit inn</small></div>'
   +'</div><div class="fr2-controls fr4-controls fr5-controls fr6-controls">'+adjustField('n')+adjustField('d')+'</div>'
   +'<div class="fr7-mobile-discovery">'+cta('toggle-equivalents',u.showEquivalents?'Skjul desimaltall og prosent':'Se desimaltall og prosent','fr7-equivalents-toggle','aria-expanded="'+u.showEquivalents+'" aria-controls="fr7-mobile-values"')
   +'<div id="fr7-mobile-values" class="fr7-mobile-equivalents" '+(u.showEquivalents?'':'hidden')+'><div class="fr7-values-heading">Samme mengde som</div>'+fractionEquivalents(x.n,x.d)+'</div></div>'
   +'<div class="fr8-quest" role="group" aria-label="Frivillig brøkoppdagelse"><span class="fr8-quest-star" aria-hidden="true">✦</span><span class="fr8-quest-text" role="status" aria-live="polite">'+questStatus+'</span>'+cta('half-quest',u.halfQuest?'Lek fritt':'Prøv en halv','fr8-quest-button','aria-pressed="'+u.halfQuest+'"')+'</div>'
    +'<div class="fr2-actions">'+cta('reset','Tøm kaken','fr2-secondary')+cta('next-build','Del kaken på nytt ›','fr2-primary')+'</div></section>';
}

function eqCurrent(){return EQ[u.equal%EQ.length]}
function equalScreen(){
 const q=eqCurrent(),l=q.a,r=q.b,isEqual=equal(l,r),answered=u.equalGuess!==null,discovered=answered&&isEqual===(u.equalGuess==='equal');
 return '<section class="fr2-equal">'+sign('Like mye?','Forskjellige brøker kan vise like mye.')
 +'<div class="fr2-trail"><span>Oppdagelse '+(u.equal%EQ.length+1)+' av '+EQ.length+'</span><div class="fr2-trail-nodes">'+Array.from({length:EQ.length},(_,i)=>'<i class="'+(i<=u.equal%EQ.length?'on':'')+'"></i>').join('')+'</div></div>'
 +'<div class="fr2-scale-stage"><div class="fr2-scale"><div class="fr2-scale-beam"></div><div class="fr2-scale-sides"><div class="fr2-scale-plate"><div class="fr2-scale-label">'+frac(l[0],l[1])+'</div>'+fractionSvg(l[0],l[1],'compare')+'</div><div class="fr2-scale-mid"><b>?</b></div><div class="fr2-scale-plate"><div class="fr2-scale-label">'+frac(r[0],r[1])+'</div>'+fractionSvg(r[0],r[1],'compare')+'</div></div><div class="fr2-scale-base">◆</div></div></div>'
  +(discovered?'<div class="fr2-aha" role="status"><span aria-hidden="true">✦</span><div><small>Se hva du oppdaget!</small><strong>'+l[0]+'/'+l[1]+' '+(isEqual?'=':'≠')+' '+r[0]+'/'+r[1]+'</strong></div><span aria-hidden="true">✦</span></div>':'')
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
 const [n,d]=CONVERSIONS[u.convert%CONVERSIONS.length],fmt=formatValue(n,d),comparisonSymbol=fmt.exact?'=':'≈';
 return '<section class="fr2-convert">'+sign('Brøk, prosent og desimal','Samme del – tre måter å skrive det på!')
 +'<div class="fr2-convert-focus"><span class="fr2-wood-tag">Se på denne:</span><div class="fr2-convert-figure">'+fractionSvg(n,d,'large')+'<p>'+n+' av '+d+' like deler er fargelagt.</p></div>'
 +'<div class="fr2-conversion-row"><div><small>Brøk</small>'+frac(n,d)+'</div><span>'+comparisonSymbol+'</span><div><small>Prosent</small><strong>'+fmt.pct.replace(/^≈ /,'')+'</strong></div><span>'+comparisonSymbol+'</span><div><small>Desimal</small><strong>'+fmt.dec.replace(/^≈ /,'')+'</strong></div></div>'
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
 const journey=tags.map(([kind,title,icon],i)=>'<div class="fr2-journey-stop '+(counts[i]>0?'visited':'')+'"><span class="fr2-journey-medal" aria-hidden="true">'+(counts[i]>0?'★':icon)+'</span><small>'+title+'</small></div>').join('');
 return '<section class="fr2-mastery">'+sign('Min mestring','Her er det du har oppdaget i Brøklaben!')
 +'<div class="fr2-mastery-banner">'+fox()+'<div><small>Dine brøkeeventyr</small><strong>'+discoveries+' oppdagelser</strong><p>Hver oppdagelse teller. Du kan alltid utforske noe på nytt.</p></div><span class="fr2-award-star" aria-hidden="true">★</span></div>'
 +'<div class="fr2-master-journey"><div class="fr2-journey-heading"><strong>Oppdagelsesstien din</strong><small>'+counts.filter(n=>n>0).length+' av 5 aktiviteter utforsket. Alle kan prøves igjen.</small></div><div class="fr2-journey-stops">'+journey+'</div></div>'
 +'<h2 class="fr2-section-title">Dette har du prøvd</h2><div class="fr2-master-grid">'+tags.map(([k,title,icon],i)=>cta('go','<span class="fr2-master-icon" aria-hidden="true">'+icon+'</span><strong>'+title+'</strong><small>'+(counts[i]===0?'En oppdagelse venter':counts[i]+' oppdagelser')+'</small>','fr2-master-tile','data-page="'+(k==='explored'?'explore':k==='built'?'build':k==='equal'?'equal':k==='sorted'?'sort':'convert')+'"')).join('')+'</div>'
 +'<div class="fr2-next-suggestion"><span aria-hidden="true">🗺️</span><div><small>Prøv dette neste</small><strong>'+titles[next]+'</strong><p>Alle aktivitetene er åpne, også dem du kjenner godt.</p></div>'+cta('go','›','fr2-next-arrow','data-page="'+next+'" aria-label="Åpne '+titles[next]+'"')+'</div>'+mascot('Nysgjerrighet er superkraften din!')+'</section>';
}
function render(){
 const root=document.getElementById(ROOT);if(!root)return;svgId=0;
 const content=u.page==='home'?home():u.page==='explore'?explore():u.page==='build'?build():u.page==='equal'?equalScreen():u.page==='sort'?sorting():u.page==='convert'?convert():mastery();
 root.innerHTML='<div class="fr2-shell '+(u.page==='build'?'fr8-shell ':'')+(grade()<=2?'fr2-young':grade()<=4?'fr2-middle':'fr2-older')+'"><div class="fr2-world-art" aria-hidden="true"></div><div class="fr2-content">'+topBar()+content+screenTabs()+'</div></div>';
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
function applyBuildPieces(parts,notice=''){
  const x=u.build,before=x.n,previous=x.filled.slice();
  x.filled=[...new Set(parts)].filter(i=>Number.isInteger(i)&&i>=0&&i<x.d).sort((a,b)=>a-b);
  x.n=x.filled.length;
  u.lastChanged=x.filled.find(i=>!previous.includes(i))??-1;
  if(x.n>0)mark('built',key(x.n,x.d));
  if(u.page==='explore')mark('explored',key(x.n,x.d));
  x.notice=notice;
  render();
  // React only to real, mathematically meaningful discoveries.
  if(u.halfQuest&&x.d%2===0&&x.n*2===x.d)u.halfQuestWon=true;
  if(x.n!==before&&x.n>0&&(x.n===x.d||x.d%2===0&&x.n*2===x.d)){
    try{requestAnimationFrame(()=>{
      const host=document.querySelector('#fraction-lab-root '+(u.page==='build'?'.fr5-fox-mentor':'.fr5-scene-fox'));
      if(u.page==='build'&&host?.querySelector('.fr8-troll'))host.classList.add('fr8-celebrate');
       else window.LARIA_FOX_PRESENCE?.react?.('celebrate',host);
    })}catch(_){}
  }
}
function addBuildPiece(notice='Du la til én del!',pieceIndex=null){
  const x=u.build;
  const next=pieceIndex===null?Array.from({length:x.d},(_,i)=>i).find(i=>!x.filled.includes(i)):
    Number.isInteger(pieceIndex)&&pieceIndex>=0&&pieceIndex<x.d&&!x.filled.includes(pieceIndex)?pieceIndex:undefined;
  if(next===undefined)return;
  applyBuildPieces([...x.filled,next],notice);
}
function remapFilledPieces(filled,oldD,newD){
  // Changing the number of equally-sized pieces should not also silently
  // change the numerator, except when it now exceeds the total piece count.
  const count=Math.min(filled.length,newD),mapped=[];
  for(const i of filled){
    const target=Math.min(newD-1,Math.floor((i+.5)*newD/oldD));
    if(!mapped.includes(target))mapped.push(target);
  }
  for(let i=0;mapped.length<count&&i<newD;i++)if(!mapped.includes(i))mapped.push(i);
  return mapped.sort((a,b)=>a-b);
}
function adjust(field,step){
  const x=u.build;
  if(field==='d'){
    const newD=clamp(x.d+step,2,12);
    if(newD===x.d)return;
    const pieces=remapFilledPieces(x.filled,x.d,newD);
    x.d=newD;
    applyBuildPieces(pieces);
  }else{
    const goal=clamp(x.n+step,0,x.d);
    if(goal<x.n)applyBuildPieces(x.filled.slice(0,goal));
    else if(goal>x.n)addBuildPiece();
    else render();
  }
}
function setPiece(index){
  if(u.page!=='build'&&u.page!=='explore')return;
  const x=u.build;
  if(!Number.isInteger(index)||index<0||index>=x.d)return;
  const filled=x.filled.includes(index);
  applyBuildPieces(filled?x.filled.filter(i=>i!==index):[...x.filled,index],
    filled?'Du tok ut et stykke.':'Du la til ett stykke.');
}
function setGlassFill(e,control){
  const rect=control.getBoundingClientRect();
  if(!rect.height)return;
  const visualY=(e.clientY-rect.top)/rect.height*220;
  const ratio=Math.max(0,Math.min(1,(203-visualY)/175));
  const goal=clamp(Math.round(ratio*u.build.d),0,u.build.d);
  applyBuildPieces(Array.from({length:goal},(_,i)=>i));
}

function moveSort(from,to){to=clamp(to,0,u.sortOrder.length-1);if(from===to)return;const moved=u.sortOrder.splice(from,1)[0];u.sortOrder.splice(to,0,moved);u.sortResult='';render();}
function nextSort(){u.sortIndex=(u.sortIndex+1)%SORT.length;u.sortOrder=[2,0,1];u.sortResult='';render();}
function actionHandler(e){
 const root=document.getElementById(ROOT),btn=e.target.closest('[data-fr-action]');if(!btn||!root||!root.contains(btn))return;
 const a=btn.dataset.frAction;
 // Normal taps must always work, including immediately after a drag or reset.
 if(a==='back'){
  if(u.page!=='build'){enter('build');return;}
  // The actual premium lab overrides the legacy openFractionLab. Keep the
  // same Tallenga return contract when opened from the painted Brøklaben sign.
  if(returnToLockedJourney||returnToMathSubject){
   returnToLockedJourney=false;returnToMathSubject=false;
   try{openSubject('math')}catch(_){}
   return;
  }
  try{if(typeof window.LARIA_RETURN_TO_BASECAMP==='function'&&window.LARIA_RETURN_TO_BASECAMP())return}catch(_){}
  try{openSubject('math')}catch(_){}
  return;
 }
 if(a==='fox-help'){foxSpeak();return;}
  if(a==='half-quest'){u.halfQuest=!u.halfQuest;u.halfQuestWon=false;render();return;}
  if(a==='cycle-troll'){const i=FR8_TROLLS.findIndex(x=>x.id===u.troll);u.troll=FR8_TROLLS[(i+1)%FR8_TROLLS.length].id;render();const b=document.querySelector('#'+ROOT+' .fr8-cycle-troll');b?.focus({preventScroll:true});return;}
 if(a==='toggle-equivalents'){
  u.showEquivalents=!u.showEquivalents;
  if(u.showEquivalents)mark('converted',key(u.build.n,u.build.d));
  render();
  const button=document.querySelector('#'+ROOT+' .fr7-equivalents-toggle');
  button?.focus({preventScroll:true});
  if(u.showEquivalents)requestAnimationFrame(()=>document.querySelector('#'+ROOT+' #fr7-mobile-values')?.scrollIntoView({block:'nearest'}));
  return;
 }
  if(a==='go'){enter(btn.dataset.page);return;}
 if(a==='view'){u.build.mode=btn.dataset.view;mark('explored',key(u.build.n,u.build.d));render();return;}
 if(a==='preset'){const n=Number(btn.dataset.n),d=Number(btn.dataset.d);u.build.d=d;applyBuildPieces(Array.from({length:n},(_,i)=>i));mark('explored',key(n,d));return;}
 if(a==='adjust'){
  const field=btn.dataset.field,step=Number(btn.dataset.step);
  // Render recreates the controls; keep keyboard focus on the corresponding
  // new button so a child can press repeatedly without losing their place.
  const hadFocus=document.activeElement===btn;
  adjust(field,step);
  if(hadFocus){
   const next=root.querySelector('[data-fr-action="adjust"][data-field="'+field+'"][data-step="'+step+'"]');
   next?.focus({preventScroll:true});
  }
  return;
 }
 if(a==='piece'){setPiece(Number(btn.dataset.piece));return;}
  if(a==='glass-fill'){setGlassFill(e,btn);return;}
 if(a==='add'){addBuildPiece('Du la til én del!',Number(btn.dataset.pieceIndex));return;}
 if(a==='reset'){applyBuildPieces([],'Nå kan du bygge helt på nytt.');return;}
 if(a==='next-build'){u.build.d=DENOMS[(DENOMS.indexOf(u.build.d)+1)%DENOMS.length];applyBuildPieces([],'Prøv å bygge en ny brøk!');return;}
 if(a==='guess'){u.equalGuess=btn.dataset.guess;const q=eqCurrent(),correct=equal(q.a,q.b)===(u.equalGuess==='equal');if(correct)mark('equal',key(q.a[0],q.a[1])+'='+key(q.b[0],q.b[1]));render();return;}
 if(a==='next-equal'){u.equal=(u.equal+1)%EQ.length;u.equalGuess=null;render();return;}
 if(a==='sort-shift'){moveSort(Number(btn.dataset.position),Number(btn.dataset.position)+Number(btn.dataset.direction));return;}
 if(a==='sort-check'){u.sortResult=sorted()?'win':'try';if(u.sortResult==='win')mark('sorted','set-'+u.sortIndex);render();return;}
 if(a==='sort-next'){nextSort();return;}
 if(a==='convert-example'){u.convert=Number(btn.dataset.example);const q=CONVERSIONS[u.convert];mark('converted',key(q[0],q[1]));render();return;}
 if(a==='next-convert'){u.convert=(u.convert+1)%CONVERSIONS.length;const q=CONVERSIONS[u.convert];mark('converted',key(q[0],q[1]));render();return;}
}
function keyHandler(e){
 const foxButton=e.target.closest('[data-fr-action="fox-help"]');
  if(foxButton&&(e.key==='Enter'||e.key===' ')){e.preventDefault();foxSpeak();return;}
  const glass=e.target.closest('[data-fr-action="glass-fill"]');
  if(glass&&['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Enter',' '].includes(e.key)){
    e.preventDefault();adjust('n',e.key==='ArrowDown'||e.key==='ArrowLeft'?-1:1);return;
  }
  const t=e.target.closest('[data-fr-action="piece"]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setPiece(Number(t.dataset.piece))}
}
function clearDrag(){
 if(drag?.ghost)drag.ghost.remove();
 drag=null;
 document.querySelectorAll('.fr2-drag-over').forEach(x=>x.classList.remove('fr2-drag-over'));
}
function pointerDown(e){
 dragDiagnostics.pointerDown++;
 // Leave the accessible arrow buttons clickable; capture only a deliberate card drag.
 if(e.target.closest('.fr2-sort-arrow'))return;
 const btn=e.target.closest('.fr2-spare[data-fr-pick],.fr2-sort-card[data-fr-sort]');
 // One pointer path for mouse, pen and touch avoids incompatible HTML5 drag events.
 if(!btn||e.pointerType==='mouse'&&e.button!==0)return;
 drag={type:btn.hasAttribute('data-fr-pick')?'build':'sort',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,from:Number(btn.dataset.frSort),pieceIndex:btn.hasAttribute('data-fr-pick')?Number(btn.dataset.pieceIndex):null,moved:false,ghost:null,lastX:e.clientX,lastY:e.clientY};
 try{btn.setPointerCapture(e.pointerId)}catch(_){}
}
function pointerMove(e){
 dragDiagnostics.pointerMove++;
 if(!drag||drag.pointer!==e.pointerId)return;
 const dist=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY);
 if(dist<9&&!drag.moved)return;
 if(!drag.moved){drag.moved=true;drag.ghost=document.createElement('div');drag.ghost.className='fr2-drag-ghost';drag.ghost.innerHTML=drag.type==='build'?loosePieceSvg(u.build.d,drag.pieceIndex):cardIllustration('sort');document.body.appendChild(drag.ghost);}
 drag.lastX=e.clientX;drag.lastY=e.clientY;
 if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px'}
 const el=document.elementFromPoint(e.clientX,e.clientY)?.closest(drag.type==='build'?'.fr2-build-target':'.fr2-sort-card');
 document.querySelectorAll('.fr2-drag-over').forEach(x=>x.classList.remove('fr2-drag-over'));
 if(el)el.classList.add('fr2-drag-over');
 e.preventDefault();
}
function pointerUp(e){
 dragDiagnostics.pointerUp++;
 if(!drag||drag.pointer!==e.pointerId)return;
 const {moved,type,from,pieceIndex,startX,lastX,lastY}=drag;
 let target=null;
 if(moved&&type==='build'){
  target=[...document.querySelectorAll('#fraction-lab-root .fr2-build-target')].find(el=>{
   const r=el.getBoundingClientRect();
   return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
  })||null;
 }
 if(moved&&type==='sort'){
  const cards=[...document.querySelectorAll('#fraction-lab-root .fr2-sort-card[data-fr-sort]')];
  const x=Number.isFinite(e.clientX)?e.clientX:lastX;
  // Sorting is deliberately horizontal. Selecting the closest card by x
  // survives WebKit pointer capture and slight vertical finger drift.
  const width=cards.length?cards[0].getBoundingClientRect().width:0;
  if(Math.abs(x-startX)>Math.max(13,width*.33)){
   target=cards.reduce((best,el)=>{
    const r=el.getBoundingClientRect();
    const distance=Math.abs(x-(r.left+r.right)/2);
    return !best||distance<best.distance?{el,distance}:best;
   },null)?.el||null;
   if(target&&Number(target.dataset.frSort)===from){
    target=x>startX?cards[cards.length-1]:cards[0];
   }
  }
 }
 clearDrag();
 if(moved){
  lastDragUntil=Date.now()+350;
  if(type==='build'&&target){
   addBuildPiece('Brikken er på plass!',pieceIndex);
  }else if(type==='sort'&&target){
   moveSort(from,Number(target.dataset.frSort));
  }
 }
}
window.openFractionLab=function(options){
 // Only the explicit Tallenga entry sets this. Plain Home/Utforsk launches
 // reset the flag, preserving the previously approved Basecamp return route.
 returnToLockedJourney=!!(options&&options.returnToJourney==='math');
 returnToMathSubject=!returnToLockedJourney&&!!document.querySelector('#subject-screen.active');
 document.getElementById('fraction-lab-screen')?.setAttribute('data-explore-release','explore-rc1');
 u.page='build';u.showEquivalents=false;render();try{showScreen('fraction-lab')}catch(_){}
};
const root=document.getElementById(ROOT);
if(root&&!root.dataset.fr2Bound){root.addEventListener('click',actionHandler);root.addEventListener('keydown',keyHandler);root.addEventListener('pointerdown',pointerDown);document.addEventListener('pointermove',pointerMove);document.addEventListener('pointerup',pointerUp);document.addEventListener('pointercancel',clearDrag);root.dataset.fr2Bound='1'}
const entry=document.getElementById('open-fraction-lab');if(entry)entry.onclick=window.openFractionLab;
window.LARIA_FRACTION_PREMIUM={version:'workshop-v1',open:window.openFractionLab,progress:()=>JSON.parse(JSON.stringify(progress)),snapshot:()=>JSON.parse(JSON.stringify(u)),compare:equal,format:formatValue,dragDiagnostics:()=>Object.assign({},dragDiagnostics)};
})();