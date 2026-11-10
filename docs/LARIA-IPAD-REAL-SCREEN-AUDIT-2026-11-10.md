# Læria Premium 2.0 – reell visuell iPad-kontroll, 10. november 2026

**Status: IKKE PREMIUMGODKJENT.** Dette er en gjennomgang av faktisk app, ikke en ny illustrasjon eller en godkjent release.

## Sporbare bevis
- Kun eksisterende [PR #243](https://github.com/Almenning/Flyt-app/pull/243), draft. Ikke merge eller deploy.
- App-/testkilde: `c8ae248ec90a98e00bde3b5c868396a6e4866275`.
- Godkjenningsmetadata ble oppdatert dokument-only i `d691242a2edc339f714e8b6dd54ccd11d814c13d`; app- og testtreet er identisk.
- [GitHub Actions, ekte referanselayout og WebKit/Chromium](https://github.com/Almenning/Flyt-app/actions/runs/42775701373): `success`.
- Faktisk artefakt [laria-reference-devices-c8ae248](https://github.com/Almenning/Flyt-app/actions/runs/42775701373/artifacts/13744036782), ID `13744036782`, inneholder reelle bilder og gjennomførte aktivitetsklikk.
- Felles femskjermsoversikt (reelt WebKit): `laria-reference-layout/laria-actual-ipad-landscape-five-screens.png` og `laria-reference-layout/laria-actual-ipad-portrait-five-screens.png`.
- Referanseoppsettet er opt-in via `?app=laria&lariaReferenceLayout=1`; bildene beviser ikke at dette er publisert i ordinær app.

## Visuell kontroll: iPad liggende 1366 × 1024

| Skjerm | Faktisk observert | Vurdering |
| --- | --- | --- |
| Hjem, Grovanova | En bred gradientstripe over bildet og fire innmalte fagkort nederst, samtidig som fagskiltene til venstre er synlige. Innmalte figurer er ikke den selvstendige, valgte TrollActor. | **P0, kunst blokkert.** Skal ikke løses med en ny overliggende meny, bildeblurring eller dobbel scene. |
| Norsk, Eggenipa | Testvarianten viser én femskiltsgruppe til venstre, én fag-/stedsplakett til høyre, felles Læria-topp og separat valgt TrollActor. Ingen synlig aktivitetsskiltrekke på høyre side i fagmenymodus. | **Teknisk lovende, ikke visuelt godkjent.** Krever produkteiers sammenligning med Grovanova-fasiten. |
| Matte, Tallvika | Tilsvarende ene venstremeny og høyre fagplakett; låst fjellmotiv, separat valgt troll. | **Teknisk lovende, ikke visuelt godkjent.** Kontroller aktivitetstilstand og `Neste eventyr` i samme venstre kolonne. |
| Engelsk, Kinnaklova | Innmalt tittel, Words/Sentences/Reading på ulike steder og avvikende knappesystem. Referanseoppsettet er bevisst ikke aktivert på denne originalen. | **P0, kunst blokkert.** Ren master må bevare kirke, fjell og kyst uten innmalt navigasjon. |
| Geografi, Nordlysleiren | Riktig enkle venstremeny, høyre fagplakett og separat TrollActor, men bakgrunnen oppleves mykere/lavere oppløst enn Norsk/Matte. | **P1, kunstkvalitet.** Kontroller høyoppløst, originaltro artkandidat separat. |

## Visuell kontroll: iPad stående 1024 × 1366

- **Hjem:** Scenen blir smal med synlige mørke sidefelt; gamle kort og nederste navigasjon konkurrerer med den låste femskjermsreferansen. Kan ikke premiumgodkjennes som fullskjerms Hjem.
- **Norsk, Matte, Geografi:** Fem valg venstre og kun én stor fagplakett høyre. Fjellene er synlige, og ett valgt troll er en separat brikke. Ingen visuelt godkjent sluttkomposisjon foreligger.
- **Engelsk:** 1672 × 941-originalen beskjæres i stående; de innmalte aktivitetsskiltene og den store dekorative tittelen passer ikke felles komponentlogikk. Et nytt DOM-skilt oppå dem ville være feil.
- **Geografi spesielt:** Kildebildet er 1024 × 704, synlig mykere ved oppskalering til stående iPad. Ikke bruk skarphetsfilter som kunstig kvalitetsbevis.

## Hva de grønne testene faktisk dokumenterer

`tests/laria-reference-layout-v1.playwright.js` og `tests/laria-reference-mobile-v1.playwright.js` bekrefter kontrollert skiltbytte, reelle aktiviteter, ett valgt troll, tilgjengelige trykkmål og foreldre-gate på faktisk WebKit/Chromium; koden oppgir selv **NOT APPROVED** for bildene. Referanse-testen bruker originale Grovanova og Kinnaklova kun som kunstblokkerte screenshots.

Release-kontrollen ble redusert fra 16 til 8 sperrer gjennom sporbar dokumentasjon på riktig kodeversjon, ikke gjennom kosmetisk godkjenning. De åtte gjenværende sperrene er to manglende rene kunstvarianter, fem enhetsvise visuelle produkteiergodkjenninger og manglende faktisk barnetest.

## Prioritert neste arbeid

1. **P0 Grovanova og Kinnaklova:** Fremskaff *separate* rene godkjenningskandidater, fjern utelukkende innmalt UI. Bevar originale, byte-låste filer og identiske beskyttede fjell-, kirke- og kystdetaljer. Ikke aktiver tidligere avviste retusjer.
2. **P0 iPad femskjermsreview:** Vis ekte WebKit- og Chromium-bilder for én samlet venstreskiltkolonne, én høyre fagplakett, felles ordmerke og ett levende valgt troll. Stopp ved reelle visuelle avvik; ingen oppåmalte dubletter.
3. **P1 Geografi:** Ny ren kilde med kvalitet for stående iPad, men behold godkjent landskap og identitet; ny art må gjennom særskilt visuell kontroll.
4. **Deretter:** Godkjenn først iPad liggende, så stående; mobil/desktop-finalisering, progresjonsregresjon og reell barnetest.

**Endringsvern:** Ingen endringer i main, HverdagsOss, låste kunstoriginaler, TrollActor-identiteter, barnas lagrede progresjon eller godkjenningsflag. Ingen merge, deploy eller publisering.
