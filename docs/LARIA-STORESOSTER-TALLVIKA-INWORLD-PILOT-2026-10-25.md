# Læria – Storesøster i Tallvika: in-world-pilot

**Dato:** 25. oktober 2026  
**Avgrensning:** Kun storesøster i Tallvika. Ingen merge eller publisering er autorisert.

## Kontroll før endring

- Produksjonsgrunnlag ved oppstart: `origin/main` på `32ea548f` – *Læria: Publiser Tallvika som matematikkverden*.
- Sikker tilbakevei: `origin/backup/pre-tallvika-20261025` peker på pre-Tallvika-hjemmet.
- Tallvika er allerede merget til `main`. Tidligere arbeidsgrener fra #208/#219/#220 er ikke åpne etter fjernopprydding; relevant historikk ble kontrollert med `git log --all`.
- Tallvika-oppfølgingsarbeid på `feat/laria-tallvika-production-20261025` og `feat/laria-tallvika-premium-portals-20261025` ble ikke blandet inn. Denne piloten er en ny, ren branch fra gjeldende `origin/main`.
- Tidligere `feat/laria-living-trolls-pilot-20261025` inneholder en CSS-basert posepilot. Den er ikke tatt inn som ferdig rigging.

## Låste originaler

| Figur | Fil | Dimensjon | SHA-256 |
| --- | --- | ---: | --- |
| Storesøster | `laer-litt-mer/assets/gangemagi-troll/storesoster.webp` | 512×1024 RGBA | `b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89` |
| Lillesøster | `laer-litt-mer/assets/gangemagi-troll/lillesoster.webp` | 512×1024 RGBA | `ee3f14e95407c8f673ee78c8ea3afc1b782e6f2975929ce6f77b867de29db425` |
| Lillebror | `laer-litt-mer/assets/gangemagi-troll/lillebror.webp` | 512×1024 RGBA | `7f1d9eeb293361ebb6507d024013d744d106978b72bbe4d71e2096816d9fdd11` |

Alle tre er flate transparente rasterfiler. Det finnes ingen PSD, ORA, Rive-fil eller separat hode-/øye-/arm-/kroppslag i den godkjente pakken.

## Pilotens bildeforandring

`laer-litt-mer/assets/tallvika/storesoster-inworld-v1.webp` er laget med `tools/troll-art/build_storesoster_tallvika_inworld.py` utelukkende fra den låste storesøsterkilden.

- Output-hash: `72f0b91917eeda0462e71c413deb74906dc5d54d7bfbde4ce23570365f2f4e44`
- Dimensjon: 512×1024 RGBA.
- Alfa/silhuett kontrolleres byte-for-byte lik kilden.
- Ingen generering, ny ansiktsgeometri, omskapt klær eller endret positur.
- Behandlingen er begrenset til forsiktig støydemping av overflatedetaljer, lavere kontrast/metning, svak varm dagslysbalanse og svært lav stofftekstur.

Formålet er å dempe hudglans og fotorealistisk mikrotekstur uten å late som vi har en ny, godkjent karaktertegning. Den originale kilden beholdes uendret i `trolls.storesoster.src`. Etter visuell brukergodkjenning bruker både karaktervelger og Tallvika-scene den samme `sceneSrc` med malerisk storesøster. Dermed skifter ikke figuren utseende når den velges.

## Sceneintegrasjon

Den tidligere figuren stod på `left:64%`, `bottom:7%`, med en svært stor høyde (`46%`) og over vann/bygninger. Piloten flytter henne til den solbelyste nedre stien (`left:58.1%`, `bottom:14.7%`) med `31.4%` scenehøyde. Scenelaget tilfører bare:

1. En myk, ellipseformet kontaktskygge direkte under skoene.
2. Retningsriktig, kort kastskygge og svak dagslysdemping.
3. Ingen CSS-maskering av ansiktet, ingen nye lemmer og ingen kunstige hår/skjøter.

Dette er bevisst ikke en «filter-stabel» som forsøker å skjule en dårlig figur. Den strukturelle utbedringen er kildeavledet materialtilpasning, korrekt perspektiv og forankring på synlig terreng.

## Lagret valg og avgrensning

