
(function(){
  if(typeof renderSubjectJourney!=='function') return;

  const baseRenderSubjectJourney=renderSubjectJourney;

  const BOK_LABELS={
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

  const BOK_ICONS={
    lyder:'ABC',
    ordbilder:'📖',
    ordlek:'RIM',
    'ordstart-checkpoint':'🗝',
    setningsrekkefolge:'ORD',
    ordbetydning:'🌿',
    'setninger-checkpoint':'✦',
    detaljer:'🔎',
    forsta:'📚',
    tenkvidere:'💭',
    'lesedetektiv-checkpoint':'🏆'
  };

  const CORE_POSITIONS=[
    [24,89],[55,82],[30,75],[63,68],[78,59],[42,52.5],
    [68,45],[34,37.5],[62,30],[40,22.5],[70,14.5]
  ];

  function bokCoreNodes(model){
    return model.areas.flatMap(area=>area.nodes.filter(n=>n.type==='skill'||n.type==='checkpoint'));
  }

  function bokNodeDone(node){
    const st=journeyNodeState(node);
    return node.type==='checkpoint'?st==='passed':['can-now','mastered'].includes(st);
  }

  function bokLabel(node){
    return BOK_LABELS[node.id]||node.title;
  }

  function bokIcon(node){
    const raw=BOK_ICONS[node.id]||(node.type==='checkpoint'?'🏆':'•');
    const tiny=/^[A-ZÆØÅ]{2,4}$/.test(raw)||raw==='RIM'||raw==='ORD';
    return '<span class="stop-icon'+(tiny?' tiny':'')+'">'+raw+'</span>';
  }

  function bokStatusBadge(node,st){
    if(st==='mastered'||st==='passed')return '★';
    if(st==='can-now')return '✓';
    if(st==='active')return '•';
    return '';
  }

  function bokVisualState(node,st,isNext,future){
    if(isNext&&!['can-now','mastered','passed'].includes(st))return 'next';
    if(future)return 'future';
    return st;
  }

  function bokRoute(core){
    if(core.length<2)return '';
    const pts=CORE_POSITIONS.slice(0,core.length);
    const base=[],done=[];
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i],b=pts[i+1],mx=(a[0]+b[0])/2+(i%2===0?8:-8),my=(a[1]+b[1])/2;
      const d='M '+a[0]+' '+a[1]+' Q '+mx+' '+my+' '+b[0]+' '+b[1];
      base.push('<path class="trail-shadow" d="'+d+'"/><path class="trail-base" d="'+d+'"/><path class="trail-light" d="'+d+'"/>');
      if(bokNodeDone(core[i])&&bokNodeDone(core[i+1]))done.push('<path class="trail-done" d="'+d+'"/>');
    }
    return '<svg class="bokskogen-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+base.join('')+done.join('')+'</svg>';
  }

  function tree(x,y,s,deep='#315C49',near='#4B8060'){
    return '<g transform="translate('+x+' '+y+') scale('+s+')"><rect x="-5" y="15" width="10" height="38" rx="4" fill="#6D4A32"/><circle cx="0" cy="0" r="27" fill="'+deep+'"/><circle cx="-17" cy="7" r="17" fill="'+near+'"/><circle cx="18" cy="8" r="19" fill="'+near+'"/><circle cx="1" cy="-15" r="17" fill="#568E68"/></g>';
  }

  function lantern(x,y,on=true){
    const glow=on?'<circle cx="0" cy="2" r="19" fill="#FFD97A" opacity=".20"/><circle cx="0" cy="2" r="10" fill="#FFE9A7" opacity=".30"/>':'';
    return '<g transform="translate('+x+' '+y+')">'+glow+'<path d="M0-23v12" stroke="#5A4432" stroke-width="3"/><path d="M-8-10h16l-2 18H-6z" fill="'+(on?'#FFD66E':'#9B8D76')+'" stroke="#6A4D2D" stroke-width="2"/><path d="M-5-14h10" stroke="#6A4D2D" stroke-width="3" stroke-linecap="round"/></g>';
  }

  function bokskogenArt(prog){
    const area1=prog.areasDone>=1,area2=prog.areasDone>=2,complete=prog.complete;
    const bridgeOpacity=area1?1:.55;
    const upperGlow=area2?1:.28;
    const libraryGlow=complete?1:.42;
    const trees=[
      tree(26,250,1.18),tree(394,270,1.05),tree(52,435,.82),tree(373,472,.95),
      tree(31,690,1.08),tree(397,732,.86),tree(62,925,.92),tree(385,1015,1.15),
      tree(117,323,.55),tree(310,378,.63),tree(115,785,.58),tree(320,886,.62)
    ].join('');
    const lamps=[
      lantern(82,1000,true),lantern(158,944,prog.done>=1),lantern(258,885,prog.done>=2),
      lantern(116,789,prog.done>=3),lantern(292,690,area1),lantern(172,596,area1),
      lantern(300,486,area2),lantern(151,389,area2),lantern(278,277,area2)
    ].join('');
    return '<svg class="bokskogen-art" viewBox="0 0 420 1180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+
      '<defs>'+
        '<linearGradient id="bokSky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#7EC5EC"/><stop offset=".42" stop-color="#E9F6F1"/><stop offset="1" stop-color="#EBD59B"/></linearGradient>'+
        '<linearGradient id="bokGround" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#60966A"/><stop offset="1" stop-color="#315C49"/></linearGradient>'+
        '<linearGradient id="bokWater" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#71D3D8"/><stop offset=".55" stop-color="#4AAFC1"/><stop offset="1" stop-color="#35869F"/></linearGradient>'+
        '<radialGradient id="bokWarm"><stop stop-color="#FFF2A6" stop-opacity=".95"/><stop offset="1" stop-color="#FFD26B" stop-opacity="0"/></radialGradient>'+
        '<filter id="bokSoft"><feGaussianBlur stdDeviation="6"/></filter>'+
      '</defs>'+
      '<rect width="420" height="1180" fill="url(#bokSky)"/>'+
      '<circle cx="343" cy="102" r="46" fill="#FFE090" opacity=".92"/>'+
      '<circle cx="343" cy="102" r="73" fill="url(#bokWarm)" opacity=".55"/>'+
      '<g fill="#fff" opacity=".68"><ellipse cx="85" cy="113" rx="54" ry="16"/><ellipse cx="126" cy="105" rx="33" ry="25"/><ellipse cx="47" cy="120" rx="29" ry="13"/><ellipse cx="294" cy="205" rx="43" ry="13"/><ellipse cx="326" cy="198" rx="27" ry="21"/></g>'+
      '<path d="M0 285Q71 213 135 267T257 235T420 226V491H0z" fill="#8CB493"/>'+
      '<path d="M0 385Q83 322 157 361T303 337T420 314V581H0z" fill="#6F9E79"/>'+
      '<path d="M0 515Q77 459 166 498T305 473T420 457V1180H0z" fill="url(#bokGround)"/>'+
      '<path d="M14 497Q53 474 91 492T154 490" fill="none" stroke="#EEF7EF" stroke-width="8" opacity=".40"/>'+
      '<path d="M20 541Q89 512 147 536T239 526" fill="none" stroke="#EEF7EF" stroke-width="5" opacity=".25"/>'+
      '<path d="M0 695Q85 626 154 678T290 651T420 637V1180H0z" fill="#47785C" opacity=".52"/>'+
      '<path d="M255 782C325 730 367 745 420 724V916C348 900 309 918 263 956C220 990 202 1032 174 1180H75C111 1058 142 976 185 907C210 866 229 811 255 782Z" fill="url(#bokWater)" opacity=".96"/>'+
      '<g opacity=".42"><path d="M279 807q36 18 72 0" fill="none" stroke="#E8FFFF" stroke-width="6" stroke-linecap="round"/><path d="M240 888q43 19 89 0" fill="none" stroke="#E8FFFF" stroke-width="5" stroke-linecap="round"/><path d="M178 1038q37 18 76 0" fill="none" stroke="#E8FFFF" stroke-width="5" stroke-linecap="round"/></g>'+
      '<path d="M79 1088Q131 1020 153 953T237 843T270 721T231 600T283 476T249 340T294 208" fill="none" stroke="#C99D5C" stroke-width="27" stroke-linecap="round" opacity=".38"/>'+
      '<path d="M79 1088Q131 1020 153 953T237 843T270 721T231 600T283 476T249 340T294 208" fill="none" stroke="#E9CF8C" stroke-width="18" stroke-linecap="round"/>'+
      '<path d="M79 1088Q131 1020 153 953T237 843T270 721T231 600T283 476T249 340T294 208" fill="none" stroke="#FFF1B7" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 15" opacity=".85"/>'+
      trees+
      '<g transform="translate(86 1009)"><path d="M-45 33V-18Q0-55 45-18V33" fill="#8A5B33" stroke="#5C3D25" stroke-width="5"/><path d="M-36 31V-12Q0-42 36-12V31" fill="'+(prog.done>0?'#F9D783':'#B49466')+'"/><circle cx="-17" cy="-5" r="7" fill="#6F4C2B"/><circle cx="0" cy="-10" r="7" fill="#6F4C2B"/><circle cx="17" cy="-5" r="7" fill="#6F4C2B"/><path d="M-23 18h46" stroke="#6F4C2B" stroke-width="4" stroke-linecap="round"/></g>'+
      '<g transform="translate(326 915)"><path d="M-44 22h88v48h-88z" fill="#B97842" stroke="#70492F" stroke-width="4"/><path d="M-52 22L0-19 52 22z" fill="#6E8C54" stroke="#4C653C" stroke-width="4"/><rect x="-28" y="36" width="22" height="19" rx="4" fill="#FFE49A"/><rect x="10" y="35" width="20" height="35" rx="5" fill="#7D5639"/><path d="M-58 70h116" stroke="#5E4431" stroke-width="6" stroke-linecap="round"/></g>'+
      '<g transform="translate(285 728)" opacity="'+bridgeOpacity+'"><path d="M-88 9Q-42-10 0 5T86-2" fill="none" stroke="#6B4930" stroke-width="8" stroke-linecap="round"/><g fill="#B77440" stroke="#68442C" stroke-width="2">'+
        '<rect x="-76" y="-2" width="26" height="19" rx="4" transform="rotate(-5 -63 8)"/><rect x="-48" y="-4" width="26" height="19" rx="4" transform="rotate(3 -35 6)"/><rect x="-20" y="-5" width="26" height="19" rx="4"/><rect x="8" y="-4" width="26" height="19" rx="4" transform="rotate(-3 21 6)"/><rect x="36" y="-1" width="26" height="19" rx="4" transform="rotate(4 49 9)"/><rect x="64" y="1" width="22" height="18" rx="4"/>'+
      '</g><path d="M-82-14Q0-35 89-17M-82 28Q0 8 89 21" fill="none" stroke="#8A623C" stroke-width="3"/></g>'+
      '<g transform="translate(106 838)"><ellipse cx="0" cy="0" rx="58" ry="38" fill="#4AAFC1" opacity=".96"/><g fill="#6FAF62"><ellipse cx="-30" cy="-6" rx="17" ry="9"/><ellipse cx="7" cy="11" rx="19" ry="10"/><ellipse cx="33" cy="-10" rx="15" ry="8"/></g><g fill="#F5D2E0"><circle cx="-27" cy="-7" r="4"/><circle cx="35" cy="-11" r="4"/></g><circle cx="6" cy="-2" r="13" fill="'+(prog.done>=2?'#8CC86E':'#6E9E66')+'"/><circle cx="2" cy="-8" r="3" fill="#2F4435"/><circle cx="10" cy="-8" r="3" fill="#2F4435"/></g>'+
      '<g transform="translate(118 632)" opacity="'+(area1?1:.58)+'"><path d="M-58 15Q0-20 58 15" fill="none" stroke="#7A5131" stroke-width="9"/><g transform="rotate(-7)"><rect x="-48" y="-4" width="28" height="22" rx="4" fill="#C95F4C"/><rect x="-17" y="-7" width="28" height="22" rx="4" fill="#476D9D"/><rect x="14" y="-5" width="28" height="22" rx="4" fill="#5B8B64"/></g></g>'+
      '<g transform="translate(320 458)" opacity="'+upperGlow+'"><path d="M-49 24h98v49h-98z" fill="#B87A45" stroke="#704A2D" stroke-width="4"/><path d="M-58 24L0-22 58 24z" fill="#58784B" stroke="#425C39" stroke-width="4"/><rect x="-30" y="38" width="22" height="18" rx="4" fill="#FFE89B"/><rect x="10" y="36" width="21" height="37" rx="5" fill="#765139"/><path d="M-16-2Q0-15 16-2" fill="none" stroke="#FFECA7" stroke-width="4"/></g>'+
      '<g transform="translate(124 374)" opacity="'+upperGlow+'"><rect x="-43" y="-12" width="86" height="34" rx="15" fill="#7A5738"/><path d="M-34-8q34-36 68 0" fill="#4E774D"/><path d="M-23 4h46" stroke="#F0D694" stroke-width="3" stroke-linecap="round"/><circle cx="-28" cy="-17" r="4" fill="#FFD473"/><circle cx="28" cy="-17" r="4" fill="#FFD473"/></g>'+
      '<g transform="translate(309 179)" opacity="'+libraryGlow+'"><circle cx="0" cy="0" r="84" fill="#FFD77A" opacity="'+(complete?.22:.08)+'" filter="url(#bokSoft)"/><path d="M-57 29h114v58h-114z" fill="#A96C3D" stroke="#64442D" stroke-width="5"/><path d="M-69 29L0-27 69 29z" fill="#4A7049" stroke="#36553A" stroke-width="5"/><rect x="-39" y="44" width="22" height="21" rx="4" fill="#FFE99D"/><rect x="17" y="44" width="22" height="21" rx="4" fill="#FFE99D"/><rect x="-11" y="48" width="22" height="39" rx="5" fill="#745038"/><path d="M-72 87h144" stroke="#5C4331" stroke-width="7" stroke-linecap="round"/><path d="M-32-24v-35M32-24v-35" stroke="#67472E" stroke-width="8"/><circle cx="-32" cy="-66" r="29" fill="#4B7D55"/><circle cx="32" cy="-66" r="31" fill="#4F865A"/></g>'+
      lamps+
      '<g fill="#F6EBDD" opacity=".92"><circle cx="57" cy="1095" r="4"/><circle cx="344" cy="1052" r="3"/><circle cx="60" cy="738" r="3"/><circle cx="357" cy="618" r="4"/><circle cx="78" cy="503" r="3"/><circle cx="350" cy="323" r="3"/></g>'+
      '<g fill="#E2574E"><circle cx="40" cy="1124" r="7"/><circle cx="389" cy="1089" r="6"/><circle cx="32" cy="846" r="6"/></g>'+
    '</svg>';
  }

  function bokStopMarkup(node,point,st,isNext,future,model){
    const visual=bokVisualState(node,st,isNext,future);
    const badge=bokStatusBadge(node,st);
    const disabled=future?' disabled aria-disabled="true"':'';
    const fox=isNext?'<span class="bokskogen-next-fox">'+journeyFoxSvg()+'</span><span class="bokskogen-next-bubble"><b>NESTE OPPDRAG</b><strong>'+bokLabel(node)+'</strong></span>':'';
    return '<button type="button" class="bokskogen-stop type-'+node.type+' state-'+visual+'" style="left:'+point[0]+'%;top:'+point[1]+'%" data-bok-node="'+node.id+'" aria-label="'+escapeAttr(bokLabel(node)+'. '+journeyStatusText(node,st))+'"'+disabled+'>'+fox+
      '<span class="stop-landmark">'+bokIcon(node)+(badge?'<span class="stop-state">'+badge+'</span>':'')+'</span><span class="stop-sign">'+bokLabel(node)+'</span></button>';
  }

  function bokSideMarkup(node,areaIndex,sideIndex,recommendedIndex,model){
    const st=journeyNodeState(node);
    const globalIndex=model.nodes.findIndex(n=>n.id===node.id);
    const future=recommendedIndex>=0&&globalIndex>recommendedIndex&&st==='new';
    const y=[78,48,28][areaIndex]||50;
    const x=node.type==='challenge'?(areaIndex%2===0?87:13):(areaIndex%2===0?12:88);
    return '<button type="button" class="bokskogen-side '+node.type+'" style="left:'+x+'%;top:'+(y+(sideIndex?5:0))+'%" data-bok-node="'+node.id+'"'+(future?' disabled aria-disabled="true"':'')+'>'+(node.type==='challenge'?'Bonus':'Repeter')+'</button>';
  }

  function renderBokskogenJourney(host,viewGrade,prog,recommended,model){
    host.className='journey-map bokskogen-map';
    const recommendedIndex=recommended?model.nodes.findIndex(n=>n.id===recommended.id):-1;
    const core=bokCoreNodes(model);
    const positions=CORE_POSITIONS.slice(0,core.length);

    document.getElementById('journey-grade-chip').textContent=GRADE_CONFIG[viewGrade].label;
    renderJourneyGradeStrip('norwegian','journey-grade-strip','journey-grade-note',viewGrade);
    document.getElementById('journey-heading-title').textContent=prog.complete?'Bokskogen er rundet!':'Bokskogen';

    const hud='<div class="bokskogen-hud"><span class="bok-grade">'+GRADE_CONFIG[viewGrade].label+'</span><div class="bok-progress"><strong>'+(prog.complete?'Hele skogen lyser':'Neste: '+(recommended?bokLabel(recommended):'Utforsk skogen'))+'</strong><small>'+prog.done+' av '+prog.total+' hovedoppdrag</small><div class="bok-progress-track"><i style="width:'+prog.pct+'%"></i></div></div><span class="bok-trophies">🏆 '+prog.areasDone+'/'+model.areas.length+'</span></div>';

    const mainNodes=core.map((node,i)=>{
      const st=journeyNodeState(node);
      const globalIndex=model.nodes.findIndex(n=>n.id===node.id);
      const isNext=!!recommended&&recommended.id===node.id;
      const future=!isNext&&recommendedIndex>=0&&globalIndex>recommendedIndex&&st==='new';
      return bokStopMarkup(node,positions[i]||[50,50],st,isNext,future,model);
    }).join('');

    const sideNodes=model.areas.map((area,areaIndex)=>{
      return area.nodes.filter(n=>n.type==='challenge'||n.type==='review').map((n,i)=>bokSideMarkup(n,areaIndex,i,recommendedIndex,model)).join('');
    }).join('');

    const world='<section class="bokskogen-world'+(prog.complete?' is-complete':'')+'" aria-label="Bokskogen, spillbrett for norsk">'+
      bokskogenArt(prog)+bokRoute(core)+
      '<div class="bokskogen-title"><strong>Bokskogen</strong><small>EVENTYRSTIEN TIL BIBLIOTEKET</small></div>'+
      mainNodes+sideNodes+
      '<div class="bokskogen-world-note"><strong>Skogen forandrer seg når du lærer.</strong><br>Porter åpnes, lys tennes og nye steder våkner til liv.</div>'+
    '</section>';

    host.innerHTML=hud+world;

    host.querySelectorAll('[data-bok-node]').forEach(btn=>{
      if(btn.disabled)return;
      btn.onclick=()=>openJourneyMission('norwegian',btn.dataset.bokNode,viewGrade,false);
    });

    const finish=document.getElementById('journey-finish');
    finish.classList.toggle('complete',prog.complete);
    finish.innerHTML=prog.complete
      ?'<strong>🏆 Bokskogen er rundet</strong><p>Biblioteket lyser, og alle hovedstiene er åpne. Du kan besøke oppdragene igjen når du vil.</p><div class="journey-finish-actions"><button class="secondary" id="journey-repeat-grade">Repeter</button><button class="secondary" id="journey-next-grade">Utforsk 3. klasse</button></div>'
      :'<strong>🌲 Eventyrstien til biblioteket</strong><p>Følg stien gjennom Bokskogen. Hvert hovedområde du mestrer gjør verden litt mer levende.</p>';

    const repeatBtn=document.getElementById('journey-repeat-grade');
    if(repeatBtn)repeatBtn.onclick=()=>startJourneyReview('norwegian',viewGrade);
    const nextBtn=document.getElementById('journey-next-grade');
    if(nextBtn)nextBtn.onclick=()=>setJourneyViewGrade('norwegian',3);
    const review=document.getElementById('journey-review');
    if(review)review.onclick=()=>startJourneyReview('norwegian',viewGrade);
    const challenge=document.getElementById('journey-challenge');
    if(challenge)challenge.onclick=()=>startJourneyChallenge('norwegian',viewGrade);

    if(recommended){
      requestAnimationFrame(()=>{
        const next=host.querySelector('.bokskogen-stop.state-next');
        if(next) setTimeout(()=>next.scrollIntoView({behavior:'auto',block:'center',inline:'nearest'}),35);
      });
    }
  }

  renderSubjectJourney=function(){
    if(!SUBJECTS[activeSubject])return baseRenderSubjectJourney();
    const viewGrade=journeyViewGrade(activeSubject);
    if(activeSubject!=='norwegian'||viewGrade>2)return baseRenderSubjectJourney();

    const host=document.getElementById('journey-map');
    if(!host)return;
    const prog=journeyProgress('norwegian',viewGrade);
    const recommended=journeyRecommendedNode('norwegian',viewGrade);
    renderBokskogenJourney(host,viewGrade,prog,recommended,prog.model);
  };
})();
