/* Tallvika is deliberately a small presentation layer: navigation and learning
   state remain owned by the existing Læria runtimes. */
(() => {
  'use strict';
  const trolls = {
    storesoster:{name:'Storesøster',src:'./assets/gangemagi-troll/storesoster.webp'},
    lillesoster:{name:'Lillesøster',src:'./assets/gangemagi-troll/lillesoster.webp'},
    lillebror:{name:'Lillebror',src:'./assets/gangemagi-troll/lillebror.webp'}
  };
  const screen = document.getElementById('subject-screen');
  if (!screen) return;
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const app = () => window.LARIA_TALLVIKA_BRIDGE;
  const selection = () => trolls[app()?.state()?.profile?.tallvikaTroll] ? app().state().profile.tallvikaTroll : 'storesoster';
  const saveTroll = id => {
    const state = app()?.state();
    if (!trolls[id] || !state) return;
    state.profile = {...state.profile, tallvikaTroll:id};
    app()?.save();
  };
  const progress = () => {
    try { const grade = app()?.journeyViewGrade?.('math') || app()?.currentGrade?.() || 2; return {grade, p:app()?.journeyProgress?.('math', grade), n:app()?.journeyRecommendedNode?.('math', grade)}; }
    catch (_) { return {grade:2,p:null,n:null}; }
  };
  function build() {
    if (screen.dataset.subject !== 'math' || !screen.classList.contains('active')) return;
    // The existing journey renderer marks Math's old journey as active before
    // Tallvika takes over the subject screen. Its responsive CSS deliberately
    // hides every direct child except the old journey map. Clear that stale
    // view state rather than adding specificity wars or touching journey data.
    if (screen.classList.contains('locked-journey-active') ||
        screen.classList.contains('premium-journey-active')) {
      screen.classList.remove('locked-journey-active', 'locked-journey-subject-math',
        'premium-journey-active');
    }
    const selected = selection(), troll = trolls[selected], name = (app()?.state()?.profile?.name || '').trim();
    const {p,n,grade} = progress(), ownGrade = Number(app()?.currentGrade?.() || grade);
    let root = document.getElementById('tallvika-world');
    if (!root) { root = document.createElement('section'); root.id='tallvika-world'; root.setAttribute('aria-label','Tallvika, matematikkverden'); screen.insertBefore(root, screen.firstChild); }
    // The legacy journey system may re-set screen classes while opening Maths.
    // Replacing identical innerHTML on each observer callback would detach
    // buttons under the pointer, especially on iPhone landscape WebKit.
    // Only re-render when the visible, persisted world state really changed.
    const renderKey = JSON.stringify({
      selected,grade,ownGrade,name,next:n?.id||null,nextTitle:n?.title||null,
      done:p?.done||0,total:p?.total||0,complete:!!p?.complete
    });
    if (root.dataset.tvRenderKey === renderKey && screen.classList.contains('tallvika-active')) return;
    root.dataset.tvRenderKey = renderKey;
    root.innerHTML = `

      <header class="tv-top">
        <button type="button" data-tv="back" aria-label="Tilbake til Reisen eller Hjem">‹ <span>Tilbake</span></button>
        <div class="tv-top-brand" aria-hidden="true"><span class="tv-top-eyebrow">LÆRIA</span><b>Tallvika</b></div>
        <div class="tv-top-actions">
          <button type="button" data-tv="grade" aria-label="Velg klassetrinn">${grade}. klasse</button>
          <button type="button" data-tv="choose">Velg skogstroll</button>
        </div>
      </header>
      <main class="tv-main">
        <div class="tv-stage">
          <div class="tv-scene">
            <div class="tv-scene-copy"><p>${name ? 'Hei, '+esc(name)+'!' : 'Velkommen!'}</p><h1>Tallvika</h1><span>Velg et hus og lek med tall.</span></div>
            <div class="tv-companion" aria-label="Valgt følgesvenn: ${troll.name}"><img src="${troll.src}" alt="${troll.name}"></div>
            <button type="button" class="tv-hotspot tv-hotspot-multiply" data-tv="multiply" aria-label="Åpne Gangemagi"><span class="tv-hotspot-cue" aria-hidden="true">↗</span><b>Gangemagi</b></button>
            <button type="button" class="tv-hotspot tv-hotspot-fraction" data-tv="fraction" aria-label="Åpne Brøklab"><span class="tv-hotspot-cue" aria-hidden="true">↗</span><b>Brøklab</b></button>
            <button type="button" class="tv-hotspot tv-hotspot-table" data-tv="table" aria-label="Åpne Gangetabellen"><span class="tv-hotspot-cue" aria-hidden="true">↗</span><b>Gangetabellen</b></button>
          </div>
          <div class="tv-scene-footer" aria-hidden="true"><span class="tv-scene-dot"></span>Et lite eventyrland for store oppdagelser<span class="tv-scene-line"></span><span class="tv-scene-mark">✦</span></div>
        </div>
        <div class="tv-dock">
          <div class="tv-dock-intro"><span class="tv-kicker">VELG ET STED</span><h1>Hvor vil du leke?</h1><p>Tre hytter fulle av tallmagi. Du bestemmer!</p></div>
          <div class="tv-mobile-actions" aria-label="Tallvikas aktiviteter">
            <button type="button" class="tv-portal-card" data-tv="multiply" aria-label="Åpne Gangemagi, plukk og pakk med gange">
              <span class="tv-portal-art tv-portal-art-multiply" aria-hidden="true"><span class="tv-portal-badge">×</span></span>
              <span class="tv-portal-copy"><span class="tv-portal-kicker">MAGISK MATTE</span><b>Gangemagi</b><small>Plukk og pakk med gange</small></span>
              <span class="tv-portal-arrow" aria-hidden="true">↗</span>
            </button>
            <button type="button" class="tv-portal-card" data-tv="fraction" aria-label="Åpne Brøklab, del opp og prøv selv">
              <span class="tv-portal-art tv-portal-art-fraction" aria-hidden="true"><span class="tv-portal-badge">¼</span></span>
              <span class="tv-portal-copy"><span class="tv-portal-kicker">LEK OG OPPDAG</span><b>Brøklab</b><small>Del opp, bygg og prøv selv</small></span>
              <span class="tv-portal-arrow" aria-hidden="true">↗</span>
            </button>
            <button type="button" class="tv-portal-card" data-tv="table" aria-label="Åpne Gangetabellen, utforsk mønstre">
              <span class="tv-portal-art tv-portal-art-table" aria-hidden="true"><span class="tv-portal-badge">10×</span></span>
              <span class="tv-portal-copy"><span class="tv-portal-kicker">FINN MØNSTRE</span><b>Gangetabellen</b><small>Utforsk tallene på din måte</small></span>
              <span class="tv-portal-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
          <section class="tv-next">
            <span class="tv-next-crest" aria-hidden="true">✦</span>
            <div class="tv-next-content"><small>NESTE EVENTYR · HELT FRIVILLIG</small><b>${p?.complete ? 'Bonusoppdraget venter' : n?.title || 'Et nytt oppdrag venter'}</b><span>Fortsett når du har lyst.</span></div>
            <button type="button" data-tv="next" ${n||p?.complete?'':'disabled'}>Utforsk ↗</button>
          </section>
        </div>
      </main>
      <dialog class="tv-dialog" aria-label="Velg ditt skogstroll"><form method="dialog"><button class="tv-dialog-close" aria-label="Lukk">×</button><p>DIN FØLGESVENN</p><h2>Hvem skal bli med til Tallvika?</h2><span>Du kan bytte når du vil.</span><div class="tv-troll-grid">${Object.entries(trolls).map(([id,item]) => `<button type="button" class="${id===selected?'selected':''}" data-tv-troll="${id}" aria-pressed="${id===selected}"><img src="${item.src}" alt=""><b>${item.name}</b>${id===selected?'<em>Valgt</em>':''}</button>`).join('')}</div></form></dialog>
      <dialog class="tv-dialog tv-grade-dialog" aria-label="Velg klassetrinn"><form method="dialog"><button class="tv-dialog-close" aria-label="Lukk">×</button><p>UTFORSK I DITT TEMPO</p><h2>Velg klassetrinn</h2><span class="tv-grade-note">${grade===ownGrade?'Dette er ditt klassetrinn. Du kan også utforske andre trinn.':'Du utforsker '+grade+'. klasse. Ditt klassetrinn er fortsatt '+ownGrade+'. klasse.'}</span><div class="tv-grade-grid">${Array.from({length:10},(_,i)=>{const g=i+1;return '<button type="button" class="tv-grade-option'+(g===grade?' selected':'')+'" data-tv-grade="'+g+'" aria-pressed="'+(g===grade)+'" aria-label="'+g+'. klasse"><b>'+g+'.</b><small>'+(g===ownGrade?'Mitt trinn':g===grade?'Valgt':'Utforsk')+'</small></button>';}).join('')}</div></form></dialog>`;
    // Never mutate an observed attribute when its value is already correct.
    // Repeating classList.add() can itself fire another MutationObserver record
    // even if the token was present, starving DOMContentLoaded across Læria.
    if (!screen.classList.contains('tallvika-active')) screen.classList.add('tallvika-active');
    root.querySelectorAll('.tv-dialog').forEach(dialog=>dialog.addEventListener('click',
      event => { if (event.target === event.currentTarget) event.currentTarget.close(); }));
  }
  function openTable(){
    window.openMultiplicationLab?.();
    setTimeout(() => { document.querySelector('#multiplication-lab-root .mp-menu-explore')?.click(); document.querySelector('#multiplication-lab-root .mp-explore-tab[data-mode="table"]')?.click(); }, 0);
  }
  screen.addEventListener('click', event => {
    const button = event.target.closest('[data-tv]');
    if (!button || !screen.contains(button)) return;
    const action = button.dataset.tv;
    if (action === 'back') { if (!window.LARIA_RETURN_TO_BASECAMP?.()) app()?.setTab?.('home'); }
    if (action === 'choose') document.querySelector('#tallvika-world .tv-dialog:not(.tv-grade-dialog)')?.showModal();
    if (action === 'grade') document.querySelector('#tallvika-world .tv-grade-dialog')?.showModal();
    if (action === 'multiply') window.openMultiplicationLab?.();
    if (action === 'fraction') window.openFractionLab?.();
    if (action === 'table') openTable();
    if (action === 'next') { const {p,n,grade}=progress(); if (p?.complete) app()?.startJourneyChallenge?.('math'); else if(n) app()?.startJourneyNode?.('math',n.id,grade); }
  });
  screen.addEventListener('click', event => {
    const button = event.target.closest('[data-tv-troll]');
    if (!button) return;
    saveTroll(button.dataset.tvTroll); document.querySelector('#tallvika-world .tv-dialog')?.close(); build();
  });
  screen.addEventListener('click', event => {
    const button = event.target.closest('[data-tv-grade]');
    if (!button) return;
    const grade = Number(button.dataset.tvGrade);
    if (!Number.isInteger(grade) || grade<1 || grade>10) return;
    app()?.setJourneyViewGrade?.('math',grade,false);
    document.querySelector('#tallvika-world .tv-grade-dialog')?.close();
    build();
  });
  const observer = new MutationObserver(() => {
    const active = screen.classList.contains('active') && screen.dataset.subject === 'math';
    if (active) build();
    else {
      if (screen.classList.contains('tallvika-active')) screen.classList.remove('tallvika-active');
      // The same DOM screen hosts the other three subjects. Leaving Math must
      // remove our world, otherwise it reappears in other journeys as residue.
      document.getElementById('tallvika-world')?.remove();
    }
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
  if (screen.classList.contains('active') && screen.dataset.subject === 'math') build();
  window.LARIA_TALLVIKA = {build, trolls};
})();
