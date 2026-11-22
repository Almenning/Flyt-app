# LÆRIA | LÅST SKILTDESIGN V1
**Dato godkjent: 22. november 2026. Status: VISUELL REFERANSE LÅST, IKKE IMPLEMENTERT ELLER PUBLISERT.**

## Autoritativ fasit
Bruker har **uttrykkelig godkjent** det genererte bildet `laria-sign-master-v1.png` ("Perfekt! Lås disse"). Dette er den overordnede og **nyeste** skiltfasiten i hele Læria, foran eldre skiltillustrasjoner, PR #272 sine foreløpige «light arrow»-varianter og tidligere råd om å bruke Grovanova-skilt som formfasit.

**Referansefil, eksakt bytes:** `laria-sign-master-v1.png` (1122×1402, PNG).
- SHA-256: `1b3cdb93f04b95b7b0850653827cb5e6235a69afc5c94e39ab5eba78640678db`
- Første brukerleverte utsnitt: `laria-originalreferanse.png` (564×886, PNG), SHA-256 `8c2f57351f0a8fc9c87b3a13b4b5a49e195d3a90a1dbbfeabfa05332546072fe`.
- **Kildebildene følger som samtalevedlegg og i en separat `laria-skiltpakke-v1.zip`; de er ikke lagt til som binærfiler i GitHub ennå.** Ved oppstart av Work: legg eksakt PNG inn i repoet under `laer-litt-mer/assets/ui/locked-reference/laria-sign-master-v1.png`, verifiser SHA-256, og oppdater dette dokumentet med Git commit og filbane. **Ikke rekonstruer eller erstatt bildet når det importeres.**

Det genererte bildet er et **referanseark med eksempler**, IKKE en ny bakgrunn, en prototype på hovedskjermens layout eller et ferdig sett knapper. Ikke legg alle gruppene fra arket på én skjerm. Hvert faktisk skilt er et selvstendig interaktivt DOM-element.

## Grafisk standard som er låst
- **Materiale:** varmt gyllent/honningfarget tre med synlig årringstruktur, variasjon i årringer/kanter, subtil glans, treskurd/utskårne detaljer. Ikke flat generisk oransje knapp.
- **Form:** massiv horisontal treplanke, svakt asymmetrisk håndskåret kontur, skrå/avrundede ender med liten spiss, overflateskygge og dybde. **Ikke moderne kort**, ikke spiss/tunn pilform fra tidligere skiltversjoner.
- **Festing:** to **kraftige, tydelige, vertikale trestolper** per samlet skiltgruppe, med naturlige toppenhetter, skjult/realistisk bunn i terrenget. **Én samlet venstrestilt gruppe per scene**, ikke skilt på begge sider.
- **Detaljer:** små metallnagler på begge ender av hver planke, konsistente 3D-kanter/skygger, myk kontaktsskygge i terrenget.
- **Ikon:** gjenkjennelig illustrert aktivitetssymbol til venstre i **mørkebrun, relieffpreget merke-/medaljongramme** med tre-/metallfølelse. Skift symbol etter destinasjon; samme ytre stil og skala.
- **Tekst:** mørk nesten svart, kraftig tradisjonell serif, bred nok for barn, med subtil dybde. Bruk én **reelt distribuert og lisensiert** font som rendres likt i Safari/WebKit og Chromium. Ikke avhengighet av maskininstallert `DejaVu Serif`.
- **Dimensjoner:** samme proporsjoner og avstand mellom planker i hver gruppe; størrelse responsiv uten feil perspektiv. 44×44px **minste reelle trykkflate**, lesbar tekst på iPad, tydelig fokus/tastatur og korrekt tilgjengelig navn.
- **Naturforankring:** stolper slutter i synlig, troverdig forgrunn/gress/stein, ikke over fjorden, på et kirketak, i luft eller over en karakter. Scene/spesifikk forankring per retning, uten å flytte låst bakgrunnskunst.

## Motiver og etiketter fra referansearket
| Skiltgruppe i eksempelfilen | Etiketter / foreslått ikonretning |
|---|---|
| Fag på Hjem | **Norsk** (bok), **Matte** (kalkulator), **Engelsk** (Union Jack), **Geografi** (globus/kart) |
| Hovedområder | **Reisen** (kart/rute), **Utforsk** (kompass), **Oppdrag** (kiste/stjerne) |
| Matte / Tallvika | **Gangemagi** (magisk hatt), **Brøklab** (brøk), **Gangetabellen** (tavle) |
| Andre funksjoner | **Lesekroken** (bokstabel), **Ordjakt** (lupe/bokstav), **Kloden** (globus) |

