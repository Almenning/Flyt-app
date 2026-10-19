# Læria: Finn ordene – valgfri dra-og-slipp (19.10.2026)

## Bakgrunn og produktvalg
Brukeren ønsket mer aktiv matching: barnet må velge ordet det leter etter, og helst kunne dra ordet til gjenstanden. Første publiserte versjon krevde bevisst ordvalg før trykk i bildet og ga aldri fremgang for tilfeldige trykk.

Denne endringen gir **to likestilte, trygge måter å spille på**:
- Velg et ord, og trykk på riktig gjenstand i det illustrerte bildet.
- Dra ordet direkte fra listen og slipp det på riktig gjenstand.

Begge metoder bruker den **samme eksisterende kontrollen for riktig ord/gjenstand**. Feil slipp gir ikke fremgang; valget må gjøres bevisst på nytt. Drar barnet ordet til tomt område, markeres det som valgt slik at barnet kan avslutte med ett trykk.

## Isolert utvikling
- Branch: `feat/laria-find-words-drag-matching-20261019` opprettet fra `main`-SHA `dabff9a58a3441f641294f773f0e30f841678aec`.
- Bare `find-the-words.js`, `find-the-words.css`, `index.html`, `sw.js` og testen for «Finn ordene» endres.
- Riktig personlig rev, lagret fremgang og ordvalg, totrinnshint, de fem like kortene i Utforsk, original Ordjakt og illustrert Bokskogen er bevart.
- Bruker Pointer Events og `touch-action:none` **bare på ordflisene** i stedet for native HTML5-drag som kan være upålitelig i iPhone-/iPad-Safari.
- Dragegest starter først etter 12 pikslers faktisk bevegelse slik at vanlige trykk, tastatur og skjermleser fortsatt virker.
- Under draing får barnet en flytende, lesbar ordflis; gjenstand under fingeren fremheves. Drageflis og effekter fjernes på slipp, avbrutt gest, sceneskifte og lukking.
- JS/CSS-ressursversjoner og service-worker-cache oppdateres for Safari/PWA.

## Testport
1. WebKit (iPhone 320×568, 390×844, iPad stående og liggende) + Chromium iPad liggende.
2. Eksisterende test for ord-først-matching, valgt rev, hint, seks funn, varig fremgang, null poeng for tilfeldig trykk og klassisk Ordjakt.
3. Ny test med ekte pekergester: feil drag «fugl» på «sol» gir ingen poeng, riktig drag «fugl» på «fugl» teller én gang, draging «båt» til tomt område velger ordet men teller ikke før etter riktig trykk.
4. Sjekk at den femte illustrerte Utforsk-knappen fortsatt er likestor og fungerer, uten feil på iPad/iPhone.
5. Innhent og vurder nye ekte skjermbilder. Fullfør PR og verifiser publisert GitHub Pages først når eksakt-head-test og tilgjengelighet er grønne.

## Nåværende status
Implementert og committet på egen gren. Testene er **ikke rapportert som bestått** før GitHub Actions på eksakt siste commit har fullført.
