# Gangemagi: arbeid mot låst premiumillustrasjon
Dato: 18.10.2026

## Låst kilde og visuell fasit
- Ordrett, verifisert masterprompt: `docs/MASTERPROMPT-LARIA-GANGEMAGI-LAST-2026-10-18.md`.
- Godkjent bilde: `gangemagi_i_tallengas_hage.png`, 941 × 1672 piksler, SHA-256 `5e8980e18b9874cb0c12a5f2856dc41c51820830adcaaaeafa5c6647bdb93c4a`.
- Bildet er delt i samtalen. Det er **ikke** påstått at den binære originalfilen er lagret i GitHub. Legg den i repoets designressurser når en sikker binærfilopplasting er tilgjengelig. Bruk aldri hele referansebildet som en ikke-interaktiv UI-flate.

## Grein og avhengighet
- Arbeidsgren: `feat/laria-gangemagi-premium-locked-20261018`.
- Draft-PR: #187, basert på #181. Dette er en bevisst stacked PR. Koordiner med nyere `main` (bl.a. Ordjakt) før senere release.
- Ingen endring i gammel Gangetabellen, profil-/lagringsformat, andre fag eller globus.

## Kode implementert i denne økten
1. Skilt ut en entydig oppdragsinteraksjon: trykk på kurven **velger**, hovedknappen **legger ett jordbær i valgt kurv**. Uten valgt kurv blir det ikke feilaktig lagt til et bær. Markering og revemelding oppdateres ved valg.
2. Fri lek beholder sin tidligere direkte kurvberøring og sitt valgfrie drag-and-drop. I oppdrag er drag ikke lenger en skjult parallell regel.
3. Eget originalt, gjenbrukbart håndflettet SVG-motiv: `laer-litt-mer/gangemagi-basket-premium.svg`. Det er ikke et flatt skjermbilde; jordbær, valg, merker og tellere ligger som live DOM.
4. Større dynamisk tregjengitt oppdragstavle: «Velg en kurv» → «Legg i jordbær» → «Se at a × b = resultatet», bygget fra alle åtte eksisterende oppdrag.
5. Integrert toppnavn/oppdragsposisjon, stor malerisk spillscene, personlig rev, matematikk og eget 0–mål-bærfelt.
6. Byttet ut midlertidige, lagvis oppsamlede oppdrags-CSS-patcher med ett samlet mission-scope-stilsett. Den opprinnelige klassiske øvingen, fri lek og Markedsbok har fortsatt separat stil.
7. Flyttet Fri lek og Gangetabellen til sekundær navigasjon slik at oppgavetavle og marked får visuell prioritet.
8. Eksisterende hovedskript og stilversjoner er oppjustert for Safari/PWA-cache.

## Regresjonstesting / releaseporter
- Playwright-testen er utvidet for å kreve **valg før bær**, valgt-kurv-markering, egen SVG-ressurs, dynamiske oppgavetekster, korrekt regnestykke, Markedsbok/progresjon og klassisk modus.
- **Status:** Ingen påstand om grønn QA på aller siste PR-head før GitHub Actions faktisk rapporterer dette. Første CI-kjøringer pågår.
- Faktiske WebKit-bilder i 320×568, 390×844, iPad portrett og landskap, samt Chromium, skal inspiseres før visuell godkjenning. Visuell samsvar med låst illustrasjon er **ennå ikke godkjent**.
- Kontroller særskilt at tre eller flere kurver og hovedhandlingen ikke skjules under første skjerm på iPhone; at markeringen er synlig; at opptjent blomst består etter angre og reload; at tegnede jordbær fortsatt er lette å telle.

## Neste steg
1. Hent eksakt HEAD GitHub Actions. Fiks rotårsakene til faktiske testfeil, ikke slakk testene for å få grønn status.
2. Verifiser iPad/iPhone-skjermbilder. Visuelt sammenlign topp, tretavle, personlig rev, kurver, matematikken og primærknapp mot den låste illustrasjonen.
3. Fortsett med materialkvalitet på eventyrmarkedet, kurvillustrasjon, responsiv komposisjon og de levende animasjonene.
4. Verifiser alle åtte oppdrag, fri lek og progresjonsmigrering, deretter bred QA.
5. Hold #187 som draft til dokumentert visuelt samsvar og eksakt QA. Publiser ikke denne foreløpige implementasjonen.
