# Læria / Gangemagi – Premium-pass 23.10.2026

## Grunnlag

- Startpunkt: `main` på `4535eaa86deba8357ae5a45762492cd00e078915`.
- Visuell kontrakt: `docs/LARIA-GANGEMAGI-PREMIUM-ILLUSTRASJON-LAST-2026-10-23.md`.
- Den godkjente Tallenga-illustrasjonen er ikke lagt inn som binær fil i repoet. Arbeidet bruker derfor bare eksisterende, originale Tallenga-/Gangemagi-ressurser; ingen ekstern eller generisk illustrasjon er hentet inn.

## Konkrete avvik som ble prioritert

1. Den spillbare scenen brukte den generelle matteverdenen som bakgrunn, ikke den dedikerte Tallenga-markedsscenen.
2. Jordbærkassen hadde riktig interaksjon, men fremsto visuelt som en sekundær handlingsknapp i stedet for en fysisk kilde i markedet.
3. Mellomtilstanden i matematikken var tekstlig korrekt, men viste ikke samtidig de faktiske gruppetallene som ligger bak addisjonen.
4. Marked, kurver, jordbærkasse og rev hadde mindre tydelig felles komposisjon enn referansens brede Tallenga-scene.

## Implementert

- Den originale `gangemagi-tallenga-market-v1.svg` er nå markedsbakgrunnen.
- Kurvene er løftet fram som hovedobjekter med varm gyllen gyldig-/valgt-markering ved trykk og dra.
- Jordbærkassen er beholdt som samme ekte drag-/trykk-kontroll, men er visuelt integrert i markedet og ikke lenger duplisert som en ekstra handling under scenen.
- Mattefeltet viser alltid de reelle kurvtallene mens barnet fyller: for eksempel `3 + 2 + 0 = 5`. Multiplikasjonens svar vises først når like grupper faktisk er fylt.
- Egen responsiv komposisjon er lagt til for telefon: revens tilbakemelding øverst, deretter marked, kurver og fysisk jordbærkasse.

## Bevarte spillregler

Personlig rev, åtte oppdrag, drag/trykk/fjern/angre/hint, fri lek, Markedsbok, Gangetabellen, lagret fremgang og matematikkmotoren er beholdt uendret.

## Kontrollstatus

- Bestått: syntakskontroll, diff-kontroll og 15 Gangemagi-node-/motor-/interaksjonstester.
- Blokkert i dette arbeidsmiljøet: Playwrights Chromium og WebKit var ikke installert. Nedlasting av binærene fra Playwright CDN returnerte ugyldige/tomme arkivdata. Derfor ble det **ikke** produsert eller påstått faktiske før-/etterbilder her.
- Følgelig er visuell acceptance-test på iPad/iPhone og Chromium/WebKit fortsatt en åpen blocker. Dette må gjøres med den vedlagte originale referanse-PNG-en før PR-en kan anses klar for merge.

## Foreløpig kvalitetsvurdering

Retningen er tydeligere og nærmere den låste komposisjonen: handlingen er samlet rundt markedet, og den konkrete matematikken er mer synlig. Den er ikke premiumgodkjent ennå. Spesielt må en menneskelig side-ved-side-kontroll verifisere visuell tetthet, proporsjoner og første-fold på iPad liggende før videre beslutning.


## 23. oktober – visuell Tallenga-oppgradering
- Laget `laer-litt-mer/gangemagi-tallenga-market-premium-20261023.svg` som nytt illustrert miljø basert på eksisterende Tallenga-SVG, med steinbro, markedsbaldakiner, blomster, varmere lys og landskapsdybde. Ingen falske kurver, tall, oppgaveknapper eller rev er bakt inn i bakgrunnen.
- Koblet nytt miljø til den ekte Gangemagi-scenen i `gangemagi-dagens-oppdrag-v1.css`. iPad-oppdragstavlens vertikale padding er redusert for å gi større visuell plass til de interaktive kurvene.
- Ingen endringer i JavaScript, matematikk, personlig rev eller progresjon.
- Fremdeles draft. Chromium/WebKit- og skjermbildekontroll på commit `70b496d` er nødvendig før ny visuell vurdering, merge eller publisering.


