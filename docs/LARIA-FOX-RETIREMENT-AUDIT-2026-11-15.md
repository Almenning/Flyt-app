# Læria Premium – opprydding i rev og gamle karakterer (15.11.2026)

**Kilde:** faktisk kildekode på PR #243, HEAD `ab2479906086839c8242d4f0ad4dd6c0985a6c45` ved oppstart.
**Status:** pågående migrering, **ikke** ferdig revfri app eller godkjent Premium.
**Bindende regel:** kun de tre låste, originale levende skogstrollene, aldri malt inn i låst landskap.

## Bekreftede gjenværende kilder

| Prioritet | Komponent/kode | Funn på baseline | Tiltak |
| --- | --- | --- | --- |
| P0 | `laer-litt-mer/index.html` `journeyFoxSvg()` | Tegner direkte rev i eldre v4/v5-reisenoder | **Denne committen:** bruk valgt `journeyTrollMarkup()` med egen live `TrollActor`-vert |
| P0 | `index.html` `.dashboard-mascot.premium-fox` | Inneholder direkte inline reve-SVG i eldre dashboard | Ikke fjern før aktiv/flaskevisning, fallback og Hjem-layout er kontrollert |
| P0 | `index.html` `svg.story-fox` og `svg.story-lion` | Dekorative dyreillustrasjoner finnes fortsatt i eldre hjemskjerm-DOM | Fjern som egen testet UI-endring, ikke erstatt med statiske trollbilder |
| P1 | `index.html` `.journey-fox`, `.journey-fox-marker`, `.fox-guide`, `.premium-otter` | Gamle stil- og presentasjonsankre finnes i historiske skjermer | Revider synlig runtime før selektorer fjernes |
| P1 | `laria-troll-runtime-v1.js` | `IMAGE_SELECTORS` gjenbruker fortsatt gamle `fox`-klasser som migreringsankre | Behold til reelle knapper/komponenter er migrert; ikke slett vilkårlig |
| P0 kunst | Grovanova og Kinnaklova | Godkjent ren originaltro master mangler; tidligere retusjkandidater ble avvist | Egen kunstgodkjenning, ingen endring av originale SHA-filer |

## Prinsipper for videre opprydding

- **Ikke slett CSS-klasser bare fordi de heter `fox`.** Flere peker på ekte TrollActor-verter og opprinnelige aktiviteter. Bytt først til egen felles komponent og bevis at barneprogresjon og navigasjon virker.
- Ingen `LARIA_FOX.source`-fallback skal vise gammel rev ved første opptegning. Korrekt barnvalg må være kjent før bilde vises.
- Ingen nye dekorative, statiske troll som kopierer det levende valgte trollet. Ingen doble karakterer på samme skjerm.
- Verifiser også onboarding, Basecamp, de fire fagene, oppgaver, Utforsk, Oppdrag, Kloden, profil, belønning, modaler og avvikende skjermstørrelser.
- Ny kode skal ha både kontraktstest og virkelig Chromium/WebKit-test på identisk PR-HEAD. Skriftlig rapportering av avvik er ikke visuell godkjenning.

## Første deloppgave: revisjon av gamle reisenoder

`journeyFoxSvg()` skal fjernes og de to eksisterende reisenodene skal bruke samme `journeyTrollMarkup()` med `assets/gangemagi-troll/<godkjent-id>.webp`. `LARIA_TROLL_ACTOR` synkroniserer bildet ved valgt troll. Eldre node-ID, progresjon, kartkoordinater, rute og klikkhandler endres ikke.

**Ferdigkriterium:** ingen hardkodet inline reve-SVG i v4/v5-aktører; originale tre skogstroll kan velges uten feil på første opptegning; tester er grønne; vurdert på faktisk app. Øvrige punkter over er fortsatt åpne.
