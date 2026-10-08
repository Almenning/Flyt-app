# Prompt 19 — Final Release Candidate for Læria

Status: **ÅPEN — siste samlede release-candidate-gate. Ingen nye produktfunksjoner skal inn i denne prompten.**

Base: `main@9e165075a3e53710848b29ae4f1da9a31f499ae5`.

## Formål

Prompt 19 er den avtalte siste samlede feilrettingen, QA-en og godkjenningen av en lanserbar intern release candidate. Arbeidet skal fryse scope, finne og rette reelle regresjoner og dokumentere hva som faktisk er verifisert.

Eksterne App Store Connect-oppgaver fra Prompt 18 holdes utenfor den interne RC-gaten. Koden kan være intern release candidate selv om pris, abonnementskonfigurasjon, Sandbox/TestFlight og App Store-metadata fortsatt må ferdigstilles eksternt.

## Scope freeze

- Ingen nye fag, spillmoduser eller kommersielle funksjoner.
- Ingen redesign av låste flater uten at en faktisk blocker krever det.
- Kun feilretting, regresjonsretting, ytelses-/stabilitetsretting og dokumentasjon som er nødvendig for RC.
- Prompt 18s låste Kloden-retning og innholds-/commerce-kontrakter skal bevares.

## RC-gater

1. **Kode og innhold**
   - Static/Node-regresjon grønn.
   - Prompt 18 content/commerce-kontrakter fortsatt grønne.
   - Ingen dupliserte aktive lag eller åpenbare stale runtime-filer som overstyrer låst implementasjon.

2. **Kritiske brukerreiser**
   - Onboarding/profil/klassetrinn.
   - Hjem/Basecamp og hovednavigasjon.
   - Reisen og retur til riktig sted.
   - Norsk, Engelsk, Matte og Geografi med reelle oppgaver.
   - Brøklab, gangetabell og Utforsk.
   - Kloden: åpne, rotere, zoome, velge land, bytte modus og gå tilbake.
   - Foreldreinngang, vilkår/personvern og commerce/paywall-kontrakt.
   - Trygg sosial utfordring uten chat.

3. **Enheter og visuell regresjon**
   - Chromium + WebKit.
   - iPhone, liten iPhone, iPad portrett og iPad landskap.
   - Prompt 17 device-hardening fortsatt grønn.
   - Prompt 18 Kloden-evidens fortsatt grønn og uten layoutregresjon.
   - Ingen horisontal overflow eller kritiske kontroller under 44 px.

4. **Distribusjon**
   - Dedikert Læria iOS-build grønn.
   - Native identitet, branding og StoreKit-bro fortsatt kompilérbar.
   - Continuous smoke grønn.
   - Publisert Læria-runtime grønn.

5. **Sluttgodkjenning**
   - Ingen kjente interne P0/P1-blockers.
   - Alle feil som oppstår i RC-gatene rettes og verifiseres på nytt før merge.
   - Exact-head RC må være grønn før PR tas ut av draft og merges til `main`.
   - Etter merge skal `main` verifiseres grønn på relevante push-gater.

## Ferdigkriterium

Prompt 19 er ferdig først når branch-head er grønn på alle relevante automatiske gater, genererte device-/Kloden-evidens ikke viser en ny blocker, PR-en er merget til `main`, og relevante push-gater på merge-commiten er grønne.

Da kan den interne versjonen betegnes **Final Release Candidate**.
