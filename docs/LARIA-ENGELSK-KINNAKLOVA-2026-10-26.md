# Læria Engelsk: Kinnaklova, første ombygging (26.10.2026)

## Beslutning
Ny Engelsk-fagforside bygges som en direkte aktivitetshub i samme produktretning som Tallvika (Matte) og Eggenipa (Norsk). Reisekartet Ordlandsbyen beholdes i koden og lagret historikk, men fjernes fra barnets ordinære Engelsk-inngang. Den private Setningshavna-prototypen for kapittel 2 beholdes urørt, ikke publisert.

## Implementert i denne PR-en
- Egen `kinnaklova.js` og `kinnaklova.css`, isolert til `#subject-screen[data-subject="english"]`.
- Ny, **foreløpig** illustrert landskapskomposisjon inspirert av Kinnaklova i vedlagte referanse (kløvd fjellprofil, kyst, fyr, små hus og sjø).
- Tre direkte porter: Words (`english/words`), Sentences (`english/sentences`), Reading (`english/reading`). Bruker uendret `startLearningSession` og eksisterende spørsmål.
- Pågående Engelsk-økt kan gjenopptas via eksisterende `loadActiveSession`/læringsport. Ingen nye progresjons- eller profildata.
- Normal returrute til Hjem og Basecamp. Den gamle oppdragshistorikken slettes ikke.
- Eggenipa/Matte/Geografi og levende trollarbeid berøres ikke.

## Visuell status og port før publisering
**Ikke en godkjent premium-master.** Kinnaklova er i denne første versjonen en stilisert CSS-illustrasjon, ikke en høyoppløselig håndmalt scene. Brukerens inspirasjonsbilde er ikke egnet som direkte ren bakgrunn fordi det inneholder andre stedsnavn, revefigur og UI. Neste kunstleveranse må være en dedikert godkjent Kinnaklova-master uten innbakt UI, gjerne med interaktive steder integrert i samme malte motiv. Bruk ikke nytt syntetisk troll eller flat PNG-utklipp.

## QA / bevaringskrav
- `node --test tests/laria-kinnaklova-contract.test.cjs`
- Faktiske iPhone- og iPad-skjermbilder i Chromium og WebKit, stående og liggende, inklusive hovedportene.
- Verifiser Words/Sentences/Reading åpner en reell femoppgaversøkt, fullføring/tilbakeføring og progresjon.
- Verifiser lagret Engelsk-økt gjenopptas, og at `journey.nodes` for Engelsk/Norsk/Matte ikke endres bare ved å besøke huben.
- Kontroller retur fra Basecamp og iOS kantsveip.
- Produkeiergodkjenning og grønn CI før merge/publisering. Ingen automatisk merge.

## VISUELL DELGODKJENNING, LÅST 26.10.2026

**Ordrett beskjed fra produkteier:** «Trollene er feil, men lås resten.»

Dette er en **bindende designlås for illustrasjonskomposisjonen**, ikke godkjenning av de tre tegnede trollene, ikke godkjenning av første CSS-kodeprototype og ikke publiseringsgodkjenning.

**Eksakt referanse:** `laria_kinnaklova_visual_reference_locked_except_trolls_20261026.png` (1672 × 941, SHA-256 `3b1d6b6e6c9908dd31c519593504ac22dd2c7473ef05fa51ecd57885cdc6e035`, genererings-ID `f4130f98-830e-4e25-aecc-0f73a8971e13`). Dette er den SISTE illustrasjonen i Engelsk-tråden med Kinn kirke og tre feilaktige genererte troll. Binær referanse er levert i samtalen, **ikke ennå importert som repo-asset**; en konkret arkivkopi og hash er derfor angitt, slik at den ikke forveksles med eldre illustrasjoner.

### Låst og skal ikke redesignes
- Troverdig Kinnaklova-form: bratte fjell til venstre, de karakteristiske tvillingtoppene, blått hav, skjær, himmel, lys og illustrativ 2.5D premiumstil.
- Kinn kyrkje, kirkegård/gravstøtter, steinmurer, klokketårn og det lille røde huset, med plassering og sceneopplevelse.
- Topplinje «Engelsk › Utforsk», Læria-logo, treskiltet «Oppdag Kinnaklova» og undertittel.
- Tre skilt/aktiviteter **Words**, **Sentences** og **Reading**, med grønn pil, plassering og prikkete sti mellom dem.
- Helhetlig perspektiv, farger, vegetasjon, blomster, scenekomposisjon og format.

