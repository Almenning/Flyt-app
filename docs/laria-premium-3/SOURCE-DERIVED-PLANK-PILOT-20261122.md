# Læria sign artwork: source-derived candidate, NOT approved

**22.11.2026. PR #272. Status: ART CANDIDATE ONLY. No application runtime change.**

## Purpose
The user rejected the stripy, flat CSS-rendered wooden signs despite green iPad tests.
The source of truth is the exact user-approved sign illustration, not a
procedurally created imitation.

The existing file `laer-litt-mer/assets/ui/locked-reference/laria-sign-master-v1.png`
is checked with SHA-256
`1b3cdb93f04b95b7b0850653827cb5e6235a69afc5c94e39ab5eba78640678db`.

## Concrete implementation
- `tools/laria_art/build_locked_sign_plank_candidate.py` reads the locked
  reference **without modifying it**, crops the original illustrated Matte
  plank, retains the original plank silhouette, metal rivets and visible
  wood borders, and produces a transparent blank-plank **candidate**.
- The original printed word and icon cover much of the center. This area
  is **synthetically reconstructed from colors and wood grain sampled from
  the reference**. It is not a genuine recovered wood grain and is not
  guaranteed to pass art-quality review.
- Generates three examples `Words`, `Sentences`, `Reading` with separate
  drawn relief medallion symbols and dark serif lettering. These PNGs
  demonstrate composition only: app text/interactive buttons must remain
  real DOM, never baked into final artwork.
- CI `.github/workflows/laria-source-derived-wooden-sign-review.yml`
  SHA-checks the source, generates four RGBA candidates in original-derived
  quality, verifies dimensions/transparency and uploads all review PNGs.
  CI does **not** activate the candidate or mark it production-ready.

## Visual differences still requiring remediation
1. The central wood grain is still softer/more artificial than original.
   This requires quality retouch from the approved art plate, not more
   repeating CSS gradients.
2. Medal frames/icon geometry and type need matched illustration and scale
   against the locked Grovanova sign close-up. Current medallions are
   illustrative *proofs*, not approved finished icon art.
3. Two post supports in the original are thick, detailed, and natural.
   Post artwork must be source-derived/illustrated and scene-anchored,
   rather than leaving the former thin CSS rail.
4. Need `Words` rendered on **real Kinnaklova app iPad screenshots**,
   first 1024×1366 and 1366×1024, then full five-size WebKit/Chromium
   matrix. No image-only mockup may substitute for the actual app.
5. Hjem v16 remains **byte-for-byte unchanged**; it is the locked source
   reference. No new board overlay on painted Home art.

## Hard release gate
Do not merge PR #272, publish or enable a new sign art asset in runtime
until a true **visually source-faithful** board, posts, medallion and
DOM text are demonstrated on a real iPad scene and the owner explicitly
approves the resulting screenshots. Green geometry/CI alone is insufficient.

### Review artifact
CI artifact is named
`laria-wooden-sign-source-art-NOT-APPROVED-<exact-head-sha>`.
It contains a blank plank, three per-word PNG proofs, and
`NOT-APPROVED.json` stating that no production art is ready.
