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
