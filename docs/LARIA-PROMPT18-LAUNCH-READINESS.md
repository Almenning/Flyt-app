# Prompt 18 — kommersiell launch-readiness for Læria

Status: **ÅPEN — intern P0 er implementert og automatisert verifisert, men den siste menneskelige visuelle godkjenningen av Kloden gjenstår. Prompt 19 skal ikke starte.**

Siste verifiserte branch-head: `a1afeb779fc51779cd2679deb8f0adcb717a4275` på `prompt18-commercial-readiness`.

## Ferdigkriterium

Prompt 18 kan først lukkes når alle interne P0-punkter er implementert, testet på aktuell head og Kloden er visuelt godkjent mot den låste referansen på iPhone og iPad.

## Implementert intern P0

1. **Fagbanker — grønt**
   - Norsk, matte og engelsk består den permanente innholdsgaten: alle synlige ferdigheter har minst fem egne, relevante oppgaver.
   - Matte 1.–4. bruker deterministisk genererte oppgaver; øvrige tall er unike oppgaver i den aktive sammenslåtte banken.

2. **Geografi — grønt**
   - Aktiv bank har 195 land/territorieposter og seks verdensdeler.
   - Storbritannia er komplettert med London og kjernedata.
   - Palestina beholder tom quiz-hovedstad med eksplisitt forklaring, slik at appen ikke lager en falskt entydig oppgave.

3. **Læria-distribusjon og betaling — grønt internt**
   - Egen Capacitor-identitet: `no.adspire.laria` / `Læria`.
   - Egen iOS-build, native branding og StoreKit 2-bro er implementert og verifisert.
   - Broen bruker verifiserte `Transaction.currentEntitlements`; produkt-IDene er `no.adspire.laria.monthly` og `no.adspire.laria.yearly`.
   - Foreldreområdet viser kjøpsstatus og har `Gjenopprett kjøp`.
   - Web/PWA er fortsatt en åpen forhåndsvisning; native premium-økter følger StoreKit når produktene finnes.

4. **Vilkår og personvern — grønt**
   - Foreldreområdet har en egen flate for vilkår og personvern, med informasjon om lagring, produktansvar, kjøp/fornyelse, gjenoppretting og App Store-håndtering.

5. **Kloden — automatisert grønt, menneskelig visuell sign-off gjenstår**
   - Den interaktive kloden er beholdt; den er ikke erstattet av en statisk illustrasjon.
   - Scene, vannflate, messingramme og skygge/dybde er forbedret for å ligge nærmere den låste kunstretningen.
   - Testen dekker valgt gutt-/jenterev, ingen horisontal overflow, globestørrelse, minimum 44 px kontroller, tre moduser og sentrale globehandlinger.
   - Den dekker Chromium iPhone, WebKit iPhone, WebKit iPad portrett og WebKit iPad landskap.
   - CI-artefaktene ble produsert, men nedlasting via sky-nettleseren tidsavbrøt. Dette er en verktøy-/nedlastingsbegrensning; det erstatter ikke den påkrevde menneskelige sammenligningen mot `globe-v20-approved.webp`.

## Seneste verifikasjon

| Kontroll | Resultat | Evidens |
|---|---|---|
| Prompt 18 content audit | Grønn | `tests/laria-commercial-readiness.cjs` passerer |
| Læria iOS-build | Grønn | egen Læria iOS-gate |
| Laria QA på siste head | Grønn | GitHub Actions #154, 4m 35s |
| Prompt 17 device/WebKit-regresjon | Grønn | del av Laria QA #154 |
| Prompt 18 globe-evidence | Grønn | del av Laria QA #154; iPhone + iPad portrett/landskap |
| Full browser-regresjon | Grønn | del av Laria QA #154 |
| Kontinuerlig smoke | Grønn før siste visuelle CSS-pass | ingen produktregresjon funnet |

Laria QA #154 kjørte mot commit `a1afeb779fc51779cd2679deb8f0adcb717a4275` og fullførte med suksess. Runner-notisene om Node 20/Ubuntu-image er plattformvarsler, ikke testfeil.

## Gjenstående interne sluttpunkt

- Åpne og sammenlign de genererte Kloden-skjermbildene visuelt mot `globe-v20-approved.webp`, særlig på iPhone, iPad portrett og iPad landskap.
- Bekreft at den siste kunstretningen er akseptert. Først da kan Prompt 18 erklæres **FERDIG** og Prompt 19 åpnes.

## Eksterne App Store Connect-oppgaver

Disse er ikke interne Prompt 18-blockers, men må være ferdige før betalt App Store-lansering:

1. Opprett abonnementsgruppe og produktene `no.adspire.laria.monthly` og `no.adspire.laria.yearly` i App Store Connect.
2. Fastsett pris, prøveperiode og tilgjengelighet.
3. Test kjøp, entitlement og gjenoppretting med Sandbox og deretter TestFlight på fysisk enhet.
4. Legg inn endelig personvernerklæring, vilkår, supportadresse og App Privacy-opplysninger.

## Arbeidsregel

Prompt 19 starter ikke før det gjenstående interne, menneskelige Kloden-sjekkpunktet over er lukket. App Store Connect-punktene er eksterne publiseringsoppgaver og holdes tydelig adskilt fra interne produktblockers.
