# Læria Hjem v16 – implementeringsstatus og siste visuelle sperrer

**Status:** Kodepilot på eksisterende draft-PR #241. Ikke merge eller publiser.

## Autorisert kunst
- **Kjøsnesfjorden/Grovanova** er identiteten for Hjem. Eksisterende v15-masterfiler for liggende og stående skjermer er fremdeles låst og skal beholde eksisterende SHA-256.
- V15 har fire fagkort **malt direkte inn i bakgrunnsbildet**. Den stående telefonoriginalen mangler treskiltene fra desktopillustrasjonen.
- Siste godkjente samtaleillustrasjon fra 29. oktober er en **foreløpig designreferanse med forbehold**, ikke verifisert pikselidentisk produksjonsoriginal. Ikke bruk den som erstatning for låst master.

## Ferdig implementert i denne PR-en
- **Opt-in**: `?app=laria&laria-home-v16-preview=1` (ikke slått på i publisert app).
- PC og liggende iPad: fire separat tilgjengelige trykkflater følger **de faktisk malte treskiltene på venstre side**, i rekkefølgen Norsk, Matte, Engelsk, Geografi.
- De gamle trykkflatene nederst blir inaktive i dette formatet. Vi bruker fortsatt de **eksisterende** navigasjonshandlerne. Ingen appdata, læringsprogresjon, klassetrinn eller rutefunksjoner endres.
- Reelle aktuelle progresjonsverdier og «Fortsett reisen» hentes fremdeles fra v12/v15, ikke hardkodet i bilde.
- Fungerende v15-illustrasjon og navigasjon beholdes på telefon/iPad stående og små liggende skjermer inntil en godkjent stående v16-komposisjon finnes.
- Separate tester for original SHA-256, reelle aktivitetsruter, skjermgeometri, returflyt, tilgjengelighet og Chromium/WebKit.

## Bildevask som *må* utføres før full v16
1. Lag **rene avledede bildefiler** fra v15-masterne uten å endre fjell, fjord, kirke, detaljer, troll eller de låste originalfilenes SHA-256.
2. På bred master: fjern kun de fire innmalte fagkortene nederst. Bevar malte treskilt med **to felles trestolper** på venstre side.
3. På stående original: bygg en **godkjent selvstendig komposisjon** med fire venstreskilt og reelt eventyrlandskap, uten å beskære bort fjell eller troll, og uten dupliserte fjell/bygninger eller synlige skjøter.
4. «Fortsett reisen»: fjern malte plassholdertekster i avledede bilder og la levende tekst være integrert i selve treskiltet, uten pålimt rektangulær stripe. Bevar den faktiske progresjonsbindingen.
5. Fjern eventuelle andre malte, irrelevante knappetekster bare lokalt og kontroller pixel-for-pixel at godkjent fjellsilhuett beholdes.
6. Aktiver nye illustrasjoner med egen verifisert fil/hash, legg til små og store skjermgeometrier, og ta **faktiske appskjermbilder** fra Mac, iPad og iPhone stående og liggende før kunstgodkjenning.
7. Ikke slå på v16 som standard, merge eller publiser uten eksplisitt godkjenning.

## Ikke villedende forhåndsvisning
Det nåværende bildet i pilot inneholder fremdeles de **malte** fagkortene nederst, selv om deres trykkflater er deaktivert. Skjermbilder fra piloten er ikke bevis for at kortene er fjernet, og skal merkes som **ikke kunstgodkjent**.
