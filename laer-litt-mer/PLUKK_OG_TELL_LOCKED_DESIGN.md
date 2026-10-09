# Læria · Plukk og tell: låst illustrasjons- og funksjonskontrakt

Status: Låst av bruker 9. oktober 2026, som videreføring av alle godkjente illustrasjonsserier i prosjekttråden. Denne kontrakten gjelder designretning og atferd. Den betyr ikke at konseptbildene i seg selv automatisk er ferdige, tellekorrekte appressurser.

## Formål
Barnet skal utforske gange, pluss, minus og senere divisjon ved å gripe inn i en illustrert verden. Barnet bestemmer tempoet. Mestring åpner aldri for å frata barnet lek det liker. Ikke lag en hvit eller steril oppgaveside.

## Illustrasjonsverdener, alle åpne
1. Jordbærhagen: 2,5D flettede fruktkurver, natur, blomster, jordbær.
2. Eventyrbakeriet: varme bakerrom, rutete lin, bakerbrett med boller.
3. Soppskogen: lun skog, mose og trekasser med eventyrsopper.
4. Frukthagen: epler, flettede kurver, grønne trær, natur.
5. Skattekammeret: steinkammer, kister og tellbare edelstener.
6. Eventyrtoget: jernbanestasjon, vogner og tellbar bagasje.
7. Strandekspedisjonen: strand, sjø og skjell i bøtter.
8. Gårdstunet: låve, høy og egg i reir.
9. Akvariet: lys gjennom vannet, bobler, vannplanter og fisker i glassbeholdere.
10. Ballongparken: tivoli og ballonger i grupper.

Godkjent konseptretning bygger på fire tidligere illustrasjonstavler med eksempler på Plukk én, Legg tilbake, Fjern én fra hver, Tøm en hel gruppe, Flytt mellom grupper, Oppdrag, Ulike visninger og Angre. Dagens konseptgrafikk inneholder stiliserte, til dels feilaktige illustrerte antall og kan **ikke** legges inn som statiske regnescener. Tellbare gjenstander skal genereres separat fra bakgrunnen og kunne plukkes individuelt.

## Låste handlinger
- Plukk én gjenstand direkte eller med stor knapp; resultat og visuelt antall oppdateres sammen.
- Legg én tilbake fra samlekurven.
- Fjern én fra hver gruppe; se nye faktorer når like grupper gjenoppstår.
- Tøm en valgfri hel kurv; den tomme kurven står igjen slik at barnet ser hva som skjedde.
- Flytt objekter mellom grupper med berøring/valgt mål, og med dra-og-slipp som tillegg.
- Angre og gjør om minst 80 steg, og start på nytt.
- Bytt eventyrverden uten å endre antall eller beregning, og lag en ekstra kurv.
- Fire åpne oppdrag: akkurat 24, like grupper, tøm én gruppe til 2 × 10, 18 på to ulike måter.
- Lydlesing på norsk hvis enheten støtter det.
- Ingen stoppeklokke, daglig straff eller ubegrunnet belønning. Lek skal ikke telle som fullført tradisjonell øvingsøkt.

## Matematikkkontrakt (ikke valgfri)
Start: `3 × 10 = 30`. Plukk én: `3 × 10 − 1 = 29`; forklar ulik fordeling. Én fra hver: `3 × 9 = 27`. Tøm en kurv: `2 × 10 = 20`.
Når gruppene ikke er like, bruk korrekt subtraksjonsforhold eller nøyaktig addisjon som `8 + 10 + 9 = 27`. Ikke påstå at ulike grupper kan uttrykkes som et nytt gangestykke med én felles faktor.
Ved flytting mellom grupper skal totalsummen være konstant. Maks fem grupper, tolv gjenstander per gruppe av hensyn til lesbarhet og ytelse. Lokalt lagret utforskningsstatus holdes adskilt fra fremgang i «Øv».


## Posisjonsriktig plukking og visninger
Når barnet peker på det tredje jordbæret, skal **det tredje objektet** forsvinne, ikke det sist tegnede. Gjenstander har stabile interne identiteter som følger dem til samlekurven, gjennom angre/gjør om, mellom kurver og ved opplasting av lagret lekestatus. Samlekurven skal vise de faktisk plukkede illustrasjonene (med samlet antall når de er mange).