Dette er **eksempler** på skiltutforming og navn. Alle eksisterende funksjoner i appen som navigeres via skilt skal få samme designfamilie, med korrekt faktisk tekst/ikon og eksisterende rute. Ikke fabrikkér nye funksjoner for å få arket til å stemme. Annen funksjonalitet (klassevelger, tilbakeknapp, premium, dialog) skal kun endres dersom den faktisk bruker skilt.

## Ufravikelige tekniske rammer
1. **Bygg én gjenbrukbar skiltkomponent**: flate, stolper, medaljong/ikon, tekst, state, fokus og klikk; flere skilt per rail, men **ikke** statiske utsnitt fra skiltarket som hele menyer. Rekonstruer stil trofast med separate høyoppløste/vektorbaserte grafiske deler og ekte DOM-tekst. Fiks avstand, plankeanker og skala med design-tokens per orientering.
2. Ikke endre, generer på nytt eller tegn over de **låste fjell-/fjord-/trehytte-/kirke-/leirillustrasjonene**. Hjem v16, Eggenipa, Tallvika, Kinnaklova, Nordlysleiren forblir egne bakgrunnslag. Troll er levende, separate figurer og skal aldri bakes inn i skilt/bakgrunn.
3. Behold faktiske klikkmål, returkontrakt, tastatur, lastet progresjon og vokseninngang. PR #270 gjelder navigasjon og er et **separat** arbeid. Ikke merge uten klar integrasjonsplan og godkjenning.
4. PR #272 er foreløpig en **opt-in prøve**, med eldre pilformede skilt. Den gamle kandidaten er **ikke den nye godkjente visuelle fasiten**. Ikke pynt den videre med tilfeldige CSS-`!important`-lag; refaktorer til den låste stilen.
5. **iPad først**, i fem format: 820×1180, 1024×1366, 1180×820, 1024×768, 1366×1024. Test i Chromium + WebKit, også med norsk/engelsk lange etiketter. Deretter iPhone/PC. Ingen betalt tjeneste nødvendig.
6. **Tallvika «Neste eventyr»** beholdes som sekundært skilt inne i illustrasjonen, visuelt i samme familie, men **ikke** som et fjerde likeverdig skilt på hovedstolpene.
7. Nordlysleirens kortbilde `geography-premium.webp` på 1024×704 er **ikke** en fullskjermsmaster, og utbedres under separat issue #273, uten å bytte inn et annet låst reisekart uten eiergodkjenning.

## Implementeringsplan / Work-milepæler
**Port 0 – Sikre referansen:** Importer eksakt godkjent PNG som binær fil. SHA-256 = kontrollsum ovenfor. Sjekk faktisk `main`, PR #270 og #272; lag en trygg implementeringsgren/fortsett #272 draft uten merge.

**Port 1 – Bygg én skiltmaster:** Teknisk gjenbrukbar komponent og stilpakke fra referansearkets faktiske plankebredde, relieff, nagler, medaljong, font og to stolper. Lag variasjoner av ikon og tekst via data, ikke separate hardkodede skiltbilder. Lever reell forhåndsvisning med planke, tre ikoner og fire skilt. Krev visuell godkjenning før bred utrulling.

**Port 2 – Pilot på Hjem + én fagforside:** Behold låst v16-lokalitet og fagillustrasjon. Sammenlign på reell iPad stående/liggende. Test tall/engelsk lange etiketter og at skilt ikke dekker trollet eller fjellene. Ikke skriv over dagens scener før eksplisitt godkjenning.

**Port 3 – Utrulling til samtlige skiltflommer:** Hjem, Reisen/Utforsk/Oppdrag, norsk, matte, engelsk, geografi, underfunksjoner og eksisterende skiltbasert retur/fortsett-flyt. Ett sentralt skilt-komponent-API og sceneankre. Ikke flere motstridende stilarter.

**Port 4 – QA:** Skjermbilder av alle berørte scener på **alle fem iPad-størrelser × Chromium/WebKit**, med før/etter-matrise. Bekreft skiltlikhet, naturlig forankring, ingen klipping, 44px treff, fokus, routing, ESC, progresjon, redusert bevegelse og ingen hvit overscroll. Dokumenter alle avvik før merge.

**Port 5 – Godkjenning og lansering:** Lever klart før/etter-bildeark til eier med kjente avvik. **Ikke merge eller publiser før brukeren uttrykkelig godkjenner skiltstandarden.** Deretter isolert merge, produksjonskontroll og fysisk iPad Safari-test før iPhone/PC.

### Forbudte snarveier
Ingen nye fjell/landskap. Ikke komprimer masterbildet og kall det fasit. Ikke bake tekst inn i bakgrunnen. Ikke påstå at grønn CI = visuelt premium. Ikke bruk betalte AI-video-/designleverandører uten samtykke. Ikke aktiver testvarianten i produksjon før sign-off.
