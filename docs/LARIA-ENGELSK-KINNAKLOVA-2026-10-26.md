# Læria Engelsk: Kinnaklova, første ombygging (26.10.2026)

## Beslutning
Ny Engelsk-fagforside bygges som en direkte aktivitetshub i samme produktretning som Tallvika (Matte) og Eggenipa (Norsk). Reisekartet Ordlandsbyen beholdes i koden og lagret historikk, men fjernes fra barnets ordinære Engelsk-inngang. Den private Setningshavna-prototypen for kapittel 2 beholdes urørt, ikke publisert.

## Implementert i denne PR-en
- Egen `kinnaklova.js` og `kinnaklova.css`, isolert til `#subject-screen[data-subject="english"]`.
- Ny, **foreløpig** illustrert landskapskomposisjon inspirert av Kinnaklova i vedlagte referanse (kløvd fjellprofil, kyst, fyr, små hus og sjø).
- Tre direkte porter: Words (`english/words`), Sentences (`english/sentences`), Reading (`english/reading`). Bruker uendret `startLearningSession` og eksisterende spørsmål.
- Pågående Engelsk-økt kan gjenopptas via eksisterende `loadActiveSession`/læringsport. Ingen nye progresjons- eller profildata.
- Normal returrute til Hjem og Basecamp. Den gamle oppdragshistorikken slettes ikke.
- Eggenipa/Matte/Geografi og levende trollarbeid berøres ikke.

## Visuell status og port før publisering
**Ikke en godkjent premium-master.** Kinnaklova er i denne første versjonen en stilisert CSS-illustrasjon, ikke en høyoppløselig håndmalt scene. Brukerens inspirasjonsbilde er ikke egnet som direkte ren bakgrunn fordi det inneholder andre stedsnavn, revefigur og UI. Neste kunstleveranse må være en dedikert godkjent Kinnaklova-master uten innbakt UI, gjerne med interaktive steder integrert i samme malte motiv. Bruk ikke nytt syntetisk troll eller flat PNG-utklipp.

## QA / bevaringskrav
- `node --test tests/laria-kinnaklova-contract.test.cjs`
- Faktiske iPhone- og iPad-skjermbilder i Chromium og WebKit, stående og liggende, inklusive hovedportene.
- Verifiser Words/Sentences/Reading åpner en reell femoppgaversøkt, fullføring/tilbakeføring og progresjon.
- Verifiser lagret Engelsk-økt gjenopptas, og at `journey.nodes` for Engelsk/Norsk/Matte ikke endres bare ved å besøke huben.
- Kontroller retur fra Basecamp og iOS kantsveip.
- Produkeiergodkjenning og grønn CI før merge/publisering. Ingen automatisk merge.

## VISUELL DELGODKJENNING, LÅST 26.10.2026

**Ordrett beskjed fra produkteier:** «Trollene er feil, men lås resten.»

Dette er en **bindende designlås for illustrasjonskomposisjonen**, ikke godkjenning av de tre tegnede trollene, ikke godkjenning av første CSS-kodeprototype og ikke publiseringsgodkjenning.

**Eksakt referanse:** `laria_kinnaklova_visual_reference_locked_except_trolls_20261026.png` (1672 × 941, SHA-256 `3b1d6b6e6c9908dd31c519593504ac22dd2c7473ef05fa51ecd57885cdc6e035`, genererings-ID `f4130f98-830e-4e25-aecc-0f73a8971e13`). Dette er den SISTE illustrasjonen i Engelsk-tråden med Kinn kirke og tre feilaktige genererte troll. Binær referanse er levert i samtalen, **ikke ennå importert som repo-asset**; en konkret arkivkopi og hash er derfor angitt, slik at den ikke forveksles med eldre illustrasjoner.

### Låst og skal ikke redesignes
- Troverdig Kinnaklova-form: bratte fjell til venstre, de karakteristiske tvillingtoppene, blått hav, skjær, himmel, lys og illustrativ 2.5D premiumstil.
- Kinn kyrkje, kirkegård/gravstøtter, steinmurer, klokketårn og det lille røde huset, med plassering og sceneopplevelse.
- Topplinje «Engelsk › Utforsk», Læria-logo, treskiltet «Oppdag Kinnaklova» og undertittel.
- Tre skilt/aktiviteter **Words**, **Sentences** og **Reading**, med grønn pil, plassering og prikkete sti mellom dem.
- Helhetlig perspektiv, farger, vegetasjon, blomster, scenekomposisjon og format.

### Eneste avviste del: trollene
- Alle tre figurer i bildet er FEIL og ikke identitetsgodkjent. Verken deres ansikt, hår, klær eller proporsjoner er fasit.
- De skal erstattes av **de tre eksakt tidligere godkjente trollene** (storesøster, lillesøster, lillebror). Originalfilene i `assets/gangemagi-troll/` er kilder; ingen nye fantasitroll skal genereres.
- Fremgangsmåten må ta høyde for at feilaktige figurer er **innbakt i komposisjons-PNG-en**. Lag et kontrollert bakgrunns-/karakterarbeid med lokale retusjer kun der trollene står, og ikke la retusjeringen endre godkjent fjell, bygninger, skilt eller øvrig landskap. Ingen rev skal vises.
- Endelig identitetsbevaring, naturlig integrasjon og eventuelle levende reaksjoner testes separat med faktisk WebKit på iPad/iPhone før godkjenning.

**Viktig avvik i gjeldende kode:** Den første CSS-prototypen i denne PR-en er ikke den nå godkjente illustrasjonskomposisjonen. Den skal ikke brukes som visuell fasit eller publiseres. Ny implementasjon skal reprodusere den låste illustrasjonen og bare erstatte feilaktige troll.

Maskinlesbar designlås: `docs/LARIA-KINNAKLOVA-VISUAL-LOCK-2026-10-26.json`.
