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
- Egen GitHub Actions-jobb installerer Chromium og WebKit med systemavhengigheter, kjører eksakt PR-head og laster opp bildene som artefakt. Dette erstatter ikke fysisk enhetstest, men gir reproduserbar WebKit-kontroll.
- Lokal Playwright WebKit kan ikke startes i Work-miljøet fordi nødvendige GTK/GStreamer-biblioteker mangler. Dette omtales ikke som en enhetstest.
- GitHub Actions-kjøring `39034969233` besto 17. oktober 2026 og lagret WebKit-bilder ved iPhone-størrelse (390×844) og iPad liggende (1180×820), samt supplerende Chromium-bilder. Artefaktet er reproduserbart, men kjøringen brukte en eldre merge-snapshot (`2d6f25d`) og er derfor **ikke** dokumentasjon for den nåværende direkte-tegnevakten.
- De tidligere bildene viser at det ordinære v25-tegnelaget fortsatt kunne overmale forhåndsvisningen. De kan derfor ikke brukes som visuell godkjenning av Oppdagelsesglobusen. Geometri, grenser og landvalg var intakte, men den visuelle fase-1-vurderingen står åpen.
- Den skjerpede Playwright-kontrollen krever at hver stillestående fangst har minst én synlig, koordinatforankret illustrasjon, og skiller aktiv pointer-bevegelse fra en hengende interaksjonsmarkør. En ny WebKit-artefakt fra gjeldende PR-head er fortsatt påkrevd.

## Visuell vurdering og kjent avvik

- Fase 1 er fortsatt **ikke godkjent** som premiumopplevelse. Den visuelle gjennomgangen viste at terrengsymbolene var for svake i de første artefaktene selv om grunnkartet var korrekt.
- Den konkrete rotårsaken var at et hengende bevegelsesflagg undertrykte detaljlaget også etter at globusen stod stille. Dette er rettet og verifiseres videre med den skjerpede bildekontrollen.
- Neste visuelle iterasjon må øke den lesbare, illustrerte terrengdybden — særlig fjell, skog, ørken og dyr — uten å endre landgeometri eller gjøre illustrasjonene skjermforankrede.
- Iterasjon 2 legger nå inn et større, koordinatfestet terrenglag (fjellrygger, skogklynger og Sahara-dyner) før de mindre detaljene. Hensikten er lesbarhet på verdensnivå og iPhone, uten å gjøre kloden til et flatt dekorasjonskart. Ny WebKit-artefakt er fortsatt påkrevd før visuell vurdering.
- Rotårsaken til at tidligere bilder fortsatt kunne vise den ordinære rendereren er funnet: `globe-v25-renderer.js` hadde direkte tegnekall fra resize-/modusobservatører, utenom `window.drawGlobe`. En snever forhåndsvisningsvakt sender bare disse kallene til Oppdagelsesglobusen når URL-flagget er satt. Uten flagget er koden uendret.
- Aktiv QA-PR er nå #172. Den erstatter lukket draft-PR #170 for å få en ny merge-snapshot og WebKit-artefakt fra gjeldende hodecommit. Begge er/var draft; ingen er slått sammen eller publisert.
- Lokalt forsøk på å installere WebKit-avhengigheter ble stoppet av Work-sandkassens systempakkebegrensning (`apt` kan ikke sette den nødvendige `_apt`-gruppen). Dette er en miljøbegrensning, ikke en bestått WebKit-test eller en fysisk enhetstest.
- En statisk isolasjonskontroll beskytter nå forhåndsvisningsflagget, den UTF-8-kodede geografietiketten, lastrekkefølgen og vakten mot direkte v25-tegnekall også når lokal WebKit ikke kan starte.
- En transportfeil på draft-grenen hadde tegnkodet deler av den eksisterende `globe-v25-renderer.js` feil og inkludert tre uvedkommende cache-versjonsendringer for Gangetabellen i `index.html`. Begge filene ble gjenopprettet fra `main`, og kun den nødvendige forhåndsvisningsvakten/innlastingen ble lagt tilbake. Den statiske kontrollen avviser nå også denne typen tegnkodingsfeil.

## Neste arbeidsoppgave

1. Kjøre og vurdere en ny WebKit-artefakt fra gjeldende PR-head etter rettelsen mot låst referanse, med særlig fokus på tydelighet i verdens- og regionnivå.
2. Forsterke første illustrasjonslag der dette trengs, fortsatt kun i forhåndsvisningen.
3. Kontrollere at samme landvalg fungerer med og uten forhåndsvisningsflagget.
4. Ikke integrere bryter, slå sammen eller publisere før brukerens uttrykkelige godkjenning.


## Videreføring i SuperKlode chat1 – 17. oktober 2026

