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
  // An illustrated physical cake, not a decorative fraction chart. Each sector
  // is still the original, independently accessible mathematical action.
  function cakeSvg({n,d,filled,lastChanged}) {
    const cx=145,cy=130,r=108,depth=17;
    const angle=i=>-Math.PI/2+i*Math.PI*2/d;
    const point=(a,rad=r,shift=0)=>[(cx+rad*Math.cos(a)).toFixed(2),(cy+rad*Math.sin(a)+shift).toFixed(2)];
    const wedgePath=i=>{
      const a=angle(i),b=angle(i+1),start=point(a),end=point(b);
      return `M${cx} ${cy} L${start.join(' ')} A${r} ${r} 0 ${d===1?1:0} 1 ${end.join(' ')} Z`;
    };
    const sidePath=i=>{
      const a=angle(i),b=angle(i+1),start=point(a),end=point(b),shiftedEnd=point(b,r,depth),shiftedStart=point(a,r,depth);
      return `M${start.join(' ')} A${r} ${r} 0 0 1 ${end.join(' ')} L${shiftedEnd.join(' ')} A${r} ${r} 0 0 0 ${shiftedStart.join(' ')} Z`;
    };
    const sides=Array.from({length:d},(_,i)=>{
      const a=(angle(i)+angle(i+1))/2;
      if(Math.sin(a)<-.03)return '';
      const on=filled.includes(i);
      return `<path class="fc-slice-crust" pointer-events="none" d="${sidePath(i)}" fill="url(#${on?'fc-jam-side':'fc-biscuit-side'})" stroke="#7b4529" stroke-width="2"/>`;
    }).join('');
    const pieces=Array.from({length:d},(_,i)=>{
      const on=filled.includes(i),a=(angle(i)+angle(i+1))/2;
      const ux=(cx+62*Math.cos(a)).toFixed(2),uy=(cy+62*Math.sin(a)).toFixed(2);
      const ornament=on&&d<=8?`<g pointer-events="none" transform="translate(${ux} ${uy})">
         <ellipse cy="8" rx="23" ry="15" fill="#5e1d30" opacity=".24"/>
         <circle cx="-12" cy="-4" r="11" fill="url(#fc-berry)"/>
         <circle cx="9" cy="3" r="12" fill="url(#fc-berry)"/>
         <circle cx="1" cy="-12" r="9" fill="url(#fc-berry)"/>
         <circle cx="-16" cy="-8" r="2.4" fill="#ffc8ca" opacity=".84"/>
         <circle cx="5" cy="-15" r="2.3" fill="#ffc8ca" opacity=".8"/>
         <path d="M-2 -22 Q4 -32 12 -24" fill="none" stroke="#6a9452" stroke-width="4"/>
         <path d="M-2 -22 Q-14 -29 -17 -21 Q-10 -18 -2 -22" fill="#708e42"/>
         <circle cx="18" cy="-15" r="4.2" fill="#fff3d5"/>
         <circle cx="17" cy="-19" r="4.2" fill="#fff3d5"/>
         <circle cx="13" cy="-17" r="4.2" fill="#fff3d5"/>
         <circle cx="17" cy="-17" r="2" fill="#dfab39"/>
       </g>`:on?`<g pointer-events="none"><circle cx="${ux}" cy="${uy}" r="${Math.max(3,11-d/2)}" fill="#943449" stroke="#eaa29a" stroke-width="1.5"/></g>`:
       `<g pointer-events="none" transform="translate(${ux} ${uy})">
          <path d="M0 3 Q-14 -8 -15 3 Q-8 12 0 3 M0 3 Q14 -8 15 3 Q8 12 0 3" fill="#8fae63" stroke="#57793e" stroke-width="1.25"/>
          <path d="M0 4 Q1 -10 3 -15" fill="none" stroke="#68824c" stroke-width="2"/>
        </g>`;
      return `<g class="fc-wedge ${on?'is-filled':'is-empty'} ${i===lastChanged?'fc-just-placed':''}" role="button" tabindex="0" data-fr-action="piece" data-piece="${i}" aria-label="${on?'Ta ut':'Legg inn'} kakestykke ${i+1} av ${d}" aria-pressed="${on}">
        <path d="${wedgePath(i)}" fill="${on?'url(#fc-jam-art)':'url(#fc-vanilla-art)'}" stroke="#a26745" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="${wedgePath(i)}" fill="none" stroke="${on?'#f7a0a0':'#fff7dd'}" stroke-width="3.2" opacity=".55"/>
        ${ornament}
      </g>`;
    }).join('');
    const creamBorder=Array.from({length:38},(_,i)=>{
      const a=i*2*Math.PI/38,edge=point(a,111),x=+edge[0],y=+edge[1];
      const rx=i%4===0?7.2:6.6,ry=i%3===0?6:5.3;
      return `<g pointer-events="none" transform="translate(${x} ${y}) rotate(${(a*180/Math.PI+90).toFixed(1)})">
       <ellipse rx="${rx}" ry="${ry}" fill="url(#fc-piping)" stroke="#d7aa75" stroke-width=".65"/>
       <path d="M-4 -1 Q0 -5 4 -1" fill="none" stroke="#fffdf2" stroke-width="1.7" opacity=".8"/>
       </g>`;
    }).join('');
    const flower=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})" pointer-events="none">
      ${Array.from({length:6},(_,i)=>`<ellipse cx="0" cy="-6" rx="3.5" ry="6.5" transform="rotate(${i*60})" fill="${i%2?'#f9d7ec':'#e7a7cb'}" stroke="#a47484" stroke-width=".4"/>`).join('')}
      <circle r="3.2" fill="#e9be58" stroke="#9b7130" stroke-width="1"/>
     </g>`;
    return `<svg class="fr2-pie fr2-pie-builder fr2-pie-interactive fc-cake-svg" viewBox="0 0 290 300" role="group" aria-label="Kaken er delt i ${d} like store kakestykker, ${n} er fylt" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="fc-jam-art" patternUnits="userSpaceOnUse" width="170" height="150"><image href="${art}berry-texture.webp" x="0" y="0" width="170" height="150" preserveAspectRatio="xMidYMid slice"/></pattern>
        <pattern id="fc-vanilla-art" patternUnits="userSpaceOnUse" width="188" height="126"><image href="${art}vanilla-texture.webp" x="0" y="0" width="188" height="126" preserveAspectRatio="xMidYMid slice"/></pattern>
        <linearGradient id="fc-jam-side" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#d16d62"/><stop offset=".52" stop-color="#b75c40"/><stop offset="1" stop-color="#702b2d"/></linearGradient>
        <linearGradient id="fc-biscuit-side" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#fceac6"/><stop offset=".42" stop-color="#edcf94"/><stop offset="1" stop-color="#b57742"/></linearGradient>
        <radialGradient id="fc-berry"><stop stop-color="#c85f86"/><stop offset=".5" stop-color="#812d69"/><stop offset="1" stop-color="#341a46"/></radialGradient>
        <radialGradient id="fc-piping" cx="25%" cy="20%"><stop stop-color="#fffefa"/><stop offset=".7" stop-color="#fff0d8"/><stop offset="1" stop-color="#d9a978"/></radialGradient>
        <radialGradient id="fc-plate" cx="25%" cy="20%"><stop stop-color="#e3b57e"/><stop offset=".54" stop-color="#a16c40"/><stop offset="1" stop-color="#673a22"/></radialGradient>
      </defs>
      <ellipse cx="147" cy="265" rx="127" ry="22" fill="#321d13" opacity=".25"/>
      <ellipse cx="145" cy="158" rx="136" ry="124" fill="#53311f" opacity=".44"/>
      <ellipse cx="145" cy="156" rx="131" ry="121" fill="url(#fc-plate)" stroke="#704329" stroke-width="5"/>
      <ellipse cx="145" cy="152" rx="123" ry="116" fill="none" stroke="#e6b778" stroke-width="3" stroke-dasharray="14 4 5 5" opacity=".75"/>
      ${flower(30,198,.78)}${flower(254,208,.8)}${flower(156,261,.55)}
      <g class="fc-cake-volume">${sides}</g>
      <g class="fc-cake-top">${pieces}</g>
      <g class="fc-cake-buttercream">${creamBorder}</g>
      <!-- Original-illustration buttercream and biscuit front, independent of the mathematical wedges. -->
      <image class="fc-cake-front" href="${art}cake-front.webp" x="-8" y="39" width="305" height="252" pointer-events="none" preserveAspectRatio="none"/>
      <ellipse cx="145" cy="155" rx="119" ry="117" fill="none" stroke="#fff3df" stroke-width="2" opacity=".6" pointer-events="none"/>
    </svg>`;
  }
  function oneFraction(n,d,cls='') {
    return `<span class="fr2-fraction fc-number ${cls}" role="img" aria-label="${n} av ${d}"><b>${n}</b><i aria-hidden="true"></i><b>${d}</b></span>`;
  }
  function landscape() {
    return `<div class="fr8-landscape fc-landscape" aria-hidden="true">
      <div class="fc-interior-light"></div><img class="fc-scenery fc-middle-shelf" src="${art}bakery-shelf-premium.webp" alt="" draggable="false" />
      <img class="fc-scenery fc-warm-oven" src="${art}warm-oven.webp" alt="" draggable="false"/>
      <div class="fc-mountain-window"><img class="fr8-skala" src="${art}skala-window.webp" alt="" draggable="false"/><div class="fr8-cloud fc-cloud-one"></div><div class="fr8-cloud fc-cloud-two"></div></div>
      <img class="fc-ivy-art" src="${art}hanging-vines.webp" alt="" draggable="false"/>
      <div class="fc-window-glow"></div>
      <div class="fc-lantern fc-lantern-left"></div>
      <div class="fc-wood-counter"></div><img class="fc-baking-jars" src="${art}baking-jars.webp" alt="" draggable="false"/><img class="fc-floral-foreground" src="${art}floral-table-edge.webp" alt="" draggable="false"/><img class="fc-berries-bowl" src="${art}berries-bowl.webp" alt="" draggable="false"/>
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
      <div class="fc-stage">
        ${landscape()}
        <div class="fc-troll">
          <button type="button" class="fr8-speak fc-troll-help" data-fr-action="fox-help" aria-label="Trykk på trollet for å høre forklaring">
            <img class="fr2-fox fr8-troll" src="./assets/fraction-trolls/${character}.webp" width="175" height="220" alt="" draggable="false" decoding="async" aria-hidden="true"/>
            <span class="fr5-fox-bubble fc-troll-speech" role="status">${hint}</span>
          </button>
          <button type="button" class="fr8-cycle-troll fc-troll-cycle" data-fr-action="cycle-troll" aria-label="Bytt mellom de tre skogstrollene">Bytt troll ↻</button>
        </div>
        <div class="fr2-build-target fc-cake-stand" data-fr-drop="1">
          <span class="fc-cake-label">Din magiske kake</span>
          <div class="fr2-fabric fc-cake-surface">${cakeSvg({n,d,filled:x.filled,lastChanged:c.lastChanged})}</div>
          <p class="fc-cake-hint">Trykk på et kakestykke</p>
        </div>
        <div class="fr6-result fc-story-sign" role="status" aria-live="polite" aria-atomic="true">
          <span class="fc-result-label">Du har</span>
          ${oneFraction(n,d)}
          <span class="fc-percent-equality" aria-label="Det er ${percent} av hele kaken">= <b>${percent}</b></span>
          <span class="fc-result-caption">av hele kaken</span>
        </div>
        <div class="fc-piece-tray">
          <span class="fr2-tray-title fc-tray-title">Kakestykker</span>
          <div class="fr2-spare-pieces fc-pieces">${remaining.length?remaining.map(i=>c.pieceMarkup(i)).join(''):'<span class="fr6-empty-tray">Alle bitene er i kaken!</span>'}</div>
        </div>
        <div class="fc-controls">${c.adjust('n')}${c.adjust('d')}</div>
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