# LÆRIA – BRØKLAB: VISUELL RESET / IKKE GODKJENT

**Dato:** 24. oktober 2026
**Sak:** PR #211 (utkast). Brukeren har eksplisitt avvist den implementerte visuelle løsningen som svært langt fra avtalt illustrert opplevelse.
**Status:** AVVIST SOM DESIGN / IKKE KLAR FOR MERGE ELLER PUBLISERING.
**Gjelder:** Presentasjonslag, scenekomposisjon og spillopplevelse. Dette opphever **ikke** kravene til korrekt brøkmodell, lagret fremgang og eksisterende aktiviteter.

## Hvorfor PR #211 ikke oppfyller avtalen

Gjennomgått faktisk WebKit-bilde `broklab_pr211_headd355_qa/ipad-landscape-safari-01-home.png` opp mot konseptene `brøklaben_magisk_brøkkakeverksted.png` og `brøklaben_i_skogsverkstedet.png`, samt brukerens senere beslutninger om Skåla og eksakte skogstroll.

1. **Død komposisjon:** Nåværende grensesnitt er en vertikal samling paneler med flat fjordgrafikk bak. Avtalt var et sammenhengende, varmt, eventyrlig bakeriverksted, hvor UI inngår i miljøet.
2. **Feil kvalitetsnivå:** Skåla, tårn og fjord fremstilles som enkle geometriske SVG-flater. Det ligner ikke det rike, illustrerte og romlige universet i konseptene.
3. **Kaken er fortsatt skjematisk:** Diagram med fyllfarger og dekor er ikke et fysisk kakestykke som løftes, bæres og legges på plass. Det skal være den tydelige, taktile hovedaktiviteten.
4. **Trollene er klistret på:** En liten figur står isolert til høyre uten meningsfull visuell relasjon til kaken. Den avtalte figuren skal oppleves som en levende medspiller, ikke en profilmarkør.
5. **Kontrollene ser ut som webkomponenter:** Brøktall, prosent, bitbrett, oppdrag og +/- er egne kort, ikke en del av trebenk, skilt og rekvisitter.
6. **Manglende scenedybde:** Lite mellomgrunn, forgrunn, tekstur, lyssetting, blomster, bakeriredskaper og bevegelige rekvisitter som gir faktisk eventyrfølelse.

**Konklusjon:** Flere CSS-overstyringer på eksisterende DOM er ikke løsningen. Avvisningen gjelder **arkitektur og art direction**, ikke bare farger, avrundinger eller avstander.

## Ny ufravikelig visuell kontrakt

### Opplevelsen
- Brøklab er et **spillbart magisk bakerverksted** i Lærias norske eventyrunivers, ikke en matematikk-app foran et landskapsbilde.
- Barnet går direkte inn i leken. **Stor, fysisk kake** skal dominere og forbli forståelig, manipulerbar og faglig korrekt.
- Ett av de **tre eksakt låste småtrollene** er aktiv medspiller om gangen. Storesøster, lillesøster og lillebror må bruke sine ekte godkjente filer og originale ansikter/klær. Andre troll kan dukke opp ved frivillige små hendelser, men ikke konkurrere om fokus.
- **Skåla** skal tegnes som gjenkjennelig fjell med tårn basert på fotoet brukeren har gitt. Det er en levende del av utsikten fra verkstedet, **ikke** ett statisk helskjermsbilde eller en generisk trekant.
- Varme treflater, varm belysning, glasskrukker, bakeutstyr, blomster, bladverk og håndlagde skilt skal være integrert i scenen. Unngå steril, beige paneletikk.