### 23.10.2026 – illustrert merke og integrert plukkekasse (release40)
- Ny tekstfri illustrasjon `gangemagi-title-brand-premium.svg`: ekte, håndtegnet tre- og blomstertema med Lærias tilgjengelige Gangemagi-overskrift lagt på som levende DOM.
- Jordbærkassens frittstående, korallrøde CTA er omgjort til en fysisk treplakett på kassen. Samme ekte trykk-/draflate, matte, personlig rev og lagret progresjon.
- Nye tester verifiserer illustrasjonsfilen, levende tekst, minimum skriftstørrelse og ekte fysisk sammenheng mellom plankefronten og den interaktive kassen. Ingen gamle tester fjernet.
- HTML/CSS/JS og serviceworker-versjon er oppdatert til release40. **Ingen merge eller publisering før eksakt-HEAD Chromium/WebKit og manuell visuell aksept.**


### 23.10.2026 – utbedret faktisk skjermbildeavvik, release41
- Kontroll av ekte Chromium-artefakt fra `048cd0d` viste et gammelt «Et lite matteeventyr»-element malt mørkt oppå det nye treskiltet på liggende iPad. Fjernet den foreldede CSS-regelen som overstyrte den tilsiktede skjulingen. Ny Playwright-assert sikrer dette på alle store skjermformater.
- Kort iPhone-landskap hadde mikroskopisk treplakett (10px) og nærmest usynlig jordbærkasse. Økt kun den ekte kildens avbildning og etikett til 176px, 12px tekst og 34px etikett; tatt tilsvarende dekorativ luft fra plassen foran markedet så eksisterende førstekjermskrav ikke svekkes. Tilsvarende Playwright-assert kontrollerer lesbarhet og touch.
- Spillmotor, oppgaver, valgte rev, matematikk og progresjon er uendret. Både eksakt-HEAD Chromium/WebKit og manuell sammenligning gjenstår; PR er fortsatt draft, ikke merge/publiser.


### 23.10.2026 – rotårsak til avbrutte QA-kjøringer og matrisebasert test
- Begge dupliserte Chromium+WebKit-kjøringer på `048cd0d` ble avbrutt rundt den opprinnelige `timeout-minutes: 18` grensen, uten at full WebKit-aksept ble bekreftet. Den første leverte likevel ekte Chromium-skjermbilder som avslørte undertitteloverlapp og for liten iPhone-landskap-kasse, rettet i release41.
- Ny GitHub-workflow kjører **akkurat samme totale testliste** i to samtidige, separate jobber (`chrome` og `webkit`) med uendrede eksisterende assertions, men per-browser Playwright-installasjon og 30 minutters realistisk tidsramme. Hele den gamle testen kan fortsatt kjøres lokalt uten filter. Eksplisitt sluttassert bekrefter at riktig nettleser faktisk ble kjørt, og skjermbildeartefakter får unik browser-suffiks.
- `concurrency` bruker nå faktisk feature-branch på både push og PR, slik at to identiske workflows ikke konkurrerer om ressurser. Dette fjerner duplikatarbeid uten å hoppe over noen test. PR forblir draft, ingen merge/publisering.

