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
