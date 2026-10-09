/* Læria: Plukk og tell · illustrated, accessible 2.5D play in ten open worlds. */
(function(){
'use strict';
const E=window.LARIA_MULT_PICK_ENGINE;if(!E)return;
const KEY='laria-mult-pick-play-v1';
const SIMPLE_INTRO_KEY='laria-mult-pick-2klasse-intro-v1';
let state=E.initial(),past=[],future=[],redraw=()=>{},drag=null,suppressUntil=0,zoomGroup=null,moreOpen=false;
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v?.version===1)state=E.normalize(v)}catch(_){}
// First visit to the child-friendly version: keep the previous advanced engine intact,
// but start actual play with six large items instead of thirty tiny ones.
try{if(localStorage.getItem(SIMPLE_INTRO_KEY)!=='1'){state=E.apply(state,{type:'scenario',id:'2x3'});localStorage.setItem(SIMPLE_INTRO_KEY,'1');localStorage.setItem(KEY,JSON.stringify(state));}}catch(_){state=E.apply(state,{type:'scenario',id:'2x3'});}
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
let pickArtSerial=0;
/* Physically countable miniature storybook artwork. All scenery is separate.
   Unique gradient names per SVG prevent near-view and original objects colliding. */
function sprite(theme,index){
 const variant=(Number(index)||0)%5,uid='pkart'+(++pickArtSerial);
 const pigment=['#d63843','#d67c35','#d9b44c','#668ab1','#9964a2'][variant];
 const gradient=(key,stops)=>'<radialGradient id="'+uid+key+'" cx="25%" cy="17%" r="91%">'+stops.map(([at,c])=>'<stop offset="'+at+'" stop-color="'+c+'"/>').join('')+'</radialGradient>';
 const grad=key=>'url(#'+uid+key+')';
 const line='<path d="M7 82Q39 87 74 82" stroke="#61472e" opacity=".12" stroke-width="2" fill="none"/>';
 let defs='',shape='';
 if(theme==='strawberry'){
  defs=gradient('fruit',[['0','#ffe19a'],['.16','#ff8072'],['.51','#ee3345'],['.82','#c91731'],['1','#8c2130']]);
  defs+=gradient('leaf',[['0','#dcf4a4'],['.32','#71b64c'],['.78','#388246'],['1','#275d3c']]);
  const seeds=[[24,36],[35,32],[46,34],[58,38],[19,45],[31,44],[44,45],[57,48],[24,55],[37,56],[51,57],[31,66],[44,67],[38,75]].map(([x,y],i)=>
   '<ellipse cx="'+x+'" cy="'+y+'" rx="'+(i%3===0?1.6:1.2)+'" ry="2.15" transform="rotate('+(-22+i%6*8)+' '+x+' '+y+')" fill="#ffe9ab" stroke="#9f2b27" stroke-width=".38"/><path d="M'+(x+1)+' '+(y-3)+'l1 -1" stroke="#fff1cb" stroke-width=".7"/>').join('');
  shape='<path d="M40 24C30 15 17 22 14 34C8 48 20 65 33 78Q39 86 46 79C62 67 74 48 66 33C62 23 49 16 40 24Z" fill="'+grad('fruit')+'" stroke="#8e2c31" stroke-width="1.8"/>'+
   '<path d="M17 34C13 49 28 72 39 77" fill="none" stroke="#f9aba0" stroke-width="2.5" opacity=".7"/>'+
   '<path d="M54 31Q67 47 52 68" fill="none" stroke="#8f2631" stroke-width="2.3" opacity=".42"/>'+
   '<path d="M23 34C27 30 34 29 38 35C34 44 25 47 19 43Z" fill="#fff8dc" opacity=".2"/>'+
   seeds+
   '<path d="M40 23Q36 16 39 9" fill="none" stroke="#587443" stroke-width="4" stroke-linecap="round"/>'+
   '<g fill="'+grad('leaf')+'" stroke="#317540" stroke-width="1.1"><path d="M39 23Q24 6 15 19Q19 30 39 26Z"/><path d="M40 23Q48 3 63 17Q60 28 40 26Z"/><path d="M40 23Q30 9 31 4Q41 6 44 22Z"/><path d="M40 24Q29 25 27 35Q38 34 42 25Z"/><path d="M42 24Q52 22 57 34Q43 33 40 26Z"/></g>'+
   '<path d="M17 19Q29 20 38 24M62 18Q52 21 42 24M32 6Q39 16 41 23" fill="none" stroke="#d9e897" stroke-width="1.3" opacity=".83"/>';
 }else if(theme==='bun'){
  defs=gradient('bake',[['0','#fff7cc'],['.25','#e6b979'],['.57','#c6874e'],['.86','#99572e'],['1','#754124']]);
  defs+=gradient('icing',[['0','#fff9d7'],['.68','#e6bc86'],['1','#b47449']]);
  shape='<path d="M7 51Q8 19 31 16Q59 12 71 43Q78 66 53 77Q25 89 11 67Q6 58 7 51Z" fill="'+grad('bake')+'" stroke="#85512e" stroke-width="2.2"/>'+
   '<path d="M14 50Q17 27 39 25Q58 24 65 42Q70 60 50 69Q32 77 21 64Q15 59 22 45Q29 32 44 37Q56 42 47 54Q42 60 35 54Q31 50 39 46" fill="none" stroke="#82502d" stroke-width="8" stroke-linecap="round" opacity=".9"/>'+
   '<path d="M14 48Q19 30 37 28Q57 28 62 44Q62 58 48 64Q34 69 24 57Q22 48 34 41Q48 36 48 47Q47 54 41 52" fill="none" stroke="'+grad('icing')+'" stroke-width="5.8" stroke-linecap="round"/>'+
   '<path d="M15 54Q24 77 46 74M16 45Q22 31 32 29" fill="none" stroke="#fff5cd" stroke-width="2.6" opacity=".73"/>'+
   Array.from({length:11},(_,i)=>{const x=16+(i*19)%51,y=32+(i*31)%32;return '<circle cx="'+x+'" cy="'+y+'" r=".8" fill="#fff0c3" opacity=".79"/>';}).join('');
 }else if(theme==='mushroom'){
  defs=gradient('cap',[['0','#ffce9b'],['.16','#ed6c52'],['.55','#d63c3e'],['.85','#9a303a'],['1','#702b36']]);
  defs+=gradient('stem',[['0','#fffdeb'],['.5','#e8d2ad'],['.85','#bea179'],['1','#9d7d65']]);
  shape='<path d="M31 47Q34 61 27 75Q40 82 53 75Q45 61 49 47Z" fill="'+grad('stem')+'" stroke="#9a8068" stroke-width="1.5"/>'+
   '<path d="M32 58Q36 66 33 76" stroke="#fff9e8" stroke-width="3" opacity=".7" fill="none"/>'+
   '<path d="M7 49Q8 17 35 14Q62 9 74 49Q41 64 7 49Z" fill="'+grad('cap')+'" stroke="#8b3840" stroke-width="2.2"/>'+
   '<path d="M10 49Q42 56 71 49Q49 63 22 56Z" fill="#d9bb8c" stroke="#aa8a67" stroke-width="1.5"/>'+
   '<path d="M18 54L25 58M28 54L31 60M40 55L40 62M51 54L49 60M61 54L57 57" stroke="#8d7258" stroke-width="1.3"/>'+
   '<g fill="#fff2d2" stroke="#deb995" stroke-width=".5"><ellipse cx="28" cy="29" rx="7" ry="5" transform="rotate(-18 28 29)"/><ellipse cx="48" cy="26" rx="6" ry="5" transform="rotate(15 48 26)"/><ellipse cx="58" cy="40" rx="6" ry="3.5"/><ellipse cx="21" cy="43" rx="5" ry="3.2"/></g>'+
   '<path d="M16 36Q20 22 38 19" stroke="#fff6d8" stroke-width="3" fill="none" opacity=".52" stroke-linecap="round"/>';
 }else if(theme==='apple'){
  defs=gradient('apple',[['0','#fff0a4'],['.2','#ed8355'],['.5','#e4453f'],['.76','#bf2936'],['1','#7e2732']]);
  defs+=gradient('apleaf',[['0','#eff5a5'],['.5','#77b34c'],['1','#356a3d']]);
  shape='<path d="M39 26C24 17 11 30 12 45Q12 70 26 78Q34 83 41 79Q49 84 57 77C69 66 71 43 65 32Q58 19 41 26Z" fill="'+grad('apple')+'" stroke="#963f31" stroke-width="2"/>'+
   '<path d="M20 36Q12 55 28 73" stroke="#fff0b1" stroke-width="3.2" opacity=".51" fill="none"/>'+
   '<path d="M51 30Q63 40 56 61" stroke="#942632" stroke-width="3" opacity=".44" fill="none"/>'+
   '<path d="M41 27Q39 14 45 8" stroke="#745337" stroke-width="4" stroke-linecap="round" fill="none"/>'+
   '<path d="M42 17Q58 2 70 16Q65 30 43 23Z" fill="'+grad('apleaf')+'" stroke="#467244" stroke-width="1.2"/>'+
   '<path d="M43 23Q57 16 68 15" fill="none" stroke="#e3eda1" stroke-width="1.3"/>'+
   Array.from({length:12},(_,i)=>'<circle cx="'+(22+(i*13)%38)+'" cy="'+(38+(i*11)%34)+'" r=".7" fill="#ffecc3" opacity=".53"/>').join('');
 }else if(theme==='treasure'){
  defs=gradient('gem',[['0','#fff8e6'],['.16','#fff0b7'],['.47',pigment],['.8','#6471ae'],['1','#45466d']]);
  shape='<path d="M9 30L24 11L56 12L71 29L43 76Z" fill="'+grad('gem')+'" stroke="#6d5672" stroke-width="2"/>'+
   '<path d="M9 30H71L43 76Z" fill="#bba8ec" opacity=".18"/>'+
   '<path d="M9 30L24 11L34 30L43 76L56 12L71 29M34 30H71M24 11H56" fill="none" stroke="#fff6e8" stroke-width="2" opacity=".83"/>'+
   '<path d="M21 27L26 17L34 27L42 14" stroke="#fffdf3" stroke-width="2.5" opacity=".75" fill="none"/>';
 }else if(theme==='train'){
  defs=gradient('case',[['0','#ffe7ab'],['.3','#dd9b5e'],['.67',pigment],['1','#844b36']]);
  shape='<rect x="10" y="23" width="61" height="50" rx="8" fill="'+grad('case')+'" stroke="#5c453a" stroke-width="2.5"/>'+
   '<path d="M29 24V16Q41 8 53 16V24" fill="none" stroke="#684a32" stroke-width="6" stroke-linecap="round"/>'+
   '<path d="M19 28V68M60 28V68" stroke="#e8c88e" stroke-width="5"/>'+
   '<path d="M19 28V68M60 28V68" stroke="#9a623c" stroke-width="1.6"/>'+
   '<rect x="26" y="38" width="29" height="23" rx="5" fill="#ffebc7" opacity=".18" stroke="#ffe7b2" stroke-width="1"/>'+
   '<circle cx="40" cy="48" r="8" fill="#f6d6a1" stroke="#876148"/><path d="M35 48H46M40 43V53" stroke="#986643" stroke-width="1.5"/>'+
   '<circle cx="23" cy="74" r="4" fill="#3b3d3e"/><circle cx="58" cy="74" r="4" fill="#3b3d3e"/>';
 }else if(theme==='beach'){
  defs=gradient('shell',[['0','#fffef1'],['.16','#ffd2b0'],['.45',pigment],['.76','#bc8ab4'],['1','#8d6479']]);
  const ribs=[-3,-2,-1,0,1,2,3].map(k=>'<path d="M40 25Q'+(40+16*k)+' '+(27-Math.abs(k)*2)+' '+(40+7*k)+' 68" stroke="'+(k%2===0?'#fff7df':'#bb8590')+'" stroke-width="2.2" fill="none" opacity=".74"/>').join('');
  shape='<path d="M40 12Q53 12 63 23Q76 39 69 65Q40 82 11 65Q5 39 18 23Q29 12 40 12Z" fill="'+grad('shell')+'" stroke="#a27e82" stroke-width="2"/>'+
   '<path d="M11 62Q40 75 69 62" stroke="#fff5dd" stroke-width="3.2" fill="none"/>'+ribs+
   '<ellipse cx="40" cy="65" rx="23" ry="5" fill="#e1ab9d" opacity=".47"/>';
 }else if(theme==='farm'){
  defs=gradient('egg',[['0','#fffdf0'],['.3','#ffedc7'],['.62','#e7cb99'],['.86','#c3a271'],['1','#a18160']]);
  shape='<path d="M41 8C58 8 67 30 67 52C67 70 54 80 40 80C25 80 13 69 13 52C13 31 24 8 41 8Z" fill="'+grad('egg')+'" stroke="#ae9575" stroke-width="2"/>'+
   '<path d="M26 21Q15 41 23 59" stroke="#fffdf4" stroke-width="5" fill="none" opacity=".72" stroke-linecap="round"/>'+
   Array.from({length:19},(_,i)=>'<ellipse cx="'+(25+(i*13)%33)+'" cy="'+(26+(i*19)%41)+'" rx="'+(.7+i%3*.3)+'" ry=".9" fill="#a37e5a" opacity=".38"/>').join('');
 }else if(theme==='aquarium'){
  defs=gradient('fish',[['0','#fffbc9'],['.26','#fac66c'],['.55','#ef8151'],['.83','#e05947'],['1','#b44b44']]);
  shape='<path d="M28 43L7 22L7 65Z" fill="#f1a65a" stroke="#a66e47" stroke-width="2"/>'+
   '<path d="M26 35L44 12L52 33" fill="#df714a" stroke="#ad6545" stroke-width="1.8"/>'+
   '<path d="M24 59L44 79L52 62" fill="#df714a" stroke="#ad6545" stroke-width="1.8"/>'+
   '<path d="M18 44C19 19 65 17 72 43Q67 68 39 65Q21 62 18 44Z" fill="'+grad('fish')+'" stroke="#a46a48" stroke-width="2"/>'+
   '<path d="M36 26L36 62M43 24L43 65" stroke="#fff2ce" stroke-width="5" opacity=".87"/>'+
   '<circle cx="60" cy="39" r="6" fill="#fffdf3"/><circle cx="62" cy="39" r="3" fill="#453b35"/><circle cx="63" cy="38" r="1" fill="white"/>'+
   '<path d="M62 52Q68 55 71 50" stroke="#a66c4d" stroke-width="1.5" fill="none"/>';
 }else if(theme==='balloon'){
  defs=gradient('balloon',[['0','#fff8ce'],['.22','#ffdc9d'],['.47',pigment],['.77','#bf5171'],['1','#754577']]);
  shape='<path d="M40 8Q16 7 12 36Q11 61 40 73Q69 59 68 36Q65 8 40 8Z" fill="'+grad('balloon')+'" stroke="#936377" stroke-width="2"/>'+
   '<path d="M24 24Q15 45 30 56" stroke="#fff9e8" stroke-width="6" opacity=".65" fill="none" stroke-linecap="round"/>'+
   '<path d="M40 72L34 78H46Z" fill="#a86b53" stroke="#8e5b51" stroke-width="1"/>'+
   '<path d="M40 79Q29 84 43 88" stroke="#96785b" stroke-width="1.5" fill="none"/>';
 }
 const rotation=(variant-2)*2.1;
 return '<svg class="mp-pick-sprite mp-pick-story-object" viewBox="0 0 80 90" aria-hidden="true" focusable="false">'+
  '<defs>'+defs+'</defs><g transform="rotate('+rotation+' 40 44)">'+line+shape+'</g></svg>';
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
 const picked=w(),moving=moreOpen&&state.moveMode;
 return '<div class="mp-pick-group-grid" style="--pick-n:'+state.counts.length+'">'+state.counts.map((count,group)=>{
  const items=state.itemIds[group].map((token,i)=>'<button type="button" data-mp-action="pick-play" data-pick-action="'+(moving?'selectMove':'take')+'" data-group="'+group+'" data-token="'+token+'" class="mp-pick-object" aria-label="'+(moving?'Velg for å flytte':'Plukk')+' '+esc(picked.unit)+' '+(i+1)+' fra kurv '+(group+1)+'">'+sprite(picked.id,token)+'</button>').join('');
  const gridColumns=count>=9?5:count>=5?3:count>=3?2:Math.max(1,count);
  const advancedButtons=moreOpen?'<div class="mp-pick-vessel-actions">'+(moving?'<button type="button" data-mp-action="pick-play" data-pick-action="moveTarget" data-group="'+group+'" '+(state.moveFrom===null||state.moveFrom===group||count>=E.MAX_EACH?'disabled':'')+'>Hit ↘</button>':
   '<button type="button" data-mp-action="pick-play" data-pick-action="take" data-group="'+group+'" '+(!count?'disabled':'')+' aria-label="Plukk én fra kurv '+(group+1)+'">− 1</button><button type="button" data-mp-action="pick-play" data-pick-action="return" data-group="'+group+'" '+(!state.collected||count>=E.MAX_EACH?'disabled':'')+' aria-label="Legg én tilbake i kurv '+(group+1)+'">+ 1</button>')+'</div><button type="button" class="mp-pick-empty" data-mp-action="pick-play" data-pick-action="empty" data-group="'+group+'" '+(!count?'disabled':'')+' aria-label="Tøm hele kurv '+(group+1)+'">Tøm kurv</button>':'';
  return '<div class="mp-pick-vessel" data-group="'+group+'" role="group" aria-label="Kurv '+(group+1)+': '+count+' '+esc(picked.object)+'"><div class="mp-pick-vessel-art"><span class="mp-pick-vessel-shadow" aria-hidden="true"></span><span class="mp-pick-handle" aria-hidden="true"></span><span class="mp-pick-linen" aria-hidden="true"></span><span class="mp-pick-leaf-decoration" aria-hidden="true"></span><div class="mp-pick-objects" style="--pick-cols:'+gridColumns+'">'+items+'</div><span class="mp-pick-front" aria-hidden="true"></span><span class="mp-pick-number">'+count+'</span></div>'+advancedButtons+'<button type="button" class="mp-pick-zoom-open" data-mp-action="pick-play" data-pick-action="zoom" data-group="'+group+'" aria-haspopup="dialog" aria-label="Se kurv '+(group+1)+' større">'+(moreOpen?'🔍 Se større':'Se større')+'</button></div>';
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
function zoomSprite(theme,token){
 // Sprite creates unique gradients on each call, so WebKit closeups need no ID remapping.
 return sprite(theme,token);
}
function closeup(){
 if(zoomGroup===null||!state.itemIds[zoomGroup])return '';
 const group=zoomGroup,picked=w(),count=state.counts[group];
 const rawWorld=window.LARIA_PICK_SCENERY_V2?.scene(picked.scene)||'';
 const zoomScenery=rawWorld.replace(/(id="|url\(#)(pp[A-Za-z0-9]+)/g,(_,prefix,id)=>prefix+id+'-near');

 const objects=state.itemIds[group].map((token,i)=>'<button type="button" class="mp-pick-zoom-item" data-mp-action="pick-play" data-pick-action="'+(state.moveMode?'selectMove':'take')+'" data-group="'+group+'" data-token="'+token+'" aria-label="'+(state.moveMode?'Velg for å flytte':'Plukk')+' '+esc(picked.unit)+' '+(i+1)+' fra den forstørrede kurven">' + zoomSprite(picked.id,token)+'</button>').join('');
 return '<div class="mp-pick-zoom-overlay" data-group="'+group+'"><button type="button" class="mp-pick-zoom-backdrop" data-mp-action="pick-play" data-pick-action="zoomClose" tabindex="-1" aria-label="Lukk nærvisning"></button>'+
 '<section class="mp-pick-zoom-dialog" role="dialog" aria-modal="true" aria-label="Forstørret kurv '+(group+1)+'"><header class="mp-pick-zoom-top"><div><small>NÆRVISNING · SAMME KURV</small><strong>Kurv '+(group+1)+' · '+count+' '+esc(picked.object)+'</strong></div><button type="button" class="mp-pick-zoom-close" data-mp-action="pick-play" data-pick-action="zoomClose" aria-label="Lukk nærvisning">✕ Lukk</button></header>'+
 '<p class="mp-pick-zoom-help">Trykk på en gjenstand for å plukke den. Tallet oppdateres med én gang.</p>'+
 '<div class="mp-pick-zoom-landscape" aria-hidden="true">'+zoomScenery+'</div><div class="mp-pick-zoom-vessel"><div class="mp-pick-zoom-interior"><div class="mp-pick-zoom-objects">'+objects+'</div></div><span class="mp-pick-zoom-vessel-front" aria-hidden="true"></span></div>'+
 '<footer class="mp-pick-zoom-footer"><span>'+esc(E.equation(state).main)+'</span><b>'+count+' i kurven</b></footer></section></div>';
}

function render(){
 const eq=E.equation(state),picked=w(),sum=E.total(state);
 const prompt=state.collected===0?'Trykk på en ting i en kurv!':sum===0?'Du plukket alle! Vil du prøve igjen?':sum+' igjen! Prøv gjerne en til.';
 const advanced=moreOpen?
  '<div class="mp-pick-advanced-content">'+worlds()+
  '<div class="mp-pick-main-actions"><button type="button" data-mp-action="pick-play" data-pick-action="takeEach" '+(sum===0?'disabled':'')+'>− Én fra hver</button><button type="button" data-mp-action="pick-play" data-pick-action="moveMode" aria-pressed="'+state.moveMode+'" class="'+(state.moveMode?'selected':'')+'">'+(state.moveMode?'Avslutt flytting':'⇄ Flytt mellom')+'</button><button type="button" data-mp-action="pick-play" data-pick-action="newGroup" '+(state.counts.length>=E.MAX_GROUPS?'disabled':'')+'>+ Ny kurv</button></div>'+
  representations()+
  '<div class="mp-pick-secondary-actions mp-pick-extras"><button type="button" data-mp-action="pick-play" data-pick-action="redo" '+(!future.length?'disabled':'')+'>↷ Gjør om</button></div>'+
  '<div class="mp-pick-feedback'+(state.success?' success':'')+'" role="status">'+esc(state.message)+'</div>'+
  '<div class="mp-pick-explanation">'+(state.moveMode?'Velg en gjenstand og flytt den til en annen kurv.':eq.equal?'Like grupper kan skrives som gange.':'Ulike grupper kan vi legge sammen.')+'</div>'+
  missions()+'</div>':'';
 return '<section class="mp-pick-screen mp-pick-easy" data-pick-easy="'+(!moreOpen)+'" data-pick-world="'+picked.id+'" data-pick-scene="'+picked.scene+'">'+
 '<header class="mp-pick-heading"><span class="mp-pick-kicker">LÆRIA · UTFORSK OG LEK</span><h2>Plukk og tell</h2></header>'+
 '<div class="mp-pick-easy-intro"><img src="./lia-fox-explorer-home.webp" alt="" aria-hidden="true" loading="lazy"><div><strong>Plukk én ting!</strong><span>Se hva som skjer med tallet.</span></div><button type="button" data-mp-action="pick-play" data-pick-action="worldNext" aria-label="Bytt til en annen eventyrverden">Bytt motiv <span aria-hidden="true">↻</span></button></div>'+
 '<div class="mp-pick-stage mp-pick-stage-v2"><div class="mp-pick-stage-landscape" aria-hidden="true">'+(window.LARIA_PICK_SCENERY_V2?.scene(picked.scene)||landscape())+'</div><div class="mp-pick-stage-inner"><div class="mp-pick-wood-sign" aria-live="polite"><span>Hvor mange er det nå?</span><strong class="mp-pick-big-total">'+sum+'</strong><small class="mp-pick-equation">'+esc(eq.main)+'</small><button class="mp-pick-read-sign" type="button" data-mp-action="pick-play" data-pick-action="read" aria-label="Les opp regnestykket">🔊</button></div>'+
 groups()+
 '<div class="mp-pick-collection"><span class="mp-pick-collection-art" aria-hidden="true">'+(state.pool.length?state.pool.slice(-9).map(token=>sprite(picked.id,token)).join(''):'<span class="mp-pick-blank-icon">✧</span>')+'</span><div><strong>Du har plukket</strong><small>Se hva du har samlet!</small></div><b class="mp-pick-collected">'+state.collected+'</b></div></div></div>'+
 closeup()+
 (state.collected>0?'<p class="mp-pick-easy-feedback" role="status" aria-live="polite">'+esc(prompt)+'</p>':'')+
 '<div class="mp-pick-easy-actions"><button type="button" data-mp-action="pick-play" data-pick-action="undo" '+(!past.length?'disabled':'')+'>↶ Angre</button><button type="button" data-mp-action="pick-play" data-pick-action="reset">Start på nytt</button><button type="button" data-mp-action="pick-play" data-pick-action="nextScene">Neste lek →</button></div>'+
 '<div class="mp-pick-more"><button type="button" class="mp-pick-more-toggle" data-mp-action="pick-play" data-pick-action="toggleMore" aria-expanded="'+moreOpen+'" aria-controls="mp-pick-optional"><span aria-hidden="true">'+(moreOpen?'−':'+')+'</span> '+(moreOpen?'Skjul flere valg':'Vil du prøve mer?')+'</button><div id="mp-pick-optional">'+advanced+'</div></div>'+
 (moreOpen?'<p class="mp-pick-no-lockout">Du kan leke videre med det du liker.</p>':'')+'</section>';
}
// A decorative transient illustration follows the exact item selected by the
// child. The pure math model is updated immediately; animation never changes it.
function capturePickedArt(button,group){
 try{
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return null;
  let item=button?.closest?.('.mp-pick-object,.mp-pick-zoom-item');
  if(!item&&Number.isInteger(group)){
   const basket=document.querySelector('.mp-pick-vessel[data-group="'+group+'"]');
   item=basket?.querySelector('.mp-pick-object:last-child');
  }
  const graphic=item?.querySelector('svg');
  const box=graphic?.getBoundingClientRect();
  if(!box||box.width<8||!box.height||!graphic)return null;
  return {graphic:graphic.cloneNode(true),x:box.left,y:box.top,w:box.width,h:box.height,
   inZoom:Boolean(item.closest('.mp-pick-zoom-overlay'))};
 }catch(_){return null}
}
function animateCollectedArt(art){
 if(!art||!document.body)return;
 try{
  const target=document.querySelector(art.inZoom?'.mp-pick-zoom-footer b':'.mp-pick-collection-art');
  if(!target)return;
  const box=target.getBoundingClientRect();
  const copy=document.createElement('span');
  copy.className='mp-pick-flying-object';
  copy.setAttribute('aria-hidden','true');
  copy.appendChild(art.graphic);
  copy.style.cssText='left:'+art.x+'px;top:'+art.y+'px;width:'+art.w+'px;height:'+art.h+'px';
  document.body.appendChild(copy);
  const deltaX=box.left+box.width/2-art.x-art.w/2;
  const deltaY=box.top+box.height/2-art.y-art.h/2;
  if(typeof copy.animate!=='function'){copy.remove();return;}
  const movement=copy.animate([
   {opacity:1,transform:'translate(0px,0px) scale(1)'},
   {opacity:.96,transform:'translate('+(deltaX*.32).toFixed(1)+'px,'+(deltaY*.27-17).toFixed(1)+'px) scale(1.12)',offset:.4},
   {opacity:0,transform:'translate('+deltaX.toFixed(1)+'px,'+deltaY.toFixed(1)+'px) scale(.28)'}
  ],{duration:390,easing:'cubic-bezier(.22,.72,.32,1)',fill:'forwards'});
  movement.finished.then(()=>copy.remove(),()=>copy.remove());
 }catch(_){}
}

function dispatch(target){
 if(Date.now()<suppressUntil)return true;
 const type=target?.dataset?.pickAction||'',index=Number(target?.dataset?.group),token=target?.dataset?.token===undefined?null:Number(target.dataset.token);
 const pickedAnimation=type==='take'&&!state.moveMode?capturePickedArt(target,index):null;
 let changed=false;
 if(type==='toggleMore'){
  moreOpen=!moreOpen;
  if(!moreOpen&&state.moveMode)go('moveMode',{},false);
  zoomGroup=null;redraw();return true;
 }
 if(type==='worldNext'){
  const simpleWorlds=['strawberry','bun','mushroom','apple'];
  const at=simpleWorlds.indexOf(state.world);
  const next=simpleWorlds[(at+1+simpleWorlds.length)%simpleWorlds.length];
  if(go('world',{world:next})){redraw();}return true;
 }
 if(type==='nextScene'){
  const at=E.SCENARIOS.findIndex(x=>x.id===state.scenario);
  const next=E.SCENARIOS[(at+1+E.SCENARIOS.length)%E.SCENARIOS.length];
  if(go('scenario',{id:next.id})){zoomGroup=null;redraw();}return true;
 }
 if(type==='zoom'){
  if(Number.isInteger(index)&&index>=0&&index<state.counts.length){zoomGroup=index;redraw();const close=document.querySelector('.mp-pick-zoom-close');try{close?.focus({preventScroll:true})}catch(_){}}
  return true;
 }
 if(type==='zoomClose'){
  const old=zoomGroup;zoomGroup=null;redraw();
  const open=document.querySelector('.mp-pick-zoom-open[data-group="'+old+'"]');try{open?.focus({preventScroll:true})}catch(_){}
  return true;
 }
 if(type==='view')changed=go('view',{view:target.dataset.view},false);
 else if(type==='world')changed=go('world',{world:target.dataset.world});
 else if(type==='mission'){zoomGroup=null;changed=go('mission',{id:target.dataset.id});}
 else if(type==='selectMove'||(type==='take'&&state.moveMode)){changed=go('selectMove',{group:index,token},false);if(changed)zoomGroup=null;}
 else if(type==='moveTarget'){if(state.moveFrom!==null)changed=go('move',{group:state.moveFrom,to:index,token:state.moveToken});}
 else if(['take','return','empty'].includes(type))changed=go(type,{group:index,token});
 else if(['takeEach','newGroup','check'].includes(type))changed=go(type);
 else if(type==='moveMode')changed=go(type,{},false);
 else if(type==='undo')changed=back();
 else if(type==='redo')changed=forward();
 else if(type==='reset'){zoomGroup=null;past.push(E.normalize(state));if(past.length>90)past.shift();future=[];const keep=state.world;state=moreOpen?{...E.initial(),world:keep}:E.apply(state,{type:'scenario',id:state.scenario||'2x3'});state.world=keep;save();changed=true}
 else if(type==='read'){
  try{if(window.speechSynthesis){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(E.equation(state).main.replaceAll('×',' ganger ').replaceAll('−',' minus ').replaceAll('=',' er lik '));u.lang='nb-NO';u.rate=.85;window.speechSynthesis.speak(u)}}catch(_){}
  return true;
 }
 if(changed){redraw();if(pickedAnimation)animateCollectedArt(pickedAnimation);if(zoomGroup!==null){const next=document.querySelector('.mp-pick-zoom-item:not(:disabled)')||document.querySelector('.mp-pick-zoom-close');try{next?.focus({preventScroll:true})}catch(_){}}return true}
 return Boolean(type);
}
function mount(root,callback){
 redraw=callback;
 if(!root||root.dataset.mpPickPointerBound)return;
 root.dataset.mpPickPointerBound='true';
 document.addEventListener('keydown',event=>{
  if(zoomGroup===null)return;
  if(event.key==='Escape'){event.preventDefault();dispatch({dataset:{pickAction:'zoomClose'}});return;}
  if(event.key!=='Tab')return;
  const overlay=root.querySelector('.mp-pick-zoom-overlay');if(!overlay)return;
  const options=[...overlay.querySelectorAll('button:not([disabled]):not([tabindex="-1"])')];
  if(!options.length)return;
  const first=options[0],last=options[options.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 },true);
 root.addEventListener('pointerdown',event=>{
  if(!moreOpen)return;
  const el=event.target.closest('.mp-pick-object');
  if(!el||!root.contains(el))return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,from:Number(el.dataset.group),token:Number(el.dataset.token)};
  // Keep receiving pointer movement across baskets and Safari's nested SVG layers.
  try{el.setPointerCapture(event.pointerId)}catch(_){}
 },{passive:true});
 document.addEventListener('pointerup',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const start=drag;drag=null;
  if(Math.hypot(event.clientX-start.x,event.clientY-start.y)<20)return;
  const candidate=document.elementFromPoint(event.clientX,event.clientY);
  let target=candidate?.closest('.mp-pick-vessel');
  if(!target||!root.contains(target)){
   target=Array.from(root.querySelectorAll('.mp-pick-vessel')).find(el=>{
    const box=el.getBoundingClientRect();
    return event.clientX>=box.left&&event.clientX<=box.right&&event.clientY>=box.top&&event.clientY<=box.bottom;
   });
  }
  if(!target)return;
  const to=Number(target.dataset.group);
  if(go('move',{group:start.from,to,token:start.token})){suppressUntil=Date.now()+450;redraw();}
 },true);
 document.addEventListener('pointercancel',()=>{drag=null},true);
}
window.LARIA_MULT_PICK_PLAY={render,dispatch,mount,snapshot:()=>({...E.normalize(state),total:E.total(state),equation:E.equation(state),past:past.length,future:future.length}),reset:()=>{state=E.initial();past=[];future=[];save();redraw()}};

})();