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

Formålet er å dempe hudglans og fotorealistisk mikrotekstur uten å late som vi har en ny, godkjent karaktertegning. Kilden beholdes alltid som `src` i karaktervelgeren; bare Tallvika-scenens storesøster bruker den dokumenterte avledningen.

## Sceneintegrasjon

Den tidligere figuren stod på `left:64%`, `bottom:7%`, med en svært stor høyde (`46%`) og over vann/bygninger. Piloten flytter henne til den solbelyste nedre stien (`left:58.1%`, `bottom:14.7%`) med `31.4%` scenehøyde. Scenelaget tilfører bare:

1. En myk, ellipseformet kontaktskygge direkte under skoene.
2. Retningsriktig, kort kastskygge og svak dagslysdemping.
3. Ingen CSS-maskering av ansiktet, ingen nye lemmer og ingen kunstige hår/skjøter.

Dette er bevisst ikke en «filter-stabel» som forsøker å skjule en dårlig figur. Den strukturelle utbedringen er kildeavledet materialtilpasning, korrekt perspektiv og forankring på synlig terreng.

## Lagret valg og avgrensning

`profile.tallvikaTroll` er fortsatt den eneste lagrede Tallvika-velgeren. Tallvika presenterer alle tre originalene i velgeren. Når verdien er `storesoster`, bruker scenen `storesoster-inworld-v1.webp`; de to andre bruker sine originale WebP-filer uten visuelle endringer. Matematikk, aktiviteter og progresjon er ikke endret.

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
- Nettleserpakken er klargjort for Chromium og WebKit i iPhone/iPad stående og liggende, inkludert test av lagret trollvalg.
- Testen lager, når den kjører i CI, en faktisk før-/etter-sammenligning i nøyaktig samme Tallvika-komposisjon ved å vise den låste originalen én gang og deretter gjenopprette den kildeavledede sceneversjonen. Den lager også eget helbilde og nærstudie av storesøster. Artefaktet heter `laria-tallvika-<sha>`.
- Den aktuelle arbeidscontaineren mangler Playwrights Chromium/WebKit-binærer. Installasjonsforsøk feilet fordi nedlastingen ble avbrutt/ugyldig. Derfor finnes det **ikke** påståtte browser- eller fysiske iOS-skjermbilder fra denne kjøringen.
- Ingen fysisk iPhone/iPad/Safari-test er gjort eller påstått.

## Visuell beslutning

**Anbefaling: Ikke godkjenn eller rull ut til de to andre ennå.** Piloten er et reelt, reversibelt sammenligningsgrunnlag som reduserer de konkret påviste problemene (for stort ansikt, feil dybde og manglende kontakt med bakken), men brukerens visuelle vurdering av faktisk Tallvika-render må fortsatt være godkjenningsporten. Den erstatter ikke behovet for framtidige illustratørlag før ekte figuranimasjon.
