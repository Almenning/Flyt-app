# Shared learning scenes — illustration assets

The `task-*-v21.webp` files are 24 project illustrations generated with the built-in image generation tool. The transparent sprite sheets were inspected and cropped into individual 440 × 440 WebP files. Counting groups and flags are not replaced by single-object artwork. The Norwegian answer EPLER uses three apples; English apple uses one. The existing fox asset remains the illustration for REV.

The renderer is `laria-task-scene-v15.js`; it preserves the separate geography and learning answer handlers. The v18 young scene composition is retained. Generated object artwork replaces its simpler SVG and emoji vocabulary pictures.

## Prompt set used for the selected sheets

1. A transparent 3 × 3 atlas: cream cottage with red roof, orange cat, golden puppy; red apple, oak tree, blue storybook; sun, toy ball, blue fish. Rich polished hand-painted 3D storybook illustration, rounded child-friendly forms, warm sunlight, soft shading, clear silhouettes, no text or interface.
2. A transparent 3 × 3 atlas: grey mouse, red car, cheese wedge; vanilla ice cream, sailboat, red winter hat; blue sneaker, toy train, cow. Each isolated in its cell with generous gutters. Detailed rounded hand-painted 3D storybook style, rich colors, clean silhouettes, no scenery or text.
3. A transparent 3 × 3 atlas: lamb, blue cup, wooden bed; three red apples, crescent moon, daisy; pencil, pear, banana. Only the first six objects are used. Detailed rounded hand-painted 3D storybook illustrations, warm colors, clean cutout edges, no background, glow, text or overlap.

The unsuccessful landscape sheet and background-removal attempt are not used.

The two `task-fox-*-v21.webp` sprites are transparent adaptations of the existing boy and girl profile artwork. The image tool was asked to preserve each fox's fur, clothes, accessories and pose, remove the scenery and ground, and retain the full character with transparent margins. Profile cards retain their original artwork; scene companions use the cutouts matching the saved choice.

## Typography

`fredoka-v21.ttf` is Fredoka from the Google Fonts repository. Its SIL Open Font License is included in `fredoka-OFL.txt`. It is hosted locally and used for younger children's headings and task controls.

## Verification

`tests/laria-shared-scenes.playwright.js` exercises four subjects, correct and incorrect answers, Next, saved question position, completion, word building, other question layouts, maps and both labs. It captures phone and tablet screenshots. Run with `node tests/laria-shared-scenes.playwright.js` after installing Playwright Chromium.
