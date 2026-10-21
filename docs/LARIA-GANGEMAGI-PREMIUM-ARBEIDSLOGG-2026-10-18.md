# Gangemagi: arbeid mot låst premiumillustrasjon
Dato: 18.10.2026

## Låst kilde og visuell fasit
- Ordrett, verifisert masterprompt: `docs/MASTERPROMPT-LARIA-GANGEMAGI-LAST-2026-10-18.md`.
- Godkjent bilde: `gangemagi_i_tallengas_hage.png`, 941 × 1672 piksler, SHA-256 `5e8980e18b9874cb0c12a5f2856dc41c51820830adcaaaeafa5c6647bdb93c4a`.
- Bildet er delt i samtalen. Det er **ikke** påstått at den binære originalfilen er lagret i GitHub. Legg den i repoets designressurser når en sikker binærfilopplasting er tilgjengelig. Bruk aldri hele referansebildet som en ikke-interaktiv UI-flate.

## Grein og avhengighet
- Arbeidsgren: `feat/laria-gangemagi-premium-locked-20261018`.
- Draft-PR: #187, basert på #181. Dette er en bevisst stacked PR. Koordiner med nyere `main` (bl.a. Ordjakt) før senere release.
- Ingen endring i gammel Gangetabellen, profil-/lagringsformat, andre fag eller globus.

## Kode implementert i denne økten
1. Skilt ut en entydig oppdragsinteraksjon: trykk på kurven **velger**, hovedknappen **legger ett jordbær i valgt kurv**. Uten valgt kurv blir det ikke feilaktig lagt til et bær. Markering og revemelding oppdateres ved valg.
2. Fri lek beholder sin tidligere direkte kurvberøring og sitt valgfrie drag-and-drop. I oppdrag er drag ikke lenger en skjult parallell regel.
3. Eget originalt, gjenbrukbart håndflettet SVG-motiv: `laer-litt-mer/gangemagi-basket-premium.svg`. Det er ikke et flatt skjermbilde; jordbær, valg, merker og tellere ligger som live DOM.
4. Større dynamisk tregjengitt oppdragstavle: «Velg en kurv» → «Legg i jordbær» → «Se at a × b = resultatet», bygget fra alle åtte eksisterende oppdrag.
5. Integrert toppnavn/oppdragsposisjon, stor malerisk spillscene, personlig rev, matematikk og eget 0–mål-bærfelt.
6. Byttet ut midlertidige, lagvis oppsamlede oppdrags-CSS-patcher med ett samlet mission-scope-stilsett. Den opprinnelige klassiske øvingen, fri lek og Markedsbok har fortsatt separat stil.
7. Flyttet Fri lek og Gangetabellen til sekundær navigasjon slik at oppgavetavle og marked får visuell prioritet.
8. Eksisterende hovedskript og stilversjoner er oppjustert for Safari/PWA-cache.

## Regresjonstesting / releaseporter
- Playwright-testen er utvidet for å kreve **valg før bær**, valgt-kurv-markering, egen SVG-ressurs, dynamiske oppgavetekster, korrekt regnestykke, Markedsbok/progresjon og klassisk modus.
- **Status:** Ingen påstand om grønn QA på aller siste PR-head før GitHub Actions faktisk rapporterer dette. Første CI-kjøringer pågår.
- Faktiske WebKit-bilder i 320×568, 390×844, iPad portrett og landskap, samt Chromium, skal inspiseres før visuell godkjenning. Visuell samsvar med låst illustrasjon er **ennå ikke godkjent**.
- Kontroller særskilt at tre eller flere kurver og hovedhandlingen ikke skjules under første skjerm på iPhone; at markeringen er synlig; at opptjent blomst består etter angre og reload; at tegnede jordbær fortsatt er lette å telle.

