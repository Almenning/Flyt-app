# MASTERPROMPT – LÆRIA: TO GLOBUSER

## Låst produktkontrakt – 17. oktober 2026

**Status: LÅST PRODUKTBESLUTNING**

**Prosjekt:** Læria\
**Repository:** `Almenning/Flyt-app`\
**Område:** Geografi / Kloden\
**Hovedprinsipp:** Bevar dagens løsning. Bygg en ny illustrert oppdagelsesglobus som et tillegg.

---

## 1. Overordnet mål

Læria skal tilby to forskjellige globusvisninger:

1. **Enkel globus:** Den eksisterende, geografisk korrekte globusen.
2. **Oppdagelsesglobus:** En ny, visuelt rik, illustrert og barnevennlig globus inspirert av de godkjente konseptillustrasjonene.

Begge skal være fullverdige og tilgjengelige i appen.

Den nye oppdagelsesglobusen skal gi barnet følelsen av å utforske en levende eventyrverden, med fjell, skoger, ørkener, hav, dyr og geografiske særtrekk.

Kvalitetsambisjonen er at kloden skal oppleves som en premium 2.5D-verden, samtidig som den fungerer som en reell, interaktiv globus.

**Det er ikke tillatt å erstatte, forenkle eller forringe eksisterende funksjonalitet for å oppnå dette.**

## 2. Ufravikelige krav

### A. Eksisterende globus skal bevares

Dagens enkle globus skal fortsatt fungere som før.

Følgende skal beskyttes:

- Geografisk korrekte landkonturer og grenser.
- Eksisterende kart- og landdata.
- Rotasjon, berøring og zoom.
- Trykk på land og landgjenkjenning.
- Landinformasjon og «Lær mer».
- Oppgaver, fremgang og lagrede brukerdata.
- Eksisterende navigasjon og visningsmoduser.
- Klodens størrelse og plassering.
- Bakgrunnsillustrasjoner og øvrig design.
- Ytelse og stabilitet på iPhone og iPad.

Ingen eksisterende kartressurser skal overskrives.

Den enkle globusen skal være en selvstendig, permanent tilgjengelig visning, ikke bare en midlertidig reserve.

### B. Oppdagelsesglobusen bygges separat

Den nye visningen skal utvikles som en isolert tilleggsløsning.

Den kan benytte eksisterende geografiske data, projeksjonslogikk og landvalgsfunksjonalitet, men skal ha sin egen visuelle gjengivelse.

Unngå å duplisere landdata, geografiske algoritmer eller progresjonslogikk unødvendig.

En feil i den nye illustrerte gjengivelsen må ikke påvirke den enkle globusen.

Inntil den nye versjonen er godkjent, skal den bare være tilgjengelig gjennom en separat forhåndsvisning eller funksjonsbryter.

## 3. Visuell produktkontrakt

Oppdagelsesglobusen skal følge Lærias etablerte varme, illustrerte og eventyrlige premiumstil.

De godkjente illustrasjonene av verden, Norge, Japan og Brasil er visuelle kvalitetsreferanser.

De skal brukes som inspirasjon til:

- Fargebruk og lyssetting.
- Dybde og landskapsutforming.
- Illustrerte fjell og skoger.
- Ørkener, tropiske områder og is.
- Hav og marine detaljer.
- Små geografisk relevante illustrasjoner.
- Gradvis økende detaljgrad under zoom.

Illustrasjonene er ikke geografiske fasiter.

**Kartet må være geografisk korrekt selv om uttrykket er eventyrlig.**

Ikke legg et statisk AI-generert verdenskart som en tekstur over kloden dersom det medfører feilplasseringer, forvrengning eller unøyaktige landgrenser.

Den geografiske geometrien skal være fasit. Illustrasjoner og landskap skal tilpasses geografien, ikke omvendt.

## 4. Tre nivåer av visuelle detaljer

Oppdagelsesglobusen skal bruke gradvis detaljering etter zoomnivå.

### Nivå 1 – Hele verden

Barnet ser den komplette globusen.

Vis:

- Tydelige kontinenter og landformer.
- Illustrerte, naturlige fargevariasjoner.
- Store fjellkjeder og landskapssoner.
- Skog, ørken, hav, is og tropiske områder.
- Et begrenset antall tydelige illustrasjoner.

Uttrykket skal være vakkert og ryddig.

Kontinentene må være lette å kjenne igjen.

### Nivå 2 – Verdensdel og region

Når barnet zoomer nærmere, skal verden vise flere detaljer.

Vis eksempelvis:

- Flere fjell og skogsområder.
- Regionale landskapstrekk.
- Enkelte dyr og naturdetaljer.
- Relevante landemerker.
- Mer detaljerte kyst- og terrengillustrasjoner.

