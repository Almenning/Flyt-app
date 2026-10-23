# Læria / Gangemagi – låst premiumillustrasjon og implementeringskontrakt

Dato: 23. oktober 2026
Status: **Brukergodkjent visuell retning.** Dette er en designbeslutning, ikke bevis for at designet allerede er implementert.

## Låst referanse
Illustrasjonen som skal brukes som primær visuell referanse er **den spillbare Tallenga-markedsscenen** fra samtalen 23.10.2026: det brede bildet med Læria/Gangemagi øverst, skogs-/markedsmiljø, barnets rev til venstre, tre flettede kurver på en trebod, stor jordbærkasse i forgrunnen, gyllen markering av valgt kurv, matematikkfelt på treplater og små, rolige kontrollknapper.

Originalt lokalt referansefilnavn i ChatGPT-samtalen: `wide_colorful_high_detail_3d_illustration_scene.png`.
Dimensjoner: 1448 × 1086. SHA-256: `e5cc3e84e4db58707b39d5d8c84a12cd840868f5e533e68abbcbd307e5fc19ff`.

**VIKTIG:** PNG-filen er ikke lagt inn som binær ressurs i GitHub ved denne dokumentasjonsoppdateringen. Når et utførende verktøy skal sammenligne visuelt, må godkjent PNG vedlegges arbeidsøkten. Ikke erstatt den med generiske infografikker, skjermbilder fra andre spill eller tidligere alternative design.

## Visuelle føringer (låst)
1. Ett sammenhengende **premium 2.5D-spillmiljø**: solbelyst, levende Tallenga-marked med vakre materialer og dybde, ikke et dashboard fullt av løsrevne kort.
2. **Barnets faktiske valgte Læria-rev** fra eksisterende profil/fox-system, ikke den noe annerledes reven som bildemodellen har malt inn i konseptet. Samme identitet i alle spillmoduser.
3. Tre store, tydelige, faktisk interaktive flettede kurver i hovedscenen (antallet endres med oppdraget). Marker valgt eller gyldig drop-mål med varm, diskré glød.
4. En tydelig, illustrert **jordbærkasse som fysisk kilde**. Bær kan dras fra kilden til kurv, alternativt trykk på bær så kurv; eksisterende trykk/fjern/angre/tilgjengelighet beholdes. Ikke gjeninnfør generisk stor "legg til"-knapp.
5. Barnets handling, kurvene og jordbærkilden er sentrum. Oppdragssetningen er lettlest på én tavle. Reven er ledsager, ikke et overlappende UI-hinder.
6. Mattefeltet kobles direkte til **faktisk tilstand**: Eksempel i låst bilde er 3, 2, 0 bær = `3 + 2 + 0 = 5`, med mål `3 × 3 = ?`. Ikke vis `3 × 3 = 9` som fullført før alle tre kurver faktisk inneholder tre bær. Når oppdraget er fullført, vis både `3 + 3 + 3 = 9` og `3 × 3 = 9`.
7. Sekundære kontroller (Hint, Angre, Fri lek, Markedsbok, Gangetabellen) er funksjonelle, lesbare og nedtonet. Ikke legg til flere menyer, lærer-dashboard, aggressive belønninger eller adaptiv tvangsgating.
8. iPad liggende er hero-komposisjon. iPad stående og iPhone portrett/landskap må være gjennomtenkte **egne responsive komposisjoner**, ikke bare et krympet stort bilde.

## Pedagogiske kvalitetskrav
- Første handling skal være forståelig uten lang instruksjon. Barnet skal faktisk kunne flytte et jordbær og se umiddelbar konsekvens.
- Grupper, antall, addisjon og multiplikasjon må alltid være korrekte og synkrone.
- Ikke forveksle mange plukk med dokumentert læring: la barnet oppdage grupper og mønstre ved å leke. Visualiser aha-øyeblikket uten automatisk å gi fasiten for tidlig.
- Behold frivillig gjentakelse, fri lek, åtte eksisterende oppdrag, personlig rev, blomster, Markedsbok, 10×10-tabell og lagret progresjon.
- Ved fullføring av oppdrag 8: ikke send barnet overraskende automatisk tilbake til oppdrag 1. Tilby en meningsfull samlings-/markedsfeiring med valg om fri lek/gjenta et favorittoppdrag. Eventuelle endringer i denne opplevelsen skal testes særskilt.
- Ikke innfør nytt nivåløp, skole-dashboard eller sosial konkurranse som vilkår for mestring.

## Hva implementeringsarbeidet er – og ikke er
**Oppdrag:** Oppgrader faktisk spillbart HTML/CSS/JS i `Almenning/Flyt-app` til en sammenhengende premiumillustrert scene i retning av referansebildet. Jobb i en ny, avgrenset PR fra nyeste `main`. Ikke kopier statisk PNG inn som spillbakgrunn med usynlige knapper. Bruk originale lagdelte ressurser og reelle DOM-interaksjoner.

**Ikke:** ny omfattende arkitektur, nye urelaterte spillaktiviteter, flere overlappende PR-er, regresjoner i andre Læria-fag, eller selvpåstander om premium uten skjermbilde- og brukerkontroll.

## Akseptansetest
1. Visuel sammenlikning **side ved side** med vedlagt godkjent PNG i oppdrag på iPad liggende.
2. Ekte Playwright WebKit- og Chromium-skjermbilder av tomt, delvis fylt og fullført oppdrag på iPad liggende/stående, iPhone 390×844, 320×568 og kort landskap.
3. Hovedinteraksjoner: dra, trykk/trykk, fjern, ugyldig slipp, full kurv, angre, hint, opplesning, retur, fri lek, personlig gutt-/jenterev, lagring og alle åtte oppdrag.
4. Matte-invarianter og førsteskjerm: aktiv kurv + synlig plukkekilde + matte er forståelig og berørbar, ingen tekstklipp, overlapper eller ubegrunnet scroll.
5. CI på eksakt HEAD, ingen publisering eller merge før visuell kontroll er utført og dokumentert. Rapporter eksplisitt hva som ennå avviker fra bildet.

**Referansehierarki:** Denne nye brukergodkjente premiumillustrasjonen styrer komposisjon og visuell kvalitet. Tidligere låste spillregler for direkte dra/plukk, presis matematikk, barnets faktiske valgte rev og Lærias frivillige læringsfilosofi går foran detaljer i den statiske illustrasjonen.