### Eneste avviste del: trollene
- Alle tre figurer i bildet er FEIL og ikke identitetsgodkjent. Verken deres ansikt, hår, klær eller proporsjoner er fasit.
- De skal erstattes av **de tre eksakt tidligere godkjente trollene** (storesøster, lillesøster, lillebror). Originalfilene i `assets/gangemagi-troll/` er kilder; ingen nye fantasitroll skal genereres.
- Fremgangsmåten må ta høyde for at feilaktige figurer er **innbakt i komposisjons-PNG-en**. Lag et kontrollert bakgrunns-/karakterarbeid med lokale retusjer kun der trollene står, og ikke la retusjeringen endre godkjent fjell, bygninger, skilt eller øvrig landskap. Ingen rev skal vises.
- Endelig identitetsbevaring, naturlig integrasjon og eventuelle levende reaksjoner testes separat med faktisk WebKit på iPad/iPhone før godkjenning.

**Viktig avvik i gjeldende kode:** Den første CSS-prototypen i denne PR-en er ikke den nå godkjente illustrasjonskomposisjonen. Den skal ikke brukes som visuell fasit eller publiseres. Ny implementasjon skal reprodusere den låste illustrasjonen og bare erstatte feilaktige troll.

Maskinlesbar designlås: `docs/LARIA-KINNAKLOVA-VISUAL-LOCK-2026-10-26.json`.

## FASE 2, faktisk implementasjon 26.10.2026

Dette overstyrer den HISTORISKE beskrivelsen av den første CSS-prototypen ovenfor. Implementeringen i draft-PR #229 er nå art-first og bygger ikke lenger en alternativ kystscene av CSS-elementer.

### Gjennomført
1. `kinnaklova.js` og `kinnaklova.css` viser én enkeltstående låst bakgrunn (format **1672 × 941**) gjennom `ki-master`, ikke en annen variant av Kinnaklova. Dobbeltinnhold (nye bannere og skilt laget av HTML) er fjernet; den malte scenen selv er fasit.
2. Gjennomsiktige, tilgjengelige trykkflater er lagt over de tre nøyaktige skiltene i referansen: `Words`, `Sentences`, `Reading`, samt tilbakeknappen. På iPhone vises i stedet store kort under ukroppet illustrasjon.
3. Alle tre tidligere godkjente originalkilder er knyttet til separate karakterlag: `storesoster.webp`, `lillebror.webp` og `lillesoster.webp`. Ingen nye troll, rev eller CSS-bobbing. Disse lagene skjules automatisk når ren bakgrunnsillustrasjon ikke er godkjent/tilgjengelig. Dette er en implementert struktur, **ikke godkjent endelig karakterintegrasjon**.
4. De tre engelske kortene er koblet til eksisterende læringsmotor (engelsk ordforråd, setninger og lesing), lagret økt kan gjenopptas, og retur til Hjem (og iOS-back) følger samme navigasjon som i Matte/Norsk.
5. Engelsk-seksjonen har nå eget Playwright-oppsett for Chromium og WebKit med iPhone og iPad stående/liggende, samt eksplisitt bevaringstest for læringsdata og originalbildenes Git-SHA.
6. Integrert fire-fag-test oppdatert til å respektere at Engelsk nå åpner **Kinnaklova** direkte. Det gamle Ordlandsbyen-kartet skal ikke være et krav i barnets Engelsk-start.
7. CI-feilen i første Kinnaklova-test fra `git diff --check HEAD^ HEAD` er adressert med `fetch-depth: 2`.
8. Et deterministisk importverktøy og en pixel-preservation-test er etablert: `tools/kinnaklova/import_clean_art.py` og `tools/kinnaklova/verify_locked_scene.py`.

### Ekstern kunstleveranse som fortsatt blokkerer full visuell implementasjon
Det låste 1672×941-PNG-bildet finnes som fil i Læria-samtalen, men er **ikke** importert inn i GitHub-repositoriet. Bildet har tre forkastede troll innbakt i selve pikslene. Derfor ville det være direkte feil å publisere dette bildet som bakgrunn og lime originale troll oppå.

Mangler konkret:
- Ren, tappløs bakgrunn som har de tre forkastede figurene fjernet, og er pikselidentisk utenfor de helt avgrensede endringsfeltene.
- Kontrollert kunstbehandling av områdene bak de forkastede figurene. `verify_locked_scene.py` kontrollerer at malte bygninger, fjell, skilt og resten av scenen ikke røres. **Testen alene kan ikke erklære retusjeringen visuelt godkjent.**
- Import via `python3 tools/kinnaklova/import_clean_art.py --locked-reference <fil> --cleaned-png <fil>`. Verktøyet lager tapsfri WebP og låser SHA-256, men setter alltid `clean_master_visual_approved=false`.
- Bildet må inn som `laer-litt-mer/assets/kinnaklova/kinnaklova-scene-clean-approved-20261026.webp`. Når bakgrunnen er tilgjengelig kan den eksisterende koden vise de godkjente originale trollene, men dette er ikke automatisk garanti for naturlig plassering/animasjon.
- Reell skjermbildegjennomgang av hele scenen med **riktige** karakterer før merge/publisering.