Alle geografisk spesifikke detaljer skal ha korrekte posisjoner.

Detaljene skal følge kloden under rotasjon.

### Nivå 3 – Land og nærområder

Ved nærzoom skal barnet kunne oppdage små detaljer som ikke var synlige på avstand.

Eksempler:

- Norske fjorder og fjell.
- Japanske kirsebærtrær og Fuji-fjellet.
- Amazonas i Sør-Amerika.
- Sahara i Nord-Afrika.
- Dyreliv og landskap knyttet til riktige geografiske områder.

Ikke fyll kartet med tilfeldige dekorasjoner.

Illustrasjonene må være tydelige, geografisk relevante og tilpasset skjermstørrelsen.

Barnet skal oppleve at verden blir rikere når det zoomer, ikke bare at den samme grafikken blir større.

## 5. Zoom, rotasjon og geografisk presisjon

Dette er et kritisk kvalitetskrav.

Tidligere forsøk har gitt utfordringer med zoom, forvrengning, geografisk registrering og visuell kvalitet.

Den nye implementeringen skal ta hensyn til disse erfaringene.

Krav:

1. Landkonturer skal beholde geografisk korrekt form.
2. Kartillustrasjoner skal følge korrekte koordinater.
3. Zoom skal være jevn og intuitiv.
4. Rotasjon skal fungere uten synlige feil.
5. Detaljer skal ikke flytte seg relativt til geografiske posisjoner.
6. Illustrasjoner skal tilpasses zoomnivå og tilgjengelig ytelse.
7. Berøring og landvalg skal fungere uavhengig av illustrasjonslaget.
8. Kloden skal fortsatt være en faktisk roterbar globus, ikke et flatt kart.

Prioriter korrekt geografi, stabilitet og brukervennlighet foran dekorativ kompleksitet.

Dersom enkelte illustrasjoner reduserer ytelsen under bevegelse, kan detaljeringen midlertidig forenkles. Full visuell kvalitet skal komme tilbake når bevegelsen stopper.

## 6. Valg mellom globusene

Når oppdagelsesglobusen er ferdig utviklet og godkjent, skal barnet enkelt kunne bytte mellom:

**Enkel | Oppdag**

Bryteren skal plasseres diskret i eksisterende Kloden-visning.

Den skal ikke erstatte de eksisterende valgene «Utforsk», «Min verden» og «Kloden».

Ved bytte bør følgende beholdes:

- Valgt land.
- Klodens orientering.
- Zoomnivå, dersom teknisk forsvarlig.
- Eksisterende progresjon og brukerdata.

Valget mellom visningene skal kunne lagres som en brukerpreferanse, uten å påvirke faglig progresjon.

Dagens enkle globus skal forbli standard inntil en annen standard er uttrykkelig godkjent.

## 7. Teknisk gjennomføring

Start med å undersøke eksisterende kode på siste `main` og relevante åpne arbeidsgrener.

Identifiser:

- Nåværende geografimotor og datakilder.
- Hvordan globusen tegnes.
- Hvordan zoom og rotasjon fungerer.
- Eksisterende illustrasjonslag.
- Tidligere forsøk på illustrerte kart.
- Årsakene til at tidligere løsninger ikke nådde ønsket kvalitet.
- Aktuelle tester og tekniske begrensninger.

Se særlig på tidligere kart- og globe-endringer, inkludert løsningene for geografisk forankrede illustrasjoner.

Ikke bygg en helt ny geografimotor uten dokumentert nødvendighet.

Opprett en separat utviklingsgren og en avgrenset prototype for Oppdagelsesglobusen.

### Utviklingsfaser

**Fase 1 – Geografisk og visuelt fundament**

Lag et illustrert grunnkart som beholder korrekte landkonturer og viser naturlige landskapsvariasjoner.

**Fase 2 – Zoomstyrt detaljering**

Implementer de tre nivåene med illustrasjoner som kommer frem gradvis.

**Fase 3 – Geografiske demonstrasjonsområder**

Prioriter Europa, Afrika og Asia, med nærzoom på Norge og Japan. Kontroller også Brasil og andre verdensdeler for å avdekke geografiske eller tekniske svakheter.

**Fase 4 – Full interaktivitet**

Verifiser zoom, rotasjon, landvalg, overgang mellom nivåer og ytelse.

**Fase 5 – Sammenligning**

Ta faktiske skjermbilder av dagens enkle globus og den nye oppdagelsesglobusen ved tilsvarende perspektiver og zoomnivåer.

**Fase 6 – Brukergodkjenning**

