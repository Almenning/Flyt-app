# Tallvika – integrated premium world navigation (2026-10-27)

## Implemented

- Tallvika is now one scene with three direct, transparent HTML button hotspots:
  Gangemagi, Brøklab and Gangetabellen.
- The duplicated `.tv-dock`, `.tv-mobile-actions`, portal cards and their
  duplicated journey card have been removed from the rendered UI and CSS.
- Existing activity routing, progression state, class-view selection, troll
  selection, persistence and one-tap return to Tallvika are retained.
- Troll selection remains stored for the existing activity runtime. The locked
  master itself contains the approved trio, so no duplicate foreground troll is
  rendered over the reference image.
- Hotspots use percentage geometry, have accessible names, keyboard focus and
  a 44 px minimum effective touch target.

## Locked art release gate

`laria-tallvika-premium-locked-20261027.png` is bundled as the master
(1602 × 981, SHA-256
`632c9a2a1476e220e493b6e802e044bdfb025e9afc02e7f62fcc39c81cc4a3a5`).
The integrity test rejects any pixel drift. Hotspot geometry is tied to this
exact 1602 × 981 composition.

## Verification run locally

- Node contract test: passed.
- Locked 27.10 Tallvika master integrity test: passed.
- The dedicated browser suite covers Chromium and WebKit at iPad landscape,
  iPad portrait, iPhone portrait and iPhone landscape, including activity
  entry/return, class selection, troll persistence and overflow.

## Current environment limitation

This workspace has no installed Chromium or WebKit runtime. Playwright's
browser download is blocked by the execution network and fails before a valid
archive is received. Browser screenshots and the final Chromium/WebKit run are
therefore a release gate, not a claimed completed result.