- Identifiserte aktiv draft-PR #172 og bekreftet at main ikke er oppdatert med prototypen.
- Den nyeste tilgjengelige tidligere WebKit-kjøringen (`39044389347`) besto og produserte artefakt `12105223568` fra merge-commit `4b16a413...`. Den er **ikke** en visuell godkjenning av senere endringer.
- Isolert forhåndsvisning: korrigerte paletten bort fra unaturlige blå/lilla kontinentfarger og mot varmere naturtoner.
- La til tettere, longitude/latitude-forankrede fjell-, skog- og ørkenmarkører samt større terrenglinjer som følger samme projeksjon. Alle landbaserte terrengmarkører klippes nå til eksisterende landgeometri, mens havillustrasjoner tegnes separat.
- Rettet unødvendig gjentatt resize/tegning i forhåndsvisningens intervalvakthold. Ny tegning skjer ved første aktivering, reell modusendring eller vanlig interaktivitet.
- Ingen endringer i geografiske data, landvalg, ordinær globus, andre fag eller lagret progresjon. Ingen sammenslåing eller publisering.
- **Verifisering gjenstår:** GitHub Actions/WebKit må fullføre for commit `68218b25c68d8f724f9149baf9ce40e08499829f`; sammenlign tilhørende artefakt visuelt med de låste referansene før fase 1 eventuelt kan godkjennes. De nye tegningene er ikke påstått fysisk enhetstest.
- **Neste konkret:** Vurder faktisk WebKit-bilde ved verden, Europa, Norge, Japan og Brasil; forbedre illustrasjonens premiumdybde og sjekk at små land fortsatt er klikkbare. Ikke integrer visningsbryteren før godkjenning.


## SuperKlode chat1: videreført arbeidsøkt 17. oktober 2026

**Arbeidsstatus:** Fase 1 visuell prototype på egen gren; draft-PR #172; ingen integrasjon eller publisering.

### Gjennomført på aktiv gren

- Oppdagelsesglobusen bruker eksisterende geometri, input og progresjon, men har eget tegnelag som bare aktiveres med forhåndsvisningsflagget.
- Varm naturpalett, flere geografisk forankrede fjell-, skog-, sand- og naturmarkører, nærzoomdetaljer i Norge, Japan og Brasil, samt deterministisk geografisk tekstur som kommer frem ved zoom.
- Markering av valgt land er dempet slik at den ikke skjuler landskapene. Fjernet misvisende, sammenhengende skogstriper mellom regioner.
- La til stiliserte, geografisk forankrede elveløp for Amazonas og Nilen. Landgeometrien er fortsatt fasit.
- Rettet tre konkrete feil: (a) gjentatt unødvendig tegning i inaktiv forhåndsvisning, (b) klassisk v25-tegner som gjennom callback overmalte prototypen, og (c) window.globeZoom som var udefinert fordi globeZoom er en toppnivåvariabel, og dermed ga NaN i WebKit Canvas.
- Ny Playwright-QA dekker ordinær og illustrert globus, faktisk muse-/pekerdrag, gjenoppretting av detaljer, tegnestabilitet i hvile, projeksjonsretur, landtreff Norge/Japan/Brasil og visuell forskjell på canvas.
- Testet med WebKit iPhone stående/liggende og iPad stående/liggende, samt Chromium iPad liggende. Dette er nettleserskjermstørrelser, ikke fysiske Apple-enheter.
- Egen GitHub Actions-jobb kjører på relevante pushes til utviklingsgrenen. Statisk kontroll krever UTF-8-etiketter, ikke gamle fargekoder.

### Reproduserbar teststatus

- Actions #39049185273: bestått ved commit c2db52c.
- Actions #39049853428: bestått ved commit a407f4b med faktisk pekerdrag og kontroll av idle-tegning.
- Actions #39049952229: bestått ved commit b75c9a7 med fjernede skogstriper.
- Actions #39050110079: bestått ved commit ec799bf4d2028b940f9c935bb60dc45401d1f0c5 med geografiske nærzoomdetaljer. Bildedokumentasjon i artefakt 12107915134.
- Bildene dokumenterer visuelt forskjellig oppdagelsesvisning og intakt ordinær globus. Testene er ikke i seg selv en godkjenning av premiumkvalitet.

### Åpen risiko og neste steg

1. Gjennomgå faktiske sammenligningsbilder for verden, Europa, Norge, Japan og Brasil opp mot låste referanseillustrasjoner. Fase 1 er ikke visuelt godkjent.
2. Forbedre større fjellkjeder, fjorder, skog og regionale detaljer etter vurdering uten feilplassert kartdekor.
3. Test på fysiske iPad/iPhone Safari før publisering, og små land og øyer utover dagens tre karttreff.
4. Arbeidsgrenen avviker fra gjeldende main og krever oppdaterings-/konfliktvurdering for senere fletting.
5. IKKE integrer permanent «Enkel | Oppdag»-bryter, flett til main eller publiser uten uttrykkelig godkjenning.

## Videreføring – 19. oktober 2026: tresteds oppdagelsessti

- Flyten rundt Oppdag var visuelt forbedret, men hadde fortsatt en svak motivasjonsbue: «Neste sted» ga ingen synlig følelse av en liten reise.
- Hvert kontinentkort viser derfor nå en valgfri, rolig sti med tre ekte geografiske stopp. Første trykk går direkte til første sted, hvert stopp oppdaterer den projiserte kartmarkøren og reven reagerer én gang.
- Kortet viser `0 av 3`, `1 av 3` osv. med små prikker. Etter tredje stopp får barnet en kort avslutning og valget «Se stedene igjen». Det er ingen quiz, poengpress eller progresjonslås.
- Endringen er avgrenset til Oppdag-kortets presentasjon. Landdata, landtreff, lagret fremgang og Enkel-globen er urørt.
- Verifisert lokalt: `node tests/laria-discovery-globe-phase1-static.js`, `npm run test:node` (384/384), og `git diff --check`.
- Neste kontroll før eventuell PR: faktisk WebKit-/Chromium-bilde og trykkflyt for invitasjon, tre stopp, replay og landvalg på iPhone/iPad.