### 24.10.2026 – reell WebKit-kontroll på 320 px og fem kurver
- Eksakt PR-HEAD `09f6412`: Chromium/WebKit-workflow 40021850750 = success. Ekte WebKit- og Chromium-skjermbilder ble manuelt inspisert. Laria QA og iOS-build grønne. Continuous smoke ble kansellert og er ikke bestått.
- Manuell inspeksjon av WebKit iPad stående/liggende, iPhone 390×844/320×568 og kort landskap viser to testoversette feil: spillets «Gangemagi»-tittel blir avkuttet ved 320 px og femte kurvtall/plussledd klippes ved oppdrag 5.
- Korrigerer bare aktiv Gangemagi mission-layout ved <=360 px: fjerner redundant Læria-ordmerke i spillheaderen, gir tittelen korrekt bredde, flytter de fem tellerne til full egen matematikkrad. Personlig rev, motor, oppdrag, lagrede data, direkte plukk/dra og alle berøringsflater bevares.
- Nye Playwright-asserts kontrollerer faktisk tekstklipping og alle fem tall både før og etter at ett jordbær er lagt i. Ny eksakt-HEAD Chromium/WebKit-gjennomgang og oppdaterte screenshots kreves før godkjenning.
- Release42 bumpes både i HTML, service worker og cache-test, slik at Safari laster ny CSS fremfor eldre release41-variant.
- Premiumavvik består: high-detail `home-math-v14.webp` med foss/skog ligger over Tallenga-markeds-SVG og gjengir ikke den låste markedsplassen med sollys, bro, boder og 2.5D-dybde. Original brukergodkjent PNG er ikke vedlagt repoet. Ingen merge/publisering.

### 24.10.2026 – release44: 320×568 får hele læringssløyfen i første skjerm
- Visuell kontroll av release42 viste at fullsidebildet var ryddig, men `GANGEMAGI_FIRSTFOLD` på liten iPhone målte mattefeltets bunn til ca. 627 px i en 568 px viewport. Barnet så dermed kurver og jordbærkilde, men ikke hele mattefeltet uten scroll.
- Dette er et reelt avvik fra den låste kontrakten om at aktiv kurv, fysisk plukkekilde og matematisk konsekvens skal være forståelig i første skjerm.
- Kun `<=360px / <=650px` komprimeres: mindre dekorativ padding, en fortsatt fullfigur men smalere revekolonne, 108 px illustrerte kurver og 70 px fysisk jordbærkilde. Ingen touchkontroll går under 44 px, og spillmotor/progresjon er urørt.
- Playwright krever nå eksplisitt store nok kurver, touch-sikker kilde og at hele mattefeltet ligger innenfor 320×568-viewporten. Ny eksakt-HEAD Chromium/WebKit og ekte skjermbilder kreves.

### 24.10.2026 – release46: rikt Tallenga-marked over den validerte malte verdenen
- Release45-crop-forsøket ble forkastet og reversert fordi flytting av `home-math-v14.webp` ikke løste premiumgapet. Release44-layout og spillflyt ble bevart.
- Release46 angriper den dokumenterte rotårsaken i stedet: den detaljerte malte verdenen beholdes for lys, materialdybde og atmosfære, mens et nytt transparent `gangemagi-tallenga-market-overlay-v2.svg` legges **over** maleriet med markedsboder, tårn, bro, fontene, lanterner, girlandere og forgrunnsbaldakiner.
- Overlayen inneholder ingen tekst, rev, kurver, jordbærkilde, oppgaveknapper eller matematikk. Alt barnet kan bruke forblir ekte DOM og eksisterende spillmotor/progresjon er urørt.
- Playwright krever nå både at overlayen lastes, at den har boder/bro/fontene, at den ikke inneholder bakt tekst/kontroller, og at den ligger visuelt over `home-math-v14.webp`.
- Safari-cache bumpes direkte fra release44 til release46 fordi release45 var et forkastet mellomforsøk.
- Ny exact-head Chromium/WebKit og manuell iPad/iPhone-kontroll er påkrevd. Dersom markedslaget gjør scenen rotete eller fortsatt ikke oppleves som et premium Tallenga-marked, skal release46 reverseres fremfor å svekke spillbarheten.

