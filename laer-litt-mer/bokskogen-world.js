
(function(){
  if(typeof renderSubjectJourney!=='function')return;

  const baseRenderSubjectJourney=renderSubjectJourney;

  const LABELS={
    lyder:'Bokstavporten',
    ordbilder:'Lesestua',
    ordlek:'Rimdammen',
    'ordstart-checkpoint':'Skogsporten',
    setningsrekkefolge:'Ordbrua',
    ordbetydning:'Ordhagen',
    'setninger-checkpoint':'Fortellerhytta',
    detaljer:'Detektivstien',
    forsta:'Historiehytta',
    tenkvidere:'Fortell',
    'lesedetektiv-checkpoint':'Biblioteket'
  };

  const CORE_POSITIONS=[
    [24,89],[55,82],[30,75],[63,68],[78,59],[42,52.5],
    [68,45],[34,37.5],[62,30],[40,22.5],[70,14.5]
  ];

  function label(node){return LABELS[node.id]||node.title}
  function coreNodes(model){return model.areas.flatMap(a=>a.nodes.filter(n=>n.type==='skill'||n.type==='checkpoint'))}
  function nodeDone(node){
    const st=journeyNodeState(node);
    return node.type==='checkpoint'?st==='passed':['can-now','mastered'].includes(st);
  }
  function visualState(node,st,isNext,future){
    if(isNext&&!['can-now','mastered','passed'].includes(st))return 'next';
    if(future)return 'future';
    return st;
  }
  function statusMark(st){
    if(st==='mastered'||st==='passed')return 'mastered';
    if(st==='can-now')return 'done';
    return '';
  }

  function tree(x,y,s=1,a='#315F4C',b='#4E8562'){
    return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
      '<ellipse cx="0" cy="43" rx="31" ry="10" fill="rgba(23,49,40,.14)"/>'+
      '<rect x="-6" y="7" width="12" height="45" rx="5" fill="#6C4931"/>'+
      '<circle cx="0" cy="-10" r="30" fill="'+a+'"/>'+
      '<circle cx="-20" cy="3" r="20" fill="'+b+'"/>'+
      '<circle cx="20" cy="4" r="21" fill="'+b+'"/>'+
      '<circle cx="-2" cy="-27" r="19" fill="#5A936B"/>'+
    '</g>';
  }
  function pine(x,y,s=1,c='#285746'){
    return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
      '<rect x="-4" y="25" width="8" height="31" rx="3" fill="#6B4A34"/>'+
      '<path d="M0-39L-29 8H29zM0-18L-35 27H35zM0 0L-39 45H39z" fill="'+c+'"/>'+
      '<path d="M0-29L-18 3H18z" fill="#41745A" opacity=".72"/>'+
    '</g>';
  }
  function rock(x,y,s=1){
    return '<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M-18 12L-11-10 3-17 20 4 14 15z" fill="#8FA4A0"/><path d="M-11-10L2-8 14 15-18 12z" fill="#B8C6C0" opacity=".72"/></g>';
  }
  function flower(x,y,c='#F4A5B7'){
    return '<g transform="translate('+x+' '+y+')"><path d="M0 2v12" stroke="#47744F" stroke-width="2"/><circle cx="-4" cy="-2" r="4" fill="'+c+'"/><circle cx="4" cy="-2" r="4" fill="'+c+'"/><circle cx="0" cy="-6" r="4" fill="'+c+'"/><circle cx="0" cy="2" r="4" fill="'+c+'"/><circle r="2.4" fill="#F9D96B"/></g>';
  }
  function lamp(x,y,on=true,s=1){
    return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
      (on?'<circle cy="1" r="27" fill="#FFE38A" opacity=".17"/><circle cy="1" r="14" fill="#FFEBA7" opacity=".24"/>':'')+
      '<path d="M0-29v13" stroke="#5A4130" stroke-width="4"/>'+
      '<path d="M-10-15h20l-3 24H-7z" fill="'+(on?'#FFD76E':'#8A8171')+'" stroke="#68472C" stroke-width="3"/>'+
      '<path d="M-6-20h12" stroke="#68472C" stroke-width="4" stroke-linecap="round"/>'+
    '</g>';
  }
  function book(x,y,s=1){
    return '<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M-27-15q15-6 27 4v31q-14-8-27-3zM27-15q-15-6-27 4v31q14-8 27-3z" fill="#FFF5D5" stroke="#8D5B43" stroke-width="3"/><path d="M0-10v28" stroke="#BE7661" stroke-width="2.5"/><path d="M-20-5h13M7-5h13M-20 2h11M7 2h11" stroke="#C98D78" stroke-width="2" stroke-linecap="round"/></g>';
  }

  function letterGate(x,y,lit){
    return '<g transform="translate('+x+' '+y+')">'+
      '<ellipse cx="0" cy="45" rx="54" ry="12" fill="rgba(29,50,42,.18)"/>'+
      '<path d="M-45 39V-5Q0-48 45-5V39" fill="#826047" stroke="#4F3B30" stroke-width="6"/>'+
      '<path d="M-34 36V1Q0-33 34 1V36" fill="'+(lit?'#F7D47B':'#9F8D6D')+'"/>'+
      '<circle cx="0" cy="4" r="46" fill="'+(lit?'#FFE28A':'#B9AF96')+'" opacity="'+(lit?'.10':'.05')+'"/>'+
      '<g font-family="system-ui,sans-serif" font-weight="1000" font-size="19" fill="#FFF2C1"><text x="-28" y="-8">A</text><text x="-7" y="-21">B</text><text x="18" y="-8">C</text></g>'+
      lamp(-54,19,lit,.72)+lamp(54,19,lit,.72)+
    '</g>';
  }
  function readingHut(x,y,lit){
    return '<g transform="translate('+x+' '+y+')">'+
      '<ellipse cx="0" cy="40" rx="48" ry="11" fill="rgba(25,51,42,.16)"/>'+
      '<rect x="-38" y="-13" width="76" height="54" rx="8" fill="#B97542" stroke="#69452F" stroke-width="5"/>'+
      '<path d="M-48-13L0-49 48-13z" fill="#557A50" stroke="#3C5A3D" stroke-width="5"/>'+
      '<rect x="-28" y="2" width="18" height="16" rx="4" fill="'+(lit?'#FFE59B':'#849786')+'"/>'+
      '<rect x="10" y="-1" width="18" height="42" rx="5" fill="#765038"/>'+
      book(0,-3,.58)+
    '</g>';
  }
  function rimPond(x,y,lit){
    return '<g transform="translate('+x+' '+y+')">'+
      '<ellipse rx="67" ry="40" fill="#44AFC0" stroke="#7BD3D2" stroke-width="5"/>'+
      '<g fill="#6CAF62"><ellipse cx="-31" cy="-6" rx="18" ry="9"/><ellipse cx="12" cy="15" rx="21" ry="10"/><ellipse cx="37" cy="-12" rx="15" ry="8"/></g>'+
      '<g fill="#EFA5C5"><circle cx="-29" cy="-7" r="5"/><circle cx="39" cy="-13" r="5"/></g>'+
      '<g transform="translate(8 -7)"><circle r="15" fill="#78B76A"/><circle cx="-5" cy="-12" r="5" fill="#78B76A"/><circle cx="5" cy="-12" r="5" fill="#78B76A"/><circle cx="-5" cy="-13" r="2" fill="#263A31"/><circle cx="5" cy="-13" r="2" fill="#263A31"/><path d="M-5 2q5 5 10 0" fill="none" stroke="#35513A" stroke-width="2"/></g>'+
      (lit?'<g fill="#FFF1B0"><circle cx="-52" cy="7" r="3"/><circle cx="53" cy="-1" r="3"/></g>':'')+
    '</g>';
  }
  function forestGate(x,y,lit){
    return '<g transform="translate('+x+' '+y+')">'+
      '<ellipse cx="0" cy="42" rx="53" ry="11" fill="rgba(28,51,43,.17)"/>'+
      '<path d="M-44 40V0Q0-42 44 0V40" fill="none" stroke="#6F5439" stroke-width="17" stroke-linecap="round"/>'+
      '<path d="M-38 37V3Q0-31 38 3V37" fill="none" stroke="#9A774D" stroke-width="5"/>'+
      '<g fill="#4E7C58"><circle cx="-42" cy="-1" r="13"/><circle cx="42" cy="-1" r="13"/><circle cx="-31" cy="-25" r="13"/><circle cx="31" cy="-25" r="13"/></g>'+
      lamp(0,-31,lit,.82)+
      '<circle cx="0" cy="4" r="7" fill="'+(lit?'#FFD562':'#7F7768')+'"/>'+
    '</g>';
  }
  function wordBridge(x,y,lit){
    return '<g transform="translate('+x+' '+y+') rotate(-6)">'+
      '<path d="M-72 19Q0-8 72 18" fill="none" stroke="#6B4A32" stroke-width="9" stroke-linecap="round"/>'+
      '<g fill="'+(lit?'#BE7E45':'#8F7A61')+'" stroke="#67462E" stroke-width="2">'+
        '<rect x="-64" y="-3" width="27" height="26" rx="5"/><rect x="-34" y="-7" width="27" height="26" rx="5"/><rect x="-4" y="-9" width="27" height="26" rx="5"/><rect x="26" y="-6" width="27" height="26" rx="5"/><rect x="56" y="-1" width="23" height="24" rx="5"/>'+
      '</g>'+
      '<path d="M-72-15Q0-42 76-15M-72 37Q0 11 76 36" fill="none" stroke="#805B3B" stroke-width="3"/>'+
      '<g font-family="system-ui,sans-serif" font-weight="1000" font-size="12" fill="#FFF1BD"><text x="-26" y="9">O</text><text x="2" y="7">R</text><text x="31" y="10">D</text></g>'+
    '</g>';
  }
  function garden(x,y,lit){
    let fs='';[-40,-25,-8,12,28,42].forEach((dx,i)=>{fs+=flower(dx,20-(i%2)*7,['#F1A4B7','#F4C56C','#9FC8F4'][i%3])});
    return '<g transform="translate('+x+' '+y+')">'+
      '<path d="M-58 34v-34Q0-48 58 0v34" fill="none" stroke="#795337" stroke-width="8"/>'+
      '<path d="M-51 31v-28Q0-38 51 3v28" fill="none" stroke="#5B8A59" stroke-width="7"/>'+
      fs+book(0,0,.72)+
      (lit?'<circle cx="0" cy="0" r="57" fill="#FFE692" opacity=".08"/>':'')+
    '</g>';
  }
  function cabin(x,y,lit,kind='story'){
    const icon=kind==='detective'
      ?'<g transform="translate(-2 -5)"><circle r="15" fill="none" stroke="#E5F0E7" stroke-width="5"/><path d="M11 11l20 20" stroke="#6A4C35" stroke-width="7" stroke-linecap="round"/></g>'
      :kind==='tell'
      ?'<path d="M-18 2q18-18 36 0M-13 12h26" fill="none" stroke="#FFE6A1" stroke-width="4" stroke-linecap="round"/>'
      :book(0,1,.52);
    return '<g transform="translate('+x+' '+y+')">'+
      '<ellipse cx="0" cy="42" rx="50" ry="12" fill="rgba(24,49,42,.17)"/>'+
      '<rect x="-40" y="-14" width="80" height="57" rx="9" fill="#AD7142" stroke="#68462F" stroke-width="5"/>'+
      '<path d="M-50-14L0-53 50-14z" fill="#4E704C" stroke="#39553C" stroke-width="5"/>'+
      '<rect x="-29" y="2" width="18" height="17" rx="4" fill="'+(lit?'#FFE49B':'#839182')+'"/>'+
      '<rect x="12" y="0" width="20" height="43" rx="5" fill="#765038"/>'+
      icon+
      (lit?'<circle cx="0" cy="-7" r="58" fill="#FFE58F" opacity=".06"/>':'')+
    '</g>';
  }
  function treehouse(x,y,lit){
    return '<g transform="translate('+x+' '+y+')">'+
      '<path d="M-6 21v72" stroke="#6A4932" stroke-width="16" stroke-linecap="round"/>'+
      '<rect x="-48" y="-34" width="88" height="55" rx="10" fill="#A86D40" stroke="#63442F" stroke-width="5"/>'+
      '<path d="M-58-34L-6-72 49-34z" fill="#50704A" stroke="#38533A" stroke-width="5"/>'+
      '<rect x="-31" y="-19" width="19" height="18" rx="4" fill="'+(lit?'#FFE49C':'#819080')+'"/>'+
      '<rect x="11" y="-19" width="18" height="40" rx="5" fill="#754E36"/>'+
      '<path d="M39 6q25 4 32 22" fill="none" stroke="#765035" stroke-width="5"/>'+
      lamp(-55,-2,lit,.62)+
    '</g>';
  }
  function library(x,y,lit){
    return '<g transform="translate('+x+' '+y+')">'+
      (lit?'<circle cx="0" cy="-5" r="105" fill="#FFE283" opacity=".12"/>':'')+
      '<rect x="-65" y="-18" width="130" height="76" rx="10" fill="#9F6A40" stroke="#5E4230" stroke-width="6"/>'+
      '<rect x="-34" y="-55" width="68" height="113" rx="10" fill="#B87945" stroke="#5E4230" stroke-width="6"/>'+
      '<path d="M-79-18L0-79 79-18z" fill="#425F45" stroke="#314A36" stroke-width="6"/>'+
      '<path d="M-45-55L0-94 45-55z" fill="#4F704D" stroke="#314A36" stroke-width="5"/>'+
      '<path d="M-58-18v-46M58-18v-46M0-55v-49" stroke="#765036" stroke-width="12"/>'+
      '<path d="M-72-64l14-21 14 21M44-64l14-21 14 21M-14-104L0-126 14-104" fill="#4F704D" stroke="#314A36" stroke-width="4"/>'+
      '<rect x="-53" y="4" width="20" height="21" rx="4" fill="'+(lit?'#FFE89D':'#879789')+'"/><rect x="33" y="4" width="20" height="21" rx="4" fill="'+(lit?'#FFE89D':'#879789')+'"/>'+
      '<rect x="-12" y="8" width="24" height="50" rx="6" fill="#734C35"/>'+
      book(0,-28,.86)+
    '</g>';
  }

  function worldArt(prog){
    const a1=prog.areasDone>=1,a2=prog.areasDone>=2,all=prog.complete;
    const litCount=prog.done;
    const scenery=[
      tree(38,210,1.18),tree(390,245,1.06),tree(42,420,.88),tree(383,485,.98),
      tree(31,690,1.08),tree(393,755,.94),tree(48,1005,1.02),tree(392,1112,1.13),
      tree(30,1328,1.18),tree(390,1398,1.05),
      pine(96,286,.78),pine(327,340,.72),pine(84,610,.76),pine(340,615,.82),
      pine(88,890,.74),pine(350,970,.82),pine(80,1210,.75),pine(344,1270,.80),
      rock(69,745,.8),rock(349,827,.72),rock(78,1178,.77),rock(344,1198,.82),
      flower(56,1273,'#F4A0B8'),flower(74,1264,'#F5C96A'),flower(351,1080,'#AEBCF2'),flower(364,1070,'#F2A4BD'),
      flower(58,856,'#F6C96A'),flower(372,713,'#F4A3B7'),flower(54,515,'#A9BFF0')
    ].join('');

    const lights=[
      lamp(83,1375,litCount>=1,.62),lamp(185,1271,litCount>=2,.58),lamp(99,1168,litCount>=3,.58),
      lamp(266,1067,a1,.63),lamp(336,938,a1,.58),lamp(186,841,a1,.58),
      lamp(284,719,a2,.58),lamp(146,607,a2,.58),lamp(264,492,a2,.58),
      lamp(177,377,a2,.58),lamp(291,268,all,.62)
    ].join('');

    const fog=!a1
      ?'<g opacity=".24" filter="url(#bokMist)"><ellipse cx="210" cy="515" rx="245" ry="94" fill="#E7EFEA"/><ellipse cx="250" cy="335" rx="215" ry="72" fill="#EDF3EF"/></g>'
      :!a2
      ?'<g opacity=".18" filter="url(#bokMist)"><ellipse cx="228" cy="430" rx="228" ry="72" fill="#EDF3EF"/><ellipse cx="280" cy="275" rx="175" ry="58" fill="#EFF5F2"/></g>'
      :!all
      ?'<g opacity=".13" filter="url(#bokMist)"><ellipse cx="282" cy="252" rx="170" ry="52" fill="#EFF5F2"/></g>'
      :'';

    return '<svg class="bokskogen-art" viewBox="0 0 420 1500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+
      '<defs>'+
        '<linearGradient id="bokSky2" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#78BDE4"/><stop offset=".30" stop-color="#D9EEF0"/><stop offset=".62" stop-color="#DCE7C3"/><stop offset="1" stop-color="#D6BF86"/></linearGradient>'+
        '<linearGradient id="bokGround2" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#65936B"/><stop offset="1" stop-color="#2D5A49"/></linearGradient>'+
        '<linearGradient id="bokWater2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#74D1DC"/><stop offset=".58" stop-color="#45AFC2"/><stop offset="1" stop-color="#337D99"/></linearGradient>'+
        '<linearGradient id="bokPath2" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#F4DB9B"/><stop offset="1" stop-color="#CEAD69"/></linearGradient>'+
        '<linearGradient id="bokFog" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#D9E4DF" stop-opacity="0"/><stop offset=".38" stop-color="#D9E4DF" stop-opacity=".76"/><stop offset="1" stop-color="#D3DEDC" stop-opacity=".95"/></linearGradient>'+
        '<filter id="bokBlur2"><feGaussianBlur stdDeviation="9"/></filter>'+
        '<filter id="bokMist"><feGaussianBlur stdDeviation="22"/></filter>'+
      '</defs>'+
      '<rect width="420" height="1500" fill="url(#bokSky2)"/>'+
      '<circle cx="350" cy="105" r="46" fill="#FFE393" opacity=".94"/><circle cx="350" cy="105" r="78" fill="#FFE7A1" opacity=".18" filter="url(#bokBlur2)"/>'+
      '<g fill="#fff" opacity=".64"><ellipse cx="84" cy="119" rx="52" ry="16"/><ellipse cx="125" cy="110" rx="31" ry="24"/><ellipse cx="45" cy="126" rx="28" ry="13"/><ellipse cx="287" cy="188" rx="43" ry="13"/><ellipse cx="318" cy="181" rx="27" ry="21"/></g>'+
      '<path d="M0 300Q70 221 137 274T267 241T420 224V566H0z" fill="#91B097"/>'+
      '<path d="M0 438Q78 359 153 405T302 367T420 347V735H0z" fill="#6F9778"/>'+
      '<path d="M0 625Q87 550 173 598T316 566T420 551V1500H0z" fill="url(#bokGround2)"/>'+
      '<path d="M0 924Q87 850 171 899T313 868T420 850V1500H0z" fill="#46755A" opacity=".55"/>'+
      '<path d="M323 762C384 818 400 915 367 1011C338 1095 282 1131 238 1199C205 1250 192 1331 168 1500H84C111 1328 143 1212 198 1136C248 1067 287 1030 298 966C310 897 280 829 323 762Z" fill="url(#bokWater2)" opacity=".97"/>'+
      '<path d="M0 1070C86 1037 131 1064 175 1124C208 1169 217 1217 201 1277C184 1338 144 1395 123 1500H0z" fill="#4B9CAE" opacity=".76"/>'+
      '<g opacity=".34"><path d="M302 844q39 20 78 0" fill="none" stroke="#EAFFFF" stroke-width="7" stroke-linecap="round"/><path d="M278 987q42 19 86 0" fill="none" stroke="#EAFFFF" stroke-width="6" stroke-linecap="round"/><path d="M171 1264q38 18 78 0" fill="none" stroke="#EAFFFF" stroke-width="6" stroke-linecap="round"/></g>'+
      '<path d="M103 1435Q92 1360 121 1315T226 1240T133 1122T265 1018T328 886T176 788T286 675T143 563T260 450T168 338T294 218" fill="none" stroke="rgba(88,67,40,.13)" stroke-width="11" stroke-linecap="round"/>'+
      '<path d="M103 1435Q92 1360 121 1315T226 1240T133 1122T265 1018T328 886T176 788T286 675T143 563T260 450T168 338T294 218" fill="none" stroke="#DCC995" stroke-width="6.4" stroke-linecap="round"/>'+
      '<path d="M103 1435Q92 1360 121 1315T226 1240T133 1122T265 1018T328 886T176 788T286 675T143 563T260 450T168 338T294 218" fill="none" stroke="#FFF0B7" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1.2 18" opacity=".72"/>'+
      scenery+
      '<g transform="translate(320 895)"><path d="M-68 28q68-44 136 0" fill="none" stroke="#3D8EA1" stroke-width="27" opacity=".62"/>'+wordBridge(0,0,litCount>=5)+'</g>'+
      letterGate(101,1335,litCount>=1)+
      readingHut(231,1230,litCount>=2)+
      rimPond(126,1125,litCount>=3)+
      forestGate(265,1020,a1)+
      garden(176,788,litCount>=6)+
      cabin(286,675,a2,'tell')+
      cabin(143,563,a2,'detective')+
      cabin(260,450,a2,'story')+
      treehouse(168,338,a2)+
      library(294,218,all)+
      lights+
      '<g fill="#F6EEE0" opacity=".90"><circle cx="55" cy="1417" r="4"/><circle cx="357" cy="1342" r="3"/><circle cx="64" cy="1008" r="3"/><circle cx="360" cy="732" r="4"/><circle cx="72" cy="505" r="3"/><circle cx="346" cy="331" r="3"/></g>'+
      fog+
    '</svg>';
  }

  function route(core){
    const pts=CORE_POSITIONS.slice(0,core.length),done=[];
    for(let i=0;i<pts.length-1;i++){
      if(!nodeDone(core[i])||!nodeDone(core[i+1]))continue;
      const a=pts[i],b=pts[i+1],mx=(a[0]+b[0])/2+(i%2===0?5:-5),my=(a[1]+b[1])/2;
      done.push('<path class="trail-done" d="M '+a[0]+' '+a[1]+' Q '+mx+' '+my+' '+b[0]+' '+b[1]+'"/>');
    }
    return '<svg class="bokskogen-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+done.join('')+'</svg>';
  }

  function stopMarkup(node,point,st,isNext,future){
    const visual=visualState(node,st,isNext,future);
    return '<button type="button" class="bokskogen-stop state-'+visual+'" style="left:'+point[0]+'%;top:'+point[1]+'%" data-bok-node="'+node.id+'" aria-label="'+escapeAttr(label(node)+'. '+journeyStatusText(node,st))+'"'+(future?' disabled aria-disabled="true"':'')+'>'+
      '<span class="stop-hit"></span>'+
      (isNext?'<span class="stop-label">'+label(node)+'</span>':'')+
    '</button>';
  }

  function sideMarkup(node,areaIndex,index,recommendedIndex,model){
    const st=journeyNodeState(node),globalIndex=model.nodes.findIndex(n=>n.id===node.id);
    const future=recommendedIndex>=0&&globalIndex>recommendedIndex&&st==='new';
    const positions=[
      [[88,79],[12,83]],
      [[10,53],[89,49]],
      [[87,29],[11,32]]
    ];
    const p=(positions[areaIndex]||positions[0])[index%2];
    return '<button type="button" class="bokskogen-side '+node.type+'" style="left:'+p[0]+'%;top:'+p[1]+'%" data-bok-node="'+node.id+'"'+(future?' disabled aria-disabled="true"':'')+' aria-label="'+escapeAttr(node.type==='challenge'?'Bonusoppdrag':'Repetisjon')+'"><span class="side-plank">'+(node.type==='challenge'?'✦ Bonus':'↻ Repeter')+'</span></button>';
  }

  function renderBokskogen(host,viewGrade,prog,recommended,model){
    const screen=document.getElementById('subject-screen');
    screen.classList.add('bokskogen-v3-active');
    host.className='journey-map bokskogen-map';

    const recommendedIndex=recommended?model.nodes.findIndex(n=>n.id===recommended.id):-1;
    const core=coreNodes(model),positions=CORE_POSITIONS.slice(0,core.length);

    renderJourneyGradeStrip('norwegian','journey-grade-strip','journey-grade-note',viewGrade);

    const main=core.map((node,i)=>{
      const st=journeyNodeState(node),globalIndex=model.nodes.findIndex(n=>n.id===node.id),isNext=!!recommended&&recommended.id===node.id;
      const future=!isNext&&recommendedIndex>=0&&globalIndex>recommendedIndex&&st==='new';
      return stopMarkup(node,positions[i]||[50,50],st,isNext,future);
    }).join('');

    const sparkles=core.map((node,i)=>{
      if(!nodeDone(node))return '';
      const p=positions[i]||[50,50],kind=statusMark(journeyNodeState(node));
      return '<span class="bokskogen-world-spark '+kind+'" style="left:'+(p[0]+(p[0]<50?7:-7))+'%;top:'+(p[1]-3)+'%" aria-hidden="true"></span>';
    }).join('');

    const sides=model.areas.map((area,ai)=>area.nodes.filter(n=>n.type==='challenge'||n.type==='review').map((n,i)=>sideMarkup(n,ai,i,recommendedIndex,model)).join('')).join('');

    let guide='';
    if(recommended){
      const ci=core.findIndex(n=>n.id===recommended.id);
      const p=ci>=0?positions[ci]:[50,55];
      const gx=Math.max(12,Math.min(88,p[0]+(p[0]<50?14:-14)));
      const gy=Math.max(10,Math.min(93,p[1]+3));
      const tx=Math.max(16,Math.min(84,gx+(gx<50?10:-10)));
      guide='<div class="bokskogen-guide" style="left:'+gx+'%;top:'+gy+'%">'+journeyFoxSvg()+'</div>'+
        '<div class="bokskogen-guide-tag" style="left:'+tx+'%;top:'+(gy-3)+'%"><span>NESTE</span>'+label(recommended)+'</div>';
    }

    const top='<div class="bokskogen-topbar"><div class="bokskogen-brand"><small>NORSK · '+GRADE_CONFIG[viewGrade].label.toUpperCase()+'</small><strong>Bokskogen</strong></div>'+
      '<div class="bokskogen-progress"><div class="bokskogen-progress-head"><b>★ '+prog.done+'/'+prog.total+'</b><span>🏆 '+prog.areasDone+'/'+model.areas.length+'</span></div><div class="bokskogen-progress-track"><i style="width:'+prog.pct+'%"></i></div><small>'+(prog.complete?'Hele skogen lyser':'Eventyrstien til biblioteket')+'</small></div></div>';

    host.innerHTML='<section class="bokskogen-world'+(prog.complete?' is-complete':'')+'" aria-label="Bokskogen, interaktiv læringsverden">'+
      worldArt(prog)+route(core)+top+main+sparkles+sides+guide+
    '</section>';

    host.querySelectorAll('[data-bok-node]').forEach(btn=>{
      if(btn.disabled)return;
      btn.onclick=()=>openJourneyMission('norwegian',btn.dataset.bokNode,viewGrade,false);
    });

    const finish=document.getElementById('journey-finish');
    finish.classList.toggle('complete',prog.complete);
    finish.innerHTML=prog.complete
      ?'<strong>🏆 Bokskogen er rundet</strong><p>Biblioteket lyser og hele eventyrstien er åpen. Du kan besøke alle stedene igjen når du vil.</p><div class="journey-finish-actions"><button class="secondary" id="journey-repeat-grade">Repeter</button><button class="secondary" id="journey-next-grade">Utforsk 3. klasse</button></div>'
      :'<strong>🌲 Målet: få biblioteket til å lyse</strong><p>Følg reven gjennom skogen. Nye steder våkner til liv når du mestrer dem.</p>';

    const repeatBtn=document.getElementById('journey-repeat-grade');
    if(repeatBtn)repeatBtn.onclick=()=>startJourneyReview('norwegian',viewGrade);
    const nextBtn=document.getElementById('journey-next-grade');
    if(nextBtn)nextBtn.onclick=()=>setJourneyViewGrade('norwegian',3);

    if(recommended){
      requestAnimationFrame(()=>{
        const next=host.querySelector('.bokskogen-stop.state-next');
        if(next)setTimeout(()=>next.scrollIntoView({behavior:'auto',block:'center',inline:'nearest'}),40);
      });
    }
  }

  renderSubjectJourney=function(){
    const screen=document.getElementById('subject-screen');
    const viewGrade=journeyViewGrade(activeSubject);
    if(activeSubject!=='norwegian'||viewGrade>2){
      if(screen){
        screen.classList.remove('bokskogen-v3-active');
        screen.classList.remove('bokskogen-v2-active');
      }
      return baseRenderSubjectJourney();
    }
    const host=document.getElementById('journey-map');
    if(!host)return;
    const prog=journeyProgress('norwegian',viewGrade);
    const recommended=journeyRecommendedNode('norwegian',viewGrade);
    renderBokskogen(host,viewGrade,prog,recommended,prog.model);
  };
})();
