# Læria: opprydding av åpne PR-er (18. oktober 2026)

Kontrollert hovedgren: `1a01db7456f9ae2ad01347ea721571188c27852a`.
Opptelling ved kontroll: **24 åpne PR-er**, inkludert ny #181 (tidligere 23).
Dette er en statuslogg, ingen godkjenning av publisering.

## Dokumentert integrert eller erstattet: lukk uten merge etter forklarende kommentar

| PR | Bevis |
| --- | --- |
| #149 | Norsk Fortellingsdalen er integrert via flettede #159 (`7d7bd79`). 10/15 endrede filer har identisk Git-blob på main, inkludert historier, kart, velger og Node-test. Gjenværende UI og browser-test er videreutviklet. |
| #155 | Matte Mønsterhagen fra #159: alle 20 gamle oppgave-ID-er er bevart på main i utvidet bank med 40. Fortsatt intern pilot. |
| #156 | Engelsk Setningshavna fra #159: alle 20 gamle oppgave-ID-er er bevart på main i utvidet bank med 40. #169 er aktiv separat releasekandidat. |
| #157 | Geografi Kontinentseilasen fra #159: alle 20 gamle oppgave-ID-er er bevart på main i utvidet bank med 40. #169 er aktiv separat releasekandidat. |
| #172 | Oppdag-prototypen er videreført til den flettede #176 (`490e379`); begge produktkontraktsdokumentene og globusmotorens eldre renderer finnes på main. Aktiv videreutvikling i #179. |

Flettede #159 og #176 dokumenterer integrasjonen. På den kontrollerte main-SHA var Laria QA, Continuous smoke og Dual Globes QA grønne (Actions 39061811057, 39061811073 og 39061811195). Ingen gamle grener bør merges over den nyere koden.

## Behold: har udokumentert eller påvist unikt innhold

| PR | Begrunnelse / neste kontroll |
| --- | --- |
| #77 | Unik `docs/LARIA-PREMIUM-NAVIGATION-CONTRACT.md` mangler på main. |
| #99 | Unik `globe-responsive-landscape-v1.css` mangler på main. |
| #113 | `laria-voice.js` mangler på main, Mia/Magnus-integrasjon ikke påvist. |
| #124 | D2-kartbunn/terrengressurser mangler på main. |
| #129 | Nye CSS-regler for `.country-story.is-long-name` finnes ikke fullstendig på main. Verifiser lange landnavn på mobil. |
| #131 | Main har fortsatt 24 land og 72 oppdagelser i redaksjonell bank. PR utvider til 57 land og 171 oppdagelser, altså 99 uintegrerte landoppdagelser. |
| #132 | Oppgaveflyt, hint og fullføring har mange endringer. Må revideres mot dagens runtime før sikker integrasjon. |
| #50 | Har alternativt geografisk atlas i `globe-geographic-atlas-v1.js` som ikke finnes på main. Må avgjøres designmessig. |

## Historiske PR-er som krever nærmere sammenligning

#28 (globusmotor), #36 (testoppdatering), #38 (WebKit-oppstartstest), #41 (Prompt 17 device-matrise), #61 (Safari-cache), #68 (globeillustrasjon v37) og #79 (globus/zoom) er gamle eller overlappende, men ekvivalensen er ikke tilstrekkelig dokumentert til å lukke dem blindt.

## Aktive PR-er som ikke må overskrives

- #169: Setningshavna + Kontinentseilasen releasekandidat. Siste testet head `33e2dc0` feiler pga. `published:true/artApproved:true` i grenens modell samtidig som tester forventer upublisert pilot. Retting og visuell godkjenning hører til egen utviklingsoppgave.
- #178: avhengighet/forarbeid for SuperKlode #179. Ikke lukk før integrasjonskjeden er avklart.
- #179: aktiv SuperKlode v3 med egen arbeidsgren og verifisering.
- #181: ny Gangemagi «Dagens oppdrag», egen draft-review.

## Fremgang og neste handling

Oppstart: 24 åpne. Denne registreringen lukker **0** PR-er og merker **ikke** noe nytt som produksjonsklart. Etiketter er satt der GitHub-tilkoblingen tillot det.

Avslutningskommentar og ny Issue/innholdsoppdatering ble blokkert av verktøyets sikkerhetssjekk. Kravet om forklarende PR-kommentar før lukking opprettholdes: Ingen lukking uten dokumentert endelig bevis og kommentar.

Neste trygge steg: kommenter og lukk #149, #155, #156, #157 og #172 **uten merge**, så snart kommentarskriving er mulig; kontrollér siste head og main først. Prioriter deretter separat QA/integrasjon av #131 og #129. Ikke bland kodegrenene #169 og #179 inn i oppryddingen.

## Oppfølging 18. oktober: fem gamle PR-er lukket

