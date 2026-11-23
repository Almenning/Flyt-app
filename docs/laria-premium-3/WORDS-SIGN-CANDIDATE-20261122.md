# Kinnaklova Words – illustrert skiltkandidat

Status: **kun vurderingsmodus**. Aktiveres med
`?app=laria&lariaWordsSignCandidate=1` på iPad.

## Kilder

- Planke: transparent, høyoppløselig kandidat avledet fra den låste
  skiltmasteren. Den originale masteren er uendret og SHA-verifiseres av test.
- Medaljong: separat transparent ABC-lag.
- Tekst: ekte DOM-tekst `Words` i Georgia/Times New Roman-seriffamilien.
- Stolper: eksisterende separate Grovanova-stolper; Kinnaklova-bakgrunnen,
  kirken, fjellet og TrollActor endres ikke.

## Avgrensning

Bare handlings-ID-en `words` får det nye grafiske laget. `sentences` og
`reading` beholdes uendret. Kandidaten er aldri på i vanlig appmodus og er
ikke en godkjenning for bred utrulling.

## Verifikasjon

Den faktiske knappen beholdes. Ingen progresjons- eller rutehandling er
kopiert; `data-ki="words"` er fortsatt samme navigasjonsinngang.

### Kandidatcommit `bd47d78a27ceeb16dde02d4fe95ac8c022cc4bfb`

- `words-plank-source-derived-v2.png` SHA-256:
  `2f7935431342a4dde91738d79656070d15c1155a01cbef9de373293d364a96db`
- `words-medallion-v2.png` SHA-256:
  `fbb79de6dbb792bd3447be6cded48b947ec55309db2c6e5b343350348507ea12`
- Faktisk Læria-flyt er kontrollert i WebKit og Chromium på 1024 × 1366
  og 1366 × 1024: Hjem → Engelsk → Words → første oppgave.
- Kontrollbildene er produsert av GitHub Actions-artifakten
  `laria-words-sign-candidate-bd47d78a27ceeb16dde02d4fe95ac8c022cc4bfb`.

Dette er fortsatt en visuell eierport. Den er ikke en endring i normal
appmodus, en godkjenning av skiltets kunst, eller mandat til å rulle ut
samme komponent til de øvrige skiltene.