`profile.tallvikaTroll` er fortsatt den eneste lagrede Tallvika-velgeren. Tallvikas velger viser den godkjente maleriske storesøsteren og de to andre skogstrollenes uendrede originaler. Når verdien er `storesoster`, bruker scenen `storesoster-inworld-v1.webp`; de to andre bruker sine originale WebP-filer uten visuelle endringer. Matematikk, aktiviteter og progresjon er ikke endret.

Dette er foreløpig **ikke** en app-global karakterprofil. Den eksisterende appprofilen bruker fortsatt revevalget. Fase 5 krever en bevisst migrering/produktbeslutning etter den visuelle godkjenningen, slik at det ikke oppstår en tilfeldig blanding av rev og troll i resten av appen.

## Animasjon: ærlig status

Det finnes en tidligere kildebasert `source-bones-v2`-prototype for Gangemagi. Den animerer utsnitt av samme flate WebP med CSS-transforms. Den kan demonstrere idle, wave, think, hint, celebrate og support, men er **ikke** ferdig eller godkjent 2D-rigging.

Armlagstudien fra `927fb6f8` dokumenterer hvorfor: ved kun å rotere den synlige venstre armen oppstår 2 413–4 774 eksponerte piksler ved ±12°/±25°. De manglende skulder-, hår- og stofflagene eksisterer ikke i originalen. Derfor kan Rive (eller tilsvarende) ikke levere naturlig vinking/hint uten først å få godkjente, redigerbare underlagslag fra illustratørarbeid.

Neste tekniske steg etter visuell godkjenning er:

1. Bruk den eksisterende ORA-malen som kontrollert arbeidsfil, med originalhash og pikselintegritet som port.
2. Få separate, godkjente underlag for skulder, kropp, hår og arm – uten å endre synlige originalpiksler i hvileposen.
3. Rigge disse lagene i Rive eller tilsvarende; først da kan bevegelse omtales som ekte rigging.
4. Knytte `idle`, `wave`, `think`, `hint`, `celebrate` og vennlig feilrespons til Gangemagi-hendelser.

## QA-status

- Statisk kontrakt: lagt til for kildeavledet asset, scenejordkontakt og cache-busting.
- Nettleserpakken kjørte grønt i GitHub Actions (run `40233278211`) i Chromium og WebKit for iPhone/iPad stående og liggende, inkludert test av lagret trollvalg, ingen horisontal overflow og åpning av Brøklab/Gangetabellen.
- Testen lager, når den kjører i CI, en faktisk før-/etter-sammenligning i nøyaktig samme Tallvika-komposisjon ved å vise den låste originalen én gang og deretter gjenopprette den kildeavledede sceneversjonen. Den lager også eget helbilde og nærstudie av storesøster. Artefaktet heter `laria-tallvika-<sha>`.
- Den lokale arbeidscontaineren manglet Playwrights Chromium/WebKit-binærer, men GitHub Actions-kjøringen over leverte faktiske nettleserskjermbilder. Artefaktet `laria-tallvika-9e999ecf9abd18615f1defb72fa9644e14d76bcb` inneholder før-/etterbilder og nærstudier.
- Ingen fysisk iPhone/iPad/Safari-test er gjort eller påstått.

## Visuell beslutning

**Anbefaling: Ikke godkjenn eller rull ut til de to andre ennå.** Piloten er et reelt, reversibelt sammenligningsgrunnlag som reduserer de konkret påviste problemene (for stort ansikt, feil dybde og manglende kontakt med bakken), men brukerens visuelle vurdering av faktisk Tallvika-render må fortsatt være godkjenningsporten. Den erstatter ikke behovet for framtidige illustratørlag før ekte figuranimasjon.

## 26.10.2026 – Godkjent malerisk sceneillustrasjon montert som egen PR-ressurs

Brukeren godkjente **akkurat** `storesoster_inworld_paintover_CANDIDATE.png` som storesøsters visuelle sceneuttrykk (SHA-256 `b131de3b94bfd6ae60ab5f7a104d26a3ffb4eeb18f3c1593ca9bc51d7f887955`, 512×1024 RGBA). PNG-originalen ligger uendret i Lærias private filbibliotek under `/Læria/Skogstroll/storesoster_inworld_APPROVED_2026-10-26.png`.

