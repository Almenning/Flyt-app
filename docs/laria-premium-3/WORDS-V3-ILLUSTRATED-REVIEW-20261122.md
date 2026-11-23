# Læria – Words v3, illustrert treplanke (kun vurdering)

Dato: 22. november 2026. **Status: IKKE GODKJENT / IKKE PUBLISERT.**

## Avgrensning
- Tilgang til ny kandidat **kun** med `?app=laria&lariaWordsSignCandidate=2`.
- Eksisterende kildebasert v2 er urørt og kan sammenlignes med
  `?app=laria&lariaWordsSignCandidate=1`.
- Vanlig appmodus har ingen endring i Engelsk.
- Den låste Kinnaklova-bakgrunnen, Grovanova Hjem v16, troll, ruter og
  progresjon er uendret. Ikke legg inn fullscenegenerering eller andre fjell.

## Grafiske aktiva
- `laer-litt-mer/assets/ui/words-sign-candidate/words-plank-illustrated-v3-REVIEW.webp`
  - 1100×292, transparent WebP, ~98,8 kB.
  - SHA-256 `227ad66793e591484dc88b2a6a5f6d326bfebf0943d69e6dd457ccfaa2e1360e`.
  - Reillustrert, tekstfri honningfarget treplanke med nagler, kvister,
    naturlige årringer og tredimensjonal kant. Fargejustert mot låst
    Grovanova-referanse.
  - **Nytt AI-illustrert kandidatbilde, ikke pixel-identisk kildeuttrekk.**
    Derfor kreves visuell godkjenning; den er ikke en ny låst master.
- `laer-litt-mer/assets/ui/words-sign-candidate/words-abc-medallion-v3-REVIEW.png`
  - 392×392 RGBA, separat mørkebrunt ABC-medaljonglag.
  - SHA-256 `64e76f8b6a2b678c6cc97f6c851be7456bcd324a769a1bec0880d9589b4e314a`.
- Ordet **Words** er fortsatt ekte DOM-tekst, knappens `data-ki=words`
  og eksisterende click-handler er urørt, og trestolpene er eget
  DOM-lag med den eksisterende Grovanova-stolperessursen.
- De øvrige engelske valgene Sentences / Reading er ennå ikke ombygget
  til v3. Ingen full utrulling før Words får eksplisitt godkjenning.

## Verifikasjon
`.github/workflows/laria-words-sign-candidate.yml` kjører to separate
previews på eksakt PR-head: v2 og v3 × iPad stående 1024×1366 og
liggende 1366×1024 × Chromium og WebKit. QA krever:

- To faktiske lastede bildefiler per kandidat (riktig native bildestørrelse).
- Synlig, ikke klippet tekst og medaljong uten innbyrdes kollisjon.
- Riktig responsiv plankestørrelse, berøringsflate og aktiv UI-fri bakgrunn.
- Faktisk Words-klikk inn i den eksisterende Kinnaklova-læringsoppgaven.
- Reelle app-skjermbilder som GitHub Actions-artefakt.

Automatiske tester er **ikke** visuell eiergodkjenning. Ny planke har
mer naturtro struktur enn v2, men kan avvike fra den låste Grovanova
referansen i farge, overflate, medaljong og fysisk terrengforankring.
Kvalitetsporten står derfor som «ikke godkjent».

**Ingen merge, publisering eller aktivering i vanlig appmodus** før
eieren har sett de faktiske v3-bildene og godkjent designet.
