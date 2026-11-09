# Læria – LÅST visuell identitet | 7. november 2026

**Status:** Brukergodkjent designretning («lås»), 7. november 2026. **Bindende gjennomføringsregler utvidet og låst 8. november 2026.**
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
- **Én felles plasseringslogikk:** Skiltene står samlet som en rolig, venstrestilt gruppe i fagene med konsekvent rekkefølge, avstand, størrelsesregler og horisontal forankring. Aldri tilfeldig spredt i hvert landskap. Responsiv justering er tillatt bare for å bevare synlighet og romfølelse, ikke endre navigasjonsprinsippet. Skiltene må ikke dekke landemerker, logoen, valgt troll eller hverandre.
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
- **iPad først og iPad låses før mobil:** iPad liggende er første godkjenningsflate (1366 × 1024), deretter iPad stående (1024 × 1366). Alle fem skjermene skal være visuelt godkjent på begge før iPhone og PC/Mac optimaliseres. Unngå parallelle mobiljusteringer mens iPad-kontrakten fortsatt er åpen.
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
6. Første godkjenning: full QA av fem skjermer på iPad stående og liggende i WebKit og Chromium, inkludert regresjon for navigasjon, trykkflater, valgt troll og progresjon. **Ingen iPhone-/desktop-tilpasning før eksplisitt iPad-godkjenning.** Senere kreves tilsvarende QA av iPhone og desktop.
7. Ingen merge/publisering før faktiske bilder er visuelt kontrollert og nødvendige tester er grønne.

## 8. Grovanova er den visuelle fasiten – ikke bare inspirasjon (LÅST 8. november)
- Den allerede godkjente **Grovanova/Kjøsnesfjorden-forsiden** bestemmer lys, illustrasjonskvalitet, fargebruk, treskiltmateriale, tekststil, logoens formspråk, skygger og ro i komposisjonen. Fagene skal se ut som egne steder i *samme* univers.
- Fagforsidene skal gjenbruke de **samme felles UI-ressursene/komponentene** for Læria-logo, runde Hjem-knapp og to-stolpede treskilt. «Ser omtrent likt ut» eller nye lokale etterligninger er ikke akseptabelt.
- Det er bare aktiviteten og underteksten som får variere mellom fagene. Skiltform, stolper, typografi, funksjonell oppførsel og plasseringslogikk skal være identisk.
- Hjem skal ha én aktiv navigasjonsvei til Norsk, Matte, Engelsk og Geografi. Ingen ekstra nederste fagkort eller separate menybokser. **Det kan ikke låses som premium hvis gamle konkurrerende menyer fortsatt vises.**

## 9. Ett presentasjonslag, ikke fire eller fem forskjellige varianter (LÅST 8. november)
- Innfør én gjenbrukbar fagside-/scene-kontrakt for Norsk, Matte, Engelsk og Geografi: *landskap + felles toppnavigasjon + felles venstrestilt skiltgruppe + valgt levende TrollActor*.
- **En felles kilde til designvariabler og komponentstiler.** Fagmoduler kan angi landskap, aktivitetstekst, navigasjonshandlere og eventuelle tydelig dokumenterte landskapssikre posisjonsjusteringer. De skal ikke definere hvert sitt uavhengige skilt- eller logosystem.
- Refaktorer og fjern motstridende gamle CSS-regler/overstyringer for de aktuelle fagsidene når felles løsning tar over. Ikke legg stadig et nytt «v3/v4/v5»-stilark øverst i bunken for å skjule de gamle feilene.
- Bevar eksisterende faktisk funksjonalitet, læringsaktiviteter, interne ruter, historikk og lagret barneprogresjon. Dette er en ombygging av *presentasjonslaget*, ikke en ny læringsapp.
- Der fagsider har gammel DOM-navigasjon for bakoverkompatibilitet, må den være fullstendig ikke-konkurrerende og utilgjengelig for tilfeldige trykk. **Ingen dobbelt navigasjon.**

## 10. Skill ren illustrasjon fra interaktive elementer (LÅST 8. november)
- Landskap, fjell, bygninger, natur og himmel er bakgrunnskunst. **Logo, skilt, funksjonelle knapper og troll er selvstendige, reelle UI-komponenter.**
- Dersom et godkjent bilde har logo, skilt, aktivitetskort eller gamle troll malt inn, må dette håndteres gjennom en **kontrollert ren variant** som kun fjerner UI-maling; den originalt låste filen beholdes uendret.
- Godkjente landemerker skal ikke regenereres, flyttes eller erstattes. En slik ren variant må visuelt sammenlignes mot originalen og godkjennes før bruk.
- **Kinnaklova og Grovanova er åpne kunstblokker** inntil vi har ekte rene godkjente varianter. Ikke aksepter overlappende logoer, oppmalte skilt eller skjulte dobbelmenyer som en snarvei. Hvis dette ikke lar seg løse uten å skade originalmotivet, stopp og merk skjermen som blokkert.
- De tre låste trollene, deres identitet, kilder og TrollActor-interaksjoner skal bevares. Valgt troll er én levende følgesvenn i forgrunnen, aldri en del av bakgrunnsbildet.