Presenter resultatet før den nye løsningen integreres i den ordinære brukerflyten.

**Fase 7 – Integrasjon**

Først etter godkjenning implementeres den permanente visningsbryteren.

Ingen automatisk sammenslåing til `main` eller produksjonspublisering uten uttrykkelig godkjenning.

## 8. Tester og kvalitetskrav

Begge globusene skal testes.

Prioriter:

- iPad liggende.
- iPad stående.
- iPhone stående.
- iPhone liggende.
- Safari/WebKit.
- Chromium som supplerende kontroll.

Verifiser geografisk treffsikkerhet for flere land, inkludert små land og øyer.

Ta skjermbilder både ved stillestående klode og under zoom/rotasjon.

Kontroller at:

- Den enkle globusen fortsatt fungerer identisk med tidligere.
- Den nye globusen viser riktig geografisk innhold.
- Ingen illustrasjoner ligger på feil sted.
- Ingen store områder blir tomme eller unaturlig strukket.
- Detaljnivåene fungerer ved zoom.
- Kartet er responsivt og visuelt gjennomarbeidet.
- Berøring og landvalg ikke påvirkes negativt.
- Informasjonspaneler ikke overlapper viktige kontroller.
- Tilbakeknapp og navigasjon fungerer.
- Ingen regresjoner oppstår i andre Læria-funksjoner.

Eksisterende automatiserte tester skal fortsatt bestå.

Faktiske skjermbilder skal vurderes visuelt. Grønne automatiserte tester er ikke alene tilstrekkelig for å godkjenne premiumkvaliteten.

Tester på simulerte enheter skal ikke feilaktig omtales som tester på fysiske enheter.

## 9. Arbeidsregler

Følgende er bindende:

- Ikke redesigner hele Kloden.
- Ikke endre eksisterende landdata.
- Ikke forenkle eller fjern eksisterende funksjoner.
- Ikke endre Lærias godkjente bakgrunn eller øvrige visuelle identitet.
- Ikke endre andre fag eller aktiviteter.
- Ikke endre barnets personlige rev.
- Ikke erstatt dagens globus.
- Ikke publiser en visuelt svak løsning bare fordi den fungerer teknisk.
- Ikke bruk illustrasjoner med uavklart kommersiell bruksrett.
- Ikke gjennomfør omfattende refaktorering som ikke er nødvendig for oppdraget.
- Ikke gå videre til ordinær integrasjon dersom prototypen ikke er godkjent.

Ved tekniske problemer skal rotårsaken undersøkes. Ikke skjul feil med midlertidige løsninger som ødelegger kartkvaliteten.

## 10. Ferdigkriterier

Oppdagelsesglobusen kan først anses som ferdig når:

1. Den har et gjennomført premiumuttrykk.
2. Landkonturer og landvalg er geografisk korrekte.
3. Detaljene utvikler seg naturlig ved zoom.
4. Rotasjon og zoom fungerer godt på iPad og iPhone.
5. Illustrasjoner forblir korrekt plassert.
6. Eksisterende enkel globus er bevart og fungerer.
7. Begge visninger kan brukes uten tap av progresjon.
8. Relevante tester er bestått.
9. Faktiske skjermbilder er gjennomgått.
10. Brukeren har godkjent den nye opplevelsen.

**Det er ikke tilstrekkelig å ha laget en fungerende illustrert globus. Den skal også nå det visuelle kvalitetsnivået som er vist i de godkjente konseptillustrasjonene, så langt dette kan forenes med korrekt og fungerende geografi.**

## 11. Endelig produktprinsipp

> Læria skal beholde dagens enkle globus som en nyttig, geografisk korrekt og oversiktlig læringsvisning. I tillegg skal appen tilby en ny illustrert oppdagelsesglobus som gir barnet følelsen av å utforske en levende verden. Begge visninger skal ha sin egen verdi, være enkle å bruke og fungere uten at den ene forringer den andre.

**Denne beslutningen er låst. Endringer i hovedprinsippene krever uttrykkelig godkjenning.**

---

## Første konkrete oppdrag

Start med fase 1.

Undersøk eksisterende globe-implementering og tidligere forsøk. Lag deretter en isolert, geografisk korrekt visuell prototype av Oppdagelsesglobusen med fungerende grunnkart og et første illustrasjonsnivå.

Vis den i tre zoomnivåer og fra flere geografiske perspektiver.

Behold dagens globus uendret.

Lever konkret kode, en forhåndsvisning, skjermbilder og testresultater. Beskriv eventuelle avvik fra de godkjente illustrasjonene.

**Stopp før sammenslåing eller publisering, slik at resultatet kan vurderes og godkjennes.**
