# Læria: Brøklaben (premium) – låst design og akseptansekriterier

**Produktgrunnlag:** Bruker har godkjent seks illustrasjoner 8. oktober 2026. Originalene er bevart i brukerens bibliotek under `Læria/Brøklaben/Laria_Broklaben_Laste_Illustrasjoner_2026-10-08.zip`.

## Låst overordnet prinsipp: intuitiv læring gjennom lek (11. oktober 2026)

> Et barn som aldri har lært hva en teller og nevner er, skal kunne åpne Brøklaben, begynne å leke umiddelbart og gradvis forstå hva brøker er gjennom det barnet gjør.

**Dette er Brøklabens øverste UX-kriterium.** Det går foran eldre beslutninger om antall skjermer, inngangsmenyer, kontrollplassering og presentasjon når de kommer i konflikt med prinsippet. Låste illustrasjoner, faglig korrekthet, eksisterende læringsdata og funksjonalitet skal likevel ivaretas ved eventuell ombygging.

Konsekvenser for senere vurderinger og implementering:
- Barnet skal kunne starte med en konkret brøkmodell og en forståelig handling, uten å måtte velge læringsmetode eller kjenne fagbegrepene.
- Handlingene skal ha konsekvent, fysisk forståelig betydning, og gi umiddelbar synlig respons i modell og tall.
- «Teller» og «nevner» skal kunne læres gjennom utforskning; de må ikke være forkunnskapskrav eller dominere første møte.
- Den personlige reven kan støtte nysgjerrighet, men skal ikke avbryte eller gjøre frilek avhengig av instruksjon.
- Automatisk QA må suppleres med observasjon av barn som prøver Brøklaben uten forklaring. Teknisk grønt er ikke det samme som intuitivt.

**Status:** Produktprinsippet er låst. Dette dokumenterer retningen, men er ikke i seg selv godkjenning av et nytt skjermdesign eller en kodeendring.

## Formål
Brøklaben skal være et morsomt, forståelig, taktilt og faglig korrekt sted barnet selv vil utforske. Udir-tilknytningen skal sikre faglig verdi, ikke presse barn gjennom nivåer. Repetisjon, fri utforsking og mestring er verdifull aktivitet. Alt innhold er åpent. Mestring skal anbefale, ikke låse.

## Syv skjermflyter, seks illustrasjonsreferanser

