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

### 24.10.2026 – release43: Tallenga-markedet blir faktisk synlig
- Release42 på eksakt HEAD `3635e940d6e56b6fb7b6b41c850589196e4a93b4` bestod dedikert Gangemagi Chromium og WebKit. WebKit-artefakt `12549280684` og Chromium-artefakt `12549445040` ble hentet og inspisert.
- 320×568 er rettet: hele «Gangemagi»-tittelen er synlig, alle fem kurvtallene får plass og delvis oppdrag viser korrekt `1 + 0 + 0 + 0 + 0 = 1`.
- Visuell kontroll viste fortsatt det største premiumavviket: `home-math-v14.webp` lå som øverste bildelag og maskerte den dedikerte Tallenga-markedsillustrasjonen med foss/skog.
- Release43 fjerner kun dette generiske Home-bildelaget fra Gangemagi mission-verdenen. Den eksisterende `gangemagi-tallenga-market-premium-20261023.svg` blir synlig hovedscene; spillmotor, personlig rev, kurver, jordbærkilde, matematikk, åtte oppdrag og progresjon er uendret.
- Playwright-kontrakten skjerpes: premium Tallenga-SVG må være aktiv bakgrunn, og `home-math-v14.webp` får ikke maskere markedet inne i Gangemagi. Ny exact-HEAD Chromium/WebKit og ekte iPhone/iPad-bilder kreves før release43 kan godkjennes.
