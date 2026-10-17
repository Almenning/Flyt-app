/* Hjem v12: premium basecamp + real free-play Ordjakt. Presentation and entry points only; learning state remains owned by the app. Learning state is owned by the app. */
(()=>{'use strict';
window.LARIA_BASECAMP_DIAG={loaded:true,init:false,render:false,error:null};
const PLACES={lyder:'Bokstavporten',ordbilder:'Lesestua',ordlek:'Rimdammen','ordstart-checkpoint':'Skogsporten',setningsrekkefolge:'Ordbrua',ordbetydning:'Ordhagen','setninger-checkpoint':'Ordhagen',detaljer:'Biblioteket',forsta:'Biblioteket',tenkvidere:'Biblioteket','lesedetektiv-checkpoint':'Biblioteket'};
const svg=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+paths+'</svg>';
const icons={home:svg('<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>'),travel:svg('<path d="m3 5 6-2 6 3 6-2v16l-6 2-6-3-6 2ZM9 3v16m6-13v16"/>'),explore:svg('<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>'),collection:svg('<path d="M5 9a7 7 0 0 1 14 0v12H5ZM9 3V1h6v2M8 14h8v5H8ZM5 10h14"/>')};

/* Small collectible engravings, not additional illustrated travel scenes. */
const MEMORY_GLYPHS=Object.freeze({
  norwegian:'<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mc-f" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff6d8"/><stop offset=".58" stop-color="#ecd59d"/><stop offset="1" stop-color="#c9955a"/></linearGradient></defs><path d="M13 47Q17 22 38 11Q48 7 54 10Q50 20 42 30Q30 44 13 47Z" fill="url(#mc-f)" stroke="#96683b" stroke-width="2.5"/><path d="M12 53Q25 36 46 17" fill="none" stroke="#a16b33" stroke-width="3" stroke-linecap="round"/><path d="M23 36l-5-9m13 1-5-11m10 5 9-1M19 42l-8-3" stroke="#c19b68" stroke-width="1.7" fill="none"/><circle cx="46" cy="13" r="2" fill="#fffbe0"/></svg>',
  math:'<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mc-c" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#e8f9e8"/><stop offset=".53" stop-color="#8fc6c2"/><stop offset="1" stop-color="#387d83"/></linearGradient></defs><path d="M32 6 49 21 51 43 32 56 13 43 15 21Z" fill="url(#mc-c)" stroke="#846a43" stroke-width="2.5"/><path d="m32 6-7 18 7 32 12-30-12-20M15 21l17 9 17-9M13 43l19-13 19 13" stroke="#fff8ce" stroke-opacity=".75" stroke-width="2" fill="none"/><path d="m18 17 8-8m-2 2 0-8" stroke="#fff8d4" stroke-width="2" stroke-linecap="round"/></svg>',
  english:'<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mc-k" x1=".1" y1=".1" x2=".9" y2="1"><stop stop-color="#fff2af"/><stop offset=".55" stop-color="#dba753"/><stop offset="1" stop-color="#96622d"/></linearGradient></defs><circle cx="24" cy="20" r="12" fill="url(#mc-k)" stroke="#825528" stroke-width="2.5"/><circle cx="24" cy="20" r="5.4" fill="#fbe8bb" stroke="#8a6238" stroke-width="2"/><path d="m32 29 21 21-4 6-6-6-5 4-5-5 4-5-13-12" fill="url(#mc-k)" stroke="#825528" stroke-width="2.5" stroke-linejoin="round"/><circle cx="46" cy="11" r="2" fill="#fff8d0"/><path d="M46 4v4m0 6v4m-7-7h4m7 0h4" stroke="#fff4b5" stroke-width="1.8" stroke-linecap="round"/></svg>',
  geography:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#9d7044" stroke="#6b4c31" stroke-width="2.5"/><circle cx="32" cy="32" r="21" fill="#fff1c7" stroke="#d6ad67" stroke-width="2"/><circle cx="32" cy="32" r="17" fill="#a7d5cd" stroke="#6fa4a0" stroke-width="1.5"/><path d="M32 13v5m0 28v5M13 32h5m28 0h5" stroke="#986b36" stroke-width="2" stroke-linecap="round"/><path d="m22 42 7-16 13-8-7 16-13 8Z" fill="#e7a75d" stroke="#785230" stroke-width="1.7"/><path d="m29 26 13-8-7 16Z" fill="#fff7d4"/><circle cx="32" cy="32" r="2.5" fill="#815e42"/></svg>'
});
const CLOTHING_GLYPHS=Object.freeze({
 'eventyrskjerf':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 12Q30 4 45 16Q53 25 42 36L34 44 22 39 37 29Q44 22 35 20Q26 17 24 25L20 34 11 29Z" fill="#c86663" stroke="#995154" stroke-width="2.5"/><path d="M34 40l17 3-8 17-16-5Z" fill="#de8d80" stroke="#995154" stroke-width="2.5"/><path d="M30 48l15 6" stroke="#ffe1b4" stroke-width="2"/></svg>',
 'oppdagerhatt':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M4 43Q21 37 34 37Q52 38 61 44Q55 53 32 53Q12 52 4 43Z" fill="#477662" stroke="#335746" stroke-width="3"/><path d="M17 41L23 12Q38 7 47 17L52 42Q37 48 17 41Z" fill="#84a07b" stroke="#426751" stroke-width="3"/><path d="M18 38Q36 46 51 37" stroke="#aa7047" stroke-width="6"/><path d="M36 18l3-8 6 8-6-2Z" fill="#ffdd95"/></svg>',
 'stjerneryggsekk':'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="17" width="40" height="42" rx="10" fill="#906643" stroke="#63452e" stroke-width="3"/><path d="M23 18v-6q0-8 9-8t9 8v6" fill="none" stroke="#755337" stroke-width="5"/><path d="M18 34q14 7 28 0v14H18Z" fill="#bb8b57" stroke="#7d5837" stroke-width="2"/><path d="m32 29 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#fbe1a0" stroke="#a8783a" stroke-width="1"/></svg>',
 'nordlyskappe':'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 11Q30 18 44 11Q53 29 58 56Q34 48 10 57Q12 32 18 11Z" fill="#458a99" stroke="#36687f" stroke-width="3"/><path d="M25 20Q33 28 43 20M19 32q12 11 32 0" fill="none" stroke="#9fe2c4" stroke-width="4"/><circle cx="32" cy="14" r="5" fill="#f2d492" stroke="#976f47" stroke-width="2"/></svg>'
});
let mode='home',fromCamp=false,returnFocus=null,returnView='home';
const QUESTS=[
 {action:'words',eyebrow:'Et lite eventyr, hvis du vil',title:'Ord har gjemt seg i Bokskogen',copy:'Reven har sett ord mellom bokstavene. Hvor mange klarer du å finne?',button:'Start Ordjakt →'},
 {action:'globe',eyebrow:'Et lite eventyr, hvis du vil',title:'Finn et nytt sted på Kloden',copy:'Reven lurer på om du kan oppdage et land du ikke har besøkt før.',button:'Åpne Kloden →'},
 {action:'fraction',eyebrow:'Et lite eventyr, hvis du vil',title:'Kan du dele noe rettferdig?',copy:'Gå inn i Brøklab og bygg en brøk på din egen måte.',button:'Til Brøklab →'},
 {action:'multiply',eyebrow:'Et lite eventyr, hvis du vil',title:'Finn et mønster i tallene',copy:'Bli med til Gangemagi og pakk jordbær i like kurver. Kan du finne mønsteret?',button:'Lek med tall →'}
];
function dailyQuest(){const d=new Date(),seed=d.getFullYear()*400+d.getMonth()*31+d.getDate()+Number(currentGrade()||0);return QUESTS[seed%QUESTS.length]}
function wordHuntThemeProgress(){
 const rules=window.LARIA_WORD_HUNT_THEMES;
 if(!rules?.normalizeProgress)return {rounds:0,themeRounds:{}};
 try{return rules.normalizeProgress(JSON.parse(localStorage.getItem('laria-wordhunt-v1')||'{}'))}
 catch(_){return rules.normalizeProgress(null)}
}
function wordHuntRounds(){return wordHuntThemeProgress().rounds}
const young=()=>currentGrade()<=2;
function selectedFoxSource(which){return window.LARIA_FOX.source(which);}
function activitySubject(scope,last){
 if(scope?.subject==='geography'||String(scope?.type||'').startsWith('geo')||['country','collection','world','grade','geography-theme'].includes(scope?.type))return 'geography';
 if(['norwegian','math','english'].includes(scope?.subject))return scope.subject;
 if(last?.subject==='geography'||String(last?.kind||'').startsWith('geo'))return 'geography';
 if(['norwegian','math','english'].includes(last?.subject))return last.subject;
 return 'norwegian';
}
function approvedNextPlace(subject,progress,node,grade){
 if(grade>2||!node)return null;
 const contract=window.LARIA_LOCKED_JOURNEYS;
 if(!contract?.build||!progress?.model)return null;
 try{
  const nodeStatus=subject==='geography'?geoJourneyNodeState:journeyNodeState;
  const journey=contract.build(subject,progress.model,nodeStatus,node.id);
  return journey.places.find(place=>place.nodes.some(item=>item.id===node.id))?.title||null;
 }catch(_){return null}
}
function next(){
 const active=state.activeSession?.scope;
 const subject=activitySubject(active,state.lastActivity);
 const grade=Number(active?.journeyGrade||active?.grade||state.lastActivity?.grade||currentGrade());
 const progress=subject==='geography'?geoJourneyProgress(grade):journeyProgress(subject,grade);
 const node=subject==='geography'?geoJourneyRecommendedNode(grade):journeyRecommendedNode(subject,grade);
 return {subject,grade,title:active?.label||approvedNextPlace(subject,progress,node,grade)||(subject==='norwegian'?PLACES[node?.id]:null)||node?.title||'Bokskogen',active:!!active,pct:Number(progress?.pct||0),complete:!!progress?.complete};
}
       
function journeyCopy(info){
 if(info?.active)return 'Du har allerede startet. Reisen fortsetter der du slapp.';
 if(info?.subject==='geography')return 'Et nytt sted i verden venter.';
 if(info?.subject==='math')return 'Tall, mønstre og neste utfordring venter.';
 if(info?.subject==='english')return 'Nye ord og et nytt oppdrag venter.';
 return 'Bokskogen har et nytt oppdrag til deg.';
}
function home(view='home'){mode=view;setTab('home');render();}
function basecampView(view){
 return ['home','travel','explore'].includes(view)?view:'home';
}
// The source panel belongs to navigation, not to the destination screen.
// It is transient UI context and is never written to the child's learning state.
window.LARIA_MARK_BASECAMP_ORIGIN=view=>{
 fromCamp=true;
 returnView=basecampView(view||window.LARIA_ACTIVE_BASECAMP_PANEL?.()||mode);
};
window.LARIA_BASECAMP_RETURN_VIEW=()=>fromCamp?returnView:null;
window.LARIA_RETURN_TO_BASECAMP=()=>{
 if(!fromCamp)return false;
 const destination=returnView;
 fromCamp=false;returnView='home';
 // Basecamp stays on its canonical Home layout underneath each chooser.
 home('home');
 window.LARIA_ACTIVATE_BASECAMP_PANEL?.(destination);
 return true;
};
function travel(){const info=next();window.LARIA_MARK_BASECAMP_ORIGIN();if(info.active){startSession();return}if(info.subject==='geography'){renderGeographyContinue();showScreen('geography')}else openSubject(info.subject);}
function activity(name){
 window.LARIA_MARK_BASECAMP_ORIGIN();
 if(name==='globe'){if(typeof window.openGlobe==='function')window.openGlobe('classic');else{showScreen('world');requestAnimationFrame(()=>setGlobeMode('classic'));}}
 else if(name==='fraction')window.openFractionLab();
 else if(name==='multiply')window.openMultiplicationLab();
 else if(name==='words'){if(typeof window.openWordHunt==='function')window.openWordHunt();else openSubject('norwegian');}
}
function closeDialog(){const d=document.getElementById('bc12-dialog');if(d?.open)d.close();returnFocus?.focus();}
function dialog(kind){
 const gearPreviewEnabled=window.LARIA_FOX_WARDROBE?.gearPreviewEnabled===true;
 // Deferred outfit art is not a child-facing activity. The underlying
 // collection still records earned clothing and equipped slots unchanged.
 if(kind==='equipment'&&!gearPreviewEnabled)kind='collection';
 const d=document.getElementById('bc12-dialog');if(!d.open)returnFocus=document.activeElement;
 d.classList.toggle('is-collection',kind==='collection'||kind==='wardrobe'||kind==='equipment');
 d.classList.toggle('is-wardrobe',kind==='wardrobe');
 d.classList.toggle('is-fox-girl',kind==='wardrobe'&&window.LARIA_FOX?.choice?.()==='girl');
 d.classList.toggle('is-equipment',kind==='equipment');
 if(kind==='wardrobe'&&!gearPreviewEnabled){
   const avatar=window.LARIA_FOX.choice();
   d.innerHTML='<button class="bc12-close" aria-label="Lukk">×</button>'+
     '<span class="bc12-eyebrow">Lærias eventyrverden</span><h2 id="bc12-dialog-title">Min rev</h2>'+
     '<div class="bc12-wardrobe-preview" role="img" aria-label="Din '+window.LARIA_FOX.label(avatar)+'">'+
       window.LARIA_FOX_WARDROBE.render(avatar,window.LARIA_COLLECTION_STORE.snapshot(),'world')+'</div>'+
     '<p class="bc12-wardrobe-hint">Reven din blir med på alle eventyrene, akkurat slik du valgte den.</p>'+
     '<button type="button" class="bc12-dialog-go" data-dialog-home>Tilbake til Læria</button>';
 }
 else if(kind==='wardrobe'){
   const avatar=window.LARIA_FOX.choice(),collection=window.LARIA_COLLECTION_STORE.snapshot(),core=window.LARIA_COLLECTION_CORE;
   const wearable=core.available(collection).filter(item=>item.kind==='clothing');
   const slots={head:'Hode',neck:'Hals',back:'Rygg',cape:'Kappe'};
   d.innerHTML='<button class="bc12-close" aria-label="Lukk">×</button>'+
    '<span class="bc12-eyebrow">Min rev · Lærias eventyrverden</span><h2 id="bc12-dialog-title">Kle på din rev</h2>'+
    '<div class="bc12-wardrobe-preview" role="img" aria-label="Din '+window.LARIA_FOX.label(avatar)+' med valgt utstyr">'+
      window.LARIA_FOX_WARDROBE.render(avatar,collection,'world')+'</div>'+
    '<p class="bc12-wardrobe-hint">Alt du finner, beholder du. Prøv ulike plagg på reven din!</p>'+
    '<div class="bc12-wardrobe-grid" role="group" aria-label="Velg klær og utstyr">'+wearable.map(item=>{
      const active=item.equipped,owned=item.owned;
      return '<button type="button" class="bc12-wardrobe-item" data-wear="'+item.id+'" data-owned="'+owned+'" aria-pressed="'+active+'" '+(!owned?'disabled':'')+'>'+
        '<span class="bc12-wardrobe-item-art" aria-hidden="true">'+(CLOTHING_GLYPHS[item.id]||'✦')+'</span><strong>'+item.title+'</strong><small>'+slots[item.slot]+'</small>'+
        '<span>'+(active?'✓ I bruk':owned?'Ta på':'Ikke funnet ennå')+'</span></button>';
    }).join('')+'</div>'+
    '<button type="button" class="bc12-dialog-go" data-wardrobe-back>Tilbake til samleboken</button>';
   d.querySelectorAll('[data-wear]').forEach(button=>button.addEventListener('click',()=>{
     const id=button.dataset.wear,selected=wearable.find(item=>item.id===id);
     if(!selected?.owned)return;
     if(selected.equipped)window.LARIA_COLLECTION_STORE.unequip(selected.slot);
     else window.LARIA_COLLECTION_STORE.equip(id);
     window.LARIA_FOX_WARDROBE.refresh();
     dialog('wardrobe');
     d.querySelector('[data-wear="'+id+'"]')?.focus();
   }));
   d.querySelector('[data-wardrobe-back]').addEventListener('click',()=>dialog('collection'));
 }
 else if(kind==='equipment'){
   const all=window.LARIA_COLLECTION_CORE.available(state.collectibles);
   const wearables=all.filter(item=>item.kind==='clothing');
   const owned=wearables.filter(item=>item.owned).length;
   d.innerHTML='<button class="bc12-close" aria-label="Lukk">×</button>'+
    '<div class="bc12-book-heading"><span class="bc12-book-seal" aria-hidden="true">✦</span><div><span class="bc12-eyebrow">Lærias magiske samlebok</span><h2 id="bc12-dialog-title">Skatter og utstyr</h2></div></div>'+
    '<div class="bc12-collection-tabs" role="group" aria-label="Bla i samleboken">'+
    '<button type="button" data-collection-tab="collection">Minner</button>'+
    '<button type="button" aria-current="page" data-collection-tab="equipment">Utstyr</button></div>'+
    '<div class="bc12-memory-intro"><b>'+owned+' av '+wearables.length+' plagg funnet</b><span>Prøv utstyret på din rev. Du beholder det du har funnet.</span></div>'+
    '<div class="bc12-equipment-grid">'+wearables.map(item=>'<div class="bc12-equipment-card" data-collectible-id="'+item.id+'" data-owned="'+item.owned+'">'+
    '<span class="bc12-equipment-art" aria-hidden="true">'+(CLOTHING_GLYPHS[item.id]||'✦')+'</span><strong>'+(item.owned?item.title:'Uoppdaget utstyr')+'</strong>'+
    '<small>'+(item.equipped?'✓ I bruk':item.owned?'I garderoben':'Finnes på eventyrreisen')+'</small></div>').join('')+'</div>'+
    '<button class="bc12-dialog-go" data-wardrobe-open>🦊 Åpne Min rev og garderoben</button>';
 }
 else if(kind==='quest'){const q=dailyQuest();d.dataset.questAction=q.action;d.innerHTML='<button class="bc12-close" aria-label="Lukk">×</button><span class="bc12-eyebrow">'+q.eyebrow+'</span><h2 id="bc12-dialog-title">'+q.title+'</h2><p>'+q.copy+'</p><button class="bc12-dialog-go" data-quest-go>'+q.button+'</button><button class="bc12-later">Kanskje senere</button>';}
 else {
  const visited=Object.values(state.journey?.nodes||{}).filter(n=>n.passed||Number(n.attempts)>0).length;
  const trophies=Object.keys(state.journey?.gradeWins||{}).length,wordRounds=wordHuntRounds();
  const themeProgress=wordHuntThemeProgress();
  const wordPacks=window.LARIA_WORD_HUNT_THEMES?.list?.()||[];
  const earnedPacks=wordPacks.filter(pack=>(themeProgress.themeRounds[pack.id]||0)>0).length;
  const themeStickers=wordPacks.map(pack=>{
    const rounds=themeProgress.themeRounds[pack.id]||0,owned=rounds>0;
    return '<div class="bc12-wordhunt-sticker'+(owned?' is-earned':' is-locked')+'" data-word-theme="'+pack.id+'" data-owned="'+owned+'" aria-label="'+pack.title+(owned?', klistremerke funnet':', klistremerke ikke funnet')+'">'+
      '<span class="bc12-wordhunt-sticker-art"><img alt="" loading="lazy" src="./assets/word-hunt/themes/'+pack.id+'.webp?v=20261017-painted1"></span>'+
      '<strong>'+pack.title+'</strong><small>'+(owned?'✦ Funnet':'Ikke funnet ennå')+'</small></div>';
  }).join('');
  // A world keepsake is visible only when earned; clothing previews wait until
  // the real full-body character and aligned outfit layers are available.
  const treasures=(window.LARIA_COLLECTION_CORE?.available?.(state.collectibles)||[])
    .filter(item=>item.kind==='treasure'&&item.realm!=='all');
  const discovered=treasures.filter(item=>item.owned).length;
  const keepsakes=treasures.map(item=>{
    const owned=item.owned;
    return '<div class="bc12-memory'+(owned?' is-found':' is-hidden')+'" data-collectible-id="'+item.id+'" data-owned="'+owned+'" aria-label="'+(owned?'Funnet: '+item.title:'Uoppdaget minne')+'">'+
      '<span class="bc12-memory-symbol" aria-hidden="true">'+(MEMORY_GLYPHS[item.realm]||'✦')+'</span>'+
      '<strong>'+(owned?item.title:'Uoppdaget minne')+'</strong>'+
      '<small>'+(owned?item.description:'Et minne venter på å bli funnet')+'</small>'+
      '<span class="bc12-memory-status">'+(owned?'✦ Funnet':'Ikke funnet ennå')+'</span></div>';
  }).join('');
  d.innerHTML='<button class="bc12-close" aria-label="Lukk">×</button>'+
    '<div class="bc12-book-heading"><span class="bc12-book-seal" aria-hidden="true">✦</span><div><span class="bc12-eyebrow">Lærias magiske samlebok</span><h2 id="bc12-dialog-title">Samlingen min</h2></div></div>'+
    // Equipment tab is unpublished until its 2.5D assets meet quality bar.

    '<div class="bc12-memory-intro"><b>'+discovered+' av '+treasures.length+' minner funnet</b><span>Utforsk, prøv og øv. Du bestemmer hva du har lyst til.</span></div>'+
    '<div class="bc12-memory-grid" role="group" aria-label="Minner fra de fire fagreisene">'+keepsakes+'</div>'+
    '<section class="bc12-wordhunt-collection" aria-label="Klistremerker fra Ordjakt">'+
      '<div class="bc12-wordhunt-stickers-heading"><strong>Ordjakts klistremerker</strong><span>'+earnedPacks+' av '+wordPacks.length+' funnet</span></div>'+
      '<p>Finn alle ordene i en runde for å få et temaklistremerke. Du kan spille favorittene dine så ofte du vil.</p>'+
      '<div class="bc12-wordhunt-stickers" role="group" aria-label="Mine ordtemaer">'+themeStickers+'</div></section>'+
    '<div class="bc12-shelf"><div><span aria-hidden="true">✦</span><strong>'+visited+'</strong><small>steder besøkt</small></div><div><span aria-hidden="true">🔤</span><strong>'+wordRounds+'</strong><small>ordjakter</small></div><div><span aria-hidden="true">♜</span><strong>'+trophies+'</strong><small>eventyr fullført</small></div></div>'+
    '<button class="bc12-dialog-go" data-wardrobe-open>Min rev · Se reven din</button>'+ 
    '<button class="bc12-dialog-go" data-dialog-home>Tilbake til basecamp</button>';
 }
 d.querySelector('.bc12-close').onclick=closeDialog;d.querySelector('.bc12-later')?.addEventListener('click',closeDialog);
 d.querySelector('[data-quest-go]')?.addEventListener('click',()=>{const action=d.dataset.questAction||'words';closeDialog();activity(action)});
 d.querySelectorAll('[data-collection-tab]').forEach(button=>button.addEventListener('click',()=>dialog(button.dataset.collectionTab)));
 d.querySelector('[data-wardrobe-open]')?.addEventListener('click',()=>dialog('wardrobe'));
 d.querySelector('[data-dialog-home]')?.addEventListener('click',()=>{closeDialog();home()});
 if(!d.open)d.showModal();
}
const SUBJECT_ART={"norwegian":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><path d=\"M29 15Q18 9 7 13v31q12-4 22 3 10-7 23-3V13Q40 9 29 15Z\" fill=\"#f8e5b7\" stroke=\"#704c2e\" stroke-width=\"3\"/><path d=\"M29 15v32M12 20q8-2 13 1m-13 6q8-2 13 1m10-7q6-3 12-1m-12 8q6-3 12-1\" stroke=\"#9e7147\" stroke-width=\"2.2\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M7 45q12-4 22 3 10-7 23-3\" stroke=\"#d2a970\" stroke-width=\"3\" fill=\"none\"/></svg>","math":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><rect x=\"8\" y=\"25\" width=\"25\" height=\"25\" rx=\"5\" fill=\"#f7c06e\" stroke=\"#9f6239\" stroke-width=\"3\"/><path d=\"M8 29l12-8 13 5v24H8Z\" fill=\"#e7aa5e\" stroke=\"#9f6239\" stroke-width=\"2\"/><text x=\"20\" y=\"44\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"900\" fill=\"#754122\">2</text><rect x=\"32\" y=\"10\" width=\"21\" height=\"29\" rx=\"4\" fill=\"#a5d4bf\" stroke=\"#4a8778\" stroke-width=\"3\"/><text x=\"42.5\" y=\"31\" text-anchor=\"middle\" font-size=\"17\" font-weight=\"900\" fill=\"#376453\">3</text></svg>","english":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><path d=\"M8 10h44v30H32L22 50v-10H8Z\" fill=\"#fff1c9\" stroke=\"#895b3d\" stroke-width=\"3\" stroke-linejoin=\"round\"/><text x=\"30\" y=\"31\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"900\" fill=\"#547f91\">Hi!</text><path d=\"M37 8l13 7\" stroke=\"#d48569\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>","geography":"<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><circle cx=\"30\" cy=\"28\" r=\"21\" fill=\"#82cee0\" stroke=\"#497b82\" stroke-width=\"3\"/><path d=\"M17 11l8 5 1 8 7 4-5 11-7 6-2-14-10-9Zm23 1-6 8 8 7-2 9 7 2 3-16Z\" fill=\"#88b98b\" stroke=\"#598d74\" stroke-width=\"1\"/><path d=\"M8 49h44M30 50v5\" stroke=\"#97683e\" stroke-width=\"4\" stroke-linecap=\"round\"/><ellipse cx=\"30\" cy=\"28\" rx=\"10\" ry=\"21\" stroke=\"#fff4d4\" stroke-width=\"1.3\" opacity=\".55\" fill=\"none\"/></svg>"};

/* Four small, original illustrations. The large chapter art is loaded only
   after the child actually chooses a subject, never on Home's critical path. */
const SUBJECT_SCENES={
 norwegian:'<g transform="translate(20 24)"><path d="M8 99L18 30 35 10 56 29 63 99Z" fill="#528663" stroke="#3f6f59" stroke-width="3"/><path d="M0 72L16 15 34 72Z" fill="#3d775b"/><path d="M15 65L35 3 58 65Z" fill="#80a977"/><path d="M14 41L35 3 48 32" stroke="#c4d59b" stroke-width="3" fill="none"/><path d="M83 100V50L121 20 157 48V100Z" fill="#eac592" stroke="#936440" stroke-width="3"/><path d="M73 52L120 6 169 52Z" fill="#b7664f" stroke="#8f4d3a" stroke-width="3"/><path d="M110 99V66Q121 53 132 66V99Z" fill="#825f4d"/><rect x="90" y="56" width="15" height="19" rx="3" fill="#9ed6d2" stroke="#a1774e" stroke-width="2"/><rect x="139" y="56" width="14" height="19" rx="3" fill="#9ed6d2" stroke="#a1774e" stroke-width="2"/><path d="M-10 103Q80 73 180 106" stroke="#edd7a3" stroke-width="15" fill="none"/><g fill="#fff4ba"><circle cx="72" cy="79" r="3"/><circle cx="169" cy="87" r="3"/></g></g>',
 math:'<g transform="translate(23 35)"><path d="M0 89L33 38 68 89Z" fill="#7eaa8b"/><path d="M58 93V23L110 5 158 25V93Z" fill="#b47f50" stroke="#865839" stroke-width="3"/><path d="M58 26L110 5 158 25 110 43Z" fill="#ebc189" stroke="#96653b" stroke-width="2"/><path d="M110 43V93" stroke="#895d3a" stroke-width="3"/><g fill="#eed49b" stroke="#986942" stroke-width="2"><rect x="67" y="49" width="34" height="31" rx="5"/><rect x="116" y="49" width="34" height="31" rx="5"/></g><g fill="#58786d" font-size="25" font-weight="1000" text-anchor="middle"><text x="84" y="73">2</text><text x="133" y="73">4</text></g><g transform="translate(187 67)"><circle r="27" fill="#a57848" stroke="#65482f" stroke-width="5"/><circle r="17" fill="#d8b679" stroke="#8a663d" stroke-width="3"/><path d="M-25 0H25M0-25V25M-18-18L18 18M-18 18L18-18" stroke="#735239" stroke-width="4"/><circle r="5" fill="#f3da9e"/></g></g>',
 english:'<g transform="translate(17 22)"><rect x="5" y="54" width="54" height="59" rx="3" fill="#f5d5aa" stroke="#ad7c61" stroke-width="2"/><path d="M0 55L31 17 65 55Z" fill="#b67e83" stroke="#815b66" stroke-width="3"/><path d="M24 113V81H40V113" fill="#7c686e"/><rect x="9" y="69" width="12" height="16" fill="#a2d9cf"/><g transform="translate(77 2)"><rect x="0" y="53" width="75" height="88" rx="3" fill="#edc799" stroke="#986a51" stroke-width="3"/><path d="M-9 55L38 7 87 55Z" fill="#a66c62" stroke="#80534b" stroke-width="3"/><path d="M28 141V91Q37 79 47 91V141" fill="#7a777c"/><rect x="9" y="73" width="14" height="20" fill="#9acdd8"/><rect x="54" y="73" width="14" height="20" fill="#9acdd8"/><path d="M38 7V-8" stroke="#8f6558" stroke-width="2"/><path d="M39-8h31v16H39Z" fill="#83b1c5"/></g><g transform="translate(176 43)"><path d="M0 70V20L23 1 50 20V70Z" fill="#f5d8ac"/><path d="M-4 20L23-5 54 20Z" fill="#8494b2"/><rect x="18" y="40" width="14" height="30" fill="#9b7c77"/></g><path d="M0 122Q128 100 260 120" stroke="#ebd3a2" stroke-width="10" fill="none"/></g>',
 geography:'<g><path d="M0 111L59 21 116 111Z" fill="#8ba1ad" stroke="#638796" stroke-width="3"/><path d="M44 46L59 21 76 48 64 42 59 56Z" fill="#f9f4e4"/><path d="M72 113L151 6 228 113Z" fill="#6f929e" stroke="#587a87" stroke-width="3"/><path d="M136 27L151 6 168 32 156 25 150 42Z" fill="#faf7ea"/><path d="M170 115L240 32 286 115Z" fill="#9eb3b8"/><path d="M0 117Q90 97 160 119T280 112V145H0Z" fill="#6caa93"/><g transform="translate(172 50)"><rect x="28" y="50" width="49" height="50" rx="4" fill="#dab783" stroke="#876344" stroke-width="3"/><path d="M22 52L52 18 84 52Z" fill="#a66d52" stroke="#795039" stroke-width="3"/><circle cx="52" cy="12" r="26" fill="#78c0cf" stroke="#e7d4a3" stroke-width="5"/><path d="M42-9L58-5 61 7 48 12 42 23 30 14 32-1Z" fill="#80b691"/><ellipse cx="52" cy="12" rx="11" ry="26" stroke="#d8efe0" stroke-width="1.5" fill="none"/><path d="M52-14V38M26 12H78" stroke="#d6ece1" stroke-width="1.5"/></g></g>'
};
function subjectScene(subject){
 const colors={
 norwegian:['#b6e2d8','#80b7a2','#3c785e'],
 math:['#f5dfaa','#bebc81','#8faa7b'],
 english:['#d3d8e8','#a6a7c3','#88a9a6'],
 geography:['#bde7ef','#85bec4','#6ca2a2']
 }[subject]||['#c9dfd6','#a5c5ad','#78a18d'];
 const id='bc14-'+subject;
 return '<svg viewBox="0 0 280 145" preserveAspectRatio="xMidYMid slice" role="presentation" focusable="false" aria-hidden="true">'+
 '<defs><linearGradient id="'+id+'-sky" x2="0" y2="1"><stop stop-color="'+colors[0]+'"/><stop offset="1" stop-color="#f4edc8"/></linearGradient><linearGradient id="'+id+'-grass" x2="0" y2="1"><stop stop-color="'+colors[1]+'"/><stop offset="1" stop-color="'+colors[2]+'"/></linearGradient></defs>'+
 '<rect width="280" height="145" fill="url(#'+id+'-sky)"/><circle cx="230" cy="26" r="23" fill="#fff0b6" opacity=".83"/>'+
 '<path d="M0 102L59 40 97 75 146 24 213 96 257 47 280 90V145H0Z" fill="#f9f2de" opacity=".76"/>'+
 '<path d="M0 110Q57 73 114 102T280 95V145H0Z" fill="'+colors[1]+'"/>'+
 '<path d="M0 131Q55 97 111 123T280 115V145H0Z" fill="url(#'+id+'-grass)"/>'+
 (SUBJECT_SCENES[subject]||'')+'</svg>';
}
function subjectHomeCard(subject,label,world){
 return '<button type="button" class="bc14-subject bc14-'+subject+'" data-camp="subject-'+subject+'" aria-label="Åpne '+label+', '+world+'">'+
 '<span class="bc14-subject-scene" aria-hidden="true">'+subjectScene(subject)+'<img loading="lazy" decoding="async" fetchpriority="low" src="./home-'+subject+'-v14.webp?v=20261010-scene1" alt=""><span class="bc14-vignette"></span><span class="bc14-emblem">'+SUBJECT_ART[subject]+'</span></span>'+
 '<span class="bc14-subject-copy"><strong>'+label+'</strong><small>'+world+'</small><span class="bc14-entry">Utforsk <b aria-hidden="true">›</b></span></span></button>';
}
function homeSubjects(){return '<div class="bc14-subjects" role="group" aria-label="Velg et fag">'+
 subjectHomeCard('norwegian','Norsk','Bokskogen')+
 subjectHomeCard('math','Matte','Tallenga')+
 subjectHomeCard('english','Engelsk','Ordlandsbyen')+
 subjectHomeCard('geography','Geografi','Nordlysleiren')+'</div>';}
function openHomeSubject(subject){
 if(!['norwegian','math','english','geography'].includes(subject))return;
 window.LARIA_MARK_BASECAMP_ORIGIN();
 if(subject==='geography'){
  if(typeof renderGeographyContinue==='function')renderGeographyContinue();
  showScreen('geography');
 }else if(typeof openSubject==='function')openSubject(subject);
}
function destination(action,label,description){return '<button class="bc12-place bc12-'+action+'" data-camp="'+action+'" aria-label="'+label+' – '+description+'"><span class="bc12-place-glow" aria-hidden="true"></span><span class="bc12-sign">'+label+'</span><span class="bc12-place-hint">'+description+'</span></button>';}
function markup(){return '<section class="bc12" data-release="basecamp-rc1" aria-label="Læria basecamp">'+
 '<div class="bc12-landscape" aria-hidden="true"></div><div class="bc12-sun" aria-hidden="true"></div>'+
 '<header class="bc12-heading"><div class="bc12-brand">Læria<span>✦</span></div><h1>Hvor skal vi dra i dag?</h1><p data-camp-intro>Et nytt eventyr venter på deg.</p></header>'+
  '<button class="bc12-adult-entry" type="button" data-camp-adult aria-label="Hold inne for voksenområdet">🔒 For voksne</button>'+

 '<div class="bc12-explore-ribbon"><span aria-hidden="true">🧭</span>Lek & utforsk</div>'+homeSubjects()+'<div class="bc12-destinations" aria-label="Lek og utforsk">'+destination('globe','Kloden','Oppdag verden')+destination('fraction','Brøklab','Del og eksperimenter')+destination('words','Ordjakt','Inn i Bokskogen')+destination('multiply','Gangemagi','Pakk og gang')+'</div>'+
 '<div class="bc12-journey-route" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="bc12-route-edge" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path><path class="bc12-route-main" pathLength="100" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path><path class="bc12-route-progress" pathLength="100" d="M5 88 C25 82 27 62 46 64 S72 43 95 16"></path></svg><span class="bc12-route-bridge"></span></div>'+
 '<div class="bc12-you-are-here" aria-hidden="true"><i></i><span>Du er her</span></div>'+
 '<div class="bc12-next-beacon" aria-hidden="true"><i></i><span>Neste sted</span></div>'+
 '<div class="bc12-fox"><img src="'+window.LARIA_FOX.source(window.LARIA_FOX.choice())+'" alt="Din valgte rev venter på stien" draggable="false"></div><button type="button" class="bc12-fox-call bc14-fox-open" data-camp="wardrobe" aria-label="Åpne Min rev" data-camp-fox-call>Min rev · Se reven din ›</button>'+
 '<button class="bc12-journey" data-camp="travel"><span>Fortsett reisen <b aria-hidden="true">→</b></span><small><em data-camp-next-type>Neste sted</em><strong data-camp-next>Bokskogen</strong><span data-camp-next-copy>Et nytt oppdrag venter.</span></small></button>'+
 '<button type="button" class="bc14-free" data-camp="open-explore"><span class="bc14-free-icon" aria-hidden="true">✧</span><span><strong>Utforsk og lek</strong><small>Prøv det du liker</small></span><b aria-hidden="true">›</b></button>'+ '<button class="bc12-quest" data-camp="quest"><span class="bc12-wax" aria-hidden="true">✦</span><span>Et brev fra reven<small>Vil du bli med?</small></span></button>'+
 '<button class="bc12-treasure" data-camp="collection"><span>Samlingen min</span></button>'+
 '<i class="bc12-spark a" aria-hidden="true"></i><i class="bc12-spark b" aria-hidden="true"></i><i class="bc12-spark c" aria-hidden="true"></i>'+
 '<nav class="bc12-nav" aria-label="Læria hovedmeny">'+[['home','Hjem'],['travel','Reisen'],['explore','Utforsk'],['collection','Samlebok'],['wardrobe','Min rev']].map(([a,t])=>'<button data-camp="'+a+'"><span aria-hidden="true">'+(a==='wardrobe'?'<i class="bc14-nav-fox"></i>':icons[a])+'</span>'+t+'</button>').join('')+'</nav></section>';
}
function runCampAction(action){
 if(!action)return;
 if(action==='home'||action==='explore')home(action);
 else if(action==='travel')travel();
 else if(action.startsWith('subject-'))openHomeSubject(action.slice(8));
 else if(action==='open-explore'){
  const explore= document.querySelector('.bc12-nav [data-camp="explore"]');
  if(explore)explore.click();else home('explore');
 }
 else if(action==='quest'||action==='collection'||action==='wardrobe')dialog(action);
 else activity(action);
}
function bindCampControls(host){
 if(!host||host.dataset.controlsBound==='true')return;
 host.dataset.controlsBound='true';
 host.querySelectorAll('[data-camp]').forEach(control=>{
  control.addEventListener('click',e=>{
   e.preventDefault();
   runCampAction(control.dataset.camp);
  });
 });
  const adult=host.querySelector('[data-camp-adult]');
 if(adult){
  let holdTimer=null;
  const reset=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null}adult.classList.remove('holding');adult.textContent='🔒 For voksne'};
  adult.addEventListener('pointerdown',e=>{
   e.preventDefault();
   if(holdTimer)return;
   adult.classList.add('holding');adult.textContent='🔓 Fortsett å holde …';
   holdTimer=setTimeout(()=>{holdTimer=null;adult.classList.remove('holding');adult.textContent='🔒 For voksne';window.LARIA_OPEN_ADULT?window.LARIA_OPEN_ADULT():document.getElementById('adult-entry')?.click()},1500);
  });
  ['pointerup','pointerleave','pointercancel'].forEach(type=>adult.addEventListener(type,reset));
 }

}
function render(){
 window.LARIA_BASECAMP_DIAG.render=true;
 const screen=document.getElementById('home-screen');if(!screen)return;
 let host=screen.querySelector('.bc12');
 if(!host){screen.insertAdjacentHTML('afterbegin',markup());host=screen.querySelector('.bc12');}
 bindCampControls(host);
 // Every grade uses the same physical Basecamp, journey and collection entry points.
 host.hidden=false;
 host.dataset.gradeBand=typeof gradeBand==='function'?gradeBand():(currentGrade()<=2?'young':currentGrade()<=4?'middle':currentGrade()<=7?'older':'teen');
 host.dataset.grade=String(currentGrade());
 host.dataset.mode=mode;
 const profile=(typeof state!=='undefined'&&state?.profile)?state.profile:{};
 const playerName=typeof profile.name==='string'?profile.name.trim():'';
 const playerAvatar=profile.avatar==='girl'?'girl':'boy';
 const fox=host.querySelector('.bc12-fox');if(fox){fox.dataset.avatar=playerAvatar;fox.setAttribute('aria-label',playerAvatar==='girl'?'Din valgte revejente':'Din valgte revegutt');const img=fox.querySelector('img');if(img){img.src=selectedFoxSource(playerAvatar);img.alt='Læria-reven venter på stien'}}
 host.querySelector('h1').textContent=mode==='explore'?'Hva vil du leke med?':(playerName?'Hei, '+playerName+'!':'Hei, eventyrer!');
 host.querySelector('[data-camp-intro]').textContent=mode==='explore'?'Velg et sted. Bli så lenge du vil.':'Hva har du lyst til å gjøre i dag?';
 const questCopy=host.querySelector('.bc12-quest > span:nth-child(2)');
 if(questCopy)questCopy.innerHTML=currentGrade()>=8?
   'Dagens oppdrag<small>Helt frivillig</small>':
   'Et brev fra reven<small>Vil du bli med?</small>';
 const foxCall=host.querySelector('[data-camp-fox-call]');if(foxCall)foxCall.textContent='Min rev · Se reven din ›';
 const trip=next(),journeyButton=host.querySelector('.bc12-journey');
 host.dataset.journeySubject=trip.subject||'norwegian';
 host.dataset.journeyComplete=trip.complete?'true':'false';
 host.style.setProperty('--bc12-progress',String(Math.max(0,Math.min(100,trip.pct||0))));
 host.querySelector('[data-camp-next]').textContent=trip.title;
 const nextType=host.querySelector('[data-camp-next-type]');
 if(nextType)nextType.textContent=trip.active?'Pågående økt':'Neste sted';
 host.querySelector('[data-camp-next-copy]').textContent=(trip.complete?'Reisen er fullført. Du kan besøke stedene igjen.':journeyCopy(trip));
 if(journeyButton)journeyButton.setAttribute('aria-label',(trip.complete?'Besøk reisen igjen. ':'Fortsett reisen. Neste sted: ')+trip.title+'. '+(trip.complete?'Reisen er fullført, og stedene er fortsatt åpne.':journeyCopy(trip)));
 host.querySelectorAll('.bc12-nav button').forEach(b=>{if(b.dataset.camp===mode)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
}
window.LARIA_OPEN_WARDROBE=()=>{dialog('wardrobe')};
window.LARIA_OPEN_COLLECTION=()=>{dialog('collection')};
function init(){
 window.LARIA_BASECAMP_DIAG.init=true;
 if(!document.getElementById('bc12-dialog')){const d=document.createElement('dialog');d.id='bc12-dialog';d.setAttribute('aria-labelledby','bc12-dialog-title');document.body.append(d);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()}});}
 // Capture only returns from activities entered through basecamp. Other routes keep their original behavior.
 // Subject and geography back buttons need a Basecamp-origin capture.
 // The globe and laboratories manage nested return routes themselves.
 ['subject-back','geography-back'].forEach(id=>{
  const back=document.getElementById(id);if(!back||back.dataset.bc12ReturnBound==='true')return;
  back.dataset.bc12ReturnBound='true';
  back.addEventListener('click',e=>{
   if(!fromCamp)return;
   e.preventDefault();e.stopImmediatePropagation();window.LARIA_RETURN_TO_BASECAMP();
  },true);
 });
 const prior=window.renderAll;window.renderAll=function(){const result=prior.apply(this,arguments);render();return result};render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


// Prompt 16: load the isolated safe five-question challenge after Home is interactive.
(function loadSafeChallenge(){
 if(document.querySelector('script[data-laria-safe-challenge]'))return;
 const script=document.createElement('script');
 script.src='./safe-challenge.js?v=20261007-p17rc1';
 script.async=true;
 script.dataset.lariaSafeChallenge='challenge-rc1';
 document.head.appendChild(script);
})();