## Neste steg
1. Hent eksakt HEAD GitHub Actions. Fiks rotårsakene til faktiske testfeil, ikke slakk testene for å få grønn status.
2. Verifiser iPad/iPhone-skjermbilder. Visuelt sammenlign topp, tretavle, personlig rev, kurver, matematikken og primærknapp mot den låste illustrasjonen.
3. Fortsett med materialkvalitet på eventyrmarkedet, kurvillustrasjon, responsiv komposisjon og de levende animasjonene.
4. Verifiser alle åtte oppdrag, fri lek og progresjonsmigrering, deretter bred QA.
5. Hold #187 som draft til dokumentert visuelt samsvar og eksakt QA. Publiser ikke denne foreløpige implementasjonen.


## Fortsettelse 18.10.2026 – reelle skjermbilder og barneflyt

### Bekreftet teknisk og visuelt i GitHub Actions
- `9d39d53`: Endret iPad stående fra vertikal megastakk til to kolonner (valgt personlig rev / ekte kurver). Rotårsak: etter fullføring lå «Neste oppdrag» nedenfor 820×1180-visningen. Eksakt-head Gangemagi Chromium/WebKit QA bestod etter rettingen.
- `ad48963`: Jordbær i oppdrag rendres nå som en sentrert klynge inne i valgt kurv, ikke bundet til første venstrestilte tomme slot. Tomme kurver inneholder ingen falske bær. Ny geometritest på første bær og den øvrige 6-enhets QA **bestod**.
- `a6e5f1a`: Originalt tegnet market-stall-underlag (`gangemagi-market-table-premium.svg`) plasseres bak reelle kurver uten å fange klikk; oppdragstrinnene følger faktisk brukerflyt (1 velg → 2 legg i → 3 oppdag), reven bekrefter hvert valg. Fullt resultat: Gangemagi WebKit/Chromium visual QA **success**, run `39150395833`, og faktiske skjermbilder i artifact `12145500449`. Ingen påstand om visuell premiumgodkjenning; bildene viser fortsatt mye ulikhet fra den låste illustrasjonen.
- Screenshots ble hentet og gjennomgått for `a6e5f1a`. iPhone 390 og iPad portrett ser ikke lenger ut til å ha UI-kollisjon; jordbærene ligger innenfor kurvåpningen, og kurvene har en markedsforgrunn. Den personlige reven og eksakt arten er **fortsatt visuelt mindre/flatere** enn fasiten.

### Ny siste implementering – venter på eksakt-head QA
- `701c726`: Trinn 3 viser nå en dynamisk illustrasjon med én kurv per faktisk gruppe i stedet for å duplisere `3 × 3 = 9` som tekst og illustrasjon. Nye assertions verifiserer 3 grupper i første oppdrag og 2 i siste.
- Alle åtte oppdrag, Markedsbok, fri lek, klassisk Gangetabellen, eksisterende lagringsformat og personlige revevalg skal regresjonstestes på **eksakt nyeste HEAD**.
- Før sammenslåing: sjekk nytt WebKit-artifact, 320×568 og 390×844 samt 820×1180 / 1180×820, fullføringsknapp uten skjult scrolling, pressbar kurv og illustrerte grupper (også grupper=5), viderefør personlig rev, originalt kunstuttrykk og progresjon.

### Produktmessig vurdering
Dette er en genuin funksjonell ombygging, ikke bare dekorasjon. Men skjermbildene viser at den virkelige scenen fortsatt ikke matcher referansens store, nærværende rev, maleriske tredimensjonale kurver og integrerte markedskomposisjon. Fortsett art-direction uten å lage en ny fasit eller erklære premium for tidlig. `PR #187` forblir **draft**, `PR #181` må ikke publiseres alene, og ingen GitHub Pages-publisering er autorisert før visuell og teknisk kvalitetsport er oppfylt.


## Tredje illustrasjonskontroll / slutten av samme økt

