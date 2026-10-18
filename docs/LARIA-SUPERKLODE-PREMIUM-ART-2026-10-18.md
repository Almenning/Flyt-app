# Læria SuperKlode – premium art-pass

Dato: 18. oktober 2026  
Gren: `feat/laria-superglobe-premium-art-20261018`  
Draft-PR: #184  
Base: SuperKlode v3 / PR #179

## Formål

Gjøre Oppdag til en geografisk korrekt, malt oppdagelsesverden i stedet for en flat kartflate med pålagte naturikoner. Enkel-globusen skal være urørt.

## Implementert

1. Oppdag bruker nå den georefererte terrengmodellen som primært uttrykk.
2. Brede separate biomestrøk er tatt ut av tegneløkken.
3. Store landbaserte fjell-, skog- og landmarkstempler er tatt ut av tegneløkken.
4. Terrengdekningen og biomeblandingen er økt, slik at natursonene bærer landflatene i stedet for kontinentfarge alene.
5. Bakgrunnen dempes bare når `data-discovery-globe="painted-atlas-v1"` er aktiv. Kloden får en roligere atmosfærisk ramme og sterkere dybdeskygge.
6. Statisk regresjonstest sperrer retur til de fjernede dekorstemplene.

## Verifisert

- `node --check laer-litt-mer/discovery-globe-phase1.js` bestått.
- `node tests/laria-discovery-globe-phase1-static.js` bestått.
- Enkel, kartgeometri, koordinater, landvalg, zoom, brukerdata og øvrige fag er ikke endret av denne grenen.

## Åpen kvalitetsport

Faktisk WebKit/Chromium-opptak må inspiseres på iPad liggende/stående og iPhone 390 × 844 før merge. Lokalt testmiljø mangler installert Playwright WebKit; installasjonen kunne ikke gjennomføres på grunn av miljøets systemrettigheter og nedlastingsbegrensning. Dette er ikke en godkjenning av visuelt resultat.

## Neste vurdering

Når reelle skjermbilder foreligger, vurderes:
- om terrenget er for svakt eller for tett på verden-, region- og nærzoom
- om kortet og valgt land får tydelig nok sammenheng
- om den personlige reven kan få en diskret, faktisk funksjon i oppdagelsesøyeblikket
- særskilt Norge, Alpene, Sahara, Amazonas og Japan.
