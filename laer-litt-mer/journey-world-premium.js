/* Illustrated presentation for the existing journey models. No progress is stored here. */
(function(){
  if(typeof renderSubjectJourney!=='function'||typeof renderGeoJourney!=='function')return;
  const priorSubject=renderSubjectJourney,priorGeo=renderGeoJourney;
  const WORLDS={
    math:{image:'matte-verden.png',name:'Tallenga',places:['Telleporten','Mønsterhagen','Formtorget','Tierbroen','Klokketårnet','Regneslottet','Tallobservatoriet'],points:[[53,84],[26,66],[81,48],[36,40],[59,30],[79,25],[80,17]]},
    english:{image:'engelsk-verden.png',name:'Ordlandsbyen',places:['Reiseporten','Ordskiltet','Blomsterbroen','Markedet','Togstasjonen','Havnen','Fyrtårnet'],points:[[51,83],[75,64],[35,53],[82,45],[54,33],[22,24],[78,17]]},
    geography:{image:'geografi-verden.png',name:'Nordlysleiren',places:['Kartstien','Ekspedisjonsstien','Flaggbrygga','Kompassplassen','Fjellstien','Observatoriet','Kompassfyret'],points:[[52,83],[79,67],[26,53],[59,45],[84,35],[67,26],[81,17]]}
  };
  const esc=s=>escapeAttr(String(s));
  function selectedJourneyFox(){
    const which=(typeof state!=='undefined'&&state?.profile?.avatar==='girl')?'girl':'boy';
    return window.LARIA_PROFILE_AVATARS?.[which]||'./lia-fox-explorer-home.webp';
  }
  function complete(node,geo){
    const st=geo?geoJourneyNodeState(node):journeyNodeState(node);
    return node.type==='checkpoint'||node.type==='challenge'?st==='passed':node.type==='geo-skill'||node.type==='skill'?st==='can-now'||st==='mastered':false;
  }
  function stateText(node,geo){return geo?geoJourneyStatusText(node,geoJourneyNodeState(node)):journeyStatusText(node,journeyNodeState(node))}
  function core(area,geo){return area.nodes.filter(n=>n.type===(geo?'geo-skill':'skill')||n.type==='checkpoint')}
  function pointAt(config,i,n){
    if(n<=1)return config.points[0];
    const t=i*6/(n-1),lo=Math.floor(t),hi=Math.min(6,lo+1),f=t-lo;
    return [config.points[lo][0]*(1-f)+config.points[hi][0]*f,config.points[lo][1]*(1-f)+config.points[hi][1]*f];
  }
  function smoothJourneyPath(points){
    if(!points.length)return '';
    if(points.length===1)return 'M '+points[0][0]+' '+points[0][1];
    let d='M '+points[0][0]+' '+points[0][1];
    for(let i=1;i<points.length;i++){
      const p=points[i],next=points[i+1];
      if(next){
        const mx=(p[0]+next[0])/2,my=(p[1]+next[1])/2;
        d+=' Q '+p[0]+' '+p[1]+' '+mx+' '+my;
      }else d+=' L '+p[0]+' '+p[1];
    }
    return d;
  }
  function journeyRouteOverlay(config,route,nextIndex){
    const pts=route.map((_,i)=>pointAt(config,i,route.length));
    if(pts.length<2)return '';
    const full=smoothJourneyPath(pts);
    const progressPts=pts.slice(0,Math.max(1,Math.min(pts.length,nextIndex+1)));
    const progress=progressPts.length>1?smoothJourneyPath(progressPts):'';
    const dots=pts.map((p,i)=>'<circle class="premium-route-dot '+(i<nextIndex?'done':i===nextIndex?'current':'')+'" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i===nextIndex?1.6:1.1)+'"/>').join('');
    return '<svg class="premium-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="premium-route-shadow" d="'+full+'"/><path class="premium-route-earth" d="'+full+'"/><path class="premium-route-light" d="'+full+'"/>'+(progress?'<path class="premium-route-progress" d="'+progress+'"/>':'')+dots+'</svg>';
  }


  function installWorldDepthMotion(host){
    if(host._premiumWorldMotionCleanup)host._premiumWorldMotionCleanup();
    const world=host.querySelector('.premium-world');
    if(!world)return;
    const layers=[...world.querySelectorAll('[data-world-depth]')];
    if(!layers.length)return;
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){
      layers.forEach(layer=>{layer.style.setProperty('--world-x','0px');layer.style.setProperty('--world-y','0px')});
      return;
    }
    let px=0,py=0,raf=0;
    const clamp=v=>Math.max(-1,Math.min(1,v));
    const apply=()=>{
      raf=0;
      const rect=world.getBoundingClientRect();
      const viewport=window.innerHeight||document.documentElement.clientHeight||800;
      const scroll=clamp((viewport*.48-(rect.top+rect.height*.5))/viewport);
      layers.forEach(layer=>{
        const depth=Number(layer.dataset.worldDepth||0);
        const x=px*depth*7;
        const y=py*depth*4+scroll*depth*9;
        layer.style.setProperty('--world-x',x.toFixed(2)+'px');
        layer.style.setProperty('--world-y',y.toFixed(2)+'px');
      });
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(apply)};
    const onPointer=e=>{
      const rect=world.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      px=clamp(((e.clientX-rect.left)/rect.width-.5)*2);
      py=clamp(((e.clientY-rect.top)/rect.height-.5)*2);
      schedule();
    };
    const resetPointer=()=>{px=0;py=0;schedule()};
    const finePointer=window.matchMedia&&window.matchMedia('(pointer:fine)').matches;
    if(finePointer){
      world.addEventListener('pointermove',onPointer,{passive:true});
      world.addEventListener('pointerleave',resetPointer,{passive:true});
    }
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    host._premiumWorldMotionCleanup=()=>{
      if(raf)cancelAnimationFrame(raf);
      if(finePointer){
        world.removeEventListener('pointermove',onPointer);
        world.removeEventListener('pointerleave',resetPointer);
      }
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);
    };
    schedule();
  }


  function journeyTravelerPoint(point){
    if(!point)return null;
    const x=Number(point[0]),y=Number(point[1]);
    return [Math.min(86,Math.max(14,x+(x>50?-19:19))),Math.min(88,Math.max(13,y+1))];
  }

  function animatePremiumTravelerJourney(host){
    const traveler=host.querySelector('.premium-traveler[data-travel-from-x]');
    if(!traveler)return;
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce||typeof traveler.animate!=='function')return;
    const layer=traveler.parentElement;
    const fromX=Number(traveler.dataset.travelFromX),fromY=Number(traveler.dataset.travelFromY);
    const toX=Number(traveler.dataset.travelToX),toY=Number(traveler.dataset.travelToY);
    if(!layer||![fromX,fromY,toX,toY].every(Number.isFinite))return;
    const dx=(fromX-toX)*layer.clientWidth/100,dy=(fromY-toY)*layer.clientHeight/100;
    const distance=Math.hypot(dx,dy);
    if(distance<12)return;
    traveler.classList.add('is-traveling');
    traveler.dataset.travelDistance=String(Math.round(distance));
    const lift=Math.max(8,Math.min(22,distance*.08));
    const animation=traveler.animate([
      {transform:'translate3d('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px,0) translate(-50%,-50%)',offset:0},
      {transform:'translate3d('+(dx*.58).toFixed(1)+'px,'+(dy*.60-lift).toFixed(1)+'px,0) translate(-50%,-50%)',offset:.46},
      {transform:'translate3d('+(dx*.18).toFixed(1)+'px,'+(dy*.20-lift*.45).toFixed(1)+'px,0) translate(-50%,-50%)',offset:.80},
      {transform:'translate3d(0,0,0) translate(-50%,-50%)',offset:1}
    ],{duration:1550,easing:'cubic-bezier(.22,.74,.18,1)',fill:'none'});
    animation.finished.then(()=>traveler.classList.remove('is-traveling')).catch(()=>traveler.classList.remove('is-traveling'));
  }

  function keepCurrentMissionVisible(host,geo){
    const screen=document.getElementById(geo?'geography-screen':'subject-screen');
    const target=host.querySelector('.premium-place.is-next');
    if(!screen?.classList.contains('active')||!target)return;
    const rect=target.getBoundingClientRect();
    const viewport=window.innerHeight||document.documentElement.clientHeight||800;
    const safeTop=Math.max(74,viewport*.16),safeBottom=viewport*.78;
    if(rect.top>=safeTop&&rect.bottom<=safeBottom)return;
    const top=Math.max(0,window.scrollY+rect.top-viewport*.56);
    window.scrollTo({top,behavior:'auto'});
  }

  function journeyLandmarkKind(node,i){
    if(node.type==='checkpoint')return 'castle';
    return ['cottage','tower','gate','observatory'][i%4];
  }
  function journeyLandmarkMarkup(subject,node,i,done,next,future){
    const kind=journeyLandmarkKind(node,i);
    const badge=node.type==='checkpoint'?'★':done?'✓':future?'🔒':next?'★':String(i+1);
    return '<span class="premium-place-marker premium-landmark-platform" aria-hidden="true">'+
      '<span class="premium-landmark premium-landmark-'+kind+' premium-landmark-'+subject+'">'+
        '<i class="landmark-body"></i><i class="landmark-roof"></i><i class="landmark-window"></i><i class="landmark-door"></i><i class="landmark-flag"></i>'+
      '</span>'+
      '<span class="premium-place-state-badge">'+badge+'</span>'+
    '</span>';
  }

  function journeyAmbientMarkup(){
    return '<div class="premium-world-life" aria-hidden="true">'+
      '<span class="world-cloud cloud-a"></span><span class="world-cloud cloud-b"></span>'+
      '<span class="world-birds birds-a"><i></i><i></i></span>'+
      '<span class="world-glint glint-a"></span><span class="world-glint glint-b"></span><span class="world-glint glint-c"></span>'+
      '<span class="world-firefly firefly-a"></span><span class="world-firefly firefly-b"></span><span class="world-firefly firefly-c"></span>'+
    '</div>';
  }

  function setYoungGeographyWorldFirst(enabled){
    const screen=document.getElementById('geography-screen');
    const shell=document.getElementById('geo-journey-shell');
    const globe=document.getElementById('open-world');
    const continuation=screen?.querySelector('.geography-continue');
    if(!screen||!shell||!globe)return;
    if(enabled){
      if(shell.nextElementSibling!==globe)screen.insertBefore(shell,globe);
      return;
    }
    if(continuation&&continuation.nextElementSibling!==shell){
      continuation.insertAdjacentElement('afterend',shell);
    }
  }

  function takeWorldProgressReaction(subject,grade,route){
    const reaction=window.__journeyWorldReaction;
    if(!reaction||reaction.subject!==subject||Number(reaction.grade)!==Number(grade)||Date.now()-Number(reaction.at||0)>120000)return null;
    const index=route.findIndex(n=>n.id===reaction.nodeId);
    if(index<0)return null;
    window.__journeyWorldReaction=null;
    return {node:route[index],index};
  }

  function renderMap(subject,geo){
    const config=WORLDS[subject],host=document.getElementById(geo?'geo-journey-map':'journey-map');if(!host)return;
    const grade=journeyViewGrade(subject),prog=geo?geoJourneyProgress(grade):journeyProgress(subject,grade),model=prog.model;
    if(!model.areas.length){geo?priorGeo():priorSubject();return}
    const recommended=geo?geoJourneyRecommendedNode(grade):journeyRecommendedNode(subject,grade),firstOpen=journeyFirstOpenArea(model,geo?geoJourneyAreaComplete:journeyAreaComplete);
    const route=model.areas.flatMap(area=>core(area,geo)),idx=route.findIndex(n=>n.id===recommended?.id);
    const nextIndex=idx<0?route.length-1:idx;
    const reaction=takeWorldProgressReaction(subject,grade,route),reactionIndex=reaction?.index??-1;
    const nodeAttr=geo?'data-geo-journey-node':'data-journey-node';
    const buttons=route.map((node,i)=>{
      const ai=model.areas.findIndex(a=>a.id===node.areaId),area=model.areas[ai],done=complete(node,geo);
      const future=!done&&(ai>firstOpen||(i>nextIndex&&(geo?geoJourneyNodeState(node):journeyNodeState(node))==='new'));
      const next=node.id===recommended?.id&&!prog.complete;
      const [x,y]=pointAt(config,i,route.length),place=config.places[Math.min(6,Math.round(i*6/Math.max(1,route.length-1)))];
      const depthScale=Math.max(.88,Math.min(1.10,.84+y*.0031)),placeZ=Math.round(120+y);
      const status=done?'fullført':next?'neste oppdrag':future?'låst':stateText(node,geo).toLowerCase();
      const justCompleted=!!reaction&&reaction.node.id===node.id,newlyOpened=!!reaction&&next&&reactionIndex>=0&&i>reactionIndex;
      return '<button type="button" class="premium-place '+(done?'is-done ':next?'is-next ':future?'is-future ':'is-open ')+(node.type==='checkpoint'?'is-trophy ':'')+(justCompleted?'is-just-completed ':'')+(newlyOpened?'is-newly-opened ':'')+'" style="--x:'+x+'%;--y:'+y+'%;--depth-scale:'+depthScale.toFixed(3)+';--place-z:'+placeZ+'" '+nodeAttr+'="'+esc(node.id)+'" aria-label="'+esc(place+', '+node.title+', '+status)+'">'+
        journeyLandmarkMarkup(subject,node,i,done,next,future)+'<span class="premium-place-sign"><b>'+esc(node.title)+'</b><small>'+esc(status)+'</small></span>'+
        (done?'<span class="premium-place-bloom" aria-hidden="true">✦</span>':'')+
      '</button>';
    }).join('');
    const sides=model.areas.flatMap((area,ai)=>area.nodes.filter(n=>n.type==='challenge'||n.type==='review').map((node,j)=>{
      const members=core(area,geo),at=route.findIndex(n=>n.id===members[0]?.id),[x,y]=pointAt(config,Math.max(0,at),route.length);
      const sx=j===0?Math.max(12,x-24):Math.min(88,x+23),sy=Math.min(90,y+(j===0?3:8));
      return '<button type="button" class="premium-side '+(ai>firstOpen?'is-future':'')+'" style="--x:'+sx+'%;--y:'+sy+'%" '+nodeAttr+'="'+esc(node.id)+'" aria-label="'+esc(node.title+', '+(ai>firstOpen?'låst':stateText(node,geo)))+'"><span aria-hidden="true">'+(node.type==='review'?'↺':'✧')+'</span><b>'+esc(node.type==='review'?'Repeter':'Bonus')+'</b></button>';
    })).join('');
    const [cx,cy]=pointAt(config,Math.max(0,nextIndex),route.length);
    const travelerPoint=journeyTravelerPoint([cx,cy]);
    const medals=model.areas.map((area,ai)=>{
      if(!(geo?geoJourneyAreaComplete(area):journeyAreaComplete(area)))return '';
      const last=core(area,geo).at(-1),i=route.findIndex(n=>n.id===last?.id),[x,y]=pointAt(config,Math.max(0,i),route.length);
      return '<span class="premium-world-prize" style="--x:'+x+'%;--y:'+y+'%" title="'+esc(area.title+' fullført')+'" aria-label="'+esc(area.title+' fullført, trofé vunnet')+'">🏆</span>';
    }).join('');
    if(host._premiumWorldMotionCleanup)host._premiumWorldMotionCleanup();
    const reactionPoint=reaction?pointAt(config,reaction.index,route.length):null;
    const reactionTravelerPoint=reactionPoint?journeyTravelerPoint(reactionPoint):null;
    const traveler=!prog.complete?'<div class="premium-traveler'+(reaction?' is-arriving':'')+'" style="--x:'+travelerPoint[0]+'%;--y:'+travelerPoint[1]+'%"'+(reactionTravelerPoint?' data-travel-from-x="'+reactionTravelerPoint[0]+'" data-travel-from-y="'+reactionTravelerPoint[1]+'" data-travel-to-x="'+travelerPoint[0]+'" data-travel-to-y="'+travelerPoint[1]+'"':'')+' aria-hidden="true"><span class="premium-traveler-character"><img src="'+esc(selectedJourneyFox())+'" alt="" draggable="false"></span><span class="premium-travel-dust"><i></i><i></i><i></i></span></div>':'';
    const routeOverlay=journeyRouteOverlay(config,route,nextIndex);
    const reactionFx=reactionPoint?'<div class="premium-progress-reaction" style="--reaction-x:'+reactionPoint[0]+'%;--reaction-y:'+reactionPoint[1]+'%" aria-hidden="true"><i></i><i></i><i></i><i></i><b>✓</b></div>':'';
    host.className='journey-map premium-journey-map';
    host.innerHTML='<section class="premium-world premium-'+subject+' premium-world-depth-ready'+(prog.done>0?' has-progress':'')+(prog.complete?' is-complete':'')+(reaction?' is-progress-reaction':'')+'" style="--world-progress:'+prog.pct+';--focus-x:'+cx+'%;--focus-y:'+cy+'%" aria-label="'+esc(config.name+', interaktiv læringsverden')+'">'+
      '<div class="premium-world-depth-layer premium-world-distant-layer" data-world-depth="0.14" aria-hidden="true"><img class="premium-world-depth-art premium-world-depth-art-distant" src="./'+config.image+'" alt="" draggable="false" decoding="async">'+journeyAmbientMarkup()+'</div>'+
      '<div class="premium-world-depth-layer premium-world-midground-layer" data-world-depth="0.42">'+
        '<img class="premium-world-art" src="./'+config.image+'" alt="" draggable="false" decoding="async">'+
        '<div class="premium-world-relief" aria-hidden="true"><i class="relief-a"></i><i class="relief-b"></i><i class="relief-c"></i></div>'+
        routeOverlay+reactionFx+medals+buttons+traveler+
      '</div>'+
      '<div class="premium-world-depth-layer premium-world-foreground-layer" data-world-depth="0.82" aria-hidden="true"><img class="premium-world-depth-art premium-world-depth-art-foreground" src="./'+config.image+'" alt="" draggable="false" decoding="async"><i class="premium-foreground-vignette"></i><div class="premium-world-foreground-life"><i></i><i></i><i></i></div></div>'+
      '<div class="premium-world-frontier" aria-hidden="true"><i class="frontier-haze"></i><i class="frontier-focus"></i><i class="frontier-ring"></i></div>'+
      '<div class="premium-world-shade" aria-hidden="true"></div><div class="premium-world-mist" style="--mist-top:'+Math.max(0,cy-13)+'%" aria-hidden="true"></div>'+
      '<div class="premium-world-sparkles" aria-hidden="true"></div>'+
      '<div class="premium-world-hud"><button type="button" class="premium-world-back" aria-label="Tilbake">‹</button><button type="button" class="premium-world-grade" aria-expanded="false">'+esc(GRADE_CONFIG[grade].label)+' ▾</button><div class="premium-world-progress" aria-label="'+prog.pct+' prosent fullført"><span>★</span><b>'+prog.done+'/'+prog.total+'</b><i><em style="width:'+prog.pct+'%"></em></i></div><div class="premium-world-trophies" aria-label="'+prog.areasDone+' av '+model.areas.length+' trofeer">🏆 '+prog.areasDone+'</div></div>'+
      '<div class="premium-world-title"><small>'+esc(SUBJECTS[subject]?.title||'Geografi')+' · '+esc(GRADE_CONFIG[grade].label)+'</small><strong>'+esc(config.name)+'</strong></div>'+
      '<div class="premium-world-grade-menu" hidden></div>'+
      '<div class="premium-world-sheet-back" hidden></div><section class="premium-world-sheet" role="dialog" aria-modal="true" aria-label="Oppdragssted" hidden></section></section><div class="premium-side-dock" aria-label="Ekstra oppdrag">'+sides+'</div>';
    installWorldDepthMotion(host);
    requestAnimationFrame(()=>animatePremiumTravelerJourney(host));
    const worldBack=host.querySelector('.premium-world-back');
    if(worldBack)worldBack.onclick=()=>{
      const backButton=document.getElementById(geo?'geography-back':'subject-back');
      if(backButton)backButton.click();
      else if(typeof setTab==='function')setTab('home');
    };
    const gradeBtn=host.querySelector('.premium-world-grade'),menu=host.querySelector('.premium-world-grade-menu');
    menu.innerHTML='<strong>Velg klassetrinn</strong>'+Array.from({length:10},(_,i)=>i+1).map(g=>'<button type="button" data-premium-grade="'+g+'"'+(g===grade?' class="selected"':'')+'>'+g+'. klasse'+(subjectGradeComplete(subject,g)?' · 🏆':'')+'</button>').join('');
    gradeBtn.onclick=()=>{menu.hidden=!menu.hidden;gradeBtn.setAttribute('aria-expanded',String(!menu.hidden))};
    menu.querySelectorAll('button').forEach(b=>b.onclick=()=>setJourneyViewGrade(subject,Number(b.dataset.premiumGrade)));
    const sheet=host.querySelector('.premium-world-sheet'),back=host.querySelector('.premium-world-sheet-back');
    function close(){sheet.hidden=true;back.hidden=true;sheet.innerHTML=''}
    back.onclick=close;
    host.querySelectorAll('['+nodeAttr+']').forEach(b=>b.onclick=()=>{
      const node=model.nodes.find(n=>n.id===b.getAttribute(nodeAttr)),area=model.areas.find(a=>a.id===node?.areaId);if(!node)return;
      const ai=model.areas.indexOf(area),locked=b.classList.contains('is-future');
      if(!locked&&node.id===recommended?.id){geo?startGeoJourneyNode(node.id,grade):startJourneyNode(subject,node.id,grade);return}
      const status=complete(node,geo)?'Fullført · spill igjen':node.id===recommended?.id?'Neste oppdrag':locked?'Låst område':stateText(node,geo);
      sheet.innerHTML='<div class="premium-sheet-illustration" aria-hidden="true">'+(node.type==='checkpoint'?'🏆':subject==='geography'?'🧭':subject==='math'?'✦':'📖')+'</div><button class="premium-sheet-close" type="button" aria-label="Lukk">×</button><small>'+esc(area?.title||config.name)+' · '+(node.type==='checkpoint'?'TROFÉTEST':node.type==='review'?'REPETISJON':node.type==='challenge'?'BONUSOPPDRAG':'OPPDRAG')+'</small><h2>'+esc(node.title)+'</h2><p>'+esc(locked?'Følg stien og fullfør oppdragene foran for å åpne dette stedet.':journeyMissionCopy(node,geo))+'</p><div class="premium-sheet-meta"><span>'+esc(status)+'</span><span>'+esc(node.type==='checkpoint'?'Trofé venter':'5 oppgaver')+'</span></div>'+(locked&&ai===firstOpen+1?'<button type="button" class="premium-sheet-peek">Ta en sniktitt</button>':locked?'':'<button type="button" class="premium-sheet-start">'+(node.type==='checkpoint'?'Ta trofétesten':complete(node,geo)?'Spill igjen':'Start oppdrag')+'</button>');
      back.hidden=false;sheet.hidden=false;sheet.querySelector('.premium-sheet-close').onclick=close;
      sheet.querySelector('.premium-sheet-start')?.addEventListener('click',()=>{close();geo?startGeoJourneyNode(node.id,grade):startJourneyNode(subject,node.id,grade)});
      sheet.querySelector('.premium-sheet-peek')?.addEventListener('click',()=>{close();geo?startGeoWorldPreview(area.id,grade):startJourneyWorldPreview(subject,area.id,grade)});
      sheet.querySelector('.premium-sheet-close').focus({preventScroll:true});
    });
    if(!geo){
      document.getElementById('subject-screen').classList.add('premium-journey-active');
      const finish=document.getElementById('journey-finish');if(finish)finish.hidden=true;
      document.getElementById('journey-grade-chip').textContent=GRADE_CONFIG[grade].label;
      renderJourneyGradeStrip(subject,'journey-grade-strip','journey-grade-note',grade);
    }else{
      setYoungGeographyWorldFirst(true);
      document.getElementById('geography-screen').classList.add('premium-geo-active');
      document.getElementById('geo-journey-grade').textContent=GRADE_CONFIG[grade].label;
      renderJourneyGradeStrip(subject,'geo-journey-grade-strip','geo-journey-grade-note',grade);
      const finish=document.getElementById('geo-journey-finish');if(finish)finish.hidden=true;
    }
    setTimeout(()=>keepCurrentMissionVisible(host,geo),320);
  }
  renderSubjectJourney=function(){
    const grade=journeyViewGrade(activeSubject),screen=document.getElementById('subject-screen');
    screen.classList.remove('premium-journey-active');
    if(grade<=2&&(activeSubject==='math'||activeSubject==='english')){
      screen.classList.remove('bokskogen-v10-active','bokskogen-v2-active','bokskogen-v3-active');
      return renderMap(activeSubject,false);
    }
    return priorSubject();
  };
  renderGeoJourney=function(){
    document.getElementById('geography-screen')?.classList.remove('premium-geo-active');
    if(journeyViewGrade('geography')<=2)return renderMap('geography',true);
    setYoungGeographyWorldFirst(false);
    return priorGeo();
  };
})();
