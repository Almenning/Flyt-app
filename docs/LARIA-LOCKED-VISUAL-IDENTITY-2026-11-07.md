# Læria – LÅST visuell identitet | 7. november 2026

**Status:** Brukergodkjent designretning («lås»), 7. november 2026.
**Referanse:** Illustrert femskjerms-design vist i Læria-samtalen umiddelbart før godkjenningen (Hjem/Grovanova, Norsk/Eggenipa, Matte/Tallvika, Engelsk/Kinnaklova, Geografi/Nordlysleiren).
**Omfang:** Felles visuell identitet for Hjem, alle fire fagforsider og gjenbrukbar navigasjon. Referansebildet er en konseptvisualisering, ikke skjermbilder fra ferdig app.

## 1. EN felles Læria-logo
- Nøyaktig samme logo-/ordmerkekomponent på alle skjermene, sentrert i øvre sceneområde.
- Lys, varmt naturtre med mørk brun bokstavform, subtil relieff/skygge og diskret grønt blad-/skogspreg (som i godkjent konsept).
- Samme typografi, kontur, materialfølelse, ornament og størrelsesregler. Bare liten undertittel for fag/sted varierer.
- Ikke separate varianter med forskjellige fonter, farger eller konturer mellom fagene.
- Ingen doble logoer, spesielt ikke HTML-logo lagt over en innmalt logo.

## 2. ETT gjenbrukbart treskiltsystem
- Alle aktivitets- og fagvalg viser samme varme lys-eik/naturtreplate, avrundede hjørner, tydelig mørkebrun tekst, ensartet kant, samme skygge og materialtekstur.
- **To stolper** under hvert skilt; samme postbredder, avstand og farger. Komponentens bredde får skalere responsivt, men ikke endre formspråk.
- Valgfrie aktivitetsikoner fra én fast ikonfamilie (samme strektykkelse, farge og plassering). Ingen vilkårlige emoji- eller ikonstiler.
- Samme typografi, padding, knappetilstander og fokusmarkering på alle skjermer.
- Skilt kan stå på ulike steder i hvert landskap, men må ikke dekke viktige landemerker, andre skilt, logoen, valgte troll eller hverandre.
- Navigasjon skal være ekte, tilgjengelige DOM-knapper; illustrasjonen er aldri eneste trykklogikk.
- Ingen parallelle fagkort eller skjulte gamle kort som gir dobbelt navigasjon.

## 3. Én Hjem-knapp
- Samme kompakte, runde lys-treknapp med husikon, oppe til venstre på fagforsider.
- Samme størrelseprinsipp og trykkflate (minst 44×44 CSS-px), skygge, ramme, fokusstil, trykkrespons.
- På Hjem-skjermen finnes ikke en overflødig «Hjem»-knapp.

## 4. Ett illustrert eventyrunivers
- Hjem: fortsatt godkjent Grovanova/Kjøsnesfjorden.
- Norsk: Eggenipa, Matte: Tallvika, Engelsk: Kinnaklova, Geografi: Nordlysleiren.
- Fagene beholder sitt landskap og sin identitet, men har en felles lyssetting, detaljnivå, romfølelse, skiltmateriale og typografisk hierarki.
- **Dette låser formspråket, ikke nye fjell eller uautoriserte motivendringer.** Tidligere låste originalillustrasjoner beholdes og integritetskontrolleres.
- Elementer som allerede er innmalt i godkjente motiver, men avviker fra felles standard (logo/skilt), må håndteres som en kontrollert ren bildevariant / godkjent art-oppdatering. Det er forbudt å klistre et nytt skilt eller en ny logo over den gamle og akseptere dobbelteksemplaret som premium.
- Hvis ren variant ikke foreligger, behold originalen og merk skjermen som visuelt blokkert fremfor å late som den er godkjent.

## 5. Trollene er fortsatt de tre LÅSTE karakterene
- Karakterene som vises i konseptvisualiseringen er kun illustrasjonsplassholdere, **ikke** nye godkjente trolldesign.
- Behold de tre tidligere godkjente skogstrollene og identitetene: storesøster (brunt bølgete hår, lilla hårbånd), lillesøster (to knuter), lillebror (lyst hår, blå øyne).
- Bare det valgte trollet vises på fagsiden, som levende TrollActor (idle/vinke/tenke/hint/juble), ikke som statisk del av bakgrunnen eller dekorativt klistremerke.
- Karakteren skal ha en naturlig plass i forgrunnen uten å overlappe interaktive skilt.

## 6. Responsiv godkjenning
- iPad er hovedreferanse; stående og liggende iPad skal føles som samme produkt.
- Deretter kontrolleres iPhone stående/liggende og desktop (PC/Mac). Ingen beige tomrom, kuttede titler, skilt ut av skjermen, duplikerte fjell/hus eller ujevne sceneskjøter.
- All navigasjon og alle skilt har minst 44×44 px trykkflate, synlig tastaturfokus og korrekt etikett for skjermlesere.
- Sjekk skjermbilder fra faktisk app i Chromium og WebKit ved samme PR-head som testene.
- Bevar eksisterende navigasjonsruter og lagret barneprogresjon uendret.

## 7. Akseptansekriterier
1. Vis samtlige fem skjermer side om side på iPad liggende og stående. Logo, typografi, Hjem-knapp og treskilt må være klart gjenkjennelige som eksakt samme komponentfamilie.
2. Nøyaktig én logo på hver skjerm, uten synlige rester av gamle logoer.
3. Hvert skilt har samme form, trestil og **to stolper**; ingen konkurrerende innmalte gamle skilt.
4. Hjem har bare ett system for fagvalg. Fagskiltene åpner riktig ekte aktivitet.
5. Én av de tre originale, valgte TrollActor-karakterene vises uten å dekke skilt.
6. Full QA på iPad stående/liggende, iPhone stående/liggende og desktop, inkludert regresjon for progresjon, WebKit og Chromium.
7. Ingen merge/publisering før faktiske bilder er visuelt kontrollert og nødvendige tester er grønne.

### Låst versus ikke implementert
**Designretningen er godkjent.** Dette dokumentet er ikke en påstand om at alle nåværende skjermer allerede oppfyller den. Gjennomføringen i PR #243 skal vurderes mot kravene over; dokumentet er ikke en tillatelse til å regenerere godkjente landskap eller bytte karakterer.
