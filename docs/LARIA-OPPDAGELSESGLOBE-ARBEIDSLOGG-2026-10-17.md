# Oppdagelsesglobusen – arbeidslogg

**Gren:** `feat/laria-discovery-globe-phase1-20261017`  
**Status:** Fase 1 pågår. Kun isolert forhåndsvisning; ingen produksjonspublisering eller integrasjon.

## Kartlegging

- Dagens motor ligger i `laer-litt-mer/index.html`: `globeProject`, `globeInverse`, `drawProjectedLine`, `pickGlobeCountry`, zoom- og pointerlogikk. Den bruker sanne landgeometrier fra `WORLD_COUNTRIES` og tegner ortografisk projeksjon på `#globe-canvas`.
- Aktiv illustrert renderer er `globe-v25-renderer.js`. Den bygger på samme projeksjon, men er dagens ordinære renderer og skal ikke røres i denne fasen.
- Tidligere renderer (`globe-v22`, `globe-v24`, `globe-v25`) demonstrerer riktig retning: koordinatfestede symboler og biomevasker følger `globeProject`, mens statisk equirectangular kartkunst ikke er brukt i aktiv runtime.
- Det gamle `globe-map-art-v2-equirect.png` er eksplisitt uegnet som aktiv flate: det er ikke geografisk registrert mot gjeldende projeksjon og kan derfor forskyve land/kunst på Safari.

## Rotårsak fra tidligere forsøk

1. Illustrasjon og geometri ble visuelt blandet i den ordinære globusen, slik at kvalitetseksperimenter kunne endre barnets eneste visning.
2. Statisk eller skjermforankret dekor har risiko for å drive i forhold til landkonturer ved rotasjon/zoom.
3. Høy detaljmengde under bevegelse kan gi unødvendig arbeid på iPhone/iPad.

## Fase 1-løsning

- Ny prototype kjøres kun når URL-en inneholder `?discovery-globe-preview=1`.
- Den bruker samme canvas, landgeometri, projeksjon, input, valg og zoom som den enkle globusen, men bytter bare tegnelaget etter at dagens renderer er lastet.
- Hvert terrengstrøk og hver detalj er lagret som longitude/latitude og blir projisert ved tegning. Ingen AI-karttekstur eller nye landdata lastes.
- Under aktiv berøring er kun grunnkart og store terrengformer synlige. Detaljer tegnes igjen når bevegelsen stopper.

## Første avgrensning og bevisste avvik

- Dette er et visuelt fundament, ikke en godkjent permanent «Enkel | Oppdag»-bryter.
- Første detaljnivå prioriterer Europa, Afrika, Asia, Norge, Japan og Brasil. Hele verden får natursoner, men har ennå ikke full illustrasjonsdekning.
- Den eksisterende globusen er ikke endret uten forhåndsvisningsflagget.

## Utført kontroll i denne økten

- `node --check laer-litt-mer/discovery-globe-phase1.js`: bestått.
- Det er lagt til en egen Playwright-kontroll (`tests/laria-discovery-globe-phase1.playwright.js`) som tar bilder av verden, Europa, Norge, Japan og Brasil og bekrefter tre detaljnivåer og landvalg.
- Playwright WebKit ble lastet ned, men kan ikke startes i dette Work-miljøet: nødvendige systembiblioteker (blant annet GTK/GStreamer) mangler. Forsøk på `playwright install --with-deps` ble avvist av miljøets systemrettigheter. Chromium-binary ble heller ikke ferdigstilt før økten stoppet nedlastingen.
- Derfor finnes det **ingen påståtte WebKit-skjermbilder eller godkjent visuell QA fra denne økten**. Testen og bildestien er klare for et miljø som kan starte Playwright WebKit.

## Neste arbeidsoppgave

1. Lage WebKit-bildebevis på iPhone/iPad i tre zoomnivåer og minst fire perspektiver.
2. Kontrollere at samme landvalg fungerer med og uten forhåndsvisningsflagget.
3. Vurdere bildene mot låst referanse før fase 2; ikke integrere bryter eller publisere før brukerens godkjenning.
