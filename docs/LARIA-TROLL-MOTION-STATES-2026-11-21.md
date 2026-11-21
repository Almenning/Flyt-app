# Storesøster: seks tilstander, faktisk mediedekning og appkoblinger

Dato: 21. november 2026. Fortsettelse av PR #258 fra `410db1c`.

## Ærlig leveransestatus

**To avspillinger er registrert for vurdering: wave og en avledet blink-idle.**
Det er fortsatt bare én original AI-generert sekvens. Idle bruker uendrede
helfigurbilder fra den nøytrale blinkdelen i vinket; den er ikke en ny
AI-generert pusteanimasjon. Teknisk støtte for øvrige tilstander er ikke
det samme som ferdige videoer.
Vanlig app bruker fortsatt original V1. Vurderingsmodus krever
`?laria-troll-motion=1`. Ingen merge eller publisering er utført.

| Designnavn | Appens navn | Faktisk medieklipp | Reell hendelse |
|---|---|---|---|
| idle | idle | Avledet blink, 5500 ms løkke; ingen ny generering | Synlig hovedfigur i ro |
| wave | wave | Verifisert 5250 ms WebP | Trykk på trollet / velkomst |
| think | think | Kvoteavvist | Fjerne et bær i Gangemagi |
| help | hint | Kvoteavvist | Norsk-hint og Gangemagi-hint |
| celebrate | celebrate | Kvoteavvist | Riktig svar / fullført Gangemagi |
| encourage | support | Mangler ren, akseptabel eksport | Feil oppgavesvar |

`curious` kan bruke et registrert think-klipp. `walking` beholder eksisterende
CSS-bevegelse. Manglende reaksjoner beholder originalfigur og eksisterende
CSS; de registreres ikke som ferdige med kopier av hele vinket eller tomme
filer. Blinkvarianten nedenfor bruker bare bilder før armen begynner å vinke.

## Det som er implementert

- Ett separat manifest med figuridentitet og reelle klippoppføringer.
  Innlasting kontrollerer filnavn, SHA-256, byteantall og dekodede dimensjoner.
  En manglende tilstand blokkerer ikke det eksisterende vinket.
- Avspilling bevarer V1 mens filen lastes og dekodes, og bruker hele den
  faktisk eksporterte klipplengden. Bytebuffer gjenbrukes ved nytt vink.
- Idle bruker én innebygd blinkløkke på den synlige hovedfiguren. Profilminiatyrer og skjulte figurer er utelatt.
  Skjult scene/dokument, sidebytte, redusert bevegelse og trollbytte stanser
  avspillingen. Feilet idle gir ingen automatisk nedlastingsløkke. En ny
  uttrykkelig reaksjon kan prøve registrert idle igjen etter reaksjonen,
  også når det matchende hvilebildet først var utilgjengelig.
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

## Kostnadsfri blink som hvile i vurderingsmodus

Brukerens ekstrabudsjett er **0 kroner**. `idle-blink-reuse-20261121.webp`
er den samme filen som ble levert som separat blinkprøve; ingen ny
bildefremstilling eller videogenerering er utført ved appintegrasjonen.

Kilderamme 0–8 fra `wave-groundcut-20261121.webp` spilles fremover, deretter
7–0 baklengs. Siste valgte kilderamme begynner ved 750 ms og slutter ved
833 ms, før hånden forlater hoften. Åpningen av øynene er dermed den
opprinnelige lukkebevegelsen i revers. Hun er tilbake i nøytral positur ved
1416 ms, etterfulgt av en pause til syklusen er 5500 ms.

Alle 17 dekodede RGBA-rammer er pikselidentiske med de angitte kilderammene.
Første og siste ramme er identiske. Det er ingen nye ansikts- eller
kroppspiksler, kroppsdelslag, deformering eller interpolering. Filen er
264 × 540, 2 740 274 byte, har uendelig løkke og SHA-256
`6fa47c4fda92f5e72b8ecdf0e9bcdd91ae575eebb2b8760b19dcf65e3d9d6387`.

Manifestet aktiverer klippet bare gjennom eksisterende opt-in-vurderingsmodus.
Et trykk avbryter hvilen og spiller hele vinket. Avspilleren går deretter
tilbake til hvile og gjenbruker allerede verifiserte filer. Manglende eller
feilet idle beholder den statiske figuren og skal ikke gi en automatisk
nedlastingsløkke. Lillesøster og Lillebror får ikke nye klipp av denne endringen.

Provenans og nøyaktig tidskart ligger i `idle-blink-reuse-20261121.json` ved
siden av filen. `scripts/laria-prepare-storesoster-blink.py` kan gjenskape
blinkprøven fra det eksisterende rensede vinket i en separat eksportmappe.