- `9d78bcb` ble verifisert med **grønn Chromium- og WebKit-Gangemagi QA** på seks enhetsoppsett i GitHub Actions run `39150868343`; screenshot-artifact `12144734970` hentet og undersøkt. Oppdragstavlens tredje illustrasjon viser nå henholdsvis 3 og 2 miniature kurver i testede oppdrag. Fysisk valgt kurv og første bær fungerer, og iPad stående har synlig fullføringsknapp.
- `61732f3`: På iPhone 375px+ med nok høyde er brukerens **egen valgte rev** forstørret fra 105 × 121 til 135 × 155 CSS-piksler, uten å gjøre første-skjerm-layouten høyere. Overlapp og primærknappen må kontrolleres i neste faktiske WebKit-bilde.
- `b0c838a`: Safari/PWA-versjonen er økt til `20261018-premium-locked2`, siden nye illustrerte JS/CSS/SVG-ressurser ellers kunne bli stående i gammel runtime-cache.
- **Siste kodestatus:** Behold PR #187 som Draft. Kjør alle relevante eksakt-HEAD-tester på siste commit, inspiser reelle skjermbilder i mobil og nettbrett og mål samsvar mot den LÅSTE referanseillustrasjonen. Ingen publisering eller premium-merkelapp ennå.

Neste visuelle prioritet etter grønn QA: et mer integrert marked med enda bedre sammenheng mellom personlig rev, trefasade, tredimensjonale kurver, dekor og mattevisning. Legg ikke til egne spillmoduser eller nye uavklarte konsepter.

## Fortsettelse 18. oktober – samlet visuell tavlerevisjon og pedagogisk bildekorrekthet

- **Kontroll før arbeidet:** PR #187 var fortsatt åpen draft på `5ac78e8`, stablet på PR #181; alle tre GitHub Actions-arbeidsflyter var grønne. Den godkjente illustrasjonen er fortsatt bindende.
- **Nytt originalt illustrasjonsmateriale:** `laer-litt-mer/gangemagi-quest-board-painted.svg` inneholder utskårne og lagdelte treplanker, varm pergamentflate, trestruktur og blomster/bladdekor. Dynamiske oppgavetekster og de tre faktiske læringsstegene er beholdt som ekte tilgjengelig HTML over ressursen, ikke bakt inn i ett statisk bilde. CSS `gangemagi-dagens-oppdrag-v1.css` er lagt om fra generisk kortbord til denne illustrasjonen; mobil/iPad-padding er justert for samme interne høyde.
- **Rettet matematisk misvisende illustrasjon:** `multiplication-gangemagi-v1.js` viser nå faktisk `each` minijordbær per basket i tredje steg. CSS fordeler opptil fem per rad og bryter til ny rad ved 6–10. Testen `tests/laria-gangemagi.playwright.js` krever korrekt 3 × 3 = ni minijordbær og 2 × 10 = tjue, og at tavleressursen lastes mens innholdet er levende DOM. Tidligere viste hvert oppdrag tre bær per illustrerte kurv, som var faglig galt ved andre oppgaver.
- **Safari/PWA-ressursversjon:** `20261018-premium-locked5` i index/SW, for å hindre at foreldet JS/CSS vises.
- **Status for siste HEAD:** `816f85172b438db0378dd02168e2b6726ce315cd`, CI-start på GitHub er kølagt. **Ingen teknisk eller visuell godkjenning på siste SHA foreligger ennå.** Det er heller ingen merge eller Pages-publisering.
- **Neste konkrete trinn:** Hent/følg `Laria Gangemagi approved Markedsbok visual QA` og `Continuous smoke checks` på siste HEAD. Les faktiske screenshot-artifacts fra WebKit på iPhone 320/390 og iPad 820 portrett/1180 landskap. Først etter visuell sammenligning med `gangemagi_i_tallengas_hage.png` avgjøres om treskiltet og skala er en forbedring eller skal justeres. Ikke forveksle en grønn CI med premiumvisuell godkjenning.

## 19. oktober – systematisk test av alle åtte oppdrag og riktig PR-avhengighet