### 24.10.2026 – release47: blending av markedsarkitektur
- Release46 bestod exact-head Chromium og WebKit, men manuell kontroll viste at ideen var bedre enn utførelsen: markedsboder og hus ga riktig stedidentitet, men sentrale vektorflater lå for hardt oppå det malte landskapet på iPad.
- Release47 endrer derfor kun overlayens visuelle styrke. Sentrale skyline-/stall-lag dempes til ca. 56–58 %, bro/fontene til ca. 48–52 %, mens kantboder, lanterner og forgrunnsawning beholdes tydeligere for å ramme inn markedet.
- Drop-shadow-kontrast er redusert for at arkitekturen skal blende inn i den eksisterende painterly verdenen. Ingen geometri, touchflate, DOM, JavaScript, matematikk, progresjon eller oppdrag er endret.
- Overlay-URL og Safari-cache bumpes til release47. Ny exact-head Chromium/WebKit med manuell iPad/iPhone-sammenligning kreves før release47 beholdes.

### 24.10.2026 – Release48 – låste skogstroll blir aktive medspillere
- De tre godkjente karakterfilene er lagt inn som **identiske originalbytes**, ikke regenererte varianter:
  - `assets/gangemagi-troll/storesoster.webp` – Git blob `a8fba47e272e2856bd78b92fb262146506e828ed`
  - `assets/gangemagi-troll/lillesoster.webp` – Git blob `37fd94b3d0fd5319db05e4d1aea609e96d69351f`
  - `assets/gangemagi-troll/lillebror.webp` – Git blob `fcf59aad90e0c9dacca025d76cd352a924ef7120`
- Oppdragsmodus endres fra «barnet plukker og legger bæret» til **«barnet velger – trollet utfører»**:
  1. Barnet velger ett av de tre trollene.
  2. Det valgte trollet vises med ett jordbær.
  3. Barnet velger en kurv.
  4. Trollet gjør en kort leveringsbevegelse.
  5. Først etter leveringen sendes samme eksisterende `add`-handling til Gangemagi-motoren, og matematikk/kurvtall oppdateres.
- Ett troll er ikke låst til én kurv. Alle tre kan levere til alle kurver, slik at samme trio fungerer også i oppdrag med fire og fem grupper.
- Direkte berøring av et jordbær i en kurv beholdes for å ta det ut igjen. Fri lek beholder den eksisterende direkte jordbærkilden og den lagrede personlige reven; Markedsbok beholder også reven. Dette avgrenser endringen til selve Gangemagi-oppdraget.
- Jordbærkassen beholdes som fysisk, illustrert kilde i scenen, men er ikke lenger barnets hovedknapp i oppdrag.
- Release48 legger til QA for eksakte trollfiler, 44 px+ trollvalg, troll→kurv-flyt, at trollvalg alene aldri endrer matematikk, og at én levering gir nøyaktig ett bær.
- Release47 Tallenga-hybridbakgrunn beholdes i denne runden. Grovanova-/bakgrunnsendring behandles separat etter at trollmekanikken er visuelt verifisert.
- Ingen merge eller publisering før ny exact-head Chromium/WebKit og ekte iPhone/iPad-skjermbilder er kontrollert.

### 24.10.2026 – release49: trollene inn i selve markedet
- De tre låste WebP-figurene beholdes uendret. Barnet velger fortsatt troll først; dette plukker ett bær uten å endre matematikken.
- På iPad/desktop spres trollene nå over den faktiske kurvsonen i stedet for å stå som en liten separat gruppe i den gamle revelanen. Talehjelpen bruker venstre guideområde.
- Når et troll holder et bær, slipper trollknappene gjennom pekere til kurvene. Dette følger den faktiske totrinnsoppgaven: først velg troll, deretter velg kurv, og forhindrer at karakterkunst stjeler kurvens touchmål.
- Leveringsanimasjonen sikter nå bæret mot den kurven barnet faktisk valgte. Den matematiske tilstanden oppdateres først etter den synlige leveringen.
- Kort 844×390-landskap beholder a516-komposisjonen og 44px+ touchmål, men får samme eksplisitte hit-layer-regel.
- Ny Playwright-regresjon kontrollerer etter trollvalg at kurv 2, ikke trollkunst, er elementet som faktisk mottar berøringen.
- Grovanova-bakgrunnen er fortsatt et separat visuelt arbeid. Ingen flat eller feilformet lokal prototype er lagt i repoet.

