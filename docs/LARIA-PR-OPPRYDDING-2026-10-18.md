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