- **Verifisert startstatus:** På `48728dd5` var Gangemagi WebKit/Chromium, Magical Collection V2 og smoke-test grønne. Faktiske WebKit-bilder i iPhone 320/390 og iPad stående/liggende er kontrollert. Referanseillustrasjonen er fortsatt låst; teknisk grønt er ikke det samme som visuell premiumgodkjenning.
- **Tverrprosjektfeil etter endret PR-base:** `main` har en eksisterende `discovery-antarctica-geography-v1.js` som manglet i Gangemagi-grenen selv om `index.html` refererte til den. Dette ga nøyaktig to relaterte smoke-testfeil. Filen er kopiert **uendret fra main**, ikke erstattet med en stub og ikke endret funksjonelt. En ny komplett smoke-test må fortsatt bestås på siste commit.
- **Åtte hele oppdrag, ikke bare demonstrasjonen:** Utvidet `tests/laria-gangemagi-engine.test.cjs` med full gjennomspilling av alle åtte ulike oppdrag: ett bær per handling, riktig sum og multiplikasjon, ingen overfylling, ingen tidlig belønning, nøyaktig én blomst per oppdrag, varig samling i Markedsboken og trygg start på nytt etter oppdrag 8.
- **Nettlesertest i faktiske enhetsoppsett:** `tests/laria-gangemagi.playwright.js` velger nå alle åtte oppdrag gjennom Markedsboken og kontrollerer dynamiske titler, kurv- og jordbærantall, minst 44 px trykkbredde, reelt kurvvalg, og at første «Plukk et jordbær» endrer matematikk og spilltilstand riktig. Dette gjennomføres i seks eksisterende Chromium-/WebKit-oppsett, uten å fylle artifactet med unødvendig mange skjermbilder.
- **Avhengighet gjenopprettet:** PR #187 var utilsiktet pekt direkte mot `main`, selv om den er bygget på åpen PR #181 og skal være stablet. Endret PR #187 sin base tilbake til `feat/laria-gangemagi-dagens-oppdrag-20261017`. GitHub bekrefter at #187 igjen er `mergeable=true` mot denne basen. **PR #181 er fremdeles åpen/draft og må samordnes mot nyere main før eventuell publisering.**
- **Kvalitetsport:** Ny kode må ha grønn smoke-test, grønn åtteoppdrags-test og nye ekte WebKit-bilder fra eksakt commit. Fortsett vurderingen av lesbarhet i 2. klasse, personlig rev, reelle trykkflater og likhet med fasiten. **Ikke flett eller publiser før komplett kvalitet er dokumentert.**


## 19. oktober 2026 – direkte jordbærlek og visuell forenkling

Låst produktkrav: `docs/LARIA-GANGEMAGI-LAAST-DIREKTE-LEK-2026-10-19.md`.

Gjennomført på PR #187, separat fra `main`:
- Aktiverte kilde-til-kurv-drag også i oppdrag; trykk på kilde og kurv fungerer som alternativ.
- Direkte tapping på et faktisk jordbær i kurven fjerner ett bær. Et jordbær kan dras tilbake til kilden. Ordinær fjern/angre beholdes for tilgjengelighet.
- Drop-markering fremhever gyldig kurv/kilde. Ugyldig slipp endrer ikke det matematiske antallet. Full kurv avvises av den opprinnelige spillmotoren.
- Forenklet tretrinnsinstruksjonen til «Plukk», «Legg i», «Se gangemagien». Jordbærkilden får tre interaktive SVG-bær og treverkspalett, fremfor generisk rød legg-til-knapp.
- Utvidet Playwright med gyldige/ugyldige drag og tap/fjern i Chromium/WebKit på små og store visninger.
- Reell CI avdekket en test-/UX-konflikt: klikking midt i en fylt kurv treffer nå et direkte fjernbart jordbær. QA-hjelperen velger derfor kurvkanten, mens testen for direkte bærberøring bevares. Etter drag+reset måtte også midlertidig klikksperre nullstilles.
- Dokumenterte at tidligere CI på del-commits ikke er nok til å erklære seneste HEAD bestått. Siste testresultat skal hentes igjen.

