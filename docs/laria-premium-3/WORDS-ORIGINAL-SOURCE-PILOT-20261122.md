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

## Eksakt-head kvalitetssikring

`tests/laria-words-source-original.playwright.js` og workflow `laria-words-sign-candidate.yml` kontrollerer:

1. Oppløsning 306 × 97 og hardkodet SHA for originalfilen (1448 × 1086).
2. Tre kontrollpunkter på planke/nagler der RGB **må være identisk med originalpikslene**, og et målt stort antall nøyaktig gjenbrukte bildepiksler.
3. Ekte bilde-dekoding, dynamisk DOM-tekst, ABC-medaljong, minimum 44 px berøringsflate og synlige bokstaver som ikke overlapper medaljongen.
4. **Kinnaklova på ekte iPad-scene**, både 1024 × 1366 og 1366 × 1024 i **Chromium og WebKit**, med automatisk lagrede skjermbilder.
5. Faktisk navigasjon `Hjem → Engelsk → Words → opprinnelig læringsøkt`.

**CI grønn = funksjonell/proveniens-kontroll, aldri eierens visuelle godkjenning.** Før videre arbeid på de to andre engelske skiltene skal eier se på faktiske iPad-skjermbilder og godkjenne plankens form, tekst, ikon og terrengplassering. PR #272 forblir draft; ingen merge/publisering.