### 24.10.2026 – release50: riktig berøringslag mellom troll og kurver
- Release49 gjorde de tre låste trollene til aktive figurer i selve markedet. Ekte Chromium-QA avdekket at det store trollknapp-rektangelet kunne ligge over et allerede plassert jordbær selv om figuren så riktig ut.
- Interaksjonslagene er nå eksplisitte: før trollvalg er trollene første handling; når trollet holder et bær blir kurvene aktive; etter levering går hele kurvknappen tilbake til passiv, mens det faktiske bæret og minusknappen ligger øverst og kan brukes direkte.
- Marked/kurver ligger visuelt foran trollenes nedre del. Dette lar trollene stå naturlig bak/ved kurvene uten å bli en usynlig berøringsvegg.
- Ny Playwright-regresjon bruker elementFromPoint på midten av et faktisk plassert bær og krever at bæret, ikke et troll, eier pikselen før direkte fjerning testes.

### 24.10.2026 – release51: returbrettet beholder direkte bærflytting
- Release50 gjorde markedslaget passivt utenom de aktuelle barnehandlingene, men det midlertidige returbrettet ved drag av et allerede plassert bær arvet dermed passiv pointer-events.
- `.gm-return-tray` er nå eksplisitt interaktivt. Eksisterende QA krever at brettet blir `.gm-drop-target`, fjerner nøyaktig ett bær og lar opptjent blomst bestå.

### 24.10.2026 – release52: Grovanova som låst scenegeometri
- Gangemagi bruker nå `gangemagi-grovanova-storybook-locked.webp` som landskapsbase i mission-modus. Kilden er den innsendte Grovanova/fjord-referansen; fjellkonturen er bevart fra selve bildet i stedet for generativt tegnet om.
- Bildet er kun beskåret/komprimert og gitt en mykere storybook-behandling. Den tidligere generiske `home-math-v14.webp`-fossen er ikke lenger mission-bakgrunn.
- `gangemagi-tallenga-market-overlay-v2.svg` ligger fortsatt over Grovanova og gir Læria/Tallenga-markedet. Den authored markeds-SVG-en ligger fortsatt under som ekstra scenegeometri.
- De tre låste troll-WebP-ene, kurver, jordbær, oppgavekort og matematikk er fortsatt separate live DOM-lag. Ingen karakter, tall eller kontroll er bakt inn i fjordbildet.
- En mørkere grønn/varm foreground-glaze lar det levende markedet eie forgrunnen og toner ned strandlinjen i referansen uten å endre fjellformen.
- Playwright krever nå at Grovanova-assetet faktisk laster, ligger under markeds-overlayen og at `home-math-v14.webp` ikke kan snike seg tilbake som Gangemagi-bakgrunn.
- Ny exact-head Chromium/WebKit og faktiske iPad/iPhone-skjermbilder kreves før visuell sluttaksept. Ingen merge/publisering.

### 24.10.2026 – release53: jordbærkassen er ren scenery før trollvalg
- Exact-head Chromium på release52 viste at et nested SVG-`<image>` fra jordbærkassen kunne ligge over Storesøsters faktiske trykkflate, selv om wrapperen var passiv.
- I mission-modus er kassen kun stedet trollene plukker fra. Hele kasse-subtreet er derfor eksplisitt `pointer-events:none`; barnet skal trykke troll, deretter kurv.
- Ingen spilllogikk eller Grovanova-scene endres. Eksisterende troll-/kurvtester må nå passere uten force-click eller svekket assertion.