1. **Oversikt** (låst illustrasjon #1): seks store aktivitetskort inne i et varmt illustrert verksted / bakeri, Læria-reven nederst.
2. **Utforsk brøker** (illustrasjon #2): startet med 3/4 i en stor sirkel. Bytt mellom sirkel, stripe, rutenett og målebeger. Velg teller/nevner og vanlige brøker. Grafikken oppdateres umiddelbart.
3. **Bygg en brøk** (illustrasjon #3): ekte brøkbiter på trebrett. Legg til deler via trykk eller dra-og-slipp, juster teller/nevner, trykk på sektor for å legge til / fjerne, se riktig brøktall.
4. **Like mye?** (illustrasjon #4): visuelt sammenlign like og ulike mengder; eksempler som 1/2 = 2/4, 3/4 ≠ 2/3. Barnet velger om mengdene er like, får skånsom respons og kan prøve et nytt eksempel. Banken inneholder 16 blandede brøkpar, fordelt på åtte like og åtte ulike, slik at et fast gjettesvar ikke gir uttelling.
5. **Sorter brøker** (tilgjengelig fra oversiktsillustrasjon): tre brøker sorteres fra minst til størst med drag-and-drop eller store pilknapper. Sammenlign brøkverdier eksakt, uten flyttallsavrundingsfeil.
6. **Brøk, prosent og desimal** (illustrasjon #5): fysiske eksempler med 1/2 = 50 % = 0,5 og flere valg. Periodiske desimaltall vises som tilnærminger, aldri som eksakt likhet.
7. **Min mestring** (illustrasjon #6): dokumenterer de faktiske brøkene og sammenhengene barnet har forsøkt eller oppdaget. Ingen oppdiktede poeng, falske ferdighetsmålinger eller innholdslåser.

## Visuell retning
Låst formspråk: Læria-eventyrverden, varmt treverk, kremfarget pergament, dempet korall/grønn/blå, romlig dybde og sympatisk Læria-rev. For 1.–2. trinn er trykkflater store og scenene konkrete; 3.–4. og senere kan komprimeres. Ikke tilfeldig regnbuegrafikk eller sterile hvite regneark.

**Viktig om referansebilder:** Seks illustrasjoner er designfasit for stil, scenekomposisjon og pedagogisk betydning, ikke en bildefil som legges over en side med usynlige klikkfelt. Faktiske interaksjoner implementeres som SVG/HTML/CSS, med god kontrast og navigasjon. Ytterligere illustrasjonsarbeid kan gi enda tettere visuell likhet med originalene.

## Lagring og kompatibilitet
- Gamle `state.fractionLab.completed` og graded `answerLog`/`sessionLog` røres ikke.
- Nye oppdagelser lagres lokalt i `laria_fraction_premium_v1`, med reelle unike handlinger fordelt på utforsking, bygging, likhet, sortering og omregning.
- `fraction-lab-back`, `openFractionLab` og `data-explore-release=explore-rc1` beholdes for Basecamp og andre ruter.
- Ingen endringer i kloden eller gangetabellen.

## QA / go-no-go før deling med barn
1. Sjekk alle sju skjermer i Chromium + WebKit for iPhone og iPad.
2. Ingen feil i aritmetikk, visuell deling, sorte­ringsrekkefølge, prosent- eller desimalvisning.
3. Hjelp og feilsvar skal være vennlige; barnet skal alltid kunne prøve på nytt.
4. Ingen horisontal sidescroll eller trykkflater under 44 px. Tester av dra/trykk, tilbakeknapper og lagring.
5. Sjekk bred `tests/laer-litt-mer.playwright.js`, Basecamp og eksisterende skoleprogresjon.
6. Sjekk skjermbilder opp mot illustrasjonene. Feil eller manglende grafikknivå må beskrives konkret, ikke markeres som fullført.

## Implementasjon
`laer-litt-mer/fraction-premium-v2.js`, `laer-litt-mer/fraction-premium-v2.css`, browser QA `tests/laria-fraction-premium.playwright.js`.

## Visuell gjennomgang 9. oktober 2026: illustrasjon mot kode

Ved sammenligning av de seks låste illustrasjonene med faktiske Safari-skjermbilder fra den første Brøklaben ble tre vesentlige mangler funnet:

1. **Miljø:** Den første kodeversjonen brukte en utvisket standardmattebakgrunn i stedet for et illustrert brøkverksted.
2. **Aktiviteter:** De seks menyillustrasjonene var overforenklede gjentakelser av den samme brøksirkelen eller typografiske tegn.
3. **Fysiske objekter:** Byggeskjermens løse brikker var Unicode-sirkler, ikke visuelt håndgripelige sektorer.

### Ny forbedring v3

- Eget illustrert **bakeri- og verkstedmiljø** `fraction-workshop-scene.svg`, med hyller, krukker, vindu mot eventyrlandskap, epler, pai og trebenk. Miljøet er en atmosfærisk bakgrunn, ikke et skjermbilde med falske knapper.
- Seks distinkte SVG-illustrasjoner for startskjermens aktiviteter, basert på visuell retning i de godkjente konseptene. Hver illustrasjon er dekorativ, mens selve aktivitetsknappen forblir ekte HTML.
- Ved bygging er hver løs sektor nå en brøkbit som viser riktig brøkdeling for valgt nevner. Både dra-og-slipp og trykk-alternativ er beholdt.
- Større og tydeligere reveguide, tre-/papirtekstur med dybde og mer kontrast.
- Ved vellykket sammenligning vises en synlig «Aha!»-oppdagelse. Mestring har en sti som viser **faktisk besøkte** aktiviteter, ikke en låst løype eller oppdiktet fullføring.
- Opprinnelig læringslogikk og lagring beholdes uendret. Ingen endringer i kloden eller andre fag.
- Cache-versjon er oppdatert for Safari/PWA.

**Akseptanse:** Bildekvaliteten er forbedret og skal verifiseres med nye skjermbilder på iPhone/iPad mot referansene. Dette er ikke et løfte om pikselidentisk gjengivelse av konseptillustrasjonene: dem kan kreve dedikerte høyoppløselige illustrasjonsressurser. Ikke marker full visuell likhet uten bildeinspeksjon og tilbakemelding fra barnet.


## Visuell kvalitetsrunde v4 – opp mot låste seks illustrasjoner

Bruker har presisert at v3 fortsatt ikke oppfyller uttrykket fra de seks låste referansene. Ved direkte sammenligning av ref-bildene med v3-skjermbilder fra WebKit (iPhone/iPad) var særlig disse avvikene synlige:

1. **Hjemmet var for flatt**: Få fysiske bakeridetaljer i forgrunnen, og reven framstod for liten og løsrevet fra verden.
2. **Utforskingen var for teknisk**: abstrakte tekstsymboler i visningsvalg, tallbrøker uten visuelle miniatyrer, og en liten brøksirkel uten revevenn ved læringsobjektet.
3. **Byggingen var for kontrollpreget**: brøkbildet og de løse bitene trengte mer fysisk rom, en tydelig arbeidsflate og en direkte forklaring.
4. **Noe av undervisningen manglet sammenheng mellom ting og symbol**: Barnet skal kunne velge et visuelt bilde av en brøk før det begynner å regne med symbolene.

### Gjennomført i v4
- Egen detaljert SVG-illustrasjon `fraction-bakery-foreground-v4.svg` som *dekorasjon*, med ekte paiillustrasjon, epler, bok, brøkbiter, serveringsbrett, løv og duk. Ingen usynlige knapper over en statisk designskjerm.
- Hjemmekortene får forbedret romfølelse og faktisk fortelling i omgivelsene. Reven er tydeligere knyttet til scenen.
- Fire nye SVG-miniatyrer for sirkel, stripe, rutenett og målebeger erstatter generiske Unicode-symboler i utforskingen.
- De sju vanlige brøkvalgene viser matematisk korrekte miniatyrbrøksirkler sammen med teller/nevner.
- Den store utforskingsscenen får en fysisk brett-/tre-ramme, reven og en kort matematisk korrekt støtteboble *inne i scenen*, ved siden av den interaktive brøkfiguren.
- Brøkbyggingen får tydeligere fysisk arbeidsflate, større kakediagram og gode berøringsmål.
- Ekte oppdagelsesantall i toppstripen erstatter den dekorative etiketten. Ingen oppdiktet antall stjerner.
- Eldre fag og kloden berøres ikke; ingen innholdssperrer, tvangsrunder eller overtakelse av barnets favorittaktivitet.

**Produktakseptanse:** V4 er en ny visuell forbedring, ikke garanti om full 3D-identitet med originalillustrasjonene. Godkjenn først når nye screenshots fra iPhone/iPad WebKit og Chromium er undersøkt konkret og den brede regresjonen er grønn. Første barnebeta skal bygge på dette og prøve om barn velger å fortsette frivillig.


## Låst beslutning 11. oktober 2026: Brøken først, med personlig rev

Barnet skal i **«Bygg en brøk» og «Utforsk brøker»** se den interaktive brøkfiguren,
tallbrøken (eksempel 3/4) og kontrollene for teller/nevner samtidig **uten
å scrolle på vanlig iPhone i stående format**. Brøktallet skal ikke ligge i
et selvstendig resultatpanel under kontrollene. Den fysiske kaken og tallbrøken
vises ved siden av hverandre; den taktile brøkbiteskuffen er kompakt og kan
scrolles vannrett ved mange deler. Også i Utforsk ligger figuren og resultatet
før visningsvelgeren og vanlige brøker.

Barnets valgte jente- eller gutterev, med den eksisterende garderobemodellen,
skal være ved arbeidsbenken. Den reagerer kort når brøken endres, og kan trykkes
på for en kontekstuell forklaring med frivillig norsk opplesning når nettleseren
støtter dette. Reven skal ikke skjule kaken eller brøkverdien, avbryte frileken
eller kreve oppdrag. Eksisterende LARIA_FOX.choice/source og
LARIA_FOX_WARDROBE gjenbrukes.

Brøkskivene, dra-og-slipp, løse brøkbiter, teller, nevner, tilbakestilling,
«Bygg noe nytt», oppdagelser og alle øvrige Brøklab-aktiviteter beholdes.
Teller er aldri negativ eller større enn nevner i den enkle modellen.
Nevner er aldri 0 (eksisterende nedre grense er 2). Alle endringer skal
synes med det samme både i kaken og tallet.

**Ledestjerne:** «Barnet skal aldri måtte lete etter resultatet av det
det bygger. Hver handling skal gi en umiddelbar, tydelig og morsom visuell
respons.»

### Godkjenningskriterier for v5
- Kake, numerisk brøk og begge +/- kontrollene er synlige i første viewport
  på iPhone, uten horisontal overflow. Minste berøringsmål er 44 px.
- Samme informasjon er visuelt samlet på iPad stående og liggende.
- Valgt rev og opptjent kosmetisk utstyr følger med, og frivillig hjelp
  kan aktiveres med trykk og tastatur.
- Endring av teller og nevner, tapping av skiver, dra brøkbiter, nullstilling,
  ny oppgave, persistens og navigasjon er regressjonstestet.
- Bruk faktiske Safari/WebKit-skjermbilder som visuell kontroll. Automatisk
  DOM-test alene dokumenterer ikke den endelige premiumfølelsen.

**Avgrensning:** Alternative materialer som sjokoladeplate og målebeger
som byggemodus er senere idébank, ikke del av denne ombyggingen.


## UX v6 – umiddelbar lek (arbeidsgren 11. oktober 2026)

**Hvorfor:** Den teknisk fungerende Brøklaben krevde at barn valgte mellom
«Utforsk» og «Bygg» før de kunne begynne. De to modusene hadde ulik
brøktilstand, og de løse bitene fylte ikke bestemte kakestykker. Det
brøt med det låste prinsippet om å lære gjennom handling uten forkunnskaper.

### Nytt første møte, uten nye aktiviteter
- Brøklaben åpner **direkte på én kake med 1 av 4 biter fylt**.
- Barnet kan umiddelbart trykke på en bestemt sektor for å fylle eller
  tømme akkurat den sektoren. Et trykk har samme betydning i alle
  sektorbaserte visninger.
- De løse bitene representerer navngitte, bestemte tomme sektorer.
  Brikken fjernes fra brettet når den legges inn og kommer tilbake når
  sektoren tømmes. Drag, trykk og tallkontroller oppdaterer samme modell.
- Teller og nevner har samme plassering i Utforsk og Bygg. Kontroller
  beskrives først som «Fylte deler» og «Like deler», med de matematiske
  begrepene som sekundærtekst.
- «Se på nye måter» viser samme kake/brøk i stripe, rutenett og målebeger,
  i stedet for å starte en ny, urelatert tilstand.
- Sammenligning, sortering, prosent/desimal og mestring er bevart bak
  «Flere leker», men er ikke et obligatorisk startvalg.
- Barnets personlige rev forblir ved kaken som frivillig støtte. Ingen
  automatisk opplesning eller tvungne oppdrag.

### Akseptanse før produksjon
1. Barnet kan begynne å leke uten å se en aktivitetsmeny eller forstå
   ordene teller og nevner.
2. Sektorer og løse brikker har entydig identitet: riktig sektor fylles
   og fjernes, og brikkebrettet viser faktisk beholdning.
3. Bytte av visualisering beholder nøyaktig samme teller, nevner og
   valgte sektorer. Stripen/rutenettet støtter direkte berøring;
   målebegeret støtter berøring og tastatur, og tallkontrollene finnes.
4. Vis kake, brøktall, kontrollene og valgt rev i første skjerm på
   iPhone/iPad; kontroller overflow og 44-pikslers berøringsmål.
5. Bevar de godkjente illustrasjonene, øvrige fag, framdrift, lagrede
   brøkoppdagelser og navigasjonen fra Matematikksiden.
6. Test Chromium og Safari/WebKit, se faktiske skjermbilder og prøv
   med barn uten muntlige instruksjoner før endelig UX-godkjenning.

**Status:** Arbeidsutkast, ikke ferdig produktgodkjenning. Låste
illustrasjoner fra 8. oktober er fortsatt visuell fasit; funksjonalitet
og grafiske kvaliteter skal gjennomgås i egen sluttkontroll.


## UX v7 – vis sammenhengen frivillig (godkjent konsept 11. oktober 2026)

Barnet starter fortsatt med **kaken, brøkverdien og to enkle kontroller**.
Verken prosent eller desimaltall er forkunnskaper som kreves for å begynne.

- **iPhone stående:** Etter kontrollene vises et valgfritt
  «Se desimaltall og prosent». Et trykk åpner (og et nytt lukker)
  to lesbare ekvivalente tallformer for **akkurat den kaken barnet bygger**.
  Informasjonen er lukket ved hver ny åpning av Brøklaben.
  Ingen påtvunget oppgave, tale eller nivåskifte.
- **iPad stående og liggende:** Skjermbredden brukes til å vise brøken,
  desimaltallet og prosenten ved siden av den store kaken, uten at
  verdiene blir en egen tvungen aktivitet.
- Alle tre tallformer oppdateres synkront når barnet fyller/tømmer
  kakestykker, drar biter eller endrer teller/nevner.
- Norske tallformer brukes: **3/4 = 0,75 = 75 %**.
  Ikke-terminerende desimaler/avrundede prosenter skal merkes med
  **≈** (for eksempel 1/3 ≈ 0,333… og ≈ 33,3 %). Ikke oppgi en
  tilnærmet verdi som eksakt.
- Den tidligere aktiviteten for brøk/desimal/prosent beholdes som en
  frivillig fordypning under «Flere leker». De nye tallformene må bruke
  den eksisterende formatterings-/brøklogikken, ikke en parallell
  matematisk modell.

**Godkjenningskriterier:** På liten iPhone er kake, tallbrøk og begge
teller-/nevnerkontroller synlige før scrolling også når de ekstra
tallformene er lukket. På iPad er alle tre verdiene synlige ved kaken.
Barnets valgte, fullkroppsrev er ikke erstattet med et portrett. Ingen
tapte eller dobbeltregistrerte brøkbiter, ingen layoutkollisjoner.

Konseptet er godkjent for implementering. Ingen endelig UX-vurdering
uten manuell iPhone/iPad-test med barn som ikke får forklaring.