### Implementasjonsarkitektur
1. Bygg en **ny isolert visuell scene-komponent**, ikke et nytt lag med CSS-overstyringer på `.fr5-` / `.fr6-` / `.fr8-`. Den gamle matematikkmotoren, lagring og navigasjon **gjenbrukes**.
2. Høyoppløselige **illustrerte ressurser etter felles art direction**: adskilte bakre/midtre/fremre dekorlag, romlige rekvisitter, trebenk, skilt, eventyrlige landskap og fysisk kakemateriale. Unngå ett flatt ferdigdesignet poster-bilde som får usynlige knapper lagt oppå.
3. **Interaktiv sektor-/brikkemodell** via SVG eller Canvas: matematisk korrekte enkeltbiter, egne klikkflater, dra-og-slipp med synlig løft, tilbakemelding ved plassering, brøktall synkronisert med faktisk volum og merking. Alle biter må ha eksakt sektoridentitet. Ikke falske rekvisitter.
4. Skiltet med 1/4, kontrollene, brett og misjonsoppdagelse er **fysiske objekter** integrert med scenen, ikke separate store hvite/beige kort.
5. **Responsiv komposisjon designes separat** for iPad landskap, iPad portrett og iPhone. På mobil er kaken, tallbrøken og +/- for fylte deler og like deler synlige uten scrolling. Bevar 44 px berøringsmål.
6. Ha tilgjengelig semantisk HTML, støtte for redusert bevegelse, trykk og tastatur. Miljøeffekter skal ikke stjele interaksjon, blokkere touch eller re-rendres for hver brøkendring.
7. Ikke fall tilbake til generisk revefigur eller nygenererte variasjoner av trollene.

### Slik skal en scene spille
1. Ved åpning ser barnet tydelig **1 av 4 kakestykker**, en aktiv skogstrollvenn, kakestykkebrett og et tre-/pergametskilt med **1/4**.
2. Ved trykk på en del løftes/legges en **fysisk visualisert kakebit** inn eller ut; brett og kakemodell endrer samme sektor samtidig; tallet skifter **umiddelbart**.
3. Barnet kan frivillig velge `Prøv en halv` og oppdage `2/4 = 1/2` gjennom **to faktiske like store visuelle mengder**. Oppdrag kreves aldri.
4. Trollvennen reagerer kort og relevant uten å dekke kaken eller avbryte.
5. Barnet kan fortsette å bygge, endre oppdeling, utforske, sammenligne og vende tilbake uten å miste progresjon.

## Kontrollporter – IKKE erklær 'ferdig' før alle er bestått

**Port A – Illustrert komposisjon:** Ferdig iPad landskapsscene vurderes opp mot låst uttrykk. Designet kan avvises uavhengig av tester. Må inneholde rikelig illustrert miljø med tydelig scenedybde og troverdig Skåla.

**Port B – Spillbarhet:** Interaktiv kake med faktisk stykkeflyt, korrekt matematikk, naturlig troverdig feedback. Ingen statisk bildefasade med gjennomsiktige knapper.

**Port C – Mobil/iPad:** Reelle Chromium + WebKit skjermbilder for iPhone liten/normal/liggende og iPad stående/liggende. Ingen horisontal overflow; kake + brøktall + begge +/- grupper i første viewport.

**Port D – Innholdsregresjon:** Bevar de sju eksisterende modusene, faktiske oppdagelser, fri lek, data, opplesning, navigasjon og øvrige app-funksjoner. Alle brøksvar og representasjoner korrekte.

**Port E – Brukergodkjenning:** Vises som faktiske app-skjermbilder, **ikke** nye mockups presentert som implementering. Ingen merge/publisering før eksplisitt godkjenning.

## Instruks for PR #211

- Behold denne PR-en i **draft**. Kodearbeidet inneholder nyttig matematikk/testgrunnlag og låste bildedata, men **dagens visuelle løsning er avvist**.
- Slutt å telle CSS-patch, antall commits, grønne tester og grafiske smådetaljer som fremgang mot den avtalte premiumscenen.
- Før neste visuelle utviklingsrunde: etabler et eget illustrert scenesystem og en faktisk spillbar 'vertical slice' i ny struktur. Presenter deretter **faktisk** WebKit-skjermbilde fra iPad.
- Ikke opprett parallell PR eller flett til main uten behov/uttrykkelig beslutning.
