# Læria: spill som får plass på skjermen

Status: arbeidskandidat. Ikke merget eller publisert. Den siste kandidatcommitten
skal alltid identifiseres eksplisitt i en QA-kjøring.
Målgren: [samlet draft #292](https://github.com/Almenning/Flyt-app/pull/292).
Ved sist kontrollerte avlesning pekte den fortsatt på `dc5d8b2`, før
endringene beskrevet her. Lokale testresultater er ikke GitHub CI.

## Hva som er endret

- **Finn ordene (Norsk):** Den malte, hemmelige hagen er startpunkt for nye
  oppdrag. Én tydelig tittel, skrevne ord, synlig barnets valgte troll,
  opplesning og hint. Ordene vises kort i bildet når de er funnet. En uferdig
  gammel skogrunde kan fortsatt fullføres.
- **Ordjakt (Norsk):** Alle fem temaer og hele brettet er tilgjengelige i
  stående og liggende telefonformat. Hint og ny runde er plassert sammen
  med brettet.
  Eksisterende temaer, opptjente merker og gjenopptak er beholdt.
- **Ordlek (Engelsk):** Et fjerde skilt i Kinnaklova åpner *Find the Words* og
  *Word Hunt*. Engelske ord, engelsk talesynteserute, hint, berøringskontroller
  og separat fremdrift. De gamle Words, Sentences og Reading blir stående.
- **Lesekroken og Land og flagg:** Lesetekst, hint og svar bruker plassen på
  tvers på korte skjermer. Lesekroken har også egen stående telefonvisning
  med troll og hint samlet, samt Neste ved siden av tilbakemeldingen. På
  siste kartoppgave er både Tilbake og Fullfør synlige med alternativene åpne.
- **Gangetabellen:** Brett og resultat kommer på samme skjerm. Hele 10×10
  på store skjermer; et paginert brett gir tilgang til alle 100 produkter
  på telefon. Faktorpar og tastaturnavigasjon er beholdt.
- **Trollbutikken:** På kort, bred telefonskjerm ligger handlelapp, hyller og
  kurv side om side. Hint, betaling, lageroppgave og kvitteringens neste
  handling er flyttet opp. Stående telefonskjerm har samme hovedfunksjoner
  uten rulling frem til de testede betalings-, feil- og lagerstegene.
- **Gangemagi og Brøklab:** På Mac og iPad er de kritiske kontrollene flyttet
  nærmere spillet, uten endringer i illustrasjoner, tall eller fremdrift.
  På telefonen fikk 667×375 liggende også plass til full bærtelling og
  Neste i Gangemagi, og kake, deling og modusbrytere i Brøklab.
- **Fagforsider og Samlebok:** Skiltknapper venter ikke på ferdig bilde for
  å få posisjonen sin. Samlebokens bladkontroller ligger over innholdet.
  Foreldresider kan rulle, slik eier presiserte. På 320 × 568 er det valgte
  trollet helt innenfor Hjem, ute av skiltrekken i Matte, og Ordlek-knappen
  er ikke lenger skjult bak Hjem-knappen.
- **Kloden:** Landfakta på stående iPad har gått fra 11 til 12 px uten
  overlapp. Landskapets meny har tre synlige valg og beholdt kartstyring.

## Verifisert lokalt

- Samlet Node-suite på `90390b8`: 560/560. Ny kontroll av service
  worker-feil for bilder er inkludert.
- Ordjakt (Norsk): fullført og gjenopptatt faktisk runde i begge motorer på
  568×320, også med simulert 21 px hjemindikator. Stående 320×568, 375×667
  og 390×844 var grønne i begge motorer på `a13e673`.
- På 568×320 besto Finn ordene hele den malte spillflyten i begge motorer,
  inkludert hint, langt ord, dra/slipp og Neste. Trollbutikken besto
  butikkdag, handletur og lager i begge motorer med de testede
  handlingsknappene før rulling. Dette er ikke en uttømmende kontroll av
  alle innholdstilstander, for eksempel lange myntbrett.
- Gangetabellen: 10 skjermformater per motor i Chromium og WebKit;
  verifisert på isolert kandidat før integrasjon.
- Trollbutikken: hele butikkdagen, handletur og lager i Chromium og WebKit
  844×390 og 667×375 med før-rulling-kontroll på hyller, kurv, hint,
  lager og Neste. Den minste liggende varianten er bekreftet på `d38f54d`.
  Ved velkomst på 667×375 vises alle spillmodusene uten rulling.
  På 568×320 viser Handletur både lommebok, disk, løpende sum og hint.
  Like mynter grupperes med antall; trykk tar tilbake én mynt, også med
  tastatur. Testen dekker feil betaling og retting, fire myntslag samtidig
  og fortsatt riktig vekslepenger.
  På stående 375×667 og 390×844 bestod 74 før-rulling-berøringssjekker
  per størrelse og motor i den isolerte kandidaten `8a32fda`.
- Gangemagi og Brøklab: isolert kandidat verifisert i begge nettlesermotorer
  på 390×844, 844×390 og 667×375. Ingen endring i låst Gangemagi-kunst.
- Land og flagg: alle fem oppgaver, Hint, feil svar, åtte kartvalg, Fullfør,
  lagring og retur, uten rulling på 375×667 og 390×844 i begge motorene
  på isolert `746b8bd`.
- Investorruten: Chromium 1440×900 og 820×1180 og WebKit 1180×820 på
  `d38f54d`, samt WebKit 390×844 på `0ae3ce5`. Hver kjøring ga 26
  faktiske skjermbilder fra den syntetiske demoprofilen.
- Lesekroken: alle valg, Hint og Neste før rulling i stående 375×667
  og liggende 667×375. Den siste korte WebKit-ruten (667×375) er
  bekreftet på `036993f`; den bredere stående målingen på `0ae3ce5`.
- Engelske spill: reell trykk-/dra-flyt og separat fremdrift; før-rulling-
  kontroller passerte fire telefonformater i Chromium og begge liggende
  telefonformater i WebKit. Begge spillene består også på 320×568 i begge
  motorene. Valg av engelsk stemmespråk ble testet via API, ikke avlyttet på
  fysisk enhet. Gjenåpning uten nett etter én nettrunde bestod i Chromium på
  `08601e6` og i lokal WebKit på `061ecff` da nettserveren faktisk ble
  stengt. Kald oppstart uten tidligere nettbruk og fysisk Safari er ikke
  verifisert.
- På 568×320 besto begge nettlesermotorer komplette runder i *Find the
  Words* og *Word Hunt* via Engelsk, inkludert hint, fullføring og
  gjenopptak. I Gangemagi og Brøklab besto 69 kontroller og steg per motor
  på samme format. Land og flagg fikk også tre synlige avslutningsknapper,
  med alle fem oppgaver og retur til Geografi verifisert i begge motorene.
- Norske Finn ordene: bærbar, iPad og telefon testet i representative
  Chromium- og WebKit-oppsett. Den låste hageillustrasjonen er 480×288
  og blir myk på store skjermer.
- Grovanova og Kinnaklova ble ikke erstattet, og ingen HverdagsOss-filer
  ble endret. Ikke testet på fysiske enheter som del av denne gjennomgangen.

## Før publisering

Det er ikke dokumentert at alle aktivitetstilstander på alle telefonformater
er rullefrie. Foreldreområdets tillatte scrolling teller ikke som spillavvik.
Ved nettleserfeil må faktisk mål og reproduksjon verifiseres før endring.

Krev grønne GitHub-kontroller på eksakt kandidat, visuell dokumentasjon,
de separate kunstbevisene for full release og brukertest med barn. Hold
publiseringsporten uendret.

### Supplerende rettelser for den minste stående iPhone-visningen

- **Lesekroken:** Trollet, opplesing og Hint deler én rad i stedet for å ta
  hver sin del av høyden. Hele leseteksten og alle svar beholdes. QA-skriptet
  åpner den ekte Lesekroken og velger den eksisterende nynorske Iben-oppgaven
  deterministisk ved 320×568, slik at feilen ikke skjules av et tilfeldig
  kortere spørsmål. Svarene, Hint, opplesing, Tilbake og Neste er testet
  over skjermkanten i Chromium og WebKit-emulering.
- **Ordjakt:** På korte stående telefoner peker Hint og den synlige
  hjelpeteksten på samme sted over brettet. Den gamle synlige duplikatboksen
  under brettet er fjernet fra denne visningen, men beholdes som et
  tilgjengelig område for statusmeldinger. «Ny runde» har hele bunnraden.
  Nettlesertesten kontrollerer faktisk plass, 44-pikslers høyde og om knappen
  kan trykkes uten å rulle, også etter reaksjoner.
- Ingen endringer i låst kunst, innhold, progresjon eller publiseringskrav.
  WebKit her er nettleseremulering, ikke test på fysisk iPhone.
- **Ordjakt liggende:** Instruksjonen er synlig i kolonnen ved siden av
  brettet, også på 568×320. På det minste formatet vises én komprimert
  tilbakemelding i sidekolonnen, slik at «Ny runde» også får plass på
  vanskelig nivå. QA kontrollerer instruksjon og knapp i begge nivåer.

### Feil fra GitHub-kjøringen: liggende telefon

- **Lesekroken (568×320):** Nynorskoppgaven som feilet i CI kjøres nå
  deterministisk også liggende. Tre svar deler én rad uten å kutte teksten
  eller redusere trykkflatene under 44 piksler. Tilbake, Hint, opplesing,
  samtlige svar og Neste er kontrollert i Chromium og WebKit.
- **Ordjakt (568×320):** Etter fullført runde har tilbakemelding og
  «Ny runde» plass uten scrolling, også med simulert 21-pikslers sikkerhetssone
  ved hjemindikatoren. Testet i begge motorer. På kort stående telefon
  måler testen den hjelpeteksten barnet faktisk ser over brettet.
- **Gangetabellen (667×375 og 844×390):** Flyttet de fire navigasjonsfanene
  opp, og gjenbrukt den tilgjengelige velgeren med alle sju aktiviteter for
  å frigjøre høyde. Testene trykker seg til Oversikt og inn igjen, og
  kontrollerer også faktorer, tastatur, rotasjon og retur til Tallvika.
- Disse layoutrettelsene bytter ikke bildekunst eller progresjonsdata,
  og fjerner ingen dokumentasjons- eller godkjenningskrav ved publisering.

### Oppfølging av frilek og eldre nettlesertester

- **Gangemagi:** På de korteste liggende telefonene ligger Oppdrag,
  Markedsbok og Gangetabellen nå ved siden av Tilbake og logoen.
  Markedsbok vises bare én gang i denne visningen. Barnet slipper å nå en
  ekstra navigasjonsrad under kurvene, og knappenes areal er fortsatt minst
  44 × 44 CSS-piksler.
- **Ordjakt:** På små stående telefoner tester temasuiten det synlige
  Hint-valget med berøring, tekst over brettet, tre trinn med markeringer
  uten å få ordet godkjent automatisk, og synlig «Ny runde» etter fullføring.
  Den verifiserer fortsatt den fullstendige hjelperen på større skjermer.
- **Engelsk:** To eldre tester krever nå de fire faktiske skiltene,
  inkludert Ordlek, i stedet for å feile fordi de venter bare tre.
- Ingen bakgrunner, progresjonsdata eller publiseringskrav er endret.
