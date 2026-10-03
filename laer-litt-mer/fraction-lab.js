
/* Brøklab: open-ended fraction experimentation. Kept separate from graded quiz flow on purpose. */
const FRACTION_LAB_DENOMS=[1,2,3,4,5,6,8,10,12];
const FRACTION_LAB_COLORS={1:'#EF4E55',2:'#F68B2C',3:'#F8C936',4:'#B9D94B',5:'#39B868',6:'#1DB4B4',8:'#4EB9E9',10:'#268ED8',12:'#A56BD6'};
const FRACTION_LAB_VARIANTS=[
  {id:'wall',label:'Brøkveggen',icon:'🧱'},
  {id:'circles',label:'Brøksirkler',icon:'◉'},
  {id:'whole',label:'Bygg en hel',icon:'🧩'},
  {id:'compare',label:'Sammenlign',icon:'⚖️'},
  {id:'equivalent',label:'Like brøker',icon:'🔎'}
];
const FRACTION_LAB_LEVELS=['Oppdag','Utforsk','Utfordring','Mester'];
const FRACTION_LAB_MISSIONS={
  wall:[
    {title:'Finn en halv',copy:'Legg én 1/2-brikke i arbeidsfeltet.',target:[1,2],exactCount:1,only:[2]},
    {title:'Samme størrelse, andre brikker',copy:'Lag 1/2 uten å bruke 1/2-brikken.',target:[1,2],minCount:2,forbidden:[2]},
    {title:'Bygg tre firedeler',copy:'Lag 3/4 med minst to brikker.',target:[3,4],minCount:2},
    {title:'Bygg fem sjettedeler',copy:'Lag 5/6 uten å bruke 1/6-brikken.',target:[5,6],minCount:2,forbidden:[6]}
  ],
  circles:[
    {title:'To kvarte blir ...?',copy:'Legg to 1/4-deler sammen og se hva de blir.',target:[1,2],exactCount:2,only:[4]},
    {title:'Lag tre firedeler',copy:'Bygg 3/4 med sirkelbitene.',target:[3,4],minCount:2},
    {title:'Lag to tredeler',copy:'Finn en måte å lage 2/3 med minst to biter.',target:[2,3],minCount:2},
    {title:'Lag fem sjettedeler',copy:'Lag 5/6 på en måte som ikke bruker 1/6.',target:[5,6],minCount:2,forbidden:[6]}
  ],
  whole:[
    {title:'Lag én hel',copy:'Lag 1 med nøyaktig to brikker.',target:[1,1],exactCount:2},
    {title:'Tre brikker = én hel',copy:'Lag 1 med nøyaktig tre brikker.',target:[1,1],exactCount:3},
    {title:'Fire brikker, ingen kvarte',copy:'Lag 1 med fire brikker uten å bruke 1/4.',target:[1,1],exactCount:4,forbidden:[4]},
    {title:'Fem brikker, ingen halvdeler',copy:'Lag 1 med fem brikker uten å bruke 1/2.',target:[1,1],exactCount:5,forbidden:[2]}
  ],
  equivalent:[
    {title:'Vis en halv på en ny måte',copy:'Lag 1/2 uten å bruke 1/2-brikken.',target:[1,2],minCount:2,forbidden:[2]},
    {title:'Fire åttendedeler',copy:'Bruk bare 1/8-biter og lag 1/2.',target:[1,2],exactCount:4,only:[8]},
    {title:'Tre firedeler uten kvarte',copy:'Lag 3/4 uten å bruke 1/4.',target:[3,4],minCount:2,forbidden:[4]},
    {title:'To tredeler uten tredeler',copy:'Lag 2/3 uten å bruke 1/3.',target:[2,3],minCount:2,forbidden:[3]}
  ],
  compare:[
    {title:'Hvilken er størst?',copy:'Legg 1/2 til venstre og 1/4 til høyre. Velg riktig tegn.',pair:[2,4]},
    {title:'Sammenlign tredel og firedel',copy:'Legg 1/3 til venstre og 1/4 til høyre. Velg riktig tegn.',pair:[3,4]},
    {title:'Nære brøker',copy:'Legg 1/5 til venstre og 1/6 til høyre. Velg riktig tegn.',pair:[5,6]},
    {title:'Se forskjellen',copy:'Legg 1/8 til venstre og 1/10 til høyre. Velg riktig tegn.',pair:[8,10]}
  ]
};
const fractionLabUi={
  mode:'mission',
  variant:'wall',
  level:0,
  pieces:[],
  compare:{left:null,right:null,active:'left',prediction:null},
  selectedDenom:2,
  lastGrade:null,
  feedback:null
};

function fractionLabGcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t}return a||1}
function fractionLabReduce(n,d){if(!d)return [n,d];const g=fractionLabGcd(n,d);return [n/g,d/g]}
function fractionLabTotal(pieces=fractionLabUi.pieces){
  let n=0,d=1;
  for(const denom of pieces){n=n*denom+d;d*=denom;[n,d]=fractionLabReduce(n,d)}
  return fractionLabReduce(n,d);
}
function fractionLabEqual(a,b){return a[0]*b[1]===b[0]*a[1]}
function fractionLabValue(pair){return pair[0]/pair[1]}
function fractionLabIsTerminating(pair){
  let d=fractionLabReduce(pair[0],pair[1])[1];
  while(d%2===0)d/=2;
  while(d%5===0)d/=5;
  return d===1;
}
function fractionLabDecimal(pair){
  const v=fractionLabValue(pair),exact=fractionLabIsTerminating(pair);
  const rounded=exact?Math.round(v*10000)/10000:Math.round(v*1000)/1000;
  return (exact?'':'≈ ')+String(rounded).replace('.',',')+(exact?'':'…');
}
function fractionLabPercent(pair){
  const v=fractionLabValue(pair)*100,exact=fractionLabIsTerminating(pair);
  const rounded=exact?(Math.abs(v-Math.round(v))<.0001?Math.round(v):Math.round(v*100)/100):Math.round(v*10)/10;
  return (exact?'':'≈ ')+String(rounded).replace('.',',')+(exact?'':'…')+' %';
}
function fractionLabFracHtml(d,n=1){
  if(d===1&&n===1)return '1';
  return '<span class="lab-frac"><sup>'+n+'</sup><span class="slash">⁄</span><sub>'+d+'</sub></span>';
}
function fractionLabRecommendedLevel(){
  const g=currentGrade();return g<=2?0:g<=4?1:g<=7?2:3;
}
function ensureFractionLabProgress(){
  state.fractionLab=state.fractionLab||{completed:{}};
  if(Array.isArray(state.fractionLab.completed)){
    const legacy=state.fractionLab.completed;
    state.fractionLab.completed=Object.fromEntries(legacy.map((id,i)=>['legacy:'+i,String(id)]));
  }else if(!state.fractionLab.completed||typeof state.fractionLab.completed!=='object'){
    state.fractionLab.completed={};
  }
}
function fractionLabCompletedCount(){ensureFractionLabProgress();return Object.keys(state.fractionLab.completed).length}
function fractionLabMission(){
  return (FRACTION_LAB_MISSIONS[fractionLabUi.variant]||FRACTION_LAB_MISSIONS.wall)[fractionLabUi.level]||FRACTION_LAB_MISSIONS.wall[0];
}
function fractionLabMissionKey(){return fractionLabUi.variant+':'+fractionLabUi.level}
function fractionLabColor(d){return FRACTION_LAB_COLORS[d]||'#6BAAB1'}
function fractionLabConnectionsHtml(pair){
  return '<small>'+fractionLabDecimal(pair)+' · '+fractionLabPercent(pair)+'</small>';
}
function fractionLabPieceLabel(d){return d===1?'1':fractionLabFracHtml(d)}
function fractionLabResetWork(){
  fractionLabUi.pieces=[];
  fractionLabUi.compare={left:null,right:null,active:'left',prediction:null};
  fractionLabUi.feedback=null;
}
function fractionLabSetVariant(id){
  if(!FRACTION_LAB_VARIANTS.some(v=>v.id===id))return;
  fractionLabUi.variant=id;fractionLabResetWork();renderFractionLab();
}
function fractionLabSetLevel(level){
  fractionLabUi.level=Math.max(0,Math.min(3,Number(level)||0));fractionLabResetWork();renderFractionLab();
}
function fractionLabAddPiece(d,targetSide){
  d=Number(d);if(!FRACTION_LAB_DENOMS.includes(d))return;
  fractionLabUi.selectedDenom=d;
  fractionLabUi.feedback=null;
  if(fractionLabUi.variant==='compare'){
    const side=targetSide||fractionLabUi.compare.active||'left';
    fractionLabUi.compare[side]=d;
    fractionLabUi.compare.active=side==='left'?'right':'left';
  }else{
    if(fractionLabUi.pieces.length>=18){fractionLabUi.feedback={type:'try',text:'Arbeidsfeltet er fullt. Fjern en brikke før du legger til flere.'};renderFractionLab();return}
    fractionLabUi.pieces.push(d);
  }
  renderFractionLab();
}
function fractionLabRemovePiece(index){
  fractionLabUi.pieces.splice(index,1);fractionLabUi.feedback=null;renderFractionLab();
}
function fractionLabRelation(left,right){
  if(!left||!right)return null;
  if(left===right)return '=';
  // 1/a compared with 1/b: the smaller denominator is the larger piece.
  return left<right?'>':'<';
}
function fractionLabMissionMatches(mission){
  if(fractionLabUi.variant==='compare'){
    const c=fractionLabUi.compare;if(!c.left||!c.right||!c.prediction)return false;
    if(mission.pair&&(c.left!==mission.pair[0]||c.right!==mission.pair[1]))return false;
    return c.prediction===fractionLabRelation(c.left,c.right);
  }
  const pieces=fractionLabUi.pieces,total=fractionLabTotal(pieces);
  if(!fractionLabEqual(total,mission.target))return false;
  if(mission.exactCount&&pieces.length!==mission.exactCount)return false;
  if(mission.minCount&&pieces.length<mission.minCount)return false;
  if(mission.forbidden&&pieces.some(d=>mission.forbidden.includes(d)))return false;
  if(mission.only&&pieces.some(d=>!mission.only.includes(d)))return false;
  return true;
}
function fractionLabCheck(){
  const mission=fractionLabMission();
  if(fractionLabUi.mode==='free'){
    const total=fractionLabTotal();
    fractionLabUi.feedback={type:'good',text:'Du har bygget '+(total[1]===1?String(total[0]):total[0]+'/'+total[1])+'. Fortsett å eksperimentere.'};
    renderFractionLab();return;
  }
  if(fractionLabUi.variant==='compare'){
    const c=fractionLabUi.compare;
    if(!c.left||!c.right){fractionLabUi.feedback={type:'try',text:'Legg en brøk på begge sider først.'};renderFractionLab();return}
    if(!c.prediction){fractionLabUi.feedback={type:'try',text:'Velg <, = eller > før du sjekker.'};renderFractionLab();return}
    const relation=fractionLabRelation(c.left,c.right);
    if(c.left!==mission.pair[0]||c.right!==mission.pair[1]){
      fractionLabUi.feedback={type:c.prediction===relation?'good':'try',text:'Her er '+(c.prediction===relation?'tegnet riktig':'riktig tegn '+relation)+'. Oppdraget ber deg også prøve '+fractionLabPieceLabel(mission.pair[0])+' og '+fractionLabPieceLabel(mission.pair[1])+'.'};
      renderFractionLab();return;
    }
  }
  if(fractionLabMissionMatches(mission)){
    ensureFractionLabProgress();state.fractionLab.completed[fractionLabMissionKey()]=Date.now();saveState();
    fractionLabUi.feedback={type:'good',text:'Du fant det! ✨ Prøv en annen måte, eller gå videre til neste utfordring.'};
    try{celebrateCorrect()}catch(_){}
  }else{
    let hint='Se på størrelsen på brikkene og prøv en ny kombinasjon.';
    if(fractionLabUi.variant==='whole')hint='Du er på '+(fractionLabTotal()[0]+'/'+fractionLabTotal()[1])+'. Målet er nøyaktig 1.';
    if(fractionLabUi.variant==='equivalent'||fractionLabUi.variant==='wall'||fractionLabUi.variant==='circles'){
      const t=fractionLabTotal();hint='Du har bygget '+(t[1]===1?String(t[0]):t[0]+'/'+t[1])+'. Juster brikkene og prøv igjen.';
    }
    fractionLabUi.feedback={type:'try',text:hint};
  }
  renderFractionLab();
}
function fractionLabCircleMeta(d){
  const pair=[1,d];
  if(d===1)return '<b>1</b><span>1,0 · 100 %</span>';
  return '<b>1/'+d+'</b><span>'+fractionLabDecimal(pair)+' · '+fractionLabPercent(pair)+'</span>';
}
function fractionLabMeaningHtml(){
  const d=fractionLabUi.selectedDenom||2,pair=[1,d],exact=fractionLabIsTerminating(pair);
  const percent=fractionLabValue(pair)*100;
  const filled=Math.max(0,Math.min(100,Math.round(percent)));
  const cells=Array.from({length:100},(_,i)=>'<i class="'+(i<filled?'active':'')+'"></i>').join('');
  const fraction=d===1?'1':'1/'+d;
  const countText=(exact?'':'Omtrent ')+filled+' av 100';
  const meaning=d===1?'Én hel er det samme som 1,0 og 100 %.':
    'Én '+(d===2?'halvdel':d===3?'tredel':d===4?'firedel':d+'del')+' betyr én av '+d+' like deler av en hel.';
  return '<div class="lab-meaning-card"><div class="lab-meaning-head"><div><span>Se sammenhengen</span><strong>Samme mengde · tre skrivemåter</strong></div><small>Trykk på en brøk i brettet</small></div><div class="lab-equivalence"><div class="lab-value-chip"><span>BRØK</span><b>'+fraction+'</b></div><em>=</em><div class="lab-value-chip"><span>DESIMAL</span><b>'+fractionLabDecimal(pair)+'</b></div><em>=</em><div class="lab-value-chip"><span>PROSENT</span><b>'+fractionLabPercent(pair)+'</b></div></div><div class="lab-meaning-bottom"><div class="lab-hundred-grid" aria-label="'+countText+' ruter">'+cells+'</div><p><strong>'+countText+'</strong>'+meaning+' Alle tre uttrykkene beskriver samme mengde.</p></div></div>';
}
function fractionLabBoardHtml(){
  const wall=FRACTION_LAB_DENOMS.map(d=>{
    const selected=d===fractionLabUi.selectedDenom?' selected':'';
    const cells=Array.from({length:d},()=>'<button type="button" class="lab-fraction-tile'+selected+'" data-fraction-source data-inspect-only="true" data-denom="'+d+'" style="--piece-color:'+fractionLabColor(d)+'" aria-label="'+(d===1?'En hel':'En '+d+'del')+'">'+fractionLabPieceLabel(d)+'</button>').join('');
    return '<div class="lab-fraction-row" data-parts="'+d+'" style="--parts:'+d+'">'+cells+'</div>';
  }).join('');
  const circles=FRACTION_LAB_DENOMS.map(d=>'<button type="button" class="lab-circle-source '+(d===fractionLabUi.selectedDenom?'selected':'')+'" data-fraction-source data-inspect-only="true" data-denom="'+d+'" aria-label="Brøksirkel '+(d===1?'en hel':'en '+d+'del')+'"><span class="lab-circle" style="--parts:'+d+';--piece-color:'+fractionLabColor(d)+'">'+fractionLabPieceLabel(d)+'</span><span class="lab-circle-meta">'+fractionLabCircleMeta(d)+'</span></button>').join('');
  const focus=fractionLabUi.variant==='circles'?'focus-circles':(fractionLabUi.variant==='wall'||fractionLabUi.variant==='whole'||fractionLabUi.variant==='equivalent'?'focus-wall':'');
  return '<div class="lab-board '+focus+'" aria-label="Digitalt brøkbrett"><div class="lab-board-page"><div class="lab-board-title">Brøkvegg</div><div class="lab-fraction-wall">'+wall+'</div></div><div class="lab-board-page"><div class="lab-board-title">Brøksirkler</div><div class="lab-circles">'+circles+'</div></div></div>';
}
function fractionLabBankHtml(){
  const circle=fractionLabUi.variant==='circles';
  return FRACTION_LAB_DENOMS.map(d=>'<button type="button" class="lab-loose-piece '+(circle?'circle-piece':'')+'" data-fraction-source data-denom="'+d+'" style="--parts:'+d+';--piece-color:'+fractionLabColor(d)+'" aria-label="Legg til '+(d===1?'en hel':'en '+d+'del')+'">'+fractionLabPieceLabel(d)+'</button>').join('');
}
function fractionLabWorkHtml(){
  if(fractionLabUi.variant==='compare'){
    const c=fractionLabUi.compare,mission=fractionLabMission(),relation=c.left&&c.right?fractionLabRelation(c.left,c.right):'?';
    const slot=(side,label,d)=>'<button type="button" class="lab-compare-slot '+(c.active===side?'active':'')+'" data-compare-side="'+side+'"><div><strong>'+label+'</strong><div class="chosen">'+(d?fractionLabPieceLabel(d):'Legg her')+'</div>'+(d?fractionLabConnectionsHtml([1,d]):'')+'</div></button>';
    return '<div class="lab-workzone"><div class="lab-workzone-title"><strong>Sammenlign</strong><button type="button" class="lab-clear" id="fraction-lab-clear">Nullstill</button></div><div class="lab-compare">'+slot('left','Venstre',c.left)+'<div class="lab-compare-mid">'+(fractionLabUi.feedback&&c.left&&c.right?relation:'?')+'</div>'+slot('right','Høyre',c.right)+'</div><div class="lab-predictions" aria-label="Velg sammenligningstegn">'+['<','=','>'].map(x=>'<button type="button" class="lab-prediction '+(c.prediction===x?'active':'')+'" data-prediction="'+x+'">'+x+'</button>').join('')+'</div>'+fractionLabFeedbackHtml()+'<button type="button" class="lab-check" id="fraction-lab-check">'+(fractionLabUi.mode==='mission'?'Sjekk oppdraget':'Sjekk sammenligningen')+'</button></div>';
  }
  const total=fractionLabTotal();
  const pieces=fractionLabUi.pieces.length?fractionLabUi.pieces.map((d,i)=>'<button type="button" class="lab-workpiece" data-remove-piece="'+i+'" style="--piece-color:'+fractionLabColor(d)+';--piece-width:'+(100/d)+'%" aria-label="Fjern '+(d===1?'en hel':'en '+d+'del')+'">'+fractionLabPieceLabel(d)+'</button>').join(''):'<div class="lab-empty">Dra en brøkbit hit, eller trykk på en brikke over.<br>Trykk på en brikke her for å fjerne den.</div>';
  const display=total[1]===1?String(total[0]):total[0]+'/'+total[1];
  return '<div class="lab-workzone"><div class="lab-workzone-title"><strong>Arbeidsfelt</strong><button type="button" class="lab-clear" id="fraction-lab-clear">Tøm</button></div><div class="lab-workbench" id="fraction-workbench">'+pieces+'</div><div class="lab-total"><div class="lab-total-label">Det du har bygget</div><div class="lab-total-equivalence"><b>'+display+'</b><span>=</span><b>'+fractionLabDecimal(total)+'</b><span>=</span><b>'+fractionLabPercent(total)+'</b></div></div>'+fractionLabFeedbackHtml()+(fractionLabUi.mode==='mission'?'<button type="button" class="lab-check" id="fraction-lab-check">Sjekk oppdraget</button>':'')+'</div>';
}
function fractionLabFeedbackHtml(){
  const f=fractionLabUi.feedback;if(!f)return '<div class="lab-feedback" id="fraction-lab-feedback" aria-live="polite"></div>';
  return '<div class="lab-feedback show '+f.type+'" id="fraction-lab-feedback" aria-live="polite">'+f.text+'</div>';
}
function fractionLabMissionHtml(){
  if(fractionLabUi.mode==='free')return '<div class="lab-free-note"><strong>Fri lek.</strong> Brøk, desimal og prosent er forskjellige måter å beskrive samme mengde på. Trykk på brøkene, bygg selv og se sammenhengene.</div>';
  const mission=fractionLabMission(),recommended=fractionLabRecommendedLevel();
  return '<div class="lab-mission"><div class="lab-mission-top"><span class="lab-mission-badge">'+FRACTION_LAB_LEVELS[fractionLabUi.level]+'</span><span class="lab-recommended">Anbefalt: '+GRADE_CONFIG[currentGrade()].label+'</span></div><h2>'+mission.title+'</h2><p>'+mission.copy+'</p><div class="lab-levels">'+FRACTION_LAB_LEVELS.map((label,i)=>'<button type="button" class="lab-level '+(i===fractionLabUi.level?'active ':'')+(i===recommended?'recommended':'')+'" data-lab-level="'+i+'">'+label+'</button>').join('')+'</div>'+(fractionLabUi.level<3?'<button type="button" class="lab-harder" id="fraction-lab-harder">Prøv noe vanskeligere →</button>':'')+'</div>';
}
function renderFractionLab(){
  const root=document.getElementById('fraction-lab-root');if(!root)return;
  const recommended=fractionLabRecommendedLevel();
  root.innerHTML='<div class="fraction-lab-shell"><div class="fraction-lab-head"><button type="button" class="detail-back" id="fraction-lab-back" aria-label="Tilbake">←</button><div class="fraction-lab-head-copy"><div class="eyebrow">Matte · eksperimenter</div><h1>Brøklab</h1></div><div class="fraction-lab-head-spacer"></div></div><div class="lab-mode-tabs" role="tablist" aria-label="Velg modus"><button type="button" class="lab-mode-tab '+(fractionLabUi.mode==='mission'?'active':'')+'" data-lab-mode="mission">Oppdrag</button><button type="button" class="lab-mode-tab '+(fractionLabUi.mode==='free'?'active':'')+'" data-lab-mode="free">Fri lek</button></div><div class="lab-intro"><strong>Poenget:</strong> Brøk, desimal og prosent kan være tre navn på akkurat samme mengde.</div><div class="lab-variant-wrap"><div class="lab-variants">'+FRACTION_LAB_VARIANTS.map(v=>'<button type="button" class="lab-variant '+(fractionLabUi.variant===v.id?'active':'')+'" data-lab-variant="'+v.id+'">'+v.icon+' '+v.label+'</button>').join('')+'</div></div>'+fractionLabMissionHtml()+fractionLabMeaningHtml()+fractionLabBoardHtml()+'<div class="lab-toolbox"><div class="lab-toolbox-head"><div><strong>Brøkbiter</strong><small class="lab-toolbox-copy">Trykk for å legge i arbeidsfeltet. Dra hvis du vil plassere selv.</small></div></div><div class="lab-piece-bank">'+fractionLabBankHtml()+'</div></div>'+fractionLabWorkHtml()+'<div class="lab-completed-count">'+fractionLabCompletedCount()+' oppdagelser lagret på denne enheten · nivå '+(recommended+1)+' er anbefalt akkurat nå</div></div>';
  bindFractionLabUi();
}
function bindFractionLabUi(){
  document.getElementById('fraction-lab-back')?.addEventListener('click',()=>openSubject('math'));
  document.querySelectorAll('[data-lab-mode]').forEach(b=>b.addEventListener('click',()=>{fractionLabUi.mode=b.dataset.labMode;fractionLabUi.feedback=null;renderFractionLab()}));
  document.querySelectorAll('[data-lab-variant]').forEach(b=>b.addEventListener('click',()=>fractionLabSetVariant(b.dataset.labVariant)));
  document.querySelectorAll('[data-lab-level]').forEach(b=>b.addEventListener('click',()=>fractionLabSetLevel(b.dataset.labLevel)));
  document.getElementById('fraction-lab-harder')?.addEventListener('click',()=>fractionLabSetLevel(fractionLabUi.level+1));
  document.getElementById('fraction-lab-clear')?.addEventListener('click',()=>{fractionLabResetWork();renderFractionLab()});
  document.getElementById('fraction-lab-check')?.addEventListener('click',fractionLabCheck);
  document.querySelectorAll('[data-remove-piece]').forEach(b=>b.addEventListener('click',()=>fractionLabRemovePiece(Number(b.dataset.removePiece))));
  document.querySelectorAll('[data-compare-side]').forEach(b=>b.addEventListener('click',()=>{fractionLabUi.compare.active=b.dataset.compareSide;fractionLabUi.feedback=null;renderFractionLab()}));
  document.querySelectorAll('[data-prediction]').forEach(b=>b.addEventListener('click',()=>{fractionLabUi.compare.prediction=b.dataset.prediction;fractionLabUi.feedback=null;renderFractionLab()}));
  document.querySelectorAll('[data-fraction-source]').forEach(bindFractionLabSource);
}
function bindFractionLabSource(button){
  const denom=Number(button.dataset.denom);let drag=null;
  button.addEventListener('click',event=>{
    if(Number(button._labDraggedUntil||0)>Date.now()){event.preventDefault();return}
    fractionLabUi.selectedDenom=denom;
    if(button.dataset.inspectOnly==='true'){fractionLabUi.feedback=null;renderFractionLab();return}
    fractionLabAddPiece(denom);
  });
  button.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false,ghost:null};
    try{button.setPointerCapture(event.pointerId)}catch(_){}
  });
  button.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dist=Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY);
    if(!drag.moved&&dist<7)return;
    if(!drag.moved){
      drag.moved=true;
      const ghost=document.createElement('div');ghost.className='lab-drag-ghost '+(fractionLabUi.variant==='circles'?'circle-piece':'');ghost.style.setProperty('--piece-color',fractionLabColor(denom));ghost.innerHTML=fractionLabPieceLabel(denom);document.body.appendChild(ghost);drag.ghost=ghost;
    }
    event.preventDefault();
    if(drag.ghost){drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px'}
    document.querySelectorAll('.lab-workbench,.lab-compare-slot').forEach(x=>x.classList.remove('drag-over'));
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.lab-workbench,.lab-compare-slot');if(target)target.classList.add('drag-over');
  });
  const finish=event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const wasMoved=drag.moved,ghost=drag.ghost;drag=null;
    if(ghost)ghost.remove();
    document.querySelectorAll('.lab-workbench,.lab-compare-slot').forEach(x=>x.classList.remove('drag-over'));
    if(wasMoved){
      button._labDraggedUntil=Date.now()+300;
      const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.lab-workbench,.lab-compare-slot');
      if(target){
        if(target.classList.contains('lab-compare-slot'))fractionLabAddPiece(denom,target.dataset.compareSide);
        else fractionLabAddPiece(denom);
      }
    }
  };
  button.addEventListener('pointerup',finish);
  button.addEventListener('pointercancel',event=>{if(drag&&event.pointerId===drag.id){drag.ghost?.remove();drag=null;document.querySelectorAll('.lab-workbench,.lab-compare-slot').forEach(x=>x.classList.remove('drag-over'))}});
}
function openFractionLab(){
  const grade=currentGrade();
  if(fractionLabUi.lastGrade!==grade){fractionLabUi.level=fractionLabRecommendedLevel();fractionLabUi.lastGrade=grade;fractionLabResetWork()}
  renderFractionLab();showScreen('fraction-lab');
}
window.openFractionLab=openFractionLab;
const fractionLabEntry=document.getElementById('open-fraction-lab');
if(fractionLabEntry)fractionLabEntry.onclick=openFractionLab;
