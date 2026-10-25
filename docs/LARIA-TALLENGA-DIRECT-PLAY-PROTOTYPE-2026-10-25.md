# Tallenga direkte lek: isolert prototype (25.10.2026)

> **AKTUELL STATUS (25.10.2026, superseder tidlig prototypetekst nedenfor):**
> Matematikkforsiden har nå egne motiver for Gangemagi, Brøklab og
> Gangetabellen samt separate SVG-dybdelag i Tallenga-scenen.
> **De låste trollene er fjernet fra komposisjonen**, ikke godkjent integrert
> eller animert. De tilgjengelige originalene er flate små WebP-filer uten
> redigerbare kroppsdeler. Ikke bygg flere innlimte figurvarianter.
> Et nytt identitets- og riggingkrav finnes i
> `docs/LARIA-TALLENGA-TROLL-RIG-ASSET-CONTRACT-2026-10-25.md`.
> De tidligere statusavsnittene under er historiske. **Ingen visuell
> sluttgodkjenning, merge eller publisering foreligger.**



## Formål
Produktforsøk: Er en levende fagforside med direkte inngang til lekene bedre enn et obligatorisk fem-steders reisekart?

## Aktivering og reversering
- Koden er avgrenset til branch `feat/laria-tallenga-direct-play-prototype-20261025`.
- Åpne Læria fra branch-basert preview/utviklingsserver med `?tallenga=prototype` og en ferdig opprettet barneprofil på 1. eller 2. trinn.
- På Hjem: trykk **Matte**. Da åpnes Tallenga-forsiden med Gangemagi, Brøklab, Gangetabellen og et valgfritt «Fortsett eventyret».
- **Vis gammelt kart** gir umiddelbar sammenligning i samme besøk.
- Uten query-parameter forblir alle fag og dagens reisekart uendret. Ingen databaseendringer eller migreringer.

## Implementasjon
- `tallenga-direct-play-prototype.js`: presentasjonslag og delegering til eksisterende funksjoner: `openMultiplicationLab`, `openFractionLab`, matematikk-laboratoriets tabellvariant og `startJourneyNode`/eksisterende sesjon.
- `tallenga-direct-play-prototype.css`: scoped premium-layout med eksisterende godkjent Tallenga-art, godkjent trolltrio, tilpasset mobil og redusert bevegelse.
- `index.html`: to nye referanser. Ingen andre produktfiler endres.
- Reiser og progresjon er beholdt, og Kloden/Kartene er ikke endret.

## Avgrensninger
- Dette er en interaktiv navigasjonsprototype, ikke en godkjent endelig illustrasjon eller fullverdig animert TrollActor. Godkjent trollillustrasjon er brukt uten å regenerere utseende; levende 2D-rigging gjøres i separat pilot.
- Prototypen inneholder ingen automatisk utrulling eller publisering.
- GitHub Pages på main viser **ikke** grenens endringer. Lokal/serverbasert preview eller Vercel branch deployment kreves for praktisk visning.

## Akseptansekriterier før merge
1. iPad Safari liggende og stående: tydelig fagforside, alle tre aktivitetsknapper overlever retur fra spill, tilpassede trykkflater.
2. iPhone Safari: ingen horisontal scrolling og lesbar korttekst; VoiceOver og tastaturfokus på interaktive elementer.
3. Gangemagi kan åpnes, spille, og returnere til Tallenga uten tap av fremgang.
4. Brøklab kan åpnes, brukes og returnere uten tap av fremgang.
5. Gangetabellen går til riktig tabellmodus, også etter returnering.
6. «Fortsett eventyret» bruker *eksisterende* anbefalt matematikkoppdrag, lagrer som før; gjennomfør et helt oppdrag.
7. Den gamle kartflyten og alle andre fag er identiske uten URL-flagget.
8. Sammenlign med faktisk registrert brukeradferd: antall trykk til favorittspill, tid til første oppgave, returbruk, og barnets forståelse.

## Status
Kode innført på isolert branch. Formell Chromium- og WebKit-kjøring og skjermbilder er ikke gjennomført i denne iterasjonen. Merge og publisering er sperret i påvente av tester og produktgodkjenning.


## Oppdatering 25.10.2026: fjordscene og låste troll
- Den håndkomponerte fjord-/fjellillustrasjonen `tallenga-fjord-scene-v1.svg` er inspirert av brukerens referansefoto av Ryssdalshornet. Den er en selvstendig Tallenga-scene, **ikke** Kjøsnesfjorden/Grovanova og gjør ikke krav på fotografisk eksakt fjellsilhuett.
- De tre godkjente og identiske originalfigurene er kopiert som Git-blob-SHA fra PR #218/#211: `assets/skogstroll/storesoster.webp` (`5d5f80c15e367bbd4600013057c7820a7b2e2adb`), `lillesoster.webp` (`661107cd231a72b14aeca4f7bc3c826130734576`) og `lillebror.webp` (`5f92c89319ec372b980c75eb3d538a4f4f851a7c`). Disse filene er ikke regenerert, malt om eller erstattet.
- Både tre separate herofigurer og spillkort bruker kun de godkjente filene. Ingen syntetiske troll i produksjonsmarkup. Rolig dekorativ bevegelse av figurcontainere er **ikke** 2D-rigging; den separate levende-TrollActor-piloten krever egen godkjenning og må ikke påstås ferdig her.
- Eksisterende Gangemagi, Brøklab og Gangetabell er koblet til tre synlige, separate kort. `Neste eventyr` bruker eksisterende recommended-node uten dataendringer.
- Dedikert Playwright-test i `tests/laria-tallenga-direct-play.playwright.js` og GitHub Actions `.github/workflows/laria-tallenga-direct-play.yml` tester i Chromium og WebKit på iPhone og iPad og arkiverer faktiske screenshots.
- Fremdeles bare `?tallenga=prototype` i PR #220. Ingen merge/publisering til main. Testkjøring/visuell godkjenning skal kontrolleres på eksakt HEAD før integrasjon med de parallelle draft-PR-ene.