Ny GitHub-asset: `laer-litt-mer/assets/tallvika/storesoster-inworld-approved-20261026.webp` er en **pixelidentisk, tapsfri WebP-avledning** av denne PNG-en. SHA-256 `80ae8a1ea0b43ebc2d8c0b12fb0e5cd588bce1882fd9d52819d3ac7ef4d85e67`; mål: 512×1024. Både RGBA-piksler og figurens transparentmaske er kontrollert identiske lokalt. Git blob SHA-1 `cff7b5710401f33fa4798d40e8935cb77eb40b44` er verifisert byte-eksakt mot overført data.

Kun storesøsterens **Tallvika-scene** bruker den godkjente filen; opprinnelig karaktervelger, andre troll og læringsmotor er uendret. Overflødig `brightness/saturate`-CSS er fjernet for storesøsteren, slik at den godkjente fargetonen ikke endres ved visning. Kontaktskyggen bevares. Node- og Playwright-kontrakter er utvidet for å låse hash, riktig bildevalg og bildedimensjoner. Serviceworker-cache versjonert for å motvirke gammel asset.

**Skille mellom portene:** Det er nå godkjent **karakterdesign** og kodekobling i draft-PR, men ikke endelig visuell QA av det nye faktiske nettleserbildet. Ikke merge eller publiser før Chromium/WebKit-skjermbilder fra eksakt HEAD og visuell kontroll. Ekte 2D-rigging er fortsatt blokkert av uillustrert skjult anatomi i issue #221; ORA-skisselag er ikke bevis for rigging.

## 26.10.2026 – Synlig Storesøster i smalt mobilpanorama (responsiv korrektur)

Utgangspunkt: faktisk WebKit 390×844 fra godkjent art-HEAD viser Storesøster liten, fordi original iPad-relative figurareal (9,3 % bred / 31,4 % høy) nedskaleres sammen med hele det låste 1672×941-landskapet. Ingen feil i PNG-en eller karaktervalget.

Kun under eksisterende mobile layout `@media(max-width:700px)` skaleres **storesøster alene** til 13,2 % bred / 43,5 % høy; `left:55.5%`, `bottom:12.5%`. Figurens horisontale midtpunkt endres nesten ikke, hun forblir på den nedre steinbroen, og alle tre malte hyttenavnene og Tallvika-skiltet ligger uforandret i samme ukroppede master. Andre troll beholder helt uendret CSS og originalbilder; alle læringsmotorer, lagring og kontroller er uberørt.

Ny eksakt-HEAD Chromium+WebKit-test inkluderer nå også 320×568 kompakt iPhone i tillegg til 390×844 og større skjermstørrelser; geometriske forhold sjekker at storesøsteren faktisk blir større uten å flyttes over hytteskilt og at føttene fortsatt står på stien. Testsuiten produserer faktiske skjermbilder for visuell kontroll.

**Stoppunkt:** Dette er kun kode-/layoutpilot, ikke endelig visuell godkjenning. Ikke merge/publiser før reelle bilder er gjennomgått og brukeren har godkjent. Issue #221 for separate anatomiske illustrasjonslag/ekte rigging gjenstår uendret.

## 26.10.2026 – Karaktervelger og scene viser samme Storesøster

Karaktervelgeren bruker nå `item.sceneSrc` for alle tre valg. Resultatet er en eksakt forhåndsvisning av figurens Tallvika-utseende, inkludert brukerens godkjente maleriske storesøster. Uendrede kildefiler beholdes i `item.src`, og ingen bildepiksler eller karaktergeometrier er endret. De to andre trollene bruker sine låste originalbilder i både velger og scene.

Chromium/WebKit-QA kontrollerer de tre bildefilstiene, dekoding, minst 44×44 px trykkflate, og lagret valg på mobil og iPad. Ved skjermbildekjøring tas også bilde av velgeren. `tallvika.js` har fått separat cacheversjon. Ingen endringer i matematikk, profilformat eller navigasjon; rigging krever fortsatt originale illustrerte kroppslag, issue #221.
