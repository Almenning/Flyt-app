# Læria Premium 2.0 – operativ gjenopptakelse (9. november 2026)

## Oppdaget stopp og dokumentert årsaksbilde

1. To tidligere timebaserte ChatGPT-automatiseringer for Læria var deaktivert. Siste kjøring av begge var markert `requires_user_action=true` uten ferdig resultattekst. Dette er en **dokumentert stoppmekanisme**, men statusen identifiserer ikke sikkert hvilken konkret brukerhandling eller aktør som deaktivert oppgavene. En vanlig samtale er ikke en vedvarende utviklingsprosess etter at svaret er levert.
2. GitHub hadde dokumenterte hendelser med Actions og Webhooks 9. november 2026. Se https://www.githubstatus.com/history . Flere PR #243-kjøringer feilet før et eneste jobbobjekt ble opprettet (f.eks. run 42672446117: 0 jobber). Dette er en separat CI-infrastrukturblokkering, ikke dokumentasjon på et rødt kildekodetestresultat.
3. Utviklingsgrenen og PR #243 ble ikke slettet eller slått sammen. Testers manglende oppstart må skilles fra faktisk testsvikt.

## Praktisk gjenopprettingsregime

- Én autorisert timebasert hovedoppgave arbeider videre på **eksisterende draft PR #243** (`feat/laria-premium-beta-cleanup-20261106`). En separat uavhengig driftsvakt følger med på deaktivering, manglende tilgang og Actions som ikke starter. De to eldre konkurrerende utviklingsoppgavene forblir deaktivert.
- Ved GitHub Actions-stopp: les run og jobs via GitHub API. Om `jobs.total_count=0`, merk `CI NOT STARTED`; ikke skriv «test feilet i kode» eller «QA bestått». Sjekk offisiell status og prøv igjen ved neste gjennomførbare kode-/testendring. Hvis det fortsatt er 0 jobber, rapporter ekstern blokkering.
- GitHub Actions er hendelsesstyrte og kan ikke garantere uavbrutt arbeid. Hver timekjøring er en avgrenset utviklingsøkt. Dersom tilgang eller kunstgodkjenning hindrer ett steg, gjennomfør andre lovlige og trygge PR-endringer uten å omgå sperren.
- Før hver endring: hent fersk PR-HEAD, oppdater én eller flere reelle feil/tester, bruk oppdatert parent SHA uten force-push, sjekk diff og testkjøring. Hold egen arbeidslogg i PR.
- **Kunstport:** Grovanova, Eggenipa, Tallvika, Kinnaklova og Nordlysleiren forblir låste motiver. Ingen CSS-tildekking av gamle skilt som erstatning for en godkjent ren kunstmaster. Ett levende valgt originalt troll og **én venstrestilt skiltgruppe**.
- **Release-port:** Ingen merge, endring av main, publikasjon, fjerning av SHA-kontroll eller endring av barns lagrede progresjon. Grønn test alene er ikke visuell premiumgodkjenning. Krev reelle iPad-/iPhone-skjermbilder og barnetest før publisering.

## Ny tilhørende mobiltest

`tests/laria-reference-mobile-v1.playwright.js` dekker nå også telefonens foreldreinngang: kort trykk skal ikke åpne den, og bevisst hold skal åpne eksisterende innstillinger. Når barnet returnerer, må læringsposter forbli urørt. Dette følger prinsippet «Barn har lyst til å åpne Læria, foreldre har tillit».

## Hva automatisk drift **ikke** kan love

Ingen ChatGPT-automatisering kan garantere uavbrutt arbeid uten tjenesteavbrudd, verktøytilganger eller nødvendige godkjenninger. Hvis oppgaven må stoppes av plattformen, skal driftsvakten oppdage og varsle, ikke omgå en sikkerhetsbegrunnelse. Ved stopp kan neste aktiverte arbeidsøkt fortsette fra denne filen og fersk PR-HEAD.
