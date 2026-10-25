# Læria – Fase 1: kildekontroll og produksjonsgrunnlag

Dato: 25.10.2026. Styrende plan: LARIA-TALLENGA-MESTERPLAN-2026-10-25.md.
Arbeidsgren: draft PR #220. Ingen appendringer, ingen visuell godkjenning eller publisering.

## Faktisk kildefunn

Den gamle antakelsen om at det bare fantes små, flate trollillustrasjoner i GitHub er tilbakevist.

**Nøytrale 512 × 1024 WebP-kilder**, importert byte-for-byte fra PR #208:
- laer-litt-mer/assets/gangemagi-troll/storesoster.webp – Git blob a8fba47e272e2856bd78b92fb262146506e828ed
- laer-litt-mer/assets/gangemagi-troll/lillesoster.webp – Git blob 37fd94b3d0fd5319db05e4d1aea609e96d69351f
- laer-litt-mer/assets/gangemagi-troll/lillebror.webp – Git blob fcf59aad90e0c9dacca025d76cd352a924ef7120

Disse har samme figurer og nøytrale positurer som prosjektbibliotekets PNG-originaler (storesoster.png, lillesoster.png, lillebror.png, også 512 × 1024). **Eksakt pixel-paritet med PNG er ennå ikke verifisert**: PNG-ene kunne åpnes og inspiseres i biblioteket, men rå PNG-bytefiler kunne ikke overføres til kodearbeidsmiljøet. WebP kan også avvike i farger og kanter etter tapskomprimering.

**Annen posefamilie**, allerede låst i PR #220, men IKKE utbyttbar som nøytral kilde:
- laer-litt-mer/assets/skogstroll/storesoster.webp – 271 × 420, armene mer frem/ut
- laer-litt-mer/assets/skogstroll/lillesoster.webp – 281 × 420, åpen/hoppende positur
- laer-litt-mer/assets/skogstroll/lillebror.webp – 304 × 420, peker

Begge posefamilier er beholdt uendret og byte-låst. Ingen av dem inneholder malte/isolerte anatomiske lag i bildefilen.

## Eksisterende lagarbeid gjenbrukt fra PR #208

Følgende filer er importert i PR #220:
- tools/rigging/storesoster_arm_layer_study.py
- tools/rigging/storesoster_openraster_layers.py
- tools/rigging/storesoster_pose_lab.py
- tools/rigging/storesoster_art_integrity.py
- tests/test_storesoster_openraster_layers.py
- tests/test_storesoster_pose_import.py
- tests/test_storesoster_art_integrity.py
- docs/LARIA-STORESOSTER-ARMLAG-STUDIE-2026-10-25.md

Faktisk arbeid utført i PR #208: Armen til den nøytrale storesøster er maskert ut fra eksisterende kildepiksler og lagt som eget originalt lag. OpenRaster har **seks redigerbare lag** inkludert original, kropp bak armen, originalarm, HELT TOMT lag for skjult anatomi, gap-guide og skulderpivot. Ved 0° beholdes kildens synlige piksler. Ved ±12° og ±25° dokumenteres flere tusen eksponerte hull. Dette er konkret tegnearbeid som fortsatt mangler.

Det finnes videre eldre ZIP- og ORA-pakker i Project Library, blant annet Laria_Storesoster_Originaltro_Armlag_IKKE_GODKJENT.ora, Laria_Storesoster_Editable_Art_Source_PR208_8a0bffe.zip og Laria_Storesoster_Originaltro_Kunstlag_Kontrollert_e1ee5ba.zip. Disse er undersøkt gjennom metadata og eksisterende forhåndsvisninger, men kan ikke importeres som råfiler fra denne prosjektkoblingen. Den reproduserbare Python-kilden i PR #208 brukes derfor istedenfor å gjette.

## Reproduserbar kontroll

GitHub Actions: .github/workflows/laria-storesoster-fase1.yml.
Den kontrollerer begge referansefamilienes Git-blob-SHA, bildepikslenes dimensjoner, nøytral komposisjon, kildeintegritet og at malerflaten faktisk er uferdig. Den produserer en redigerbar .ora-fil, maskeguides, bevegelsesbilder og maskinlesbar kildeprotokoll som nedlastbare artefakter.

Kjøringene er tekniske godkjenningsporter, ikke attest på visuell premiumkvalitet. Det er eksplisitt forbudt å integrere nåværende hull, testteksturer eller pseudo-rigging i barnets app.

## Neste leveranse før Fase 1 kan bestås

1. Rekonstruer skjult skulder, kropp, hår og lilla kjolestoff bak armens nøytrale positur i det TOMME OpenRaster-laget. Ingen synlige ansikts-, kles- eller proporsjonsendringer.
2. Se fem faktiske positurer (0°, −12°, +12°, −25°, +25°) uten hull, urealistiske armledd, feil håndledd eller synlige sømmer.
3. Fullfør kvalitetsgodkjent større riggstruktur for hode, hår og blink. En arm alene er ikke en levende premiumfigur.
4. Få eksakt godkjenning mot originalfiguren og bevis på faktisk animasjon på Safari/WebKit iPad/iPhone før integrasjon i Gangemagi.

**PORT 1: BLOKKERT** frem til punktene er oppfylt. **Ikke merge, ikke publiser.**
