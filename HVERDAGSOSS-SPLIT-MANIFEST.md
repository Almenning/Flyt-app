# HverdagsOss – sikker repository-separasjon

Dato: 2026-10-28

## Formål

Denne grenen er en eksportklar, isolert kopi av HverdagsOss fra `Almenning/Flyt-app`.
Ingen endringer i denne grenen skal påvirke `main` eller Læria.

## Kilde og sikkerhetsreferanser

- Kilderepo: `Almenning/Flyt-app`
- Kildecommit: `ffdb4941ba8f3ed31b560cba657af2f5a57784f0`
- Låst sikkerhetsgren: `archive/hverdagsoss-before-split-20261028`
- Arbeids-/exportgren: `chore/hverdagsoss-split-prep-20261028`

Sikkerhetsgrenen peker på den komplette opprinnelige repo-tilstanden før separasjonen.

## HverdagsOss-identitet

`capacitor.config.json` er beholdt uendret:

- App ID: `no.adspire.hverdagsoss`
- Appnavn: `HverdagsOss`
- Web directory: `www`

## Inkludert

Exportgrenen beholder HverdagsOss-produksjonskoden og tilhørende ressurser, herunder:

- rotens HverdagsOss HTML/JS/PWA-filer
- Hjem, Gjøre, Sett, Belønning, historikk, onboarding og innstillinger
- partnerkobling, synk og offline recovery
- `ios/`
- `supabase/` med migrasjoner og rollbacks
- HverdagsOss-tester
- ikoner og lokal Supabase-vendor
- native QA-skript
- iOS GitHub Actions-workflow

Første rene export-tree inneholdt 179 filer.

## Ekskludert

Følgende produktområder er bevisst ikke med i HverdagsOss-exporten:

- `laer-litt-mer/`
- `laer/`
- `laria/`
- `laria-native/`
- `p18-preview/`
- Læria-spesifikke tester
- Læria-spesifikke dokumenter
- Læria-spesifikke workflows og byggeskript
- `tools/` (Kinnaklova-verktøy)
- `visdom/` (separat Stoa-eksperiment)

565 blobs ble filtrert bort fra første export-tree.

## Endringer tillatt i exportgrenen

For å gjøre HverdagsOss selvstendig kan kun repository-infrastruktur tilpasses før flytting:

- `package.json` test-/buildskript
- README
- egne HverdagsOss-workflows
- migreringsdokumentasjon

Selve HverdagsOss-produksjonskoden skal ikke redesignes eller refaktoreres som del av separasjonen.

## Release-gater før nytt repo overtar

Det nye `Almenning/HverdagsOss` skal ikke bli aktiv kilde før alle disse er oppfylt:

1. Node-testene er grønne.
2. HverdagsOss browser-/Playwright-testene er grønne.
3. iOS simulator-build og native QA er grønne.
4. Innlogging, utlogging og sesjonsisolasjon fungerer.
5. Partnerinvitasjon og partnerkobling fungerer.
6. Hjem, Gjøre, Sett og Belønning fungerer med eksisterende data.
7. Dags- og ukesoppsummeringer/historikk fungerer.
8. Supabase/RLS/RPC-baselinen er uendret og testet.
9. Offline recovery og sync journal fungerer.
10. PWA/service worker og cache-versjonering fungerer.
11. Ingen Læria-filer eller Læria-runtime er nødvendig for HverdagsOss.
12. Produksjonsfilene sammenlignes mot sikkerhetsgrenen for å dokumentere at separasjonen ikke har endret produktlogikk.

## Ikke gjør ennå

- Ikke slett HverdagsOss fra `Flyt-app`.
- Ikke rename `Flyt-app`.
- Ikke flytt eller endre Supabase-produksjon.
- Ikke endre App ID/bundle identifier.
- Ikke bytt GitHub Pages/domene før ny kopi er verifisert.
- Ikke merge exportgrenen til `main`.

Først når det nye repoet er opprettet, kopieres denne isolerte tree-tilstanden dit og verifiseres parallelt.


## Identifisert cutover-avhengighet

`sync.js` er bevisst beholdt byte-identisk med sikkerhetsgrenen, men inneholder dagens produksjonsadresser:

- `https://almenning.github.io/Flyt-app/`
- `https://almenning.github.io/Flyt-app/reset.html`
- `https://almenning.github.io/Flyt-app/invite.html`
- innkommende web-invitasjoner valideres mot host `almenning.github.io` og path `/Flyt-app/`

Disse skal **ikke** endres før nytt HverdagsOss-repo og ny Pages-adresse er opprettet og testet. Ved cutover må partnerinvitasjon, reset, OAuth/redirect og Supabase-redirect allowlist verifiseres samlet før gammel adresse fases ut.
