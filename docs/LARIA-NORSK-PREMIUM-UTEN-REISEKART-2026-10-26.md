# Norsk premium: Eggenipa uten reisekart

## Ny godkjent produktretning 26.10.2026

Brukeren godkjente den eksakte Eggenipa-illustrasjonen, men avviste resten av den tidligere Norsk-opplevelsen: Bokskogen-reisekartet/eventyrstien skal bort fra barnets vanlige Norsk-visning, og gamle revemotiver skal vekk fra Norsk-aktivitetene. Samme sammenhengende premium-eventyruttrykk som i den nye Matte-retningen. **Ingen ny illustrasjon av Eggenipa, reven eller trollene genereres.**

## Implementert fase 1

- Behold eksakt godkjent masterillustrasjon og hotspot-plasseringene.
- Tre direkte aktiviteter: **Ordjakt**, **Finn ordene**, **Lesekroken**. Biblioteket på høyre side åpner nå eksisterende \`startLearningSession('norwegian','reading','Lesekroken')\` i stedet for Bokskogen-kartet.
- Fjernet synlige koblinger til Bokskogens kart, klassetrinns-kartdialog, frivillig reise/neste oppdrag og forhåndsvisning av nytt reisekapittel på Norsk-forsiden.
- Gammel læringsmotor, gamle journey-ID-er, profilklassetrinn, fullført progresjon, lagrede svar og økter bevares. Gamle kartfiler slettes **ikke** fordi andre læringssystemer fortsatt refererer til dem; denne endringen gjelder presentasjon og navigasjon for Norsk.
- «Fortsett økten» tilbys direkte fra Eggenipa hvis det allerede finnes en lagret norskøkt. Brukerens profilklassetrinn brukes av den eksisterende motoren; ikke vis en fristende velger som gir andre oppgaver enn valgt trinn.
- Fortsetter å bruke ekte HTML-knapper over scenen og aktivitetskort for touch/tilgjengelighet. Ingen statiske dyr limes inn i bakgrunnsbildet.

## Neste arbeid innen samme draft-PR

1. Fjern den gamle revepresentasjonen fra Ordjakt, Finn ordene og vanlige norskøvelser uten å bryte eksisterende hint, opplesning, fremgang eller berøringsflater.
2. Premium visuell og pedagogisk rekonstruksjon med konsistent Eggenipa-preg; integrer de **allerede låste** skogstrollene først når kvalitetssikret gjenbrukbart TrollActor fra parallelle PR-er faktisk er klart. Ingen dårlig PNG-påliming.
3. Oppdater alle gamle kartforutsetninger i automatisk QA til direkte Norsk-aktiviteter, og bevar regresjonsdekning av data.
4. Chromium/WebKit-skjermbilder fra iPhone/iPad stående og liggende, sammenlign med illustrasjonsfasit, full Læria-regresjon før visuell godkjenning og publisering.

**Avgrensning:** Norsk-prioritert. Matte-PR #223 og trollpiloter #219/#224 endres ikke. All utvikling skjer i en draft-PR; produksjonen fra PR #226 er foreløpig uendret.


## Videreført: gamle statiske følgere fjernet fra de to norsklekene

- Ordjakt bruker nå en abstrakt magisk hjelpekontroll i stedet for gamle revebilder på startsiden, hintkontrollen og følgesvennplassen. Temaer, rutenett, hint og lagring er bevart.
- Finn ordene har ikke lenger karakterbildet som hintknapp, og åpningen krever ikke den gamle LARIA_FOX-tjenesten. Dramekanikk, ord-/objekthotspots, progresjon, støtte og lyd beholdes.
- Begge lekene har samme godkjente Eggenipa-landskap som atmosfærisk bakgrunn, men bakgrunns-PNG er uendret. Godkjente, levende skogstroll integreres først ved en kvalitetsklar TrollActor, ikke ved å lime inn statiske figurer.
- Delte Norsk-øvelser, full nettleser-QA og gamle fox-/kartbaserte forventninger i testpakken gjenstår.


## Direkte-aktivitetstester på ny UI

- Erstatter den gamle Eggenipa-testens krav om kartretur med 8 faktiske Chromium/WebKit-varianter som kontrollerer tre berørbare steder, fire aktivitetsvisninger, old-map fravær, bevart profil/journey-data og direkte Lesekroken-oppgaver.
- Følger også en lagret påbegynt norskøkt gjennom Avslutt → Eggenipa → Fortsett, uten ny oppgavemotor. Bruker riktig læringsrettighet, ikke geografiens startSession.
- Oppdatert statisk release-kontrakt: påkrevd direktelesing og ingen synlig Bokskogen-CTA.

## Fase 3: Lesekroken og felles oppgavescene

- Delt oppgavescene viser Eggenipa i stedet for Bokskogen i Norsk-oppgaver, uten endringer i andre fag.
- Gammel oppgaverev erstattet kun for Norsk med nøytral magisk hjelpeindikator. Reaksjon på riktig svar beholdes.
- Norsk-oppgavescene bruker den originale Eggenipa-illustrasjonen som bakgrunn og en tilpasset grønn/gull-palett.
- Chromium/WebKit-testen kontrollerer Lesekroken, riktig oppgavetekst, fravær av revebilder og riktig navnemerking.

## Fase 4: unngå å rendre gammelt kart ved Norsk-inngang

- Eldre renderSubjectJourney kjørte automatisk ved openSubject('norwegian') og senere innholdshendelser, selv om den visuelle reisen var skjult. Det kunne konkurrere om klasser og bildekoding under åpning.
- Norsk bruker nå eksisterende fagmotor uten kart-renderingen. Matte, Engelsk og Geografi beholder opprinnelige renderstier.
- Hjem-kortets tilgjengelige navn sier nå Eggenipa, ikke Bokskogen. Gamle reisedata forblir lagret.

## Fase 5: ordjakttekst og full regresjon

- De siste barnevise hjelpeinvitasjonene i Ordjakt sier nå «Hint», ikke «reven».
- Oppdatert full WordHunt-test: beholder 44px-trykkflater, respons ved feil og riktig, levende brett, 4/5 ord, progresjon og repetisjon, men krever Eggenipa-bakgrunn og magisk symbol fremfor gammelt revebilde.

## Rotårsaksrettelse og tester

- Feil i Chromium/WebKit: Barnet kunne trykke Norsk, men appens hovedtråd hang fordi Eggenipa observerte egne CSS-klasseendringer og skrev de samme klassene på nytt. Rettet ved å kontrollere om hver klasse faktisk endres før add/remove.
- Streng Node-kontrakt hindrer tilbakefall av denne observer-løkken; øvrige tidligere fox-identitetstester gjelder fortsatt andre fag, men den nye Norsk-leken må vise hint uten statisk rev.
- Eksisterende fire-kapittel-test godtar nyere versjonerte Ordjakt-skript og CSS; alle progresjons- og dataisolasjonstester beholdes.


### 26.10 – Finn ordene: egen berørbar hjelpekontroll

- Funn i PR #228 CI på `ad6f4fd`: Eggenipa WebKit/Chromium og Finn ordene WebKit stoppet fordi `.fw-fox-button` fikk berøringen oppfanget av `.fw-bottom` eller `.fw-controls .fw-next`. Dette var en **ekte layoutfeil**, ikke en gammel testforventning.
- Rotårsak: premium CSS beholdt høyrejustert **absolutt** hintknapp fra den utgåtte revefiguren, samtidig som «Ny ordjakt» lå i samme hjørne. På skjermbredder under 901px var absoluttposisjoneringen også arvet selv om foteren ble en flexrad.
- Rettelse: hintknappen til venstre for «Ny ordjakt» på landskap/desktop, og tilbake i normal flexflyt på mobil/iPad-portrett. Ingen endring i oppgaver, hintlogikk, bilder eller lagringsformat.
- Ny E2E-kontrakt: På alle åtte Chromium/WebKit-visninger må hintknappen være minst 44×44 og faktisk treffbar i sentrum via `document.elementFromPoint`, og deretter svare på ekte `tap()`.
- Ikke godkjent før den nye Eggenipa- og Finn ordene-CI er grønne.


### 26.10 – migrert gammelt testgrunnlag til direkte Norsk

- CI på `ad6f4fd` bekreftet at Home, Basecamp smoke, generisk Læria smoke, fire-kapittel pilot og task-polish fremdeles antok synlig Bokskogen-kart, «Neste eventyr» eller statisk rev. Disse forventningene strider mot den eksplisitt nye barneflyten.
- Oppdaterte disse kontraktene til faktisk Ordjakt/Finn ordene/Lesekroken, valgt klassetrinn, tilgjengelige leseoppgaver, retur til Eggenipa og bevart lagret avatar-identitet (uten å vise reven i Norsk). For andre fag beholdes gamle kontrakter uendret.
- Fire-kapittel pilot tester fortsatt den eksisterende interne kapittelmoteren via eksplisitt developer-flag og programmatisk intern knapp; testen krever samtidig at piloten **ikke er synlig** i ordinær Norsk. Ingen endring av gammel kapittelprogresjon eller ID-er.
- Syntaksen er kontrollert på alle endrede JS-tester; browser-QA kjøres på nytt før nye visuelle beslutninger.


### 26.10 – lesefremgang og profilidentitet, uavhengig av gammel reise

- `laria-journey-progress-recovery.playwright.js` tester nå norskøkt som **direkte Lesekroken-modul**, ikke gammelt nodeoppdrag: spørsmål og fasit, avbrutt/lagret svar, reload, synlig «Fortsett økten», eksakt gjenopptatt spørsmål, fullføring, sessionLog, bevart klassetrinn/avatar og **uforandrede historiske `journey.nodes`**. Engelsk/Geografi/Matte fortsetter sine tidligere, sterke oppdrags- og progresjonstester.
- `laria-fox-identity.playwright.js`: For Norsk kreves 0 gamle revebilder i lesescenen, ett hjelpesymbol og identisk lagret avatarvalg; de andre fagene beholder uendrede figurtests. Vist og kontrollert før/etter reload med screenshots.
- Alle koder syntaktisk validert før commit; nye CI-resultater må kontrollere den reelle flyten.

- Tillegg fra **faktisk** Chromium-iPhone i [Eggenipa CI #40294561521](https://github.com/Almenning/Flyt-app/actions/runs/40294561521): Et rettplassert hint (68×66px, x=44/y=735) hadde `document.elementFromPoint` lik `.fw-bottom`, ikke hintknappen. Årsak var `pointer-events:none` på foreldre-container `.fw-companion` uten eksplisitt `pointer-events:auto` på hintbarnet på mobil. Dette er fikset på selve interaktive knappen i alle skjermformater; e2e-testen kontrollerer faktisk treff, ikke bare bounding box. 


### 26.10 – synlig gammel rev i Ordjakt-temakort fjernet

- Faktisk Chromium-iPhone-skjermbilde av `Ordjakt → Velg din ordjakt` viste en stor gammel revefigur i kortet **Dyrevenner**. Symbolfjerning fra hint var dermed ikke tilstrekkelig for brukers krav.
- Dyrevenner-kortet og temaikonet bruker nå den **allerede eksisterende** illustrasjonen `find-the-words-garden-premium.webp` med ugle, pinnsvin og sommerfugl, i samme naturstil som Eggenipa. Original Eggenipa PNG uendret; ingen generering av alternativ trollkarakter eller endring av ord-/rundemotor.
- Temapakkens lille ikon er oppdatert fra gammel rev til ugle; Blandede ord viser «Eggenipa» i stedet for Bokskogen. De fire andre temaenes godkjente bilder er bevart.
- Den detaljerte Word Hunt Chromium/WebKit-testen kontrollerer alle fem bildespor og deres faktiske pikselmål (Dyrevenner 480×288, øvrige 160×169), inkludert at alle lokalbilder dekodes. 

### 26.10 – Samlet regresjonsrettelse etter c4961e5

- Faktisk Finn ordene-WebKit viste at hintberøring igjen fungerer i de større visningene, men på 320×568 scrollet tittelen 7 px ut av viewport ved hjelp. En sticky toppseksjon på svært smale telefoner beholder tittelen synlig uten å krympe de viktige berøringsflatene.
- Progress-recovery-testen brukte tvetydig `[data-eg=reading]` (både sceneknapp og aktivitetskort). Endret til eksplisitt `.eg-portal[data-eg=reading]` slik at ekte klikknavigasjon fortsatt testes.
- Device-hardening og Journey-mission-premium oppdateres til nye barnevalg Ordjakt, Finn ordene, Lesekroken. Testene sikrer fortsatt lesemotor, navigasjon, profil og historiske journey-ID-er; Engelsk/Matte/Geografi beholder sine gamle tester.
- Home v15 `Fortsett reisen` gjenopptar faktisk lagret aktiv norskøkt direkte når den finnes; test krever eksakt fag, modul og oppgaveindeks fremfor gammelt kartmål. Fysisk WebKit krever senere godkjenning. Draft PR, ikke publisert.

### 26.10 – fullført Lesekroken returnerer til Eggenipa

- [Laria QA på 4588534](https://github.com/Almenning/Flyt-app/actions/runs/40296288595) avslørte at `#complete-home` i vanlig norskøkt på 2. trinn gikk til fremgangssiden: etter faktisk fullført Lesekroken åpnet **ikke** Eggenipa. Dette var en reell navigasjonsfeil i felles fullføringsfunksjon, ikke feil test.
- Endret kun `scope.subject==='norwegian'` i `complete-home`-håndtereren slik at direkte leseøkt åpner `openSubject('norwegian')` og returnerer til Eggenipa. Oppdatert knappeetikett til «Tilbake til Eggenipa 🌿». Kartbaserte og andre fags eksisterende ruting beholdes.
- Regresjonstesten `laria-journey-progress-recovery.playwright.js` krever allerede at fullført Lesekroken lukker aktiv økt, fører barnet tilbake til Eggenipa, ikke tilbyr falsk «Fortsett», og bevarer `journey.nodes` etter reload.


