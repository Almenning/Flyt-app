
/* Gangetabell-lab: multiplication as groups, arrays, jumps, symmetry and patterns. */
const MULT_LAB_LEVELS=['Oppdag','Utforsk','Utfordring','Mester'];
const MULT_LAB_VARIANTS=[
  {id:'groups',label:'Grupper',icon:'🟣'},
  {id:'array',label:'Rutenett',icon:'▦'},
  {id:'swap',label:'Bytt plass',icon:'↔️'},
  {id:'line',label:'Tallinja',icon:'➜'},
  {id:'patterns',label:'Mønstre',icon:'✨'}
];
const MULT_LAB_MISSIONS={
  groups:[
    {title:'Tre grupper med to',copy:'Bygg 3 grupper med 2 i hver.',a:3,b:2,ask:'product'},
    {title:'Fire grupper med tre',copy:'Se hvordan 4 × 3 kan bygges som like grupper.',a:4,b:3,ask:'product'},
    {title:'Seks grupper med fire',copy:'Bygg 6 × 4 og finn totalen.',a:6,b:4,ask:'product'},
    {title:'Ni grupper med sju',copy:'Bygg 9 × 7. Bruk strukturen, ikke tell én og én.',a:9,b:7,ask:'product'}
  ],
  array:[
    {title:'Bygg 2 × 5',copy:'Lag to rader med fem i hver.',a:2,b:5,ask:'product'},
    {title:'Bygg 4 × 6',copy:'Lag et rutenett som viser 4 × 6.',a:4,b:6,ask:'product'},
    {title:'Bygg 7 × 8',copy:'Lag 7 rader med 8 og finn mønsteret.',a:7,b:8,ask:'product'},
    {title:'Bygg 12 × 12',copy:'Utforsk hele 12 × 12-rutenettet.',a:12,b:12,ask:'product'}
  ],
  swap:[
    {title:'To veier til samme svar',copy:'Sammenlign 2 × 4 med 4 × 2.',a:2,b:4,ask:'same'},
    {title:'Bytt faktorene',copy:'Sammenlign 3 × 6 og 6 × 3.',a:3,b:6,ask:'same'},
    {title:'Samme areal?',copy:'Sammenlign 5 × 8 og 8 × 5.',a:5,b:8,ask:'same'},
    {title:'Bevis mønsteret',copy:'Sammenlign 7 × 11 og 11 × 7.',a:7,b:11,ask:'same'}
  ],
  line:[
    {title:'Tre hopp på 4',copy:'Følg tre like hopp på tallinja.',a:3,b:4,ask:'product'},
    {title:'Fem hopp på 6',copy:'Følg fem hopp på 6 og finn hvor du lander.',a:5,b:6,ask:'product'},
    {title:'Åtte hopp på 7',copy:'Se 8 × 7 som gjentatte hopp.',a:8,b:7,ask:'product'},
    {title:'Elleve hopp på 9',copy:'Finn endepunktet uten å telle hvert punkt.',a:11,b:9,ask:'product'}
  ],
  patterns:[
    {title:'Finn 5-gangen',copy:'Marker 5-gangen og legg merke til siste siffer.',a:5,b:4,ask:'pattern',table:5},
    {title:'Finn 9-gangen',copy:'Marker 9-gangen. Ser du et mønster i svarene?',a:9,b:6,ask:'pattern',table:9},
    {title:'Sammenlign 3- og 6-gangen',copy:'Velg 6-gangen og se hvilke svar som også ligger i 3-gangen.',a:6,b:8,ask:'pattern',table:6,family:3},
    {title:'Utforsk 12-gangen',copy:'Marker 12-gangen og finn sammenhenger med 3-, 4- og 6-gangen.',a:12,b:7,ask:'pattern',table:12,family:6}
  ]
};
const multLabUi={
  mode:'mission',
  variant:'groups',
  level:0,
  a:3,
  b:2,
  answer:null,
  feedback:null,
  lastGrade:null
};