Dette er en **enkel blinkende hvilevariant til visuell vurdering**. En ny,
selvstendig pustesyklus, de fire øvrige reaksjonene og klipp for de to andre
trollene er fortsatt ikke levert. Vurderingsmodus er ikke produksjonsgodkjenning.

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
Forsøkene nedenfor brukte samme original som både første og siste bilde.

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
Produksjon av nye, uavhengige AI-sekvenser trenger tilgjengelig videokvote
og rene eksporter som består identitets- og bevegelseskontrollen. Den
avledede blinkvarianten ovenfor trenger ingen ny generering eller kvote.

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
mediedekning separat: 2/6 registrerte avspillinger og fire manglende for
Storesøster. Idle er avledet fra wave, ikke en andre original AI-sekvens.

Ved første innkobling bestod 565/565 Node-tester, inkludert 33 målrettede
atferdstester. Nettlesertesten måler nå en hel idle-syklus både før og etter
et faktisk vink på Hjem, og krever én filnedlasting gjennom løkker,
reaksjoner og trollbytter. Retur fra feil i posteren kontrolleres med
verifisert nøytralt bilde og gjenopptatt idle.

Den første nettleserrunden avdekket at en tidligere feil i hvilebildet
kunne sperre blinket også etter et vellykket manuelt vink. Oppfølgingen
gjenåpner registrert idle ved en uttrykkelig reaksjon og har en egen
regresjonstest for hele forløpet. Automatisk polling av feilende media er
fortsatt sperret. CSS og alle bildefiler er uendret i denne rettelsen.

WebKit hadde også treg første innlasting på stående iPad. Testene fører
derfor passive, avgrensede målinger av ferdige nettverksforespørsler,
blob-URL-er og native bildedekoding. Kjøring `44933817255` målte omtrent
13,6 sekunder fra observert idle-forespørsel til levering, uten at
idle-bildedekoding hadde startet. Dette inkluderer kø og oppstart;
målingen isolerer ikke nettverksoverføring som årsak.

Bakgrunns-idle får derfor en samlet, hard lastefrist på 20 sekunder for
manifest, hvilebilde og klipp. Øvrige reaksjoner beholder 10 sekunder.
Det nøytrale bildet vises under ventingen. Tre målrettede regresjoner
kontrollerer treg, vellykket idle; stopp ved fristen uten nye automatiske
forsøk; og avbrudd før sen innlasting kan overta etter vink, trollbytte,
redusert bevegelse, skjult side eller pagehide. Nettlesertestens
20-sekunders ventekrav er uendret.

Videre kontroll fant en konkret oppdateringsløkke på Hjem: `syncGreeting`
skrev identisk hilsentekst, som utløste live-copy-observeren og dermed
neste `syncGreeting`. Troll-runtime reagerte også på tekstutskiftingen.
Hilsenen skrives nå bare når innholdet faktisk endres. En regresjon kjører
den ekte funksjonen og kontrollerer null skrivinger ved uendret navn,
én oppdatering ved nytt navn og bevart fallback ved tom eller manglende
overskrift. Kunst, layout, hilsentekst og observerfiltrering er bevart.
Faktisk nettleserkontroll må vise hvor mye av oppstartsforsinkelsen denne
rettelsen fjerner; løkkefunnet alene dokumenterer ikke hele tidskostnaden.

Den avgrensede oppstartsprofilen i kjøring `44936570445` viste en pause på
24 132 ms i en 250 ms timer på første WebKit-portrett. De målte synkrone
observer-, rAF- og testcallbackene brukte til sammen 728 ms over 45 sekunder,
inkludert overlapp. Troll-runtime sine største `sync`- og `reconcileMotions`-
kall var henholdsvis 2 og 4 ms. Profilen dekker ikke alle oppgavetyper og
beviser derfor ikke alene en bestemt native nettleserfeil.

To globetegninger ble køet ved begynnelsen av pausen, selv om Kloden var
skjult. Skjult canvas falt da tilbake til hele viewportens dimensjoner.
Tegneinngangene og den første resize/tegnepakken hopper nå over en inaktiv
Kloden-skjerm. Installering, kontrollkoblinger og valgt land beholdes;
eksisterende aktiveringsobserver utfører resize og maling når Kloden åpnes.
Dette fjerner konkret unødvendig bakgrunnsarbeid. Effekten på oppstarten
måles med samme profiler, frister og nettleserkrav; årsakssammenheng skal
ikke hevdes før den faktiske kjøringen dokumenterer den.

Resultater må leses fra kjøringen for siste leverte commit. Denne teksten
påstår ikke at en kjøring som ennå ikke er avsluttet har bestått. Grønne
flyttester godkjenner ikke manglende kunst, fysisk iPad eller hele utgivelsen.
