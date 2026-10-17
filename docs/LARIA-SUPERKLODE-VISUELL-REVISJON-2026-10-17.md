# Læria SuperKlode: visuell kvalitetsgjennomgang, 17. oktober 2026

## Hva skjermbildene faktisk viser
Brukerens to produksjonsskjermbilder fra iPad/Safari viser «Oppdag» aktivert, med (1) Tsjad i informasjonskortet samtidig som kloden peker mot Nord-Europa, og (2) Tyskland valgt med kartet sentrert mot Europa. Dette er faktiske produksjonsbilder, ikke konseptillustrasjoner.

**Vurdering:** Oppdag er teknisk fungerende, men ennå ikke visuelt et fullverdig premiumprodukt. Det oppleves mer som landpolygoner med noen tegnede objektikoner enn som en oppdagbar sammenhengende verden. Bakgrunnen har langt større motivrikdom enn selve kloden, og konkurrerer med den i stedet for å være rammen rundt den.

## Verifisert rotårsak og første korrektur
- Den valgte land-ID-en beholdes når brukeren snurrer kloden vekk fra landet. Dermed kan landkortet omtale et land som ikke finnes i gjeldende utsnitt.
- Oppdag får en isolert, projeksjonsbasert sjekk etter fullført drag eller zoom. Når valgt lands geografiske anker ikke lenger er synlig, tømmes valgt land og kortet inviterer til å oppdage et nytt.
- Sjekken gjelder kun Oppdag. «Enkel» og eksisterende kart- og progresjonsdata skal ikke endres.
- Automatisk browser-QA skal dekke både Tsjad -> Skandinavia (kortet nullstilles) og Tsjad i skjermbildet (kortet beholdes) på iPad og iPhone.

## Visuelle svakheter som må løses i egen premiumfase
1. **Flate landflater.** Store områder har én nesten ensartet fyllfarge. Foreslåtte biomer og geografi må leses gjennom kontinuerlige illustrerte landskap, ikke løst plasserte dekorikoner.
2. **Manglende lag og dybde.** Et fjellikon gir ikke følelsen av en fjellkjede. Form, lys, skygger og overlappende åsrygger må tegnes konsekvent og skaleres med zoom.
3. **Lite utbytte av zoom.** Verden, region og nærzoom bør vise tre distinkte detaljeringsnivåer: kontinental struktur -> landskapsområder -> stedstypiske detaljer.
4. **For lite oppdagelsesverdi.** Når barnet zoomer inn på et landskap, bør det finnes meningsfull respons (fakta, lyd eller revehint) snarere enn bare grafiske detaljer. Ikke lag flere quizer uten egen lekeverdi.
5. **Stilmismatch.** Illustrert landskap må visuelt samspille med Lærias varme eventyrverden uten å skjule ekte kystlinjer, grenser eller geografisk plassering.

## Bindende akseptkriterier for neste premium-PR
- Behold den originale globusen byte-for-byte uendret og Oppdag som et selvstendig tegnelag.
- Bruk den eksisterende projeksjonen og landgeometrien som fasit. Ingen forvrengte landkonturer eller geografisk feilplasserte landskap.
- Arbeid fra siste main på egen gren. Ikke endre landdata, lagret progresjon, personlige rev, andre fag eller lære-reiser.
- Bygg en helhetlig visuell prototype med georeferert terreng for Norge, Alpene/Tyskland, Sahara/Tsjad, Japan og Amazonas/Brasil. Deretter samme prinsipielle system for øvrige regioner. Ingen fotorealistisk flat tekstur limt på en sfære.
- Lag faktiske WebKit-skjermbilder fra iPad liggende/stående og iPhone liggende/stående med like kamera-utsnitt før/etter.
- Test samspill mellom landvalg, snurring, kartrotasjon, pinch/zoom, rask veksling Enkel/Oppdag og landkortets synlighet. Visuell kontroll må også dekke at eventuell naturdekor er klippet korrekt til landflater.
- Styr etter kriteriet: «Hver aktivitet skal gi barnet noe morsomt å gjøre, noe meningsfullt å oppdage og en grunn til å komme tilbake.» Ikke øk ikonantallet for å oppnå et kunstig «premium»-signal.
- Hold premium-PR i draft til faktisk visuell evaluering av låste referansebilder. Ikke publiser et nytt visuelt redesign kun på grunnlag av grønne tekniske tester.

## Prioritet
Først rett den faktiske kort-/kart-inkonsistensen. Deretter bygg en selvstendig, mer helhetlig georeferert illustrasjonsmodell. Ikke lag flere tilfeldige terrengmarkører som plaster på et svakt grunnsystem.
