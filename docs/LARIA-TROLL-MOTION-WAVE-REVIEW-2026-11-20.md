# Storesøster: første AI-vink i faktisk Læria

Oppdatert 21. november 2026 (Europe/Oslo).

**Status: kandidat i eksisterende PR #258, bare i vurderingsmodus.** V1 er
fortsatt standard. Ingen eiergodkjenning av denne animasjonen, merge eller
produksjonspublisering er gitt gjennom dette dokumentet.

## Hva som er endret

Den tidligere lokale committen `ad0ee96` inneholdt første vink, men var ikke
med i GitHub-grenen. Endringene er nå videreført fra PR-ens oppdaterte
`2a4d02f` og rettet. Den nye strategien bruker én ferdig animasjonssekvens;
den krever ikke nye oppdelte arm-, skulder- eller ansiktslag. De historiske
TrollActor 2-lagforsøkene er fortsatt sperret og er ikke kilde til denne filen.

Originalfigur: `assets/gangemagi-troll/storesoster.webp`, SHA-256
`b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89`.
Kildevideoen ligger i `tools/laria_art/inputs/storesoster-wave-source-20261120.mp4`.

Den første automatiske bakgrunnsfjerningen gjorde venstre støvel delvis
gjennomsiktig og lot ekstra bakgrunn følge håret. Den er erstattet med den
låste V1-masken, fulgt gjennom de eksisterende videobildene med optisk flyt.
Bildepunktene som tegner selve figuren kommer fortsatt fra kildevideoen;
ingen figurdel, klær eller ansikt er malt på nytt i dette etterarbeidet.
Originalens lille markdetalj ved føttene beholdes.

Reproduserbar behandling: `scripts/laria-prepare-storesoster-wave.py`.
Eksakte mål, varighet, filstørrelse, SHA-256 og verktøyversjoner ligger i
`assets/trollactor-motion/storesoster/wave-20261121.json`.
Det nye filnavnet hindrer gamle testklienter i å hente den feilaktige
animasjonen fra bildebufferen.

## Appens oppførsel

- Aktivering krever `?laria-troll-motion=1`, valgt Storesøster og `wave`.
- Original V1 beholdes synlig under innlasting og dekoding.
- En ferdig dekodet sekvens får hele sin varighet, selv om eldre kall oppgir
  en kortere CSS-animasjonsvarighet.
- Hvert vink får en ny avspilling. De nedlastede bildebytes gjenbrukes.
- Feil, avbrutt sekvens, trollbytte og redusert bevegelse går tilbake til
  riktig valgt originalfigur. En sen nedlasting kan ikke gjenopplive et
  tidligere valgt troll.
- Skjulte, pensjonerte figurer i DOM laster ikke animasjonen.
- Hjem v16 beholder animasjonen under synkronisering av samme figur.

Det er ingen endring i Grovanova-bilder, karakteroriginaler, lagret
barneprogresjon, læringslogikk eller HverdagsOss.

## Kontroll og avgrensning

Lokal `npm run test:node`: **541 bestått, 0 feil** etter avspillingsrettingene.
Dette omfatter 9 atferdstester for den nye avspillingen. Det er ikke et
bevis på ferdig visuell kvalitet.

`tests/laria-troll-motion.playwright.js` åpner den faktiske appen, klikker
det reelle trollet og tester normal/repetert avspilling, full varighet,
feil og forsinket lasting, trollbytte og redusert bevegelse. Testen bruker
Chromium og WebKit i iPad-formatene 1024×1366 og 1366×1024. Den lagrer
skjermbilder, opptak og `results.json` med kildecommit og filhashverdier.

Den lokale datamaskinen kan ikke starte Chromium under gjeldende
systempolicy, og WebKit mangler systembiblioteker. Den avgrensede
GitHub-kjøringen `Læria – Storesøster wave in actual iPad app` er derfor
kilden til reell nettleserkontroll. Resultatet må leses fra kjøringen for
den leverte committen. Denne teksten påstår ikke at en uferdig kjøring har
bestått. Nettleseremulering er heller ikke en test på fysisk iPad.

Før standardaktivering: vurder faktisk opptak og begge iPad-retninger,
fullfør nødvendige regresjonsporter og innhent konkret visuell godkjenning.
De fem andre sekvensene og de to andre trollene er ikke levert i denne
første animasjonsendringen.
