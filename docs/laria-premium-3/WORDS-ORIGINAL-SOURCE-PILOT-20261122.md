# Læria Premium 3.0 – Words, direkte fra låst Grovanova v16

**Status 22.11.2026:** SOURCE-EXACT REVIEW V1. **Ikke visuelt godkjent, ikke merget, ikke publisert.**

## Hvorfor en ny pilot

V2/V3 forsøkte å imitere en eksisterende treplanke med CSS- og generert kunst. Eier avviste både plankens form, farge og medaljong, selv etter grønn funksjonell CI. Denne piloten skal **ikke generere en ny treplanke**. Den bruker **det originale Grovanova-bildet som kilde**, og aldri den nyere V3-illustrerte ressursen.

## Autoritativ fil og direkte pikseluttrekk

- Original: `laer-litt-mer/assets/home-v16/laria-grovanova-v16-landscape-original.png` – 1448 × 1086.
- SHA-256: `9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028`.
- Kilderektangel for **originalt Norsk-skilt**: `x=43, y=342, width=306, height=97`.
- Den opprinnelige RGB-kunsten er piksel-for-piksel **uendret utenfor avgrensede reparasjonsområder** for ordet «Norsk» og den hvite bokgrafikken.
- Plankesilhuetten isoleres med en dokumentert polygon i lokal koordinat, transparent utenfor denne. Ingen nye nagler, kanter, årer eller treskjøter er tegnet.
- Fordi originalen er én flat bitmap, er også dette **ikke bokstavelig 100 % samme bildepiksler**: det opprinnelige ordet må fjernes, ikonets indre må fylles, og «Words» / «ABC» må legges over som separate DOM-lag. Reparasjon av malte bokstaver gjøres ved horisontal interpolasjon mellom kildens **egne** omkringliggende trepiksler; den opprinnelige trestrukturen ellers beholdes. Dette er en fortsatt åpen visuell kvalitetsport.
- Eksakt Grovanova-PNG kontrolleres med SHA-256 via WebCrypto før kildebildet i det hele tatt kan brukes. Korrupte kildebytes gir blokkert kandidat, ikke stille fallback til annen kunst.

## Teknisk avgrensning

- Kun `?app=laria&lariaWordsSignCandidate=3` i Engelsk/Kinnaklova med allerede SHA-verifisert UI-fri scenekunst.
- `laria-source-exact-sign-v1.js` bruker lokal Canvas til å klippe den **låste, originale bildefilen**. Ingen AI-generering, betalte leverandører eller eksterne bilder.
- Den eksisterende ekte `data-ki="words"`-knappen og opprinnelig `Words`-DOM-tekst beholdes. ABC er et separat, aria-hidden tekstlag inne i den opprinnelige medaljongrammen. De gamle `Words`-rutehandlerne og progresjonen endres ikke.
- Andre skilt (**Sentences**, **Reading**) endres ikke i denne piloten. V2/V3-testene og vanlig appvisning er bevart.
- Stolpe-/terrengtilpasning i denne piloten er **ikke** endelig; originalens kraftigere, kildebaserte stolper må fortsatt bygges og godkjennes separat.

## 23. november 2026: original Engelsk-planke med ekte rund medaljong (ny kandidat V5)

**Faktisk visuell QA av forrige kildevarianten `lariaWordsSignCandidate=3`:** tekniske tester var grønne, men reelle Chromium/WebKit-skjermer viser et firkantet «ABC»-merke som ikke følger den låste Engelsk-illustrasjonen, og de to øvrige engelske skiltene er fortsatt gamle. Derfor ble dette **ikke** eiergodkjent.

En **separat, fortsatt ikke-godkjent** kandidat er nå implementert som `lariaWordsSignCandidate=4`:

- Ny runtime: `laer-litt-mer/laria-source-exact-sign-v2.js`, kun ved eksplisitt parameter. Den **kildeklipper det originale Engelsk-skiltet**, ikke Norsk-planken eller den forkastede V3-kunsten.
- Kilderektangel: `x=43,y=531,bredde=307,høyde=82` fra nøyaktig samme SHA-låste Grovanova-original. Kildens plankeform, nagler, varmt tre, konturer og **mørke runde relieffring** blir med.
- Kun innmalt «Engelsk»-tekst i det avgrensede midtfeltet og innmalt Union Jack **innenfor den runde ringen** rekonstrueres. Det kan ikke påstås at disse endrede pikslene er originale. Ny «Words»/«ABC»-tekst er ekte DOM-lag.
- Ingen betalt leverandør, ingen ny AI-kunst, ingen endring i originale Home/Kinnaklova-mestere eller eksisterende læringsfunksjoner.
- V2/V3 og tidligere kildevarianten (`=3`) beholdes for etterprøving. Nye Playwright-kontroller i `tests/laria-words-source-round.playwright.js` krever tre pikselidentiske kontrollpunkter utenfor endret tekst/ikon, kildeoppløsning 307×82, SHA, fungerende Words-rute og reelle Chromium/WebKit-bilder for iPad stående/liggende.
- **Stolper og resten av engelskgruppen gjenstår fortsatt.** For å unngå et nytt falskt «100 % likt»-løfte skal det ikke sies at den samlede skiltgruppen er ferdig når bare denne ene planken er endret.