Barnet kan alltid bytte mellom fire uttrykk uten at mengden endres:
- **Grupper**: et kort for hver gruppe med antallet.
- **Rader**: faktiske prikker for samtlige gjenstander, gruppert per rad.
- **Tallinje**: dynamiske hopp ut fra antall i hver gruppe, også når de er ulike.
- **Sirkel**: en ring med én markør for hvert objekt i hver gruppe.

Visningene er pedagogiske supplementer til den manipulerbare scenen, og ødelegger aldri interaksjonen. Læria-reven følger med som støttende ledsager uten å gi feilstraff eller holde innhold låst.

## Visuell kvalitet
- Lærias varme håndlagde 2,5D-retning, med materialfølelse, perspektivlag, landskap og dype men ikke overdrevne skygger.
- Synlige og riktige matematiske gjenstander. Dekorative gjenstander skal aldri telle i summen.
- Store berøringsknapper og egne tilgjengelige navn. En liten gjenstand har dessuten en stor «−1»-handling under hver gruppe.
- iPhone, iPad, portrett og landskap uten sideveis side-overflow, skjermstrekk eller tappede objekter.
- Standard «Utforsk og lek» åpner fortsatt **10 × 10-tabellen først**, og Plukk og tell er en egen frivillig aktivitet.
- 1.–2. trinn rikest i eventyrstil. Strammere uttrykk for eldre trinn.
- Ingen statisk screenshot-overlay med fiktive tall. Tellelogikken og bildelagene må holdes separat.
- Full bildelikhet med de låste konseptillustrasjonene må dokumenteres visuelt. Den kan ikke erklæres oppnådd bare fordi testene passerer.

## Kvalitetssperrer før publisering
1. Ren Node-modelltest av alle overganger, regnestykker, grenseverdier og oppdragsmål.
2. Safari/WebKit og Chromium på iPhone/iPad for berøring, undo, flytting, oppdrag og lokal lagring.
3. Skjermbilder av alle miljøer og særlig 3 × 10-situasjonene; gjennomgå mot konseptene.
4. Ingen regresjon i tabell 10 × 10, gangetabell-øvingen, Brøklaben eller kloden.
5. Sammenføy og publiser kun ved grønne kontroller. Skill teknisk ferdig fra full kunstnerisk godkjenning.


## Premium kunstpass v2, visuell kontrakt

Status: Revisjon av publisert PR #67 mot brukerens låste konseptillustrasjoner.
Implementering skjer uten endring i den rene matematiske modellen.

- Hver av de **ti** verdenene har et eget illustrert scenebakteppe, ikke bare fargevariasjon av en generisk kurv. Foreground-spillgjenstandene forblir dynamiske og tellbare, mens bakgrunnen er separat og kan brukes ved ulike antall.
- Fysisk materiell er tematisk: flettet kurv og håndtak i fruktverdenene, rutet bakepapir og serveringsbrett i bakeriet, tre- og mosekasser i skogen, gullforsterket skattkiste, vogn med hjul, sandbøtter, reir og glassbeholdere. Ikke samme generiske beholder i alle verdenene.
- Tre × ti skal ha tre tydelig atskilte illustrasjoner på **én linje** ved vanlige iPhone-/iPad-størrelser. De tellebare objektene må ligge foran innerveggen og delvis bak forkanten. Antallsskilt er en del av beholderen.
- Handlingene («−1», «+1», «Tøm kurv») står **nedenfor** den fysiske illustrasjonen på egen rad; berøringsfelter skal ikke dekke objektene eller antallsskiltet. Hovedkontroller skal være minst 44 CSS-piksler høye.
- Karakter, materialer, lys og dybde skal brukes til å forbedre lesbarhet og lyst til å utforske, ikke til å dekorere med ekstra jordbær/sopper/boller som barnet feilaktig ville telle.
- Screenshots fra Safari og Chromium for alle verdenene sammenlignes med de låste bildene før den kunstneriske premium-godkjenningen. Grønn automatisk test alene er **ikke** bevis på en eksakt illustrasjonsmatch.


