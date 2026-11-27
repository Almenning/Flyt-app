# Læria Premium 4.0 · investorkandidat

**Status: testkandidat, ikke produksjonsgodkjent.** Baseline er faktisk `main` `834d3208074e315b01fdc959b0a5924c0b1196cc`. Samlet [draft #289](https://github.com/Almenning/Flyt-app/pull/289). Se PR-hodet og testartefaktene for bygg-ID; en rapport kan ikke inneholde sin egen commit-hash. [Demoskript](LARIA-PREMIUM-4-INVESTOR-DEMO.md). HverdagsOss, produksjonsdata, priser og låste bilder er ikke endret.

## Faktiske forbedringer

- **P0, oppdatering:** Ved full eller sperret diskcache returneres den ferske nettresponsen fortsatt. ES-moduler følger samme nett-først-regel som vanlig JavaScript. Tidligere verifiserte Gangemagi-cachekrav beholdt. Det er ikke dokumentert at alle aktiviteter fungerer offline ved kald start.
- **P1, Matte:** Gangemagi på 320 × 568 viste ikke hele én regneoppgave uten scrolling. Nå er tittel, bær, ligning og neste handling tilgjengelige i spillflyten. Scenebildet, matematikken og separat kunstvalg for fri lek og oppdrag er beholdt. Plukk og tell viser nå de seks spillbare objektene og tellingen uten å rulle på 320 × 568.
- **P1, Geografi:** #288 er vurdert som egen endring: flagget dekker ikke lenger landnavnet. Land og flagg tilpasser svarene og kartalternativet til kort, stående mobil og viser neste handling der den ellers var skjult. Ingen landdata eller fremgang er endret.
- **P1, Engelsk:** På korte, liggende skjermer fikk den verifiserte Kinnaklova-scenen én venstrestilt skinne med de faktiske skiltknappene. Eksisterende låst artwork og digest-gate beholdt. Ingen ny bakgrunn.
- **P2, innhold:** Lesekroken på 2. trinn bruker korte tekster med spørsmål. Fire nye norske mikrotekster (bokmål og nynorsk) og fire engelske situasjonsreplikker gir forklaringer og hint knyttet til oppgaven, ikke bare riktig/galt. Oppgavene er øving, ikke bevis på leseflyt eller spontan samtale.
- **P2, lyd og tillit:** Egen opt-in stemmeprøve på Hjem, uten automatisk tale. Prøver bare lokal norsk stemme og viker for oppgaveopplesning. Fysisk stemmekvalitet er ikke godkjent. Foreldresiden forklarer lokal lagring, tap ved nettlesersletting og kartdataforespørsler.

## Repo- og produktavgrensning

- #276: cache-rettelsen er allerede i main; det nye arbeidet gjenbruker relevante regresjoner og retter et separat layoutproblem. Ikke merge gammel gren.
- #278: stemmetesten var ikke i main. Den nye avgrensede testen erstatter behovet for å merge den gamle grenen. Ingen produksjonsaktivering. #288 er portert inn på samme kandidat, men gammel PR er ikke merget eller lukket.
- Home v16 og låste fag mot dagens main er utgangspunktet, ikke den eldre #243-statusfilen som releasebevis. Ikke overstyr den eksisterende godkjenningsporten. **Trollvekten** holdes separat i sin private forhåndsvisning; ingen skjult aktivisering i denne demoen. Ikke gi løfter om at painted v15 på iPhone har samme aktørlogikk som v16.
- Fagkontroll: [Udir Norsk NOR01-08](https://www.udir.no/lk20/nor01-08/kompetansemaal-og-vurdering/kv1107?lang=nob), [Engelsk ENG01-06](https://www.udir.no/lk20/eng01-06/kompetansemaal-og-vurdering/kv1), [Matematikk MAT01-06](https://www.udir.no/lk20/mat01-06/kompetansemaal-og-vurdering/kv1021?lang=nob). Dette er mål **etter** 2. trinn, ikke en sertifisering av appen. Geografi er fri utforsking; det er ikke et eget plassholdt kompetansemål for 2. trinn.

## Investorens poengkort

Skala 0–10. Subjektive produktvurderinger, ikke målte brukerresultater. Bevis for tekniske påstander ligger i de separate testresultatene.

| Område | Vekt | Før | Etter | Hva vurderingen bygger på |
|---|---:|---:|---:|---|
| Visuell premium | 15 % | 7 | 7 | Grovanova og fagmotivene holder; Gangetabell og foreldreflate er mer verktøy enn eventyr. |
| Helhet | 10 % | 6 | 7 | Flere fagoppsett deler samme navigasjon også i kort landskap; v15 på mobil er fortsatt et annet malingslag. |
| Responsivitet | 12 % | 5 | 7 | Kritiske svar og navigasjon var utenfor første skjerm; kontrollert på konkrete formater, ikke alle fysiske enheter. |
| Faglig innhold | 15 % | 6 | 7 | Litt større dybde med lesebevis og naturlige engelske svar; fortsatt mye gjenkjenning fremfor selvstendig tale/tekst. |
| Barnets engasjement | 12 % | – | – | Ingen observert barneprøve eller målt gjenbruk. Visuell appell er ikke et retensjonsmål. |
| Troll | 8 % | 6 | 6 | Godkjente figurer beholdes, ny test er opt-in; ingen fysisk bekreftelse på kvaliteten på stemmer. |
| Navigasjon | 8 % | 6 | 7 | Samme innganger, færre gjemte handlinger; oversikt og tilgjengelighet trenger bredere fysisk test. |
| Stabilitet/ytelse | 10 % | 6 | 7 | Defensiv service worker og regresjoner, men ingen feltmålt LCP/INP eller validert kald offline-flyt. |
| Foreldretillit | 5 % | 5 | 6 | Tydeligere datainformasjon; ingen full personvern- eller abonnementsverifisering. |
| Kommersiell verdi | 5 % | 5 | 5 | Troverdig forskjell i språk, sted og univers. 1 000 betalende er et mål uten bekreftet betalingsvilje. |

## Gjenstående konkrete avvik

- Hjem v15 på mobil har malte figurer og navigasjonselementer. På kort liggende mobil er enkelte malte Hjem-treffområder under 44 px; det krever et særskilt godkjent oppsett eller kildebilde, ikke tilfeldig cropping. Større skjermer kan fortsatt få sidefelt fra godkjent `contain`.
- Deler av Lesekroken og engelske oppgaver krever naturlig scrolling for å se tilbakemelding og «Neste» på telefon. Gangetabellens tette kontrollflate og foreldreområdet har ikke samme sceniske kvalitet som Hjem.
- Ingen stor omskriving av adaptiv læring, Samleboken, hele innholdsbanken, abonnement eller nye landskap. Dette er prioriterte avgrensninger, ikke ferdige revisjoner.

## Test og utgivelsesport

- Bruk eksakt PR-head og [demoens nettlesertest](LARIA-PREMIUM-4-INVESTOR-DEMO.md); Node, Chromium, WPE WebKit og dedikert iOS-staging er ulike bevis. WebKit på Linux er ikke Safari på en fysisk iPhone, og staging er ikke Xcode-bygg eller App Store-godkjenning.
- Vurder **hva som faktisk er øvd på**, ikke mestring automatisk ved én oppgave. Syntetiske profiler, ingen nye analyse-SDK-er, ingen kjøp i demoen. Kartkildene kan motta nettverksmetadata, ikke selve profilen eller besvarelsene. Eksisterende to-tjenesters kartoppslag er fortsatt en personvernvurdering. Apple [Kids Category](https://developer.apple.com/app-store/review/guidelines/#kids-category) skiller foreldregate fra samtykke. [Datatilsynet om samtykke](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/om-behandlingsgrunnlag/samtykke/) er relevant dersom samtykke er valgt behandlingsgrunnlag. Dette er en teknisk avgrenset revisjon, ikke etterlevelseserklæring.
- Bruk den dokumenterte demoreisen fremfor å åpne tilfeldig skjerm. Vis Hjem, én løst aktivitet, Kloden, Samleboken og foreldrevisningen. Ingen ekte barns data eller ekte betaling.

## Hva kan hindre at foreldre betaler?

1. **Gjenbruk er ikke målt.** Observer om barn på måltrinnet velger en aktivitet til og faktisk vender tilbake i neste uke. Ingen streaks eller kjøpspress.
2. **Faglig variasjon må vare.** Dypere situasjoner og flere nyttige løsninger før flere verdener eller mange nesten like spørsmål.
3. **Svakeste skjerm setter prisen.** Det er de faktiske oppgavene og avbrudd/retur på små telefoner som må føles like gode som Hjem.
4. **Foreldrene trenger konkret verdi.** Vis utført øving og forståelige neste steg; ikke påstå mestring, og verifiser fysisk foreldregate, offline- og gjenopprettingsflyt.
5. **Sterke gratisalternativer setter terskelen.** [Khan Academy Kids](https://www.khanacademy.org/kids) tilbyr bred tidlig læring gratis; [Duolingo ABC](https://blog.duolingo.com/a-good-read-building-duolingo-abc-for-android/) fokuserer på tidlig lesing; [Kahoot! Kids](https://kahoot.com/home/kahoot-kids/) samler mange læringsapper, og [DragonBox/Poio](https://support.kahoot.com/hc/en-us/articles/4815480526227-How-to-manage-DragonBox-and-Poio-subscriptions) tilbyr kjøpsalternativer. Det er produktbeskrivelser, ikke en uavhengig kvalitetsrangering. Læria bør vinne på norsk språk, sammenhengende univers og kvalitet i valgte økter, ikke på antall minispill eller pris alene.

**Avsluttende beslutning:** Vis en verifisert reise i privat kandidat, men ikke kall hele appen investor- eller produksjonsklar før vesentlige åpne problemer, fysiske kontroller og eierporter er behandlet.
