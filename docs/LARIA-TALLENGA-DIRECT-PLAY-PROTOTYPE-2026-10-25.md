# Tallenga direkte lek: isolert prototype (25.10.2026)

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
