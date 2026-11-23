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

## Eksakt-head kvalitetssikring

`tests/laria-words-source-original.playwright.js` og workflow `laria-words-sign-candidate.yml` kontrollerer:

1. Oppløsning 306 × 97 og hardkodet SHA for originalfilen (1448 × 1086).
2. Tre kontrollpunkter på planke/nagler der RGB **må være identisk med originalpikslene**, og et målt stort antall nøyaktig gjenbrukte bildepiksler.
3. Ekte bilde-dekoding, dynamisk DOM-tekst, ABC-medaljong, minimum 44 px berøringsflate og synlige bokstaver som ikke overlapper medaljongen.
4. **Kinnaklova på ekte iPad-scene**, både 1024 × 1366 og 1366 × 1024 i **Chromium og WebKit**, med automatisk lagrede skjermbilder.
5. Faktisk navigasjon `Hjem → Engelsk → Words → opprinnelig læringsøkt`.

**CI grønn = funksjonell/proveniens-kontroll, aldri eierens visuelle godkjenning.** Før videre arbeid på de to andre engelske skiltene skal eier se på faktiske iPad-skjermbilder og godkjenne plankens form, tekst, ikon og terrengplassering. PR #272 forblir draft; ingen merge/publisering.
