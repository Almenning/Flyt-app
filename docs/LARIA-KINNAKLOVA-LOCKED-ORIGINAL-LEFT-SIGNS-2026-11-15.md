# Kinnaklova: samme låste bilde, felles venstre skiltmeny

**Låst 15. november 2026.** Brukeren har uttrykkelig avvist genererte, alternative Kinnaklova-landskap. Kinn skal bruke den eksisterende, tidligere godkjente bildefilen, ikke et annet motiv som ligner.

## Bildekilden

- Originalen bevares uendret: `laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp`.
- SHA-256: `d2e2d37b4c54191383457f423c1d568cd538391046e79e6f66e7a8b1928c0e57`. 1672 × 941.
- I en separat avledet kopi skal **bare** innmalt gammel overskrift, topplinje, Words/Sentences/Reading-skilt, grønne piler og prikket sti fjernes.
- Fjell, Kinn kyrkje, steintårn, fjord, rød bygning, vegetasjon, lys og komposisjon skal beholdes. Ekte bildet må ikke overskrives.
- Automatiske utviskninger med synlige forvrengninger er ikke godkjent; nytt generert landskap er ikke et alternativ.

## Felles layout

- Egen, ren, sentrert overskrift **Engelsk** med undertekst **Kinnaklova**, under felles Læria-logo.
- Tre **ekte** aktivitetsknapper (Words, Sentences, Reading) med samme lyse treskilt og to sammenhengende stolper som Norsk, Matte og Geografi, samlet helt til venstre.
- Ingen andre, spredte skilt i landskapet. Ingen doble menyrader eller dekorative grønne piler.
- Fagveksling via overskrift, rund Hjem-knapp, egen levende valgt TrollActor og ordinære foreldreinnstillinger.
- Ingen nye statiske figurer eller endring i barnets progresjon.

## Sikker implementasjon

Den felles UI-en er klargjort i PR #243, men skrus **ikke på** før både en verifisert eksakt SHA for den rensede bildekopien og visuell godkjenning foreligger. `UI_FREE_ART_VISUAL_SIGNOFF=false` og tom `UI_FREE_ART_SHA256` er bevisst. Ingen merge eller publisering av dette før faktiske Chromium/WebKit iPad-tester i begge orienteringer, etterfulgt av iPhone og full regresjonstest.
