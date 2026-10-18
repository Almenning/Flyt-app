# Læria SuperKlode – kunst- og ytelseslogg

Dato: 18. oktober 2026  
Utviklingsløp: [PR #185](https://github.com/Almenning/Flyt-app/pull/185) mot draft-[PR #184](https://github.com/Almenning/Flyt-app/pull/184).  
Status: **Visuelt kandidatgrunnlag, ikke premiumgodkjent og ikke publisert.**

## Låste rammer

- Dagens **Enkel-globus og Kartet må ikke endres**.
- Oppdag skal være geografisk korrekt og prioritere verdensdeler.
- Barnets personlige rev og 21 valgfrie oppdagelsesstopp i syv verdensdeler beholdes.
- Oppgaver inviterer, men krever ikke; ingen tvungen quiz eller progresjon.
- Ingen flette til `main` før faktisk iPhone/iPad-testing og separat premiumgjennomgang.

## Sammenliknede kunstretninger

| Retning | Vurdering |
| --- | --- |
| Stabil Oppdag i #184 | Geografisk og teknisk fungerende, men selve jordoverflaten er for flat. |
| «Carved» prosedyretegning | **Forkastet som lanseringsretning**. Store hvite flekker ved Himalaya, unaturlig brun stripe ved Skandinavia. |
| NASA Blue Marble som pigment | Geografisk, men for fotorealistisk og med liten forbedring ved første oppløsning; dyrere ved høy oppløsning. |
| Natural Earth II, geografisk skyggerelieff + Lærias egne pigmenter | **Beste kandidat så langt**. Synlige fjell, skog og ørken uten endrede landkonturer. Må fortsatt harmoniseres med den håndillustrerte 2.5D-bakgrunnen. |

Natural Earth-data: https://www.naturalearthdata.com/about/terms-of-use/ (public domain). Oversiktsflisene er i `laer-litt-mer/discovery-ne-shaded-data-v1.js` og lastes kun i `?discovery-art=natural-earth`. Ingen ekstern datakilde kontaktes i barnets aktive økt.

## Måling av synlig endring

Et grovt, men reproduserbart pikselmål ble beregnet innenfor samme indre globusirkel i fire WebKit-skjermbilder på iPad. Tabellen viser andelen bildepiksler som endret gjennomsnittlig RGB-verdi med mer enn 10 mot standardrenderingen.

| Område | Carved | Natural Earth |
| --- | ---: | ---: |
| Afrika | 6,2 % | 32,3 % |
| Himalaya | 11,6 % | 45,3 % |
| Amazonas | 7,7 % | 23,4 % |
| Skandinavia | 9,2 % | 29,9 % |

**Viktig:** Målet viser visuell forskjell, ikke kvalitet. Bildene er visuelt vurdert i tillegg.

## Kontrollert minne- og arbeidsoptimalisering: 1024 → 768

Prosessering av kildens fire 512-pikslers fliser bruker nå en mosaikk på 768 × 768, med tilsvarende justering av skyggefilterradiene. Geografisk Mercator-sampling bruker faktisk rasterbredde fremfor hardkodet 1024.

- Antall punkter i arbeidsrasteret redusert med **43,75 %**.
- Pixelavvik mellom 1024 og 768 på de fire iPad-bildene: **0,57–1,42** i gjennomsnittlig RGB-verdi. Ingen betydelig synlig detaljforringelse ved denne kontinentzoomen.
- Beregningstid i emulert WebKit på iPad (Afrika/Himalaya/Amazonas/Skandinavia):
  - 1024: **122 / 204 / 162 / 180 ms**.
  - 768: **95 / 186 / 140 / 196 ms**.
  - Snitt: 167 ms → 154 ms, omtrent 8 % lavere, med målevariasjon og en liten regresjon i Skandinavia.
- Klargjøring av Natural Earth:
  - iPhone WebKit: **895 → 887 ms**.
  - iPad WebKit: **1331 → 1402 ms**.
  - **Ingen påvist forbedring i total oppstartstid.** Trolig betyr bildeinnlasting/dekoding og filterarbeidet mer enn størrelsen alene.

## Regresjonstester

- [GitHub Actions 39146838479](https://github.com/Almenning/Flyt-app/actions/runs/39146838479): **bestått** på instrumentert 1024-versjon. Test av faktisk simulert fingertrykk på Frankrike, overgang Oppdag → Enkel → Oppdag, ingen lekkasje til Enkel. Måling av klargjøring innført.
- [GitHub Actions 39147433900](https://github.com/Almenning/Flyt-app/actions/runs/39147433900): **bestått** på `dfd3580`, med 768-kildemosaikk, geografiske stedsprøver, fingertrykk, originalglobusisolasjon og iPhone-/iPad-skjermbilder.
- Begge er nettlesermotorer i testmiljø, **ikke fysisk Apple-maskinvare**.
- Generell smoke-test må også være grønn på relevant kode før eventuell flette.

## Neste arbeid, i prioritert rekkefølge

1. **Oppstart:** Fjern eller reduser det synkrone bilde-/skyggeregnestykket som blokkerer første oppdagelsesvisning. Vurder forberedt georeferert skyggetekstur fra build-tid, men uten å endre kartgeometri og med dokumentert lisens. Mål både total klargjøring og hovedtrådblokkering i WebKit.
2. **Kunstretning:** Bruk Natural Earth som geografisk *lys- og skyggegrunnlag*, ikke som sluttresultat. Lag sammenhengende håndillustrert farge-/materialbehandling for skog, fjell, sand og is. Unngå høyglansbånd, malte veier og tilfeldige ikoner.
3. **Kvalitetsport:** Følg faktiske skjermbilder for alle syv verdensdeler, stående/liggende iPad, iPhone, fysisk Safari, berøring, scroll og skifte mellom visningene.
4. **Frys konkurrerende forsøk:** Ikke opprett flere parallelle PR-er. Hold #184 stabil, og viderefør én kandidat i #185. Ingen merge eller publisering før faglig og visuell aksept.

**Beslutning:** 768-varianten beholdes foreløpig i eksperimentet fordi den sparer arbeidsminne uten synlig kvalitetskostnad. Oppstart og illustrert premiumfølelse er fortsatt uløste kvalitetsporter.


## Fortsettelse: instrumentering og landmaske (18. oktober)

- Commit `ba40671b`: Natural Earth-eksperimentet eksponerer nå separate verdier for dekoding, pikselbehandling og total klargjøring på globusens canvas-datasett. Dette er instrumentering, ikke dokumentert ytelsesgevinst.
- Commit `673051d`: forberedt `Uint8Array`-landmaske erstatter RGB-oppslag per geografisk prøvetaking. Den opprinnelige RGBA-mosaikken holdes ikke i `naturalEarthPixels` etter klargjøring. Teoretisk redusert beholdt RGBA-datamengde er 768 × 768 × 4 byte (omtrent 2,36 MB desimalt), men faktisk minnegevinst og oppstartshastighet er ennå ikke målt.
- GitHub Actions på eksakt `673051d`: [Dual Globes Release QA #39151393773](https://github.com/Almenning/Flyt-app/actions/runs/39151393773) **bestått**, [Continuous smoke #39151393766](https://github.com/Almenning/Flyt-app/actions/runs/39151393766) **bestått**.
- Neste kvalitetskrav: hent nye, sammenliknbare WebKit-tall for `discoveryNaturalEarthDecodeMs`, `discoveryNaturalEarthProcessingMs` og `discoveryNaturalEarthPreparationMs`, samt total tid til interaktiv opplevelse. Bekreft ingen endring i bildeuttrykk i alle referanseområder. Gjennomfør separat vurdering på fysisk Safari før publisering.
- **Beslutning:** fortsatt eksperiment. Ikke flett PR #185 eller PR #184 til main på bakgrunn av grønne tekniske tester alene.
