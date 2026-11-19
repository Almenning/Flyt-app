# Læria Hjem v16 – PRODUKTEIER-LÅS 19. november 2026

## Status: godkjent visuell komposisjon, implementert i PR #255

Produkteier godkjente uttrykkelig de **to siste konkrete Grovanova-bildene** i samtalen 19.11.2026 ved «Perfekt. Låse dette, og implementer dette.» Denne designlåsen gjelder kun Hjem på **iPad stående og liggende** og er nyere enn tidligere Grovanova-skisser. Tidligere v15-mastere og fotografier beholdes uendret som historisk kilde/fallback.

**Ikke generer nye bakgrunner eller nytolk landskapet på nytt.** Det er de eksakte PNG-filene og WebP-eksportene under `laer-litt-mer/assets/home-v16/` som er fasit for denne versjonen. Endringer i piksler, fjellform, fjord, kirke, farger eller tekst krever ny godkjenning.

## Visuell og funksjonell lås

- **Stående iPad:** 3:4-bilde, fullskjerm uten hvite sideflater.
- **Liggende iPad:** 4:3-bilde, fullskjerm uten pyntestriper.
- Logo og fire venstrestilte fagsskilt (Norsk, Matte, Engelsk, Geografi) beholdes slik de er malt i godkjent bilde.
- **Reisen** står som eget treskilt. Trykk åpner en tilgjengelig oversikt over eksisterende fagreiser.
- **Fortsett reisen** er et separat grønt skilt og viderefører appens eksisterende fortsett-flyt.
- **Nederste navigasjon:** Nøyaktig fire felt, Hjem, Utforsk, Samlebok, Mine troll. Ingen dupliserte knapper øverst.
- Trollet/TrollActor skal fortsatt være en egen, levende komponent. **Ingen malte trollfigurer** i de to bakgrunnene.
- Hilsen bruker live profilnavn, ikke teksten «Testbarn» som stod i den godkjente bildekandidaten.
- Barnes progresjon, faginnhold, HverdagsOss og resten av appen skal ikke endres.
- Eksisterende v15-illustrasjoner for iPhone og eldre Hjem skal være intakt fallback ved feil WebP, SHA-256, dekoding eller manifest.

## Eksakte låste filer

| Retning | Original PNG SHA-256 | App-WebP SHA-256 | Oppløsning |
| --- | --- | --- | --- |
| Liggende | `9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028` | `c39d374c8d9972a389d120ab15a1c81352158dc78a716fc7259fc31f95ce035e` | 2048×1536 |
| Stående | `ceb6331bb9ae45e3c6141dc74817262fc0f667ea0b0f82fcf85a60d99efbee55` | `c842e8e901300d1506594ef6e39929611743fc64ff1eb02254b8643059963421` | 2048×2732 |

Originalgenereringene hadde 1448×1086 og 1086×1448 piksler. WebP-eksportene er Lanczos-oppskalert og legger ikke til ekte nye malte detaljer. Fullstendig manifest: `assets/home-v16/laria-grovanova-v16-approved.json`.

## Arkitekturavvik som må være synlig i QA

**Disse godkjente bildene har synlig logo, fagsskilt, navn og navigasjonsgrafikk malt inn i bildepikslene.** Dette avviker fra den tidligere UI-frie kunstspesifikasjonen. Det kan ikke beskrives som «UI-fri master».

Produkteier har særskilt godkjent denne nye visuelle utgaven. Funksjonalitet realiseres derfor ved **reelle, tastaturtilgjengelige DOM-knapper** som ligger presist over de synlige, malte skiltflatene. De malte elementene er kun visuelle, og appen håndterer navigasjon, tilstand og tastaturfokus.

Den synlige «Hei, Testbarn!»-teksten dekkes av en egen live-hilsen med barnet sitt profilnavn. Regresjonstester må kontrollere at den ikke lekker gjennom når Hjem vises.

Båter fra PR #254 skal ikke kopieres til den nye bildekilden med gamle vannkoordinater.

## QA, aktivering og publisering

1. SHA-256 og dekodet WebP-størrelse må stemme.
2. Kontroller faktiske Chromium/WebKit-bilder ved 1024×1366, 820×1180, 1180×820 og 1024×768.
3. Kontrollér synlige og tappbare Norsk/Matte/Engelsk/Geografi; Reisen-modal; Fortsett reisen; Hjem/Utforsk/Samlebok/Mine troll; personlig hilsen; vokseninngang.
4. Verifiser gammel fallback ved feil SHA, samt uendret iPhone.
5. Kjør full Node/Læria-QA, smoke, WebKit/Chromium og iOS-build.
6. **Ingen merge eller publisering uten eksplisitt godkjenning** i henhold til AGENTS.md. Eiers visuelle godkjenning er dokumentert; kodens leveransekvalitet må fortsatt verifiseres.
7. Andre kunst-release-sperrer for Kinnaklova/Nordlysleiren og barnetest gjelder fortsatt og skal ikke omgås.

Dette dokumentet beskriver en tydelig etterfølgende produkteierbeslutning for akkurat Hjem v16, og er ikke tillatelse til tilsvarende kunstendringer ellers i Læria.
