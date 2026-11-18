# Læria Hjem – kunstbrief for stående iPad

Dato: 18. november 2026  
Status: **Kunstgrunnlag mangler – ikke generer eller implementer kandidat ennå.**

Dette notatet avgrenser arbeidet med en ekte portrettkomposisjon for Hjem.
Det erstatter ikke den låste Kjøsnesfjorden/Grovanova-kunsten og gir ikke
godkjenning til å publisere, merge eller endre appens nåværende Hjem.

## Konklusjon

De tilgjengelige bildene er gode referanser og kan brukes til kontroll av
fjellform, lys, farge, perspektiv og komposisjon. De er **ikke** tilstrekkelig
høyoppløselige eller frikoblet fra innmalt brukergrensesnitt til å danne en ny,
helskjerms portrettmaster for iPad.

Det er derfor feil å lage portrettvarianten ved å:

- strekke phone-masteren,
- beskjære den liggende masteren,
- speile eller duplisere fjell/fjord,
- fylle sider med CSS-maskering eller en syntetisk bakgrunn, eller
- generere nye fjell eller nye troll uten en godkjent kunstkilde.

Neste kunstleveranse må være en kontrollert, separat scenevariant av samme
motiv, basert på en høyoppløselig kilde fra illustratør/forfatter. Den må først
godkjennes visuelt før den i det hele tatt kobles til appen.

## Kildeinventar

| Fil | Dimensjon / forhold | Status | Inneholder innmalt | Bruk i ny portrettscene |
| --- | --- | --- | --- | --- |
| `kjosnes-home-tablet.webp` | 1127×681, 1,655:1 | Låst liggende master, SHA `246edc…38e5` | Logo, hilsen, toppnavigasjon, venstre skilt, tre malte figurer og reiseskilt | Visuell fasit. Ikke stor nok eller UI-fri nok som produksjonskilde. |
| `kjosnes-home-phone.webp` | 340×641, 0,530:1 | Låst phone-master, SHA `0d804…c8f7` | Logo, hilsen, gear, reiseskilt og bunnnavigasjon | Fasit for smal mobilkomposisjon. Ikke iPad-kilde. |
| `kjosnes-home-tablet-no-bottom-cards.webp` | 1127×681, 1,655:1 | Kontrollert derivat | Samme scene og innmalt UI; bare definert nedre område er retusjert | Kan ikke oppskaleres eller frikobles til ny scene. |
| `kjosnes-home-phone-no-bottom-cards.webp` | 340×641, 0,530:1 | Kontrollert derivat | Samme phone-UI; bare definert kortstripe er retusjert | Ikke iPad-kilde. |
| `*-no-bottom-cards-no-next-stop.webp` | Samme som over | Kontrollert derivat | Samme scene og UI; kun «Neste stopp»-tekst på treskiltet er retusjert | Ikke iPad-kilde. |
| `kjosnes-home-tablet-scenic-top-edge.webp` | 1127×20 | Kilde-låst toppstripe | Kun 20 piksler UI-fri trekant/himmel | Kun sømkontroll i liggende visning; aldri sceneutvidelse. |
| `laria-logo-from-grovanova.svg` | Vektor | Godkjent UI-asset | Kun Læria-logo | Gjenbrukes uendret som separat UI. |
| `laria-grovanova-signposts.svg` | 640×1000 vektor | Godkjent UI-asset | Kun felles to-stolpe skiltverk | Gjenbrukes uendret som separat UI. |
| `laria-troll-trio-v3.webp` / `laria-troll-trio-nav.webp` | 900×600 / 180×96 | Låste karakteravledninger | Tre karakterer, ikke landskap | Beholdes som separate levende TrollActor-elementer; ikke del av ny bakgrunn. |

Den opprinnelige dokumentasjonen oppgir 1127×681 som høyoppløselig i forhold
til en tidligere 760×459-eksport. For en ny iPad-portrettmaster er 1127 piksler
i bredde likevel utilstrekkelig: den ville bli forstørret kraftig og har feil
format, samtidig som de viktigste UI-elementene allerede er malt inn.

## Hva kan og ikke kan gjenbrukes

### Kan gjenbrukes uendret

- Kjøsnesfjorden/Grovanova som geografisk motiv, med identisk fjellsilhuett,
  fjordforløp, kirke/bebyggelse, lysretning og varme fargepalett.
- De låste masterne som målestokk og pikselreferanse i en overlappende
  sammenligning – ikke som oppskalert sluttflate.
- Læria-logoen og det sammenhengende to-stolpe-skiltverket fra SVG-assetene.
- Eksisterende TrollActor-pakke og valgt-troll-logikk, renderet over scenen.

### Krever ny godkjent kilde eller kontrollert retusj

- Hele portrettbakgrunnen uten logo, hilsen, skilt, gear, reiseskilt,
  navigasjon eller malte troll.