## Presis plukking på smale skjermer, premium nærvisning

Lås følgende som en del av den godkjente plukk-og-flytt-retningen:
- De tre fysisk adskilte kurvene skal fortsatt stå på **én rad** i oversikten ved 3 × 10.
- Barnet skal i tillegg kunne åpne **Se større** på en bestemt kurv. Den nærvisningen er en optisk forstørrelse av **den samme gruppen**, ikke et nytt antall gjenstander.
- Minst 44 CSS-piksler per trykkflate for hver gjenstand i nærvisningen på iPhone, med individuell tastaturfokus og lesbare norske navn.
- Nærvisningen viser nøyaktig de samme stabile objektidentitetene. Plukk, flytt, samlekurv og angre må fortsette å være matematisk korrekte.
- En tydelig knapp lukker nærvisningen. Escape og tastaturfokus skal fungere. Valg av en gjenstand for flytting lukker nærvisningen slik at mottakerkurv kan velges.
- Dette er en tilgjengelighets- og interaksjonsforbedring. Kunstnerisk likhet med de låste bildene må fortsatt vurderes separat.


## Overstyrende forenkling for 1.–2. klasse (9. oktober 2026)

Bruker har presisert at Plukk og tell var **for avansert for en andreklassing**.
Dette styrer førstesiden foran de tidligere godkjente funksjonsforslagene:

- **Første opplevelse: 2 × 3 = 6.** To store kurver med tre gjenstander i hver. Ikke starte med 3 × 10 = 30.
- Den eneste handlingen barnet trenger å forstå, er **å trykke på en illustrert gjenstand** og se at tallet går ned. Reven gir én kort instruksjon.
- Hovedresultatet vises stort på treplaten, med korrekt regnestykke rett nedenfor. Les-opp er én tydelig knapp.
- Under scenen: kun **Angre, Start på nytt, Neste lek**. Neste lek gir enkle nye oppstillinger: 3 × 2, 3 × 3 og 3 × 4, uten låsing eller prestasjonspress.
- «Bytt motiv» har én knapp. Barnet skal **ikke** møte ti verdensvalg eller oppdragskort før leken begynner.
- **Se større** åpner samme kurv med store trykkflater for små fingre; den teller ingen ekstra objekter.
- Gammel funksjonalitet beholdes, men ligger under **«Vil du prøve mer?»**, som er lukket som standard også etter gjenåpning.
- Ikke vis «Flytt mellom», «Tøm kurv», «Ny kurv», fire representasjoner eller fire oppdrag samtidig på førstesiden.
- Avanserte funksjoner har fremdeles tilgjengelighet og egne tester. 10 × 10-tabellen skal fortsatt være første visning under «Utforsk og lek».
- Læring og mestring må oppleves som lek, ikke som en oppgave med for mange kommandoer. Ingen instruksjonsblokker, skjemaer eller forutgående valg.

**Godkjenningskriterium:** En andreklassing skal kunne begynne å plukke uten at en voksen forklarer menyene. Safari-/iPad-testen skal dokumentere seks objekter på førstesiden, to store kurver, ett enkelt instruksjonskort og at alt avansert er skjult fram til eksplisitt valg.


## Premium nærsyn v5 (9. oktober 2026)

- Nærvisningen viderefører det faktisk valgte eventyrmiljøet fra oversikten, ikke en generisk kremfarget bakgrunn.
- Nærvisningens illustrerte landskap er dekorativt og inneholder **ingen tellbare gjenstander**. Barnet manipulerer fortsatt de samme objektene, med samme stabile identiteter.
- Ved plukking kan en kort, dekorativ animasjon vise at akkurat den valgte gjenstanden flyttes mot samlekurven. Regnestykket oppdateres uavhengig og umiddelbart; animasjonen påvirker aldri regnelogikken eller antallet.
- Respekter `prefers-reduced-motion`. Nærvisningen skal beholde tastatur, fokus, Esc-lukking og store berøringsflater.
- De eksisterende 10 × 10- og Brøklab-funksjonene samt kloden får ingen endring i denne runden.
- Denne runden er et målbart kvalitetssteg, ikke en erklæring om full visuell identitet med låste konseptillustrasjoner.