### Kvalitetsport
`LARIA_KINNAKLOVA_RELEASE_GATE=1 node --test tests/laria-kinnaklova-contract.test.cjs` må **feile** så lenge ren bakgrunn eller visuell godkjenning mangler. Denne porten er ment å forhindre at utkastet publiseres bare fordi navigasjon og spørsmål fungerer.

**Konfliktbeskyttelse:** Ingen portering av arbeid fra Matte PR #227, Norsk PR #228 eller trolleanimasjon PR #224 til Engelsk-PR-en uten koordinert merge. Gjenbruk bare de identitetslåste karakterfilene allerede på `main`.

## FASE 3 – 26.10.2026: ekte godkjent Storesøster og strengere bildeport

- Gjenbrukte **den nøyaktig godkjente maleriske Storesøster-filen** fra den åpne in-world-piloten PR #224, uten ny generering eller endret karaktergeometri. Git blob `cff7b5710401f33fa4798d40e8935cb77eb40b44` er nå installert byteidentisk på `laer-litt-mer/assets/kinnaklova/storesoster-inworld-approved-20261026.webp`. Den opprinnelige identitetsfilen `assets/gangemagi-troll/storesoster.webp` er urørt og fremdeles registrert som autoritativ original.
- Storesøsters Kinnaklova-scene bruker `sceneSrc` for denne godkjente, maleriske varianten. Lillesøster og lillebror bruker sine originale låste filer. Dette er **ikke** et krav om å merge trolleanimasjons-PR-en og overfører ingen JS/CSS derfra.
- Skjerpet sikkerhet i `kinnaklova.js`: tidlig kontroll bare av bredde/høyde var utilstrekkelig. Nå må `APPROVED_ART_SHA256` være eksplisitt fylt med en annen SHA-256 enn den avviste originalreferansen, og bildebytene må hashes med `crypto.subtle.digest('SHA-256')`. Uten full match blir verken ren bakgrunn, karakterlag eller malte trykkflater synlige. Det blir dermed ikke mulig å aktivere feil troll bare ved å gi bildet et godkjent filnavn.
- Egen WebKit/Chromium-regresjonstest sender inn en *annen gyldig 1672×941-bildefil* og bekrefter at den stenges ute selv med helt riktige mål. De tre reelle læringsaktivitetene skal fortsatt kunne brukes i draft-modus via kortene under scenen.
- Alle malte hotspots har minimum 44 px berøringsflate på store skjermbredder. Kinnaklova JS/CSS og tjenestearbeideren har fått nye cacheversjoner slik at en fremtidig publisering ikke holder fast på eldre innhold.
- **Fortsatt blokkert av visuell kunst:** ren, godkjent illustrasjon uten de tre forkastede figurene må leveres. Lokal automatisk strukturinpainting er ikke kvalitetsgodkjent; store retusjerte områder ville blitt uklare og ville ikke oppnå premiumstandarden. Den opprinnelige Kinnaklova-komposisjonen forblir eksakt fasit.
- Ingen endringer i spørsmål, læringsprogresjon, map data eller annen fagforside. Ingen merge/publisering uten art-master og grønn eksakt-HEAD QA.

### Integrasjonstest for Egen Engelsk-versjon
GitHub Actions `Læria Kinnaklova – Engelsk WebKit og Chromium` tester åtte virtuelle kombinasjoner (iPhone/iPad, stående/liggende, Chromium/WebKit). Dette er automatiserte nettlesere, ikke fysiske enheter. Integrert fire-fag-test har også vært grønn på tidligere PR-head, men eksakt siste head må kontrolleres separat når hele arbeidspakken er klar.

## 26.10.2026 – Engelsk aktivitetspresisjon i Kinnaklova

