# Storesøster: seks tilstander, faktisk mediedekning og appkoblinger

Dato: 21. november 2026. Fortsettelse av PR #258 fra `410db1c`.

## Ærlig leveransestatus

**Én av seks animasjonssekvenser er registrert for vurdering: wave.**
Teknisk støtte for de øvrige tilstandene er ikke det samme som ferdige videoer.
Vanlig app bruker fortsatt original V1. Vurderingsmodus krever
`?laria-troll-motion=1`. Ingen merge eller publisering er utført.

| Designnavn | Appens navn | Faktisk medieklipp | Reell hendelse |
|---|---|---|---|
| idle | idle | Mangler ren, akseptabel eksport | Synlig hovedfigur i ro |
| wave | wave | Verifisert 5250 ms WebP | Trykk på trollet / velkomst |
| think | think | Kvoteavvist | Fjerne et bær i Gangemagi |
| help | hint | Kvoteavvist | Norsk-hint og Gangemagi-hint |
| celebrate | celebrate | Kvoteavvist | Riktig svar / fullført Gangemagi |
| encourage | support | Mangler ren, akseptabel eksport | Feil oppgavesvar |

`curious` kan bruke et registrert think-klipp. `walking` beholder eksisterende
CSS-bevegelse. Manglende media beholder originalfigur og eksisterende CSS;
de erstattes ikke med kopier av vinket eller tomme filer.

## Det som er implementert

- Ett separat manifest med figuridentitet og reelle klippoppføringer.
  Innlasting kontrollerer filnavn, SHA-256, byteantall og dekodede dimensjoner.
  En manglende tilstand blokkerer ikke det eksisterende vinket.
- Avspilling bevarer V1 mens filen lastes og dekodes, og bruker hele den
  faktisk eksporterte klipplengden. Bytebuffer gjenbrukes ved nytt vink.
- Idle kan bruke én innebygd løkke på den synlige hovedfiguren når en ekte
  idle-fil blir registrert. Profilminiatyrer og skjulte figurer er utelatt.
  Skjult scene/dokument, sidebytte, redusert bevegelse og trollbytte stanser
  avspillingen. Feilet idle gir ingen automatisk nedlastingsløkke.
- Den ekte Norsk-hintknappen utløser hint, og lukking avslutter reaksjonen.
  Eksisterende hinttekst og læringsdata er bevart.
- Gangemagis nyrendrede figur sender sin faktiske reaksjon til spilleren.
  Spillmotor, bær, kurver, taletekster og lagringslogikk er uendret.
- Hver registrerte figur har egen manifestinnlasting, verifisert filbuffer
  og feiltilstand. Bare Storesøster har faktiske mediefiler. Lillesøster og
  Lillebror beholder originalfigurene uten å be om manglende filer. Et sent
  svar fra en tidligere figur kan ikke overta etter trollbytte.
- Ugyldige lagrede figurnavn faller tilbake til Storesøster. Arvede
  objektnavn som `constructor` godtas ikke som figurvalg og lagres ikke.
- TrollActor eier bevegelsen i Gangemagi; den gamle vertsanimasjonen blir
  ikke lagt oppå figurens egen bevegelse. Regnestykket får reservert plass.
- Scriptversjonene i index.html er oppdatert. Eksisterende service worker
  bruker allerede nettverk først for JS og JSON.

## Renset vink med matchende hvilebilde

Den lyse bakken under og mellom støvlene er fjernet fra en ny, separat
review-variant. `wave-groundcut-20261121.webp` har samme bevegelse og
varighet som første vink; dette er ikke en ny animasjonstilstand.

En transparent uttrekking fra bildeverktøyet er brukt bare som alfakilde.
Masken er registrert mot den låste originalen med én affin transformasjon.
Ingen genererte ansikts-, hår-, hånd- eller klespiksler er brukt. Selve
videoen bruker fortsatt RGB fra den opprinnelige kildevideoen. Øvre 620 av
900 rader av referansemasken er uendret. Begge støveltå-kjernene har minst
252/255 alfa gjennom alle kilderammer, og kontrollområdet for bakken er
fjernet i samtlige 63 rammer.

