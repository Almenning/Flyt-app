# Grovanova iPad-portrett: kontrollert integrering

Status 18. november 2026: **begge UI-frie bildekonseptene er visuelt godkjent av produkteier, men ikke importert eller aktivert**. Faktiske iPad-appskjermbilder gjenstår.

`home-kjosnes-v15.js` leser bare den sperrede manifestfilen
`assets/home-v15/grovanova-ipad-portrait-master.json`. Den er inaktiv til alle
feltene nedenfor er oppfylt. Dagens SHA-låste telefon-/iPad-bilder er uendret
fallback.

## Hva kunstleveransen må inneholde

| Felt | Krav |
| --- | --- |
| Fil | Egen UI-fri Grovanova-portrettfil under `assets/home-v15/` |
| Kilde | Geografisk korrekt, visuelt godkjent master; ikke AI-konseptbilder |
| Størrelse | Minst 2048 × 2732 px for distribusjonsfilen; arbeidsmaster 3072 × 4096 px anbefales |
| Integritet | SHA-256 for akkurat eksportert fil |
| Innhold | Samme låste Kjøsnesfjorden/Grovanova-identitet, men ingen logo, tekst, skilt, navigasjon, innmalt troll eller annen UI |
| Frisoner | Fire skilt, reise, bunnnavigasjon, vokseninngang, live-hilsen og tre diskrete lys-/vannflater må markeres som normaliserte `[x,y,bredde,høyde]`-ankre |

## Aktiveringsrekkefølge

1. Eier godkjenner den faktiske portrettmasteren visuelt mot den låste kunstspesifikasjonen.
2. Legg den godkjente eksporten til `assets/home-v15/`; behold alle eksisterende mastere.
3. Fyll ut manifestet med `status: 'approved'`, relativ filsti, SHA-256, faktiske pikseldimensjoner og UI-ankergruppene.
4. Ta iPad-portrettskjermbilder og verifiser at kontrollene ligger i frisonene. TrollActor skal fortsatt bli rendret av appen, ikke fra bakgrunnsfilen.
5. Kjør Home-art, iPad, full Læria-QA, smoke og iOS-build på den konkrete filen. Først deretter kan en separat, godkjent PR vurderes.

## Teknisk kontroll før aktivering

- Nettleseren henter kandidatens faktiske bytes, beregner SHA-256 med WebCrypto
  og dekoder den verifiserte Blob-en. SHA-mismatch eller feil pikseldimensjon
  faller tilbake til dagens låste portrettkilde.
- CI kjører samme manifestregler med Node og tester en bevisst merket,
  midlertidig `TEST FIXTURE ONLY`-ressurs. Testressursen ligger aldri i
  `assets/`, kan aldri stå i produksjonsmanifestet og kan ikke forveksles med
  kunstleveransen.
- UI-anker må ha positiv bredde/høyde og ligge fullt innenfor `[0,1]`.
- Ved aktivert master tegnes faktisk SVG-logo, fagskilt, reisehandling,
  bunnnavigasjon og vokseninngang av DOM/CSS; ingen av disse forventes malt i
  bakgrunnsfilen.
- PR #254s separate, dekorative båter er ikke en del av denne porten. Før den
  PR-en eventuelt kombineres med en godkjent portrettmaster, må båtene få egne
  godkjente vann-ankre i samme manifest; ellers skal de ikke vises i aktivert
  portrett.

## Sikkerhetsatferd

Porten kan bare åpnes på iPad i stående orientering. Mangler godkjenning,
filsti, SHA-256, minimumsmål, frisoner eller samsvar mellom registrerte og
dekodede dimensjoner, bruker appen den eksisterende rene, låste
portrett-fallbacken. Liggende iPad og iPhone berøres ikke.

## Samordnet integrering for begge iPad-retninger

PR #255 har nå **to helt separate, deaktivert-godkjenningsporter**:

| Retning | Manifest | Minimum | Status |
| --- | --- | --- | --- |
| Stående 3:4 | `assets/home-v15/grovanova-ipad-portrait-master.json` | 2048×2732 | Avventer fysisk fil og faktisk app-aksept |
| Liggende 4:3 | `assets/home-v15/grovanova-ipad-landscape-master.json` | 2048×1536 | Avventer fysisk fil og faktisk app-aksept |