Gjenstår før premiumgodkjenning:
1. Grønne Playwright Chromium/WebKit og øvrig CI på EKSAKT siste HEAD.
2. Faktisk bildegjennomgang mot brukerens godkjente referanse. Original binærillustrasjon er ennå ikke dokumentert som versjonert ressurs i repoet.
3. Sjekk at bærkassen, kurver, reven, oppdrag og matematikk står i riktig visuelt hierarki på iPhone 320/390 og iPad stående/liggende.
4. Safari/touch med reelle enheter ved anledning; Playwright-WebKit er ikke en fysisk iPad-test.
5. Samordning av stacked PR #181/#187 mot nyeste main og deretter produksjonsverifikasjon. Ikke flett/publiser på bare teknisk grønn QA.

Status: aktiv utviklingsgren. IKKE publisert eller erklært premium-ferdig.

## 19. oktober – retur av bær også etter fullført oppdrag (PR #192)

- Faktiske 320/390 WebKit- og iPad-skjermbilder fra eksakt HEAD `796c1db4` ble lastet ned fra GitHub Actions artifact `12216874427` og visuelt kontrollert. Standardstart og ferdigscenen er en sammenhengende illustrert markedsscene; fullføringsknappen vises i første skjermbilde.
- Funnet samspillsbrudd: etter fullføring fjernes jordbærkilden av layouten, selv om den låste leken tillater å dra et bær tilbake. Direkte trykk/fjern og Angre virket, men ikke selve retur-draget.
- Rettet uten en ny permanent knapp: ved påbegynt drag av et jordbær i et ferdig oppdrag vises en midlertidig, belyst «Legg tilbake»-kasse på markedet. Slipp der fjerner nøyaktig ett bær; kassen forsvinner umiddelbart etterpå eller ved avbrudd. Eksisterende lagring, belønninger, ligninger og Next-layout beholdes.
- Egen browser-regresjon kjører retur etter fullført oppdrag på de seks eksisterende WebKit/Chromium-visningene, sjekker gyldig lysrespons, berøringsflate, korrekt ett-bær-retur, skjult returkasse i ro, blomster og angre/restore.
- KVALITETSPORT: Den nye commitens samlede CI og reelle skjermbilder må verifiseres på nytt før sammenslåing. Urelatert SuperKlode-test hadde tidsavbrudd på WebKit iPad liggende på forrige SHA og er ikke endret her. Publisering er ikke utført.

## 19. oktober – reell rotårsak på liggende iPhone, ikke bare grønne tester

- Eksakt HEAD `6cf3eef` fikk grønn dedikert Gangemagi WebKit/Chromium-test og nye screenshots. **Visuell revisjon fant likevel en premiumblokkering** på WebKit iPhone 844×390: 250px høy fullbreddetavle under header etterlot verken kurver eller jordbærkilde i første 390px viewport. Barnet måtte scrolle betydelig før selve spillet begynte. Dette ble ikke avdekket av tidligere DOM-/touch-asserts som automatisk scrollet før handling.
- Rettet rotårsak i ETT avgrenset responsivt layoutoppsett for kort liggende iPhone: ekte, malt oppdragstavle til venstre med tre lesbare vertikale illustrerte steg; barnets valgte rev, ekte kurver, jordbærkilde og matematikk til høyre. Samme live JS, eksisterende 8 oppdrag, lagring og berøringsflyt; ingen ny kunst eller statiske skjermbilder. Ingen endring av iPhone stående eller iPad-visninger.
- Dedikert Playwright WebKit+Chromium landscape-regresjon krever nå reelle kurver og jordbærkilde innen første 390px viewport, synlig matematikk, ingen sideveis overflow, ingen overlapp i header, tilstrekkelige berøringsflater og faktisk touch-plukk/plassering/fjerning.
- **KVALITETSPORT:** Layouten er et testbart forslag, IKKE godkjent. Les nye, ekte GitHub Actions-landskapsbilder og korriger reelle feil; kontroller spesielt lesbar oppgave, personlig rev og 4–5 kurver. Fortsett med én isolert PR #192. Ingen merge/publisering før eksakt-HEAD-CI og visuelt premiumkrav er bestått.

## 19. oktober – kort iPhone-landskap, tett oppdrag (PR #192)

