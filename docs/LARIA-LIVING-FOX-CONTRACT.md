# Læria – én levende, personlig rev (arbeid på PR #95)

## Styrende beslutning, 11. oktober 2026

Barnet velger **revejente eller revegutt**. Dette er én vedvarende figur,
ikke en generisk pyntemaskot og ikke et foto på et rundt kort. Samme
profilvalg og påkledning skal følge barnet gjennom Hjem, fire reisekart,
oppgaver, Utforsk, Magisk samlebok og Min rev / garderobe.

**Godkjent retning for jentefiguren:** brukerens reference fra 11. oktober:
oransje pels, store uttrykksfulle øyne, to fletter med blå sløyfer,
lys blå brodert kjole, bok, kompass og brune støvler. Dette bildet er
referansen til identitet og uttrykk, ikke et krav om å bake utstyret fast
i alle fremtidige animasjonssprites. Det skal fortsatt være mulig å ta
av, skifte og opptjene klær. Figurens kjennetegn, særlig ansikt, pels
og fletter, må være gjenkjennelige på tvers av antrekkene.

## Implementert som første **utkast** på PR #95

- Én felles presentasjonsmotor, `laria-fox-presence.js`. Introduserer
  bare reaksjonstilstander, ikke nye oppgaver eller progresjonsregler.
- Rolige reaksjoner: idle, hils, nysgjerrig, gå, feire, støtte.
  Redusert animasjon følger `prefers-reduced-motion`.
- Personlig rev flyttes visuelt til **samme oppdragsskilt** som barnet
  trykker på. Treffsoner og eksisterende fullføring forblir i originalmotoren.
- Eksisterende påklednings-SVG animeres som **én** rigg, slik at
  skjerf, hatt, kappe og sekk følger kroppen.
- `assets/fox/girl-reference-cutout-draft.webp` er en tidlig utklipping
  fra referansebildet (320 px bred, RGBA). Den leveres som egen fil og
  brukes foreløpig for jentas fullkropps-rigg i verden. Det tidligere
  godkjente portrettet for jente og gutt beholdes i profilvalg og toppfelt.
- Oppgavesvar kan aktivere støtte/glede uten å endre vurdering, lagring
  eller dagsmål. Inaktive dekorasjoner fanger ikke peketrykk.
- Nettlesertest `tests/laria-live-fox-presence.playwright.js` og
  dedikert CI-steg for WebKit/iPhone, WebKit/iPad og Chromium.

## IKKE ferdig og IKKE klar for main

1. **Kun én rev i synsfeltet:** Reisekartene fra 10. oktober inneholder
   fortsatt en generisk rev som rasterpiksler. Før publisering må en
   ren bakgrunn **uten figur** lages ved selektiv retusjering av akkurat
   disse delene av originalillustrasjonene. De fire øvrige landskapene,
   broene, bygningene, skiltplasseringene og hotspot-kontrakten skal
   bevares nøyaktig. Tilfeldig helregenerering er uaktuelt.
2. **Figurkvalitet:** Foreløpig utklipp har ujevne alphakanter ved
   halefestet, fletter og spesielt støvlene. Det er ikke et ferdig
   premium-asset. Den må renses manuelt eller erstattes med en
   godkjent ren kilde i samme positur. Guttefigurens fullkroppsvariant
   trenger tilsvarende transparent ressurspakke.
3. **Faktisk animasjon:** CSS-bevegelsen er en førstegenerasjons
   pust, tilt, lite hopp og posisjonsforflytning. For en virkelig
   spillkarakter trengs flere godkjente positurer eller en
   ordentlig rigg, slik at bein, hender, hode og hale kan bevege
   seg hver for seg. Ikke presenter CSS-tilten som 3D-animasjon.
4. **Garderobe:** De foreløpige festepunktene er grovt oversatt fra
   gamle portrettkoordinater. Hvert antrekk og begge figurer må
   få visuelt kontrollerte ankerpunkt.
5. **Sammenfletting:** PR #95 er startet fra en eldre commit
   på PR #90. Integrer endringer fra siste PR #90 og PR #94, og
   kontroller alle relaterte PR-er samt siste-commit CI.
6. **Sluttkontroll:** Ekte iPhone- og iPad-bilder i begge retninger,
   WebKit, 20 kartskilt, hele oppgave/tilbake-prosessen, låst
   progresjon og alle direkte snarveier skal være testet.

**Sluttstatus:** Implementasjon i arbeidsgren, ikke bekreftet publisert.
Merk *visuell prototype / teknisk førsteversjon* til alle punktene er lukket.
