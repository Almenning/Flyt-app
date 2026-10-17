# Læria / Gangemagi: oppdragsdesign, 17. oktober 2026

## Låst visuell referanse

Brukeren har eksplisitt valgt den tredje illustrasjonen i tråden med fire alternativer. Hovedoppgaven «Dagens oppdrag» har stor, lesbar setning **«Fyll 2 kurver med 5 jordbær i hver.»** med tre illustrerte trinn: (1) Plukk jordbær, (2) Legg i 2 kurver, (3) 5 i hver kurv. Illustrasjonen er **en designreferanse**, ikke skjermbakgrunn eller kilde til spilldata.

## Implementering, egen PR-gren

- `multiplication-gangemagi-v1.js`: `questBoard()` med tekst og trinn generert fra eksisterende `E.MISSIONS` / `state`. Skiltet er semantisk `header`, oppgaven `h2`, steg er en tilgjengelig liste. Tegnede, originale SVG-er for kurv og eksisterende jordbærmotiver i DOM. Oppdragsindeks og sum/mål vises uten å dekke oppgaven.
- `gangemagi-dagens-oppdrag-v1.css`: isolert oppdragskomponent med lesbart visuelt hierarki og tilpasning for nettbrett, stående mobil og ekstra liten iPhone. Fri lek beholder sitt eksisterende oppgavekort.
- `index.html`, `sw.js`: versjonert lasting/cache som fungerer også i Safari/PWA.
- `tests/laria-gangemagi.playwright.js`: kontroller på faktisk oppdragsinnhold 3×3 og 2×10, tilgjengelige tre trinn, tydelig oppgavetekst, fri-lek-regresjon. Eksisterende fullspills- og førstekjermskontroller beholdes.

## Ufravikelige produktkrav

1. Tekst og symboler må stå klart frem, spesielt på iPad liggende. Unngå at den personlige reven eller for mange bokser konkurrerer om oppmerksomheten.
2. Det er ikke en quiz: barnet leker med de virkelige kurvene, påvirker tellere og ser addisjon/gange.
3. Alle åtte oppdrag, blomster, valg av personlig rev, opplesning, hint, Markedsbok og den klassiske Gangetabellen beholdes.
4. Det skal ikke være påtvunget nivåskifte. Barnet kan velge fri lek og gjenta oppdrag.
5. iPhone 320×568 og 390×844, iPad 820×1180 og 1180×820 i **faktisk WebKit**. Primærknappen skal være synlig ved normal åpning og oppdraget lesbart uten zoom.
6. Ingen lansering uten nylige grønne tester på **eksakt PR-head** og ingen rapportert mergekonflikt. Publisering krever dokumentert GitHub Pages deploy på merge-SHA.

## Arbeidslogg

- 2026-10-17 kveld: Opprettet gren fra main. Lagt til dynamisk oppdragsplakat og illustrerte 3-trinn, CSS, cache-oppdatering og Playwright-tester. Automatisk oppfølging per time aktivert på brukerens uttrykkelige ønske. **Nye tester, faktiske WebKit-skjermbilder og GitHub Pages-deploy ennå ikke verifisert.**
- Neste økt: gjennomgå Actions på siste commit. Ret eventuelle første-skjerm- eller layoutbrudd på rotårsaksnivå, behold andre fag uendret. Dokumenter grønn QA og Page-status. Godkjenn og flett uten brukeravhengighet først når trygghetssjekken er bestått.
