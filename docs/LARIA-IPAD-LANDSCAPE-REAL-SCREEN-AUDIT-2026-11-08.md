# Læria – faktisk visuell iPad-kontroll 8. november 2026
**Status: IKKE GODKJENT. Dette er en observasjonsrapport, ikke redesign eller endring av låst kunst.**

## Sporbarhet
- PR: [#243](https://github.com/Almenning/Flyt-app/pull/243) (draft).
- Inspisert HEAD: `2c22ca8b9305a3a566610c8df77c70792e9a2f25`.
- Kilde: [GitHub Actions – låst visuell identitet, kjøring 42472334426](https://github.com/Almenning/Flyt-app/actions/runs/42472334426), artefakt `laria-visual-identity-2c22ca8b9305a3a566610c8df77c70792e9a2f25` (ID 13614280895).
- Reelle 1366 × 1024 **WebKit**-skjermbilder: `webkit-ipad-landscape-home.png`, `...-norwegian.png`, `...-math.png`, `...-english.png`, `...-geography.png`.
- Sammenligningsbevis: `webkit-ipad-landscape-five-screen-review.png`. Chromium-ekvivalenter ligger i samme artefakt.
- Testen har gått gjennom scenene og har generert skjermbildene; **det betyr ikke at noen skjerm er visuelt godkjent**.

## Visuell vurdering per skjerm

| Prioritet | Skjerm | Faktisk observert | Krevet tiltak | Godkjenning |
| --- | --- | --- | --- | --- |
| P0 | Hjem / Grovanova | Omtrent øverste 15 % er en flat mørk/lyseblå gradientstripe, ikke sammenhengende landskap. Synlige fire fagskort nederst i den låste kunstkomposisjonen konkurrerer med de fire skiltvalgene til venstre. Hjem-logo er et annet formspråk enn den felles lyse trelogoen. | Kontrollert **ren Grovanova-artvariant** og godkjent iPad-komposisjon som beholder fjellet og den låste scenen; aldri erstatte originalfil eller legge nytt UI over malte elementer. | **Blokkert** |
| P1 | Norsk / Eggenipa | Fullflatescene med tydelig Eggenipa, felles lys trelogo og tre venstrestilte to-stolpede skilt. Valgt troll står separat. | Sammenlign trykkflater/posisjon med Matte og Geografi; kvalitetskontroller at den levende aktøren har naturlig fotfeste, uten å bytte låst karakter. | **Til gjennomgang**, ikke godkjent |
| P1 | Matte / Tallvika | Tre venstrestilte skilt i samme familie som Norsk. Troll er separat i forgrunnen. «Neste eventyr» er inne i landskapet, men har langt mindre størrelse og annen plassering. | Kontroller størrelse/lesbarhet, følgesvennens plassering og reelle knappeklikk. Behold låst fjell og originaler. | **Til gjennomgang**, ikke godkjent |
| P0 | Engelsk / Kinnaklova | Læria-logo + stor «Oppdag Kinnaklova»-grafikk er innmalt i kilden, og «Words», «Sentences», «Reading» står spredt med mørk brun/ grønn design; dette bryter den låste felles venstremenyen og logoen. | Lag og fremvis **ren Kinnaklova-variant uten innmalt UI**, bevar nøyaktig landemerker/kirke/kyst. Vis samme komponenter og venstrestilte skilt fra felles system i ekte app. Godkjen ren kunst før aktivering. | **Blokkert** |
| P1 | Geografi / Nordlysleiren | Samlet skiltgruppe og logo følger Norsk/Matte. Motivbildet fremstår synlig mykere/lavere oppløst på iPad enn andre fag. | Lag kontrollert illustrasjonsvariant med høyere kildeoppløsning, samme godkjente motiv, og test uten filtreringsjuks. | **Til gjennomgang**, ikke godkjent |

## Teknisk rotårsak: Hjem
`laer-litt-mer/home-kjosnes-v15.js` i `mapControlsToArtwork()` velger nå en ikke-beskjærende skala og legger låst bred master nederst når det oppstår ledig høyde. `home-kjosnes-v15.css` fyller dette ledige arealet med en lineær gradient via `::before`. **Dette er en bevisst tilpasning som i praksis etterlater en stor synlig stripe på 4:3-iPad.** Det skal ikke skjules ved å legge til et nytt gradient-/blur-/duplikatscenelag. Ren iPad-kunstvariant må godkjennes.

## Teknisk rotårsak: Engelsk
`kinnaklova-ipad-fullscene-v1.css` bruker skilt som er innmalt i en byte-låst panorama-master og transparente DOM-trefflater. De kan ikke flyttes til felles venstremeny med CSS alene uten synlige gamle skilt i landskapet. **Ikke improviser med dobbelte skilt eller tildekking.**

## Godkjenningsrekkefølge
1. **iPad liggende, fem skjermer:** Rens artfiler der det er nødvendig (uten å endre originalenes byte/hashes) og vis fem nye reelle WebKit/Chromium-bilder mot Grovanova-fasiten. Ingen «premium godkjent» før de er kontrollert av produkteier.
2. **iPad stående:** Samme fem skjermer, deretter separat kunst-/responsivevaluering. Ingen iPhone/desktop-redesign før begge iPad-visninger er godkjent.
3. **Senere:** iPhone, desktop, full funksjon-/progresjonsregresjon og privat barnebeta.

## Røde testkjøringer ved inspisert HEAD
- [Tallvika (42472334712)](https://github.com/Almenning/Flyt-app/actions/runs/42472334712): valgt troll overlapper aktivitet på liggende iPhone, begge motorer. **Legg i iPhone-arbeidsport, ikke endre iPad-design for å maskere dette.**
- [Kinnaklova (42472334386)](https://github.com/Almenning/Flyt-app/actions/runs/42472334386): kontraktsjobb feilet blant annet på trailing whitespace i masterplanen; browser-/kunstjobbene var grønne. Dette er en teknisk kontrollfeil, ikke artgodkjenning.
- [Laria QA (42472334378)](https://github.com/Almenning/Flyt-app/actions/runs/42472334378): test av låst reise returnerer ikke forventet aktiv Hjem-skjerm etter `.locked-journey-back`; undersøk reell navigasjon, ikke løs ved å ignorere kontrollen.
- [Laria iOS build (42472334418)](https://github.com/Almenning/Flyt-app/actions/runs/42472334418): byggejobb feilet og må håndteres før en eventuell publisering.

**Ufravikelig:** formålsparagrafen, originale skogstroll, alle godkjente originalmotiver, kilde-hasher, lagret progresjon og PR som draft videreføres. Testskjermbilder er dokumentasjon av faktisk tilstand, ikke visuell fasit som endrer de låste designkravene.
