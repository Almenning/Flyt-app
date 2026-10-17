# Oppdagelsesglobusen â arbeidslogg

**Gren:** `feat/laria-discovery-globe-phase1-20261017`  
**Status:** Fase 1 pÃ¥gÃ¥r. Kun isolert forhÃ¥ndsvisning; ingen produksjonspublisering eller integrasjon.

## Kartlegging

- Dagens motor ligger i `laer-litt-mer/index.html`: `globeProject`, `globeInverse`, `drawProjectedLine`, `pickGlobeCountry`, zoom- og pointerlogikk. Den bruker sanne landgeometrier fra `WORLD_COUNTRIES` og tegner ortografisk projeksjon pÃ¥ `#globe-canvas`.
- Aktiv illustrert renderer er `globe-v25-renderer.js`. Den bygger pÃ¥ samme projeksjon, men er dagens ordinÃ¦re renderer og skal ikke rÃ¸res i denne fasen.
- Tidligere renderer (`globe-v22`, `globe-v24`, `globe-v25`) demonstrerer riktig retning: koordinatfestede symboler og biomevasker fÃ¸lger `globeProject`, mens statisk equirectangular kartkunst ikke er brukt i aktiv runtime.
- Det gamle `globe-map-art-v2-equirect.png` er eksplisitt uegnet som aktiv flate: det er ikke geografisk registrert mot gjeldende projeksjon og kan derfor forskyve land/kunst pÃ¥ Safari.

## RotÃ¥rsak fra tidligere forsÃ¸k

1. Illustrasjon og geometri ble visuelt blandet i den ordinÃ¦re globusen, slik at kvalitetseksperimenter kunne endre barnets eneste visning.
2. Statisk eller skjermforankret dekor har risiko for Ã¥ drive i forhold til landkonturer ved rotasjon/zoom.
3. HÃ¸y detaljmengde under bevegelse kan gi unÃ¸dvendig arbeid pÃ¥ iPhone/iPad.

## Fase 1-lÃ¸sning

- Ny prototype kjÃ¸res kun nÃ¥r URL-en inneholder `?discovery-globe-preview=1`.
- Den bruker samme canvas, landgeometri, projeksjon, input, valg og zoom som den enkle globusen, men bytter bare tegnelaget etter at dagens renderer er lastet.
- Hvert terrengstrÃ¸k og hver detalj er lagret som longitude/latitude og blir projisert ved tegning. Ingen AI-karttekstur eller nye landdata lastes.
- Under aktiv berÃ¸ring er kun grunnkart og store terrengformer synlige. Detaljer tegnes igjen nÃ¥r bevegelsen stopper.

## FÃ¸rste avgrensning og bevisste avvik

- Dette er et visuelt fundament, ikke en godkjent permanent Â«Enkel | OppdagÂ»-bryter.
- FÃ¸rste detaljnivÃ¥ prioriterer Europa, Afrika, Asia, Norge, Japan og Brasil. Hele verden fÃ¥r natursoner, men har ennÃ¥ ikke full illustrasjonsdekning.
- Den eksisterende globusen er ikke endret uten forhÃ¥ndsvisningsflagget.

## UtfÃ¸rt kontroll i denne Ã¸kten

- `node --check laer-litt-mer/discovery-globe-phase1.js`: bestÃ¥tt.
- Det er lagt til en egen Playwright-kontroll (`tests/laria-discovery-globe-phase1.playwright.js`) som tar bilder av verden, Europa, Norge, Japan og Brasil og bekrefter tre detaljnivÃ¥er og landvalg.
- Egen GitHub Actions-jobb installerer Chromium og WebKit med systemavhengigheter, kjÃ¸rer eksakt PR-head og laster opp bildene som artefakt. Dette erstatter ikke fysisk enhetstest, men gir reproduserbar WebKit-kontroll.
- Lokal Playwright WebKit kan ikke startes i Work-miljÃ¸et fordi nÃ¸dvendige GTK/GStreamer-biblioteker mangler. Dette omtales ikke som en enhetstest.
- GitHub Actions-kjÃ¸ring `39034332797` besto 17. oktober 2026 og tok reproduserbare WebKit-bilder ved iPhone-stÃ¸rrelse (390Ã844) og iPad liggende (1180Ã820), samt supplerende Chromium-bilder. Artefakt: `laria-discovery-globe-phase1-952e9885470daacd32f0b0ac67b5ed986bb3a9b7`.
- Bildene er visuelt gjennomgÃ¥tt for verden, Europa, Norge, Japan og Brasil. Grunnkart, projeksjon, grenser og landvalg er intakte; kontrollen bekrefter ogsÃ¥ at Oppdagelses-rendereren faktisk eier tegnelaget etter atlas-overgangen.
- En oppfÃ¸lgende kontroll krever nÃ¥ at hver stillestÃ¥ende fangst har minst Ã©n synlig, koordinatforankret illustrasjon, og skiller aktiv pointer-bevegelse fra en hengende interaksjonsmarkÃ¸r. Denne kontrollen besto i GitHub Actions-kjÃ¸ring `39034695648`.

## Visuell vurdering og kjent avvik

- Fase 1 er fortsatt **ikke godkjent** som premiumopplevelse. Den visuelle gjennomgangen viste at terrengsymbolene var for svake i de fÃ¸rste artefaktene selv om grunnkartet var korrekt.
- Den konkrete rotÃ¥rsaken var at et hengende bevegelsesflagg undertrykte detaljlaget ogsÃ¥ etter at globusen stod stille. Dette er rettet og verifiseres videre med den skjerpede bildekontrollen.
- Neste visuelle iterasjon mÃ¥ Ã¸ke den lesbare, illustrerte terrengdybden â sÃ¦rlig fjell, skog, Ã¸rken og dyr â uten Ã¥ endre landgeometri eller gjÃ¸re illustrasjonene skjermforankrede.
- Iterasjon 2 legger nÃ¥ inn et stÃ¸rre, koordinatfestet terrenglag (fjellrygger, skogklynger og Sahara-dyner) fÃ¸r de mindre detaljene. Hensikten er lesbarhet pÃ¥ verdensnivÃ¥ og iPhone, uten Ã¥ gjÃ¸re kloden til et flatt dekorasjonskart. Ny WebKit-artefakt er fortsatt pÃ¥krevd fÃ¸r visuell vurdering.

## Neste arbeidsoppgave

1. Vurdere den nyeste WebKit-artefakten etter rettelsen mot lÃ¥st referanse, med sÃ¦rlig fokus pÃ¥ tydelighet i verdens- og regionnivÃ¥.
2. Forsterke fÃ¸rste illustrasjonslag der dette trengs, fortsatt kun i forhÃ¥ndsvisningen.
3. Kontrollere at samme landvalg fungerer med og uten forhÃ¥ndsvisningsflagget.
4. Ikke integrere bryter, slÃ¥ sammen eller publisere fÃ¸r brukerens uttrykkelige godkjenning.
