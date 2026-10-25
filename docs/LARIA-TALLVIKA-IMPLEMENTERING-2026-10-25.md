# Tallvika – implementering 25.10.2026

## Formål

Tallvika erstatter navnet Tallenga i matematikkens første verden og gir direkte, frivillig tilgang til Gangemagi, Brøklab og Gangetabellen. Den opprinnelige lærings- og progresjonsmodellen er ikke endret.

## Kilder og avgrensning

- Bakgrunn: `laer-litt-mer/assets/tallvika/tallvika-master-laast-20261025.png`, hentet fra den låste prosjektillustrasjonen «Tallvika: Et magisk læringslandskap ved fjorden.png» (1672 × 941).
- Karakterer: de tre opprinnelige 512 × 1024 WebP-filene i `assets/gangemagi-troll/`.
- Den låste bakgrunnsfilen brukes som urørt bilde. Trykkflater, tekst, karaktervalg og valgt figur er egne DOM-lag.
- PR #220 ble ikke gjenbrukt som produksjonsgrunnlag. Den inneholder 2D-riggforsøk og er fortsatt separat draft. Issue #221 gjelder fremdeles bare ekte lagdelt karakterkunst og avansert rigging.

## Endringer

- Ny isolert `tallvika.js` og `tallvika.css` rendrer matematikkens direkte lekeforside når Matte åpnes.
- Karaktervalget lagres som `profile.tallvikaTroll` i eksisterende lokale profilobjekt. Ingen progresjonsdata eller oppdrags-ID-er migreres eller nullstilles.
- Alle tre innganger bruker eksisterende `openMultiplicationLab`, `openFractionLab` og tabellvisning i multiplikasjonslaben.
- «Neste eventyr» starter den eksisterende anbefalte matematikkoppgaven; den sperrer aldri aktivitetene.
- Service-worker-cache har ny versjon slik at nye produksjonsfiler ikke blandes med tidligere appversjon.

## Kontroll gjennomført lokalt

- `git diff --check` – bestått.
- `node --check laer-litt-mer/tallvika.js` – bestått.
- `npm run test:node` – 401 tester bestått.
- `node tests/laria-tallvika-contract.test.cjs` – bestått.

## Gjenstående kontroll før merge/publisering

- Chromium- og WebKit-skjermbilder i iPad liggende/stående og iPhone liggende/stående.
- Manuell Apple Safari-test på fysisk iPad/iPhone dersom tilgjengelig.
- Avansert Rive-/2D-rigging er uttrykkelig ikke del av denne leveransen og er fortsatt sporet i issue #221.
