# LARIA GANGEMAGI - LOCKED INTERACTION DECISION 2026-10-19

Status: USER-APPROVED PRODUCT REQUIREMENT. Applies to PR #187. Do not change locked illustration or replace it with a static screenshot.

## Visual contract
The illustration approved in ChatGPT on 19 October 2026 is the visual reference: Tallenga strawberry market, prominent mission, tactile wicker baskets, responsive personal fox, clear equation, quiet collection progress. Reproduce as a playable interface. The image is NOT claimed to be uploaded as a binary asset in this repository.

## Locked gameplay
- Main action: child touches an actual strawberry and DRAGS it onto a chosen basket. The berry visibly follows the finger; the target basket responds before release. Only release over a valid basket adds one berry.
- Alternative: touch to pick a strawberry, then touch the destination basket.
- Removal: child can remove one strawberry by touching it in the basket or dragging it back to the source. A clearly accessible undo/remove fallback is retained until direct removal is tested.
- No sixth berry in a five-berry basket. No inaccurate equation or premature success animation. The equation reflects real groups and totals.
- Immediate tactile feedback, subdued animation, age-appropriate fox responses, accessible touch targets, keyboard/assistive alternatives and reduced-motion support.
- Remove the oversized generic add-strawberry button when direct interaction has passed QA; retain a visible berry SOURCE as the touch/drag origin.
- Preserve eight missions, free play, Market Book, earned flowers, personal selected fox, saved progress, original multiplication table, all other subjects and both globes.
- Avoid extra menus, redundant progress boxes and gratuitous decor that hides gameplay.

## Release acceptance gate
Automated exact-HEAD tests for drag, tap, invalid target, basket limit, removal, equation consistency, persistence, and navigation. Real Playwright WebKit and Chromium screenshots for narrow iPhone and iPad portrait/landscape. Compare with approved image and inspect manually. Keep PR draft and do not publish until checks and visual fidelity are verified.

## Work begun
Commit 0ba55966284cb72c84ee8991a54acb970e76c974 enables source-to-basket dragging and two-step tap placement in mission mode. This is only a first functional increment, NOT visual signoff or a completed premium release.