function ensureMultLabProgress(){
  state.multiplicationLab=state.multiplicationLab||{completed:{}};
  if(!state.multiplicationLab.completed||typeof state.multiplicationLab.completed!=='object'||Array.isArray(state.multiplicationLab.completed))state.multiplicationLab.completed={};
}
function multLabRecommendedLevel(){
  const g=currentGrade();return g<=2?0:g<=4?1:g<=7?2:3;
}
function multLabMission(){
  return (MULT_LAB_MISSIONS[multLabUi.variant]||MULT_LAB_MISSIONS.groups)[multLabUi.level]||MULT_LAB_MISSIONS.groups[0];
}
function multLabMissionKey(){return multLabUi.variant+':'+multLabUi.level}
function multLabProduct(){return multLabUi.a*multLabUi.b}
function multLabCompletedCount(){ensureMultLabProgress();return Object.keys(state.multiplicationLab.completed).length}
function multLabClamp(v){return Math.max(1,Math.min(12,Number(v)||1))}
function multLabSetFactors(a,b){multLabUi.a=multLabClamp(a);multLabUi.b=multLabClamp(b);multLabUi.answer=null;multLabUi.feedback=null;renderMultiplicationLab()}
function multLabResetToMission(){
  const m=multLabMission();multLabUi.a=m.a;multLabUi.b=m.b;multLabUi.answer=null;multLabUi.feedback=null;
}
function multLabSetVariant(id){
  if(!MULT_LAB_VARIANTS.some(v=>v.id===id))return;
  multLabUi.variant=id;multLabResetToMission();renderMultiplicationLab();
}
function multLabSetLevel(level){
  multLabUi.level=Math.max(0,Math.min(3,Number(level)||0));multLabResetToMission();renderMultiplicationLab();
}
function multLabExpression(){
  return multLabUi.a+' × '+multLabUi.b+' = '+multLabProduct();
}
function multLabRepeatedAddition(){
  if(multLabUi.a>8)return multLabUi.a+' like grupper med '+multLabUi.b+' i hver';
  return Array.from({length:multLabUi.a},()=>String(multLabUi.b)).join(' + ')+' = '+multLabProduct();
}
function multLabMissionHtml(){
  if(multLabUi.mode==='free')return '<div class="mult-free-note"><strong>Fri lek.</strong> Velg faktorene selv og bytt mellom grupper, rutenett, tallinje og mønstre. Ingen nivåer er låst av klassetrinn.</div>';
  const m=multLabMission(),recommended=multLabRecommendedLevel();
  return '<div class="mult-mission"><div class="mult-mission-top"><span class="mult-mission-badge">'+MULT_LAB_LEVELS[multLabUi.level]+'</span><span class="mult-recommended">Anbefalt: '+GRADE_CONFIG[currentGrade()].label+'</span></div><h2>'+m.title+'</h2><p>'+m.copy+'</p><div class="mult-levels">'+MULT_LAB_LEVELS.map((label,i)=>'<button type="button" class="mult-level '+(i===multLabUi.level?'active ':'')+(i===recommended?'recommended':'')+'" data-mult-level="'+i+'">'+label+'</button>').join('')+'</div>'+(multLabUi.level<3?'<button type="button" class="mult-harder" id="mult-lab-harder">Prøv noe vanskeligere →</button>':'')+'</div>';
}
function multLabFactorPanelHtml(){
  const presets=[1,2,3,4,5,6,7,8,9,10,11,12];
  const control=(which,label,value)=>'<div class="mult-factor-title">'+label+'</div><div class="mult-factor-row"><button type="button" class="mult-factor-btn" data-factor-change="'+which+'" data-delta="-1" aria-label="Mindre '+label.toLowerCase()+'">−</button><div class="mult-factor-value">'+value+'</div><button type="button" class="mult-factor-btn" data-factor-change="'+which+'" data-delta="1" aria-label="Større '+label.toLowerCase()+'">+</button></div><div class="mult-factor-presets">'+presets.map(n=>'<button type="button" class="mult-preset '+(n===value?'active':'')+'" data-factor-preset="'+which+'" data-value="'+n+'">'+n+'</button>').join('')+'</div>';
  return '<div class="mult-factor-panel">'+control('a',multLabUi.variant==='groups'||multLabUi.variant==='line'?'Antall grupper / hopp':'Faktor 1',multLabUi.a)+'<div style="height:12px"></div>'+control('b',multLabUi.variant==='groups'||multLabUi.variant==='line'?'Hvor mange i hver / hoppets lengde':'Faktor 2',multLabUi.b)+'</div>';
}
function multLabArrayHtml(a=multLabUi.a,b=multLabUi.b,color='#6D77DE'){
  const total=a*b,large=total>64?' array-large':'';
  return '<div class="mult-array'+large+'" style="--cols:'+b+';--dot-color:'+color+'" aria-label="'+a+' ganger '+b+', '+total+' ruter">'+Array.from({length:total},()=>'<i class="mult-dot"></i>').join('')+'</div>';
}
function multLabGroupsHtml(){
  const groups=Array.from({length:multLabUi.a},(_,i)=>'<div class="mult-group"><span class="mult-group-label">'+(i+1)+'</span>'+Array.from({length:multLabUi.b},()=>'<i class="mult-dot" style="--dot-color:#6D77DE"></i>').join('')+'</div>').join('');
  return '<div class="mult-groups">'+groups+'</div>';
}
function multLabNumberlineHtml(){
  const end=multLabProduct(),step=multLabUi.b,count=multLabUi.a,max=end;
  const ticks=[];const stride=max<=30?1:max<=60?2:max<=100?5:10;
  for(let v=0;v<=max;v+=stride){
    const left=max?100*v/max:0;ticks.push('<span class="mult-numberline-tick" style="left:'+left+'%">'+v+'</span>');
  }
  const jumps=[];
  for(let i=0;i<count;i++){
    const left=100*(i*step)/max,width=100*step/max;
    jumps.push('<span class="mult-jump" style="left:'+left+'%;width:'+width+'%"><b class="mult-jump-label">+'+step+'</b></span>');
  }
  return '<div class="mult-numberline-wrap"><div class="mult-numberline" style="--end:'+Math.max(1,end)+'"><div class="mult-numberline-axis"></div>'+ticks.join('')+jumps.join('')+'</div></div>';
}
function multLabSwapHtml(){
  const mini=(rows,cols,color)=>'<div class="mult-swap-mini" style="--mini-cols:'+cols+';--mini-color:'+color+'">'+Array.from({length:rows*cols},()=>'<i></i>').join('')+'</div>';
  return '<div class="mult-swap"><div class="mult-swap-card"><strong>'+multLabUi.a+' × '+multLabUi.b+'</strong>'+mini(multLabUi.a,multLabUi.b,'#6D77DE')+'</div><div class="mult-swap-icon">↔</div><div class="mult-swap-card"><strong>'+multLabUi.b+' × '+multLabUi.a+'</strong>'+mini(multLabUi.b,multLabUi.a,'#75BD91')+'</div></div>';
}
function multLabPatternHtml(){
  const m=multLabMission(),table=multLabUi.mode==='mission'?(m.table||multLabUi.a):multLabUi.a,family=multLabUi.mode==='mission'?m.family:null;
  let cells='<div class="mult-table-cell head corner">×</div>';
  for(let c=1;c<=12;c++)cells+='<div class="mult-table-cell head top">'+c+'</div>';
  for(let r=1;r<=12;r++){
    cells+='<div class="mult-table-cell head left">'+r+'</div>';
    for(let c=1;c<=12;c++){
      const product=r*c;
      const selected=r===table||c===table;
      const familyHit=family&&(r===family||c===family);
      const multiple=product%table===0&&!selected&&product<=144;
      const cls=selected?' selected':familyHit?' family':multiple?' multiple':'';
      cells+='<button type="button" class="mult-table-cell'+cls+'" data-table-a="'+r+'" data-table-b="'+c+'" aria-label="'+r+' ganger '+c+' er '+product+'">'+product+'</button>';
    }
  }
  return '<div class="mult-table-wrap"><div class="mult-table">'+cells+'</div></div><div class="mult-table-legend"><span><i style="background:#E9EBFF"></i>'+table+'-gangen</span>'+(family?'<span><i style="background:#FFF3CF"></i>'+family+'-gangen</span>':'')+'</div>';
}
function multLabStageHtml(){
  let visual='';
  let note='';
  if(multLabUi.variant==='groups'){visual=multLabGroupsHtml();note=multLabUi.a+' like grupper'}
  else if(multLabUi.variant==='array'){visual=multLabArrayHtml();note=multLabUi.a+' rader × '+multLabUi.b}
  else if(multLabUi.variant==='swap'){visual=multLabSwapHtml();note='Samme antall, snudd'}
  else if(multLabUi.variant==='line'){visual=multLabNumberlineHtml();note=multLabUi.a+' hopp på '+multLabUi.b}
  else{visual=multLabPatternHtml();note='1–12-tabellen'}
  return '<div class="mult-stage"><div class="mult-stage-head"><strong>'+MULT_LAB_VARIANTS.find(v=>v.id===multLabUi.variant).label+'</strong><span class="mult-stage-note">'+note+'</span></div>'+visual+multLabAnswerHtml()+multLabFeedbackHtml()+(multLabUi.mode==='mission'?'<button type="button" class="mult-check" id="mult-lab-check">Sjekk oppdraget</button>':'')+'</div>';
}
function multLabAnswerOptions(){
  const m=multLabMission(),product=m.a*m.b;
  if(m.ask==='same')return ['Ja','Nei'];
  if(m.ask==='pattern')return [String(product),String(Math.max(0,product-m.a)),String(product+m.a)];
  const candidates=[product,product+m.a,Math.max(0,product-m.b),product+1];
  return [...new Set(candidates)].slice(0,4).map(String);
}
function multLabAnswerHtml(){
  if(multLabUi.mode!=='mission')return '<div class="mult-discovery">'+multLabFreeDiscovery()+'</div>';
  const m=multLabMission(),prompt=m.ask==='same'?'Blir svaret det samme når faktorene bytter plass?':m.ask==='pattern'?'Hva er '+m.table+' × '+m.b+'?':'Hva blir svaret?';
  return '<div class="mult-discovery">'+prompt+'</div><div class="mult-answer-row">'+multLabAnswerOptions().map(x=>'<button type="button" class="mult-answer '+(multLabUi.answer===x?'active':'')+'" data-mult-answer="'+x+'">'+x+'</button>').join('')+'</div>';
}
function multLabFreeDiscovery(){
  const product=multLabProduct();
  if(multLabUi.variant==='swap')return multLabUi.a+' × '+multLabUi.b+' og '+multLabUi.b+' × '+multLabUi.a+' blir begge '+product+'.';
  if(multLabUi.variant==='line')return multLabUi.a+' hopp på '+multLabUi.b+' lander på '+product+'.';
  if(multLabUi.variant==='patterns')return 'Trykk på et felt i tabellen for å utforske akkurat det gangestykket.';
  return multLabExpression()+'. '+multLabRepeatedAddition()+'.';
}
function multLabFeedbackHtml(){
  const f=multLabUi.feedback;if(!f)return '';
  return '<div class="mult-discovery '+f.type+'" id="mult-lab-feedback" aria-live="polite">'+f.text+'</div>';
}
function multLabExpectedAnswer(){
  const m=multLabMission();
  if(m.ask==='same')return 'Ja';
  return String(m.a*m.b);
}
function multLabCheck(){
  const m=multLabMission();
  if(multLabUi.a!==m.a||multLabUi.b!==m.b){
    multLabUi.feedback={type:'try',text:'Oppdraget bruker '+m.a+' × '+m.b+'. Sett faktorene tilbake, eller bruk Fri lek hvis du vil utforske fritt.'};
    renderMultiplicationLab();return;
  }
  if(multLabUi.answer===null){
    multLabUi.feedback={type:'try',text:'Velg et svar først.'};renderMultiplicationLab();return;
  }
  const correct=String(multLabUi.answer)===multLabExpectedAnswer();
  if(correct){
    ensureMultLabProgress();state.multiplicationLab.completed[multLabMissionKey()]=Date.now();saveState();
    multLabUi.feedback={type:'good',text:'Du fant det! ✨ '+multLabExpression()+'. '+(m.ask==='same'?'Det virker også når faktorene bytter plass.':'')};
    try{if(navigator.vibrate)navigator.vibrate([20,35,20])}catch(_){}
    try{playSuccessTone()}catch(_){}
  }else{
    multLabUi.feedback={type:'try',text:'Ikke helt. Bruk figuren til å se gruppene eller mønsteret, og prøv igjen.'};
  }
  renderMultiplicationLab();
}
function renderMultiplicationLab(){
  const root=document.getElementById('multiplication-lab-root');if(!root)return;
  const recommended=multLabRecommendedLevel();
  root.innerHTML='<div class="mult-lab-shell"><div class="mult-lab-head"><button type="button" class="detail-back" id="multiplication-lab-back" aria-label="Tilbake">←</button><div class="mult-lab-head-copy"><div class="eyebrow">Matte · eksperimenter</div><h1>Gangetabell-lab</h1></div><div class="mult-lab-head-spacer"></div></div><div class="mult-mode-tabs" role="tablist" aria-label="Velg modus"><button type="button" class="mult-mode-tab '+(multLabUi.mode==='mission'?'active':'')+'" data-mult-mode="mission">Oppdrag</button><button type="button" class="mult-mode-tab '+(multLabUi.mode==='free'?'active':'')+'" data-mult-mode="free">Fri lek</button></div><div class="mult-intro">Se hvorfor gange virker. Klassetrinnet anbefaler, men låser ingenting.</div><div class="mult-variants">'+MULT_LAB_VARIANTS.map(v=>'<button type="button" class="mult-variant '+(multLabUi.variant===v.id?'active':'')+'" data-mult-variant="'+v.id+'">'+v.icon+' '+v.label+'</button>').join('')+'</div>'+multLabMissionHtml()+'<div class="mult-equation-card"><div class="mult-equation-label">Gangestykket</div><div class="mult-equation">'+multLabExpression()+'</div><div class="mult-equation-sub">'+multLabRepeatedAddition()+'</div></div>'+multLabFactorPanelHtml()+multLabStageHtml()+'<div class="mult-completed-count">'+multLabCompletedCount()+' oppdagelser lagret på denne enheten · nivå '+(recommended+1)+' er anbefalt akkurat nå</div></div>';
  bindMultiplicationLabUi();
}
function bindMultiplicationLabUi(){
  document.getElementById('multiplication-lab-back')?.addEventListener('click',()=>openSubject('math'));
  document.querySelectorAll('[data-mult-mode]').forEach(b=>b.addEventListener('click',()=>{multLabUi.mode=b.dataset.multMode;multLabUi.answer=null;multLabUi.feedback=null;if(multLabUi.mode==='mission')multLabResetToMission();renderMultiplicationLab()}));
  document.querySelectorAll('[data-mult-variant]').forEach(b=>b.addEventListener('click',()=>multLabSetVariant(b.dataset.multVariant)));
  document.querySelectorAll('[data-mult-level]').forEach(b=>b.addEventListener('click',()=>multLabSetLevel(b.dataset.multLevel)));
  document.getElementById('mult-lab-harder')?.addEventListener('click',()=>multLabSetLevel(multLabUi.level+1));
  document.querySelectorAll('[data-factor-change]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.factorChange;const next=multLabClamp(multLabUi[key]+Number(b.dataset.delta));if(key==='a')multLabSetFactors(next,multLabUi.b);else multLabSetFactors(multLabUi.a,next)}));
  document.querySelectorAll('[data-factor-preset]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.factorPreset,n=Number(b.dataset.value);if(key==='a')multLabSetFactors(n,multLabUi.b);else multLabSetFactors(multLabUi.a,n)}));
  document.querySelectorAll('[data-mult-answer]').forEach(b=>b.addEventListener('click',()=>{multLabUi.answer=b.dataset.multAnswer;multLabUi.feedback=null;renderMultiplicationLab()}));
  document.getElementById('mult-lab-check')?.addEventListener('click',multLabCheck);
  document.querySelectorAll('[data-table-a]').forEach(b=>b.addEventListener('click',()=>{multLabUi.mode='free';multLabUi.variant='array';multLabSetFactors(Number(b.dataset.tableA),Number(b.dataset.tableB))}));
}
function openMultiplicationLab(){
  const grade=currentGrade();
  if(multLabUi.lastGrade!==grade){multLabUi.level=multLabRecommendedLevel();multLabUi.lastGrade=grade}
  multLabResetToMission();renderMultiplicationLab();showScreen('multiplication-lab');
}
window.openMultiplicationLab=openMultiplicationLab;
const multLabEntry=document.getElementById('open-multiplication-lab');
if(multLabEntry)multLabEntry.onclick=openMultiplicationLab;
