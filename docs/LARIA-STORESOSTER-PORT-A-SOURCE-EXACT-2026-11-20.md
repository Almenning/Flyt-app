# Læria Storesøster – Port A, kildetro identitetsmaster (20.11.2026)

**Status: Source identity verified. The art gate for actual 2D-animation remains BLOCKED.**

## Why the production method changed

Multiple independently generated Storesøster v2 candidates did not preserve the original face, proportions, outfit or arm silhouette. Do not make another free reinterpretation and pass it off as the locked character.

The precise identity source is `laer-litt-mer/assets/gangemagi-troll/storesoster.webp` on PR #258 / main:

- Size: **512 × 1024**, RGBA WebP.
- Git blob SHA-1: `a8fba47e272e2856bd78b92fb262146506e828ed`.
- File SHA-256: `b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89`.

Source integrity is checked both ways, before modifying anything.

## New reproducible tool

`scripts/laria-storesoster-source-exact-master.py` verifies those hashes and creates a **2048 × 2048 RGBA PNG master** by repeating each original pixel into a 2 × 2 group and adding 512 transparent side pixels on either side.

```bash
python3 -m pip install Pillow
python3 scripts/laria-storesoster-source-exact-master.py \
  --source laer-litt-mer/assets/gangemagi-troll/storesoster.webp \
  --out out/laria/storesoster-v1-source-exact-2048.png
```

A round-trip test reconstructs every original 512 × 1024 RGBA pixel exactly. No new face, outfit or backdrop is generated; **also no genuine extra image detail is gained** from upscale. The locally verified resulting master has SHA-256:

`a1b8aead5e2ece5a224ff66a8714095db90569e447cebae9a73ff17a2716bb17`

This PNG is only an **identity reference and source-layout master**; it is not a new v2 animation layer pack and is not added to the `approved/` runtime directory. Generated files are placed under `out/laria/` locally; the command and source data are stored in GitHub to make rebuilds reproducible.

## Staging and art QA

- Existing original: **LOCKED, source-exact**.
- 2048-square master: **SOURCE-EXACT**, verified original-pixel recovery.
- Rough potential neck/shoulder/elbow landmark map: **ANATOMICAL ESTIMATE ONLY**; not rig-approved.
- Separate left/right arm, head/hair and face: **NOT FINISHED**. The original V1 image has occluded anatomy that must be drawn carefully in the same painterly style.
- Seamless idle/wave/think/help/celebrate/encourage: **NOT VERIFIED** using true separated parts.
- Port A visual signoff: **NOT GRANTED**. The reproduction of the already-approved V1 character is not approval of a new animation rig.
- Port B integration into Læria: **NOT STARTED**.

## Binding constraints

1. Do not alter, overwrite or inpaint the V1 artwork in place.
2. Produce hidden surfaces/arms and face states **from this exact character identity**, not independent generated bodies and heads.
3. Provide a genuine compositing reconstruction of the neutral pose without seams, then six animation previews, before seeking app integration.
4. Use `ownerApproved=false` until the actual transparent layer pack is explicitly approved. Keep existing V1 active and keep PR #258 as draft.
5. Do not use a visually smoother Lanczos preview as evidence of pixel exactness. It is **not** pixel-exact.
6. Do not merge, publish or modify HverdagsOss or any locked backgrounds.

This is a meaningful **pipeline/identity improvement**, not a claim that Storesøster v2 or TrollActor 2.0 art is finished.