`poster-groundcut-20261121.webp` er et matchende, statisk hvilebilde.
Det bevarer originalens synlige RGB pikselidentisk, og de første 706
RGBA-radene er helt uendret. Den låste originalfilen er bevart.
Vinket og hvilebildet må brukes sammen slik at bakken ikke kommer tilbake
ved avslutning. Et deklarert hvilebilde skal være integritetskontrollert og
dekodet før den tilhørende animasjonen kan spilles. Feil beholder originalen.

Masken, provenansen og den reproduserbare behandlingen ligger i
`tools/laria_art/inputs/storesoster-groundcut-alpha-20261121.*` og
`scripts/laria-prepare-storesoster-wave.py`. Begge nye filer er gjenskapt
med identiske hashverdier; kjøring uten ny maske gir fortsatt det tidligere
vinket byteidentisk. Det tidligere vinket og dets metadata er beholdt.

## Medieproduksjon og den konkrete blokkeringen

Originalens SHA-256 er
`b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89`.
Den er identisk med filen på offentlig main `630b98b4`. Opplasting til
HeyGen ble først avvist fordi kontrollen klassifiserte den som privat;
samme opplasting ble godkjent etter at offentlig repo og identiske bytes
var dokumentert. Dette er ikke lenger en blokkering.

Den opprinnelige wave-genereringen er HeyGen Video 1,
`9c03420d22f14bd186d313de5612b4e7`, seed `982016847`.
De nye jobbene bruker samme original som både første og siste bilde.

- Idle-jobb `cf5752616a1d48f2a2055451f5e4568b` fullførte, men råfilen har
  leverandørvannmerke over fotområdet og uønskede animerte blå linjer mot
  svart bakgrunn. Den er avvist som appkunst.
- Support-jobb `890114f25fad4d0892433b15a7bb724e` fullførte, men råfilen har
  samme vannmerke, bruker motsatt arm i en bred gest og åpner munnen.
  Den er avvist som appkunst.
- Think, hint og celebrate ble avvist med HTTP 402 / insufficient_credit.
  HeyGen oppga at månedens gratiskvote er brukt opp, uten fornyelsesdato.
  Ingen av disse jobbene ble startet eller automatisk forsøkt på nytt.

Råvideoene er bevart uendret under `tools/laria_art/inputs/`; de ligger ikke
i appens kunstmappe og er ikke registrert i manifestet. Fullstendige
prompter, innstillinger, jobb-ID-er, kildehashverdier og avslagsgrunner
finnes i `storesoster-motion-generation-20261121.json` i samme mappe.
Videre medieproduksjon trenger tilgjengelig videokvote og rene eksporter
som faktisk består identitets- og bevegelseskontrollen.

## Kontroll og bevis

Runtime har målrettede atferdstester for manifest, integritet, fallback,
repetisjon, avbrudd, sen respons og idle-livssyklus. Mockede enhetstester er
ikke bevis på levert idle-kunst.

Den faktiske nettleserkontrollen er delt i wave og flows, med Chromium og
WebKit i begge iPad-retninger. Den omfatter også bytte mellom alle tre
figurer, retur til Storesøster uten ny videonedlasting, feil i hvilebildet
og nytt manuelt forsøk. Norsk/Gangemagi har 8 handlingsscenarioer.
Den bruker ekte knapper og skiller læringsregistrering ved svar fra hint
og andre handlinger som skal bevare progresjon. Results.json fører
mediedekning separat: 1/6 registrerte klipp og fem manglende.

Resultater må leses fra kjøringen for siste leverte commit. Denne teksten
påstår ikke at en kjøring som ennå ikke er avsluttet har bestått. Grønne
flyttester godkjenner ikke manglende kunst, fysisk iPad eller hele utgivelsen.
