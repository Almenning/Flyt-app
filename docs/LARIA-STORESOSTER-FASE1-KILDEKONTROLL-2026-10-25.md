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


## Fase 1.2: presisjonskontroll av fingre og illustratøroverlevering (25.10.2026)

**Implementert på draft-gren – ikke i barnets app:** `tools/rigging/storesoster_art_handoff_v2.py`. Kildeidentiteten og alle seks originalfiler er uendret.

Den opprinnelige armmasken tok ikke med alle fingertuppene som krysser belte og grønt blad. Den etterlot en synlig «spøkelseshånd» i underlaget ved armrotasjon. V2 gjør en **begrenset kildefargebasert maskekorreksjon på 454 piksler** i håndområdet, uten noen ny illustrert figur. V2-masken må fortsatt kontrolleres visuelt av illustratør før rigging.

Den nye **OpenRaster (.ora)**-leveransen inneholder 10 ekte redigerbare lag: låst fullfigur som skjult referanse, pivot- og hullguider, bevegelig kildearm, **fire separate TOMME male-lag** (hår, erme, kjole, midje), originalkropp og skjult farge-/materialguide. Materialfargene er hjelpelag og er IKKE ferdigmalte klær eller hud.

**Kontrollresultat på source-HEAD `91f61f8`:**
- Neutral (0°): **null endrede synlige RGBA-piksler** og eksakt fullpiksel likhet mellom original og sammensatt figur.
- Original armmaske: 11 502 kildepiksler. Revidert maske: +454 gjennomgåelsespliktige fingertuppiksler.
- Umalte områder ved armbevegelse: −25° **4 960**, −12° **2 494**, 0° **0**, +12° **2 503**, +25° **4 976** piksler.
- [Kilde- og kunsteksport CI: BESTÅTT](https://github.com/Almenning/Flyt-app/actions/runs/40191085397).
- [Last ned GitHub Actions-pakke](https://github.com/Almenning/Flyt-app/actions/runs/40191085397/artifacts/12598466032) med `.ora`, originale kildepiksler, 5 faktiske poseutsnitt, materialguide og maskinlesbar rapport.

**Visuell dom:** Masken er bedre presisert og dokumentasjonen er produksjonsklar som **illustratørbrief**. Den er ikke et ferdig animert skogstroll. Automatisk motivutfylling ble testet separat, men skapte smurt pels/hår/stoff og rester av fingre; den ble **forkastet og ikke integrert**.

**Videre port:** Rekonstruer faktisk skjult hår, skulder og stofflag bak originalarmen, kontroller naturlig ledd og hånd i alle fem stillinger. Ansikt/hår/klær/proposjoner må forbli eksakt godkjent i nøytral visning; enhver ny malt skulder er en egen visuell godkjenning. **Fase 1 fortsatt BLOKKERT. Ingen fase 2, merge eller publisering.**


## Fase 1.3: avgrenset 2D-pikselmesh – ikke et godkjent animasjonslag (25.10.2026)

**Faktisk funn:** Å rotere hele den utskilte armen med ett skulderpivot gir synlige hull og urealistisk hud, hår og klesstoff selv med klonet/Poisson-utfylt underlag. Kildebaserte utfyllingsforsøk ble **visuelt forkastet** og ikke innført som appkunst. En alternativ oppdeling med albuerotasjon ga synlige skjøter og dobbelt hånd/fingre og ble forkastet.

**Ny isolert teknisk prototype:** `tools/rigging/storesoster_local_mesh_feasibility.py` deformerer et **begrenset, vektet område av de godkjente 512×1024 originalpikslene**, uten å skille ut huden fra skyggen eller male nytt ansikt. Et lite ansiktsområde kan komprimeres vertikalt for blunk; hånden kan beveges forsiktig (maks kontrollert kildepikselforskyvning: 14,44 px i prøve). Den originale stillingen returnerer alle RGBA-piksler byte-ekvivalent etter dekoding og nøytral koordinatavbildning. Dette er **ikke** et substitutt for fullstendig kroppsdelsrigging.

**Maskintest på eksakt commit `139f240`:** [Laria Storesoster Phase 1 source & mesh QA](https://github.com/Almenning/Flyt-app/actions/runs/40192937670) BESTÅTT. [Video, V2-OpenRaster og manifest fra faktisk CI](https://github.com/Almenning/Flyt-app/actions/runs/40192937670/artifacts/12598767294). 174 videobilder ved 16 fps viser nøytral positur, blunk og avgrenset hånd-/armmikrobevegelse. Videoen er **rendret i Python/OpenCV**, ikke tatt fra fysisk iPad/iPhone eller WebKit. WebGL-visning kunne ikke verifiseres i det lokale begrensede nettlesermiljøet.

**Visuell og funksjonell konklusjon:** Lokal meshbevegelse er lovende for blunk, pust og små reaksjoner, men **full vinking og naturlig jubel er fortsatt IKKE bestått**. For store avvik forvrenges håndens anatomi; de opprinnelig manglende skulder-/stoff-/hårlagene er ikke ferdigmalt. De fem kravene i mesterplanen kan dermed ikke merkes godkjent. Ingen endring i aktiv Læria-app eller Gangemagi. **PORT 1 BLOKKERT.**

**Videre:** Behold mikrobevegelse som en separat mulighet, men prioritér originaltro malte skjulte lag og hånd-/armledd i anatomisk riktige stillinger. Ikke slipp neste fase eller endre kravene bare fordi små bevegelser ser greie ut.