Etter ny kontroll av main `1a01db7456f9ae2ad01347ea721571188c27852a`, berørte filer, original PR-head og integrasjonshistorikk ble disse **lukket uten merge**. Hver PR fikk egen forklarende kommentar før lukking og ble kontrollert igjen før tilstandsendring:

| PR | Lukking | Grunnlag |
| --- | --- | --- |
| [#149](https://github.com/Almenning/Flyt-app/pull/149) | lukket uten merge | Fortellingsdalen via #159; alle 15 berørte filstier finnes på main |
| [#155](https://github.com/Almenning/Flyt-app/pull/155) | lukket uten merge | Mønsterhagen via #159, 20 opprinnelige oppgave-ID-er bevart |
| [#156](https://github.com/Almenning/Flyt-app/pull/156) | lukket uten merge | Setningshavna via #159; aktiv ny releasekandidat #169 |
| [#157](https://github.com/Almenning/Flyt-app/pull/157) | lukket uten merge | Kontinentseilasen via #159; aktiv ny releasekandidat #169 |
| [#172](https://github.com/Almenning/Flyt-app/pull/172) | lukket uten merge | Isolert SuperKlode-prototype erstattet av flettet #176; alle åtte relevante filstier finnes på main; ny utvikling i #179 |

Det var 24 åpne PR-er ved morgenkontroll. Etter disse fem lukkes antallet til 19, og ny, selvstendig [#183](https://github.com/Almenning/Flyt-app/pull/183) for WebKit Ordjakt-testen øker antallet til **20 åpne**. #183 er Draft til eksakt-head CI er kontrollert. Ingen produkter er publisert av disse oppryddingsoperasjonene.

### Konkrete nye testfunn

- Publisert main feilet den andre automatiske nattkjøringen [#39097119142](https://github.com/Almenning/Flyt-app/actions/runs/39097119142), `logs/ordjakt.log`: en Playwright `locator.click` i WebKit 320x568 ventet 30 sekunder på stabilitet i temakortet før oppstart. Forrige samme-main nattkjøring bestod. #183 erstatter dette med kontroll av faktisk skjermtreff og mobilberøring, uten produksjonskodeendring. **Ingen rettelse erklæres verifisert før CI.**
- [#181](https://github.com/Almenning/Flyt-app/pull/181) har dokumentert WebKit 390x844 fullført-oppdrag-knapp som ender på y=868,6, altså 24,6 px under synlig skjerm. GitHub Actions #39102870089 feilet; presis feilrapport er kommentert på PR-en.
- [#169](https://github.com/Almenning/Flyt-app/pull/169) har ny SHA `1f48626e75d45dd388ad8cda0328c7ad6a2a1f7a`, og flere tidligere røde kapittel-2-kontroller er grønne på den SHA-en. Dette gir ingen automatisk kunstgodkjenning eller publisering.
- [#179](https://github.com/Almenning/Flyt-app/pull/179) står fortsatt Draft; ikke endret.

### Neste kontroller

1. Bekreft nøyaktig PR-head og alle relevante testresultater for #183 før eventuell review/merge.
2. Bevar #169 og #179 som egne utviklingsspor; publiser ikke kapittel 2 eller ny SuperKlode uten godkjent kunst og egne releaseporter.
3. Gå gjennom #131 og #129 som unikt arbeid, ikke lukk dem for å redusere PR-tallet.

## Oppfølging: ytterligere tre gamle PR-er dokumentert lukket

- [#61](https://github.com/Almenning/Flyt-app/pull/61): gammel cacheoppdatering for Brøklab og tester med foreldet nøyaktig cache-ID; main har nyhets- og Safari/PWA-versjoner datert senere enn PR-en. Lukket uten merge.
- [#38](https://github.com/Almenning/Flyt-app/pull/38): opprinnelig Basecamp/WebKit venting er teknisk erstattet av aktiv start-, fag-, klode- og navigasjonskontroll i nyere Basecamp-test. Lukket uten merge.
- [#36](https://github.com/Almenning/Flyt-app/pull/36): gammel test- og profilmarkørendring. Dagens WebKit/Basecamp-test og matematikkreisens tester dekker oppstarts- og revkrav; gammel markør er nå bevisst skjult når fullkroppsrev brukes. Lukket uten merge.

Alle tre fikk skriftlig forklaring i GitHub før statusendring, og eksakt head ble kontrollert igjen. Totalt **åtte** gamle PR-er er lukket i denne arbeidsøkten, uten merge og uten produksjonsendringer. Når #183 (Ordjakt testdiagnostikk) også er telt som ny åpen draft, er antallet **17 åpne PR-er** ved denne kontrollen. Andre eldre PR-er er fortsatt åpne dersom unik funksjonalitet eller bevis for ekvivalens mangler. 
