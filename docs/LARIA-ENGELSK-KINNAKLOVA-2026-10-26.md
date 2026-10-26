# Læria Engelsk: Kinnaklova, første ombygging (26.10.2026)

## Beslutning
Ny Engelsk-fagforside bygges som en direkte aktivitetshub i samme produktretning som Tallvika (Matte) og Eggenipa (Norsk). Reisekartet Ordlandsbyen beholdes i koden og lagret historikk, men fjernes fra barnets ordinære Engelsk-inngang. Den private Setningshavna-prototypen for kapittel 2 beholdes urørt, ikke publisert.

## Implementert i denne PR-en
- Egen `kinnaklova.js` og `kinnaklova.css`, isolert til `#subject-screen[data-subject="english"]`.
- Ny, **foreløpig** illustrert landskapskomposisjon inspirert av Kinnaklova i vedlagte referanse (kløvd fjellprofil, kyst, fyr, små hus og sjø).
- Tre direkte porter: Words (`english/words`), Sentences (`english/sentences`), Reading (`english/reading`). Bruker uendret `startLearningSession` og eksisterende spørsmål.
- Pågående Engelsk-økt kan gjenopptas via eksisterende `loadActiveSession`/læringsport. Ingen nye progresjons- eller profildata.
- Normal returrute til Hjem og Basecamp. Den gamle oppdragshistorikken slettes ikke.
- Eggenipa/Matte/Geografi og levende trollarbeid berøres ikke.

## Visuell status og port før publisering
**Ikke en godkjent premium-master.** Kinnaklova er i denne første versjonen en stilisert CSS-illustrasjon, ikke en høyoppløselig håndmalt scene. Brukerens inspirasjonsbilde er ikke egnet som direkte ren bakgrunn fordi det inneholder andre stedsnavn, revefigur og UI. Neste kunstleveranse må være en dedikert godkjent Kinnaklova-master uten innbakt UI, gjerne med interaktive steder integrert i samme malte motiv. Bruk ikke nytt syntetisk troll eller flat PNG-utklipp.

## QA / bevaringskrav
- `node --test tests/laria-kinnaklova-contract.test.cjs`
- Faktiske iPhone- og iPad-skjermbilder i Chromium og WebKit, stående og liggende, inklusive hovedportene.
- Verifiser Words/Sentences/Reading åpner en reell femoppgaversøkt, fullføring/tilbakeføring og progresjon.
- Verifiser lagret Engelsk-økt gjenopptas, og at `journey.nodes` for Engelsk/Norsk/Matte ikke endres bare ved å besøke huben.
- Kontroller retur fra Basecamp og iOS kantsveip.
- Produkeiergodkjenning og grønn CI før merge/publisering. Ingen automatisk merge.
