
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

  // The illustration has seven real destinations. Learning missions live inside
  // those destinations instead of being rendered as eleven artificial map nodes.
  const PLACE_DEFS=[
    {id:'bokstavporten',title:'Bokstavporten',point:[30,93.5],required:['lyder']},
    {id:'lesestua',title:'Lesestua',point:[78,70],required:['ordbilder']},
    {id:'rimdammen',title:'Rimdammen',point:[78,44],required:['ordlek']},
    {id:'skogsporten',title:'Skogsporten',point:[27,53],required:['ordstart-checkpoint'],extrasArea:'ordstart'},
    {id:'ordbrua',title:'Ordbrua',point:[43,32],required:['setningsrekkefolge']},
    {id:'ordhagen',title:'Ordhagen',point:[39,21],required:['ordbetydning','setninger-checkpoint'],extrasArea:'setninger'},
    {id:'biblioteket',title:'Biblioteket',point:[76,11.5],required:['detaljer','forsta','tenkvidere','lesedetektiv-checkpoint'],extrasArea:'lesedetektiv'}
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
  function placeByNode(nodeId){
    return PLACE_DEFS.find(p=>p.required.includes(nodeId))||
      PLACE_DEFS.find(p=>p.extrasArea&&String(nodeId).startsWith(p.extrasArea+'-'))||null;
  }
  function placeNodes(place,model){
    const ids=[...place.required];
    if(place.extrasArea){
      model.nodes.filter(n=>n.areaId===place.extrasArea&&(n.type==='challenge'||n.type==='review')).forEach(n=>ids.push(n.id));
    }
    return ids.map(id=>model.nodes.find(n=>n.id===id)).filter(Boolean);
  }
  function requiredPlaceNodes(place,model){
    return place.required.map(id=>model.nodes.find(n=>n.id===id)).filter(Boolean);
  }
  function nodeFinished(node){
    const st=journeyNodeState(node);
    if(node.type==='checkpoint'||node.type==='challenge')return st==='passed';
    if(node.type==='skill')return st==='can-now'||st==='mastered';
    return false;
  }
  function placeVisualState(place,model,recommended,recommendedIndex){
    const req=requiredPlaceNodes(place,model);
    const done=req.length>0&&req.every(nodeFinished);
    if(done)return 'done';
    if(recommended&&placeByNode(recommended.id)?.id===place.id)return 'current';
    const indices=req.map(n=>model.nodes.findIndex(x=>x.id===n.id)).filter(i=>i>=0);
    if(recommendedIndex>=0&&indices.length&&Math.min(...indices)>recommendedIndex)return 'future';
    return 'open';
  }
  function placeProgress(place,model){
    const req=requiredPlaceNodes(place,model),done=req.filter(nodeFinished).length;
    return {done,total:req.length,pct:req.length?Math.round(done/req.length*100):0};
  }
  function placeMarkup(place,state){
    const p=place.point,done=state==='done',current=state==='current';
    return '<button type="button" class="bokskogen-place state-'+state+'" style="left:'+p[0]+'%;top:'+p[1]+'%" data-bok-place="'+place.id+'" aria-label="'+escapeAttr(place.title+(done?', fullført':current?', neste sted':''))+'">'+
      '<span class="place-hit"></span>'+
      (done?'<span class="place-done" aria-hidden="true">✓</span>':'')+
      (current?'<span class="place-pulse" aria-hidden="true"></span>':'')+
    '</button>';
  }
  function missionAvailability(node,model,recommended,recommendedIndex){
    const st=journeyNodeState(node),idx=model.nodes.findIndex(n=>n.id===node.id);
    const completed=nodeFinished(node);
    const future=!completed&&recommendedIndex>=0&&idx>recommendedIndex&&st==='new';
    return {st,completed,future,isNext:!!recommended&&recommended.id===node.id};
  }
  function missionRow(node,info){
    const extra=node.type==='challenge'?'BONUS':node.type==='review'?'REPETISJON':'';
    const status=info.completed?(info.st==='mastered'?'Mestret':'Fullført'):info.isNext?'Neste oppdrag':info.future?'Låst':journeyStatusText(node,info.st);
    const icon=journeyNodeIcon(node,info.st);
    return '<button type="button" class="bokskogen-mission-row'+(info.isNext?' is-next':'')+(info.completed?' is-done':'')+'" data-bok-mission="'+node.id+'"'+(info.future?' disabled aria-disabled="true"':'')+'>'+
      '<span class="mission-icon" aria-hidden="true">'+icon+'</span>'+
      '<span class="mission-copy">'+(extra?'<small>'+extra+'</small>':'')+'<strong>'+node.title+'</strong><em>'+status+'</em></span>'+
      '<span class="mission-arrow" aria-hidden="true">'+(info.completed?'↻':'›')+'</span>'+
    '</button>';
  }
  function openPlaceSheet(host,place,viewGrade,model,recommended){
    const sheet=host.querySelector('.bokskogen-place-sheet'),backdrop=host.querySelector('.bokskogen-sheet-backdrop');
    if(!sheet||!backdrop)return;
    const recommendedIndex=recommended?model.nodes.findIndex(n=>n.id===recommended.id):-1;
    const state=placeVisualState(place,model,recommended,recommendedIndex),progress=placeProgress(place,model);
    const nodes=placeNodes(place,model);
    const nextPlace=recommended?placeByNode(recommended.id):null;
    const locked=state==='future';
    const rows=locked
      ?'<div class="bokskogen-locked-place"><span aria-hidden="true">🔒</span><strong>Dette stedet åpner snart</strong><p>Fortsett først ved '+(nextPlace?.title||'neste sted')+'.</p></div>'
      :nodes.map(n=>missionRow(n,missionAvailability(n,model,recommended,recommendedIndex))).join('');
    sheet.innerHTML='<div class="place-sheet-handle" aria-hidden="true"></div>'+
      '<div class="place-sheet-head"><div><small>STED I BOKSKOGEN</small><strong>'+place.title+'</strong><span>'+progress.done+' av '+progress.total+' hovedoppdrag fullført</span></div><button type="button" class="place-sheet-close" aria-label="Lukk">×</button></div>'+
      '<div class="place-sheet-progress" aria-hidden="true"><i style="width:'+progress.pct+'%"></i></div>'+
      '<div class="place-sheet-missions">'+rows+'</div>';
    backdrop.hidden=false;sheet.hidden=false;
    requestAnimationFrame(()=>{backdrop.classList.add('show');sheet.classList.add('show')});
    const close=()=>{
      backdrop.classList.remove('show');sheet.classList.remove('show');
      setTimeout(()=>{backdrop.hidden=true;sheet.hidden=true},180);
    };
    sheet.querySelector('.place-sheet-close').onclick=close;
    backdrop.onclick=close;
    sheet.querySelectorAll('[data-bok-mission]').forEach(btn=>{
      if(btn.disabled)return;
      btn.onclick=()=>{close();openJourneyMission('norwegian',btn.dataset.bokMission,viewGrade,false)};
    });
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

  function landmarkLabel(x,y,text,opts={}){
    const major=!!opts.major,done=!!opts.done,future=!!opts.future,tilt=Number(opts.tilt||0);
    const width=Math.max(76,Math.min(126,52+String(text).length*6.2));
    const cls='bokskogen-landmark-label'+(major?' major':'')+(done?' done':'')+(future?' future':'');
    return '<g class="'+cls+'" transform="translate('+x+' '+y+') rotate('+tilt+')">'+
      '<ellipse class="label-shadow" cx="0" cy="13" rx="'+(width*.48)+'" ry="7"/>'+
      '<rect class="label-pin" x="-3" y="8" width="6" height="28" rx="3"/>'+
      '<path class="label-plank" d="M '+(-width/2)+' -13 H '+(width/2-8)+' L '+(width/2)+' 0 L '+(width/2-8)+' 13 H '+(-width/2)+' L '+(-width/2-7)+' 0 Z"/>'+
      '<text class="label-text" x="0" y="1">'+text+'</text>'+
    '</g>';
  }
  function chapterMarker(x,y,text){
    return '<g class="bokskogen-chapter-marker" transform="translate('+x+' '+y+')">'+
      '<path class="chapter-line" d="M-48 0H48"/>'+
      '<rect class="chapter-plaque" x="-39" y="-10" width="78" height="20" rx="10"/>'+
      '<text x="0" y="2">'+text+'</text>'+
    '</g>';
  }

  function worldArt(prog){
    const dim=prog.complete?0:Math.max(0,.16-(prog.pct/100)*.13);
    return '<img class="bokskogen-art bokskogen-reference-art" src="./bokskogen-reference-bg.webp?v=20261004-art2" alt="" draggable="false" />'+
      '<div class="bokskogen-world-vignette" aria-hidden="true"></div>'+
      '<div class="bokskogen-progress-light" style="opacity:'+(1-dim)+'" aria-hidden="true"></div>';
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
    const places=PLACE_DEFS.map(place=>{
      const state=placeVisualState(place,model,recommended,recommendedIndex);
      return placeMarkup(place,state);
    }).join('');

    const currentPlace=recommended?placeByNode(recommended.id):null;
    let guide='';
    if(prog.complete){
      guide='<button type="button" class="bokskogen-mission-sign is-complete" data-bok-place-open="biblioteket" aria-label="Bokskogen fullført. Åpne Biblioteket"><span>RUNDET</span><strong>Biblioteket</strong><small>Utforsk oppdragene igjen</small></button>';
    }else if(recommended&&currentPlace){
      guide='<button type="button" class="bokskogen-mission-sign" data-bok-next="'+recommended.id+'" aria-label="'+escapeAttr('Neste oppdrag: '+recommended.title)+'"><span>NESTE</span><strong>'+currentPlace.title+'</strong><small>'+recommended.title+'</small></button>';
    }

    const top='<div class="bokskogen-topbar">'+
      '<button type="button" class="bokskogen-grade-pill" aria-label="Bytt klassetrinn">'+GRADE_CONFIG[viewGrade].label+' <span>⌄</span></button>'+
      '<div class="bokskogen-progress" aria-label="'+prog.pct+' prosent fullført"><b>★ '+prog.done+'/'+prog.total+'</b><span>'+prog.pct+' %</span></div></div>';

    host.innerHTML='<section class="bokskogen-world'+(prog.complete?' is-complete':'')+'" aria-label="Bokskogen, interaktiv læringsverden">'+
      worldArt(prog)+top+places+guide+
      '<div class="bokskogen-grade-menu" hidden></div>'+
      '<div class="bokskogen-sheet-backdrop" hidden></div><section class="bokskogen-place-sheet" role="dialog" aria-modal="true" hidden></section>'+
    '</section>';

    host.querySelectorAll('[data-bok-place]').forEach(btn=>{
      const place=PLACE_DEFS.find(p=>p.id===btn.dataset.bokPlace);
      if(place)btn.onclick=()=>openPlaceSheet(host,place,viewGrade,model,recommended);
    });
    const nextBtn=host.querySelector('[data-bok-next]');
    if(nextBtn)nextBtn.onclick=()=>openJourneyMission('norwegian',nextBtn.dataset.bokNext,viewGrade,false);
    const completeSign=host.querySelector('[data-bok-place-open]');
    if(completeSign){
      completeSign.onclick=()=>{
        const place=PLACE_DEFS.find(p=>p.id===completeSign.dataset.bokPlaceOpen);
        if(place)openPlaceSheet(host,place,viewGrade,model,recommended);
      };
    }
    const gradeBtn=host.querySelector('.bokskogen-grade-pill');
    const gradeMenu=host.querySelector('.bokskogen-grade-menu');
    if(gradeBtn&&gradeMenu){
      gradeBtn.onclick=()=>{
        const open=!gradeMenu.hidden;
        if(open){
          gradeMenu.classList.remove('show');
          setTimeout(()=>{gradeMenu.hidden=true},150);
          return;
        }
        gradeMenu.innerHTML='<strong>Velg klassetrinn</strong><div>'+
          [1,2,3].map(g=>'<button type="button" data-bok-grade="'+g+'" class="'+(g===viewGrade?'active':'')+'">'+g+'. klasse'+(subjectGradeComplete('norwegian',g)?' 🏆':'')+'</button>').join('')+
          '</div>';
        gradeMenu.hidden=false;
        requestAnimationFrame(()=>gradeMenu.classList.add('show'));
        gradeMenu.querySelectorAll('[data-bok-grade]').forEach(b=>b.onclick=()=>setJourneyViewGrade('norwegian',Number(b.dataset.bokGrade)));
      };
    }

    const finish=document.getElementById('journey-finish');
    finish.classList.toggle('complete',prog.complete);
    finish.innerHTML=prog.complete
      ?'<strong>🏆 Bokskogen er rundet</strong><p>Biblioteket lyser og alle stedene er åpne. Du kan gå tilbake til et hvilket som helst sted og øve igjen.</p><div class="journey-finish-actions"><button class="secondary" id="journey-repeat-grade">Repeter</button><button class="secondary" id="journey-next-grade">Utforsk 3. klasse</button></div>'
      :'<strong>🌲 Målet: nå Biblioteket</strong><p>Besøk stedene langs stien. Hvert sted inneholder ett eller flere oppdrag, og du kan alltid gå tilbake til steder du allerede har klart.</p>';

    const repeatBtn=document.getElementById('journey-repeat-grade');
    if(repeatBtn)repeatBtn.onclick=()=>startJourneyReview('norwegian',viewGrade);
    const nextGradeBtn=document.getElementById('journey-next-grade');
    if(nextGradeBtn)nextGradeBtn.onclick=()=>setJourneyViewGrade('norwegian',3);
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
/* Bokskogen v10 — premium world-native renderer. */
(function(){
  if(typeof renderSubjectJourney!=='function')return;

  const previousRenderSubjectJourney=renderSubjectJourney;
  const PLACES=[
    {id:'bokstavporten',title:'Bokstavporten',point:[30,93.5],tilt:-3,required:['lyder']},
    {id:'lesestua',title:'Lesestua',point:[78,70],tilt:2,required:['ordbilder']},
    {id:'skogsporten',title:'Skogsporten',point:[27,53],tilt:-2,required:['ordstart-checkpoint'],extrasArea:'ordstart'},
    {id:'rimdammen',title:'Rimdammen',point:[78,44],tilt:-2,required:['ordlek']},
    {id:'ordbrua',title:'Ordbrua',point:[43,32],tilt:-4,required:['setningsrekkefolge']},
    {id:'ordhagen',title:'Ordhagen',point:[39,21],tilt:1,required:['ordbetydning','setninger-checkpoint'],extrasArea:'setninger'},
    {id:'biblioteket',title:'Biblioteket',point:[76,11.5],tilt:-1,required:['detaljer','forsta','tenkvidere','lesedetektiv-checkpoint'],extrasArea:'lesedetektiv'}
  ];

  function finished(node){
    const st=journeyNodeState(node);
    if(node.type==='checkpoint'||node.type==='challenge')return st==='passed';
    if(node.type==='skill')return st==='can-now'||st==='mastered';
    return false;
  }
  function placeByNode(nodeId){
    return PLACES.find(p=>p.required.includes(nodeId))||
      PLACES.find(p=>p.extrasArea&&String(nodeId).startsWith(p.extrasArea+'-'))||null;
  }
  function requiredNodes(place,model){
    return place.required.map(id=>model.nodes.find(n=>n.id===id)).filter(Boolean);
  }
  function allNodes(place,model){
    const ids=[...place.required];
    if(place.extrasArea){
      model.nodes
        .filter(n=>n.areaId===place.extrasArea&&(n.type==='challenge'||n.type==='review'))
        .forEach(n=>ids.push(n.id));
    }
    return ids.map(id=>model.nodes.find(n=>n.id===id)).filter(Boolean);
  }
  function placeState(place,model,recommended,recommendedIndex){
    const req=requiredNodes(place,model);
    if(req.length&&req.every(finished))return 'done';
    if(recommended&&placeByNode(recommended.id)?.id===place.id)return 'current';
    const idx=req.map(n=>model.nodes.findIndex(x=>x.id===n.id)).filter(i=>i>=0);
    if(recommendedIndex>=0&&idx.length&&Math.min(...idx)>recommendedIndex)return 'future';
    return 'open';
  }
  function placeProgress(place,model){
    const req=requiredNodes(place,model),done=req.filter(finished).length;
    return {done,total:req.length,pct:req.length?Math.round(done/req.length*100):0};
  }
  function plaque(place,state){
    const done=state==='done',current=state==='current',future=state==='future';
    return '<button type="button" class="bok-v10-place state-'+state+'" style="left:'+place.point[0]+'%;top:'+place.point[1]+'%;--tilt:'+place.tilt+'deg" data-v10-place="'+place.id+'" data-title="'+escapeAttr(place.title)+'" aria-label="'+escapeAttr(place.title+(done?', fullført':current?', neste sted':future?', låst':''))+'">'+
      '<span class="hit"></span>'+
      '<span class="bok-v11-anchor" aria-hidden="true"></span>'+
      (done?'<span class="bok-v11-status done" aria-hidden="true">✓</span>':'')+
      (future?'<span class="bok-v11-status locked" aria-hidden="true">🔒</span>':'')+
      (current?'<span class="bok-v11-current-tag" aria-hidden="true"><b>NESTE</b><i></i></span>':'')+
    '</button>';
  }
  function missionInfo(node,model,recommended,recommendedIndex){
    const st=journeyNodeState(node),idx=model.nodes.findIndex(n=>n.id===node.id);
    const completed=finished(node);
    const future=!completed&&recommendedIndex>=0&&idx>recommendedIndex&&st==='new';
    return {st,completed,future,isNext:!!recommended&&recommended.id===node.id};
  }
  function missionRow(node,info){
    const extra=node.type==='challenge'?'BONUS':node.type==='review'?'REPETISJON':'';
    const status=info.completed?(info.st==='mastered'?'Mestret':'Fullført'):info.isNext?'Neste oppdrag':info.future?'Låst':journeyStatusText(node,info.st);
    const icon=journeyNodeIcon(node,info.st);
    return '<button type="button" class="bok-v10-mission'+(info.isNext?' is-next':'')+(info.completed?' is-done':'')+'" data-v10-mission="'+node.id+'"'+(info.future?' disabled aria-disabled="true"':'')+'>'+
      '<span class="icon" aria-hidden="true">'+icon+'</span>'+
      '<span class="copy">'+(extra?'<small>'+extra+'</small>':'')+'<strong>'+node.title+'</strong><em>'+status+'</em></span>'+
      '<span class="arrow" aria-hidden="true">'+(info.completed?'↻':'›')+'</span>'+
    '</button>';
  }
  function closeSheet(host){
    const sheet=host.querySelector('.bok-v10-sheet'),back=host.querySelector('.bok-v10-backdrop');
    if(!sheet||!back)return;
    back.classList.remove('show');sheet.classList.remove('show');
    setTimeout(()=>{back.hidden=true;sheet.hidden=true},180);
  }
  function openSheet(host,place,viewGrade,model,recommended){
    const sheet=host.querySelector('.bok-v10-sheet'),back=host.querySelector('.bok-v10-backdrop');
    if(!sheet||!back)return;
    const recommendedIndex=recommended?model.nodes.findIndex(n=>n.id===recommended.id):-1;
    const state=placeState(place,model,recommended,recommendedIndex);
    const progress=placeProgress(place,model);
    const nodes=allNodes(place,model);
    const nextPlace=recommended?placeByNode(recommended.id):null;
    const rows=state==='future'
      ?'<div class="bok-v10-locked"><span aria-hidden="true">🔒</span><strong>Dette stedet åpner senere</strong><p>Fortsett først ved '+(nextPlace?.title||'neste sted')+'.</p></div>'
      :nodes.map(n=>missionRow(n,missionInfo(n,model,recommended,recommendedIndex))).join('');
    sheet.innerHTML='<div class="handle" aria-hidden="true"></div>'+
      '<div class="head"><div><small>STED I BOKSKOGEN</small><strong>'+place.title+'</strong><span>'+progress.done+' av '+progress.total+' hovedoppdrag fullført</span></div><button type="button" class="bok-v10-close" aria-label="Lukk">×</button></div>'+
      '<div class="progress" aria-hidden="true"><i style="width:'+progress.pct+'%"></i></div>'+
      '<div class="bok-v10-missions">'+rows+'</div>';
    back.hidden=false;sheet.hidden=false;
    requestAnimationFrame(()=>{back.classList.add('show');sheet.classList.add('show')});
    sheet.querySelector('.bok-v10-close').onclick=()=>closeSheet(host);
    back.onclick=()=>closeSheet(host);
    sheet.querySelectorAll('[data-v10-mission]').forEach(btn=>{
      if(btn.disabled)return;
      btn.onclick=()=>{
        closeSheet(host);
        openJourneyMission('norwegian',btn.dataset.v10Mission,viewGrade,false);
      };
    });
  }
  function renderGradeMenu(host,viewGrade){
    const menu=host.querySelector('.bok-v10-grade-menu');
    if(!menu)return;
    menu.innerHTML='<strong>Velg klassetrinn</strong><div>'+
      [1,2,3].map(g=>'<button type="button" data-v10-grade="'+g+'" class="'+(g===viewGrade?'active':'')+'">'+g+'. klasse'+(subjectGradeComplete('norwegian',g)?' 🏆':'')+'</button>').join('')+
      '</div>';
    menu.querySelectorAll('[data-v10-grade]').forEach(b=>b.onclick=()=>setJourneyViewGrade('norwegian',Number(b.dataset.v10Grade)));
  }
  function progressTrail(prog,recommended,model){
    const currentPlace=recommended?placeByNode(recommended.id):null;
    let currentIndex=currentPlace?PLACES.findIndex(p=>p.id===currentPlace.id):-1;
    if(prog.complete)currentIndex=PLACES.length-1;
    const pct=prog.complete?100:Math.max(0,currentIndex)/(PLACES.length-1)*100;
    const d='M30 93.5 C49 90 70 79 78 70 C64 64 40 61 27 53 C43 50 66 48 78 44 C68 39 51 35 43 32 C38 28 39 24 39 21 C51 17 66 14 76 11.5';
    return '<svg class="bok-v11-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+
      '<path class="route-shadow" d="'+d+'" pathLength="100"></path>'+
      '<path class="route-glow" d="'+d+'" pathLength="100" style="stroke-dasharray:'+pct+' 100"></path>'+
      '<path class="route-steps" d="'+d+'" pathLength="100" style="stroke-dasharray:'+pct+' 100"></path>'+
    '</svg>';
  }

  function worldMarkup(viewGrade,prog,recommended,model){
    const recommendedIndex=recommended?model.nodes.findIndex(n=>n.id===recommended.id):-1;
    const places=PLACES.map(p=>plaque(p,placeState(p,model,recommended,recommendedIndex))).join('');
    return '<section class="bok-v10-world bok-v11-world'+(prog.complete?' is-complete':'')+'" aria-label="Bokskogen, interaktiv læringsverden">'+
      '<img class="bok-v10-art" src="./bokskogen-verden.png?v=20261004-world1" alt="" draggable="false" decoding="async">'+
      '<div class="bok-v10-vignette" aria-hidden="true"></div>'+
      progressTrail(prog,recommended,model)+
      '<div class="bok-v10-water-shimmer" aria-hidden="true"></div>'+
      '<div class="bok-v10-atmosphere" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="bok-v10-top">'+
        '<button type="button" class="bok-v10-home"><b aria-hidden="true">‹</b> Hjem</button>'+
        '<button type="button" class="bok-v10-grade">'+GRADE_CONFIG[viewGrade].label+' <span>⌄</span></button>'+
        '<div class="bok-v10-progress" aria-label="'+prog.pct+' prosent fullført"><span class="star" aria-hidden="true">★</span><b>'+prog.done+'/'+prog.total+'</b><span>'+prog.pct+' %</span></div>'+
      '</div>'+
      places+
      '<div class="bok-v10-grade-menu" hidden></div>'+
      '<div class="bok-v10-backdrop" hidden></div>'+
      '<section class="bok-v10-sheet" role="dialog" aria-modal="true" hidden></section>'+
    '</section>';
  }
  function renderPremiumBokskogen(host,viewGrade,prog,recommended,model){
    const screen=document.getElementById('subject-screen');
    screen.classList.remove('bokskogen-v2-active','bokskogen-v3-active');
    screen.classList.add('bokskogen-v10-active');
    host.className='journey-map bokskogen-map bok-v10-map';
    host.innerHTML=worldMarkup(viewGrade,prog,recommended,model);

    host.querySelector('.bok-v10-home').onclick=()=>{
      const back=document.getElementById('subject-back');
      if(back)back.click();
      else if(typeof setTab==='function')setTab('home');
    };
    const gradeBtn=host.querySelector('.bok-v10-grade');
    const gradeMenu=host.querySelector('.bok-v10-grade-menu');
    renderGradeMenu(host,viewGrade);
    gradeBtn.onclick=()=>{
      const open=!gradeMenu.hidden;
      if(open){
        gradeMenu.classList.remove('show');
        setTimeout(()=>{gradeMenu.hidden=true},150);
      }else{
        gradeMenu.hidden=false;
        requestAnimationFrame(()=>gradeMenu.classList.add('show'));
      }
    };

    const recommendedPlace=recommended?placeByNode(recommended.id):null;
    host.querySelectorAll('[data-v10-place]').forEach(btn=>{
      const place=PLACES.find(p=>p.id===btn.dataset.v10Place);
      if(!place)return;
      btn.onclick=()=>{
        if(recommended&&recommendedPlace?.id===place.id){
          openJourneyMission('norwegian',recommended.id,viewGrade,false);
          return;
        }
        openSheet(host,place,viewGrade,model,recommended);
      };
    });

    const finish=document.getElementById('journey-finish');
    if(finish)finish.style.display='none';
  }

  renderSubjectJourney=function(){
    const screen=document.getElementById('subject-screen');
    const viewGrade=journeyViewGrade(activeSubject);
    if(activeSubject!=='norwegian'||viewGrade>2){
      if(screen)screen.classList.remove('bokskogen-v10-active');
      const finish=document.getElementById('journey-finish');
      if(finish)finish.style.display='';
      return previousRenderSubjectJourney();
    }
    const host=document.getElementById('journey-map');
    if(!host)return;
    const prog=journeyProgress('norwegian',viewGrade);
    const recommended=journeyRecommendedNode('norwegian',viewGrade);
    renderPremiumBokskogen(host,viewGrade,prog,recommended,prog.model);
  };
})();