- Kontroll av release-HEAD `f54e912`: 17 av 18 workflow-grupper grønne; samlet Laria QA var fortsatt i full nettleserregresjon. Ekte WebKit-bilder viser ren 3-kurv liggende layout, men det fantes ingen separat visuell QA for fem kurver eller 2 × 10.
- Rotårsak identifisert i CSS: steg 3 hadde 49px bredt bildeområde også ved fem illustrerte minikurver, slik at hvert minibilde ble krympet. Med ti bær i ett kurvrom kunne to fulle fruktrader gå bak kurvens navneskilt på en lav liggende skjerm.
- Isolert landscape-CSS: steg-3-illustrasjonen får 88px ved 4/5 grupper; i oppdrag med ti per kurv brukes kortere bær og høyere sentrert fruktklynge. Alle andre skjermstørrelser og oppdrag skal forbli uendret.
- Ny faktisk Chromium/WebKit landskapstest inspiserer oppdrag 5 og 8, måler om minikurver/tekst overlapper, sjekker alle trykkflater og første skjerm, og fyller ti ekte bær ved berøring for å verifisere geometri og korrekt sum. Nye screenshot-artifacts: 03-five-baskets, 03-ten-berries og 04-ten-packed.
- KVALITETSPORT: Nye rettelser må bestå CI på eksakt ny commit før visuell kontroll og eventuell release. Ingen merge eller publisering gjennomført.


## 21. oktober 2026: Safari-cache og faktisk main-integrasjon

- Tre endrede Gangemagi-ressurser har nye versjonerte adresser. SW-cache roteres med eget Gangemagi-suffiks.
- Ny Node-regresjon kontrollerer ressursversjoner, oppdatering fra gammel cache og bevaring av andre appcacher.
- Integrert main c7a6f388 med ekte Git-merge, inkludert nyere Finn ordene og SuperKlode. Ingen manuell overskriving av hele filer.
- Den tidligere globustesten har passert med uendret appkode og utvidet diagnostikk; den opprinnelige tidsavbruddsårsaken er ikke endelig bevist.
- Engangsverktøyet oppretter bare et uflettet commit-objekt. Grenflytting, samlet CI og eventuell publisering må verifiseres separat.


## 21. oktober: handlingsbilder og samlet marked, referanserevisjon

- Videreforer den gjenfunne originalen Gangemagi i Tallengas hage.png (fil-ID file_00000000ba048210a3365748b25cc26b) og den senere markedsillustrasjonen (file_000000008ab48210b7a5615e529e50af). Ingen ny spillmodell eller ny standardrev.
- Endret eksisterende komponentregler, ikke lagt til en overstyringsfil: storre billedsteg innenfor tavlens plass, roligere trinnrammer, varmere malt tre/pergament og fysisk duk under kurver og jordbaerkilde. Kilden har storre baer og lesbart Plukk-skilt; ingen generisk legg-til-knapp.
- Konkret revfeil: SVG-ens automatiske minste radstorrelse gjorde en 227px beholder til et 345px malt bilde pa iPad. Minmax(0,1fr) og begrensning av selve SVG-en hindrer at figuren males bak regnestykket. Personlig rev og animasjoner bevares.
- Lokalt: seks Chromium-storrelser 320x568, 390x844, 820x1180, 1180x820, 844x390 og 1440x900 bestod alle atte oppdrag og synlig hovedhandling. Dette var en offline rendringsfixture med lagringsadapter, ikke en produksjons-/CSP-test eller WebKit-test. 13 faktiske Node-motor/cache/handler-regresjoner bestod.
- Eksisterende Playwright-regresjon er utvidet til a male faktisk reve-SVG, storrelse pa billedsteg, jordbaerkildens motiv og fravaer av bakgrunnsuskarphet. Ny ressursversjon release2 og SW-cache bevarer oppdateringer.
- GitHub Chromium/WebKit og full regresjon ma besta pa endelig commit; inspiser bildene mot originalene for premiumgodkjenning. Ikke merget eller publisert.
