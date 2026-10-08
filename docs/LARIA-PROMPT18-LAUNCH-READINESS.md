# Prompt 18 — kommersiell launch-readiness for Læria

Status: **FERDIG — intern P0 er implementert, automatisert verifisert og Kloden er visuelt kontrollert mot den låste referansen på iPhone og iPad. Prompt 18 kan lukkes.**

Siste verifiserte branch-head: `2462ba3eea02cf4417d286fb02f3b18059ac9018` på `prompt18-visual-signoff`.

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

5. **Kloden — grønt, inkludert visuell sign-off**
   - Den interaktive kloden er beholdt; den er ikke erstattet av en statisk illustrasjon.
   - Scene, vannflate, messingramme og skygge/dybde er forbedret for å ligge nærmere den låste kunstretningen.
   - Testen dekker valgt gutt-/jenterev, ingen horisontal overflow, globestørrelse, minimum 44 px kontroller, tre moduser og sentrale globehandlinger.
   - Den dekker Chromium iPhone, WebKit iPhone, WebKit iPad portrett og WebKit iPad landskap.
   - Exact-head-skjermbilder fra WebKit iPhone, WebKit iPad portrett og WebKit iPad landskap er sammenlignet mot `globe-v20-approved.webp`. Den reviderte komposisjonen holder hele kloden synlig, fjerner den store forgrunnsreven som kolliderte med atlasreferansen og bevarer den interaktive naturatlas-globen.

## Seneste verifikasjon

| Kontroll | Resultat | Evidens |
|---|---|---|
| Prompt 18 content audit | Grønn | GitHub Actions #31 |
| Læria iOS-build | Grønn | GitHub Actions #63 |
| Laria QA | Grønn | GitHub Actions #175 |
| Prompt 17 device/WebKit-regresjon | Grønn | del av Laria QA #175 |
| Prompt 18 globe-evidence | Grønn | del av Laria QA #175; iPhone + iPad portrett/landskap |
| Full browser-regresjon | Grønn | del av Laria QA #175 |
| Continuous smoke | Grønn | GitHub Actions #2109 |

Exact-head globe-evidence ble produsert fra commit `2462ba3eea02cf4417d286fb02f3b18059ac9018` og kontrollert mot den låste referansen.

## Gjenstående interne sluttpunkt

Ingen. Prompt 18 er internt lukket.

## Eksterne App Store Connect-oppgaver

Disse er ikke interne Prompt 18-blockers, men må være ferdige før betalt App Store-lansering:

1. Opprett abonnementsgruppe og produktene `no.adspire.laria.monthly` og `no.adspire.laria.yearly` i App Store Connect.
2. Fastsett pris, prøveperiode og tilgjengelighet.
3. Test kjøp, entitlement og gjenoppretting med Sandbox og deretter TestFlight på fysisk enhet.
4. Legg inn endelig personvernerklæring, vilkår, supportadresse og App Privacy-opplysninger.

## Arbeidsregel

Det interne Kloden-sjekkpunktet er lukket. Prompt 19 kan startes etter at Prompt 18-PR-en er merget og siste branch-head er grønn. App Store Connect-punktene er eksterne publiseringsoppgaver og holdes tydelig adskilt fra interne produktblockers.