## 11. Godkjenningsport: iPad Premium (LÅST 8. november)
1. **iPad liggende først.** Ta ett reelt skjermbilde av Hjem, Norsk, Matte, Engelsk og Geografi, og vis dem samlet side om side. Riktig fjell, riktig originaltroll, felles logo/skilt, én menyrute per aktivitet og ingen synlige duplikater er påkrevd.
2. **iPad stående deretter.** Ta de samme fem reelle bildene. Viktige landemerker må fortsatt være synlige uten kutt, duplisering eller tomme striper. Skiltgruppen skal fortsatt være samlet og intuitiv.
3. Test faktisk navigasjon og oppdatert progresjon, alle trykkmål minst 44×44 CSS-piksler og interaksjon med valgt troll. Bruk WebKit og Chromium mot **samme commit** som skjermbildene.
4. Kjør automatiske tester. **Grønn kildekontroll alene er ikke visuell godkjenning.** Dersom bildebasert QA avviker, stopper godkjenningen.
5. Dokumenter konkrete mangler i PR #243. Ingen «ferdig Premium Beta», ingen merge/publisering og ingen videre iPhone-/PC-design før iPad er eksplisitt gjennomgått og godkjent av brukeren.

**Styrende prinsipp:** Hjem er designfasiten. *Landskapene skal variere, navigasjonen skal ikke variere.* Én visuell komponentarkitektur og ferdigstilt iPad før nye skjermstørrelser.

### Låst versus ikke implementert
**Designretningen er godkjent.** Dette dokumentet er ikke en påstand om at alle nåværende skjermer allerede oppfyller den. Gjennomføringen i PR #243 skal vurderes mot kravene over; dokumentet er ikke en tillatelse til å regenerere godkjente landskap eller bytte karakterer.

## 12. Presisering etter sist godkjente komposisjonsskisse (9. november 2026): KUN ÉN skiltkolonne

Dette er den nyeste bindende avklaringen om **plassering og navigasjonslogikk** og har forrang foran tidligere illustrasjoner av spredte aktivitetskilt eller en separat rund Hjem-knapp. De låste illustrasjonene, fjellene, skogstrollene og kvalitetsportene endres ikke.

- **Fagforsiden viser fem samlet venstrestilte treskilt:** Hjem, Norsk, Matte, Engelsk og Geografi. Aktivt fag er markert. Dette er nøyaktig den primære navigasjonen i den siste skissen.
- **På høyre side finnes bare én stor fag-/stedsplakett**, slik skissen viser. Ingen andre navneskilt eller læringsaktiviteter legges som en konkurrerende menyrad på høyre side.
- **Barnet åpner fagets tre reelle aktiviteter ved å velge aktivt fag på venstre side eller trykke på den store fagplaketten.** Den samme skiltkolonnen til venstre bytter da innhold til «Fagene» og aktivitetene. «Fagene» går tilbake til de fem fagene. Det er aldri to synlige skiltgrupper samtidig.
- **Matte:** Eksisterende «Neste eventyr» flyttes inn i samme venstre aktivitetskolonne, uten å endre målet eller læringsprogresjonen. Ingen ekstra Next-planke til høyre.
- Begge menyvisningene har eksakt samme venstre kant, breddeprinsipp, to stolper, berøring og typografi. De tre **originale** aktivitetene gjenbrukes som DOM-knapper med sine eksisterende handlere, ikke kopier eller uvirksomme dekorasjoner.
- **Læria-logo sentrert øverst**, runde «Mine troll» og voksenkontroll øverst til høyre, én valgt levende original TrollActor i scenen. Hjem-knappen er del av venstremenyen, ikke et tredje parallelt navigasjonssystem.
- **Låste landskapsfiler beholdes urørt.** Original Grovanova og Kinnaklova krever fortsatt godkjente rene masterbilder før det samme UI kan vises der uten innmalte duplikater. Ikke utgi løsningsskisse eller grønne tester som slik kunstgodkjenning.
- Godkjen på ekte skjermbilder av fem fagscener i WebKit og Chromium, først iPad liggende og deretter stående. Kontroller begge venstremenymoduser og at den høyre fagplaketten er eneste skilt på høyre side.

**Kritisk feiltilstand:** Hvis det er aktivitetsskilt både til venstre og til høyre, er designet IKKE premiumgodkjent, uansett om funksjonstestene er grønne.