**Godkjenningsport:** Egen visuell vurdering av bildene fra V5 mot låst Hjem-Engelsk ved sammenlignbar skala. Hvis gammel tekst skinner gjennom, flaggrester syns i kanten, eller relieffet er feil, behold status *ikke godkjent*. CI er bare teknisk kontroll.

## 23. november: Én kildebasert skiltgruppe (opt-in review v2)

**Ny kandidat `?app=laria&lariaEnglishSignGroupCandidate=2`. IKKE EIERGODKJENT / IKKE MERGET / IKKE PUBLISERT.**

Bildene fra den tidligere `Words`-kandidaten ble funksjonelt godkjent i Chromium/WebKit, men viste én stor originalplanke og to små, gamle pilskilt med separate støttebein. Den visuelle helheten var derfor fortsatt ikke oppnådd.

Dette oppsettet er den første **samlede** English/Kinnaklova-kandidaten med originalkilde:
- Bruker samme eksakte Grovanova/Engelsk-plankekilde (original 1448×1086, SHA-256 `9019d2d7...`, utsnitt 307×82) på alle tre reelle `data-ki`-knappene, med endret DOM-etikett Words / Sentences / Reading. Ingen ny CSS-treplankegenerering.
- Én felles kildebasert **to-stolpe-ressurs**, generert i minnet fra faktisk originale Grovanova-piksler (trekapper og synlig aksel) ved kildeverifisering. Manglende/overmalte partier av stolpene i den flate originalen **må vertikalt forlenges/rekonstrueres**; dette er ikke piksel-for-piksel identisk med et usett originalmotiv. Den gamle CSS-/SVG-stolperailen skjules kun for denne kandidaten.
- Words bruker **det uendrede britiske flagget** i originalens runde medaljong. Sentences/Reading har oppgaveegne SVG-ikoner på **mørk, tilpasset innerflate** mens den kildeoriginale ytterrammen består. Disse innersymbolene er nye og er **ikke** 100 % originale bildepiksler.
- Original Kinnaklova fjell, kirke, trollet, Hjem, oppgaver, handlere og fremdriftslagring er urørte. Andre kandidater `?lariaEnglishSignGroupCandidate=1` og `?lariaWordsSignCandidate=1..5` beholdes separat.
- Ny Playwright-test `tests/laria-english-source-group.playwright.js` gir reelle skjermbilder på **alle fem iPad-størrelser i Chromium og WebKit**, undersøker alle tre ekte knappene, nøyaktig én stolpegruppe, kilde-SHA og korrekt bildekilde og at stolpeføtter ikke treffer kirketaket. Den åpner de originale Words/Sentences/Reading-rutene.

**Visuell sperre:** Før denne kan bli ny master, må de reelle iPad-bildene kontrolleres for kildeform, tekstfjerning, nok terrengkontakt, at medaljong-ikonene ikke ser kunstige ut, og om alle tre plankene faktisk har samme størrelse og skiltstil. Grønne Playwright-tester betyr bare teknisk kontroll. Ingen utrulling i normal visning uten eksplisitt eiergodkjenning.

## 23. november: Original utskåret ring uten CSS-medaljong (opt-in review v2, videreføring)

Bildegjennomgangen av de tre kildebaserte skiltene viste at den flate, brunfargede CSS-sirkelen i Sentences og Reading ikke tilsvarte Grovanovas illustrerte, utskårne medaljong.

**Endring i `lariaEnglishSignGroupCandidate=2`:**

