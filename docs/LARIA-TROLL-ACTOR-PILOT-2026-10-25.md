# Læria – levende skogstroll: Storesøster-pilot

Status: implementert som pilot i den eksisterende Gangemagi-grenen. Ikke merget og ikke publisert.

## Avgrensning og kildemateriale

- Arbeidet bygger videre på Gangemagi Premium (`feat/laria-gangemagi-premium-tallenga-20261023`, dokumentert som PR #208 i eksisterende arbeidslogg).
- De tre godkjente kildefilene finnes lokalt i `laer-litt-mer/assets/gangemagi-troll/`.
- `storesoster.webp` er 512×1024 WebP med transparent bakgrunn. Det finnes ingen separate lag, Rive-fil, spriteark eller redigerbar original i repository.
- Piloten bruker **utelukkende** `storesoster.webp`. Den lager ikke ny figur, ansikt, klær eller kunstig variant.

## Teknisk valg

Rive ble vurdert, men er ikke brukt i denne runden. Uten en godkjent, lagdelt kildefil ville en ny Rive-rigg krevd gjenopptegning eller nygenerert karakterkunst og dermed ikke oppfylt kravet om bevart identitet.

`TrollActor` er derfor en liten, lokal WebKit-vennlig flerpartsrigg:

- den beholder én original WebP som statisk reserve i DOM-en,
- den gjenskaper bare bevegelige utsnitt som CSS-bakgrunner fra den samme WebP-filen,
- den animerer bare `transform` og `opacity`,
- den har ingen nettverkskall, canvas-loop eller ny bildegenerering,
- den slår av bevegelse og viser originalbildet når `prefers-reduced-motion` er aktiv.

Dette er en kontrollert mellomløsning. For en framtidig arm som faktisk løftes fritt uten kompromiss, trengs en godkjent lagdelt original/riggkilde fra illustratør. Det skal ikke løses ved å generere et nytt troll.

## Implementert i Gangemagi

Ny komponent:

- `laer-litt-mer/troll-actor-v1.js`
- `laer-litt-mer/troll-actor-v1.css`

Storesøster er den eneste karakteren som bruker riggen. Lillesøster og lillebror beholdes som de samme låste, statiske WebP-filene til piloten er visuelt godkjent.

| Spillhendelse | Storesøsters tilstand |
| --- | --- |
| Åpner Gangemagi | `wave`, deretter `idle` |
| Barnet arbeider | `idle` (pusting, blunk og små hode-/hårbevegelser) |
| Hint | `think`, deretter `hint` |
| Gyldig jordbærplassering | kort `celebrate` |
| Fullført oppdrag | tydelig `celebrate` |
| Forsøk på full kurv / velg troll først | `support` |

Reaksjonene er knyttet til Gangemagis eksisterende hendelser. Matematikkmotoren, oppgavegenerering, kurvlogikk, troll-til-kurv-flyten og lagret fremgang er ikke endret. Figuren ligger inne i eksisterende trollknapp og har `pointer-events:none`; de faktiske berøringsflatene er uendret.

## Kontroll gjennomført

- `node --check` for ny komponent og Gangemagi: bestått.
- Målrettet TrollActor-, Gangemagi-motor- og cachetest: 15/15 bestått.
- `npm run test:node`: 405/405 bestått.
- Cache-versjoner for alle berørte Gangemagi-ressurser og service-worker-cache er oppdatert.
- Statisk kontraktstest verifiserer seks tilstander, original reservefil, ingen ekstern/generert karakterbane, redusert bevegelse og korrekt lastrekkefølge.

## Oppdatering 25. oktober: rigg og nettleserbevis

- Eksisterende PR #208: først `crop-v1`, deretter `source-bones-v2` (commit `31bd0a3`). Hode, hår, armer og øyelokk følger nå en felles overkroppsrigg, mens føtter/støvler ligger fast.
- Den dedikerte Gangemagi-testen ble **grønn i både Chromium og WebKit** på v2. iOS-bygg, Brøklab WebKit, reisenavigasjon og innholdskontroll besto også.
- Kvalitetsgjennomgang av de faktiske videoene fant at øyelokkselementene hadde permanent `opacity:0`: en animasjon på foreldreelementet ga dermed aldri synlige blunk. Rettet ved å animere hvert øyelokk og dokumentere faktisk open/closed computed opacity på browsernivå (kommende test av siste HEAD).
- Videotesten eksporterer nå også korte, game-only MP4-opptak. Tidligere lange WebM-opptak inkluderte mye oppstart av Hjem før selve Gangemagi.
- **Viktig:** En tidligere KI-generert sammenligningsillustrasjon er ikke fotobevis på appens utseende. Benytt kun original WebP + Chromium/WebKit-skjermbilder og videoartefakter fra eksakt HEAD ved visuell godkjenning.

## Bildeidentitet og kvalitetsbevis – 25. oktober

Kvalitetsporten utvides med en automatisk sammenligning av **det faktiske pikselrenderet av storesøster i hvilestilling** og den **eksakt godkjente originale WebP-filen** med lik størrelse, uten animasjoner. Rapporten måler synlige RGB-avvik bare innenfor figurens opprinnelige bildepiksler. Ved mer enn 5 % vesentlig forskjellig figurareal feiler testen; dette hindrer utilsiktet figurbytte, synlige hull eller overmaling i den stillegående hvilestillingen. Både de to originale browser-skjermbildene og en JSON-rapport følger testartefaktene. En lav avviksprosent er **ikke** bevis på gode bevegelsesledd i raske posisjoner.

GitHub Actions installerer FFmpeg for å levere **korte, ekte MP4-spillopptak**, i tillegg til original WebM; MP4 er obligatorisk i kvalitetsløpet. Animasjonsvideo tas fra WebKit på iPhone stående/liggende og iPad stående/liggende, samt Chromium på mobil. Dette er emulerte viewports i nettlesermotorene, ikke bevis på fysisk iPhone/iPad Safari.

Det tidligere avsnittet om at ingen nettlesere kunne startes beskrev bare den opprinnelige pilotens lokale miljø. GitHub Actions har siden klart full Chromium og WebKit QA, men siste kommitt må alltid testes separat.

## Ikke godkjent ennå

Denne arbeidsrunden kunne ikke starte Chromium eller WebKit. Playwright-pakkene finnes, men nettleserbinariene mangler i arbeidsmiljøet. Det er derfor **ikke** tatt ekte iPhone-/iPad-skjermbilder eller videoopptak her, og piloten er ikke visuelt godkjent.

Før neste fase skal følgende skje på faktisk iPhone/iPad Safari/WebKit (stående og liggende), samt Chromium:

1. Se alle seks tilstander og kontrollere at utsnittsovergangene fremstår naturlige ved reell størrelse.
2. Kontrollere at hilsen, hint, plassering, støtte og fullføring utløses i den live spillflyten.
3. Kontrollere berøringsflater, ytelse, minne og redusert bevegelse.
4. Ta skjermbilder og korte opptak av bevegelse.
5. Få visuell godkjenning før lillesøster, lillebror eller øvrige skjermer berøres.
