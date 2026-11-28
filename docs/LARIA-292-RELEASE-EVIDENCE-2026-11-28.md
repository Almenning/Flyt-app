# Læria #292: publiseringsgrunnlag 28. november

Status: **utkast, ikke publiseringsklart**. Denne oversikten endrer ikke
`LARIA-PREMIUM-RELEASE-STATE.json` eller prosjektets publiseringskrav.

- GitHub-kandidat: [PR #292, `e34223849a67`](https://github.com/Almenning/Flyt-app/commit/e34223849a67bbd17a743c1cdc381d8f81e6d0f2).
- Produktkildetre `b7e5e8a6491ed630b37e5f72bea04de5730f9a95`;
  testkildetre `2f6175419109f6ad28f8ff9c97c49c2e6282a259`.
- Eierbeslutninger følger det som faktisk ble vist. Nyeste stående og liggende
  iPhone-Hjem er begge godkjent, se
  [iPhone-Hjem-godkjenning](LARIA-HOME-IPHONE-PORTRAIT-APPROVAL-2026-11-28.md).
  Tidligere viste iPad-, Mac-, fag- og Trollbutikk-bilder er dokumentert
  [separat](LARIA-SAMLET-KANDIDAT-2026-11-27.md). Dette er ikke godkjenning av
  alle skjermene i brukerreisene på de samme enhetene eller av separate kunstfiler.

| Faktisk CI-grunnlag | Resultat |
| --- | --- |
| [Hjem v16](https://github.com/Almenning/Flyt-app/actions/runs/46132104592) | Grønn i Chromium og WebKit. Tre stående iPhone-størrelser, liggende iPhone, iPad og Mac; begge reiseskilt og fallback ved ugyldig SHA. Skjermbildeartifakt 15258307097. |
| [Investor-demo](https://github.com/Almenning/Flyt-app/actions/runs/46132104406) | Grønn i begge nettlesere på 390 × 844, 820 × 1180, 1180 × 820 og 1440 × 900. Åtte arkiver. Separate kontrollrapporter om førstefolden dekker også liggende telefon, men dette er ikke et komplett liggende iPhone-demoalbum. |
| [Trollbutikken](https://github.com/Almenning/Flyt-app/actions/runs/46132104545), [iOS-bygg](https://github.com/Almenning/Flyt-app/actions/runs/46132104399) | Grønne på samme commit. Bygg er ikke distribusjon eller fysisk enhetstest. |
| [Hoved-QA](https://github.com/Almenning/Flyt-app/actions/runs/46132104576), [iPad Premium](https://github.com/Almenning/Flyt-app/actions/runs/46132104506), [Markedsbok](https://github.com/Almenning/Flyt-app/actions/runs/46132104445) | Ikke grønne. Artifakter fra mislykkede kjøringer er feilsøkingsgrunnlag, ikke bevis på bestått kontroll. |
| [Publiseringskontroll](https://github.com/Almenning/Flyt-app/actions/runs/46132104579/job/140939313405) | Blokkert: Grovanovas rene kandidat når ikke 4:3-kravet på minst 1366 × 1024. Kinnaklova har pikselendringer utenfor tillatt maske. Separat kunstgodkjenning, bredt kommitkoblet enhetsgrunnlag, kritiske regresjoner og faktisk barnetest gjenstår. |

## Visuell stikkprøve før neste vurdering

Faktiske demoopptak fra syntetisk profil ble åpnet i arkivene 15258138172
(WebKit 390 × 844) og 15257677638 (WebKit 1440 × 900). Begge viser oppstart,
Hjem, Reisen, fire fag, representative aktiviteter, Samleboken og
Foreldreoversikt. Hjem fyller vinduet. I bildet `13b-reisefremgang.jpg`
er det derimot en lys flate under illustrasjonen i avslutningen av
matteoppdraget, mest synlig på desktop. Avklar om den skyldes layout eller
fotograferingsøyeblikk før akkurat den skjermen brukes i en ny visuell
vurdering. Foreldreoversikten kan scrolle; dette er ikke en dispensasjon
for spillene. Ingen ny beslutning trengs for Hjem på iPhone.

## Barnetest som fortsatt mangler

Bruk en separat forhåndsvisning og en oppdiktet profil på 2. trinn. La barnet
velge troll, finne et fag, fullføre én aktivitet, gå tilbake og finne en
oppdagelse eller Samleboken. Observer hvor barnet stopper, trenger hjelp
eller prøver videre selv. Noter bare oppgaven, hva som skjedde og eventuell
hindring; ikke lagre navn, opptak eller andre personopplysninger. Dette er
en testbeskrivelse, ikke en rapport om en gjennomført barnetest.
