# Læria Premium 2.0 – kontrollert kunsteksport (8. november 2026)

Status: IKKE GODKJENT. PR #243 forblir utkast. Ingen ny illustrasjon er aktivert.

## Formål og beslutningsgrunnlag
Følg Lærias formålsparagraf, de opprinnelige låste fjellene, tre godkjente levende TrollActor-karakterene, og Grovanova som premiumfasit. Det er kun innmalte UI-elementer som skal fjernes ved fremstilling av rene, separate motivvarianter. Fjell, kirke, fjord, hus og kyst kan ikke byttes.

Grovanova-art på nettbrett er 1127 x 681. Dagens trygge tilpasning til iPad 1366 x 1024 etterlater et unaturlig felt øverst. Den låste filen har også innmalte ekstra fagkort. En ekte 4:3-illustrasjonsvariant, med naturlig utvidet himmel og tilstrekkelig oppløsning, krever separat kunst- og skjermgodkjenning.

Kinnaklova er 1672 x 941 med tidligere innmalt stor tittel og spredte Words/Sentences/Reading-skilt. Den eldre godkjenningen gjaldt fjerning av feil troll, ikke den nye felles venstremenyen.

## Ny maskinell testløype
Verktøy: tools/laria_art/prepare_clean_art_previews.py
Actions: .github/workflows/laria-clean-art-previews.yml

Verktøyet verifiserer låste originalbytes og lager to lokale retusjeringsutkast, maskeguider, sammenligningsbilder og en rapport per motiv. Ingen andre bildepiksler enn de eksplisitt oppgitte UI-maskene får endres i de foreslåtte utkastene. Ingen originalfil, aktiv appfil, godkjenningsmanifest, progresjon eller release-status endres.

Automatisk inpainting er bare et forslag, IKKE ferdig kunst. Særlig store områder (kort og figurer på Grovanova) kan kreve manuell retusj. En generisk regenerert fjordillustrasjon er ikke tillatt, uansett hvor tiltalende den ser ut.

## Stopport før aktivering i Læria
- Godkjent ren Grovanova-variant uten øvre gradientstripe og innmalte ekstra menyer, med korrekt fjell og naturlig scenefyll.
- Godkjent ren Kinnaklova-variant uten gammelt UI, med eksakt samme fjellform, Kinn kyrkje og kystlandskap.
- Felles reelle DOM-skilt på venstre side, samme to stolper, trestruktur, Læria-logo og Hjem-knapp, ingen doble skilt.
- Kun valgt godkjent skogstroll som levende aktør.
- Faktiske skjermbilder av alle fem scener på iPad 1366 x 1024 i Chromium og WebKit; deretter iPad stående 1024 x 1366.
- Ingen merge eller publisering før eksplisitt visuell godkjenning og grønne regresjonstester.

Denne testløypen produserer bevis og skiller mekanisk retusj fra kreativ kunstgodkjenning. Den godkjenner aldri seg selv.

## Ny kildefast kvalitetsport for retusjerte masterbilder (9. november 2026)
Verktøy: `tools/laria_release/verify_clean_candidate.py`. Bruk med `--world kinnaklova --candidate <godkjenningskandidat.png>` eller `--world grovanova --candidate <iPad-4-til-3-kandidat.png> --offset-x <plassering> --offset-y <plassering>`. Verktøyet avviser endringer i alle beskyttede fjell-, kirke- og landskapspiksler utenfor de eksplisitte maskene. Grovanova må leveres som et ekte 4:3-landskapsbilde på minst 1366 × 1024; kilden kan plasseres uendret innenfor et naturlig utvidet lerret. Dette er **kun et mekanisk bevis for kildefidelitet**, ikke en kunstgodkjenning. Bilder med slør, repetisjoner, synlige skjøter, gamle skilt eller feil fjell skal fortsatt forkastes selv om masketesten blir grønn. Ingen automatisk godkjenning, produksjonsaktivering eller merge.
