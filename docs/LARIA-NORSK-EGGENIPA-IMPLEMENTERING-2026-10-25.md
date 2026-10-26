# Norsk med Eggenipa – implementering og publiseringsport

Dato: 25.10.2026. Styrende beslutning: [issue #225](https://github.com/Almenning/Flyt-app/issues/225).

## Beslutning og eksakt original

Brukerens siste, godkjente Eggenipa-landskap er eneste visuelle fasit. Den opplastede originalen i samtalen «Norsk - ny» er fortryllet_leselandsby_ved_fjorden.png, størrelse 1672 × 941, RGB, SHA-256:

37cbb6b2baf62c16f974ee59a63b8c9f6e80a30f6add2801a8bec363a321fff3

**ORIGINALFIL LEVERT OG VERIFISERT:** Eksakt godkjent PNG-original ligger nå i
`laer-litt-mer/assets/norsk/eggenipa-master-laast-20261025.png`,
Git-blob `538a6cf71f426f511ed85864d9647bb6cb650657`, kildecommit `b8140ea1538aee0311f963321be6cda7754640ee`.
Lokalt sjekket SHA-256 og dimensjoner 1672 × 941 stemmer med låst fasit; CI-kontrollen er bestått.
Ingen regenerering, retusjering eller endret fjellform er tillatt. Behold originalen uendret også ved senere optimaliserte avledede nettbilder.

CI kjører binær SHA-256-/dimensjonskontroll, og `LARIA_EGGENIPA_RELEASE_GATE=1` krever fysisk original.
**Originalkontroll er nødvendig, men ikke tilstrekkelig for publisering:** hele regresjonspakken,
fysisk Safari-test og brukers uttrykkelige godkjenning av faktisk implementert UI gjenstår.

## Gjennomført i denne PR-en

1. eggenipa.js og eggenipa.css: ny illustrasjonsdrevet Norsk-forside. Originalfilen rendres uendret som image. Berøringssoner og aktivitetsportaler ligger over / utenfor illustrasjonen som egne HTML-elementer med fokusmarkering. Ingen endring av oppgaveinnhold, læringsmotor eller lagret progresjon.
2. **Finn ordene** åpnes via eksisterende openFindTheWords.
3. **Ordjakt** åpnes via eksisterende openWordHunt.
4. **Bokskogen** åpner det uendrede kartet for valgt klassetrinn. En tydelig «Til Eggenipa»-knapp returnerer til fagforsiden.
5. «Neste eventyr» bruker eksisterende journeyRecommendedNode, startJourneyNode, startJourneyChallenge. Frivillig.
6. Klassetrinnsvalg oppdaterer journey.viewGrades.norwegian, **ikke** elevens registrerte klassetrinn. Kapittel-2-preview er fortsatt internt styrt.
7. Tilbake fra Finn ordene/Ordjakt på Norsk-forsiden går til Norsk; direkte bruk fra Hjem/Utforsk beholder opprinnelig retur.
8. Service worker/cacheversjoner er oppdatert for en fremtidig lansering, ikke publisert ennå.

## Utenfor dette scopet

- Avansert 2D-rigg/TrollActor. Det tilhører separat art- og riggingarbeid og blokkerer ikke dette direktespill-oppsettet.
- Endringer i Tallvika, Engelsk, Kloden, eksisterende oppdragsdata og kapitlene.
- Flytting/fjerning av det opprinnelige Bokskogen-kartet.
- Frislipp av Fortellingsdalen eller betalte innholdssteg.

## Test- og visuell akseptanse

- node --test tests/laria-eggenipa-contract.test.cjs.
- LARIA_EGGENIPA_RELEASE_GATE=1 node --test tests/laria-eggenipa-contract.test.cjs (hard gate).
- node tests/laria-eggenipa.playwright.js under HTTP server fra repo-roten.
- Chromium/WebKit, iPhone 390 × 844 og 844 × 390, iPad 834 × 1112 og 1194 × 834.
- Skjermbilder fra **eksakt PR-commit** lastes opp som CI-artifact; må gjennomgås mot godkjent original og virkelige trykkflater.
- Bekreft responsive bildeutsnitt, utløst aktivitet og retur, gammelt kart + tilbake, klassetrinn uendret, journey.nodes uendret og fravær av runtimefeil.
- Kontroller også norsk→matte→norsk, de andre fagene, samt fullføringsretur.
- Playwright-WebKit er WebKit-nettlesermotor, **ikke** fysisk Safari på iPad/iPhone. Enhetstest må gjennomføres separat før publisering.

## Publiseringsport

1. Eksakt originalasset sjekket inn og integritetstesten grønn.
2. Browser-QA og regresjonstester på **nyeste HEAD** er grønne.
3. Visuell før/etter-vurdering av iPhone/iPad-bilder godkjent av bruker.
4. Draft-PR markeres klar og flettes kontrollert til main. GitHub Pages-bygg må være verifisert.
5. Verifiser live Norsk på produksjons-URL: bilde, alle tre aktiviteter, navigasjon og lagret progresjon. Oppdatert cache og hard refresh på enheter.
6. **Først etter verifisert produksjon** rapporteres publisert. Den timebaserte utviklingsautomatiseringen skal deretter deaktiveres.

## Arbeidslogg

- 25.10: Baseline main SHA 32ea548fe61f8d8130b5107f10e413120293b554. Tallvika PR #223 og trollpilot #224 er åpne draft-PR-er.
- 25.10: Egen Norsk-gren, ny responsiv direktespill-forside, ordaktiviteter, opprinnelig Bokskogen-kart og klassetrinnkobling.
- 25.10: Startet isolerte kontrakt- og WebKit/Chromium-tester. CI-release-gate vil være blokkert frem til godkjent PNG er sjekket inn.

- 26.10: PR #226 commit `7dd66bd6edac692d2b074d1acf1f573ad50b20f7`: rettet overlapp mellom native Bokskogen-tilbake og Eggenipa-retur, skilt fullføringsdestinasjon (Bokskogen ved aktivt kart, Eggenipa etter omstart), og migrert gamle end-to-end-tester til å faktisk besøke Eggenipa-portalen før det gamle kartet. Egen Eggenipa-CI + fire verdener + iOS-bygg bestått på denne commit; hovedregresjon pågår.
- 26.10: Visuell gjennomgang av 16 faktiske Chromium/WebKit-skjermbilder fra fire viewporter (inkludert uendret original-Bokskogen-kart). Eggenipa-forsiden samsvarer på tvers av motorene. Det gamle Bokskogen-kartet har fortsatt eget portrettorientert lerret i iPhone liggende; dette regnes som separat visuell begrensning og krever manuell vurdering før lansering.

### Kontinuerlig CI-oppfolging: 26.10, WebKit landskap

- Ved gjennomgang av [Actions 40248704670](https://github.com/Almenning/Flyt-app/actions/runs/40248704670) pa head `afb0460db0215972446fc8aa563d357836e25dcc` var **8 av 10 workflows gronne**, mens `Laria QA` feilet. I denne workflowen feilet to jobber: `laria-qa` og `laria-mapboard`. `locked-original-artwork-release` var skippet fordi QA feilet, ikke bestatt.
- Ekte produktavvik: WebKit iPhone liggende (844x390) begynte Bokskogen med `#subject-screen` pa `top=-556px` etter et trykk pa Eggenipas portal nedenfor folden. `eggenipa.js` nullstiller na viewport-scroll etter kartovergang, med en frame-etterkontroll. Kodecommit [`8bd3208`](https://github.com/Almenning/Flyt-app/commit/8bd3208ce3985a642bd6e49f1629330a25689dbc). Ingen endring av selve kartet, original-PNG eller progresjonsdata.
- WebKit-race: Tallvika-hjemknappen var synlig ved Playwright `waitFor(visible)`, men `boundingBox()` returnerte `null` etter en dynamisk headerrendering. `laria-navigation-v13` leser na dimensjonene i **ett levende DOM-oppkall** med beholdte krav om minimum 44x44 og helt innenfor viewport, deretter faktisk Playwright-klikk. Testcommit [`705b0d8`](https://github.com/Almenning/Flyt-app/commit/705b0d801abd7ae4ce06bd6b4be94cf869e39019). Eventuell fremtidig klikkbarhetsfeil skal fortsatt feile testen.
- Eggenipa-testmatrisen bruker na mobilmodus pa iPhone ogsa i liggende stilling, og kontrollerer at det opprinnelige Bokskogen-kartet starter ved toppen av skjermen. Testcommit [`1aedb29`](https://github.com/Almenning/Flyt-app/commit/1aedb2951b949121269fba7feec0a1eab7daa077).
- Bildet er krysskontrollert mot originalen i prosjektet: RGB PNG 1672x941, SHA-256 `37cbb6b2baf62c16f974ee59a63b8c9f6e80a30f6add2801a8bec363a321fff3`.
- Nyeste full CI er **ikke ferdig** ved dokumentasjonstidspunktet. **Ingen merge eller publisering**, og fysisk Safari / eksplisitt UI-godkjenning star fortsatt igjen.
