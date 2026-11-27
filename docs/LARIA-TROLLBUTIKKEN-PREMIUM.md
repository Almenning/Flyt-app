# Trollbutikken: spillbar gjennomgangskandidat

**Status:** Integrert, reversibel forhåndsvisning. Ikke merget eller aktivert i produksjon.
Gjeldende klient: `967c276c6f329b04c6e6cf46bf5f61ccbd9412ef` på `feat/laria-trollbutikk`, fra `main` `834d3208074e315b01fdc959b0a5924c0b1196cc`. På en server med denne arbeidsgrenen, åpne `/laer-litt-mer/?app=laria&lariaTrollbutikk=1`, så **Hjem → Matte → Trollbutikken**. Uten parameteren er skiltet fraværende. Ingen PR er opprettet av dette lokale arbeidet. Eier kan få en separat, lukket forhåndsvisning uten publisering i appen.

## Hva som virker

- **Butikkeier:** Tre kunder per dag, seks håndskrevne handlelister fordelt over to ulike dager, seks gjenkjennelige varer, vareplukking med trykk eller dra-og-slipp, korreksjoner, kasse, lekepenger, nøyaktig veksel, kvittering og en trygg avslutning. En ny butikkdag kan startes uten å straffe pauser.
- **Kunde / Handletur:** Tre handleoppdrag med eget budsjett: én handlelapp med faste mengder og to åpne oppdrag der alle gyldige varevalg godtas. Barnet kan angre valg, se beløpet og gå til kassa når kurven passer. Mynter tas fra en begrenset lommebok. Man kan legge fram nøyaktig beløp eller mer, og får korrekt veksel. Kvitteringen skiller vekselen fra summen som er igjen av budsjettet. En egen kassetrollrolle er synlig ved betaling.
- **Lagerhjelper:** To separate leveranser. Fordel tolv epler i tre kurver med fire i hver, eller fyll en hylle fra seks til ti brød uten å tømme kassa. Hver vare flyttes én for én, kan tas tilbake og er tegnet på plassen der den telles. Leveringstrollet og barnets hjelper er separate roller. Hint gir støtte før de peker på en konkret flytting.
- **Fri butikk:** De samme fysiske varene kan legges til og fjernes. Prisen oppdateres underveis, uten en riktig/galt-dom. Ingen øktdata fra denne modusen lagres eller blandes inn i butikkdagen.
- **Troll:** Barnets valgte, godkjente troll hjelper. Et annet troll er kunden og gir en reell bestilling. Hjelperen gir forskjellige hint etter situasjon og et konkret hint ved gjentatt behov. Kunden og hjelperen har separate roller og reaksjoner. Brukerutløst opplesning vises bare for tilgjengelig lokal norsk stemme når lydinnstillingen tillater det; all informasjon er synlig som tekst. Tale avbrytes ved navigasjon. Ingen ny karakterkunst, betalte stemmer eller falske animasjonstilstander.
- **Matematikk:** Støttet telling, mengdesammenligning, gruppering av like priser, summering og subtraksjon i kontekst. Øre lagres som heltall; ulike sammensetninger med like stor veksel godtas. Bokmål og kroner brukes i grensesnittet. Sammenhengen med [Udir, MAT01-06, etter 2. trinn](https://www.udir.no/lk20/mat01-06/kompetansemaal-og-vurdering/kv1021?lang=nob) gjelder telling, representasjoner og addisjon/subtraksjon i lek og hverdagskontekst. Myntmekanikken gir øving i å sette sammen beløp og forklare veksel. Den er et designvalg, ikke bevis for at barnet mestrer plassverdi eller at læreplanen har egne betalingsmål.
- **Progresjon:** Egen versjonert, lokal spilltilstand etter samme mønster som Gangemagi. Den lagrer det som trengs for å fortsette dagens kunde, varekurv, kasse og vekslepenger, samt antall handler og avsluttede dager. Den endrer ikke barneprofil, generell mestring, svarlogg eller samlebok. Ingen nettverkslagring, faktisk handel, sporing, nye kostnader eller tidsfrister.
- **Integrasjon:** Felles treskilt i Tallvika, tilbake til Tallvika (inkludert eksisterende sveipmekanisme) og eksisterende rute til Hjem. Kandidaten flytter den separate Tallvika-figuren akkurat nok til å gjøre plass til det fjerde skiltet. Ingen endringer i låste bakgrunnsbilder, øvrige aktiviteter eller HverdagsOss.

## Spillbar investorvisning

Åpne en butikkdag med Storesøster som valgt troll. Lillebror bestiller tre epler og to brød. Prøv gjerne en gulrot først for å vise en korrigerbar feil. Plukk riktig mengde, sjekk varelinjene, regn ut 15 + 20 kr og skriv totalen 35 kr på kassa. Ta så imot 50 kr og gi 15 kr i veksel. Bruk deretter Fri butikk hvis en uformell sammenligning av varepriser er mer relevant for demonstrasjonen. Standardløpet består av tre kunder, men den første fullførte handelen kan vises alene.

## Kontrollgrunnlag

- 541 beståtte Node-tester, herav tolv spesifikke for Trollbutikken; disse inkluderer 500 komplette butikkdager (1 500 handler), vekselalternativer, lagergrenser, ugyldige mynter, gjenopptakelse, karakterroller og uavhengige spilltilstander. De to åpne budsjettene ble kontrollert mot 2 383 mulige kurver innenfor budsjett, der 1 889 tilfredsstilte de angitte mengdekravene.
- Faktiske rombilder er fra nettleserkjøring, ikke et kunstkonsept. Filnavn angir nettleser, enhet og scene. iPad liggende og iPhone stående viser romkandidaten `28b5dc5`; bilder fra de to endrede orienteringene i siste finpuss kommer fra `76fc855`. Skjermbildene av tilleggene før rommet kom fra `a8e1583`. Aktivt flagg: `lariaTrollbutikk=1`.
- Testmatrisen er iPad 1180 × 820 og 820 × 1180, iPhone 390 × 844 og 844 × 390, og desktop 1440 × 900. Den sjekker hele flyten, trykkflater og horisontal bredde, rolleidentitet, feil, kvittering, stående/liggende rotasjon under veksel, retur, gjenopptakelse og at appens hovedprogresjon ikke endres.
- Hele butikkdagen, handletur, lager og fri butikk er gjennomført i Chromium og WebKit på alle fem hovedmål i romkandidaten. Den siste visuelle finpussen ble også kontrollert separat i Chromium på stående iPad og WebKit på liggende iPhone. Tidlige gjentakelser timet ut på forskjellige synlige kontroller eller fikk en feil ved skjermbildefangst under parallell kjøring. I begge motorer ble dessuten tilgjengelig rute, 44 px trykkflater, bredde og handlinger kontrollert ved 1024 × 1366, 1366 × 1024, 1024 × 768, 375 × 667, 393 × 852, 430 × 932, 1280 × 720 og 1920 × 1080. En egen CI-kontroll er klargjort, men ikke kjørt på en PR.
- Ingen fysisk iOS-enhet, VoiceOver, barnebrukertest, faktisk lytteprøve eller nativ iOS-byggekontroll er gjort. Nettlesertesten blokkerer service worker for fast, lokal testtilstand; det er ikke en full frakoblet PWA-test.

## Reell begrensning og neste steg

1. Visuell gjennomgang før aktivering: en ny illustrert landhandel er lagt inn som avgrenset visningskandidat i forhåndsvisningen. Den er ikke godkjent for vanlig bruk. Tallvika ligger som uendret kildelag bak det gjennomsiktige vinduet. Hver vare og karakter er en separat spillkomponent; ingen funksjon er malt inn.
2. Test med et par barn på 2. trinn på ekte iPad og iPhone. Se om de forstår handlelappen, kassa og vekselen uten voksenstøtte. Test også tastatur, VoiceOver og norsk lokal stemme på fysisk enhet.
3. Bygg og kvalitetssikre en enklere inngang for yngre barn, flere pensumnære utfordringer, oppdragsvariasjon og adaptivt nivå. Koble relevante, helst observerbare læringshendelser til Samleboken og foreldreoversikten. Disse er ikke ferdige. Fri butikk er et åpent vare- og prisområde, ikke en full lager- eller betalingssandkasse.
4. Vurder det ekstra skiltets visuelle plassering på fysiske enheter og få eksplisitt godkjenning for eventuell ny scenekunst og produksjonsaktivering. Ikke merk spillet som lansert bare fordi det finnes på en sidestilt gren.

Produktfaglig, ikke brukertestet: I denne kandidaten er spilløkke og matematisk samsvar sterke nok til faktisk gjennomgang, mens illustrasjonsdybde, karakterbevegelser, tilgjengelighetsverifisering og gjenspillingsbredde ennå ligger under premiumambisjonen. Ikke gi dokumenterte mestringspåstander eller poeng som gir inntrykk av barnevalidering.


## Egenvurdering på skala 0–10

| Kategori | Vekt | Kandidat | Begrunnelse |
| --- | ---: | ---: | --- |
| Visuell kvalitet | 15 % | 7 | Sammenhengende, illustrert butikkrom med fysiske varer, disk og kasse; visuell retning må godkjennes og prøves med barn. |
| Spillbarhet | 20 % | 7 | Fysisk vareplukking, reverserbare handlinger og full transaksjon henger sammen; flere moduser gjenstår. |
| Pedagogisk kvalitet | 15 % | 7 | Hverdagsregning med nøyaktige fasiter og alternativer; mangler innsteg og tilpasning. |
| Trollintegrasjon | 15 % | 6 | To reelle roller per handel og målrettede hint; begrenset animasjon og samspill. |
| Brukervennlighet | 10 % | 7 | Stort mål, klare steg og tekst uten lyd; ikke observert med barn. |
| Responsivitet | 10 % | 7 | Fem nyttige skjermformater i to nettlesermotorer; kort mobil krever blaing. |
| Teknisk stabilitet | 10 % | 7 | Deterministisk motor og lokale regresjoner; frakoblet, fysisk og samlet CI gjenstår. |
| Gjenspillingsverdi | 5 % | 6 | To butikkdager, tre handleturer, to leveranser og fri utforsking er på plass; innholdsbredden er fortsatt begrenset. |

Vektet egenvurdering: **6,8 / 10**. Det er ikke et mål fra brukertest og ikke en anbefaling om produksjonslansering.

## Ny runde å vise: Handletur og lager

1. Velg **Gå på handletur**. Ta to epler, ett brød og én flaske melk. Kurven koster 28 kr av et budsjett på 30 kr.
2. Prøv med 25 kr for å få et støttende avslag. Legg fram 30 kr. Kassatrollet gir 2 kr tilbake; det er 2 kr igjen totalt.
3. Velg **Ny handletur**. En handlekurv med ett eple, ett brød og ett jordbær koster 18 kr. Betal med en 20-kroning. Nå er vekselen 2 kr, mens oppdragets budsjett på 40 kr har 22 kr igjen.
4. Gå tilbake til butikkdagen. Velg **Hjelp på lageret**, fordel tolv epler og fyll deretter en hylle med akkurat fire brød fra kassa. Åpne og lukk lageret for å se at varene forblir der.

Handletur og Lagerhjelper bruker egne, versjonerte lokale lagringsnøkler. I betalingsfasen bevares myntene ved rotasjon og omlasting. Det endrer ikke Butikkdagen eller appens øvrige progresjon. Dette er ikke dokumentasjon av barnets faglige mestring.

## Illustrert butikkrom: visuell kandidat

Varevalg er interaktive varer på to fysiske trehyller med små, faste prislapper. Kunden står i rommet bak disken, og varene vises faktisk i kurven når de blir valgt. Dynamisk beløp er lagt som lesbar tekst i et eget mekanisk kassaapparat; det er aldri malt inn i bildet. Den samme veggen, utsikten, lampen og et nedtonet, ikke-interaktivt vareoppsett beholdes ved betaling og kvittering. En egen komposisjon for stående mobil plasserer samme varer, kurv og kasse i naturlig rekkefølge uten horisontal rulling.

Rommet, varene og kassa er separate kandidatressurser under `assets/trollbutikken/`. Samlet størrelse er omtrent 550 KB. Illustrasjonen og produktene er kandidater for gjennomgang, ikke nye låste appressurser. Den treffer bare den eksisterende avgrensede Trollbutikk-ruten med `lariaTrollbutikk=1`. Hjem, de låste Tallvika-illustrasjonene, trollidentitetene og spillmotorens fasiter er ikke endret.

## Lekepenger på disken

I Butikkdagen og På handletur kan spilleren dra en mynt til disken eller trykke for å legge den fram. Disken markeres når mynten kan slippes. Slipp utenfor disken flytter ikke mynten. Trykk på en mynt som ligger på disken for å ta den tilbake. Begrensningene i lommeboka og all tidligere progresjon bevares. Endringen bruker de eksisterende, tastaturtilgjengelige knappene og introduserer ingen nye kunstressurser. Testen kontrollerer musebevegelse, emulert berøring i Chromium, avbrutt flytting, synlig sum, fjerning og gjenopptakelse. Fysiske enheter er ikke testet.

## Oversiktlig kurv og mer ansvar i kassa

Kurven beholder den fysiske illustrasjonen og viser i tillegg antall varer totalt og én ryddig linje per vareslag med egen knapp for å fjerne én. I Butikkdagen vises ikke samlet pris i kurven. Kassa viser antall og stykkpris, ikke delsummer eller fasit. Barnet sjekker varelinjene, skriver summen i hele kroner og får retningsbestemt tilbakemelding dersom summen ikke stemmer. Trollet starter med et strategihint og gir delsummer først når barnet ber flere ganger. Under veksel vises prisen kunden skal betale, pengene kunden har gitt og de faktiske myntene barnet legger ut; summen av myntene vises ikke automatisk. Feil gir ingen straff. Kvitteringen viser regnestykket. Fri butikk og På handletur beholder prishjelpen. Ingen nye lagringsnøkler eller endring av eksisterende progresjon.

## Avgrenset lanseringskandidat for 2. trinn

Den ordinære inngangen er **Hjem → Matte → Trollbutikken** når Tallvika viser 2. trinn. Se valgt trinn i Tallvika: Å utforske 2. trinn fra et annet profiltrinn er mulig og endrer ikke barnets profil. Andre viste trinn har de samme tre eksisterende skiltene. Spilldata og tidligere lagring er uendret. Dette er en avgrenset førsteversjon, ikke alle planlagte nivåer eller full pedagogisk tilpasning.

For feilsøking skjuler `lariaTrollbutikk=0` skiltet og avstår fra å starte spillet; `lariaTrollbutikk=1` bevarer eksplisitt visning på andre trinn. Sistnevnte er en visningsoverstyring, ikke tilgangskontroll. En full tilbakeføring kan reversere denne avgrensede aktiveringen eller fjerne 2 fra listen over utgitte trinn; spilldata slettes ikke. Læria har egne, koordinerte versjonstagger for butikkens CSS/JS, Tallvika-integrasjonen og service worker. Ingen endring i HverdagsOss, manifest eller godkjent kunst.

Denne grenen er en **lanseringskandidat**, ikke en publisering. Tidligere avsnitt beskriver de isolerte kandidatene på de angitte revisjonene. Eksakt hovedversjon må gjennom prosjektets egne release- og kvalitetsporter; ikke erstatt krav om faktisk godkjenning, fysiske enheter eller barnepilot med nettleseremulering.