- `laria-source-exact-sign-v3.js` leverer nå **to adskilte plankebilder** fra samme SHA-256-verifiserte originalkilde: `png` med uendret Union Jack for Words; `taskPng` for de to andre aktivitetene.
- I `taskPng` bearbeides kun den runde flaten med radius **29,5 kildepiksler** rundt medaljongsenteret (88,47) i originalutsnittet 307 × 82. Ytre utskåret ramme, plankekant, nagler og resten av treverket beholdes. Den nye innerflaten får subtil struktur som samples fra samme låste treplanke, ikke en flat CSS-gradient.
- `laria-english-source-group-v1.js` bruker `taskPng` bak ikonene for Sentences og Reading, og **ingen CSS-sirkelfylling**. De originale knappene, handlings-ID-ene og læringsrutene er uendret. Symbolene er fortsatt separate tilgjengelighetsnøytrale SVG-dekorasjoner over innerflaten.
- Den nye Playwright-sperren verifiserer ekte dekodet `taskPng`, mørkt bearbeidet innfelt på medaljongsenteret, identiske piksler på utvalgte punkter i originalrammen/treverket og at CSS-medaljongen faktisk er fraværende.
- **Begrensning:** Det britiske flagget og den nye illustrasjonen kan ikke begge være originale på samme sted. Bare uendrede deler er pikselidentiske. Den nye innerflaten er rekonstruksjon og krever særskilt visuell godkjenning på faktisk iPad-skjerm, ikke kun en grønn test.

**Denne kandidaten er fortsatt visuelt IKKE GODKJENT.** Ingen endring av den publiserte appen, intet nytt stolpedesign på tvers av fag, ingen merge.

## 23.11.2026: Ekte blomster fra Grovanova, separat illustrasjonslag (review 5)

**Status:** Kun review via `?app=laria&lariaEnglishSignGroupCandidate=5`. Visuell godkjenning GJENSTÅR. Ikke merge eller publiser.

- Forrige `=4` repeterte godkjente Kinnaklova-bakgrunnspiksler over stolpeføttene, men var for svak til å gi et troverdig vegetasjonslag. Vi endrer ikke mer CSS/alpha i den varianten.
- I ny `laria-english-botanical-v1.js` hentes **de faktiske blomstene og bladene fra den låste Grovanova v16-illustrasjonen**, med SHA-256 `9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028`, 1448×1086. Nøyaktige kildeutsnitt er `(300,690,114,150)` og `(292,718,121,135)`. Disse cropene inneholder plantefelt uten originale knapper, treplanker eller navnefelt.
- Kun transparens-/kantmaske, skala og plassering redigeres. RGB-fargene kommer fra originalens illustrasjon; **det er ikke en påstand om at blomstertegningens nye plassering er original**.
- To adskilte plantelag legges **foran de opprinnelige stolpeføttene, men bak de tre skiltplankene**, uten å flytte eller endre godkjent Kinnaklova-landskap, Home, troll, oppgaver eller den originale DOM-navigasjonen.
- Foreground er `aria-hidden`, `pointer-events:none` og bruker samme sikre post-V2-sprite som `=3/4`. Kandidat `=2/3/4` bevares identisk som A/B/C-kontroller.
- Playwright-kontroll for **5 iPad-størrelser × Chromium/WebKit** krever eksakt kilde-SHA, ingen tegning over Reading-skiltet, faktiske blomst-/bladpiksler, fysisk fotdekning, uendrede click-ruter og fremdeles én felles to-stolpe-rail.
- **Visuell risiko:** Dersom plantelagene ser ut som pålimte klynger fremfor naturlig vegetasjon, skal kandidaten AVVISES i visuell port, selv om CI er grønn. Ikke bruk flere små justeringer til å skjule en manglende kunstnerisk integrasjon.

## Eksakt-head kvalitetssikring

`tests/laria-words-source-original.playwright.js` og workflow `laria-words-sign-candidate.yml` kontrollerer:

1. Oppløsning 306 × 97 og hardkodet SHA for originalfilen (1448 × 1086).
2. Tre kontrollpunkter på planke/nagler der RGB **må være identisk med originalpikslene**, og et målt stort antall nøyaktig gjenbrukte bildepiksler.
3. Ekte bilde-dekoding, dynamisk DOM-tekst, ABC-medaljong, minimum 44 px berøringsflate og synlige bokstaver som ikke overlapper medaljongen.
4. **Kinnaklova på ekte iPad-scene**, både 1024 × 1366 og 1366 × 1024 i **Chromium og WebKit**, med automatisk lagrede skjermbilder.
5. Faktisk navigasjon `Hjem → Engelsk → Words → opprinnelig læringsøkt`.

**CI grønn = funksjonell/proveniens-kontroll, aldri eierens visuelle godkjenning.** Før videre arbeid på de to andre engelske skiltene skal eier se på faktiske iPad-skjermbilder og godkjenne plankens form, tekst, ikon og terrengplassering. PR #272 forblir draft; ingen merge/publisering.
