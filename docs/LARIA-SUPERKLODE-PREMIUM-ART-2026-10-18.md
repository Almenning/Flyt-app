# Læria SuperKlode – premium art-pass

Dato: 18. oktober 2026  
Gren: `feat/laria-superglobe-premium-art-20261018`  
Draft-PR: #184  
Base: SuperKlode v3 / PR #179

## Formål

Gjøre Oppdag til en geografisk korrekt, malt oppdagelsesverden i stedet for en flat kartflate med pålagte naturikoner. Enkel-globusen skal være urørt.

## Implementert

1. Oppdag bruker nå den georefererte terrengmodellen som primært uttrykk.
2. Brede separate biomestrøk er tatt ut av tegneløkken.
3. Store landbaserte fjell-, skog- og landmarkstempler er tatt ut av tegneløkken.
4. Terrengdekningen og biomeblandingen er økt, slik at natursonene bærer landflatene i stedet for kontinentfarge alene.
5. Bakgrunnen dempes bare når `data-discovery-globe="painted-atlas-v1"` er aktiv. Kloden får en roligere atmosfærisk ramme og sterkere dybdeskygge.
6. Statisk regresjonstest sperrer retur til de fjernede dekorstemplene.

## Låst retning – kontinenter først

Oppdag er nå bevisst avgrenset til en levende kontinentopplevelse i første
versjon. Enkel beholder den eksisterende presise land- og detaljzoomen.

1. Oppdag stopper på `1.72` i zoom, også ved kniping, musehjul, knapper,
   søk og programmatisk landfokus.
2. Oppdag åpner ved Europa (`13° øst, 53° nord`) i stedet for den generiske
   Tsjad-demonstrasjonen fra det gamle premiumskallet. Dette endrer ikke
   lagret fremgang; det gjelder kun startkomposisjonen i Oppdag.
3. Før valg av land vises et kort «Europa venter» med den faktisk valgte
   reven og en handling som vender kloden mot Europa.
4. De første detaljerte oppdagelsesområdene er Europa/Norge, Amazonas,
   Sahara, Japan og Arktis. Ingen av dem erstatter landpolygoner eller
   geografisk trefftesting.
5. Europa/Norge har nå de første særpregede, georefererte terrengkorridorene:
   norske fjordskoger, alpine daler og middelhavsåser. Scandes og Alpene får
   en sparsom fjellrygg også på oversiktsnivå. Dette er bevisst avgrenset til
   første kontinent, ikke en generell retur til dekorative fjellstempler.
6. Det gamle, generiske revebildet skjules i Oppdag. Invitasjonskortet bruker
   i stedet barnets faktisk valgte rev.
7. Etter at barnet velger et land i Oppdag, blir den samme valgte reven lagt
   inn som en liten, stedstilpasset reaksjon i landkortet. Norge og de første
   Europa-landene får egen tekst; resten får en kort nysgjerrig invitasjon.

## Verifisert

- `node --check laer-litt-mer/discovery-globe-phase1.js` bestått.
- `node tests/laria-discovery-globe-phase1-static.js` bestått.
- `npm run test:node` bestått: 384 tester, 0 feil.
- Enkel, kartgeometri, koordinater, landvalg, zoom, brukerdata og øvrige fag er ikke endret av denne grenen.
- Kontinentgrensen er testet som en isolert Oppdag-regel; Enkel beholder
  `GLOBE_ZOOM_MAX=5`.

## Åpen kvalitetsport

Faktisk WebKit/Chromium-opptak må inspiseres på iPad liggende/stående og iPhone 390 × 844 før merge. Lokalt testmiljø mangler installert Playwright WebKit; installasjonen kunne ikke gjennomføres på grunn av miljøets systemrettigheter og nedlastingsbegrensning. Dette er ikke en godkjenning av visuelt resultat.

18. oktober: den relevante Playwright-røykprøven ble forsøkt på nytt, men
stopper før teststart fordi `chromium_headless_shell` ikke finnes i miljøets
Playwright-cache. Dette er en miljøblokkering, ikke et grønt nettleserresultat.

## Neste vurdering

Når reelle skjermbilder foreligger, vurderes:
- om terrenget er for svakt eller for tett på verden-, region- og nærzoom
- om kortet og valgt land får tydelig nok sammenheng
- om den personlige reven kan få en diskret, faktisk funksjon i oppdagelsesøyeblikket
- særskilt Norge, Alpene, Sahara, Amazonas og Japan.

## Korrigerende QA – 18. oktober 2026

### Dokumenterte funn på `04a5185`

- GitHub-kjøring `39113056109` feilet med 21 Node-feil og appen startet
  ikke i nettleser. Markedsbok- og samlebokjobbene feilet også før opptak;
  ingen av disse tre kjøringene hadde nedlastbare artefakter.
- Rotårsaken var ikke manglende browser: commit `c7f32a5` hadde erstattet
  den komplette `index.html` med avkortet verktøyutskrift. Filen begynte
  med `Warning: truncated output` og mistet rundt 5800 linjer appkode.
- Globusens eksisterende nettlesertest forventet dessuten gammel
  nærzoom, separate biomevasker og renderermerket `landscapes-v2`.
  Disse forventningene var ikke oppdatert til den godkjente retningen.

### Isolerte rettelser

1. Gjenopprettet hele HTML-filen fra PR-basen `0c7071a`. Bare Oppdags
   avgrensede zoomtak er lagt tilbake i den delte inndatafunksjonen;
   Enkel bruker fortsatt nøyaktig originalgrensen på 5.