### 26.10 – stabil temavelger og fysisk treff på hintsymbolet

- [Eggenipa-tema #40296288672](https://github.com/Almenning/Flyt-app/actions/runs/40296288672) besto Chromium Mac, men WebKit iPad rapporterte ustabilt temakort (30 sekunders mislykket klikking). Fjernet hover-translate på `.wh-theme-card` og beholdt fargerespons uten flytting av berøringsflaten.
- [Finn ordene iPad #40296288579](https://github.com/Almenning/Flyt-app/actions/runs/40296288579) hadde en foreldet bildekontroll for revefigur. Krever nå bevart brukerprofil, synlig magisk hint, `aria-label`, minst 44x44 px og faktisk sentertreff med `elementFromPoint`. Eksisterende krav til ord, bilder, skjermstørrelser og orienteringsskifte beholdes.
- Oppdateringen endrer ingen data, oppgaver, Eggenipa-illustrasjon eller andre fag. Chromium/WebKit-kjøringen må godkjennes før merge.

### 26.10 – CI etter neste Norsk-visuelle iterasjon

- Rotårsaker bekreftet i CI på `0b4726a`: Mobil-/iPad-testen kontrollerte profil fra `window.state` selv om appens lagrede profil er kilde til sannhet (`laerlittmer-v2`), navigasjonstesten forventet fortsatt fjernet Bokskogen-kart, og to generelle smoke-tester brukte en tvetydig `data-eg=reading`-selektor som traff både motivknapp og aktivitetskort.
- Korrigert: test lagret profil direkte i localStorage, naviger reelt via Eggenipa → Lesekroken → Eggenipa i reisebrett-smoke, og klikk spesifikt det synlige Lesekroken-aktivitetskortet. Bevarer fortsatt sterke sjekker på profilidentitet, kartfravær, oppgavelasting og retur.


### 26.10 – smoke-test uten det avviklede Bokskogen-kartet

- På PR-head `a0bcccb74` var **Continuous smoke** rød fordi `tests/laer-litt-mer.playwright.js` linje 667 krevde `[data-eg="map"]`, som bevisst er fjernet. Rotårsaken var utdaterte testforventninger, ikke ny funksjonsfeil.
- Testens komplette gamle mapflyt er erstattet med sterke krav til tre direkte porter, fravær av kart og gammel oppgavedashboard, faktisk Lesekroken-oppgavesett og gjennomført økt, én loggført fullføring, uendret `journey.nodes`, klassetrinn og lagret avatar, samt ekte retur til Hjem.
- Øvrige fag, dataformat og Eggenipa-masterillustrasjon er urørt. Testen skal være grønn på CI før denne deloppgaven regnes ferdig.


### 26.10 – Lesekroken skal fungere i liggende iPhone uten skjulte svar

- Visuell inspeksjon av ekte Chromium/WebKit-captures fra PR #228 viser at et kort landskapsformat (844×390) viste spørsmålet, men skjøv alle tre svar under første skjerm. Slik skjult funksjonalitet bryter med ambisjonen om barnevennlig premium.
- En **kun Norsk-skopet** og høydeavgrenset CSS-variant komprimerer toppstripe, spørsmålsmarger, illustrasjonsramme og hjelpesymbol, og bruker 3 svar i én rad med minimum 44px trykkflate. Ved lange tekstoppgaver tillates rulling. Ingen endring i læringsmotor, andre fag eller godkjent masterbilde.
- Ny Playwright-kontrakt for Chromium/WebKit iPhone liggende krever tre virkelige svar, alle innenfor 390px-viewporten, minimum 44×44 og med reelt `elementFromPoint` på svarene. Først etter grønne tester regnes dette som verifisert.

- Neste Chromium-landskapstest på `a6f773e` viste svarenes første rad ved y=497–560 mens fysisk viewport var 390px; det betyr at knapper ikke var synlige i første fold. `task-visual-companion-stage` plasserte den dekorative guiden i blokk **under** 5:3-scenen og økte kortets høyde. Den korte Norsk-varianten viser nå illustrasjon og hjelpesymbol side ved side i grid; ny QA-artifakt lagrer første viewport **før** layoutassertion, og logger posisjoner/min-høyder for kort/scene/svar ved nye feil.

- Dokumentert rotårsak i Chromium-landskap på `2336444`: første svar på y433, fordi `laria-task-young-v18.css` (lastes etter `laria-task-scene-v15.css`) eksplisitt krevde `min-height:215px!important` for illustrasjonen og en **flex-column**-topp med 44px opplesningsknapp. Den yngre barnestilen overstyrte Norsk sitt svar- og illustrasjonsoppsett. I stedet for flere tilfeldige globale justeringer er det lagt inn et snevert `[data-task-band=young][data-task-subject=norwegian]` unntak direkte i **kilden til denne regelen**: toppstripe på én linje, 90px scene og 46px svar. Kun kort landskap 701–950px/≤520px påvirkes; de øvrige fagene forblir uendret. CSS URL-versjonen i index er økt for Safari-cache.


### 26.10 – opplesning og felles navigasjonsregresjon (påfølgende QA)

- På `a527138` besto Eggenipa i Chromium/WebKit, også de tre synlige lesesvarene i kort iPhone-landskap. `laria-task-phase3-polish` avdekket derimot at «Les opp» var bare 32 px høy; dette var en faktisk berøringsflatefeil i den bevisst kompakte Norsk-CSS-en.
- Hevet «Les opp» og toppstripen til 44 px i CSS-kildene. Redusert illustrasjonsradens høyde tilsvarende i den svært lave iPhone-landskapsvarianten, slik at de tre svarene fortsatt skal få plass over bretten. Eggenipa-testen kontrollerer nå også virkelig treffpunkt for opplesning.
- `Continuous smoke` forventet feilaktig en rev i Norsk; testen kontrollerer nå Norsk sitt synlige magiske hjelpesymbol, mens krav til korrekt valgt personlig rev beholdes for øvrige fag.
- `laria-ux-phase1-navigation` forsøkte å åpne den avviklede Bokskogen-portalen. Testen følger nå Reisen → Eggenipa → Lesekroken → Eggenipa → Reisen med faktisk kantsveip, og krever alle tre direkte aktivitetsinnganger.
- Ingen endring i originalillustrasjon, læringsdata eller den øvrige produktflyten. Verifiser samtlige tester på ny PR-head før publiseringsvurdering.


### 26.10 – Norsk hjelper reagerer på faktiske læringsresultater

- Reell kodefeil funnet: `laria-task-scene-v15.js` viste det nye magiske Norsk-symbolet, men den eksisterende reaksjonskoblingen var aldri aktivert. Bare de andre fagenes separate `LARIA_FOX_PRESENCE` kunne derfor feire riktige svar.
- Ny Norsk-avgrenset kobling lytter på ekte svar-interaksjoner og gir korrekt svar én kort `fox-correct`-reaksjon (620 ms), uten å knytte gamle rev eller ikke-godkjente troll til Norsk. Opplesning, Neste og andre knapper kan ikke utløse reaksjonen; tastaturaktiverte knapper fungerer gjennom ordinært klikk.
- `laria-task-phase3-polish` kontrollerer nå at hjelpesymbolet faktisk feirer riktig svar, at det finnes bare ett symbol, og at reaksjonen opphører. Det eldre Prompt 13-regresjonskravet for valgt rev og reaksjon kjøres nå på Engelsk, som fortsatt skal beholde samme fungerende rev frem til separat migrering.
- JS-URL versjonert for Safari/service-worker. Ingen læringsdata, Eggenipa-master eller andre fag er endret.


### 26.10 – riktig reaksjon per oppgave, full statisk kontrakt

- På `24d1389` viste CI at 407 av 408 Node-tester var grønne; eneste feil var en foreldet tekstbasert kontrakt som fortsatt krevde at *alle* fag kun brukte `LARIA_FOX_PRESENCE`. Kontrakten tester nå korrekt fagdeling: Norsk har egen magisk svarreaksjon; øvrige fag beholder eksisterende revekobling.
- Samtidig ble en potensiell repetisjonsfeil rettet: en listener på permanente `#question-wrap` kunne feire flere ganger etter et riktig svar. Listeneren festes nå til nye `.task-interaction` for hver oppgave og stopper etter første riktige reaksjon. Neste oppgave får egen listener; opplesning og navigasjon er utenfor.
- Nettlesertesten kontrollerer også at oppgave 2 feirer riktig svar, og at symbolet går tilbake til hvile. CSS, figurer, Eggenipa-original og læringsdata er urørt.
- Separat Gangemagi-CI feilet etter tre grønne Chromium-størrelser fordi WebKit ikke startet uten `libicudata.so.74` på runneren. Det er et miljøavvik, ikke dokumentert appregresjon. Krever separat verifisering.
