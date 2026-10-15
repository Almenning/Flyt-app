# Læria D2: illustrerte terrengforlengelser på iPhone (15.10.2026)

**Status: kunstressurser mangler; visuell kvalitetsport ikke bestått. Ikke flett PR #124.**

## Rotårsak

De fire godkjente kartene er 941 × 1672. På en iPhone som er 390 CSS-px bred blir naturlig karthøyde ca. 693 CSS-px. En 844px høy viewport får dermed ca. 151px synlig plass nedenfor kartet. Denne plassen ble tidligere fylt av **et annet, uskarpt motiv**. Etter testing av D2-kandidatene er også speiling, gjentakelse, strekking av originale bildepiksler og ren, mørk bakgrunn forkastet som premiumsluttresultat.

De originale PNG-ene, trykkrektanglene og barnets personaliserte rev er låst og skal ikke endres.

## Fire nødvendige nye kunstressurser

Lag **ett ekte illustrert terrengfortsettelsesbilde per fag**, tilpasset bunnen av den *eksakte* godkjente originalen:

| Fag | Originalreferanse | Ressurs som skal leveres |
| --- | --- | --- |
| Norsk | `locked-journeys/bokskogen-locked-20261010.png` | `assets/locked-journey-ground/bokskogen-ground-v1.webp` |
| Matte | `locked-journeys/tallenga-locked-20261010.png` | `assets/locked-journey-ground/tallenga-ground-v1.webp` |
| Engelsk | `locked-journeys/ordlandsbyen-locked-20261010.png` | `assets/locked-journey-ground/ordlandsbyen-ground-v1.webp` |
| Geografi | `locked-journeys/nordlysleiren-locked-20261010.png` | `assets/locked-journey-ground/nordlysleiren-ground-v1.webp` |

**Oppdrag til illustratør / AI-utmalingsverktøy:** Lag en naturlig fortsettelse av vegetasjonen, steinene, stien eller vannkanten **nedenfor den malte fremdriftslinjen** på hvert kart. Originalkartet skal brukes som eksakt forankring ved sammenføyningen. Fortsett scenen nedover uten kopiert UI, skilt, tall, oppdrag, rev eller gjentatte gjenstander. Behold originalens utsnitt, lysretning, dybde, perspektiv, farger, detaljgrad og 2.5D-eventyrstil. Ingen flate vektorplanter, speilvendte piksler, oppstrukne striper eller uskarp bakgrunn.

For hver ressurs: bredde **941px**, totalhøyde **minst 468px** (43 piksler eksakt originaloverlapp + 425 nye piksler), **lossless WebP (sRGB)**, med 43px kildeforankret overlapp med kartets nederste naturlige terreng. Høydebehov er beregnet fra 390×844 og 430×932; kunst bør gi rom for senere iPhone-format uten ny generering. Alt du trenger er original PNG og en separat forlengelse, *aldri en endret original*.

## Implementeringskontrakt

1. Vis originale 941×1672-PNG i sin eksisterende `.locked-journey-board` med `object-fit:contain` og uendrede hotspot-koordinater. Ingenting skal skaleres forskjellig mellom x/y.
2. Plasser ny terrengressurs **utenfor** brettet (under det), i samme map-bredde og med naturlig 941px-bildeskala. Bruk en kort maskert overgang som er **43 av originalens 941 bildepiksler** (4,5696 % av kartbredden) i den siste vegetasjonen **under den malte progresslinjen**. Første 43 piksler i den ferdige forlengelsesfilen skal være de nøyaktige, låste originalpikslene fra bildets nederkant; nymalt terreng starter umiddelbart etter disse. Da møtes pikslene på samme sted også på forskjellige iPhone-bredder. Ikke legg et nytt progresspanel under originalen.
3. Beregn faktisk ekstra høyde med `max(0, viewportHeight - boardHeight)`. På små iPhone-skjermer der originalen fyller skjermen, vis ingen kunstig, separat hale.
4. Hold teknikken dekorativ med `pointer-events:none` og uten å skjule eller forflytte hotspotmål (minst 44×44 CSS-px), innhold, fremdrift eller rev.
5. Reservér faktisk layoutplass for forlengelsen før elementer nedenfor. **Nordlysleirens eksisterende inngang til Kloden skal fortsatt være synlig og klikkbar** etter forlengelsen, aldri dekkes av et absolutt plassert bildefelt.
6. Kunstressurser må være tilgjengelige offline gjennom appens eksisterende serviceworker. Ingen eksterne nettverkskall, tung runtime-canvas-rendering eller nye rammeverk.
7. Bare iPhone stående nå. iPad og landskap skal beholde sitt godkjente oppsett inntil de testes særskilt.

## Visuell og funksjonell kvalitetsport

- WebKit og Chromium: 320×568, 375×667, 390×844, 430×932, og 844×390. iPad stående/liggende kontrolleres for regressjon.
- Lag og inspiser faktiske skjermbilder av både **map-bottom** og **document-bottom**; dette er ikke samme sted i Geografi.
- Kontroller sammenføyningen i 1:1 og minst 2× rasterstørrelse. Ingen tydelig horisontal stripe, duplisert maleri, forskjellig bildekvalitet, ekstra progresslinje, feil skygger, tekst eller pikselstretch.
- Kontroller at bare valgt rev vises, alle fem kartpunkter er klikkbare, retur går riktig, progresjon og repetisjon virker, Kloden kan åpnes, og horisontal scrolling ikke oppstår.
- Full Laria QA, responsive tester, smoke, innholdsaudit og iOS-build på **eksakt samme head-SHA** før vurdering av merge.
- Manuell fysisk iPhone-/iPad-test og barnetest inngår fortsatt i lanseringsporten.

### Foreløpig resultat

D2 v1: speilet fremdriftslinje (visuelt feil). D2 v2: vertikalt strekte naturstriper (visuelt feil). D2 v3: fjernet uskarpt fremmedmotiv, men etterlater stor, flat mørk flate (ikke premium). Automatisk test kan være grønn selv når disse bildene er visuelt utilstrekkelige. Derfor er **ingen av disse** en godkjent lanseringsløsning.

**Beslutning:** Ikke lås ny visuell stil eller flett PR før fire *faktiske* illustrerte forlengelser er integrert og visuelt godkjent.