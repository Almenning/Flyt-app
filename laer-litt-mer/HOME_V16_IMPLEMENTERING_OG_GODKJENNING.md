# Læria Hjem v16 – implementeringsstatus og siste visuelle sperrer

**Status:** Kodepilot på eksisterende draft-PR #241. Ren liggende v16-kandidat er overført og teknisk verifisert, men er fortsatt **ikke kunstgodkjent**. Ikke merge eller publiser.

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

## Gjenstående før full v16
1. Den rensede **liggende** kandidaten må få eksplisitt kunstgodkjenning. Den er teknisk verifisert, men dette er ikke det samme som designgodkjenning.
2. På stående original må det bygges en **godkjent selvstendig komposisjon** med fire venstreskilt og reelt eventyrlandskap, uten å beskære bort fjell eller troll, og uten dupliserte fjell/bygninger eller synlige skjøter.
3. Bevar de låste v15-masterne uendret. Ingen forventet hash skal endres for å få tester grønne.
4. Bevar levende «Fortsett reisen»-tekst direkte på treverket, uten pålimt rektangulær stripe, og behold den faktiske progresjonsbindingen.
5. Gjennomfør visuell godkjenning av faktiske appskjermbilder på PC/Mac, iPad og iPhone, stående og liggende.
6. Ikke slå på v16 som standard, merge eller publiser uten eksplisitt godkjenning.

## Ikke villedende forhåndsvisning
På brede skjermer bruker opt-in-piloten nå den SHA-verifiserte rensede kandidaten uten de fire innmalte fagkortene nederst. På stående/små formater brukes fortsatt den låste v15-originalen inntil egen stående v16-kunst er godkjent. Alle v16-skjermbilder skal fortsatt merkes som **ikke kunstgodkjent**.


## Nytt i andre implementeringsetappe (30. oktober)
- En **ren bakgrunnskandidat** ble laget lokalt fra v15-masteren, uten de fire malte kortene. Bare høyre nedre del av originalen er rekonstruert fra eksisterende designreferanse; fjellene, himmelen, øvre deler av trollene og venstreskiltene forblir originale piksler. Den gamle, innmalte linjen under «Fortsett reisen» er renset slik at levende progresjonstekst kan gjengis direkte på treverket.
- Kandidatens fil: `laer-litt-mer/assets/home-v16/kjosnes-home-desktop-clean-DRAFT.webp` (1127 × 681, tapsfri WebP, **1 201 462 byte**).
- SHA-256 for **kandidat**, ikke original: `4efcf7783cd83e46a22cc1c51269039a309b8ba1400ee6eab6e478657e129ee0`.
- Kandidaten er nå overført til PR #241 på nøyaktig sti angitt ovenfor. GitHub Actions har verifisert **1 201 462 byte**, RIFF/WEBP-signatur og eksakt SHA-256 uten å endre forventet hash.
- `home-v16-preview.js` verifiserer både SHA og dimensjoner ved valgfri visning før utkastet kan brukes. Hvis filen ikke finnes eller ikke stemmer, brukes den eksakte v15-masteren. Ingen fullskjermregenerering, og ingen endring av originalfilene.
- Det pikselidentiske fjellområdet (hele bredden, rad 0–425) testes nå via Chromium/WebKit og `tests/laria-home-v16-preview.playwright.js`, i tillegg til fungerende fagmenyer, returflyt og levende progresjon.
- Den nye dynamiske underteksten gjengis **uten rektangulær bakgrunn** i den rensede kandidaten. Uten kandidat får v15 beholde sitt eksisterende uttrykk.
- Denne kandidaten er **ikke kunstgodkjent**. Merk alle skjermbilder med kilde/commit og om bildefilen var inkludert.

### Status etter teknisk QA 2. november 2026
- Den rensede WebP-kandidaten er overført og integritetsverifisert.
- SHA-verifisert same-origin lasting brukes; ingen `blob:`-URL som bryter appens CSP.
- Levende progresjonstekst synkroniseres mot eksisterende Basecamp-state uten hardkoding.
- Reell Chromium/WebKit-QA er grønn på PC, Mac, iPad stående/liggende og iPhone stående/liggende.
- Neste sperre er **visuell kunstgodkjenning**, særlig egen stående v16-komposisjon. Ingen merge eller publisering.
