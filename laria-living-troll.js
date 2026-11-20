/**
 * Læria living trolls, isolated pilot engine.
 * Approved character images are supplied by the caller; never redraw or swap identities.
 * Intentionally does not mutate gameplay, progression, or profile storage.
 */
(function (root) {
  "use strict";
  const VALID = new Set(["idle", "wave", "think", "hint", "celebrate"]);
  const STYLES = `
.laria-living-troll {display:inline-grid;place-items:end center;position:relative;isolation:isolate;contain:layout style;}
.laria-living-troll__figure {display:block;max-width:100%;max-height:100%;object-fit:contain;transform-origin:50% 88%;user-select:none;-webkit-user-drag:none;}
.laria-living-troll[data-state="idle"] .laria-living-troll__figure {animation:laria-troll-breathe 3.8s ease-in-out infinite;}
.laria-living-troll[data-state="wave"] .laria-living-troll__figure {animation:laria-troll-wave .72s ease-in-out 2;}
.laria-living-troll[data-state="think"] .laria-living-troll__figure {animation:laria-troll-think 1.6s ease-in-out 2;}
.laria-living-troll[data-state="hint"] .laria-living-troll__figure {animation:laria-troll-hint 1s ease-in-out 2;}
.laria-living-troll[data-state="celebrate"] .laria-living-troll__figure {animation:laria-troll-cheer .58s ease-in-out 3;}
@keyframes laria-troll-breathe {0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.008)}}
@keyframes laria-troll-wave {0%,100%{transform:rotate(0)}35%{transform:rotate(-4deg)}70%{transform:rotate(3deg)}}
@keyframes laria-troll-think {0%,100%{transform:rotate(0)}50%{transform:rotate(-3deg) translateY(2px)}}
@keyframes laria-troll-hint {0%,100%{transform:translateX(0)}50%{transform:translateX(5px) rotate(2deg)}}
@keyframes laria-troll-cheer {0%,100%{transform:translateY(0)}45%{transform:translateY(-12px) scale(1.025)}}
@media(prefers-reduced-motion:reduce){.laria-living-troll .laria-living-troll__figure{animation:none!important}}
`;
  function ensureStyle(doc) {
    if (doc.getElementById("laria-living-troll-style")) return;
    const el = doc.createElement("style");
    el.id = "laria-living-troll-style";
    el.textContent = STYLES;
    doc.head.appendChild(el);
  }
  function mount(target, options) {
    if (!target || !target.ownerDocument) throw new TypeError("DOM target required");
    const opts = options || {};
    if (!opts.src || !["storesoster","lillesoster","lillebror"].includes(opts.character)) {
      throw new TypeError("Approved character id and image src required");
    }
    const doc = target.ownerDocument;
    ensureStyle(doc);
    const box = doc.createElement("div");
    box.className = "laria-living-troll";
    box.dataset.character = opts.character;
    box.dataset.state = "idle";
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", opts.label || "Vennlig skogstroll");
    const img = doc.createElement("img");
    img.className = "laria-living-troll__figure";
    img.src = opts.src;
    img.alt = "";
    img.draggable = false;
    img.decoding = "async";
    box.appendChild(img);
    target.appendChild(box);
    let timer = null;
    function setState(state, durationMs) {
      if (!VALID.has(state)) throw new RangeError("Unknown troll state");
      if (timer !== null) { root.clearTimeout(timer); timer = null; }
      box.dataset.state = state;
      if (state !== "idle" && durationMs !== 0) {
        const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 2200;
        timer = root.setTimeout(() => { box.dataset.state = "idle"; timer = null; }, duration);
      }
    }
    return {
      element: box,
      setState,
      onCorrect() { setState("celebrate"); },
      onIncorrect() { setState("think"); },
      onHint() { setState("hint"); },
      greet() { setState("wave"); },
      destroy() { if (timer !== null) root.clearTimeout(timer); box.remove(); }
    };
  }
  root.LariaLivingTroll = Object.freeze({mount, states: Object.freeze([...VALID])});
})(typeof window !== "undefined" ? window : globalThis);
