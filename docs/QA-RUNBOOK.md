# QA-runbook for Flyt

## Kontinuerlig kontroll

CI kjører på hver push og pull request. Den stopper ved JavaScript-syntaksfeil, merge-markører, manglende eller dupliserte scriptreferanser, ødelagte lokale ressurslenker, dupliserte statiske DOM-id-er, flere Supabase-klienter i hovedappen og grunnleggende avvik mellom HTML, manifest og service worker.

Kjør de samme kontrollene før commit:

```bash
find . -maxdepth 2 -type f \( -name '*.js' -o -name '*.mjs' \) -not -path './.git/*' -print0 | while IFS= read -r -d '' file; do node --check "$file"; done
node tests/static-smoke.mjs
```

Feilløkken er: reproduser feilen, legg til eller skjerp en regresjonskontroll, rett feilen, kjør kontrollene lokalt, åpne PR, og verifiser den publiserte siden etter deploy. En regresjonskontroll skal følge alle P0- og P1-feil når det er teknisk mulig.

## Prioritet

- **P0:** Appen starter ikke, innlogging eller lagring er ute, data går tapt/lekker, eller en kjernehandling registrerer feil resultat. Stopp publisering og rett eller rull tilbake umiddelbart.
- **P1:** En sentral brukerreise er ødelagt eller viser vesentlig feil data, for eksempel feil dag-/uketelling, synkfeil mellom partnere eller utilgjengelig historikk. Blokker neste publisering og prioriter retting.
- **P2:** Avgrenset visuell eller tekstlig feil med enkel omvei. Registrer og planlegg, men den trenger normalt ikke stoppe publisering.

## Før publisering

De statiske kontrollene er raske og krever verken hemmeligheter eller nettverk. De er ikke full ende-til-ende-testing. Før en viktig publisering må en autentisert testkonto fortsatt brukes i mobil og desktop til å kontrollere:

1. innlogging, utlogging og passord-reset;
2. registrering av et daglig gjøremål og korrekt dag-/uketelling;
3. synk og samtidig bruk fra begge partnerkontoer;
4. historikk, redigering og sletting der det er relevant;
5. installasjon/oppdatering av service worker og oppførsel ved tregt eller brutt nett.

Nye nettleserbaserte tester bør legges til senere med egne testkontoer og et isolert testmiljø. Ikke bruk produksjonsdata i automatiserte tester.
