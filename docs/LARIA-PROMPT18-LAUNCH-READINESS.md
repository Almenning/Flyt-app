# Prompt 18 — kommersiell launch-readiness for Læria

Status: **ÅPEN — ikke gå til Prompt 19 før alle P0-blockers er lukket og verifisert.**

Baseline for gjennomgangen: main etter Prompt 17 `afc39f55848d399b9d9ed27c73110601cebf854e`.
Arbeidsgren: `prompt18-commercial-readiness`.

## Ferdigkriterium

Læria kan først gå til Prompt 19 når:
1. alle synlige ferdigheter i læringsreisen har minst fem egne, unike oppgaver,
2. ingen fagbank skjuler manglende ferdigheter ved å låne tilfeldige oppgaver fra andre områder,
3. geografi har komplett eller eksplisitt begrunnet kjernedata for alle land,
4. Kloden er sluttverifisert mot låst visuell referanse på iPhone og iPad,
5. Læria har en egen distribusjonsidentitet for den plattformen som skal selges,
6. abonnement/entitlement og gjenoppretting av kjøp er reelt implementert og testet dersom produktet skal selges som abonnement,
7. personvern og vilkår er tilgjengelige som egne foreldre-/kjøpsflater,
8. eksisterende Prompt 17-regresjon, WebKit og device-hardening fortsatt er grønne.

## Fagbanker etter Prompt 18-utvidelsen

Auditen måler unike spørsmål i den sammenslåtte aktive banken.

| Trinn | Norsk | Matte | Engelsk |
|---|---:|---:|---:|
| 1 | 164 | 68+ genererte | 47 |
| 2 | 164 | 383+ genererte | 52 |
| 3 | 154 | 163+ genererte | 52 |
| 4 | 154 | 240+ genererte | 52 |
| 5 | 100 | 82 | 50 |
| 6 | 100 | 88 | 50 |
| 7 | 100 | 110 | 50 |
| 8 | 84 | 104 | 40 |
| 9 | 84 | 103 | 40 |
| 10 | 84 | 104 | 40 |

Merk: Matte 1.–4. bruker generative oppgaver. Tallene er unionen fra deterministisk sampling, ikke en statisk filstørrelse.

### Innholdsgate
- Norsk: ingen synlige ferdigheter med færre enn fem egne oppgaver etter supplement.
- Matte: ingen synlige ferdigheter med færre enn fem egne oppgaver etter supplement.
- Engelsk: tidligere manglet bl.a. reading på 1. trinn og phrases på 5.–7.; disse er nå fylt. Ingen synlige ferdigheter med færre enn fem egne oppgaver etter supplement.
- Det permanente audit-testsettet ligger i `tests/laria-commercial-readiness.cjs`.

## Geografi

- 195 land/territorieposter i aktiv bank.
- Seks verdensdeler er representert.
- Storbritannia er komplettert med London og kjernedata.
- Palestina beholder tom quiz-hovedstad fordi statusen er omstridt; posten forklarer dette eksplisitt. Den skal derfor ikke generere en falskt entydig hovedstadsoppgave.

## Launch blockers

### P0 — må lukkes før Prompt 19

1. **Egen Læria-distribusjon — IMPLEMENTERT, CI-verifisering pågår**
   - `laria-native/` har egen Capacitor-identitet `no.adspire.laria` / `Læria`.
   - Egen macOS/Xcode-workflow genererer og bygger Læria separat fra HverdagsOss.
   - Første dedikerte simulatorbygg er grønt; StoreKit-broen bygges nå i samme gate.

2. **Abonnement / betaling — KLIENT + STOREKIT IMPLEMENTERT, EKSTERN KONFIG GJENSTÅR**
   - StoreKit 2-bro bruker verifiserte `Transaction.currentEntitlements`.
   - Produkt-IDer er `no.adspire.laria.monthly` og `no.adspire.laria.yearly`.
   - Foreldreområdet har kjøpsstatus og `Gjenopprett kjøp`.
   - Native læringsøkter krever Premium når StoreKit-produktene faktisk er tilgjengelige; web/PWA forblir åpen forhåndsvisning.
   - Gjenstående ekstern aktivitet: opprette produktene/abonnementsgruppen og prisene i App Store Connect og sluttverifisere med Sandbox/TestFlight.

3. **Vilkår — IMPLEMENTERT, QA-verifisering pågår**
   - Foreldreområdet har egen `Vilkår og personvern`-side med lokallagring, produktansvar, kjøp/fornyelse, gjenoppretting og App Store-håndtering.

4. **Kloden må sluttverifiseres mot låst referanse**
   - Teknisk/device QA er grønn fra Prompt 17.
   - Det er fortsatt nødvendig med endelig side-by-side-kontroll av komposisjon, størrelse, bakgrunn, dybde og kontroller mot den låste illustrasjonen.

### P1 — kommersiell kvalitet

- **Native branding — IMPLEMENTERT, CI-verifisering pågår:** dedikert Læria-ikon og splash genereres i `laria-native/prepare-brand.swift`, installeres etter Capacitor-sync og valideres på 1024×1024 / 2732×2732 før Xcode-build. App-ID og appnavn er `no.adspire.laria` / `Læria`.
- Pris og abonnementsnivå må være definert før kjøpsflaten kan sluttgodkjennes.
- Foreldreteksten må peke til faktisk personvernerklæring og vilkår når de finnes.

## Arbeidsregel

Prompt 18 er **ikke lukket** bare fordi innholdstesten blir grønn. Alle P0-punktene over skal enten implementeres og verifiseres i repoet eller dokumenteres som en ekstern App Store Connect-avhengighet som er den eneste gjenværende manuelle lanseringsaktiviteten.
