/* Læria: private chapter selection surface for two Norwegian adventures.
 * Existing Bokskogen keeps its original illustrated map, learning nodes
 * and saved progress. This layer is navigation only.
 */
(function(){
  'use strict';
  const chapters=window.LARIA_NORWEGIAN_CHAPTER_CHOOSER;
  if(!chapters)return;
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const safeAvatar=src=>{
    const s=String(src||'');
    return /^(\.\/|\/|https:\/\/)/.test(s)||/^data:image\/(?:webp|png|jpeg);base64,[a-z0-9+/=]+$/i.test(s)
      ?s:'./lia-fox-explorer-home.webp';
  };
  let view=null;
  function chooserModel(){
    return chapters.model(view.options.state,view.options.firstProgress(),true);
  }
  function chapterCard(chapter){
    const chapterNumber=chapter.number,
      completed=chapter.complete,
      locked=chapter.locked,
      label=chapter.id==='bokskogen-1'?'Gå til Bokskogen':
        locked?'Åpnes etter Bokskogen':chapter.status;
    const displayedProgress=chapter.number===1
      ?(completed?'Første eventyr fullført':chapter.done+' av '+chapter.total+' oppdrag')
      :completed?'Alle fem steder utforsket':chapter.done+' av 5 steder utforsket';
    const stateText=completed?'Fullført · Spill igjen':locked?'Venter på Bokskogen':
      chapter.number===1?'Utforsk i ditt tempo':'Nytt eventyr · Forhåndsvisning';
    return '<article class="fd-chapter-card'+(locked?' is-locked':'')+(completed?' is-complete':'')+
      '" data-fd-chapter-card="'+escapeHtml(chapter.id)+'">'+
      '<div class="fd-chapter-image-wrap">'+
      '<img class="fd-chapter-image" src="'+escapeHtml(chapter.art)+'" loading="lazy" alt="" draggable="false">'+
      '<span class="fd-chapter-index">EVENTYR '+chapterNumber+'</span>'+
      (completed?'<span class="fd-chapter-award" aria-label="Eventyret er fullført">★ Fullført</span>':'')+
      '</div><div class="fd-chapter-card-content">'+
      '<span class="fd-chapter-status">'+escapeHtml(stateText)+'</span>'+
      '<h2>'+escapeHtml(chapter.title)+'</h2>'+
      '<p>'+escapeHtml(chapter.subtitle)+'</p>'+
      '<div class="fd-chapter-progress" aria-label="'+escapeHtml(displayedProgress)+'">'+
      '<span>'+escapeHtml(displayedProgress)+'</span>'+
      '<div class="fd-chapter-progress-track"><i style="width:'+
       (completed?100:(chapter.total?Math.round(chapter.done/chapter.total*100):0))+'%"></i></div></div>'+
      '<button class="fd-chapter-action" data-fd-pick="'+escapeHtml(chapter.id)+
      '" type="button"'+(locked?' disabled aria-disabled="true"':'')+'>'+
      escapeHtml(label)+(locked?'':' →')+'</button></div></article>';
  }
  function render(){
    if(!view)return;
    const data=chooserModel();
    view.root.innerHTML='<div class="fd-chapter-dialog" role="dialog" aria-modal="true" aria-labelledby="fd-chapters-title">'+
      '<header class="fd-chapter-header"><button class="fd-chapter-back" type="button" data-fd-choice-close>← Tilbake</button>'+
      '<span class="fd-chapter-trial">KAPITTELVALG · TESTVERSJON</span></header>'+
      '<div class="fd-chapter-heading"><div class="fd-chapter-heading-text"><div class="fd-chapter-eyebrow">NORSK · DIN EGEN REISE</div>'+
      '<h1 id="fd-chapters-title">Velg ditt eventyr</h1><p>Fortsett reisen, eller bli igjen i historien du liker aller best.</p></div>'+
      '<div class="fd-chapter-fox"><img alt="Reven din følger deg" src="'+escapeHtml(view.options.foxSrc)+'"></div></div>'+
      '<section class="fd-chapter-choices" aria-label="Eventyrene i Norsk">'+
       data.chapters.map(chapterCard).join('')+'</section>'+
      '<p class="fd-chapter-footnote">Du kan besøke et fullført eventyr så mange ganger du vil. Eventyr 2 er foreløpig bare tilgjengelig i testversjonen.</p></div>';
  }
  function onClick(event){
    if(!view)return;
    const hit=event.target.closest('button');
    if(hit){
      if(hit.hasAttribute('data-fd-choice-close')){close();return}
      const selected=hit.dataset.fdPick;
      if(selected){
        const actual=chooserModel().chapters.find(chapter=>chapter.id===selected);
        if(!actual||!actual.available)return;
        if(selected==='bokskogen-1'){
          const onBokskogen=view.options.onBokskogen;
          close();
          onBokskogen?.();
          return;
        }
        if(selected==='fortellingsdalen-2'){
          view.options.onFortellingsdalen?.();
          return;
        }
      }
      return;
    }
    if(event.target===view.root)close();
  }
  function onKey(event){
    if(!view)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return}
    if(event.key!=='Tab')return;
    const focusables=[...view.root.querySelectorAll('button:not([disabled])')].filter(x=>x.getClientRects().length);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables.at(-1),active=document.activeElement;
    if(event.shiftKey&&(active===first||!view.root.contains(active))){event.preventDefault();last.focus()}
    if(!event.shiftKey&&(active===last||!view.root.contains(active))){event.preventDefault();first.focus()}
  }
  function close(){
    const prior=view;
    if(!prior)return;
    view=null;
    document.removeEventListener('keydown',onKey);
    prior.root.remove();
    if(prior.focus?.isConnected)prior.focus.focus({preventScroll:true});
  }
  function refresh(){
    if(!view)return;
    render();
    // Returning from chapter 2 should keep the child in the chapter picker.
    const second=view.root.querySelector('[data-fd-pick="fortellingsdalen-2"]');
    second?.focus({preventScroll:true});
  }
  function open(options){
    if(!options||!options.state||typeof options.firstProgress!=='function')
      throw new TypeError('Chapter selection requires current progress');
    if(!window.LARIA_CHAPTER_EXPANSION?.previewEnabled(location.search))return false;
    if(view){view.options=options;render();return true}
    const root=document.createElement('div');
    root.className='fd-chapter-portal';root.id='laria-norwegian-chapter-picker';
    const prepared={...options,foxSrc:safeAvatar(options.foxSrc)};
    view={root,options:prepared,focus:document.activeElement};
    root.addEventListener('click',onClick);
    document.body.appendChild(root);
    document.addEventListener('keydown',onKey);
    render();
    root.querySelector('.fd-chapter-back')?.focus({preventScroll:true});
    return true;
  }
  window.LARIA_NORWEGIAN_CHAPTER_PICKER=Object.freeze({open,close,refresh});
})();
