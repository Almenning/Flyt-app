# Læria Brøklab: Første spillbare Fjordbakeri-scene

**24. oktober 2026 · PR #211 · visuell sluttgodkjenning gjenstår**

Dette er en isolert ny scene-komponent for bygging av brøker. Brøkmodellen, oppdagelser, navigering og lagring er bevart.

- Først vises **én stor interaktiv kake**, 1/4 = 25 %, og én meningsfull hovedhandling: «Legg til én bit».
- Prosent er synlig ved siden av kaken og oppdateres automatisk. Addisjon og gange vises ikke først, men kan åpnes frivillig etter at barnet har fylt minst to deler.
- Ved 2/4 viser oppdagelsen **1/4 + 1/4 = 2/4** og **2 × 1/4 = 2/4**. Formlene oppdateres med faktiske n/d. Ved 1/3 vises omtrent-tegn for prosent.
- En egen SVG-kake består av faktisk klikkbare, drabare/tastaturstyrte sektorer med unik ID. Løse kakestykker er reelle knapper som går gjennom samme matematikkmotor.
- Ett aktivt, originalt skogstroll (storesøster/lillesøster/lillebror) er medspiller. Bytte av troll rører ikke matematikken.
- Fjord, Skåla med tårnet, bakerovn, hyller, blomster og treverk kommer fra **flere separate utsnitt av den godkjente fjordbakeriillustrasjonen**, ikke et statisk ferdig skjermbilde med usynlige klikksoner.
- Separate layouts for iPad, iPhone stående og iPhone liggende. Kake, brøk, prosent og teller-/nevnerkontroller skal være i første viewport.
- Alle øvrige Brøklab-aktiviteter og fremgangsdata bevares.

**Filer:** `fraction-cake-world-v1.{js,css}`, `assets/fraction-scene/*.webp`, integrasjon i `fraction-premium-v2.js` og `index.html`, Chromium/WebKit QA.

**Ingen automatisk merge/publisering.** Illustrasjonen er en kvalitetsfasit, og faktisk Safari/WebKit-skjermbilde og brukeraksept kreves før publisering.
