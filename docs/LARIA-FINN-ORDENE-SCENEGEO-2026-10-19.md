# Læria – Finn ordene: én spillflate, større ord og mer synlig rev

Dato: 19. oktober 2026
Status: **Isolert utkast. Ikke flettet og ikke publisert.**
Prioritert produktkode/release på `main` eies fortsatt av Gangemagi PR #192. Denne Finn ordene-grenen må IKKE merges uten klar bane i releasekøen og grønn, visuell WebKit-QA.

## Rotårsak
Godkjent Bokskogen-SVG har native `viewBox="0 0 1200 720"` (5:3).
I forrige `main`-utgave satte CSS `.fw-art` til `aspect-ratio:1.4` på høy iPhone og `aspect-ratio:auto` på iPad portrett. Det innebar at det malte SVG-motivet kunne bli bokstavkasse-/letterbox-skalert innenfor bildet, mens absoluttposisjonerte HTML-knapper ble målt relativt til den større rammen. Visuelt misforhold er kontrollert i ekte WebKit-bilder fra run 39313984622 / artifact 12216353711.

## Isolert rettelse
1. Inne i `.fw-art` opprettes en felles `.fw-picture`, med nøyaktig `aspect-ratio:5/3`. Både SVG-bildet, alle gjenstandsknapper og stjernefeiringen er barn av denne flaten. Absolutte prosentkoordinater blir da målbare mot det som faktisk tegnes, uavhengig av ramme, orientering og CSS-grenser.
2. Ingen tilfeldig `object-fit:cover`, ingen skjæring av sol/telt/tre, ingen forvrengning av 2.5D-illustrasjonen for å fylle en feil dimensjon.
3. På vanlige høye iPhoner prioriteres større, lesbare ordfliser i to kolonner, med minst 18 px ordtekst og tydelige ikon-/valgknapper. Kompakt 320 px har fremdeles seks ord på første del av skjermen med minst 16 px tekst.
4. Den korrekte personlige revefiguren er større og får en rolig ventebevegelse; med `prefers-reduced-motion:reduce` deaktiveres bevegelse. Eksisterende hint, jubel og riktig/feil-respons beholdes.
5. Redundant «Hør oppgaven»-knapp i fotfeltet fjernet; den identiske opplesningen er fortsatt tilgjengelig via den tydelige «Hør»-knappen øverst.
6. Ingen endringer i den opprinnelige bokstav-Ordjakt, SuperKlode, reiser, kapitler, barnets lagrede fremgang eller andre aktivitetskort.

## Nytt kvalitetsbevis som kreves
- Ekte GitHub Actions WebKit iPhone 320×568 / 390×844, iPad 820×1180 og 1180×820, samt Chromium på iPad-størrelse.
- `.fw-picture` sin reelle DOM-boks må være 5:3 innenfor 1 %, og `img` må ha identisk målt areal med aktivt trykkplan.
- I hver nettleser sjekkes åtte konkrete **synlige malte objektposisjoner** (ikke bare midten av HTML-knapp): sol, tre, telt, vann, rev, sekk, båt, fugl. `elementFromPoint` ved det barnet ser, skal treffe riktig gjenstand.
- Alle tidligere tester: riktig valgt ord, ingen skår ved feiltrykk, valgfritt dra-og-slipp, hint, personlig valgte rev, fullføring, gjenopptakelse og fem gamle Ordjakt-tema.
- Inspiser faktiske screenshots for kutt, overlapper, første skjerm og lesbarhet. Ingen automatiske premium-påstander på grunnlag av grønn CI alene.

## Før fremtidig merge/utrulling
Avstem mot **nyeste** main etter Gangemagi/kapittel 2, integrer endringene konfliktfritt og oppdater `index.html` og `sw.js` med ny ressursversjon for Safari/PWA (ikke gjort nå for å unngå parallelle konflikter med #192). Kjør eksakt-head CI på den integrerte kandidaten og etterprøv faktisk publiserte ressurser på GitHub Pages.

## Begrensning
Dette er en **geometri- og brukervennlighetsrettelse**, ikke den endelige rike 2.5D-eventyrillustrasjonen fra brukerens låste visuelle referanse. Flere gjennomarbeidede skogsmiljøer og mer sceneintegrert rev er en separat, gjenstående kvalitetsport før endelig premium-status.

## Oppfølging: reven peker og feirer ved selve gjenstanden

- PR #196 videreutvikles i samme gren. Ingen egen konkurrerende PR.
- Den faktiske valgte reven beholder hintknapp og norsk tale/reaksjon.
- **Hint 1:** Verbal, rolig ledetråd uten å avsløre svaret.
- **Hint 2:** Et kort, glitrende veiledningsspor tegnes i den samme SVG-flaten som de 8 trykkbare gjenstandene. Sporet avsluttes med en ring ved riktig objekt. Effekten er `aria-hidden` og har `pointer-events:none`, så barnet kan alltid trykke eller dra på det virkelige objektet.
- **Riktig funn:** Stjerner/lyse stråler ved den gjenstanden barnet faktisk fant, ikke et unødvendig modalvindu. Ingen endring i skår eller progresjon.
- **Feiltrykk:** Kort, vennlig ring ved den berørte gjenstanden. Feil gir fortsatt aldri poeng, og et nytt ord må velges før neste forsøk.
- Alle midlertidige spor ryddes opp ved nytt ord, neste runde og lukking. Redusert bevegelse respekteres av CSS; skjermleseren får fortsatt reven sin eksisterende tekst.
- `tests/laria-find-the-words.playwright.js` kontrollerer at den nye målmarkøren viser riktig valgt ord, at magien ikke fanger `elementFromPoint`-trykk, at feil/suksess vises på riktig objekt, og at alt ryddes ved lukking. Skjermbilde av et riktig funn inngår nå i CI-artefaktet.

**Siste kode ved oppdatering:** commit `a72307b232490bfe147f9e6c7e27437521137e4a` på PR #196. Eksakt-head GitHub Actions `Laria Finn ordene WebKit` run 39321179958 må bestå, og faktiske bilder må vurderes før denne forbedringen kan kalles QA-godkjent. Ingen merge/publisering er foretatt. Referanseillustrasjon og flere fullverdige scener gjenstår fortsatt.