- Himmel over og rundt dagens liggende utsnitt, samt forgrunn/nedre eng som
  trengs for portrettets høyde.
- Sammenhengende venstre og høyre naturpartier som ikke er synlige i
  phone-masteren, når disse ikke kan hentes fra en høyoppløselig original.
- Eventuell flytting av barn/figurer fra den gamle flate illustrasjonen:
  den nye bakgrunnen skal i stedet reservere plass til ett separat,
  valgt TrollActor-element.

## Foreslått portrettkomposisjon

Dette er en kunstbrief, ikke en genereringsinstruks eller ferdig illustrasjon.

1. La den samme fjordaksen starte øvre midtparti og føre blikket mot samme
   fjellpass som i den låste liggende masteren. Høyre fjell og den varme solen
   beholdes som kompositorisk anker.
2. Behold den mørkere trerammen/skogtyngden på venstre side, men uten innmalt
   skilt. Den frie venstresonen må ha ro nok til at appens eksisterende,
   separate skiltgruppe kan ligge der uten å dekke fjell eller fjord.
3. Utvid scenen vertikalt med ekte, sammenhengende himmel øverst og en rolig
   eng/steinforgrunn nederst. Ingen speiling, repetisjon eller kunstig
   gradientflate.
4. Legg ingen logo, tekst, navigasjon, treplanker, gear eller troll inn i
   bakgrunnsfilen. Reserver i stedet en rolig, teksturfri ankerflate nederst
   til venstre for det valgte levende trollet.
5. Hold sentral fjord og fjellpass fri for interaktive elementer. Hjem skal
   oppleves som ett landskap, mens appen legger logo, skilt, hilsen,
   «Fortsett reisen», bunnnavigasjon og troll oppå.

## Leveransekrav til ny fil

| Krav | Spesifikasjon |
| --- | --- |
| Arbeidsmaster | Minimum 3072×4096 px, 3:4 stående, helst tapsfri PNG/TIFF med lag. |
| App-derivat | 2048×2732 px eller større, lossless WebP/AVIF etter godkjenning. |
| Trygg komposisjonssone | Alle uerstattelige motivdetaljer skal ligge innenfor x=8–92 % og y=5–93 %, slik at iPad-modeller med smalere portrettflate kan bruke `cover` uten å kutte fjellpass, fjord, kirke eller figuranker. |
| Bakgrunnsrenhet | Ingen innmalt tekst, logo, tegn, CTA, navigasjon, gear, barneprofil eller troll. |
| Motivtrohet | Fjellsilhuett, fjordlinje, kirke/bebyggelse, perspektiv, solretning og fargetemperatur skal sammenlignes direkte med låst tablet-master. |
| Karakterregel | Bakgrunnen har ikke karakterer som erstatter TrollActor. Det valgte trollet rendres separat og er interaktivt. |
| Artefaktfrihet | Ingen stretching, speiling, repetert vegetasjon, synlige sammenføyninger eller CSS-generert filler. |
| Sporbarhet | Egen filsti, dimensjoner, SHA-256, kildebeskrivelse, redigeringsmasker og før/etter-sammenligning må leveres sammen med kandidaten. |

## Godkjenningskriterier

Kandidaten kan ikke implementeres før alle punktene under er oppfylt:

1. Produkteier godkjenner en faktisk iPad-portrettskjerm med den nye kunsten.
2. Sammenligning med låst tablet-master viser samme identitet og uendret
   fjellform i felles motivområde.
3. Gjennomgang bekrefter at bakgrunnsfilen ikke inneholder UI eller troll.
4. iPad stående og liggende, samt iPhone stående/liggende, har faktiske
   Chromium- og WebKit-skjermbilder uten kutt, overlapp eller doble knapper.
5. Valgt troll, navigasjon, tilbakeflyt og lagret progresjon fungerer uten
   endring.
6. Den gamle låste kunsten og dens SHA-tester beholdes byte-for-byte.

## Implementeringsplan etter visuell godkjenning

1. Legg kandidaten til som ny, separat iPad-portrettasset. Ikke erstatt dagens
   låste tablet- eller phone-master.
2. Legg til SHA-/dimensjonstest og en test som forbyr innmalt UI og bruk av
   den nye filen uten iPad-portrettbetingelse.
3. Knytt kun stående iPad til den nye scenen. Behold eksisterende liggende
   iPad og iPhone som fallbacks til egne skjermbilder er godkjent.
4. Render eksisterende logo, venstrestilte skilt, hilsen, reisehandling,
   bunnnavigasjon og TrollActor som separate lag.
5. Kjør full Læria-QA, smoke og iOS-bygg, og lever reelle før/etter-bilder.
6. Åpne en avgrenset PR. Ikke merge eller publiser før visuell godkjenning.
