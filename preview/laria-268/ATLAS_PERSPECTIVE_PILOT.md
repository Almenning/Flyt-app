# Læria: atlasperspektiv (produktbeslutning, pilot)

## Hvorfor vi endrer perspektiv
De små, sammenpressede landformene på den roterende kloden gjorde geografien vanskelig å bruke som primært læringskart på telefon og iPad. Flere runder med kosmetiske justeringer løste ikke lesbarheten. **Hovedkartet er nå et flatt interaktivt atlas; den ekte roterende kloden beholdes som tredje modus.**

## Låst oppførsel
- **Utforsk**: atlas med ekte geografiske landpolygoner, panorering med én finger, zoom under fingertuppene (inkl. tohånds-pinch) og trykk på faktiske land.
- **Min verden**: samme atlas og geografi med progresjonsfarger; synlig tegnforklaring plassert over kartet, aldri over områdeknappene.
- **Kloden**: behold original roterende ortografisk projeksjon og læringskort.
- Områdevalg er Hele verden, Norden samt Europa, Afrika, Asia, Nord-Amerika, Sør-Amerika og Oseania.
- Land med svært små konturer får en diskret velgbar markør. Tap på ordinære land bygger på *point-in-polygon*, ikke tilfeldig nærmeste hovedstad.
- Eksisterende oppgaver, land-ID-er, fakta, landkort, «Lær mer», lagring og progresjon skal ikke endres. Atlas og kloden bruker samme utvalg.
- Atlaset kan dekoreres med relief og illustrerte steder fra eksisterende Læria-illustrasjonsbibliotek, men alle elementer må bruke geografiske koordinater. Kartet kan aldri erstattes med en fotografert eller AI-tegnet, uregistrert mockup.

## Visuell retning
Kartet skal oppleves som et fysisk, rikt illustrert atlas i Lærias eventyrmiljø: harmoniske kontinentpaletter, diskret terrengrelieff, landnavn som ikke kolliderer, rammeverk i krem og treverk, og store berøringsflater. Komponenter og kart skal ikke strekkes. «Kartet» er overskrift i atlasmodus, «Kloden» i sfæremodus.

## Godkjenning og fremdrift
Dette dokumenterer en **pilot**. Den er ikke produktgodkjent kun fordi browser-testene er grønne. Sammenlign faktiske Safari-bilder fra iPhone stående og iPad stående/liggende. Test langvarig panorering, zoomforankring, korrekt landvalg (inkl. Norge), små land, et områdevalg, Progresjon, tilbake-navigasjon, og bytte til Kloden. Ikke merge uten alle exact-head CI-kontroller og visuell QA. Legg aldri til flere aktiviteter som kompensasjon for en dårlig kartopplevelse.

Rollback: Pilot isolert til `atlas-perspective-v1.js`, `atlas-perspective-v1.css`, små kontrolltester og CSS/JS-importer i `index.html`. Original sfærisk tegne- og gesturemotor beholdes uendret.
