# Læria active runtime layers

Prompt 8 establishes the canonical active layer order. This file documents ownership; it is not a second source of product logic.

## CSS load order
1. laria-foundation-v1.css — shared locked tokens only
2. fraction-lab.css — Brøklab
3. multiplication-lab.css — Gangetabell
4. bokskogen-world.css — Norwegian grades 1–2 journey world
5. journey-world-premium.css — shared Math/English/Geography journey presentation
6. world-atlas.css — world depth/landmark extensions
7. home-premium.css — legacy/shared Home styling for non-young bands
8. home-basecamp-v12.css — canonical Home for grades 1–2
9. word-hunt.css — Ordjakt
10. laria-unified-v13.css — shared fallback/app styling
11. laria-task-scene-v15.css — shared premium task scene
12. globe-v24.css — canonical premium globe presentation
13. laria-task-young-v18.css — final grades 1–2 task-scene specialization
14. locked-journey-renderer.css — guarded, full-aspect Oct 10 visual overlays only when approved original art exists

## JavaScript load order
Boot data before inline runtime:
1. profile-avatars.js — synchronous profile avatar map
2. commercial-content-v18.js — synchronous Prompt 18 launch-depth supplements for Norwegian, Math and English
3. commerce-v18.js — parent-controlled StoreKit entitlement client; web remains preview-only
4. norwegian-content.js — deferred canonical Norwegian content


Deferred presentation/activity modules after inline runtime:
1. fraction-lab.js
2. multiplication-lab.js
3. bokskogen-world.js
4. journey-world-premium.js
5. locked-journey-contract.js + locked-journey-renderer.js — original 10 October 2026 five-stop maps for grades 1–2, opt-in only after asset checks
6. word-hunt.js
7. home-basecamp-v12.js
8. laria-unified-v13.js
9. laria-task-scene-v15.js
10. globe-v24-art.js
11. globe-v25-renderer.js

## Ownership rules
- Grades 1–2 Home is owned by home-basecamp-v12.css/js. The obsolete LARIA_YOUNG_HOME_HARD_FIX_V8 block has been removed from home-premium.css.
- Globe presentation is owned by globe-v24.css plus globe-v25-renderer.js; the inline globe CSS is fallback/base structure.
- Task presentation is layered intentionally: laria-unified-v13 → laria-task-scene-v15 → laria-task-young-v18.
- Journey presentation keeps the existing progression model; visual renderers do not own progress state.
- Approved Oct 10 journeys are additive, illustration-first presentation: the image dimensions must match 941×1672; missing/incorrect images trigger the previously tested Norwegian/Math/English/Geography fallback.
- The 5 approved geographic/subject signs are interaction anchors, not new nodes. Original node IDs, lesson execution, user records and grade progression remain canonical.
- Only grade 1–2 journey boards use the approved portrait art; other grades retain their previous map renderers.
- Profile fox source is window.LARIA_PROFILE_AVATARS plus the saved state.profile.avatar choice.
- Commercial content depth is owned by commercial-content-v18.js; it supplements subject pools but must not own progression, mastery, Home, Journey, Globe, or Task presentation.
- Cache-busted asset versions in index.html and sw.js must match exactly.

## Responsive contract
- phone: <= 700px
- tablet portrait: >= 701px in portrait
- iPad landscape / desktop: world-first landscape composition
- small phone is separately QA-tested around 320–360px width

Do not add another Home/Globe/Task visual layer without removing or explicitly superseding an existing owner.
