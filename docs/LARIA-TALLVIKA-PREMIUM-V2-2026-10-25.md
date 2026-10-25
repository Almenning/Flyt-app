# Læria / Tallvika V2 – visuell rekonstruksjon (draft)

Dato: 25.10.2026. Baseline: produksjon etter PR #222, commit `32ea548`.

## Hvorfor endringene er nødvendige

Gjennomgang av faktiske Chromium-/WebKit-bilder av den publiserte Tallvika viser:

1. iPhone: 1672 × 941-originalen krympes til et lite panorama og etterfølges av tre generiske, tekstbaserte knapper. Den beste illustrasjonen i appen mister sin funksjon som navigasjon.
2. iPad stående: fjordbildet er sterkt visuelt, men med en flat «Plassverdi»-stripe og mye ubenyttet skjermplass.
3. iPad liggende: aktiviseringsflatene i hyttene er vanskelige å lese som berørbare; appens generelle navigasjon og den illustrerte verdenen henger dårlig sammen.
4. Skogstrollet er fortsatt en original transparent WebP plassert foran et flatt bakgrunnsbilde. Det er **ikke** et rigget, levende vesen. Målkravet om kvalitetsrik karakteranimasjon kan ikke oppfylles i denne PR-en uten nye malte kildelag.

## Fase 1: tilgjengelige aktivitetshytter

- Den godkjente Tallvika-PNG-en gjenbrukes uendret som *fullstendig*, ukroppet panorama.
- Tre nye illustratede innganger viser utsnitt fra nøyaktig den samme PNG-en. Utsnittene er bare CSS-vinduer, ikke nye eller endrede illustrasjoner.
- Alle hytter er vanlige, semantiske knapper med store trykkflater og fokusmarkering. Ingen ny navigasjons- eller læringsmotor introduseres.
- iPhone stående: tre brede bildefortellinger under hele fjordbildet, ikke generiske tekstkort.
- iPad stående: de tre husene samles i en illustrert rekke under fjordbildet; tydelig «Hvor vil du leke?».
- iPad liggende / Mac: illustrasjonen vises på venstre side med tre aktivitetshytter og frivillig oppdrag til høyre; mindre tomrom og kortere vei til lek.
- iPhone liggende: to kolonner når skjermen er lav, uten å beskjære originalbildet.
- Husenes originale skilt i maleriet bevares. Kun visuelt tydelige, diskrete inngangsmarkører legges over hvert hus i store visninger.
- Aktivitetskortene starter de eksisterende `openMultiplicationLab`, `openFractionLab` og Gangetabell-visningen. «Neste eventyr» forblir frivillig og bruker den samme lagrede progresjonen.
- Skogtrollfiler, klassevalg og progresjon røres ikke. CSS støtter `prefers-reduced-motion`.

## Dette er fremdeles **ikke** premium-godkjent

**Animasjon av skogstroll er utenfor scope.** Den gamle PNG/transparent-WebP-komposisjonen er en midlertidig løsning og skal ikke omtales som fullført rigging. PR #220 og issue #221 dokumenterer mangel på skjult hår-, arm- og klesillustrasjon. Ingen automatisk inpainting, falske lemmer eller hoppende PNG-er skal brukes til å omgå dette.

## Aksept før merge

1. Automatisk kode- og kontraktkontroll samt Chromium og **WebKit** på iPhone 390×844, iPhone liggende, iPad stående og liggende.
2. Verifiser at alle tre illustrerte kort er synlige, min. 90 px høye, har kildetro CSS-bilder, er tastatur-/berørbare og leder til riktig spill.
3. Ingen horisontal overflow, ingen dobbelkopierte malte skilt, ingen beskåret hovedillustrasjon eller mørk legacy-footer.
4. Alle tre originale troll kan velges, byttes og gjenfinnes etter reload. Gammel progresjon og aktuelle oppdrags-ID-er er uendret.
5. Sammenlign **faktiske** nye WebKit-skjermbilder side ved side med produksjon, og vurder spesielt figurens forankring, kontrast, orden i visuell hierarki og barns tilgang på alle tre spillene.
6. Brukergodkjenning av helheten før publisering. Ingen automatisk merge.

## Neste fase

Reell 2D-lagbasert trollpilot (først storesøster) må følge eksisterende kunstkontrakt i issue #221, testes med idle, vinke, tenke, hint og juble i Gangemagi på ekte Safari/WebKit, og først deretter integreres i Tallvika. Navigasjonen skal kunne ta imot TrollActor uten å endre barnets lagrede identitet.

Låst prioritet: bedre barneopplevelse og kvalitetsriktig karakterkunst foran antall funksjoner.
