# Kloden: låst visuell referanse og v36-godkjenningsport

**Status: v36 referanseillustrasjon implementert og desktop/iPhone/iPad-bilder kontrollert; oppdatert kontinentpalett avventer eksakt SHA-verifisering.**

## Visuell fasit

Brukerens godkjente skjermbilde fra 5. oktober 2026 er låst fasit for helhetsinntrykk, komposisjon og illustrasjonsnivå. Repoets `globe-v20-approved.webp` viser samme type rikt illustrert eventyrmiljø og fungerer som tilgjengelig stilreferanse, men er **ikke** et rent bakgrunnsasset. Det inneholder allerede tegnet klode, landkort, knapper og tekst.

Brukerens skjermbilde fra 9. oktober viser faktisk v35-runtime. Det avviker tydelig fra fasiten: flat, blek geometrisk fjellscene; manglende store trær og blader, treverk, lykter, fosser, slott, kikkert/kompass og forgrunn; lite visuelt slektskap med den varme, detaljerte eventyrverdenen.

## Bindende ferdigkriterier

1. Erstatt v35-bakgrunnen med **et selvstendig, ekte illustrasjonsasset uten innbakt klode, kort, etiketter, zoomknapper eller annen UI**. Bakgrunnen skal ha nivået i godkjent referanse: trær i forgrunn, varmt treverk/utstyr, vann og fosser, små eventyrlige bygninger, fargesterke fjell og dybdelag.
2. Interaktiv canvas-klode er eneste klode på skjermen. Kartgeometri må fortsette å være knyttet til landkonturer, slik at landvalg, rotasjon og zoom samsvarer med det som tegnes.
3. Behold alle tre eksisterende moduser (Utforsk, Min verden, Kloden), tilgjengeligheten, landfakta, zoomknapper og navigasjon. Tredje modus kan ikke slettes for å etterligne en todelt statisk illustrasjon.
4. Behold den levende landkortvisningen; statisk gjengivelse av Tsjad er uakseptabelt.
5. Juster globale mål, kortplassering og visuell hierarki basert på faktisk skjermgeometri, ikke én skjermstørrelse. Globusen skal ha visuell tyngde lik referansen, uten å skjule kontroller eller kort.
6. Ingen lite lesbar tekst, kort som overlapper, zoomknapper utenfor skjerm, eller sveip/pinch-problemer på iPhone, iPad stående/liggende og desktop Safari.
7. Oppdater asset-cache-nøkler for Safari og installert PWA.
8. Kjør og bestå Chromium/WebKit visuell geometri- og gesttest, full Læria QA, iOS build, smoke, Prompt 18 audit og publisert-URL-kontroll på **eksakt PR-head**.
9. Inspiser faktiske fullskjermbilder fra de fire visningene og sammenlign dem side-ved-side med godkjent referanse. Automatiske tester alene oppfyller ikke designgodkjenning.
10. Merge først når den visuelle kvaliteten er på nivå med referansen. Ingen Prompt 19 som snarvei.

## Forbudte snarveier

- `background-image: url('./globe-v20-approved.webp')` eller et annet komplett UI-skjermbilde som aktiv bakgrunn. Dette lager en ekstra, statisk klode bak canvas, med dobbelt grensesnitt ved responsiv størrelse.
- Å presentere referansebildet eller et nytt mockup som bevis på faktisk runtime.
- Å erklære «identisk med låst illustrasjon» før kvaliteten er kontrollert med faktiske skjermbilder.
- Å endre atlasdata, landnavn eller progressjonslagring for å løse et rent visuelt problem.

## Nåværende grunnlag

- Live v35: `globe-environment-v35-landscape.svg`, `-mobile.svg`, `-tablet.svg` og `globe-v24.css`.
- Låst stilasset: `globe-v20-approved.webp`.
- Bevar kartmotor: `globe-v25-renderer.js`.
- Eksisterende regressjon: `tests/laria-globe-visual-p18.playwright.js` samt `tests/laria-globe-motion.cjs`.

**Status:** Den fragmenterte SVG-bakgrunnen er forkastet. Tre helhetlige WebP-bakgrunner er implementert og verifisert visuelt i WebKit og Chromium. Original geografimotor og zoom er bevart. PR holdes som draft til oppdatert palett er godkjent i eksakt-head QA.

## v36 integrated art update

The actual runtime uses `globe-storyscape-v36-landscape.webp`, `globe-storyscape-v36-tablet.webp` and `globe-storyscape-v36-mobile.webp`. These are clean, cohesive scenes without baked-in UI. A screenshot comparison from the exact branch is required before merge. The original live geographic renderer and gesture handlers have not been edited.

For v36 release, all four exact-head workflows (QA, native iOS, Prompt 18 audit and smoke) must pass on the same commit; interactive geography and non-stretched backgrounds are independently asserted.

## Foreløpig skjermbildekontroll (v36)

- WebKit desktop 1525x864: sammenhengende eventyrbakgrunn med treverk, fossefall, slott, trær og kompass; én rund interaktiv klode; alle kontroller tilgjengelige.
- WebKit iPhone 390x844: separat portrettillustrasjon, rund klode, synlig zoompar og landkort, ingen utstrekking.
- WebKit iPad portrett og landskap: separat illustrasjonsvariant og ingen geometri-/kontrollkollisjon.
- Identifisert avvik ved v36 første visuelle test: jordfarget Europa/Afrika. Rettet med referansepalett i `globe-v25-renderer.js`. Krever ny visuell kontroll.