**Feil rettet:** De tre merkede inngangene kunne tidligere føre til en adaptiv femoppgaversøkt som supplerte fra andre engelskkategorier selv når valgt modul hadde mer enn fem egne oppgaver. Det gjorde at for eksempel Reading kunne inneholde Words. Kinnaklova bruker nå den eksisterende spørsmålsmotoren med `strictModule=true`; for modulene **Words**, **Sentences** og **Reading** blir utvalget hentet fra kategorien som barnet faktisk trykket på, så lenge minst fem passende spørsmål finnes. Nåværende motor håndterer både friske spørsmål, repeterte spørsmål ved cooldown og lagret læringsprogresjon uendret. Fallback til bredere utvalg er bevart for trinn som faktisk mangler tilstrekkelig innhold (Reading i 1. klasse har nå fått egne minifortellinger), uten kunstig å merke et trinn som ferdig.

**Avgrensning:** Dette er en eksplisitt valgfri parameter i `buildLearningQuestions`/`startLearningSession`, kun aktivert fra Kinnaklova. Matte, Norsk, Geografi, eldre Engelsk-ruter og datamodell har samme standardflyt som før.

**Tester:** Kontraktstest verifiserer at Kinnaklova sender `strictModule=true`; Chromium/WebKit-suiten kontrollerer at alle fem oppgavene i hver valgte økt har riktig faglig `skill`, ikke bare riktig `sessionScope.module`. Den nyeste CI-kjøringen må fortsatt kontrolleres på eksakt PR-head før funksjonen anses grønn. Separat visuell release gate skal fortsatt avvise merge til ren bakgrunn uten forkastede troll og endelig godkjent scenekomposisjon er på plass.

## 26.10.2026 – Minifortellinger for 1. trinn

Tidligere hadde `Reading` ingen egne spørsmål i 1. klasse; den bevarte fallbacken blandet dermed inn andre engelske oppgavetyper. Nå har 1. klasse åtte svært korte mikrotekster med ett tydelig tekstforståelsesspørsmål hver. Eksempler er farge på en ball, et kjæledyr, en båt på sjøen og en enkel handling. Ingen nye progresjonsdata, tvangsgjennomføring eller reisekart. Felles læringsmotor håndterer repetisjon. Egen Chromium/WebKit-kontroll sikrer at alle fem oppgaver i en Reading-økt faktisk har `skill=reading`, inneholder lesetekst og ikke gjentar samme tekst internt. Engelsk for 2. klasse og oppover beholdes uendret.

## 26.10.2026 – Utvidede retusjmasker og test av låst kunst

Maskgjennomgangen viste to konkrete hull: pekehånden ved Words (omtrent x=410, y=648) og en del av foten ved Reading (omtrent x=1597, y=636) var utenfor opprinnelig tillatt retusjområde. Det kunne etterlate biter av feil troll selv når en renset illustrasjon bestod pikselkontrollen. Det er nå lagt til **to smale delmasker**, uten å gjøre hele landskapet redigerbart. Reading-treskiltets beskyttede rektangel begynner nå på den faktiske skiltflaten (y=665), ikke oppe i føttene. Tittel, øvrige skilt, kirke og hele landskapet utenfor de fem lokale maskene skal fortsatt være pikselidentisk.

Ny isolert Python-test (`tools/kinnaklova/test_scene_masks.py`) verifiserer at de utvidede maskene faktisk omfatter de uønskede utstikkerne, at skilttekst/bakgrunn ligger utenfor endringsmasken, og at bildeforskjeller i hver RGB-kanal oppdages. Testene kjøres i egen GitHub Actions-jobb, mens den **separate visuelle publiseringssperren fortsatt skal være rød** til en akseptabel, ren Kinnaklova-master eksisterer og er godkjent. Ingen retusjert illustrasjon er levert eller publisert gjennom denne endringen.

## Kvalitetsreparasjon: Engelsk Reading for 8.–10. trinn (26.10.2026)

En målrettet kontroll av `englishPool` avslørte fire ugyldige Reading-spørsmål på 8.–10. trinn: Fasit («Check evidence before sharing claims», «Sleep can affect concentration», «To present a balanced view», «Cautious») var utelatt fra svaralternativene. Motoren kastet derfor disse spørsmålene ut, slik at den femte Reading-økten ikke kunne fylles med ekte leseforståelse og kunne hente uvedkommende moduler som fallback. Alle fire svarsett er nå korrigert, uten å endre selve lesetekstene. Ny `tests/laria-kinnaklova-content.test.cjs` validerer **alle tre direkteaktiviteter på alle ti klassetrinn**, inkludert minst fem unike oppgaver, fasit i alternativer, tekst til Reading og gyldige ord-/setningsbyggingsdata. Testen kjøres med den eksisterende kontrakttesten i GitHub Actions. Kinnaklova-scenen, originaltrollene og øvrige fag berøres ikke.
