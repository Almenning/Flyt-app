# Gangetabellen: premium konsept og implementering

Dato: 2026-10-08

## Seks godkjente skjermillustrasjoner
1. Oversikt med tre tydelige valg
2. Oppgave i eventyrmiljo med 3 x 4
3. Velg en gangetabell (1-12)
4. Utforsk og lek med grupper, rutenett og tallinje
5. Hele gangetabellen med beroringsstyrt utforskning
6. Min mestring

Originale illustrasjoner er bevart i leverte Laria_Gangetabell_Designpakke.zip, som inkluderer visuell_oversikt.html, original-PNG, WEBP og designbeslutninger. Hele screenshots skal IKKE brukes som klikkflater. Bygg responsive native UI-kontroller som gjenskaper referansene.

## Implementert i denne grenen
- Egen barnestyrt inngang med Ov / Velg / Utforsk.
- Atte oppgaver, visuell hjelp, direkte svarrespons og neste oppgave.
- Fri oving i 1-12 uten laser.
- Eksperimentering med grupper, rutenett, tallinje, faktorbytte og monstre.
- Interaktiv 12x12-multiplikasjonstabell.
- Lokal mestringslogg. Gamle poster i state.multiplicationLab.completed opprettholdes.
- Egne style- og script-lag med isolerte mp-* klassenavn. Klodekode rores ikke.

## QA for produksjonsgodkjenning
- Test i iPhone Safari og iPad Safari for responsivitet, beroringsmal, scroll, tilbakegest og gjenapning.
- Test 8 oppgaver med riktig og feil svar; kontroller at fremgang lagres og repetisjon er mulig.
- Kontroller norsk tekst, aritmetiske resultater, visuelle grupper og tabellprodukt (1-12).
- Visuell sammenligning med seks illustrasjoner. Referansene har rike kunstillustrasjoner som bor omsettes til egne grafiske ressurser for full visuell aksept.
- Kontroller at klode, andre fag og felles navigasjon ikke regreserer.

Status: Interaktiv grunnimplementering. Ingen pastand om bestaatt end-to-end Safari-testing eller pikselperfekt design.