2. Lagt til kontraktsjekk mot avkortet verktøyutskrift i appkilde.
3. Oppdag identifiserer nå Tsjad fra kanoniske landdata, ikke en antatt
   tekst-ID. Europa-starten virker i faktisk WebKit.
4. Kamera og landkort fra Enkel lagres midlertidig og gjenopprettes ved
   retur fra Oppdag, inkludert opprinnelig nærzoom. Ingen lagret faglig
   fremgang eller kartdata endres.
5. Faktisk iPhone-bilde av Norge viste at invitasjonens to-kolonnestil
   hang igjen i landkortet og dekket kloden. Stilen fjernes ved landvalg.
   Gjentatt valg av samme land får nøyaktig én reaksjon fra valgt rev.
6. Det høyere landkortet kunne dekke bunnen av Enkel/Oppdag-bryteren på
   stående iPhone. Oppdag plasserer nå bryteren over kortets målte kant.
   Regelen gjelder ikke Enkel.
7. Globus-QA-workflowen inkluderer nå også PR-ens faktiske målgren og
   sjekker eksplisitt ut kandidatens head-SHA, som også navngir artefakten.

### Verifikasjon og avgrensning

- Fullt Node-testlag etter HTML-reparasjon: **384/384 bestått**.
- Statisk isolasjonstest og JavaScript-syntaks: bestått.
- Reelle lokale Playwright/WebKit-opptak er produsert og inspisert for
  iPhone stående/liggende og iPad liggende. De viser geografisk forankret
  terreng, Europa-inngang og fungerende landkort. Dette er emulerte
  viewportstørrelser, ikke tester på fysiske enheter.
- Endelig viewportmatrise og etterkontroll av bryterplassering kjøres
  videre før full nettleserstatus kan erklæres grønn.
- Lokal Chromium-installasjon feilet med tom/ugyldig ZIP fra den festede
  browserens nedlastingsvert. WebKit ble installert via Playwrights
  offisielle alternative vert. Chromium-resultat er ikke påstått.
- Ingen endring av Enkel-rendereren, geometri, trefftesting, faginnhold,
  progresjon eller brukerens valgte rev. Ingen merge/main-publisering.

Neste steg: fullfør viewportmatrisen, inspiser stående iPad og hent ny
CI-status/artefakter fra den reparerte draft-grenen. Den eldre grønne
Node-statusen alene er ikke visuell premiumgodkjenning.

### Globalt terreng- og mobilpass – 18. oktober 2026

- Oppdag-terrenget er nå roligere og mer sammenhengende: de synlige
  regnskogsklyngene er erstattet med små, overlappende baldakinflekker, og
  fjellkjeder bruker lys- og skyggekonstrurer langs den reelle fjellryggen
  fremfor en rad med trekantede fjellsymboler.
- Tilføyelsen gjelder den globale, geografisk forankrede terrengmotoren:
  skog, regnskog, ørken, savanne, is, elver og fjellkjeder følger fortsatt
  koordinatene og klippes av eksisterende landgeometri.
- Smal iPhone (320 x 568) er lagt inn som fast WebKit-mål. Den avdekket at
  Enkel/Oppdag-bryteren kunne stjele globusens drasone. Bryteren ligger nå
  kompakt over globusranden på akkurat denne størrelsen; den dekker verken
  den eksisterende modusbryteren eller senteret av globusen.
- Full Node-suite: **384/384 bestått**. Statisk dobbelt-globus-kontrakt og
  reell WebKit-matrise bestått for 320 x 568, 390 x 844, 844 x 390,
  1180 x 820 og 820 x 1180. Hver test kontrollerer Enkel/Oppdag-isolasjon,
  landtreff, rotasjon, kontinentzoom, valgt rev og terrengytelse.
- Høyeste observerte terrengpass i denne matrisen var 442 ms på stående
  iPad. Det er innenfor den nåværende testgrensen, men skal følges videre
  når nye områdespesifikke detaljer legges til.

### Kontinentstyrt oppdagelsesreise – 18. oktober

- Head `60498f9` besto **Laria Dual Globes Release QA** i GitHub Actions, inkludert reelle WebKit- og Chromium-skjermbilder fra seks viewportprofiler. Artefakt `laria-discovery-globe-phase1-60498f9` er lagret.
- Visuell gjennomgang av de faktiske WebKit-bildene viser fungerende layout og kart på iPad liggende/stående og iPhone, men terrenget fremstår ennå for flatt og svakt mot den detaljrike illustrerte bakgrunnen. Dette er en **åpen premiumvurdering**, ikke lanseringsgodkjenning.
- Oppdag hadde en konkret pedagogisk feil: kortet viste alltid «Europa venter», også når kloden var vendt mot andre verdensdeler. Dette er nå rettet med seks georefererte, kameraavhengige invitasjoner (Europa, Afrika, Asia, Nord-Amerika, Sør-Amerika og Oseania).
- Den aktive invitasjonen følger ferdig rotasjon, kniping/musehjul og tilbakestilling; knappen «Se [verdensdel]» vender kloden mot valgt område på kontinentnivå. Landvalg, original globe og kartmotor endres ikke.
- Ny Playwright/WebKit-regresjonstest kontrollerer navn, posisjon og zoomgrense for alle seks verdensdeler og lagrer ekstra iPad/iPhone-opptak for visuell sammenlikning.
- **Neste port:** Vent på grønn CI og gjennomgå faktiske oppdaterte iPad/iPhone-bilder; særlig at de lengste navnene ikke overdekker kloden. Forbedre deretter terrengmaterialet i egen isolert endring hvis referansekvaliteten fortsatt ikke nås. Ingen merge eller publisering før premiumkontroll.
