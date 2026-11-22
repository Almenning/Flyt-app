# Læria Premium 3.0 – investorrevisjon, fase 1

**Revidert kilde:** `main` ved `d6aa4651127c520f4058ce9cc310a863dfc531cc`  
**Dato:** 22. november 2026  
**Status:** Fase 1 ferdig – ingen produktendringer i denne grenen.

## Beslutning

Læria har sterke, illustrerte kjerneopplevelser, men er **ikke konsistent nok til en investor-demo i dagens publiserte form**. Det viktigste problemet er ikke én enkelt skjerm: appen har flere samtidige presentasjonslag – gammel Basecamp/dashboard, illustrerte fagverdener, eldre oppgaveflater og nyere premium-komponenter.

Det finnes en betydelig avstand mellom publisert app på `d6aa465` og den nyere, men fortsatt uferdige kandidaten i PR #268. En investor-demo må velge én kontrollert kandidat og ikke blande disse.

## Verifiserte kilder

| Kilde | Hva den dokumenterer |
|---|---|
| [Publisert Læria](https://almenning.github.io/Flyt-app/laer-litt-mer/?app=laria) | Den live appen åpner fremdeles i Basecamp/dashboard med fagkort, «Lek og utforsk» og bunnmeny. |
| [PR #268](https://github.com/Almenning/Flyt-app/pull/268) | Nyeste samlede iPad-kandidat; ikke publisert. |
| [Exact-head iPad QA](https://github.com/Almenning/Flyt-app/actions/runs/45005336898) | WebKit + Chromium, iPad stående/liggende; alle målrettede iPad-kontroller besto på `047d7490`. |
| [Engelsk/Kinnaklova-bilder](https://github.com/Almenning/Flyt-app/actions/runs/45005337018) | Faktiske WebKit/Chromium-opptak av fag- og oppgaveflater. |
| [Matte/Tallvika-bilder](https://github.com/Almenning/Flyt-app/actions/runs/45005336945) | Faktiske WebKit/Chromium-opptak av stående og liggende Tallvika-oppgaver. |

## Leveranser

- [Fullstendig skjermkart](SCREEN-MAP.md)
- [Visuell avviksrapport](FINDINGS.md)
- [Felles Premium-designsystem](DESIGN-SYSTEM.md)
- [Fase 2–5: implementeringsrekkefølge](ROADMAP.md)
- [Skjermbilde- og testbevis](EVIDENCE.md)

## Avgrensning

Dette er en revisjon. Den endrer ikke kunst, læringslogikk, progresjon, trollanimasjon eller publisering. Funn som bygger på kildekode og CI er merket **dokumentert**. Visuelle vurderinger av helhet og premiumfølelse er merket **designvurdering**.
