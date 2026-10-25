# Læria / Tallenga: character source-of-truth and rigging handoff

Date: 25 October 2026. Scope: draft PR #220 and related draft TrollActor PR #219.
Status: **CHARACTER ASSET GATE CLOSED**. Technical storybook depth planes and direct-play navigation can be tested without characters. This file is **not** permission to integrate an unapproved actor.

## Non-negotiable visual identity

The approved three characters (storesøster, lillesøster, lillebror) are defined by the locked original image files and previously approved illustrations. Preserve each face, expression, hair, outfit, colors, accessories, proportions, silhouette and relationship to the other characters **exactly**. Do not "reimagine" or regenerate a visually similar replacement.

| Identity | Original | Git blob SHA-1 | Raster resolution |
| --- | --- | --- | --- |
| Storesøster | `laer-litt-mer/assets/skogstroll/storesoster.webp` | `5d5f80c15e367bbd4600013057c7820a7b2e2adb` | 271 x 420 |
| Lillesøster | `laer-litt-mer/assets/skogstroll/lillesoster.webp` | `661107cd231a72b14aeca4f7bc3c826130734576` | 281 x 420 |
| Lillebror | `laer-litt-mer/assets/skogstroll/lillebror.webp` | `5f92c89319ec372b980c75eb3d538a4f4f851a7c` | 304 x 420 |

These WebP assets are small, **flattened** reference renders. They contain baked grass and outlines. They are **not** a layered rig, and should not be segmented blindly or presented as an animated character merely by moving/scaling an entire bitmap. The automated test `tests/laria-locked-skogstroll-identity.test.js` checks the byte-for-byte Git blob SHA of all three references. It is enforced by `.github/workflows/laria-tallenga-direct-play.yml`.

## Required replacement for a real 2D puppet

For **storesøster first**, source a separately reviewable high-resolution, editable illustration with transparent, clean components. Prefer original authoring/source layers, e.g. layered PSD/ORA and an exported PNG atlas or equivalent Rive artboards. The approval input should contain:

- Neutral approved full-body standing pose **without** built-in ground, grass or contact shadow, retaining the exact approved identity.
- Separate head and body/torso with realistic neck overlap; forearm, upper-arm, left/right hand, hips, upper/lower legs and feet; behind/front hair groups as the original drawing requires. No new clothing design.
- Eyelids, eyes/pupils, brows, mouth and optional facial details when movements need them. Where a feature cannot be separated without repainting, label the constraint; **do not invent unseen face art**.
- A separate mask or paint layer for hair overlaps, garment folds, sleeve cuffs and occlusion between connected parts. No bright halo, colored matte, baked grass or missing fingers/feet.
- Consistent canvas alignment and baseline for every export; documented pivot coordinates for each movable element, z-order, source color space, alpha mode and target scales.
- At least **2x raster resolution relative to the character's maximum CSS-rendered size**, plus a controlled iPad-landscape export that can be checked at 100% zoom. Exact required pixels are determined after layout sizing, not invented here.

## Rigging acceptance (independent of animation software)

The first pilot must exhibit **individual articulated body parts**, not whole-image bobbing. Minimum states:
1. Idle: subtle body breath, blink, gaze.
2. Wave: separately animated arm/hand, shoulder/torso overlap.
3. Think: eyes/brows/hand gesture rather than a global rotation.
4. Hint: attention and a directional gesture connected to the actual game hint.
5. Celebrate: expressive articulated movement linked to correct answers.

All states keep the face, clothing and silhouette recognizable and identical to the approved illustration. The actual engineering stack can be Rive or an equivalent 2D rig; no tool choice is authorized by this document alone.

## World integration gate

Tallenga in PR #220 has `tallenga-fjord-background-v2.svg` and `tallenga-fjord-foreground-v2.svg`, matching `viewBox="0 0 1500 680"`, with an intentionally **empty** `.tlp-stage-actors` between them. The stage is a **technical depth contract**, not proof that the art has passed review. Only an approved rig belongs in this plane. Foot baseline, foreground occlusion, actor scale, contact shadow and scene light must be checked against **real WebKit iPad/iPhone screenshots**. If the actor looks collaged in, the pilot fails regardless of test pass.

## Approval sequence

1. Review approved references versus the editable source at pixel level, especially face, hairstyle, costume and shoe/foot silhouettes. If the required sources are absent, **stop**; don't auto-generate or paint an alternate identity.
2. Approve one neutral storesøster pose and a separate layer/contact sheet. Record source checksum and image dimensions.
3. Animate and record the five real states, with screenshot and video captures of real Safari/WebKit iPhone and iPad. Do not claim a CSS bounce is rigging.
4. Integrate the approved puppet in a **separate reversible change**; verify genuine overlap with `.tlp-stage-foreground`, no halos, no layout shifts and working touch targets.
5. Only then adapt the same rig architecture to lillesøster/lillebror while retaining their individual identities.
6. Do not merge or publish PR #220 before explicit visual signoff of actual implementation screens and the affected workflows passing at exact HEAD.

## Unrelated components that must remain unchanged

All three math activities, recommended chapter progression, saved learning state, old subject-journey comparator, **Kloden/Kartene**, the locked Grovanova/Kjøsnesfjorden Hjem illustration and the ordinary no-flag experience must be preserved. No new request for backend migration arises from the character art work.
