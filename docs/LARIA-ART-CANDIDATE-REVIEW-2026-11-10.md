# Læria Premium 2.0 – faktisk bildekontroll 10. november 2026

**Beslutning: BEGGE NYE RETUSJERINGSKANDIDATER AVVIST SOM FERDIG PREMIUMKUNST.**
Denne beslutningen gjelder visuell kvalitet. De originalt låste bildene, TrollActor og barnas data skal fortsatt ikke endres.

## Sporbare filer og tester

- PR: [#243](https://github.com/Almenning/Flyt-app/pull/243), fortsatt utkast.
- Pixel- og modellkontroll: [Actions run 42896755492](https://github.com/Almenning/Flyt-app/actions/runs/42896755492) **success**.
- [Artefakt 13801021774](https://github.com/Almenning/Flyt-app/actions/runs/42896755492/artifacts/13801021774), «laria-lama-REVIEW-ONLY-b7886f03fc395f8926a0f2a820061b0119bea200». Arkivet inneholder råutkast, edit-masks, én sammenligning per motiv, native før/etter-detaljer for hvert UI-område og maskinrapporter. Utkastene er aldri blitt aktivert i appen.
- Genereringskode: commit `b7886f03fc395f8926a0f2a820061b0119bea200`. Første kjøring stoppet riktig fordi Kinnaklova-maske berørte noen piksler utenfor whitelist; feilen er rettet og nå automatisert kontrollert.

## Objektive verifikasjonsresultater

| Motiv | Låst original SHA-256 | Kandidat SHA-256 | Original utenfor maske | Størrelse |
| --- | --- | --- | --- | --- |
| Grovanova | `246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5` | `fd563e946c4102f2d0d360063628f35144a45796b3216d585cf543cc1def1255` | **0 piksler endret** | 1366 × 1024 |
| Kinnaklova | `d2e2d37b4c54191383457f423c1d568cd538391046e79e6f66e7a8b1928c0e57` | `ee3b44519711548bfbfce7f294642b8b8a3b4019fc6016ef72bdbfa4334899a8` | **0 piksler endret** | 1672 × 941 |

Teknisk integritet er bestått. Dette er **ikke** det samme som godkjent illustrasjon eller design.

## Visuell gjennomgang av reelle før/etter-bilder

### Grovanova: P0 – IKKE bruk

- Utvidet 4:3-lerret får en mørk, unaturlig bred stripe øverst og avvikende sidefelter.
- Fjerning av gamle kort, skilt og de tre innmalte figurene har etterlatt store uklare/utsmurte vegetasjons- og fjellområder.
- Opprinnelige fjell-/fjordpiksler utenfor tillatt maske er riktignok bevart, men utfyllingen oppfyller ikke Grovanova-fasitens detaljnivå. Ikke løs med en ny fargegradient eller et overliggende skjermbilde.
- **Kunstoppgave:** Manuell originaltro utvidelse av himmel, fjellsider og forgrunn innenfor tillatt område og ny naturlig 4:3-komposisjon; alle UI-malede kort, logoer og figurer fjernes, mens funksjonelle Læria-komponenter bygges av DOM.

### Kinnaklova: P0 – må finretusjeres

- Gammel innmalt topp-logo og Words/Sentences/Reading-skilt er fjernet i forslaget.
- Det finnes fortsatt påfallende retusjfelt i øvre himmel/fjellkant, ved den tidligere Words-plasseringen rundt kirkeforgrunnen, ved Sentences i strand/gress-sonen og ved Reading i høyre vegetasjon.
- Kinnaklova-fjellene og Kinn kyrkje er kildebeskyttet, men overgangene inn i retusjerte felter er ennå ikke naturlige nok til en kommersiell premiumapp.
- **Kunstoppgave:** Retusjer bare feilfeltene fra native-kontaktarkene med kontinuerlig gress, himmel, strand og detaljer; bruk den låste originalen som tekstur- og landskapsfasit.

## Kontroll før eventuell aktivering

1. Ny ren kandidat med nøyaktig samme låste fjell, kirke, fjord og kyst leveres som **separat ny fil**, aldri over original.
2. `python tools/laria_release/verify_clean_candidate.py --world grovanova --candidate <kandidat.png> --offset-x 119 --offset-y 171` eller `--world kinnaklova --candidate <kandidat.png>` må godkjenne kildefidelitet.
3. Før/etter-opptak i faktisk app på **iPad 1366 × 1024 og 1024 × 1366** må vise én samlet venstre to-stolpe-skiltramme, én høyre fagplakett, Læria-logo og bare valgt levende originaltroll. Kontroller WebKit og Chromium.
4. Bilder uten synlige retusjspor, dobbeltmenyer, uregelmessige sidefelter eller uskarpe landemerker legges frem for produkteier til **uttrykkelig visuell godkjenning**. Inntil da: `clean=null`, `ownerApproved=false` i release-manifestet.
5. Ingen merge, deploy eller publisering av PR #243 før alle låste godkjenningsporter og reell barnetest er bestått.

**Konklusjon:** Big-LaMa har bevist at maskebeskyttet eksport er mulig og kan fjerne gammelt UI, men denne modellteknikken alene er ikke tilstrekkelig for sluttnivå. Bruk rapportens detaljer som konkret kunstnerbrief; ikke la grønn masketest utløse automatisk bildeaktivering.
