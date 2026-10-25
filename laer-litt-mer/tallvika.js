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
    const selected = selection(), troll = trolls[selected], name = (app()?.state()?.profile?.name || '').trim();
    const {p,n,grade} = progress();
    let root = document.getElementById('tallvika-world');
    if (!root) { root = document.createElement('section'); root.id='tallvika-world'; root.setAttribute('aria-label','Tallvika, matematikkverden'); screen.insertBefore(root, screen.firstChild); }
    root.innerHTML = `
      <header class="tv-top"><button type="button" data-tv="back" aria-label="Tilbake til Hjem">‹ <span>Hjem</span></button><span>LÆRIA · MATTE</span><button type="button" data-tv="choose">Velg skogstroll</button></header>
      <div class="tv-scene">
        <div class="tv-scene-copy"><p>${name ? 'Hei, '+esc(name)+'!' : 'Velkommen!'}</p><h1>Tallvika</h1><span>Velg et hus, og lek med tall.</span></div>
        <div class="tv-companion" aria-label="Valgt følgesvenn: ${troll.name}"><img src="${troll.src}" alt="${troll.name}"><button type="button" data-tv="choose">${troll.name} · bytt</button></div>
        <button type="button" class="tv-hotspot tv-hotspot-multiply" data-tv="multiply" aria-label="Åpne Gangemagi"><b>Gangemagi</b><span>×</span></button>
        <button type="button" class="tv-hotspot tv-hotspot-fraction" data-tv="fraction" aria-label="Åpne Brøklab"><b>Brøklab</b><span>¼</span></button>
        <button type="button" class="tv-hotspot tv-hotspot-table" data-tv="table" aria-label="Åpne Gangetabellen"><b>Gangetabellen</b><span>×</span></button>
      </div>
      <div class="tv-mobile-actions" aria-label="Tallvikas aktiviteter">
        <button type="button" data-tv="multiply"><b>Gangemagi</b><span>Plukk og pakk med gange ›</span></button>
        <button type="button" data-tv="fraction"><b>Brøklab</b><span>Del opp og prøv selv ›</span></button>
        <button type="button" data-tv="table"><b>Gangetabellen</b><span>Utforsk mønstre ›</span></button>
      </div>
      <section class="tv-next"><div><small>NESTE EVENTYR · HELT FRIVILLIG</small><b>${p?.complete ? 'Bonusoppdraget venter' : n?.title || 'Et nytt oppdrag venter'}</b><span>Du kan alltid bli værende og spille favorittene dine.</span></div><button type="button" data-tv="next" ${n||p?.complete?'':'disabled'}>Prøv ›</button></section>
      <dialog class="tv-dialog" aria-label="Velg ditt skogstroll"><form method="dialog"><button class="tv-dialog-close" aria-label="Lukk">×</button><p>DIN FØLGESVENN</p><h2>Hvem skal bli med til Tallvika?</h2><span>Du kan bytte når du vil.</span><div class="tv-troll-grid">${Object.entries(trolls).map(([id,item]) => `<button type="button" class="${id===selected?'selected':''}" data-tv-troll="${id}" aria-pressed="${id===selected}"><img src="${item.src}" alt=""><b>${item.name}</b>${id===selected?'<em>Valgt</em>':''}</button>`).join('')}</div></form></dialog>`;
    // Never mutate an observed attribute when its value is already correct.
    // Repeating classList.add() can itself fire another MutationObserver record
    // even if the token was present, starving DOMContentLoaded across Læria.
    if (!screen.classList.contains('tallvika-active')) screen.classList.add('tallvika-active');
    root.querySelector('.tv-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
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
    if (action === 'choose') document.querySelector('#tallvika-world .tv-dialog')?.showModal();
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
  const observer = new MutationObserver(() => {
    const active = screen.classList.contains('active') && screen.dataset.subject === 'math';
    if (active) build();
    else if (screen.classList.contains('tallvika-active')) screen.classList.remove('tallvika-active');
  });
  observer.observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
  if (screen.classList.contains('active') && screen.dataset.subject === 'math') build();
  window.LARIA_TALLVIKA = {build, trolls};
})();
