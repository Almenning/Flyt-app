/* Presentation-only renderer for the four ORIGINAL approved journey PNGs.
 * Refuses mismatched/unavailable art and keeps the existing renderer intact.
 * All progress and mission execution remain with the original app engine.
 */
(function(){
  'use strict';
  const contract=window.LARIA_LOCKED_JOURNEYS;
  if(!contract||typeof renderSubjectJourney!=='function'||typeof renderGeoJourney!=='function')return;
  const previousSubject=renderSubjectJourney,previousGeo=renderGeoJourney;
  // OFF until all FOUR exact October 10 source PNGs have been uploaded and
  // visually compared. This avoids broken 404 requests in the live fallback.
  // Only the automated decoder test opts in with a page-init flag.
  const ORIGINAL_SOURCE_IMAGES_VERIFIED=false;
  const assets=new Map();
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
  const escapeId=value=>esc(value);
  function screenFor(geo){return document.getElementById(geo?'geography-screen':'subject-screen')}
  function hostFor(geo){return document.getElementById(geo?'geo-journey-map':'journey-map')}
  function backHome(geo){
    const btn=document.getElementById(geo?'geography-back':'subject-back');
    if(btn)btn.click();else if(typeof setTab==='function')setTab('home');
  }
  function notifyLoaded(subject){
    requestAnimationFrame(()=>{
      if(subject==='geography'){
        if(screenFor(true)?.classList.contains('active')&&journeyViewGrade('geography')<=2)renderGeoJourney();
      }else if(screenFor(false)?.classList.contains('active')&&activeSubject===subject&&journeyViewGrade(subject)<=2){
        renderSubjectJourney();
      }
    });
  }
  function ensureOriginalArt(subject){
    const previous=assets.get(subject);
    if(previous)return previous.status==='ready';
    const definition=contract.get(subject);
    if(!definition)return false;
    const img=new Image();
    const record={status:'pending',image:img};
    assets.set(subject,record);
    img.onload=()=>{
      record.status=contract.matchesOriginalSize(subject,img.naturalWidth,img.naturalHeight)?'ready':'invalid';
      if(record.status==='ready')notifyLoaded(subject);
    };
    img.onerror=()=>{record.status='missing'};
    img.decoding='async';
    img.src='./'+definition.asset;
    return false;
  }
  function statusFor(node,geo){return geo?geoJourneyNodeState(node):journeyNodeState(node)}
  function completed(node,geo){
    const st=statusFor(node,geo);
    return st==='passed'||st==='can-now'||st==='mastered';
  }
  function showCurrentIllustratedStop(host,geo){
    const screen=screenFor(geo),target=host.querySelector('.locked-journey-hotspot.state-current');
    if(!screen?.classList.contains('active')||!target)return;
    const viewport=window.innerHeight||document.documentElement.clientHeight||800;
    const box=target.getBoundingClientRect();
    // On iPad/landscape the uncropped portrait art may be taller than the
    // viewport. Enter near the next stop rather than hiding the fox far below.
    const topLimit=Math.max(48,viewport*.12),bottomLimit=viewport*.81;
    if(box.top>=topLimit&&box.bottom<=bottomLimit)return;
    const desired=viewport*.57;
    const scrollY=Math.max(0,window.scrollY+box.top+box.height*.5-desired);
    window.scrollTo({top:scrollY,behavior:'auto'});
  }
  function stage(subject,geo){
    const grade=journeyViewGrade(subject);
    const progress=geo?geoJourneyProgress(grade):journeyProgress(subject,grade);
    if(!progress.model.areas.length)return null;
    const recommended=geo?geoJourneyRecommendedNode(grade):journeyRecommendedNode(subject,grade);
    const firstOpen=journeyFirstOpenArea(progress.model,geo?geoJourneyAreaComplete:journeyAreaComplete);
    return {grade,progress,recommended,firstOpen,contract:contract.build(subject,progress.model,n=>statusFor(n,geo),recommended?.id)};
  }
  function placeLocked(place,model,firstOpen){
    const required=place.nodes.filter(n=>n.type==='skill'||n.type==='geo-skill'||n.type==='checkpoint');
    return required.length>0&&required.every(n=>{
      if(n.complete)return false;
      return model.areas.findIndex(a=>a.id===n.areaId)>firstOpen;
    });
  }
  function placeButton(subject,place,model,firstOpen){
    const box=contract.hotspot(subject,place.index);
    const locked=placeLocked(place,model,firstOpen);
    const state=place.complete?'complete':place.recommended?'current':locked?'future':'available';
    const style='left:'+box.left+';top:'+box.top+';width:'+box.width+';height:'+box.height;
    const progress=place.total?place.done+' av '+place.total+' oppdrag':'Besøk stedet';
    return '<button type="button" class="locked-journey-hotspot state-'+state+'" data-locked-place="'+place.index+'" style="'+style+'" aria-label="'+esc('Sted '+(place.index+1)+': '+place.title+'. '+progress+(locked?'. Fremtidig etappe':place.recommended?'. Neste oppdrag':''))+'">'+
      '<span class="locked-journey-hotspot-mark" aria-hidden="true">'+(place.complete?'✓':place.recommended?'✦':'')+'</span></button>';
  }
  function progressDots(progress){
    const states=contract.milestoneStates(progress.done,progress.total);
    return '<div class="locked-journey-milestones" role="progressbar" aria-label="Hovedoppdrag fullført" aria-valuemin="0" aria-valuemax="'+progress.total+'" aria-valuenow="'+progress.done+'">'+
      states.map((state,i)=>'<span class="locked-journey-milestone is-'+state+'" aria-hidden="true" style="--dot-x:'+(22.8+i*12.85)+'%"></span>').join('')+
      '</div>';
  }
  function gradeChoices(grade){
    return '<p>Velg klassetrinn</p><div class="locked-journey-grade-grid">'+
      Array.from({length:10},(_,i)=>i+1).map(n=>'<button type="button" data-locked-grade="'+n+'"'+(n===grade?' aria-current="true"':'')+'>'+n+'. klasse</button>').join('')+'</div>';
  }
  function renderLocked(subject,geo){
    const host=hostFor(geo),screen=screenFor(geo);
    if(!host||!screen)return false;
    const s=stage(subject,geo);
    if(!s)return false;
    const def=contract.get(subject),model=s.progress.model;
    const places=s.contract.places;
    host.className='journey-map locked-journey-map';
    host.dataset.journeyRelease='journey-rc1';
    host.dataset.journeySubject=subject;
    host.dataset.journeyCoreStops=String(s.progress.total);
    host.dataset.lockedIllustration='2026-10-10';
    host.innerHTML='<section class="locked-journey-board" aria-label="'+esc(def.subjectLabel+' – '+def.title+', interaktivt eventyrkart')+'">'+
      '<img class="locked-journey-image" src="./'+esc(def.asset)+'" alt="" draggable="false" width="941" height="1672">'+
      '<div class="locked-journey-hits">'+places.map(p=>placeButton(subject,p,model,s.firstOpen)).join('')+'</div>'+
      '<button type="button" class="locked-journey-back" aria-label="Tilbake til Hjem"></button>'+
      '<button type="button" class="locked-journey-options" aria-label="Velg klassetrinn"></button>'+
      progressDots(s.progress)+
      '<span class="locked-journey-progress-text">'+s.progress.done+' / '+s.progress.total+' oppdrag</span>'+
      '</section><div class="locked-journey-overlay" hidden><div class="locked-journey-dim"></div><section class="locked-journey-sheet" role="dialog" aria-modal="true" aria-label="Oppdragssted"></section></div>';
    screen.classList.add('locked-journey-active');
    if(geo){
      screen.classList.add('premium-geo-active');
      const shell=document.getElementById('geo-journey-shell'),globe=document.getElementById('open-world');
      if(shell&&globe&&shell.nextElementSibling!==globe)screen.insertBefore(shell,globe);
    }else{
      screen.classList.add('premium-journey-active');
      screen.classList.remove('bokskogen-v10-active','bokskogen-v2-active','bokskogen-v3-active');
    }
    const finish=document.getElementById(geo?'geo-journey-finish':'journey-finish');
    if(finish)finish.hidden=true;
    const overlay=host.querySelector('.locked-journey-overlay');
    const dialog=overlay.querySelector('.locked-journey-sheet');
    const lastFocus={element:null};
    function close(){
      overlay.hidden=true;
      dialog.replaceChildren();
      if(lastFocus.element?.isConnected)lastFocus.element.focus({preventScroll:true});
    }
    function open(markup,origin){
      lastFocus.element=origin||document.activeElement;
      dialog.innerHTML='<button class="locked-sheet-close" type="button" aria-label="Lukk">×</button>'+markup;
      overlay.hidden=false;
      dialog.querySelector('.locked-sheet-close').onclick=close;
      dialog.querySelector('.locked-sheet-close').focus({preventScroll:true});
    }
    overlay.querySelector('.locked-journey-dim').onclick=close;
    host.onkeydown=e=>{
      if(overlay.hidden)return;
      if(e.key==='Escape'){e.preventDefault();close();return}
      if(e.key!=='Tab')return;
      const buttons=[...dialog.querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length>0);
      if(!buttons.length)return;
      const first=buttons[0],last=buttons.at(-1),focused=document.activeElement;
      if(e.shiftKey&&(focused===first||!dialog.contains(focused))){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&(focused===last||!dialog.contains(focused))){e.preventDefault();first.focus()}
    };
    host.querySelector('.locked-journey-back').onclick=()=>backHome(geo);
    host.querySelector('.locked-journey-options').onclick=e=>{
      open('<h2>Reiseinnstillinger</h2>'+gradeChoices(s.grade),e.currentTarget);
      dialog.querySelectorAll('[data-locked-grade]').forEach(btn=>btn.onclick=()=>{
        close();setJourneyViewGrade(subject,Number(btn.dataset.lockedGrade));
      });
    };
    function launch(nodeId){
      close();
      if(geo)startGeoJourneyNode(nodeId,s.grade);
      else startJourneyNode(subject,nodeId,s.grade);
    }
    host.querySelectorAll('[data-locked-place]').forEach(hit=>hit.onclick=()=>{
      const place=places[Number(hit.dataset.lockedPlace)];
      const here=place.nodes;
      const safeNodes=here.map(n=>{
        const original=model.nodes.find(x=>x.id===n.id);
        const areaIndex=model.areas.findIndex(a=>a.id===original?.areaId);
        const locked=areaIndex>s.firstOpen&&!completed(original,geo);
        return {...n,locked,original};
      });
      // Reuse the pre-existing, progress-neutral "Sniktitt" flow from the
      // original journey. Future worlds must never lose their preview simply
      // because the approved illustration has only five painted landmarks.
      const previewNode=safeNodes.find(n=>n.locked&&n.original?.type===(geo?'geo-skill':'skill'));
      const previewMarkup=previewNode&&typeof (geo?startGeoWorldPreview:startJourneyWorldPreview)==='function'?
        '<button type="button" data-locked-preview><span><strong>Ta en sniktitt</strong><small>Prøv en smakebit uten å endre reiseprogresjonen.</small></span><b aria-hidden="true">›</b></button>':'';

      // The painted Brøklaben sign is a doorway to the ALREADY existing
      // exploratory fraction laboratory, not a synthetic quiz or new node.
      // Keep its free access independent from the core journey progression.
      const existingFractionLab=subject==='math'&&place.index===2&&typeof window.openFractionLab==='function';
      const existingActivity=existingFractionLab?
        '<button type="button" class="locked-journey-existing-activity" data-locked-existing="fraction-lab">'+
          '<span><strong>Utforsk Brøklaben</strong><small>Åpne den eksisterende Brøklaben. Fri utforskning uten nye reiseoppdrag.</small></span>'+
          '<b aria-hidden="true">›</b></button>':'';
      const content='<small>STED '+(place.index+1)+' AV 5</small><h2>'+esc(place.title)+'</h2>'+
        '<p>'+esc(place.total?('Velg et oppdrag. '+place.done+' av '+place.total+' hovedoppdrag fullført.'):'Her kan du følge reisen videre uten å miste tidligere oppdrag.')+'</p>'+
        '<div class="locked-journey-missions">'+existingActivity+
        (safeNodes.length?safeNodes.map(n=>'<button type="button" data-locked-node="'+escapeId(n.id)+'"'+(n.locked?' disabled':'')+'>'+
          '<span><strong>'+esc(n.title)+'</strong><small>'+esc(n.locked?'Kommer senere':n.complete?'Fullført, kan spilles igjen':n.type==='review'?'Frivillig repetisjon':n.type==='challenge'?'Ekstra utfordring':n.id===s.recommended?.id?'Neste oppdrag':'Åpent oppdrag')+'</small></span>'+
          '<b aria-hidden="true">'+(n.complete?'✓':n.locked?'🔒':'›')+'</b></button>').join(''):
          '<p class="locked-journey-no-missions" role="status">Dette stedet har ingen egne reiseoppdrag på klassetrinnet ditt. Du kan fortsatt besøke det på kartet.</p>')+
        previewMarkup+'</div>';
      open(content,hit);
      dialog.querySelectorAll('[data-locked-node]').forEach(btn=>btn.onclick=()=>{
        const node=safeNodes.find(n=>n.id===btn.dataset.lockedNode);
        if(node&&!node.locked)launch(node.id);
      });
      dialog.querySelector('[data-locked-existing="fraction-lab"]')?.addEventListener('click',()=>{
        close();
        // Return to Tallenga, not straight to Basecamp. No new node is run,
        // and no learning record is written on this navigation.
        window.openFractionLab({returnToJourney:'math'});
      });
      dialog.querySelector('[data-locked-preview]')?.addEventListener('click',()=>{
        if(!previewNode)return;
        close();
        // Original preview sessions are tagged previewOnly/practiceOnly.
        if(geo)startGeoWorldPreview(previewNode.areaId,s.grade);
        else startJourneyWorldPreview(subject,previewNode.areaId,s.grade);
      });
    });
    requestAnimationFrame(()=>requestAnimationFrame(()=>showCurrentIllustratedStop(host,geo)));
    setTimeout(()=>showCurrentIllustratedStop(host,geo),180);
    return true;
  }
  function canUse(subject){
    if(!ORIGINAL_SOURCE_IMAGES_VERIFIED&&window.LARIA_LOCKED_JOURNEY_QA_ART!==true)return false;
    return !!contract.get(subject)&&journeyViewGrade(subject)<=2&&ensureOriginalArt(subject);
  }
  renderSubjectJourney=function(){
    const screen=screenFor(false);
    if(canUse(activeSubject)&&renderLocked(activeSubject,false))return;
    // Remove all opt-in art classes BEFORE delegating to the established
    // renderer. Otherwise a grade change can leave older grade screens hidden.
    screen?.classList.remove('locked-journey-active','premium-journey-active');
    return previousSubject.apply(this,arguments);
  };
  renderGeoJourney=function(){
    const screen=screenFor(true);
    if(canUse('geography')&&renderLocked('geography',true))return;
    screen?.classList.remove('locked-journey-active','premium-geo-active');
    return previousGeo.apply(this,arguments);
  };
  window.LARIA_LOCKED_JOURNEY_RUNTIME={
    assetStatus:subject=>assets.get(subject)?.status||'not-requested',
    active:()=>document.querySelector('.locked-journey-map')?.dataset.journeySubject||null
  };
})();
