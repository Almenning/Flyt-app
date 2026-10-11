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

## Teknisk status etter bilde- og kodesluttkontroll 11. oktober

- **Originalillustrasjonene er urørt.** Hvert av de fire godkjente kartene
  har et lokalt og reversibelt revefritt bildeutsnitt over den gamle malte
  eksempelreven. De originale 941 × 1672-PNG-ene er ikke erstattet. Dermed
  kan barnet nå vises med bare sin personlige rev på reisekartene.
- **Begge valgene har fullkroppsillustrasjoner** i egen transparens:
  `assets/fox/girl-braids-blue-dress-v1.webp` og
  `assets/fox/boy-adventurer-green-vest-v1.webp`, med samsvarende
  ansiktsutsnitt i karttoppene. Hatt, skjerf, sekk og kappe leses fra
  barnets eksisterende lagrede garderobe.
- **Oppgavescenen hadde et annet eksempelrevproblem:** Den innmalte reven
  nederst i `bokskogen-verden.png` og `matte-verden.png` kunne bli synlig
  utenfor oppgavekortet på stor iPad. Originalmaleriene er fortsatt urørt.
  Den aktive bakgrunnen ligger på `session::after` og forankres nå i
  toppen. Geografioppgaver bruker det eksisterende, revefrie
  `globe-storyscape-v36`-landskapet fremfor et bilde av Kloden med
  generisk rev og statiske skjermknapper. Kontroller alle disse visuelt.
- **Regresjonstesten** `tests/laria-live-fox-presence.playwright.js`
  besøker alle fire godkjente kart og samtlige 20 skilt, i tillegg
  til den reelle reisen videre til oppgavescenen. Den kontrollerer
  valgt identitet, påkledning, fotplassering, trygg pekeflate,
  bakgrunnsinnramming og uendret lagret progresjon.

## Gjenstående krav før produksjon / main

1. Kontrollér nye Actions-skjermbilder etter siste commit for begge revtyper
   på iPhone og iPad. Kontroller spesielt fotfeste, oppgavebakgrunn,
   påkledning og eventuelle uventede beskæringer.
2. Samtlige tilgjengelige siste-commit QA-, innholds-, smoke- og iOS-jobber
   må være grønne, ikke bare vellykkede på tidligere commit.
3. Animationsmotoren er fremdeles CSS-basert (rolig pust, tilt,
   forflytning, kort feiring), ikke en full skjelettanimert karakter.
   Mer naturlig gange krever egne gjennomarbeidede animasjonsposer.
4. Garderoben kan vise opptjente løse utstyrslag. Den blå kjolen og
   guttens grønne antrekk er ennå fast del av de to fullkroppsspritene.
   Skifte av grunnantrekk trenger egne grafikkvarianter/lag.
5. Samordne PR #95 med PR #96 (felles Hjem for alle klassetrinn) før
   produksjonsmerge; ikke tillat at den ene gjeninnfører gammel Hjem
   eller fjerner den andre grenens personlige rev.
6. Verifiser sluttresultatet på fysisk iPhone/iPad i portrett og landskap,
   med navigasjon, 20 skilt, oppdrag, fullføring og tilbakeflyt.

**Status:** Arbeidsgren i visuell og teknisk sluttkontroll.
Ingen produksjonsmerge før kravene er verifisert.