Den eksakte godkjente kilden, SHA-256-verdiene og de foreslåtte, **separate** UI-frisonene ligger i `docs/LARIA-GROVANOVA-APPROVED-CANDIDATES-2026-11-18.json`. Disse koordinatene er forhåndsdefinerte for test og må godkjennes etter faktisk visning i iPad, ikke bare ved kodegjennomgang. Begge bildene er fremdeles **utenfor GitHub** inntil importen er gjennomført.

**Import og kontroll når bildefilene er tilgjengelige i kodearbeidsområdet:**

```sh
node tools/laria_grovanova_import_approved.cjs /sti/til/utpakket/Grovanova
node tools/laria_grovanova_import_approved.cjs /sti/til/utpakket/Grovanova --stage
node --test tests/laria-home-ipad-dual-approved-art.test.cjs
```

Første kommando kontrollerer filbytes og størrelse uten endring. `--stage` legger nøyaktig to eksporterte bildefiler i `assets/home-v15/` og skriver **inaktive** manifester (`awaiting-app-screenshot-approval`). Ingen CLI-kommando kan sette `status: approved`.

**Aktivering er en separat eiergodkjent handling etter faktisk skjermkontroll.** Etter bildekopiering må faktiske WebKit- og Chromium-skjermbilder tas for minst 820×1180, 1024×1366, 1180×820 og 1024×768, og UI-områdene sammenlignes med godkjent uttrykk. Manuell endring av manifeststatus fra inaktiv til `approved` er først aktuelt etter godkjent app-visning og grønn exact-head QA.

Ved manglende fil, feil hash, feil dimensjon eller ugyldige UI-anker må appen beholde de gamle SHA-låste masterne. I nye godkjente scener vises **ingen båter** før egne, motivspesifikke vannankre er signert av produkteier. TrollActor er alltid et separat app-element og er aldri innmalt i bakgrunnene.

**Merk:** Kildenes originaloppløsning er lavere enn eksportene. Oppskalering skaper ikke ny naturdetalj, og en isolert visual godkjenning er ikke dokumentasjon på at tidligere låst fjellgeometri er pikselidentisk.

## Produkteiers godkjenning av nye visualiseringer 18.11.2026

**Produkteier har godkjent de to viste, UI-frie bildekandidatene som visuell retning for Hjem**, i stående og liggende iPad-format. Dette overstyrer ikke automatisk teknisk release-gate eller kravet om en faktisk enhetsskjerm.

Følgende originalgenereringer er bevart i den lokale leveransepakken `laria_grovanova_godkjente_bildekandidater.zip` (pakken må importeres separat; den er **ikke** i dette repositoriet):

| Variant | Originalgenerering | Størrelse | WebP-kandidat | SHA-256 for WebP |
| --- | --- | --- | --- | --- |
| Liggende 4:3 | `grovanova_landscape_visually_approved_SOURCE.png` | 1448×1086 | `grovanova_landscape_candidate.webp` (2048×1536) | `30eff16608cfd7` (prefix, fullt i pakkens `sha256.json`) |
| Stående 3:4 | `grovanova_portrait_visually_approved_SOURCE.png` | 1086×1448 | `grovanova_portrait_candidate.webp` (2048×2732) | `659500028828fb` (prefix, fullt i pakkens `sha256.json`) |

**Eksportforbehold:** Pikselmålene er skapt ved Lanczos-oppskalering. Det gjør ikke bildekilden mer detaljert enn originalgenereringen. Samsvar med den tidligere låste Grovanova-fjellsilhuetten er ikke dokumentert som identisk. Den nye visuelle godkjenningen må derfor også avklares mot eksisterende geografiske kunstlåser, ikke stilltiende tolkes som kildepikselgodkjenning.

**Status etter godkjenningen:** Appens manifest er fortsatt `awaiting-visual-approval` uten aktiv bildefil, SHA eller UI-ankre. Ingen kunstfil er pushet til GitHub; ingen bakgrunn er aktivert, og dette dokumentet alene endrer ingen funksjoner.

**Før porten kan åpnes:** Importer nøyaktig eksport med full SHA, kontroller motiv/kunstgodkjenning, tegn og juster separate logo/skilt/navigasjon/TrollActor, kjør eksakt-head Chromium/WebKit på stående iPad og dokumenter produktgodkjenning av faktisk appskjerm. **Liggende kunst har foreløpig ingen egen aktiveringsport i PR #255** og må integreres separat uten å røre SHA-låst original.
