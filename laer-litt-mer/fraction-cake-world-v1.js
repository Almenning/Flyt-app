/* Læria Brøklab: illustrated, playable Fjordbakeriet.
 * This is presentation only; the fraction engine, persistence, drag handling,
 * fraction arithmetic and navigation are owned by fraction-premium-v2.js.
 * Its scenery is made of separate illustration layers, never one full-screen
 * image with invisible interaction rectangles pasted on top of it.
 */
(() => {
  'use strict';
  const art = './assets/fraction-scene/';
  const safe = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = n => new Intl.NumberFormat('nb-NO',{maximumFractionDigits:1}).format(n);

  // Each wedge owns a distinct tap and keyboard action. Berry and icing paths
  // have pointer-events:none so decoration can never steal a slice tap.
  function cakeSvg({n,d,filled,lastChanged}) {
    const angle = i => -Math.PI/2 + 2*Math.PI*i/d;
    const path = (index, radius=109,cy=132) => {
      const a=angle(index), b=angle(index+1);
      const p=v=>[145+radius*Math.cos(v),cy+radius*Math.sin(v)].map(x=>x.toFixed(2));
      const start=p(a),end=p(b);
      return `M145 ${cy} L${start[0]} ${start[1]} A${radius} ${radius} 0 ${d===2?0:(2*Math.PI/d>Math.PI?1:0)} 1 ${end[0]} ${end[1]} Z`;
    };
    const pieces=Array.from({length:d},(_,i)=>{
      const on=filled.includes(i), a=(angle(i)+angle(i+1))/2;
      const ux=(145+62*Math.cos(a)).toFixed(1),uy=(132+62*Math.sin(a)).toFixed(1);
      const berries=on&&d<=8?`<g pointer-events="none" transform="translate(${ux} ${uy})">
        <ellipse rx="23" ry="16" cy="4" fill="#791c35" opacity=".24"/>
        <circle cx="-12" cy="-3" r="10" fill="url(#fc-berry)"/><circle cx="8" cy="5" r="11" fill="url(#fc-berry)"/>
        <circle cx="2" cy="-12" r="8" fill="url(#fc-berry)"/>
        <circle cx="-16" cy="-7" r="2.4" fill="#fcb6ab" opacity=".75"/>
        <circle cx="5" cy="-15" r="2.2" fill="#fcb6ab" opacity=".7"/>
        <path d="M-1 -18 Q4 -30 11 -23" fill="none" stroke="#578b49" stroke-width="4"/>
        </g>`:on?`<circle pointer-events="none" cx="${ux}" cy="${uy}" r="${Math.max(3,11-d/2)}" fill="#7d273e" stroke="#e69a8d" stroke-width="1.5"/>`:
        `<g pointer-events="none" transform="translate(${ux} ${uy})"><path d="M-11 7 Q-8 -12 1 0 Q9 -13 12 7 Q2 13 -11 7" fill="#a2b87a" stroke="#789b55" stroke-width="1.5"/></g>`;
      return `<g class="fc-wedge ${on?'is-filled':'is-empty'} ${i===lastChanged?'fc-just-placed':''}" role="button" tabindex="0" data-fr-action="piece" data-piece="${i}" aria-label="${on?'Ta ut':'Legg inn'} kakestykke ${i+1} av ${d}" aria-pressed="${on}">
        <path class="fc-wedge-side" d="${path(i,109,142)}" fill="${on?'#983b32':'#cf9e66'}" stroke="#7f492e" stroke-width="2"/>
        <path d="${path(i)}" fill="${on?'url(#fc-jam-art)':'url(#fc-vanilla-art)'}" stroke="#a96d46" stroke-width="2.8"/>
        <path d="${path(i,102)}" fill="none" stroke="${on?'#ff8d85':'#fff9e9'}" stroke-width="4" opacity=".6"/>
        ${berries}
      </g>`;
    }).join('');
    const border=Array.from({length:36},(_,i)=>{
      const a=i*Math.PI*2/36;
      return `<ellipse pointer-events="none" cx="${(145+113*Math.cos(a)).toFixed(1)}" cy="${(132+113*Math.sin(a)).toFixed(1)}" rx="6.8" ry="5" transform="rotate(${(a*180/Math.PI+90).toFixed(1)} ${(145+113*Math.cos(a)).toFixed(1)} ${(132+113*Math.sin(a)).toFixed(1)})" fill="url(#fc-piping)" stroke="#e1b787" stroke-width=".8"/>`;
    }).join('');
    return `<svg class="fr2-pie fr2-pie-builder fr2-pie-interactive fc-cake-svg" viewBox="0 0 290 288" role="group" aria-label="Kaken er delt i ${d} like store kakestykker, ${n} er fylt" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="fc-jam-art" patternUnits="userSpaceOnUse" width="180" height="150"><image href="${art}berry-texture.webp" x="0" y="0" width="180" height="150" preserveAspectRatio="xMidYMid slice"/></pattern>
        <pattern id="fc-vanilla-art" patternUnits="userSpaceOnUse" width="188" height="126"><image href="${art}vanilla-texture.webp" x="0" y="0" width="188" height="126" preserveAspectRatio="xMidYMid slice"/></pattern>
        <radialGradient id="fc-jam" cx="30%" cy="18%"><stop stop-color="#ffaaa0"/><stop offset=".4" stop-color="#e34c58"/><stop offset="1" stop-color="#9e2943"/></radialGradient>
        <radialGradient id="fc-cream" cx="25%" cy="20%"><stop stop-color="#fffdf2"/><stop offset=".7" stop-color="#fff0d4"/><stop offset="1" stop-color="#f0c58f"/></radialGradient>
        <radialGradient id="fc-berry"><stop stop-color="#c75982"/><stop offset=".45" stop-color="#722b68"/><stop offset="1" stop-color="#321c4d"/></radialGradient>
        <radialGradient id="fc-piping" cx="25%" cy="22%"><stop stop-color="#fffefa"/><stop offset=".63" stop-color="#ffedd7"/><stop offset="1" stop-color="#d4ab77"/></radialGradient>
        <linearGradient id="fc-plate" x1="0" x2=".2" y1="0" y2="1"><stop stop-color="#fbe3ab"/><stop offset=".48" stop-color="#b77b48"/><stop offset="1" stop-color="#774a2d"/></linearGradient>
      </defs>
      <ellipse cx="148" cy="262" rx="126" ry="21" fill="#44210f" opacity=".35"/>
      <ellipse cx="145" cy="153" rx="140" ry="121" fill="url(#fc-plate)" stroke="#7d4f29" stroke-width="6"/>
      <ellipse cx="145" cy="142" rx="126" ry="121" fill="#a66e43" opacity=".75"/>
      <circle cx="145" cy="141" r="117" fill="#f9d7a1" stroke="#9c633e" stroke-width="8"/>
      ${pieces}${border}
    </svg>`;
  }
  function oneFraction(n,d,cls='') {
    return `<span class="fr2-fraction fc-number ${cls}" role="img" aria-label="${n} av ${d}"><b>${n}</b><i aria-hidden="true"></i><b>${d}</b></span>`;
  }
  function landscape() {
    return `<div class="fr8-landscape fc-landscape" aria-hidden="true">
      <div class="fc-interior-light"></div><img class="fc-scenery fc-middle-shelf" src="${art}shelf-detail.webp" alt="" draggable="false" />
      <img class="fc-scenery fc-warm-oven" src="${art}warm-oven.webp" alt="" draggable="false"/>
      <div class="fc-mountain-window"><img class="fr8-skala" src="${art}skala-window.webp" alt="" draggable="false"/><div class="fr8-cloud fc-cloud-one"></div><div class="fr8-cloud fc-cloud-two"></div></div>
      <img class="fc-ivy-art" src="${art}hanging-vines.webp" alt="" draggable="false"/>
      <div class="fc-window-glow"></div>
      <div class="fc-lantern fc-lantern-left"></div>
      <div class="fc-wood-counter"></div><img class="fc-berries-bowl" src="${art}berries-bowl.webp" alt="" draggable="false"/>
      <img class="fc-flower-jar" src="${art}wood-flowers.webp" alt="" draggable="false"/>
    </div>`;
  }
  function render(c) {
    const x=c.cake, n=x.n,d=x.d, percent=c.percent, character=safe(c.character||'storesoster');
    const remaining=Array.from({length:d},(_,i)=>i).filter(i=>!x.filled.includes(i));
    const hasAddition=n>=2;
    const nPrev=n-1;
    const half=d%2===0&&n*2===d;
    const questText=c.halfQuest
      ?(half?'Du fant en halv! '+n+'/'+d+' = 1/2.':d%2?'Med '+d+' like biter kan du ikke lage en halv med hele kakestykker.':'Kan du lage en halv kake?')
      :'Du bestemmer. Her kan du leke fritt.';
    const hint=n===0?'Prøv den første biten!':n===d?'Se! Nå har du en hel kake!':hasAddition?'Du har '+n+' av '+d+' deler!':'Vil du legge til en bit?';
    const math=hasAddition ? `<div class="fc-discovery" id="fc-math-discovery" ${c.showMath?'':'hidden'} role="region" aria-label="Oppdag addisjon og gange">
      <div class="fc-discovery-card"><span class="fc-discovery-title">Legg sammen</span><strong>${nPrev}/${d} + 1/${d} = ${n}/${d}</strong></div>
      <div class="fc-discovery-card"><span class="fc-discovery-title">Like biter, mange ganger</span><strong>${n} × 1/${d} = ${n}/${d}</strong></div>
      <div class="fc-discovery-caption">Se på de ${n} røde kakestykkene. Det er like mye i begge regnestykkene.</div>
    </div>` : '';
    return `<section class="fr2-build fr4-build fr5-build fr6-workshop fr8-scene fc-world" data-fr8-quest="${c.halfQuest?'active':'free'}" data-fr8-found="${c.halfQuest&&half?'true':'false'}" data-fc-world="1">
      <div class="fc-story-title"><h1>Brøklaben</h1><p>Trykk på kaken og se hva som skjer!</p></div>
      <div class="fr6-stage fc-stage">
        ${landscape()}
        <div class="fr2-guide fr5-fox-mentor fr8-companion fc-troll">
          <button type="button" class="fr8-speak fc-troll-help" data-fr-action="fox-help" aria-label="Trykk på trollet for å høre forklaring">
            <img class="fr2-fox fr8-troll" src="./assets/fraction-trolls/${character}.webp" width="175" height="220" alt="" draggable="false" decoding="async" aria-hidden="true"/>
            <span class="fr5-fox-bubble fc-troll-speech" role="status">${hint}</span>
          </button>
          <button type="button" class="fr8-cycle-troll fc-troll-cycle" data-fr-action="cycle-troll" aria-label="Bytt mellom de tre skogstrollene">Bytt troll ↻</button>
        </div>
        <div class="fr2-build-target fr5-build-target fc-cake-stand" data-fr-drop="1">
          <span class="fc-cake-label">Din magiske kake</span>
          <div class="fr2-fabric fc-cake-surface">${cakeSvg({n,d,filled:x.filled,lastChanged:c.lastChanged})}</div>
          <p class="fc-cake-hint">Trykk på et kakestykke</p>
        </div>
        <div class="fr5-live-result fr6-result fc-story-sign" role="status" aria-live="polite" aria-atomic="true">
          <span class="fc-result-label">Du har</span>
          ${oneFraction(n,d)}
          <span class="fc-percent-equality" aria-label="Det er ${percent} av hele kaken">= <b>${percent}</b></span>
          <span class="fc-result-caption">av hele kaken</span>
        </div>
        <div class="fr2-wood-tray fr5-piece-tray fr6-piece-tray fc-piece-tray">
          <span class="fr2-tray-title fc-tray-title">Kakestykker</span>
          <div class="fr2-spare-pieces fc-pieces">${remaining.length?remaining.map(i=>c.pieceMarkup(i)).join(''):'<span class="fr6-empty-tray">Alle bitene er i kaken!</span>'}</div>
        </div>
        <div class="fr2-controls fr4-controls fr5-controls fr6-controls fc-controls">${c.adjust('n')}${c.adjust('d')}</div>
        <div class="fc-primary-actions">
          <button type="button" class="fc-add-one" data-fr-action="fc-add-one" ${n===d?'disabled':''} aria-label="Legg til ett kakestykke">${n===d?'Hele kaken er fylt!':'＋ Legg til én bit'}</button>
          <div class="fc-action-tools">
            <button type="button" class="fc-action-minor" data-fr-action="reset">Tøm kaken</button>
            <button type="button" class="fc-action-minor" data-fr-action="next-build">Del på nytt ↻</button>
          </div>
        </div>
      </div>
      <div class="fc-optional-row">
        <div class="fc-note" role="status" aria-live="polite">${safe(c.notice||questText)}</div>
        ${hasAddition?`<button type="button" class="fc-reveal-math" data-fr-action="fc-reveal-math" aria-expanded="${c.showMath}" aria-controls="fc-math-discovery">${c.showMath?'Skjul regnestykkene':'✦ Se hvorfor dette stemmer'}</button>`:''}
        <button type="button" class="fc-try-half" data-fr-action="half-quest" aria-pressed="${c.halfQuest}">${c.halfQuest?'Lek fritt':'Prøv en halv'}</button>
      </div>
      ${math}
      <div class="fc-extra-explore"><button type="button" class="fc-see-decimals" data-fr-action="toggle-equivalents" aria-expanded="${c.showEquivalents}" aria-controls="fc-decimals">${c.showEquivalents?'Skjul desimaltall':'Se også som desimaltall'}</button>
        <div class="fc-decimals" id="fc-decimals" ${c.showEquivalents?'':'hidden'}><span>Desimal: <b>${safe(c.decimal)}</b></span></div>
      </div>
    </section>`;
  }
  window.LARIA_CAKE_WORLD=Object.freeze({version:'fjordbakeri-1',render,cakeSvg});
})();